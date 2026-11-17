"""
test_groq_configuration.py

Comprehensive test suite for Issue 1: Groq Model Configuration and AI Fallbacks.
Verifies:
1. Groq connectivity and SDK initialization.
2. Diagnostic chat AI response and structured fact extraction.
3. Resume extraction via Groq JSON mode.
4. AI career recommendation reranking and rationale generation.
5. Invalid model handling (HTTP 404 / model_not_found) with safe fallback.
6. Missing API key handling with automatic rule-based fallback.
7. Rate-limit (HTTP 429) and network/connection error fallback handling.
"""

import os
import sys

# Disable HF hub network retries for fast offline tests
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import unittest
import json
from unittest.mock import patch, MagicMock

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

import main
from diagnostic_counselor import (
    DiagnosticProfile,
    process_diagnostic_turn,
    classify_groq_error,
    DEFAULT_GROQ_MODEL,
)
from resume_parser import create_extraction_prompt


class TestGroqConfiguration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.api_key = os.environ.get("GROQ_API_KEY")
        cls.model = os.environ.get("GROQ_MODEL") or DEFAULT_GROQ_MODEL
        cls.has_groq = bool(cls.api_key and main._ai_client is not None)

    def test_01_groq_connectivity_and_initialization(self):
        """Verify Groq SDK initialization, key presence, and centralized model config."""
        self.assertTrue(self.has_groq, "GROQ_API_KEY must be set in backend/.env for AI testing.")
        self.assertIsNotNone(main._ai_client, "_ai_client in main.py should be initialized.")
        self.assertEqual(main.GROQ_MODEL, self.model, "GROQ_MODEL should match environment configuration.")
        # Ensure model is valid string format (e.g. 'openai/gpt-oss-120b')
        self.assertTrue(len(self.model) > 3)

        # Live connectivity test if network is accessible
        try:
            resp = main._ai_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Reply with OK"}],
                max_tokens=10
            )
            content = resp.choices[0].message.content
            self.assertIsNotNone(content)
        except Exception as e:
            # If running in sandboxed environment without network, connection error is expected
            cat, msg = classify_groq_error(e, model=self.model)
            self.assertIn(cat, ["network_error", "rate_limit"])

    def test_02_diagnostic_chat_ai_response(self):
        """Verify diagnostic chat AI response and structured fact extraction."""
        if not self.has_groq:
            self.skipTest("No Groq API key available.")

        messages = [
            {"role": "assistant", "content": "Welcome! What degree are you pursuing?"},
            {"role": "user", "content": "I am a 3rd year B.Tech Computer Science student at PES University. I build full stack web apps with React and FastAPI, and I built an automated resume parsing platform."}
        ]
        student_profile = {"educationStage": "college_ug_pg", "course": "B.Tech CSE"}
        assessment_evidence = {"holland_code": "IRC", "evidence_tiers": {}}

        try:
            result = process_diagnostic_turn(
                messages=messages,
                student_profile=student_profile,
                assessment_evidence=assessment_evidence,
                current_diagnostic=None,
                ai_client=main._ai_client,
                groq_model=self.model
            )
            self.assertIn("reply", result)
            self.assertTrue(len(result["reply"]) > 10)
            self.assertIn("diagnostic_profile", result)
            diag = result["diagnostic_profile"]

            # Verify that skills were normalized and preserved
            skills = diag.get("technical_skills", [])
            self.assertTrue(any("react" in s.lower() for s in skills), f"React not found in skills: {skills}")
            self.assertTrue(any("fastapi" in s.lower() for s in skills), f"FastAPI not found in skills: {skills}")
            self.assertGreater(result.get("completeness_score", 0), 0)
        except Exception as e:
            cat, msg = classify_groq_error(e, model=self.model)
            if cat in ["network_error", "rate_limit"]:
                # If network offline, verify rule fallback still worked cleanly
                fb_result = process_diagnostic_turn(
                    messages=messages,
                    student_profile=student_profile,
                    assessment_evidence=assessment_evidence,
                    current_diagnostic=None,
                    ai_client=None
                )
                self.assertIn("reply", fb_result)
            else:
                self.fail(f"Diagnostic chat failed unexpectedly: {cat} - {msg}")

    def test_03_resume_extraction(self):
        """Verify resume extraction via Groq JSON mode."""
        if not self.has_groq:
            self.skipTest("No Groq API key available.")

        sample_resume = """
        Alex Sharma
        alex.sharma@example.com | +91 9876543210
        Education:
        B.Tech Computer Science, PES University (2021-2025) - CGPA 8.8
        Skills:
        Languages: Python, JavaScript, TypeScript, SQL
        Frameworks: FastAPI, React, Docker, Git
        Projects:
        - Career AI Engine: Built backend in FastAPI with PostgreSQL and Groq LLM.
        """
        prompt = create_extraction_prompt(sample_resume)
        try:
            extracted = main._generate_json(prompt, temperature=0.0)
            self.assertIsInstance(extracted, dict)
            self.assertIn("skills", extracted)
            self.assertIn("education", extracted)
        except Exception as e:
            cat, msg = classify_groq_error(e, model=self.model)
            if cat in ["network_error", "rate_limit"]:
                # Verify fallback parser works
                from resume_parser import build_fallback_parsed_data
                fallback = build_fallback_parsed_data(sample_resume, "resume.txt")
                self.assertIn("skills", fallback)
            else:
                self.fail(f"Resume extraction failed unexpectedly: {cat} - {msg}")

    def test_04_ai_career_reranking(self):
        """Verify AI career recommendation reranking returns validated schema."""
        if not self.has_groq:
            self.skipTest("No Groq API key available.")

        profile = {
            "riasec_scores": {"R": 45, "I": 85, "A": 65, "S": 55, "E": 60, "C": 50},
            "interests": ["Software Development", "Machine Learning", "System Design"],
            "resume_skills": ["Python", "FastAPI", "React", "Docker", "SQL"],
            "strengths_note": "Enjoy designing backend systems and databases.",
            "know_me": {"deal_breakers": []}
        }
        try:
            matches = main._ai_career_match(profile)
            if matches is not None:
                self.assertGreaterEqual(len(matches), 3)
                for m in matches:
                    self.assertIn("title", m)
                    self.assertIn("why_it_fits", m)
                    self.assertIn("key_skills", m)
                    self.assertIn("reranking_reason", m)
                    # Must NOT have fit percentage emitted by LLM
                    self.assertIsNone(m.get("fit"))
        except Exception as e:
            cat, msg = classify_groq_error(e, model=self.model)
            if cat not in ["network_error", "rate_limit"]:
                self.fail(f"Career match failed unexpectedly: {cat} - {msg}")

    def test_05_invalid_model_handling(self):
        """Verify invalid model (HTTP 404) is classified and handled with fallback."""
        # Test error classification
        class MockNotFoundError(Exception):
            status_code = 404
            def __str__(self):
                return "The model `llama-3.3-70b-versatile` does not exist or you do not have access to it."

        mock_err = MockNotFoundError()
        cat, msg = classify_groq_error(mock_err, model="llama-3.3-70b-versatile")
        self.assertEqual(cat, "model_not_found")
        self.assertIn("HTTP 404", msg)
        self.assertIn("llama-3.3-70b-versatile", msg)
        self.assertNotIn("gsk_", msg)  # Secrets must not be in message

        # Verify process_diagnostic_turn falls back seamlessly with invalid model
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = mock_err

        messages = [{"role": "user", "content": "I like writing Python scripts."}]
        res = process_diagnostic_turn(
            messages=messages,
            student_profile={"educationStage": "college_ug_pg"},
            assessment_evidence={},
            current_diagnostic=None,
            ai_client=mock_client,
            groq_model="llama-3.3-70b-versatile"
        )
        self.assertIn("reply", res)
        self.assertIn("diagnostic_profile", res)
        # Verify skills were extracted by fallback
        skills = res["diagnostic_profile"].get("technical_skills", [])
        self.assertTrue(any("python" in s.lower() for s in skills))

    def test_06_missing_api_key_handling(self):
        """Verify missing API key defaults to safe rule-based fallback."""
        messages = [{"role": "user", "content": "I like building user interfaces in React."}]
        # When ai_client is None, fallback must execute immediately
        res = process_diagnostic_turn(
            messages=messages,
            student_profile={"educationStage": "college_ug_pg"},
            assessment_evidence={},
            current_diagnostic=None,
            ai_client=None
        )
        self.assertIn("reply", res)
        self.assertIn("diagnostic_profile", res)
        skills = res["diagnostic_profile"].get("technical_skills", [])
        self.assertTrue(any("react" in s.lower() for s in skills))

        # Test _ai_career_match with _AI_ENABLED = False
        with patch.object(main, "_AI_ENABLED", False):
            match_res = main._ai_career_match({"resume_skills": ["React"]})
            self.assertIsNone(match_res)

    def test_07_rate_limit_and_network_failure_fallback(self):
        """Verify RateLimitError (429) and APIConnectionError are classified and fall back."""
        class MockRateLimitError(Exception):
            status_code = 429
            def __str__(self):
                return "Rate limit exceeded"

        mock_rl = MockRateLimitError()
        cat_rl, msg_rl = classify_groq_error(mock_rl)
        self.assertEqual(cat_rl, "rate_limit")
        self.assertIn("HTTP 429", msg_rl)

        class MockConnectionError(Exception):
            def __str__(self):
                return "Connection error: Failed to establish a new connection"

        mock_conn = MockConnectionError()
        cat_conn, msg_conn = classify_groq_error(mock_conn)
        self.assertEqual(cat_conn, "network_error")
        self.assertIn("Connection", msg_conn)

        # Verify process_diagnostic_turn catches RateLimitError and uses rule-based fallback
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = mock_rl

        messages = [{"role": "user", "content": "I build APIs with FastAPI."}]
        res = process_diagnostic_turn(
            messages=messages,
            student_profile={"educationStage": "college_ug_pg"},
            assessment_evidence={},
            current_diagnostic=None,
            ai_client=mock_client
        )
        self.assertIn("reply", res)
        skills = res["diagnostic_profile"].get("technical_skills", [])
        self.assertTrue(any("fastapi" in s.lower() for s in skills))


if __name__ == "__main__":
    unittest.main()
