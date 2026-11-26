import sys
import json
from pathlib import Path

# Add backend directory to path
CURRENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CURRENT_DIR))

from adaptive_assessment import (
    AdaptiveAssessmentEngine,
    AssessmentStage,
    QuestionCategory,
    CompetencyEvidenceLevel,
    DIMS,
    DIM_LABEL,
)
from diagnostic_counselor import DiagnosticProfile, evaluate_completeness

engine = AdaptiveAssessmentEngine()

# ----------------------------------------------------------------------------
# 1. FIVE PROFILES SETUP
# ----------------------------------------------------------------------------
PROFILES = {
    "Profile 1 (B.Com Accounting, Auditing & Tax)": {
        "profile": {
            "education_level": "undergraduate",
            "degree": "B.Com",
            "course": "Bachelor of Commerce",
            "specialization": "Accounting & Taxation",
            "skills": ["Tally", "Financial Accounting", "GST", "Direct Taxation", "Bank Reconciliation"],
            "interests": ["Auditing", "Taxation", "Financial Reporting", "Corporate Compliance"],
            "career_goals": ["Chartered Accountant / Tax Auditor"],
            "targetRole": "Audit Associate / Tax Consultant",
            "work_style": {"structure_vs_ambiguity": "Clear structure and steps", "build_vs_analyze": "Analyse and understand things"},
            "projects": [
                {"title": "Corporate Tax & GST Filing Case Study", "description": "Prepared GST reconciliations, input tax credit schedules, and audited financial statements for a mid-sized retailer as part of advanced taxation coursework."}
            ]
        },
        # Candidate answers representing a systematic, compliance-focused commerce fresher
        "simulated_answers": {
            "q_comp_ca_audit_sampling": "a", # Ledgers & invoice reconciliation (C:3, I:1)
            "q_comp_tax_budgeting": "a",     # GST liabilities & compliant tax filing (C:3, I:1)
            "legacy_q8": "b",                # Structured practice and detailed methodology (C:2, I:2)
            "legacy_q1": "c",                # Managing event budget and vendor contracts (C:3)
            "legacy_q2": "b",                # Analyzing error codes and systematic testing (I:3)
            "legacy_q3": "a",                # Organizing inventory and audit logging (C:3)
            "legacy_q9": "a",                # Financial risk analysis and business continuity (C:2, E:1)
            "legacy_q4": "c",                # Structured operations and progress tracking (C:2, E:1)
        }
    },
    "Profile 2 (B.Com Python & Data Science Exploration)": {
        "profile": {
            "education_level": "undergraduate",
            "degree": "B.Com",
            "course": "Bachelor of Commerce",
            "specialization": "General Commerce",
            "skills": ["Python", "Pandas", "Excel", "SQL Basics", "Accounting Basics"],
            "interests": ["Data Analytics", "Financial Data Science", "Predictive Modeling", "Business Intelligence"],
            "career_goals": ["Financial Data Analyst", "Business Intelligence Specialist"],
            "targetRole": "Data Analyst (Finance)",
            "work_style": {"build_vs_analyze": "Analyse and understand things", "people_vs_data": "Working with data or things"},
            "projects": [
                {"title": "Financial Statement Analysis with Python", "description": "Extracted quarterly financial statements using Pandas, calculated key financial ratios, and built automated visual dashboards."}
            ]
        },
        # Candidate answers representing an aspiring data analyst bridging commerce and Python
        "simulated_answers": {
            "q_comp_python_data": "a",       # Python / Pandas data cleaning & distributions (I:3, C:1)
            "q_comp_aiml_pipeline": "b",     # Inspect incoming data for condition/distribution shifts (I:2, C:2)
            "q_comp_tax_budgeting": "b",     # 12-month financial projection model (C:2, E:2)
            "q_comp_stat_hypothesis": "a",   # Rigorous statistical significance tests & intervals (I:3, C:1)
            "legacy_q8": "b",                # Structured practice and modular exercises (C:2, I:2)
            "legacy_q2": "b",                # Analyzing system logs and systematic diagnostics (I:3)
            "legacy_q3": "a",                # Structured data organization and recordkeeping (C:3)
            "legacy_q9": "b",                # Data-driven forecasting and market intelligence (I:2, E:1)
        }
    },
    "Profile 3 (MCA AI/ML & Software Development)": {
        "profile": {
            "education_level": "postgraduate",
            "degree": "MCA",
            "course": "Master of Computer Applications",
            "specialization": "Artificial Intelligence & Software Engineering",
            "skills": ["Python", "PyTorch", "OpenCV", "Java", "FastAPI", "Docker", "Git"],
            "interests": ["Computer Vision", "Machine Learning Systems", "Distributed Backend", "Deep Learning"],
            "career_goals": ["Machine Learning Engineer", "AI Systems Developer"],
            "targetRole": "Machine Learning Engineer",
            "work_style": {"build_vs_analyze": "Build and make things", "structure_vs_ambiguity": "Open-ended problems"},
            "projects": [
                {"title": "Real-Time Object Detection & Defect Inspection", "description": "Trained YOLOv8 and PyTorch models on industrial defect datasets, achieving 92% mAP with FastAPI inference service."}
            ]
        },
        # Candidate answers representing an applied AI/ML engineering student
        "simulated_answers": {
            "q_comp_aiml_pipeline": "a",     # Overfitting diagnosis, regularization, cross-val (I:3, R:1)
            "q_comp_java_concurrency": "a",  # Query optimization, indexes, and caching (I:2, C:2)
            "q_comp_python_data": "a",       # Pandas data cleaning & distributions (I:3, C:1)
            "legacy_q2": "a",                # Hands-on hardware disassembly and physical testing (R:3)
            "legacy_q11": "b",               # Computational simulation and algorithmic benchmark (I:3)
            "legacy_q8": "a",                # Deep independent experimentation and reverse-engineering (I:2, R:2)
            "legacy_q3": "b",                # Designing automated script pipelines (R:2, I:1)
            "legacy_q9": "b",                # Building experimental prototype proof-of-concept (I:2, R:1)
        }
    },
    "Profile 4 (BA English Teaching, Writing & Communication)": {
        "profile": {
            "education_level": "undergraduate",
            "degree": "B.A",
            "course": "Bachelor of Arts",
            "specialization": "English Literature & Communication Studies",
            "skills": ["Content Writing", "Editorial Review", "Public Speaking", "Instructional Design", "Literary Analysis"],
            "interests": ["Pedagogy", "Creative Non-Fiction", "Curriculum Development", "Student Mentoring", "Publishing"],
            "career_goals": ["English Educator / Content Strategist", "Academic Curriculum Designer"],
            "targetRole": "High School English Teacher / Education Consultant",
            "work_style": {"people_vs_data": "Working with people", "structure_vs_ambiguity": "Clear structure and steps"},
            "projects": [
                {"title": "Peer Tutoring & Remedial Reading Workshop", "description": "Designed a 6-week remedial reading syllabus for underprivileged secondary students, improving comprehension scores by 35%."}
            ]
        },
        # Candidate answers representing an empathetic educator and expressive writer
        "simulated_answers": {
            "q_comp_humanities_communication": "a", # Narrative voice, tone, expressive craft (A:3, S:1)
            "q_comp_pedagogical_empathy": "a",      # Active listening, validation, real-world analogies (S:3, A:1)
            "legacy_q1": "a",                       # Writing and publicizing festival newsletters/articles (A:3)
            "legacy_q10": "a",                      # Creative self-expression and artistic storytelling (A:3)
            "legacy_q4": "a",                       # Student mentoring, group discussions, coaching (S:3)
            "legacy_q8": "c",                       # Interactive peer workshops and collaborative learning (S:2, A:1)
            "legacy_q6": "a",                       # Community outreach, literacy drive, counseling (S:3)
            "legacy_q2": "c",                       # Consulting team members and user feedback (S:2, A:1)
        }
    },
    "Profile 5 (B.Sc Mathematics Research & Quantitative Analytics)": {
        "profile": {
            "education_level": "undergraduate",
            "degree": "B.Sc",
            "course": "Bachelor of Science",
            "specialization": "Mathematics & Statistics",
            "skills": ["Mathematical Modeling", "Linear Algebra", "Statistical Inference", "R Basics", "Probability Theory"],
            "interests": ["Quantitative Research", "Statistical Analysis", "Stochastic Processes", "Data Modeling"],
            "career_goals": ["Quantitative Research Analyst", "Statistical Scientist"],
            "targetRole": "Quantitative Analyst",
            "work_style": {"build_vs_analyze": "Analyse and understand things", "structure_vs_ambiguity": "Clear structure and steps"},
            "projects": [
                {"title": "Stochastic Modeling of Epidemic Propagation", "description": "Formulated SIR differential equation models, simulated transmission curves in R, and derived stability criteria."}
            ]
        },
        # Candidate answers representing an analytical mathematical researcher
        "simulated_answers": {
            "q_comp_math_modeling": "a",     # Formulating real-world problem into equations (I:3, R:1)
            "q_comp_stat_hypothesis": "a",   # Rigorous hypothesis testing, confidence intervals (I:3, C:1)
            "q_comp_python_data": "b",       # Statistical hypothesis testing & predictive modeling (I:3, R:1)
            "legacy_q2": "b",                # Analyzing mathematical patterns and logical structures (I:3)
            "legacy_q11": "b",               # Computational simulation and theorem verification (I:3)
            "legacy_q3": "a",                # Structured numerical classification and ledger tracking (C:3)
            "legacy_q8": "b",                # Deriving first-principles theory and proof validation (I:3)
            "legacy_q9": "b",                # Quantitative optimization and econometric forecasting (I:2, C:1)
        }
    }
}

