# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding.

## Frontend (vitest + @testing-library/react)

```bash
cd frontend
npm test              # run all tests once
npm run test:watch    # watch mode
```

Tests live in `frontend/src/test/`. Components use jsdom + @testing-library/react.

## Backend (pytest)

```bash
cd backend
venv/bin/pytest tests/ -v
venv/bin/pytest tests/ -v --cov=. --cov-report=term-missing
```

Tests live in `backend/tests/`.

## Conventions

- Name test files `*.test.jsx` (frontend) or `test_*.py` (backend)
- Test what code DOES, not that it exists — never `expect(x).toBeDefined()`
- When fixing a bug: write a regression test first
- When adding a conditional: test both branches
- Never commit code that breaks existing tests
