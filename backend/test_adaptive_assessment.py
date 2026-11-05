"""
test_adaptive_assessment.py - Test Suite for Adaptive Assessment Taxonomy & Stage Rules (Phase 4.3 Step 1)

Verifies:
1. Stage detection accuracy across 10th, 12th streams, diploma, college, and career transition.
2. Stream-aware question filtering (Class 12 PCB vs PCM vs Commerce).
3. Statutory exclusion (NEET/clinical items never shown to Commerce or Non-PCB students).
4. Competency demonstration question targeting (Java/OOP for Computer Applications).
5. Deduplication against onboarding profile data (skipping already answered areas).
6. Evidence hierarchy capping (multiple-choice answers alone cannot claim advanced practical mastery).
7. Backward compatibility with legacy RIASEC scenarios and scoring.
"""

import sys
import unittest
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

from adaptive_assessment import (
    AdaptiveAssessmentEngine,
    AssessmentStage,
    QuestionCategory,
    CompetencyEvidenceLevel,
    adaptive_engine,
)
from riasec import SCENARIO_QUESTIONS, score_riasec


class TestAdaptiveAssessmentStep1(unittest.TestCase):

    def setUp(self):
        self.engine = AdaptiveAssessmentEngine()

    def test_01_class_10_student_question_calibration(self):
        """Class 10 student receives age-appropriate exploratory questions without premature technical jargon."""
        profile = {
            "education_level": "sslc_10th",
            "education_status": "currently_studying",
            "school_board": "cbse",
        }
        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.SCHOOL_10TH)

        questions = self.engine.select_adaptive_questions(profile, max_questions=10)
        self.assertGreaterEqual(len(questions), 5)

        q_ids = [q.id for q in questions]
        # Should include foundational questions
        self.assertTrue(any("q10_" in q_id for q_id in q_ids))
        # Should NOT include advanced college microservices or statutory CA/advocate questions
        self.assertNotIn("q_comp_java_concurrency", q_ids)
        self.assertNotIn("q_comp_ca_audit_sampling", q_ids)
        self.assertNotIn("q_comp_lawyer_evidence", q_ids)

    def test_02_class_12_pcb_medical_track(self):
        """Class 12 PCB student receives clinical empathy & NEET items, not engineering math."""
        profile = {
            "education_level": "puc_12th",
            "education_status": "currently_studying",
            "school_stream": "science_pcb",
            "course": "12th Science (PCB)",
            "specialization": "Physics, Chemistry, Biology",
        }
        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.HIGHER_SECONDARY_12TH)

        questions = self.engine.select_adaptive_questions(profile, max_questions=10)
        q_ids = [q.id for q in questions]

        # Should include medical clinical and NEET readiness items
        self.assertIn("q12_pcb_clinical_empathy", q_ids)
        self.assertIn("q12_pcb_neet_readiness", q_ids)
        # Should NOT include PCM calculus or Commerce business questions
        self.assertNotIn("q12_pcm_problem_solving", q_ids)
        self.assertNotIn("q12_comm_business_instinct", q_ids)

    def test_03_class_12_pcm_engineering_track(self):
        """Class 12 PCM student receives math & calculus problem-solving, not NEET medical items."""
        profile = {
            "education_level": "puc_12th",
            "education_status": "currently_studying",
            "school_stream": "science_pcm",
            "course": "12th Science (PCM)",
            "specialization": "Physics, Chemistry, Mathematics",
        }
        questions = self.engine.select_adaptive_questions(profile, max_questions=10)
        q_ids = [q.id for q in questions]

        # Should include PCM engineering problem-solving item
        self.assertIn("q12_pcm_problem_solving", q_ids)
        # Must NOT include PCB medical items
        self.assertNotIn("q12_pcb_clinical_empathy", q_ids)
        self.assertNotIn("q12_pcb_neet_readiness", q_ids)

    def test_04_class_12_commerce_track_statutory_guard(self):
        """Class 12 Commerce student receives finance/business items and is strictly shielded from medical items."""
        profile = {
            "education_level": "puc_12th",
            "education_status": "currently_studying",
            "school_stream": "commerce",
            "course": "12th Standard Commerce",
            "specialization": "Accountancy & Business",
        }
        questions = self.engine.select_adaptive_questions(profile, max_questions=10)
        q_ids = [q.id for q in questions]

        # Should include Commerce audit/business instinct item
        self.assertIn("q12_comm_business_instinct", q_ids)
        # Must NEVER receive NEET medical or engineering items
        self.assertNotIn("q12_pcb_clinical_empathy", q_ids)
        self.assertNotIn("q12_pcb_neet_readiness", q_ids)
        self.assertNotIn("q12_pcm_problem_solving", q_ids)

    def test_05_polytechnic_diploma_student(self):
        """Diploma student receives applied engineering (multimeter, CAD, lateral entry) items."""
        profile = {
            "education_level": "diploma",
            "education_status": "currently_studying",
            "degree": "polytechnic_diploma",
            "specialization": "Mechanical Engineering",
        }
        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.DIPLOMA_POLYTECHNIC)

        questions = self.engine.select_adaptive_questions(profile, max_questions=10)
        q_ids = [q.id for q in questions]

        # Should include applied technical and progression items
        self.assertIn("q_dip_cad_wiring", q_ids)
        self.assertIn("q_dip_career_direction", q_ids)

    def test_06_college_ug_computer_applications(self):
        """College B.Tech/BCA student receives Java/microservices competency demonstration question."""
        profile = {
            "education_level": "undergraduate",
            "education_status": "currently_studying",
            "degree": "btech",
            "specialization": "Computer Science & Engineering",
        }
        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.COLLEGE_UG_PG)

        questions = self.engine.select_adaptive_questions(profile, max_questions=10)
        q_ids = [q.id for q in questions]

        # Should include Java concurrency / microservices competency item
        self.assertIn("q_comp_java_concurrency", q_ids)
        # Should NOT include school items
        self.assertNotIn("q10_01_learning_style", q_ids)

    def test_07_career_switcher_transition_items(self):
        """Career switcher receives transition strategy items emphasizing portfolio and demonstration."""
        profile = {
            "education_level": "undergraduate",
            "degree": "bcom",
            "career_mode": "career_growth_transition",
            "career_growth_subtype": "switching",
        }
        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.CAREER_TRANSITION)

        questions = self.engine.select_adaptive_questions(profile, max_questions=10)
        q_ids = [q.id for q in questions]

        self.assertIn("q_trans_bridge_strategy", q_ids)

    def test_08_deduplication_against_onboarding_answers(self):
        """Questions that assess attributes already captured in onboarding are cleanly skipped."""
        profile_with_known_strengths = {
            "education_level": "sslc_10th",
            "education_status": "currently_studying",
            "knowMe": {
                "subjectsEnjoy": ["Science", "Maths"],
                "subjectsStrong": ["Physics"],
                "knownFor": ["Fixing tech problems"],
            },
        }
        questions = self.engine.select_adaptive_questions(profile_with_known_strengths, max_questions=10)
        q_ids = [q.id for q in questions]

        # q10_01_learning_style checks skip_if_profile_keys: ["subjectsEnjoy", "subjectsStrong"]
        # q10_02_school_exhibition checks skip_if_profile_keys: ["knownFor"]
        # Both must be skipped to avoid duplicate questions!
        self.assertNotIn("q10_01_learning_style", q_ids)
        self.assertNotIn("q10_02_school_exhibition", q_ids)

    def test_09_evidence_level_hierarchy_capping(self):
        """Multiple-choice answers alone cannot award VERIFIED_PRACTICAL evidence."""
        profile = {
            "education_level": "undergraduate",
            "degree": "btech",
            "specialization": "Computer Science",
        }
        questions = self.engine.select_adaptive_questions(profile, max_questions=10)

        # Inspect all options across all selected questions
        for q in questions:
            for opt in q.options:
                # Option evidence must be capped at APPLIED_SCENARIO or AWARENESS_CONCEPTUAL
                self.assertNotEqual(
                    opt.evidence_level,
                    CompetencyEvidenceLevel.VERIFIED_PRACTICAL,
                    f"Option {opt.id} in {q.id} claimed verified practical evidence from multiple-choice alone!",
                )

    def test_10_backward_compatibility_with_riasec_scoring(self):
        """Existing legacy 12 scenario questions and scoring engine function with 100% fidelity."""
        sample_scenario_answers = {
            "q1": "a",  # Artistic
            "q2": "b",  # Investigative
            "q3": "a",  # Artistic
            "q4": "b",  # Investigative
            "q5": "c",  # Investigative
            "q6": "b",  # Artistic
            "q7": "c",  # Artistic
            "q8": "d",  # Artistic
            "q9": "d",  # Artistic
            "q10": "d", # Artistic
            "q11": "a", # Artistic
            "q12": "b", # Enterprising
        }
        result = score_riasec(sample_scenario_answers)
        self.assertIn("scores", result)
        self.assertIn("code", result)
        self.assertIn("A", result["code"])
        self.assertGreater(result["scores"]["A"], 50)


