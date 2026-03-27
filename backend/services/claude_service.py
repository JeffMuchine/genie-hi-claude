import asyncio
import json
import logging
import re
import ssl
from typing import Optional

import aiohttp
import certifi
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)

PARSE_MODEL = "claude-haiku-4-5-20251001"
GENERATE_MODEL = "claude-sonnet-4-6-20251101"

_client: Optional[AsyncAnthropic] = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic()  # reads ANTHROPIC_API_KEY from env
    return _client


# ── URL fetching ──────────────────────────────────────────────────────────────

def _is_url(text: str) -> bool:
    return bool(re.match(r"^https?://", text.strip()))


async def _fetch_page_text(url: str) -> str:
    """Fetch HTML from a URL and strip tags to plain text."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; GenieHi/1.0; +https://genie-hi.app)"
        )
    }
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    connector = aiohttp.TCPConnector(ssl=ssl_ctx)
    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=20)) as resp:
            resp.raise_for_status()
            html = await resp.text(errors="replace")

    # Remove script/style blocks, then strip all tags
    html = re.sub(r"<(script|style)[^>]*>.*?</(script|style)>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", html)
    # Collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()[:12_000]  # cap at ~12k chars to stay within context


# ── Retry decorator ───────────────────────────────────────────────────────────

async def _with_retries(coro_fn, label: str, retries: int = 3):
    delays = [1, 2, 4]
    last_exc: Exception = RuntimeError("unknown")
    for attempt in range(retries):
        try:
            return await coro_fn()
        except Exception as exc:
            last_exc = exc
            # Never retry on authentication or permission errors — retrying won't help
            err_str = str(exc).lower()
            if any(x in err_str for x in ("401", "authentication_error", "invalid x-api-key", "permission")):
                logger.error("[%s] auth error — not retrying: %s", label, exc)
                break
            if attempt < retries - 1:
                wait = delays[attempt]
                logger.warning(
                    "[%s] attempt %d/%d failed: %s — retrying in %ds",
                    label, attempt + 1, retries, exc, wait,
                )
                await asyncio.sleep(wait)
            else:
                logger.error("[%s] all %d attempts failed: %s", label, retries, exc)
    raise last_exc


# ── parse_job ─────────────────────────────────────────────────────────────────

PARSE_SYSTEM = """\
You are a job description parser. Given a job posting (plain text or HTML-stripped text),
extract the key information and return ONLY valid JSON with this exact structure:
{
  "title": "<job title>",
  "company": "<company name>",
  "requirements": ["<requirement 1>", "..."],
  "responsibilities": ["<responsibility 1>", "..."],
  "skills": ["<skill 1>", "..."]
}
Do not include any text outside the JSON object. If a field is unknown use an empty string or empty array.
"""


async def parse_job(input_text: str) -> dict:
    """
    Parse a job description from raw text or a URL.
    Returns a dict with keys: title, company, requirements, responsibilities, skills.
    Raises ValueError after 3 failed attempts.
    """
    if _is_url(input_text.strip()):
        logger.info("Fetching job URL: %s", input_text.strip())
        try:
            page_text = await _fetch_page_text(input_text.strip())
        except Exception as exc:
            raise ValueError(f"Could not fetch URL: {exc}") from exc
        content = page_text
    else:
        content = input_text

    async def _call():
        client = _get_client()
        msg = await client.messages.create(
            model=PARSE_MODEL,
            max_tokens=1024,
            system=PARSE_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        raw = msg.content[0].text.strip()
        # Extract JSON even if the model adds surrounding markdown
        json_match = re.search(r"\{.*\}", raw, re.S)
        if not json_match:
            raise ValueError(f"No JSON found in parse response: {raw[:200]}")
        return json.loads(json_match.group())

    try:
        result = await _with_retries(_call, label="parse_job")
    except Exception as exc:
        raise ValueError(f"parse_job failed: {exc}") from exc

    # Ensure expected keys exist
    result.setdefault("title", "")
    result.setdefault("company", "")
    result.setdefault("requirements", [])
    result.setdefault("responsibilities", [])
    result.setdefault("skills", [])
    return result


# ── generate_resume ───────────────────────────────────────────────────────────

RESUME_SYSTEM = """\
You are an expert resume writer. Tailor the resume for this specific job. \
Preserve the candidate's real experience — enhance phrasing, reorder bullet points \
to match job priorities, add relevant keywords. \
Return the complete tailored resume as plain text with section headers in ALL CAPS.
"""


async def generate_resume(original_resume: str, job: dict) -> str:
    """
    Generate a tailored resume for the given job.
    Returns the tailored resume as a plain-text string.
    Retries up to 3 times with exponential backoff.
    """
    user_content = (
        f"JOB TITLE: {job.get('title', '')}\n"
        f"COMPANY: {job.get('company', '')}\n"
        f"REQUIREMENTS:\n" + "\n".join(f"- {r}" for r in job.get("requirements", [])) + "\n"
        f"RESPONSIBILITIES:\n" + "\n".join(f"- {r}" for r in job.get("responsibilities", [])) + "\n"
        f"SKILLS SOUGHT:\n" + "\n".join(f"- {s}" for s in job.get("skills", [])) + "\n\n"
        f"ORIGINAL RESUME:\n{original_resume}"
    )

    async def _call():
        client = _get_client()
        msg = await client.messages.create(
            model=GENERATE_MODEL,
            max_tokens=4096,
            system=RESUME_SYSTEM,
            messages=[{"role": "user", "content": user_content}],
        )
        return msg.content[0].text.strip()

    try:
        return await _with_retries(_call, label="generate_resume")
    except Exception as exc:
        raise ValueError(f"generate_resume failed: {exc}") from exc


# ── generate_cover_letter ─────────────────────────────────────────────────────

async def generate_cover_letter(
    original_resume: str,
    job: dict,
    tone: str = "formal email",
    length: str = "100-150",
    highlight: str = "",
) -> str:
    """
    Generate a cover letter for the given job.
    Returns the cover letter as a plain-text string.
    Retries up to 3 times with exponential backoff.
    """
    highlight_instruction = f"Emphasize: {highlight}" if highlight else ""
    system_prompt = (
        f"You are an expert cover letter writer. Write a personalized cover letter for this job application. "
        f"Tone: {tone}. Length: {length} words. {highlight_instruction}"
    ).strip()

    user_content = (
        f"JOB TITLE: {job.get('title', '')}\n"
        f"COMPANY: {job.get('company', '')}\n"
        f"REQUIREMENTS:\n" + "\n".join(f"- {r}" for r in job.get("requirements", [])) + "\n"
        f"RESPONSIBILITIES:\n" + "\n".join(f"- {r}" for r in job.get("responsibilities", [])) + "\n"
        f"SKILLS SOUGHT:\n" + "\n".join(f"- {s}" for s in job.get("skills", [])) + "\n\n"
        f"CANDIDATE RESUME:\n{original_resume}"
    )

    async def _call():
        client = _get_client()
        msg = await client.messages.create(
            model=GENERATE_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )
        return msg.content[0].text.strip()

    try:
        return await _with_retries(_call, label="generate_cover_letter")
    except Exception as exc:
        raise ValueError(f"generate_cover_letter failed: {exc}") from exc
