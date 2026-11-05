import unittest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from adaptive_assessment import (
    AdaptiveAssessmentEngine,
    AssessmentStage,
)
from career_knowledge_base import CareerKnowledgeBase
from matcher import hybrid_career_match, is_semantic_engine_ready
from main import (
    assessment_adaptive_questions,
    assessment_adaptive_score,
    AdaptiveQuestionsRequest,
    AdaptiveScoreRequest,
    build_counselor_grounding_context,
    CounselorChatRequest,
    CounselorChatMessage,
    fallback_match,
)


class TestCompleteAdaptiveAssessmentJourney(unittest.TestCase):
    """
    Part 2 & Part 3 & Part 4 E2E Journey Validation across 7 Education Stages:
    1. Class 10
    2. Class 12 PCB
    3. Class 12 PCM
    4. Class 12 Commerce
    5. Diploma
    6. UG/PG
    7. Career Switcher
    """

    @classmethod
    def setUpClass(cls):
        cls.engine = AdaptiveAssessmentEngine()
        cls.ckb = CareerKnowledgeBase()

    # ------------------------------------------------------------------------
    # Journey 1: Class 10 High School Student
    # ------------------------------------------------------------------------
    def test_journey_01_class_10(self):
        profile = {
            "education_level": "sslc_10th",
            "education_status": "currently_studying",
            "school_board": "cbse",
            "interests": ["Science", "Drawing"],
            "skills": ["Active Listening", "Creativity"]
        }

        # 1. Stage Identification
        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.SCHOOL_10TH)

        # 2. Adaptive Questions Retrieval
        q_req = AdaptiveQuestionsRequest(profile=profile)
        q_res = assessment_adaptive_questions(q_req)
        self.assertEqual(q_res["stage"], "school_10th")
        self.assertLessEqual(q_res["total"], 15)
        self.assertTrue(len(q_res["questions"]) > 0)

        # 3. Answering and Deterministic Scoring
        answers = {q["id"]: "a" for q in q_res["questions"]}
        s_req = AdaptiveScoreRequest(answers=answers, profile=profile)
        s_res = assessment_adaptive_score(s_req)

        # 4. Deterministic Scores & Holland Code
        self.assertIn("scores", s_res)
        for dim in ["R", "I", "A", "S", "E", "C"]:
            self.assertTrue(0 <= s_res["scores"][dim] <= 100)
        self.assertIsInstance(s_res["code"], str)
        self.assertEqual(len(s_res["code"]), 3)

        # 5. 4-Tier Evidence Breakdown Verification
        breakdown = s_res["evidence_breakdown"]
        self_reported_names = [item.get("skill", item) if isinstance(item, dict) else item for item in breakdown["self_reported"]]
        self.assertIn("Active Listening", self_reported_names)
        self.assertEqual(breakdown["verified_practical"], [])  # Strictly empty!
        self.assertIn("Multiple-choice", s_res["practical_disclaimer"])

        # 6. Career Matching receives results
        matches = fallback_match(s_res["scores"])
        self.assertTrue(len(matches) >= 3)

    # ------------------------------------------------------------------------
    # Journey 2: Class 12 PCB (Medical Track)
    # ------------------------------------------------------------------------
    def test_journey_02_class_12_pcb(self):
        profile = {
            "education_level": "puc_12th",
            "school_stream": "science",
            "specialization": "pcb",
            "subjects": ["Physics", "Chemistry", "Biology"],
            "interests": ["Medicine", "Zoology"],
            "skills": ["Biology", "Patient Care Awareness"]
        }

        # 1. Stage Identification
        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.HIGHER_SECONDARY_12TH)

        # 2. Questions & Scoring
        q_res = assessment_adaptive_questions(AdaptiveQuestionsRequest(profile=profile))
        answers = {q["id"]: "a" for q in q_res["questions"][:5]}
        s_res = assessment_adaptive_score(AdaptiveScoreRequest(answers=answers, profile=profile))

        # 3. Statutory Check: PCB student is eligible for MBBS / Medicine
        elig = s_res["statutory_eligibility"]
        eligible_slugs = [p["slug"] for p in elig["eligible_pathways"]]
        self.assertIn("general-medical-practitioner", eligible_slugs)
        self.assertIn("registered-nurse", eligible_slugs)

        # 4. Verified practical remains strictly empty
        self.assertEqual(s_res["evidence_breakdown"]["verified_practical"], [])

    # ------------------------------------------------------------------------
    # Journey 3: Class 12 PCM (Engineering Track)
    # ------------------------------------------------------------------------
    def test_journey_03_class_12_pcm(self):
        profile = {
            "education_level": "puc_12th",
            "school_stream": "science",
            "specialization": "pcm",
            "subjects": ["Physics", "Chemistry", "Mathematics"],
            "interests": ["Coding", "Robotics"],
            "skills": ["Mathematics", "Logical Reasoning"]
        }

        q_res = assessment_adaptive_questions(AdaptiveQuestionsRequest(profile=profile))
        answers = {q["id"]: "a" for q in q_res["questions"][:5]}
        s_res = assessment_adaptive_score(AdaptiveScoreRequest(answers=answers, profile=profile))

        # Statutory Check: PCM student is BARRED from MBBS (lacks Biology)
        elig = s_res["statutory_eligibility"]
        restricted_slugs = [p["slug"] for p in elig["statutory_restrictions"]]
        self.assertIn("general-medical-practitioner", restricted_slugs)

        # But eligible for engineering / technology pathways
        eligible_slugs = [p["slug"] for p in elig["eligible_pathways"]]
        self.assertTrue(any("engineer" in s or "developer" in s for s in eligible_slugs))

    # ------------------------------------------------------------------------
    # Journey 4: Class 12 Commerce
    # ------------------------------------------------------------------------
    def test_journey_04_class_12_commerce(self):
        profile = {
            "education_level": "puc_12th",
            "school_stream": "commerce",
            "specialization": "finance_accounts",
            "subjects": ["Accountancy", "Economics", "Business Studies"],
            "interests": ["Stock Market", "Banking"],
            "skills": ["Bookkeeping", "Spreadsheets"]
        }

        q_res = assessment_adaptive_questions(AdaptiveQuestionsRequest(profile=profile))
        answers = {q["id"]: "a" for q in q_res["questions"][:5]}
        s_res = assessment_adaptive_score(AdaptiveScoreRequest(answers=answers, profile=profile))

        # Statutory Check: Commerce student is BARRED from MBBS by NMC
        elig = s_res["statutory_eligibility"]
        mbbs = next((r for r in elig["statutory_restrictions"] if r["slug"] == "general-medical-practitioner"), None)
        self.assertIsNotNone(mbbs)
        self.assertIn("National Medical Commission (NMC)", mbbs["regulatory_body"])
        self.assertIn("Biology", mbbs["reason"])

        # Eligible for CA Foundation and Commerce pathways
        eligible_slugs = [p["slug"] for p in elig["eligible_pathways"]]
        self.assertIn("chartered-accountant", eligible_slugs)

    # ------------------------------------------------------------------------
    # Journey 5: Polytechnic Diploma Student
    # ------------------------------------------------------------------------
    def test_journey_05_polytechnic_diploma(self):
        profile = {
            "education_level": "diploma",
            "course": "Diploma in Mechanical Engineering",
            "specialization": "Mechanical",
            "skills": ["AutoCAD", "Workshop Practices"]
        }

        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.DIPLOMA_POLYTECHNIC)

        q_res = assessment_adaptive_questions(AdaptiveQuestionsRequest(profile=profile))
        answers = {q["id"]: "a" for q in q_res["questions"][:5]}
        s_res = assessment_adaptive_score(AdaptiveScoreRequest(answers=answers, profile=profile))

        self.assertEqual(s_res["stage"], "diploma_polytechnic")
        # Lateral entry and industrial trades eligible
        eligible_slugs = [p["slug"] for p in s_res["statutory_eligibility"]["eligible_pathways"]]
        self.assertTrue(len(eligible_slugs) > 0)

    # ------------------------------------------------------------------------
    # Journey 6: Undergraduate / Postgraduate Degree (B.Com / B.Tech)
    # ------------------------------------------------------------------------
    def test_journey_06_ug_pg_bcom(self):
        profile = {
            "education_level": "undergraduate",
            "degree": "bcom",
            "specialization": "Finance & Accounting",
            "skills": ["Financial Analysis", "Taxation", "Auditing"]
        }

        stage = self.engine.resolve_stage(profile)
        self.assertEqual(stage, AssessmentStage.COLLEGE_UG_PG)

        q_res = assessment_adaptive_questions(AdaptiveQuestionsRequest(profile=profile))
        answers = {q["id"]: "a" for q in q_res["questions"][:5]}
        s_res = assessment_adaptive_score(AdaptiveScoreRequest(answers=answers, profile=profile))

        # B.Com graduate has CA as a statutory restriction requiring ICAI Direct Entry bridge steps
        restrictions = s_res["statutory_eligibility"]["statutory_restrictions"]
        ca_restriction = next((r for r in restrictions if r["slug"] == "chartered-accountant"), None)
        self.assertIsNotNone(ca_restriction)
        self.assertEqual(ca_restriction["regulatory_body"], "Institute of Chartered Accountants of India (ICAI)")
        self.assertTrue(any("Direct Entry" in step for step in ca_restriction["recommended_bridge_steps"]))

    # ------------------------------------------------------------------------
    # Journey 7: Career Switcher / Non-traditional Candidate
    # ------------------------------------------------------------------------
    def test_journey_07_career_switcher(self):
        profile = {
            "career_mode": "career_growth",
            "career_growth_subtype": "switcher",
            "user_persona": "non_tech_to_tech",
            "education_level": "undergraduate",
            "degree": "ba",
            "specialization": "English Literature",
            "skills": ["Content Writing", "HTML Basics"]
        }

        q_res = assessment_adaptive_questions(AdaptiveQuestionsRequest(profile=profile))
        answers = {q["id"]: "a" for q in q_res["questions"][:5]}
        s_res = assessment_adaptive_score(AdaptiveScoreRequest(answers=answers, profile=profile))

        # Successfully computes without crashing
        self.assertIsNotNone(s_res["scores"])
        self.assertIn(s_res["code"][0], ["R", "I", "A", "S", "E", "C"])
        self.assertEqual(s_res["evidence_breakdown"]["verified_practical"], [])


