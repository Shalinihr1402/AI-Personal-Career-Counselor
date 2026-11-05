from pathlib import Path

file_path = Path(r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\backend\test_career_knowledge_base.py")
content = file_path.read_text(encoding="utf-8")

old_test_18 = """        # Non-CA candidate attempting to be a statutory auditor CA
        res_ca = check_career_eligibility("chartered-accountant", btech_profile)
        self.assertFalse(res_ca.is_eligible)
        self.assertTrue(res_ca.mandatory_licensing_required)"""

new_test_18 = """        # Non-CA candidate attempting to be a statutory auditor CA
        res_ca = check_career_eligibility("chartered-accountant", btech_profile)
        self.assertFalse(res_ca.is_eligible)
        self.assertTrue(res_ca.mandatory_licensing_required)

        # Non-Dental candidate attempting to practice as dental surgeon
        res_dental = check_career_eligibility("bds-dentist", btech_profile)
        self.assertFalse(res_dental.is_eligible)
        self.assertEqual(res_dental.eligibility_type, "restricted_ineligible")
        self.assertTrue(res_dental.mandatory_licensing_required)
        self.assertIn("Dental", res_dental.licensing_details["regulatory_body"])

        # Non-Nursing candidate attempting to practice as registered nurse
        res_nurse = check_career_eligibility("registered-nurse", btech_profile)
        self.assertFalse(res_nurse.is_eligible)
        self.assertEqual(res_nurse.eligibility_type, "restricted_ineligible")
        self.assertTrue(res_nurse.mandatory_licensing_required)
        self.assertIn("Nursing", res_nurse.licensing_details["regulatory_body"])"""

assert old_test_18 in content, "Could not find old_test_18"
content = content.replace(old_test_18, new_test_18)
file_path.write_text(content, encoding="utf-8")
print("Updated test_career_knowledge_base.py")
