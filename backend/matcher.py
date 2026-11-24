"""
matcher.py
Multi-Signal Hybrid AI Career Matcher & Semantic Search Engine.

Combines six balanced signals:
1. Semantic & Occupational Domain Alignment (35%)
2. Explicit Career Goal Alignment (20%)
3. Personal Interest Alignment (10%)
4. Technical Skills & Project Evidence (25%)
5. RIASEC Personality Alignment (10%)
6. Domain Prerequisite & Deal-Breaker Penalties

Total positive weights = 1.0 (100%).
"""

import os
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
import json
import re
from pathlib import Path
import numpy as np
from skill_normalizer import normalize_skills, is_skill_match

# File paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CAREERS_JSON_PATH = DATA_DIR / "onet_careers.json"
EMBEDDINGS_NPY_PATH = DATA_DIR / "career_embeddings.npy"
INDEX_JSON_PATH = DATA_DIR / "career_index.json"

_MODEL = None
_EMBEDDINGS = None
_CAREERS = None
_INDEX = None


# Centralized heuristic match level thresholds
MATCH_LEVEL_THRESHOLDS = {
    "strong": 0.72,
    "good": 0.58,
}


def compute_match_level(score: float | int | None) -> str:
    """
    Computes qualitative career match level based on the authentic hybrid match score.
    Heuristic cutoffs:
      - Score >= 0.72: Strong Match
      - Score >= 0.58 and < 0.72: Good Match
      - Score < 0.58 (or missing): Exploratory Match
    """
    if score is None:
        return "Exploratory Match"
    try:
        val = float(score)
    except (ValueError, TypeError):
        return "Exploratory Match"

    if val >= MATCH_LEVEL_THRESHOLDS["strong"]:
        return "Strong Match"
    elif val >= MATCH_LEVEL_THRESHOLDS["good"]:
        return "Good Match"
    else:
        return "Exploratory Match"


def _load_engine():
    global _MODEL, _EMBEDDINGS, _CAREERS, _INDEX
    if _EMBEDDINGS is not None and _CAREERS is not None:
        return

    if EMBEDDINGS_NPY_PATH.exists() and CAREERS_JSON_PATH.exists() and INDEX_JSON_PATH.exists():
        try:
            print("Loading O*NET career embeddings and metadata...")
            _EMBEDDINGS = np.load(EMBEDDINGS_NPY_PATH)
            with open(CAREERS_JSON_PATH, "r", encoding="utf-8") as f:
                _CAREERS = json.load(f)
            with open(INDEX_JSON_PATH, "r", encoding="utf-8") as f:
                _INDEX = json.load(f)
        except Exception as e:
            print(f"Error loading embeddings data: {e}")

    # Lazy-load SentenceTransformer only when first query is run
    if _MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            print(f"Warning: SentenceTransformer could not be loaded: {e}")


def is_semantic_engine_ready() -> bool:
    return EMBEDDINGS_NPY_PATH.exists() and CAREERS_JSON_PATH.exists()


