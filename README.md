# Genie-Hi

**AI job application co-pilot. Paste up to 5 job descriptions. Get 5 tailored resumes + cover letters in under 2 minutes. You review, you submit.**

Most AI job tools spray the same resume everywhere. ATS detects it. Hiring managers spot it. [62% of employers reject AI-generated resumes without personalization](https://www.resume-now.com/job-resources/careers/ai-applicant-report). Genie-Hi generates documents tailored to each role — you stay in control of what gets sent.

![Genie-Hi demo](docs/demo.gif)

---

## How it works

| Step | What you do | What Genie-Hi does |
|------|-------------|-------------------|
| **1. Insert Jobs** | Paste job links or descriptions (up to 5) | Parses each JD — extracts role, company, requirements |
| **2. Review** | Open each resume and cover letter | Generates tailored docs in parallel via Claude API |
| **3. Download** | Download individual files or full ZIP | Packages resume + cover letter per job, named by company |

All 5 jobs generate simultaneously. Empty state to 5 download-ready packages in under 2 minutes.

---

## Stack

- **Frontend**: React 18 + Vite
- **Backend**: FastAPI (Python 3.11)
- **Auth**: Firebase Authentication (email/password)
- **LLM**: Anthropic Claude API (haiku for parsing, sonnet for generation)
- **Storage**: Local filesystem

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- [Anthropic API key](https://console.anthropic.com/)
- Firebase project with Email/Password auth enabled ([setup guide](https://firebase.google.com/docs/auth/web/password-auth))

### Install

```bash
git clone https://github.com/JeffMuchine/genie-hi-claude.git
cd genie-hi-claude

# Frontend
npm --prefix frontend install

# Backend
cd backend && python3 -m venv venv && venv/bin/pip install -r requirements.txt && cd ..
```

### Configure

**`backend/.env`** (copy from `backend/.env.example`):
```env
ANTHROPIC_API_KEY=sk-ant-...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=...
```

**`frontend/.env.local`** (copy from `frontend/.env.example`):
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Run

```bash
# Terminal 1 — backend
cd backend && venv/bin/uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
npm --prefix frontend run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
genie-hi-claude/
├── frontend/src/
│   ├── App.jsx              # Router + AuthContext
│   ├── firebase.js          # Firebase SDK init
│   ├── api.js               # Axios client
│   ├── pages/               # Login, Register, MainApp
│   └── components/          # Step1InsertJobs, Step2Review, Step3Download, ...
└── backend/
    ├── main.py              # FastAPI entry point
    ├── routers/             # jobs, resume, generate, download
    └── services/            # auth, claude_service, storage
```

---

## Contributing

Contributions welcome. Good first issues:

- **Dark mode** — add `prefers-color-scheme` CSS + toggle
- **Export to DOCX** — add `python-docx` to backend, new download format
- **Keyboard shortcut** — Ctrl/Cmd+Enter triggers Generate
- **Job description character counter** — show remaining chars in each input
- **Clear all button** — one-click reset of all job inputs

Run tests before submitting a PR:

```bash
# Frontend
npm --prefix frontend test

# Backend
cd backend && venv/bin/pytest
```

---

## Notes

- Sessions are in-memory — restarting the backend clears active generation sessions
- Resume files persist in `/tmp/genie-hi-resumes/{uid}/`
- Generation runs 5 jobs in parallel — Claude API rate limits apply per your tier
