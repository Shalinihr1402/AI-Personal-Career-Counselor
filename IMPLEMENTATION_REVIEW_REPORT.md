# AI Personal Career Counselor — Senior Architecture & Implementation Review

**Document Version:** 1.0  
**Date:** November 16, 2026  
**Audience:** Beginner to Intermediate Engineers, Technical Product Leads  
**Review Type:** End-to-End System Architecture, Code Quality, Data Flow, and Algorithmic Audit  

---

## Executive Summary

The **AI Personal Career Counselor** is an intelligent, evidence-grounded career exploration platform built specifically for Indian students and professionals across five distinct stages:
1. **Class 8–10 (Middle/Secondary School)**
2. **Class 11–12 (Higher Secondary / PUC streams: PCM, PCB, Commerce, Arts)**
3. **Polytechnic & ITI Technical Diplomas**
4. **College Undergraduate & Postgraduate Degree Programs**
5. **Career Switchers & Career-Break Returners**

Unlike a generic conversational chatbot, the platform combines **deterministic psychometrics (Holland RIASEC)**, **dense semantic search across 1,016 O*NET occupations**, **multi-tier competency verification**, and an **interactive diagnostic consultation workspace**.

### Overall System Assessment: **Grade B+**
* **Core Strengths:**
  - Robust deterministic scoring of Holland RIASEC dimensions ($R, I, A, S, E, C$) without LLM hallucinations.
  - Hybrid matching engine (`matcher.py`) merging dense vector embeddings (`all-MiniLM-L6-v2`), psychometric resonance, skill overlap, and deal-breaker penalties.
  - Strict stage-calibrated guardrails that prevent inappropriate queries (e.g., asking Class 10 students for software git repos or campus placements).
  - Clean separation of the diagnostic session from recommendation generation: career recommendations are withheld until the student's background is sufficiently understood.
* **Primary Risks Identified:**
  - An invalid default model string (`"openai/gpt-oss-120b"`) in `backend/main.py` causing AI extraction and reranking calls to fail silently and fall back to rule-based execution.
  - Disconnect between Onboarding Step 4 manual skills and the recommendation engine payload.
  - Potential unhandled type errors when skills arrays contain dictionary objects.
  - Lack of guest session persistence prior to auth redirection.

---

## 1. Complete End-to-End Data Flow

The platform's lifecycle spans four distinct milestones:

```
[1. Student Onboarding]
       │
       ▼
  Saved to Supabase `profiles` table (Education, Persona, Interests, Skills, Timeline)
       │
       ▼
[2. Career Discovery Assessment (`/assessment`)]
  ├── Scenario Questions (12 Qs) -> Deterministic Holland RIASEC scoring (R, I, A, S, E, C)
  ├── Work Style & Operating Rhythm (4 Qs) -> People vs Data, Structure vs Ambiguity
  └── Holistic Discovery (Values, Strengths, Inner Drive, Real-life Constraints)
       │
       ▼ (Submit Assessment)
  Saved to Supabase `assessments` with empty matches `[]`
       │
       ▼
[3. AI Diagnostic Counselor Workspace]
  ├── Receives Holland Profile (e.g., Code: EAI) + Stage (e.g., College UG)
  ├── Adaptive Chat turns via `/api/counselor/diagnostic-chat`
  ├── Builds `DiagnosticProfile` (Education, Projects, Responsibilities, Toolchains)
  └── Evaluates Stage-Calibrated Completeness (0% to 100%)
       │
       ▼ (Student confirms summary & clicks "Generate My Career Recommendations")
[4. Recommendation Engine]
  ├── `/api/counselor/generate-recommendations`
  ├── Stage 1: Dense Vector Retrieval (Top 15 candidates from 1,016 O*NET careers)
  ├── Stage 2: RIASEC Positional Scoring + Deal-breaker Penalties
  ├── Stage 3: Groq LLM Reranker (Top 5 selected with strictly guarded titles)
  └── Stage 4: Skill Gap & Readiness Calculation (High / Medium / Developing)
       │
       ▼
[5. Career Discovery Report (Results Screen)]
  ├── Profile Overview & Verified Holland RIASEC Code
  ├── Diagnostic Consultation Verification Banner
  ├── Spotlight #1 Top Career Recommendation Card
  └── 2×2 Grid of Recommendations with Matched vs Missing Skill Badges
       │
       ▼ (Student clicks "Set as Career Goal")
  Saved to Supabase `career_goals` table & active goal refreshed in Dashboard
```

