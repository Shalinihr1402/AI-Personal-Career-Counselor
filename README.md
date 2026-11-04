AI Personal Career Counselor

An AI-powered career counseling and guidance platform designed to help students, fresh graduates, and working professionals discover suitable career paths and build structured roadmaps toward their professional goals.

The platform combines psychometric profiling, resume intelligence, personal identity discovery, education classification, career knowledge retrieval, and contextual AI reasoning to provide personalized career guidance.

Rather than relying on generic career quizzes, the system considers a user's education, interests, skills, experience, strengths, values, preferences, and constraints.

Vision & Objectives

Most career guidance platforms provide generic recommendations based on limited questionnaires. Students need a system that understands their individual backgrounds and helps them answer two important questions:

- Career Counselor: Which career paths align with my interests, qualifications, skills, and personal values?
- Career Coach: What skills should I develop, and what practical steps should I take to become job-ready?

The long-term goal is to build an adaptive career counseling platform that evaluates evidence, identifies skill gaps, recommends realistic career pathways, and creates personalized learning roadmaps.

---

Tech Stack

Frontend

- React 19 – Component-based user interface.
- Vite 8 – Frontend development and build tooling.
- TypeScript 6 – Static typing.
- Tailwind CSS v4 – Responsive styling.
- Framer Motion – UI animations.
- React Router v7 – Client-side routing.
- Lucide React – Icons.
- Supabase JavaScript Client – Authentication and database integration.

Backend

- Python 3.12 – Core backend development.
- FastAPI – REST API framework.
- Uvicorn – ASGI server.
- Pydantic v2 – Data validation and serialization.
- PyMuPDF – PDF resume text extraction.
- Sentence Transformers – Semantic embeddings.
- NumPy – Vector similarity calculations.
- Groq API – LLM-powered resume extraction, career reranking, and conversational reasoning.
- python-dotenv – Environment configuration.

Database and Authentication

- Supabase PostgreSQL – Persistent application data.
- Supabase Auth – Email/password and Google OAuth authentication.
- Row Level Security (RLS) – User-specific database access control.
- JSONB – Flexible storage of profile and assessment information.

AI and Machine Learning

Technology| Purpose
Groq API| LLM reasoning and structured JSON generation
GPT-OSS 120B| Resume extraction, career reranking, and counselor responses
Sentence Transformers| Semantic career matching
all-MiniLM-L6-v2| Career text embeddings
RIASEC| Holland personality and interest profiling
Python rule-based engine| Deterministic scoring and eligibility checks
O*NET| Occupational information and career dataset

---

Architecture Overview

flowchart TD
    U["Student / Professional"]

    subgraph Frontend["Frontend - React + TypeScript"]
        UI["Landing Page, Onboarding, Assessment"]
        PROFILE["Profile & Know Me"]
        CAREER["Career Explorer & Details"]
        DASH["Dashboard & Roadmap"]
    end

    subgraph Backend["Backend - FastAPI"]
        API["REST API"]
        RESUME["Resume Extraction"]
        EDU["Indian Education Classifier"]
        RIASEC["RIASEC Scoring"]
        CKB["Career Knowledge Base"]
        MATCH["Hybrid Career Matcher"]
        EVIDENCE["Future: Evidence Engine"]
    end

    subgraph AI["AI Services"]
        EMB["Sentence Transformers"]
        GROQ["Groq API - GPT-OSS 120B"]
    end

    subgraph DB["Supabase"]
        AUTH["Authentication"]
        PG[("PostgreSQL")]
    end

    U --> UI
    UI --> PROFILE
    UI --> CAREER
    UI --> DASH

    UI --> API
    API --> RESUME
    API --> EDU
    API --> RIASEC
    API --> CKB
    API --> MATCH

    MATCH --> EMB
    MATCH --> GROQ
    CKB --> MATCH
    EVIDENCE -. "Planned integration" .-> MATCH

    PROFILE <--> AUTH
    AUTH <--> PG
    API <--> PG

---

Feature Status

