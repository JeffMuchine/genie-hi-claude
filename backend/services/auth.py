import logging
import os
from typing import Optional

from fastapi import Header, HTTPException
from firebase_admin import auth as firebase_auth

_DEV_MODE = os.getenv("DEV_MODE", "").lower() == "true"
_DEV_UID = "dev-user-001"

logger = logging.getLogger(__name__)


async def get_current_uid(authorization: str = Header(default=None)) -> str:
    """
    Validate Firebase Bearer token and return the uid.
    Raises HTTP 401 on any failure.
    In DEV_MODE, bypasses validation and returns a fixed test uid.
    """
    if _DEV_MODE:
        return _DEV_UID

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        decoded = firebase_auth.verify_id_token(token)
        uid: str = decoded["uid"]
        logger.debug("Authenticated uid=%s", uid)
        return uid
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token has been revoked")
    except firebase_auth.InvalidIdTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Could not verify token")


async def get_optional_uid(
    authorization: Optional[str] = Header(default=None),
) -> Optional[str]:
    """
    Like get_current_uid but returns None instead of raising when auth is absent.
    Still raises 401 if a malformed/expired token is provided.
    """
    if authorization is None:
        return None

    try:
        return await get_current_uid(authorization=authorization)
    except HTTPException:
        return None
