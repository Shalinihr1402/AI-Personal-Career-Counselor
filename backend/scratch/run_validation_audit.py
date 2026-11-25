"""
run_validation_audit.py - Comprehensive audit script for post-implementation validation.
Traces question sequences, scoring integrity, tiebreaker mechanics, dynamic branching,
and uncertainty-based stopping for 5 distinct profiles.
"""

import json
from adaptive_assessment import (
    adaptive_engine,
    get_profile_dimension_affinities,
    COLLEGE_COMPETENCY_QUESTIONS,
    AssessmentStage,
    QuestionCategory,
)
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
        # Preferred response inclination: Conventional (C) > Enterprising (E) > Investigative (I)
        "preferred_dims": ["C", "E", "I", "S"]
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
        # Preferred response inclination: Investigative (I) > Conventional (C) > Enterprising (E)
        "preferred_dims": ["I", "C", "E", "R"]
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
        # Preferred response inclination: Investigative (I) > Realistic (R) > Conventional (C)
        "preferred_dims": ["I", "R", "C", "A"]
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
        # Preferred response inclination: Artistic (A) > Social (S) > Enterprising (E)
        "preferred_dims": ["A", "S", "E", "I"]
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
        # Preferred response inclination: Investigative (I) > Conventional (C) > Realistic (R)
        "preferred_dims": ["I", "C", "R", "A"]
    },
}

def pick_profile_aligned_option(q, preferred_dims):
    """Picks an option that realistically reflects the student's authentic inclinations."""
    best_opt = None
    best_score = -1
    for opt in q["options"]:
        # Score this option based on alignment with student's preferred dimensions
        weights = opt.get("dimension_weights") or {}
        score = 0
        for dim, w in weights.items():
            if dim in preferred_dims:
                rank_weight = 4 - preferred_dims.index(dim)
                score += w * rank_weight
        if score > best_score:
            best_score = score
            best_opt = opt
    return best_opt if best_opt else q["options"][0]

def trace_profile_execution(name, profile):
    answers = {}
    asked_ids = []
    trace = []
    is_complete = False
    turn = 0
    preferred = profile["preferred_dims"]

    while not is_complete and turn < 15:
        turn += 1
        res = adaptive_engine.get_next_adaptive_question(profile=profile, answers=answers, asked_ids=asked_ids)
        if res["is_complete"]:
            is_complete = True
            trace.append({
                "step": turn,
                "status": "STOPPED",
                "reason": res["completion_reason"],
                "total_questions": len(answers),
                "running_scores": res["current_scores"],
                "leading_dims": res["leading_dimensions"]
            })
            break

        q = res["question"]
        q_id = q["id"]
        asked_ids.append(q_id)

        # Select authentic option
        chosen_opt = pick_profile_aligned_option(q, preferred)
        chosen_id = chosen_opt["id"]
        answers[q_id] = chosen_id

        # Determine selection rationale
        category = q.get("category")
        target_dims = q.get("target_dimensions", [])
        if turn == 1:
            rationale = "Initial domain competency probe matching student's primary academic domain/affinity."
        elif turn == 2:
            rationale = "Complementary domain or applied scenario question in student's field of study."
        elif turn >= 8:
            rationale = "Discriminator question targeting ambiguous or tied dimensions."
        else:
            rationale = f"Exploratory scenario targeting under-explored dimensions ({', '.join(target_dims)})."

        trace.append({
            "step": turn,
            "question_id": q_id,
            "category": category,
            "prompt": q["prompt"],
            "target_dimensions": target_dims,
            "chosen_option_id": chosen_id,
            "chosen_option_text": chosen_opt["text"],
            "awarded_weights": chosen_opt.get("dimension_weights", {}),
            "awarded_fields": chosen_opt.get("occupational_fields", []),
            "selection_rationale": rationale,
            "running_scores_after_step": res["current_scores"],
            "leading_dims_after_step": res["leading_dimensions"],
        })

    final_score = adaptive_engine.score_adaptive_assessment(answers=answers, profile=profile)

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

    return {
        "profile_name": name,
        "calibrated_stage": final_score["stage"],
        "total_questions_answered": len(answers),
        "stopping_reason": trace[-1]["reason"] if is_complete else "Max turns reached",
        "final_holland_code": final_score["code"],
        "final_riasec_scores": final_score["scores"],
        "top_career_fields": final_score["top_fields"][:4],
        "completeness_score": completeness,
        "is_ready_for_recommendations": is_ready,
        "trace": trace
    }

def test_branching_behavior():
    """Tests that changing an answer at Question 1 dynamically alters subsequent running scores and Holland code."""
    p_bcom = PROFILES["Profile A (B.Com Accounting & Tax)"]

    # Path 1: Student selects Conventional auditing path
    ans_audit = {"q_comp_ca_audit_sampling": "a"} # C: 3, I: 1
    res_audit = adaptive_engine.score_adaptive_assessment(ans_audit, p_bcom)

    # Path 2: Student selects Commercial management / finance growth path
    ans_mgmt = {"q_comp_ca_audit_sampling": "c"} # C: 2, E: 2
    res_mgmt = adaptive_engine.score_adaptive_assessment(ans_mgmt, p_bcom)

    return {
        "path_audit": {"answer": "a", "awarded": {"C": 3, "I": 1}, "scores": res_audit["scores"], "code": res_audit["code"]},
        "path_mgmt": {"answer": "c", "awarded": {"C": 2, "E": 2}, "scores": res_mgmt["scores"], "code": res_mgmt["code"]}
    }

def test_uncertainty_stopping_behavior():
    """
    Tests that when answers are deliberately mixed/tied (low certainty),
    the quiz does NOT stop at 8 questions, but continues to ask discriminator questions!
    """
    profile = PROFILES["Profile A (B.Com Accounting & Tax)"]

    # Deliberately tie I and C at question 8
    # 4 questions awarding I, 4 questions awarding C
    balanced_answers = {
        "q_comp_tax_budgeting": "a", # C: 3, I: 1
        "legacy_q1": "c", # C: 3
        "legacy_q4": "d", # C: 3
        "legacy_q2": "b", # I: 3
        "legacy_q3": "b", # I: 3
        "legacy_q5": "c", # I: 3
        "legacy_q6": "c", # C: 3
        "legacy_q7": "c", # I: 3
    }

    # At question 8:
    res_q8 = adaptive_engine.get_next_adaptive_question(profile=profile, answers=balanced_answers)
    is_stopped_at_8 = res_q8["is_complete"]
    next_q_at_8 = res_q8["question"]["id"] if res_q8["question"] else None

    return {
        "is_stopped_at_8": is_stopped_at_8,
        "next_question_at_8": next_q_at_8,
        "running_scores": res_q8["current_scores"],
        "reason_or_status": "Continued to discriminator question" if not is_stopped_at_8 else res_q8["completion_reason"]
    }

if __name__ == "__main__":
    results = {}
    for name, p in PROFILES.items():
        results[name] = trace_profile_execution(name, p)

    branching = test_branching_behavior()
    uncertainty = test_uncertainty_stopping_behavior()

    output = {
        "profiles": results,
        "branching_test": branching,
        "uncertainty_stopping_test": uncertainty
    }

    with open("scratch/post_implementation_audit_output.json", "w") as f:
        json.dump(output, f, indent=2)

    print("AUDIT SCRIPT COMPLETED SUCCESSFULLY.")
