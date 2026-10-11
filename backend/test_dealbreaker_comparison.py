import os
import sys
import json

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(current_dir, ".env"))

import matcher
from main import _ai_career_match

matcher._load_engine()

# Base attributes held strictly constant
base_riasec = {
    "A": 92.0,
    "S": 60.0,
    "E": 45.0,
    "I": 35.0,
    "R": 25.0,
    "C": 10.0
}
base_interests = ["Music", "Performing Arts", "Creative Writing & Production"]
base_resume_skills = ["Singing", "Music Composition", "Creative Writing"]
base_core_values = ["Creativity", "Self-expression", "Artistic freedom"]
base_energy_flow = "Singing, composing music, and expressing emotion creatively"

# Profile A: NO paperwork dealbreaker
profile_a = {
    "riasec_scores": base_riasec,
    "code": "ASE",
    "interests": base_interests,
    "strengths_note": "I enjoy singing, creating music, and expressing myself creatively. I prefer creative work.",
    "resume_skills": base_resume_skills,
    "know_me": {
        "deal_breakers": [],
        "core_values": base_core_values,
        "energy_flow": base_energy_flow
    }
}

# Profile B: WITH paperwork dealbreaker
profile_b = {
    "riasec_scores": base_riasec,
    "code": "ASE",
    "interests": base_interests,
    "strengths_note": "I enjoy singing, creating music, and expressing myself creatively. I dislike repetitive paperwork and prefer creative work.",
    "resume_skills": base_resume_skills,
    "know_me": {
        "deal_breakers": ["repetitive paperwork", "monotonous paperwork"],
        "core_values": base_core_values,
        "energy_flow": base_energy_flow
    }
}

import time

def run_ai_match_with_retry(profile, max_retries=3, delay=15):
    for attempt in range(1, max_retries + 1):
        res = _ai_career_match(profile)
        if res is not None:
            return res
        print(f"Attempt {attempt} returned None (likely TPM rate limit). Waiting {delay}s before retry...")
        time.sleep(delay)
    return None

print("Running Retrieval & LLM for Profile A (No dealbreaker)...")
retrieval_a = matcher.hybrid_career_match(
    riasec_scores=profile_a["riasec_scores"],
    interests=profile_a["interests"],
    resume_skills=profile_a["resume_skills"],
    know_me=profile_a["know_me"],
    free_text=profile_a["strengths_note"],
    limit=15
)
llm_top_5_a = run_ai_match_with_retry(profile_a)

print("Waiting 15 seconds for TPM rate limit cooldown...")
time.sleep(15)

print("Running Retrieval & LLM for Profile B (With paperwork dealbreaker)...")
retrieval_b = matcher.hybrid_career_match(
    riasec_scores=profile_b["riasec_scores"],
    interests=profile_b["interests"],
    resume_skills=profile_b["resume_skills"],
    know_me=profile_b["know_me"],
    free_text=profile_b["strengths_note"],
    limit=15
)
llm_top_5_b = run_ai_match_with_retry(profile_b)

results = {
    "profile_a": {
        "retrieval_top_15": [
            {
                "baseline_rank": idx,
                "title": c["title"],
                "score": round(float(c.get("score", 0)), 4),
                "riasec": c.get("riasec_code")
            }
            for idx, c in enumerate(retrieval_a, start=1)
        ],
        "final_top_5": llm_top_5_a
    },
    "profile_b": {
        "retrieval_top_15": [
            {
                "baseline_rank": idx,
                "title": c["title"],
                "score": round(float(c.get("score", 0)), 4),
                "riasec": c.get("riasec_code")
            }
            for idx, c in enumerate(retrieval_b, start=1)
        ],
        "final_top_5": llm_top_5_b
    }
}

with open("dealbreaker_experiment_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("Saved dealbreaker_experiment_results.json successfully.")
