"""
test_know_me_payload.py

Deterministic Unit & Retrieval Test Suite for Know Me Payload Resolution:
1. Precedence & Fallback: Canonical backend keys take precedence; empty keys fall back to frontend aliases.
2. Values Normalization & Set Determinism: Normalizes lists/tuples (preserving order) and sets (sorting alphabetically).
3. Semantic Query Preservation: Asserts exact component wording, ordering, and empty-profile fallback.
4. Flow-State Rationale: Asserts 'why_it_fits' rationale populates for flow-state inputs.
5. Canonical vs Frontend Parity: Asserts 100% identical top-5 ranking, scores, and rationale between schemas.
6. Baseline Deal-Breaker Penalty: Asserts title presence, exact -0.300000 deduction on targets, and 0.000000 on control.
"""

import os
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import matcher
from matcher import _resolve_text, _resolve_values, build_semantic_query, hybrid_career_match


def test_precedence_and_fallback():
    print("[TEST 1] Precedence and Fallback Resolution")

    # 1.1 Canonical takes precedence when both are provided
    assert _resolve_text(
        {"energy_flow": "CANONICAL_FLOW", "energy_source": "ALIAS_FLOW"},
        "energy_flow", "energy_source"
    ) == "CANONICAL_FLOW"

    assert _resolve_text(
        {"envy_compass": "CANONICAL_ENVY", "secret_curiosity": "ALIAS_ENVY"},
        "envy_compass", "secret_curiosity"
    ) == "CANONICAL_ENVY"

    assert _resolve_values(
        {"core_values": ["CANONICAL_VAL"], "values": ["ALIAS_VAL"]}
    ) == "CANONICAL_VAL"

    # 1.2 Fallback takes over when canonical is empty, whitespace, or empty list
    assert _resolve_text(
        {"energy_flow": "   ", "energy_source": "ALIAS_FLOW"},
        "energy_flow", "energy_source"
    ) == "ALIAS_FLOW"

    assert _resolve_text(
        {"envy_compass": "", "secret_curiosity": "ALIAS_ENVY"},
        "envy_compass", "secret_curiosity"
    ) == "ALIAS_ENVY"

    assert _resolve_values(
        {"core_values": [], "values": ["ALIAS_VAL"]}
    ) == "ALIAS_VAL"

    assert _resolve_values(
        {"core_values": "   ", "values": ["ALIAS_VAL"]}
    ) == "ALIAS_VAL"

    # 1.3 Alias used alone
    assert _resolve_text(
        {"energy_source": "Deep solitary focus"},
        "energy_flow", "energy_source"
    ) == "Deep solitary focus"

    assert _resolve_text(
        {"secret_curiosity": "Product designers"},
        "envy_compass", "secret_curiosity"
    ) == "Product designers"

    assert _resolve_values(
        {"values": ["Creativity", "Social impact"]}
    ) == "Creativity, Social impact"

    print("  PASS: Precedence and fallback behavior verified.")


def test_values_normalization_and_set_determinism():
    print("\n[TEST 2] Values Type Normalization & Set Determinism")

    # Order preservation for lists and tuples
    assert _resolve_values({"values": ["Z_Value", "A_Value", "M_Value"]}) == "Z_Value, A_Value, M_Value"
    assert _resolve_values({"values": ("Z_Value", "A_Value", "M_Value")}) == "Z_Value, A_Value, M_Value"

    # Deterministic alphabetical sorting for sets (eliminates hash-seed jitter across sessions)
    assert _resolve_values({"values": {"Z_Value", "A_Value", "M_Value"}}) == "A_Value, M_Value, Z_Value"

    # Single string
    assert _resolve_values({"values": "Creativity, Autonomy"}) == "Creativity, Autonomy"

    # Dirty list containing empty strings, None, numbers, and dicts
    dirty_input = {"values": ["Creativity", "", "   ", None, 42, {"invalid": 1}, "Autonomy"]}
    assert _resolve_values(dirty_input) == "Creativity, Autonomy"

    # Unexpected objects must not be converted into misleading text strings
    assert _resolve_values({"values": {"nested": "dict"}}) == ""
    assert _resolve_values({"values": 12345}) == ""
    assert _resolve_values({"values": True}) == ""
    assert _resolve_values({"values": None}) == ""
    assert _resolve_values({"values": []}) == ""
    assert _resolve_values({"values": ["   ", None]}) == ""

    # Text fields safety against non-string types
    assert _resolve_text({"energy_flow": 123}, "energy_flow", "energy_source") == ""
    assert _resolve_text({"energy_source": ["invalid", "list"]}, "energy_flow", "energy_source") == ""
    assert _resolve_text({"envy_compass": {"dict": True}}, "envy_compass", "secret_curiosity") == ""

    print("  PASS: Safe normalization, set determinism, and invalid type handling verified.")


