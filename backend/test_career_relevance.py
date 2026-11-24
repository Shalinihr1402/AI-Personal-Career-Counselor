"""
test_career_relevance.py
Comprehensive Multi-Profile Automated Regression Test Suite
Validates Multi-Signal Candidate Retrieval, Balanced 6-Signal Scoring,
and Domain Relevance across Diverse Educational and Career Backgrounds.
"""

import os
import sys
import unittest

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import matcher
import career_knowledge_base


class TestCareerRelevanceMultiProfile(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        matcher._load_engine()

    # ------------------------------------------------------------------------
    # Profile 1: MCA Graduate Targeting AI/ML
    # ------------------------------------------------------------------------
    def test_profile_1_mca_aiml(self):
        profile = {
            "education": "MCA",
            "career_goals": "AI/ML Software Engineer",
            "interests": ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Software Development"],
            "resume_skills": ["Python", "Java", "Flask", "FastAPI", "SQL", "Pandas", "Scikit-learn", "PyTorch", "OpenCV"],
            "projects": [
                {"name": "Object detection using PyTorch and OpenCV", "technologies": ["PyTorch", "OpenCV", "Python"]},
                {"name": "Predictive machine learning applications", "technologies": ["Scikit-learn", "Pandas", "Python"]},
                {"name": "REST API development using FastAPI and SQL", "technologies": ["FastAPI", "SQL", "Python"]}
            ],
            "riasec_scores": {"I": 25, "R": 22, "C": 21, "A": 15, "S": 10, "E": 5}
        }

        candidates = matcher.hybrid_career_match(
            riasec_scores=profile["riasec_scores"],
            interests=profile["interests"],
            resume_skills=profile["resume_skills"],
            career_goals=profile["career_goals"],
            projects=profile["projects"],
            limit=35
        )

        self.assertGreaterEqual(len(candidates), 15, "Candidate pool should contain at least 15 candidates")
        top_5_titles = [c["title"] for c in candidates[:5]]
        top_10_titles = [c["title"] for c in candidates[:10]]

        # Rule 1: Data Scientists must be retrieved within the top 10 candidates
        self.assertIn("Data Scientists", top_10_titles, f"Data Scientists must be in top 10 candidates. Top 10: {top_10_titles}")

        # Rule 2: At least 3 of top 5 must belong to computing, software, or data science
        computing_keywords = ["computer", "software", "data", "information", "developer", "scientist", "analyst"]
        computing_in_top_5 = sum(1 for t in top_5_titles if any(k in t.lower() for k in computing_keywords))
        self.assertGreaterEqual(computing_in_top_5, 3, f"Expected >= 3 computing roles in top 5, got {computing_in_top_5}: {top_5_titles}")

        # Rule 3: Unsupported hardware or astronomy roles must NOT be in top 3
        unsupported_top_roles = {"Astronomers", "Computer Hardware Engineers", "Robotics Engineers", "Geographic Information Systems Technologists and Technicians"}
        top_3_titles = set(top_5_titles[:3])
        overlap = top_3_titles.intersection(unsupported_top_roles)
        self.assertEqual(len(overlap), 0, f"Unsupported physical/hardware roles in top 3: {overlap}")

        # Rule 4: Explanations must cite concrete profile evidence
        top_c = candidates[0]
        self.assertTrue(
            any(w in top_c["why_it_fits"] for w in ["PyTorch", "Scikit-learn", "Python", "AI", "project", "software"]),
            f"Explanation failed to cite concrete profile evidence: {top_c['why_it_fits']}"
        )

        # Rule 5: Statutory Knowledge Base verification for MCA
        res_hw = career_knowledge_base.check_career_eligibility("computer-hardware-engineers", "MCA")
        self.assertEqual(res_hw.eligibility_type, "alternative_pathway", "MCA should be alternative_pathway for hardware engineering")
        res_rob = career_knowledge_base.check_career_eligibility("robotics-engineers", "MCA")
        self.assertEqual(res_rob.eligibility_type, "alternative_pathway", "MCA should be alternative_pathway for robotics engineering")

    # ------------------------------------------------------------------------
    # Profile 2: MCA Graduate Targeting Java Backend Development
    # ------------------------------------------------------------------------
    def test_profile_2_mca_java_backend(self):
        profile = {
            "education": "MCA",
            "career_goals": "Java Backend Developer",
            "interests": ["Software Development", "Backend Architecture", "Database Systems"],
            "resume_skills": ["Java", "Spring Boot", "SQL", "PostgreSQL", "Docker", "Microservices", "Git"],
            "projects": [
                {"name": "E-Commerce Microservices", "technologies": ["Java", "Spring Boot", "PostgreSQL", "Docker"]}
            ],
            "riasec_scores": {"I": 24, "C": 22, "R": 18, "E": 12, "S": 10, "A": 8}
        }

        candidates = matcher.hybrid_career_match(
            riasec_scores=profile["riasec_scores"],
            interests=profile["interests"],
            resume_skills=profile["resume_skills"],
            career_goals=profile["career_goals"],
            projects=profile["projects"],
            limit=25
        )

        top_5_titles = [c["title"] for c in candidates[:5]]
        # Core software engineering / development roles should be in the top 3
        sw_roles = {"Software Developers", "Web Developers", "Computer Systems Engineers/Architects", "Computer Systems Analysts", "Computer Programmers", "Database Administrators"}
        self.assertTrue(any(t in sw_roles for t in top_5_titles[:3]), f"Expected core software role in top 3. Got: {top_5_titles}")

        # Check that Java is cited in why_it_fits
        top_sw = next(c for c in candidates if c["title"] in sw_roles)
        self.assertTrue("Java" in top_sw["why_it_fits"] or "Spring" in top_sw["why_it_fits"] or "software" in top_sw["why_it_fits"].lower())

    # ------------------------------------------------------------------------
    # Profile 3: BCA Graduate Targeting Full Stack Development
    # ------------------------------------------------------------------------
    def test_profile_3_bca_fullstack(self):
        profile = {
            "education": "BCA",
            "career_goals": "Full Stack Web Developer",
            "interests": ["Web Development", "Frontend", "Cloud Applications"],
            "resume_skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "HTML", "CSS", "MongoDB"],
            "projects": [
                {"name": "Collaborative Kanban Board", "technologies": ["React", "Node.js", "MongoDB", "Express"]}
            ],
            "riasec_scores": {"C": 25, "I": 20, "A": 18, "R": 12, "E": 10, "S": 8}
        }

        candidates = matcher.hybrid_career_match(
            riasec_scores=profile["riasec_scores"],
            interests=profile["interests"],
            resume_skills=profile["resume_skills"],
            career_goals=profile["career_goals"],
            projects=profile["projects"],
            limit=25
        )

        top_5_titles = [c["title"] for c in candidates[:5]]
        web_sw_pool = {"Web Developers", "Software Developers", "Web and Digital Interface Designers", "Computer Programmers"}
        self.assertTrue(any(t in web_sw_pool for t in top_5_titles), f"Expected Web/Full Stack role in top 5. Got: {top_5_titles}")

    # ------------------------------------------------------------------------
    # Profile 4: B.Com Graduate Targeting Finance
    # ------------------------------------------------------------------------
    def test_profile_4_bcom_finance(self):
        profile = {
            "education": "B.Com",
            "career_goals": "Financial Analyst and Corporate Accountant",
            "interests": ["Corporate Finance", "Accounting", "Auditing", "Banking"],
            "resume_skills": ["Financial Modeling", "Microsoft Excel", "Tally", "Auditing", "Taxation", "Accounting"],
            "projects": [
                {"name": "Equity Valuation & DCF Financial Model", "technologies": ["Financial Modeling", "Microsoft Excel"]}
            ],
            "riasec_scores": {"C": 26, "E": 22, "I": 18, "S": 10, "A": 8, "R": 6}
        }

        candidates = matcher.hybrid_career_match(
            riasec_scores=profile["riasec_scores"],
            interests=profile["interests"],
            resume_skills=profile["resume_skills"],
            career_goals=profile["career_goals"],
            projects=profile["projects"],
            limit=25
        )

        top_5_titles = [c["title"] for c in candidates[:5]]
        finance_fields = {"Business, Management & Finance", "Finance", "Business"}
        finance_in_top_5 = sum(1 for c in candidates[:5] if any(f.lower() in c.get("field", "").lower() for f in finance_fields) or any(k in c["title"].lower() for k in ["financial", "accountant", "auditor", "budget", "actuary"]))
        self.assertGreaterEqual(finance_in_top_5, 3, f"Expected >= 3 finance roles in top 5, got {finance_in_top_5}: {top_5_titles}")

        # Software engineering should NOT be in top 3 for a finance graduate with no programming
        self.assertNotIn("Software Developers", top_5_titles[:3])

    # ------------------------------------------------------------------------
    # Profile 5: B.Tech CSE Graduate Targeting Software Engineering
    # ------------------------------------------------------------------------
    def test_profile_5_btech_cse_software(self):
        profile = {
            "education": "B.Tech CSE",
            "career_goals": "Cloud & Distributed Systems Software Engineer",
            "interests": ["Cloud Computing", "Distributed Systems", "Operating Systems"],
            "resume_skills": ["C++", "Python", "Go", "Kubernetes", "Docker", "AWS", "Linux", "Git"],
            "projects": [
                {"name": "Distributed Consensus Key-Value Store", "technologies": ["Go", "Docker", "Kubernetes", "Linux"]}
            ],
            "riasec_scores": {"I": 25, "R": 20, "C": 18, "A": 10, "E": 12, "S": 8}
        }

        candidates = matcher.hybrid_career_match(
            riasec_scores=profile["riasec_scores"],
            interests=profile["interests"],
            resume_skills=profile["resume_skills"],
            career_goals=profile["career_goals"],
            projects=profile["projects"],
            limit=25
        )

        top_5_titles = [c["title"] for c in candidates[:5]]
        self.assertIn("Software Developers", top_5_titles, f"Software Developers must be in top 5 for B.Tech CSE. Top 5: {top_5_titles}")

    # ------------------------------------------------------------------------
    # Profile 6: Mechanical Engineering Graduate Targeting Robotics
    # ------------------------------------------------------------------------
    def test_profile_6_mech_robotics(self):
        profile = {
            "education": "B.Tech Mechanical Engineering",
            "career_goals": "Robotics & Automation Engineer",
            "interests": ["Robotics", "Mechatronics", "Automation", "Embedded Systems"],
            "resume_skills": ["ROS", "SolidWorks", "PLC", "AutoCAD", "C++", "Python", "Microcontrollers", "MATLAB"],
            "projects": [
                {"name": "Autonomous Mobile Robot with SLAM and LiDAR", "technologies": ["ROS", "C++", "SolidWorks", "Python"]}
            ],
            "riasec_scores": {"R": 26, "I": 22, "C": 18, "E": 10, "A": 8, "S": 6}
        }

        candidates = matcher.hybrid_career_match(
            riasec_scores=profile["riasec_scores"],
            interests=profile["interests"],
            resume_skills=profile["resume_skills"],
            career_goals=profile["career_goals"],
            projects=profile["projects"],
            limit=25
        )

        top_5_titles = [c["title"] for c in candidates[:5]]
        robotics_pool = {"Robotics Engineers", "Mechatronics Engineers", "Mechanical Engineers"}
        self.assertTrue(
            any(t in robotics_pool for t in top_5_titles[:3]),
            f"Robotics or Mechatronics should be in top 3 when student has ROS and SolidWorks. Top 5: {top_5_titles}"
        )


class TestSkillMatchingAndJobZoneAudit(unittest.TestCase):
    """
    Regression test suite for:
    1. C programming skill recognition (exact & alias matching).
    2. R programming skill recognition (exact & alias matching).
    3. OpenCV not matching C (avoiding single-character substring collision).
    4. Scikit-learn not matching R (avoiding single-character substring collision).
    5. Job Zone 5 not automatically creating a statutory restriction.
    """
    def test_01_c_programming_skill_recognition(self):
        from skill_normalizer import is_skill_match
        self.assertTrue(is_skill_match("C", "C"))
        self.assertTrue(is_skill_match("C", "C Programming"))
        self.assertTrue(is_skill_match("C Programming", "C"))
        self.assertTrue(is_skill_match("C Language", "C (Programming Language)"))
        self.assertTrue(is_skill_match("ANSI C", "C"))

        # Verify evidence matcher matches C when required
        dummy_career = {"skills": ["C", "Git"], "software_tools": []}
        score, matched, _, _ = matcher.compute_skill_project_evidence(
            student_skills=["C", "Python"],
            career=dummy_career
        )
        self.assertIn("C", matched)

    def test_02_r_programming_skill_recognition(self):
        from skill_normalizer import is_skill_match
        self.assertTrue(is_skill_match("R", "R"))
        self.assertTrue(is_skill_match("R", "R Programming"))
        self.assertTrue(is_skill_match("R Programming", "R"))
        self.assertTrue(is_skill_match("R Language", "R (Programming Language)"))
        self.assertTrue(is_skill_match("RStudio", "R"))

        # Verify evidence matcher matches R when required
        dummy_career = {"skills": ["R", "Statistics"], "software_tools": []}
        score, matched, _, _ = matcher.compute_skill_project_evidence(
            student_skills=["R", "SQL"],
            career=dummy_career
        )
        self.assertIn("R", matched)

    def test_03_opencv_not_matching_c(self):
        from skill_normalizer import is_skill_match
        self.assertFalse(is_skill_match("OpenCV", "C"))
        self.assertFalse(is_skill_match("C", "OpenCV"))

        # Verify in matcher that a student with only OpenCV does NOT match C
        dummy_career = {"skills": ["C", "Hardware Architecture"], "software_tools": []}
        score, matched, _, _ = matcher.compute_skill_project_evidence(
            student_skills=["OpenCV", "PyTorch"],
            career=dummy_career
        )
        self.assertNotIn("OpenCV", matched)
        self.assertNotIn("C", matched)

    def test_04_scikitlearn_not_matching_r(self):
        from skill_normalizer import is_skill_match
        self.assertFalse(is_skill_match("Scikit-learn", "R"))
        self.assertFalse(is_skill_match("R", "Scikit-learn"))

        # Verify in matcher that a student with only Scikit-learn does NOT match R
        dummy_career = {"skills": ["R", "Bioinformatics"], "software_tools": []}
        score, matched, _, _ = matcher.compute_skill_project_evidence(
            student_skills=["Scikit-learn", "Pandas"],
            career=dummy_career
        )
        self.assertNotIn("Scikit-learn", matched)
        self.assertNotIn("R", matched)

    def test_05_job_zone_5_not_automatically_statutory_restriction(self):
        from career_knowledge_base import check_career_eligibility, get_career_knowledge
        
        # Test 1: Computer and Information Research Scientists is an O*NET Job Zone 5 occupation
        rec = get_career_knowledge("computer-and-information-research-scientists")
        self.assertIsNotNone(rec)
        # Verify that mandatory licensing is FALSE (no statutory parliamentary restriction)
        self.assertFalse(rec.education_pathways.mandatory_licensing.is_mandatory)
        self.assertIsNone(rec.education_pathways.mandatory_licensing.statutory_act)

        # Test 2: An MCA graduate is direct_eligible (not barred by statutory restriction)
        res = check_career_eligibility("computer-and-information-research-scientists", "Master of Computer Applications")
        self.assertTrue(res.is_eligible)
        self.assertFalse(res.mandatory_licensing_required)
        self.assertEqual(res.eligibility_type, "direct_eligible")

        # Test 3: Contrast with a genuine statutory restriction (e.g. General Medical Practitioner / MBBS under NMC Act)
        mbbs_rec = get_career_knowledge("general-medical-practitioner")
        self.assertIsNotNone(mbbs_rec)
        self.assertTrue(mbbs_rec.education_pathways.mandatory_licensing.is_mandatory)
        self.assertIsNotNone(mbbs_rec.education_pathways.mandatory_licensing.statutory_act)


if __name__ == "__main__":
    unittest.main()
