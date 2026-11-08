import os

frontend_assessment_ts = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "frontend", "src", "lib", "assessment.ts"
)

with open(frontend_assessment_ts, "r", encoding="utf-8") as f:
    code = f.read()

# Update CareerMatch interface
if "matched_skills?: string[];" not in code:
    code = code.replace(
        "  software_tools?: string[];\n}",
        "  software_tools?: string[];\n  matched_skills?: string[];\n  missing_skills?: string[];\n  readiness?: 'High' | 'Medium' | 'Developing' | string;\n}"
    )

# Append diagnostic types and helpers if not present
diagnostic_ts_additions = """

// --------------------------------------------------------------------------- //
//  Diagnostic Counselor Protocol Types & Endpoints
// --------------------------------------------------------------------------- //

export interface ProjectRecord {
  name: string;
  description: string;
  role: string;
  technologies: string[];
  challenges?: string;
  outcomes?: string;
}

export interface DiagnosticProfileData {
  education_background: string;
  education_status: string;
  projects: ProjectRecord[];
  projects_status: string;
  technical_skills: string[];
  skills_status: string;
  technical_interests: string[];
  interests_status: string;
  challenges_and_growth: string[];
  challenges_status: string;
  work_preferences: Record<string, string>;
  preferences_status: string;
  career_goals: string[];
  goals_status: string;
  summary_of_student: string;
  completeness_score: number;
  is_ready_for_recommendations: boolean;
  unresolved_questions?: string[];
}

export interface DiagnosticChatResponse {
  reply: string;
  diagnostic_profile: DiagnosticProfileData;
  is_ready_for_recommendations: boolean;
  completeness_score: number;
  field_statuses?: Record<string, string>;
  summary?: string;
  suggested_chips: string[];
  user_confirmed?: boolean;
}

export function sendDiagnosticChatTurn(payload: {
  messages: Array<{ role: string; content: string }>;
  student_profile: Record<string, any>;
  assessment_evidence: Record<string, any>;
  diagnostic_profile?: DiagnosticProfileData | null;
  requested_completion?: boolean;
  user_confirmed?: boolean;
}): Promise<DiagnosticChatResponse> {
  return postJSON<DiagnosticChatResponse>('/api/counselor/diagnostic-chat', payload);
}

export interface DiagnosticRecommendationResult {
  source: 'ai' | 'hybrid_vector' | 'rule';
  matches: CareerMatch[];
  diagnostic_summary: string;
  riasec_scores: RiasecScores;
  riasec_code: string;
  demonstrated_skills_count?: number;
  timestamp?: string;
}

export function generateDiagnosticRecommendations(payload: {
  riasec_scores: RiasecScores;
  code: string;
  interests: string[];
  education?: string;
  work_style: Record<string, string>;
  resume_skills: string[];
  strengths_note?: string;
  know_me: Record<string, unknown>;
  diagnostic_profile: DiagnosticProfileData;
}): Promise<DiagnosticRecommendationResult> {
  return postJSON<DiagnosticRecommendationResult>('/api/counselor/generate-recommendations', payload);
}
"""

if "sendDiagnosticChatTurn" not in code:
    code += diagnostic_ts_additions

with open(frontend_assessment_ts, "w", encoding="utf-8") as f:
    f.write(code)

print("FRONTEND ASSESSMENT.TS PATCHED SUCCESSFULLY")
