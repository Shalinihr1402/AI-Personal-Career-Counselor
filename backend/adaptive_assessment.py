"""
adaptive_assessment.py - Personalized Adaptive Assessment Engine (Phase 4.3 - Step 1)

Key Architectural Capabilities:
1. Stage-Aware Taxonomy: Calibrates questions to the student's exact academic stage
   (School 10th, Higher Secondary 12th streams, Polytechnic/Diploma, College UG/PG, Career Transition).
2. Competency Grounding: Reusable competency questions directly linked to Career Knowledge Base (CKB)
   curated benchmarks (Java, Medical, Dental, Nursing, Legal, CA, Electrical, Agriculture).
3. Question Deduplication: Dynamically inspects the user's onboarding profile (Steps 1-6)
   and skips questions already captured in education, skills, interests, and preferences.
4. Rigorous Competency Evidence Hierarchy: Multiple-choice responses evaluate conceptual
   awareness and scenario problem-solving, but are explicitly capped and separate from
   verified practical demonstration (which requires portfolio/code/internship logbooks).
5. 100% Deterministic Python Logic: Zero hallucinated or invented scores from external LLMs.
6. Backward Compatibility: Fully interoperable with existing Holland RIASEC scoring.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import List, Dict, Any, Optional, Set

from education_classifier import (
    classify_education,
    ClassifiedEducation,
    EducationLevel,
    AcademicDomain,
)
from career_knowledge_base import (
    CareerKnowledgeBase,
    CareerKnowledgeRecord,
    Competency,
    CompetencyCategory,
    ProficiencyLevel,
)
from riasec import DIMS, DIM_LABEL


# ============================================================================
# 1. ENUMS & DATA STRUCTURES
# ============================================================================

class QuestionCategory(str, Enum):
    """Broad functional category of the adaptive question."""
    INTEREST_EXPLORATION = "interest_exploration"      # Broad Holland/RIASEC exploration
    COMPETENCY_DEMONSTRATION = "competency_demonstration"  # Direct domain competency evaluation
    PRACTICAL_SCENARIO = "practical_scenario"          # Applied situational judgment
    WORKSTYLE_FIT = "workstyle_fit"                    # Working environment & collaboration


class AssessmentStage(str, Enum):
    """Academic / career stage calibration."""
    SCHOOL_10TH = "school_10th"                        # Class 8-10 (Foundational, exploratory)
    HIGHER_SECONDARY_12TH = "higher_secondary_12th"    # Class 11-12 (Stream-specific: PCM, PCB, Commerce, Arts)
    DIPLOMA_POLYTECHNIC = "diploma_polytechnic"        # Applied engineering / technical trades
    COLLEGE_UG_PG = "college_ug_pg"                    # Higher education / career-ready competencies
    CAREER_TRANSITION = "career_transition"            # Career switchers & career-break returners
    GENERAL = "general"                                # Broad fallback


class CompetencyEvidenceLevel(str, Enum):
    """
    Evidence hierarchy distinguishing self-reported, multiple-choice assessed,
    and verified practical demonstration.
    """
    SELF_REPORTED = "self_reported"                    # Self-reported in onboarding / resume
    DECLARED_ONLY = "declared_only"                    # Alias for declared in onboarding
    AWARENESS_CONCEPTUAL = "awareness_conceptual"      # Multiple-choice: knows definitions and rules
    APPLIED_SCENARIO = "applied_scenario"              # Multiple-choice: selects correct workplace/code action
    VERIFIED_PRACTICAL = "verified_practical"          # External portfolio, GitHub, trade test, or internship log


@dataclass
class AdaptiveOption:
    """A selectable option in an adaptive question."""
    id: str                                            # 'a', 'b', 'c', 'd'
    text: str                                          # User-facing option text
    dimension_weights: Dict[str, int] = field(default_factory=dict)  # RIASEC weights (e.g. {"R": 3})
    competency_id: Optional[str] = None                # CKB competency linked
    competency_level: Optional[str] = None             # "beginner", "intermediate", "advanced"
    evidence_level: CompetencyEvidenceLevel = CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL
    occupational_fields: List[str] = field(default_factory=list)
    practical_verification_note: Optional[str] = None  # Instructions on how to advance to practical level

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["evidence_level"] = self.evidence_level.value
        return d


@dataclass
class AdaptiveQuestion:
    """A personalized, stage-calibrated assessment question."""
    id: str                                            # e.g., "ad_sec_01", "ad_comp_java_01"
    stage: AssessmentStage                             # Target stage
    category: QuestionCategory                         # Category
    prompt: str                                        # Question prompt / scenario
    options: List[AdaptiveOption]                      # 3-4 structured options
    target_dimensions: List[str] = field(default_factory=list)  # RIASEC dimensions involved
    target_competency_ids: List[str] = field(default_factory=list) # Linked CKB competency IDs
    prerequisite_stream: Optional[str] = None          # e.g., "science_pcb", "science_pcm", "commerce"
    prerequisite_domain: Optional[str] = None          # e.g., "medical_healthcare", "engineering_tech"
    skip_if_profile_keys: List[str] = field(default_factory=list) # Onboarding keys that satisfy this question
    explanation_tip: Optional[str] = None              # Educational counseling context

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "stage": self.stage.value,
            "category": self.category.value,
            "prompt": self.prompt,
            "options": [opt.to_dict() for opt in self.options],
            "target_dimensions": self.target_dimensions,
            "target_competency_ids": self.target_competency_ids,
            "prerequisite_stream": self.prerequisite_stream,
            "prerequisite_domain": self.prerequisite_domain,
            "skip_if_profile_keys": self.skip_if_profile_keys,
            "explanation_tip": self.explanation_tip,
        }


# ============================================================================
# 2. ADAPTIVE QUESTION BANK
# ============================================================================

# ----------------------------------------------------------------------------
# A. Class 10 / Secondary School Questions (Foundational, exploratory, age 14-16)
# ----------------------------------------------------------------------------
SCHOOL_10TH_QUESTIONS: List[AdaptiveQuestion] = [
    AdaptiveQuestion(
        id="q10_01_learning_style",
        stage=AssessmentStage.SCHOOL_10TH,
        category=QuestionCategory.INTEREST_EXPLORATION,
        prompt="When you have to study a difficult topic in Science or Social Studies, what activity makes it click best?",
        options=[
            AdaptiveOption(
                id="a",
                text="Conducting an experiment, observing specimens, or looking at real-life models.",
                dimension_weights={"I": 3, "R": 1},
                occupational_fields=["Physical & Life Sciences", "Healthcare & Medicine"],
            ),
            AdaptiveOption(
                id="b",
                text="Drawing diagrams, mind-maps, sketches, or creating visual summary posters.",
                dimension_weights={"A": 3},
                occupational_fields=["Arts, Design & Media"],
            ),
            AdaptiveOption(
                id="c",
                text="Organizing key formulas, making revision tables, and practicing step-by-step calculations.",
                dimension_weights={"C": 3, "I": 1},
                occupational_fields=["Business, Management & Finance", "Data & AI"],
            ),
            AdaptiveOption(
                id="d",
                text="Studying with friends, discussing concepts, and quizzing each other out loud.",
                dimension_weights={"S": 3, "E": 1},
                occupational_fields=["Education & Training", "Community & Social Services"],
            ),
        ],
        target_dimensions=["I", "A", "C", "S"],
        skip_if_profile_keys=["subjectsEnjoy", "subjectsStrong"],
        explanation_tip="Identifies natural cognitive learning styles for 11th stream selection.",
    ),
    AdaptiveQuestion(
        id="q10_02_school_exhibition",
        stage=AssessmentStage.SCHOOL_10TH,
        category=QuestionCategory.PRACTICAL_SCENARIO,
        prompt="Your school is participating in an Inter-School Science & Arts Exhibition. Which role do you eagerly volunteer for?",
        options=[
            AdaptiveOption(
                id="a",
                text="Building a working model (e.g. a solar rover, hydraulic crane, or water purifier).",
                dimension_weights={"R": 3, "I": 1},
                occupational_fields=["Engineering & Architecture", "Construction & Trades"],
            ),
            AdaptiveOption(
                id="b",
                text="Presenting the project pitch to visiting judges and explaining how it works.",
                dimension_weights={"E": 3, "S": 1},
                occupational_fields=["Sales & Business Development", "Business, Management & Finance"],
            ),
            AdaptiveOption(
                id="c",
                text="Designing the booth backdrop, brochures, color palette, and decorative lighting.",
                dimension_weights={"A": 3},
                occupational_fields=["Arts, Design & Media"],
            ),
            AdaptiveOption(
                id="d",
                text="Managing team inventory, component purchases, schedules, and expense receipts.",
                dimension_weights={"C": 3},
                occupational_fields=["Operations & Administration"],
            ),
        ],
        target_dimensions=["R", "E", "A", "C"],
        skip_if_profile_keys=["knownFor"],
        explanation_tip="Evaluates collaborative teamwork and operational preferences.",
    ),
    AdaptiveQuestion(
        id="q10_03_tech_vs_nature",
        stage=AssessmentStage.SCHOOL_10TH,
        category=QuestionCategory.INTEREST_EXPLORATION,
        prompt="On a free Saturday afternoon with no homework, which activity sounds most appealing?",
        options=[
            AdaptiveOption(
                id="a",
                text="Learning to code a small game, assembling a computer, or tweaking digital software settings.",
                dimension_weights={"I": 2, "R": 2},
                occupational_fields=["Technology & Computer Science", "Data & AI"],
            ),
            AdaptiveOption(
                id="b",
                text="Gardening, observing birds/insects, or caring for family pets and animals outdoors.",
                dimension_weights={"R": 3, "I": 1},
                occupational_fields=["Agriculture & Natural Resources", "Physical & Life Sciences"],
            ),
            AdaptiveOption(
                id="c",
                text="Writing a fictional story, composing music, or editing photos/videos on a smartphone.",
                dimension_weights={"A": 3},
                occupational_fields=["Arts, Design & Media"],
            ),
            AdaptiveOption(
                id="d",
                text="Volunteering at a local animal shelter, charity event, or helping younger kids learn.",
                dimension_weights={"S": 3},
                occupational_fields=["Community & Social Services", "Education & Training"],
            ),
        ],
        target_dimensions=["I", "R", "A", "S"],
    ),
]

# ----------------------------------------------------------------------------
# B. Class 12 Science — PCB / Medical Track Questions
# ----------------------------------------------------------------------------
CLASS_12_PCB_QUESTIONS: List[AdaptiveQuestion] = [
    AdaptiveQuestion(
        id="q12_pcb_clinical_empathy",
        stage=AssessmentStage.HIGHER_SECONDARY_12TH,
        category=QuestionCategory.PRACTICAL_SCENARIO,
        prompt="During a biology practical dissection or clinical observation, a patient or teammate feels faint and distressed. What is your immediate focus?",
        options=[
            AdaptiveOption(
                id="a",
                text="Immediately attend to the person, check vitals, ensure safety, and speak calmly to comfort them.",
                dimension_weights={"S": 3, "R": 1},
                competency_id="patient_assessment_monitoring",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Healthcare & Medicine"],
                practical_verification_note="Basic first aid response and bedside patient reassurance.",
            ),
            AdaptiveOption(
                id="b",
                text="Quickly analyze the physiological cause (hypoglycemia, vasovagal syncope, dehydration) to determine medical remedy.",
                dimension_weights={"I": 3, "S": 1},
                competency_id="clinical_diagnosis",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Healthcare & Medicine", "Physical & Life Sciences"],
            ),
            AdaptiveOption(
                id="c",
                text="Alert the lab supervisor, clear the surrounding space, and document the incident following safety protocol.",
                dimension_weights={"C": 3},
                occupational_fields=["Operations & Administration"],
            ),
        ],
        target_dimensions=["S", "I", "C"],
        prerequisite_stream="science_pcb",
        prerequisite_domain="medical_healthcare",
        explanation_tip="Evaluates healthcare empathy and clinical composure for MBBS/BDS/Nursing aspirants.",
    ),
    AdaptiveQuestion(
        id="q12_pcb_neet_readiness",
        stage=AssessmentStage.HIGHER_SECONDARY_12TH,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="Under NMC & DCI regulations, allopathic medical and dental admissions mandate NEET-UG qualification. How are you approaching competitive preparation?",
        options=[
            AdaptiveOption(
                id="a",
                text="Practicing timed NCERT multiple-choice drills daily in Physics, Chemistry, and Biology to clear NEET cutoffs.",
                dimension_weights={"I": 3, "C": 1},
                competency_id="academic_biology_foundations",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Healthcare & Medicine"],
            ),
            AdaptiveOption(
                id="b",
                text="Interested in healthcare, but actively exploring allied alternatives like B.Pharm, B.Sc Nursing, or Biotechnology alongside NEET.",
                dimension_weights={"I": 2, "S": 2},
                occupational_fields=["Healthcare & Medicine", "Physical & Life Sciences"],
            ),
            AdaptiveOption(
                id="c",
                text="Prefer research, botany, or clinical data analytics over hospital-based patient interactions.",
                dimension_weights={"I": 3, "A": 1},
                occupational_fields=["Physical & Life Sciences", "Data & AI"],
            ),
        ],
        target_dimensions=["I", "S", "C"],
        prerequisite_stream="science_pcb",
        explanation_tip="Clarifies degree ambition between clinical medicine (MBBS/BDS) vs. allied health (Pharmacy/Nursing/Biotech).",
    ),
]

# ----------------------------------------------------------------------------
# C. Class 12 Science — PCM / Engineering Track Questions
# ----------------------------------------------------------------------------
CLASS_12_PCM_QUESTIONS: List[AdaptiveQuestion] = [
    AdaptiveQuestion(
        id="q12_pcm_problem_solving",
        stage=AssessmentStage.HIGHER_SECONDARY_12TH,
        category=QuestionCategory.PRACTICAL_SCENARIO,
        prompt="When tackling an advanced Physics mechanics or calculus problem that seems stuck, which strategy do you naturally use?",
        options=[
            AdaptiveOption(
                id="a",
                text="Break it down into free-body diagrams, coordinate axes, and step-by-step differential equations.",
                dimension_weights={"I": 3, "R": 1},
                occupational_fields=["Engineering & Architecture", "Physical & Life Sciences"],
            ),
            AdaptiveOption(
                id="b",
                text="Write a quick script (Python/C) or use a graphing calculator to simulate the equations numerically.",
                dimension_weights={"I": 2, "C": 2},
                competency_id="data_structures",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science", "Data & AI"],
            ),
            AdaptiveOption(
                id="c",
                text="Visualize physical analogies in everyday machines, gear systems, or electronic devices.",
                dimension_weights={"R": 3, "I": 1},
                occupational_fields=["Engineering & Architecture", "Manufacturing & Production"],
            ),
        ],
        target_dimensions=["I", "R", "C"],
        prerequisite_stream="science_pcm",
        explanation_tip="Differentiates theoretical mathematics vs. computational code vs. physical engineering inclination.",
    ),
]

# ----------------------------------------------------------------------------
# D. Class 12 Commerce & Management Track Questions
# ----------------------------------------------------------------------------
CLASS_12_COMMERCE_QUESTIONS: List[AdaptiveQuestion] = [
    AdaptiveQuestion(
        id="q12_comm_business_instinct",
        stage=AssessmentStage.HIGHER_SECONDARY_12TH,
        category=QuestionCategory.PRACTICAL_SCENARIO,
        prompt="A local startup or family shop is losing money despite good customer footfall. What is your first instinct to investigate?",
        options=[
            AdaptiveOption(
                id="a",
                text="Audit the ledger balance sheet, cash flows, inventory holding costs, and profit margins.",
                dimension_weights={"C": 3, "E": 1},
                competency_id="financial_auditing",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Business, Management & Finance"],
                practical_verification_note="Ledger reconciliation and accounting audit instinct.",
            ),
            AdaptiveOption(
                id="b",
                text="Revamp branding, social media marketing, customer referral schemes, and competitive pricing.",
                dimension_weights={"E": 3, "A": 1},
                occupational_fields=["Sales & Business Development", "Arts, Design & Media"],
            ),
            AdaptiveOption(
                id="c",
                text="Interview customers and staff to identify service friction, dissatisfaction, and staff morale issues.",
                dimension_weights={"S": 3, "E": 1},
                occupational_fields=["Operations & Administration", "Community & Social Services"],
            ),
        ],
        target_dimensions=["C", "E", "S"],
        prerequisite_stream="commerce",
        explanation_tip="Evaluates commercial finance aptitude (CA/CS/B.Com) vs. marketing/entrepreneurial drive (BBA/MBA).",
    ),
]

# ----------------------------------------------------------------------------
# E. Polytechnic & Diploma Students (Applied Engineering & Technical Trades)
# ----------------------------------------------------------------------------
DIPLOMA_QUESTIONS: List[AdaptiveQuestion] = [
    AdaptiveQuestion(
        id="q_dip_cad_wiring",
        stage=AssessmentStage.DIPLOMA_POLYTECHNIC,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="In an industrial workshop or lab assembly, you are tasked with optimizing a malfunctioning motor panel or CAD assembly. What do you do?",
        options=[
            AdaptiveOption(
                id="a",
                text="Check electrical continuity with a multimeter, inspect circuit breakers, and trace control wiring against schematics.",
                dimension_weights={"R": 3, "C": 1},
                competency_id="electrical_wiring",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Installation & Maintenance", "Engineering & Architecture"],
                practical_verification_note="Demonstrated multimeter diagnostics and Single Line Diagram (SLD) verification.",
            ),
            AdaptiveOption(
                id="b",
                text="Open the 3D CAD model, verify dimensional tolerancing (GD&T), and simulate stress loads on parts.",
                dimension_weights={"R": 2, "I": 2},
                competency_id="cad_drafting",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Engineering & Architecture", "Manufacturing & Production"],
                practical_verification_note="Demonstrated parametric CAD modeling with BOM extraction.",
            ),
            AdaptiveOption(
                id="c",
                text="Plan shift schedules, manage spare parts inventory, and ensure workshop occupational safety compliance.",
                dimension_weights={"C": 3, "E": 1},
                occupational_fields=["Operations & Administration"],
            ),
        ],
        target_dimensions=["R", "I", "C"],
        prerequisite_domain="engineering_tech",
        explanation_tip="Assesses applied technical problem-solving for Polytechnic Diploma & ITI students.",
    ),
    AdaptiveQuestion(
        id="q_dip_career_direction",
        stage=AssessmentStage.DIPLOMA_POLYTECHNIC,
        category=QuestionCategory.PRACTICAL_SCENARIO,
        prompt="As you complete your Diploma, which progression pathway matches your immediate professional objective?",
        options=[
            AdaptiveOption(
                id="a",
                text="Appearing for Lateral Entry entrance (e.g. DCET / LEET) to join 2nd year B.Tech/B.E. engineering directly.",
                dimension_weights={"I": 2, "R": 2},
                occupational_fields=["Engineering & Architecture"],
            ),
            AdaptiveOption(
                id="b",
                text="Taking up a core industry technical role (Junior Engineer, CAD Technician, Plant Supervisor) immediately.",
                dimension_weights={"R": 3, "C": 1},
                occupational_fields=["Manufacturing & Production", "Installation & Maintenance"],
            ),
            AdaptiveOption(
                id="c",
                text="Upskilling in software development, cloud, or automation to transition into tech industry roles.",
                dimension_weights={"I": 2, "C": 2},
                occupational_fields=["Technology & Computer Science"],
            ),
        ],
        target_dimensions=["R", "I", "C"],
    ),
]

# ----------------------------------------------------------------------------
# F. College Undergraduate & Postgraduate Competency Demonstration Items
# ----------------------------------------------------------------------------
COLLEGE_COMPETENCY_QUESTIONS: List[AdaptiveQuestion] = [
    # 1. Software Engineering: Java / Backend / Microservices
    AdaptiveQuestion(
        id="q_comp_java_concurrency",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="A high-traffic backend REST microservice suffers latency spikes under concurrent loads. Which engineering solution do you implement?",
        options=[
            AdaptiveOption(
                id="a",
                text="Profile JVM garbage collection, optimize database queries with composite indexes, and use connection pooling (HikariCP).",
                dimension_weights={"I": 2, "C": 2},
                competency_id="java_programming",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science"],
                practical_verification_note="Multiple-choice demonstrates applied scenario awareness. To verify Advanced level, a production GitHub repository or live benchmark test is required.",
            ),
            AdaptiveOption(
                id="b",
                text="Refactor synchronous HTTP calls to asynchronous event messaging using Apache Kafka or RabbitMQ queues.",
                dimension_weights={"I": 3, "R": 1},
                competency_id="oop_design",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science"],
                practical_verification_note="Event-driven architecture design. Verified by microservices architecture blueprint or code artifact.",
            ),
            AdaptiveOption(
                id="c",
                text="Increase server RAM blindly and restart the container every morning without addressing root database locks.",
                dimension_weights={"R": 1},
                competency_id="java_programming",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Technology & Computer Science"],
            ),
        ],
        target_dimensions=["I", "C", "R"],
        prerequisite_domain="computer_applications",
        target_competency_ids=["java_programming", "oop_design", "database_design"],
        explanation_tip="Differentiates junior coders from production-ready backend engineers.",
    ),

    # 2. Healthcare: Registered Nurse / Hospital Patient Care
    AdaptiveQuestion(
        id="q_comp_nurse_medication",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="Before administering an intravenous (IV) high-risk medication in an inpatient ward, what is the mandatory clinical safety standard?",
        options=[
            AdaptiveOption(
                id="a",
                text="Execute the '10 Rights of Medication Administration', independently double-check dosage calculations, and verify patient hospital band ID.",
                dimension_weights={"S": 2, "C": 2},
                competency_id="medication_administration",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Healthcare & Medicine"],
                practical_verification_note="Clinical medication verification. Advanced verification requires supervised clinical rotations logbook.",
            ),
            AdaptiveOption(
                id="b",
                text="Administer quickly if the patient appears alert, documenting the dose later during shift handover.",
                dimension_weights={"S": 1},
                competency_id="medication_administration",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Healthcare & Medicine"],
            ),
        ],
        target_dimensions=["S", "C"],
        prerequisite_domain="medical_healthcare",
        target_competency_ids=["medication_administration", "patient_assessment_monitoring"],
        explanation_tip="Tests adherence to Indian Nursing Council medication safety standards.",
    ),

    # 3. Legal Studies: Advocate / Litigation Lawyer
    AdaptiveQuestion(
        id="q_comp_lawyer_evidence",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="In preparing an appeal against a summary judgment, which legal action forms the bedrock of your petition under the Advocates Act & CPC?",
        options=[
            AdaptiveOption(
                id="a",
                text="Conduct systematic case law research on SCC/Manupatra, identify errors of law on the record, and draft precise grounds of appeal.",
                dimension_weights={"E": 2, "I": 2},
                competency_id="legal_drafting",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Law & Public Policy"],
                practical_verification_note="Moot court or verified case brief drafting under an advocate.",
            ),
            AdaptiveOption(
                id="b",
                text="Rely primarily on emotional courtroom rhetoric without citing relevant statutory precedents or High Court judgments.",
                dimension_weights={"E": 2},
                competency_id="legal_drafting",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Law & Public Policy"],
            ),
        ],
        target_dimensions=["E", "I"],
        prerequisite_domain="legal_studies",
        target_competency_ids=["legal_drafting", "statutory_interpretation"],
    ),

    # 4. Commerce & Finance: Chartered Accountant (ICAI Auditing)
    AdaptiveQuestion(
        id="q_comp_ca_audit_sampling",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="While conducting a statutory company audit under the CA Act 1949 and Companies Act 2013, you discover material inventory discrepancies. What is your duty?",
        options=[
            AdaptiveOption(
                id="a",
                text="Extend substantive testing, demand management reconciliation, document the audit trail in working papers, and consider a qualified opinion if unresolved.",
                dimension_weights={"C": 3, "E": 1},
                competency_id="financial_auditing",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Business, Management & Finance"],
                practical_verification_note="ICAI Standards on Auditing (SA 500) compliance. Advanced verification requires active Articleship logbook.",
            ),
            AdaptiveOption(
                id="b",
                text="Accept verbal assurances from the company accountant to close the audit engagement quickly.",
                dimension_weights={"C": 1},
                competency_id="financial_auditing",
                competency_level="beginner",
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Business, Management & Finance"],
            ),
        ],
        target_dimensions=["C", "E"],
        prerequisite_domain="commerce_finance",
        target_competency_ids=["financial_auditing", "statutory_compliance"],
    ),
]

# ----------------------------------------------------------------------------
# G. Career Transition & Career-Break Re-Entry Questions
# ----------------------------------------------------------------------------
CAREER_TRANSITION_QUESTIONS: List[AdaptiveQuestion] = [
    AdaptiveQuestion(
        id="q_trans_bridge_strategy",
        stage=AssessmentStage.CAREER_TRANSITION,
        category=QuestionCategory.PRACTICAL_SCENARIO,
        prompt="When transitioning from an established non-tech or legacy role into a high-growth domain, what represents your most credible strategy?",
        options=[
            AdaptiveOption(
                id="a",
                text="Building 2-3 end-to-end portfolio projects, contributing to open-source or freelancing, and demonstrating real skills rather than relying on credentials alone.",
                dimension_weights={"I": 2, "R": 2},
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science", "Data & AI"],
            ),
            AdaptiveOption(
                id="b",
                text="Leveraging domain expertise (e.g. healthcare, finance, operations) combined with newly acquired analytical/product skills to target hybrid roles.",
                dimension_weights={"E": 2, "C": 2},
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Business, Management & Finance", "Operations & Administration"],
            ),
            AdaptiveOption(
                id="c",
                text="Sending cold resumes without any refreshed portfolio or demonstrated proof of modern tool mastery.",
                dimension_weights={"C": 1},
                evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                occupational_fields=["Operations & Administration"],
            ),
        ],
        target_dimensions=["I", "R", "E", "C"],
        explanation_tip="Evaluates realistic career switching strategy emphasizing competency demonstration.",
    ),
]


# ============================================================================
# 3. STAGE RESOLVER & QUESTION SELECTION ENGINE
# ============================================================================

class AdaptiveAssessmentEngine:
    """
    Core engine responsible for:
    1. Detecting the student's calibrated stage from their onboarding profile.
    2. Filtering out statutorily barred career pathways via CKB check_eligibility.
    3. Skipping duplicate questions already captured during onboarding.
    4. Assembling a tailored, stage-appropriate adaptive question set.
    """

    def __init__(self, ckb: Optional[CareerKnowledgeBase] = None):
        self.ckb = ckb or CareerKnowledgeBase()
        self._question_registry: Optional[Dict[str, AdaptiveQuestion]] = None

    def resolve_stage(self, profile: Dict[str, Any]) -> AssessmentStage:
        """Resolves the calibrated assessment stage from student profile."""
        classified = classify_education(profile)
        lvl = classified.level

        # 1. School students (Class 8-10)
        if lvl in [EducationLevel.MIDDLE_SCHOOL.value, EducationLevel.SECONDARY_SCHOOL.value]:
            return AssessmentStage.SCHOOL_10TH

        # 2. Higher Secondary (Class 11-12)
        if lvl == EducationLevel.HIGHER_SECONDARY.value:
            return AssessmentStage.HIGHER_SECONDARY_12TH

        # 3. ITI & Polytechnic Diploma
        if lvl in [EducationLevel.ITI_VOCATIONAL.value, EducationLevel.POLYTECHNIC_DIPLOMA.value]:
            return AssessmentStage.DIPLOMA_POLYTECHNIC

        # 4. Career Switchers / Career-Break Returners
        career_mode = profile.get("career_mode") or profile.get("knowMe", {}).get("career_mode")
        growth_type = profile.get("career_growth_subtype") or profile.get("knowMe", {}).get("career_growth_subtype")
        if career_mode == "career_growth_transition" or growth_type in ["switching", "return"]:
            return AssessmentStage.CAREER_TRANSITION

        # 5. College Undergraduate & Postgraduate
        if lvl in [EducationLevel.UNDERGRADUATE.value, EducationLevel.POSTGRADUATE.value, EducationLevel.DOCTORAL_PHD.value]:
            return AssessmentStage.COLLEGE_UG_PG

        return AssessmentStage.GENERAL

    def get_candidate_career_pool(self, profile: Dict[str, Any]) -> List[CareerKnowledgeRecord]:
        """
        Retrieves candidate careers that the user is statutorily and academically eligible
        to pursue, filtering out barred occupations.
        """
        classified = classify_education(profile)
        eligible_records: List[CareerKnowledgeRecord] = []

        # Check all curated benchmark careers
        for rec in self.ckb._all_records:
            if rec.source_metadata.record_provenance != "curated_benchmark":
                continue
            elig = self.ckb.check_eligibility(rec.slug, classified)
            if elig.is_eligible or elig.eligibility_type in ["preferred_pathway", "alternative_pathway"]:
                eligible_records.append(rec)

        return eligible_records

    def get_already_answered_keys(self, profile: Dict[str, Any]) -> Set[str]:
        """Identifies keys already captured during onboarding Steps 1-6 to avoid duplicate questions."""
        answered = set()
        km = profile.get("knowMe") or profile.get("know_me") or {}
        ed = profile.get("education_details") or {}
        se = profile.get("skills_and_experience") or {}
        cp = profile.get("career_preferences") or {}

        if profile.get("interests") or km.get("subjectsEnjoy"):
            answered.add("subjectsEnjoy")
        if km.get("subjectsStrong") or ed.get("favorite_subjects"):
            answered.add("subjectsStrong")
        if km.get("knownFor"):
            answered.add("knownFor")
        if km.get("values"):
            answered.add("values")
        if profile.get("work_style") or km.get("workSetting"):
            answered.add("work_style")
        if se.get("skills"):
            answered.add("declared_skills")
        if cp.get("target_role") or profile.get("targetRole"):
            answered.add("target_role")

        return answered

    def select_adaptive_questions(
        self,
        profile: Dict[str, Any],
        max_questions: int = 12
    ) -> List[AdaptiveQuestion]:
        """
        Assembles a personalized, stage-calibrated question set.
        Guarantees:
        - School students get age-appropriate exploratory scenarios.
        - Class 12 students get stream-relevant questions (PCB medical vs. PCM engineering vs. Commerce).
        - Non-PCB students NEVER receive NEET/MBBS questions.
        - College/UG students get domain competency demonstration questions.
        - Redundant onboarding questions are skipped.
        - Balanced RIASEC coverage is maintained.
        """
        stage = self.resolve_stage(profile)
        classified = classify_education(profile)
        spec_lower = (classified.specialization or "").lower()
        stream_lower = (classified.course_or_stream or "").lower()
        combined_text = f"{spec_lower} {stream_lower}"
        profile_stream = (profile.get("school_stream") or "").lower()
        answered_keys = self.get_already_answered_keys(profile)

        # Stream identification for Class 12 calibration
        is_pcb = (
            classified.domain == AcademicDomain.MEDICAL_HEALTHCARE
            or "pcb" in profile_stream
            or "biology" in profile_stream
            or ("pcb" in combined_text or "biology" in combined_text)
        ) and "non-medical" not in combined_text and "non-medical" not in profile_stream

        is_commerce = (
            classified.domain == AcademicDomain.COMMERCE_FINANCE
            or "commerce" in profile_stream
            or "commerce" in combined_text
            or "account" in profile_stream
            or "account" in combined_text
        )

        is_pcm = (
            classified.domain == AcademicDomain.ENGINEERING_TECH
            or "pcm" in profile_stream
            or "pcm" in combined_text
            or "non-medical" in profile_stream
            or "non-medical" in combined_text
            or ("math" in combined_text and not is_commerce and not is_pcb)
            or ("math" in profile_stream and not is_commerce and not is_pcb)
        ) and not is_pcb

        selected: List[AdaptiveQuestion] = []
        selected_ids: Set[str] = set()

        def _can_add(q: AdaptiveQuestion) -> bool:
            if q.id in selected_ids:
                return False
            # Deduplication against onboarding
            if any(k in answered_keys for k in q.skip_if_profile_keys):
                return False
            # Stream prerequisites
            if q.prerequisite_stream:
                if q.prerequisite_stream == "science_pcb":
                    if not is_pcb:
                        return False
                elif q.prerequisite_stream == "science_pcm":
                    if not is_pcm:
                        return False
                elif q.prerequisite_stream == "commerce":
                    if not is_commerce:
                        return False
            # Domain prerequisites
            if q.prerequisite_domain:
                matches_domain = (classified.domain == q.prerequisite_domain)
                # Bridge: computer_applications questions also match engineering_tech students with CS / IT / software specialization
                if not matches_domain and q.prerequisite_domain == "computer_applications":
                    if classified.domain == AcademicDomain.ENGINEERING_TECH:
                        if any(term in combined_text for term in ["computer", "cs", "it", "software", "code", "programming"]):
                            matches_domain = True
                if not matches_domain and stage != AssessmentStage.CAREER_TRANSITION:
                    return False
            return True

        # 1. Stage-specific questions
        if stage == AssessmentStage.SCHOOL_10TH:
            for q in SCHOOL_10TH_QUESTIONS:
                if _can_add(q):
                    selected.append(q)
                    selected_ids.add(q.id)

        elif stage == AssessmentStage.HIGHER_SECONDARY_12TH:
            # Check stream
            if is_pcb:
                for q in CLASS_12_PCB_QUESTIONS:
                    if _can_add(q):
                        selected.append(q)
                        selected_ids.add(q.id)
            elif is_commerce:
                for q in CLASS_12_COMMERCE_QUESTIONS:
                    if _can_add(q):
                        selected.append(q)
                        selected_ids.add(q.id)
            elif is_pcm:
                for q in CLASS_12_PCM_QUESTIONS:
                    if _can_add(q):
                        selected.append(q)
                        selected_ids.add(q.id)

        elif stage == AssessmentStage.DIPLOMA_POLYTECHNIC:
            for q in DIPLOMA_QUESTIONS:
                if _can_add(q):
                    selected.append(q)
                    selected_ids.add(q.id)

        elif stage == AssessmentStage.CAREER_TRANSITION:
            for q in CAREER_TRANSITION_QUESTIONS:
                if _can_add(q):
                    selected.append(q)
                    selected_ids.add(q.id)

        # 2. Competency demonstration items for College/UG or Career Transition
        if stage in [AssessmentStage.COLLEGE_UG_PG, AssessmentStage.CAREER_TRANSITION]:
            for q in COLLEGE_COMPETENCY_QUESTIONS:
                if _can_add(q):
                    selected.append(q)
                    selected_ids.add(q.id)

        # 3. Fill remaining slots with balanced foundational discovery scenarios from SCENARIO_QUESTIONS
        # Importing from riasec ensures 100% backward compatibility and balanced RIASEC distribution
        from riasec import SCENARIO_QUESTIONS
        for sq in SCENARIO_QUESTIONS:
            if len(selected) >= max_questions:
                break
            sq_id = f"legacy_{sq['id']}"
            if sq_id in selected_ids:
                continue

            # Convert SCENARIO_QUESTION to AdaptiveQuestion format
            converted_opts = []
            for opt in sq["options"]:
                converted_opts.append(
                    AdaptiveOption(
                        id=opt["id"],
                        text=opt["text"],
                        dimension_weights={opt["dim"]: 3},
                        occupational_fields=opt.get("fields", []),
                        evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                    )
                )

            aq = AdaptiveQuestion(
                id=sq_id,
                stage=AssessmentStage.GENERAL,
                category=QuestionCategory.INTEREST_EXPLORATION,
                prompt=sq["scenario"],
                options=converted_opts,
                target_dimensions=[opt["dim"] for opt in sq["options"]],
            )
            selected.append(aq)
            selected_ids.add(sq_id)

        return selected[:max_questions]

    def _get_question_registry(self) -> Dict[str, AdaptiveQuestion]:
        """Returns a cached lookup map of all known adaptive questions."""
        if self._question_registry is not None:
            return self._question_registry

        registry: Dict[str, AdaptiveQuestion] = {}
        all_banks = [
            SCHOOL_10TH_QUESTIONS,
            CLASS_12_PCB_QUESTIONS,
            CLASS_12_PCM_QUESTIONS,
            CLASS_12_COMMERCE_QUESTIONS,
            DIPLOMA_QUESTIONS,
            COLLEGE_COMPETENCY_QUESTIONS,
            CAREER_TRANSITION_QUESTIONS,
        ]
        for bank in all_banks:
            for q in bank:
                registry[q.id] = q

        # Also register legacy scenario questions
        from riasec import SCENARIO_QUESTIONS
        for sq in SCENARIO_QUESTIONS:
            converted_opts = [
                AdaptiveOption(
                    id=opt["id"],
                    text=opt["text"],
                    dimension_weights={
                        opt["dim"]: 3,
                        **({opt["secondary_dim"]: 1} if opt.get("secondary_dim") else {})
                    },
                    occupational_fields=opt.get("fields", []),
                    evidence_level=CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL,
                )
                for opt in sq["options"]
            ]
            aq = AdaptiveQuestion(
                id=f"legacy_{sq['id']}",
                stage=AssessmentStage.GENERAL,
                category=QuestionCategory.INTEREST_EXPLORATION,
                prompt=sq["scenario"],
                options=converted_opts,
                target_dimensions=[opt["dim"] for opt in sq["options"]],
            )
            registry[f"legacy_{sq['id']}"] = aq
            # Also support bare id (e.g. "q1") for legacy callers
            registry[sq["id"]] = aq

        self._question_registry = registry
        return registry

    def score_adaptive_assessment(
        self,
        answers: Dict[str, Any],
        profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        100% Deterministic competency and interest scoring engine.
        Guarantees:
        - Self-reported skills, conceptual knowledge, applied scenario, and verified practical remain separate.
        - Multiple-choice answers CANNOT award VERIFIED_PRACTICAL evidence.
        - Preserves RIASEC scoring formulas and weights.
        - Evaluates statutory eligibility against Career Knowledge Base.
        - Zero LLM scoring / no Groq hallucination.
        """
        profile = profile or {}
        stage = self.resolve_stage(profile)
        registry = self._get_question_registry()

        raw_dimensions: Dict[str, int] = {d: 0 for d in DIMS}
        field_points: Dict[str, int] = {}
        demonstrated_competencies: Dict[str, Dict[str, Any]] = {}
        valid_answers_count = 0

        # Process answers
        if isinstance(answers, dict):
            for q_id, opt_val in answers.items():
                if not q_id or opt_val is None:
                    continue

                opt_id_str = str(opt_val).strip().lower()
                q = registry.get(q_id)
                if not q:
                    continue

                # Find chosen option
                matched_opt = None
                for opt in q.options:
                    if opt.id.lower() == opt_id_str:
                        matched_opt = opt
                        break

                if not matched_opt:
                    continue

                valid_answers_count += 1

                # Accumulate RIASEC dimension weights
                for dim, w in matched_opt.dimension_weights.items():
                    if dim in raw_dimensions and isinstance(w, (int, float)):
                        raw_dimensions[dim] += int(w)

                # Accumulate occupational fields (+2 points per match)
                for fld in matched_opt.occupational_fields:
                    field_points[fld] = field_points.get(fld, 0) + 2

                # Evaluate competency demonstration if linked
                if matched_opt.competency_id:
                    cid = matched_opt.competency_id
                    # Capping guardrail: multiple-choice answers can NEVER award VERIFIED_PRACTICAL
                    ev_level = matched_opt.evidence_level
                    if ev_level == CompetencyEvidenceLevel.VERIFIED_PRACTICAL:
                        ev_level = CompetencyEvidenceLevel.APPLIED_SCENARIO

                    rubric_points = matched_opt.dimension_weights.get(q.target_dimensions[0], 2) if q.target_dimensions else 2

                    demonstrated_competencies[cid] = {
                        "competency_id": cid,
                        "level": matched_opt.competency_level or "intermediate",
                        "evidence_level": ev_level.value,
                        "rubric_points": rubric_points,
                        "question_id": q.id,
                        "selected_option": matched_opt.id,
                        "practical_verification_note": matched_opt.practical_verification_note or (
                            "Demonstrates applied scenario awareness. Verification of advanced proficiency requires "
                            "independent code/portfolio artifacts, clinical rotation logs, or certified articleship."
                        ),
                    }

        # Normalize RIASEC scores (0 - 100)
        if valid_answers_count == 0:
            scores = {d: 50 for d in DIMS}
            code = "RIA"
            top_fields = []
            sorted_fields = []
        else:
            # Scale dynamically relative to total answered questions (matching 24.0 max baseline for 12 questions)
            scale_factor = 24.0 * (valid_answers_count / 12.0) if valid_answers_count >= 6 else 24.0
            scores = {d: min(100, max(0, round((raw_dimensions[d] / max(scale_factor, 1.0)) * 100))) for d in DIMS}

            order = sorted(DIMS, key=lambda d: (-scores[d], DIMS.index(d)))
            code = "".join(order[:3])

            sorted_fields = sorted(field_points.items(), key=lambda x: x[1], reverse=True)
            top_fields = [f[0] for f in sorted_fields[:4]]

        # Evidence Breakdown: Strictly separated tiers
        # 1. Self-reported skills (from profile onboarding or resume)
        raw_skills = profile.get("skills") or []
        if not raw_skills:
            raw_skills = profile.get("resume_skills") or []
        if not raw_skills and isinstance(profile.get("resume"), dict):
            raw_skills = profile.get("resume", {}).get("skills", [])

        seen_skills = set()
        self_reported_list = []
        for s in raw_skills:
            if isinstance(s, str) and s.strip():
                clean_s = s.strip()
                if clean_s.lower() not in seen_skills:
                    seen_skills.add(clean_s.lower())
                    self_reported_list.append({
                        "skill": clean_s,
                        "evidence_level": CompetencyEvidenceLevel.SELF_REPORTED.value,
                        "source": "onboarding_profile",
                    })

        # 2. Conceptual knowledge (from MCQ assessment)
        conceptual_list = [
            c for c in demonstrated_competencies.values()
            if c["evidence_level"] == CompetencyEvidenceLevel.AWARENESS_CONCEPTUAL.value
        ]

        # 3. Applied scenario evidence (from situational judgment MCQ)
        applied_list = [
            c for c in demonstrated_competencies.values()
            if c["evidence_level"] == CompetencyEvidenceLevel.APPLIED_SCENARIO.value
        ]

        # 4. Verified practical evidence (STRICTLY EMPTY from MCQ alone)
        verified_practical_list = []

        # Statutory Eligibility from Career Knowledge Base
        classified = classify_education(profile)
        eligible_pathways = []
        alternative_pathways = []
        statutory_restrictions = []

        for rec in self.ckb._all_records:
            if rec.source_metadata.record_provenance != "curated_benchmark":
                continue
            elig = self.ckb.check_eligibility(rec.slug, classified)
            licensing = rec.education_pathways.mandatory_licensing if rec.education_pathways else None
            entry = {
                "career_id": rec.id,
                "title": rec.canonical_title or rec.id,
                "slug": rec.slug,
                "is_eligible": elig.is_eligible,
                "eligibility_type": elig.eligibility_type,
                "reason": elig.reason,
                "missing_prerequisites": elig.missing_prerequisites,
                "recommended_bridge_steps": elig.recommended_bridge_steps,
                "regulatory_body": licensing.regulatory_body if (licensing and licensing.is_mandatory) else None,
                "statutory_act": licensing.statutory_act if (licensing and licensing.is_mandatory) else None,
            }
            if elig.is_eligible:
                if elig.eligibility_type in ["preferred_pathway", "direct_eligible"]:
                    eligible_pathways.append(entry)
                else:
                    alternative_pathways.append(entry)
            else:
                statutory_restrictions.append(entry)

        # Formatted top dimension descriptors for UI cards
        top_dims = [
            {"dimension": d, "score": scores[d], "label": DIM_LABEL.get(d, d)}
            for d in code
        ]

        return {
            "scores": scores,
            "code": code,
            "stage": stage.value,
            "top_fields": top_fields,
            "field_scores": dict(sorted_fields),
            "top_dimensions": top_dims,
            "demonstrated_competencies": demonstrated_competencies,
            "evidence_breakdown": {
                "self_reported": self_reported_list,
                "self_reported_skills": self_reported_list,
                "conceptual_knowledge": conceptual_list,
                "awareness_conceptual": conceptual_list,
                "applied_scenario": applied_list,
                "verified_practical": verified_practical_list,
            },
            "statutory_eligibility": {
                "eligible_pathways": eligible_pathways,
                "alternative_pathways": alternative_pathways,
                "statutory_restrictions": statutory_restrictions,
            },
            "practical_disclaimer": (
                "Multiple-choice responses evaluate conceptual awareness and situational scenario judgment. "
                "In alignment with industry standards and statutory licensing frameworks, advanced practical proficiency "
                "cannot be proven through multiple-choice answers alone and requires verified project repositories, "
                "clinical logbooks, or licensed articleship records."
            ),
        }


# Singleton engine instance
adaptive_engine = AdaptiveAssessmentEngine()
