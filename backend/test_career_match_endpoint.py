import os
import sys
import json
import time

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(current_dir, ".env"))

import matcher
matcher._load_engine()

from main import app, _ai_client
from fastapi.testclient import TestClient

client = TestClient(app)

base_riasec = {
    "A": 92.0, "S": 60.0, "E": 45.0, "I": 35.0, "R": 25.0, "C": 10.0
}
base_interests = ["Music", "Performing Arts", "Creative Writing & Production"]
base_resume_skills = ["Singing", "Music Composition", "Creative Writing"]
base_strengths = "I enjoy singing, creating music, and expressing myself creatively. I prefer creative work."
base_know_me = {
    "core_values": ["Creativity", "Self-expression", "Artistic freedom"],
    "energy_flow": "Singing, composing music, and expressing emotion creatively"
}

# Profile A: NO dealbreakers
payload_a = {
    "riasec_scores": base_riasec,
    "code": "ASE",
    "interests": base_interests,
    "resume_skills": base_resume_skills,
    "strengths_note": base_strengths,
    "know_me": {
        "deal_breakers": [],
        "core_values": base_know_me["core_values"],
        "energy_flow": base_know_me["energy_flow"]
    }
}

# Profile B: Identical, but deal_breakers = ["repetitive paperwork"]
payload_b = {
    "riasec_scores": base_riasec,
    "code": "ASE",
    "interests": base_interests,
    "resume_skills": base_resume_skills,
    "strengths_note": base_strengths,
    "know_me": {
        "deal_breakers": ["repetitive paperwork"],
        "core_values": base_know_me["core_values"],
        "energy_flow": base_know_me["energy_flow"]
    }
}

# Capture ground-truth Top 15 candidate lists from hybrid_career_match()
candidates_a = matcher.hybrid_career_match(
    riasec_scores=payload_a["riasec_scores"],
    interests=payload_a["interests"],
    resume_skills=payload_a["resume_skills"],
    know_me=payload_a["know_me"],
    free_text=payload_a["strengths_note"],
    limit=15
)

candidates_b = matcher.hybrid_career_match(
    riasec_scores=payload_b["riasec_scores"],
    interests=payload_b["interests"],
    resume_skills=payload_b["resume_skills"],
    know_me=payload_b["know_me"],
    free_text=payload_b["strengths_note"],
    limit=15
)

def send_request_with_retry(payload, label, max_retries=3, delay=15):
    for attempt in range(1, max_retries + 1):
        print(f"[{label}] Sending request (attempt {attempt})...")
        resp = client.post("/api/career-match", json=payload)
        data = resp.json()
        print(f"[{label}] Response status: {resp.status_code}, source: {data.get('source')}")
        
        # If AI was enabled and didn't fall back, or if it's hybrid/rule intentional
        if data.get("source") == "ai":
            return data
        
        # If fallback occurred due to rate limiting, retry after cooldown
        print(f"[{label}] Source is '{data.get('source')}'. Waiting {delay}s to retry for AI mode...")
        time.sleep(delay)
    return data

print("=" * 80)
print("TESTING POST /api/career-match FOR PROFILE A AND PROFILE B")
print("=" * 80)

# Profile A
resp_a = send_request_with_retry(payload_a, "Profile A")

print("\nWaiting 20 seconds for Groq rate limit cooldown before Profile B...")
time.sleep(20)

# Profile B
resp_b = send_request_with_retry(payload_b, "Profile B")

output_summary = {
    "profile_a": {
        "payload": payload_a,
        "ground_truth_candidates_top15": [
            {"rank": idx, "title": c["title"], "score": round(float(c.get("score", 0)), 4)}
            for idx, c in enumerate(candidates_a, start=1)
        ],
        "response": resp_a
    },
    "profile_b": {
        "payload": payload_b,
        "ground_truth_candidates_top15": [
            {"rank": idx, "title": c["title"], "score": round(float(c.get("score", 0)), 4)}
            for idx, c in enumerate(candidates_b, start=1)
        ],
        "response": resp_b
    }
}

with open("endpoint_validation_results.json", "w", encoding="utf-8") as f:
    json.dump(output_summary, f, indent=2, ensure_ascii=False)

print("\nEndpoint testing complete. Results saved to endpoint_validation_results.json")
