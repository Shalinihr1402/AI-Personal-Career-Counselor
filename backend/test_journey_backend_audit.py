"""
Backend Journey Audit Test Suite
Verifies:
1. Assessment scoring and RIASEC question retrieval.
2. Career matching with full profile (interests, know_me, resume_skills).
3. Scenario 10: Missing optional resume data (resume_skills empty list) functions seamlessly.
4. Scenario 11: AI failure or rate limiting gracefully falls back to hybrid_vector / rule matcher.
5. Scenario 12: Skill-gap analysis (/api/skill-gap) calculates readiness, matched/missing skills for confirmed goals.
"""

import os
import sys
import json

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

from fastapi.testclient import TestClient
from main import app
import main

client = TestClient(app)

def run_backend_audit():
    print("======================================================================")
    print("RUNNING BACKEND STUDENT JOURNEY AUDIT TEST SUITE")
    print("======================================================================\n")

    # 1. RIASEC Questions Endpoint
    print("[AUDIT 1] Assessment Questions Endpoint (/api/assessment/questions)")
    resp = client.get("/api/assessment/questions")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    q_data = resp.json()
    assert "questions" in q_data and len(q_data["questions"]) > 0, "Questions list must not be empty"
    assert "scale" in q_data and len(q_data["scale"]) > 0, "Scale list must not be empty"
    print(f"  PASS: Loaded {len(q_data['questions'])} RIASEC questions with {len(q_data['scale'])} rating scale options.\n")

    # 2. Assessment Scoring Endpoint
    print("[AUDIT 2] Assessment Scoring Endpoint (/api/assessment/score)")
    sample_answers = {str(q["id"]): 4 for q in q_data["questions"]}
    resp = client.post("/api/assessment/score", json={"answers": sample_answers})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    score_data = resp.json()
    assert "scores" in score_data, "Scores must be returned"
    assert "code" in score_data and len(score_data["code"]) == 3, "RIASEC 3-letter code must be returned"
    print(f"  PASS: Scoring calculated code '{score_data['code']}' with scores {score_data['scores']}.\n")

    # 3. Career Matching with Full Profile
    print("[AUDIT 3] Career Matching with Full Profile (/api/career-match)")
    full_payload = {
        "riasec_scores": score_data["scores"],
        "code": score_data["code"],
        "interests": ["Technology & Computer Science", "Data Science & AI"],
        "resume_skills": ["Python", "SQL", "Machine Learning", "Git"],
        "strengths_note": "I love analyzing data patterns and writing backend code.",
        "work_style": {"people_vs_data": "b", "build_vs_analyze": "b"},
        "know_me": {
            "values": ["Continuous learning", "Analytical rigor"],
            "energy_source": "Solving complex algorithm problems",
            "secret_curiosity": "Deep neural networks",
            "deal_breakers": ["repetitive paperwork"]
        }
    }
    resp = client.post("/api/career-match", json=full_payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    match_data = resp.json()
    assert "matches" in match_data and len(match_data["matches"]) > 0, "Matches must be returned"
    assert "source" in match_data, "Source must be present"
    top_match = match_data["matches"][0]
    print(f"  PASS: Returned {len(match_data['matches'])} matches (source: '{match_data['source']}'). Top match: '{top_match['title']}' ({top_match.get('fit', 'N/A')}% fit).\n")

    # 4. Scenario 10: Missing Optional Resume Data
    print("[AUDIT 4] Scenario 10: Missing Optional Resume Data (Empty resume_skills)")
    no_resume_payload = {
        "riasec_scores": score_data["scores"],
        "code": score_data["code"],
        "interests": ["Healthcare & Medicine"],
        "resume_skills": [],  # Optional resume not provided
        "strengths_note": "",
        "work_style": {},
        "know_me": {
            "values": ["Helping people"],
            "energy_source": "Patient care and clinical teamwork",
            "deal_breakers": []
        }
    }
    resp = client.post("/api/career-match", json=no_resume_payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    no_resume_data = resp.json()
    assert "matches" in no_resume_data and len(no_resume_data["matches"]) > 0, "Matches must succeed even without resume"
    print(f"  PASS: Successfully produced {len(no_resume_data['matches'])} matches without resume upload (Top: '{no_resume_data['matches'][0]['title']}').\n")

    # 5. Scenario 11: AI Failure / Rate Limiting Fallback to Hybrid Matcher
    print("[AUDIT 5] Scenario 11: AI Failure / Rate Limiting Fallback")
    orig_ai = main._ai_career_match
    try:
        # Simulate AI API failure / rate-limit exhaustion returning None
        main._ai_career_match = lambda profile: None

        resp = client.post("/api/career-match", json=full_payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        fallback_data = resp.json()
        assert fallback_data["source"] in ("hybrid_vector", "rule"), f"Expected hybrid_vector/rule fallback, got {fallback_data['source']}"
        assert len(fallback_data["matches"]) > 0, "Fallback matcher must return matches"
        print(f"  PASS: AI failure cleanly fell back to '{fallback_data['source']}' with {len(fallback_data['matches'])} recommendations.\n")
    finally:
        main._ai_career_match = orig_ai

    # 6. Scenario 12: Skill-Gap Analysis Endpoint for Confirmed Career Goal
    print("[AUDIT 6] Scenario 12: Skill-Gap Analysis for Confirmed Career (/api/skill-gap)")
    skill_gap_payload = {
        "career_slug": "software-developers",
        "student_skills": ["Python", "SQL", "Git"]
    }
    resp = client.post("/api/skill-gap", json=skill_gap_payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    gap_data = resp.json()
    assert "readiness_score" in gap_data, "Readiness score must be returned"
    assert "matched_skills" in gap_data, "Matched skills must be present"
    assert "missing_skills" in gap_data, "Missing skills must be present"
    assert "learning_recommendations" in gap_data, "Learning recommendations must be present"
    print(f"  PASS: Skill gap for '{gap_data['career_title']}' calculated readiness score {gap_data['readiness_score']}% (Matched: {len(gap_data['matched_skills'])}, Missing: {len(gap_data['missing_skills'])}).\n")

    print("======================================================================")
    print("ALL 6 BACKEND AUDIT TESTS PASSED (100%)")
    print("======================================================================")

if __name__ == "__main__":
    run_backend_audit()
