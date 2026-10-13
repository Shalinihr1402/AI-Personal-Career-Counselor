"""
setup_onet.py
ETL (Extract, Transform, Load) pipeline for the official O*NET Career Database (v31.0).

What this script does:
1. Locates or downloads the official O*NET 31.0 text dataset (db_31_0_text.zip).
2. Extracts and parses:
   - Occupation Data.txt (SOC code, Job Title, Description)
   - Career Interest Types.txt (RIASEC scores: Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
   - Essential Skills.txt (Core workplace skills ranked by importance)
   - Software Skills.txt (In-demand software, tools & tech stacks)
   - Job Zones.txt (Preparation/education level: 1-5)
3. Standardizes & cleans the data:
   - Maps SOC prefixes to 10 standard career fields (Tech, Data/AI, Healthcare, Engineering, etc.)
   - Generates clean URL slugs (e.g. "software-developers")
   - Calculates Holland codes (e.g. "IRC", "SEC")
   - Formats realistic Indian CTC salary tiers (Fresher / Mid / Senior in ₹ LPA)
   - Generates "Day in the Life" and pros/cons profiles
4. Exports a high-speed production JSON file:
   - backend/data/onet_careers.json (900+ structured careers)
"""

import os
import sys
import json
import re
import zipfile
import csv
import io
import subprocess
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_ZIP_PATH = DATA_DIR / "onet_raw.zip"
OUTPUT_JSON_PATH = DATA_DIR / "onet_careers.json"

ONET_ZIP_URL = "https://www.onetcenter.org/dl_files/database/db_31_0_text.zip"

SOC_FIELD_MAP = {
    "11": "Business, Management & Finance",
    "13": "Business, Management & Finance",
    "15": "Technology & Computer Science",
    "17": "Engineering & Architecture",
    "19": "Physical & Life Sciences",
    "21": "Community & Social Services",
    "23": "Law & Public Policy",
    "25": "Education & Training",
    "27": "Arts, Design & Media",
    "29": "Healthcare & Medicine",
    "31": "Healthcare & Medicine",
    "33": "Protective & Security Services",
    "35": "Hospitality & Food Services",
    "37": "Facilities & Operations",
    "39": "Personal Care & Services",
    "41": "Sales & Business Development",
    "43": "Operations & Administration",
    "45": "Agriculture & Natural Resources",
    "47": "Construction & Trades",
    "49": "Installation & Maintenance",
    "51": "Manufacturing & Production",
    "53": "Transportation & Logistics",
}

SALARY_ESTIMATES = {
    "Technology & Computer Science": {"fresher": "₹6 - 12 LPA", "mid": "₹15 - 28 LPA", "senior": "₹35 - 65+ LPA"},
    "Data & AI": {"fresher": "₹7 - 14 LPA", "mid": "₹16 - 32 LPA", "senior": "₹38 - 70+ LPA"},
    "Engineering & Architecture": {"fresher": "₹4.5 - 9 LPA", "mid": "₹10 - 20 LPA", "senior": "₹22 - 40 LPA"},
    "Healthcare & Medicine": {"fresher": "₹6 - 12 LPA", "mid": "₹14 - 30 LPA", "senior": "₹32 - 70+ LPA"},
    "Business, Management & Finance": {"fresher": "₹5 - 11 LPA", "mid": "₹12 - 24 LPA", "senior": "₹28 - 50+ LPA"},
    "Arts, Design & Media": {"fresher": "₹3.5 - 7 LPA", "mid": "₹8 - 16 LPA", "senior": "₹18 - 35 LPA"},
    "Physical & Life Sciences": {"fresher": "₹4 - 8 LPA", "mid": "₹9 - 18 LPA", "senior": "₹20 - 38 LPA"},
    "Law & Public Policy": {"fresher": "₹4.5 - 9 LPA", "mid": "₹11 - 22 LPA", "senior": "₹25 - 50+ LPA"},
    "Education & Training": {"fresher": "₹3 - 6 LPA", "mid": "₹6 - 12 LPA", "senior": "₹14 - 24 LPA"},
    "General": {"fresher": "₹3 - 6 LPA", "mid": "₹7 - 14 LPA", "senior": "₹15 - 28 LPA"},
}

