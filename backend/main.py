from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import tempfile
import json

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import google.generativeai as genai
    _GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
    if _GEMINI_KEY:
        genai.configure(api_key=_GEMINI_KEY)
    else:
        print("INFO: GEMINI_API_KEY not set — AI features will use rule-based fallbacks.")
except ImportError:
    genai = None
    _GEMINI_KEY = None

from riasec import RIASEC_QUESTIONS, DIM_LABEL, score_riasec
from careers import CAREERS, CAREER_TITLES, fallback_match, valid_titles

app = FastAPI(
    title="AI Personal Career Counselor API",
    description="Backend API for the Career Counselor Platform",
    version="1.1.0",
)

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_AI_ENABLED = genai is not None and bool(_GEMINI_KEY)


@app.get("/")
def read_root():
    return {"message": "Welcome to AI Personal Career Counselor API", "ai_enabled": _AI_ENABLED}


# --------------------------------------------------------------------------- #
#  Resume parsing
# --------------------------------------------------------------------------- #
@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    if fitz is None or not _AI_ENABLED:
        print("WARNING: PyMuPDF missing or AI disabled. Returning mock resume data.")
        return {
            "name": "Alex Johnson",
            "education": ["B.S. Computer Science, University of Technology"],
            "skills": ["Python", "React", "TypeScript", "FastAPI", "SQL", "Git"],
            "experience": ["Software Engineering Intern at TechCorp", "Freelance Web Developer"],
        }

    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name

        text = ""
        try:
            doc = fitz.open(temp_file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        finally:
            os.remove(temp_file_path)

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
            Extract the following information from the resume text below.
            Format the output strictly as a JSON object with these exact keys:
            - "name": string (the person's full name)
            - "education": array of strings
            - "skills": array of strings
            - "experience": array of strings

            Resume Text:
            {text}
            """
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
            )
            return json.loads(response.text)
        except Exception as ai_err:
            print(f"Gemini AI Error: {ai_err}")
            return {
                "name": "Demo User (AI Failed)",
                "education": ["B.S. Computer Science"],
                "skills": ["Extracted text length: " + str(len(text))],
                "experience": ["Please configure GEMINI_API_KEY"],
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------------------------------------------------------------------------- #
#  Career-interest assessment (RIASEC)
# --------------------------------------------------------------------------- #
@app.get("/api/assessment/questions")
def assessment_questions():
    return {
        "questions": RIASEC_QUESTIONS,
        "scale": [
            {"value": 0, "label": "Would dislike"},
            {"value": 1, "label": "Neutral"},
            {"value": 2, "label": "Would like"},
        ],
        "dimensions": DIM_LABEL,
    }


class ScoreRequest(BaseModel):
    answers: dict[str, int] = Field(default_factory=dict)


@app.post("/api/assessment/score")
def assessment_score(req: ScoreRequest):
    return score_riasec(req.answers)


# --------------------------------------------------------------------------- #
#  Career matching (AI on top of the structured profile, rule-based fallback)
# --------------------------------------------------------------------------- #
class CareerMatchRequest(BaseModel):
    riasec_scores: dict[str, float]
    code: str = ""
    interests: list[str] = Field(default_factory=list)
    education: str | None = None
    work_style: dict[str, str] = Field(default_factory=dict)
    resume_skills: list[str] = Field(default_factory=list)


def _ai_career_match(profile: dict):
    if not _AI_ENABLED:
        return None
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "You are a career counselor for a student. Using the structured profile "
            "below, choose and rank the 5 best-fitting careers ONLY from the allowed "
            "list. Base the ranking mainly on the RIASEC scores, then interests, "
            "education and resume skills.\n\n"
            f"PROFILE:\n{json.dumps(profile, indent=2)}\n\n"
            f"ALLOWED CAREERS (use these exact titles):\n{json.dumps(CAREER_TITLES)}\n\n"
            "Return a JSON array of exactly 5 objects, best fit first. Each object:\n"
            '{ "title": <one allowed title>, "fit": <integer 0-100>, '
            '"why_it_fits": <one sentence referencing their RIASEC strengths or interests>, '
            '"day_to_day": <one sentence on what the work involves>, '
            '"key_skills": <array of 3-5 short skill strings>, '
            '"watch_outs": <one honest sentence about a downside or challenge> }'
        )
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.3},
        )
        data = json.loads(response.text)
        allowed = valid_titles()
        cleaned = [
            d for d in data
            if isinstance(d, dict) and d.get("title") in allowed and d.get("why_it_fits")
        ]
        return cleaned[:5] if len(cleaned) >= 3 else None
    except Exception as e:
        print(f"AI career match failed, falling back: {e}")
        return None


@app.post("/api/career-match")
def career_match(req: CareerMatchRequest):
    profile = req.model_dump()
    ai = _ai_career_match(profile)
    if ai:
        return {"source": "ai", "matches": ai}
    return {"source": "rule", "matches": fallback_match(req.riasec_scores, req.interests)}


@app.get("/api/careers")
def list_careers():
    return {"careers": CAREERS}