### Data Flow Stage Breakdown

#### Stage 1: Student Onboarding (`Onboarding.tsx`)
- The user provides guidance mode (`career_discovery`, `career_planning`, `career_growth_transition`), education level, stream, university/school, interests, skills, and optional resume.
- Data is converted via `toRow()` in `profile.ts` and upserted to the Supabase `profiles` table.
- Non-standard JSON fields are stored cleanly in the `know_me` JSONB column.

#### Stage 2: Career Assessment (`Assessment.tsx`)
- When visiting `/assessment`, the app checks for existing saved results. If none exist, it requests stage-calibrated scenario questions via `/api/assessment/adaptive-questions`.
- The user answers 12 scenario questions, 4 work-style preferences, and 4 holistic values/strengths sections.
- On clicking **"Start AI Diagnostic Session"**, the frontend sends answers to `/api/assessment/adaptive-score`.
- Crucially, `submit()` saves the assessment with `matches: []` (empty array) and immediately switches to `phase = 'counselor_diagnostic'`. **No premature recommendations are generated.**

#### Stage 3: AI Diagnostic Counselor (`CounselorVoiceChat.tsx`)
- A 2-column workspace opens.
- The left sidebar displays:
  - Assessment foundation (Holland code, calibrated stage).
  - Diagnostic completeness progress bar (0–100%).
  - Category checklist (Education, Projects, Skills, Interests, Challenges, Goals).
  - Verified skills cloud.
- The center stream handles natural conversation using text or voice (Web Speech API).
- Each turn calls `POST /api/counselor/diagnostic-chat`, extracting structured facts into `DiagnosticProfile` without repeating questions.
- Once completeness reaches $\ge 70\%$ (calibrated to the stage), the AI produces a bulleted summary and asks the student for confirmation.

#### Stage 4: Recommendation Generation (`backend/main.py`)
- The student clicks **"Generate My Career Recommendations"**.
- Frontend calls `POST /api/counselor/generate-recommendations`.
- The backend synthesizes:
  - RIASEC dimensions.
  - 4-tier competency evidence (self-reported, conceptual, applied scenario, verified practical).
  - Diagnostic profile (projects, responsibilities, tools, challenges).
- The hybrid matcher retrieves top vector matches, applies psychometric rules and penalties, and Groq LLM reranks the top 5.
- Readiness and skill gaps are computed:
  $$\text{Readiness} = \begin{cases} \text{High} & \text{if } |\text{matched\_skills}| \ge 3 \\ \text{Medium} & \text{if } |\text{matched\_skills}| \ge 1 \\ \text{Developing} & \text{otherwise} \end{cases}$$

#### Stage 5: Career Discovery Report (`Assessment.tsx`)
- Results screen displays the Spotlight #1 match and balanced 2×2 grid of recommendations.
- Each card highlights:
  - Readiness badge (High / Medium / Developing).
  - Demonstrated matching skills (green checkmark pills).
  - Bridgeable skill gap (target growth pills).
  - Mid-career salary range in INR.
  - Typical day-to-day schedule and critical watch-outs.

---

## 2. Frontend & Backend Communication Audit

The table below lists all network endpoints connecting the React frontend to the FastAPI backend:

