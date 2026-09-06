"""RIASEC (Holland Codes) career-interest assessment.

Deterministic scoring — no AI. Six dimensions:
  R Realistic, I Investigative, A Artistic, S Social, E Enterprising, C Conventional
"""

# Each item is a short activity statement the user rates:
#   0 = would dislike, 1 = neutral, 2 = would like
RIASEC_QUESTIONS = [
    {"id": "r1", "dim": "R", "text": "Build or repair things with tools and machines"},
    {"id": "r2", "dim": "R", "text": "Do practical, hands-on work with visible results"},
    {"id": "r3", "dim": "R", "text": "Assemble or operate mechanical or electronic equipment"},
    {"id": "r4", "dim": "R", "text": "Work outdoors or on your feet rather than at a desk"},

    {"id": "i1", "dim": "I", "text": "Analyze data to find patterns and explanations"},
    {"id": "i2", "dim": "I", "text": "Research how something works in depth"},
    {"id": "i3", "dim": "I", "text": "Solve abstract, logical, or mathematical problems"},
    {"id": "i4", "dim": "I", "text": "Design experiments and test ideas"},

    {"id": "a1", "dim": "A", "text": "Create original designs, art, or writing"},
    {"id": "a2", "dim": "A", "text": "Express ideas through visuals, music, or words"},
    {"id": "a3", "dim": "A", "text": "Work without fixed rules or routines"},
    {"id": "a4", "dim": "A", "text": "Imagine new concepts and possibilities"},

    {"id": "s1", "dim": "S", "text": "Teach or explain things to other people"},
    {"id": "s2", "dim": "S", "text": "Help people work through their problems"},
    {"id": "s3", "dim": "S", "text": "Work closely in a team toward a shared goal"},
    {"id": "s4", "dim": "S", "text": "Support or mentor someone one-on-one"},

    {"id": "e1", "dim": "E", "text": "Lead a team or run a project"},
    {"id": "e2", "dim": "E", "text": "Persuade or sell an idea to others"},
    {"id": "e3", "dim": "E", "text": "Start a new venture or initiative"},
    {"id": "e4", "dim": "E", "text": "Make decisions under pressure and take calculated risks"},

    {"id": "c1", "dim": "C", "text": "Organize information into clear, tidy systems"},
    {"id": "c2", "dim": "C", "text": "Work with detailed records, numbers, or spreadsheets"},
    {"id": "c3", "dim": "C", "text": "Follow well-defined procedures precisely"},
    {"id": "c4", "dim": "C", "text": "Keep work structured, scheduled, and orderly"},
]

DIMS = ["R", "I", "A", "S", "E", "C"]
DIM_LABEL = {
    "R": "Realistic",
    "I": "Investigative",
    "A": "Artistic",
    "S": "Social",
    "E": "Enterprising",
    "C": "Conventional",
}

_ITEMS_PER_DIM = sum(1 for q in RIASEC_QUESTIONS if q["dim"] == "R")
_MAX_RAW = _ITEMS_PER_DIM * 2  # highest possible score per dimension


def score_riasec(answers: dict) -> dict:
    """answers: {item_id: 0|1|2}. Returns {scores: {dim: 0-100}, code: 'XYZ'}."""
    raw = {d: 0 for d in DIMS}
    for q in RIASEC_QUESTIONS:
        val = answers.get(q["id"])
        if isinstance(val, (int, float)) and 0 <= val <= 2:
            raw[q["dim"]] += int(val)

    scores = {d: round(raw[d] / _MAX_RAW * 100) for d in DIMS}
    # Holland code = the three highest dimensions, ties broken by RIASEC order.
    order = sorted(DIMS, key=lambda d: (-scores[d], DIMS.index(d)))
    code = "".join(order[:3])
    return {"scores": scores, "code": code}
