"""
test_education_classifier.py
Integration and Unit Tests for Indian Education Classification Engine (Phase 4.1).

Covers all 17 required scenarios:
 1. Class 10 Science
 2. Class 12 Commerce
 3. ITI Electrician
 4. Polytechnic Mechanical
 5. BCA
 6. B.Tech Computer Science
 7. B.Com
 8. B.Sc Agriculture
 9. MBBS
10. B.Pharm
11. LLB
12. MCA
13. MBA
14. M.Sc Biotechnology
15. B.Voc Renewable Energy Management
16. Diploma in Mechatronics
17. Unknown and custom qualifications (with clarification resolution)
"""

import unittest
from typing import Dict, Any

from education_classifier import (
    AcademicDomain,
    EducationLevel,
    ClassifiedEducation,
    classify_education,
    resolve_clarification,
)


class TestEducationClassifier(unittest.TestCase):

    def test_01_class_10_science(self):
        """Scenario 1: Class 10 with Science focus"""
        payload = {
            "education_level": "sslc_10th",
            "school_stream": "science",
            "favorite_school_subjects": ["Mathematics", "Science (Physics, Chemistry, Biology)"],
            "subject_combination": "General Science & Mathematics",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.SECONDARY_SCHOOL.value)
        self.assertEqual(res.qualification, "sslc_10th")
        self.assertEqual(res.domain, AcademicDomain.PURE_APPLIED_SCIENCES.value)
        self.assertGreaterEqual(res.confidence, 0.85)
        self.assertFalse(res.requires_clarification)
        self.assertIn("Mathematics", res.primary_skills[0] or res.subjects[0])

    def test_02_class_12_commerce(self):
        """Scenario 2: Class 12 / Higher Secondary Commerce"""
        payload = {
            "education_level": "puc_12th",
            "school_stream": "commerce",
            "course": "12th Standard Commerce",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.HIGHER_SECONDARY.value)
        self.assertEqual(res.domain, AcademicDomain.COMMERCE_FINANCE.value)
        self.assertGreaterEqual(res.confidence, 0.85)
        self.assertFalse(res.requires_clarification)
        self.assertIn("Accountancy", res.subjects)

    def test_03_iti_electrician(self):
        """Scenario 3: ITI Craftsman Trade - Electrician"""
        payload = {
            "education_level": "iti_vocational",
            "course": "ITI",
            "specialization": "Electrician",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.ITI_VOCATIONAL.value)
        self.assertEqual(res.qualification, "iti_trade")
        self.assertEqual(res.domain, AcademicDomain.VOCATIONAL_TRADES.value)
        self.assertEqual(res.specialization, "Electrician")
        self.assertGreaterEqual(res.confidence, 0.85)
        self.assertFalse(res.requires_clarification)
        self.assertIn("Electrical Circuit Wiring", res.primary_skills)

    def test_04_polytechnic_mechanical(self):
        """Scenario 4: 3-Year Polytechnic Diploma - Mechanical Engineering"""
        payload = {
            "education_level": "diploma",
            "course": "Diploma in Mechanical Engineering",
            "specialization": "Mechanical Engineering",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.POLYTECHNIC_DIPLOMA.value)
        self.assertEqual(res.qualification, "polytechnic_diploma")
        self.assertEqual(res.domain, AcademicDomain.ENGINEERING_TECH.value)
        self.assertEqual(res.specialization, "Mechanical Engineering")
        self.assertGreaterEqual(res.confidence, 0.85)
        self.assertFalse(res.requires_clarification)

    def test_05_bca(self):
        """Scenario 5: Bachelor of Computer Applications (BCA)"""
        payload = {
            "education_level": "undergraduate",
            "degree": "bca",
            "course": "BCA",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "bca")
        self.assertEqual(res.domain, AcademicDomain.COMPUTER_APPLICATIONS.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)
        self.assertIn("Software Development", res.primary_skills)

    def test_06_btech_computer_science(self):
        """Scenario 6: B.Tech Computer Science & Engineering"""
        payload = {
            "education_level": "undergraduate",
            "degree": "btech_be",
            "specialization": "Computer Science & Engineering",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "btech_be")
        self.assertEqual(res.domain, AcademicDomain.ENGINEERING_TECH.value)
        self.assertEqual(res.specialization, "Computer Science & Engineering")
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_07_bcom(self):
        """Scenario 7: Bachelor of Commerce (B.Com)"""
        payload = {
            "education_level": "undergraduate",
            "degree": "bcom",
            "specialization": "Accounting & Finance",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "bcom")
        self.assertEqual(res.domain, AcademicDomain.COMMERCE_FINANCE.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_08_bsc_agriculture(self):
        """Scenario 8: B.Sc Agriculture / Horticulture"""
        payload = {
            "education_level": "undergraduate",
            "degree": "bsc_agri",
            "course": "B.Sc Agriculture",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "bsc_agri")
        self.assertEqual(res.domain, AcademicDomain.AGRICULTURE_ALLIED.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_09_mbbs(self):
        """Scenario 9: Bachelor of Medicine, Bachelor of Surgery (MBBS)"""
        payload = {
            "education_level": "undergraduate",
            "degree": "mbbs",
            "course": "MBBS",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "mbbs")
        self.assertEqual(res.domain, AcademicDomain.MEDICAL_HEALTHCARE.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)
        self.assertIn("Clinical Diagnosis", res.primary_skills)

    def test_10_bpharm(self):
        """Scenario 10: Bachelor of Pharmacy (B.Pharm)"""
        payload = {
            "education_level": "undergraduate",
            "degree": "bpharm",
            "course": "B.Pharm",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "bpharm")
        self.assertEqual(res.domain, AcademicDomain.MEDICAL_HEALTHCARE.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_11_llb(self):
        """Scenario 11: Bachelor of Laws (LLB)"""
        payload = {
            "education_level": "undergraduate",
            "degree": "llb",
            "course": "LLB",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "llb")
        self.assertEqual(res.domain, AcademicDomain.LEGAL_STUDIES.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_12_mca(self):
        """Scenario 12: Master of Computer Applications (MCA)"""
        payload = {
            "education_level": "postgraduate",
            "degree": "mca",
            "course": "MCA",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.POSTGRADUATE.value)
        self.assertEqual(res.qualification, "mca")
        self.assertEqual(res.domain, AcademicDomain.COMPUTER_APPLICATIONS.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_13_mba(self):
        """Scenario 13: Master of Business Administration (MBA)"""
        payload = {
            "education_level": "postgraduate",
            "degree": "mba",
            "course": "MBA",
            "specialization": "Marketing Management",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.POSTGRADUATE.value)
        self.assertEqual(res.qualification, "mba")
        self.assertEqual(res.domain, AcademicDomain.MANAGEMENT_BUSINESS.value)
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_14_msc_biotechnology(self):
        """Scenario 14: M.Sc Biotechnology"""
        payload = {
            "education_level": "postgraduate",
            "degree": "msc",
            "specialization": "Biotechnology",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.POSTGRADUATE.value)
        self.assertEqual(res.qualification, "msc")
        self.assertEqual(res.domain, AcademicDomain.PURE_APPLIED_SCIENCES.value)
        self.assertEqual(res.specialization, "Biotechnology")
        self.assertGreaterEqual(res.confidence, 0.90)
        self.assertFalse(res.requires_clarification)

    def test_15_bvoc_renewable_energy(self):
        """Scenario 15: B.Voc Renewable Energy Management"""
        payload = {
            "education_level": "undergraduate",
            "course": "B.Voc Renewable Energy Management",
            "specialization": "Renewable Energy Management",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res.qualification, "bvoc")
        # Inferred domain is engineering_tech or vocational_trades
        self.assertIn(res.domain, [AcademicDomain.ENGINEERING_TECH.value, AcademicDomain.VOCATIONAL_TRADES.value])
        self.assertEqual(res.specialization, "Renewable Energy Management")
        self.assertGreaterEqual(res.confidence, 0.85)
        self.assertFalse(res.requires_clarification)

    def test_16_diploma_mechatronics(self):
        """Scenario 16: Diploma in Mechatronics Engineering"""
        payload = {
            "education_level": "diploma",
            "course": "Diploma in Mechatronics",
            "specialization": "Mechatronics",
        }
        res = classify_education(payload)
        self.assertEqual(res.level, EducationLevel.POLYTECHNIC_DIPLOMA.value)
        self.assertEqual(res.qualification, "polytechnic_diploma")
        self.assertEqual(res.domain, AcademicDomain.ENGINEERING_TECH.value)
        self.assertEqual(res.specialization, "Mechatronics")
        self.assertGreaterEqual(res.confidence, 0.85)
        self.assertFalse(res.requires_clarification)
        self.assertIn("PLC Programming", res.subjects)

    def test_17_unknown_custom_qualification(self):
        """Scenario 17: Unknown/Custom qualification requesting clarification and resolving cleanly"""
        payload = {
            "course": "Advanced Certificate in Quantum Astral Navigation",
            "institution": "Institute of Interstellar Mysticism",
        }
        res = classify_education(payload)
        self.assertLess(res.confidence, 0.80)
        self.assertTrue(res.requires_clarification)
        self.assertIsNotNone(res.clarification_prompt)
        self.assertGreater(len(res.suggested_domains), 0)
        self.assertEqual(res.domain, AcademicDomain.OTHER_SPECIALIZED.value)

        # Resolve clarification with candidate choice
        resolved = resolve_clarification(res, chosen_domain=AcademicDomain.PURE_APPLIED_SCIENCES.value)
        self.assertEqual(resolved.domain, AcademicDomain.PURE_APPLIED_SCIENCES.value)
        self.assertGreaterEqual(resolved.confidence, 0.90)
        self.assertFalse(resolved.requires_clarification)
        self.assertIsNone(resolved.clarification_prompt)

    def test_18_free_text_inputs(self):
        """Scenario 18: Free string qualification extraction"""
        res1 = classify_education("B.Tech in Artificial Intelligence from VTU")
        self.assertEqual(res1.level, EducationLevel.UNDERGRADUATE.value)
        self.assertEqual(res1.qualification, "btech_be")
        self.assertEqual(res1.domain, AcademicDomain.ENGINEERING_TECH.value)
        self.assertEqual(res1.specialization, "Artificial Intelligence")

        res2 = classify_education("10th Standard CBSE Board")
        self.assertEqual(res2.level, EducationLevel.SECONDARY_SCHOOL.value)
        self.assertEqual(res2.qualification, "sslc_10th")

        res3 = classify_education("Chartered Accountant (CA Final)")
        self.assertEqual(res3.level, EducationLevel.PROFESSIONAL_CERTIFICATION.value)
        self.assertEqual(res3.qualification, "chartered_accountant")
        self.assertEqual(res3.domain, AcademicDomain.COMMERCE_FINANCE.value)

    def test_19_serialization_structure(self):
        """Scenario 19: Serialization to dict produces expected schema keys without side-effects"""
        res = classify_education({"education_level": "undergraduate", "degree": "bca"})
        d = res.to_dict()
        required_keys = [
            "level", "qualification", "qualification_name", "domain", "domain_name",
            "course_or_stream", "specialization", "subjects", "academic_stage",
            "primary_skills", "learning_outcomes", "confidence", "requires_clarification",
            "clarification_prompt", "suggested_domains", "is_custom_or_unfamiliar", "metadata"
        ]
        for key in required_keys:
            self.assertIn(key, d)
        self.assertIsInstance(d["subjects"], list)
        self.assertIsInstance(d["primary_skills"], list)
        self.assertIsInstance(d["learning_outcomes"], list)


if __name__ == "__main__":
    unittest.main(verbosity=2)