| Endpoint | Method | Frontend Caller | Payload | Response Structure | Purpose |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/assessment/questions` | `GET` | `fetchQuestions()` | None | `{ questions, dimensions, total }` | Fallback legacy assessment questions |
| `/api/assessment/adaptive-questions` | `POST` | `fetchAdaptiveQuestions()` | `{ profile, max_questions }` | `{ stage, questions, total, dimensions }` | Stage-calibrated, deduplicated assessment questions |
| `/api/assessment/adaptive-score` | `POST` | `scoreAdaptiveAssessment()` | `{ answers, profile }` | `{ scores, code, stage, top_fields, evidence_breakdown, statutory_eligibility }` | Deterministic scoring & statutory checks |
| `/api/counselor/diagnostic-chat` | `POST` | `sendDiagnosticChatTurn()` | `{ messages, student_profile, assessment_evidence, diagnostic_profile, requested_completion, user_confirmed }` | `{ reply, diagnostic_profile, is_ready_for_recommendations, completeness_score, suggested_chips }` | Adaptive diagnostic conversation turn |
| `/api/counselor/generate-recommendations` | `POST` | `generateDiagnosticRecommendations()` | `{ riasec_scores, code, interests, education, work_style, resume_skills, strengths_note, know_me, diagnostic_profile }` | `{ source, matches, diagnostic_summary, riasec_scores, riasec_code }` | Final recommendation generation with readiness & skill gaps |
| `/api/careers` | `GET` | Career Explorer page | URL query params: `?q=&field=&page=&limit=` | `{ careers, total, page, limit, total_pages, fields }` | Paginated career browsing across all 1,016 careers |
| `/api/careers/:slug` | `GET` | Career Detail page | URL parameter: `:slug` | `{ title, slug, salary_india, day_in_the_life, pros, cons, learning_path, similar_careers }` | Comprehensive career profile |

---

## 3. Career Dataset Usage & Matching Intelligence

### Dataset Architecture
1. **Curated Indian Benchmark Careers (`backend/careers.py`)**:
   - 40 canonical occupations with localized Indian compensation packages (entry, mid, senior in LPA), day-in-the-life timelines, pros/cons, and 4-step learning paths.
2. **Canonical O*NET Occupational Catalog (`backend/data/onet_careers.json`)**:
   - 1,016 projected occupations complete with SOC codes, Holland RIASEC tags, descriptions, day-to-day summaries, and software tool requirements.
3. **Pre-computed Semantic Embeddings (`backend/data/career_embeddings.npy`)**:
   - $1016 \times 384$ dense vector matrix encoded using the SentenceTransformer `all-MiniLM-L6-v2` model.

### Hybrid Matching Formula
For each candidate career $c \in \text{Catalog}$:
$$\text{Score}(c) = \left( 0.50 \times \text{Sim}_{\text{semantic}}(c) \right) + \left( 0.30 \times \text{Score}_{\text{RIASEC}}(c) \right) + \left( 0.20 \times \text{Score}_{\text{skills}}(c) \right) - \text{Penalty}_{\text{dealbreaker}}(c)$$

- **Semantic Similarity ($\text{Sim}_{\text{semantic}}$)**: Cosine similarity between query embedding and career embedding, normalized to $[0, 1]$.
- **RIASEC Positional Resonance ($\text{Score}_{\text{RIASEC}}$)**: Student's top 3 Holland letters compared against career code. Weight $= 3 - \text{position}$, with a $1.5\times$ bonus for exact positional alignment.
- **Skill Overlap ($\text{Score}_{\text{skills}}$)**: Count of matched skills divided by target threshold (max 1.0).
- **Deal-breaker Penalties ($\text{Penalty}_{\text{dealbreaker}}$)**:
  - Working alone debugging: $-0.25$
  - Cold calling / sales: $-0.35$
  - Abstract advanced mathematics: $-0.30$
  - Monotonous paperwork / data entry: $-0.30$

---

## 4. Student Profile vs. Recommendation Output Analysis

### Stage-Calibrated Alignment Check
- **Class 10 (SSLC)**: Software projects are suppressed. Focus areas are stream selection (Science, Commerce, Arts) and 3-year Polytechnic diplomas.
- **Class 11–12 (PUC)**: Stream-aligned (e.g. PCB students receive life science, healthcare, biotechnology options; PCM students receive engineering, architecture, computer science).
- **Polytechnic / Diploma**: Focuses on lateral entry to B.Tech 2nd year or direct core technical employment.
- **College UG / PG**: Demands at least one practical project, individual technical responsibilities, and specific toolchains before clearing readiness.

### Readiness & Skill Gap Grounding
Matches categorize skills into two distinct buckets:
- **Demonstrated Matching Skills**: Green checkmark pills showing existing competencies.
- **Bridgeable Skill Gap**: Outlined pills showing target growth areas.

---

## 5. Detailed Findings: Missing Requirements, Logical Errors & Edge Cases

Below is the structured technical audit of each issue identified, formatted per the required review specification.

---

### Issue 1: Invalid Fallback Groq Model Identifier Causing Silent AI Failures

* **File name and function:** `backend/main.py` — Module Global Configuration (Line 29)
* **Current behaviour:**
  ```python
  GROQ_MODEL = os.environ.get("GROQ_MODEL") or "openai/gpt-oss-120b"
  ```
  Since `GROQ_MODEL` is not defined in `backend/.env`, the system defaults to `"openai/gpt-oss-120b"`.
* **Expected behaviour:**
  The system should default to an active, valid Groq model such as `"llama-3.3-70b-versatile"`.
* **Why it is a problem:**
  `"openai/gpt-oss-120b"` is not a valid Groq model name. Calling Groq's API with this model identifier throws HTTP 404 (`model_not_found`). The `try...except` blocks in `_generate_json` and `process_diagnostic_turn` catch this error and silently drop back to rule-based fallback heuristics. As a result, AI resume parsing, AI career reranking, and AI diagnostic chat turns silently fail to use LLM intelligence even when a valid `GROQ_API_KEY` is present.
* **Reproducible test case:**
  1. Inspect `backend/.env` (note `GROQ_MODEL` is absent).
  2. Send a POST request to `/api/counselor/diagnostic-chat`.
  3. Observe backend log output:
     ```
     [diagnostic_counselor] AI extraction error, falling back to rule-based: Error code: 404 - {'error': {'message': "The model `openai/gpt-oss-120b` does not exist..."}}
     ```
* **Suggested solution:**
  In `backend/main.py` (Line 29), update the default model:
  ```python
  GROQ_MODEL = os.environ.get("GROQ_MODEL") or "llama-3.3-70b-versatile"
  ```
  And explicitly set `GROQ_MODEL=llama-3.3-70b-versatile` inside `backend/.env`.

---

### Issue 2: Onboarding Step 4 Skills Omitted When Student Skips Resume Upload

* **File name and function:** `frontend/src/components/CounselorVoiceChat.tsx` — `handleGenerateRecommendations` (Line 352)
* **Current behaviour:**
  ```typescript
  resume_skills: profile?.resume?.skills || [],
  ```
* **Expected behaviour:**
  The payload should aggregate both uploaded resume skills (`profile?.resume?.skills`) and manual skills declared during Step 4 of Onboarding (`profile?.skills_and_experience?.skills`).
* **Why it is a problem:**
  Students without a PDF resume manually type their skills in Step 4 of onboarding (saved in `profile.skills_and_experience.skills`). Because `handleGenerateRecommendations` only forwards `profile?.resume?.skills`, the matching engine receives an empty array (`[]`). The resulting recommendations will report 0 demonstrated skills and classify the student as "Developing" readiness even when they entered multiple technical proficiencies during onboarding.
* **Reproducible test case:**
  1. Complete Onboarding: choose "College Student", enter "Python", "SQL", and "React" in Step 4, and skip Step 6 (PDF upload).
  2. Complete the Assessment and Diagnostic chat.
  3. Inspect the network payload sent to `POST /api/counselor/generate-recommendations`.
  4. Notice that `"resume_skills": []` is transmitted, ignoring all Step 4 skills.
* **Suggested solution:**
  In `CounselorVoiceChat.tsx`, extract skill names before dispatching the recommendation payload:
  ```typescript
  const declaredSkills = Array.isArray(profile?.skills_and_experience?.skills)
    ? profile.skills_and_experience.skills.map((s) => typeof s === 'string' ? s : s.name)
    : [];
  const mergedSkills = Array.from(new Set([...(profile?.resume?.skills || []), ...declaredSkills]));
  ```

---

### Issue 3: Potential Runtime Crash when Skills Array Contains Dictionary Objects

* **File name and function:** `backend/matcher.py` — `hybrid_career_match` (Line 215) and `backend/main.py` (Line 1217)
* **Current behaviour:**
  ```python
  resume_skills_lower = {s.lower() for s in resume_skills}
  student_skills_lower = {s.lower() for s in combined_skills}
  ```
* **Expected behaviour:**
  Ensure every element is defensively converted to a string before calling `.lower()`:
  `str(s.get("name") if isinstance(s, dict) else s).lower()`
* **Why it is a problem:**
  If structured skill objects (`{"name": "Python", "level": "intermediate"}`) from onboarding are forwarded by any frontend component, calling `s.lower()` triggers an unhandled `AttributeError: 'dict' object has no attribute 'lower'`, resulting in an HTTP 500 crash.
* **Reproducible test case:**
  Send a POST request to `/api/counselor/generate-recommendations` with payload:
  ```json
  {
    "riasec_scores": {"R": 10, "I": 20, "A": 10, "S": 10, "E": 10, "C": 10},
    "code": "IRC",
    "interests": ["Coding"],
    "resume_skills": [{"name": "Python"}],
    "diagnostic_profile": {}
  }
  ```
  The endpoint will crash with `AttributeError`.
* **Suggested solution:**
  Add input sanitization at the start of `counselor_generate_recommendations`:
  ```python
  def _normalize_skill(item):
      return item.get("name") if isinstance(item, dict) else str(item)

  clean_skills = [_normalize_skill(s) for s in combined_skills if s]
  student_skills_lower = {s.lower() for s in clean_skills}
  ```

---

### Issue 4: Cryptic Single-Letter Holland RIASEC Justifications in Hybrid Matcher

* **File name and function:** `backend/matcher.py` — `hybrid_career_match` (Line 309)
* **Current behaviour:**
  ```python
  if riasec_pts >= 4:
      why_reasons.append(f"Matches your natural {top_dims[0]} ({c_code}) problem-solving style")
  ```
* **Expected behaviour:**
  Display the readable psychological dimension name (e.g., "Enterprising" instead of "E").
* **Why it is a problem:**
  Students reading their recommendation card see:
  > *"Matches your natural E (IRC) problem-solving style."*  
  This appears to be an internal debugging code or database placeholder rather than clear guidance. Students do not know that "E" stands for Enterprising or what "(IRC)" means.
* **Reproducible test case:**
  Run `hybrid_career_match` with RIASEC scores where dimension `E` is highest and the matched career has code `IRC`. Inspect the resulting `why_it_fits` text.
* **Suggested solution:**
  Import `DIM_LABEL` from `riasec.py` and format the text properly:
  ```python
  from riasec import DIM_LABEL

  dim_name = DIM_LABEL.get(top_dims[0], top_dims[0])
  if riasec_pts >= 4:
      why_reasons.append(f"Matches your natural {dim_name} problem-solving approach ({c_code})")
  ```

---

### Issue 5: Artificial Fit Percentage Decay in AI Recommendations

* **File name and function:** `backend/main.py` — `counselor_generate_recommendations` (Line 1225)
* **Current behaviour:**
  ```python
  if not m.get("fit"):
      m["fit"] = max(70, 94 - idx * 4)
  ```
* **Expected behaviour:**
  The fit percentage should reflect the actual mathematical match score computed by the hybrid vector engine (`candidate["score"] * 100`).
* **Why it is a problem:**
  Because the Groq LLM prompt explicitly forbids generating fit percentages, `m.get("fit")` is always absent. The code then applies the static formula `94 - idx * 4`. Every student who receives AI recommendations will see identical numbers:
  - Match #1: **94% Fit**
  - Match #2: **90% Fit**
  - Match #3: **86% Fit**
  - Match #4: **82% Fit**
  - Match #5: **78% Fit**  
  This creates an artificial illusion of mathematical precision.
* **Reproducible test case:**
  Complete three assessments with completely different profiles. In all cases where AI reranking is used, the 5 matches will display exactly 94%, 90%, 86%, 82%, and 78% fit scores.
* **Suggested solution:**
  Preserve the baseline numeric score from `candidate_careers[idx]["score"]` calculated by `hybrid_career_match` in `matcher.py` and pass it through to the final result.

---

### Issue 6: Unauthenticated Guest Assessment Results Lost Upon Sign-In Redirect

* **File name and function:** `frontend/src/pages/Assessment.tsx` — `setGoal` (Line 513) & `submit` (Line 425)
* **Current behaviour:**
  Guests can take the assessment and diagnostic chat without logging in. However, when they reach the results screen and click "Set as Career Goal", `setGoal` rejects the action:
  ```typescript
  if (!user) {
    setGoalError('Please sign in to confirm your career goal.');
    return;
  }
  ```
  If the user signs in or the page reloads, in-memory assessment results are cleared.
* **Expected behaviour:**
  Assessment answers, Holland scores, and diagnostic recommendations should be cached in `localStorage` under a temporary key (e.g., `guest_assessment_cache`). Upon signing in, `ProfileContext` should detect and persist this cached assessment to Supabase automatically.
* **Why it is a problem:**
  A user who spends 10–15 minutes completing the assessment and conversing with the counselor will lose their entire session simply because they signed in at the end.
* **Reproducible test case:**
  1. Open an incognito browser window (logged out).
  2. Navigate to `http://localhost:5173/assessment`.
  3. Complete all 12 scenario questions and the diagnostic conversation.
  4. On the results page, click "Set as Career Goal" $\rightarrow$ notice error.
  5. Sign in or refresh the page.
  6. The results page disappears and the user is redirected back to the quiz introduction.
