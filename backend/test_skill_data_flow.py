"""
test_skill_data_flow.py

Automated Test Suite for Skill Data-Flow & Normalization (Issues 2 & 3):
Verifies that:
1. Manual skills without a resume are fully preserved and normalized.
2. Resume skills without manual skills are fully preserved and normalized.
3. Both manual and resume skills merge without loss or unexpected overwrites.
4. Custom onboarding skills are preserved alongside taxonomy skills.
5. Empty skills (None, [], empty strings) resolve cleanly to [].
6. Duplicate skills with differing capitalization are deduplicated case-insensitively,
   preserving readable first-seen capitalization.
7. Structured skill objects (e.g. {'name': 'Python', 'proficiency': 'intermediate'})
   are safely extracted without runtime AttributeError.
8. Unexpected or malformed values (numbers, None, empty dicts, nested lists) do not crash
   and resolve defensively to string[].
9. End-to-end integration with matcher.py (hybrid_career_match) never calls .lower() on dicts.
10. End-to-end integration with adaptive_assessment.py preserves structured onboarding skills
    in evidence_breakdown.self_reported_skills.
11. End-to-end integration with counselor_generate_recommendations handles structured skills.
"""

import os
import sys
import unittest
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# Add backend directory to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from skill_normalizer import normalize_single_skill, normalize_skills
from matcher import hybrid_career_match
from adaptive_assessment import adaptive_engine
from diagnostic_counselor import DiagnosticProfile, process_diagnostic_turn
from main import GenerateRecommendationsRequest, counselor_generate_recommendations


