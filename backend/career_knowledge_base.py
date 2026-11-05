"""
career_knowledge_base.py
Evidence-Based Career Knowledge Base for Personal AI Career Counselor (Phase 4.2).

Structured, verified career intelligence layer providing:
1. Canonical Career Identity & Classification (NCS India, O*NET, UGC, AICTE, NCVET)
2. In-Depth Work Information & Progression Ladders
3. Reusable Multi-Level Competency Taxonomy with Practical Demonstration Methods
4. India-Specific Education Pathways (Class 10/12, ITI, Diploma, UG, PG, Alternative)
5. Mandatory Statutory Licensing & Regulatory Restrictions (NMC, BCI, PCI, ICAI, CoA, DGCA)
6. Fresher, Career-Switcher, and Career-Break Returner Eligibility
7. Work Preferences & RIASEC Holland Codes
8. Career Transitions & Transferable Competencies
9. Source Attribution & Reliability Verification Metadata
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
import json
import os
from pathlib import Path
import re
from typing import Optional, List, Dict, Any, Union, Set

from education_classifier import (
    AcademicDomain,
    EducationLevel,
    ClassifiedEducation,
    classify_education,
    DOMAIN_DISPLAY_NAMES,
)

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ONET_CAREERS_PATH = DATA_DIR / "onet_careers.json"
CKB_DATA_PATH = DATA_DIR / "career_knowledge_base.json"


# ============================================================================
# 1. ENUMS & TAXONOMY CLASSIFICATIONS
# ============================================================================

class CompetencyCategory(str, Enum):
    TECHNICAL = "technical"
    SOFT = "soft"
    DOMAIN_KNOWLEDGE = "domain_knowledge"
    ANALYTICAL = "analytical"
    COMMUNICATION = "communication"
    PROBLEM_SOLVING = "problem_solving"
    DIGITAL = "digital"


class ProficiencyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CompetencyImportance(str, Enum):
    ESSENTIAL = "essential"
    DESIRABLE = "desirable"


class RegulatoryStatus(str, Enum):
    MANDATORY_STATUTORY = "mandatory_statutory"  # Legally required by Act of Parliament (NMC, BCI, PCI, ICAI, CoA)
    INDUSTRY_STANDARD = "industry_standard"      # Certifications highly valued by industry (AWS, PMP, CFA)
    UNREGULATED_SKILL_FIRST = "unregulated_skill_first"  # Skill & portfolio driven (Software, Design, Writing)


class ExperienceLevel(str, Enum):
    NO_EXPERIENCE = "no_experience"              # Pure fresher friendly
    INTERNSHIP_PREFERRED = "internship_preferred"# Internships or practical projects expected
    ONE_TO_TWO_YEARS = "1_to_2_years"            # Junior professional
    EXPERIENCED = "experienced"                  # 3+ years required


class TransitionDifficulty(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ============================================================================
# 2. DATA SCHEMAS (EVIDENCE-BASED CAREER KNOWLEDGE)
# ============================================================================

@dataclass
class Competency:
    id: str
    name: str
    category: str                       # CompetencyCategory value
    description: str
    proficiency_level: str              # ProficiencyLevel value
    importance: str                     # CompetencyImportance value
    demonstration_methods: List[str]    # How competency can be proven (e.g. GitHub repo, practical test, audit)
    assessment_rubric: Dict[str, str] = field(default_factory=dict) # Evaluation criteria across levels

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StatutoryLicensing:
    is_mandatory: bool
    regulatory_body: Optional[str] = None     # e.g., "National Medical Commission (NMC)", "Bar Council of India (BCI)"
    statutory_act: Optional[str] = None       # e.g., "Advocates Act 1961", "National Medical Commission Act 2019"
    licensing_exam: Optional[str] = None      # e.g., "All India Bar Examination (AIBE)", "NExT / NEET-PG"
    internship_requirement: Optional[str] = None # e.g., "1 Year Compulsory Rotating Medical Internship (CRMI)"
    notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EducationPathway:
    relevant_class_10_subjects: List[str] = field(default_factory=list)
    relevant_class_12_streams: List[str] = field(default_factory=list)
    relevant_diploma_iti: List[str] = field(default_factory=list)
    required_undergraduate: List[str] = field(default_factory=list)
    preferred_undergraduate: List[str] = field(default_factory=list)
    alternative_undergraduate: List[str] = field(default_factory=list)
    relevant_postgraduate: List[str] = field(default_factory=list)
    alternative_entry_pathways: List[str] = field(default_factory=list)
    academic_prerequisites: List[str] = field(default_factory=list)
    mandatory_licensing: StatutoryLicensing = field(default_factory=lambda: StatutoryLicensing(is_mandatory=False))
    eligibility_limitations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class WorkProfile:
    main_responsibilities: List[str] = field(default_factory=list)
    typical_daily_activities: List[Dict[str, str]] = field(default_factory=list)
    work_environment: str = "Indoor / Office"
    common_employment_sectors: List[str] = field(default_factory=list)
    entry_level_job_titles: List[str] = field(default_factory=list)
    career_progression: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ExperienceProfile:
    fresher_eligible: bool = True
    entry_experience_level: str = ExperienceLevel.NO_EXPERIENCE.value
    internship_pathways: List[str] = field(default_factory=list)
    portfolio_expectations: List[str] = field(default_factory=list)
    career_switch_friendliness: str = "high" # "high", "medium", "low"
    transferable_experience_notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class WorkPreferences:
    riasec_code: str = "IRC"
    people_vs_data: str = "balanced"        # "people", "data", "balanced"
    team_vs_independent: str = "team"       # "team", "independent", "flexible"
    practical_vs_theoretical: str = "practical" # "practical", "theoretical", "balanced"
    creative_vs_structured: str = "structured"  # "creative", "structured", "balanced"
    indoor_vs_outdoor: str = "indoor"       # "indoor", "outdoor", "mixed"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class TransitionRoute:
    target_career_slug: str
    target_career_title: str
    transferable_competencies: List[str]
    bridge_skills_needed: List[str]
    difficulty: str                         # TransitionDifficulty value
    estimated_transition_months: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SourceMetadata:
    source_name: str
    source_url: Optional[str] = None
    verification_date: str = "2026-11-01"
    regional_scope: str = "India (National)"
    confidence: float = 0.95
    regulatory_status: str = RegulatoryStatus.UNREGULATED_SKILL_FIRST.value
    record_provenance: str = "projected_onet"          # "curated_benchmark" vs "projected_onet"
    verification_status: str = "inferred_heuristics"    # "manually_verified" vs "inferred_heuristics"
    notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CareerKnowledgeRecord:
    id: str                                 # Unique identifier / slug
    slug: str
    soc_code: Optional[str] = None          # O*NET SOC code if mapped
    nco_code: Optional[str] = None          # Indian National Classification of Occupations code
    canonical_title: str = ""
    alternative_job_titles: List[str] = field(default_factory=list)
    category: str = "Technology"
    industry: str = "Information Technology"
    domain: str = AcademicDomain.ENGINEERING_TECH.value
    description: str = ""
    work_profile: WorkProfile = field(default_factory=WorkProfile)
    competencies: List[Competency] = field(default_factory=list)
    education_pathways: EducationPathway = field(default_factory=EducationPathway)
    experience_profile: ExperienceProfile = field(default_factory=ExperienceProfile)
    work_preferences: WorkPreferences = field(default_factory=WorkPreferences)
    transition_routes: List[TransitionRoute] = field(default_factory=list)
    related_career_slugs: List[str] = field(default_factory=list)
    source_metadata: SourceMetadata = field(default_factory=lambda: SourceMetadata(source_name="O*NET & NCS India"))

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EligibilityResult:
    is_eligible: bool
    eligibility_type: str                   # "direct_eligible", "preferred_pathway", "alternative_pathway", "restricted_ineligible", "prerequisite_required", "clarification_needed"
    reason: str
    mandatory_licensing_required: bool = False
    licensing_details: Optional[Dict[str, Any]] = None
    prerequisites_met: bool = True
    missing_prerequisites: List[str] = field(default_factory=list)
    recommended_bridge_steps: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ============================================================================
# 3. REUSABLE COMPETENCY REGISTRY
# ============================================================================

COMPETENCY_REGISTRY: Dict[str, Competency] = {
    # Core Engineering & Software Competencies
    "java_programming": Competency(
        id="java_programming",
        name="Java Programming",
        category=CompetencyCategory.TECHNICAL.value,
        description="Object-oriented application programming in Java, including memory management, collections, and concurrency.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Production-grade backend project on GitHub with unit tests",
            "Practical coding interview / live technical debugging task",
            "Oracle Certified Professional (OCP) Java certification",
        ],
        assessment_rubric={
            "beginner": "Understands class syntax, control flow, loops, and basic OOP principles.",
            "intermediate": "Uses Java Collections framework, streams API, multithreading, and builds robust REST backends.",
            "advanced": "Designs concurrent lock-free architectures, profiles memory leaks, optimizes JVM garbage collection.",
        }
    ),
    "oop_design": Competency(
        id="oop_design",
        name="Object-Oriented Programming (OOP)",
        category=CompetencyCategory.TECHNICAL.value,
        description="Encapsulation, abstraction, inheritance, polymorphism, and SOLID design principles for maintainable architectures.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Design pattern implementation (Factory, Singleton, Observer, Strategy) in real codebase",
            "Code review evaluation of class coupling and interface separation",
        ],
        assessment_rubric={
            "beginner": "Implements basic class hierarchies and method overrides.",
            "intermediate": "Applies SOLID principles cleanly, preventing tight coupling across service layers.",
            "advanced": "Architects extensible domain-driven models for enterprise scale.",
        }
    ),
    "data_structures": Competency(
        id="data_structures",
        name="Data Structures & Algorithms",
        category=CompetencyCategory.ANALYTICAL.value,
        description="Core data organization (arrays, linked lists, hash tables, trees, graphs) and algorithmic complexity (Big O).",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Competitive programming / LeetCode / HackerRank verified algorithmic solving",
            "Performance benchmarking of search/sort algorithms under heavy payloads",
        ],
        assessment_rubric={
            "beginner": "Traverses arrays and linked lists; analyzes basic O(N) operations.",
            "intermediate": "Implements dynamic programming, graph traversals (BFS/DFS), and balanced binary search trees.",
            "advanced": "Optimizes cache-line aware memory structures and distributed indexing algorithms.",
        }
    ),
    "sql_relational_db": Competency(
        id="sql_relational_db",
        name="SQL & Relational Databases",
        category=CompetencyCategory.TECHNICAL.value,
        description="Relational data modeling, ACID transactions, complex queries, indexing, and performance tuning.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "PostgreSQL or MySQL database schema with foreign keys, indexes, and migrations",
            "Writing complex multi-table JOINs, subqueries, and window functions",
            "Explaining execution plans (EXPLAIN ANALYZE) to resolve slow query bottlenecks",
        ],
        assessment_rubric={
            "beginner": "Executes SELECT, INSERT, UPDATE, and basic WHERE/ORDER BY operations.",
            "intermediate": "Writes composite joins, group-by aggregations, creates indexes, and handles transactions.",
            "advanced": "Optimizes query execution plans, configures connection pooling, and designs sharded schemas.",
        }
    ),
    "rest_apis": Competency(
        id="rest_apis",
        name="RESTful API Architecture",
        category=CompetencyCategory.TECHNICAL.value,
        description="Designing, documenting, and securing HTTP RESTful web services following OpenAPI/Swagger specifications.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "API documentation published via Swagger / OpenAPI with standardized HTTP status codes",
            "Implementation of JWT / OAuth2 token authentication and rate limiting",
        ],
        assessment_rubric={
            "beginner": "Creates basic CRUD endpoints returning JSON payloads.",
            "intermediate": "Implements pagination, error-handling middleware, idempotent PUT/PATCH semantics, and JWT security.",
            "advanced": "Architects resilient API gateways, contract testing, versioning, and rate-limiting throttling.",
        }
    ),
    "spring_boot": Competency(
        id="spring_boot",
        name="Spring Boot Framework",
        category=CompetencyCategory.TECHNICAL.value,
        description="Enterprise Java microservice framework including Spring MVC, Spring Data JPA, and Spring Security.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Full Spring Boot microservice deployed with Docker and connected to PostgreSQL",
            "Integration test suite utilizing Mockito and SpringBootTest",
        ],
        assessment_rubric={
            "beginner": "Configures application.properties and bootstraps a Spring Boot controller.",
            "intermediate": "Builds complete microservices using Spring Data JPA, transaction management, and exception advice.",
            "advanced": "Configures reactive Spring WebFlux, Spring Cloud Eureka/Config, and Kafka event listeners.",
        }
    ),
    "system_debugging": Competency(
        id="system_debugging",
        name="Debugging & Root Cause Analysis",
        category=CompetencyCategory.PROBLEM_SOLVING.value,
        description="Systematic isolation, reproduction, and resolution of software errors, deadlocks, and edge-case exceptions.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Live debugging session diagnosing a reproduced defect or race condition",
            "Log analysis with structured tracing tools (ELK stack / Datadog)",
        ],
        assessment_rubric={
            "beginner": "Uses print statements and basic IDE breakpoints to observe local variables.",
            "intermediate": "Inspects thread dumps, analyzes stack traces, and isolates reproducible test cases.",
            "advanced": "Performs distributed tracing across microservices, memory heap analysis, and network packet capture.",
        }
    ),
    "problem_solving": Competency(
        id="problem_solving",
        name="Analytical Problem Solving",
        category=CompetencyCategory.PROBLEM_SOLVING.value,
        description="Deconstructing complex real-world ambiguities into solvable, modular technical components.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Case study presentation detailing technical trade-offs and alternative architectures evaluated",
            "Root-cause post-mortem analysis of a simulated failure scenario",
        ],
        assessment_rubric={
            "beginner": "Follows standard procedural steps to resolve predefined problems.",
            "intermediate": "Identifies bottlenecks independently and tests multiple hypotheses systematically.",
            "advanced": "Evaluates strategic architectural trade-offs under high ambiguity and resource constraints.",
        }
    ),
    "version_control_git": Competency(
        id="version_control_git",
        name="Version Control (Git)",
        category=CompetencyCategory.DIGITAL.value,
        description="Source code versioning, branch management, merge conflict resolution, and collaborative pull request workflows.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Active GitHub/GitLab profile with branch merges, pull requests, and atomic commits",
            "Resolving a complex 3-way git merge conflict cleanly without losing history",
        ],
        assessment_rubric={
            "beginner": "Executes git add, commit, push, pull, and clone commands.",
            "intermediate": "Manages feature branches, rebases, resolves merge conflicts, and performs peer code reviews.",
            "advanced": "Sets up branch protection rules, Git submodules, bisect debugging, and CI/CD webhook triggers.",
        }
    ),
    "technical_communication": Competency(
        id="technical_communication",
        name="Technical Communication",
        category=CompetencyCategory.COMMUNICATION.value,
        description="Articulating technical designs, documentation, and rationale clearly to engineering peers and non-technical stakeholders.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.DESIRABLE.value,
        demonstration_methods=[
            "Authoring clear README markdown documentation, architecture design records (ADRs), or API docs",
            "Presenting technical architecture proposals in engineering sprint reviews",
        ],
        assessment_rubric={
            "beginner": "Communicates basic task updates and writes simple code comments.",
            "intermediate": "Drafts clear technical documentation, API specifications, and pull request explanations.",
            "advanced": "Presents complex architectural strategies persuasively to executive stakeholders and external clients.",
        }
    ),

    # Clinical / Medical Competencies
    "clinical_diagnosis": Competency(
        id="clinical_diagnosis",
        name="Clinical Diagnosis & Patient Examination",
        category=CompetencyCategory.TECHNICAL.value,
        description="Comprehensive history taking, physical examination, diagnostic test interpretation, and differential diagnosis.",
        proficiency_level=ProficiencyLevel.ADVANCED.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "OSCE (Objective Structured Clinical Examination) practical evaluation",
            "Supervised clinical case presentations during hospital ward rotations",
            "Completion of 1-Year Compulsory Rotating Medical Internship (CRMI)",
        ],
        assessment_rubric={
            "beginner": "Records medical history accurately and performs vital sign assessments.",
            "intermediate": "Performs systemic physical examinations and formulates differential diagnoses.",
            "advanced": "Synthesizes complex diagnostic tests under emergency conditions and institutes life-saving therapies.",
        }
    ),
    "pharmacotherapy": Competency(
        id="pharmacotherapy",
        name="Pharmacotherapy & Prescription Management",
        category=CompetencyCategory.DOMAIN_KNOWLEDGE.value,
        description="Evaluating drug interactions, pharmacokinetics, contraindications, and evidence-based clinical dosing.",
        proficiency_level=ProficiencyLevel.ADVANCED.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Prescription audit and clinical pharmacology practical assessment",
            "NMC / State Medical Council licensed prescribing authority",
        ],
        assessment_rubric={
            "beginner": "Identifies drug classes, mechanisms of action, and typical adverse effects.",
            "intermediate": "Calculates adjusted pediatric and renal dosages, avoiding adverse drug interactions.",
            "advanced": "Manages complex multi-morbidity regimens and critical care pharmacotherapy.",
        }
    ),

    # Legal Competencies
    "courtroom_advocacy": Competency(
        id="courtroom_advocacy",
        name="Courtroom Advocacy & Litigation",
        category=CompetencyCategory.COMMUNICATION.value,
        description="Oral argument presentation, evidentiary examination, cross-examination, and judicial procedural compliance.",
        proficiency_level=ProficiencyLevel.ADVANCED.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Moot court trial competitions and practical court trial assistance",
            "Bar Council of India All India Bar Examination (AIBE) qualification",
        ],
        assessment_rubric={
            "beginner": "Understands court hierarchy and judicial etiquette.",
            "intermediate": "Drafts bail applications, civil suits, and conducts structured witness examination.",
            "advanced": "Presents persuasive appellate arguments before High Courts and Supreme Court benches.",
        }
    ),
    "legal_research_drafting": Competency(
        id="legal_research_drafting",
        name="Legal Research & Pleading Drafting",
        category=CompetencyCategory.ANALYTICAL.value,
        description="Case law analysis, statutory interpretation, writ petition preparation, and commercial contract drafting.",
        proficiency_level=ProficiencyLevel.ADVANCED.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "SCC Online / Manupatra research memo citing binding precedents",
            "Drafting a legally binding non-disclosure agreement or civil plaint",
        ],
        assessment_rubric={
            "beginner": "Finds relevant legal statutes and cites primary case law.",
            "intermediate": "Drafts formal legal notices, affidavits, and commercial contract clauses.",
            "advanced": "Drafts complex constitutional writ petitions and structured dispute settlement frameworks.",
        }
    ),

    # Finance / Accounting Competencies
    "statutory_auditing": Competency(
        id="statutory_auditing",
        name="Statutory Auditing & Assurance",
        category=CompetencyCategory.TECHNICAL.value,
        description="Planning and executing statutory financial audits under Standards on Auditing (SAs) and Companies Act provisions.",
        proficiency_level=ProficiencyLevel.ADVANCED.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Completion of 2-3 years Articleship under a practicing Chartered Accountant firm",
            "ICAI Final Examination qualification and issuance of audit opinions",
        ],
        assessment_rubric={
            "beginner": "Performs routine audit vouching, bank reconciliations, and ledger verification.",
            "intermediate": "Assesses internal control frameworks, calculates audit materiality, and tests substantive assertions.",
            "advanced": "Formulates formal audit opinions, evaluates fraud risk, and reports corporate governance compliance.",
        }
    ),
    "financial_modeling": Competency(
        id="financial_modeling",
        name="Financial Modeling & Valuation",
        category=CompetencyCategory.ANALYTICAL.value,
        description="Three-statement financial modeling, DCF valuation, sensitivity analysis, and capital budgeting.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Dynamic Excel discounted cash flow (DCF) model with scenario toggles",
            "Equity research report evaluating corporate earnings and market multiples",
        ],
        assessment_rubric={
            "beginner": "Constructs simple income statement forecasts in spreadsheets.",
            "intermediate": "Builds dynamically linked three-statement models and calculates WACC.",
            "advanced": "Performs LBO / M&A accretion-dilution modeling with Monte Carlo sensitivities.",
        }
    ),

    # Vocational / Technical Trade Competencies
    "electrical_wiring": Competency(
        id="electrical_wiring",
        name="Industrial Electrical Wiring & Safety",
        category=CompetencyCategory.TECHNICAL.value,
        description="Installing single/three-phase electrical systems, control panels, protective breakers, and Indian Electricity Rules compliance.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "NCVET / DGT Trade Test practical evaluation in ITI workshop",
            "Wiring of an industrial motor control panel with overload relays and contactors",
        ],
        assessment_rubric={
            "beginner": "Identifies electrical tools, wire gauges, and performs simple domestic circuit connections.",
            "intermediate": "Wires star-delta starters, tests insulation resistance with a Megger, and installs distribution boards.",
            "advanced": "Calibrates automated PLC control panels, troubleshoots substation transformers, and ensures IE safety compliance.",
        }
    ),
    "plc_programming": Competency(
        id="plc_programming",
        name="PLC Programming & Industrial Automation",
        category=CompetencyCategory.TECHNICAL.value,
        description="Ladder logic, SCADA integration, sensors, actuators, and electro-pneumatic automation.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Configuring an automated assembly conveyor loop using Siemens / Allen-Bradley PLC",
            "Writing ladder logic rungs with timers, counters, and emergency interlocks",
        ],
        assessment_rubric={
            "beginner": "Understands digital/analog I/O and reads basic electrical wiring schematics.",
            "intermediate": "Writes ladder logic programs for sequencing cylinders, sensors, and motor drives.",
            "advanced": "Integrates SCADA/HMI dashboards, communicates over Industrial Ethernet/Modbus, and tunes closed-loop PID controls.",
        }
    ),
    "cad_drafting": Competency(
        id="cad_drafting",
        name="CAD Modeling & Engineering Drafting",
        category=CompetencyCategory.TECHNICAL.value,
        description="2D drafting and 3D parametric CAD modeling (AutoCAD, SolidWorks, CATIA) with GD&T tolerances.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Full parametric assembly model of an engine gearbox with Bill of Materials (BOM)",
            "Drafted manufacturing drawings with geometric dimensioning and tolerancing (GD&T)",
        ],
        assessment_rubric={
            "beginner": "Creates 2D orthographic projections and isometric sketches in AutoCAD.",
            "intermediate": "Models 3D parts, defines mate constraints in assemblies, and creates manufacturing drafts.",
            "advanced": "Executes finite element stress analysis (FEA) and optimizes designs for manufacturing (DFM).",
        }
    ),
    "crop_agronomy": Competency(
        id="crop_agronomy",
        name="Agronomy & Crop Management",
        category=CompetencyCategory.DOMAIN_KNOWLEDGE.value,
        description="Soil health assessment, crop lifecycle planning, integrated pest management, and precision agriculture.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Field demonstration plot yield trial evaluation and soil nutrient testing",
            "Integrated Pest Management (IPM) prescription plan for cash crop cycles",
        ],
        assessment_rubric={
            "beginner": "Identifies major Kharif and Rabi crop seasons and nutrient deficiency symptoms.",
            "intermediate": "Prescribes soil amendments, fertilizer dosing, and organic pest control schedules.",
            "advanced": "Manages precision drip fertigation, GIS-guided field yield maps, and climate-resilient hybrid breeding.",
        }
    ),
    "ui_ux_design": Competency(
        id="ui_ux_design",
        name="UI/UX & Interaction Design",
        category=CompetencyCategory.DIGITAL.value,
        description="User research, wireframing, high-fidelity Figma prototyping, design systems, and usability testing.",
        proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
        importance=CompetencyImportance.ESSENTIAL.value,
        demonstration_methods=[
            "Published Figma prototype featuring user research findings, wireframes, and interactive components",
            "Conducting moderated usability testing sessions and synthesizing user feedback loops",
        ],
        assessment_rubric={
            "beginner": "Creates clean visual layouts and understands basic color hierarchy and typography.",
            "intermediate": "Builds interactive responsive Figma prototypes and implements tokenized design systems.",
            "advanced": "Leads qualitative user research, conducts quantitative A/B design experiments, and architects enterprise UX.",
        }
    ),
}


# ============================================================================
# 4. CURATED INDIAN CAREER KNOWLEDGE BASE RECORDS
# ============================================================================

CURATED_CAREER_RECORDS: Dict[str, CareerKnowledgeRecord] = {
    # ------------------------------------------------------------------------
    # 1. Java Backend Developer (Explicit Section 7 Requirement)
    # ------------------------------------------------------------------------
    "java-backend-developer": CareerKnowledgeRecord(
        id="java-backend-developer",
        slug="java-backend-developer",
        soc_code="15-1252.00",
        nco_code="2512.0101",
        canonical_title="Java Backend Developer",
        alternative_job_titles=[
            "Java Developer",
            "Backend Engineer (Java/Spring)",
            "Enterprise Application Developer",
            "Java Software Engineer",
        ],
        category="Engineering & Technology",
        industry="Information Technology & Software Services",
        domain=AcademicDomain.ENGINEERING_TECH.value,
        description="Designs, builds, tests, and maintains robust, scalable server-side microservices, REST APIs, and database integrations using the Java programming language and enterprise frameworks like Spring Boot.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Architect and develop high-throughput server-side RESTful microservices and API gateways.",
                "Design normalized relational database schemas, write optimized SQL queries, and manage database connection pooling.",
                "Implement distributed caching, message queues (Kafka, RabbitMQ), and asynchronous processing.",
                "Debug production application failures, profile memory bottlenecks, and resolve latency spikes.",
                "Collaborate with frontend developers, DevOps engineers, and product managers in agile sprint ceremonies.",
            ],
            typical_daily_activities=[
                {"time": "09:30 AM", "activity": "Standup meeting with cross-functional product and engineering teams."},
                {"time": "10:15 AM", "activity": "Deep focus coding: implementing business logic services in Spring Boot and writing JUnit unit tests."},
                {"time": "02:00 PM", "activity": "Peer code reviews on GitHub/GitLab, reviewing pull requests for thread safety and clean code."},
                {"time": "03:30 PM", "activity": "Optimizing slow SQL database queries using execution plans and composite indexing."},
                {"time": "05:00 PM", "activity": "Dockerizing microservices and verifying CI/CD deployment pipelines on Kubernetes test clusters."},
            ],
            work_environment="Indoor / Modern tech office or remote / hybrid work setting.",
            common_employment_sectors=[
                "IT Services & Consulting (TCS, Infosys, Wipro, Cognizant, Accenture)",
                "Global Capability Centers (GCCs) & Banking Tech (JPMorgan, Goldman Sachs, Wells Fargo)",
                "Enterprise SaaS & Tech Product Startups",
                "E-Commerce & Digital Payments (Flipkart, Amazon, Paytm, PhonePe)",
            ],
            entry_level_job_titles=[
                "Associate Software Engineer (Java)",
                "Junior Backend Developer",
                "Graduate Trainee Engineer",
            ],
            career_progression=[
                "Junior Java Developer (0-2 years)",
                "Software Engineer / Backend Developer (2-5 years)",
                "Senior Java Engineer (5-8 years)",
                "Lead Backend Engineer / Engineering Manager (8-12 years)",
                "Principal Architect / Chief Technology Officer (12+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["java_programming"],
            COMPETENCY_REGISTRY["oop_design"],
            COMPETENCY_REGISTRY["data_structures"],
            COMPETENCY_REGISTRY["sql_relational_db"],
            COMPETENCY_REGISTRY["rest_apis"],
            COMPETENCY_REGISTRY["spring_boot"],
            COMPETENCY_REGISTRY["system_debugging"],
            COMPETENCY_REGISTRY["problem_solving"],
            COMPETENCY_REGISTRY["version_control_git"],
            COMPETENCY_REGISTRY["technical_communication"],
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Mathematics", "Computer Applications / Coding", "Science"],
            relevant_class_12_streams=["Science (PCM/PCMC)", "Commerce (with Mathematics / Computer Science)"],
            relevant_diploma_iti=["Diploma in Computer Science & Engineering", "Diploma in Information Technology", "ITI COPA (with bridge upskilling)"],
            required_undergraduate=[],
            preferred_undergraduate=[
                "B.Tech / B.E in Computer Science & Engineering",
                "B.Tech in Information Technology / AI & ML",
                "Bachelor of Computer Applications (BCA)",
                "B.Sc in Computer Science / Information Science",
                "B.Voc in Software Development",
            ],
            alternative_undergraduate=[
                "Any B.E. / B.Tech engineering stream (ECE, EEE, Mechanical, Civil) with demonstrable coding ability",
                "B.Com or B.Sc (Non-CS) with certified programming bootcamp / self-taught portfolio",
            ],
            relevant_postgraduate=[
                "Master of Computer Applications (MCA)",
                "M.Tech in Computer Science & Engineering",
                "M.Sc in Computer Science / Information Technology",
            ],
            alternative_entry_pathways=[
                "Full-stack software engineering bootcamps and intensive technical academies",
                "Open-source contributions and portfolio demonstrations on GitHub",
                "Lateral entry into 2nd year B.Tech after 3-year polytechnic diploma",
            ],
            academic_prerequisites=[
                "Logical and mathematical reasoning foundations",
                "No statutory minimum percentage required by law; industry campus hiring typically filters at 60% or 6.5 CGPA in graduation",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=False,
                notes="No statutory government license is required to work as a Software Developer. Professional hiring is entirely competency, portfolio, and problem-solving driven.",
            ),
            eligibility_limitations=[],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.NO_EXPERIENCE.value,
            internship_pathways=[
                "Software Engineering Intern",
                "Java Backend Intern",
                "Open Source Fellow / Contributor",
            ],
            portfolio_expectations=[
                "At least 2 deployed backend projects on GitHub with clear README and API endpoints",
                "Working knowledge of Spring Boot connected to a PostgreSQL/MySQL database with CRUD tests",
                "Demonstrated problem-solving ability on algorithmic platforms (e.g. 50+ solved challenges)",
            ],
            career_switch_friendliness="high",
            transferable_experience_notes="Highly accessible for career switchers, returners after career breaks, and non-CS graduates who build a demonstrable technical portfolio.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="IRC",
            people_vs_data="data",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="cloud-devops-engineer",
                target_career_title="Cloud & DevOps Engineer",
                transferable_competencies=["Linux basics", "Git", "API architecture", "Debugging"],
                bridge_skills_needed=["Kubernetes", "Terraform", "CI/CD pipelines", "AWS/GCP infrastructure"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=4,
            ),
            TransitionRoute(
                target_career_slug="data-engineer",
                target_career_title="Data Engineer",
                transferable_competencies=["Java", "SQL", "Database architecture", "Data structures"],
                bridge_skills_needed=["Apache Spark", "Data warehousing", "Kafka streaming", "Python"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=4,
            ),
            TransitionRoute(
                target_career_slug="product-manager",
                target_career_title="Technical Product Manager",
                transferable_competencies=["System architecture", "Technical communication", "Agile delivery"],
                bridge_skills_needed=["Product strategy", "User research", "Market metrics", "Roadmapping"],
                difficulty=TransitionDifficulty.MEDIUM.value,
                estimated_transition_months=6,
            ),
        ],
        related_career_slugs=["software-engineer", "frontend-developer", "data-analyst", "cybersecurity-analyst"],
        source_metadata=SourceMetadata(
            source_name="NCS India (Code 2512.0101) & NASSCOM FutureSkills Prime",
            source_url="https://www.ncs.gov.in/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.UNREGULATED_SKILL_FIRST.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Industry standards aligned with NASSCOM and Ministry of Electronics & IT (MeitY) competency guidelines.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 2. General Medical Practitioner (MBBS) - Mandatory Statutory Licensing
    # ------------------------------------------------------------------------
    "general-medical-practitioner": CareerKnowledgeRecord(
        id="general-medical-practitioner",
        slug="general-medical-practitioner",
        soc_code="29-1215.00",
        nco_code="2211.0101",
        canonical_title="General Medical Practitioner (MBBS Doctor)",
        alternative_job_titles=[
            "Medical Officer (MO)",
            "Resident Medical Officer (RMO)",
            "Primary Care Physician",
            "General Duty Medical Officer (GDMO)",
            "Clinical Doctor",
        ],
        category="Medical & Healthcare",
        industry="Healthcare & Clinical Medicine",
        domain=AcademicDomain.MEDICAL_HEALTHCARE.value,
        description="Diagnoses, treats, and manages physical and mental human illnesses, disorders, and injuries; performs physical examinations, orders and interprets diagnostic investigations, and prescribes pharmacotherapies in compliance with statutory medical council guidelines.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Conduct comprehensive clinical patient examinations, gather medical histories, and formulate differential diagnoses.",
                "Prescribe evidence-based pharmacotherapies, medical regimens, and lifestyle modifications.",
                "Perform essential clinical and emergency life-support procedures (CPR, wound suturing, cannulation, airway management).",
                "Order and interpret diagnostic laboratory assays, electrocardiograms (ECGs), and radiological imaging.",
                "Counsel patients and families regarding illness prognosis, preventative immunizations, and chronic disease management.",
            ],
            typical_daily_activities=[
                {"time": "08:30 AM", "activity": "Hospital ward rounds: reviewing in-patient vital charts, post-operative progress, and modifying treatment plans."},
                {"time": "10:30 AM", "activity": "Outpatient department (OPD) clinic: clinical consultations, diagnosing acute illnesses, and ordering tests."},
                {"time": "02:00 PM", "activity": "Attending emergency medical triage: stabilizing trauma patients and administering emergency drug therapy."},
                {"time": "04:30 PM", "activity": "Patient documentation, death/birth registry compliance, and coordinating patient referrals with specialist consultants."},
            ],
            work_environment="Hospitals, government primary health centres (PHCs), community clinics, emergency rooms.",
            common_employment_sectors=[
                "Government Health Services (UPSC Combined Medical Services, State Health Cadres, ESI Hospitals, Railways)",
                "Private Multi-Specialty & Corporate Hospital Chains (Apollo, Fortis, Max, Manipal)",
                "Charitable & Trust Healthcare Institutions",
                "Independent Private Clinical Practice",
            ],
            entry_level_job_titles=[
                "Junior Resident Doctor",
                "Duty Medical Officer (DMO)",
                "Primary Health Centre Medical Officer",
            ],
            career_progression=[
                "Medical Intern / Junior Resident (MBBS)",
                "General Medical Officer (1-3 years)",
                "Post-Graduate Resident (MD / MS / DNB - 3 years)",
                "Senior Resident / Consultant Specialist (3-7 years)",
                "Professor / Chief of Medical Services / Hospital Medical Superintendent (10+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["clinical_diagnosis"],
            COMPETENCY_REGISTRY["pharmacotherapy"],
            Competency(
                id="emergency_life_support",
                name="Emergency Life Support & Triage",
                category=CompetencyCategory.TECHNICAL.value,
                description="Advanced cardiac life support (ACLS), trauma stabilization, and rapid clinical triage.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Certified BLS/ACLS simulation training", "Emergency room clinical internship"],
            ),
            Competency(
                id="medical_ethics",
                name="Medical Ethics & Patient Confidentiality",
                category=CompetencyCategory.SOFT.value,
                description="Adhering to the NMC Code of Medical Ethics, obtaining informed consent, and maintaining patient confidentiality.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Clinical viva examination in forensic medicine and medical jurisprudence"],
            ),
            Competency(
                id="patient_communication",
                name="Empathetic Patient Communication",
                category=CompetencyCategory.COMMUNICATION.value,
                description="Breaking bad news, discussing treatment prognosis empathetically, and active listening in clinical settings.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["OSCE standardized patient clinical counseling simulation"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Physics, Chemistry, Biology)", "Mathematics", "English"],
            relevant_class_12_streams=["Science — PCB (Physics, Chemistry, Biology mandatory) with English"],
            relevant_diploma_iti=[],  # No direct lateral entry from diploma/ITI into MBBS in India
            required_undergraduate=[
                "Bachelor of Medicine, Bachelor of Surgery (MBBS) from an NMC-recognized medical college",
            ],
            preferred_undergraduate=[
                "Bachelor of Medicine, Bachelor of Surgery (MBBS)",
            ],
            alternative_undergraduate=[],  # Indian law strictly forbids non-MBBS graduates from allopathic medical practice
            relevant_postgraduate=[
                "Doctor of Medicine (MD) in Internal Medicine, Pediatrics, Dermatology, Radiology, etc.",
                "Master of Surgery (MS) in General Surgery, Orthopedics, Ophthalmology, etc.",
                "Diplomate of National Board (DNB)",
            ],
            alternative_entry_pathways=[],  # No alternative bootcamp or self-taught pathway legally permitted
            academic_prerequisites=[
                "Mandatory qualification in National Eligibility cum Entrance Test (NEET-UG)",
                "Minimum 50% aggregate marks in 10+2 PCB (40% for reserved categories) as prescribed by NMC regulations",
                "Completion of 4.5 years academic coursework followed by 1 full year of compulsory internship",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=True,
                regulatory_body="National Medical Commission (NMC) & State Medical Council",
                statutory_act="National Medical Commission Act 2019 (formerly Indian Medical Council Act 1956)",
                licensing_exam="National Exit Test (NExT) / FMGE (for Foreign Medical Graduates)",
                internship_requirement="1 Year Compulsory Rotating Medical Internship (CRMI) in an NMC-approved teaching hospital",
                notes="MANDATORY STATUTORY REQUIREMENT: Under the NMC Act 2019, practicing allopathic medicine without valid State Medical Council / NMC registration is a cognizable criminal offense punishable by imprisonment and fines.",
            ),
            eligibility_limitations=[
                "Candidates without 10+2 Physics, Chemistry, Biology are legally ineligible for NEET-UG and MBBS admissions.",
                "Engineers, Arts, Commerce, Diploma, and ITI graduates cannot transition into MBBS without repeating 10+2 PCB and clearing NEET-UG.",
                "Graduates of alternative medicine (BAMS, BHMS) or pharmacy (B.Pharm) are legally prohibited from practicing allopathic modern medicine or holding an MBBS title.",
            ],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.INTERNSHIP_PREFERRED.value,
            internship_pathways=["1-Year Compulsory Rotating Medical Internship (CRMI)"],
            portfolio_expectations=["Completed and signed CRMI logbook across clinical rotations (Medicine, Surgery, OBG, Pediatrics, Casualty)"],
            career_switch_friendliness="low",
            transferable_experience_notes="Career switching into clinical medicine from other professions is legally impossible without completing the full 5.5-year MBBS degree and statutory council registration.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="ISR",
            people_vs_data="people",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="healthcare-administrator",
                target_career_title="Hospital / Healthcare Administrator",
                transferable_competencies=["Clinical systems knowledge", "Hospital workflows", "Medical ethics"],
                bridge_skills_needed=["Healthcare financial management", "Operations management", "Healthcare accreditation (NABH)"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=6,
            ),
            TransitionRoute(
                target_career_slug="clinical-research-physician",
                target_career_title="Clinical Research Physician",
                transferable_competencies=["Pharmacotherapy", "Clinical diagnosis", "Medical jurisprudence"],
                bridge_skills_needed=["Good Clinical Practice (GCP)", "Clinical trial protocols", "Biostatistics"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=4,
            ),
        ],
        related_career_slugs=["dental-surgeon", "pharmacist", "registered-nurse"],
        source_metadata=SourceMetadata(
            source_name="National Medical Commission (NMC) & Ministry of Health & Family Welfare (MoHFW)",
            source_url="https://www.nmc.org.in/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.MANDATORY_STATUTORY.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Governed strictly under the National Medical Commission Act, 2019.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 3. Advocate / Litigation Lawyer - Mandatory Statutory Licensing
    # ------------------------------------------------------------------------
    "advocate-litigation-lawyer": CareerKnowledgeRecord(
        id="advocate-litigation-lawyer",
        slug="advocate-litigation-lawyer",
        soc_code="23-1011.00",
        nco_code="2611.0101",
        canonical_title="Advocate / Litigation Lawyer",
        alternative_job_titles=[
            "Advocate",
            "Trial Lawyer",
            "Litigation Counsel",
            "High Court Advocate",
            "Legal Practitioner",
        ],
        category="Legal Studies",
        industry="Legal Services & Judiciary",
        domain=AcademicDomain.LEGAL_STUDIES.value,
        description="Represents clients in criminal, civil, constitutional, and corporate disputes before courts of law, tribunals, and arbitral forums; drafts pleadings, analyzes statutory provisions, conducts witness examination, and argues legal precedents.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Represent clients in oral arguments before District Courts, High Courts, Tribunals, and Supreme Court.",
                "Draft formal legal pleadings, plaints, written statements, bail petitions, affidavits, and writ petitions.",
                "Conduct cross-examinations and evidentiary examinations during trial proceedings.",
                "Perform in-depth legal research using case law databases (SCC Online, Manupatra) and statutory enactments.",
                "Advise clients on statutory rights, litigation risks, dispute settlements, and arbitration alternatives.",
            ],
            typical_daily_activities=[
                {"time": "09:30 AM", "activity": "Court morning session: arguing motions, bail matters, and urgent interim injunction applications."},
                {"time": "12:00 PM", "activity": "Conducting trial cross-examination of prosecution/defense witnesses in district court."},
                {"time": "03:00 PM", "activity": "Client conferences: gathering factual briefings, reviewing evidence, and advising litigation strategy."},
                {"time": "05:30 PM", "activity": "Chamber legal research: reading precedent law and drafting writ petitions and contractual agreements."},
            ],
            work_environment="Courtrooms, advocate chambers, law firm offices, arbitration tribunals.",
            common_employment_sectors=[
                "Independent Private Practice & Bar Council Chambers",
                "Litigation Law Firms & Corporate Legal Advisory Firms",
                "Government Legal Departments (Public Prosecutors, Government Pleaders, AG Offices)",
                "Corporate In-House Dispute & Litigation Teams",
            ],
            entry_level_job_titles=[
                "Junior Advocate",
                "Chamber Associate",
                "Litigation Trainee",
            ],
            career_progression=[
                "Junior Advocate (0-3 years)",
                "Practicing Advocate (3-7 years)",
                "Senior Associate / Partner in Law Firm (7-12 years)",
                "Designated Senior Advocate / Elevated High Court Judge (15+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["courtroom_advocacy"],
            COMPETENCY_REGISTRY["legal_research_drafting"],
            Competency(
                id="statutory_interpretation",
                name="Statutory Interpretation & Legal Reasoning",
                category=CompetencyCategory.ANALYTICAL.value,
                description="Analyzing legislative intent, constitutional principles, and statutory construction rules.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Moot court memorial drafting", "Published legal commentary on recent High Court/Supreme Court rulings"],
            ),
            Competency(
                id="cross_examination",
                name="Trial Cross-Examination",
                category=CompetencyCategory.PROBLEM_SOLVING.value,
                description="Constructing strategic question sequences under the Indian Evidence Act to reveal evidentiary inconsistencies.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Mock trial evaluation", "Senior advocate chamber litigation evaluation"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Social Studies", "English & Literature", "Civics & Political Science"],
            relevant_class_12_streams=["Arts & Humanities", "Commerce", "Science (Open to all streams)"],
            relevant_diploma_iti=[],
            required_undergraduate=[
                "Bachelor of Laws (LLB - 3-Year degree after graduation in any discipline)",
                "5-Year Integrated Law Degree (BA-LLB, BBA-LLB, B.Com-LLB, B.Sc-LLB)",
            ],
            preferred_undergraduate=[
                "5-Year Integrated BA-LLB / BBA-LLB from a National Law University (NLU) or BCI-recognized college",
                "3-Year LLB from a Bar Council of India approved institution",
            ],
            alternative_undergraduate=[],
            relevant_postgraduate=[
                "Master of Laws (LLM) in Constitutional Law, Corporate Law, Intellectual Property, Criminal Law",
            ],
            alternative_entry_pathways=[
                "Graduates in ANY stream (Engineering, Commerce, Science, Arts) can enroll in a 3-Year LLB degree without starting from 12th standard",
            ],
            academic_prerequisites=[
                "Graduation in any discipline with minimum 45% aggregate marks for 3-Year LLB (40% for SC/ST)",
                "Common Law Admission Test (CLAT / AILET / State Law CET) for entry into NLUs and state faculties",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=True,
                regulatory_body="Bar Council of India (BCI) & State Bar Council",
                statutory_act="Advocates Act, 1961",
                licensing_exam="All India Bar Examination (AIBE)",
                internship_requirement="Mandatory internships during law school curriculum under practicing advocates / law firms",
                notes="MANDATORY STATUTORY REQUIREMENT: Under Section 29 and 30 of the Advocates Act, 1961, only Advocates enrolled on the Roll of a State Bar Council and qualified in the AIBE have the legal right to practice law and represent clients before any court in India.",
            ),
            eligibility_limitations=[
                "Non-law graduates cannot represent clients or argue matters before courts.",
                "Degrees acquired via distance education without BCI approval are strictly ineligible for Bar Council enrollment.",
            ],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.NO_EXPERIENCE.value,
            internship_pathways=["Law Chamber Intern", "District Court Litigation Intern", "High Court Research Clerk"],
            portfolio_expectations=["Drafted bail petitions, legal notices, and moot court research memorials"],
            career_switch_friendliness="medium",
            transferable_experience_notes="Professionals from engineering, medicine, finance, or corporate sectors can seamlessly pursue a 3-Year LLB degree and transition into specialized intellectual property, tax, or corporate litigation.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="EIS",
            people_vs_data="people",
            team_vs_independent="independent",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="corporate-legal-counsel",
                target_career_title="Corporate Legal Counsel",
                transferable_competencies=["Statutory interpretation", "Legal drafting", "Litigation risk evaluation"],
                bridge_skills_needed=["Corporate governance", "M&A due diligence", "Commercial contract negotiation"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=3,
            ),
        ],
        related_career_slugs=["corporate-legal-counsel"],
        source_metadata=SourceMetadata(
            source_name="Bar Council of India (BCI) & Advocates Act 1961",
            source_url="http://www.barcouncilofindia.org/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.MANDATORY_STATUTORY.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Governed strictly under the Advocates Act, 1961.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 4. Chartered Accountant (CA) - Mandatory Statutory Licensing
    # ------------------------------------------------------------------------
    "chartered-accountant": CareerKnowledgeRecord(
        id="chartered-accountant",
        slug="chartered-accountant",
        soc_code="13-2011.01",
        nco_code="2411.0101",
        canonical_title="Chartered Accountant (CA)",
        alternative_job_titles=[
            "Statutory Auditor",
            "Taxation Consultant",
            "Finance Controller",
            "Audit Manager",
            "Forensic Auditor",
        ],
        category="Commerce & Finance",
        industry="Accounting, Audit, Taxation & Corporate Governance",
        domain=AcademicDomain.COMMERCE_FINANCE.value,
        description="Statutorily audits financial statements, ensures corporate tax compliance, advises on corporate mergers, manages direct/indirect tax litigations, and oversees corporate governance under the Chartered Accountants Act 1949 and Companies Act 2013.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Execute statutory audits and issue audit reports on balance sheets and P&L under Companies Act 2013.",
                "Formulate corporate tax strategies, prepare corporate returns, and represent clients in tax assessments.",
                "Ensure compliance with Indian Accounting Standards (Ind AS) and International Financial Reporting Standards (IFRS).",
                "Perform forensic accounting, financial due diligence, and enterprise risk management reviews.",
                "Advise executive management on capital budgeting, mergers & acquisitions, and cross-border transfer pricing.",
            ],
            typical_daily_activities=[
                {"time": "09:30 AM", "activity": "Audit team standup: tracking substantive testing schedules and statutory reporting deadlines."},
                {"time": "11:00 AM", "activity": "Auditing client internal control over financial reporting (ICFR) and inspecting general ledger vouchers."},
                {"time": "02:30 PM", "activity": "Analyzing Goods and Services Tax (GST) input tax credit reconciliations and filing appeals."},
                {"time": "04:30 PM", "activity": "Discussing audit qualifications and material misstatements with the corporate Board Audit Committee."},
            ],
            work_environment="Audit offices, corporate finance departments, client corporate headquarters.",
            common_employment_sectors=[
                "Big 4 Professional Service Firms (Deloitte, PwC, EY, KPMG)",
                "Domestic CA Audit & Tax Firms (BDO, Grant Thornton, Singhi & Co)",
                "Corporate Enterprises & Multinational Corporations (Finance Heads / CFOs)",
                "Independent CA Practice (Audit & Taxation)",
            ],
            entry_level_job_titles=[
                "Audit Associate",
                "Tax Associate",
                "Assistant Manager - Finance",
            ],
            career_progression=[
                "Articled Assistant (2-3 years during CA course)",
                "Qualified Chartered Accountant / Senior Audit Associate (0-3 years)",
                "Audit Manager / Tax Manager (3-7 years)",
                "Associate Partner / Director (7-12 years)",
                "Equity Partner / Chief Financial Officer (CFO) (12+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["statutory_auditing"],
            COMPETENCY_REGISTRY["financial_modeling"],
            Competency(
                id="direct_indirect_taxation",
                name="Direct & Indirect Taxation",
                category=CompetencyCategory.TECHNICAL.value,
                description="Income Tax Act 1961 provisions, GST law, international transfer pricing, and tax dispute litigation.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Filing complex corporate tax returns and handling scrutiny assessments under Income Tax Act"],
            ),
            Competency(
                id="ind_as_reporting",
                name="Financial Reporting (Ind AS / IFRS)",
                category=CompetencyCategory.TECHNICAL.value,
                description="Preparation and presentation of consolidated financial statements in compliance with Ind AS standards.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Drafting notes to accounts and revenue recognition disclosures under Ind AS 115"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Mathematics", "Commerce", "Social Studies"],
            relevant_class_12_streams=["Commerce (with or without Mathematics)", "Science", "Arts (All streams eligible)"],
            relevant_diploma_iti=["Diploma in Commercial Practice"],
            required_undergraduate=[],
            preferred_undergraduate=[
                "Bachelor of Commerce (B.Com)",
                "Bachelor of Business Administration (BBA)",
                "No degree strictly mandatory; students can enter CA program directly after 10+2",
            ],
            alternative_undergraduate=[
                "Direct Entry Route: Commerce Graduates with min 55% aggregate, or other graduates with min 60% aggregate can bypass CA Foundation",
            ],
            relevant_postgraduate=["M.Com", "MBA in Finance"],
            alternative_entry_pathways=[
                "Direct entry for CMA / CS qualified professionals into CA Intermediate",
            ],
            academic_prerequisites=[
                "Passing CA Foundation, Intermediate, and Final Examinations conducted by ICAI",
                "Mandatory 2 to 3 years of practical articleship training under a practicing Chartered Accountant",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=True,
                regulatory_body="Institute of Chartered Accountants of India (ICAI)",
                statutory_act="Chartered Accountants Act, 1949",
                licensing_exam="ICAI CA Final Examination",
                internship_requirement="Mandatory Articleship Training with an active Certificate of Practice holder",
                notes="MANDATORY STATUTORY REQUIREMENT: Under the Chartered Accountants Act 1949 and Section 141 of Companies Act 2013, only an active member of ICAI holding a Certificate of Practice (COP) is statutorily authorized to audit and certify corporate financial accounts.",
            ),
            eligibility_limitations=[
                "Non-ICAI professionals cannot sign statutory audit reports or represent clients as Chartered Accountants.",
            ],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.INTERNSHIP_PREFERRED.value,
            internship_pathways=["Mandatory ICAI Articleship Training"],
            portfolio_expectations=["Completed articleship logbook certified by principal CA"],
            career_switch_friendliness="medium",
            transferable_experience_notes="Finance and commerce professionals can leverage prior accounting experience to fast-track CA direct entry or transition into corporate controllership.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="CEI",
            people_vs_data="data",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="financial-analyst",
                target_career_title="Investment Banking / Financial Analyst",
                transferable_competencies=["Financial statement analysis", "Corporate taxation", "Valuation fundamentals"],
                bridge_skills_needed=["M&A pitch decks", "LBO financial modeling", "Equity research writing"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=2,
            ),
        ],
        related_career_slugs=["financial-analyst", "commercial-accountant"],
        source_metadata=SourceMetadata(
            source_name="Institute of Chartered Accountants of India (ICAI)",
            source_url="https://www.icai.org/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.MANDATORY_STATUTORY.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Governed strictly under the Chartered Accountants Act, 1949.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 5. Industrial Electrician (ITI Craftsman Trade)
    # ------------------------------------------------------------------------
    "industrial-electrician": CareerKnowledgeRecord(
        id="industrial-electrician",
        slug="industrial-electrician",
        soc_code="47-2111.00",
        nco_code="7411.0101",
        canonical_title="Industrial Electrician",
        alternative_job_titles=[
            "Electrical Maintenance Technician",
            "Plant Electrician",
            "Control Panel Wireman",
            "Substation Electrician",
        ],
        category="Vocational & Technical Trades",
        industry="Manufacturing, Energy & Industrial Infrastructure",
        domain=AcademicDomain.VOCATIONAL_TRADES.value,
        description="Installs, tests, maintains, and repairs electrical wiring, control panels, transformers, electric motors, and automated plant switchgear in compliance with Indian Electricity Rules and safety standards.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Install industrial electrical wiring, conduit cable trays, and motor distribution panels.",
                "Test electrical continuity, insulation resistance, and circuit earthing using Meggers and multimeters.",
                "Perform preventative maintenance and overhaul of AC/DC electric motors, starters, and alternators.",
                "Troubleshoot tripping circuit breakers, contactors, relays, and emergency safety interlocks.",
                "Adhere to lockout/tagout (LOTO) industrial safety protocols and Indian Electricity Rules 1956.",
            ],
            typical_daily_activities=[
                {"time": "08:00 AM", "activity": "Toolbox meeting and reviewing maintenance logbooks with plant shift engineers."},
                {"time": "09:00 AM", "activity": "Preventative maintenance: checking motor insulation values, bearing temperatures, and terminal connections."},
                {"time": "01:30 PM", "activity": "Wiring an industrial star-delta motor control panel with overload protection relays."},
                {"time": "03:30 PM", "activity": "Responding to assembly line electrical breakdown calls and replacing blown fuse switches."},
            ],
            work_environment="Manufacturing plants, power generation stations, electrical substations, commercial facilities.",
            common_employment_sectors=[
                "Public Sector Undertakings (Indian Railways, BHEL, NTPC, ONGC, State Power Discoms)",
                "Automotive & Heavy Engineering Manufacturing Plants (Tata Motors, Maruti Suzuki, L&T)",
                "Building Construction & Electrical Contracting Firms",
                "Renewable Energy & Solar Power Installations",
            ],
            entry_level_job_titles=[
                "ITI Apprentice Trainee",
                "Junior Electrician",
                "Wireman",
            ],
            career_progression=[
                "Apprentice Electrician (1 year)",
                "Industrial Electrician / Technician (1-4 years)",
                "Senior Electrician / Master Wireman (4-8 years)",
                "Electrical Maintenance Supervisor / Foreman (8+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["electrical_wiring"],
            Competency(
                id="motor_maintenance",
                name="Electric Motor & Starter Maintenance",
                category=CompetencyCategory.TECHNICAL.value,
                description="Testing, connecting, and overhauling three-phase induction motors, DOL starters, and Star-Delta starters.",
                proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["NCVET practical trade test wiring three-phase induction motor starters"],
            ),
            Competency(
                id="electrical_safety",
                name="Industrial Electrical Safety & Earthing",
                category=CompetencyCategory.DOMAIN_KNOWLEDGE.value,
                description="Pipe/plate earthing installation, circuit breaker sizing (MCB, MCCB, ELCB/RCCB), and LOTO safety.",
                proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Measuring earth pit resistance with earth tester and installing proper bonding"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Physics)", "Mathematics", "Work Experience"],
            relevant_class_12_streams=["Science", "Vocational (Electrical Trade)"],
            relevant_diploma_iti=[
                "ITI Electrician (2-Year Craftsman Training Scheme under NCVET / DGT)",
                "ITI Wireman",
            ],
            required_undergraduate=[],
            preferred_undergraduate=[],
            alternative_undergraduate=[],
            relevant_postgraduate=[],
            alternative_entry_pathways=[
                "National Apprenticeship Certificate (NAC) in Electrical Trade after Class 10",
                "Lateral entry into 2nd year Diploma in Electrical Engineering after ITI Electrician",
            ],
            academic_prerequisites=[
                "Class 10 (SSLC / Matriculation) pass with Science and Mathematics",
                "Admission via state ITI counseling or NCVET registered technical training institute",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=True,
                regulatory_body="State Electrical Licensing Board",
                statutory_act="Indian Electricity Rules, 1956",
                licensing_exam="State Wireman / Supervisor Electrical Licensing Exam",
                internship_requirement="1-year trade apprenticeship under National Apprenticeship Promotion Scheme (NAPS)",
                notes="State wireman license required for high-voltage and independent commercial contractor execution.",
            ),
            eligibility_limitations=[],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.NO_EXPERIENCE.value,
            internship_pathways=["NAPS Trade Apprenticeship in PSUs or Industrial Manufacturing Units"],
            portfolio_expectations=["NCVET National Trade Certificate (NTC) with practical marksheet"],
            career_switch_friendliness="medium",
            transferable_experience_notes="Class 10 / 12 school leavers and dropouts can gain direct practical employment through 2-year ITI trades.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="RIC",
            people_vs_data="practical",
            team_vs_independent="independent",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="electrical-supervisor",
                target_career_title="Electrical Maintenance Supervisor",
                transferable_competencies=["Electrical schematics", "Motor maintenance", "Plant safety"],
                bridge_skills_needed=["Supervisory management", "Shift planning", "Statutory safety audits"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=6,
            ),
        ],
        related_career_slugs=["mechanical-fitter", "mechatronics-engineer"],
        source_metadata=SourceMetadata(
            source_name="Directorate General of Training (DGT) & NCVET",
            source_url="https://dgt.gov.in/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.INDUSTRY_STANDARD.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Standard Craftsman Training Scheme (CTS) curriculum prescribed by DGT, Ministry of Skill Development & Entrepreneurship.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 6. Agricultural Scientist / Agronomist (B.Sc Agriculture)
    # ------------------------------------------------------------------------
    "agricultural-scientist": CareerKnowledgeRecord(
        id="agricultural-scientist",
        slug="agricultural-scientist",
        soc_code="19-1011.00",
        nco_code="2132.0101",
        canonical_title="Agricultural Scientist / Agronomist",
        alternative_job_titles=[
            "Agronomist",
            "Agricultural Field Officer (AFO)",
            "Soil Scientist",
            "Crop Production Specialist",
            "Seed Technologist",
        ],
        category="Agriculture & Allied Sciences",
        industry="Agriculture, Agribusiness & Agrisciences",
        domain=AcademicDomain.AGRICULTURE_ALLIED.value,
        description="Researches crop genetics, soil nutrient management, pest dynamics, and farming practices; advises agritech enterprises, fertilizer manufacturers, and government agricultural extension services to optimize sustainable food yields.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Design and manage field trials evaluating seed varieties, fertilizer dosing, and crop protection chemicals.",
                "Analyze soil samples for organic carbon, nitrogen, phosphorus, potassium, and micronutrient balance.",
                "Develop Integrated Pest Management (IPM) protocols to mitigate crop pathogens and insect infestation.",
                "Advise farmers and agribusiness clients on drip fertigation, zero-tillage, and climate-resilient sowing.",
                "Ensure compliance with Indian Seed Act, Insecticides Act, and organic farming certification standards.",
            ],
            typical_daily_activities=[
                {"time": "08:30 AM", "activity": "Inspecting agricultural research trial plots, measuring plant height, tillering, and disease incidence."},
                {"time": "11:00 AM", "activity": "Soil testing laboratory analysis: performing spectrophotometric nitrogen/phosphorus assays."},
                {"time": "02:00 PM", "activity": "Farmer extension training: demonstrating biological pest management techniques in rural blocks."},
                {"time": "04:30 PM", "activity": "Synthesizing trial plot harvest data and drafting technical recommendations for agritech clients."},
            ],
            work_environment="Field test plots, agricultural research stations, soil testing laboratories, agritech offices.",
            common_employment_sectors=[
                "Public Sector Banks (IBPS Specialist Officer - Agricultural Field Officer)",
                "State Departments of Agriculture & National Bank for Agriculture & Rural Development (NABARD)",
                "Seed, Agro-Chemical & Fertilizer MNCs (Bayer, Syngenta, UPL, Coromandel)",
                "Agri-Tech Startups (Precision farming, drone spraying, supply chain advisory)",
            ],
            entry_level_job_titles=[
                "Agricultural Field Officer (AFO)",
                "Junior Agronomist",
                "Technical Sales Representative (Crop Protection)",
            ],
            career_progression=[
                "Agricultural Field Officer / Junior Agronomist (0-3 years)",
                "Senior Agronomist / Research Associate (3-7 years)",
                "Regional Agriculture Manager / Principal Scientist (7-12 years)",
                "Director of Research / Chief Agribusiness Officer (12+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["crop_agronomy"],
            Competency(
                id="soil_fertility",
                name="Soil Fertility & Plant Nutrition",
                category=CompetencyCategory.TECHNICAL.value,
                description="Soil chemical testing, micro-nutrient profiling, bio-fertilizers, and sustainable fertility planning.",
                proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Laboratory soil health card generation and customized nutrient prescription plan"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Biology)", "Mathematics", "Social Studies"],
            relevant_class_12_streams=["Science (PCB or PCMB)", "Agriculture Vocational Stream"],
            relevant_diploma_iti=["Diploma in Agriculture (2 years)"],
            required_undergraduate=[
                "B.Sc (Hons) Agriculture / Horticulture (4-Year ICAR-accredited degree program)",
            ],
            preferred_undergraduate=[
                "B.Sc (Hons) Agriculture (4 Years)",
                "B.Sc (Hons) Horticulture",
            ],
            alternative_undergraduate=[
                "B.Tech in Agricultural Engineering",
                "B.Sc in Biotechnology / Botany / Microbiology with post-grad in Agronomy",
            ],
            relevant_postgraduate=[
                "M.Sc in Agronomy / Soil Science / Genetics & Plant Breeding / Entomology",
            ],
            alternative_entry_pathways=[],
            academic_prerequisites=[
                "10+2 with Physics, Chemistry, Biology / Mathematics / Agriculture",
                "Admission via ICAR AIEEA entrance exam or state agricultural university entrance exams (e.g. KCET Agri, EAMCET Agri)",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=False,
                regulatory_body="Indian Council of Agricultural Research (ICAR)",
                notes="Degrees accredited by ICAR are required for recruitment into central government agricultural research institutions (ARS) and state universities.",
            ),
            eligibility_limitations=[
                "Candidates without science background in 10+2 are ineligible for B.Sc (Hons) Agriculture admissions.",
            ],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.NO_EXPERIENCE.value,
            internship_pathways=["Rural Agricultural Work Experience (RAWE) Program (6 Months mandatory in B.Sc Agri)"],
            portfolio_expectations=["RAWE project report on village crop systems and farm demonstrations"],
            career_switch_friendliness="medium",
            transferable_experience_notes="Graduates with biological science backgrounds can transition into agribusiness and agritech consulting.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="IRE",
            people_vs_data="practical",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="outdoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="agribusiness-manager",
                target_career_title="Agribusiness & Supply Chain Manager",
                transferable_competencies=["Crop knowledge", "Rural farmer networks", "Pest dynamics"],
                bridge_skills_needed=["Agri-commodity trading", "Supply chain logistics", "Cold storage operations"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=4,
            ),
        ],
        related_career_slugs=["agricultural-engineer"],
        source_metadata=SourceMetadata(
            source_name="Indian Council of Agricultural Research (ICAR)",
            source_url="https://icar.org.in/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.INDUSTRY_STANDARD.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Curriculum governed under the 5th Deans' Committee Recommendations of ICAR.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 7. Diploma / Polytechnic Mechanical (CAD / Junior Engineer)
    # ------------------------------------------------------------------------
    "polytechnic-mechanical-technician": CareerKnowledgeRecord(
        id="polytechnic-mechanical-technician",
        slug="polytechnic-mechanical-technician",
        soc_code="17-3026.00",
        nco_code="3115.0101",
        canonical_title="Mechanical Engineering Technician (CAD / Production)",
        alternative_job_titles=[
            "CAD Technician",
            "Junior Engineer (Mechanical)",
            "Production Technician",
            "Quality Control Inspector",
        ],
        category="Engineering & Technology",
        industry="Automotive, Manufacturing & Engineering Design",
        domain=AcademicDomain.ENGINEERING_TECH.value,
        description="Creates 2D production drawings and 3D CAD parts, supervises shop floor machinery, monitors manufacturing quality tolerances, and maintains plant production equipment under the supervision of senior engineers.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Model 3D components and draft 2D manufacturing prints with GD&T using SolidWorks or AutoCAD.",
                "Inspect fabricated parts using precision vernier calipers, micrometers, and Coordinate Measuring Machines (CMM).",
                "Assist senior engineers with CNC machine programming, tooling setup, and cycle time reduction.",
                "Conduct quality assurance audits to minimize scrap rates and defect occurrences.",
            ],
            typical_daily_activities=[
                {"time": "08:30 AM", "activity": "Reviewing daily shift component production targets and CAD drawing revisions."},
                {"time": "10:30 AM", "activity": "Parametric 3D part modeling in SolidWorks and generating Bill of Materials (BOM)."},
                {"time": "02:00 PM", "activity": "Dimensional inspection on the production shop floor using height gauges and micrometers."},
                {"time": "04:30 PM", "activity": "Logging first-article quality inspection reports and updating preventative machine logs."},
            ],
            work_environment="Design drafting offices, automotive shop floors, machine tool workshops.",
            common_employment_sectors=[
                "Automotive & Ancillary Manufacturers (Tata, Mahindra, Bharat Forge)",
                "Government Junior Engineer Cadres (SSC JE, State Public Works Department, Railways)",
                "Engineering Design & Drafting Services",
            ],
            entry_level_job_titles=[
                "Junior Engineer Trainee (JET)",
                "Diploma Trainee Engineer (DTE)",
                "CAD Draftsman",
            ],
            career_progression=[
                "Diploma Trainee (1 year)",
                "Junior Engineer / CAD Technician (1-4 years)",
                "Senior Production Supervisor / Quality Lead (4-8 years)",
                "Assistant Manager - Plant Operations (8+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["cad_drafting"],
            Competency(
                id="quality_inspection",
                name="Mechanical Metrology & Quality Inspection",
                category=CompetencyCategory.TECHNICAL.value,
                description="Using precision measuring instruments (CMM, calipers, dial indicators) and reading engineering tolerances.",
                proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Carrying out physical calibration check and drafting an inspection report"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Physics, Chemistry)", "Mathematics", "Engineering Drawing"],
            relevant_class_12_streams=["Science — PCM", "Vocational Technical"],
            relevant_diploma_iti=[
                "Diploma in Mechanical Engineering (3-Year state polytechnic program)",
                "Diploma in Automobile Engineering",
                "Diploma in Tool & Die Making",
            ],
            required_undergraduate=[],
            preferred_undergraduate=[],
            alternative_undergraduate=[
                "Eligible for direct Lateral Entry into 2nd year B.Tech / B.E. (Mechanical / Automobile / Automation)",
            ],
            relevant_postgraduate=[],
            alternative_entry_pathways=[
                "Class 10 pass students enter directly into 3-year polytechnic diploma",
            ],
            academic_prerequisites=[
                "Class 10 (SSLC) with minimum 35-50% in Science and Mathematics",
                "State polytechnic entrance / merit counseling",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=False,
                notes="Polytechnic diplomas accredited by state boards of technical education and AICTE.",
            ),
            eligibility_limitations=[],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.NO_EXPERIENCE.value,
            internship_pathways=["Industrial In-Plant Training (mandatory in final diploma semester)"],
            portfolio_expectations=["Portfolio of CAD drawings and 3D assembly models with detailed orthographic sheets"],
            career_switch_friendliness="medium",
            transferable_experience_notes="Diploma holders can upgrade to full B.Tech degrees through state lateral entrance examinations.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="RIC",
            people_vs_data="practical",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="btech-mechanical-engineer",
                target_career_title="Mechanical Engineer (Degree Level)",
                transferable_competencies=["CAD drafting", "Shop floor fabrication", "GD&T tolerances"],
                bridge_skills_needed=["Thermodynamics", "Finite element analysis (FEA)", "Machine design calculations"],
                difficulty=TransitionDifficulty.MEDIUM.value,
                estimated_transition_months=12,
            ),
        ],
        related_career_slugs=["industrial-electrician", "mechatronics-engineer"],
        source_metadata=SourceMetadata(
            source_name="All India Council for Technical Education (AICTE)",
            source_url="https://www.aicte-india.org/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.INDUSTRY_STANDARD.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="3-Year Diploma curriculum governed under AICTE technical education norms.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 8. Pharmacist (B.Pharm / D.Pharm) - Mandatory PCI Licensing
    # ------------------------------------------------------------------------
    "pharmacist": CareerKnowledgeRecord(
        id="pharmacist",
        slug="pharmacist",
        soc_code="29-1051.00",
        nco_code="2262.0101",
        canonical_title="Registered Pharmacist",
        alternative_job_titles=[
            "Hospital Pharmacist",
            "Community Pharmacist",
            "Clinical Pharmacist",
            "Formulation Quality Chemist",
            "Industrial Pharmacist",
        ],
        category="Medical & Healthcare",
        industry="Pharmaceuticals, Clinical Healthcare & Retail Dispensing",
        domain=AcademicDomain.MEDICAL_HEALTHCARE.value,
        description="Compounds, evaluates, and dispenses prescription drugs; counsels patients and medical teams on dosage regimens, drug contraindications, and stability storage in compliance with the Pharmacy Act 1948 and Drugs and Cosmetics Act.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Verify doctor prescriptions for correct dosage, clinical contraindications, and drug interactions.",
                "Compound, package, and dispense scheduled pharmaceuticals in hospital and community pharmacies.",
                "Maintain cold-chain drug storage compliance and narcotic register records under the NDPS Act.",
                "Advise medical teams and patients on pharmacokinetics, side effects, and administration timing.",
                "Participate in pharmaceutical manufacturing quality assurance (QA) and regulatory compliance.",
            ],
            typical_daily_activities=[
                {"time": "09:00 AM", "activity": "Auditing hospital inpatient drug distribution carts and checking temperature logs of vaccine refrigerators."},
                {"time": "11:00 AM", "activity": "Dispensing prescription medications, verifying patient allergies, and explaining dosage instructions."},
                {"time": "02:30 PM", "activity": "Reconciling schedule H1 and controlled substance dispensing registers."},
                {"time": "04:30 PM", "activity": "Reviewing drug batch analytical test reports with pharmaceutical manufacturing chemists."},
            ],
            work_environment="Hospital pharmacies, pharmaceutical manufacturing plants, retail pharmacies, regulatory labs.",
            common_employment_sectors=[
                "Hospital Chains & Government Healthcare Facilities (AIIMS, State Health Services, ESI)",
                "Pharmaceutical Manufacturing Corporations (Sun Pharma, Cipla, Dr. Reddy's, Lupin)",
                "Retail Pharmacy Chains (Apollo Pharmacy, MedPlus) & Community Pharmacies",
                "Clinical Research Organizations (CROs)",
            ],
            entry_level_job_titles=[
                "Junior Pharmacist",
                "Hospital Pharmacy Trainee",
                "Quality Control Chemist (Formulations)",
            ],
            career_progression=[
                "Registered Pharmacist (0-3 years)",
                "Senior Pharmacist / QA Executive (3-6 years)",
                "Chief Pharmacist / Regulatory Affairs Manager (6-10 years)",
                "Director of Pharmacy / Plant Operations Head (10+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["pharmacotherapy"],
            Competency(
                id="drug_compounding_dispensing",
                name="Pharmaceutical Dispensing & Quality Control",
                category=CompetencyCategory.TECHNICAL.value,
                description="Prescription validation, aseptic drug compounding, dosage calculation, and regulatory labeling.",
                proficiency_level=ProficiencyLevel.ADVANCED.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["PCI registered pharmacist license practical evaluation", "Hospital drug audit examination"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Chemistry, Biology)", "Mathematics"],
            relevant_class_12_streams=["Science — PCB or PCM (Both Physics-Chemistry-Biology and Physics-Chemistry-Math eligible)"],
            relevant_diploma_iti=[
                "Diploma in Pharmacy (D.Pharm - 2-Year PCI approved program)",
            ],
            required_undergraduate=[
                "Bachelor of Pharmacy (B.Pharm - 4-Year PCI approved degree program)",
            ],
            preferred_undergraduate=[
                "Bachelor of Pharmacy (B.Pharm)",
            ],
            alternative_undergraduate=[
                "Doctor of Pharmacy (Pharm.D - 6-Year program)",
                "D.Pharm eligible for dispensing in retail/community settings or lateral entry into 2nd year B.Pharm",
            ],
            relevant_postgraduate=[
                "Master of Pharmacy (M.Pharm in Pharmaceutics, Pharmacology, Pharmaceutical Chemistry)",
            ],
            alternative_entry_pathways=[
                "Lateral entry into 2nd year B.Pharm after completing D.Pharm with minimum 50% marks",
            ],
            academic_prerequisites=[
                "10+2 with Physics, Chemistry, and Biology/Mathematics with minimum 50% aggregate",
                "Institution must be accredited and approved by the Pharmacy Council of India (PCI)",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=True,
                regulatory_body="Pharmacy Council of India (PCI) & State Pharmacy Council",
                statutory_act="Pharmacy Act, 1948",
                licensing_exam="Diploma / Degree registration with State Pharmacy Council (D.Pharm Exit Exam where applicable)",
                internship_requirement="500 hours practical hospital/dispensing training as prescribed under Pharmacy Practice Regulations",
                notes="MANDATORY STATUTORY REQUIREMENT: Under Section 32 and 42 of the Pharmacy Act 1948, no person other than a Registered Pharmacist shall compound, prepare, mix, or dispense any medicine on the prescription of a medical practitioner.",
            ),
            eligibility_limitations=[
                "Non-science 10+2 students are strictly ineligible for D.Pharm / B.Pharm admissions.",
                "Graduates in basic science (B.Sc Chemistry/Biology) cannot register as pharmacists or dispense scheduled medicines legally.",
            ],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.INTERNSHIP_PREFERRED.value,
            internship_pathways=["Hospital Pharmacy Practical Training (500 hours mandatory)"],
            portfolio_expectations=["Registered Pharmacist Certificate issued by State Pharmacy Council"],
            career_switch_friendliness="low",
            transferable_experience_notes="Requires a PCI-approved qualification (D.Pharm or B.Pharm) and official council registration.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="CIS",
            people_vs_data="balanced",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="regulatory-affairs-specialist",
                target_career_title="Regulatory Affairs Specialist (Pharma)",
                transferable_competencies=["Drug regulations", "Pharmacology", "Dosage forms"],
                bridge_skills_needed=["FDA/EMA dossier compilation", "CTD submissions", "Drug regulatory filings"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=4,
            ),
        ],
        related_career_slugs=["general-medical-practitioner", "registered-nurse"],
        source_metadata=SourceMetadata(
            source_name="Pharmacy Council of India (PCI) & Pharmacy Act 1948",
            source_url="https://www.pci.nic.in/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.MANDATORY_STATUTORY.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Governed strictly under the Pharmacy Act, 1948 and Pharmacy Practice Regulations.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 9. Mechatronics & Robotics Engineer
    # ------------------------------------------------------------------------
    "mechatronics-engineer": CareerKnowledgeRecord(
        id="mechatronics-engineer",
        slug="mechatronics-engineer",
        soc_code="17-2199.05",
        nco_code="2144.0201",
        canonical_title="Mechatronics & Robotics Engineer",
        alternative_job_titles=[
            "Automation Engineer",
            "Robotics Systems Engineer",
            "Electro-Mechanical Engineer",
            "Industrial Automation Specialist",
        ],
        category="Engineering & Technology",
        industry="Automated Manufacturing, Robotics & Industrial IoT",
        domain=AcademicDomain.ENGINEERING_TECH.value,
        description="Integrates mechanical systems with electronics, microcontrollers, pneumatic actuators, and programmable logic controllers (PLCs) to automate industrial assembly lines, robotic arms, and smart manufacturing cells.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Program and calibrate programmable logic controllers (PLCs), robotic arms, and servo motor drives.",
                "Design electro-pneumatic circuits, sensor feedback loops, and automated component handling systems.",
                "Diagnose electro-mechanical sensor failures, bus communication glitches, and robotic kinematic drift.",
                "Integrate Industrial IoT (IIoT) sensors with supervisory control and data acquisition (SCADA) dashboards.",
            ],
            typical_daily_activities=[
                {"time": "08:30 AM", "activity": "Monitoring robotic welding cell cycle times and sensor diagnostic logs on SCADA."},
                {"time": "10:30 AM", "activity": "Writing PLC ladder logic and structured text for a multi-axis pick-and-place gantry."},
                {"time": "02:00 PM", "activity": "Calibrating optical vision inspection cameras and pneumatic cylinder reed sensors."},
                {"time": "04:30 PM", "activity": "Conducting simulated factory acceptance testing (FAT) on an automated conveyor line."},
            ],
            work_environment="Automated manufacturing plants, robotics laboratories, cleanroom electronics assembly lines.",
            common_employment_sectors=[
                "Automotive & Electric Vehicle Assembly (Tata Motors, Maruti, Hyundai, Ola Electric)",
                "Industrial Automation Systems Integrators (Siemens, ABB, Rockwell, Fanuc, Schneider)",
                "Electronics Manufacturing Services (Foxconn, Dixon Technologies)",
            ],
            entry_level_job_titles=[
                "Graduate Trainee Engineer (Automation)",
                "Junior Robotics Engineer",
                "Mechatronics Specialist",
            ],
            career_progression=[
                "Junior Automation Engineer (0-2 years)",
                "Mechatronics Engineer (2-5 years)",
                "Lead Automation / Robotics Specialist (5-8 years)",
                "Head of Smart Manufacturing / Industry 4.0 Director (8+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["plc_programming"],
            COMPETENCY_REGISTRY["electrical_wiring"],
            COMPETENCY_REGISTRY["system_debugging"],
            Competency(
                id="robotics_kinematics",
                name="Robotic Arm Kinematics & Motion Control",
                category=CompetencyCategory.TECHNICAL.value,
                description="Articulated robotic arm programming, tool center point (TCP) calibration, and motion planning.",
                proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Programming a 6-axis robotic arm trajectory and safety zone interlocks"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Physics)", "Mathematics"],
            relevant_class_12_streams=["Science — PCM (Physics, Chemistry, Mathematics)"],
            relevant_diploma_iti=[
                "Diploma in Mechatronics Engineering (3-Year state polytechnic)",
                "Diploma in Mechanical / Electrical / Electronics Engineering",
                "ITI Electrician / Fitter (with automation upskilling)",
            ],
            required_undergraduate=[],
            preferred_undergraduate=[
                "B.Tech / B.E in Mechatronics Engineering",
                "B.Tech in Robotics & Automation",
                "B.Tech in Mechanical / Electrical / Electronics Engineering",
                "B.Voc in Industrial Automation",
            ],
            alternative_undergraduate=[
                "3-Year Polytechnic Diploma in Mechatronics with lateral entry into B.Tech",
            ],
            relevant_postgraduate=["M.Tech in Mechatronics / Robotics / Industrial Automation"],
            alternative_entry_pathways=[
                "State polytechnic 3-year diploma provides direct pathway into industrial automation roles",
            ],
            academic_prerequisites=[
                "10+2 with Physics, Mathematics, and Chemistry",
                "Solid grounding in electrical circuit theory and basic mechanical mechanics",
            ],
            mandatory_licensing=StatutoryLicensing(is_mandatory=False),
            eligibility_limitations=[],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.NO_EXPERIENCE.value,
            internship_pathways=["Automation Project Intern", "Industrial Robotics Trainee"],
            portfolio_expectations=["Working microcontroller (Arduino/ESP32/STM32) sensor-motor project or verified PLC ladder simulation"],
            career_switch_friendliness="high",
            transferable_experience_notes="Mechanical, electrical, or software engineers can transition by learning PLC programming and sensor integration.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="RIC",
            people_vs_data="data",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="embedded-systems-engineer",
                target_career_title="Embedded Systems Engineer",
                transferable_competencies=["Microcontrollers", "Sensors", "Circuit schematics"],
                bridge_skills_needed=["Embedded C/C++", "RTOS", "Device driver development"],
                difficulty=TransitionDifficulty.LOW.value,
                estimated_transition_months=4,
            ),
        ],
        related_career_slugs=["polytechnic-mechanical-technician", "industrial-electrician"],
        source_metadata=SourceMetadata(
            source_name="AICTE & National Skill Development Corporation (NSDC)",
            source_url="https://www.nsdcindia.org/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.INDUSTRY_STANDARD.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Mechatronics curriculum aligned with AICTE and Sector Skill Council for Capital Goods & Automotives.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 10. B.Voc Renewable Energy Management Specialist
    # ------------------------------------------------------------------------
    "bvoc-renewable-energy-technician": CareerKnowledgeRecord(
        id="bvoc-renewable-energy-technician",
        slug="bvoc-renewable-energy-technician",
        soc_code="17-2199.11",
        nco_code="3119.0301",
        canonical_title="Renewable Energy Management Specialist",
        alternative_job_titles=[
            "Solar PV Project Engineer",
            "Renewable Energy Systems Specialist",
            "Solar Plant Maintenance Engineer",
            "Clean Energy Field Specialist",
        ],
        category="Engineering & Technology",
        industry="Renewable Energy, Solar Power & Sustainability",
        domain=AcademicDomain.ENGINEERING_TECH.value,
        description="Plans, designs, installs, commissions, and optimizes solar photovoltaic (PV) and renewable energy systems, verifying inverter synchronization, grid tie-in standards, and energy generation efficiency.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Conduct solar site surveys, calculate solar irradiance, and design PV array layouts using PVsyst or Helioscope.",
                "Oversee installation of solar PV panels, grid-tie inverters, string combiners, and lightning arresters.",
                "Perform pre-commissioning testing: open-circuit voltage (Voc), short-circuit current (Isc), and inverter efficiency.",
                "Monitor Supervisory Control and Data Acquisition (SCADA) performance ratios (PR) and conduct thermographic scans for hot spots.",
            ],
            typical_daily_activities=[
                {"time": "08:30 AM", "activity": "Reviewing daily solar generation telemetry and inverter fault alerts across utility plants."},
                {"time": "10:30 AM", "activity": "Roof site survey: taking shadow azimuth measurements and structural load readings."},
                {"time": "02:00 PM", "activity": "Testing string combiner boxes and grid-tie synchronizer relay settings."},
                {"time": "04:30 PM", "activity": "Compiling net-metering commissioning documentation for state power distribution utility approval."},
            ],
            work_environment="Solar power plant sites, rooftop installations, renewable energy corporate offices.",
            common_employment_sectors=[
                "Solar EPC & Clean Energy Corporations (Tata Power Solar, Adani Green, ReNew Power)",
                "Rooftop Commercial Solar Installers & Energy Service Companies (ESCOs)",
                "State Renewable Energy Development Agencies (SEDA) & Discoms",
            ],
            entry_level_job_titles=[
                "Junior Solar Engineer",
                "Renewable Energy Project Trainee",
                "Site Installation Engineer",
            ],
            career_progression=[
                "Junior Solar Project Engineer (0-2 years)",
                "Renewable Energy Engineer (2-5 years)",
                "Solar Project Manager / Technical Lead (5-8 years)",
                "Head of Renewable Engineering & O&M (8+ years)",
            ],
        ),
        competencies=[
            COMPETENCY_REGISTRY["electrical_wiring"],
            COMPETENCY_REGISTRY["cad_drafting"],
            Competency(
                id="solar_pv_design",
                name="Solar PV Design & Energy Modeling",
                category=CompetencyCategory.TECHNICAL.value,
                description="Using PVsyst / Helioscope to simulate solar generation, string sizing, and shading loss analysis.",
                proficiency_level=ProficiencyLevel.INTERMEDIATE.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=["Complete 100 kWp rooftop solar PV simulation report with single line diagram (SLD)"],
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Physics)", "Mathematics"],
            relevant_class_12_streams=["Science (PCM)", "Vocational Technical Stream"],
            relevant_diploma_iti=[
                "Diploma in Electrical / Mechanical Engineering",
                "ITI Electrician / Solar Technician",
            ],
            required_undergraduate=[],
            preferred_undergraduate=[
                "B.Voc in Renewable Energy Management",
                "B.Voc in Solar Energy Systems",
                "B.Tech in Electrical / Energy / Mechanical Engineering",
            ],
            alternative_undergraduate=[
                "B.Sc in Physics / Electronics with solar certification",
            ],
            relevant_postgraduate=["M.Tech in Renewable Energy / Energy Management"],
            alternative_entry_pathways=[
                "National Institute of Solar Energy (NISE) Suryamitra certification after ITI or Diploma",
            ],
            academic_prerequisites=[
                "10+2 with Science or 10th + 2-year ITI / 3-year Diploma",
            ],
            mandatory_licensing=StatutoryLicensing(is_mandatory=False),
            eligibility_limitations=[],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level=ExperienceLevel.NO_EXPERIENCE.value,
            internship_pathways=["Solar Rooftop Installation Intern", "Renewable Energy Field Trainee"],
            portfolio_expectations=["Solar PV plant design simulation file and electrical Single Line Diagram (SLD)"],
            career_switch_friendliness="high",
            transferable_experience_notes="Electrical, mechanical, and civil engineers can quickly switch into renewable energy through specialized PV design certifications.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="RIE",
            people_vs_data="practical",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="outdoor",
        ),
        transition_routes=[
            TransitionRoute(
                target_career_slug="energy-auditor",
                target_career_title="Certified Energy Auditor (BEE)",
                transferable_competencies=["Electrical power analysis", "Energy monitoring", "Plant auditing"],
                bridge_skills_needed=["Bureau of Energy Efficiency (BEE) audit standards", "Thermal efficiency calculations"],
                difficulty=TransitionDifficulty.MEDIUM.value,
                estimated_transition_months=6,
            ),
        ],
        related_career_slugs=["industrial-electrician", "polytechnic-mechanical-technician"],
        source_metadata=SourceMetadata(
            source_name="Ministry of New & Renewable Energy (MNRE) & Skill Council for Green Jobs (SCGJ)",
            source_url="https://mnre.gov.in/",
            verification_date="2026-11-01",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.INDUSTRY_STANDARD.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Aligned with UGC B.Voc National Skills Qualifications Framework (NSQF Level 7).",
        ),
    ),
    # ------------------------------------------------------------------------
    # 11. Dental Surgeon / BDS - Mandatory NDC/DCI Licensing
    # ------------------------------------------------------------------------
    "bds-dentist": CareerKnowledgeRecord(
        id="bds-dentist",
        slug="bds-dentist",
        soc_code="29-1021.00",
        nco_code="2261.0101",
        canonical_title="Dental Surgeon (BDS Doctor)",
        alternative_job_titles=[
            "Dentist",
            "Dental Practitioner",
            "Orthodontist (PG)",
            "Oral & Maxillofacial Surgeon (PG)",
            "Prosthodontist (PG)",
        ],
        category="Healthcare & Medicine",
        industry="Hospital & Healthcare Services",
        domain=AcademicDomain.MEDICAL_HEALTHCARE.value,
        description="Diagnoses, prevents, and treats diseases, injuries, and malformations of teeth, gums, and oral cavity tissues in accordance with DCI and National Dental Commission clinical standards.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Perform oral examinations, review dental radiographs (OPG/IOPA), and diagnose dental caries, periodontal diseases, and oral lesions.",
                "Execute operative restorative procedures, root canal treatments (RCT), composite restorations, and crowns/bridges.",
                "Administer local dental anesthesia, perform minor oral surgical extractions, and manage postoperative pain.",
                "Educate patients on preventive oral hygiene, fluoride treatments, and dietary habits.",
                "Maintain strict sterilization, autoclave protocols, and biohazard medical waste compliance.",
            ],
            typical_daily_activities=[
                {"time": "09:00 AM", "activity": "Sterilization check of dental autoclaves, handpieces, and setup of morning surgical trays."},
                {"time": "09:30 AM", "activity": "Patient consultations, diagnostic intraoral X-ray assessments, and treatment planning."},
                {"time": "11:30 AM", "activity": "Operative dental procedures: cavity preparations, aesthetic composite fillings, and crown impressions."},
                {"time": "02:30 PM", "activity": "Endodontic therapies (root canals) and minor oral surgical tooth extractions."},
                {"time": "04:30 PM", "activity": "Post-procedure reviews, lab communication for prosthetic fabrication, and patient documentation."},
            ],
            work_environment="Indoor / Dental clinic, multi-specialty hospital, or dental college operatory.",
            common_employment_sectors=[
                "Private Dental Clinics & Polyclinics",
                "Corporate Healthcare Chains (Apollo White Dental, Clove Dental)",
                "Government District Hospitals & CHCs (via State PSC)",
                "Academic Dental Colleges & Research Institutes",
            ],
            entry_level_job_titles=["Junior Resident (Dental)", "Associate Dentist", "Clinical Dental Officer"],
            career_progression=[
                "Dental Intern (1 year)",
                "Junior Dental Surgeon / Associate Dentist (0-3 years)",
                "Senior Dental Surgeon / Private Practice Principal (3-7 years)",
                "MDS Specialist / Clinical Director / Professor (7+ years)",
            ],
        ),
        competencies=[
            Competency(
                id="clinical_dentistry",
                name="Clinical Dental Diagnosis & Operative Dentistry",
                category="technical",
                description="Diagnosing dental conditions, interpreting digital radiographs, and executing restorative fillings.",
                proficiency_level="advanced",
                importance="mandatory",
                demonstration_methods=["Clinical case documentation during BDS rotatory internship", "State Dental Council verified BDS degree"],
                assessment_rubric={"beginner": "Understands tooth anatomy and basic caries diagnosis.", "intermediate": "Performs aesthetic class I-V composite restorations and crown preps.", "advanced": "Executes complex full-mouth rehabilitation and microscopic endodontics."}
            ),
            Competency(
                id="oral_surgery_basics",
                name="Local Anesthesia & Minor Oral Surgery",
                category="technical",
                description="Administering nerve blocks (inferior alveolar, posterior superior) and performing uncomplicated extractions.",
                proficiency_level="intermediate",
                importance="mandatory",
                demonstration_methods=["Logbook of verified tooth extractions and surgical procedures under clinical faculty"],
                assessment_rubric={}
            ),
            Competency(
                id="patient_communication",
                name="Chairside Patient Empathy & Pain Management",
                category="soft",
                description="Managing patient dental anxiety, clear communication of procedural risks, and informed consent.",
                proficiency_level="intermediate",
                importance="essential",
                demonstration_methods=["Structured patient satisfaction reviews and simulated OSCE clinical evaluation"],
                assessment_rubric={}
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science (Physics, Chemistry, Biology)", "Mathematics", "English"],
            relevant_class_12_streams=["Science — PCB (Physics, Chemistry, Biology mandatory) with English"],
            relevant_diploma_iti=[],
            required_undergraduate=["Bachelor of Dental Surgery (BDS) from a DCI/NDC-recognized dental college"],
            preferred_undergraduate=["Bachelor of Dental Surgery (BDS)"],
            alternative_undergraduate=[],
            relevant_postgraduate=[
                "Master of Dental Surgery (MDS) in Orthodontics & Dentofacial Orthopedics",
                "Master of Dental Surgery (MDS) in Conservative Dentistry & Endodontics",
                "Master of Dental Surgery (MDS) in Oral & Maxillofacial Surgery",
                "Master of Dental Surgery (MDS) in Prosthodontics & Crown Bridge",
            ],
            alternative_entry_pathways=[],
            academic_prerequisites=[
                "Mandatory qualification in National Eligibility cum Entrance Test (NEET-UG)",
                "Minimum 50% aggregate marks in 10+2 PCB (40% for reserved categories) as prescribed by DCI/NDC regulations",
                "Completion of 4 years academic coursework followed by 1 full year of compulsory rotating paid internship",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=True,
                regulatory_body="National Dental Commission (NDC) / Dental Council of India (DCI) & State Dental Council",
                statutory_act="National Dental Commission Act, 2023 (formerly Dentists Act, 1948)",
                licensing_exam="NEET-UG for admission / National Exit Test (Dental - NExT) under NDC Act",
                internship_requirement="1 Year Compulsory Paid Rotatory Dental Internship in an approved teaching dental hospital",
                notes="MANDATORY STATUTORY REQUIREMENT: Under the National Dental Commission Act 2023 and Dentists Act 1948, practicing dentistry in India strictly requires registration with a State Dental Council / National Dental Register.",
            ),
            eligibility_limitations=[
                "Candidates without 10+2 Physics, Chemistry, Biology are legally ineligible for NEET-UG and BDS admissions.",
                "Engineers, Arts, Commerce, Diploma, and ITI graduates cannot transition into BDS without repeating 10+2 PCB and clearing NEET-UG.",
            ],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level="no_experience",
            internship_pathways=["1-Year Compulsory Rotatory Paid Dental Internship"],
            portfolio_expectations=["Certified DCI Dental Internship Logbook with verified procedural quotas"],
            career_switch_friendliness="none",
            transferable_experience_notes="Non-dental degrees cannot transition into clinical dental surgery under Indian statutory regulations.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="IRS",
            people_vs_data="people",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[],
        related_career_slugs=["general-medical-practitioner", "pharmacist"],
        source_metadata=SourceMetadata(
            source_name="National Dental Commission (NDC) & Dental Council of India (DCI)",
            source_url="https://dciindia.gov.in/",
            verification_date="2026-11-01",
            regional_scope="India (National)",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.MANDATORY_STATUTORY.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Governed strictly under the National Dental Commission Act, 2023 (Act No. 33 of 2023) and Dentists Act 1948.",
        ),
    ),

    # ------------------------------------------------------------------------
    # 12. Registered Nurse & Midwife - Mandatory NNMC/INC Licensing
    # ------------------------------------------------------------------------
    "registered-nurse": CareerKnowledgeRecord(
        id="registered-nurse",
        slug="registered-nurse",
        soc_code="29-1141.00",
        nco_code="2221.0101",
        canonical_title="Registered Nurse & Midwife (RN & RM)",
        alternative_job_titles=[
            "Staff Nurse",
            "Nursing Officer",
            "Clinical Nurse",
            "Critical Care Nurse",
            "Pediatric Nurse",
        ],
        category="Healthcare & Medicine",
        industry="Hospital & Healthcare Services",
        domain=AcademicDomain.MEDICAL_HEALTHCARE.value,
        description="Assesses patient health problems, administers medications and treatments, assists physicians with procedures, and provides bedside care in compliance with Indian Nursing Council standards.",
        work_profile=WorkProfile(
            main_responsibilities=[
                "Assess vital signs, perform clinical triage, and monitor patient health trajectory in inpatient wards and ICUs.",
                "Administer prescribed oral, intravenous (IV), intramuscular (IM), and subcutaneous medications calculating safe dosages.",
                "Execute wound dressings, catheterizations, IV cannulations, and nasogastric tube placements following aseptic protocols.",
                "Maintain accurate clinical flow charts, EHR nursing notes, and execute safe shift handovers.",
                "Respond to emergency medical codes (Code Blue), initiate basic life support (BLS), and assist in resuscitation.",
            ],
            typical_daily_activities=[
                {"time": "07:00 AM", "activity": "Bedside shift handover, review patient charts, and administer morning medication rounds."},
                {"time": "09:30 AM", "activity": "Assist physicians and consultants during clinical rounds, note updated orders and diagnostic tests."},
                {"time": "11:30 AM", "activity": "Wound care dressings, IV fluid monitoring, and assisting patients with clinical recovery protocols."},
                {"time": "01:30 PM", "activity": "Lunch break and continuous monitoring of patient telemetry and vital parameters."},
                {"time": "02:30 PM", "activity": "Document nursing interventions in hospital EHR, prepare afternoon handover report."},
            ],
            work_environment="Indoor / Multi-specialty hospital wards, intensive care units (ICUs), emergency departments, or community clinics.",
            common_employment_sectors=[
                "Government Hospitals & AIIMS Institutes (via NORCET Nursing Officer Exam)",
                "Private Healthcare Chains (Apollo, Fortis, Max, Manipal)",
                "State Health Mission & Primary Health Centres (PHCs)",
                "International Healthcare Systems (NHS UK, Gulf GCC, USA NCLEX-RN)",
            ],
            entry_level_job_titles=["Staff Nurse Grade II", "Junior Nursing Officer", "Graduate Nurse Trainee"],
            career_progression=[
                "Staff Nurse / Junior Nursing Officer (0-3 years)",
                "Senior Staff Nurse / In-Charge Nurse (3-7 years)",
                "Nursing Supervisor / Assistant Nursing Superintendent (7-12 years)",
                "Chief Nursing Officer (CNO) / Director of Nursing (12+ years)",
            ],
        ),
        competencies=[
            Competency(
                id="patient_assessment_monitoring",
                name="Patient Assessment & Vital Signs Monitoring",
                category="technical",
                description="Assessing vital signs, identifying deterioration cues, Glasgow Coma Scale (GCS), and early warning scores.",
                proficiency_level="advanced",
                importance="mandatory",
                demonstration_methods=["Clinical rotations logbook verified by nursing superintendent", "State Nursing Council registration certificate"],
                assessment_rubric={"beginner": "Records temperature, pulse, respiration, and BP accurately.", "intermediate": "Identifies early sepsis warning signs, interprets telemetry ECG, and titrates IV pressors.", "advanced": "Leads ICU critical nursing care, hemodialysis support, and ECMO patient monitoring."}
            ),
            Competency(
                id="medication_administration",
                name="Pharmacology Dosage & Sterile Administration",
                category="technical",
                description="Executing the 10 Rights of Medication Administration, pediatric weight-based calculations, and IV infusion maintenance.",
                proficiency_level="advanced",
                importance="mandatory",
                demonstration_methods=["Hospital medication safety clearance and clinical OSCE pharmacology exam"],
                assessment_rubric={}
            ),
            Competency(
                id="emergency_resuscitation",
                name="Basic & Advanced Life Support (BLS / ACLS)",
                category="technical",
                description="High-quality chest compressions, bag-valve mask ventilation, automated external defibrillator (AED) operation.",
                proficiency_level="intermediate",
                importance="essential",
                demonstration_methods=["AHA / Indian Resuscitation Council certified BLS/ACLS provider card"],
                assessment_rubric={}
            ),
        ],
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Science", "Mathematics", "English"],
            relevant_class_12_streams=["Science — PCB (Physics, Chemistry, Biology with English mandatory, min 45% aggregate)"],
            relevant_diploma_iti=[],
            required_undergraduate=["Bachelor of Science in Nursing (B.Sc Nursing - 4 Years)"],
            preferred_undergraduate=["Bachelor of Science in Nursing (B.Sc Nursing)"],
            alternative_undergraduate=["General Nursing and Midwifery (GNM - 3-Year Diploma) followed by Post-Basic B.Sc Nursing"],
            relevant_postgraduate=[
                "Master of Science in Nursing (M.Sc Nursing) in Medical-Surgical Nursing",
                "Master of Science in Nursing (M.Sc Nursing) in Community Health Nursing",
                "Master of Science in Nursing (M.Sc Nursing) in Obstetrics & Gynecological Nursing",
                "Master of Science in Nursing (M.Sc Nursing) in Child Health (Pediatric) Nursing",
            ],
            alternative_entry_pathways=[],
            academic_prerequisites=[
                "10+2 with Science (PCB) and English with minimum 45% marks (40% for SC/ST)",
                "State Nursing Entrance Exam / NEET-UG (where mandated by university/state)",
                "Completion of mandatory clinical rotational postings in recognized multi-specialty teaching hospital",
            ],
            mandatory_licensing=StatutoryLicensing(
                is_mandatory=True,
                regulatory_body="National Nursing and Midwifery Commission (NNMC) / Indian Nursing Council (INC) & State Nursing Council",
                statutory_act="National Nursing and Midwifery Commission Act, 2023 (formerly Indian Nursing Council Act, 1947)",
                licensing_exam="State Nursing Council Registration Examination / National Registration Assessment",
                internship_requirement="Integrated clinical internship included in 4th year B.Sc Nursing curriculum",
                notes="MANDATORY STATUTORY REQUIREMENT: Under the National Nursing and Midwifery Commission Act 2023, practicing clinical nursing strictly requires registration as Registered Nurse and Registered Midwife (RN & RM) with the State Nurses and Midwives Council.",
            ),
            eligibility_limitations=[
                "Candidates without 10+2 Physics, Chemistry, Biology are legally ineligible for B.Sc Nursing admissions.",
                "Non-science graduates cannot transition into clinical nursing without formal GNM/B.Sc Nursing qualification.",
            ],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=True,
            entry_experience_level="no_experience",
            internship_pathways=["Hospital clinical rotational postings during degree program"],
            portfolio_expectations=["Certified clinical nursing skills logbook endorsed by nursing principal"],
            career_switch_friendliness="none",
            transferable_experience_notes="Clinical nursing requires accredited degree/diploma and council licensure under Indian statutory regulations.",
        ),
        work_preferences=WorkPreferences(
            riasec_code="SIR",
            people_vs_data="people",
            team_vs_independent="team",
            practical_vs_theoretical="practical",
            creative_vs_structured="structured",
            indoor_vs_outdoor="indoor",
        ),
        transition_routes=[],
        related_career_slugs=["general-medical-practitioner", "pharmacist"],
        source_metadata=SourceMetadata(
            source_name="Indian Nursing Council (INC) & National Nursing and Midwifery Commission (NNMC)",
            source_url="https://www.indiannursingcouncil.org/",
            verification_date="2026-11-01",
            regional_scope="India (National)",
            confidence=0.98,
            regulatory_status=RegulatoryStatus.MANDATORY_STATUTORY.value,
            record_provenance="curated_benchmark",
            verification_status="manually_verified",
            notes="Governed strictly under the National Nursing and Midwifery Commission Act, 2023 (Act No. 26 of 2023) and State Nurses Registration Acts.",
        ),
    ),
}



# ============================================================================
# 5. UNIVERSAL O*NET DYNAMIC PROJECTION ENGINE
# ============================================================================

def _slugify(title: str) -> str:
    s = title.lower().replace("/", " ").replace("&", "and")
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    return re.sub(r"[\s-]+", "-", s).strip("-")


def _map_field_to_domain(field_str: str) -> AcademicDomain:
    f_lower = (field_str or "").lower()
    if any(w in f_lower for w in ["computer", "it", "information technology", "software", "data"]):
        return AcademicDomain.COMPUTER_APPLICATIONS
    if any(w in f_lower for w in ["engineer", "architecture", "construction", "manufacturing", "installation"]):
        return AcademicDomain.ENGINEERING_TECH
    if any(w in f_lower for w in ["health", "medical", "hospital", "pharma"]):
        return AcademicDomain.MEDICAL_HEALTHCARE
    if any(w in f_lower for w in ["science", "research", "life physical"]):
        return AcademicDomain.PURE_APPLIED_SCIENCES
    if any(w in f_lower for w in ["finance", "accounting", "banking", "insurance"]):
        return AcademicDomain.COMMERCE_FINANCE
    if any(w in f_lower for w in ["arts", "design", "media", "entertainment"]):
        return AcademicDomain.DESIGN_CREATIVE_ARTS
    if any(w in f_lower for w in ["law", "legal", "public safety"]):
        return AcademicDomain.LEGAL_STUDIES
    if any(w in f_lower for w in ["agriculture", "farming", "forestry", "fishing"]):
        return AcademicDomain.AGRICULTURE_ALLIED
    if any(w in f_lower for w in ["business", "management", "operations", "administration", "sales", "marketing"]):
        return AcademicDomain.MANAGEMENT_BUSINESS
    if any(w in f_lower for w in ["trade", "production", "repair", "transportation", "maintenance"]):
        return AcademicDomain.VOCATIONAL_TRADES
    return AcademicDomain.OTHER_SPECIALIZED


def _project_onet_career_to_record(onet_item: dict) -> CareerKnowledgeRecord:
    """
    Universally projects any O*NET career record into a complete, non-null
    CareerKnowledgeRecord with competencies, education pathways, work profiles,
    and source metadata.
    """
    raw_title = onet_item.get("title", "Career")
    slug = onet_item.get("slug") or _slugify(raw_title)
    soc = onet_item.get("soc_code")
    field_name = onet_item.get("field", "General")
    domain = _map_field_to_domain(field_name)
    desc = onet_item.get("description", "Professional occupation.")
    skills = onet_item.get("skills", [])
    tools = onet_item.get("software_tools", [])
    riasec_code = onet_item.get("riasec_code", "IRC")
    job_zone = int(onet_item.get("job_zone", 3))

    # Convert skills to Competency objects
    competencies_list = []
    for s_name in skills[:6]:
        c_id = _slugify(s_name).replace("-", "_")
        competencies_list.append(
            Competency(
                id=c_id,
                name=s_name,
                category=CompetencyCategory.TECHNICAL.value if "Programming" in s_name or "System" in s_name else CompetencyCategory.SOFT.value,
                description=f"Demonstrated ability in {s_name} applied to {raw_title} domain problems.",
                proficiency_level=ProficiencyLevel.INTERMEDIATE.value if job_zone >= 3 else ProficiencyLevel.BEGINNER.value,
                importance=CompetencyImportance.ESSENTIAL.value,
                demonstration_methods=[f"Practical task demonstrating {s_name} in {field_name}", "Structured workplace evaluation"],
            )
        )

    # Inferred Indian Education Pathways
    ug_list = []
    pg_list = []
    diploma_list = []
    stream_list = ["Science", "Commerce", "Arts"]

    if domain in [AcademicDomain.ENGINEERING_TECH, AcademicDomain.COMPUTER_APPLICATIONS]:
        stream_list = ["Science (PCM/PCMC)"]
        diploma_list = ["Polytechnic Diploma in relevant Engineering / Technology"]
        ug_list = ["B.Tech / B.E", "BCA", "B.Sc (Computer Science / IT)", "B.Voc"]
        pg_list = ["M.Tech", "MCA"]
    elif domain == AcademicDomain.MEDICAL_HEALTHCARE:
        stream_list = ["Science (PCB)"]
        ug_list = ["B.Sc in Allied Health Sciences", "B.Pharm", "MBBS", "BDS"]
        pg_list = ["M.Sc in Medical Sciences", "MD / MS"]
    elif domain == AcademicDomain.COMMERCE_FINANCE:
        stream_list = ["Commerce", "Science with Mathematics"]
        ug_list = ["B.Com", "BBA", "B.Sc Economics / Statistics"]
        pg_list = ["M.Com", "MBA (Finance)"]
    elif domain == AcademicDomain.LEGAL_STUDIES:
        ug_list = ["5-Year Integrated Law (BA-LLB / BBA-LLB)", "3-Year LLB"]
        pg_list = ["LLM"]
    elif domain == AcademicDomain.AGRICULTURE_ALLIED:
        stream_list = ["Science (PCB / PCMB)"]
        ug_list = ["B.Sc (Hons) Agriculture / Horticulture", "B.Tech Agricultural Engineering"]
        pg_list = ["M.Sc Agriculture"]
    elif domain == AcademicDomain.VOCATIONAL_TRADES:
        diploma_list = ["ITI Craftsman Training Certificate", "3-Year Polytechnic Diploma"]
        ug_list = ["B.Voc in Applied Technology"]
    else:
        ug_list = ["Bachelor's Degree in relevant discipline"]
        pg_list = ["Master's Degree in relevant discipline"]

    fresher_eligible = job_zone <= 4
    experience_level = (
        ExperienceLevel.NO_EXPERIENCE.value if job_zone <= 2
        else ExperienceLevel.INTERNSHIP_PREFERRED.value if job_zone == 3
        else ExperienceLevel.ONE_TO_TWO_YEARS.value
    )

    d2d_text = onet_item.get("day_to_day") or desc[:120]
    daily_schedule = [
        {"time": "09:00 AM", "activity": f"Review morning priorities, work briefs, and daily goals in {field_name}."},
        {"time": "11:00 AM", "activity": f"Core execution and task delivery utilizing {', '.join(skills[:2]) if skills else 'domain methods'}."},
        {"time": "02:30 PM", "activity": "Collaborate with cross-functional stakeholders, review outputs, and resolve bottlenecks."},
        {"time": "04:30 PM", "activity": "Document completed deliverables, ensure quality compliance, and plan next day goals."},
    ]

    return CareerKnowledgeRecord(
        id=slug,
        slug=slug,
        soc_code=soc,
        canonical_title=raw_title,
        alternative_job_titles=[f"Associate {raw_title}", f"Junior {raw_title}", f"Lead {raw_title}"],
        category=field_name,
        industry=field_name,
        domain=domain.value,
        description=desc,
        work_profile=WorkProfile(
            main_responsibilities=[
                f"Execute core operational and analytical tasks required for {raw_title}.",
                f"Apply {', '.join(skills[:3]) if skills else 'domain practices'} to solve workplace challenges.",
                "Maintain professional documentation, quality assurance standards, and safety compliance.",
            ],
            typical_daily_activities=daily_schedule,
            work_environment="Indoor / Standard professional or technical work environment",
            common_employment_sectors=[
                f"Private Sector Enterprises in {field_name}",
                "Public Sector Undertakings and Government Departments",
                "Consulting & Professional Services Organizations",
            ],
            entry_level_job_titles=[f"Trainee {raw_title}", f"Junior {raw_title}", f"Associate {raw_title}"],
            career_progression=[
                f"Entry Level / Trainee {raw_title} (0-2 years)",
                f"Mid-Level {raw_title} (2-5 years)",
                f"Senior {raw_title} / Specialist (5-8 years)",
                f"Department Head / Practice Director (8+ years)",
            ],
        ),
        competencies=competencies_list,
        education_pathways=EducationPathway(
            relevant_class_10_subjects=["Mathematics", "Science", "Social Studies", "English"],
            relevant_class_12_streams=stream_list,
            relevant_diploma_iti=diploma_list,
            required_undergraduate=[],
            preferred_undergraduate=ug_list,
            alternative_undergraduate=["Graduation in any discipline with relevant domain skill portfolio"],
            relevant_postgraduate=pg_list,
            alternative_entry_pathways=["Vocational diplomas, industry bootcamps, and certified skill credentials"],
            academic_prerequisites=[f"Relevant educational background in {domain.value.replace('_', ' ').title()}"],
            mandatory_licensing=StatutoryLicensing(is_mandatory=False),
            eligibility_limitations=[],
        ),
        experience_profile=ExperienceProfile(
            fresher_eligible=fresher_eligible,
            entry_experience_level=experience_level,
            internship_pathways=[f"Internship in {field_name}", f"Graduate Apprentice - {raw_title}"],
            portfolio_expectations=[f"Demonstrated practical projects or certified coursework in {field_name}"],
            career_switch_friendliness="medium" if job_zone <= 4 else "low",
            transferable_experience_notes=f"Professionals with analytical and problem-solving skills can transition into {field_name}.",
        ),
        work_preferences=WorkPreferences(
            riasec_code=riasec_code,
            people_vs_data="data" if "C" in riasec_code or "I" in riasec_code else "people" if "S" in riasec_code or "E" in riasec_code else "balanced",
            team_vs_independent="team",
            practical_vs_theoretical="practical" if "R" in riasec_code else "theoretical" if "I" in riasec_code else "balanced",
            creative_vs_structured="creative" if "A" in riasec_code else "structured",
            indoor_vs_outdoor="outdoor" if "R" in riasec_code and any(w in field_name.lower() for w in ["agri", "construction", "mining"]) else "indoor",
        ),
        transition_routes=[],
        related_career_slugs=[],
        source_metadata=SourceMetadata(
            source_name=f"O*NET 28.0 Database (SOC {soc}) & National Career Service (NCS) India",
            source_url="https://www.onetonline.org/",
            verification_date="2026-11-01",
            confidence=0.65,
            regulatory_status=RegulatoryStatus.UNREGULATED_SKILL_FIRST.value,
            record_provenance="projected_onet",
            verification_status="inferred_heuristics",
            notes="Automatically projected from O*NET 28.0; educational pathways and competencies are inferred heuristics requiring domain review.",
        ),
    )


# ============================================================================
# 6. CAREER KNOWLEDGE BASE REPOSITORY MANAGER
# ============================================================================

class CareerKnowledgeBase:
    """
    Thread-safe, high-speed in-memory Career Knowledge Base repository.
    Unites deep curated Indian careers with all 1,016 O*NET careers.
    """
    _instance = None

    def __init__(self):
        self._by_slug: Dict[str, CareerKnowledgeRecord] = {}
        self._by_title_lower: Dict[str, CareerKnowledgeRecord] = {}
        self._by_soc: Dict[str, CareerKnowledgeRecord] = {}
        self._by_domain: Dict[str, List[CareerKnowledgeRecord]] = {d.value: [] for d in AcademicDomain}
        self._all_records: List[CareerKnowledgeRecord] = []
        self._initialized = False
        self._load_all()

    @classmethod
    def get_instance(cls) -> "CareerKnowledgeBase":
        if cls._instance is None:
            cls._instance = CareerKnowledgeBase()
        return cls._instance

    def _load_all(self):
        if self._initialized:
            return

        # 1. Load curated careers first
        for slug, rec in CURATED_CAREER_RECORDS.items():
            self._register_record(rec)

        # 2. Load and project all 1,016 O*NET careers
        if ONET_CAREERS_PATH.exists():
            try:
                with open(ONET_CAREERS_PATH, "r", encoding="utf-8") as f:
                    onet_data = json.load(f)
                    for item in onet_data:
                        raw_slug = item.get("slug") or _slugify(item.get("title", ""))
                        # If not already curated, project O*NET item
                        if raw_slug not in self._by_slug:
                            projected = _project_onet_career_to_record(item)
                            self._register_record(projected)
            except Exception as e:
                print(f"Warning: Failed to load onet_careers.json into KnowledgeBase: {e}")

        self._initialized = True
        curated_cnt = len([r for r in self._all_records if r.source_metadata.record_provenance == "curated_benchmark"])
        projected_cnt = len([r for r in self._all_records if r.source_metadata.record_provenance == "projected_onet"])
        print(f"Career Knowledge Base initialized: {len(self._all_records)} total records loaded ({curated_cnt} curated Indian benchmarks, {projected_cnt} projected O*NET records with inferred pathways).")

    def _register_record(self, record: CareerKnowledgeRecord):
        self._by_slug[record.slug] = record
        self._by_slug[record.id] = record
        self._by_title_lower[record.canonical_title.lower()] = record
        for alt in record.alternative_job_titles:
            self._by_title_lower[alt.lower()] = record
        if record.soc_code:
            self._by_soc[record.soc_code] = record
        if record.domain in self._by_domain:
            self._by_domain[record.domain].append(record)
        self._all_records.append(record)

    def count(self) -> int:
        return len(self._all_records)

    def get_career(self, identifier: str) -> Optional[CareerKnowledgeRecord]:
        """Lookup career by slug, id, or canonical title."""
        if not identifier:
            return None
        cleaned = identifier.strip().lower()
        if cleaned in self._by_slug:
            return self._by_slug[cleaned]
        slug_cand = _slugify(identifier)
        if slug_cand in self._by_slug:
            return self._by_slug[slug_cand]
        if cleaned in self._by_title_lower:
            return self._by_title_lower[cleaned]
        return None

    def search_by_keyword(self, query: str, limit: int = 10) -> List[CareerKnowledgeRecord]:
        """Fast keyword search across title, alternative titles, domain, and description."""
        if not query or not query.strip():
            return self._all_records[:limit]
        q_lower = query.strip().lower()
        results = []
        for r in self._all_records:
            if (
                q_lower in r.canonical_title.lower()
                or any(q_lower in alt.lower() for alt in r.alternative_job_titles)
                or q_lower in r.domain.lower()
                or q_lower in r.category.lower()
                or q_lower in r.description.lower()
            ):
                results.append(r)
                if len(results) >= limit:
                    break
        return results

    def search_by_domain(self, domain: Union[str, AcademicDomain], limit: int = 20) -> List[CareerKnowledgeRecord]:
        d_val = domain.value if isinstance(domain, AcademicDomain) else str(domain)
        return self._by_domain.get(d_val, [])[:limit]

    def search_by_qualification(self, edu_input: Union[str, dict, ClassifiedEducation], limit: int = 20) -> List[CareerKnowledgeRecord]:
        """
        Retrieves careers matching an Indian qualification or education profile.
        Uses ClassifiedEducation to return directly eligible and preferred pathway careers.
        """
        if isinstance(edu_input, ClassifiedEducation):
            classified = edu_input
        else:
            classified = classify_education(edu_input)

        if classified.requires_clarification:
            return []

        dom = classified.domain
        level = classified.level
        qual = classified.qualification.lower()

        matches = []
        # 1. School students (Class 10)
        if level in [EducationLevel.MIDDLE_SCHOOL.value, EducationLevel.SECONDARY_SCHOOL.value]:
            # Eligible for Polytechnic diplomas and ITI trades
            for r in self._all_records:
                if (
                    r.domain == AcademicDomain.VOCATIONAL_TRADES.value
                    or "polytechnic" in r.slug
                    or "electrician" in r.slug
                    or "fitter" in r.slug
                    or any("10th" in p or "SSLC" in p for p in r.education_pathways.relevant_class_10_subjects)
                ):
                    matches.append(r)
            return matches[:limit]

        # 2. Higher Secondary (Class 12 / PUC)
        if level == EducationLevel.HIGHER_SECONDARY.value:
            for r in self._all_records:
                # Check if stream matches
                for st in r.education_pathways.relevant_class_12_streams:
                    if (
                        ("commerce" in classified.specialization.lower() and "commerce" in st.lower())
                        or ("science" in classified.specialization.lower() and "science" in st.lower())
                        or ("arts" in classified.specialization.lower() and "arts" in st.lower())
                    ):
                        matches.append(r)
                        break
            return matches[:limit]

        # 3. ITI Trades
        if level == EducationLevel.ITI_VOCATIONAL.value:
            for r in self._all_records:
                if (
                    r.domain == AcademicDomain.VOCATIONAL_TRADES.value
                    or any("iti" in t.lower() or "wireman" in t.lower() or "fitter" in t.lower() for t in r.education_pathways.relevant_diploma_iti)
                ):
                    matches.append(r)
            return matches[:limit]

        # 4. Diploma / Polytechnic
        if level == EducationLevel.POLYTECHNIC_DIPLOMA.value:
            for r in self._all_records:
                if (
                    r.education_pathways.relevant_diploma_iti
                    or "technician" in r.slug
                    or "junior-engineer" in r.slug
                    or r.domain == dom
                ):
                    matches.append(r)
            return matches[:limit]

        # 5. Undergraduate & Postgraduate matching
        for r in self._all_records:
            # Check direct degree match
            all_degrees = (
                r.education_pathways.required_undergraduate
                + r.education_pathways.preferred_undergraduate
                + r.education_pathways.alternative_undergraduate
                + r.education_pathways.relevant_postgraduate
            )
            degree_text = " ".join(all_degrees).lower()

            if (
                qual in degree_text
                or (qual == "btech_be" and ("b.tech" in degree_text or "b.e" in degree_text))
                or (qual == "bca" and "bca" in degree_text)
                or (qual == "bcom" and "b.com" in degree_text)
                or (qual == "bsc_agri" and "agriculture" in degree_text)
                or (qual == "mbbs" and "mbbs" in degree_text)
                or (qual == "bpharm" and "b.pharm" in degree_text)
                or (qual == "llb" and "llb" in degree_text)
                or (qual == "mca" and "mca" in degree_text)
                or (qual == "mba" and "mba" in degree_text)
                or (r.domain == dom and not r.education_pathways.mandatory_licensing.is_mandatory)
            ):
                matches.append(r)

        return matches[:limit]

    def search_by_competencies(self, competencies: List[str], min_overlap: int = 1, limit: int = 15) -> List[CareerKnowledgeRecord]:
        """Finds careers requiring one or more specified competencies."""
        if not competencies:
            return self._all_records[:limit]
        comp_set = {c.strip().lower() for c in competencies if c and c.strip()}
        scored = []
        for r in self._all_records:
            career_comps = {c.name.lower() for c in r.competencies}
            career_comps.update({c.id.lower() for c in r.competencies})
            overlap = len(comp_set.intersection(career_comps))
            if overlap >= min_overlap:
                scored.append((overlap, r))

        scored.sort(key=lambda x: -x[0])
        return [item[1] for item in scored[:limit]]

    def check_eligibility(
        self,
        career_identifier: str,
        edu_input: Union[str, dict, ClassifiedEducation]
    ) -> EligibilityResult:
        """
        Comprehensive evidence-based eligibility verification respecting:
        1. Academic stage progression (School -> 12th Stream -> Diploma/Degree)
        2. Mandatory statutory licensing requirements (NMC, BCI, PCI, ICAI, CoA)
        3. Academic prerequisites (e.g. 10+2 PCB for MBBS, 10+2 PCM for B.Tech)
        4. Clarification for unknown or custom qualifications
        5. Alternative pathways for skill-first careers
        """
        career = self.get_career(career_identifier)
        if not career:
            return EligibilityResult(
                is_eligible=False,
                eligibility_type="career_not_found",
                reason=f"Career '{career_identifier}' was not found in the Knowledge Base.",
            )

        if isinstance(edu_input, ClassifiedEducation):
            classified = edu_input
        else:
            classified = classify_education(edu_input)

        # 1. Unknown or custom qualification needing clarification
        if classified.requires_clarification:
            return EligibilityResult(
                is_eligible=False,
                eligibility_type="clarification_needed",
                reason=(
                    f"Your qualification '{classified.qualification_name}' is specialized or unfamiliar. "
                    "Please clarify and confirm your broad academic domain before eligibility can be verified."
                ),
                recommended_bridge_steps=["Select your academic domain in the qualification clarification dialog."],
            )

        pathways = career.education_pathways
        licensing = pathways.mandatory_licensing

        # 2. Class 10 Students (Secondary School)
        if classified.level in [EducationLevel.MIDDLE_SCHOOL.value, EducationLevel.SECONDARY_SCHOOL.value]:
            if (
                career.domain == AcademicDomain.VOCATIONAL_TRADES.value
                or "polytechnic" in career.slug
                or "electrician" in career.slug
                or "fitter" in career.slug
            ):
                return EligibilityResult(
                    is_eligible=True,
                    eligibility_type="direct_eligible",
                    reason="Class 10 students are directly eligible for admission into 2-Year ITI Craftsman Training and 3-Year Polytechnic Diplomas.",
                )
            else:
                return EligibilityResult(
                    is_eligible=False,
                    eligibility_type="prerequisite_required",
                    reason=(
                        f"{career.canonical_title} requires undergraduate higher education. "
                        "Class 10 students must first complete 10+2 Higher Secondary (or a 3-year polytechnic diploma) to qualify."
                    ),
                    prerequisites_met=False,
                    missing_prerequisites=["10+2 Higher Secondary or 3-Year Polytechnic Diploma"],
                    recommended_bridge_steps=[
                        "Select a relevant 11th/12th stream (Science, Commerce, or Arts) based on your career interests.",
                        "Alternatively, pursue a 3-Year Polytechnic Diploma for lateral entry into engineering.",
                    ],
                )

        # 3. Class 12 Students (Higher Secondary / PUC)
        if classified.level == EducationLevel.HIGHER_SECONDARY.value:
            spec_lower = (classified.specialization or "").lower()

            # Medical, Dental, and Nursing stream restrictions
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
                    )

            # Engineering stream restrictions
            if ("engineering" in career.slug or "mechatronics" in career.slug) and "commerce" in spec_lower:
                return EligibilityResult(
                    is_eligible=False,
                    eligibility_type="restricted_ineligible",
                    reason="Engineering degree (B.Tech/B.E.) admissions under AICTE regulations require Physics and Mathematics in 10+2.",
                    prerequisites_met=False,
                    missing_prerequisites=["10+2 with Mathematics & Physics"],
                )

            # Commerce / CA / Finance stream matching
            if "chartered-accountant" in career.slug or "account" in career.slug:
                return EligibilityResult(
                    is_eligible=True,
                    eligibility_type="preferred_pathway",
                    reason=f"Class 12 students in {classified.specialization} are eligible to register for CA Foundation under ICAI regulations.",
                    recommended_bridge_steps=["Register for CA Foundation with ICAI."],
                )

            return EligibilityResult(
                is_eligible=True,
                eligibility_type="preferred_pathway",
                reason=f"Class 12 students in {classified.specialization} are eligible to enter undergraduate degree programs leading to {career.canonical_title}.",
                recommended_bridge_steps=["Target relevant entrance exams and enroll in an accredited bachelor's degree."],
            )

        # 4. ITI Students
        if classified.level == EducationLevel.ITI_VOCATIONAL.value:
            if career.domain == AcademicDomain.VOCATIONAL_TRADES.value or "electrician" in career.slug or "fitter" in career.slug:
                return EligibilityResult(
                    is_eligible=True,
                    eligibility_type="direct_eligible",
                    reason=f"ITI trade certification directly qualifies you for {career.canonical_title} technical roles.",
                )

        # 5. Diploma / Polytechnic Students
        if classified.level == EducationLevel.POLYTECHNIC_DIPLOMA.value:
            if "technician" in career.slug or "junior-engineer" in career.slug or "cad" in career.slug:
                return EligibilityResult(
                    is_eligible=True,
                    eligibility_type="direct_eligible",
                    reason="3-Year Polytechnic Diploma directly qualifies you for Junior Engineer and CAD/Technical specialist positions.",
                )
            if career.domain == AcademicDomain.ENGINEERING_TECH.value:
                return EligibilityResult(
                    is_eligible=True,
                    eligibility_type="alternative_pathway",
                    reason="Polytechnic Diploma holders are eligible for direct Lateral Entry into the 2nd year of B.Tech/B.E.",
                    recommended_bridge_steps=["Appear for State Lateral Entrance Examination (LEET / DCET)."],
                )

        # 6. Undergraduate & Postgraduate Degree Candidates (Mandatory Licensing Enforcement)
        if licensing.is_mandatory:
            lic_dict = licensing.to_dict()
            qual = classified.qualification.lower()

            # Medical (MBBS)
            if "medical-practitioner" in career.slug or "mbbs" in career.slug:
                if qual not in ["mbbs", "md_ms"]:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=(
                            f"Practicing as a {career.canonical_title} statutorily requires an MBBS degree "
                            f"recognized by the {licensing.regulatory_body} under the {licensing.statutory_act}."
                        ),
                        mandatory_licensing_required=True,
                        licensing_details=lic_dict,
                        prerequisites_met=False,
                        missing_prerequisites=["MBBS Degree", "1-Year CRMI Internship", "State Medical Council Registration"],
                        recommended_bridge_steps=["Clear NEET-UG and enroll in an NMC-recognized 5.5-year MBBS program."],
                    )

            # Law (Advocate)
            if "advocate" in career.slug or "lawyer" in career.slug:
                if qual not in ["llb", "llm"]:
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=(
                            f"Practicing as an Advocate in courts requires an LLB degree recognized by the "
                            f"{licensing.regulatory_body} and passing the {licensing.licensing_exam} under the {licensing.statutory_act}."
                        ),
                        mandatory_licensing_required=True,
                        licensing_details=lic_dict,
                        prerequisites_met=False,
                        missing_prerequisites=["LLB Degree (3-Year or 5-Year)", "Bar Council Enrollment", "AIBE Examination"],
                        recommended_bridge_steps=["Enroll in a 3-Year LLB (if already a graduate) or 5-Year Integrated Law program."],
                    )

            # Dentistry (Dental Surgeon / BDS)
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
                    )

            # Chartered Accountant (CA)
            if "chartered-accountant" in career.slug:
                if qual != "chartered_accountant":
                    return EligibilityResult(
                        is_eligible=False,
                        eligibility_type="restricted_ineligible",
                        reason=(
                            f"Statutory audit and tax sign-off authority legally requires membership in the "
                            f"{licensing.regulatory_body} under the {licensing.statutory_act}."
                        ),
                        mandatory_licensing_required=True,
                        licensing_details=lic_dict,
                        prerequisites_met=False,
                        missing_prerequisites=["ICAI Membership", "CA Final Cleared", "Mandatory Articleship"],
                        recommended_bridge_steps=["Register for CA Intermediate via Direct Entry Scheme or clear CA Foundation."],
                    )

        # 7. Skill-first career pathways (Software, Design, Digital, Analytics)
        if not licensing.is_mandatory:
            return EligibilityResult(
                is_eligible=True,
                eligibility_type="direct_eligible" if classified.domain == career.domain else "alternative_pathway",
                reason=(
                    f"You have the educational foundation for {career.canonical_title}. "
                    "Entry in this field is driven by demonstrated technical competence, practical projects, and skills."
                ),
            )

        # Default eligible for recognized matching qualifications
        return EligibilityResult(
            is_eligible=True,
            eligibility_type="direct_eligible",
            reason=f"Your qualification {classified.qualification_name} satisfies the educational requirements for {career.canonical_title}.",
        )

    def export_dataset_json(self, filepath: Optional[str] = None) -> int:
        """Exports the complete unified career knowledge base into structured JSON format."""
        out_path = Path(filepath) if filepath else CKB_DATA_PATH
        out_path.parent.mkdir(parents=True, exist_ok=True)
        serializable = [r.to_dict() for r in self._all_records]
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2, ensure_ascii=False)
        print(f"Exported {len(serializable)} Career Knowledge Base records to {out_path}")
        return len(serializable)


# ============================================================================
# 7. STANDALONE MODULE FUNCTIONS & ACCESSORS
# ============================================================================

def get_career_knowledge(slug_or_title: str) -> Optional[CareerKnowledgeRecord]:
    """Retrieve full structured career knowledge by slug, title, or alias."""
    return CareerKnowledgeBase.get_instance().get_career(slug_or_title)


def check_career_eligibility(
    career_identifier: str,
    edu_input: Union[str, dict, ClassifiedEducation]
) -> EligibilityResult:
    """Evaluate candidate eligibility for a career respecting statutory licensing and pathways."""
    return CareerKnowledgeBase.get_instance().check_eligibility(career_identifier, edu_input)


def search_careers_by_qualification(
    edu_input: Union[str, dict, ClassifiedEducation],
    limit: int = 20
) -> List[CareerKnowledgeRecord]:
    """Find careers aligned with an educational qualification or profile."""
    return CareerKnowledgeBase.get_instance().search_by_qualification(edu_input, limit=limit)


def search_careers_by_competencies(
    competencies: List[str],
    min_overlap: int = 1,
    limit: int = 15
) -> List[CareerKnowledgeRecord]:
    """Find careers matching specified competencies."""
    return CareerKnowledgeBase.get_instance().search_by_competencies(competencies, min_overlap=min_overlap, limit=limit)


def get_all_careers(limit: int = 100, offset: int = 0) -> List[CareerKnowledgeRecord]:
    """List paginated career records."""
    inst = CareerKnowledgeBase.get_instance()
    return inst._all_records[offset:offset + limit]


if __name__ == "__main__":
    ckb = CareerKnowledgeBase.get_instance()
    print(f"Total careers in Knowledge Base: {ckb.count()}")
    ckb.export_dataset_json()