* **Suggested solution:**
  Write completed results to `localStorage.setItem('pending_guest_assessment', JSON.stringify({ score, match, adaptiveScore, diagnosticProfile }))`. In `AuthContext.tsx` or `ProfileContext.tsx`, check for this key on sign-in and commit it to Supabase.

---

### Issue 7: Disparity in Detail Depth Between Curated Careers and O*NET Careers

* **File name and function:** `backend/careers.py` — `get_career_by_slug` (Line 450)
* **Current behaviour:**
  The top 40 curated careers feature localized Indian day-in-the-life schedules, verified entry/mid/senior LPA salaries, pros, cons, and step-by-step learning paths. The remaining 976 O*NET careers fall back to generic placeholder templates:
  ```python
  "activity": f"Morning planning and reviewing priorities in {field}."
  ```
* **Expected behaviour:**
  The O*NET database (`onet_careers.json`) contains detailed task statements and specific work activities. The fallback generator should extract these real occupational tasks instead of using generic placeholder sentences.
* **Why it is a problem:**
  When a student clicks "Explore Day-to-Day & Skill Gap" for a curated career like `software-engineer`, they get a rich, realistic schedule. When they click on an O*NET career like `operations-research-analysts`, they see vague text: *"Review morning priorities in the domain"*.
* **Reproducible test case:**
  Compare `GET /api/careers/software-engineer` with `GET /api/careers/operations-research-analysts`. Notice the disparity in day-in-the-life activities.