Feature| Status| Description
Marketing Landing Page| ✅ Completed| Landing page and product introduction
Authentication| ✅ Completed| Supabase email/password and Google OAuth
Student Onboarding| ✅ Completed| Six-step onboarding covering goals, education, interests, skills, preferences, and resume
Resume Parsing| ✅ Completed| PyMuPDF extraction and Groq-powered structured parsing
RIASEC Assessment| ✅ Completed| 24-question Holland assessment with deterministic scoring
Know Me Profiling| ✅ Completed| Personal values, strengths, work preferences, identity, and deal-breakers
Career Matching| ✅ Existing| Semantic, RIASEC, and skill-based matching with Groq reranking
Career Detail Pages| ✅ Existing| Career descriptions, salary information, daily routines, pros/cons, and learning paths
Career Explorer| ✅ Existing| Search and browse career records
Career Comparison| ✅ Existing| Compare multiple career options
Career Goal Confirmation| ✅ Existing| Save active career goals in Supabase
Roadmap & Timetable| ✅ Existing| Weekly task scheduling and progress tracking
Skill-Gap Analysis| ✅ Existing| Identifies missing competencies against career requirements
Indian Education Classifier| ✅ Completed| Classifies Indian qualifications and unfamiliar courses
Career Knowledge Base| 🟡 Implemented; verification pending| Structured career records, Indian pathways, competencies, and eligibility checks
Personalized Adaptive Assessment| 🔜 Upcoming| Dynamically generated questions based on individual profiles and answers
Evidence & Competency Engine| 🔜 Upcoming| Evaluates answers and builds competency evidence
Adaptive Hybrid Recommendation| 🔜 Upcoming| Integrates assessment evidence into existing matching
Personalized Career Report| 🔜 Upcoming| Detailed explanations, skill gaps, and alternative pathways
Real-world Validation| 🔜 Upcoming| Pilot testing with students and career experts
AI Career Coach Chatbot| 🚧 In Development| Context-aware career coaching

---

Existing Career Recommendation Architecture

The existing recommendation system uses a hybrid approach combining machine learning, psychometric information, and AI reasoning.

Stage 1: Local Python Career Matching

The existing "backend/matcher.py" uses:

- Sentence Transformers ("all-MiniLM-L6-v2")
- RIASEC similarity
- Direct skill overlap
- Deal-breaker penalties

The reported scoring formula is:

match_score = (
    0.50 * semantic_similarity +
    0.30 * riasec_alignment +
    0.20 * skill_overlap -
    dealbreaker_penalty
)

The local matching engine retrieves up to 15 candidate careers.

Stage 2: Groq AI Reranking

Groq receives the shortlisted candidates and relevant user profile information.

It helps:

- Rerank candidate careers.
- Generate personalized explanations.
- Identify potential challenges and watch-outs.
- Explain required skills.
- Describe typical responsibilities.
- Return up to five career recommendations.

The system restricts AI reranking to the supplied candidate list rather than allowing it to invent career titles.

Fallback Mechanism

When Groq is unavailable, the existing deterministic matching and fallback logic can continue providing career recommendations.

Important: The planned assessment evidence integration will extend this architecture rather than replace the existing matcher.

---

Phase 4: Advanced Career Intelligence

The advanced development roadmap focuses on building a personalized, evidence-based career counseling system.

Phase 4.1 — Indian Education Classifier

<badge color="success">Completed</badge>

Developed an education classification layer to understand different Indian academic qualifications.

Supported examples:

- SSLC / Class 10
- PUC / Class 12
- ITI
- Diploma
- BCA, B.Com, B.Tech, B.Sc
- MBBS, B.Pharm, LLB
- MCA, MBA, M.Sc
- Unfamiliar qualifications requiring clarification

Reported testing: 19/19 tests passed.

Phase 4.2 — Career Knowledge Base

<badge color="warning">Implemented — Final verification pending</badge>

Developed a structured career knowledge layer that combines existing O*NET occupational information with curated Indian career pathways.

Reported implementation:

- 1,016 existing O*NET career records preserved.
- 10 curated Indian benchmark career pathways.
- 1,026 total Career Knowledge Base records.
- Reusable competency registry.
- Education-to-career pathway mapping.
- Professional eligibility and licensing checks.
- Career retrieval by qualification and competency.
- Stage-aware eligibility checking.

Main implementation files:

backend/
├── career_knowledge_base.py
├── data/
│   ├── onet_careers.json
│   └── career_knowledge_base.json
└── test_career_knowledge_base.py

supabase/
└── migrations/
    └── 0002_phase4_career_knowledge.sql

Reported testing:

- Career Knowledge Base: 20/20 tests passed.
- Education Classifier regression: 19/19 tests passed.

The generated career projections and regulatory mappings still require independent source and data-quality verification. Supabase migration deployment and record seeding must also be confirmed.

Phase 4.3 — Personalized Adaptive Assessment

<badge>Upcoming</badge>

Build an adaptive assessment engine that generates questions according to each user's individual profile.

The assessment should consider:

- Education and academic background.
- Interests and motivation.
- Technical and non-technical skills.
- Resume and project experience.
- Personal values and strengths.
- Career preferences.
- Previous assessment answers.
- Missing evidence and uncertainty.

Planned capabilities:

- Groq-powered personalized question generation.
- One-question-at-a-time assessment.
- Adaptive follow-up questions.
- Answer evaluation.
- Dynamic question selection.
- Session persistence.
- Configurable stopping criteria.

The goal is to avoid giving every student the same static questionnaire.

Phase 4.4 — Evidence and Competency Engine

<badge>Upcoming</badge>

Build an evidence-based engine to evaluate user answers and identify competencies.

It should distinguish:

- Self-reported skills.
- Demonstrated skills.
- Project-based evidence.
- Academic evidence.
- Work experience.
- Unverified claims.
- Missing competencies.

Python will enforce scoring rules and structured evaluation, while Groq can assist with interpreting open-ended answers using explicit evaluation rubrics.

Phase 4.5 — Hybrid Recommendation Integration

<badge>Upcoming</badge>

Integrate validated assessment evidence into the existing career matcher.

The system should combine:

- Semantic similarity.
- RIASEC alignment.
- Skill matching.
- Career knowledge and eligibility.
- Demonstrated competencies.
- User preferences and constraints.
- Assessment uncertainty.

The integration must avoid double-counting existing evidence or introducing arbitrary scoring weights.

Phase 4.6 — Personalized Career Report

<badge>Upcoming</badge>

Generate an understandable career counseling report containing:

- Recommended career paths.
- Reasons behind each recommendation.
- Supporting and conflicting evidence.
- Education and eligibility requirements.
- Existing strengths.
- Missing competencies.
- Alternative career pathways.
- Suggested projects and certifications.
- Personalized learning roadmap.

The report should communicate uncertainty rather than claim to identify one guaranteed perfect career.

Phase 4.7 — Real-world Validation

<badge>Upcoming</badge>

Validate the system through:

- Student pilot testing.
- Career counselor reviews.
- Recommendation quality evaluation.
- Assessment consistency checks.
- Eligibility accuracy checks.
- Before-and-after recommendation comparisons.
- User feedback and usability testing.

Do not claim scientific accuracy without appropriate evaluation.

---

Project Structure

AI-Personal-Career-Counselor/
│
├── backend/
│   ├── main.py
│   ├── careers.py
│   ├── matcher.py
│   ├── riasec.py
│   ├── education_classifier.py
│   ├── career_knowledge_base.py
│   ├── resume_parser.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── data/
│   │   ├── onet_careers.json
│   │   ├── career_embeddings.npy
│   │   └── career_knowledge_base.json
│   │
│   ├── test_education_classifier.py
│   └── test_career_knowledge_base.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ProfileContext.tsx
│   │   │
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── data/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── supabase/
│   └── migrations/
│       ├── 0001_phase1_counselor.sql
│       └── 0002_phase4_career_knowledge.sql
│
├── docs/
│   └── BLUEPRINT.md
│
├── README.md
└── .gitignore

This structure reflects the reported project modules. Verify actual filenames and migration deployment against the repository before release.

---

REST API Reference

Health Check

"GET /"

Returns backend operational status and AI availability.

Resume Extraction

"POST /api/upload-resume"

Accepts a PDF resume and extracts structured information.

Example response:

{
  "name": "Alex Johnson",
  "education": ["B.Tech Computer Science"],
  "skills": ["Python", "FastAPI", "PostgreSQL"],
  "experience": ["Software Development Intern"]
}

Psychometric Assessment

