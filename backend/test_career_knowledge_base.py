"""
test_career_knowledge_base.py
Comprehensive Integration and Unit Tests for Phase 4.2 Evidence-Based Career Knowledge Base.

Covers all 18 required scenarios:
 1. Class 10 student (exploratory, vocational & polytechnic eligibility)
 2. Class 12 Science student (PCB vs PCM pathways, engineering vs medical)
 3. Class 12 Commerce student (CA, B.Com, Law, non-science restrictions)
 4. ITI student (Direct craftsman technician eligibility)
 5. Diploma student (Junior engineer, CAD, lateral B.Tech entry)
 6. BCA student (Software and tech career eligibility)
 7. B.Com student (Accounting, finance, CA direct entry)
 8. B.Tech student (Engineering and tech careers)
 9. B.Sc Agriculture student (Agronomist and agribusiness careers)
10. MCA student (Senior software and backend development)
11. MBA student (Product and business management)
12. Fresh graduate (Fresher-friendly opportunities and internship pathways)
13. Experienced professional (Career progression ladders and seniority)
14. Career switcher (Transferable skills and bridge pathways)
15. Career-break returner (Re-entry and practical demonstration)
16. Dropout or gap-year candidate (Skill-first portfolio pathways)
17. Unfamiliar qualification (No fabricated eligibility, clarification needed)
18. Career with mandatory professional licensing (NMC, BCI, PCI, ICAI statutory enforcement)

Plus Data Integrity & Retrieval verification:
19. Unique Career IDs and 1,000+ O*NET coverage preservation
20. Reusable Competency linkage and demonstration methods
"""

import unittest
from typing import Dict, Any

from education_classifier import (
    AcademicDomain,
    EducationLevel,
    ClassifiedEducation,
    classify_education,
)
from career_knowledge_base import (
    CareerKnowledgeBase,
    CareerKnowledgeRecord,
    EligibilityResult,
    RegulatoryStatus,
    CompetencyCategory,
    ProficiencyLevel,
    CompetencyImportance,
    get_career_knowledge,
    check_career_eligibility,
    search_careers_by_qualification,
    search_careers_by_competencies,
)


