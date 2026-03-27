"""Tests for /jobs/parse endpoint."""
import os
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DEV_MODE", "true")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

MOCK_PARSED = {
    "title": "Software Engineer",
    "company": "Acme Corp",
    "requirements": ["Python", "FastAPI"],
    "responsibilities": ["Build APIs"],
    "skills": ["Python"],
}


def test_parse_job_empty_input_returns_422():
    resp = client.post("/jobs/parse", json={"input": ""})
    assert resp.status_code == 422


def test_parse_job_short_text_returns_422():
    resp = client.post("/jobs/parse", json={"input": "too short"})
    assert resp.status_code == 422
    assert "50 characters" in resp.json()["detail"]


def test_parse_job_url_accepted():
    with patch("routers.jobs.parse_job", new=AsyncMock(return_value=MOCK_PARSED)):
        resp = client.post("/jobs/parse", json={"input": "https://jobs.example.com/123"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Software Engineer"
    assert data["company"] == "Acme Corp"
    assert "id" in data
    assert data["status"] == "pending"


def test_parse_job_long_text_accepted():
    long_jd = "We are looking for a talented software engineer " * 5
    with patch("routers.jobs.parse_job", new=AsyncMock(return_value=MOCK_PARSED)):
        resp = client.post("/jobs/parse", json={"input": long_jd})
    assert resp.status_code == 200


def test_parse_job_returns_jd_text():
    jd = "https://jobs.example.com/456"
    with patch("routers.jobs.parse_job", new=AsyncMock(return_value=MOCK_PARSED)):
        resp = client.post("/jobs/parse", json={"input": jd})
    assert resp.json()["jd_text"] == jd