JOB_ZONE_EDUCATION = {
    "1": "High School Diploma / Basic Training",
    "2": "High School Diploma or Vocational Certificate",
    "3": "Vocational Certificate or Associate Degree",
    "4": "Bachelor's Degree (B.Tech / B.Sc / B.Com / B.A)",
    "5": "Master's Degree, Professional Degree or Ph.D.",
}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


# Ubiquitous software threshold: tools appearing in >= 250 occupations (~27% of all SOCs)
UBIQUITOUS_TOOL_THRESHOLD = 250

# Universal utility software categories: general workplace tools present in 50-93% of occupations.
# These categories are never classified as occupation-specific domain tools.
UNIVERSAL_UTILITY_ELEMENTS = {
    "2.E.1.k",   # Office suite software (Microsoft Office, etc.)
    "2.E.4.d",   # Word processing software (Microsoft Word, Google Docs)
    "2.E.4.i",   # Spreadsheet software (Microsoft Excel)
    "2.E.16.a",  # Electronic mail software (Outlook, Gmail)
    "2.E.10.e",  # Internet browser software (Chrome, Edge)
    "2.E.4.f",   # Presentation software (PowerPoint)
}

# Strict mapping of Career Fields to O*NET Content Model Element ID prefixes
DOMAIN_ELEMENT_IDS: dict[str, tuple[str, ...]] = {
    "Arts, Design & Media": (
        "2.E.3.b",  # Music or sound editing software
        "2.E.4.a",  # Pattern design software
        "2.E.4.b",  # Graphics or photo imaging software
        "2.E.4.c",  # Video creation and editing software
        "2.E.4.k",  # Desktop publishing software
    ),
    "Healthcare & Medicine": (
        "2.E.9.i",  # Medical software
    ),
    "Education & Training": (
        "2.E.8.a",  # Foreign language software
        "2.E.8.b",  # Computer based training software
        "2.E.8.e",  # Multi-media educational software
    ),
    "Technology & Computer Science": (
        "2.E.5.a",  # Content workflow software
        "2.E.5.c",  # File versioning software
        "2.E.6.d",  # Data base management system software
        "2.E.6.f",  # Data base user interface and query software
        "2.E.7",    # Development software
        "2.E.10.a", # Application server software
        "2.E.11",   # Network management software
        "2.E.12",   # Networking software
        "2.E.13",   # Operating environment software
        "2.E.14",   # Security and protection software
        "2.E.17",   # System management software
    ),
    "Data & AI": (
        "2.E.6.b",  # Clustering software
        "2.E.6.d",  # Data base management system software
        "2.E.6.e",  # Data base reporting software
        "2.E.6.f",  # Data base user interface and query software
        "2.E.6.g",  # Data mining software
        "2.E.6.j",  # Object oriented data base management software
        "2.E.6.m",  # Business intelligence and data analysis software
        "2.E.9.d",  # Analytical or scientific software
        "2.E.7.b",  # Development environment software
    ),
    "Engineering & Architecture": (
        "2.E.9.c",  # Computer aided design CAD software
        "2.E.9.g",  # Industrial control software
        "2.E.9.k",  # Computer aided manufacturing CAM software
        "2.E.9.l",  # Manufacturing execution system MES software
        "2.E.9.m",  # CAD/CAM software
        "2.E.8.h",  # Geographic information system (GIS)
    ),
    "Manufacturing & Production": (
        "2.E.9.g",  # Industrial control software
        "2.E.9.k",  # CAM software
        "2.E.9.l",  # MES software
        "2.E.9.m",  # CAD/CAM
        "2.E.2.b",  # ERP software
    ),
    "Construction & Trades": (
        "2.E.9.c",  # CAD software
        "2.E.1.e",  # Project management software
    ),
    "Physical & Life Sciences": (
        "2.E.9.d",  # Analytical or scientific software
        "2.E.8.h",  # GIS
    ),
    "Business, Management & Finance": (
        "2.E.2.a",  # Accounting software
        "2.E.2.b",  # Enterprise resource planning ERP software
        "2.E.2.c",  # Tax preparation software
        "2.E.2.d",  # Financial analysis software
        "2.E.2.f",  # Billing and invoicing software
        "2.E.1.b",  # Procurement software
        "2.E.1.c",  # Human resources software
        "2.E.1.d",  # Logistics and supply chain software
        "2.E.1.e",  # Project management software
        "2.E.1.f",  # Inventory management software
        "2.E.1.l",  # Sales and marketing software
        "2.E.6.c",  # Customer relationship management CRM software
    ),
    "Sales & Business Development": (
        "2.E.6.c",  # CRM software
        "2.E.1.l",  # Sales and marketing software
    ),
    "Operations & Administration": (
        "2.E.1.b",  # Procurement
        "2.E.1.c",  # Human resources
        "2.E.1.e",  # Project management
        "2.E.1.f",  # Inventory management
        "2.E.2.a",  # Accounting
        "2.E.2.b",  # ERP
        "2.E.2.f",  # Billing and invoicing
        "2.E.4.h",  # Calendar and scheduling software
        "2.E.5.b",  # Document management software
    ),
    "Law & Public Policy": (
        "2.E.9.n",  # Legal management software
        "2.E.9.e",  # Compliance software
    ),
    "Community & Social Services": (
        "2.E.6.c",  # CRM software
        "2.E.1.c",  # Human resources
        "2.E.9.i",  # Medical software
    ),
    "Transportation & Logistics": (
        "2.E.1.d",  # Materials requirements planning and supply chain
        "2.E.8.d",  # Route navigation software
        "2.E.9.a",  # Aviation ground support
        "2.E.9.f",  # Flight control software
    ),
}

