"""
test_issue7_career_eligibility.py
Automated test suite verifying Issue 7 fixes:
1. Industrial Electrician false eligibility fix (statutory licensing check).
2. Java Backend Developer direct eligibility for MCA and BCA qualifications.
3. Software/IT domain compatibility without blind application to electrical/mechanical trades.
4. Graduate bridge pathways for Law (3-Year LLB) and Chartered Accountancy (ICAI Direct Entry Scheme).
5. Statutory medical/dental/nursing/pharmacy restrictions strictly enforced.
6. Integration with adaptive assessment statutory eligibility payload.
"""

import unittest
from career_knowledge_base import CareerKnowledgeBase
from education_classifier import classify_education, are_domains_compatible_for_tech, AcademicDomain
from adaptive_assessment import AdaptiveAssessmentEngine, AssessmentStage


class TestIssue7CareerEligibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ckb = CareerKnowledgeBase.get_instance()

    def test_01_mca_industrial_electrician_restricted(self):
        """Verify an MCA student is restricted/ineligible for Industrial Electrician."""
        classified = classify_education("mca")
        result = self.ckb.check_eligibility("industrial-electrician", classified)
        self.assertFalse(result.is_eligible)
        self.assertEqual(result.eligibility_type, "restricted_ineligible")
        self.assertTrue(result.mandatory_licensing_required)
        self.assertIn("Indian Electricity Rules", result.reason)
        self.assertIn("State Electrical Licensing Board", result.reason)
        self.assertFalse(result.prerequisites_met)
        self.assertIn("NCVET ITI Electrician/Wireman Trade Certificate or Electrical Engineering Diploma", result.missing_prerequisites)

    def test_02_bca_bcom_btech_cse_industrial_electrician_restricted(self):
        """Verify BCA, B.Com, and B.Tech CSE students are also restricted from Industrial Electrician."""
        for deg in ["bca", "b.com", "b.tech cse", "b.sc chemistry"]:
            classified = classify_education(deg)
            result = self.ckb.check_eligibility("industrial-electrician", classified)
            self.assertFalse(result.is_eligible, f"Expected {deg} to be ineligible for Industrial Electrician")
            self.assertEqual(result.eligibility_type, "restricted_ineligible")

    def test_03_mca_java_backend_developer_direct_eligible(self):
        """Verify an MCA student is Direct Eligible for Java Backend Developer."""
        classified = classify_education("mca")
        result = self.ckb.check_eligibility("java-backend-developer", classified)
        self.assertTrue(result.is_eligible)
        self.assertEqual(result.eligibility_type, "direct_eligible")
        self.assertIn("Master of Computer Applications (MCA)", result.reason)

    def test_04_bca_java_backend_developer_direct_eligible(self):
        """Verify a BCA student is Direct Eligible for Java Backend Developer."""
        classified = classify_education("bca")
        result = self.ckb.check_eligibility("java-backend-developer", classified)
        self.assertTrue(result.is_eligible)
        self.assertEqual(result.eligibility_type, "direct_eligible")
        self.assertIn("Bachelor of Computer Applications (BCA)", result.reason)

    def test_05_btech_cse_software_direct_eligible(self):
        """Verify a B.Tech CSE student is Direct Eligible for Java Backend Developer."""
        classified = classify_education("b.tech cse")
        result = self.ckb.check_eligibility("java-backend-developer", classified)
        self.assertTrue(result.is_eligible)
        self.assertEqual(result.eligibility_type, "direct_eligible")

    def test_06_software_domain_compatibility_helper(self):
        """Verify are_domains_compatible_for_tech correctly validates computer applications and engineering."""
        self.assertTrue(are_domains_compatible_for_tech("computer_applications", "engineering_tech"))
        self.assertTrue(are_domains_compatible_for_tech("engineering_tech", "computer_applications"))
        self.assertTrue(are_domains_compatible_for_tech("computer_applications", "computer_applications"))
        self.assertFalse(are_domains_compatible_for_tech("computer_applications", "medical_healthcare"))
        self.assertFalse(are_domains_compatible_for_tech("commerce_finance", "engineering_tech"))

    def test_07_software_domain_compatibility_not_applied_to_electrical_or_mechanical_trades(self):
        """Verify domain compatibility does NOT falsely make MCA/BCA direct eligible for non-software engineering."""
        for deg in ["mca", "bca"]:
            classified = classify_education(deg)
            # Industrial Electrician (trade) -> restricted
            elec_res = self.ckb.check_eligibility("industrial-electrician", classified)
            self.assertEqual(elec_res.eligibility_type, "restricted_ineligible")

            # Mechanical Engineering Technician (CAD/Production) -> alternative pathway (requires domain upskilling)
            mech_res = self.ckb.check_eligibility("polytechnic-mechanical-technician", classified)
            self.assertEqual(mech_res.eligibility_type, "alternative_pathway")

    def test_08_graduate_law_bridge_pathway(self):
        """Verify graduates in any discipline receive Alternative & Bridge for 3-Year LLB under BCI rules."""
        for deg in ["mca", "bca", "b.com", "b.tech cse", "b.sc physics"]:
            classified = classify_education(deg)
            result = self.ckb.check_eligibility("advocate-litigation-lawyer", classified)
            self.assertTrue(result.is_eligible, f"Expected {deg} to be eligible for 3-Year LLB pathway")
            self.assertEqual(result.eligibility_type, "alternative_pathway")
            self.assertIn("3-Year LLB", result.reason)
            self.assertIn("Bar Council of India (BCI)", result.reason)

    def test_09_graduate_ca_direct_entry_bridge_pathway(self):
        """Verify graduates receive Alternative & Bridge for CA via ICAI Direct Entry Scheme."""
        for deg in ["b.com", "mca", "bca", "b.tech cse"]:
            classified = classify_education(deg)
            result = self.ckb.check_eligibility("chartered-accountant", classified)
            self.assertTrue(result.is_eligible, f"Expected {deg} to be eligible for ICAI Direct Entry")
            self.assertEqual(result.eligibility_type, "alternative_pathway")
            self.assertIn("Direct Entry Scheme", result.reason)
            self.assertIn("ICAI", result.reason)

    def test_10_iti_electrician_direct_eligible_for_electrician(self):
        """Verify an ITI Electrician candidate is Direct Eligible for Industrial Electrician."""
        classified = classify_education("iti electrician")
        result = self.ckb.check_eligibility("industrial-electrician", classified)
        self.assertTrue(result.is_eligible)
        self.assertEqual(result.eligibility_type, "direct_eligible")

    def test_11_statutory_medical_restrictions_enforced(self):
        """Verify non-medical graduates are restricted from practicing medicine, dentistry, nursing, and pharmacy."""
        classified = classify_education("mca")
        for slug in ["general-medical-practitioner", "bds-dentist", "registered-nurse", "pharmacist"]:
            result = self.ckb.check_eligibility(slug, classified)
            self.assertFalse(result.is_eligible, f"Expected MCA to be ineligible for {slug}")
            self.assertEqual(result.eligibility_type, "restricted_ineligible")

    def test_12_adaptive_assessment_payload_has_correct_pathways_for_mca(self):
        """Verify adaptive assessment engine produces correct statutory tabs for MCA student."""
        engine = AdaptiveAssessmentEngine()
        answers = {f"q{i}": "a" for i in range(1, 31)}
        res = engine.score_adaptive_assessment(answers, profile={"education": "mca"})
        statutory = res.get("statutory_eligibility", {})

        eligible_slugs = [p["slug"] for p in statutory.get("eligible_pathways", [])]
        alternative_slugs = [p["slug"] for p in statutory.get("alternative_pathways", [])]
        restricted_slugs = [p["slug"] for p in statutory.get("statutory_restrictions", [])]

        # 1. Java Backend Developer MUST be in eligible_pathways (Direct Pathways tab)
        self.assertIn("java-backend-developer", eligible_slugs)

        # 2. Industrial Electrician MUST be in statutory_restrictions (Statutory Rules tab), NOT in eligible_pathways
        self.assertNotIn("industrial-electrician", eligible_slugs)
        self.assertIn("industrial-electrician", restricted_slugs)

        # 3. Advocate and CA MUST be in alternative_pathways (Alternative & Bridge tab)
        self.assertIn("advocate-litigation-lawyer", alternative_slugs)
        self.assertIn("chartered-accountant", alternative_slugs)


if __name__ == "__main__":
    unittest.main()
