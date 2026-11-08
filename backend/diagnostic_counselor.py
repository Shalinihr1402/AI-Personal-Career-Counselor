"""
diagnostic_counselor.py

Intelligent Diagnostic Conversation Engine:
1. Extracts structured student profile information (education, projects, responsibilities,
   technologies, skills, technical interests, challenges, work preferences, career goals).
2. Avoids repetitive questions by tracking field statuses ('not_collected', 'partially_collected', 'collected').
3. Stage-calibrated completeness rules (School vs Higher Secondary vs Polytechnic vs College UG/PG vs Switcher).
4. NEVER emits premature career recommendations during the diagnostic conversation.
5. Emits a concise confirmation summary and recommendation trigger ONLY when diagnostic criteria are satisfied.
"""

from __future__ import annotations
import json
import re
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class ProjectRecord(BaseModel):
    name: str = ""
    description: str = ""
    role: str = ""
    technologies: List[str] = Field(default_factory=list)
    challenges: str = ""
    outcomes: str = ""


class DiagnosticProfile(BaseModel):
    education_background: str = ""
    education_status: str = "not_collected"  # "not_collected" | "partially_collected" | "collected"

    projects: List[ProjectRecord] = Field(default_factory=list)
    projects_status: str = "not_collected"

    technical_skills: List[str] = Field(default_factory=list)
    skills_status: str = "not_collected"

    technical_interests: List[str] = Field(default_factory=list)
    interests_status: str = "not_collected"

    challenges_and_growth: List[str] = Field(default_factory=list)
    challenges_status: str = "not_collected"

    work_preferences: Dict[str, str] = Field(default_factory=dict)
    preferences_status: str = "not_collected"

    career_goals: List[str] = Field(default_factory=list)
    goals_status: str = "not_collected"

    summary_of_student: str = ""
    completeness_score: int = 0
    is_ready_for_recommendations: bool = False
    unresolved_questions: List[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Stage-Calibrated Completeness Evaluation
# --------------------------------------------------------------------------- #

def evaluate_completeness(profile: DiagnosticProfile, stage: str) -> Tuple[int, bool, Dict[str, str]]:
    """
    Evaluates whether the diagnostic profile has gathered sufficient information
    for evidence-grounded career matching, calibrated to the student's academic level.
    """
    stage_lower = (stage or "general").lower()
    field_status = {
        "education": profile.education_status,
        "projects": profile.projects_status,
        "skills": profile.skills_status,
        "interests": profile.interests_status,
        "challenges": profile.challenges_status,
        "preferences": profile.preferences_status,
        "goals": profile.goals_status,
    }

    # Helper point weights
    def score_field(status: str) -> int:
        if status == "collected":
            return 25
        if status == "partially_collected":
            return 15
        return 0

    if stage_lower in ["school_10th", "sslc_10th"]:
        # School students: Projects/technologies are NOT required.
        # Required: Education background, Interests, Work preferences, Future thoughts.
        pts = 0
        if profile.education_status != "not_collected":
            pts += 30
        if profile.interests_status == "collected":
            pts += 35
        elif profile.interests_status == "partially_collected":
            pts += 20
        if profile.preferences_status != "not_collected":
            pts += 20
        if profile.goals_status != "not_collected":
            pts += 15

        completeness = min(100, pts)
        is_ready = completeness >= 70

    elif stage_lower in ["higher_secondary_12th", "puc_12th"]:
        # 11th/12th students: Stream focus, degree aspirations, interests.
        pts = 0
        if profile.education_status != "not_collected":
            pts += 25
        if profile.interests_status != "not_collected":
            pts += 30
        if profile.goals_status != "not_collected":
            pts += 25
        if profile.preferences_status != "not_collected":
            pts += 20

        completeness = min(100, pts)
        is_ready = completeness >= 70

    elif stage_lower in ["diploma_polytechnic", "diploma"]:
        # Polytechnic: Practical hands-on skills and lateral entry vs direct job goal.
        pts = 0
        if profile.education_status != "not_collected":
            pts += 20
        if profile.skills_status != "not_collected":
            pts += 25
        if profile.projects_status != "not_collected":
            pts += 25
        if profile.goals_status != "not_collected":
            pts += 20
        if profile.interests_status != "not_collected":
            pts += 10

        completeness = min(100, pts)
        is_ready = completeness >= 70

    else:
        # College UG/PG, Career Switchers, General:
        # Needs projects, skills, domain interests, and career goals.
        pts = 0
        if profile.education_status != "not_collected":
            pts += 15
        if profile.projects_status == "collected":
            pts += 30
        elif profile.projects_status == "partially_collected":
            pts += 15
        if profile.skills_status == "collected":
            pts += 25
        elif profile.skills_status == "partially_collected":
            pts += 15
        if profile.interests_status != "not_collected":
            pts += 15
        if profile.goals_status != "not_collected":
            pts += 15

        completeness = min(100, pts)
        # Ready when projects, skills, and direction have substantial evidence
        is_ready = completeness >= 70

    return completeness, is_ready, field_status


# --------------------------------------------------------------------------- #
# Rule-Based Fallback Extraction & Question Selector
# --------------------------------------------------------------------------- #

KNOWN_TECH_KEYWORDS = {
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "php",
    "react", "next.js", "vue", "angular", "node.js", "express", "fastapi", "django", "flask",
    "postgresql", "mysql", "mongodb", "supabase", "sqlite", "redis", "firebase",
    "aws", "azure", "docker", "kubernetes", "git", "github", "linux", "rest api",
    "machine learning", "deep learning", "pytorch", "tensorflow", "scikit-learn",
    "pandas", "numpy", "data science", "nlp", "computer vision", "llm", "ai",
    "figma", "ui/ux", "wireframing", "canva", "photoshop", "tailwind", "html", "css"
}

def fallback_extract_profile(
    profile: DiagnosticProfile,
    latest_text: str,
    stage: str
) -> DiagnosticProfile:
    """Extracts facts from student responses when AI client is unavailable."""
    text_lower = latest_text.lower()
    updated = profile.model_copy(deep=True)

    # 1. Tech skills extraction
    found_tech = [t for t in KNOWN_TECH_KEYWORDS if re.search(r'\b' + re.escape(t) + r'\b', text_lower)]
    if found_tech:
        existing = set(updated.technical_skills)
        for t in found_tech:
            existing.add(t.capitalize() if len(t) > 3 else t.upper())
        updated.technical_skills = sorted(list(existing))
        updated.skills_status = "collected" if len(updated.technical_skills) >= 2 else "partially_collected"

    # 2. Project detection
    project_indicators = ["built", "created", "developed", "project", "app", "website", "system", "designed", "implemented", "api"]
    if any(k in text_lower for k in project_indicators):
        if not updated.projects:
            new_proj = ProjectRecord(
                name="Primary Student Project",
                description=latest_text,
                role="Developer / Contributor",
                technologies=[t.capitalize() for t in found_tech]
            )
            updated.projects.append(new_proj)
            updated.projects_status = "partially_collected"
        else:
            # Update existing project with details
            p = updated.projects[0]
            if "backend" in text_lower or "api" in text_lower or "database" in text_lower:
                p.role = "Backend & API Architecture"
            elif "frontend" in text_lower or "ui" in text_lower:
                p.role = "Frontend & Interface Design"
            p.technologies = list(set(p.technologies + [t.capitalize() for t in found_tech]))
            if p.role and p.technologies:
                updated.projects_status = "collected"

    # 3. Interests detection
    interest_keywords = ["ai", "machine learning", "web development", "design", "data science", "cybersecurity", "robotics", "cloud", "backend"]
    found_interests = [i for i in interest_keywords if i in text_lower]
    if found_interests:
        updated.technical_interests = list(set(updated.technical_interests + [i.title() for i in found_interests]))
        updated.interests_status = "collected"

    # 4. Challenges detection
    challenge_indicators = ["difficult", "challenge", "hard", "struggle", "tricky", "async", "scalability", "deployment", "learning"]
    if any(k in text_lower for k in challenge_indicators):
        updated.challenges_and_growth.append(latest_text)
        updated.challenges_status = "collected"

    # 5. Career goals detection
    goal_indicators = ["want to become", "aiming for", "interested in roles", "looking for", "career in", "engineer", "scientist", "developer", "designer"]
    if any(k in text_lower for k in goal_indicators):
        updated.career_goals.append(latest_text)
        updated.goals_status = "collected"

    # Re-calculate completeness
    comp, ready, _ = evaluate_completeness(updated, stage)
    updated.completeness_score = comp
    updated.is_ready_for_recommendations = ready

    return updated


def fallback_select_question(
    profile: DiagnosticProfile,
    stage: str,
    latest_text: str,
    assessment_evidence: Dict[str, Any]
) -> Tuple[str, List[str], str]:
    """Generates the next non-repetitive diagnostic question without premature career suggestions."""
    stage_lower = (stage or "general").lower()
    holland_code = assessment_evidence.get("holland_code", "EAI")

    # If student confirms readiness or completeness is reached:
    if profile.is_ready_for_recommendations:
        summary_lines = []
        if profile.education_background:
            summary_lines.append(f"• Education: {profile.education_background}")
        if profile.projects:
            proj = profile.projects[0]
            summary_lines.append(f"• Project: {proj.name or 'Practical application'} ({proj.role or 'Hands-on contributor'})")
        if profile.technical_skills:
            summary_lines.append(f"• Key Skills: {', '.join(profile.technical_skills[:6])}")
        if profile.technical_interests:
            summary_lines.append(f"• Target Domains: {', '.join(profile.technical_interests[:4])}")

        summary_text = "\n".join(summary_lines) if summary_lines else "Solid foundation in analytical and technical execution."
        profile.summary_of_student = summary_text

        reply = (
            f"Thank you for sharing those details! Here is what I have understood about your experience:\n\n"
            f"{summary_text}\n\n"
            f"Does this capture your background accurately? If so, I am ready to generate your personalized career recommendations!"
        )
        chips = ["Looks accurate, generate my recommendations", "I want to add a detail", "Tell me about skill gaps"]
        return reply, chips, "Summary ready for recommendation generation."

    # Priority 1 for College / Professional: Inquire about projects & practical role
    if stage_lower not in ["school_10th", "sslc_10th", "higher_secondary_12th", "puc_12th"]:
        if profile.projects_status == "not_collected":
            reply = (
                "To recommend careers where you will thrive, I would love to understand your practical work. "
                "Can you tell me about a project, application, or significant assignment you have built or contributed to?"
            )
            chips = ["I built a web application", "I worked on a data/ML project", "I have coursework assignments", "I haven't built large projects yet"]
            return reply, chips, "Collecting practical project information."

        if profile.projects_status == "partially_collected" and profile.projects:
            proj = profile.projects[0]
            if not proj.role or not proj.technologies:
                reply = (
                    f"That sounds like an interesting project! In {proj.name or 'that work'}, "
                    "what were your specific individual responsibilities (e.g. backend logic, database schemas, frontend interfaces, or APIs), and which technologies did you use?"
                )
                chips = ["Backend & REST APIs", "Database & SQL architecture", "Frontend UI/UX", "Full-stack end-to-end"]
                return reply, chips, "Collecting project responsibilities and tools."

        if profile.skills_status != "collected":
            reply = (
                "Which programming languages, frameworks, databases, or developer tools do you feel most comfortable using in practice?"
            )
            chips = ["Python, SQL & APIs", "JavaScript, React & Node.js", "Java & Spring Boot", "Cloud & Docker"]
            return reply, chips, "Collecting technical tools proficiency."

        if profile.challenges_status == "not_collected":
            reply = (
                "Every meaningful build comes with hurdles. What technical challenges did you encounter while working on your projects, and what domains or technologies are you eager to master next?"
            )
            chips = ["Async operations & performance", "Database design & scaling", "Learning cloud deployment", "Machine learning algorithms"]
            return reply, chips, "Collecting growth areas and challenges."

    # Priority for School / PUC:
    if stage_lower in ["school_10th", "sslc_10th"]:
        if profile.interests_status == "not_collected":
            reply = (
                "Finishing 10th standard is an important turning point. Which school subjects (like Science, Math, Social Science) "
                "or personal hobbies (like coding, sketching, music, or gaming) do you find most engaging?"
            )
            chips = ["Science & Mathematics (PCMB)", "Computers & Coding", "Commerce & Accountancy", "Creative Arts & Design"]
            return reply, chips, "Exploring 10th standard interests."

        if profile.preferences_status == "not_collected":
            reply = (
                "When you imagine your next steps in Class 11 and 12, do you see yourself pursuing an academic stream "
                "(Science, Commerce, Arts) targeting university degrees, or a hands-on 3-year Polytechnic technical diploma?"
            )
            chips = ["11th/12th Science (Engineering/Medical)", "11th/12th Commerce (Finance/Business)", "Polytechnic Diploma in Tech", "Arts & Design stream"]
            return reply, chips, "Clarifying 11th/12th stream preference."

    # General fallback
    reply = (
        "What specific career roles, industries, or types of workplace problems are you most interested in exploring?"
    )
    chips = ["Software & AI Engineering", "Data Analytics & Research", "Product Management & Design", "I am open to exploring"]
    return reply, chips, "Collecting career domain direction."


# --------------------------------------------------------------------------- #
# AI LLM Diagnostic Prompting
# --------------------------------------------------------------------------- #

DIAGNOSTIC_COUNSELOR_PROMPT = """You are the Senior AI Diagnostic Career Counselor.

YOUR PRIMARY DIRECTIVE:
Conduct a structured, intelligent diagnostic conversation to understand the student's authentic background, practical projects, technical skills, and goals.

CRITICAL ARCHITECTURAL CONSTRAINTS:
1. NEVER output premature career recommendations or career titles during this diagnostic phase.
2. DO NOT turn this into an endless generic chatbot that repeats "What else?" or asks the same question in different words.
3. Read the previous conversation history and the existing assessment evidence carefully.
4. Extract specific structured facts from the student's latest message and update the Diagnostic Profile.
5. Identify what key information is still missing for their academic level and ask ONE precise, adaptive follow-up question.
6. When sufficient information has been collected, summarize what you understood and ask the student to confirm so career recommendations can be generated.

DIAGNOSTIC DOMAINS TO TRACK:
A. Education Background: Stream, degree, status.
B. Projects & Practical Experience: Specific project name, purpose, student's individual responsibilities, technologies used, challenges, and outcomes.
C. Technical Skills & Evidence: Tools, languages, databases. Distinguish self-reported from applied project experience.
D. Interests & Motivation: Domains the student genuinely enjoys (AI/ML, backend, frontend, data, etc.).
E. Challenges & Growth Areas: Technical hurdles, skills they want to improve.
F. Career Preferences: Target roles, industries, work style.

STAGE-SPECIFIC RULES:
- School (10th / SSLC): DO NOT demand software projects or professional tech skills. Focus on favorite subjects, hobbies, and 11th/12th stream or diploma options.
- 11th/12th (PUC): Focus on streams, entrance exams, and college degree directions.
- Diploma / Polytechnic: Focus on technical branch, hands-on lab work, and lateral entry (B.Tech) vs industry job.
- College UG/PG / Career Switchers: MUST collect at least one concrete project, specific technical responsibilities, and key technologies used.

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "extracted_facts": {
    "education_background": "string or null",
    "education_status": "not_collected" | "partially_collected" | "collected",
    "new_project": {
      "name": "string",
      "description": "string",
      "role": "string",
      "technologies": ["tech1", "tech2"],
      "challenges": "string",
      "outcomes": "string"
    } or null,
    "projects_status": "not_collected" | "partially_collected" | "collected",
    "technical_skills": ["skill1", "skill2"],
    "skills_status": "not_collected" | "partially_collected" | "collected",
    "technical_interests": ["interest1"],
    "interests_status": "not_collected" | "partially_collected" | "collected",
    "challenges_and_growth": ["challenge1"],
    "challenges_status": "not_collected" | "partially_collected" | "collected",
    "career_goals": ["goal1"],
    "goals_status": "not_collected" | "partially_collected" | "collected"
  },
  "is_ready_for_recommendations": boolean,
  "summary_of_student": "2-3 concise bullet points summarizing what was learned",
  "reply": "Warm, conversational response acknowledging their answer and asking ONE precise, adaptive follow-up question (OR confirmation prompt if ready)",
  "suggested_chips": ["Chip 1", "Chip 2", "Chip 3"]
}
"""

def process_diagnostic_turn(
    messages: List[Dict[str, str]],
    student_profile: Dict[str, Any],
    assessment_evidence: Dict[str, Any],
    current_diagnostic: Optional[Dict[str, Any]],
    requested_completion: bool = False,
    user_confirmed: bool = False,
    ai_client: Any = None,
    groq_model: str = "llama-3.3-70b-versatile"
) -> Dict[str, Any]:
    """
    Core entrypoint for processing an AI diagnostic counselor conversation turn.
    Updates the DiagnosticProfile, evaluates completeness, and generates the next adaptive question.
    """
    # Initialize base profile from incoming state or defaults
    if current_diagnostic:
        profile = DiagnosticProfile(**current_diagnostic)
    else:
        profile = DiagnosticProfile()

    # Pre-populate from student_profile if present
    stage = student_profile.get("educationStage") or "college_ug_pg"
    if not profile.education_background:
        course = student_profile.get("course")
        college = student_profile.get("college")
        ed_parts = [p for p in [course, college, stage] if p]
        if ed_parts:
            profile.education_background = " — ".join(ed_parts)
            profile.education_status = "collected"

    # Pre-populate declared resume skills
    resume = student_profile.get("resume") or {}
    resume_skills = student_profile.get("skills") or (resume.get("skills") if isinstance(resume, dict) else []) or []
    if resume_skills and not profile.technical_skills:
        profile.technical_skills = [s.strip() for s in resume_skills if isinstance(s, str)][:8]
        profile.skills_status = "partially_collected"

    user_msgs = [m for m in messages if m.get("role") == "user"]
    latest_text = user_msgs[-1]["content"].strip() if user_msgs else ""

    # Check for explicit user confirmation to finish
    confirm_signals = ["generate my recommendations", "looks accurate", "yes, generate", "show my matches", "yes", "looks good", "correct"]
    if user_confirmed or any(sig in latest_text.lower() for sig in confirm_signals):
        if profile.is_ready_for_recommendations or len(user_msgs) >= 2 or requested_completion:
            return {
                "reply": "Excellent! I have compiled your assessment results and diagnostic profile. Let's generate your personalized career recommendations.",
                "diagnostic_profile": profile.model_dump(),
                "is_ready_for_recommendations": True,
                "user_confirmed": True,
                "completeness_score": max(85, profile.completeness_score),
                "summary": profile.summary_of_student,
                "suggested_chips": ["Generate Recommendations Now"]
            }

    # Attempt AI processing with Groq if available
    if ai_client is not None and latest_text:
        try:
            payload_prompt = f"""{DIAGNOSTIC_COUNSELOR_PROMPT}

ACADEMIC LEVEL: {stage}
HOLLAND RIASEC PROFILE: {assessment_evidence.get('holland_code', 'Unknown')}
ASSESSMENT DEMONSTRATED COMPETENCIES:
{json.dumps(assessment_evidence.get('evidence_tiers', {}), indent=2)}

CURRENT DIAGNOSTIC PROFILE STATE:
{profile.model_dump_json(indent=2)}

STUDENT'S PROFILE CONTEXT:
- Name/User: {student_profile.get('name', 'Student')}
- Course/Stream: {student_profile.get('course')}
- College/School: {student_profile.get('college')}
- Pre-declared Skills: {resume_skills}
- Target Role: {student_profile.get('targetRole')}

CONVERSATION HISTORY:
{json.dumps(messages[-10:], indent=2)}

LATEST STUDENT MESSAGE:
"{latest_text}"

USER REQUESTED EARLY COMPLETION: {requested_completion}

Instructions:
Extract any newly reported facts. Update profile field statuses.
Do not recommend career titles. Ask the next logical diagnostic question, OR if ready/requested, ask for confirmation.
"""
            response = ai_client.chat.completions.create(
                model=groq_model,
                messages=[
                    {"role": "system", "content": "You output strictly valid JSON matching the specified schema."},
                    {"role": "user", "content": payload_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.25,
            )
            parsed = json.loads(response.choices[0].message.content)

            # Apply extracted facts
            ext = parsed.get("extracted_facts", {})
            if ext.get("education_background") and not profile.education_background:
                profile.education_background = ext["education_background"]
            if ext.get("education_status"):
                profile.education_status = ext["education_status"]

            if ext.get("new_project") and isinstance(ext["new_project"], dict):
                np = ext["new_project"]
                # Match existing or append
                matched_proj = None
                for ep in profile.projects:
                    if ep.name.lower() in np.get("name", "").lower() or np.get("name", "").lower() in ep.name.lower():
                        matched_proj = ep
                        break
                if matched_proj:
                    if np.get("role"): matched_proj.role = np["role"]
                    if np.get("technologies"):
                        matched_proj.technologies = list(set(matched_proj.technologies + np["technologies"]))
                    if np.get("challenges"): matched_proj.challenges = np["challenges"]
                    if np.get("outcomes"): matched_proj.outcomes = np["outcomes"]
                else:
                    profile.projects.append(ProjectRecord(**np))

            if ext.get("projects_status"):
                profile.projects_status = ext["projects_status"]

            if ext.get("technical_skills") and isinstance(ext["technical_skills"], list):
                profile.technical_skills = list(set(profile.technical_skills + ext["technical_skills"]))
            if ext.get("skills_status"):
                profile.skills_status = ext["skills_status"]

            if ext.get("technical_interests") and isinstance(ext["technical_interests"], list):
                profile.technical_interests = list(set(profile.technical_interests + ext["technical_interests"]))
            if ext.get("interests_status"):
                profile.interests_status = ext["interests_status"]

            if ext.get("challenges_and_growth") and isinstance(ext["challenges_and_growth"], list):
                profile.challenges_and_growth = list(set(profile.challenges_and_growth + ext["challenges_and_growth"]))
            if ext.get("challenges_status"):
                profile.challenges_status = ext["challenges_status"]

            if ext.get("career_goals") and isinstance(ext["career_goals"], list):
                profile.career_goals = list(set(profile.career_goals + ext["career_goals"]))
            if ext.get("goals_status"):
                profile.goals_status = ext["goals_status"]

            # Calculate deterministic completeness score
            comp, is_ready, field_statuses = evaluate_completeness(profile, stage)
            profile.completeness_score = comp
            profile.is_ready_for_recommendations = is_ready or requested_completion or parsed.get("is_ready_for_recommendations", False)

            if parsed.get("summary_of_student"):
                profile.summary_of_student = parsed["summary_of_student"]

            return {
                "reply": parsed.get("reply", "Could you tell me more about your responsibilities in that project?"),
                "diagnostic_profile": profile.model_dump(),
                "is_ready_for_recommendations": profile.is_ready_for_recommendations,
                "completeness_score": profile.completeness_score,
                "field_statuses": field_statuses,
                "summary": profile.summary_of_student,
                "suggested_chips": parsed.get("suggested_chips", ["Yes", "Tell me more"]),
                "user_confirmed": False
            }
        except Exception as e:
            print(f"[diagnostic_counselor] AI extraction error, falling back to rule-based: {e}")

    # Fallback to deterministic rule-based extraction
    updated_profile = fallback_extract_profile(profile, latest_text, stage)
    if requested_completion:
        updated_profile.is_ready_for_recommendations = True

    reply, chips, summary = fallback_select_question(
        updated_profile, stage, latest_text, assessment_evidence
    )
    comp, is_ready, field_statuses = evaluate_completeness(updated_profile, stage)
    updated_profile.completeness_score = comp
    updated_profile.is_ready_for_recommendations = is_ready or requested_completion

    return {
        "reply": reply,
        "diagnostic_profile": updated_profile.model_dump(),
        "is_ready_for_recommendations": updated_profile.is_ready_for_recommendations,
        "completeness_score": updated_profile.completeness_score,
        "field_statuses": field_statuses,
        "summary": updated_profile.summary_of_student or summary,
        "suggested_chips": chips,
        "user_confirmed": False
    }