# High-precision word-boundary title domain rules for cross-disciplinary occupations
TITLE_DOMAIN_RULES: list[tuple[re.Pattern, tuple[str, ...]]] = [
    (re.compile(r"\b(music|musical|singers?|sound|composers?|audio)\b", re.IGNORECASE), ("2.E.3.b",)),
    (re.compile(r"\b(designers?|artists?|photographers?|animators?|illustrators?)\b", re.IGNORECASE), ("2.E.4.a", "2.E.4.b", "2.E.4.c", "2.E.4.k")),
    (re.compile(r"\b(teachers?|instructors?|professors?|educators?)\b", re.IGNORECASE), ("2.E.8.a", "2.E.8.b", "2.E.8.e")),
    (re.compile(r"\b(nurses?|physicians?|surgeons?|dentists?|therapists?|clinical|medical)\b", re.IGNORECASE), ("2.E.9.i",)),
    (re.compile(r"\b(industrial|production|manufacturing)\b", re.IGNORECASE), ("2.E.9.g", "2.E.9.k", "2.E.9.l", "2.E.9.m", "2.E.2.b")),
]


def is_domain_aligned(eid: str, ename: str, field: str, title: str) -> bool:
    """
    Determine if a software element category aligns with the occupation's field or title.
    Enforces strict Element ID matching to eliminate false substring matches.
    """
    if not eid or eid in UNIVERSAL_UTILITY_ELEMENTS:
        return False

    # 1. Field-level Element ID taxonomy match
    prefixes = DOMAIN_ELEMENT_IDS.get(field, ())
    if any(eid.startswith(p) for p in prefixes):
        return True

    # 2. Precise word-boundary title match for specialized roles
    for pattern, rule_prefixes in TITLE_DOMAIN_RULES:
        if pattern.search(title):
            if any(eid.startswith(p) for p in rule_prefixes):
                return True

    return False


