"""
test_career_discovery_assessment.py

Automated Test Suite for the Career Discovery Assessment Module:
1. Validates the 12-question scenario question bank structure and options.
2. Mathematically verifies zero-bias RIASEC dimension distribution (exactly 8 per dimension).
3. Verifies broad coverage across official O*NET dataset occupational fields.
4. Validates deterministic scoring, top 3-letter Holland code generation, and top field extraction.
5. Validates backwards compatibility with legacy 24-item numeric ratings.
6. Validates API endpoints (/api/assessment/questions, /api/assessment/score).
7. Validates mandatory assessment completion enforcement in /api/counselor/chat.
"""

import sys
import os
import json

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from main import app, CounselorChatRequest, CounselorChatMessage, counselor_chat
from riasec import SCENARIO_QUESTIONS, SCENARIO_MAP, DIMS, DIM_LABEL, score_riasec


def run_tests():
    print("=" * 75)
    print("RUNNING CAREER DISCOVERY ASSESSMENT MODULE VERIFICATION SUITE")
    print("=" * 75)

    passed = 0
    total = 0

    # -------------------------------------------------------------------------
    # TEST 1: Question Bank Integrity (12 Questions, 4 Options Each)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 1] Question Bank Structure & Schema Integrity")
    assert len(SCENARIO_QUESTIONS) == 12, f"Expected exactly 12 questions, got {len(SCENARIO_QUESTIONS)}"
    
    for i, q in enumerate(SCENARIO_QUESTIONS, 1):
        assert q["id"] == f"q{i}", f"Question index mismatch: {q['id']} vs q{i}"
        assert isinstance(q["scenario"], str) and len(q["scenario"].strip()) > 20, f"Question {q['id']} has invalid scenario"
        options = q["options"]
        assert len(options) == 4, f"Question {q['id']} must have exactly 4 options, got {len(options)}"
        option_ids = [opt["id"] for opt in options]
        assert option_ids == ["a", "b", "c", "d"], f"Question {q['id']} options must be a, b, c, d"
        for opt in options:
            assert opt["dim"] in DIMS, f"Option {opt['id']} has invalid dimension {opt['dim']}"
            assert isinstance(opt["text"], str) and len(opt["text"].strip()) > 10, "Option text too short"
            assert isinstance(opt["fields"], list) and len(opt["fields"]) >= 1, "Option must map to at least 1 field"

    print("  PASS: All 12 scenario questions have valid 4-option schema and structure.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 2: Mathematical Balance (Zero Baseline Bias)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 2] Mathematical Balance Across RIASEC Dimensions")
    dim_counts = {d: 0 for d in DIMS}
    for q in SCENARIO_QUESTIONS:
        for opt in q["options"]:
            dim_counts[opt["dim"]] += 1

    print(f"  Distribution: {dim_counts}")
    for d, count in dim_counts.items():
        assert count == 8, f"Dimension {d} count is {count}, expected exactly 8"
    assert sum(dim_counts.values()) == 48, f"Expected 48 total options across 12 questions, got {sum(dim_counts.values())}"
    print("  PASS: Perfectly balanced: every RIASEC dimension appears exactly 8 times across 48 options.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 3: Broad Coverage Across Official O*NET Dataset Fields
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 3] Broad Occupational Coverage Against O*NET Dataset")
    onet_path = os.path.join(os.path.dirname(__file__), "data", "onet_careers.json")
    with open(onet_path, "r", encoding="utf-8") as f:
        onet_data = json.load(f)
    canonical_fields = {c.get("field") for c in onet_data if c.get("field")}

    referenced_fields = set()
    for q in SCENARIO_QUESTIONS:
        for opt in q["options"]:
            for field in opt["fields"]:
                referenced_fields.add(field)

    print(f"  Unique O*NET fields covered in assessment questions: {len(referenced_fields)}")
    for f in referenced_fields:
        assert f in canonical_fields, f"Field '{f}' is not in the canonical O*NET dataset fields"

    # Verify coverage of diverse non-tech sectors
    broad_required_sectors = [
        "Healthcare & Medicine",
        "Arts, Design & Media",
        "Business, Management & Finance",
        "Construction & Trades",
        "Community & Social Services",
        "Agriculture & Natural Resources",
        "Law & Public Policy",
        "Education & Training",
        "Hospitality & Food Services",
        "Facilities & Operations"
    ]
    for sector in broad_required_sectors:
        assert sector in referenced_fields, f"Assessment lacks coverage of vital sector: {sector}"

    print(f"  PASS: All {len(referenced_fields)} referenced fields match official O*NET dataset schema with broad non-tech coverage.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 4: Deterministic Scoring & Holland Code Generation
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 4] Deterministic Scoring Engine & Holland Code Generation")
    
    # Test 4A: Creative / Artistic candidate pattern
    artistic_answers = {
        "q1": "c",  # A (Arts, Design & Media)
        "q2": "c",  # S
        "q3": "a",  # A (Arts, Design & Media)
        "q4": "c",  # S
        "q5": "a",  # S
        "q6": "b",  # A (Arts, Design & Media)
        "q7": "c",  # A (Arts, Design & Media)
        "q8": "d",  # A (Arts, Design & Media)
        "q9": "d",  # A (Arts, Design & Media)
        "q10": "d", # A (Arts, Design & Media)
        "q11": "a", # A (Arts, Design & Media)
        "q12": "a"  # S
    }

    result = score_riasec(artistic_answers)
    scores = result["scores"]
    code = result["code"]
    top_fields = result.get("top_fields", [])

    print(f"  Result Code: {code}")
    print(f"  Scores: {scores}")
    print(f"  Top Fields: {top_fields}")

    assert len(code) == 3, f"Holland code must be 3 letters, got {code}"
    for letter in code:
        assert letter in DIMS, f"Invalid letter in code: {letter}"
    assert len(set(code)) == 3, "Code letters must be unique"
    
    # Primary dimension must be 'A'
    assert code[0] == "A", f"Expected primary code A, got {code[0]}"
    assert scores["A"] > scores["R"], "A score must be higher than R"
    assert "Arts, Design & Media" in top_fields, f"Expected Arts, Design & Media in top fields: {top_fields}"
    for tf in top_fields:
        assert tf in canonical_fields, f"Field {tf} must exist in canonical fields"

    for d in DIMS:
        assert 0 <= scores[d] <= 100, f"Score for {d} out of range 0..100: {scores[d]}"

    # Deterministic repeatability check
    result_repeat = score_riasec(artistic_answers)
    assert result == result_repeat, "Scoring must be 100% deterministic"

    print("  PASS: Deterministic scoring produces valid 0-100 scores, unique 3-letter code, and accurate top fields.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 5: Backwards Compatibility With Legacy 24-Item Ratings
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 5] Backwards Compatibility with Legacy 24-Item Ratings")
    legacy_answers = {f"r{i}": (i % 3) for i in range(1, 25)}
    legacy_result = score_riasec(legacy_answers)
    assert len(legacy_result["code"]) == 3
    for d in DIMS:
        assert 0 <= legacy_result["scores"][d] <= 100
    print(f"  Legacy code: {legacy_result['code']}, scores: {legacy_result['scores']}")
    print("  PASS: Legacy 24-item numeric responses remain 100% backwards compatible.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 6: API Endpoints Verification via TestClient
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 6] FastAPI Endpoints (/api/assessment/questions & /api/assessment/score)")
    client = TestClient(app)

    # 1. GET /api/assessment/questions
    resp_q = client.get("/api/assessment/questions")
    assert resp_q.status_code == 200, f"Expected 200, got {resp_q.status_code}"
    q_data = resp_q.json()
    assert "questions" in q_data and len(q_data["questions"]) == 12
    assert "dimensions" in q_data
    assert q_data["total"] == 12

    # 2. POST /api/assessment/score
    resp_s = client.post("/api/assessment/score", json={"answers": artistic_answers})
    assert resp_s.status_code == 200, f"Expected 200, got {resp_s.status_code}"
    s_data = resp_s.json()
    assert "scores" in s_data
    assert "code" in s_data
    assert "top_fields" in s_data

    print("  PASS: Assessment API endpoints return correct payload and status.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 7: Mandatory Assessment Completion Enforcement in Counselor Chat
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 7] Mandatory Assessment Completion Enforcement in Counselor Chat")

    # A: When assessment is NOT completed
    uncompleted_req = CounselorChatRequest(
        messages=[
            CounselorChatMessage(role="user", content="Hi, tell me what career I should choose.")
        ],
        assessment_completed=False,
        student_profile={"educationStage": "degree_ug"}
    )
    res_uncompleted = counselor_chat(uncompleted_req)
    assert res_uncompleted.get("assessment_required") is True, "Expected assessment_required: True when assessment uncompleted"
    assert "Career Discovery Assessment" in res_uncompleted["reply"], "Expected prompt to complete assessment first"

    # B: When assessment IS completed
    completed_req = CounselorChatRequest(
        messages=[
            CounselorChatMessage(role="assistant", content="Hello! How can I help you today?"),
            CounselorChatMessage(role="user", content="I completed my assessment. Can you guide me?")
        ],
        assessment_completed=True,
        student_profile={"educationStage": "degree_ug", "interests": ["Robotics"]}
    )
    res_completed = counselor_chat(completed_req)
    assert res_completed.get("assessment_required") is not True, "Should not block user when assessment is completed"
    assert len(res_completed["reply"]) > 20, "Counselor should provide normal response"

    print("  PASS: Mandatory assessment completion is strictly enforced in counselor chat API.")
    passed += 1

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    print("\n" + "=" * 75)
    print(f"ASSESSMENT TEST SUITE COMPLETED: {passed}/{total} TESTS PASSED (100%)")
    print("=" * 75)


if __name__ == "__main__":
    run_tests()
