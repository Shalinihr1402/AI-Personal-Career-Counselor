import os
import sys
import json

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure we are in backend dir context
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(current_dir, ".env"))

import matcher
from main import _ai_career_match

# 1. Define the test profile based on user's exact specification:
# "I enjoy singing, creating music, and expressing myself creatively. I dislike repetitive paperwork and prefer creative work."
profile = {
    "riasec_scores": {
        "A": 92.0,  # Artistic dominant
        "S": 60.0,  # Social
        "E": 45.0,  # Enterprising
        "I": 35.0,  # Investigative
        "R": 25.0,  # Realistic
        "C": 10.0   # Conventional (strongly low due to disliking repetitive paperwork)
    },
    "code": "ASE",
    "interests": ["Music", "Performing Arts", "Creative Writing & Production"],
    "strengths_note": "I enjoy singing, creating music, and expressing myself creatively. I dislike repetitive paperwork and prefer creative work.",
    "resume_skills": ["Singing", "Music Composition", "Creative Writing"],
    "know_me": {
        "deal_breakers": ["monotonous paperwork", "repetitive paperwork"],
        "core_values": ["Creativity", "Self-expression", "Artistic freedom"],
        "energy_flow": "Singing, composing music, and expressing emotion creatively"
    }
}

print("=" * 80)
print("RUNNING MATCHER EXPERIMENT")
print("Profile strengths_note:", profile["strengths_note"])
print("RIASEC:", profile["riasec_scores"])
print("=" * 80)

# Step 1: Run hybrid_career_match directly to get the original Top 15
matcher._load_engine()
original_top_15 = matcher.hybrid_career_match(
    riasec_scores=profile["riasec_scores"],
    interests=profile["interests"],
    resume_skills=profile["resume_skills"],
    know_me=profile["know_me"],
    free_text=profile["strengths_note"],
    limit=15
)

# Step 2: Run _ai_career_match to get final top 5
final_top_5 = _ai_career_match(profile)

result_data = {
    "original_top_15": [
        {
            "baseline_rank": idx,
            "title": c["title"],
            "field": c.get("field"),
            "riasec_code": c.get("riasec_code"),
            "score": round(float(c.get("score", 0)), 4),
            "key_skills": c.get("key_skills", []),
            "day_to_day": c.get("day_to_day", "")
        }
        for idx, c in enumerate(original_top_15, start=1)
    ],
    "final_top_5": final_top_5
}

with open("experiment_results.json", "w", encoding="utf-8") as f:
    json.dump(result_data, f, indent=2, ensure_ascii=False)

print("\n--- ORIGINAL TOP 15 FROM hybrid_career_match() ---")
for idx, c in enumerate(original_top_15, start=1):
    print(f"{idx:2d}. {c['title']} | Field: {c.get('field')} | RIASEC: {c.get('riasec_code')} | Score: {c.get('score'):.4f}")

print("\n--- FINAL TOP 5 FROM _ai_career_match() ---")
if final_top_5:
    for idx, c in enumerate(final_top_5, start=1):
        print(f"\nFinal Rank {idx}:")
        print(f"  Title: {c.get('title')}")
        print(f"  Baseline Rank: {c.get('baseline_rank')}")
        print(f"  Field: {c.get('field')}")
        print(f"  Why it fits: {c.get('why_it_fits')}")
        print(f"  Day-to-day: {c.get('day_to_day')}")
        print(f"  Key Skills: {c.get('key_skills')}")
        print(f"  Watch outs: {c.get('watch_outs')}")
        print(f"  Reranking reason: {c.get('reranking_reason')}")
else:
    print("None returned by _ai_career_match()!")
