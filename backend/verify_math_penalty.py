import os
import sys

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

import matcher
matcher._load_engine()

base_riasec = {
    "A": 92.0, "S": 60.0, "E": 45.0, "I": 35.0, "R": 25.0, "C": 10.0
}
base_interests = ["Music", "Performing Arts", "Creative Writing & Production"]
base_resume_skills = ["Singing", "Music Composition", "Creative Writing"]
base_free_text = "I enjoy singing, creating music, and expressing myself creatively. I prefer creative work."
base_know_me = {
    "core_values": ["Creativity", "Self-expression", "Artistic freedom"],
    "energy_flow": "Singing, composing music, and expressing emotion creatively"
}

# Profile A: NO dealbreakers
know_me_a = dict(base_know_me)
know_me_a["deal_breakers"] = []

# Profile B: WITH paperwork dealbreaker
know_me_b = dict(base_know_me)
know_me_b["deal_breakers"] = ["repetitive paperwork"]

# Profile C (dealbreaker removed to test reversibility):
know_me_c = dict(base_know_me)
know_me_c["deal_breakers"] = []

# Run hybrid_career_match with limit=1016 to get all careers
res_a = matcher.hybrid_career_match(
    riasec_scores=base_riasec,
    interests=base_interests,
    resume_skills=base_resume_skills,
    know_me=know_me_a,
    free_text=base_free_text,
    limit=1016
)

res_b = matcher.hybrid_career_match(
    riasec_scores=base_riasec,
    interests=base_interests,
    resume_skills=base_resume_skills,
    know_me=know_me_b,
    free_text=base_free_text,
    limit=1016
)

res_c = matcher.hybrid_career_match(
    riasec_scores=base_riasec,
    interests=base_interests,
    resume_skills=base_resume_skills,
    know_me=know_me_c,
    free_text=base_free_text,
    limit=1016
)

def get_career_details(res, title):
    for rank, c in enumerate(res, start=1):
        if c["title"].lower() == title.lower():
            return {
                "rank": rank,
                "score": float(c["score"]),
                "fit_percent": c.get("fit")
            }
    return None

test_titles = [
    "Data Entry Keyers",
    "Office Clerks, General",
    "Word Processors and Typists",
    "Musicians and Singers"  # Control (should not have penalty)
]

print("=" * 85)
print("MATHEMATICAL VERIFICATION OF DEALBREAKER PENALTY")
print("=" * 85)
print(f"{'Career Title':<30} | {'Score A (No DB)':<16} | {'Score B (With DB)':<17} | {'Diff (B - A)':<14} | {'Score C (Removed)':<16}")
print("-" * 105)

for t in test_titles:
    info_a = get_career_details(res_a, t)
    info_b = get_career_details(res_b, t)
    info_c = get_career_details(res_c, t)
    
    score_a = info_a["score"]
    score_b = info_b["score"]
    score_c = info_c["score"]
    diff = score_b - score_a
    
    print(f"{t:<30} | {score_a:.6f} (Rank #{info_a['rank']}) | {score_b:.6f} (Rank #{info_b['rank']}) | {diff:+.6f}     | {score_c:.6f} (Rank #{info_c['rank']})")

print("=" * 85)