# ============================================================================
# SKILL SPECIFICITY TIERS (IDF WEIGHTING)
# ============================================================================
SKILL_SPECIFICITY_TIERS: dict[str, float] = {
    # Tier 3: Domain-Anchor Technologies & Specialized Methodologies (Weight = 4.0)
    "pytorch": 4.0, "tensorflow": 4.0, "keras": 4.0, "opencv": 4.0, "huggingface": 4.0,
    "computer vision": 4.0, "deep learning": 4.0, "machine learning": 4.0, "natural language processing": 4.0, "nlp": 4.0,
    "transformers": 4.0, "llm": 4.0, "neural networks": 4.0, "reinforcement learning": 4.0,
    "arcgis": 4.0, "qgis": 4.0, "remote sensing": 4.0, "cartography": 4.0, "gis": 4.0, "spatial analysis": 4.0,
    "ros": 4.0, "robot operating system": 4.0, "plc": 4.0, "scada": 4.0, "solidworks": 4.0, "autocad": 4.0, "catia": 4.0,
    "verilog": 4.0, "vhdl": 4.0, "fpga": 4.0, "vlsi": 4.0, "embedded c": 4.0, "microcontrollers": 4.0, "pcb design": 4.0,
    "bioinformatics": 4.0, "genomics": 4.0, "clinical research": 4.0, "pathology": 4.0, "biostatistics": 4.0,
    "financial modeling": 4.0, "portfolio management": 4.0, "derivatives": 4.0, "valuation": 4.0, "actuarial": 4.0,
    "solidity": 4.0, "smart contracts": 4.0, "blockchain": 4.0, "penetration testing": 4.0, "metasploit": 4.0,
    "kubernetes": 4.0, "terraform": 4.0, "ansible": 4.0,

    # Tier 2: Specialized Frameworks, Libraries & Enterprise Tools (Weight = 2.5)
    "fastapi": 2.5, "flask": 2.5, "django": 2.5, "spring boot": 2.5, "spring": 2.5, "express": 2.5, "nestjs": 2.5,
    "react": 2.5, "react.js": 2.5, "next.js": 2.5, "angular": 2.5, "vue": 2.5, "node.js": 2.5,
    "pandas": 2.5, "numpy": 2.5, "scipy": 2.5, "scikit-learn": 2.5, "sklearn": 2.5, "matplotlib": 2.5, "seaborn": 2.5,
    "docker": 2.5, "aws": 2.5, "azure": 2.5, "gcp": 2.5, "kafka": 2.5, "rabbitmq": 2.5, "spark": 2.5, "hadoop": 2.5,
    "graphql": 2.5, "redis": 2.5, "mongodb": 2.5, "postgresql": 2.5, "mysql": 2.5, "elasticsearch": 2.5,
    "tableau": 2.5, "power bi": 2.5, "excel modeling": 2.5, "auditing": 2.5, "taxation": 2.5, "financial analysis": 2.5,

    # Tier 1: Foundational Languages & Universal Competencies (Weight = 1.0)
    "python": 1.0, "java": 1.0, "c": 1.0, "c++": 1.0, "c#": 1.0, "javascript": 1.0, "typescript": 1.0, "go": 1.0,
    "sql": 1.0, "html": 1.0, "css": 1.0, "git": 1.0, "linux": 1.0, "bash": 1.0, "shell": 1.0, "powershell": 1.0,
    "communication": 1.0, "problem solving": 1.0, "critical thinking": 1.0, "teamwork": 1.0, "mathematics": 1.0,
    "microsoft excel": 1.0, "microsoft word": 1.0, "microsoft powerpoint": 1.0,
}


def get_skill_weight(skill_name: str) -> float:
    """Returns the specificity weight for a given skill or technology."""
    s_clean = skill_name.lower().strip()
    if s_clean in SKILL_SPECIFICITY_TIERS:
        return SKILL_SPECIFICITY_TIERS[s_clean]
    for k, w in SKILL_SPECIFICITY_TIERS.items():
        if k in s_clean or s_clean in k:
            return w
    return 1.5


def semantic_search(query_text: str, top_k: int = 10, filter_field: str | None = None) -> list[dict]:
    """Pure semantic search query across all 1,016 careers."""
    _load_engine()
    if _MODEL is None or _EMBEDDINGS is None or _CAREERS is None:
        return []

    query_vec = _MODEL.encode([query_text], normalize_embeddings=True)
    sims = np.dot(_EMBEDDINGS, query_vec.T).flatten()

    ranked_indices = np.argsort(sims)[::-1]
    results = []

    for idx in ranked_indices:
        career = _CAREERS[idx]
        if filter_field and filter_field.lower() not in career.get("field", "").lower():
            continue

        similarity = float(sims[idx])
        results.append({
            "soc_code": career.get("soc_code"),
            "title": career.get("title"),
            "slug": career.get("slug"),
            "field": career.get("field"),
            "riasec_code": career.get("riasec_code"),
            "skills": career.get("skills", []),
            "salary_inr": career.get("salary_inr"),
            "similarity": round(similarity, 3),
            "match_percent": min(100, max(20, int(similarity * 100 + 20))),
            "description": career.get("description"),
            "day_to_day": career.get("day_to_day"),
        })

        if len(results) >= top_k:
            break

    return results


def _resolve_text(know_me: dict, primary_key: str, fallback_key: str) -> str:
    """Resolve text field with explicit precedence: primary_key > fallback_key."""
    for key in (primary_key, fallback_key):
        val = know_me.get(key)
        if isinstance(val, str):
            cleaned = val.strip()
            if cleaned:
                return cleaned
    return ""


