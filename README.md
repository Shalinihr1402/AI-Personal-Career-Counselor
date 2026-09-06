# AI Personal Career Counselor

An AI-powered career guidance platform for students. Upload a resume, get structured
profile data extracted by AI, and (on the roadmap) receive personalized career
recommendations, skill-gap analysis, and a learning plan.

- **Backend:** FastAPI (Python), PyMuPDF for PDF parsing, Google Gemini for extraction
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Backend](#1-backend)
  - [2. Frontend](#2-frontend)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [API reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Notes for contributors](#notes-for-contributors)

---

## Features

| Area | Status | Description |
|------|--------|-------------|
| Landing page | ✅ | Marketing home page with hero, "how it works", features, testimonials |
| Authentication | ✅ | Email/password + Google sign-in via Supabase Auth; sessions, password reset, protected routes |
| Resume upload | ✅ | Onboarding page (login-protected) uploads a PDF to the backend |
| Resume parsing | ✅ | Backend extracts `name`, `education`, `skills`, `experience` (AI, with mock fallback) |
| Career-interest assessment | ✅ | RIASEC/Holland questionnaire (`/assessment`) with deterministic scoring |
| Career recommendations | ✅ | AI-ranked from the RIASEC profile against a fixed taxonomy, rule-based fallback |
| Personalized roadmap & weekly timetable | ✅ | Curated per-role roadmaps (`/roadmap`), editable schedule, today's tasks (`/today`) |
| Skill-gap analysis | 🚧 | Precise current-skills-vs-target-role diff — planned |
| Persistent accounts / database | 🚧 | Supabase / Postgres env vars are present but not yet wired |

---

## Tech stack

**Backend**

- [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- [PyMuPDF](https://pymupdf.readthedocs.io/) (`fitz`) — PDF text extraction
- [google-generativeai](https://pypi.org/project/google-generativeai/) — Gemini 1.5 Flash
- `python-multipart` — required for file uploads
- `python-dotenv` — loads `.env`

**Frontend**

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [react-router-dom](https://reactrouter.com/)
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) — auth & sessions
- [framer-motion](https://www.framer.com/motion/) — animations
- [lucide-react](https://lucide.dev/) — icons
- [oxlint](https://oxc.rs/) — linting

---

## Project structure

```
AI-Personal-Career-Counselor/
├── backend/
│   ├── main.py            # FastAPI app: GET / and POST /api/upload-resume
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # Secrets (NOT committed) — see .env.example
│   └── venv/              # Local virtualenv (NOT committed)
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Routes + <AuthProvider>
│   │   ├── main.tsx       # Entry point
│   │   ├── index.css      # Tailwind + font imports
│   │   ├── lib/
│   │   │   └── supabase.ts        # Supabase client (reads VITE_SUPABASE_* env)
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # useAuth(): user/session + sign in/up/out
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx # Redirects to /login when signed out
│   │   └── pages/
│   │       ├── Home.tsx
│   │       ├── Login.tsx          # Email/password + Google + forgot password
│   │       ├── Signup.tsx         # Email/password + Google + terms
│   │       └── Onboarding.tsx     # Protected; calls http://localhost:8000/api/upload-resume
│   ├── public/            # Static images (counselor*.jpg, favicon.svg)
│   ├── .env.example       # Copy to frontend/.env
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Prerequisites

| Tool | Version used | Notes |
|------|--------------|-------|
| Python | 3.11+ | 3.11 or 3.12 both work |
| Node.js | 20+ | Vite 8 requires a recent Node |
| npm | 10+ | Ships with Node |

Also needed:

- A **Supabase project** (free tier) for login/signup — [supabase.com](https://supabase.com/).
  Without it the UI still renders but authentication is disabled.
- Optional: a **Google Gemini API key** ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).
  Without it, resume parsing returns realistic **mock data** so the app still runs end to end.

---

## Setup

Clone the repo, then set up each part.

### 1. Backend

```bash
cd backend
python -m venv venv
```

Activate the virtualenv:

- **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
- **Windows (cmd):** `venv\Scripts\activate.bat`
- **macOS / Linux:** `source venv/bin/activate`

Install dependencies **into the venv**:

```bash
python -m pip install -r requirements.txt
```

> If `pip` / `uvicorn` are "not recognized", the venv isn't active. Either activate it
> (above) or call tools explicitly, e.g. `venv\Scripts\python.exe -m uvicorn ...`.

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Environment variables

### Backend — `backend/.env`

Copy from `backend/.env.example`:

```env
# Optional — enables real AI resume parsing. Without it, mock data is returned.
GEMINI_API_KEY=your_google_gemini_api_key

# Planned — not yet wired into the app
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

> To actually call Gemini you must also enable it in `backend/main.py` by uncommenting
> `genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))`. Until then the endpoint
> always falls back to mock data.

### Frontend — `frontend/.env`

Copy from `frontend/.env.example`. Required for login/signup to work:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Get both from your Supabase project → **Project Settings → API**. Only variables
prefixed with `VITE_` are exposed to the browser; the anon key is designed to be
public (protect data with Row Level Security).

> If these are missing the app still loads, auth calls fail with a clear message,
> and `/onboarding` is left open so you can work on the UI.

The frontend currently hardcodes the API base URL as `http://localhost:8000` in
`src/pages/Onboarding.tsx`. Change it there if your backend runs elsewhere.

---

## Running the app

Open **two terminals**.

**Terminal 1 — backend** (from `backend/`, venv active):

```bash
uvicorn main:app --reload --port 8000
```

- API root: <http://localhost:8000/>
- Interactive docs (Swagger): <http://localhost:8000/docs>

**Terminal 2 — frontend** (from `frontend/`):

```bash
npm run dev
```

- App: <http://localhost:5173/>

### Frontend scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

---

## Authentication

Auth is handled entirely on the frontend by **Supabase Auth** — no backend auth code.

**Flow**

- `src/lib/supabase.ts` creates the client from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- `src/context/AuthContext.tsx` wraps the app, tracks the session via
  `supabase.auth.onAuthStateChange`, and exposes `useAuth()`:
  `{ user, session, loading, signIn, signUp, signInWithGoogle, resetPassword, signOut }`.
- `src/components/ProtectedRoute.tsx` redirects to `/login` when signed out and
  remembers the target page so login can send the user back.
- `/onboarding` is wrapped in `<ProtectedRoute>`. Add future dashboard routes the same way.

**One-time Supabase setup**

1. Create a project at [supabase.com](https://supabase.com/).
2. Put the URL + anon key in `frontend/.env` (see above).
3. **Email/password:** Authentication → Providers → Email is on by default. For local
   testing you can disable "Confirm email" so new signups can log in immediately.
4. **Google:** Authentication → Providers → Google — add your Google OAuth client ID
   and secret, then add `http://localhost:5173` to Authentication → URL Configuration
   → Redirect URLs.

**Manual test**

1. `npm run dev`, open <http://localhost:5173/signup>, create an account.
2. Confirm the email if confirmation is on, then log in at `/login`.
3. You should land on `/onboarding` with a "Signed in as …" bar and a **Sign out** button.
4. Visiting `/onboarding` while signed out should bounce you to `/login`.

---

## API reference

### `GET /`

Health check.

```json
{ "message": "Welcome to AI Personal Career Counselor API" }
```

### `POST /api/upload-resume`

Upload a PDF resume for parsing.

- **Content-Type:** `multipart/form-data`
- **Field:** `file` — a `.pdf` file (other types return `400`)

**Response `200`:**

```json
{
  "name": "Alex Johnson",
  "education": ["B.S. Computer Science, University of Technology"],
  "skills": ["Python", "React", "TypeScript", "FastAPI", "SQL", "Git"],
  "experience": ["Software Engineering Intern at TechCorp", "Freelance Web Developer"]
}
```

**Behavior:**

1. Rejects non-PDF uploads with `400`.
2. If PyMuPDF or the AI client is unavailable → returns mock data.
3. Otherwise extracts text with PyMuPDF and asks Gemini to return structured JSON.
4. If the AI call fails (e.g. missing key) → returns a fallback object.

Example with `curl`:

```bash
curl -F "file=@/path/to/resume.pdf" http://localhost:8000/api/upload-resume
```

### `GET /api/assessment/questions`

Returns the 24 RIASEC items, the rating scale, and dimension labels for the
career-interest assessment.

### `POST /api/assessment/score`

Body: `{ "answers": { "r1": 2, "i3": 1, ... } }` (item id → 0/1/2).
Returns `{ "scores": { "R": 0-100, ... }, "code": "IAR" }` — deterministic, no AI.

### `POST /api/career-match`

Body: `{ riasec_scores, code, interests[], education, work_style{}, resume_skills[] }`.
Builds a structured profile and asks Gemini to rank 5 careers **from a fixed
taxonomy** (`backend/careers.py`), returning each with a fit score and reasoning.
If Gemini is unavailable it falls back to a rule-based RIASEC matcher, so the
feature works with no API key. Response: `{ "source": "ai" | "rule", "matches": [...] }`.

> The AI path activates only when `GEMINI_API_KEY` is set in `backend/.env`
> (the backend now loads `.env` and calls `genai.configure` automatically).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `'uvicorn' is not recognized` | venv not activated | Activate the venv, or run `venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000` |
| `Activate.ps1` does nothing in cmd | It's a PowerShell script | Use `venv\Scripts\activate.bat` in cmd |
| `Form data requires "python-multipart"` | Deps installed into the wrong Python | Run `venv\Scripts\python.exe -m pip install -r requirements.txt` |
| Frontend upload fails / CORS error | Backend not running on port 8000 | Start the backend first; it allows all origins by default |
| Resume parse / career-match returns mock or `"source": "rule"` | `GEMINI_API_KEY` not set in `backend/.env` | Add the key and restart uvicorn — `.env` is loaded and `genai.configure` runs automatically now |
| Assessment page shows "Could not load the assessment" | Backend not running on `localhost:8000` | Start the backend first |
| Login says "Authentication is not configured" | `frontend/.env` missing or not prefixed `VITE_` | Create `frontend/.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, restart `npm run dev` |
| Signup works but login fails with "Email not confirmed" | Email confirmation is on in Supabase | Confirm via the emailed link, or disable "Confirm email" in Supabase for local testing |
| Google button redirects then errors | Redirect URL not allowlisted | Add `http://localhost:5173` in Supabase → Authentication → URL Configuration |
| Env change not picked up | Vite reads `.env` at startup | Stop and restart `npm run dev` |
| `git push` fails with HTTP 408 | `backend/venv/` was committed (~45 MiB) | See [Notes for contributors](#notes-for-contributors) |

---

## Notes for contributors

- **Never commit `backend/venv/`, `frontend/node_modules/`, `__pycache__/`, or `.env`.**
  A root `.gitignore` is included for this. If a virtualenv was already committed:

  ```bash
  git rm -r --cached backend/venv backend/__pycache__
  git commit -m "Remove committed virtualenv"
  ```

- After changing Python dependencies, refresh `requirements.txt`:

  ```bash
  pip freeze > requirements.txt
  ```

- The `frontend/` directory is currently its own git repository. Consider converting it
  to a proper submodule or merging it into this repo so the whole project is versioned
  together.
