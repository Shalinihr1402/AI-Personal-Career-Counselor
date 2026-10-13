"""
matcher.py
Hybrid AI Career Matcher & Semantic Search Engine.

Combines:
1. Dense Vector Embeddings (all-MiniLM-L6-v2) for deep semantic comprehension.
2. Psychological RIASEC alignment (Holland codes).
3. Subconscious Identity Profiling (flow state, envy compass, values).
4. Hard deal-breaker constraints & penalties.
5. Exact resume skill overlap.
"""

import os
import json
from pathlib import Path
import numpy as np

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
    """Normalize workplace values from list, tuple, set, or string, safely filtering unexpected types."""
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
    Supports both canonical backend keys and frontend knowMeForApi aliases:
      - core_values / values
      - energy_flow / energy_source
      - envy_compass / secret_curiosity
    """
    know_me = know_me or {}
    envy = _resolve_text(know_me, "envy_compass", "secret_curiosity")
    flow = _resolve_text(know_me, "energy_flow", "energy_source")
    values_str = _resolve_values(know_me, "core_values", "values")

    query_components = []
    if free_text:
        query_components.append(f"Student goal: {free_text}")
    if interests:
        query_components.append(f"Interests and passions: {', '.join(interests)}")
    if resume_skills:
        query_components.append(f"Technical & domain skills: {', '.join(resume_skills)}")
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


def hybrid_career_match(
    riasec_scores: dict[str, float],
    interests: list[str] | None = None,
    resume_skills: list[str] | None = None,
    know_me: dict | None = None,
    free_text: str | None = None,
    limit: int = 5
) -> list[dict]:
    """
    State-of-the-Art Hybrid Matcher:
    Merges Vector Embeddings + RIASEC Alignment + Subconscious Identity + Skills.
    """
    _load_engine()
    if _MODEL is None or _EMBEDDINGS is None or _CAREERS is None:
        return []

    interests = interests or []
    resume_skills = resume_skills or []
    know_me = know_me or {}

    # 1. Build rich semantic query from student profile
    deal_breakers = know_me.get("deal_breakers", [])
    flow = _resolve_text(know_me, "energy_flow", "energy_source")

    semantic_query = build_semantic_query(
        free_text=free_text,
        interests=interests,
        resume_skills=resume_skills,
        know_me=know_me,
    )

    # Compute dense semantic similarity vector
    query_vec = _MODEL.encode([semantic_query], normalize_embeddings=True)
    semantic_sims = np.dot(_EMBEDDINGS, query_vec.T).flatten()  # range approx [-1, 1], typically [0.1, 0.7]

    # Normalize semantic scores to 0-1
    min_s = float(np.min(semantic_sims))
    max_s = float(np.max(semantic_sims))
    norm_semantic = (semantic_sims - min_s) / (max_s - min_s + 1e-6)

    # 2. Compute RIASEC psychological alignment score
    # Student top 3 dimensions
    sorted_riasec = sorted(riasec_scores.items(), key=lambda x: x[1], reverse=True)
    top_dims = [d[0] for d in sorted_riasec[:3]]

    scored_careers = []
    resume_skills_lower = {s.lower() for s in resume_skills}

    for idx, career in enumerate(_CAREERS):
        c_code = career.get("riasec_code", "")
        # Positional RIASEC match: 1st high letter = 3pts, 2nd = 2pts, 3rd = 1pt
        riasec_pts = 0
        for pos, dim in enumerate(top_dims):
            weight = 3 - pos
            if dim in c_code:
                # If exact position match, give bonus
                exact_pos = c_code.find(dim)
                riasec_pts += weight * (1.5 if exact_pos == pos else 1.0)
        norm_riasec = min(1.0, riasec_pts / 9.0)

        # 3. Direct skill overlap score
        career_skills = career.get("skills", []) + career.get("software_tools", [])
        career_skills_lower = [s.lower() for s in career_skills]
        overlap_count = sum(1 for s in career_skills_lower if any(rs in s or s in rs for rs in resume_skills_lower))
        norm_skills = min(1.0, overlap_count / 3.0) if resume_skills_lower else 0.5

        # 4. Deal-breaker penalties
        penalty = 0.0

        d2d = career.get("day_to_day") or ""
        if isinstance(d2d, list):
            d2d = " ".join(str(item) for item in d2d)

        title_desc = " ".join([
            str(career.get("title") or ""),
            str(career.get("description") or ""),
            str(d2d),
        ]).lower()

        for db in deal_breakers:
            db_lower = db.lower().strip()

            if (
                any(term in db_lower for term in [
                    "alone debugging",
                    "debugging alone",
                    "working alone debugging"
                ])
                and any(w in title_desc for w in [
                    "software developer", "programmer", "software engineer",
                    "debugging", "coding"
                ])
            ):
                penalty += 0.25

            if (
                "cold calling" in db_lower
                and any(w in title_desc for w in [
                    "cold call", "telemarketing", "sales calls"
                ])
            ):
                penalty += 0.35

            if (
                "abstract math" in db_lower
                and any(w in title_desc for w in [
                    "mathematician", "statistician", "actuary"
                ])
            ):
                penalty += 0.30

            if any(term in db_lower for term in [
                "monotonous paperwork",
                "repetitive paperwork",
                "routine paperwork",
                "repetitive administrative tasks"
            ]):
                paperwork_tasks = [
                    "filing records",
                    "maintaining records",
                    "processing invoices",
                    "data entry",
                    "clerical duties",
                    "administrative paperwork",
                    "processing forms",
                    "record keeping"
                ]

                if any(task in title_desc for task in paperwork_tasks):
                    penalty += 0.30

        # Weighted final score: 50% Semantic + 30% RIASEC + 20% Skill Overlap - Penalty
        combined = (0.50 * norm_semantic[idx]) + (0.30 * norm_riasec) + (0.20 * norm_skills) - penalty
        fit_percent = int(np.clip(combined * 100, 35, 98))

        # Personal explanation
        why_reasons = []
        if norm_semantic[idx] > 0.6:
            why_reasons.append(f"Aligns deeply with your interest in {interests[0] if interests else career['field']}")
        if riasec_pts >= 4:
            why_reasons.append(f"Matches your natural {top_dims[0]} ({c_code}) problem-solving style")
        if overlap_count > 0:
            why_reasons.append(f"Directly leverages your existing skillset ({overlap_count} skills match)")
        if flow:
            why_reasons.append("Provides tasks that support your preferred deep focus flow state")

        why_it_fits = ". ".join(why_reasons[:2]) + "." if why_reasons else f"Strong alignment with your profile and career interests in {career['field']}."

        scored_careers.append({
            "title": career["title"],
            "slug": career["slug"],
            "soc_code": career.get("soc_code"),
            "field": career.get("field"),
            "fit": fit_percent,
            "riasec_code": c_code,
            "why_it_fits": why_it_fits,
            "day_to_day": career.get("day_to_day", career.get("description", "")[:120]),
            "key_skills": career.get("skills", [])[:5],
            "software_tools": career.get("software_tools", [])[:4],
            "salary_india": career.get("salary_inr"),
            "score": combined,
        })

    # Sort descending by score
    scored_careers.sort(key=lambda x: x["score"], reverse=True)
    return scored_careers[:limit]