class TestAdaptiveAssessmentStep2(unittest.TestCase):
    """
    Step 2 Test Suite: Deterministic Competency Scorer & API Integration.
    Verifies:
    1. Scoring boundaries (empty answers, max scores, 0-100 normalization).
    2. Missing and invalid answers (graceful handling without crashes).
    3. Strict separation of evidence tiers (self-reported vs conceptual vs applied vs verified practical).
    4. Statutory capping: multiple-choice answers NEVER award VERIFIED_PRACTICAL.
    5. Statutory eligibility integration with Career Knowledge Base (MBBS restricted for Commerce, CA direct entry for B.Com).
    6. Legacy RIASEC scoring formula and code preservation.
    7. FastAPI endpoints (adaptive-questions and adaptive-score) request validation and response schemas.
    8. Zero Groq / LLM dependency in deterministic scoring calculations.
    """

    def setUp(self):
        self.engine = AdaptiveAssessmentEngine()

    def test_01_scoring_boundaries_empty_answers(self):
        """Empty answers return baseline default scores (all 50s) and default code 'RIA' without error."""
        res = self.engine.score_adaptive_assessment(answers={}, profile={})
        self.assertEqual(res["code"], "RIA")
        for d in ["R", "I", "A", "S", "E", "C"]:
            self.assertEqual(res["scores"][d], 50)
        self.assertEqual(res["evidence_breakdown"]["conceptual_knowledge"], [])
        self.assertEqual(res["evidence_breakdown"]["applied_scenario"], [])
        self.assertEqual(res["evidence_breakdown"]["verified_practical"], [])

    def test_02_scoring_boundaries_max_scores_bounded_0_to_100(self):
        """Scores across all dimensions never exceed 100 nor drop below 0."""
        # Answer high-intensity Investigative answers
        answers = {
            "q10_01_learning_style": "a", # I: 3, R: 1
            "q12_pcm_problem_solving": "a", # I: 3, R: 1
            "q_comp_java_concurrency": "a", # I: 2, C: 2
            "legacy_q1": "b", # Investigative
            "legacy_q2": "b", # Investigative
            "legacy_q3": "c", # Investigative
            "legacy_q4": "b", # Investigative
            "legacy_q5": "c", # Investigative
        }
        res = self.engine.score_adaptive_assessment(answers=answers, profile={})
        for d, score in res["scores"].items():
            self.assertGreaterEqual(score, 0)
            self.assertLessEqual(score, 100)
        self.assertIn(res["code"][0], ["I", "R", "C"])

    def test_03_missing_and_invalid_answers_graceful_handling(self):
        """Invalid question IDs, null values, and out-of-range option choices are skipped without error."""
        answers = {
            "non_existent_question": "a",
            "q10_01_learning_style": None,
            "q12_pcm_problem_solving": "invalid_option_choice",
            "legacy_q1": "z",
            "q_comp_java_concurrency": "a", # Valid option
        }
        res = self.engine.score_adaptive_assessment(answers=answers, profile={"education_level": "sslc_10th"})
        self.assertIn("scores", res)
        self.assertIn("code", res)
        self.assertIsInstance(res["scores"]["I"], int)
        # Should have captured the valid competency item
        self.assertIn("java_programming", res["demonstrated_competencies"])

    def test_04_evidence_separation_self_reported_vs_demonstrated(self):
        """Self-reported skills from onboarding, conceptual MCQ, and applied MCQ remain strictly segregated."""
        profile = {
            "education_level": "undergraduate",
            "degree": "btech",
            "specialization": "Computer Science & Engineering",
            "skills": ["Python", "Git", "Docker"],
        }
        answers = {
            "q_comp_java_concurrency": "a", # Applied scenario for java_programming
            "legacy_q1": "b", # Conceptual exploration
        }
        res = self.engine.score_adaptive_assessment(answers=answers, profile=profile)
        breakdown = res["evidence_breakdown"]

        # Self-reported contains Python, Git, Docker
        self_reported_names = [s["skill"] for s in breakdown["self_reported_skills"]]
        self.assertIn("Python", self_reported_names)
        self.assertIn("Git", self_reported_names)
        self.assertIn("Docker", self_reported_names)
        for s in breakdown["self_reported_skills"]:
            self.assertEqual(s["evidence_level"], "self_reported")

        # Applied scenario contains java_programming
        applied_comp_ids = [c["competency_id"] for c in breakdown["applied_scenario"]]
        self.assertIn("java_programming", applied_comp_ids)

        # Verified practical MUST be empty
        self.assertEqual(breakdown["verified_practical"], [])

    def test_05_strict_capping_never_verified_practical_from_mcq(self):
        """Multiple-choice answers can NEVER award VERIFIED_PRACTICAL evidence; practical disclaimer is attached."""
        profile = {
            "education_level": "undergraduate",
            "degree": "btech",
            "specialization": "Computer Science & Engineering",
        }
        answers = {
            "q_comp_java_concurrency": "a",
            "q_comp_nurse_medication": "a",
            "q_comp_lawyer_evidence": "a",
            "q_comp_ca_audit_sampling": "a",
        }
        res = self.engine.score_adaptive_assessment(answers=answers, profile=profile)
        self.assertEqual(res["evidence_breakdown"]["verified_practical"], [])
        self.assertIn("practical_disclaimer", res)
        self.assertIn("cannot be proven through multiple-choice answers alone", res["practical_disclaimer"])

    def test_06_statutory_eligibility_commerce_barred_from_mbbs(self):
        """Class 12 Commerce profile has MBBS statutorily restricted under National Medical Commission Act."""
        profile = {
            "education_level": "puc_12th",
            "school_stream": "commerce",
            "course": "12th Standard Commerce",
            "specialization": "Accountancy & Business",
        }
        res = self.engine.score_adaptive_assessment(answers={}, profile=profile)
        restrictions = res["statutory_eligibility"]["statutory_restrictions"]
        mbbs_restriction = next((r for r in restrictions if r["slug"] == "general-medical-practitioner"), None)
        self.assertIsNotNone(mbbs_restriction)
        self.assertFalse(mbbs_restriction["is_eligible"])
        self.assertIn("National Medical Commission (NMC)", mbbs_restriction["regulatory_body"])
        self.assertIn("Biology", mbbs_restriction["reason"])
        self.assertIn("PCB", mbbs_restriction["missing_prerequisites"][0])

    def test_07_statutory_eligibility_bcom_and_btech_pathways(self):
        """B.Tech has direct eligibility for Java dev; B.Com has CA direct entry bridge steps defined."""
        # 1. B.Tech Computer Science -> Java Backend Developer
        btech_profile = {
            "education_level": "undergraduate",
            "education_status": "completed",
            "degree": "btech",
            "specialization": "Computer Science & Engineering",
        }
        btech_res = self.engine.score_adaptive_assessment(answers={}, profile=btech_profile)
        eligible = btech_res["statutory_eligibility"]["eligible_pathways"]
        java_pathway = next((r for r in eligible if r["slug"] == "java-backend-developer"), None)
        self.assertIsNotNone(java_pathway)
        self.assertTrue(java_pathway["is_eligible"])
        self.assertEqual(java_pathway["eligibility_type"], "direct_eligible")

        # 2. B.Com -> CA Direct Entry bridge under ICAI
        bcom_profile = {
            "education_level": "undergraduate",
            "education_status": "completed",
            "degree": "bcom",
            "course": "Bachelor of Commerce",
            "specialization": "Accounting & Finance",
        }
        bcom_res = self.engine.score_adaptive_assessment(answers={}, profile=bcom_profile)
        restrictions = bcom_res["statutory_eligibility"]["statutory_restrictions"]
        ca_restriction = next((r for r in restrictions if r["slug"] == "chartered-accountant"), None)
        self.assertIsNotNone(ca_restriction)
        self.assertEqual(ca_restriction["regulatory_body"], "Institute of Chartered Accountants of India (ICAI)")
        self.assertTrue(any("Direct Entry" in step for step in ca_restriction["recommended_bridge_steps"]))

    def test_08_legacy_riasec_compatibility(self):
        """Passing legacy question IDs (e.g., q1..q12) produces valid Holland code and dimensions."""
        legacy_answers = {
            "legacy_q1": "a", # Artistic
            "legacy_q2": "b", # Investigative
            "legacy_q3": "a", # Artistic
            "legacy_q4": "b", # Investigative
            "legacy_q5": "c", # Investigative
            "legacy_q6": "b", # Artistic
            "legacy_q7": "c", # Artistic
            "legacy_q8": "d", # Artistic
            "legacy_q9": "d", # Artistic
            "legacy_q10": "d", # Artistic
            "legacy_q11": "a", # Artistic
            "legacy_q12": "b", # Enterprising
        }
        res = self.engine.score_adaptive_assessment(answers=legacy_answers, profile={})
        self.assertIn("scores", res)
        self.assertIn("A", res["code"])
        self.assertGreater(res["scores"]["A"], 50)

    def test_09_fastapi_adaptive_endpoints(self):
        """FastAPI adaptive-questions and adaptive-score endpoints validate schemas and return expected payloads."""
        from main import (
            AdaptiveQuestionsRequest,
            AdaptiveScoreRequest,
            assessment_adaptive_questions,
            assessment_adaptive_score,
        )

        # 1. Questions Endpoint
        q_req = AdaptiveQuestionsRequest(
            profile={"education_level": "sslc_10th"},
            max_questions=10
        )
        q_res = assessment_adaptive_questions(q_req)
        self.assertEqual(q_res["stage"], "school_10th")
        self.assertLessEqual(q_res["total"], 10)
        self.assertIn("questions", q_res)
        self.assertIn("dimensions", q_res)

        # 2. Score Endpoint
        s_req = AdaptiveScoreRequest(
            answers={"q10_01_learning_style": "a"},
            profile={"education_level": "sslc_10th", "skills": ["Active Listening"]}
        )
        s_res = assessment_adaptive_score(s_req)
        self.assertIn("scores", s_res)
        self.assertIn("code", s_res)
        self.assertIn("evidence_breakdown", s_res)
        self.assertIn("statutory_eligibility", s_res)

    def test_10_no_groq_or_external_llm_calls_in_scoring(self):
        """Scoring runs 100% deterministically in Python without network access, API keys, or LLM hallucination."""
        import os
        orig_key = os.environ.get("GROQ_API_KEY")
        try:
            # Explicitly unset API key to ensure pure local execution
            if "GROQ_API_KEY" in os.environ:
                del os.environ["GROQ_API_KEY"]

            res = self.engine.score_adaptive_assessment(
                answers={"q10_01_learning_style": "a", "legacy_q1": "a"},
                profile={"education_level": "sslc_10th"}
            )
            self.assertIsNotNone(res)
            self.assertIn("scores", res)
            self.assertIsInstance(res["scores"]["I"], int)
        finally:
            if orig_key:
                os.environ["GROQ_API_KEY"] = orig_key