def test_semantic_query_inclusion_and_order():
    print("\n[TEST 3] Semantic Query Construction, Order & Fallback")

    # Empty profile fallback
    assert build_semantic_query() == "Motivated college student seeking rewarding career opportunities"
    assert build_semantic_query(know_me={}) == "Motivated college student seeking rewarding career opportunities"

    # Frontend payload representation
    frontend_payload = {
        "values": ["Creativity", "Independence"],
        "energy_source": "Brainstorming and making something visually or conceptually new",
        "secret_curiosity": "Content creators, writers, & creative directors",
    }
    q = build_semantic_query(
        free_text="I want to design compelling media",
        interests=["Design & Creativity"],
        resume_skills=["Figma", "Storyboarding"],
        know_me=frontend_payload,
    )

    expected_components = [
        "Student goal: I want to design compelling media",
        "Interests and passions: Design & Creativity",
        "Technical & domain skills: Figma, Storyboarding",
        "Natural flow state and deep work: Brainstorming and making something visually or conceptually new",
        "Role models and admired work: Content creators, writers, & creative directors",
        "Core workplace values: Creativity, Independence",
    ]

    for comp in expected_components:
        assert comp in q, f"Missing expected query component: {comp}"

    assert q == ". ".join(expected_components)
    print("  PASS: Semantic query preserves all components, exact phrasing, and order.")


def test_flow_state_rationale_population():
    print("\n[TEST 4] Flow-State Rationale Population in 'why_it_fits'")
    matcher._load_engine()

    profile_base = {
        "riasec_scores": {"R": 50.0, "I": 50.0, "A": 10.0, "S": 10.0, "E": 10.0, "C": 10.0},
        "interests": [],
        "resume_skills": [],
        "free_text": "creative audio",
    }

    # Case A: Frontend alias 'energy_source' provided
    res_with_source = hybrid_career_match(
        riasec_scores=profile_base["riasec_scores"],
        interests=profile_base["interests"],
        resume_skills=profile_base["resume_skills"],
        free_text=profile_base["free_text"],
        know_me={"energy_source": "Brainstorming visuals"},
        limit=25,
    )

    # Case B: Backend canonical 'energy_flow' provided
    res_with_flow = hybrid_career_match(
        riasec_scores=profile_base["riasec_scores"],
        interests=profile_base["interests"],
        resume_skills=profile_base["resume_skills"],
        free_text=profile_base["free_text"],
        know_me={"energy_flow": "Brainstorming visuals"},
        limit=25,
    )

    # Case C: No flow or energy source provided
    res_no_flow = hybrid_career_match(
        riasec_scores=profile_base["riasec_scores"],
        interests=profile_base["interests"],
        resume_skills=profile_base["resume_skills"],
        free_text=profile_base["free_text"],
        know_me={},
        limit=25,
    )

    flow_phrase = "Provides tasks that support your preferred deep focus flow state"
    has_rationale_source = any(flow_phrase in c["why_it_fits"] for c in res_with_source)
    has_rationale_flow = any(flow_phrase in c["why_it_fits"] for c in res_with_flow)
    has_rationale_none = any(flow_phrase in c["why_it_fits"] for c in res_no_flow)

    assert has_rationale_source is True, "energy_source failed to trigger flow rationale"
    assert has_rationale_flow is True, "energy_flow failed to trigger flow rationale"
    assert has_rationale_none is False, "flow rationale populated when flow was absent"

    print("  PASS: Flow-state rationale activates for both frontend and backend inputs.")


def test_schema_parity_and_flow_state():
    print("\n[TEST 5] Deterministic Retrieval Parity Between Canonical and Frontend Schemas")
    matcher._load_engine()

    riasec = {"A": 92.0, "S": 60.0, "E": 45.0, "I": 35.0, "R": 25.0, "C": 10.0}
    interests = ["Music", "Performing Arts"]
    skills = ["Singing", "Music Composition"]
    note = "I enjoy singing and creative work."

    canonical_know_me = {
        "core_values": ["Creativity", "Artistic freedom"],
        "energy_flow": "Singing and composing music",
        "envy_compass": "Musicians & creative directors",
        "deal_breakers": ["repetitive paperwork"],
    }

    frontend_know_me = {
        "values": ["Creativity", "Artistic freedom"],
        "energy_source": "Singing and composing music",
        "secret_curiosity": "Musicians & creative directors",
        "deal_breakers": ["repetitive paperwork"],
    }

    res_canonical = hybrid_career_match(
        riasec_scores=riasec,
        interests=interests,
        resume_skills=skills,
        free_text=note,
        know_me=canonical_know_me,
        limit=5,
    )

    res_frontend = hybrid_career_match(
        riasec_scores=riasec,
        interests=interests,
        resume_skills=skills,
        free_text=note,
        know_me=frontend_know_me,
        limit=5,
    )

    titles_c = [c["title"] for c in res_canonical]
    titles_f = [c["title"] for c in res_frontend]
    assert titles_c == titles_f, f"Titles mismatch: {titles_c} vs {titles_f}"

    for i in range(len(res_canonical)):
        score_c = res_canonical[i]["score"]
        score_f = res_frontend[i]["score"]
        assert abs(score_c - score_f) < 1e-5, f"Score mismatch at rank {i+1}: {score_c} vs {score_f}"
        assert res_canonical[i]["why_it_fits"] == res_frontend[i]["why_it_fits"]

    print("  PASS: 100% parity verified between canonical backend keys and frontend aliases.")


