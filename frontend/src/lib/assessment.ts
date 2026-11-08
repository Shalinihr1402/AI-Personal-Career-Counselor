import { API_BASE } from './api';

export type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface ScenarioOption {
  id: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
  dim?: Dim;
  fields?: string[];
}

export interface ScenarioQuestion {
  id: string;
  scenario: string;
  options: ScenarioOption[];
}

export interface RiasecQuestion {
  id: string;
  scenario?: string;
  options?: ScenarioOption[];
  dim?: Dim;
  text?: string;
}

export interface ScaleOption {
  value: number;
  label: string;
}

export interface QuestionsResponse {
  questions: ScenarioQuestion[];
  dimensions: Record<Dim, string>;
  total?: number;
  scale?: ScaleOption[];
}

export type RiasecScores = Record<Dim, number>;

export interface ScoreResult {
  scores: RiasecScores;
  code: string;
  top_fields?: string[];
  field_scores?: Record<string, number>;
}

export interface CareerMatch {
  title: string;
  slug?: string;
  fit: number;
  why_it_fits: string;
  day_to_day: string;
  key_skills: string[];
  watch_outs?: string;
  field?: string;
  salary_india?: {
    entry?: string;
    mid?: string;
    senior?: string;
  };
  education?: string;
  software_tools?: string[];
  matched_skills?: string[];
  missing_skills?: string[];
  readiness?: 'High' | 'Medium' | 'Developing' | string;
}

export interface MatchResult {
  source: 'ai' | 'hybrid_vector' | 'rule';
  matches: CareerMatch[];
}

export const DIM_LABEL: Record<Dim, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

export const DIM_ORDER: Dim[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export interface WorkStyleQuestion {
  id: string;
  prompt: string;
  a: string;
  b: string;
}

export const WORK_STYLE_QUESTIONS: WorkStyleQuestion[] = [
  { id: 'people_vs_data', prompt: 'You get more energy from…', a: 'Working with people', b: 'Working with data or things' },
  { id: 'structure_vs_ambiguity', prompt: 'You do your best work with…', a: 'Clear structure and steps', b: 'Open-ended problems' },
  { id: 'build_vs_analyze', prompt: 'You would rather…', a: 'Build and make things', b: 'Analyse and understand things' },
  { id: 'team_vs_solo', prompt: 'You prefer to work…', a: 'Closely with a team', b: 'Independently, on your own' },
];

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export async function fetchQuestions(): Promise<QuestionsResponse> {
  const res = await fetch(`${API_BASE}/api/assessment/questions`);
  if (!res.ok) throw new Error('Could not load the assessment. Is the backend running?');
  return res.json() as Promise<QuestionsResponse>;
}

export function scoreAssessment(answers: Record<string, string | number>): Promise<ScoreResult> {
  return postJSON<ScoreResult>('/api/assessment/score', { answers });
}

export function fetchCareerMatches(payload: {
  riasec_scores: RiasecScores;
  code: string;
  interests: string[];
  education?: string;
  work_style: Record<string, string>;
  resume_skills: string[];
  strengths_note?: string;
  know_me: Record<string, unknown>;
}): Promise<MatchResult> {
  return postJSON<MatchResult>('/api/career-match', payload);
}

// --------------------------------------------------------------------------- //
//  Phase 4.3: Adaptive Assessment & Evidence-Based Competency Types
// --------------------------------------------------------------------------- //

export interface AdaptiveOption {
  id: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
  dimension_weights?: Record<string, number>;
  competency_id?: string;
  competency_level?: string; // 'beginner' | 'intermediate' | 'advanced'
  evidence_level: 'self_reported' | 'declared_only' | 'awareness_conceptual' | 'applied_scenario' | 'verified_practical';
  occupational_fields?: string[];
  practical_verification_note?: string;
}

export interface AdaptiveQuestion {
  id: string;
  stage: string;
  category: 'interest_exploration' | 'competency_demonstration' | 'practical_scenario' | 'workstyle_fit';
  prompt: string;
  options: AdaptiveOption[];
  target_dimensions: string[];
  target_competency_ids?: string[];
  prerequisite_stream?: string;
  prerequisite_domain?: string;
  explanation_tip?: string;
}

export interface AdaptiveQuestionsResponse {
  stage: string;
  questions: AdaptiveQuestion[];
  total: number;
  dimensions: Record<Dim, string>;
}

export interface DemonstratedCompetency {
  competency_id: string;
  level: string;
  evidence_level: string;
  rubric_points: number;
  question_id: string;
  selected_option: string;
  practical_verification_note?: string;
}

export interface SelfReportedSkill {
  skill: string;
  evidence_level: string;
  source: string;
}

export interface EvidenceBreakdown {
  self_reported_skills: SelfReportedSkill[];
  conceptual_knowledge: DemonstratedCompetency[];
  applied_scenario: DemonstratedCompetency[];
  verified_practical: DemonstratedCompetency[];
}

export interface StatutoryPathway {
  career_id: string;
  title: string;
  slug: string;
  is_eligible: boolean;
  eligibility_type: string;
  reason: string;
  missing_prerequisites?: string[];
  recommended_bridge_steps?: string[];
  regulatory_body?: string | null;
  statutory_act?: string | null;
}

export interface StatutoryEligibility {
  eligible_pathways: StatutoryPathway[];
  alternative_pathways: StatutoryPathway[];
  statutory_restrictions: StatutoryPathway[];
}

export interface AdaptiveScoreResult {
  scores: RiasecScores;
  code: string;
  stage: string;
  top_fields: string[];
  field_scores: Record<string, number>;
  top_dimensions: Array<{ dimension: string; score: number; label: string }>;
  demonstrated_competencies: Record<string, DemonstratedCompetency>;
  evidence_breakdown: EvidenceBreakdown;
  statutory_eligibility: StatutoryEligibility;
  practical_disclaimer: string;
}

export function buildProfilePayload(
  profile: Record<string, any> | null | undefined,
  knowMe?: Record<string, any> | null
): Record<string, unknown> {
  if (!profile) return {};
  const ed = profile.education_details || {};
  return {
    education_level: ed.level || profile.educationStage || ed.education_level || undefined,
    education_status: ed.status || ed.education_status || undefined,
    school_board: ed.school_board || profile.schoolBoard || undefined,
    school_stream: ed.school_stream || profile.schoolStream || profile.streamOrBranch || undefined,
    diploma_discipline: ed.diploma_discipline || undefined,
    degree: ed.undergraduate_degree || ed.degree || profile.degree || undefined,
    course: profile.course || ed.course || undefined,
    specialization: ed.undergraduate_discipline || profile.specialization || profile.streamOrBranch || undefined,
    subjects: ed.subjects_studied || ed.subjects || undefined,
    career_mode: profile.career_mode || undefined,
    career_growth_subtype: profile.career_growth_subtype || undefined,
    interests: profile.interests || profile.interest_details?.selected_interests || [],
    skills: profile.resume?.skills || profile.skills_and_experience?.skills || [],
    resume_skills: profile.resume?.skills || [],
    know_me: knowMe || profile.knowMe || {},
    strengths_note: profile.strengthsNote || undefined,
  };
}

export async function fetchAdaptiveQuestions(
  profilePayload: Record<string, unknown>,
  maxQuestions = 12
): Promise<AdaptiveQuestionsResponse> {
  return postJSON<AdaptiveQuestionsResponse>('/api/assessment/adaptive-questions', {
    profile: profilePayload,
    max_questions: maxQuestions,
  });
}

export async function scoreAdaptiveAssessment(
  answers: Record<string, string>,
  profilePayload: Record<string, unknown>
): Promise<AdaptiveScoreResult> {
  return postJSON<AdaptiveScoreResult>('/api/assessment/adaptive-score', {
    answers,
    profile: profilePayload,
  });
}


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
