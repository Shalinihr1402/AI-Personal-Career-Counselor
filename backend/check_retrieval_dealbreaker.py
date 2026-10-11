import os
import sys
import json

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

import matcher
matcher._load_engine()

target_careers = [
    "Musicians and Singers",
    "Poets, Lyricists and Creative Writers",
    "Music Directors and Composers",
    "Actors",
    "Writers and Authors"
]

base_riasec = {
    "A": 92.0, "S": 60.0, "E": 45.0, "I": 35.0, "R": 25.0, "C": 10.0
}
base_interests = ["Music", "Performing Arts", "Creative Writing & Production"]
base_resume_skills = ["Singing", "Music Composition", "Creative Writing"]
base_core_values = ["Creativity", "Self-expression", "Artistic freedom"]
base_energy_flow = "Singing, composing music, and expressing emotion creatively"

# STRICT TEST: ALL fields 100% identical except know_me["deal_breakers"]
free_text_identical = "I enjoy singing, creating music, and expressing myself creatively. I prefer creative work."

# Profile A: No dealbreaker
profile_a = {
    "riasec_scores": base_riasec,
    "interests": base_interests,
    "resume_skills": base_resume_skills,
    "free_text": free_text_identical,
    "know_me": {
        "deal_breakers": [],
        "core_values": base_core_values,
        "energy_flow": base_energy_flow
    }
}

# Profile B: Exactly "repetitive paperwork" as dealbreaker
profile_b = {
    "riasec_scores": base_riasec,
    "interests": base_interests,
    "resume_skills": base_resume_skills,
    "free_text": free_text_identical,
    "know_me": {
        "deal_breakers": ["repetitive paperwork"],
        "core_values": base_core_values,
        "energy_flow": base_energy_flow
    }
}

res_a = matcher.hybrid_career_match(
    riasec_scores=profile_a["riasec_scores"],
    interests=profile_a["interests"],
    resume_skills=profile_a["resume_skills"],
    know_me=profile_a["know_me"],
    free_text=profile_a["free_text"],
    limit=1016 # Get all so we can locate any rank
)

res_b = matcher.hybrid_career_match(
    riasec_scores=profile_b["riasec_scores"],
    interests=profile_b["interests"],
    resume_skills=profile_b["resume_skills"],
    know_me=profile_b["know_me"],
    free_text=profile_b["free_text"],
    limit=1016
)

def find_career_stats(results_list, titles):
    found = {}
    for rank, c in enumerate(results_list, start=1):
        if c["title"] in titles:
            found[c["title"]] = {
                "rank": rank,
                "score": round(float(c.get("score", 0)), 4)
            }
    return found

stats_a = find_career_stats(res_a, target_careers)
stats_b = find_career_stats(res_b, target_careers)

print("=" * 70)
print("EXPERIMENT 1: Strictly holding free_text identical")
print(f"Profile A: deal_breakers = {profile_a['know_me']['deal_breakers']}")
print(f"Profile B: deal_breakers = {profile_b['know_me']['deal_breakers']}")
print("=" * 70)
print(f"{'Career Title':<40} | {'Profile A (Rank / Score)':<25} | {'Profile B (Rank / Score)':<25}")
print("-" * 95)
for title in target_careers:
    a_info = f"#{stats_a[title]['rank']} ({stats_a[title]['score']:.4f})"
    b_info = f"#{stats_b[title]['rank']} ({stats_b[title]['score']:.4f})"
    print(f"{title:<40} | {a_info:<25} | {b_info:<25}")


# EXPERIMENT 2: When free_text in Profile B ALSO includes "I dislike repetitive paperwork..."
profile_b_with_freetext = dict(profile_b)
profile_b_with_freetext["free_text"] = "I enjoy singing, creating music, and expressing myself creatively. I dislike repetitive paperwork and prefer creative work."

res_b_freetext = matcher.hybrid_career_match(
    riasec_scores=profile_b_with_freetext["riasec_scores"],
    interests=profile_b_with_freetext["interests"],
    resume_skills=profile_b_with_freetext["resume_skills"],
    know_me=profile_b_with_freetext["know_me"],
    free_text=profile_b_with_freetext["free_text"],
    limit=1016
)
stats_b_freetext = find_career_stats(res_b_freetext, target_careers)

print("\n" + "=" * 70)
print("EXPERIMENT 2: When free_text in Profile B also mentions dislike of paperwork")
print("=" * 70)
print(f"{'Career Title':<40} | {'Profile A (Rank / Score)':<25} | {'Profile B (Rank / Score)':<25}")
print("-" * 95)
for title in target_careers:
    a_info = f"#{stats_a[title]['rank']} ({stats_a[title]['score']:.4f})"
    b_info = f"#{stats_b_freetext[title]['rank']} ({stats_b_freetext[title]['score']:.4f})"
    print(f"{title:<40} | {a_info:<25} | {b_info:<25}")