def test_dealbreaker_penalty_baseline():
    print("\n[TEST 6] Existing Deal-Breaker Penalty Baseline Regression")
    matcher._load_engine()

    base_riasec = {"A": 92.0, "S": 60.0, "E": 45.0, "I": 35.0, "R": 25.0, "C": 10.0}
    base_interests = ["Music", "Performing Arts"]
    base_skills = ["Singing", "Music Composition"]
    base_free_text = "I enjoy singing and creative work."

    # Baseline Profile A: No dealbreakers
    res_a = matcher.hybrid_career_match(
        riasec_scores=base_riasec,
        interests=base_interests,
        resume_skills=base_skills,
        free_text=base_free_text,
        know_me={"values": ["Creativity"], "deal_breakers": []},
        limit=1016,
    )

    # Baseline Profile B: Paperwork dealbreaker present
    res_b = matcher.hybrid_career_match(
        riasec_scores=base_riasec,
        interests=base_interests,
        resume_skills=base_skills,
        free_text=base_free_text,
        know_me={"values": ["Creativity"], "deal_breakers": ["repetitive paperwork"]},
        limit=1016,
    )

    # Baseline Profile C: Dealbreaker removed (reversibility check)
    res_c = matcher.hybrid_career_match(
        riasec_scores=base_riasec,
        interests=base_interests,
        resume_skills=base_skills,
        free_text=base_free_text,
        know_me={"values": ["Creativity"], "deal_breakers": []},
        limit=1016,
    )

    scores_a = {c["title"]: c["score"] for c in res_a}
    scores_b = {c["title"]: c["score"] for c in res_b}
    scores_c = {c["title"]: c["score"] for c in res_c}

    paperwork_targets = ["Data Entry Keyers", "Office Clerks, General", "Word Processors and Typists"]
    control_title = "Musicians and Singers"
    all_expected_titles = paperwork_targets + [control_title]

    # Explicit existence check before indexing scores
    missing_a = [t for t in all_expected_titles if t not in scores_a]
    missing_b = [t for t in all_expected_titles if t not in scores_b]
    missing_c = [t for t in all_expected_titles if t not in scores_c]

    assert not missing_a, f"Expected titles missing from baseline results (Profile A): {missing_a}"
    assert not missing_b, f"Expected titles missing from penalized results (Profile B): {missing_b}"
    assert not missing_c, f"Expected titles missing from restored results (Profile C): {missing_c}"

    # 1. Penalized target careers must receive exactly -0.300000 deduction
    for title in paperwork_targets:
        diff = scores_b[title] - scores_a[title]
        assert abs(diff - (-0.30)) < 1e-5, f"{title} penalty diff was {diff:.6f}, expected -0.300000"
        assert abs(scores_c[title] - scores_a[title]) < 1e-5, f"{title} score not restored on removal"

    # 2. Control career without paperwork tasks must receive 0.000000 deduction
    control_diff = scores_b[control_title] - scores_a[control_title]
    assert abs(control_diff - 0.0) < 1e-5, f"{control_title} diff was {control_diff:.6f}, expected 0.000000"
    assert abs(scores_c[control_title] - scores_a[control_title]) < 1e-5, f"{control_title} score changed on removal"

    print("  PASS: Deal-breaker penalty math (existence confirmed, -0.300000 target deduction, 0.000000 control, 100% reversibility) verified.")


def run_all_tests():
    print("=" * 70)
    print("RUNNING DETERMINISTIC KNOW ME RESOLUTION TESTS")
    print("=" * 70)
    test_precedence_and_fallback()
    test_values_normalization_and_set_determinism()
    test_semantic_query_inclusion_and_order()
    test_flow_state_rationale_population()
    test_schema_parity_and_flow_state()
    test_dealbreaker_penalty_baseline()
    print("\n" + "=" * 70)
    print("ALL DETERMINISTIC RESOLUTION TESTS PASSED (100%)")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
