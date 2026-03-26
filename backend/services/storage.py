import logging
import os
import shutil
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

RESUME_DIR = Path("/tmp/genie-hi-resumes")


def _user_dir(uid: str) -> Path:
    return RESUME_DIR / uid


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


# ── Public API ────────────────────────────────────────────────────────────────

def save_resume(uid: str, content: bytes, filename: str) -> str:
    """
    Persist resume bytes for the given uid.
    Any previously stored resume is replaced.
    Returns the absolute path of the saved file.
    """
    user_dir = _user_dir(uid)
    _ensure_dir(user_dir)

    # Remove any existing files for this user before saving the new one
    for existing in user_dir.iterdir():
        try:
            existing.unlink()
        except OSError:
            pass

    dest = user_dir / filename
    dest.write_bytes(content)
    logger.info("Saved resume for uid=%s → %s (%d bytes)", uid, dest, len(content))
    return str(dest)


def get_resume(uid: str) -> Optional[Tuple[bytes, str]]:
    """
    Return (content_bytes, filename) for the uid's current resume, or None.
    """
    user_dir = _user_dir(uid)
    if not user_dir.exists():
        return None

    files = [f for f in user_dir.iterdir() if f.is_file()]
    if not files:
        return None

    # Take the most-recently-modified file (should only ever be one)
    latest = max(files, key=lambda f: f.stat().st_mtime)
    return latest.read_bytes(), latest.name


def resume_exists(uid: str) -> bool:
    """Return True if the user has an uploaded resume."""
    user_dir = _user_dir(uid)
    if not user_dir.exists():
        return False
    return any(user_dir.iterdir())


def delete_resume(uid: str) -> None:
    """Remove all stored resume files for the given uid."""
    user_dir = _user_dir(uid)
    if user_dir.exists():
        shutil.rmtree(user_dir, ignore_errors=True)
        logger.info("Deleted resume directory for uid=%s", uid)