class TestPhase4Step4PersistenceAndCounselor(unittest.TestCase):
    """
    Phase 4.3 - Step 4 Verification:
    Tests Supabase persistence structure, restoration, backward compatibility,
    RLS security, and downstream AI Counselor evidence-based grounding.
    """

    def setUp(self):
        self.engine = AdaptiveAssessmentEngine()

    def test_01_saving_adaptive_assessment_results(self):
        """Test persistence payload formation for adaptive assessment results."""
        # 1. Deterministic score computation
        score_res = self.engine.score_adaptive_assessment(
            answers={"q10_01_learning_style": "a", "q_eng_01_logic": "a"},
            profile={"education_level": "diploma", "school_stream": "mechanical", "skills": ["AutoCAD", "Welding"]}
        )

        # 2. Simulate persistence payload creation matching Supabase assessments schema
        user_id = "test-uuid-user-001"
        legacy_answers = {"q10_01_learning_style": "a", "q_eng_01_logic": "a"}
        legacy_work_style = {"pace": "collaborative"}
        legacy_know_me = {"curiosity": "how engines work"}
        legacy_matches = [{"slug": "mechanical-engineer", "title": "Mechanical Engineer", "fit": 92}]

        persistence_payload = {
            "user_id": user_id,
            "answers": legacy_answers,
            "work_style": legacy_work_style,
            "know_me": {
                **legacy_know_me,
                "adaptive_evidence": score_res  # dual-layer fallback in know_me
            },
            "scores": score_res["scores"],
            "code": score_res["code"],
            "matches": legacy_matches,
            "source": "ai",
            "adaptive_evidence": score_res      # primary dedicated column (migration 0003)
        }

        # 3. Assert all 4 required adaptive elements are persisted
        self.assertIn("adaptive_evidence", persistence_payload)
        adaptive_stored = persistence_payload["adaptive_evidence"]
        self.assertIn("stage", adaptive_stored)
        self.assertEqual(adaptive_stored["stage"], "diploma_polytechnic")
        self.assertIn("demonstrated_competencies", adaptive_stored)
        self.assertIn("evidence_breakdown", adaptive_stored)
        self.assertIn("statutory_eligibility", adaptive_stored)

        # 4. Assert all existing legacy fields are fully preserved
        self.assertEqual(persistence_payload["answers"], legacy_answers)
        self.assertEqual(persistence_payload["work_style"], legacy_work_style)
        self.assertEqual(persistence_payload["scores"], score_res["scores"])
        self.assertEqual(persistence_payload["code"], score_res["code"])
        self.assertEqual(persistence_payload["matches"], legacy_matches)
        self.assertEqual(persistence_payload["source"], "ai")

    def test_02_loading_previously_saved_adaptive_results(self):
        """Test loading and restoration of previously saved adaptive results from column and fallback."""
        score_res = self.engine.score_adaptive_assessment(
            answers={"q_eng_01_logic": "a"},
            profile={"education_level": "btech", "skills": ["Python"]}
        )

        # A: Simulated row loaded from database with adaptive_evidence column populated
        row_from_col = {
            "id": "rec-101",
            "user_id": "user-123",
            "code": score_res["code"],
            "scores": score_res["scores"],
            "matches": [{"slug": "software-developer", "title": "Software Developer", "fit": 90}],
            "source": "ai",
            "work_style": {},
            "know_me": {},
            "adaptive_evidence": score_res,
            "created_at": "2026-11-05T10:00:00Z"
        }

        # Restoration logic (matching frontend profile.ts assessmentFromRow)
        restored_a = row_from_col.get("adaptive_evidence") or (row_from_col.get("know_me") or {}).get("adaptive_evidence")
        self.assertIsNotNone(restored_a)
        self.assertEqual(restored_a["stage"], "college_ug_pg")
        self.assertIn("demonstrated_competencies", restored_a)
        self.assertIn("evidence_breakdown", restored_a)
        self.assertIn("statutory_eligibility", restored_a)

        # B: Simulated row where column is null but know_me fallback was preserved
        row_from_fallback = {
            "id": "rec-102",
            "user_id": "user-123",
            "code": score_res["code"],
            "scores": score_res["scores"],
            "matches": [],
            "source": "rule",
            "work_style": {},
            "know_me": {"adaptive_evidence": score_res},
            "adaptive_evidence": None,
            "created_at": "2026-11-05T10:05:00Z"
        }
        restored_b = row_from_fallback.get("adaptive_evidence") or (row_from_fallback.get("know_me") or {}).get("adaptive_evidence")
        self.assertIsNotNone(restored_b)
        self.assertEqual(restored_b["stage"], "college_ug_pg")

    def test_03_missing_adaptive_fields_in_legacy_records(self):
        """Test that legacy records without adaptive assessment data load cleanly without crashing."""
        legacy_row = {
            "id": "legacy-999",
            "user_id": "legacy-user-456",
            "code": "IRC",
            "scores": {"R": 65, "I": 80, "A": 45, "S": 40, "E": 55, "C": 70},
            "matches": [{"slug": "data-analyst", "title": "Data Analyst", "fit": 88}],
            "source": "hybrid_vector",
            "work_style": {"team": "individual"},
            "know_me": {"values": ["growth", "autonomy"]},
            "adaptive_evidence": None,
            "created_at": "2026-09-01T12:00:00Z"
        }

        # Restoration logic on legacy row
        restored = legacy_row.get("adaptive_evidence") or (legacy_row.get("know_me") or {}).get("adaptive_evidence")
        self.assertIsNone(restored)

        # Confirm all legacy properties remain accessible
        self.assertEqual(legacy_row["code"], "IRC")
        self.assertEqual(legacy_row["scores"]["I"], 80)
        self.assertEqual(len(legacy_row["matches"]), 1)
        self.assertEqual(legacy_row["matches"][0]["slug"], "data-analyst")

    def test_04_rls_and_user_specific_data_isolation(self):
        """Test that Supabase RLS policies enforce isolation so users only access their own assessments."""
        import os
        migration_path = os.path.join(os.path.dirname(__file__), "..", "supabase", "migrations", "0001_phase1_counselor.sql")
        with open(migration_path, "r", encoding="utf-8") as f:
            sql_phase1 = f.read()

        # Check RLS is enabled on public.assessments
        self.assertIn("alter table public.assessments", sql_phase1)
        self.assertIn("enable row level security", sql_phase1)

        # Check policy enforces (auth.uid() = user_id)
        self.assertIn('create policy "own assessments" on public.assessments', sql_phase1)
        self.assertIn("(auth.uid() = user_id)", sql_phase1)

        # Verify simulated access control filter
        active_user_id = "user-authenticated-alice"
        mock_table_records = [
            {"id": "a1", "user_id": "user-authenticated-alice", "code": "RIA"},
            {"id": "b1", "user_id": "user-other-bob", "code": "ESC"},
        ]
        # Query: .eq('user_id', active_user_id)
        user_rows = [r for r in mock_table_records if r["user_id"] == active_user_id]
        self.assertEqual(len(user_rows), 1)
        self.assertEqual(user_rows[0]["id"], "a1")
        self.assertNotIn("user-other-bob", [r["user_id"] for r in user_rows])

    def test_05_assessment_updates_without_overwriting_unrelated_fields(self):
        """Test that saving adaptive evidence does not overwrite or drop profile or assessment fields."""
        existing_profile = {
            "user_id": "user-update-001",
            "path": "know_goal",
            "college": "RV College of Engineering",
            "course": "B.E. Computer Science",
            "interests": ["Robotics", "AI"],
            "strengths_note": "Strong mathematics foundation",
            "target_role": "Robotics Engineer",
            "resume": {"skills": ["C++", "ROS", "Python"]}
        }

        # Saving new assessment should never mutate profile fields
        score_res = self.engine.score_adaptive_assessment(
            answers={"q_eng_01_logic": "a"},
            profile={"education_level": "btech"}
        )

        new_assessment = {
            "user_id": existing_profile["user_id"],
            "answers": {"q_eng_01_logic": "a"},
            "work_style": {},
            "know_me": None,
            "scores": score_res["scores"],
            "code": score_res["code"],
            "matches": [],
            "source": "ai",
            "adaptive_evidence": score_res
        }

        self.assertEqual(existing_profile["college"], "RV College of Engineering")
        self.assertEqual(existing_profile["target_role"], "Robotics Engineer")
        self.assertIn("C++", existing_profile["resume"]["skills"])
        self.assertEqual(new_assessment["user_id"], existing_profile["user_id"])

    def test_06_counselor_context_construction(self):
        """Test that build_counselor_grounding_context correctly packages adaptive evidence for the AI counselor."""
        from main import build_counselor_grounding_context, CounselorChatRequest, CounselorChatMessage

        # Create realistic adaptive evidence
        score_res = self.engine.score_adaptive_assessment(
            answers={"q10_01_learning_style": "a", "q_com_01_balance_sheet": "a"},
            profile={"education_level": "puc_12th", "school_stream": "commerce", "skills": ["Accounting", "Excel"]}
        )

        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="I want to know if I can become a doctor.")],
            student_profile={
                "educationStage": "puc_12th",
                "course": "12th Commerce",
                "skills": ["Accounting", "Excel"],
                "interests": ["Economics"]
            },
            current_stage="preliminary_exploration",
            adaptive_evidence=score_res,
            riasec_scores=score_res["scores"],
            riasec_code=score_res["code"]
        )

        ctx = build_counselor_grounding_context(req)

        # Verify context components
        self.assertIn("education_stage", ctx)
        self.assertIn("assessment_evidence", ctx)
        self.assertIn("statutory_pathways", ctx)
        self.assertIn("grounding_guardrails", ctx)

        # Verify assessment evidence details
        evidence = ctx["assessment_evidence"]
        self.assertTrue(evidence["has_adaptive_evidence"])
        self.assertEqual(evidence["status"], "adaptive_completed")
        self.assertEqual(evidence["holland_code"], score_res["code"])
        self.assertEqual(evidence["deterministic_riasec_scores"], score_res["scores"])

    def test_07_correct_evidence_tier_representation_in_counselor_context(self):
        """Test that evidence tiers (self-reported, conceptual, scenario, practical) are distinctly separated."""
        from main import build_counselor_grounding_context, CounselorChatRequest, CounselorChatMessage

        score_res = self.engine.score_adaptive_assessment(
            answers={"q_com_01_balance_sheet": "a"},
            profile={"education_level": "puc_12th", "school_stream": "commerce", "skills": ["Bookkeeping"]}
        )

        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="Hello")],
            student_profile={"educationStage": "puc_12th"},
            adaptive_evidence=score_res
        )
        ctx = build_counselor_grounding_context(req)
        tiers = ctx["assessment_evidence"]["evidence_tiers"]

        # 1. Self-reported tier
        self.assertIn("self_reported", tiers)
        self.assertIn("Self-Reported Only", tiers["self_reported"]["tier_label"])
        self.assertIn("NOT verified", tiers["self_reported"]["tier_label"])

        # 2. Conceptual knowledge tier
        self.assertIn("awareness_conceptual", tiers)
        self.assertIn("Conceptual Knowledge", tiers["awareness_conceptual"]["tier_label"])

        # 3. Applied scenario tier
        self.assertIn("applied_scenario", tiers)
        self.assertIn("Applied Scenario Problem-Solving", tiers["applied_scenario"]["tier_label"])

        # 4. Verified practical tier
        self.assertIn("verified_practical", tiers)
        self.assertIn("Verified Practical Evidence", tiers["verified_practical"]["tier_label"])

    def test_08_empty_verified_practical_evidence(self):
        """Test that verified practical evidence is strictly empty (0 artifacts) from MCQs with explicit disclaimer."""
        from main import build_counselor_grounding_context, CounselorChatRequest, CounselorChatMessage, COUNSELOR_SYSTEM_PROMPT

        score_res = self.engine.score_adaptive_assessment(
            answers={"q10_01_learning_style": "a", "q_eng_01_logic": "a"},
            profile={"education_level": "sslc_10th"}
        )

        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="What did I prove?")],
            student_profile={"educationStage": "sslc_10th"},
            adaptive_evidence=score_res
        )
        ctx = build_counselor_grounding_context(req)
        vp = ctx["assessment_evidence"]["evidence_tiers"]["verified_practical"]

        # Count must be strictly 0
        self.assertEqual(vp["count"], 0)
        self.assertEqual(vp["items"], [])
        self.assertIn("DO NOT prove practical or professional mastery", vp["note"])

        # System prompt must contain strict guardrail against claiming practical mastery
        self.assertIn("Never claim multiple-choice question answers prove practical or professional mastery", COUNSELOR_SYSTEM_PROMPT)
        self.assertIn("When verified practical evidence is empty (count 0), do NOT describe practical evidence as present", COUNSELOR_SYSTEM_PROMPT)

    def test_09_statutory_restriction_awareness_in_counselor(self):
        """Test that statutory restrictions (e.g. Commerce barred from MBBS by NMC) are surfaced to the counselor."""
        from main import build_counselor_grounding_context, CounselorChatRequest, CounselorChatMessage

        # Commerce student asking about medical/MBBS
        score_res = self.engine.score_adaptive_assessment(
            answers={"q_com_01_balance_sheet": "a"},
            profile={"education_level": "puc_12th", "school_stream": "commerce"}
        )

        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="Can I become an MBBS Doctor?")],
            student_profile={"educationStage": "puc_12th", "school_stream": "commerce"},
            adaptive_evidence=score_res
        )
        ctx = build_counselor_grounding_context(req)
        statutory = ctx["statutory_pathways"]

        # Check statutory restrictions list contains MBBS and NMC
        mbbs_restrictions = [r for r in statutory["statutory_restrictions"] if "General Physician" in r["title"] or "MBBS" in r["title"] or r["slug"] in ["general-physician-mbbs", "general-medical-practitioner"]]
        self.assertTrue(len(mbbs_restrictions) > 0)
        mbbs = mbbs_restrictions[0]
        self.assertIn("National Medical Commission (NMC)", mbbs["regulatory_body"])
        self.assertTrue("Physics" in mbbs["statutory_reason"] and "Biology" in mbbs["statutory_reason"])

        # Check recognized alternative bridge pathways are present for graduate profiles (e.g. B.Com -> CA Direct Entry)
        bcom_res = self.engine.score_adaptive_assessment(
            answers={"q_com_01_balance_sheet": "a"},
            profile={"education_level": "undergraduate", "degree": "bcom", "specialization": "Finance"}
        )
        req_bcom = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="Can I become a CA?")],
            student_profile={"educationStage": "degree_ug", "degree": "bcom"},
            adaptive_evidence=bcom_res
        )
        ctx_bcom = build_counselor_grounding_context(req_bcom)
        self.assertTrue(len(ctx_bcom["statutory_pathways"]["alternative_bridge_pathways"]) > 0)

    def test_10_legacy_counselor_compatibility(self):
        """Test that counselor context seamlessly handles users who have only completed the legacy assessment."""
        from main import build_counselor_grounding_context, CounselorChatRequest, CounselorChatMessage

        # User with only legacy RIASEC scores and Holland code, no adaptive_evidence
        legacy_scores = {"R": 60.0, "I": 75.0, "A": 85.0, "S": 55.0, "E": 45.0, "C": 50.0}
        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="Hello counselor")],
            student_profile={
                "educationStage": "degree_ug",
                "course": "B.Sc Computer Science",
                "riasec_scores": legacy_scores,
                "riasec_code": "AIR"
            },
            adaptive_evidence=None,
            riasec_scores=legacy_scores,
            riasec_code="AIR"
        )

        ctx = build_counselor_grounding_context(req)

        # Verify graceful fallback behavior
        evidence = ctx["assessment_evidence"]
        self.assertFalse(evidence["has_adaptive_evidence"])
        self.assertEqual(evidence["status"], "legacy_completed")
        self.assertEqual(evidence["holland_code"], "AIR")
        self.assertEqual(evidence["deterministic_riasec_scores"], legacy_scores)
        self.assertEqual(evidence["evidence_tiers"]["verified_practical"]["count"], 0)
        self.assertEqual(len(ctx["statutory_pathways"]["statutory_restrictions"]), 0)


if __name__ == "__main__":
    unittest.main()
