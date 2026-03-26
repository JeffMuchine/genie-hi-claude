import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


def _init_firebase() -> None:
    if firebase_admin._apps:
        return

    google_creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if google_creds_path:
        logger.info("Initialising Firebase from GOOGLE_APPLICATION_CREDENTIALS file")
        cred = credentials.Certificate(google_creds_path)
    else:
        logger.info("Initialising Firebase from individual env vars")
        private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
        # Cloud env vars often escape newlines as literal \n
        private_key = private_key.replace("\\n", "\n")
        cert = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": private_key,
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": (
                f"https://www.googleapis.com/robot/v1/metadata/x509/"
                f"{os.getenv('FIREBASE_CLIENT_EMAIL', '').replace('@', '%40')}"
            ),
        }
        cred = credentials.Certificate(cert)

    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin SDK initialised successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_firebase()
    yield
    logger.info("Shutting down Genie-Hi backend")


app = FastAPI(title="Genie-Hi API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
from routers import jobs, resume, generate, download  # noqa: E402

app.include_router(jobs.router)
app.include_router(resume.router)
app.include_router(generate.router)
app.include_router(download.router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Global exception handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )
