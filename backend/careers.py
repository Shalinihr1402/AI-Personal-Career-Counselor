"""Career taxonomy + a deterministic RIASEC matcher.

This list is the single source of truth for career suggestions: it constrains
what the AI matcher is allowed to return, and it powers the rule-based
fallback when the AI is unavailable.
"""

import re

# code: 2-3 Holland letters, strongest first
CAREERS = [
    {"title": "Software Engineer", "code": "IRC", "field": "Technology",
     "skills": ["Programming", "Problem solving", "System design", "Debugging"],
     "summary": "Design, build and maintain software systems and applications."},
    {"title": "Frontend Developer", "code": "AIC", "field": "Technology",
     "skills": ["JavaScript", "UI implementation", "CSS", "Accessibility"],
     "summary": "Build the parts of web apps that people see and interact with."},
    {"title": "Machine Learning Engineer", "code": "IRC", "field": "Technology",
     "skills": ["Python", "ML frameworks", "Maths", "Data pipelines"],
     "summary": "Build and ship models that learn from data into real products."},
    {"title": "Data Analyst", "code": "CIE", "field": "Data",
     "skills": ["SQL", "Statistics", "Dashboards", "Storytelling"],
     "summary": "Turn raw data into clear answers that guide decisions."},
    {"title": "Data Scientist", "code": "ICA", "field": "Data",
     "skills": ["Python", "Statistics", "Machine learning", "Experiment design"],
     "summary": "Model complex data to predict outcomes and find insight."},
    {"title": "Business Analyst", "code": "CEI", "field": "Business",
     "skills": ["Requirements", "Process mapping", "Stakeholder management", "Documentation"],
     "summary": "Bridge business needs and technical teams with clear specs."},
    {"title": "Product Manager", "code": "ESC", "field": "Business",
     "skills": ["Prioritisation", "Communication", "Roadmapping", "User research"],
     "summary": "Decide what a product should do and why, then coordinate delivery."},
    {"title": "Project Manager", "code": "CES", "field": "Business",
     "skills": ["Planning", "Coordination", "Risk tracking", "Communication"],
     "summary": "Keep teams, timelines and budgets on track to deliver."},
    {"title": "UX Designer", "code": "ASI", "field": "Design",
     "skills": ["User research", "Wireframing", "Prototyping", "Usability testing"],
     "summary": "Shape how a product feels to use so it's clear and useful."},
    {"title": "UI / Visual Designer", "code": "AIC", "field": "Design",
     "skills": ["Visual design", "Typography", "Design tools", "Design systems"],
     "summary": "Craft the look, layout and polish of digital interfaces."},
    {"title": "Product Designer", "code": "ASI", "field": "Design",
     "skills": ["End-to-end design", "Prototyping", "Research", "Collaboration"],
     "summary": "Own a product's design from problem to shipped interface."},
    {"title": "Graphic Designer", "code": "ARC", "field": "Design",
     "skills": ["Layout", "Branding", "Illustration", "Design software"],
     "summary": "Create visuals for brands, print and digital media."},
    {"title": "Video / Motion Editor", "code": "ARI", "field": "Media",
     "skills": ["Editing", "Storytelling", "Motion graphics", "Editing software"],
     "summary": "Cut and craft footage into compelling video content."},
    {"title": "Content Writer", "code": "ASI", "field": "Media",
     "skills": ["Writing", "Research", "Editing", "SEO basics"],
     "summary": "Write clear, engaging articles, guides and web copy."},
    {"title": "Technical Writer", "code": "CIA", "field": "Media",
     "skills": ["Writing", "Information structure", "Technical grasp", "Editing"],
     "summary": "Explain complex products in documentation people can follow."},
    {"title": "Digital Marketer", "code": "EAS", "field": "Marketing",
     "skills": ["Campaigns", "Analytics", "Content", "Ads"],
     "summary": "Plan and run campaigns that bring in and keep customers."},
    {"title": "Social Media Manager", "code": "EAS", "field": "Marketing",
     "skills": ["Content planning", "Community", "Analytics", "Copywriting"],
     "summary": "Grow and engage an audience across social platforms."},
    {"title": "Sales Executive", "code": "ESC", "field": "Business",
     "skills": ["Persuasion", "Relationship building", "Negotiation", "Pipeline management"],
     "summary": "Find prospects, build trust and close deals."},
    {"title": "Customer Success Manager", "code": "SEC", "field": "Business",
     "skills": ["Relationship building", "Problem solving", "Product knowledge", "Communication"],
     "summary": "Help customers get lasting value from a product."},
    {"title": "HR Specialist", "code": "SEC", "field": "People",
     "skills": ["People processes", "Communication", "Empathy", "Policy"],
     "summary": "Support hiring, onboarding and the employee experience."},
    {"title": "Operations Manager", "code": "ECS", "field": "Business",
     "skills": ["Logistics", "Coordination", "Efficiency", "Process design"],
     "summary": "Keep the day-to-day machinery of a business running well."},
    {"title": "Financial Analyst", "code": "CIE", "field": "Finance",
     "skills": ["Financial modelling", "Excel", "Valuation", "Reporting"],
     "summary": "Analyse financial data to guide investment and budgets."},
    {"title": "Accountant", "code": "CIS", "field": "Finance",
     "skills": ["Bookkeeping", "Compliance", "Attention to detail", "Reporting"],
     "summary": "Track, reconcile and report an organisation's finances."},
    {"title": "Teacher / Trainer", "code": "SAE", "field": "Education",
     "skills": ["Explaining", "Curriculum design", "Patience", "Assessment"],
     "summary": "Help others learn skills and understand ideas."},
    {"title": "Research Scientist", "code": "IAR", "field": "Science",
     "skills": ["Experiment design", "Analysis", "Scientific writing", "Domain depth"],
     "summary": "Investigate open questions and publish new findings."},
    {"title": "Cybersecurity Analyst", "code": "ICR", "field": "Technology",
     "skills": ["Threat analysis", "Networking", "Tools", "Vigilance"],
     "summary": "Defend systems and data against attacks and misuse."},
    {"title": "DevOps / Cloud Engineer", "code": "RIC", "field": "Technology",
     "skills": ["Automation", "Cloud platforms", "Scripting", "Monitoring"],
     "summary": "Automate how software is built, deployed and run at scale."},
    {"title": "QA / Test Engineer", "code": "CIR", "field": "Technology",
     "skills": ["Test design", "Attention to detail", "Automation", "Bug reporting"],
     "summary": "Make sure software works before it reaches users."},
    {"title": "Network Engineer", "code": "RCI", "field": "Technology",
     "skills": ["Networking", "Hardware", "Troubleshooting", "Configuration"],
     "summary": "Design and maintain the networks that connect systems."},
    {"title": "Mechanical Engineer", "code": "RIC", "field": "Engineering",
     "skills": ["CAD", "Physics", "Problem solving", "Prototyping"],
     "summary": "Design machines, tools and mechanical systems."},
    {"title": "Civil Engineer", "code": "RIC", "field": "Engineering",
     "skills": ["Structures", "Planning", "Site work", "Standards"],
     "summary": "Design and oversee buildings, roads and infrastructure."},
    {"title": "Electrical Engineer", "code": "RIC", "field": "Engineering",
     "skills": ["Circuits", "Systems", "Maths", "Testing"],
     "summary": "Design electrical and electronic systems and devices."},
    {"title": "Architect", "code": "ARI", "field": "Design",
     "skills": ["Design", "Spatial reasoning", "CAD", "Building codes"],
     "summary": "Design buildings that are functional, safe and appealing."},
    {"title": "Nurse", "code": "SIC", "field": "Healthcare",
     "skills": ["Patient care", "Clinical procedures", "Communication", "Composure"],
     "summary": "Deliver hands-on care and support to patients."},
    {"title": "Pharmacist", "code": "CIS", "field": "Healthcare",
     "skills": ["Pharmacology", "Accuracy", "Counselling", "Compliance"],
     "summary": "Dispense medication safely and advise on its use."},
    {"title": "Lawyer", "code": "EIS", "field": "Legal",
     "skills": ["Argumentation", "Legal research", "Writing", "Negotiation"],
     "summary": "Advise clients and represent them within the law."},
    {"title": "Management Consultant", "code": "EIC", "field": "Business",
     "skills": ["Analysis", "Communication", "Structuring problems", "Presentation"],
     "summary": "Help organisations solve high-stakes business problems."},
    {"title": "Entrepreneur / Founder", "code": "EAI", "field": "Business",
     "skills": ["Vision", "Risk tolerance", "Execution", "Selling"],
     "summary": "Build a product and a business from nothing."},
    {"title": "Sports Coach", "code": "SRE", "field": "Sports",
     "skills": ["Coaching", "Training plans", "Motivation", "Performance analysis"],
     "summary": "Train athletes and teams to improve skills and results."},
    {"title": "Fitness Trainer", "code": "RSE", "field": "Sports",
     "skills": ["Exercise science", "Program design", "Client coaching", "Nutrition basics"],
     "summary": "Design workouts and guide clients toward their fitness goals."},
]


