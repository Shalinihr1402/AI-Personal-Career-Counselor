import re
from pathlib import Path

file_path = Path(r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\backend\career_knowledge_base.py")
content = file_path.read_text(encoding="utf-8")

# 1. Update Class 12 medical check
old_c12_check = """            # Medical (MBBS / Dental / Clinical) stream restrictions
            if ("medical-practitioner" in career.slug or "mbbs" in career.slug or "dental" in career.slug):
                is_biology_stream = (
                    ("pcb" in spec_lower or "biology" in spec_lower or "pcmb" in spec_lower)
                    or ("medical" in spec_lower and "non-medical" not in spec_lower)
                )
                if is_biology_stream:
                    return EligibilityResult(
                        is_eligible=True,
                        eligibility_type="preferred_pathway",
                        reason=f"Class 12 Science (PCB) students are directly eligible to appear for NEET-UG to pursue {career.canonical_title}.",
                        recommended_bridge_steps=["Prepare and appear for NEET-UG examination."],
                    )
                else:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason="NEET-UG and MBBS/BDS admission statutorily requires Physics, Chemistry, and Biology in 10+2.",
                        prerequisites_met=False,
                        missing_prerequisites=["10+2 with Biology / PCB"],
                        recommended_bridge_steps=["Additional qualification in 10+2 Biology via recognized Open Board (NIOS) if eligible."],
                    )"""

new_c12_check = """            # Medical, Dental, and Nursing stream restrictions
            if (
                "medical-practitioner" in career.slug
                or "mbbs" in career.slug
                or "dentist" in career.slug
                or "dental" in career.slug
                or "nurse" in career.slug
            ):
                is_biology_stream = (
                    ("pcb" in spec_lower or "biology" in spec_lower or "pcmb" in spec_lower)
                    or ("medical" in spec_lower and "non-medical" not in spec_lower)
                )
                if is_biology_stream:
                    return EligibilityResult(
                        is_eligible=True,
                        eligibility_type="preferred_pathway",
                        reason=f"Class 12 Science (PCB) students are directly eligible to pursue entrance examinations for {career.canonical_title}.",
                        recommended_bridge_steps=["Prepare and appear for relevant entrance examination (NEET-UG / State Nursing CET)."],
                    )
                else:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=f"Admission into degree programs leading to {career.canonical_title} statutorily requires Physics, Chemistry, and Biology in 10+2.",
                        prerequisites_met=False,
                        missing_prerequisites=["10+2 with Biology / PCB"],
                        recommended_bridge_steps=["Additional qualification in 10+2 Biology via recognized Open Board (NIOS) if eligible."],
                    )"""

assert old_c12_check in content, "Could not find old_c12_check"
content = content.replace(old_c12_check, new_c12_check)

# 2. Add Dental and Nursing checks in Undergraduate mandatory licensing block
old_pharm_check = """            # Pharmacy (Pharmacist)
            if "pharmacist" in career.slug:
                if qual not in ["bpharm", "dpharm", "mpharm"]:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=(
                            f"Dispensing prescription medicines requires a PCI-approved D.Pharm or B.Pharm degree "
                            f"and registration with the {licensing.regulatory_body} under the {licensing.statutory_act}."
                        ),
                        mandatory_licensing_required=True,
                        licensing_details=lic_dict,
                        prerequisites_met=False,
                        missing_prerequisites=["D.Pharm or B.Pharm Degree", "State Pharmacy Council Registration"],
                    )"""

new_dental_nursing_pharm = """            # Dentistry (Dental Surgeon / BDS)
            if "dentist" in career.slug or "dental" in career.slug:
                if qual not in ["bds", "mds"]:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=(
                            f"Practicing as a {career.canonical_title} statutorily requires a BDS degree "
                            f"recognized by the {licensing.regulatory_body} under the {licensing.statutory_act}."
                        ),
                        mandatory_licensing_required=True,
                        licensing_details=lic_dict,
                        prerequisites_met=False,
                        missing_prerequisites=["BDS Degree", "1-Year Paid Rotatory Internship", "State Dental Council Registration"],
                        recommended_bridge_steps=["Clear NEET-UG and enroll in a DCI/NDC-recognized 5-year BDS program."],
                    )

            # Nursing (Registered Nurse & Midwife)
            if "nurse" in career.slug or "nursing" in career.slug:
                if qual not in ["bsc_nursing", "msc_nursing", "gnm"]:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=(
                            f"Practicing as a {career.canonical_title} statutorily requires an INC/NNMC-recognized "
                            f"nursing qualification and registration under the {licensing.statutory_act}."
                        ),
                        mandatory_licensing_required=True,
                        licensing_details=lic_dict,
                        prerequisites_met=False,
                        missing_prerequisites=["B.Sc Nursing or GNM Qualification", "State Nursing Council Registration (RN & RM)"],
                        recommended_bridge_steps=["Enroll in an accredited 4-Year B.Sc Nursing or 3-Year GNM program."],
                    )

            # Pharmacy (Pharmacist)
            if "pharmacist" in career.slug:
                if qual not in ["bpharm", "dpharm", "mpharm"]:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=(
                            f"Dispensing prescription medicines requires a PCI-approved D.Pharm or B.Pharm degree "
                            f"and registration with the {licensing.regulatory_body} under the {licensing.statutory_act}."
                        ),
                        mandatory_licensing_required=True,
                        licensing_details=lic_dict,
                        prerequisites_met=False,
                        missing_prerequisites=["D.Pharm or B.Pharm Degree", "State Pharmacy Council Registration"],
                    )"""

assert old_pharm_check in content, "Could not find old_pharm_check"
content = content.replace(old_pharm_check, new_dental_nursing_pharm)

file_path.write_text(content, encoding="utf-8")
print("Successfully updated statutory checks in career_knowledge_base.py")
