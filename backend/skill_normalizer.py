"""
skill_normalizer.py

Centralized skill normalization utilities for the AI Personal Career Counselor.
Converts any incoming skill representation (string, structured UserSkill dict,
custom skill, or mixed collection) into a clean, case-insensitively deduplicated
list of strings: List[str].

Guarantees:
- Never raises AttributeError on dictionaries or non-string types.
- Preserves readable presentation names from the first occurrence.
- Safely handles malformed, empty, and unexpected input values.
"""

import re
from typing import Any, List, Set, Dict


SHORT_LANGUAGE_ALIASES: Dict[str, Set[str]] = {
    "c": {"c", "clanguage", "cprogramming", "cprogramminglanguage", "ansic"},
    "r": {"r", "rlanguage", "rprogramming", "rprogramminglanguage", "rstudio", "rstudioprogramming"},
    "go": {"go", "golang", "goprogramming", "golanguage"},
}


def clean_skill_token(s: Any) -> str:
    """Normalize skill string to alphanumeric + # and + for matching."""
    return re.sub(r'[^a-z0-9#+]', '', str(s).lower().strip())


def is_skill_match(skill_a: Any, skill_b: Any) -> bool:
    """
    Robust skill token matching that:
    1. Recognizes exact token matches (e.g. 'c' == 'c', 'r' == 'r', 'python' == 'python').
    2. Recognizes legitimate programming language aliases (e.g. 'C' matches 'C Programming', 'R' matches 'R Language').
    3. Prevents substring false positives for short tokens (< 4 chars):
       'opencv' will NEVER match 'C', 'scikit-learn' will NEVER match 'R'.
    4. Supports substring/containment only when BOTH tokens have length >= 4.
    """
    norm_a = clean_skill_token(skill_a)
    norm_b = clean_skill_token(skill_b)
    if not norm_a or not norm_b:
        return False
    if norm_a == norm_b:
        return True
    for lang, aliases in SHORT_LANGUAGE_ALIASES.items():
        if norm_a in aliases and norm_b in aliases:
            return True
    if len(norm_a) < 4 or len(norm_b) < 4:
        return False
    return norm_a in norm_b or norm_b in norm_a



def normalize_single_skill(item: Any) -> str:
    """
    Extracts a clean, trimmed string representation from a single skill item.
    Handles:
      - Plain strings: "Python" -> "Python"
      - Structured dicts: {"name": "Python", ...} -> "Python"
      - Dicts with alternative keys: {"skill_name": "SQL"}, {"skill": "Docker"}, etc.
      - Strips leading/trailing whitespace.
      - Returns "" for None, empty strings, whitespace-only, or empty dicts.
    """
    if item is None:
        return ""

    if isinstance(item, str):
        return item.strip()

    if isinstance(item, dict):
        for key in ("name", "skill_name", "skill", "title", "label"):
            val = item.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
        return ""

    # Defensively handle other scalar types (e.g., numbers) while excluding complex objects
    val_str = str(item).strip()
    if val_str and not val_str.startswith(("<", "{", "[")):
        return val_str

    return ""


def normalize_skills(skills_input: Any) -> List[str]:
    """
    Normalizes any skills input into a case-insensitively deduplicated list of strings.
    Accepts:
      - List/tuple/set of strings or dicts
      - Single string or dict
      - Dict containing 'skills' (List[UserSkill]) and/or 'custom_skills' (List[str])
      - Nested structures of the above
      - Empty or None inputs
    Returns:
      List[str] with readable capitalization preserved from first occurrence.
    """
    if not skills_input:
        return []

    items_to_process = []

    def _collect(val: Any) -> None:
        if val is None or val == "":
            return
        if isinstance(val, (list, tuple, set)):
            for v in val:
                _collect(v)
        elif isinstance(val, dict):
            has_sub = False
            if "skills" in val and isinstance(val["skills"], (list, tuple, set)):
                _collect(val["skills"])
                has_sub = True
            if "custom_skills" in val and isinstance(val["custom_skills"], (list, tuple, set)):
                _collect(val["custom_skills"])
                has_sub = True
            if not has_sub:
                items_to_process.append(val)
        else:
            items_to_process.append(val)

    _collect(skills_input)

    seen_lower: Set[str] = set()
    result: List[str] = []

    for item in items_to_process:
        name = normalize_single_skill(item)
        if name:
            key = name.lower()
            if key not in seen_lower:
                seen_lower.add(key)
                result.append(name)

    return result