class TestCareerKnowledgeBase(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.ckb = CareerKnowledgeBase.get_instance()

    # ------------------------------------------------------------------------
    # Scenario 1: Class 10 Student
    # ------------------------------------------------------------------------
    def test_01_class_10_student(self):
        """Scenario 1: Class 10 student exploring ITI/polytechnic vs degree requirements"""
        edu_10th = {
            "education_level": "sslc_10th",
            "school_stream": "general",
            "favorite_school_subjects": ["Mathematics", "Science"],
        }
        # Eligible for ITI and Polytechnic
        res_iti = check_career_eligibility("industrial-electrician", edu_10th)
        self.assertTrue(res_iti.is_eligible)
        self.assertEqual(res_iti.eligibility_type, "direct_eligible")

        res_poly = check_career_eligibility("polytechnic-mechanical-technician", edu_10th)
        self.assertTrue(res_poly.is_eligible)

        # Ineligible for direct degree-level careers (requires 10+2 and college)
        res_doc = check_career_eligibility("general-medical-practitioner", edu_10th)
        self.assertFalse(res_doc.is_eligible)
        self.assertEqual(res_doc.eligibility_type, "prerequisite_required")
        self.assertIn("10+2", res_doc.reason)

        res_sw = check_career_eligibility("java-backend-developer", edu_10th)
        self.assertFalse(res_sw.is_eligible)
        self.assertEqual(res_sw.eligibility_type, "prerequisite_required")

    # ------------------------------------------------------------------------
    # Scenario 2: Class 12 Science Student
    # ------------------------------------------------------------------------
    def test_02_class_12_science_student(self):
        """Scenario 2: Class 12 Science student (PCM vs PCB pathways)"""
        pcm_profile = {"education_level": "puc_12th", "school_stream": "science_pcm"}
        pcb_profile = {"education_level": "puc_12th", "school_stream": "science_pcb"}

        # PCM eligible for Engineering & Tech
        res_pcm_eng = check_career_eligibility("java-backend-developer", pcm_profile)
        self.assertTrue(res_pcm_eng.is_eligible)

        # PCB eligible for Medical / Pharma
        res_pcb_med = check_career_eligibility("general-medical-practitioner", pcb_profile)
        self.assertTrue(res_pcb_med.is_eligible)
        self.assertEqual(res_pcb_med.eligibility_type, "preferred_pathway")

        res_pcb_pharma = check_career_eligibility("pharmacist", pcb_profile)
        self.assertTrue(res_pcb_pharma.is_eligible)

        # PCM without Biology is ineligible for Medical
        res_pcm_med = check_career_eligibility("general-medical-practitioner", pcm_profile)
        self.assertFalse(res_pcm_med.is_eligible)
        self.assertEqual(res_pcm_med.eligibility_type, "restricted_ineligible")

    # ------------------------------------------------------------------------
    # Scenario 3: Class 12 Commerce Student
    # ------------------------------------------------------------------------
    def test_03_class_12_commerce_student(self):
        """Scenario 3: Class 12 Commerce student eligible for CA/B.Com, restricted from MBBS"""
        commerce_profile = {"education_level": "puc_12th", "school_stream": "commerce"}

        # Eligible for CA and financial pathways
        res_ca = check_career_eligibility("chartered-accountant", commerce_profile)
        self.assertTrue(res_ca.is_eligible)

        # Restricted from MBBS
        res_med = check_career_eligibility("general-medical-practitioner", commerce_profile)
        self.assertFalse(res_med.is_eligible)
        self.assertEqual(res_med.eligibility_type, "restricted_ineligible")
        self.assertIn("Biology", res_med.missing_prerequisites[0] if res_med.missing_prerequisites else res_med.reason)

    # ------------------------------------------------------------------------
    # Scenario 4: ITI Student
    # ------------------------------------------------------------------------
    def test_04_iti_student(self):
        """Scenario 4: ITI Electrician directly eligible for technical trades"""
        iti_profile = {"education_level": "iti_vocational", "course": "ITI", "specialization": "Electrician"}

        res = check_career_eligibility("industrial-electrician", iti_profile)
        self.assertTrue(res.is_eligible)
        self.assertEqual(res.eligibility_type, "direct_eligible")

    # ------------------------------------------------------------------------
    # Scenario 5: Diploma Student
    # ------------------------------------------------------------------------
    def test_05_diploma_student(self):
        """Scenario 5: Diploma Mechanical student eligible for CAD technician & lateral engineering"""
        diploma_profile = {"education_level": "diploma", "course": "Diploma in Mechanical Engineering"}

        res_tech = check_career_eligibility("polytechnic-mechanical-technician", diploma_profile)
        self.assertTrue(res_tech.is_eligible)
        self.assertEqual(res_tech.eligibility_type, "direct_eligible")

        res_lateral = check_career_eligibility("mechatronics-engineer", diploma_profile)
        self.assertTrue(res_lateral.is_eligible)
        self.assertIn(res_lateral.eligibility_type, ["direct_eligible", "alternative_pathway"])

    # ------------------------------------------------------------------------
    # Scenario 6: BCA Student
    # ------------------------------------------------------------------------
    def test_06_bca_student(self):
        """Scenario 6: BCA student eligible for software and backend development"""
        bca_profile = {"education_level": "undergraduate", "degree": "bca"}

        res = check_career_eligibility("java-backend-developer", bca_profile)
        self.assertTrue(res.is_eligible)
        self.assertIn(res.eligibility_type, ["direct_eligible", "preferred_pathway", "alternative_pathway"])

    # ------------------------------------------------------------------------
    # Scenario 7: B.Com Student
    # ------------------------------------------------------------------------
    def test_07_bcom_student(self):
        """Scenario 7: B.Com student eligible for CA Direct Entry and financial analyst"""
        bcom_profile = {"education_level": "undergraduate", "degree": "bcom"}

        careers = search_careers_by_qualification(bcom_profile, limit=10)
        self.assertGreater(len(careers), 0)
        titles = [c.canonical_title for c in careers]
        self.assertTrue(any("Account" in t or "Finance" in t or "Financial" in t for t in titles))

    # ------------------------------------------------------------------------
    # Scenario 8: B.Tech Student
    # ------------------------------------------------------------------------
    def test_08_btech_student(self):
        """Scenario 8: B.Tech Computer Science student eligible for software engineering"""
        btech_profile = {
            "education_level": "undergraduate",
            "degree": "btech_be",
            "specialization": "Computer Science & Engineering",
        }
        res = check_career_eligibility("java-backend-developer", btech_profile)
        self.assertTrue(res.is_eligible)

    # ------------------------------------------------------------------------
    # Scenario 9: B.Sc Agriculture Student
    # ------------------------------------------------------------------------
    def test_09_bsc_agriculture_student(self):
        """Scenario 9: B.Sc Agriculture student eligible for Agronomist and agricultural careers"""
        agri_profile = {"education_level": "undergraduate", "degree": "bsc_agri"}

        res = check_career_eligibility("agricultural-scientist", agri_profile)
        self.assertTrue(res.is_eligible)
        self.assertEqual(res.eligibility_type, "direct_eligible")

    # ------------------------------------------------------------------------
    # Scenario 10: MCA Student
    # ------------------------------------------------------------------------
    def test_10_mca_student(self):
        """Scenario 10: MCA student eligible for senior backend roles"""
        mca_profile = {"education_level": "postgraduate", "degree": "mca"}

        res = check_career_eligibility("java-backend-developer", mca_profile)
        self.assertTrue(res.is_eligible)

    # ------------------------------------------------------------------------
    # Scenario 11: MBA Student
    # ------------------------------------------------------------------------
    def test_11_mba_student(self):
        """Scenario 11: MBA student eligible for management and corporate leadership"""
        mba_profile = {"education_level": "postgraduate", "degree": "mba"}

        careers = search_careers_by_qualification(mba_profile, limit=10)
        self.assertGreater(len(careers), 0)

    # ------------------------------------------------------------------------
    # Scenario 12: Fresh Graduate
    # ------------------------------------------------------------------------
    def test_12_fresh_graduate(self):
        """Scenario 12: Fresher-eligible careers have entry_experience_level set appropriately"""
        career = get_career_knowledge("java-backend-developer")
        self.assertIsNotNone(career)
        self.assertTrue(career.experience_profile.fresher_eligible)
        self.assertEqual(career.experience_profile.entry_experience_level, "no_experience")
        self.assertGreater(len(career.work_profile.entry_level_job_titles), 0)

    # ------------------------------------------------------------------------
    # Scenario 13: Experienced Professional
    # ------------------------------------------------------------------------
    def test_13_experienced_professional(self):
        """Scenario 13: Seniority progression ladders are clearly articulated"""
        career = get_career_knowledge("java-backend-developer")
        progression = career.work_profile.career_progression
        self.assertGreaterEqual(len(progression), 4)
        self.assertTrue(any("Junior" in p for p in progression))
        self.assertTrue(any("Architect" in p or "Lead" in p for p in progression))

    # ------------------------------------------------------------------------
    # Scenario 14: Career Switcher
    # ------------------------------------------------------------------------
    def test_14_career_switcher(self):
        """Scenario 14: Transition pathways define bridge skills and difficulty"""
        career = get_career_knowledge("java-backend-developer")
        self.assertEqual(career.experience_profile.career_switch_friendliness, "high")
        self.assertGreater(len(career.transition_routes), 0)

        route = career.transition_routes[0]
        self.assertGreater(len(route.transferable_competencies), 0)
        self.assertGreater(len(route.bridge_skills_needed), 0)
        self.assertIn(route.difficulty, ["low", "medium", "high"])

        # Regulated profession has low switch friendliness
        doc_career = get_career_knowledge("general-medical-practitioner")
        self.assertEqual(doc_career.experience_profile.career_switch_friendliness, "low")

    # ------------------------------------------------------------------------
    # Scenario 15: Career-Break Returner
    # ------------------------------------------------------------------------
    def test_15_career_break_returner(self):
        """Scenario 15: Re-entry pathways emphasize demonstration over continuous tenure"""
        career = get_career_knowledge("java-backend-developer")
        notes = career.experience_profile.transferable_experience_notes
        self.assertIn("career break", notes.lower())

    # ------------------------------------------------------------------------
    # Scenario 16: Dropout or Gap-Year Candidate
    # ------------------------------------------------------------------------
    def test_16_dropout_gap_year_candidate(self):
        """Scenario 16: Skill-first careers evaluate as accessible alternative pathways"""
        dropout_profile = {
            "education_level": "undergraduate",
            "education_status": "discontinued",
            "course": "B.Tech (Incomplete)",
        }
        res = check_career_eligibility("java-backend-developer", dropout_profile)
        # Skill-first career allows entry based on demonstrated ability
        self.assertTrue(res.is_eligible)
        self.assertIn(res.eligibility_type, ["direct_eligible", "alternative_pathway"])

    # ------------------------------------------------------------------------
    # Scenario 17: Unfamiliar Qualification
    # ------------------------------------------------------------------------
    def test_17_unfamiliar_qualification(self):
        """Scenario 17: Unfamiliar qualification does NOT fabricate eligibility; requires clarification"""
        unfamiliar_profile = {
            "course": "Advanced Certificate in Quantum Astral Navigation",
            "institution": "Institute of Interstellar Mysticism",
        }
        res = check_career_eligibility("general-medical-practitioner", unfamiliar_profile)
        self.assertFalse(res.is_eligible)
        self.assertEqual(res.eligibility_type, "clarification_needed")
        self.assertIn("clarify", res.reason.lower())

    # ------------------------------------------------------------------------
    # Scenario 18: Mandatory Professional Licensing
    # ------------------------------------------------------------------------
    def test_18_mandatory_professional_licensing(self):
        """Scenario 18: Statutory licensing strictly enforced for Doctor, Lawyer, Pharmacist, and CA"""
        # Non-MBBS candidate attempting to practice medicine
        btech_profile = {"education_level": "undergraduate", "degree": "btech_be"}
        res_med = check_career_eligibility("general-medical-practitioner", btech_profile)
        self.assertFalse(res_med.is_eligible)
        self.assertEqual(res_med.eligibility_type, "restricted_ineligible")
        self.assertTrue(res_med.mandatory_licensing_required)
        self.assertEqual(res_med.licensing_details["regulatory_body"], "National Medical Commission (NMC) & State Medical Council")

        # Non-Law candidate attempting to practice as litigation lawyer
        res_law = check_career_eligibility("advocate-litigation-lawyer", btech_profile)
        self.assertFalse(res_law.is_eligible)
        self.assertEqual(res_law.eligibility_type, "restricted_ineligible")
        self.assertTrue(res_law.mandatory_licensing_required)
        self.assertEqual(res_law.licensing_details["regulatory_body"], "Bar Council of India (BCI) & State Bar Council")

        # Non-Pharmacy candidate attempting to be a pharmacist
        res_pharma = check_career_eligibility("pharmacist", btech_profile)
        self.assertFalse(res_pharma.is_eligible)
        self.assertTrue(res_pharma.mandatory_licensing_required)

        # Non-CA candidate attempting to be a statutory auditor CA
        res_ca = check_career_eligibility("chartered-accountant", btech_profile)
        self.assertFalse(res_ca.is_eligible)
        self.assertTrue(res_ca.mandatory_licensing_required)

    # ------------------------------------------------------------------------
    # Scenario 19: Unique IDs and Full Coverage Preservation
    # ------------------------------------------------------------------------
    def test_19_career_record_integrity_and_uniqueness(self):
        """Scenario 19: Career IDs are strictly unique and 1,000+ O*NET careers remain available"""
        all_recs = self.ckb._all_records
        self.assertGreaterEqual(len(all_recs), 1016)

        slugs = [r.slug for r in all_recs]
        self.assertEqual(len(slugs), len(set(slugs)), "Career slugs must be strictly unique!")

        # Verify O*NET SOC codes are maintained
        soc_codes = [r.soc_code for r in all_recs if r.soc_code]
        self.assertGreater(len(soc_codes), 900)

        # Verify every record has non-empty canonical title and domain
        for r in all_recs:
            self.assertTrue(bool(r.canonical_title.strip()))
            self.assertTrue(bool(r.domain.strip()))
            self.assertIsInstance(r.education_pathways.preferred_undergraduate, list)
            self.assertIsInstance(r.competencies, list)

    # ------------------------------------------------------------------------
    # Scenario 20: Competency Taxonomy Linkage
    # ------------------------------------------------------------------------
    def test_20_competency_linking_and_rubrics(self):
        """Scenario 20: Competencies have categories, rubrics, and demonstration methods"""
        java_career = get_career_knowledge("java-backend-developer")
        self.assertEqual(len(java_career.competencies), 10)

        # Competency search query
        found = search_careers_by_competencies(["Java Programming", "Spring Boot Framework"])
        self.assertGreater(len(found), 0)
        self.assertEqual(found[0].slug, "java-backend-developer")


if __name__ == "__main__":
    unittest.main(verbosity=2)
