import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.auth import get_current_uid
from services.claude_service import parse_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ParseRequest(BaseModel):
    input: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/parse")
async def parse_job_route(
    body: ParseRequest,
    uid: str = Depends(get_current_uid),
):
    """
    Parse a job description from raw text or a URL.
    Returns structured job data plus a uuid job id.
    """
    raw = body.input.strip()

    if not raw:
        raise HTTPException(status_code=422, detail="Input must not be empty")

    # If it's not a URL, require at least 50 characters of text
    is_url = raw.lower().startswith("http://") or raw.lower().startswith("https://")
    if not is_url and len(raw) < 50:
        raise HTTPException(
            status_code=422,
            detail="Job description text must be at least 50 characters",
        )

    logger.info("uid=%s parsing job input (url=%s, len=%d)", uid, is_url, len(raw))

    try:
        parsed = await parse_job(raw)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    job_id = str(uuid.uuid4())

    return {
        "id": job_id,
        "title": parsed.get("title", ""),
        "company": parsed.get("company", ""),
        "requirements": parsed.get("requirements", []),
        "responsibilities": parsed.get("responsibilities", []),
        "skills": parsed.get("skills", []),
        "status": "pending",
        "jd_text": raw,
    }
