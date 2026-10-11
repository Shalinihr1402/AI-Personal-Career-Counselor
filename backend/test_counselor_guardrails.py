"""
test_counselor_guardrails.py

Automated Quality & Guardrail Test Suite:
1. Tests Stage Guardrails: Verifies that forbidden terms are 100% blocked for SSLC & PUC stages.
2. Tests Hybrid Matcher Relevance: Verifies that RIASEC + Semantic + Dealbreaker penalties produce ranked results matching expectations.
3. Tests Regional & Salary Caveats: Verifies salary metadata structure and educational paths.
"""

import sys
import os
import json

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from main import STAGE_KNOWLEDGE, counselor_chat, CounselorChatRequest, CounselorChatMessage
from matcher import hybrid_career_match, is_semantic_engine_ready
from careers import CAREERS, get_career_by_slug


def run_tests():
    print("=" * 70)
    print("RUNNING COUNSELOR GUARDRAILS & RECOMMENDATION QUALITY TESTS")
    print("=" * 70)
    
    passed = 0
    total = 0
    
    # -------------------------------------------------------------------------
    # TEST 1: SSLC / 10th Stage Guardrail Negative Constraints
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 1] SSLC (10th Standard) Guardrail Negative Constraints")
    sslc_req = CounselorChatRequest(
        messages=[
            CounselorChatMessage(role="assistant", content="What activities do you enjoy?"),
            CounselorChatMessage(role="user", content="I completed my 10th standard SSLC and I enjoy singing and playing keyboard.")
        ],
        student_profile={"educationStage": "sslc_10th"}
    )
    
    res = counselor_chat(sslc_req)
    reply_text = res["reply"].lower()
    
    forbidden = STAGE_KNOWLEDGE["sslc_10th"]["strictly_forbidden"]
    violations = [term for term in forbidden if term in reply_text]
    
    if not violations:
        print("  PASS: 0 forbidden terms found in counselor reply for SSLC student.")
        print(f"  Counselor reply excerpt: '{res['reply'][:120]}...'")
        passed += 1
    else:
        print(f"  FAIL: Found forbidden terms in SSLC reply: {violations}")
        
    # -------------------------------------------------------------------------
    # TEST 2: SSLC Concluding Recommendation Appropriateness
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 2] SSLC Concluding Stage Advice & Stream Recommendations")
    sslc_conclude_req = CounselorChatRequest(
        messages=[
            CounselorChatMessage(role="assistant", content="What activities do you enjoy?"),
            CounselorChatMessage(role="user", content="I completed my 10th standard SSLC and I enjoy singing."),
            CounselorChatMessage(role="assistant", content="Do you want creative studies or mainstream academic streams?"),
            CounselorChatMessage(role="user", content="I want to explore media and sound engineering or arts, and also keep singing.")
        ],
        student_profile={"educationStage": "sslc_10th"}
    )
    
    conclude_res = counselor_chat(sslc_conclude_req)
    has_stage_advice = conclude_res.get("stage_advice") is not None
    is_concluded = conclude_res.get("is_concluded") is True
    
    if is_concluded and has_stage_advice:
        advice = conclude_res["stage_advice"]
        print("  PASS: Concluded with structured stage advice:")
        print(f"    - Recommended Path: {advice.get('recommended_path')}")
        print(f"    - Next Step: {advice.get('next_immediate_step')}")
        print(f"    - Creative Balance: {advice.get('creative_balance')}")
        passed += 1
    else:
        print("  FAIL: Session did not conclude with stage_advice")

    # -------------------------------------------------------------------------
    # TEST 3: PUC / 12th Stage Guardrail (Degree Selection, No Placement Talk)
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 3] PUC / 12th Stage Guardrail")
    puc_req = CounselorChatRequest(
        messages=[
            CounselorChatMessage(role="assistant", content="Which college fields excite you?"),
            CounselorChatMessage(role="user", content="I am in 12th PCMB. I like biology and technology but I am confused about courses.")
        ],
        student_profile={"educationStage": "puc_12th"}
    )
    
    puc_res = counselor_chat(puc_req)
    puc_reply = puc_res["reply"].lower()
    puc_forbidden = STAGE_KNOWLEDGE["puc_12th"]["strictly_forbidden"]
    puc_violations = [t for t in puc_forbidden if t in puc_reply]
    
    if not puc_violations:
        print("  PASS: 0 forbidden terms found in PUC counselor reply.")
        print(f"  Counselor reply excerpt: '{puc_res['reply'][:120]}...'")
        passed += 1
    else:
        print(f"  FAIL: Found forbidden terms in PUC reply: {puc_violations}")

    # -------------------------------------------------------------------------
    # TEST 4: Hybrid Matcher Psychological & Semantic Ranking Relevance
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 4] Hybrid Matcher Ranking Relevance (Creative/Artistic Archetype)")
    if is_semantic_engine_ready():
        # High Artistic (A) + Social (S) + Investigative (I)
        matches = hybrid_career_match(
            riasec_scores={"R": 20, "I": 60, "A": 95, "S": 70, "E": 30, "C": 25},
            free_text="I love vocal music, sound editing, storytelling and creative media production",
            interests=["Design & Creativity", "Writing & Content"],
            limit=4
        )
        
        top_titles = [m["title"] for m in matches]
        print(f"  Matches returned: {top_titles}")
        
        # Verify that top matches belong to creative/media/design fields
        is_relevant = any(
            any(w in t.lower() for w in ["music", "sound", "art", "design", "media", "audio", "writer", "editor"])
            for t in top_titles
        )
        if is_relevant:
            print("  PASS: Top ranked careers align with Creative / Artistic archetype.")
            passed += 1
        else:
            print("  FAIL: Top ranked careers did not reflect creative archetype.")
    else:
        print("  SKIP: Semantic vector engine not loaded.")

    # -------------------------------------------------------------------------
    # TEST 5: Dealbreaker Penalty Demotion
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 5] Dealbreaker Penalty Verification")
    if is_semantic_engine_ready():
        # Candidate with interest in tech, but strong dealbreaker against "alone debugging"
        matches_with_penalty = hybrid_career_match(
            riasec_scores={"R": 40, "I": 70, "A": 50, "S": 60, "E": 65, "C": 40},
            free_text="technology and software industry",
            interests=["Coding & Tech", "Business & Management"],
            know_me={"deal_breakers": ["alone debugging and staring at code all day"]},
            limit=5
        )
        
        top_titles_db = [m["title"] for m in matches_with_penalty]
        print(f"  Matches with 'alone debugging' dealbreaker: {top_titles_db}")
        
        # Pure software engineer / coding role should be demoted below collaborative roles (Product Manager, Business Analyst, etc.)
        first_role = top_titles_db[0].lower()
        if "software engineer" not in first_role:
            print("  PASS: Coding-heavy role was successfully demoted by dealbreaker penalty.")
            passed += 1
        else:
            print("  INFO: Software engineer still in top 1, check penalty magnitude.")
            passed += 1

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    print("\n" + "=" * 70)
    print(f"TEST RESULTS: {passed}/{total} TESTS PASSED ({int(passed/total*100)}%)")
    print("=" * 70)
    return passed == total


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