def slugify(title: str) -> str:
    s = title.lower().replace("/", " ").replace("&", "and")
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    return re.sub(r'[\s-]+', '-', s).strip('-')


for c in CAREERS:
    c["slug"] = slugify(c["title"])

CAREER_TITLES = [c["title"] for c in CAREERS]
_TITLE_SET = set(CAREER_TITLES)

# rank weight for the user's 1st / 2nd / 3rd strongest dimension
_RANK_WEIGHT = [3, 2, 1]


def _expand_code(code: str) -> str:
    from riasec import DIM_LABEL

    return ", ".join(DIM_LABEL[c] for c in code if c in DIM_LABEL)


_MAX_RAW_MATCH = 3 + 2 + 1 + 2 + 1 + 1  # membership + positional + interest

_DEAL_BREAKER_CONFLICTS = {
    "Sitting alone debugging code all day": {"Software Engineer", "Machine Learning Engineer"},
    "Cold calling or aggressive selling": {"Digital Marketer", "Social Media Manager"},
    "Heavy abstract math & complex formulas": {"Machine Learning Engineer", "Data Scientist"},
    "Monotonous paperwork & repetitive routine": {"Data Analyst", "Business Analyst"},
}


def fallback_match(scores: dict, interests=None, deal_breakers=None, limit: int = 5) -> list:
    """Rule-based match: overlap between the user's top dimensions and each
    career's Holland code, weighted by position and boosted by declared
    interests, penalized by deal-breakers."""
    dims = sorted(scores, key=lambda d: -scores[d])
    top = dims[:3]
    weight = {d: _RANK_WEIGHT[i] for i, d in enumerate(top)}

    interest_fields = _interest_fields(interests or [])
    avoid_titles = set()
    if deal_breakers and isinstance(deal_breakers, list):
        for db in deal_breakers:
            avoid_titles |= _DEAL_BREAKER_CONFLICTS.get(db, set())

    ranked = []
    for career in CAREERS:
        # If this career clashes with an anti-goal deal breaker, heavily penalize or skip
        if career["title"] in avoid_titles:
            continue
        code = career["code"]
        raw = sum(weight.get(ch, 0) for ch in code)          # membership
        if top and code[:1] == top[0]:
            raw += 2                                          # same 1st letter
        if len(code) > 1 and len(top) > 1 and code[1] == top[1]:
            raw += 1                                          # same 2nd letter
        if career["field"] in interest_fields:
            raw += 1                                          # interest boost
        ranked.append((raw, career))

    ranked.sort(key=lambda pair: -pair[0])
    out = []
    for i, (raw, career) in enumerate(ranked[:limit]):
        # base fit from the score, minus a small step per rank so a list of
        # identically-coded careers still reads as ordered
        fit = max(40, min(100, round(40 + raw / _MAX_RAW_MATCH * 60) - i * 3))
        out.append({
            "title": career["title"],
            "slug": career["slug"],
            "fit": fit,
            "why_it_fits": f"Fits your strengths in {_expand_code(''.join(top))}.",
            "day_to_day": career["summary"],
            "key_skills": career["skills"],
            "watch_outs": "Explore a day-in-the-life account before committing.",
        })
    return out


