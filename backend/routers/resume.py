import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from services.auth import get_current_uid
from services.storage import delete_resume, get_resume, resume_exists, save_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resume", tags=["resume"])

ALLOWED_EXTENSIONS = {"pdf", "txt", "doc", "docx", "json"}
MAX_SIZE_MB = 20

# In-memory store for resume version metadata
# { uid: { session_id: { job_id: version_data } } }
_version_store: dict = {}


# ── Schemas ───────────────────────────────────────────────────────────────────

class VersionBody(BaseModel):
    job_id: str
    session_id: str
    content: str
    version: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    uid: str = Depends(get_current_uid),
):
    ext = _extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)

    if size_mb > MAX_SIZE_MB:
        logger.warning(
            "uid=%s uploaded file %.2f MB (> %d MB limit) — accepting anyway",
            uid, size_mb, MAX_SIZE_MB,
        )

    filename = file.filename or f"resume.{ext}"
    save_resume(uid, content, filename)
    logger.info("uid=%s uploaded resume '%s' (%.2f MB)", uid, filename, size_mb)

    return {
        "success": True,
        "filename": filename,
        "size_mb": round(size_mb, 3),
    }


@router.get("")
async def get_resume_info(uid: str = Depends(get_current_uid)):
    result = get_resume(uid)
    if result is None:
        raise HTTPException(status_code=404, detail="No resume uploaded")

    content, filename = result
    size_mb = len(content) / (1024 * 1024)

    return {
        "exists": True,
        "filename": filename,
        "size_mb": round(size_mb, 3),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/versions")
async def store_version(
    body: VersionBody,
    uid: str = Depends(get_current_uid),
):
    _version_store.setdefault(uid, {})
    _version_store[uid].setdefault(body.session_id, {})
    _version_store[uid][body.session_id][body.job_id] = {
        "content": body.content,
        "version": body.version,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    logger.info(
        "uid=%s stored version %d for job_id=%s session=%s",
        uid, body.version, body.job_id, body.session_id,
    )
    return {"success": True, "version": body.version}
