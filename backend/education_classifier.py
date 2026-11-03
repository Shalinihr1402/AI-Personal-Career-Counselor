"""
education_classifier.py
Reusable Indian Education Classification Engine for AI Career Counselor.

Classifies student education inputs (from onboarding, resumes, or profile forms)
into canonical academic domains, qualifications, subjects, and learning outcomes
to drive level-aware adaptive assessments.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
import re
from typing import Optional, List, Dict, Any


class AcademicDomain(str, Enum):
    ENGINEERING_TECH = "engineering_tech"
    COMPUTER_APPLICATIONS = "computer_applications"
    MEDICAL_HEALTHCARE = "medical_healthcare"
    PURE_APPLIED_SCIENCES = "pure_applied_sciences"
    COMMERCE_FINANCE = "commerce_finance"
    ARTS_HUMANITIES = "arts_humanities"
    LEGAL_STUDIES = "legal_studies"
    AGRICULTURE_ALLIED = "agriculture_allied"
    MANAGEMENT_BUSINESS = "management_business"
    DESIGN_CREATIVE_ARTS = "design_creative_arts"
    VOCATIONAL_TRADES = "vocational_trades"
    GENERAL_EXPLORATORY = "general_exploratory"
    OTHER_SPECIALIZED = "other_specialized"


class EducationLevel(str, Enum):
    MIDDLE_SCHOOL = "school_middle"             # Class 8-9
    SECONDARY_SCHOOL = "sslc_10th"              # Class 10 / SSLC / Matriculation
    HIGHER_SECONDARY = "puc_12th"               # Class 11-12 / PUC / Intermediate / HSC
    ITI_VOCATIONAL = "iti_vocational"           # ITI Trades
    POLYTECHNIC_DIPLOMA = "diploma"             # Polytechnic / 3-Year Engineering & Technical Diploma
    UNDERGRADUATE = "undergraduate"             # Bachelor's Degrees (B.Tech, MBBS, B.Com, etc.)
    POSTGRADUATE = "postgraduate"               # Master's Degrees (M.Tech, MBA, MCA, MD, etc.)
    DOCTORAL_PHD = "doctoral_phd"               # Ph.D / Doctorate
    PROFESSIONAL_CERTIFICATION = "professional_certification" # CA, CMA, CS, CFA
    OTHER = "other"


DOMAIN_DISPLAY_NAMES: Dict[AcademicDomain, str] = {
    AcademicDomain.ENGINEERING_TECH: "Engineering & Technology",
    AcademicDomain.COMPUTER_APPLICATIONS: "Computer Applications & IT",
    AcademicDomain.MEDICAL_HEALTHCARE: "Medical, Healthcare & Allied Sciences",
    AcademicDomain.PURE_APPLIED_SCIENCES: "Pure & Applied Sciences",
    AcademicDomain.COMMERCE_FINANCE: "Commerce, Banking & Finance",
    AcademicDomain.ARTS_HUMANITIES: "Arts, Humanities & Social Sciences",
    AcademicDomain.LEGAL_STUDIES: "Law & Legal Studies",
    AcademicDomain.AGRICULTURE_ALLIED: "Agriculture & Allied Sciences",
    AcademicDomain.MANAGEMENT_BUSINESS: "Management & Business Administration",
    AcademicDomain.DESIGN_CREATIVE_ARTS: "Design, Media & Creative Arts",
    AcademicDomain.VOCATIONAL_TRADES: "Vocational & Technical Trades",
    AcademicDomain.GENERAL_EXPLORATORY: "General School Education & Foundations",
    AcademicDomain.OTHER_SPECIALIZED: "Specialized & Multidisciplinary Studies",
}


@dataclass
class ClassifiedEducation:
    level: str                           # EducationLevel value
    qualification: str                   # Normalized qualification identifier
    qualification_name: str              # User-facing qualification name
    domain: str                          # AcademicDomain value
    domain_name: str                     # Human-readable domain name
    course_or_stream: str                # e.g., "B.Tech", "Class 12 - Commerce", "ITI"
    specialization: Optional[str] = None # e.g., "Computer Science", "Electrician"
    subjects: List[str] = field(default_factory=list)
    academic_stage: str = "general"      # "middle_school", "stream_selection", "degree_ug", "postgrad", etc.
    primary_skills: List[str] = field(default_factory=list)
    learning_outcomes: List[str] = field(default_factory=list)
    confidence: float = 1.0              # 0.0 to 1.0 confidence score
    requires_clarification: bool = False
    clarification_prompt: Optional[str] = None
    suggested_domains: List[str] = field(default_factory=list)
    is_custom_or_unfamiliar: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ============================================================================
# KNOWLEDGE BASE: INDIAN EDUCATION TAXONOMY
# ============================================================================

# 1. Higher Secondary Streams (Class 11-12 / PUC)
STREAM_CONFIGS: Dict[str, Dict[str, Any]] = {
    "science_pcm": {
        "name": "Science (PCM / Non-Medical)",
        "domain": AcademicDomain.PURE_APPLIED_SCIENCES,
        "subjects": ["Physics", "Chemistry", "Mathematics", "English", "Computer Science"],
        "skills": ["Mathematical Modeling", "Scientific Problem Solving", "Analytical Reasoning", "Algorithmic Logic"],
        "outcomes": ["Fundamental calculus and mechanics", "Chemical reactions & material properties", "Computational thinking"],
    },
    "science_pcb": {
        "name": "Science (PCB / Medical)",
        "domain": AcademicDomain.MEDICAL_HEALTHCARE,
        "subjects": ["Physics", "Chemistry", "Biology", "English"],
        "skills": ["Biological System Analysis", "Organic Chemistry", "Scientific Observation", "Empathetic Reasoning"],
        "outcomes": ["Human physiology and cell biology", "Ecology and genetic inheritance", "Diagnostic foundations"],
    },
    "science_pcmb": {
        "name": "Science (PCMB / General Science)",
        "domain": AcademicDomain.PURE_APPLIED_SCIENCES,
        "subjects": ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
        "skills": ["Quantitative Problem Solving", "Bio-physical Systems", "Experimental Design"],
        "outcomes": ["Dual eligibility for Engineering and Healthcare programs", "Interdisciplinary scientific literacy"],
    },
    "commerce": {
        "name": "Commerce (with / without Mathematics)",
        "domain": AcademicDomain.COMMERCE_FINANCE,
        "subjects": ["Accountancy", "Business Studies", "Economics", "Mathematics / Statistics", "English"],
        "skills": ["Financial Accounting", "Market Economics", "Business Strategy", "Quantitative Statistics"],
        "outcomes": ["Double-entry bookkeeping mastery", "Macro/microeconomic analysis", "Corporate structure comprehension"],
    },
    "arts": {
        "name": "Arts & Humanities",
        "domain": AcademicDomain.ARTS_HUMANITIES,
        "subjects": ["History", "Political Science", "Psychology", "Sociology", "Economics", "Literature"],
        "skills": ["Critical Discourse Analysis", "Social Systems Evaluation", "Qualitative Research", "Written Communication"],
        "outcomes": ["Historical and geopolitical context analysis", "Human behavior and societal structures", "Public policy critique"],
    },
    "vocational_hsc": {
        "name": "Vocational Higher Secondary",
        "domain": AcademicDomain.VOCATIONAL_TRADES,
        "subjects": ["Vocational Trade Theory", "Trade Practical", "Applied Sciences", "English"],
        "skills": ["Hands-on Technical Execution", "Equipment Handling", "Practical Diagnostics"],
        "outcomes": ["Early industry trade readiness", "Technical equipment maintenance"],
    },
}

# 2. ITI Trades (Industrial Training Institutes)
ITI_TRADES: Dict[str, Dict[str, Any]] = {
    "electrician": {
        "name": "Electrician",
        "domain": AcademicDomain.VOCATIONAL_TRADES,
        "subjects": ["Electrical Theory", "Trade Practical", "Workshop Calculation & Science", "Engineering Drawing"],
        "skills": ["Electrical Circuit Wiring", "Motor Maintenance", "AC/DC Machine Overhaul", "Safety Regulations"],
        "outcomes": ["Residential and industrial wiring installation", "Electrical faults diagnosis and circuit repair"],
    },
    "fitter": {
        "name": "Fitter",
        "domain": AcademicDomain.VOCATIONAL_TRADES,
        "subjects": ["Fitting Theory", "Workshop Practice", "Engineering Drawing", "Calculation & Science"],
        "skills": ["Precision Measurement", "Bench Work & Fitting", "Lathe Operations", "Machine Assembly"],
        "outcomes": ["Component fabrication and assembly to engineering tolerances"],
    },
    "welder": {
        "name": "Welder",
        "domain": AcademicDomain.VOCATIONAL_TRADES,
        "subjects": ["Welding Technology", "Gas & Arc Welding Practical", "Welding Inspection"],
        "skills": ["TIG/MIG Welding", "Arc Welding", "Metal Fabrication", "Weld Defect Inspection"],
        "outcomes": ["Structural joint fabrication and pressure-tested pipe welding"],
    },
    "copa": {
        "name": "Computer Operator & Programming Assistant (COPA)",
        "domain": AcademicDomain.COMPUTER_APPLICATIONS,
        "subjects": ["Computer Fundamentals", "Operating Systems", "Office Automation", "Database Management", "HTML/JS"],
        "skills": ["Data Entry & Spreadsheet Analysis", "Basic Scripting", "Database Queries", "Hardware Troubleshooting"],
        "outcomes": ["Business IT operations support and basic software management"],
    },
    "mechanic_motor_vehicle": {
        "name": "Mechanic (Motor Vehicle)",
        "domain": AcademicDomain.VOCATIONAL_TRADES,
        "subjects": ["Automobile Systems Theory", "Engine Overhaul Practical", "Auto Electricals"],
        "skills": ["Engine Diagnostics", "Transmission Repair", "Brake & Suspension Servicing", "Auto Electricals"],
        "outcomes": ["Comprehensive motor vehicle servicing and computerized diagnostic scanning"],
    },
}

# 3. Standard Degree and Qualification Catalog
DEGREE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    # Engineering & Technology
    "btech_be": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Technology / Bachelor of Engineering (B.Tech / B.E)",
        "domain": AcademicDomain.ENGINEERING_TECH,
        "aliases": ["btech", "be", "b.tech", "b.e", "bachelor of technology", "bachelor of engineering"],
        "default_specialization": "Engineering",
        "subjects": ["Engineering Mathematics", "Engineering Physics", "Core Discipline Engineering", "Technical Design Projects"],
        "skills": ["Engineering Design", "Quantitative Problem Solving", "System Architecture", "Prototyping"],
        "outcomes": ["Complex engineering problem formulation", "Technological solution implementation and verification"],
    },
    "mtech_me": {
        "level": EducationLevel.POSTGRADUATE,
        "name": "Master of Technology / Master of Engineering (M.Tech / M.E)",
        "domain": AcademicDomain.ENGINEERING_TECH,
        "aliases": ["mtech", "me", "m.tech", "m.e", "master of technology", "master of engineering"],
        "default_specialization": "Advanced Engineering",
        "subjects": ["Advanced Applied Mathematics", "Specialized Research Topics", "Thesis / Capstone R&D"],
        "skills": ["Advanced R&D", "Theoretical Modeling", "System Optimization", "Technical Leadership"],
        "outcomes": ["Original engineering research", "High-performance specialized system engineering"],
    },
    "polytechnic_diploma": {
        "level": EducationLevel.POLYTECHNIC_DIPLOMA,
        "name": "Diploma in Engineering (Polytechnic)",
        "aliases": ["diploma", "polytechnic", "polytechnic diploma", "engineering diploma"],
        "domain": AcademicDomain.ENGINEERING_TECH,
        "default_specialization": "Polytechnic Engineering",
        "subjects": ["Applied Sciences", "Discipline Engineering Practice", "Workshop Technology", "CAD Drafting"],
        "skills": ["Technical Drafting", "Plant & Equipment Operation", "Supervisory Execution", "Diagnostics"],
        "outcomes": ["Hands-on engineering execution", "Technical quality control and maintenance supervision"],
    },

    # Computer Applications
    "bca": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Computer Applications (BCA)",
        "domain": AcademicDomain.COMPUTER_APPLICATIONS,
        "aliases": ["bca", "b.c.a", "bachelor of computer applications"],
        "default_specialization": "Computer Applications",
        "subjects": ["Programming in C/C++/Java", "Data Structures", "Database Management Systems", "Web Technologies", "Operating Systems"],
        "skills": ["Software Development", "Database Administration", "Web Application Design", "Algorithm Implementation"],
        "outcomes": ["End-to-end web and enterprise application development", "Relational database schema optimization"],
    },
    "mca": {
        "level": EducationLevel.POSTGRADUATE,
        "name": "Master of Computer Applications (MCA)",
        "domain": AcademicDomain.COMPUTER_APPLICATIONS,
        "aliases": ["mca", "m.c.a", "master of computer applications"],
        "default_specialization": "Computer Applications & Software Systems",
        "subjects": ["Advanced Algorithms", "Cloud Architecture", "Machine Learning & AI", "Enterprise Software Engineering", "Distributed Systems"],
        "skills": ["Cloud Solution Architecture", "Full-Stack System Engineering", "Distributed Database Optimization", "API Engineering"],
        "outcomes": ["Scalable enterprise software design", "Complex algorithm design and cloud microservices deployment"],
    },

    # Medical & Healthcare
    "mbbs": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Medicine, Bachelor of Surgery (MBBS)",
        "domain": AcademicDomain.MEDICAL_HEALTHCARE,
        "aliases": ["mbbs", "m.b.b.s", "bachelor of medicine"],
        "default_specialization": "General Medicine & Surgery",
        "subjects": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology", "Forensic Medicine", "Medicine", "Surgery", "Pediatrics"],
        "skills": ["Clinical Diagnosis", "Patient Examination", "Pharmacological Prescriptions", "Surgical Assistance", "Emergency Response"],
        "outcomes": ["Evidence-based patient diagnosis and care", "Pharmacotherapy management and clinical case presentation"],
    },
    "bds": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Dental Surgery (BDS)",
        "domain": AcademicDomain.MEDICAL_HEALTHCARE,
        "aliases": ["bds", "b.d.s", "dental surgery"],
        "default_specialization": "Dental Surgery",
        "subjects": ["Dental Anatomy", "Oral Pathology", "Periodontics", "Prosthodontics", "Oral Surgery"],
        "skills": ["Oral Diagnosis", "Dental Restoration", "Oral Surgery", "Prosthetic Fitting"],
        "outcomes": ["Comprehensive oral disease diagnosis and maxillofacial dental therapeutics"],
    },
    "bpharm": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Pharmacy (B.Pharm)",
        "domain": AcademicDomain.MEDICAL_HEALTHCARE,
        "aliases": ["bpharm", "b.pharm", "b pharm", "bachelor of pharmacy"],
        "default_specialization": "Pharmacy",
        "subjects": ["Pharmaceutics", "Pharmaceutical Chemistry", "Pharmacology", "Pharmacognosy", "Biopharmaceutics"],
        "skills": ["Drug Formulation", "Chemical Quality Testing", "Pharmacological Screening", "Clinical Dispensing"],
        "outcomes": ["Medicinal drug formulation, stability evaluation, and ethical regulatory dispensing"],
    },
    "bsc_nursing": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "B.Sc Nursing",
        "domain": AcademicDomain.MEDICAL_HEALTHCARE,
        "aliases": ["bsc nursing", "b.sc nursing", "bachelor of science in nursing", "nursing"],
        "default_specialization": "Nursing",
        "subjects": ["Anatomy & Physiology", "Medical-Surgical Nursing", "Community Health", "Pediatric Nursing"],
        "skills": ["Patient Care Planning", "Vital Monitoring", "Medication Administration", "Emergency First Response"],
        "outcomes": ["Holistic bedside and clinical patient management"],
    },

    # Pure & Applied Sciences
    "bsc": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Science (B.Sc)",
        "domain": AcademicDomain.PURE_APPLIED_SCIENCES,
        "aliases": ["bsc", "b.sc", "b sc", "bachelor of science"],
        "default_specialization": "Natural Sciences",
        "subjects": ["Physics", "Chemistry", "Mathematics", "Life Sciences", "Laboratory Practicals"],
        "skills": ["Empirical Laboratory Analysis", "Hypothesis Testing", "Data Measurement", "Statistical Inference"],
        "outcomes": ["Scientific experimentation and reproducible analytical laboratory reporting"],
    },
    "msc": {
        "level": EducationLevel.POSTGRADUATE,
        "name": "Master of Science (M.Sc)",
        "domain": AcademicDomain.PURE_APPLIED_SCIENCES,
        "aliases": ["msc", "m.sc", "m sc", "master of science"],
        "default_specialization": "Applied Sciences",
        "subjects": ["Advanced Discipline Theory", "Specialized Lab Techniques", "Research Dissertation"],
        "skills": ["Advanced Laboratory Methods", "Independent Scientific Research", "Data Modeling"],
        "outcomes": ["Deep theoretical mastery and scientific publication readiness in specialized scientific domain"],
    },

    # Commerce, Management & Finance
    "bcom": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Commerce (B.Com)",
        "domain": AcademicDomain.COMMERCE_FINANCE,
        "aliases": ["bcom", "b.com", "b com", "bachelor of commerce"],
        "default_specialization": "Commerce & Accounting",
        "subjects": ["Financial Accounting", "Corporate Law", "Cost Accounting", "Direct & Indirect Tax", "Auditing"],
        "skills": ["Bookkeeping & Ledger Audit", "Tax Computation", "Financial Reporting", "Statutory Compliance"],
        "outcomes": ["Corporate financial statement preparation and tax regulatory filing"],
    },
    "bba": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Business Administration (BBA)",
        "domain": AcademicDomain.MANAGEMENT_BUSINESS,
        "aliases": ["bba", "b.b.a", "bbm", "bms", "bachelor of business administration"],
        "default_specialization": "Business Administration",
        "subjects": ["Principles of Management", "Marketing Management", "Financial Analysis", "Human Resources", "Business Analytics"],
        "skills": ["Business Operations", "Market Strategy", "Financial Modeling", "Organizational Coordination"],
        "outcomes": ["Cross-functional business workflow optimization and project planning"],
    },
    "mba": {
        "level": EducationLevel.POSTGRADUATE,
        "name": "Master of Business Administration (MBA / PGDM)",
        "domain": AcademicDomain.MANAGEMENT_BUSINESS,
        "aliases": ["mba", "m.b.a", "pgdm", "master of business administration"],
        "default_specialization": "General Management",
        "subjects": ["Strategic Leadership", "Corporate Finance", "Digital Marketing", "Operations & Supply Chain", "Executive Analytics"],
        "skills": ["Executive Leadership", "Strategic Resource Allocation", "Financial Valuation", "Market Growth Strategy"],
        "outcomes": ["High-level strategic management, P&L ownership, and corporate growth leadership"],
    },

    # Law & Legal Studies
    "llb": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Laws (LLB / Integrated Law)",
        "domain": AcademicDomain.LEGAL_STUDIES,
        "aliases": ["llb", "l.l.b", "ba llb", "bba llb", "bachelor of laws", "law"],
        "default_specialization": "Law & Jurisprudence",
        "subjects": ["Constitutional Law", "Criminal Law", "Law of Contracts", "Civil Procedure", "Corporate Law", "Evidence Law"],
        "skills": ["Case Law Research", "Statutory Interpretation", "Legal Briefing", "Courtroom Advocacy", "Contract Drafting"],
        "outcomes": ["Legal argument construction, contract drafting, and formal judicial litigation representation"],
    },

    # Agriculture & Allied Sciences
    "bsc_agri": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "B.Sc (Hons) Agriculture",
        "domain": AcademicDomain.AGRICULTURE_ALLIED,
        "aliases": ["bsc agriculture", "b.sc agriculture", "bsc agri", "agriculture", "horticulture", "b.sc (hons) agriculture"],
        "default_specialization": "Agricultural Sciences",
        "subjects": ["Agronomy", "Soil Science", "Genetics & Plant Breeding", "Agricultural Economics", "Plant Pathology", "Horticulture"],
        "skills": ["Crop Lifecycle Management", "Soil Quality Assessment", "Pest & Disease Control", "Farm Economics"],
        "outcomes": ["Sustainable agricultural yield optimization and agribusiness management"],
    },

    # Design, Media & Creative Arts
    "bdes": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Design (B.Des)",
        "domain": AcademicDomain.DESIGN_CREATIVE_ARTS,
        "aliases": ["bdes", "b.des", "bachelor of design", "bfa", "fine arts"],
        "default_specialization": "Design & Visual Communication",
        "subjects": ["Design Fundamentals", "Visual Ergonomics", "CAD / 3D Modeling", "User Research", "Prototyping"],
        "skills": ["Design Thinking", "UI/UX & Wireframing", "Visual Branding", "Physical Prototyping"],
        "outcomes": ["Human-centered product and visual interaction design"],
    },

    # Vocational / Skill-First Bachelor's
    "bvoc": {
        "level": EducationLevel.UNDERGRADUATE,
        "name": "Bachelor of Vocational Education (B.Voc)",
        "domain": AcademicDomain.VOCATIONAL_TRADES,
        "aliases": ["bvoc", "b.voc", "bachelor of vocation"],
        "default_specialization": "Vocational Studies",
        "subjects": ["General Applied Education", "Industry Skill Practicum", "Safety & Standards", "Domain Technology"],
        "skills": ["Industry Equipment Handling", "Applied Technical Execution", "Process Optimization"],
        "outcomes": ["Direct industry sector job-readiness with university degree credentials"],
    },

    # Professional Certifications
    "chartered_accountant": {
        "level": EducationLevel.PROFESSIONAL_CERTIFICATION,
        "name": "Chartered Accountant (CA - ICAI)",
        "domain": AcademicDomain.COMMERCE_FINANCE,
        "aliases": ["ca", "chartered accountant", "cma", "cs", "cfa"],
        "default_specialization": "Auditing & Taxation",
        "subjects": ["Financial Reporting", "Strategic Financial Management", "Advanced Auditing", "Corporate Laws", "Direct & Indirect Taxes"],
        "skills": ["Statutory Auditing", "Forensic Accounting", "Corporate Restructuring", "Taxation Architecture"],
        "outcomes": ["Statutory signing authority for corporate audits and high-level financial governance"],
    },
}

# Domain keyword markers for heuristic fallback & unfamiliar courses
DOMAIN_KEYWORDS: Dict[AcademicDomain, List[str]] = {
    AcademicDomain.COMPUTER_APPLICATIONS: [
        "computer", "software", "programming", "coding", "data science", "cyber", "ai",
        "artificial intelligence", "machine learning", "cloud", "it", "information technology", "web dev"
    ],
    AcademicDomain.ENGINEERING_TECH: [
        "engineer", "engineering", "mechanical", "electrical", "electronics", "civil",
        "robotics", "mechatronics", "aerospace", "automobile", "telecom", "renewable energy",
        "energy management", "hardware", "instrumentation"
    ],
    AcademicDomain.MEDICAL_HEALTHCARE: [
        "medical", "medicine", "doctor", "health", "hospital", "pharma", "pharmacy",
        "nursing", "dental", "ayurveda", "homeopathy", "biotech", "clinical", "physiotherapy",
        "pathology", "surgery"
    ],
    AcademicDomain.PURE_APPLIED_SCIENCES: [
        "physics", "chemistry", "mathematics", "math", "biology", "biotechnology",
        "microbiology", "biochemistry", "statistics", "zoology", "botany", "geology", "environmental"
    ],
    AcademicDomain.COMMERCE_FINANCE: [
        "commerce", "accounting", "accountancy", "finance", "tax", "taxation", "banking",
        "auditing", "insurance", "investment", "fintech", "chartered"
    ],
    AcademicDomain.MANAGEMENT_BUSINESS: [
        "management", "business", "administration", "marketing", "operations", "hr",
        "human resources", "sales", "entrepreneurship", "supply chain", "logistics"
    ],
    AcademicDomain.ARTS_HUMANITIES: [
        "arts", "humanities", "history", "political", "psychology", "sociology", "literature",
        "philosophy", "economics", "journalism", "mass comm", "media", "social work"
    ],
    AcademicDomain.LEGAL_STUDIES: [
        "law", "legal", "advocate", "llb", "judiciary", "constitution", "corporate law",
        "criminal law", "jurisprudence"
    ],
    AcademicDomain.AGRICULTURE_ALLIED: [
        "agriculture", "agri", "horticulture", "farming", "crop", "forestry", "veterinary",
        "fisheries", "agronomy", "soil science"
    ],
    AcademicDomain.DESIGN_CREATIVE_ARTS: [
        "design", "fashion", "graphic", "interior", "animation", "vfx", "film", "fine arts",
        "multimedia", "music", "visual", "ui/ux", "product design"
    ],
    AcademicDomain.VOCATIONAL_TRADES: [
        "iti", "vocational", "electrician", "fitter", "welder", "machinist", "turner",
        "mechanic", "plumber", "carpentry", "trade"
    ],
}


# ============================================================================
# CLASSIFICATION LOGIC
# ============================================================================

def _clean_text(val: Optional[str]) -> str:
    """Safely normalizes input text."""
    if not val or not isinstance(val, str):
        return ""
    # remove punctuation except hyphens/slashes
    cleaned = re.sub(r"[^\w\s\-/]", " ", val)
    return " ".join(cleaned.lower().split())


def _infer_domain_from_text(text: str) -> Optional[AcademicDomain]:
    """Score text against domain keywords to detect the most relevant domain."""
    text_clean = f" {text.lower()} "
    best_domain = None
    best_score = 0

    for domain, kws in DOMAIN_KEYWORDS.items():
        score = 0
        for kw in kws:
            pattern = rf"\b{re.escape(kw)}\b"
            if re.search(pattern, text_clean):
                score += (2 if " " in kw else 1)
        if score > best_score:
            best_score = score
            best_domain = domain

    return best_domain if best_score > 0 else None


def classify_education(input_data: Any) -> ClassifiedEducation:
    """
    Classifies any education input into a standardized ClassifiedEducation object.
    
    Accepts:
      - Dictionary (e.g. OnboardingData.education_details or profile record)
      - String (e.g. "B.Tech Computer Science", "Class 10 Science", "MBBS")
    """
    # 1. Normalize input into extraction parameters
    raw_level = None
    raw_status = None
    raw_degree = None
    raw_spec = None
    raw_stream = None
    raw_board = None
    raw_subjects: List[str] = []
    free_text_parts: List[str] = []

    if isinstance(input_data, dict):
        raw_level = input_data.get("education_level") or input_data.get("educationStage")
        raw_status = input_data.get("education_status")
        raw_degree = input_data.get("degree_other") if input_data.get("degree") == "other" else input_data.get("degree")
        raw_spec = input_data.get("specialization_other") if input_data.get("specialization") in ["Other", "other"] else input_data.get("specialization")
        raw_stream = input_data.get("school_stream")
        raw_board = input_data.get("school_board_other") if input_data.get("school_board") == "other" else input_data.get("school_board")
        raw_course = input_data.get("course")

        if isinstance(input_data.get("favorite_subjects"), list):
            raw_subjects.extend(input_data.get("favorite_subjects"))
        if isinstance(input_data.get("subject_combination"), str) and input_data.get("subject_combination").strip():
            raw_subjects.append(input_data.get("subject_combination").strip())

        for v in [raw_level, raw_degree, raw_spec, raw_stream, raw_course, input_data.get("institution")]:
            if isinstance(v, str) and v.strip():
                free_text_parts.append(v.strip())
        combined_text = " ".join(free_text_parts).lower()
    elif isinstance(input_data, str):
        combined_text = input_data.strip().lower()
        free_text_parts.append(input_data)
    else:
        combined_text = ""

    # =========================================================================
    # PASS 1: SCHOOL EDUCATION (Class 8-10 & Class 11-12)
    # =========================================================================
    if raw_level == "school_middle" or any(w in combined_text for w in ["class 8", "class 9", "8th", "9th", "middle school"]):
        return ClassifiedEducation(
            level=EducationLevel.MIDDLE_SCHOOL.value,
            qualification="middle_school",
            qualification_name="Class 8–9 / Middle School",
            domain=AcademicDomain.GENERAL_EXPLORATORY.value,
            domain_name=DOMAIN_DISPLAY_NAMES[AcademicDomain.GENERAL_EXPLORATORY],
            course_or_stream="Middle School (Class 8–9)",
            specialization="Foundational Exploratory",
            subjects=["General Science", "Social Studies", "Mathematics", "English", "Languages"],
            academic_stage="middle_school",
            primary_skills=["Basic Numeracy", "Scientific Curiosity", "Reading Comprehension"],
            learning_outcomes=["Foundational academic exploration", "Interest identification across diverse subjects"],
            confidence=0.95,
        )

    if raw_level == "sslc_10th" or any(w in combined_text for w in ["class 10", "10th", "sslc", "matriculation", "icse", "cbse 10"]):
        spec_focus = "General"
        domain = AcademicDomain.GENERAL_EXPLORATORY
        if "science" in combined_text:
            spec_focus = "Science Focus"
            domain = AcademicDomain.PURE_APPLIED_SCIENCES
        elif "math" in combined_text:
            spec_focus = "Mathematics Focus"
            domain = AcademicDomain.PURE_APPLIED_SCIENCES

        subjects = raw_subjects or ["Science (Physics, Chemistry, Biology)", "Mathematics", "Social Science", "English", "Second Language"]
        return ClassifiedEducation(
            level=EducationLevel.SECONDARY_SCHOOL.value,
            qualification="sslc_10th",
            qualification_name="Class 10 / SSLC / Matriculation",
            domain=domain.value,
            domain_name=DOMAIN_DISPLAY_NAMES[domain],
            course_or_stream="Class 10",
            specialization=spec_focus,
            subjects=subjects,
            academic_stage="stream_selection",
            primary_skills=["Foundational Mathematics", "General Science Principles", "Social Studies Context"],
            learning_outcomes=["Eligibility for 11th/12th stream selection or 3-year polytechnic diploma"],
            confidence=0.95,
        )

    if raw_level in ["puc_12th", "higher_secondary"] or any(w in combined_text for w in ["class 12", "12th", "puc", "intermediate", "hsc", "11th"]):
        # Identify stream
        stream_key = "science_pcm"
        if raw_stream and raw_stream in STREAM_CONFIGS:
            stream_key = raw_stream
        elif any(w in combined_text for w in ["commerce", "ceba", "seba", "csba"]):
            stream_key = "commerce"
        elif any(w in combined_text for w in ["arts", "humanities", "heps", "hep"]):
            stream_key = "arts"
        elif any(w in combined_text for w in ["pcb", "medical", "biology", "neet"]):
            stream_key = "science_pcb"
        elif any(w in combined_text for w in ["pcm", "non-medical", "jee", "maths"]):
            stream_key = "science_pcm"

        cfg = STREAM_CONFIGS[stream_key]
        return ClassifiedEducation(
            level=EducationLevel.HIGHER_SECONDARY.value,
            qualification="puc_12th",
            qualification_name="Class 11–12 / PUC / Higher Secondary",
            domain=cfg["domain"].value,
            domain_name=DOMAIN_DISPLAY_NAMES[cfg["domain"]],
            course_or_stream=f"Class 12 - {cfg['name']}",
            specialization=cfg["name"],
            subjects=raw_subjects or cfg["subjects"],
            academic_stage="stream_selection",
            primary_skills=cfg["skills"],
            learning_outcomes=cfg["outcomes"],
            confidence=0.95,
        )

    # =========================================================================
    # PASS 2: ITI & VOCATIONAL TRADES
    # =========================================================================
    if raw_level == "iti_vocational" or any(w in combined_text for w in ["iti", "industrial training institute", "trade certificate"]):
        trade_key = "electrician"
        for t_k, t_val in ITI_TRADES.items():
            if t_k in combined_text or t_val["name"].lower() in combined_text or (raw_spec and t_k in raw_spec.lower()):
                trade_key = t_k
                break

        trade_info = ITI_TRADES[trade_key]
        return ClassifiedEducation(
            level=EducationLevel.ITI_VOCATIONAL.value,
            qualification="iti_trade",
            qualification_name="Industrial Training Institute (ITI)",
            domain=trade_info["domain"].value,
            domain_name=DOMAIN_DISPLAY_NAMES[trade_info["domain"]],
            course_or_stream="ITI",
            specialization=trade_info["name"],
            subjects=trade_info["subjects"],
            academic_stage="vocational_technical",
            primary_skills=trade_info["skills"],
            learning_outcomes=trade_info["outcomes"],
            confidence=0.95,
        )

    # =========================================================================
    # PASS 3: POLYTECHNIC & DIPLOMA
    # =========================================================================
    if raw_level == "diploma" or any(w in combined_text for w in ["polytechnic", "diploma in", "diploma"]):
        # Extract specialization
        if raw_spec:
            spec = raw_spec
        else:
            spec = "Mechanical Engineering"
            for cand in ["mechatronics", "mechanical", "civil", "computer", "electrical", "electronics", "automobile", "chemical"]:
                if cand in combined_text:
                    spec = cand.title() + (" Engineering" if "engineering" not in cand else "")
                    break

        domain = AcademicDomain.ENGINEERING_TECH
        if "pharmacy" in combined_text or "d.pharm" in combined_text:
            domain = AcademicDomain.MEDICAL_HEALTHCARE
            spec = "Pharmacy"
        elif "commercial" in combined_text or "secretarial" in combined_text:
            domain = AcademicDomain.COMMERCE_FINANCE
            spec = "Commercial Practice"

        # Special handling for Mechatronics
        if "mechatronics" in combined_text or (raw_spec and "mechatronics" in raw_spec.lower()):
            subjects = ["Industrial Automation", "PLC Programming", "Pneumatics & Hydraulics", "Microcontrollers", "Sensors & Actuators"]
            skills = ["Automation Control", "PLC Ladder Logic", "Electro-mechanical Calibration", "System Diagnostics"]
            outcomes = ["Automated assembly line maintenance and robotic system integration"]
        else:
            subjects = [f"{spec} Theory", f"{spec} Practicals", "Applied Mathematics", "Engineering Drawing", "Workshop Technology"]
            skills = ["Equipment Maintenance", "Technical Drafting", "Component Assembly", "Field Diagnostics"]
            outcomes = ["Hands-on engineering technician roles or lateral entry into B.Tech/B.E. 2nd year"]

        return ClassifiedEducation(
            level=EducationLevel.POLYTECHNIC_DIPLOMA.value,
            qualification="polytechnic_diploma",
            qualification_name="Diploma in Engineering (Polytechnic)",
            domain=domain.value,
            domain_name=DOMAIN_DISPLAY_NAMES[domain],
            course_or_stream=f"Diploma in {spec}",
            specialization=spec,
            subjects=subjects,
            academic_stage="polytechnic_diploma",
            primary_skills=skills,
            learning_outcomes=outcomes,
            confidence=0.95 if spec else 0.85,
        )

    # =========================================================================
    # PASS 4: CANONICAL DEGREE CATALOG MATCHING (UG / PG / Professional)
    # =========================================================================
    matched_deg_id = None
    matched_deg_cfg = None

    # Step 4a: Check if raw_degree directly matches a degree definition key
    if raw_degree and raw_degree.lower() in DEGREE_DEFINITIONS:
        matched_deg_id = raw_degree.lower()
        matched_deg_cfg = DEGREE_DEFINITIONS[matched_deg_id]
    else:
        # Step 4b: Check aliases, prioritizing longer, more specific aliases first
        alias_candidates = []
        for deg_id, deg_cfg in DEGREE_DEFINITIONS.items():
            for alias in deg_cfg["aliases"]:
                alias_candidates.append((len(alias), alias, deg_id, deg_cfg))
        alias_candidates.sort(key=lambda x: -x[0])

        for _, alias, deg_id, deg_cfg in alias_candidates:
            pattern = rf"\b{re.escape(alias)}\b"
            if re.search(pattern, combined_text):
                matched_deg_id = deg_id
                matched_deg_cfg = deg_cfg
                break

    if matched_deg_id and matched_deg_cfg:
        deg_id = matched_deg_id
        deg_cfg = matched_deg_cfg
        spec = raw_spec or deg_cfg.get("default_specialization", "General")
        # Extract specialization from text if not provided
        if not raw_spec:
            for cand_spec in [
                "computer science", "information technology", "artificial intelligence", "data science",
                "mechanical", "civil", "electrical", "electronics", "biotechnology", "microbiology",
                "renewable energy management", "renewable energy", "finance", "marketing", "operations", "agriculture"
            ]:
                if cand_spec in combined_text:
                    spec = cand_spec.title()
                    break

        # Domain override based on specialization (e.g. M.Sc Biotechnology -> pure_applied_sciences)
        domain = deg_cfg["domain"]
        if deg_id in ["bsc", "msc"]:
            if any(w in combined_text for w in ["biotech", "microbiology", "genetics"]):
                domain = AcademicDomain.PURE_APPLIED_SCIENCES
            elif "computer" in combined_text or "it" in combined_text:
                domain = AcademicDomain.COMPUTER_APPLICATIONS
            elif "agri" in combined_text:
                domain = AcademicDomain.AGRICULTURE_ALLIED

        subjects = list(deg_cfg.get("subjects", []))
        if spec and spec != "General" and not any(spec.lower() in s.lower() for s in subjects):
            subjects.insert(0, f"Advanced {spec}")

        skills = list(deg_cfg.get("skills", []))
        outcomes = list(deg_cfg.get("outcomes", []))

        stage = "degree_ug" if deg_cfg["level"] == EducationLevel.UNDERGRADUATE else "postgrad"

        return ClassifiedEducation(
            level=deg_cfg["level"].value,
            qualification=deg_id,
            qualification_name=deg_cfg["name"],
            domain=domain.value,
            domain_name=DOMAIN_DISPLAY_NAMES[domain],
            course_or_stream=deg_cfg["aliases"][0].upper() if len(deg_cfg["aliases"][0]) <= 5 else deg_cfg["aliases"][0].title(),
            specialization=spec,
            subjects=subjects,
            academic_stage=stage,
            primary_skills=skills,
            learning_outcomes=outcomes,
            confidence=0.95,
        )

    # =========================================================================
    # PASS 5: HEURISTIC PREFIX & SPECIALIZED DEGREE CLASSIFIER (e.g. B.Voc)
    # =========================================================================
    # Check for B.Voc / Vocational Bachelor
    if "b.voc" in combined_text or "bvoc" in combined_text or "bachelor of vocation" in combined_text:
        inferred_domain = _infer_domain_from_text(combined_text) or AcademicDomain.VOCATIONAL_TRADES
        spec = raw_spec
        if not spec:
            match = re.search(r"b\.?voc(?:\s+in)?\s+([a-zA-Z\s]+)", combined_text)
            spec = match.group(1).strip().title() if match else "Vocational Studies"

        subjects = [f"{spec} Technologies", "Industrial Standards & Safety", "Applied Technical Execution", "Process Optimization"]
        skills = [f"{spec} Maintenance", "Practical Diagnostics", "Applied Implementation"]
        outcomes = [f"Sector-ready employment in {spec} with vocational degree recognition"]

        return ClassifiedEducation(
            level=EducationLevel.UNDERGRADUATE.value,
            qualification="bvoc",
            qualification_name="Bachelor of Vocational Education (B.Voc)",
            domain=inferred_domain.value,
            domain_name=DOMAIN_DISPLAY_NAMES[inferred_domain],
            course_or_stream=f"B.Voc in {spec}",
            specialization=spec,
            subjects=subjects,
            academic_stage="degree_ug",
            primary_skills=skills,
            learning_outcomes=outcomes,
            confidence=0.88,
            is_custom_or_unfamiliar=False,
        )

    # =========================================================================
    # PASS 6: FALLBACK FOR UNFAMILIAR & CUSTOM QUALIFICATIONS (NO REJECTION)
    # =========================================================================
    inferred_domain = _infer_domain_from_text(combined_text)
    
    # Infer level if keywords present
    inferred_level = EducationLevel.OTHER
    if any(w in combined_text for w in ["master", "m.", "pg", "post graduate"]):
        inferred_level = EducationLevel.POSTGRADUATE
    elif any(w in combined_text for w in ["bachelor", "b.", "ug", "under graduate", "degree"]):
        inferred_level = EducationLevel.UNDERGRADUATE
    elif any(w in combined_text for w in ["diploma", "polytechnic"]):
        inferred_level = EducationLevel.POLYTECHNIC_DIPLOMA
    elif any(w in combined_text for w in ["certificate", "certified", "fellowship"]):
        inferred_level = EducationLevel.PROFESSIONAL_CERTIFICATION

    if inferred_domain:
        # We found domain signals from keywords
        course_label = raw_degree or raw_course or combined_text.title() or "Specialized Degree"
        return ClassifiedEducation(
            level=inferred_level.value,
            qualification="specialized_qualification",
            qualification_name=course_label,
            domain=inferred_domain.value,
            domain_name=DOMAIN_DISPLAY_NAMES[inferred_domain],
            course_or_stream=course_label,
            specialization=raw_spec or "Specialized Domain Focus",
            subjects=["Domain Theoretical Principles", "Applied Methodologies", "Independent Research"],
            academic_stage="specialized_program",
            primary_skills=["Domain Synthesis", "Analytical Execution"],
            learning_outcomes=["Specialized industry or academic proficiency"],
            confidence=0.78,
            requires_clarification=False,
            is_custom_or_unfamiliar=True,
        )

    # Completely unknown / low confidence fallback -> Request clarification without rejecting!
    unrecognized_label = raw_degree or raw_course or combined_text.title() or "Unspecified Qualification"
    candidate_domains = [
        AcademicDomain.ENGINEERING_TECH.value,
        AcademicDomain.COMPUTER_APPLICATIONS.value,
        AcademicDomain.MEDICAL_HEALTHCARE.value,
        AcademicDomain.COMMERCE_FINANCE.value,
        AcademicDomain.MANAGEMENT_BUSINESS.value,
        AcademicDomain.ARTS_HUMANITIES.value,
    ]

    return ClassifiedEducation(
        level=inferred_level.value,
        qualification="unknown_custom",
        qualification_name=unrecognized_label,
        domain=AcademicDomain.OTHER_SPECIALIZED.value,
        domain_name=DOMAIN_DISPLAY_NAMES[AcademicDomain.OTHER_SPECIALIZED],
        course_or_stream=unrecognized_label,
        specialization=raw_spec or "To be confirmed",
        subjects=["General Academic Foundations"],
        academic_stage="exploratory",
        primary_skills=["Critical Reasoning", "Foundational Problem Solving"],
        learning_outcomes=["Interdisciplinary learning pathway"],
        confidence=0.45,
        requires_clarification=True,
        clarification_prompt=(
            f"We noticed your qualification '{unrecognized_label}' is unique or specialized. "
            "Please confirm your broad academic domain to ensure your career assessment is tailored accurately."
        ),
        suggested_domains=candidate_domains,
        is_custom_or_unfamiliar=True,
    )


def resolve_clarification(
    classified: ClassifiedEducation,
    chosen_domain: str,
    chosen_level: Optional[str] = None
) -> ClassifiedEducation:
    """
    Upgrades an ambiguous or custom classification after user clarification.
    """
    domain_enum = AcademicDomain(chosen_domain) if chosen_domain in AcademicDomain._value2member_map_ else AcademicDomain.OTHER_SPECIALIZED
    level_val = chosen_level or classified.level

    classified.domain = domain_enum.value
    classified.domain_name = DOMAIN_DISPLAY_NAMES[domain_enum]
    classified.level = level_val
    classified.confidence = 0.95
    classified.requires_clarification = False
    classified.clarification_prompt = None
    return classified