class TestSkillDataFlow(unittest.TestCase):

    # -------------------------------------------------------------------------
    # TEST 1: Manual skills without a resume
    # -------------------------------------------------------------------------
    def test_manual_skills_without_resume(self):
        manual_skills = [
            {"name": "Python", "category": "prog_tech", "proficiency": "advanced"},
            {"name": "SQL", "category": "prog_tech", "proficiency": "intermediate"},
            {"name": "Data Analysis", "category": "analytics", "proficiency": "beginner"}
        ]
        normalized = normalize_skills(manual_skills)
        self.assertEqual(normalized, ["Python", "SQL", "Data Analysis"])
        self.assertTrue(all(isinstance(s, str) for s in normalized))

    # -------------------------------------------------------------------------
    # TEST 2: Resume skills without manual skills
    # -------------------------------------------------------------------------
    def test_resume_skills_without_manual_skills(self):
        resume_skills = ["TypeScript", "React", "Docker", "AWS"]
        normalized = normalize_skills(resume_skills)
        self.assertEqual(normalized, ["TypeScript", "React", "Docker", "AWS"])

    # -------------------------------------------------------------------------
    # TEST 3: Both manual and resume skills (merging without duplicates)
    # -------------------------------------------------------------------------
    def test_both_manual_and_resume_skills(self):
        resume_skills = ["Python", "SQL", "Docker"]
        manual_skills = [
            {"name": "python", "category": "prog_tech"},
            {"name": "React", "category": "web"},
            {"name": "PostgreSQL", "category": "db"}
        ]
        combined = normalize_skills(resume_skills + manual_skills)
        # Python should not be duplicated; first occurrence ("Python") casing kept
        self.assertEqual(combined, ["Python", "SQL", "Docker", "React", "PostgreSQL"])

    # -------------------------------------------------------------------------
    # TEST 4: Custom skills (free-text entry in onboarding)
    # -------------------------------------------------------------------------
    def test_custom_skills(self):
        se_container = {
            "skills": [
                {"name": "Java", "category": "prog_tech"},
                {"name": "Spring Boot", "category": "backend"}
            ],
            "custom_skills": ["Solidity", "Smart Contracts", "Web3.js"]
        }
        normalized = normalize_skills(se_container)
        self.assertEqual(
            normalized,
            ["Java", "Spring Boot", "Solidity", "Smart Contracts", "Web3.js"]
        )

    # -------------------------------------------------------------------------
    # TEST 5: Empty skills
    # -------------------------------------------------------------------------
    def test_empty_skills(self):
        self.assertEqual(normalize_skills([]), [])
        self.assertEqual(normalize_skills(None), [])
        self.assertEqual(normalize_skills(""), [])
        self.assertEqual(normalize_skills("   "), [])
        self.assertEqual(normalize_skills({}), [])
        self.assertEqual(normalize_skills({"skills": [], "custom_skills": []}), [])

    # -------------------------------------------------------------------------
    # TEST 6: Duplicate skills with different capitalization
    # -------------------------------------------------------------------------
    def test_duplicate_skills_with_different_capitalization(self):
        inputs = ["python", "Python", "PYTHON", "PyThon", "react.js", "React.JS", "REACT.js"]
        normalized = normalize_skills(inputs)
        # Keeps first seen casing, ignores subsequent case variants
        self.assertEqual(normalized, ["python", "react.js"])

    # -------------------------------------------------------------------------
    # TEST 7: Structured skill objects with alternative key names
    # -------------------------------------------------------------------------
    def test_structured_skill_objects(self):
        objects = [
            {"name": "Machine Learning"},
            {"skill_name": "Deep Learning"},
            {"skill": "NLP"},
            {"title": "Computer Vision"},
            {"label": "TensorFlow"}
        ]
        normalized = normalize_skills(objects)
        self.assertEqual(
            normalized,
            ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow"]
        )

    # -------------------------------------------------------------------------
    # TEST 8: Unexpected or malformed skill values
    # -------------------------------------------------------------------------
    def test_unexpected_or_malformed_skill_values(self):
        malformed = [
            None,
            "",
            "   ",
            {},
            {"name": ""},
            {"other_key": 999},
            101,
            ["Nested Skill", "  Another  "],
            {"name": "   Valid Skill With Whitespace   "}
        ]
        normalized = normalize_skills(malformed)
        self.assertIn("101", normalized)
        self.assertIn("Nested Skill", normalized)
        self.assertIn("Another", normalized)
        self.assertIn("Valid Skill With Whitespace", normalized)
        # Empty string / None / empty dicts must be excluded
        self.assertNotIn("", normalized)
        self.assertNotIn("   ", normalized)

    # -------------------------------------------------------------------------
    # TEST 9: Matcher Integration (matcher.py hybrid_career_match with dicts)
    # -------------------------------------------------------------------------
    def test_matcher_integration_with_dict_skills(self):
        riasec_scores = {"R": 10.0, "I": 25.0, "A": 15.0, "S": 10.0, "E": 12.0, "C": 14.0}
        interests = ["Software Development", "Artificial Intelligence"]
        # Intentionally pass structured dicts as resume_skills to verify no .lower() crash
        resume_skills_with_dicts = [
            {"name": "Python", "proficiency": "advanced"},
            {"name": "SQL", "category": "database"},
            "Git",
            None,
            ""
        ]
        matches = hybrid_career_match(
            riasec_scores=riasec_scores,
            interests=interests,
            resume_skills=resume_skills_with_dicts,
            limit=5
        )
        self.assertIsInstance(matches, list)
        self.assertGreater(len(matches), 0)
        top = matches[0]
        self.assertIn("title", top)
        self.assertIn("match_level", top)
        self.assertIn("score", top)

    # -------------------------------------------------------------------------
    # TEST 10: Adaptive Assessment Integration (Self-reported skills tier)
    # -------------------------------------------------------------------------
    def test_adaptive_assessment_preserves_structured_onboarding_skills(self):
        profile = {
            "educationStage": "college_ug_pg",
            "skills": [
                {"name": "Python", "category": "prog_tech"},
                {"name": "Machine Learning", "category": "analytics"}
            ],
            "skills_and_experience": {
                "custom_skills": ["PyTorch", "HuggingFace"]
            }
        }
        answers = {f"q_{i}": "a" for i in range(1, 13)}
        result = adaptive_engine.score_adaptive_assessment(answers, profile)
        evidence = result["evidence_breakdown"]
        self.assertIn("self_reported_skills", evidence)
        self_reported = evidence["self_reported_skills"]
        skill_names = [item["skill"] for item in self_reported]
        # Verify all skills including custom skills were preserved
        self.assertIn("Python", skill_names)
        self.assertIn("Machine Learning", skill_names)
        self.assertIn("PyTorch", skill_names)
        self.assertIn("HuggingFace", skill_names)

    # -------------------------------------------------------------------------
    # TEST 11: Counselor Recommendations Endpoint Integration
    # -------------------------------------------------------------------------
    def test_recommendation_endpoint_accepts_and_consumes_structured_skills(self):
        # Create request with structured dicts in resume_skills and diagnostic_profile
        req = GenerateRecommendationsRequest(
            riasec_scores={"R": 10.0, "I": 24.0, "A": 16.0, "S": 12.0, "E": 18.0, "C": 12.0},
            code="IRE",
            interests=["Technology"],
            resume_skills=[{"name": "Python"}, {"name": "SQL"}],
            diagnostic_profile={
                "technical_skills": [{"name": "Docker"}, "Kubernetes"],
                "projects": [
                    {
                        "name": "Cloud API",
                        "role": "Backend Developer",
                        "technologies": ["FastAPI", {"name": "PostgreSQL"}]
                    }
                ]
            }
        )
        res = counselor_generate_recommendations(req)
        self.assertIn("matches", res)
        self.assertGreater(len(res["matches"]), 0)
        # Verify demonstrated_skills_count is calculated without crashing
        self.assertGreater(res["demonstrated_skills_count"], 0)
        # Check that matched_skills and missing_skills are properly populated
        for m in res["matches"]:
            self.assertIn("matched_skills", m)
            self.assertIn("missing_skills", m)
            self.assertIn("readiness", m)
            self.assertTrue(all(isinstance(s, str) for s in m["matched_skills"]))
            self.assertTrue(all(isinstance(s, str) for s in m["missing_skills"]))


if __name__ == "__main__":
    unittest.main()