def _resolve_values(know_me: dict, primary_key: str = "core_values", fallback_key: str = "values") -> str:
    """Normalize workplace values from list, tuple, set, or string."""
    for key in (primary_key, fallback_key):
        val = know_me.get(key)
        if val is None:
            continue
        if isinstance(val, str):
            cleaned = val.strip()
            if cleaned:
                return cleaned
        elif isinstance(val, set):
            items = sorted(str(item).strip() for item in val if isinstance(item, str) and item.strip())
            if items:
                return ", ".join(items)
        elif isinstance(val, (list, tuple)):
            items = [str(item).strip() for item in val if isinstance(item, str) and item.strip()]
            if items:
                return ", ".join(items)
    return ""


def build_semantic_query(
    free_text: str | None = None,
    interests: list[str] | None = None,
    resume_skills: list[str] | None = None,
    know_me: dict | None = None,
) -> str:
    """
    Constructs the rich semantic query representation from the student's profile.
    Separates background competencies and workplace flow to avoid double-counting explicit career goals.
    """
    know_me = know_me or {}
    envy = _resolve_text(know_me, "envy_compass", "secret_curiosity")
    flow = _resolve_text(know_me, "energy_flow", "energy_source")
    values_str = _resolve_values(know_me, "core_values", "values")

    query_components = []
    # If free text contains explicit career goals, strip them to avoid semantic double-counting with goal scoring
    if free_text:
        cleaned_text = re.sub(r"Career Goals:\s*[^.]+(\.|$)", "", free_text, flags=re.IGNORECASE).strip()
        if cleaned_text:
            query_components.append(f"Student background: {cleaned_text}")
    if interests:
        query_components.append(f"Core domain interests: {', '.join(interests)}")
    clean_resume_skills = normalize_skills(resume_skills)
    if clean_resume_skills:
        query_components.append(f"Technical & domain skills: {', '.join(clean_resume_skills)}")
    if flow:
        query_components.append(f"Natural flow state and deep work: {flow}")
    if envy:
        query_components.append(f"Role models and admired work: {envy}")
    if values_str:
        query_components.append(f"Core workplace values: {values_str}")

    semantic_query = ". ".join(query_components)
    if not semantic_query.strip():
        semantic_query = "Motivated college student seeking rewarding career opportunities"

    return semantic_query


# ============================================================================
# DEDICATED SCORING SIGNALS
# ============================================================================