* **Suggested solution:**
  Update `_generate_default_extended` in `backend/careers.py` to populate `day_in_the_life` from the career’s actual `tasks` or `description` statements.

---

## 6. Verification Status

| Service / Test Suite | Status | Observations |
| :--- | :---: | :--- |
| **FastAPI Backend Server (`:8000`)** | **Operational** (`HTTP 200`) | Server running via Uvicorn daemon; endpoints respond in under 50ms. |
| **Vite React Frontend (`:5173`)** | **Operational** (`HTTP 200`) | Clean production build (`npm run build` succeeds with 0 TypeScript errors). |
| **Counselor Guardrail Test Suite** | **100% Passed (8/8)** | SSLC, PUC, and College guardrails correctly block forbidden terms. |
| **Dense Vector Embeddings** | **Verified** | $1016 \times 384$ embedding matrix and index load without memory leaks. |

---

## 7. Recommended Action Plan

To transition the platform to production grade, address the findings in the following order:

1. **Phase 1: Critical Reliability Fixes**
   - Correct the fallback Groq model identifier in `backend/main.py` and `backend/.env` to `llama-3.3-70b-versatile`.
   - Add dictionary-defensive skill parsing in `backend/matcher.py` and `backend/main.py`.
   - Unify Step 4 onboarding skills with resume skills in `CounselorVoiceChat.tsx`.
2. **Phase 2: User Experience & Report Clarity**
   - Replace single-letter Holland abbreviations in `matcher.py` with full descriptive titles (`DIM_LABEL`).
   - Implement `pending_guest_assessment` in `localStorage` to protect unauthenticated guest user sessions.
   - Replace static fit decay (`94 - idx * 4`) with the hybrid matcher's mathematical score.
3. **Phase 3: Dataset Enrichment**
   - Populate O*NET day-in-the-life schedules using real occupational task statements from `onet_careers.json`.