class TestEvidenceIntegrityAndCounselorGrounding(unittest.TestCase):
    """
    Part 3 & Part 4: Validates Evidence Integrity and AI Counselor Grounding scenarios.
    """

    @classmethod
    def setUpClass(cls):
        cls.engine = AdaptiveAssessmentEngine()

    def test_evidence_integrity_mcq_never_gives_verified_practical(self):
        """MCQ answers alone NEVER award verified practical evidence."""
        score_res = self.engine.score_adaptive_assessment(
            answers={"q_eng_01_logic": "a", "q_com_01_balance_sheet": "a"},
            profile={"education_level": "sslc_10th", "skills": ["Python", "Accounting"]}
        )
        self.assertEqual(score_res["evidence_breakdown"]["verified_practical"], [])
        self.assertIn("cannot be proven through multiple-choice answers alone", score_res["practical_disclaimer"])

    def test_missing_and_invalid_answers_do_not_crash(self):
        """Empty, invalid, and partial answers handle gracefully."""
        score_empty = self.engine.score_adaptive_assessment(answers={}, profile={})
        self.assertIsNotNone(score_empty["scores"])

        score_invalid = self.engine.score_adaptive_assessment(
            answers={"invalid_id": "z", "q10_01_learning_style": None},
            profile={}
        )
        self.assertIsNotNone(score_invalid["scores"])

    def test_counselor_scenario_01_java_backend_readiness(self):
        """Counselor context accurately reflects candidate evidence when asking about Java developer readiness."""
        score_res = self.engine.score_adaptive_assessment(
            answers={"q_eng_01_logic": "a"},
            profile={"education_level": "btech", "skills": ["Java Basics"]}
        )
        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="Am I ready for a Java Backend Developer role?")],
            student_profile={"educationStage": "degree_ug", "course": "B.Tech CSE", "skills": ["Java Basics"]},
            adaptive_evidence=score_res
        )
        ctx = build_counselor_grounding_context(req)
        # Verify self-reported vs practical
        items = ctx["assessment_evidence"]["evidence_tiers"]["self_reported"]["items"]
        skill_names = [it.get("skill", it) if isinstance(it, dict) else it for it in items]
        self.assertIn("Java Basics", skill_names)
        self.assertEqual(ctx["assessment_evidence"]["evidence_tiers"]["verified_practical"]["count"], 0)
        self.assertIn("0 verified practical artifacts", ctx["assessment_evidence"]["evidence_tiers"]["verified_practical"]["note"])

    def test_counselor_scenario_02_commerce_asks_about_mbbs(self):
        """Counselor context alerts that Commerce student is statutorily barred from MBBS under NMC."""
        score_res = self.engine.score_adaptive_assessment(
            answers={},
            profile={"education_level": "puc_12th", "school_stream": "commerce"}
        )
        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="Can I directly pursue MBBS after 12th Commerce?")],
            student_profile={"educationStage": "puc_12th", "school_stream": "commerce"},
            adaptive_evidence=score_res
        )
        ctx = build_counselor_grounding_context(req)
        restrictions = ctx["statutory_pathways"]["statutory_restrictions"]
        mbbs = next((r for r in restrictions if r["slug"] == "general-medical-practitioner"), None)
        self.assertIsNotNone(mbbs)
        self.assertIn("National Medical Commission (NMC)", mbbs["regulatory_body"])

    def test_counselor_scenario_03_bcom_asks_about_ca(self):
        """Counselor context surfaces CA statutory restriction under ICAI with Direct Entry bridge route."""
        score_res = self.engine.score_adaptive_assessment(
            answers={},
            profile={"education_level": "undergraduate", "degree": "bcom"}
        )
        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="What is the CA pathway for me?")],
            student_profile={"educationStage": "degree_ug", "degree": "bcom"},
            adaptive_evidence=score_res
        )
        ctx = build_counselor_grounding_context(req)
        restrictions = ctx["statutory_pathways"]["statutory_restrictions"]
        ca = next((p for p in restrictions if p["slug"] == "chartered-accountant"), None)
        self.assertIsNotNone(ca)
        self.assertEqual(ca["regulatory_body"], "Institute of Chartered Accountants of India (ICAI)")

    def test_counselor_scenario_04_legacy_user_guidance(self):
        """Legacy user without adaptive evidence receives valid counselor context with deterministic scores."""
        legacy_scores = {"R": 55, "I": 70, "A": 80, "S": 60, "E": 45, "C": 50}
        req = CounselorChatRequest(
            messages=[CounselorChatMessage(role="user", content="What careers fit me?")],
            student_profile={"educationStage": "degree_ug", "riasec_scores": legacy_scores, "riasec_code": "AIR"},
            adaptive_evidence=None,
            riasec_scores=legacy_scores,
            riasec_code="AIR"
        )
        ctx = build_counselor_grounding_context(req)
        self.assertFalse(ctx["assessment_evidence"]["has_adaptive_evidence"])
        self.assertEqual(ctx["assessment_evidence"]["status"], "legacy_completed")
        self.assertEqual(ctx["assessment_evidence"]["holland_code"], "AIR")
        self.assertEqual(ctx["assessment_evidence"]["deterministic_riasec_scores"], legacy_scores)


if __name__ == "__main__":
    unittest.main()