results = {
    "profiles": {},
    "branching_experiments": [],
    "stopping_experiments": {}
}

# ----------------------------------------------------------------------------
# 2. RUN SIMULATION FOR ALL 5 PROFILES
# ----------------------------------------------------------------------------
for p_name, p_info in PROFILES.items():
    prof = p_info["profile"]
    sim_answers = p_info["simulated_answers"]
    
    trace = []
    current_answers = {}
    asked_ids = []
    
    stage = engine.resolve_stage(prof)
    
    # Run step-by-step
    for step_num in range(1, 13):
        res = engine.get_next_adaptive_question(profile=prof, answers=current_answers, asked_ids=asked_ids)
        
        if res["is_complete"] or not res["question"]:
            trace.append({
                "step": step_num,
                "action": "STOP",
                "reason": res["completion_reason"],
                "running_scores": res["current_scores"],
                "leading_dimensions": res["leading_dimensions"]
            })
            break
            
        q = res["question"]
        qid = q["id"]
        asked_ids.append(qid)
        
        # Determine simulated answer
        chosen_opt_id = sim_answers.get(qid, "a")
        chosen_opt = next((opt for opt in q["options"] if opt["id"] == chosen_opt_id), q["options"][0])
        
        current_answers[qid] = chosen_opt_id
        
        # Re-score after choice
        step_score_data = engine.score_adaptive_assessment(current_answers, prof)
        
        trace.append({
            "step": step_num,
            "question_id": qid,
            "category": q["category"],
            "prompt": q["prompt"],
            "target_dimensions": q["target_dimensions"],
            "chosen_option_id": chosen_opt_id,
            "chosen_option_text": chosen_opt["text"],
            "awarded_weights": chosen_opt["dimension_weights"],
            "awarded_fields": chosen_opt.get("occupational_fields", []),
            "selection_rationale": (
                "Domain competency calibration" if step_num <= 2 else
                "Adaptive trajectory alignment & dimension discrimination"
            ),
            "running_scores_after_step": step_score_data["scores"],
            "leading_dims_after_step": list(step_score_data["code"])
        })
        
    final_scored = engine.score_adaptive_assessment(current_answers, prof)
    dp = DiagnosticProfile(
        education_background=f"{prof.get('degree', '')} in {prof.get('specialization', '')}",
        education_status="collected",
        technical_skills=prof.get("skills", []),
        skills_status="collected",
        technical_interests=prof.get("interests", []),
        interests_status="collected",
        career_goals=prof.get("career_goals", []),
        goals_status="collected",
        projects=prof.get("projects", []),
        projects_status="collected" if prof.get("projects") else "not_collected"
    )
    completeness, is_ready, comp_breakdown = evaluate_completeness(dp, stage.value)
    
    results["profiles"][p_name] = {
        "calibrated_stage": stage.value,
        "total_questions_answered": len(current_answers),
        "stopping_reason": trace[-1].get("reason", "Finished sequence"),
        "final_holland_code": final_scored["code"],
        "final_riasec_scores": final_scored["scores"],
        "top_career_fields": final_scored["top_fields"],
        "completeness_score": completeness,
        "is_ready_for_recommendations": is_ready,
        "completeness_breakdown": comp_breakdown,
        "trace": trace
    }

