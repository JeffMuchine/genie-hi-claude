# Genie-Hi

AI-powered job application co-pilot. Upload one resume, paste up to 5 job links or descriptions, get tailored resumes and cover letters for all of them — ready to download in under 2 minutes.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: FastAPI (Python 3.11)
- **Auth**: Firebase Authentication (email/password)
- **LLM**: Anthropic Claude API (haiku for parsing, sonnet for generation)
- **Storage**: Local filesystem (`/tmp/genie-hi-resumes/`)

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.11+
- Firebase project with Email/Password auth enabled
- Anthropic API key

### Install

```bash
# Frontend
npm --prefix frontend install

# Backend
cd backend && python3 -m venv venv && venv/bin/pip install -r requirements.txt && cd ..
```

### Configure

**`backend/.env`** (copy from `.env.example`):
```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-adminsdk.json
# or individual Firebase vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.
```

**`frontend/.env.local`**:
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
# Terminal 1
cd backend && venv/bin/uvicorn main:app --reload --port 8000

# Terminal 2
npm --prefix frontend run dev
```

Open http://localhost:5173

## How It Works

1. Register / log in
2. **Step 1**: Paste up to 5 job links or job descriptions → upload your resume → click Generate
3. **Step 2**: Review tailored resumes (accept/reject sections) and cover letters (tone/length/highlight)
4. **Step 3**: Download individual files or full zip

Generation runs in parallel — all 5 jobs generate simultaneously via Claude API.

## Project Structure

```
genie-hi-claude/
├── frontend/src/
│   ├── App.jsx              # Router + AuthContext
│   ├── firebase.js          # Firebase SDK init
│   ├── api.js               # Axios client
│   ├── pages/               # Login, Register, MainApp
│   └── components/          # All UI components
└── backend/
    ├── main.py              # FastAPI app entry
    ├── routers/             # jobs, resume, generate, download
    └── services/            # auth, claude_service, storage
```

## Notes

- Sessions are in-memory; restarting the backend clears active generation sessions
- Resume files persist across restarts in `/tmp/genie-hi-resumes/{uid}/`
- If the Claude API rate-limits you, the retry logic waits 1h before trying again (as per user config)
