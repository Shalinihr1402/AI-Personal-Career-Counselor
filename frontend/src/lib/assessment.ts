import { API_BASE } from './api';

export type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RiasecQuestion {
  id: string;
  dim: Dim;
  text: string;
}

export interface ScaleOption {
  value: number;
  label: string;
}

export interface QuestionsResponse {
  questions: RiasecQuestion[];
  scale: ScaleOption[];
  dimensions: Record<Dim, string>;
}

export type RiasecScores = Record<Dim, number>;

export interface ScoreResult {
  scores: RiasecScores;
  code: string;
}

export interface CareerMatch {
  title: string;
  fit: number;
  why_it_fits: string;
  day_to_day: string;
  key_skills: string[];
  watch_outs: string;
}

export interface MatchResult {
  source: 'ai' | 'rule';
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

export function scoreAssessment(answers: Record<string, number>): Promise<ScoreResult> {
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