def compute_goal_alignment(career: dict, goal_input: str | list[str] | None) -> tuple[float, str]:
    """
    Evaluates alignment between explicit student career goals and occupational scope.
    Matches target roles against title, alternate titles, descriptions, and occupational family.
    Returns (score: 0.0-1.0, explanation: str).
    """
    if not goal_input:
        return 0.50, ""

    if isinstance(goal_input, list):
        goal_text = " ".join(str(g) for g in goal_input)
    else:
        goal_text = str(goal_input)

    g_lower = goal_text.lower().strip()
    title_lower = (career.get("title") or "").lower()
    desc_lower = (career.get("description") or "").lower()
    field_lower = (career.get("field") or "").lower()

    # Direct title or slug match
    if title_lower in g_lower or g_lower in title_lower:
        return 1.0, f"Directly matches your target career goal of '{goal_text}'"

    # AI / ML / Data Science Goal
    is_goal_ai = any(term in g_lower for term in [
        "ai", "ml", "machine learning", "artificial intelligence", "data science",
        "data scientist", "deep learning", "computer vision", "nlp"
    ])
    if is_goal_ai:
        if any(term in title_lower for term in ["data scientist", "machine learning", "research scientist", "software developer", "computer systems analyst"]):
            return 0.95, f"Directly aligns with your explicit career goal in AI/ML and software engineering"
        if any(term in desc_lower for term in ["machine learning", "artificial intelligence", "data science", "algorithm"]):
            return 0.90, f"Core occupational responsibilities directly support your goal in AI/ML"
        if "data" in field_lower or "technology" in field_lower:
            return 0.70, f"Belongs to the computing and data technology family aligned with your goal"

    # Software Engineering / Backend / Full Stack Goal
    is_goal_software = any(term in g_lower for term in [
        "software engineer", "software developer", "backend", "frontend", "full stack",
        "fullstack", "web developer", "java developer", "python developer"
    ])
    if is_goal_software:
        if any(term in title_lower for term in ["software developer", "web developer", "computer programmer", "systems analyst"]):
            return 0.95, f"Directly matches your target career goal in software engineering"
        if "technology" in field_lower or "computer" in field_lower:
            return 0.75, f"Shares core software engineering architecture and development principles"

    # Finance / Accounting Goal
    is_goal_finance = any(term in g_lower for term in ["finance", "financial", "accounting", "accountant", "audit", "banking", "tax", "actuary"])
    if is_goal_finance:
        if any(term in title_lower for term in ["financial", "accountant", "auditor", "budget", "actuary", "credit"]):
            return 0.95, f"Directly matches your target career goal in finance and accounting"
        if "finance" in field_lower or "business" in field_lower:
            return 0.75, f"Shares core financial analysis and corporate governance responsibilities"

    # Robotics / Hardware Engineering Goal
    is_goal_robotics_hw = any(term in g_lower for term in ["robotics", "robot", "hardware engineer", "embedded", "vlsi", "electronics"])
    if is_goal_robotics_hw:
        if any(term in title_lower for term in ["robotics", "hardware", "electronics", "mechatronics"]):
            return 0.95, f"Directly matches your target career goal in robotics and hardware engineering"

    # Token overlap across goal and title
    goal_words = set(re.findall(r"\b[a-z]{3,}\b", g_lower))
    title_words = set(re.findall(r"\b[a-z]{3,}\b", title_lower))
    overlap = goal_words.intersection(title_words)
    if overlap:
        return 0.85, f"Matches key focus areas of your target goal ({', '.join(overlap)})"

    # Check description overlap
    desc_words = set(re.findall(r"\b[a-z]{3,}\b", desc_lower))
    desc_overlap = goal_words.intersection(desc_words)
    if len(desc_overlap) >= 2:
        return 0.65, f"Shares core operational responsibilities with '{goal_text}'"
    elif len(desc_overlap) == 1:
        return 0.45, f"Has partial overlap with your target goal '{goal_text}'"

    # Disconnected goal penalty (e.g. AI student vs Astronomy or Electrician)
    if is_goal_ai or is_goal_software:
        if any(tok in title_lower for tok in ["astronomer", "electrician", "surveyor", "speech", "geologist", "agricultural"]):
            return 0.05, f"Unrelated to your career goal of '{goal_text}'"

    return 0.30, ""


def compute_interest_alignment(career: dict, interests: list[str] | None) -> tuple[float, str]:
    """
    Evaluates alignment between student's explicitly chosen personal interests and occupational scope.
    Returns (score: 0.0-1.0, explanation: str).
    """
    if not interests:
        return 0.50, ""

    career_text = " ".join([
        str(career.get("field") or ""),
        str(career.get("title") or ""),
        str(career.get("description") or ""),
    ]).lower()

    matched_interests = []
    for interest in interests:
        int_lower = interest.lower().strip()
        tokens = [t for t in re.findall(r"\b[a-z]{3,}\b", int_lower) if t not in ["and", "tech", "coding", "general"]]
        if int_lower in career_text or any(t in career_text for t in tokens):
            matched_interests.append(interest)

    if matched_interests:
        score = min(1.0, 0.45 + 0.25 * len(matched_interests))
        return score, f"Aligns with your personal interest in {', '.join(matched_interests[:2])}"

    return 0.15, ""


def compute_smooth_riasec(riasec_scores: dict[str, float] | None, career_code: str) -> float:
    """
    Smooth, continuous 6-dimensional RIASEC alignment.
    Eliminates disproportionate ranking cliffs caused by minor letter permutations.
    """
    if not riasec_scores or not career_code:
        return 0.50

    dims = ["R", "I", "A", "S", "E", "C"]
    s_vec = np.array([float(riasec_scores.get(d, 0.0)) for d in dims], dtype=float)
    if np.sum(s_vec) > 0:
        s_vec = s_vec / np.sum(s_vec)
    else:
        s_vec = np.ones(6) / 6.0

    c_vec = np.zeros(6, dtype=float)
    c_clean = career_code.strip()
    for pos, char in enumerate(c_clean[:3]):
        if char in dims:
            c_vec[dims.index(char)] = 3.0 - pos

    if np.sum(c_vec) > 0:
        c_vec = c_vec / np.sum(c_vec)
    else:
        c_vec = np.ones(6) / 6.0

    dot = float(np.dot(s_vec, c_vec))
    # Rescale smooth alignment to [0.10, 1.0]
    return min(1.0, max(0.10, dot * 1.5))


