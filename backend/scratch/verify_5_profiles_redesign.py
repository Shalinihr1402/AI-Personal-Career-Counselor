"""
verify_5_profiles_redesign.py - Comprehensive verification of redesigned assessment engine across 5 distinct student profiles:
- Profile A: B.Com fresher (accounting and taxation)
- Profile B: B.Com fresher (Python and Data Science)
- Profile C: MCA fresher (AI/ML)
- Profile D: BA English fresher (public speaking and teaching)
- Profile E: B.Sc Mathematics fresher (research and analytics)
"""

import json
from adaptive_assessment import adaptive_engine, get_profile_dimension_affinities
from diagnostic_counselor import DiagnosticProfile, evaluate_completeness, fallback_extract_profile

PROFILES = {
    "Profile A (B.Com Accounting & Tax)": {
        "education_level": "undergraduate",
        "degree": "B.Com",
        "specialization": "Accounting and Taxation",
        "skills": ["Accounting", "Taxation", "Tally", "GST", "Auditing", "Excel"],
        "resume_skills": ["Financial Reporting", "Ledger Reconciliation", "Corporate Tax"],
        "interests": ["Corporate Finance", "Taxation", "Auditing", "Business Compliance"],
        "career_goals": ["Chartered Accountant", "Tax Consultant"],
        "targetRole": "Chartered Accountant",
        "work_style": {"people_vs_data": "Working with data or things", "structure_vs_ambiguity": "Clear structure and steps"},
    },
    "Profile B (B.Com Python & Data Science)": {
        "education_level": "undergraduate",
        "degree": "B.Com",
        "specialization": "Commerce with Business Analytics",
        "skills": ["Python", "Pandas", "SQL", "Excel", "Data Visualization", "Accounting"],
        "resume_skills": ["Financial Modeling", "Data Analysis", "Python Scripting"],
        "interests": ["Data Science", "Machine Learning", "Financial Analytics", "Predictive Modeling"],
        "career_goals": ["Financial Data Analyst", "Data Scientist"],
        "targetRole": "Data Analyst",
        "work_style": {"people_vs_data": "Working with data or things", "build_vs_analyze": "Analyse and understand things"},
    },
    "Profile C (MCA AI/ML)": {
        "education_level": "postgraduate",
        "degree": "MCA",
        "specialization": "Computer Science & AI",
        "skills": ["Python", "PyTorch", "OpenCV", "FastAPI", "SQL", "Scikit-learn"],
        "resume_skills": ["Deep Learning", "Computer Vision", "REST APIs"],
        "interests": ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Software Development"],
        "career_goals": ["AI/ML Software Engineer", "Computer Vision Engineer"],
        "targetRole": "AI/ML Engineer",
        "work_style": {"build_vs_analyze": "Build and make things", "structure_vs_ambiguity": "Open-ended problems"},
    },
    "Profile D (BA English Teaching & Writing)": {
        "education_level": "undergraduate",
        "degree": "B.A",
        "specialization": "English Literature",
        "skills": ["Creative Writing", "Public Speaking", "Editing", "Proofreading", "English Literature"],
        "resume_skills": ["Editorial Review", "Curriculum Planning", "Debating"],
        "interests": ["Creative Writing", "Teaching", "Public Speaking", "Literature", "Journalism"],
        "career_goals": ["High School English Teacher", "Content Strategist"],
        "targetRole": "Teacher",
        "work_style": {"people_vs_data": "Working with people", "build_vs_analyze": "Analyse and understand things"},
    },
    "Profile E (B.Sc Mathematics Research & Analytics)": {
        "education_level": "undergraduate",
        "degree": "B.Sc",
        "specialization": "Mathematics & Statistics",
        "skills": ["Calculus", "Linear Algebra", "Probability", "Statistics", "LaTeX", "Python"],
        "resume_skills": ["Mathematical Modeling", "Statistical Analysis", "Numerical Optimization"],
        "interests": ["Pure Mathematics", "Quantitative Research", "Statistical Theory", "Operations Research"],
        "career_goals": ["Quantitative Researcher", "Operations Research Analyst"],
        "targetRole": "Quantitative Analyst",
        "work_style": {"people_vs_data": "Working with data or things", "build_vs_analyze": "Analyse and understand things"},
    },
}

def simulate_profile(name, profile):
    print("=" * 80)
    print(f"SIMULATING: {name}")
    print("=" * 80)

    # 1. Test step-by-step adaptive question progression
    answers = {}
    asked_ids = []
    step_log = []
    is_complete = False
    turn = 0

    while not is_complete and turn < 14:
        turn += 1
        res = adaptive_engine.get_next_adaptive_question(profile=profile, answers=answers, asked_ids=asked_ids)
        if res["is_complete"]:
            is_complete = True
            step_log.append({
                "turn": turn,
                "status": "STOPPED",
                "reason": res["completion_reason"],
                "total_answered": len(answers),
                "running_scores": res["current_scores"],
                "leading_dims": res["leading_dimensions"]
            })
            break

        q = res["question"]
        q_id = q["id"]
        asked_ids.append(q_id)

        # Select option consistent with profile
        chosen_opt = q["options"][0]["id"] # Pick primary aligned option
        answers[q_id] = chosen_opt
        step_log.append({
            "turn": turn,
            "question_id": q_id,
            "category": q["category"],
            "prompt": q["prompt"][:80] + "...",
            "target_dims": q["target_dimensions"],
            "chosen_option": chosen_opt,
        })

    # 2. Final Score Evaluation
    final_score = adaptive_engine.score_adaptive_assessment(answers=answers, profile=profile)

    # 3. Completeness Evaluation for non-tech and tech students
    dp = DiagnosticProfile(
        education_background=f"{profile['degree']} in {profile['specialization']}",
        education_status="collected",
        technical_skills=profile["skills"],
        skills_status="collected",
        technical_interests=profile["interests"],
        interests_status="collected",
        career_goals=profile["career_goals"],
        goals_status="collected",
        projects=[],
        projects_status="not_collected"
    )
    completeness, is_ready, _ = evaluate_completeness(dp, final_score["stage"])

    summary = {
        "profile_name": name,
        "calibrated_stage": final_score["stage"],
        "initial_question": step_log[0]["question_id"],
        "initial_question_prompt": step_log[0]["prompt"],
        "questions_asked_count": len(answers),
        "stopping_reason": step_log[-1]["reason"] if is_complete else "Max turns reached",
        "holland_code": final_score["code"],
        "riasec_scores": final_score["scores"],
        "top_fields": final_score["top_fields"][:3],
        "completeness_score": completeness,
        "is_ready_for_recommendations": is_ready,
        "step_log": step_log
    }

    print(f" Stage: {summary['calibrated_stage']}")
    print(f" Initial Question: {summary['initial_question']} -> {summary['initial_question_prompt']}")
    print(f" Questions Asked: {summary['questions_asked_count']}")
    print(f" Stopping Reason: {summary['stopping_reason']}")
    print(f" Holland RIASEC Code: {summary['holland_code']} (Scores: {summary['riasec_scores']})")
    print(f" Top Fields: {summary['top_fields']}")
    print(f" Completeness Score: {summary['completeness_score']}% (Ready: {summary['is_ready_for_recommendations']})")
    print()

    return summary

if __name__ == "__main__":
    results = {}
    for name, p in PROFILES.items():
        results[name] = simulate_profile(name, p)

    with open("scratch/simulation_results_5_profiles.json", "w") as f:
        json.dump(results, f, indent=2)

    print("SUCCESS: 5-Profile simulation completed and saved to scratch/simulation_results_5_profiles.json")