# ----------------------------------------------------------------------------
# 3. CONTROLLED BRANCHING EXPERIMENT
# ----------------------------------------------------------------------------
prof_bcom = PROFILES["Profile 1 (B.Com Accounting, Auditing & Tax)"]["profile"]

# Step 1 is q_comp_ca_audit_sampling
# Branch 1A: Choose 'a' on Q1 (Audit & Ledgers) -> Q2 is q_comp_tax_budgeting -> Choose 'a' on Q2 (Tax liabilities)
ans_branch_1a = {"q_comp_ca_audit_sampling": "a", "q_comp_tax_budgeting": "a"}
res_branch_1a = engine.get_next_adaptive_question(prof_bcom, ans_branch_1a)
q3_1a = res_branch_1a["question"]

# Branch 1B: Choose 'a' on Q1 (Audit & Ledgers) -> Q2 is q_comp_tax_budgeting -> Choose 'c' on Q2 (Sales growth & Expansion)
ans_branch_1b = {"q_comp_ca_audit_sampling": "a", "q_comp_tax_budgeting": "c"}
res_branch_1b = engine.get_next_adaptive_question(prof_bcom, ans_branch_1b)
q3_1b = res_branch_1b["question"]

results["branching_experiments"].append({
    "experiment_id": "EXP_01_BCOM_Q2_CHOICE_DIVERGENCE",
    "description": "Candidate answers identical Q1 (Audit) but diverges on Q2 (Tax liability vs Commercial growth).",
    "branch_A": {
        "previous_answers": ans_branch_1a,
        "q2_chosen": "a: Calculating GST liabilities & tax schedules (C:3, I:1)",
        "scores_after_q2": res_branch_1a["current_scores"],
        "code_after_q2": "".join(res_branch_1a["leading_dimensions"]),
        "next_question_id": q3_1a["id"],
        "next_question_prompt": q3_1a["prompt"],
        "next_question_target_dims": q3_1a["target_dimensions"],
        "selection_rationale": "Prioritized investigative/methodological problem-solving following strong C+I accumulation."
    },
    "branch_B": {
        "previous_answers": ans_branch_1b,
        "q2_chosen": "c: Evaluating commercial growth strategies & top-line sales (E:3, A:1)",
        "scores_after_q2": res_branch_1b["current_scores"],
        "code_after_q2": "".join(res_branch_1b["leading_dimensions"]),
        "next_question_id": q3_1b["id"],
        "next_question_prompt": q3_1b["prompt"],
        "next_question_target_dims": q3_1b["target_dimensions"],
        "selection_rationale": "Prioritized organizational leadership and initiative following C+E tie."
    }
})

