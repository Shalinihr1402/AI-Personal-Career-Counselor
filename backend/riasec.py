"""Career Discovery Assessment & RIASEC (Holland Codes) scoring engine.

Features:
1. 12 Scenario-Based Multiple-Choice Questions covering the broad range of occupations
   in the O*NET dataset (Technology, Science, Healthcare, Trades, Arts, Public Service, Business, etc.).
2. Deterministic scoring aggregating evidence into RIASEC dimensions (R, I, A, S, E, C)
   and canonical O*NET occupational field affinities.
3. 100% backwards compatibility with legacy rating items and scores.
"""

DIMS = ["R", "I", "A", "S", "E", "C"]
DIM_LABEL = {
    "R": "Realistic",
    "I": "Investigative",
    "A": "Artistic",
    "S": "Social",
    "E": "Enterprising",
    "C": "Conventional",
}

# --------------------------------------------------------------------------- #
# 12 Engaging Scenario-Based Discovery Questions (4 options each)
# Balanced: Each Holland dimension appears exactly 8 times across the 48 options.
# --------------------------------------------------------------------------- #
SCENARIO_QUESTIONS = [
    {
        "id": "q1",
        "scenario": "Your college or local community is hosting a large weekend festival or exhibition. Which responsibility would you naturally choose?",
        "options": [
            {
                "id": "a",
                "text": "Designing visual posters, stage aesthetics, and creative media displays.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            },
            {
                "id": "b",
                "text": "Setting up sound gear, wiring, equipment booths, and lighting fixtures.",
                "dim": "R",
                "fields": ["Construction & Trades", "Installation & Maintenance"]
            },
            {
                "id": "c",
                "text": "Managing schedule timetables, budget logs, and coordinating vendor deliveries.",
                "dim": "C",
                "fields": ["Operations & Administration", "Business, Management & Finance"]
            },
            {
                "id": "d",
                "text": "Welcoming guests, guiding attendees, and ensuring everyone feels supported.",
                "dim": "S",
                "fields": ["Hospitality & Food Services", "Community & Social Services"]
            }
        ]
    },
    {
        "id": "q2",
        "scenario": "A tool, machine, or operational process breaks down right before an important deadline. What is your first instinct?",
        "options": [
            {
                "id": "a",
                "text": "Disassemble the physical components or inspect the mechanism hands-on to find what jammed.",
                "dim": "R",
                "fields": ["Engineering & Architecture", "Installation & Maintenance"]
            },
            {
                "id": "b",
                "text": "Analyze error patterns, logs, or diagnostic data to isolate the root cause scientifically.",
                "dim": "I",
                "fields": ["Data & AI", "Physical & Life Sciences"]
            },
            {
                "id": "c",
                "text": "Reassure affected people, communicate updates clearly, and support anyone under stress.",
                "dim": "S",
                "fields": ["Healthcare & Medicine", "Community & Social Services"]
            },
            {
                "id": "d",
                "text": "Rally the team, reallocate resources, and negotiate an updated action plan with leaders.",
                "dim": "E",
                "fields": ["Business, Management & Finance", "Operations & Administration"]
            }
        ]
    },
    {
        "id": "q3",
        "scenario": "You are given two free weeks and full support to work on any project you choose. What would you create or explore?",
        "options": [
            {
                "id": "a",
                "text": "Produce an original creative work—such as a digital artwork series, video short, or music track.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            },
            {
                "id": "b",
                "text": "Conduct an in-depth investigation or experiment on renewable energy, ecosystems, or biology.",
                "dim": "I",
                "fields": ["Physical & Life Sciences", "Agriculture & Natural Resources"]
            },
            {
                "id": "c",
                "text": "Build or modify a physical gadget, mechanical apparatus, or custom craftwork with your hands.",
                "dim": "R",
                "fields": ["Engineering & Architecture", "Manufacturing & Production"]
            },
            {
                "id": "d",
                "text": "Launch a mini-venture or online initiative to market a product concept and acquire customers.",
                "dim": "E",
                "fields": ["Sales & Business Development", "Business, Management & Finance"]
            }
        ]
    },
    {
        "id": "q4",
        "scenario": "Imagine your ideal day-to-day work environment. Where do you feel most energized and in your element?",
        "options": [
            {
                "id": "a",
                "text": "Outdoors, in a workshop, or on-site working with physical materials, nature, or machinery.",
                "dim": "R",
                "fields": ["Agriculture & Natural Resources", "Construction & Trades"]
            },
            {
                "id": "b",
                "text": "In a quiet lab, study room, or research environment examining data models and discoveries.",
                "dim": "I",
                "fields": ["Physical & Life Sciences", "Data & AI"]
            },
            {
                "id": "c",
                "text": "In a lively, people-centered setting—like a clinic, school, or community center assisting individuals.",
                "dim": "S",
                "fields": ["Healthcare & Medicine", "Education & Training"]
            },
            {
                "id": "d",
                "text": "In a structured, organized office setting managing clear schedules, workflows, and records.",
                "dim": "C",
                "fields": ["Operations & Administration", "Business, Management & Finance"]
            }
        ]
    },
    {
        "id": "q5",
        "scenario": "At the completion of a major milestone, which type of achievement gives you the deepest satisfaction?",
        "options": [
            {
                "id": "a",
                "text": "Knowing you taught, counseled, or cared for someone and helped them grow.",
                "dim": "S",
                "fields": ["Healthcare & Medicine", "Education & Training"]
            },
            {
                "id": "b",
                "text": "Stepping back to inspect a tangible physical structure, machine, or crafted build you completed.",
                "dim": "R",
                "fields": ["Construction & Trades", "Engineering & Architecture"]
            },
            {
                "id": "c",
                "text": "Solving a difficult theoretical mystery, proving a hypothesis, or unearthing new findings.",
                "dim": "I",
                "fields": ["Physical & Life Sciences", "Data & AI"]
            },
            {
                "id": "d",
                "text": "Achieving an ambitious growth goal, closing an agreement, or leading a venture to victory.",
                "dim": "E",
                "fields": ["Business, Management & Finance", "Sales & Business Development"]
            }
        ]
    },
    {
        "id": "q6",
        "scenario": "Your neighborhood is forming teams to improve community life. Which project group would you join?",
        "options": [
            {
                "id": "a",
                "text": "The civic advocacy and safety committee ensuring consumer protection, fair rules, and citizen rights.",
                "dim": "E",
                "fields": ["Law & Public Policy", "Protective & Security Services"]
            },
            {
                "id": "b",
                "text": "The public arts and cultural committee painting murals, designing public spaces, and organizing performances.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            },
            {
                "id": "c",
                "text": "The municipal planning and logistics team managing supply registries, transport tracking, and schedules.",
                "dim": "C",
                "fields": ["Facilities & Operations", "Operations & Administration"]
            },
            {
                "id": "d",
                "text": "The environmental science taskforce testing water purity, urban heat islands, and sustainable waste models.",
                "dim": "I",
                "fields": ["Physical & Life Sciences", "Agriculture & Natural Resources"]
            }
        ]
    },
    {
        "id": "q7",
        "scenario": "You are given a disorganized collection of survey responses, records, or inventory. How do you approach it?",
        "options": [
            {
                "id": "a",
                "text": "Build an organized spreadsheet, database, or indexing system where every item is verified.",
                "dim": "C",
                "fields": ["Operations & Administration", "Data & AI"]
            },
            {
                "id": "b",
                "text": "Examine the entries like a detective to discover hidden anomalies, correlations, and root patterns.",
                "dim": "I",
                "fields": ["Physical & Life Sciences", "Law & Public Policy"]
            },
            {
                "id": "c",
                "text": "Synthesize the takeaways into an engaging visual infographic, story, or dynamic presentation.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            },
            {
                "id": "d",
                "text": "Identify the commercial opportunities and pitch strategic recommendations to stakeholders.",
                "dim": "E",
                "fields": ["Business, Management & Finance", "Sales & Business Development"]
            }
        ]
    },
    {
        "id": "q8",
        "scenario": "When picking up an unfamiliar skill or subject, what approach helps you master it most effectively?",
        "options": [
            {
                "id": "a",
                "text": "Hands-on trial—working directly with tools, equipment, or physical parts to see how they behave.",
                "dim": "R",
                "fields": ["Construction & Trades", "Installation & Maintenance"]
            },
            {
                "id": "b",
                "text": "Reading foundational textbooks, studying experimental evidence, and mapping the core logic.",
                "dim": "I",
                "fields": ["Physical & Life Sciences", "Data & AI"]
            },
            {
                "id": "c",
                "text": "Discussing concepts with peers, asking questions, and explaining ideas to someone else.",
                "dim": "S",
                "fields": ["Education & Training", "Community & Social Services"]
            },
            {
                "id": "d",
                "text": "Experimenting with creative variations, sketching ideas, or improvising custom interpretations.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            }
        ]
    },
    {
        "id": "q9",
        "scenario": "During a busy event or operational launch, an unexpected rush of attendees arrives. What role do you naturally assume?",
        "options": [
            {
                "id": "a",
                "text": "Take charge to direct crowd flow, establish priorities, and make rapid executive decisions.",
                "dim": "E",
                "fields": ["Protective & Security Services", "Business, Management & Finance"]
            },
            {
                "id": "b",
                "text": "Greet attendees warmly, handle individual concerns, and ensure visitors feel comfortable and valued.",
                "dim": "S",
                "fields": ["Hospitality & Food Services", "Personal Care & Services"]
            },
            {
                "id": "c",
                "text": "Oversee the register, tickets, or distribution logs to guarantee every count balances perfectly.",
                "dim": "C",
                "fields": ["Operations & Administration", "Business, Management & Finance"]
            },
            {
                "id": "d",
                "text": "Capture real-time highlights, document attendee reactions, and produce engaging event stories.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            }
        ]
    },
    {
        "id": "q10",
        "scenario": "You are invited to assist at a regional wildlife and environmental preserve. Which activity sounds most appealing?",
        "options": [
            {
                "id": "a",
                "text": "Tracking wildlife movements, monitoring water/soil chemistry, and recording ecological data.",
                "dim": "I",
                "fields": ["Physical & Life Sciences", "Agriculture & Natural Resources"]
            },
            {
                "id": "b",
                "text": "Restoring physical hiking paths, planting native saplings, and operating trail maintenance tools.",
                "dim": "R",
                "fields": ["Agriculture & Natural Resources", "Construction & Trades"]
            },
            {
                "id": "c",
                "text": "Maintaining visitor registries, preserve mapping databases, and conservation supply inventories.",
                "dim": "C",
                "fields": ["Facilities & Operations", "Operations & Administration"]
            },
            {
                "id": "d",
                "text": "Creating wildlife photography, conservation brochures, or visual exhibits to educate the public.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            }
        ]
    },
    {
        "id": "q11",
        "scenario": "When collaborating with a group on a multi-week project, which contribution feels most natural to you?",
        "options": [
            {
                "id": "a",
                "text": "Generating original concepts, designing visual layouts, and keeping the presentation compelling.",
                "dim": "A",
                "fields": ["Arts, Design & Media"]
            },
            {
                "id": "b",
                "text": "Setting up milestones, formatting shared documents, and ensuring quality standards are met.",
                "dim": "C",
                "fields": ["Operations & Administration", "Business, Management & Finance"]
            },
            {
                "id": "c",
                "text": "Checking in on teammates, fostering open communication, and resolving misunderstandings.",
                "dim": "S",
                "fields": ["Community & Social Services", "Healthcare & Medicine"]
            },
            {
                "id": "d",
                "text": "Presenting the project pitch to judges or clients and rallying enthusiasm for the mission.",
                "dim": "E",
                "fields": ["Sales & Business Development", "Law & Public Policy"]
            }
        ]
    },
    {
        "id": "q12",
        "scenario": "If you could lead a major initiative to modernize public services, where would you focus your efforts?",
        "options": [
            {
                "id": "a",
                "text": "Expanding healthcare access, community counseling, and specialized therapy programs.",
                "dim": "S",
                "fields": ["Healthcare & Medicine", "Community & Social Services"]
            },
            {
                "id": "b",
                "text": "Strengthening consumer protection laws, ethical governance, and public safety enforcement.",
                "dim": "E",
                "fields": ["Law & Public Policy", "Protective & Security Services"]
            },
            {
                "id": "c",
                "text": "Streamlining public agency records, budget oversight, and transparent civic administration.",
                "dim": "C",
                "fields": ["Operations & Administration", "Business, Management & Finance"]
            },
            {
                "id": "d",
                "text": "Upgrading physical transport networks, clean energy grids, and water treatment infrastructure.",
                "dim": "R",
                "fields": ["Engineering & Architecture", "Facilities & Operations"]
            }
        ]
    }
]

# Quick lookup map for scenarios and options
SCENARIO_MAP = {q["id"]: {opt["id"]: opt for opt in q["options"]} for q in SCENARIO_QUESTIONS}

# --------------------------------------------------------------------------- #
# Legacy 24-item RIASEC rating questions (Preserved for backwards compatibility)
# --------------------------------------------------------------------------- #
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

_ITEMS_PER_DIM = 4
_MAX_RAW_LEGACY = _ITEMS_PER_DIM * 2  # 8


def score_riasec(answers: dict) -> dict:
    """Deterministic scoring engine supporting both scenario-based and legacy assessments.
    
    1. Scenario answers: {"q1": "a", "q2": "c", ...}
       Returns:
         - scores: {R, I, A, S, E, C} scaled 0-100
         - code: Top 3-letter Holland code (e.g. "AIC")
         - top_fields: Top 4 O*NET occupational fields
         - field_scores: Full mapping of occupational field points
    2. Legacy answers: {"r1": 2, "i2": 1, ...}
       Returns:
         - scores: {R, I, A, S, E, C} scaled 0-100
         - code: Top 3-letter Holland code
    """
    if not answers:
        return {
            "scores": {d: 50 for d in DIMS},
            "code": "RIA",
            "top_fields": [],
            "field_scores": {}
        }

    # Detect if answers are scenario-based (keys starting with 'q')
    is_scenario = any(k.startswith("q") for k in answers.keys())

    if is_scenario:
        raw = {d: 0 for d in DIMS}
        field_points = {}

        for q_id, opt_id in answers.items():
            q_map = SCENARIO_MAP.get(q_id)
            if not q_map:
                continue
            opt = q_map.get(str(opt_id).lower())
            if not opt:
                continue

            # Primary Holland dimension weight (+3)
            raw[opt["dim"]] += 3
            if opt.get("secondary_dim"):
                raw[opt["secondary_dim"]] += 1

            # O*NET Occupational Field weights (+2)
            for field in opt.get("fields", []):
                field_points[field] = field_points.get(field, 0) + 2

        # Max raw primary score per dimension across 8 appearances is 8 * 3 = 24
        scores = {d: min(100, round((raw[d] / 24.0) * 100)) for d in DIMS}

        # Holland code = three highest dimensions, ties broken by RIASEC order
        order = sorted(DIMS, key=lambda d: (-scores[d], DIMS.index(d)))
        code = "".join(order[:3])

        # Top ranked O*NET occupational fields
        sorted_fields = sorted(field_points.items(), key=lambda x: x[1], reverse=True)
        top_fields = [f[0] for f in sorted_fields[:4]]

        return {
            "scores": scores,
            "code": code,
            "top_fields": top_fields,
            "field_scores": dict(sorted_fields)
        }

    # Fallback to legacy 24-item rating scoring
    raw = {d: 0 for d in DIMS}
    for q in RIASEC_QUESTIONS:
        val = answers.get(q["id"])
        if isinstance(val, (int, float)) and 0 <= val <= 2:
            raw[q["dim"]] += int(val)

    scores = {d: round(raw[d] / _MAX_RAW_LEGACY * 100) for d in DIMS}
    order = sorted(DIMS, key=lambda d: (-scores[d], DIMS.index(d)))
    code = "".join(order[:3])
    return {
        "scores": scores,
        "code": code,
        "top_fields": [],
        "field_scores": {}
    }
