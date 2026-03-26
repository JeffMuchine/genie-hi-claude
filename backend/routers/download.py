import io
import logging
import re
import zipfile
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from services.auth import get_current_uid
from routers.generate import sessions, extract_text_from_resume
from services.storage import get_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/download", tags=["download"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _sanitize(name: str) -> str:
    """Keep only letters, numbers, and hyphens; collapse runs."""
    name = re.sub(r"[^A-Za-z0-9]+", "-", name)
    return name.strip("-")[:64]


def _get_session_for_uid(session_id: str, uid: str) -> Dict[str, Any]:
    session = sessions.get(session_id)
    if session is None or session.get("uid") != uid:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def _get_job_result(session: Dict[str, Any], job_id: str) -> Dict[str, Any]:
    result = session["results"].get(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found in session")
    return result


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/{session_id}")
async def download_all(
    session_id: str,
    uid: str = Depends(get_current_uid),
):
    """
    Build and return a zip archive containing the tailored resume and cover letter
    for every job in the session.
    """
    session = _get_session_for_uid(session_id, uid)

    date_prefix = datetime.now(timezone.utc).strftime("%Y%m%d")
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for job in session.get("jobs", []):
            job_id = job.get("id", "unknown")
            result = session["results"].get(job_id, {})

            title = _sanitize(job.get("title", "role"))
            company = _sanitize(job.get("company", "company"))
            folder = f"{date_prefix}-{title}-{company}"

            resume_text = result.get("resume") or ""
            cover_text = result.get("cover_letter") or ""

            uid_tag = _sanitize(uid[:8])
            resume_name = f"{uid_tag}_{company}_{title}_resume.txt"
            cover_name = f"{uid_tag}_{company}_{title}_cover_letter.txt"

            zf.writestr(f"{folder}/{resume_name}", resume_text)
            zf.writestr(f"{folder}/{cover_name}", cover_text)

    zip_buffer.seek(0)
    archive_name = f"genie-hi-{session_id[:8]}.zip"

    logger.info("uid=%s downloading zip for session=%s", uid, session_id)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{archive_name}"'},
    )


@router.get("/{session_id}/{job_id}/resume")
async def download_resume(
    session_id: str,
    job_id: str,
    uid: str = Depends(get_current_uid),
):
    """Download the tailored resume for a single job as plain text."""
    session = _get_session_for_uid(session_id, uid)
    result = _get_job_result(session, job_id)

    resume_text = result.get("resume") or ""
    if not resume_text:
        raise HTTPException(status_code=404, detail="Resume not yet generated")

    # Derive a nice filename
    job = next((j for j in session.get("jobs", []) if j.get("id") == job_id), {})
    title = _sanitize(job.get("title", "resume"))
    company = _sanitize(job.get("company", "company"))
    filename = f"{_sanitize(uid[:8])}_{company}_{title}_resume.txt"

    return StreamingResponse(
        io.BytesIO(resume_text.encode("utf-8")),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{session_id}/{job_id}/cover-letter")
async def download_cover_letter(
    session_id: str,
    job_id: str,
    uid: str = Depends(get_current_uid),
):
    """Download the cover letter for a single job as plain text."""
    session = _get_session_for_uid(session_id, uid)
    result = _get_job_result(session, job_id)

    cover_text = result.get("cover_letter") or ""
    if not cover_text:
        raise HTTPException(status_code=404, detail="Cover letter not yet generated")

    job = next((j for j in session.get("jobs", []) if j.get("id") == job_id), {})
    title = _sanitize(job.get("title", "role"))
    company = _sanitize(job.get("company", "company"))
    filename = f"{_sanitize(uid[:8])}_{company}_{title}_cover_letter.txt"

    return StreamingResponse(
        io.BytesIO(cover_text.encode("utf-8")),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