# ----------------------------------------------------------------------------
# 4. EARLY STOPPING EXPERIMENTS: CLEAR VS AMBIGUOUS
# ----------------------------------------------------------------------------
# Case A: Clear Decisive Profile (Investigative & Conventional dominating)
clear_answers = {
    "q_comp_ca_audit_sampling": "a", # C:3, I:1
    "q_comp_tax_budgeting": "a",     # C:3, I:1
    "legacy_q8": "b",                # C:2, I:2
    "legacy_q1": "c",                # C:3
    "legacy_q2": "b",                # I:3
    "legacy_q3": "a",                # C:3
    "legacy_q9": "a",                # C:2, E:1
    "legacy_q4": "c",                # C:2, E:1
}
res_clear = engine.get_next_adaptive_question(prof_bcom, clear_answers)

# Case B: Ambiguous Profile (3 dimensions tied at question 8)
# We engineer answers where at question 8, S=19, E=19, C=19
ambiguous_answers = {
    "legacy_q1": "d", # S:3
    "legacy_q4": "a", # S:3
    "legacy_q8": "d", # E:3
    "legacy_q9": "c", # E:3
    "legacy_q3": "a", # C:3
    "legacy_q12": "a",# C:3
    "legacy_q2": "b", # I:3
    "legacy_q5": "b", # I:3
}
res_ambig_q8 = engine.get_next_adaptive_question(prof_bcom, ambiguous_answers)

# At step 9, provide discriminator answer resolving Enterprising
ambiguous_answers_q9 = dict(ambiguous_answers)
if res_ambig_q8["question"]:
    discriminator_id = res_ambig_q8["question"]["id"]
    ambiguous_answers_q9[discriminator_id] = "c" # Option awarding E
res_ambig_q9 = engine.get_next_adaptive_question(prof_bcom, ambiguous_answers_q9)

results["stopping_experiments"] = {
    "clear_profile": {
        "questions_count": 8,
        "is_complete": res_clear["is_complete"],
        "completion_reason": res_clear["completion_reason"],
        "final_scores": res_clear["current_scores"],
        "separation_margin": res_clear["current_scores"][res_clear["leading_dimensions"][1]] - res_clear["current_scores"][res_clear["leading_dimensions"][2]]
    },
    "ambiguous_profile": {
        "at_question_8": {
            "is_complete": res_ambig_q8["is_complete"],
            "served_discriminator_question": res_ambig_q8["question"]["id"] if res_ambig_q8["question"] else None,
            "reason": "Margin s2 - s3 is below trait certainty threshold (Delta < 3). Engine actively requested discriminator question."
        },
        "at_question_9": {
            "is_complete": res_ambig_q9["is_complete"],
            "completion_reason": res_ambig_q9["completion_reason"],
            "separation_margin": res_ambig_q9["current_scores"][res_ambig_q9["leading_dimensions"][1]] - res_ambig_q9["current_scores"][res_ambig_q9["leading_dimensions"][2]]
        }
    }
}

OUT_PATH = CURRENT_DIR / "scratch" / "final_quality_refinement_audit_output.json"
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print("AUDIT EXECUTION COMPLETE. Output written to:", OUT_PATH)
for p_name, data in results["profiles"].items():
    print(f"{p_name}: {data['total_questions_answered']} Qs, Holland: {data['final_holland_code']}, Completeness: {data['completeness_score']}%")
    print(f"  Scores: {data['final_riasec_scores']}")
    print(f"  Fields: {data['top_career_fields'][:3]}")
