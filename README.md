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
| Auth screens | ✅ (UI only) | Login / Signup pages; Google button is a placeholder |
| Resume upload | ✅ | Onboarding page uploads a PDF to the backend |
| Resume parsing | ✅ | Backend extracts `name`, `education`, `skills`, `experience` (AI, with mock fallback) |
| Career recommendations | 🚧 | Planned |
| Skill-gap analysis & roadmap | 🚧 | Planned |
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
│   │   ├── App.tsx        # Routes
│   │   ├── main.tsx       # Entry point
│   │   ├── index.css      # Tailwind + font imports
│   │   └── pages/
│   │       ├── Home.tsx
│   │       ├── Login.tsx
│   │       ├── Signup.tsx
│   │       └── Onboarding.tsx   # Calls http://localhost:8000/api/upload-resume
│   ├── public/            # Static images (counselor*.jpg, favicon.svg)
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

Optional: a **Google Gemini API key** ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).
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

Create `backend/.env` (copy from `backend/.env.example`):

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

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `'uvicorn' is not recognized` | venv not activated | Activate the venv, or run `venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000` |
| `Activate.ps1` does nothing in cmd | It's a PowerShell script | Use `venv\Scripts\activate.bat` in cmd |
| `Form data requires "python-multipart"` | Deps installed into the wrong Python | Run `venv\Scripts\python.exe -m pip install -r requirements.txt` |
| Frontend upload fails / CORS error | Backend not running on port 8000 | Start the backend first; it allows all origins by default |
| Resume parse returns "Demo User" / mock | No `GEMINI_API_KEY` or `genai.configure` still commented out | Set the key and enable it in `main.py` |
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