def rank_software_tools_for_occupation(
    candidates: list[dict],
    field: str,
    title: str,
    desc: str,
    tool_soc_counts: dict[str, int],
    max_tools: int = 6
) -> list[str]:
    """
    Transparent, deterministic, occupation-aware ranking strategy:
    1. Aggregates duplicate candidate rows for the same tool name, combining the strongest
       applicable In Demand and Hot Technology signals and all associated element categories.
    2. Scores each unique tool:
       - In Demand ('Y'): +4.0 (Occupation-specific job posting frequency; exempt from ubiquity penalty)
       - Domain Aligned:   +3.0 (O*NET Content Model element aligned with occupation field/title)
       - Hot Technology:  +1.0 (National market adoption signal)
       - Ubiquitous tool: -2.0 (Applied only to generic tools appearing across >=27% of US occupations
                               when they are NOT in demand for this occupation)
       - Tiebreaker: -first_encounter_order (preserves deterministic O*NET file sequence)
    """
    # 1. Aggregate candidate rows by tool name
    tool_groups: dict[str, dict] = {}
    for idx, c in enumerate(candidates):
        tool = (c.get("tool") or "").strip()
        if not tool:
            continue
        if tool not in tool_groups:
            tool_groups[tool] = {
                "tool": tool,
                "is_demand": False,
                "is_hot": False,
                "elements": [],
                "first_order": c.get("order", idx),
            }
        group = tool_groups[tool]
        if c.get("is_demand"):
            group["is_demand"] = True
        if c.get("is_hot"):
            group["is_hot"] = True
        eid = c.get("eid", "")
        ename = c.get("ename", "")
        if eid or ename:
            group["elements"].append((eid, ename))

    # 2. Score aggregated tools
    scored = []
    for tool, group in tool_groups.items():
        is_dem = group["is_demand"]
        is_hot = group["is_hot"]
        order = group["first_order"]

        is_domain = any(
            is_domain_aligned(eid, ename, field, title)
            for eid, ename in group["elements"]
        )
        is_ubiquitous = tool_soc_counts.get(tool, 0) >= UBIQUITOUS_TOOL_THRESHOLD

        score = 0.0
        if is_dem:
            score += 4.0
        if is_domain:
            score += 3.0
        if is_hot:
            score += 1.0
        # In-demand tools are proven by occupation job postings, so they avoid the generic commodity penalty
        if is_ubiquitous and not is_dem:
            score -= 2.0

        scored.append((score, -order, tool))

    scored.sort(reverse=True)
    return [item[2] for item in scored[:max_tools]]