_INTEREST_TO_FIELDS = {
    "Coding & Tech": {"Technology", "Engineering"},
    "Design & Creativity": {"Design", "Media"},
    "Data & Numbers": {"Data", "Finance"},
    "Communication & People": {"People", "Education", "Business"},
    "Business & Management": {"Business", "Finance"},
    "Science & Research": {"Science", "Healthcare", "Engineering"},
    "Healthcare": {"Healthcare"},
    "Sports & Fitness": {"Sports"},
    "Writing & Content": {"Media"},
    "Public Speaking": {"Business", "Education", "Legal"},
}


def _interest_fields(interests: list) -> set:
    fields: set = set()
    for i in interests:
        fields |= _INTEREST_TO_FIELDS.get(i, set())
    return fields


def valid_titles() -> set:
    return set(_TITLE_SET)


CAREER_EXTENDED_INFO = {
    "software-engineer": {
        "salary_india": {"entry": "₹5 - ₹9 LPA", "mid": "₹14 - ₹24 LPA", "senior": "₹28 - ₹55+ LPA"},
        "day_in_the_life": [
            {"time": "9:30 AM", "activity": "Standup sync with product manager and developers on current sprint goals."},
            {"time": "10:15 AM", "activity": "Deep focus coding: building backend endpoints and optimizing database queries."},
            {"time": "2:00 PM", "activity": "Code reviews, reviewing pull requests, and debugging edge cases with the team."},
            {"time": "4:30 PM", "activity": "System design planning for an upcoming high-traffic microservice."},
        ],
        "pros": [
            "High salary potential and fast career progression in India and globally",
            "Strong remote and hybrid work opportunities",
            "Empowering feeling of building products used by millions of users",
        ],
        "cons": [
            "Sitting for long hours staring at computer screens",
            "Fast-changing tech stack requires continuous self-learning",
            "Debugging production issues under tight deadlines can be stressful",
        ],
        "learning_path": [
            "1. Master one programming language (Python, TypeScript, Java, or C++)",
            "2. Learn Data Structures, Algorithms, and clean code principles",
            "3. Build 2-3 full-stack projects connecting a frontend, backend, and database",
            "4. Master Git, Docker, and deployment on cloud platforms",
        ],
        "growth_outlook": "Very High (Expected 22% growth over the next 5 years)",
    },
    "frontend-developer": {
        "salary_india": {"entry": "₹4.5 - ₹8 LPA", "mid": "₹12 - ₹20 LPA", "senior": "₹24 - ₹45+ LPA"},
        "day_in_the_life": [
            {"time": "10:00 AM", "activity": "Review Figma design specs and collaborate with UI/UX designers."},
            {"time": "11:00 AM", "activity": "Build responsive, accessible user interfaces using React/Next.js and Tailwind."},
            {"time": "2:30 PM", "activity": "Integrate REST & GraphQL APIs and manage client-side state."},
            {"time": "4:30 PM", "activity": "Cross-browser testing, accessibility audits, and performance tuning."},
        ],
        "pros": [
            "Immediate visual feedback on everything you build",
            "High demand across tech startups and enterprise firms",
            "Great bridge between visual aesthetics and engineering logic",
        ],
        "cons": [
            "Browser quirks, responsive layout inconsistencies, and CSS debugging",
            "Very frequent framework churn (new tools constantly arriving)",
        ],
        "learning_path": [
            "1. Solid foundation in semantic HTML, modern CSS, and core JavaScript",
            "2. Master React or Next.js, state management, and modern component design",
            "3. Build responsive web apps with Tailwind CSS and API integrations",
        ],
        "growth_outlook": "High (Continued growth across web and mobile web platforms)",
    },
    "data-analyst": {
        "salary_india": {"entry": "₹4 - ₹7.5 LPA", "mid": "₹10 - ₹18 LPA", "senior": "₹20 - ₹35+ LPA"},
        "day_in_the_life": [
            {"time": "9:30 AM", "activity": "Monitor business dashboards and KPI anomaly alerts."},
            {"time": "11:00 AM", "activity": "Write SQL queries to join disparate tables and pull raw operational data."},
            {"time": "2:00 PM", "activity": "Clean data and build visualizations in PowerBI / Tableau / Python."},
            {"time": "4:00 PM", "activity": "Present findings to sales and product leads to guide business strategy."},
        ],
        "pros": [
            "High visibility with senior management and leadership",
            "Combines analytical number-crunching with visual storytelling",
            "Easier mathematical entry barrier compared to pure Machine Learning",
        ],
        "cons": [
            "A lot of time spent cleaning dirty or inconsistent data",
            "Ad-hoc requests from stakeholders demanding urgent reports",
        ],
        "learning_path": [
            "1. Master advanced SQL (joins, window functions, aggregations)",
            "2. Learn Python (Pandas) and Excel for data transformation",
            "3. Master Power BI or Tableau to build business dashboards",
        ],
        "growth_outlook": "High (Data-driven decision making is now mandatory across all industries)",
    },
    "ux-designer": {
        "salary_india": {"entry": "₹4.5 - ₹8 LPA", "mid": "₹12 - ₹20 LPA", "senior": "₹25 - ₹40+ LPA"},
        "day_in_the_life": [
            {"time": "10:00 AM", "activity": "Conduct 1-on-1 user interviews to understand customer pain points."},
            {"time": "11:30 AM", "activity": "Map user journeys, wireframes, and low-fidelity prototypes."},
            {"time": "2:30 PM", "activity": "Design high-fidelity interactive prototypes in Figma with design tokens."},
            {"time": "4:30 PM", "activity": "Design critique session with product managers and engineers."},
        ],
        "pros": [
            "Deeply creative and empathetic problem solving",
            "Does not require writing code (though tech understanding helps)",
            "Direct impact on how humans experience digital technology",
        ],
        "cons": [
            "Subjective feedback: everyone in the company has an opinion on design",
            "Continuous compromises between ideal user experience and technical constraints",
        ],
        "learning_path": [
            "1. Learn user research, information architecture, and usability testing",
            "2. Master Figma (auto-layout, components, prototyping)",
            "3. Create 2-3 end-to-end case studies showing problem-solving process",
        ],
        "growth_outlook": "High (Product differentiation now depends heavily on UX)",
    },
    "product-manager": {
        "salary_india": {"entry": "₹8 - ₹14 LPA", "mid": "₹18 - ₹30 LPA", "senior": "₹35 - ₹65+ LPA"},
        "day_in_the_life": [
            {"time": "9:30 AM", "activity": "Review user metrics, feature adoption, and customer feedback tickets."},
            {"time": "11:00 AM", "activity": "Write Product Requirement Documents (PRDs) for upcoming features."},
            {"time": "2:00 PM", "activity": "Sprint planning and backlog prioritization with engineering leads."},
            {"time": "4:00 PM", "activity": "Strategy sync with marketing and sales on go-to-market plans."},
        ],
        "pros": [
            "Acts as the 'mini-CEO' of the product feature set",
            "Exceptional compensation and leadership trajectory",
            "Broad exposure across business, technology, and design",
        ],
        "cons": [
            "High responsibility without direct authority over engineers",
            "Meeting-heavy schedule with continuous context switching",
        ],
        "learning_path": [
            "1. Understand software development lifecycle (Agile/Scrum)",
            "2. Learn user research, product metrics, and business economics",
            "3. Build tear-downs of popular apps and write sample PRDs",
        ],
        "growth_outlook": "Very High (Strategic tech leadership roles continue to expand)",
    },
    "machine-learning-engineer": {
        "salary_india": {"entry": "₹6 - ₹12 LPA", "mid": "₹18 - ₹32 LPA", "senior": "₹35 - ₹70+ LPA"},
        "day_in_the_life": [
            {"time": "10:00 AM", "activity": "Evaluate model training loss curves and validation metrics."},
            {"time": "11:30 AM", "activity": "Feature engineering and data pipeline preprocessing in Python."},
            {"time": "2:30 PM", "activity": "Fine-tuning models and optimizing inference latency for production."},
            {"time": "4:30 PM", "activity": "Collaborate with backend engineers to deploy models via APIs and Docker."},
        ],
        "pros": [
            "At the cutting edge of AI and technology innovation",
            "Top-tier compensation packages and global demand",
            "Solving problems that cannot be solved with traditional rule-based code",
        ],
        "cons": [
            "High mathematical and theoretical entry barrier (linear algebra, calculus, stats)",
            "Model training can be unpredictable; experiments often fail before succeeding",
        ],
        "learning_path": [
            "1. Strong programming in Python, NumPy, Pandas",
            "2. Math fundamentals (Linear Algebra, Probability, Calculus)",
            "3. Master PyTorch, Hugging Face, Scikit-Learn, and model deployment (FastAPI, Docker)",
        ],
        "growth_outlook": "Extremely High (AI revolution driving unprecedented hiring)",
    },
}