def compute_skill_project_evidence(
    career: dict,
    student_skills: list[str],
    projects: list[dict] | None = None,
) -> tuple[float, list[str], list[str], str]:
    """
    Computes technical skill and project evidence match using domain specificity weighting.
    Gives additional weight to tools verified through practical project execution.
    Returns (score: 0.0-1.0, matched_skills: list[str], matched_projects: list[str], reason: str).
    """
    career_skills = normalize_skills(career.get("skills", []) + career.get("software_tools", []))
    career_skills_lower = [s.lower() for s in career_skills]

    projects = projects or []
    proj_techs = []
    proj_names = []
    for p in projects:
        if isinstance(p, dict):
            p_name = p.get("name") or p.get("title") or "Project"
            proj_names.append(p_name)
            p_techs = normalize_skills(p.get("technologies") or p.get("tech") or [])
            proj_techs.extend(p_techs)

    all_student_techs = list(dict.fromkeys(student_skills + proj_techs))
    if not all_student_techs:
        return 0.50, [], [], "General profile match"

    total_weight = sum(get_skill_weight(s) for s in all_student_techs)
    matched_skills = []
    matched_weight = 0.0

    for s in all_student_techs:
        if any(is_skill_match(s, cs) for cs in career_skills):
            matched_skills.append(s)
            base_w = get_skill_weight(s)
            # Give 1.4x multiplier for tools demonstrated in practical projects
            is_in_project = any(is_skill_match(s, pt) for pt in proj_techs)
            matched_weight += base_w * (1.4 if is_in_project else 1.0)

    matched_projects = []
    for p in projects:
        if isinstance(p, dict):
            p_techs = p.get("technologies") or p.get("tech") or []
            if any(is_skill_match(pt, cs) for pt in p_techs for cs in career_skills):
                matched_projects.append(p.get("name") or p.get("title") or "Practical Project")

    # Normalized score: matched weight relative to total expected weight
    # Capped at 1.0, scaled so matching high-specificity anchor tools yields high scores
    raw_ratio = matched_weight / max(1.0, total_weight * 0.45)
    score = min(1.0, round(raw_ratio, 4))

    # Build descriptive reason
    if matched_skills and matched_projects:
        reason = f"Leverages your practical experience with {', '.join(matched_skills[:3])} in projects ({matched_projects[0]})"
    elif matched_skills:
        reason = f"Matches your verified technical skills in {', '.join(matched_skills[:3])}"
    else:
        reason = "Opportunity to expand into this occupational skill set"

    return score, matched_skills, matched_projects, reason


def extract_goals_and_projects(
    free_text: str | None,
    know_me: dict | None,
    explicit_goals: str | list[str] | None,
    explicit_projects: list[dict] | None,
) -> tuple[str, list[dict]]:
    """Robustly resolves career goals and project records across multiple caller conventions."""
    know_me = know_me or {}
    resolved_goals = ""

    if explicit_goals:
        if isinstance(explicit_goals, list):
            resolved_goals = " ".join(str(g) for g in explicit_goals)
        else:
            resolved_goals = str(explicit_goals).strip()
    elif know_me.get("career_goals"):
        val = know_me.get("career_goals")
        resolved_goals = " ".join(val) if isinstance(val, list) else str(val).strip()
    elif know_me.get("target_role"):
        resolved_goals = str(know_me.get("target_role")).strip()
    elif free_text:
        m = re.search(r"Career Goals:\s*([^.]+)", free_text, re.IGNORECASE)
        if m:
            resolved_goals = m.group(1).strip()

    resolved_projects = []
    if explicit_projects:
        resolved_projects = explicit_projects
    elif know_me.get("projects"):
        resolved_projects = know_me.get("projects")
    elif free_text and "Practical Projects:" in free_text:
        # Extract from text if structured object wasn't supplied
        m = re.search(r"Practical Projects:\s*([^.]+)", free_text, re.IGNORECASE)
        if m:
            p_text = m.group(1).strip()
            resolved_projects = [{"name": p_text, "technologies": []}]

    return resolved_goals, resolved_projects


# ============================================================================
# MULTI-SIGNAL HYBRID MATCHER & CANDIDATE RETRIEVAL
# ============================================================================

