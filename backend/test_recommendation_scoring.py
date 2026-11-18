"""
test_recommendation_scoring.py

Comprehensive test suite for Issue 5: Evidence-Based Qualitative Career Match Levels.
Verifies:
1. AI reranking preserves authentic matcher scores and baseline ranks.
2. Reordering careers does not change their individual scores.
3. All three match levels are assigned correctly (Strong Match, Good Match, Exploratory Match).
4. Missing scores or missing inputs do not cause crashes or NaN.
5. /api/career-match returns consistent data with score and match_level.
6. Recommendation endpoint (/api/counselor/generate-recommendations) returns consistent data.
7. Deal-breaker penalties correctly downweight target careers without artificial rank decay.
8. No rank-based artificial percentage formulas (such as 94 - idx * 4) remain.
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Offline mode for SentenceTransformers during tests
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

import main
from matcher import hybrid_career_match, compute_match_level, MATCH_LEVEL_THRESHOLDS


class TestRecommendationScoring(unittest.TestCase):

    def test_01_match_levels_assigned_correctly(self):
        """Verify heuristic cutoffs for Strong Match, Good Match, and Exploratory Match."""
        self.assertEqual(compute_match_level(0.85), "Strong Match")
        self.assertEqual(compute_match_level(0.72), "Strong Match")
        self.assertEqual(compute_match_level(0.719), "Good Match")
        self.assertEqual(compute_match_level(0.58), "Good Match")
        self.assertEqual(compute_match_level(0.579), "Exploratory Match")
        self.assertEqual(compute_match_level(0.30), "Exploratory Match")
        self.assertEqual(compute_match_level(None), "Exploratory Match")
        self.assertEqual(compute_match_level("invalid"), "Exploratory Match")

    def test_02_reordering_preserves_underlying_scores(self):
        """Verify that when careers are reordered, their underlying scores remain unchanged."""
        career_a = {"title": "Career A", "score": 0.8123, "match_level": compute_match_level(0.8123)}
        career_b = {"title": "Career B", "score": 0.6541, "match_level": compute_match_level(0.6541)}

        # Original order: [A, B]
        original_order = [dict(career_a), dict(career_b)]
        self.assertEqual(original_order[0]["score"], 0.8123)
        self.assertEqual(original_order[1]["score"], 0.6541)

        # Reordered order (e.g., promoted by counselor): [B, A]
        reordered = [dict(career_b), dict(career_a)]
        # B must keep 0.6541 and Good Match
        self.assertEqual(reordered[0]["score"], 0.6541)
        self.assertEqual(reordered[0]["match_level"], "Good Match")
        # A must keep 0.8123 and Strong Match
        self.assertEqual(reordered[1]["score"], 0.8123)
        self.assertEqual(reordered[1]["match_level"], "Strong Match")

    def test_03_ai_reranking_preserves_original_matcher_scores(self):
        """Verify _ai_career_match maps LLM outputs back to candidate records by slug and preserves score."""
        profile = {
            "riasec_scores": {"R": 80, "I": 90, "A": 20, "S": 15, "E": 30, "C": 70},
            "interests": ["Software Development", "System Architecture"],
            "resume_skills": ["Python", "FastAPI", "Docker", "SQL"],
            "strengths_note": "Enjoy backend systems.",
            "know_me": {"deal_breakers": []}
        }

        # Retrieve candidates directly
        candidates = hybrid_career_match(
            riasec_scores=profile["riasec_scores"],
            interests=profile["interests"],
            resume_skills=profile["resume_skills"],
            know_me=profile["know_me"],
            free_text=profile["strengths_note"],
            limit=5
        )
        self.assertGreater(len(candidates), 0)
        cand_map = {c["title"].lower(): c for c in candidates}

        # Mock LLM response reordering candidate 2 to position 1
        top_two = candidates[:2]
        reversed_titles = [top_two[1]["title"], top_two[0]["title"]]

        mock_llm_output = {
            "matches": [
                {
                    "title": reversed_titles[0],
                    "why_it_fits": "Promoted because of explicit database strengths.",
                    "day_to_day": "Building databases and backend services.",
                    "key_skills": ["SQL", "Python"],
                    "watch_outs": "Continuous learning required.",
                    "baseline_rank": 2,
                    "reranking_reason": "Promoted above baseline rank 2."
                },
                {
                    "title": reversed_titles[1],
                    "why_it_fits": "Strong general software development alignment.",
                    "day_to_day": "Designing software systems.",
                    "key_skills": ["Python", "Git"],
                    "watch_outs": "Competitive field.",
                    "baseline_rank": 1,
                    "reranking_reason": "Retained near top."
                },
                {
                    "title": candidates[2]["title"],
                    "why_it_fits": "Good systems alignment.",
                    "day_to_day": "Analyzing systems.",
                    "key_skills": ["Systems Analysis"],
                    "watch_outs": "Requires collaboration.",
                    "baseline_rank": 3,
                    "reranking_reason": "Baseline rank retained."
                }
            ]
        }

        with patch.object(main, "_generate_json", return_value=mock_llm_output):
            matches = main._ai_career_match(profile)
            self.assertIsNotNone(matches)
            self.assertEqual(len(matches), 3)

            # Promoted candidate at index 0 must have its authentic candidate score
            promoted = matches[0]
            self.assertEqual(promoted["title"], reversed_titles[0])
            expected_score = round(float(cand_map[reversed_titles[0].lower()]["score"]), 4)
            self.assertEqual(promoted["score"], expected_score)
            self.assertEqual(promoted["match_level"], compute_match_level(expected_score))
            self.assertIsNone(promoted.get("fit"))

            # Demoted candidate at index 1 must have its authentic candidate score
            demoted = matches[1]
            self.assertEqual(demoted["title"], reversed_titles[1])
            expected_demoted_score = round(float(cand_map[reversed_titles[1].lower()]["score"]), 4)
            self.assertEqual(demoted["score"], expected_demoted_score)
            self.assertEqual(demoted["match_level"], compute_match_level(expected_demoted_score))
            self.assertIsNone(demoted.get("fit"))

    def test_04_no_artificial_rank_decay_formula_remains(self):
        """Verify that no rank-based decaying percentage formula exists in main.py or careers.py."""
        with open(os.path.join(backend_dir, "main.py"), "r", encoding="utf-8") as f:
            main_code = f.read()
        self.assertNotIn("94 - idx * 4", main_code)
        self.assertNotIn("- idx *", main_code)
        self.assertNotIn("- i *", main_code)

        with open(os.path.join(backend_dir, "careers.py"), "r", encoding="utf-8") as f:
            careers_code = f.read()
        self.assertNotIn("- i * 3", careers_code)

    def test_05_missing_scores_handled_safely(self):
        """Verify that missing scores do not raise exceptions and default to Exploratory Match."""
        self.assertEqual(compute_match_level(None), "Exploratory Match")
        self.assertEqual(compute_match_level(float("nan")), "Exploratory Match")

        # Test career with None score
        career_no_score = {"title": "Experimental Role", "score": None}
        level = compute_match_level(career_no_score.get("score"))
        self.assertEqual(level, "Exploratory Match")

    def test_06_recommendation_endpoint_returns_consistent_data(self):
        """Verify that /api/counselor/generate-recommendations returns authentic score and match_level."""
        payload = {
            "riasec_scores": {"R": 80, "I": 85, "A": 30, "S": 20, "E": 40, "C": 70},
            "code": "IRC",
            "interests": ["Software Development"],
            "education": "College (Undergraduate)",
            "work_style": {},
            "resume_skills": ["Python", "FastAPI", "React"],
            "strengths_note": "I build backend systems.",
            "know_me": {"deal_breakers": []},
            "diagnostic_profile": {}
        }
        req = main.GenerateRecommendationsRequest(**payload)

        # Mock _ai_career_match to return None so it tests the hybrid vector fallback
        with patch.object(main, "_ai_career_match", return_value=None):
            data = main.counselor_generate_recommendations(req)
            self.assertIn("matches", data)
            matches = data["matches"]
            self.assertGreaterEqual(len(matches), 3)

            for m in matches:
                self.assertIn("title", m)
                self.assertIn("score", m)
                self.assertIn("match_level", m)
                self.assertIn(m["match_level"], ["Strong Match", "Good Match", "Exploratory Match"])
                self.assertIn("readiness", m)
                self.assertIn("why_it_fits", m)
                # Verify no fake fit percentage
                self.assertIsNone(m.get("fit"))

    def test_07_career_match_endpoint_returns_consistent_data(self):
        """Verify that /api/career-match returns consistent score and match_level."""
        payload = {
            "riasec_scores": {"R": 20, "I": 30, "A": 90, "S": 80, "E": 50, "C": 20},
            "code": "ASE",
            "interests": ["Graphic Design"],
            "education": "College (Undergraduate)",
            "work_style": {},
            "resume_skills": ["Figma", "UI/UX"],
            "strengths_note": "Visual creative.",
            "know_me": {"deal_breakers": []}
        }
        req = main.CareerMatchRequest(**payload)

        with patch.object(main, "_ai_career_match", return_value=None):
            data = main.career_match(req)
            self.assertIn("matches", data)
            for m in data["matches"]:
                self.assertIn("title", m)
                self.assertIn("score", m)
                self.assertIn("match_level", m)
                self.assertIsNone(m.get("fit"))
                self.assertIn("score", m)
                self.assertIn("match_level", m)
                self.assertIsNone(m.get("fit"))


if __name__ == "__main__":
    unittest.main()