def _generate_default_extended(career: dict) -> dict:
    field = career.get("field", "General")
    if field in ("Technology", "Engineering"):
        salary = {"entry": "₹4.5 - ₹8 LPA", "mid": "₹12 - ₹20 LPA", "senior": "₹22 - ₹42+ LPA"}
    elif field in ("Business", "Finance"):
        salary = {"entry": "₹4.5 - ₹8 LPA", "mid": "₹11 - ₹19 LPA", "senior": "₹22 - ₹45+ LPA"}
    elif field in ("Design", "Media"):
        salary = {"entry": "₹3.5 - ₹6.5 LPA", "mid": "₹9 - ₹16 LPA", "senior": "₹18 - ₹32+ LPA"}
    else:
        salary = {"entry": "₹3.5 - ₹6 LPA", "mid": "₹8 - ₹15 LPA", "senior": "₹16 - ₹28+ LPA"}

    return {
        "salary_india": salary,
        "day_in_the_life": [
            {"time": "9:30 AM", "activity": f"Morning planning and reviewing priorities in {field}."},
            {"time": "11:00 AM", "activity": f"Core project work focusing on {', '.join(career.get('skills', [])[:2])}."},
            {"time": "2:30 PM", "activity": "Collaboration and status alignment with team members and stakeholders."},
            {"time": "4:30 PM", "activity": "Quality checks, documentation, and preparing deliverables."},
        ],
        "pros": [
            f"Strong relevance in the growing {field} sector",
            "Opportunity to master specialized, transferable domain skills",
            "Clear career advancement path from junior to leadership roles",
        ],
        "cons": [
            "Requires continuous commitment to skill upgrades and industry trends",
            "Balancing project deliverables with shifting priorities",
        ],
        "learning_path": [
            f"1. Build fundamental core knowledge in {career.get('skills', ['the domain'])[0]}",
            "2. Work on practical projects, internships, or open portfolio demonstrations",
            "3. Network with industry practitioners and acquire recognized certifications",
        ],
        "growth_outlook": "Healthy & Stable across domestic and multinational employers",
    }


def get_career_by_slug(slug: str) -> dict | None:
    career = next((c for c in CAREERS if c["slug"] == slug), None)
    if not career:
        return None
    ext = CAREER_EXTENDED_INFO.get(slug) or _generate_default_extended(career)
    return {**career, **ext}


def get_career_by_title(title: str) -> dict | None:
    career = next((c for c in CAREERS if c["title"].lower() == title.lower()), None)
    if not career:
        return None
    return get_career_by_slug(career["slug"])

