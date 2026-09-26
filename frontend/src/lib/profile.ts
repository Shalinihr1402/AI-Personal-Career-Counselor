import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { KnowMe } from './knowMe';
import type { CareerMatch, RiasecScores } from './assessment';
import type { CareerPath, OnboardingRecord } from './onboarding';

/**
 * Persistence for the counselor phase: the student's profile and their
 * discovery results, stored in Supabase tables (see supabase/migrations).
 * The app works with camelCase objects; the tables use snake_case.
 */

export interface Profile extends OnboardingRecord {
  knowMe?: KnowMe;
  onboardingComplete: boolean;
}

export interface SavedAssessment {
  id: string;
  code: string;
  scores: RiasecScores;
  matches: CareerMatch[];
  source: 'ai' | 'rule';
  workStyle: Record<string, string>;
  knowMe?: KnowMe;
  createdAt: string;
}

interface ProfileRow {
  user_id: string;
  path: CareerPath | null;
  college: string | null;
  course: string | null;
  year: string | null;
  interests: string[] | null;
  strengths_note: string | null;
  target_role: string | null;
  hours_per_week: string | null;
  resume: Profile['resume'] | null;
  know_me: KnowMe | null;
  onboarding_complete: boolean;
}

interface AssessmentRow {
  id: string;
  code: string;
  scores: RiasecScores;
  matches: CareerMatch[];
  source: 'ai' | 'rule';
  work_style: Record<string, string>;
  know_me: KnowMe | null;
  created_at: string;
}

function fromRow(r: ProfileRow): Profile {
  return {
    path: r.path,
    college: r.college ?? undefined,
    course: r.course ?? undefined,
    year: r.year ?? undefined,
    interests: r.interests ?? [],
    strengthsNote: r.strengths_note ?? undefined,
    targetRole: r.target_role ?? undefined,
    hoursPerWeek: r.hours_per_week ?? undefined,
    resume: r.resume ?? undefined,
    knowMe: r.know_me ?? undefined,
    onboardingComplete: r.onboarding_complete,
  };
}

function toRow(userId: string, p: Partial<Profile>): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = { user_id: userId };
  if ('path' in p) row.path = p.path ?? null;
  if ('college' in p) row.college = p.college ?? null;
  if ('course' in p) row.course = p.course ?? null;
  if ('year' in p) row.year = p.year ?? null;
  if ('interests' in p) row.interests = p.interests ?? [];
  if ('strengthsNote' in p) row.strengths_note = p.strengthsNote ?? null;
  if ('targetRole' in p) row.target_role = p.targetRole ?? null;
  if ('hoursPerWeek' in p) row.hours_per_week = p.hoursPerWeek ?? null;
  if ('resume' in p) row.resume = p.resume ?? null;
  if ('knowMe' in p) row.know_me = p.knowMe ?? null;
  if ('onboardingComplete' in p) row.onboarding_complete = Boolean(p.onboardingComplete);
  return row;
}

function assessmentFromRow(r: AssessmentRow): SavedAssessment {
  return {
    id: r.id,
    code: r.code,
    scores: r.scores,
    matches: r.matches ?? [],
    source: r.source,
    workStyle: r.work_style ?? {},
    knowMe: r.know_me ?? undefined,
    createdAt: r.created_at,
  };
}

/** Postgres/PostgREST codes meaning "the table doesn't exist yet". */
export function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as ProfileRow) : null;
}

export async function saveProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(toRow(userId, patch), { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return fromRow(data as ProfileRow);
}

export async function loadLatestAssessment(userId: string): Promise<SavedAssessment | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('id, code, scores, matches, source, work_style, know_me, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? assessmentFromRow(data as AssessmentRow) : null;
}

export async function saveAssessment(
  userId: string,
  a: {
    answers: Record<string, number>;
    workStyle: Record<string, string>;
    knowMe?: KnowMe;
    scores: RiasecScores;
    code: string;
    matches: CareerMatch[];
    source: 'ai' | 'rule';
  },
): Promise<SavedAssessment> {
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      user_id: userId,
      answers: a.answers,
      work_style: a.workStyle,
      know_me: a.knowMe ?? null,
      scores: a.scores,
      code: a.code,
      matches: a.matches,
      source: a.source,
    })
    .select('id, code, scores, matches, source, work_style, know_me, created_at')
    .single();
  if (error) throw error;
  return assessmentFromRow(data as AssessmentRow);
}

/**
 * One-time move of data saved before the database existed (in the auth
 * user's metadata) into the profiles table.
 */
export function legacyProfileFromMetadata(user: User): Partial<Profile> | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const onboarding = meta?.onboarding as OnboardingRecord | undefined;
  if (!onboarding) return null;
  return {
    ...onboarding,
    interests: onboarding.interests ?? [],
    onboardingComplete: Boolean(meta?.onboarding_complete),
  };
}
