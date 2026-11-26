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
from skill_normalizer import normalize_skills


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
    # 1. Software Engineering: Backend & Database Logic
    AdaptiveQuestion(
        id="q_comp_java_concurrency",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="When developing a web application or backend service that slows down when many users access it at the same time, what is your initial technical approach?",
        options=[
            AdaptiveOption(
                id="a",
                text="Analyze database queries, add indexes, and cache frequently accessed data to eliminate bottlenecks.",
                dimension_weights={"I": 2, "C": 2},
                competency_id="java_programming",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science"],
                practical_verification_note="Multiple-choice demonstrates applied scenario awareness. To verify Advanced level, a production GitHub repository or live benchmark test is required.",
            ),
            AdaptiveOption(
                id="b",
                text="Design asynchronous background processing or queues so user requests return immediately while heavy tasks run in the background.",
                dimension_weights={"I": 3, "R": 1},
                competency_id="oop_design",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science"],
                practical_verification_note="Event-driven architecture design. Verified by microservices architecture blueprint or code artifact.",
            ),
            AdaptiveOption(
                id="c",
                text="Set up performance monitoring and request logging to identify which specific database queries or screens take the longest.",
                dimension_weights={"C": 2, "I": 1},
                competency_id="java_programming",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science"],
            ),
            AdaptiveOption(
                id="d",
                text="I have mostly built introductory standalone programs and have not worked with performance optimization yet.",
                dimension_weights={"C": 1},
                occupational_fields=["Technology & Computer Science"],
            ),
        ],
        target_dimensions=["I", "C", "R"],
        prerequisite_domain="computer_applications",
        target_competency_ids=["java_programming", "oop_design", "database_design"],
        explanation_tip="Assesses foundational problem-solving for backend and software engineering.",
    ),

    # 2. Healthcare: Patient Care & First Aid Safety
    AdaptiveQuestion(
        id="q_comp_nurse_medication",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="In a healthcare setting or first aid situation, an anxious patient requires medication or treatment. What is your priority?",
        options=[
            AdaptiveOption(
                id="a",
                text="Carefully double-check the medication, dosage instructions, and patient identity while speaking calmly to reassure them.",
                dimension_weights={"S": 2, "C": 2},
                competency_id="medication_administration",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Healthcare & Medicine"],
                practical_verification_note="Clinical medication verification. Advanced verification requires supervised clinical rotations logbook.",
            ),
            AdaptiveOption(
                id="b",
                text="Explain each step of the treatment to the patient in reassuring, everyday language so they feel informed and at ease.",
                dimension_weights={"S": 3, "C": 1},
                competency_id="medication_administration",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Healthcare & Medicine"],
            ),
            AdaptiveOption(
                id="c",
                text="Focus primarily on emotional comfort and reassurance, letting a colleague handle the medication checklist.",
                dimension_weights={"S": 3, "A": 1},
                occupational_fields=["Healthcare & Medicine"],
            ),
            AdaptiveOption(
                id="d",
                text="I have not received clinical training yet, but I am comfortable learning standard health protocols.",
                dimension_weights={"C": 1},
                occupational_fields=["Healthcare & Medicine"],
            ),
        ],
        target_dimensions=["S", "C"],
        prerequisite_domain="medical_healthcare",
        target_competency_ids=["medication_administration", "patient_assessment_monitoring"],
        explanation_tip="Tests adherence to clinical safety standards and patient empathy.",
    ),

    # 3. Legal Studies & Policy: Evidence & Advocacy
    AdaptiveQuestion(
        id="q_comp_lawyer_evidence",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="When analyzing a legal dispute, policy issue, or debate topic, what is your primary approach to building a convincing argument?",
        options=[
            AdaptiveOption(
                id="a",
                text="Research relevant statutes, established case precedents, and official documentation to draft a structured, watertight brief.",
                dimension_weights={"E": 2, "I": 2},
                competency_id="legal_drafting",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Law & Public Policy"],
                practical_verification_note="Moot court or verified case brief drafting under an advocate.",
            ),
            AdaptiveOption(
                id="b",
                text="Present compelling real-world stories and oral arguments that highlight the practical human impact of the issue.",
                dimension_weights={"E": 2, "A": 2},
                competency_id="legal_drafting",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Law & Public Policy"],
            ),
            AdaptiveOption(
                id="c",
                text="Facilitate direct mediation between the parties to negotiate an amicable compromise outside formal litigation.",
                dimension_weights={"S": 3, "E": 1},
                occupational_fields=["Law & Public Policy"],
            ),
            AdaptiveOption(
                id="d",
                text="I have not studied legal principles yet, but I am interested in policy analysis and justice.",
                dimension_weights={"I": 2},
                occupational_fields=["Law & Public Policy"],
            ),
        ],
        target_dimensions=["E", "I"],
        prerequisite_domain="legal_studies",
        target_competency_ids=["legal_drafting", "statutory_interpretation"],
        explanation_tip="Assesses analytical argument formulation in legal and policy contexts.",
    ),

    # 4. Commerce & Finance: Accounting Reconciliation & Audit Scrutiny
    AdaptiveQuestion(
        id="q_comp_ca_audit_sampling",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="While reviewing financial statements or reconciling accounts for a business, you notice that recorded cash balances do not match bank statements and inventory counts show unexplained shortages. What is your priority?",
        options=[
            AdaptiveOption(
                id="a",
                text="Trace transactions systematically through ledgers, verify invoices and bank reconciliation statements, and document variances in working papers.",
                dimension_weights={"C": 3, "I": 1},
                competency_id="financial_auditing",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Business, Management & Finance"],
                practical_verification_note="ICAI Standards on Auditing (SA 500) compliance. Advanced verification requires active Articleship logbook.",
            ),
            AdaptiveOption(
                id="b",
                text="Meet with warehouse and operations supervisors to understand daily inventory handling and find procedural gaps.",
                dimension_weights={"S": 2, "C": 1},
                competency_id="financial_auditing",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Business, Management & Finance"],
            ),
            AdaptiveOption(
                id="c",
                text="Analyze cash flow patterns, cost structures, and profit margins to determine where financial leakage is impacting the business.",
                dimension_weights={"C": 2, "E": 2},
                competency_id="financial_auditing",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Business, Management & Finance"],
            ),
            AdaptiveOption(
                id="d",
                text="Design a simpler bookkeeping and daily tracking template so non-finance team members avoid repeat discrepancies.",
                dimension_weights={"C": 2, "S": 2},
                occupational_fields=["Business, Management & Finance"],
            ),
        ],
        target_dimensions=["C", "E"],
        prerequisite_domain="commerce_finance",
        target_competency_ids=["financial_auditing", "statutory_compliance"],
        explanation_tip="Evaluates systematic accounting analysis, ledger integrity, and audit scrutiny.",
    ),

    # 5. Data Science & Python: Dataset Exploration & Statistics
    AdaptiveQuestion(
        id="q_comp_python_data",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="You are given a raw dataset containing thousands of records with missing values and inconsistent formatting. What is your preferred way to explore it?",
        options=[
            AdaptiveOption(
                id="a",
                text="Write a Python script using Pandas or SQL to clean missing entries, calculate summary statistics, and visualize distributions.",
                dimension_weights={"I": 3, "C": 1},
                competency_id="data_structures",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Technology & Computer Science", "Data & AI"],
                practical_verification_note="Applied data manipulation and summary statistical modeling.",
            ),
            AdaptiveOption(
                id="b",
                text="Formulate testable hypotheses about the data and design statistical tests or predictive models to identify underlying patterns.",
                dimension_weights={"I": 3, "R": 1},
                occupational_fields=["Data & AI"],
            ),
            AdaptiveOption(
                id="c",
                text="Create an interactive visual dashboard (charts, graphs) so non-technical stakeholders can understand key findings easily.",
                dimension_weights={"A": 2, "E": 2},
                occupational_fields=["Arts, Design & Media", "Business, Management & Finance"],
            ),
            AdaptiveOption(
                id="d",
                text="I have not worked with large datasets in code yet, but I am comfortable organizing records in spreadsheets.",
                dimension_weights={"C": 2},
                occupational_fields=["Operations & Administration"],
            ),
        ],
        target_dimensions=["I", "C", "A"],
        prerequisite_domain="computer_applications",
        target_competency_ids=["data_structures", "problem_solving"],
        explanation_tip="Evaluates data cleaning, programming intuition, and analytical exploration.",
    ),

    # 6. Machine Learning & Computer Vision: Model Training & Diagnostics
    AdaptiveQuestion(
        id="q_comp_aiml_pipeline",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="You build a machine learning model using past data, but its predictions become less accurate when new, unseen data arrives. What would you try first to understand why?",
        options=[
            AdaptiveOption(
                id="a",
                text="Check whether the model memorized the training examples (overfitting) and test simpler patterns or regularization.",
                dimension_weights={"I": 3, "R": 1},
                competency_id="problem_solving",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Data & AI", "Technology & Computer Science"],
                practical_verification_note="Applied machine learning error diagnosis and generalization tuning.",
            ),
            AdaptiveOption(
                id="b",
                text="Inspect the incoming data to see if real-world conditions or user patterns changed compared to the past data.",
                dimension_weights={"I": 2, "C": 2},
                occupational_fields=["Data & AI"],
            ),
            AdaptiveOption(
                id="c",
                text="Look up how similar prediction problems are solved in published studies or open-source projects.",
                dimension_weights={"I": 3, "A": 1},
                occupational_fields=["Physical & Life Sciences", "Data & AI"],
            ),
            AdaptiveOption(
                id="d",
                text="Discuss the prediction discrepancies with a teammate or mentor to review our data preparation steps.",
                dimension_weights={"I": 2, "S": 1},
                occupational_fields=["Data & AI"],
            ),
        ],
        target_dimensions=["I", "R", "C"],
        prerequisite_domain="computer_applications",
        target_competency_ids=["problem_solving"],
        explanation_tip="Evaluates practical machine learning diagnostics and iterative experimentation.",
    ),

    # 7. Commerce & Finance: Budgeting & Financial Planning
    AdaptiveQuestion(
        id="q_comp_tax_budgeting",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="A growing startup or local business asks for guidance on planning its annual budget and organizing its tax filings. Which role would you be most comfortable taking on?",
        options=[
            AdaptiveOption(
                id="a",
                text="Calculating GST liabilities, verifying deductible business expenses, and preparing clear, compliant tax filing schedules.",
                dimension_weights={"C": 3, "I": 1},
                competency_id="financial_auditing",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Business, Management & Finance"],
                practical_verification_note="Demonstrates applied taxation compliance and statutory expense verification.",
            ),
            AdaptiveOption(
                id="b",
                text="Building a 12-month financial projection model with revenue scenarios, break-even points, and expense caps.",
                dimension_weights={"C": 2, "E": 2},
                competency_id="financial_modeling",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Business, Management & Finance"],
            ),
            AdaptiveOption(
                id="c",
                text="Evaluating commercial growth strategies and identifying new business opportunities to increase top-line sales.",
                dimension_weights={"E": 3, "A": 1},
                occupational_fields=["Sales & Business Development"],
            ),
            AdaptiveOption(
                id="d",
                text="Helping the team set up simple, organized digital accounting software and daily invoicing habits.",
                dimension_weights={"C": 2, "S": 2},
                occupational_fields=["Operations & Administration"],
            ),
        ],
        target_dimensions=["C", "E", "I"],
        prerequisite_domain="commerce_finance",
        target_competency_ids=["financial_auditing", "financial_modeling"],
        explanation_tip="Assesses corporate finance, tax planning, and commercial budgeting instincts.",
    ),

    # 8. Humanities & English: Communication & Editorial Clarity
    AdaptiveQuestion(
        id="q_comp_humanities_communication",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="When writing, editing, or presenting a comprehensive article or project report for an educated public audience, where do you invest most effort?",
        options=[
            AdaptiveOption(
                id="a",
                text="Refining narrative structure, tone, and expressive vocabulary to make the piece engaging, nuanced, and memorable.",
                dimension_weights={"A": 3, "S": 1},
                competency_id="technical_communication",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Arts, Design & Media"],
                practical_verification_note="Demonstrates applied editorial writing and narrative composition.",
            ),
            AdaptiveOption(
                id="b",
                text="Fact-checking claims, ensuring rigorous editorial consistency, and verifying that every argument is supported by credible citations.",
                dimension_weights={"C": 3, "I": 1},
                occupational_fields=["Education & Training", "Law & Public Policy"],
            ),
            AdaptiveOption(
                id="c",
                text="Simplifying difficult concepts into relatable examples so readers from any academic background can understand and connect.",
                dimension_weights={"S": 3, "E": 1},
                occupational_fields=["Education & Training", "Community & Social Services"],
            ),
            AdaptiveOption(
                id="d",
                text="Crafting a persuasive headline, strong call-to-action, and sharing strategy to maximize reach and discussion.",
                dimension_weights={"E": 3, "A": 1},
                occupational_fields=["Sales & Business Development", "Arts, Design & Media"],
            ),
        ],
        target_dimensions=["A", "C", "S", "E"],
        prerequisite_domain="arts_humanities",
        target_competency_ids=["technical_communication"],
        explanation_tip="Assesses rhetorical clarity, narrative craft, and analytical editing.",
    ),

    # 9. Education & Pedagogy: Teaching & Mentoring Empathy
    AdaptiveQuestion(
        id="q_comp_pedagogical_empathy",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="You are leading a study session or workshop, and a student is feeling discouraged because they cannot understand a core concept. How do you respond?",
        options=[
            AdaptiveOption(
                id="a",
                text="Listen to where they feel stuck, validate their effort, and explain the idea using a completely different real-world analogy.",
                dimension_weights={"S": 3, "A": 1},
                competency_id="technical_communication",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Education & Training", "Community & Social Services"],
                practical_verification_note="Demonstrates empathetic pedagogical scaffolding and adaptive instruction.",
            ),
            AdaptiveOption(
                id="b",
                text="Break down the concept into step-by-step modular practice exercises that build confidence through small wins.",
                dimension_weights={"I": 2, "C": 2},
                occupational_fields=["Education & Training"],
            ),
            AdaptiveOption(
                id="c",
                text="Deliver an inspiring talk about growth mindset and connect them with peer mentors who recently mastered the topic.",
                dimension_weights={"E": 2, "S": 2},
                occupational_fields=["Education & Training"],
            ),
            AdaptiveOption(
                id="d",
                text="Provide a hands-on physical demonstration or interactive exercise where they can learn by doing.",
                dimension_weights={"R": 2, "S": 2},
                occupational_fields=["Education & Training"],
            ),
        ],
        target_dimensions=["S", "I", "E", "R"],
        prerequisite_domain="arts_humanities",
        target_competency_ids=["technical_communication"],
        explanation_tip="Assesses pedagogical empathy, instructional scaffolding, and mentoring ability.",
    ),

    # 10. Mathematics & Quantitative Analysis: Real-World Modeling
    AdaptiveQuestion(
        id="q_comp_math_modeling",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="When working on a complex quantitative problem (such as optimizing transport routes, forecasting trends, or physical simulations), what part of the work excites you most?",
        options=[
            AdaptiveOption(
                id="a",
                text="Formulating the real-world problem into precise mathematical equations, objective functions, and constraints.",
                dimension_weights={"I": 3, "R": 1},
                competency_id="problem_solving",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Physical & Life Sciences", "Engineering & Architecture"],
                practical_verification_note="Demonstrates applied mathematical formulation and quantitative problem-solving.",
            ),
            AdaptiveOption(
                id="b",
                text="Analyzing the theoretical mathematical properties, convergence conditions, and proof validity behind the solution.",
                dimension_weights={"I": 3, "A": 1},
                occupational_fields=["Physical & Life Sciences"],
            ),
            AdaptiveOption(
                id="c",
                text="Writing clean algorithms or computational code to solve the equations numerically and benchmark performance.",
                dimension_weights={"I": 2, "C": 2},
                occupational_fields=["Technology & Computer Science", "Data & AI"],
            ),
            AdaptiveOption(
                id="d",
                text="Interpreting the numerical results to guide practical business or engineering decisions.",
                dimension_weights={"C": 2, "E": 2},
                occupational_fields=["Business, Management & Finance"],
            ),
        ],
        target_dimensions=["I", "R", "C"],
        prerequisite_domain="pure_applied_sciences",
        target_competency_ids=["problem_solving"],
        explanation_tip="Assesses mathematical modeling, proof reasoning, and quantitative problem formulation.",
    ),

    # 11. Scientific Research & Statistics: Hypothesis & Methodology
    AdaptiveQuestion(
        id="q_comp_stat_hypothesis",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="In a research experiment or survey, the preliminary data shows an unexpected correlation that seems to contradict conventional wisdom. What is your first reaction?",
        options=[
            AdaptiveOption(
                id="a",
                text="Apply rigorous statistical significance tests, calculate confidence intervals, and check for sample size biases.",
                dimension_weights={"I": 3, "C": 1},
                competency_id="problem_solving",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Physical & Life Sciences", "Data & AI"],
                practical_verification_note="Applied statistical hypothesis testing and research validity verification.",
            ),
            AdaptiveOption(
                id="b",
                text="Scrutinize data collection methodology, measurement instruments, and confounding variables to ensure reproducibility.",
                dimension_weights={"I": 3, "R": 1},
                occupational_fields=["Physical & Life Sciences"],
            ),
            AdaptiveOption(
                id="c",
                text="Brainstorm alternative creative hypotheses or theoretical models that could explain the phenomenon.",
                dimension_weights={"I": 2, "A": 2},
                occupational_fields=["Physical & Life Sciences"],
            ),
            AdaptiveOption(
                id="d",
                text="Present the unusual finding to the research group or stakeholders to spark multidisciplinary discussion.",
                dimension_weights={"E": 2, "S": 2},
                occupational_fields=["Education & Training"],
            ),
        ],
        target_dimensions=["I", "C", "R", "A"],
        prerequisite_domain="pure_applied_sciences",
        target_competency_ids=["problem_solving"],
        explanation_tip="Evaluates scientific methodology, statistical skepticism, and investigative curiosity.",
    ),

    # 12. Design & Creative Arts: User Experience & Interaction
    AdaptiveQuestion(
        id="q_comp_ui_ux_design",
        stage=AssessmentStage.COLLEGE_UG_PG,
        category=QuestionCategory.COMPETENCY_DEMONSTRATION,
        prompt="When redesigning an application that users find confusing and hard to navigate, what is your initial design action?",
        options=[
            AdaptiveOption(
                id="a",
                text="Map out user journey flows, conduct usability interviews, and create wireframes prioritizing intuitive navigation.",
                dimension_weights={"A": 2, "S": 2},
                competency_id="ui_ux_design",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Arts, Design & Media"],
                practical_verification_note="Demonstrates user-centered interaction design and wireframing.",
            ),
            AdaptiveOption(
                id="b",
                text="Establish a consistent visual design system with clear typography, color hierarchy, and accessible component states.",
                dimension_weights={"A": 3, "C": 1},
                competency_id="ui_ux_design",
                competency_level="intermediate",
                evidence_level=CompetencyEvidenceLevel.APPLIED_SCENARIO,
                occupational_fields=["Arts, Design & Media"],
            ),
            AdaptiveOption(
                id="c",
                text="Analyze user drop-off funnel analytics to identify the exact screens where users abandon the app.",
                dimension_weights={"I": 2, "C": 2},
                occupational_fields=["Data & AI", "Business, Management & Finance"],
            ),
            AdaptiveOption(
                id="d",
                text="I have not used formal design tools yet, but I have a strong eye for visual layout.",
                dimension_weights={"A": 2},
                occupational_fields=["Arts, Design & Media"],
            ),
        ],
        target_dimensions=["A", "S", "C", "I"],
        prerequisite_domain="design_creative_arts",
        target_competency_ids=["ui_ux_design"],
        explanation_tip="Assesses user empathy, design thinking, and interface architecture.",
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

def get_profile_dimension_affinities(profile: Optional[Dict[str, Any]]) -> Dict[str, int]:
    """
    Computes Holland RIASEC dimension affinities grounded in the student's declared
    interests, target career goals, and work style preferences.
    Used for intelligent profile-aware tie-breaking rather than arbitrary alphabetical ordering.
    """
    affinities = {d: 0 for d in DIMS}
    if not profile or not isinstance(profile, dict):
        return affinities

    # 1. Interests & Fields
    interests = profile.get("interests") or []
    if isinstance(interests, str):
        interests = [interests]
    km = profile.get("knowMe") or profile.get("know_me") or {}
    if km.get("subjectsEnjoy") and isinstance(km["subjectsEnjoy"], list):
        interests = list(interests) + list(km["subjectsEnjoy"])

    for interest in interests:
        il = str(interest).lower()
        if any(w in il for w in ["ai", "machine learning", "data", "science", "research", "math", "investigat", "analytics", "deep learning", "algorithms"]):
            affinities["I"] += 3
        if any(w in il for w in ["software", "hardware", "engineering", "robotics", "mechanic", "electronics", "civil", "build", "coding", "programming", "tools"]):
            affinities["R"] += 3
            affinities["I"] += 1
        if any(w in il for w in ["design", "art", "music", "writing", "creative", "media", "literature", "english", "graphic", "animation", "film"]):
            affinities["A"] += 3
        if any(w in il for w in ["teaching", "education", "counseling", "healthcare", "nursing", "medicine", "social", "community", "pedagogy", "speech"]):
            affinities["S"] += 3
        if any(w in il for w in ["business", "management", "entrepreneur", "marketing", "sales", "leadership", "commerce", "startup", "strategy"]):
            affinities["E"] += 3
        if any(w in il for w in ["accounting", "finance", "audit", "tax", "banking", "operations", "records", "compliance", "tally"]):
            affinities["C"] += 3

    # 2. Career Goals & Target Roles
    goals = profile.get("career_goals") or profile.get("goals") or []
    if isinstance(goals, str):
        goals = [goals]
    tr = profile.get("targetRole") or profile.get("career_preferences", {}).get("target_role") or ""
    all_goals = list(goals) + ([tr] if tr else [])
    for g in all_goals:
        gl = str(g).lower()
        if any(w in gl for w in ["data scientist", "researcher", "ai/ml", "scientist", "analyst", "astronomer", "mathematician"]):
            affinities["I"] += 4
        if any(w in gl for w in ["developer", "software engineer", "hardware engineer", "robotics", "mechanical", "civil"]):
            affinities["R"] += 3
            affinities["I"] += 2
            affinities["C"] += 1
        if any(w in gl for w in ["accountant", "auditor", "chartered accountant", "tax", "actuary", "financial analyst"]):
            affinities["C"] += 4
        if any(w in gl for w in ["teacher", "professor", "counselor", "therapist", "nurse", "doctor"]):
            affinities["S"] += 4
        if any(w in gl for w in ["writer", "author", "editor", "designer", "architect", "artist", "journalist"]):
            affinities["A"] += 4
        if any(w in gl for w in ["manager", "director", "founder", "executive", "product manager", "marketer", "sales"]):
            affinities["E"] += 4

    # 3. Work Style Preferences
    ws = profile.get("work_style") or {}
    if ws.get("people_vs_data") == "Working with people":
        affinities["S"] += 2
        affinities["E"] += 1
    elif ws.get("people_vs_data") == "Working with data or things":
        affinities["I"] += 2
        affinities["C"] += 1

    if ws.get("build_vs_analyze") == "Build and make things":
        affinities["R"] += 2
    elif ws.get("build_vs_analyze") == "Analyse and understand things":
        affinities["I"] += 2

    if ws.get("structure_vs_ambiguity") == "Clear structure and steps":
        affinities["C"] += 2
    elif ws.get("structure_vs_ambiguity") == "Open-ended problems":
        affinities["I"] += 1
        affinities["A"] += 1

    return affinities


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
        if normalize_skills(profile.get("skills")) or normalize_skills(se) or normalize_skills(profile.get("resume_skills")):
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

        student_skills = [s.lower() for s in (profile.get("skills") or []) + (profile.get("resume_skills") or [])]
        student_interests = [str(i).lower() for i in (profile.get("interests") or [])]
        student_goals = [str(g).lower() for g in (profile.get("career_goals") or []) + ([profile.get("targetRole")] if profile.get("targetRole") else [])]
        all_signals_text = " ".join(student_skills + student_interests + student_goals + [combined_text])

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
                    if any(term in all_signals_text for term in ["python", "data", "software", "ai", "machine learning", "developer"]):
                        matches_domain = True
                elif not matches_domain and q.prerequisite_domain == "commerce_finance":
                    if any(term in all_signals_text for term in ["accounting", "finance", "tax", "tally", "gst"]):
                        matches_domain = True
                elif not matches_domain and q.prerequisite_domain == "arts_humanities":
                    if any(term in all_signals_text for term in ["english", "literature", "writing", "teaching", "editorial"]):
                        matches_domain = True
                elif not matches_domain and q.prerequisite_domain == "pure_applied_sciences":
                    if any(term in all_signals_text for term in ["math", "statistics", "calculus", "research"]):
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

    def get_next_adaptive_question(
        self,
        profile: Dict[str, Any],
        answers: Dict[str, Any],
        asked_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Step-by-step adaptive question selector with evidence-based dynamic stopping.
        1. Evaluates running scores and dimension certainty after each submitted answer.
        2. Stops early (at 8-10 questions) if RIASEC dimensions show a decisive, established lead.
        3. Caps maximum questions at 12 to prevent student fatigue.
        4. Selects discriminator questions when dimensions are tied or within close margins.
        5. Calibrated to student's academic stage, domain, skills, and declared interests.
        """
        profile = profile or {}
        answers = answers or {}
        asked_set = set(asked_ids or [])
        asked_set.update(str(k) for k in answers.keys())

        answered_count = len(answers)
        stage = self.resolve_stage(profile)
        classified = classify_education(profile)

        # Compute running assessment scores and dimension rankings
        running_score_data = self.score_adaptive_assessment(answers, profile)
        running_scores = running_score_data["scores"]
        code = running_score_data["code"]

        dim_affinities = get_profile_dimension_affinities(profile)
        sorted_dims = sorted(DIMS, key=lambda d: (-running_scores[d], -dim_affinities.get(d, 0), DIMS.index(d)))
        dim_1, dim_2, dim_3 = sorted_dims[0], sorted_dims[1], sorted_dims[2]
        s1, s2, s3 = running_scores[dim_1], running_scores[dim_2], running_scores[dim_3]

        # --------------------------------------------------------------------
        # 1. DYNAMIC EVIDENCE-BASED STOPPING CONDITIONS
        # --------------------------------------------------------------------
        # Upper bound: Stop at 12 questions
        if answered_count >= 12:
            return {
                "question": None,
                "is_complete": True,
                "completion_reason": (
                    f"Assessment complete. Comprehensive multi-dimensional evidence collected across 12 questions. "
                    f"Primary profile established as {code} ({DIM_LABEL.get(code[0])}-{DIM_LABEL.get(code[1])}-{DIM_LABEL.get(code[2])})."
                ),
                "question_number": answered_count + 1,
                "min_questions": 8,
                "max_questions": 12,
                "current_scores": running_scores,
                "leading_dimensions": sorted_dims[:3],
                "calibrated_stage": stage.value,
            }

        # Early stopping condition (at 8 to 11 questions):
        # Stop if top 2 dimensions have a decisive lead over 3rd dimension
        if answered_count >= 8:
            lead_over_third = s2 - s3
            top_lead = s1 - s3
            if lead_over_third >= 3 and top_lead >= 6:
                return {
                    "question": None,
                    "is_complete": True,
                    "completion_reason": (
                        f"Trait certainty reached in {answered_count} questions. Decisive separation established "
                        f"for {DIM_LABEL.get(dim_1)} ({dim_1}) and {DIM_LABEL.get(dim_2)} ({dim_2}) over other dimensions."
                    ),
                    "question_number": answered_count + 1,
                    "min_questions": 8,
                    "max_questions": 12,
                    "current_scores": running_scores,
                    "leading_dimensions": sorted_dims[:3],
                    "calibrated_stage": stage.value,
                }

        # --------------------------------------------------------------------
        # 2. CANDIDATE QUESTION FILTERING & SELECTION
        # --------------------------------------------------------------------
        registry = self._get_question_registry()
        answered_keys = self.get_already_answered_keys(profile)

        spec_lower = (classified.specialization or "").lower()
        stream_lower = (classified.course_or_stream or "").lower()
        combined_text = f"{spec_lower} {stream_lower} {str(profile.get('degree') or '')}".lower()
        profile_stream = (profile.get("school_stream") or "").lower()

        student_skills = [s.lower() for s in (profile.get("skills") or []) + (profile.get("resume_skills") or [])]
        student_interests = [str(i).lower() for i in (profile.get("interests") or [])]
        student_goals = [str(g).lower() for g in (profile.get("career_goals") or []) + ([profile.get("targetRole")] if profile.get("targetRole") else [])]
        all_signals_text = " ".join(student_skills + student_interests + student_goals + [combined_text])

        has_software_affinity = any(t in all_signals_text for t in ["software developer", "software engineer", "backend", "web development", "java", "coding", "programmer", "full stack", "frontend", "oop", "application developer", "database"])
        has_data_ai_affinity = any(t in all_signals_text for t in ["data", "python", "machine learning", "ai", "pandas", "sql", "analytics", "deep learning", "neural", "vision", "pytorch", "data scientist"])
        has_finance_affinity = any(t in all_signals_text for t in ["accounting", "finance", "tax", "audit", "commerce", "tally", "gst", "chartered accountant", "bookkeeping"])
        has_arts_affinity = any(t in all_signals_text for t in ["english", "literature", "writing", "teaching", "editorial", "communication", "public speaking", "content", "journalism", "creative"])
        has_math_affinity = any(t in all_signals_text for t in ["math", "calculus", "statistics", "mathematics", "equations", "modeling", "quantitative", "research"])
        has_health_affinity = any(t in all_signals_text for t in ["health", "nurse", "medical", "patient", "clinical", "hospital", "doctor"])

        is_pcb = (
            classified.domain == AcademicDomain.MEDICAL_HEALTHCARE
            or "pcb" in profile_stream or "biology" in profile_stream
            or ("pcb" in combined_text or "biology" in combined_text)
        ) and "non-medical" not in combined_text and "non-medical" not in profile_stream

        is_commerce = (
            classified.domain == AcademicDomain.COMMERCE_FINANCE
            or "commerce" in profile_stream or "commerce" in combined_text
            or "account" in profile_stream or "account" in combined_text
        )

        is_pcm = (
            classified.domain == AcademicDomain.ENGINEERING_TECH
            or "pcm" in profile_stream or "pcm" in combined_text
            or ("math" in combined_text and not is_commerce and not is_pcb)
        ) and not is_pcb

        def _is_eligible(q: AdaptiveQuestion) -> bool:
            if q.id in asked_set:
                return False
            # Deduplication against onboarding
            if any(k in answered_keys for k in q.skip_if_profile_keys):
                return False
            # Stage compatibility: School 10th questions must NOT be asked to 12th/College/Diploma;
            # Diploma questions must NOT be asked to School/12th/College;
            # College questions must NOT be asked to School/12th/Diploma;
            # GENERAL questions are universally applicable across all stages.
            if q.stage != AssessmentStage.GENERAL:
                if stage == AssessmentStage.COLLEGE_UG_PG:
                    if q.stage != AssessmentStage.COLLEGE_UG_PG:
                        return False
                elif stage == AssessmentStage.CAREER_TRANSITION:
                    if q.stage not in [AssessmentStage.CAREER_TRANSITION, AssessmentStage.COLLEGE_UG_PG]:
                        return False
                elif stage == AssessmentStage.HIGHER_SECONDARY_12TH:
                    if q.stage != AssessmentStage.HIGHER_SECONDARY_12TH:
                        return False
                elif stage == AssessmentStage.SCHOOL_10TH:
                    if q.stage != AssessmentStage.SCHOOL_10TH:
                        return False
                elif stage == AssessmentStage.DIPLOMA_POLYTECHNIC:
                    if q.stage != AssessmentStage.DIPLOMA_POLYTECHNIC:
                        return False
            # Stream prerequisites
            if q.prerequisite_stream:
                if q.prerequisite_stream == "science_pcb" and not is_pcb:
                    return False
                if q.prerequisite_stream == "science_pcm" and not is_pcm:
                    return False
                if q.prerequisite_stream == "commerce" and not is_commerce:
                    return False
            # Domain prerequisites
            if q.prerequisite_domain:
                dom = q.prerequisite_domain
                matches = False
                if classified.domain == dom:
                    if q.id == "q_comp_java_concurrency":
                        matches = has_software_affinity or classified.domain in [AcademicDomain.ENGINEERING_TECH, AcademicDomain.COMPUTER_APPLICATIONS]
                    else:
                        matches = True
                elif dom == "computer_applications":
                    if q.id == "q_comp_java_concurrency":
                        matches = has_software_affinity
                    elif q.id == "q_comp_aiml_pipeline":
                        matches = has_data_ai_affinity and any(t in all_signals_text for t in ["ai", "machine learning", "vision", "pytorch", "deep learning", "neural"])
                    elif q.id == "q_comp_python_data":
                        matches = has_data_ai_affinity or has_software_affinity or has_math_affinity
                    else:
                        matches = has_data_ai_affinity or has_software_affinity
                elif dom == "commerce_finance" and has_finance_affinity:
                    matches = True
                elif dom == "arts_humanities" and has_arts_affinity:
                    matches = True
                elif dom == "pure_applied_sciences" and has_math_affinity:
                    matches = True
                elif dom == "medical_healthcare" and has_health_affinity:
                    matches = True
                elif stage == AssessmentStage.CAREER_TRANSITION:
                    matches = True

                if not matches:
                    return False
            return True

        eligible_questions = [q for q in registry.values() if _is_eligible(q)]
        if not eligible_questions:
            return {
                "question": None,
                "is_complete": True,
                "completion_reason": f"Assessment complete with {answered_count} questions.",
                "question_number": answered_count + 1,
                "min_questions": 8,
                "max_questions": 12,
                "current_scores": running_scores,
                "leading_dimensions": sorted_dims[:3],
                "calibrated_stage": stage.value,
            }

        # --------------------------------------------------------------------
        # 3. SELECT NEXT QUESTION
        # --------------------------------------------------------------------
        selected_q: Optional[AdaptiveQuestion] = None

        # Check for tied/ambiguous dimensions between questions 8 and 11
        if answered_count >= 8:
            tied_dims: Set[str] = set()
            if s1 - s2 <= 2:
                tied_dims.update([dim_1, dim_2])
            if s2 - s3 <= 2:
                tied_dims.update([dim_2, dim_3])

            if tied_dims:
                for q in eligible_questions:
                    if len(set(q.target_dimensions).intersection(tied_dims)) >= 2:
                        selected_q = q
                        break

        # For initial questions (1 & 2): prioritize student's primary domain/interest competency items
        if not selected_q and answered_count < 2 and stage in [AssessmentStage.COLLEGE_UG_PG, AssessmentStage.CAREER_TRANSITION]:
            # 1. First prioritize AI/ML or Data specific questions if student has explicit AI/ML or Data goals/interests
            if has_data_ai_affinity:
                for q in eligible_questions:
                    if q.id == "q_comp_aiml_pipeline" and any(term in all_signals_text for term in ["ai", "machine learning", "vision", "pytorch", "opencv"]):
                        selected_q = q
                        break
                    elif q.id == "q_comp_python_data" and any(term in all_signals_text for term in ["data science", "data analyst", "pandas", "dataset"]):
                        selected_q = q
                        break

            # 2. Look for exact academic domain match (e.g. pure_applied_sciences for B.Sc Math, arts_humanities for BA, commerce_finance for B.Com)
            if not selected_q:
                for q in eligible_questions:
                    if q.category == QuestionCategory.COMPETENCY_DEMONSTRATION and q.prerequisite_domain == classified.domain:
                        selected_q = q
                        break

            # 3. Look for any eligible domain question matching student's active affinity
            if not selected_q:
                for q in eligible_questions:
                    if q.category == QuestionCategory.COMPETENCY_DEMONSTRATION and q.prerequisite_domain:
                        selected_q = q
                        break

        # Fallback to stage questions (e.g. for School 10th, 12th PCB/PCM)
        if not selected_q and stage in [AssessmentStage.SCHOOL_10TH, AssessmentStage.HIGHER_SECONDARY_12TH, AssessmentStage.DIPLOMA_POLYTECHNIC]:
            stage_qs = [q for q in eligible_questions if q.stage == stage]
            if stage_qs:
                selected_q = stage_qs[0]

        # Dynamic Adaptive Selection for Subsequent Questions:
        # Evaluates candidate questions against student's running RIASEC scores and trajectory.
        # Questions that probe or separate the student's active leading dimensions are prioritized,
        # ensuring that selecting Option A vs Option C dynamically branches to different follow-up questions!
        if not selected_q:
            dim_counts = {d: 0 for d in DIMS}
            for qid in answers.keys():
                pq = registry.get(qid)
                if pq:
                    for td in pq.target_dimensions:
                        dim_counts[td] += 1

            def _question_adaptive_score(q: AdaptiveQuestion) -> float:
                score = 0.0
                q_dims = set(q.target_dimensions)

                # 1. Trajectory Alignment: Questions targeting active leading dimensions
                for d in q_dims:
                    if d in running_scores:
                        score += (running_scores[d] / 20.0)

                # 2. Differentiation Bonus: If dim_1 and dim_2 are competing, probe both
                if len(q_dims.intersection({dim_1, dim_2})) >= 2:
                    score += 4.0
                elif len(q_dims.intersection({dim_2, dim_3})) >= 2:
                    score += 3.0
                elif dim_1 in q_dims:
                    score += 2.0
                elif dim_2 in q_dims:
                    score += 1.5

                # 3. Domain relevance bonus
                if q.category == QuestionCategory.COMPETENCY_DEMONSTRATION:
                    score += 2.0

                # 4. Coverage penalty to avoid repetitive dimensions
                times_tested = sum(dim_counts.get(d, 0) for d in q_dims)
                score -= (times_tested * 1.5)

                return score

            eligible_questions.sort(key=_question_adaptive_score, reverse=True)
            selected_q = eligible_questions[0]

        return {
            "question": selected_q.to_dict() if selected_q else None,
            "is_complete": False,
            "completion_reason": None,
            "question_number": answered_count + 1,
            "min_questions": 8,
            "max_questions": 12,
            "current_scores": running_scores,
            "leading_dimensions": sorted_dims[:3],
            "calibrated_stage": stage.value,
        }

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
        dim_affinities = get_profile_dimension_affinities(profile)
        if valid_answers_count == 0:
            scores = {d: 50 for d in DIMS}
            order = sorted(DIMS, key=lambda d: (-dim_affinities.get(d, 0), DIMS.index(d)))
            code = "".join(order[:3])
            top_fields = []
            sorted_fields = []
        else:
            # Scale dynamically relative to total answered questions (matching 24.0 max baseline for 12 questions)
            scale_factor = 24.0 * (valid_answers_count / 12.0) if valid_answers_count >= 6 else 24.0
            scores = {d: min(100, max(0, round((raw_dimensions[d] / max(scale_factor, 1.0)) * 100))) for d in DIMS}

            order = sorted(DIMS, key=lambda d: (-scores[d], -dim_affinities.get(d, 0), DIMS.index(d)))
            code = "".join(order[:3])

            sorted_fields = sorted(field_points.items(), key=lambda x: x[1], reverse=True)
            top_fields = [f[0] for f in sorted_fields[:4]]

        # Evidence Breakdown: Strictly separated tiers
        # 1. Self-reported skills (from profile onboarding or resume)
        incoming_skills = []
        if profile.get("skills"):
            incoming_skills.append(profile.get("skills"))
        if profile.get("resume_skills"):
            incoming_skills.append(profile.get("resume_skills"))
        if isinstance(profile.get("resume"), dict) and profile.get("resume", {}).get("skills"):
            incoming_skills.append(profile["resume"]["skills"])
        if profile.get("skills_and_experience"):
            incoming_skills.append(profile.get("skills_and_experience"))

        raw_skills = normalize_skills(incoming_skills)

        self_reported_list = [
            {
                "skill": s,
                "evidence_level": CompetencyEvidenceLevel.SELF_REPORTED.value,
                "source": "onboarding_profile",
            }
            for s in raw_skills
        ]

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