def ensure_zip_downloaded():
    """Ensure the raw O*NET zip exists and is valid."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if RAW_ZIP_PATH.exists() and RAW_ZIP_PATH.stat().st_size > 10_000_000:
        try:
            with zipfile.ZipFile(RAW_ZIP_PATH, 'r') as zf:
                if zf.testzip() is None:
                    print(f"Verified existing valid archive at {RAW_ZIP_PATH} ({RAW_ZIP_PATH.stat().st_size // 1024} KB)")
                    return
        except Exception:
            print("Existing archive invalid or incomplete, redownloading...")

    print(f"Downloading O*NET 31.0 database from {ONET_ZIP_URL}...")
    curl_cmd = [
        "curl.exe", "-L", "-C", "-",
        "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "-o", str(RAW_ZIP_PATH),
        ONET_ZIP_URL
    ]
    res = subprocess.run(curl_cmd, capture_output=True, text=True)
    if res.returncode != 0 or not RAW_ZIP_PATH.exists() or RAW_ZIP_PATH.stat().st_size < 10_000_000:
        raise RuntimeError(f"Failed to download O*NET zip: {res.stderr or res.stdout}")
    print(f"Download complete: {RAW_ZIP_PATH.stat().st_size // 1024} KB")


def find_zip_entry(zf: zipfile.ZipFile, filename: str) -> str:
    for name in zf.namelist():
        if name.endswith(filename):
            return name
    raise KeyError(f"File '{filename}' not found in ZIP archive")


def parse_tsv_from_zip(zf: zipfile.ZipFile, filename: str):
    entry_name = find_zip_entry(zf, filename)
    with zf.open(entry_name) as f:
        text_stream = io.TextIOWrapper(f, encoding="utf-8", errors="replace")
        reader = csv.DictReader(text_stream, delimiter="\t")
        return list(reader)


def build_onet_dataset():
    ensure_zip_downloaded()

    print("Reading and parsing O*NET tables from ZIP...")
    with zipfile.ZipFile(RAW_ZIP_PATH, "r") as zf:
        occupations_rows = parse_tsv_from_zip(zf, "Occupation Data.txt")
        interests_rows = parse_tsv_from_zip(zf, "Career Interest Types.txt")
        skills_rows = parse_tsv_from_zip(zf, "Essential Skills.txt")
        software_rows = parse_tsv_from_zip(zf, "Software Skills.txt")
        job_zones_rows = parse_tsv_from_zip(zf, "Job Zones.txt")

    print(f"Loaded {len(occupations_rows)} raw occupations.")

    # 1. Parse Interests (RIASEC)
    dim_map = {
        "Realistic": "R",
        "Investigative": "I",
        "Artistic": "A",
        "Social": "S",
        "Enterprising": "E",
        "Conventional": "C",
    }
    interests_by_soc: dict[str, dict[str, float]] = {}
    for row in interests_rows:
        soc = row.get("O*NET-SOC Code", "").strip()
        scale = row.get("Scale ID", "").strip()
        elem = row.get("Element Name", "").strip()
        val = row.get("Data Value", "0").strip()
        if scale == "OI" and elem in dim_map:
            if soc not in interests_by_soc:
                interests_by_soc[soc] = {}
            try:
                interests_by_soc[soc][dim_map[elem]] = float(val)
            except ValueError:
                pass

    # 2. Parse Essential Skills (Scale ID == 'IM' Importance)
    skills_by_soc: dict[str, list[tuple[str, float]]] = {}
    for row in skills_rows:
        soc = row.get("O*NET-SOC Code", "").strip()
        scale = row.get("Scale ID", "").strip()
        elem = row.get("Element Name", "").strip()
        val = row.get("Data Value", "0").strip()
        if scale == "IM":
            if soc not in skills_by_soc:
                skills_by_soc[soc] = []
            try:
                skills_by_soc[soc].append((elem, float(val)))
            except ValueError:
                pass

    # 3. Parse Software Skills & Tools
    software_candidates_by_soc: dict[str, list[dict]] = {}
    tool_soc_counts: dict[str, int] = {}
    seen_soc_tool: set[tuple[str, str]] = set()

    for idx, row in enumerate(software_rows):
        soc = row.get("O*NET-SOC Code", "").strip()
        example = (row.get("Workplace Example") or row.get("Example") or "").strip()
        eid = row.get("Element ID", "").strip()
        ename = row.get("Element Name", "").strip()
        is_hot = row.get("Hot Technology", "N") == "Y"
        is_demand = row.get("In Demand", "N") == "Y"
        if soc and example:
            if soc not in software_candidates_by_soc:
                software_candidates_by_soc[soc] = []
            software_candidates_by_soc[soc].append({
                "tool": example,
                "eid": eid,
                "ename": ename,
                "is_hot": is_hot,
                "is_demand": is_demand,
                "order": idx,
            })
            if (soc, example) not in seen_soc_tool:
                seen_soc_tool.add((soc, example))
                tool_soc_counts[example] = tool_soc_counts.get(example, 0) + 1

    # 4. Parse Job Zones (Education / Prep level)
    job_zone_by_soc: dict[str, str] = {}
    for row in job_zones_rows:
        soc = row.get("O*NET-SOC Code", "").strip()
        zone = row.get("Job Zone", "3").strip()
        if soc:
            job_zone_by_soc[soc] = zone

    # 5. Transform & Build Final Structured Careers
    careers = []
    seen_slugs = set()

    for occ in occupations_rows:
        soc = occ.get("O*NET-SOC Code", "").strip()
        title = occ.get("Title", "").strip()
        desc = occ.get("Description", "").strip()

        if not soc or not title:
            continue

        base_slug = slugify(title)
        slug = base_slug
        counter = 2
        while slug in seen_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        seen_slugs.add(slug)

        # Field classification
        soc_prefix = soc[:2]
        field = SOC_FIELD_MAP.get(soc_prefix, "General")
        lower_title = title.lower()
        if any(w in lower_title for w in ["data scientist", "machine learning", "artificial intelligence", "data analyst", "statistician", "business intelligence"]):
            field = "Data & AI"

        # RIASEC calculation
        soc_scores = interests_by_soc.get(soc, {"R": 1.0, "I": 1.0, "A": 1.0, "S": 1.0, "E": 1.0, "C": 1.0})
        sorted_dims = sorted(soc_scores.items(), key=lambda x: x[1], reverse=True)
        top_letters = "".join(d[0] for d in sorted_dims[:3])

        # Top workplace skills
        raw_skills = skills_by_soc.get(soc, [])
        sorted_skills = sorted(raw_skills, key=lambda x: x[1], reverse=True)
        top_workplace_skills = [s[0] for s in sorted_skills[:5]]

        # Top software tools: occupation-aware ranking
        raw_candidates = software_candidates_by_soc.get(soc, [])
        top_software = rank_software_tools_for_occupation(
            raw_candidates,
            field=field,
            title=title,
            desc=desc,
            tool_soc_counts=tool_soc_counts,
            max_tools=6,
        )

        # Combine skills: for Tech/Data include software tools; for others include workplace skills
        combined_skills = []
        if field in ["Technology & Computer Science", "Data & AI"] and top_software:
            combined_skills = top_software[:3] + top_workplace_skills[:3]
        else:
            combined_skills = top_workplace_skills[:5]

        if not combined_skills:
            combined_skills = ["Critical Thinking", "Complex Problem Solving", "Active Listening", "Communication"]

        # Job Zone & Education
        zone_num = job_zone_by_soc.get(soc, "3")
        education = JOB_ZONE_EDUCATION.get(zone_num, "Bachelor's Degree")

        # Salary tiers in INR (LPA)
        salary_info = SALARY_ESTIMATES.get(field, SALARY_ESTIMATES["General"])

        # Pros & Cons heuristics
        pros = [
            f"Strong career opportunities and mobility in {field}",
            "Intellectually engaging day-to-day problem solving",
            "Clear pathways to senior and leadership positions"
        ]
        cons = [
            "Requires continuous upskilling as industry practices evolve",
            "Can involve demanding project deadlines and stakeholder management"
        ]

        if "R" in top_letters:
            pros.append("Hands-on, tangible, and practical project impact")
        if "I" in top_letters:
            pros.append("Deep analytical reasoning, investigation, and discovery")
        if "A" in top_letters:
            pros.append("Creative freedom and expressive design thinking")
        if "S" in top_letters:
            pros.append("Fulfilling human interaction and direct societal benefit")
        if "E" in top_letters:
            pros.append("High financial upside and strategic business influence")
        if "C" in top_letters:
            pros.append("Structured workflows, operational clarity, and reliability")

        careers.append({
            "soc_code": soc,
            "title": title,
            "slug": slug,
            "field": field,
            "education": education,
            "job_zone": int(zone_num) if zone_num.isdigit() else 3,
            "description": desc,
            "riasec_code": top_letters,
            "riasec_scores": {k: round(v, 2) for k, v in soc_scores.items()},
            "skills": combined_skills,
            "software_tools": top_software,
            "salary_inr": salary_info,
            "day_to_day": desc.split(".")[0] + "." if "." in desc else desc,
            "pros": pros[:3],
            "cons": cons[:2],
        })

    # Save to JSON
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as out_f:
        json.dump(careers, out_f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(careers)} careers into {OUTPUT_JSON_PATH}")
    return len(careers)


if __name__ == "__main__":
    count = build_onet_dataset()
    print(f"O*NET ETL completed successfully with {count} careers!")
