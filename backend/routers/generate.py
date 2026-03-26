import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel

from services.auth import get_current_uid
from services.claude_service import generate_cover_letter, generate_resume
from services.storage import get_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["generate"])

# ── In-memory session store ───────────────────────────────────────────────────
# session_id → session dict
sessions: Dict[str, Dict[str, Any]] = {}


# ── Schemas ───────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    job_ids: List[str]
    jobs: List[Dict[str, Any]]  # each job should have jd_text + parsed fields


class RegenerateCLRequest(BaseModel):
    job_id: str
    session_id: str
    tone: str = "formal email"
    length: str = "100-150"
    highlight: str = ""
    current_text: Optional[str] = None


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_text_from_resume(content: bytes, filename: str = "") -> str:
    """
    Best-effort plain-text extraction from resume bytes.
    PDF/DOC/DOCX are treated as UTF-8 with error replacement for now;
    callers that need richer extraction can swap this out.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext in ("txt", "json", ""):
        return content.decode("utf-8", errors="replace")

    if ext == "pdf":
        # Attempt lightweight text extraction: look for text streams in the PDF bytes.
        # Falls back to raw decode if nothing useful found.
        try:
            from io import BytesIO
            import re

            raw = content.decode("latin-1", errors="replace")
            # Extract text between BT … ET markers (basic PDF text blocks)
            chunks = re.findall(r"BT(.*?)ET", raw, re.S)
            pieces = []
            for chunk in chunks:
                # Grab string literals inside parentheses
                texts = re.findall(r"\(([^)]*)\)", chunk)
                pieces.extend(texts)
            extracted = " ".join(pieces).strip()
            if len(extracted) > 100:
                return extracted
        except Exception:
            pass
        # Fallback
        return content.decode("utf-8", errors="replace")

    if ext in ("doc", "docx"):
        try:
            import zipfile
            from io import BytesIO
            import re

            with zipfile.ZipFile(BytesIO(content)) as z:
                xml = z.read("word/document.xml").decode("utf-8", errors="replace")
            # Strip XML tags
            text = re.sub(r"<[^>]+>", " ", xml)
            text = re.sub(r"\s+", " ", text).strip()
            return text
        except Exception:
            pass
        return content.decode("utf-8", errors="replace")

    return content.decode("utf-8", errors="replace")


# ── Background generation ─────────────────────────────────────────────────────

async def generate_single_job(
    session_id: str,
    uid: str,
    job: Dict[str, Any],
    resume_text: str,
) -> None:
    job_id = job.get("id", str(uuid.uuid4()))
    session = sessions.get(session_id)
    if session is None:
        return

    session["results"].setdefault(
        job_id,
        {"resume": None, "cover_letter": None, "status": "generating", "error": None},
    )
    session["results"][job_id]["status"] = "generating"

    try:
        logger.info("session=%s job_id=%s: generating resume + cover letter", session_id, job_id)
        resume_task = asyncio.create_task(generate_resume(resume_text, job))
        cover_task = asyncio.create_task(generate_cover_letter(resume_text, job))

        tailored_resume, cover_letter = await asyncio.gather(
            resume_task, cover_task, return_exceptions=True
        )

        errors = []
        if isinstance(tailored_resume, Exception):
            logger.error("session=%s job_id=%s resume error: %s", session_id, job_id, tailored_resume)
            errors.append(f"Resume: {tailored_resume}")
            tailored_resume = None

        if isinstance(cover_letter, Exception):
            logger.error("session=%s job_id=%s cover letter error: %s", session_id, job_id, cover_letter)
            errors.append(f"Cover letter: {cover_letter}")
            cover_letter = None

        session["results"][job_id].update(
            {
                "resume": tailored_resume,
                "cover_letter": cover_letter,
                "status": "failed" if errors else "ready",
                "error": "; ".join(errors) if errors else None,
            }
        )
    except Exception as exc:
        logger.exception("session=%s job_id=%s unexpected error: %s", session_id, job_id, exc)
        session["results"][job_id].update(
            {"status": "failed", "error": str(exc)}
        )


async def run_generation(
    session_id: str,
    uid: str,
    jobs: List[Dict[str, Any]],
    resume_bytes: bytes,
    resume_filename: str,
) -> None:
    session = sessions.get(session_id)
    if session is None:
        return

    session["status"] = "generating"
    resume_text = extract_text_from_resume(resume_bytes, resume_filename)

    tasks = [
        generate_single_job(session_id, uid, job, resume_text) for job in jobs
    ]
    await asyncio.gather(*tasks, return_exceptions=True)

    session["status"] = "complete"
    logger.info("session=%s generation complete", session_id)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("")
async def start_generation(
    body: GenerateRequest,
    background_tasks: BackgroundTasks,
    uid: str = Depends(get_current_uid),
):
    resume_result = get_resume(uid)
    if resume_result is None:
        raise HTTPException(status_code=400, detail="No resume uploaded")

    resume_bytes, resume_filename = resume_result

    session_id = str(uuid.uuid4())

    # Pre-populate results dict so callers can poll immediately
    results: Dict[str, Any] = {}
    for job in body.jobs:
        jid = job.get("id", "unknown")
        results[jid] = {
            "resume": None,
            "cover_letter": None,
            "status": "pending",
            "error": None,
        }

    sessions[session_id] = {
        "uid": uid,
        "jobs": body.jobs,
        "status": "pending",
        "results": results,
        "created_at": datetime.now(timezone.utc),
    }

    background_tasks.add_task(
        run_generation, session_id, uid, body.jobs, resume_bytes, resume_filename
    )

    logger.info("uid=%s started session=%s with %d jobs", uid, session_id, len(body.jobs))
    return {"session_id": session_id, "status": "generating"}


@router.post("/cover-letter/regenerate")
async def regenerate_cover_letter(
    body: RegenerateCLRequest,
    uid: str = Depends(get_current_uid),
):
    session = sessions.get(body.session_id)
    if session is None or session["uid"] != uid:
        raise HTTPException(status_code=404, detail="Session not found")

    # Find the job from session
    job = next((j for j in session["jobs"] if j.get("id") == body.job_id), None)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found in session")

    resume_result = get_resume(uid)
    if resume_result is None:
        raise HTTPException(status_code=400, detail="No resume found")

    resume_bytes, resume_filename = resume_result
    resume_text = extract_text_from_resume(resume_bytes, resume_filename)

    cover_letter = await generate_cover_letter(
        resume_text, job,
        tone=body.tone,
        length=body.length,
        highlight=body.highlight,
    )

    # Update session result
    if body.job_id in session["results"]:
        session["results"][body.job_id]["cover_letter"] = cover_letter

    return {"cover_letter": cover_letter}


@router.get("/{session_id}/status")
async def get_status(
    session_id: str,
    uid: str = Depends(get_current_uid),
):
    session = sessions.get(session_id)
    if session is None or session["uid"] != uid:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "status": session["status"],
        "created_at": session["created_at"].isoformat(),
        "results": session["results"],
    }