def hybrid_career_match(
    riasec_scores: dict[str, float],
    interests: list[str] | None = None,
    resume_skills: list[str] | None = None,
    know_me: dict | None = None,
    free_text: str | None = None,
    limit: int = 35,
    career_goals: str | list[str] | None = None,
    projects: list[dict] | None = None,
    education_level: str | None = None,
    stream: str | None = None,
) -> list[dict]:
    """
    Multi-Signal Hybrid Career Matcher:
    Merges Dense Vector Embeddings (35%), Explicit Career Goal Alignment (20%),
    Personal Interest Alignment (10%), Technical Skills & Project Evidence (25%),
    and RIASEC Personality Alignment (10%).

    Retrieves a broad, multi-signal candidate pool before Groq qualitative reranking.
    """
    _load_engine()
    if _MODEL is None or _EMBEDDINGS is None or _CAREERS is None:
        return []

    interests = interests or []
    resume_skills = normalize_skills(resume_skills)
    know_me = know_me or {}

    # Extract structured goals and projects robustly
    resolved_goals, resolved_projects = extract_goals_and_projects(
        free_text=free_text,
        know_me=know_me,
        explicit_goals=career_goals,
        explicit_projects=projects,
    )

    deal_breakers = know_me.get("deal_breakers", [])

    # 1. Semantic Embedding Query (Profile context without goal duplication)
    semantic_query = build_semantic_query(
        free_text=free_text,
        interests=interests,
        resume_skills=resume_skills,
        know_me=know_me,
    )

    query_vec = _MODEL.encode([semantic_query], normalize_embeddings=True)
    semantic_sims = np.dot(_EMBEDDINGS, query_vec.T).flatten()
    min_s = float(np.min(semantic_sims))
    max_s = float(np.max(semantic_sims))
    norm_semantic = (semantic_sims - min_s) / (max_s - min_s + 1e-6)

    # Student top RIASEC dimension
    sorted_riasec = sorted(riasec_scores.items(), key=lambda x: x[1], reverse=True)
    top_dim = sorted_riasec[0][0] if sorted_riasec else "I"

    all_scored_careers = []

    for idx, career in enumerate(_CAREERS):
        c_title = career.get("title", "")
        c_code = career.get("riasec_code", "")
        c_field = career.get("field", "General")
        c_slug = career.get("slug")

        # 1. Semantic Score (Weight: 0.35)
        s_sem = float(norm_semantic[idx])

        # 2. Career Goal Alignment (Weight: 0.20)
        s_goal, goal_reason = compute_goal_alignment(career, resolved_goals)

        # 3. Personal Interest Alignment (Weight: 0.10)
        s_interest, int_reason = compute_interest_alignment(career, interests)

        # 4. Technical Skills & Project Evidence (Weight: 0.25)
        s_skills, matched_skills, matched_projs, skill_reason = compute_skill_project_evidence(
            career=career,
            student_skills=resume_skills,
            projects=resolved_projects,
        )

        # 5. RIASEC Psychological Alignment (Weight: 0.10)
        s_riasec = compute_smooth_riasec(riasec_scores, c_code)

        # 6. Deal-Breakers & Domain Mismatch Penalties
        penalty = 0.0

        d2d = career.get("day_to_day") or ""
        if isinstance(d2d, list):
            d2d = " ".join(str(item) for item in d2d)

        title_desc = " ".join([
            str(c_title),
            str(career.get("description") or ""),
            str(d2d),
        ]).lower()

        # Hard deal-breaker constraints
        for db in deal_breakers:
            db_lower = str(db).lower().strip()
            if any(term in db_lower for term in ["alone debugging", "debugging alone"]) and any(w in title_desc for w in ["programmer", "debugging", "coding"]):
                penalty += 0.25
            if "cold calling" in db_lower and any(w in title_desc for w in ["cold call", "telemarketing", "sales calls"]):
                penalty += 0.35
            if "abstract math" in db_lower and any(w in title_desc for w in ["mathematician", "statistician", "actuary"]):
                penalty += 0.30

        # Specialized Engineering / Physical Discipline Penalty for non-hardware profiles
        # If an occupation strictly requires physical/electronics/mechanical hardware training
        # and the student profile demonstrates zero hardware/electronics skills or projects
        title_lower = c_title.lower()
        is_hardware_or_robotics = any(tok in title_lower for tok in [
            "computer hardware engineer", "robotics engineer", "civil engineer",
            "mechanical engineer", "electrical engineer", "aerospace engineer"
        ])
        has_hardware_evidence = any(s.lower() in ["ros", "plc", "verilog", "vhdl", "autocad", "solidworks", "embedded c", "microcontroller", "circuit design"] for s in matched_skills)

        if is_hardware_or_robotics and not has_hardware_evidence:
            penalty += 0.20

        # Astronomy / Astrophysics penalty for software/computing students with no physics background
        if "astronomer" in title_lower or "astrophysicist" in title_lower:
            if resolved_goals and ("software" in resolved_goals.lower() or "ai" in resolved_goals.lower() or "data" in resolved_goals.lower()):
                penalty += 0.25

        # Weighted final score: 35% Semantic + 20% Goal + 10% Interest + 25% Skills + 10% RIASEC - Penalty
        combined = (
            (0.35 * s_sem)
            + (0.20 * s_goal)
            + (0.10 * s_interest)
            + (0.25 * s_skills)
            + (0.10 * s_riasec)
            - penalty
        )
        score_val = round(float(combined), 4)

        # Dynamic, evidence-grounded explanation (cites actual skills, projects, and goals)
        why_parts = []
        if goal_reason:
            why_parts.append(goal_reason)
        if matched_skills:
            if matched_projs:
                why_parts.append(f"Directly leverages your demonstrated experience with {', '.join(matched_skills[:3])} in projects ({matched_projs[0]})")
            else:
                why_parts.append(f"Leverages your technical proficiency in {', '.join(matched_skills[:3])}")
        elif int_reason:
            why_parts.append(int_reason)

        if not why_parts:
            why_parts.append(f"Provides tasks aligned with your analytical problem-solving style in {c_field}")

        why_it_fits = ". ".join(why_parts[:2]) + "."

        all_scored_careers.append({
            "title": c_title,
            "slug": c_slug,
            "soc_code": career.get("soc_code"),
            "field": c_field,
            "score": score_val,
            "match_level": compute_match_level(score_val),
            "riasec_code": c_code,
            "why_it_fits": why_it_fits,
            "day_to_day": career.get("day_to_day", career.get("description", "")[:120]),
            "key_skills": career.get("skills", [])[:5],
            "software_tools": career.get("software_tools", [])[:4],
            "salary_india": career.get("salary_inr"),
            "education": career.get("education"),
            "matched_skills": matched_skills,
            "matched_projects": matched_projs,
            # Intermediate component scores for multi-signal candidate pooling
            "_s_sem": s_sem,
            "_s_goal": s_goal,
            "_s_interest": s_interest,
            "_s_skills": s_skills,
            "_matched_skills": matched_skills,
            "_matched_projs": matched_projs,
        })

    # ========================================================================
    # MULTI-SIGNAL CANDIDATE POOL GENERATION
    # Guarantees diverse, high-relevance candidates are presented to Groq
    # ========================================================================
    # 1. Top balanced overall candidates
    all_scored_careers.sort(key=lambda x: x["score"], reverse=True)
    top_balanced = all_scored_careers[:25]

    # 2. Top candidates by explicit career goal alignment
    top_by_goal = sorted(all_scored_careers, key=lambda x: (x["_s_goal"], x["score"]), reverse=True)[:10]

    # 3. Top candidates by technical skills & project evidence
    top_by_skills = sorted(all_scored_careers, key=lambda x: (x["_s_skills"], x["score"]), reverse=True)[:10]

    # 4. Top candidates by personal interest
    top_by_interest = sorted(all_scored_careers, key=lambda x: (x["_s_interest"], x["score"]), reverse=True)[:5]

    # Merge and deduplicate by slug/title, keeping highest-scoring entry
    merged_candidates: dict[str, dict] = {}
    for group in (top_balanced, top_by_goal, top_by_skills, top_by_interest):
        for c in group:
            s_key = c["slug"] or c["title"].lower().strip()
            if s_key not in merged_candidates or c["score"] > merged_candidates[s_key]["score"]:
                merged_candidates[s_key] = c

    # Final sort descending by balanced authentic score
    final_candidates = list(merged_candidates.values())
    final_candidates.sort(key=lambda x: x["score"], reverse=True)

    # Clean intermediate private keys before returning
    for c in final_candidates:
        c.pop("_s_sem", None)
        c.pop("_s_goal", None)
        c.pop("_s_interest", None)
        c.pop("_s_skills", None)

    return final_candidates[:limit]
