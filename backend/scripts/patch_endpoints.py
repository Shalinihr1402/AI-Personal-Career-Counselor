import os

main_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "main.py")

with open(main_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Diagnostic models if not already present
if "class DiagnosticChatRequest" not in content:
    target1 = "    riasec_code: str | None = None"
    repl1 = """    riasec_code: str | None = None
    diagnostic_profile: dict[str, Any] | None = None
    requested_completion: bool | None = False
    user_confirmed: bool | None = False


class DiagnosticChatRequest(BaseModel):
    messages: list[CounselorChatMessage]
    student_profile: dict[str, Any] = Field(default_factory=dict)
    assessment_evidence: dict[str, Any] = Field(default_factory=dict)
    diagnostic_profile: dict[str, Any] | None = None
    requested_completion: bool = False
    user_confirmed: bool = False


class GenerateRecommendationsRequest(BaseModel):
    riasec_scores: dict[str, float]
    code: str
    interests: list[str] = Field(default_factory=list)
    education: str | None = None
    work_style: dict[str, str] = Field(default_factory=dict)
    resume_skills: list[str] = Field(default_factory=list)
    strengths_note: str | None = None
    know_me: dict[str, Any] = Field(default_factory=dict)
    diagnostic_profile: dict[str, Any] = Field(default_factory=dict)"""
    content = content.replace(target1, repl1, 1)

# 2. Add endpoints: /api/counselor/diagnostic-chat and /api/counselor/generate-recommendations
endpoints_code = '''
@app.post("/api/counselor/diagnostic-chat")
def counselor_diagnostic_chat(req: DiagnosticChatRequest):
    """
    Intelligent diagnostic conversation turn:
    - Extracts structured student profile (education, projects, responsibilities, tech, skills, challenges)
    - Prevents repetitive questions
    - Evaluates stage-calibrated completeness
    - Returns summary confirmation when ready
    - NEVER emits premature recommendations
    """
    return process_diagnostic_turn(
        messages=[{"role": m.role, "content": m.content} for m in req.messages],
        student_profile=req.student_profile,
        assessment_evidence=req.assessment_evidence,
        current_diagnostic=req.diagnostic_profile,
        requested_completion=req.requested_completion,
        user_confirmed=req.user_confirmed,
        ai_client=_ai_client if _AI_ENABLED else None,
        groq_model=GROQ_MODEL
    )


@app.post("/api/counselor/generate-recommendations")
def counselor_generate_recommendations(req: GenerateRecommendationsRequest):
    """
    Final career recommendations generated ONLY after diagnostic completion:
    - Combines deterministic RIASEC scores, 4-tier competency evidence, and diagnostic profile
    - Uses existing hybrid matcher + Groq reranker with title guards against 1,016 careers
    - Computes tailored skill gaps and readiness indicators
    """
    diag = req.diagnostic_profile or {}

    diag_skills = diag.get("technical_skills", [])
    diag_interests = diag.get("technical_interests", [])
    projects = diag.get("projects", [])

    project_text_parts = []
    for p in projects:
        if isinstance(p, dict):
            name = p.get("name") or "Project"
            role = p.get("role") or ""
            techs = ", ".join(p.get("technologies", []))
            challenges = p.get("challenges") or ""
            outcomes = p.get("outcomes") or ""
            project_text_parts.append(f"{name} ({role}) using {techs}. Challenges: {challenges}. Outcomes: {outcomes}")
    projects_summary = " | ".join(project_text_parts)

    combined_skills = list(dict.fromkeys(req.resume_skills + diag_skills))
    combined_interests = list(dict.fromkeys(req.interests + diag_interests))

    enriched_free_text_parts = [
        f"Education: {req.education or 'General'}",
        f"Practical Projects: {projects_summary}" if projects_summary else "",
        f"Demonstrated Skills: {', '.join(combined_skills)}" if combined_skills else "",
        f"Growth Areas: {', '.join(diag.get('challenges_and_growth', []))}" if diag.get('challenges_and_growth') else "",
        f"Career Goals: {', '.join(diag.get('career_goals', []))}" if diag.get('career_goals') else "",
        req.strengths_note or ""
    ]
    enriched_free_text = ". ".join(p for p in enriched_free_text_parts if p)

    match_payload = {
        "riasec_scores": req.riasec_scores,
        "code": req.code,
        "interests": combined_interests,
        "education": req.education,
        "work_style": req.work_style,
        "resume_skills": combined_skills,
        "strengths_note": enriched_free_text,
        "know_me": req.know_me,
    }

    # 1. AI Reranking via Groq
    matches = _ai_career_match(match_payload)
    source = "ai"

    # 2. Hybrid vector fallback
    if not matches:
        try:
            from matcher import hybrid_career_match, is_semantic_engine_ready
            if is_semantic_engine_ready():
                vector_matches = hybrid_career_match(
                    riasec_scores=req.riasec_scores,
                    interests=combined_interests,
                    resume_skills=combined_skills,
                    know_me=req.know_me if isinstance(req.know_me, dict) else {},
                    free_text=enriched_free_text,
                    limit=5
                )
                if vector_matches:
                    for m in vector_matches:
                        c_info = get_career_by_slug(m["slug"])
                        if c_info:
                            m["education"] = c_info.get("education")
                            m["software_tools"] = c_info.get("software_tools", [])
                            m["salary_india"] = c_info.get("salary_india")
                            m["field"] = c_info.get("field", "General")
                    matches = vector_matches
                    source = "hybrid_vector"
        except Exception as e:
            print(f"Hybrid matcher error in generate_recommendations: {e}")

    # 3. Deterministic rule fallback
    if not matches:
        deal_breakers = req.know_me.get("deal_breakers") if isinstance(req.know_me, dict) else None
        matches = fallback_match(req.riasec_scores, combined_interests, deal_breakers=deal_breakers)
        for f in matches:
            c_info = get_career_by_slug(f["slug"])
            if c_info:
                f["salary_india"] = c_info.get("salary_india")
                f["field"] = c_info.get("field", "General")
                f["education"] = c_info.get("education")
                f["software_tools"] = c_info.get("software_tools", [])
        source = "rule"

    # Compute skill gap & readiness for each match
    for idx, m in enumerate(matches):
        c_slug = m.get("slug")
        c_info = get_career_by_slug(c_slug) if c_slug else None
        req_skills = (c_info.get("skills", []) if c_info else []) + (m.get("key_skills", []) or [])
        req_skills = list(dict.fromkeys(req_skills))

        student_skills_lower = {s.lower() for s in combined_skills}
        matched_s = [s for s in req_skills if any(s.lower() in cand or cand in s.lower() for cand in student_skills_lower)]
        missing_s = [s for s in req_skills if s not in matched_s]

        m["matched_skills"] = matched_s
        m["missing_skills"] = missing_s
        m["readiness"] = "High" if len(matched_s) >= 3 else ("Medium" if len(matched_s) >= 1 else "Developing")
        if not m.get("fit"):
            m["fit"] = max(70, 94 - idx * 4)

    return {
        "source": source,
        "matches": matches[:5],
        "diagnostic_summary": diag.get("summary_of_student") or "Comprehensive profile evaluated across 1,016 occupational pathways.",
        "riasec_scores": req.riasec_scores,
        "riasec_code": req.code,
        "demonstrated_skills_count": len(combined_skills),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
'''

if "/api/counselor/diagnostic-chat" not in content:
    # Insert right before @app.post("/api/counselor/chat")
    target2 = '@app.post("/api/counselor/chat")'
    content = content.replace(target2, endpoints_code + "\n\n" + target2, 1)

# Also in counselor_chat, if req.diagnostic_profile is provided, route directly to process_diagnostic_turn:
diagnostic_bypass = """@app.post("/api/counselor/chat")
def counselor_chat(req: CounselorChatRequest):
    if req.diagnostic_profile is not None:
        return process_diagnostic_turn(
            messages=[{"role": m.role, "content": m.content} for m in req.messages],
            student_profile=req.student_profile or {},
            assessment_evidence=req.adaptive_evidence or {},
            current_diagnostic=req.diagnostic_profile,
            requested_completion=bool(req.requested_completion),
            user_confirmed=bool(req.user_confirmed),
            ai_client=_ai_client if _AI_ENABLED else None,
            groq_model=GROQ_MODEL
        )
"""
if "if req.diagnostic_profile is not None:" not in content:
    target3 = '@app.post("/api/counselor/chat")\ndef counselor_chat(req: CounselorChatRequest):'
    content = content.replace(target3, diagnostic_bypass, 1)

with open(main_path, "w", encoding="utf-8") as f:
    f.write(content)

print("PATCH APPLIED SUCCESSFULLY")
