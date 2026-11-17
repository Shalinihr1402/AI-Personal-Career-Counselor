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

from typing import Any, List, Set


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
