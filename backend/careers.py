"""Career taxonomy + a deterministic RIASEC matcher.

This list is the single source of truth for career suggestions: it constrains
what the AI matcher is allowed to return, and it powers the rule-based
fallback when the AI is unavailable.
"""

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

CAREER_TITLES = [c["title"] for c in CAREERS]
_TITLE_SET = set(CAREER_TITLES)

# rank weight for the user's 1st / 2nd / 3rd strongest dimension
_RANK_WEIGHT = [3, 2, 1]


def _expand_code(code: str) -> str:
    from riasec import DIM_LABEL

    return ", ".join(DIM_LABEL[c] for c in code if c in DIM_LABEL)


_MAX_RAW_MATCH = 3 + 2 + 1 + 2 + 1 + 1  # membership + positional + interest


def fallback_match(scores: dict, interests=None, limit: int = 5) -> list:
    """Rule-based match: overlap between the user's top dimensions and each
    career's Holland code, weighted by position and boosted by declared
    interests."""
    dims = sorted(scores, key=lambda d: -scores[d])
    top = dims[:3]
    weight = {d: _RANK_WEIGHT[i] for i, d in enumerate(top)}

    interest_fields = _interest_fields(interests or [])

    ranked = []
    for career in CAREERS:
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
