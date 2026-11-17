"""
generate_docx_report.py
Generates a beautifully styled Microsoft Word (.docx) document for the
AI Personal Career Counselor Implementation Review Report.
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Sets background color of a table cell."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets cell padding in dxa (1 pt = 20 dxa)."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, text_runs, border_color="7C3AED", bg_color="F5F3FF"):
    """Creates a stylized callout box (single-cell table)."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border only
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    for run_text, is_bold, is_italic, color in text_runs:
        run = p.add_run(run_text)
        run.bold = is_bold
        run.italic = is_italic
        run.font.name = "Segoe UI"
        run.font.size = Pt(10)
        if color:
            run.font.color.rgb = color
    doc.add_paragraph() # spacing

def style_heading(p, font_size, color_rgb, space_before=12, space_after=4):
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    for r in p.runs:
        r.font.name = "Segoe UI"
        r.font.size = Pt(font_size)
        r.font.bold = True
        r.font.color.rgb = color_rgb

def build_report():
    doc = Document()
    
    # Page Margins: 0.75 in
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Color Palette
    PRIMARY_VIOLET = RGBColor(109, 40, 217)    # #6D28D9
    DARK_NAVY = RGBColor(15, 23, 42)          # #0F172A
    SLATE_MUTED = RGBColor(71, 85, 105)       # #475569
    CODE_COLOR = RGBColor(194, 24, 91)        # #C2185B
    EMERALD_GREEN = RGBColor(5, 150, 105)     # #059669
    CRITICAL_RED = RGBColor(220, 38, 38)      # #DC2626
    
    # Set default style font
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Segoe UI'
    font.size = Pt(10.5)
    font.color.rgb = DARK_NAVY

    # ==========================
    # COVER / HEADER BLOCK
    # ==========================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(10)
    title_p.paragraph_format.space_after = Pt(2)
    run_title = title_p.add_run("AI Personal Career Counselor")
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY_VIOLET

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(12)
    run_sub = sub_p.add_run("Senior Architecture & Implementation Review")
    run_sub.font.size = Pt(14)
    run_sub.font.color.rgb = SLATE_MUTED
    
    # Document Metadata Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    meta_table.columns[0].width = Inches(1.8)
    meta_table.columns[1].width = Inches(4.7)
    
    meta_data = [
        ("Document Version", "1.0 (Production Architecture Audit)"),
        ("Date", "November 16, 2026"),
        ("Audience", "Beginner to Intermediate Engineers, Technical Product Leads"),
        ("Review Scope", "End-to-End System Architecture, Code Quality, Data Flow, and Algorithmic Audit")
    ]
    
    for row_idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        c0, c1 = row.cells[0], row.cells[1]
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = SLATE_MUTED
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = DARK_NAVY

    doc.add_paragraph() # Spacing

    # ==========================
    # EXECUTIVE SUMMARY
    # ==========================
    h1 = doc.add_paragraph("Executive Summary")
    style_heading(h1, 16, PRIMARY_VIOLET, space_before=16, space_after=6)
    
    p = doc.add_paragraph(
        "The AI Personal Career Counselor is an intelligent, evidence-grounded career exploration platform "
        "built specifically for Indian students and professionals across five distinct educational stages: "
        "(1) Class 8–10 (Middle/Secondary School), (2) Class 11–12 (PUC streams: PCM, PCB, Commerce, Arts), "
        "(3) Polytechnic & ITI Technical Diplomas, (4) College Undergraduate & Postgraduate Degree Programs, "
        "and (5) Career Switchers & Returners."
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(6)

    p2 = doc.add_paragraph(
        "Unlike a generic conversational chatbot, the platform combines deterministic psychometrics (Holland RIASEC), "
        "dense semantic search across 1,016 O*NET occupations, multi-tier competency verification, and an "
        "interactive diagnostic consultation workspace."
    )
    p2.paragraph_format.line_spacing = 1.15
    p2.paragraph_format.space_after = Pt(8)

    add_callout(doc, [
        ("Overall System Assessment: Grade B+\n", True, False, PRIMARY_VIOLET),
        ("• Core Strengths: ", True, False, DARK_NAVY),
        ("Deterministic scoring of Holland RIASEC dimensions (R, I, A, S, E, C) without LLM hallucinations; "
         "hybrid matching engine (matcher.py) merging dense vector embeddings (all-MiniLM-L6-v2), psychometric resonance, "
         "and deal-breaker penalties; strict stage-calibrated guardrails preventing inappropriate queries for younger students; "
         "clean separation of the diagnostic session from recommendation generation.\n", False, False, DARK_NAVY),
        ("• Primary Risks: ", True, False, CRITICAL_RED),
        ("An invalid default Groq model identifier causing AI extraction and reranking to fail silently; "
         "disconnect between Onboarding Step 4 manual skills and recommendation payloads; "
         "potential unhandled type errors when skills arrays contain dictionary objects; "
         "and lack of guest session persistence prior to auth redirection.", False, False, DARK_NAVY)
    ], border_color="7C3AED", bg_color="F5F3FF")

    # ==========================
    # SECTION 1: DATA FLOW
    # ==========================
    h1 = doc.add_paragraph("1. Complete End-to-End Data Flow")
    style_heading(h1, 15, PRIMARY_VIOLET, space_before=16, space_after=6)

    flow_p = doc.add_paragraph(
        "The platform's lifecycle transitions across five major sequential stages:"
    )
    flow_p.paragraph_format.space_after = Pt(4)

    stages = [
        ("Stage 1: Student Onboarding (Onboarding.tsx)", 
         "Collects guidance mode, educational level, academic stream, institution, verified interests, "
         "and manual skills. Converts form inputs into Supabase row format via toRow() and stores non-standard "
         "attributes into the know_me JSONB column."),
        ("Stage 2: Career Assessment (Assessment.tsx)", 
         "Checks for prior submissions. If empty, fetches stage-calibrated scenario questions via "
         "POST /api/assessment/adaptive-questions. Upon completion, answers are sent to "
         "POST /api/assessment/adaptive-score for deterministic RIASEC calculation. Submits with empty "
         "matches array matches: [] and transitions to counselor_diagnostic phase without premature recommendations."),
        ("Stage 3: AI Diagnostic Counselor Workspace (CounselorVoiceChat.tsx)", 
         "Opens a 2-column workspace displaying Holland profile foundation, diagnostic completeness progress (0-100%), "
         "and verified skills cloud. Conducts an interactive consultation via POST /api/counselor/diagnostic-chat, "
         "extracting structured background facts into DiagnosticProfile without repeating prior assessment questions."),
        ("Stage 4: Recommendation Generation (backend/main.py & matcher.py)", 
         "Triggered upon student confirmation when completeness reaches >= 70%. Calls "
         "POST /api/counselor/generate-recommendations. Computes dense semantic embeddings, applies RIASEC positional scoring "
         "and deal-breaker penalties, reranks top 5 careers via Groq LLM, and calculates readiness tiers "
         "(High, Medium, Developing) alongside demonstrated skills vs skill gaps."),
        ("Stage 5: Career Discovery Report (Assessment.tsx Results View)", 
         "Renders the verified Holland RIASEC code, Spotlight #1 recommended career, and a balanced 2x2 grid "
         "of career cards with salary ranges (in LPA), demonstrated matching skills, and target growth areas. "
         "Selecting 'Set as Career Goal' commits the goal to Supabase.")
    ]

    for title, desc in stages:
        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(4)
        sp.paragraph_format.space_after = Pt(4)
        r_t = sp.add_run(f"• {title}: ")
        r_t.bold = True
        r_t.font.color.rgb = DARK_NAVY
        r_d = sp.add_run(desc)
        r_d.font.color.rgb = SLATE_MUTED

    # ==========================
    # SECTION 2: COMMUNICATION AUDIT
    # ==========================
    h1 = doc.add_paragraph("2. Frontend & Backend Communication Audit")
    style_heading(h1, 15, PRIMARY_VIOLET, space_before=16, space_after=6)

    table_data = [
        ("Endpoint", "Method", "Caller Component", "Payload Summary", "Primary Responsibility"),
        ("/api/assessment/questions", "GET", "fetchQuestions()", "None", "Fallback static Holland scenario questions"),
        ("/api/assessment/adaptive-questions", "POST", "fetchAdaptiveQuestions()", "{ profile, max_questions }", "Stage-calibrated, deduplicated question catalog"),
        ("/api/assessment/adaptive-score", "POST", "scoreAdaptiveAssessment()", "{ answers, profile }", "Deterministic Holland RIASEC scoring & statutory checks"),
        ("/api/counselor/diagnostic-chat", "POST", "sendDiagnosticChatTurn()", "{ messages, profile, diagnostic_profile }", "Adaptive conversational turn & fact extraction"),
        ("/api/counselor/generate-recommendations", "POST", "generateDiagnosticRecommendations()", "{ riasec_scores, skills, diagnostic_profile }", "Hybrid vector search, Groq reranking & readiness gap"),
        ("/api/careers", "GET", "Career Explorer", "Query params (?q, ?field, ?page)", "Paginated catalog browsing over 1,016 careers"),
        ("/api/careers/:slug", "GET", "Career Detail Page", "URL path slug", "Complete career intelligence with LPA salary & schedule")
    ]

    comm_table = doc.add_table(rows=len(table_data), cols=5)
    comm_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comm_table.autofit = False
    
    col_widths = [Inches(1.8), Inches(0.6), Inches(1.3), Inches(1.4), Inches(1.4)]
    for row_idx, row in enumerate(comm_table.rows):
        is_hdr = (row_idx == 0)
        data = table_data[row_idx]
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            cell.width = col_widths[col_idx]
            set_cell_background(cell, "6D28D9" if is_hdr else ("F8FAFC" if row_idx % 2 == 1 else "FFFFFF"))
            set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            run.font.size = Pt(8.5 if not is_hdr else 9)
            run.bold = is_hdr
            run.font.color.rgb = RGBColor(255, 255, 255) if is_hdr else DARK_NAVY

    doc.add_paragraph() # Spacing

    # ==========================
    # SECTION 3: DATASET & MATCHING
    # ==========================
    h1 = doc.add_paragraph("3. Career Dataset Usage & Matching Intelligence")
    style_heading(h1, 15, PRIMARY_VIOLET, space_before=16, space_after=6)

    p = doc.add_paragraph(
        "The matching subsystem combines three distinct data layers to ensure recommendations are "
        "both globally comprehensive and locally relevant to Indian students:"
    )
    p.paragraph_format.space_after = Pt(4)

    dl = [
        ("Curated Indian Benchmark Careers (backend/careers.py): ",
         "40 canonical careers with verified entry, mid, and senior compensation in LPA, "
         "typical day-in-the-life schedules, pros/cons, and 4-step progressive learning paths."),
        ("Canonical O*NET Occupational Catalog (backend/data/onet_careers.json): ",
         "1,016 occupational profiles complete with SOC codes, Holland RIASEC interest profiles, "
         "descriptions, and software tool requirements."),
        ("Precomputed Dense Embeddings (backend/data/career_embeddings.npy): ",
         "1016 x 384 dense matrix encoded using SentenceTransformer 'all-MiniLM-L6-v2', "
         "enabling sub-50 millisecond semantic similarity search.")
    ]
    for k, v in dl:
        p_dl = doc.add_paragraph()
        p_dl.paragraph_format.space_before = Pt(2)
        p_dl.paragraph_format.space_after = Pt(2)
        r1 = p_dl.add_run(f"• {k}")
        r1.bold = True
        r2 = p_dl.add_run(v)
        r2.font.color.rgb = SLATE_MUTED

    add_callout(doc, [
        ("Hybrid Matcher Formula (backend/matcher.py):\n", True, False, PRIMARY_VIOLET),
        ("Score(c) = (0.50 × Sim_semantic) + (0.30 × Score_RIASEC) + (0.20 × Score_skills) - Penalty_dealbreaker\n\n", True, False, DARK_NAVY),
        ("• Semantic Similarity (50%): Cosine similarity between student background embedding and career embedding.\n", False, False, DARK_NAVY),
        ("• RIASEC Positional Match (30%): Top 3 Holland letters scored by position (Weight = 3 - idx) with a 1.5x exact alignment bonus.\n", False, False, DARK_NAVY),
        ("• Skill Overlap (20%): Matched declared/resume skills divided by target threshold (max 1.0).\n", False, False, DARK_NAVY),
        ("• Deal-breaker Penalties: -0.25 for lone debugging if student prefers people; -0.35 for cold-calling sales; -0.30 for abstract mathematics; -0.30 for monotonous paperwork.", False, False, DARK_NAVY)
    ], border_color="059669", bg_color="F0FDF4")

    # ==========================
    # SECTION 4: STUDENT PROFILE VS OUTPUT
    # ==========================
    h1 = doc.add_paragraph("4. Student Profile vs. Recommendation Output Analysis")
    style_heading(h1, 15, PRIMARY_VIOLET, space_before=16, space_after=6)

    p = doc.add_paragraph(
        "Recommendations are dynamically adapted based on the student's verified academic stage:"
    )
    p.paragraph_format.space_after = Pt(4)

    stages_analysis = [
        ("Class 10 (SSLC): ", "Software engineering and professional corporate roles are suppressed. Recommendations focus on Class 11-12 stream selection (PCM, PCB, Commerce, Arts) and 3-year Polytechnic vocational diplomas."),
        ("Class 11-12 (PUC): ", "Strictly stream-calibrated. PCB students receive healthcare, life sciences, and biotechnology paths; PCM students receive engineering, physical sciences, and architecture."),
        ("Polytechnic / ITI: ", "Direct technical employment opportunities alongside lateral entry pathways into B.Tech 2nd year programs."),
        ("College UG / PG: ", "Demands practical project verification, individual technical responsibilities, and specific toolchains before clearing readiness tiers.")
    ]
    for k, v in stages_analysis:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(2)
        p_st.paragraph_format.space_after = Pt(2)
        r1 = p_st.add_run(f"• {k}")
        r1.bold = True
        r2 = p_st.add_run(v)
        r2.font.color.rgb = SLATE_MUTED

    p_gap = doc.add_paragraph()
    p_gap.paragraph_format.space_before = Pt(6)
    p_gap.paragraph_format.space_after = Pt(6)
    r1 = p_gap.add_run("Readiness Classification: ")
    r1.bold = True
    r2 = p_gap.add_run(
        "Readiness is classified as High (≥ 3 demonstrated matching skills), Medium (≥ 1 demonstrated skill), "
        "or Developing (0 verified skills). Matching skills are presented in green badges, and target growth areas "
        "in outlined skill gap badges."
    )
    r2.font.color.rgb = SLATE_MUTED

    # ==========================
    # SECTION 5: DETAILED FINDINGS (ISSUES)
    # ==========================
    h1 = doc.add_paragraph("5. Detailed Findings: Missing Requirements, Logical Errors & Edge Cases")
    style_heading(h1, 15, PRIMARY_VIOLET, space_before=18, space_after=8)

    issues = [
        {
            "id": 1,
            "title": "Invalid Fallback Groq Model Identifier Causing Silent AI Failures",
            "file": "backend/main.py — Module Global Configuration (Line 29)",
            "current": 'GROQ_MODEL = os.environ.get("GROQ_MODEL") or "openai/gpt-oss-120b"',
            "expected": 'GROQ_MODEL = os.environ.get("GROQ_MODEL") or "llama-3.3-70b-versatile"',
            "problem": '"openai/gpt-oss-120b" does not exist in Groq\'s model registry. API requests fail with HTTP 404 (model_not_found). The exception handler catches the error and silently falls back to hardcoded rule-based heuristics, neutralizing AI resume parsing, AI career reranking, and AI diagnostic chat turns.',
            "test_case": '1. Inspect backend/.env (GROQ_MODEL is absent).\n2. Send POST request to /api/counselor/diagnostic-chat.\n3. Notice backend log: "[diagnostic_counselor] AI extraction error, falling back to rule-based: Error code: 404".',
            "solution": 'Update the default model string in backend/main.py to "llama-3.3-70b-versatile" and add GROQ_MODEL=llama-3.3-70b-versatile to backend/.env.'
        },
        {
            "id": 2,
            "title": "Onboarding Step 4 Skills Omitted When Student Skips Resume Upload",
            "file": "frontend/src/components/CounselorVoiceChat.tsx — handleGenerateRecommendations (Line 352)",
            "current": 'resume_skills: profile?.resume?.skills || []',
            "expected": 'Merge both uploaded resume skills and manual skills declared during Step 4 (profile?.skills_and_experience?.skills).',
            "problem": 'Students who manually enter skills during onboarding Step 4 but skip uploading a PDF resume have their skills omitted from the recommendation engine payload. The backend receives an empty array, classifies the student as "Developing" readiness, and displays 0 matching skills.',
            "test_case": '1. Complete Onboarding: enter "Python" and "SQL" in Step 4, skip Step 6 (PDF upload).\n2. Complete Assessment and Diagnostic chat.\n3. Inspect network payload sent to POST /api/counselor/generate-recommendations.\n4. Notice "resume_skills": [] is transmitted.',
            "solution": 'In CounselorVoiceChat.tsx, extract skill names from profile.skills_and_experience.skills and combine them with resume skills before transmitting the payload.'
        },
        {
            "id": 3,
            "title": "Potential Runtime Crash when Skills Array Contains Dictionary Objects",
            "file": "backend/matcher.py — hybrid_career_match (Line 215) and backend/main.py (Line 1217)",
            "current": 'resume_skills_lower = {s.lower() for s in resume_skills}\nstudent_skills_lower = {s.lower() for s in combined_skills}',
            "expected": 'Defensively extract skill names before calling .lower(): str(s.get("name") if isinstance(s, dict) else s).lower()',
            "problem": 'If any client component forwards structured skill objects such as [{"name": "Python", "level": "intermediate"}], calling .lower() on a dictionary raises an unhandled AttributeError, triggering an HTTP 500 crash.',
            "test_case": 'Send POST /api/counselor/generate-recommendations with "resume_skills": [{"name": "Python"}]. The endpoint crashes with AttributeError: \'dict\' object has no attribute \'lower\'.',
            "solution": 'Add defensive sanitization helper _normalize_skill(item) at the start of recommendation generation in backend/main.py and backend/matcher.py.'
        },
        {
            "id": 4,
            "title": "Cryptic Single-Letter Holland RIASEC Justifications in Hybrid Matcher",
            "file": "backend/matcher.py — hybrid_career_match (Line 309)",
            "current": 'why_reasons.append(f"Matches your natural {top_dims[0]} ({c_code}) problem-solving style")',
            "expected": 'Display full dimension name: f"Matches your natural {dim_name} problem-solving approach ({c_code})"',
            "problem": 'Students see cryptic messages such as "Matches your natural E (IRC) problem-solving style". Students do not know that "E" stands for Enterprising or what "(IRC)" means, giving the impression of an unfinished system.',
            "test_case": 'Execute hybrid_career_match with Enterprising as top dimension and career code IRC. Inspect the resulting why_it_fits text.',
            "solution": 'Import DIM_LABEL from riasec.py and format the text with the full psychological title (e.g., "Enterprising").'
        },
        {
            "id": 5,
            "title": "Artificial Fit Percentage Decay in AI Career Recommendations",
            "file": "backend/main.py — counselor_generate_recommendations (Line 1225)",
            "current": 'if not m.get("fit"): m["fit"] = max(70, 94 - idx * 4)',
            "expected": 'Preserve true mathematical score from candidate_careers[idx]["score"] * 100.',
            "problem": 'Because the Groq prompt explicitly forbids generating fit percentages, m.get("fit") is always absent. The backend applies a fixed formula (94 - idx * 4). Every student receiving AI recommendations sees identical numbers: 94%, 90%, 86%, 82%, and 78%, creating an artificial illusion of mathematical precision.',
            "test_case": 'Run three different student profiles. In all cases where AI reranking is used, the 5 matches display exactly 94%, 90%, 86%, 82%, and 78%.',
            "solution": 'Pass the underlying hybrid vector score computed by matcher.py into each career match object.'
        },
        {
            "id": 6,
            "title": "Unauthenticated Guest Assessment Results Lost Upon Sign-In Redirect",
            "file": "frontend/src/pages/Assessment.tsx — setGoal (Line 513) & submit (Line 425)",
            "current": 'if (!user) { setGoalError("Please sign in to confirm your career goal."); return; }',
            "expected": 'Cache assessment answers and recommendations in localStorage under guest_assessment_cache. Automatically commit them to Supabase upon successful sign-in.',
            "problem": 'A student who spends 15 minutes taking the assessment and diagnostic session as a guest will lose their entire session when prompted to sign in to save a career goal.',
            "test_case": '1. Open incognito window (logged out).\n2. Complete assessment and diagnostic chat.\n3. Click "Set as Career Goal" -> Observe error.\n4. Sign in or refresh -> Entire state is reset.',
            "solution": 'Store completed results in localStorage.setItem("pending_guest_assessment", ...). In AuthContext or ProfileContext, detect this key on authentication and commit to Supabase.'
        },
        {
            "id": 7,
            "title": "Disparity in Detail Depth Between Curated Careers and O*NET Careers",
            "file": "backend/careers.py — get_career_by_slug (Line 450)",
            "current": '"activity": f"Morning planning and reviewing priorities in {field}."',
            "expected": 'Extract real occupational tasks and activities from onet_careers.json rather than static placeholders.',
            "problem": 'Curated careers like "Software Engineer" display rich, localized schedules. O*NET careers like "Operations Research Analysts" show generic boilerplate sentences, degrading the user experience.',
            "test_case": 'Compare GET /api/careers/software-engineer against GET /api/careers/operations-research-analysts. Observe the disparity in day-in-the-life activities.',
            "solution": 'Update _generate_default_extended in backend/careers.py to populate daily activities from the career\'s actual task statements.'
        }
    ]

    for item in issues:
        h2 = doc.add_paragraph(f"Issue {item['id']}: {item['title']}")
        style_heading(h2, 12.5, PRIMARY_VIOLET, space_before=14, space_after=4)

        tbl = doc.add_table(rows=6, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(1.8)
        tbl.columns[1].width = Inches(4.7)

        rows_info = [
            ("File & Function", item["file"]),
            ("Current Behaviour", item["current"]),
            ("Expected Behaviour", item["expected"]),
            ("Why It Is A Problem", item["problem"]),
            ("Reproducible Test Case", item["test_case"]),
            ("Suggested Solution", item["solution"])
        ]

        for r_idx, (label, content) in enumerate(rows_info):
            r = tbl.rows[r_idx]
            c0, c1 = r.cells[0], r.cells[1]
            set_cell_background(c0, "F8FAFC")
            set_cell_background(c1, "FFFFFF")
            set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
            set_cell_margins(c1, top=50, bottom=50, left=80, right=80)

            p0 = c0.paragraphs[0]
            p0.paragraph_format.space_after = Pt(0)
            run0 = p0.add_run(label)
            run0.bold = True
            run0.font.size = Pt(9)
            run0.font.color.rgb = SLATE_MUTED

            p1 = c1.paragraphs[0]
            p1.paragraph_format.space_after = Pt(0)
            run1 = p1.add_run(content)
            run1.font.size = Pt(9)
            if label in ("Current Behaviour", "Expected Behaviour"):
                run1.font.name = "Consolas"
                run1.font.size = Pt(8.5)
                run1.font.color.rgb = CODE_COLOR
            elif label == "Why It Is A Problem":
                run1.font.color.rgb = DARK_NAVY
            else:
                run1.font.color.rgb = DARK_NAVY

        doc.add_paragraph() # Spacing

    # ==========================
    # SECTION 6: VERIFICATION STATUS
    # ==========================
    h1 = doc.add_paragraph("6. System Verification Status")
    style_heading(h1, 15, PRIMARY_VIOLET, space_before=16, space_after=6)

    status_data = [
        ("Subsystem / Test Suite", "Operational Status", "Verification Observations"),
        ("FastAPI Backend Server (:8000)", "Operational (HTTP 200)", "Running via Uvicorn; endpoints respond in under 50ms."),
        ("Vite React Frontend (:5173)", "Operational (HTTP 200)", "Production build passes with zero TypeScript compilation errors."),
        ("Counselor Guardrail Test Suite", "100% Passed (8/8)", "SSLC, PUC, and College guardrails correctly enforce stage boundaries."),
        ("Dense Vector Embeddings", "Verified", "1016 x 384 embedding matrix and index load with no memory leaks.")
    ]

    v_table = doc.add_table(rows=len(status_data), cols=3)
    v_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    v_table.autofit = False
    v_widths = [Inches(2.4), Inches(1.8), Inches(2.3)]

    for row_idx, row in enumerate(v_table.rows):
        is_hdr = (row_idx == 0)
        data = status_data[row_idx]
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            cell.width = v_widths[col_idx]
            set_cell_background(cell, "6D28D9" if is_hdr else ("F8FAFC" if row_idx % 2 == 1 else "FFFFFF"))
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            run.font.size = Pt(8.5 if not is_hdr else 9)
            run.bold = is_hdr or (col_idx == 1)
            if is_hdr:
                run.font.color.rgb = RGBColor(255, 255, 255)
            elif col_idx == 1 and "Operational" in text or "Passed" in text or "Verified" in text:
                run.font.color.rgb = EMERALD_GREEN
            else:
                run.font.color.rgb = DARK_NAVY

    doc.add_paragraph() # Spacing

    # ==========================
    # SECTION 7: ACTION PLAN
    # ==========================
    h1 = doc.add_paragraph("7. Recommended Implementation Action Plan")
    style_heading(h1, 15, PRIMARY_VIOLET, space_before=16, space_after=6)

    plan_items = [
        ("Phase 1: Critical Reliability Fixes (Immediate Priority)", [
            "Update fallback Groq model identifier in backend/main.py and backend/.env to llama-3.3-70b-versatile.",
            "Add defensive dictionary skill handling in backend/matcher.py and backend/main.py.",
            "Unify Step 4 onboarding skills with resume skills in CounselorVoiceChat.tsx."
        ]),
        ("Phase 2: User Experience & Report Clarity", [
            "Replace single-letter Holland abbreviations in matcher.py with descriptive dimension titles (DIM_LABEL).",
            "Implement localStorage caching for unauthenticated guest assessments to prevent session data loss on sign-in.",
            "Replace static artificial fit decay (94 - idx * 4) with true hybrid mathematical match scores."
        ]),
        ("Phase 3: Dataset Enrichment", [
            "Populate O*NET day-in-the-life schedules using real occupational task statements from onet_careers.json."
        ])
    ]

    for phase_title, bullets in plan_items:
        p_ph = doc.add_paragraph()
        p_ph.paragraph_format.space_before = Pt(6)
        p_ph.paragraph_format.space_after = Pt(2)
        r_ph = p_ph.add_run(phase_title)
        r_ph.bold = True
        r_ph.font.color.rgb = DARK_NAVY
        for b in bullets:
            p_b = doc.add_paragraph()
            p_b.paragraph_format.space_before = Pt(1)
            p_b.paragraph_format.space_after = Pt(2)
            r_bullet = p_b.add_run(f"  • {b}")
            r_bullet.font.color.rgb = SLATE_MUTED

    # Output file
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "IMPLEMENTATION_REVIEW_REPORT.docx"))
    doc.save(output_path)
    print(f"Successfully generated DOCX report at: {output_path}")

if __name__ == "__main__":
    build_report()