"GET /api/assessment/questions"

Returns the existing 24 Holland/RIASEC questions.

"POST /api/assessment/score"

Calculates deterministic RIASEC scores and the Holland code.

Career Matching

"POST /api/career-match"

Accepts user profile information, interests, RIASEC scores, and resume skills.

Returns personalized career recommendations.

Career Explorer

"GET /api/careers"

Returns the existing career catalog.

"GET /api/careers/{slug}"

Returns detailed information about a career.

Additional Career Knowledge Base Module

The new Python module provides programmatic retrieval and eligibility methods:

get_career_knowledge(career_id)

search_careers_by_qualification(
    qualification_name,
    domain=None
)

search_careers_by_competencies(
    competency_ids,
    min_overlap=1
)

check_career_eligibility(
    career_id,
    user_education
)

These are reported Python module methods, not confirmed public HTTP endpoints.

---

Database Schema & Security

The project uses Supabase PostgreSQL.

Existing tables

"profiles"

Stores student profile information, education, interests, resume information, and personal identity data.

"assessments"

Stores assessment answers, RIASEC scores, Holland codes, and assessment results.

"career_goals"

Stores confirmed career commitments and active career goals.

Career Knowledge Base

The Phase 4.2 migration introduces:

"career_knowledge"

Stores structured career records, including career identity, domain, SOC code, and JSONB career information.

The migration is available at:

supabase/migrations/0002_phase4_career_knowledge.sql

Migration execution, record seeding, and RLS behavior must be verified in the target Supabase project.

Security

- Supabase Auth manages user sessions.
- RLS protects user-specific profile and assessment data.
- API keys remain in backend environment variables.
- Database access should follow least-privilege principles.

---

Setup & Installation

Prerequisites

Tool| Recommended Version
Python| 3.12
Node.js| 20+
npm| 10+
Supabase| Cloud project
Groq API Key| Optional for AI features

1. Clone the repository

git clone YOUR_REPOSITORY_URL
cd AI-Personal-Career-Counselor

2. Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Apply the required migration files in order.
4. Verify tables, indexes, and RLS policies.
5. Configure authentication providers.

3. Backend Setup

cd backend

python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

python -m pip install -r requirements.txt

Create "backend/.env":

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

4. Frontend Setup

cd frontend

npm install

Create "frontend/.env":

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_BASE=http://localhost:8000

---

Running the Application

Terminal 1 — Backend

cd backend

# Activate virtual environment first
uvicorn main:app --reload --port 8000

Backend:

"http://localhost:8000"

Swagger documentation:

"http://localhost:8000/docs"

Terminal 2 — Frontend

cd frontend

npm run dev

Frontend:

"http://localhost:5173"

---

Testing

Run the Phase 4 education classifier tests:

cd backend

python -m unittest test_education_classifier.py

Run the Career Knowledge Base tests:

python -m unittest test_career_knowledge_base.py

Also run the existing matcher, API, and frontend build tests before merging changes.

Frontend checks:

cd frontend

npm run lint
npm run build

---

Project Development Roadmap

Phase| Module| Status
4.1| Indian Education Classifier| Completed
4.2| Career Knowledge Base| Implemented; verification pending
4.3| Personalized Adaptive Assessment| Upcoming
4.4| Evidence and Competency Engine| Upcoming
4.5| Hybrid Recommendation Integration| Upcoming
4.6| Personalized Career Report| Upcoming
4.7| Real-world Validation| Upcoming

---

Notes for Contributors

- Inspect the existing architecture before introducing new services or dependencies.
- Preserve the existing hybrid career-matching engine.
- Do not duplicate existing career records.
- Use structured career data as the source of truth.
- Never fabricate education eligibility, professional licensing, or salary information.
- Keep Groq API keys on the backend.
- Preserve existing Supabase profile and assessment compatibility.
- Use deterministic Python logic for objective calculations.
- Use LLMs for language understanding and explanations, not as unquestioned sources of truth.
- Write automated tests for new functionality.
- Never commit ".env", virtual environments, or "node_modules".

---

License

This project is licensed under the MIT License. See "LICENSE" (LICENSE) for details.

---

AI Personal Career Counselor — Understand Yourself. Discover Your Career. Build Your Future.
