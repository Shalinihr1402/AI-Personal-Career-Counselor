import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { KnowMe } from './knowMe';
import type { CareerMatch, RiasecScores, AdaptiveScoreResult } from './assessment';
import { type CareerMode, type CareerPath, type EducationStage, type OnboardingRecord, CAREER_MODE_TO_PATH, PATH_TO_CAREER_MODE } from './onboarding';

/**
 * Persistence for the counselor phase: the student's profile and their
 * discovery results, stored in Supabase tables (see supabase/migrations).
 * The app works with camelCase objects; the tables use snake_case.
 */

export interface Profile extends OnboardingRecord {
  career_mode?: CareerMode | null;
  educationStage?: EducationStage;
  streamOrBranch?: string;
  knowMe?: KnowMe;
  onboardingComplete: boolean;
}

export interface SavedAssessment {
  id: string;
  code: string;
  scores: RiasecScores;
  matches: CareerMatch[];
  source: 'ai' | 'hybrid_vector' | 'rule';
  workStyle: Record<string, string>;
  knowMe?: KnowMe;
  adaptiveEvidence?: AdaptiveScoreResult | null;
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
  know_me: (KnowMe & {
    educationStage?: EducationStage;
    streamOrBranch?: string;
    career_growth_subtype?: any;
    user_persona?: any;
    skills_and_experience?: any;
    career_discovery_preferences?: any;
    student_exploration_preferences?: any;
    career_planning_preferences?: any;
    career_transition_preferences?: any;
    [key: string]: any;
  }) | null;
  onboarding_complete: boolean;
}

interface AssessmentRow {
  id: string;
  code: string;
  scores: RiasecScores;
  matches: CareerMatch[];
  source: 'ai' | 'hybrid_vector' | 'rule';
  work_style: Record<string, string>;
  know_me: KnowMe | null;
  adaptive_evidence?: AdaptiveScoreResult | null;
  created_at: string;
}

export function fromRow(r: ProfileRow): Profile {
  const km = r.know_me;
  const careerMode = (km as any)?.career_mode ?? (r.path ? PATH_TO_CAREER_MODE[r.path] : undefined);
  return {
    path: r.path,
    career_mode: careerMode,
    career_growth_subtype: (km as any)?.career_growth_subtype || undefined,
    user_persona: (km as any)?.user_persona || undefined,
    college: r.college ?? undefined,
    course: r.course ?? undefined,
    year: r.year ?? undefined,
    interests: r.interests ?? [],
    strengthsNote: r.strengths_note ?? undefined,
    targetRole: r.target_role ?? undefined,
    hoursPerWeek: r.hours_per_week ?? undefined,
    resume: r.resume ?? undefined,
    knowMe: r.know_me ?? undefined,
    educationStage: km?.educationStage || undefined,
    streamOrBranch: km?.streamOrBranch || undefined,
    education_details: (km as any)?.education_details || undefined,
    interest_details: (km as any)?.interest_details || undefined,
    skills_and_experience: (km as any)?.skills_and_experience || undefined,
    career_discovery_preferences: (km as any)?.career_discovery_preferences || undefined,
    career_preferences: (km as any)?.career_preferences || undefined,
    student_exploration_preferences: (km as any)?.student_exploration_preferences || undefined,
    career_planning_preferences: (km as any)?.career_planning_preferences || undefined,
    career_transition_preferences: (km as any)?.career_transition_preferences || undefined,
    onboardingComplete: r.onboarding_complete,
  };
}

export function toRow(userId: string, p: Partial<Profile>): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = { user_id: userId };
  if ('career_mode' in p && p.career_mode) {
    row.path = CAREER_MODE_TO_PATH[p.career_mode];
  } else if ('path' in p) {
    row.path = p.path ?? null;
  }
  if ('college' in p) row.college = p.college ?? null;
  if ('course' in p) row.course = p.course ?? null;
  if ('year' in p) row.year = p.year ?? null;
  if ('interests' in p) row.interests = p.interests ?? [];
  if ('strengthsNote' in p) row.strengths_note = p.strengthsNote ?? null;
  if ('targetRole' in p) row.target_role = p.targetRole ?? null;
  if ('hoursPerWeek' in p) row.hours_per_week = p.hoursPerWeek ?? null;
  if ('resume' in p) row.resume = p.resume ?? null;

  if ('education_details' in p && p.education_details) {
    const ed = p.education_details;
    if (ed.institution !== undefined) row.college = ed.institution || null;
    let courseTitle = '';
    if (ed.education_level === 'sslc_10th') {
      const board = ed.school_board === 'other' ? (ed.school_board_other || 'Other Board') : (ed.school_board?.toUpperCase() || '10th Board');
      courseTitle = `10th Standard (${board})`;
    } else if (ed.education_level === 'puc_12th') {
      const stream = ed.school_stream === 'other' ? (ed.specialization_other || 'Other Stream') : (ed.school_stream || ed.specialization || 'Higher Secondary');
      courseTitle = `12th / PUC - ${stream}`;
    } else if (ed.education_level === 'diploma') {
      const spec = ed.specialization === 'Other' ? (ed.specialization_other || 'Other') : (ed.specialization || 'Polytechnic');
      courseTitle = `Diploma in ${spec}`;
    } else {
      const degreeLabel = ed.degree === 'other' ? (ed.degree_other || 'Other Degree') : ed.degree;
      const specLabel =
        ed.specialization === 'other' || ed.specialization === 'Other'
          ? ed.specialization_other || 'Other'
          : ed.specialization && ed.specialization !== 'Not applicable' && ed.specialization !== 'General'
          ? ed.specialization
          : '';
      courseTitle = [degreeLabel, specLabel].filter(Boolean).join(' - ');
    }
    row.course = courseTitle || row.course || null;

    let yearVal = ed.study_stage_value;
    if (ed.education_status === 'completed' && ed.graduation_year) {
      yearVal = `Graduated ${ed.graduation_year}`;
    } else if (ed.education_status === 'discontinued') {
      yearVal = ed.last_attended_stage ? `Discontinued (${ed.last_attended_stage})` : 'Discontinued';
    } else if (ed.education_status === 'gap_year') {
      yearVal = ed.highest_qualification ? `Gap Year after ${ed.highest_qualification}` : 'On Gap Year';
    }
    row.year = yearVal || row.year || null;
  }

  if ('interest_details' in p && p.interest_details) {
    const ind = p.interest_details;
    if (ind.additional_interests !== undefined) {
      row.strengths_note = ind.additional_interests || null;
    }
  }

  if ('skills_and_experience' in p && p.skills_and_experience) {
    const se = p.skills_and_experience;
    const baseResume = p.resume || row.resume || {};
    const existingSkills = (baseResume.skills as string[]) || [];
    const newSkillNames = se.skills.map((s) => s.name);
    const mergedSkills = Array.from(new Set([...existingSkills, ...newSkillNames]));
    row.resume = {
      ...baseResume,
      ...(mergedSkills.length > 0 ? { skills: mergedSkills } : {}),
    };
  }

  if ('career_discovery_preferences' in p && p.career_discovery_preferences) {
    const cdp = p.career_discovery_preferences;
    if (cdp.daily_learning_commitment && !row.hours_per_week) {
      row.hours_per_week = cdp.daily_learning_commitment;
    }
  }

  if ('career_preferences' in p && p.career_preferences) {
    const cp = p.career_preferences;
    if (cp.target_role && !row.target_role) {
      row.target_role = cp.target_role;
    }
    if (cp.learning_commitment?.daily_commitment && !row.hours_per_week) {
      row.hours_per_week = cp.learning_commitment.daily_commitment;
    }
  }

  if ('career_planning_preferences' in p && p.career_planning_preferences) {
    const cpp = p.career_planning_preferences;
    if (cpp.target_career_title && !row.target_role) {
      row.target_role = cpp.target_career_title;
    }
    if (cpp.weekly_commitment_hours && !row.hours_per_week) {
      row.hours_per_week = cpp.weekly_commitment_hours;
    }
  }

  if ('career_transition_preferences' in p && p.career_transition_preferences) {
    const ctp = p.career_transition_preferences;
    if (ctp.target_direction && !row.target_role) {
      row.target_role = ctp.target_direction;
    }
    if (ctp.weekly_commitment_hours && !row.hours_per_week) {
      row.hours_per_week = ctp.weekly_commitment_hours;
    }
  }

  if (
    'knowMe' in p ||
    'educationStage' in p ||
    'streamOrBranch' in p ||
    'career_mode' in p ||
    'career_growth_subtype' in p ||
    'user_persona' in p ||
    'education_details' in p ||
    'interest_details' in p ||
    'skills_and_experience' in p ||
    'career_discovery_preferences' in p ||
    'career_preferences' in p ||
    'student_exploration_preferences' in p ||
    'career_planning_preferences' in p ||
    'career_transition_preferences' in p
  ) {
    const existingKm = (p.knowMe as any) || {};
    const stage = p.educationStage ?? existingKm.educationStage;
    const stream = p.streamOrBranch ?? existingKm.streamOrBranch;
    const careerMode = p.career_mode ?? existingKm.career_mode;
    const careerGrowthSubtype = p.career_growth_subtype ?? existingKm.career_growth_subtype;
    const userPersona = p.user_persona ?? existingKm.user_persona;
    const educationDetails = p.education_details ?? existingKm.education_details;
    const interestDetails = p.interest_details ?? existingKm.interest_details;
    const skillsAndExperience = p.skills_and_experience ?? existingKm.skills_and_experience;
    const careerDiscoveryPreferences =
      p.career_discovery_preferences ?? existingKm.career_discovery_preferences;
    const careerPreferences =
      p.career_preferences ?? existingKm.career_preferences;
    const studentExplorationPreferences =
      p.student_exploration_preferences ?? existingKm.student_exploration_preferences;
    const careerPlanningPreferences =
      p.career_planning_preferences ?? existingKm.career_planning_preferences;
    const careerTransitionPreferences =
      p.career_transition_preferences ?? existingKm.career_transition_preferences;

    const mergedKm = {
      ...existingKm,
      ...(stage ? { educationStage: stage } : {}),
      ...(stream ? { streamOrBranch: stream } : {}),
      ...(careerMode ? { career_mode: careerMode } : {}),
      ...(careerGrowthSubtype ? { career_growth_subtype: careerGrowthSubtype } : {}),
      ...(userPersona ? { user_persona: userPersona } : {}),
      ...(educationDetails ? { education_details: educationDetails } : {}),
      ...(interestDetails ? { interest_details: interestDetails } : {}),
      ...(skillsAndExperience ? { skills_and_experience: skillsAndExperience } : {}),
      ...(careerDiscoveryPreferences ? { career_discovery_preferences: careerDiscoveryPreferences } : {}),
      ...(careerPreferences ? { career_preferences: careerPreferences } : {}),
      ...(studentExplorationPreferences ? { student_exploration_preferences: studentExplorationPreferences } : {}),
      ...(careerPlanningPreferences ? { career_planning_preferences: careerPlanningPreferences } : {}),
      ...(careerTransitionPreferences ? { career_transition_preferences: careerTransitionPreferences } : {}),
    };
    row.know_me = Object.keys(mergedKm).length > 0 ? mergedKm : null;
  }

  if ('onboardingComplete' in p) row.onboarding_complete = Boolean(p.onboardingComplete);
  return row;
}

function assessmentFromRow(r: AssessmentRow): SavedAssessment {
  const adaptiveEvidence =
    r.adaptive_evidence ??
    ((r.know_me as any)?.adaptive_evidence as AdaptiveScoreResult | undefined) ??
    null;

  return {
    id: r.id,
    code: r.code,
    scores: r.scores,
    matches: r.matches ?? [],
    source: r.source,
    workStyle: r.work_style ?? {},
    knowMe: r.know_me ?? undefined,
    adaptiveEvidence,
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
  // Query with adaptive_evidence column; fallback gracefully if column not yet migrated
  let res = await supabase
    .from('assessments')
    .select('id, code, scores, matches, source, work_style, know_me, adaptive_evidence, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (res.error && (res.error.code === '42703' || res.error.code === 'PGRST204' || res.error.message?.includes('adaptive_evidence'))) {
    res = await supabase
      .from('assessments')
      .select('id, code, scores, matches, source, work_style, know_me, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  if (res.error) throw res.error;
  return res.data ? assessmentFromRow(res.data as AssessmentRow) : null;
}

export async function saveAssessment(
  userId: string,
  a: {
    answers: Record<string, string | number>;
    workStyle: Record<string, string>;
    knowMe?: KnowMe;
    scores: RiasecScores;
    code: string;
    matches: CareerMatch[];
    source: 'ai' | 'hybrid_vector' | 'rule';
    adaptiveEvidence?: AdaptiveScoreResult | null;
  },
): Promise<SavedAssessment> {
  // Store copy inside know_me for seamless zero-downtime backwards compatibility
  const enrichedKnowMe = a.knowMe ? { ...a.knowMe } : {};
  if (a.adaptiveEvidence) {
    (enrichedKnowMe as any).adaptive_evidence = a.adaptiveEvidence;
  }

  const baseRow = {
    user_id: userId,
    answers: a.answers,
    work_style: a.workStyle,
    know_me: Object.keys(enrichedKnowMe).length > 0 ? enrichedKnowMe : null,
    scores: a.scores,
    code: a.code,
    matches: a.matches,
    source: a.source,
  };

  // Primary attempt: write to adaptive_evidence column
  let res = await supabase
    .from('assessments')
    .insert({
      ...baseRow,
      adaptive_evidence: a.adaptiveEvidence ?? null,
    })
    .select('id, code, scores, matches, source, work_style, know_me, adaptive_evidence, created_at')
    .single();

  // If column adaptive_evidence doesn't exist yet on remote db, fallback to base insert
  if (res.error && (res.error.code === '42703' || res.error.code === 'PGRST204' || res.error.message?.includes('adaptive_evidence'))) {
    res = await supabase
      .from('assessments')
      .insert(baseRow)
      .select('id, code, scores, matches, source, work_style, know_me, created_at')
      .single();
  }

  if (res.error) throw res.error;
  return assessmentFromRow(res.data as AssessmentRow);
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

export interface CareerGoal {
  id: string;
  userId: string;
  careerTitle: string;
  field?: string;
  reason?: string;
  status: 'active' | 'archived';
  confirmedAt: string;
}

export async function confirmCareerGoal(
  userId: string,
  careerTitle: string,
  field?: string,
  reason?: string,
): Promise<CareerGoal> {
  // Archive any existing active goals
  const { error: archiveError } = await supabase
    .from('career_goals')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (archiveError) throw archiveError;

  // Insert the new active goal
  const { data, error } = await supabase
    .from('career_goals')
    .insert({
      user_id: userId,
      career_title: careerTitle,
      field: field ?? null,
      reason: reason ?? null,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) throw error;

  // Also update target_role in profiles table
  await saveProfile(userId, { targetRole: careerTitle, path: 'know_goal' });

  return {
    id: data.id,
    userId: data.user_id,
    careerTitle: data.career_title,
    field: data.field ?? undefined,
    reason: data.reason ?? undefined,
    status: data.status,
    confirmedAt: data.confirmed_at,
  };
}

export async function loadActiveGoal(userId: string): Promise<CareerGoal | null> {
  const { data, error } = await supabase
    .from('career_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    careerTitle: data.career_title,
    field: data.field ?? undefined,
    reason: data.reason ?? undefined,
    status: data.status,
    confirmedAt: data.confirmed_at,
  };
}

export type JourneyStage = 'onboarding' | 'assessment' | 'goal' | 'complete';

export interface JourneyStatus {
  stage: JourneyStage;
  onboardingComplete: boolean;
  assessmentComplete: boolean;
  goalComplete: boolean;
  nextRoute: '/onboarding' | '/assessment' | '/dashboard';
}

export function getJourneyStatus(
  profile: Profile | null,
  assessment: SavedAssessment | null,
  activeGoal?: CareerGoal | null,
): JourneyStatus {
  const onboardingComplete = Boolean(profile?.onboardingComplete);
  const assessmentComplete = Boolean(
    assessment && Array.isArray(assessment.matches) && assessment.matches.length > 0,
  );
  const goalComplete = Boolean(
    activeGoal && activeGoal.status === 'active' && Boolean(activeGoal.careerTitle?.trim()),
  );

  let stage: JourneyStage;
  let nextRoute: '/onboarding' | '/assessment' | '/dashboard';

  if (!onboardingComplete) {
    stage = 'onboarding';
    nextRoute = '/onboarding';
  } else if (!assessmentComplete) {
    stage = 'assessment';
    nextRoute = '/assessment';
  } else if (!goalComplete) {
    stage = 'goal';
    nextRoute = '/assessment';
  } else {
    stage = 'complete';
    nextRoute = '/dashboard';
  }

  return {
    stage,
    onboardingComplete,
    assessmentComplete,
    goalComplete,
    nextRoute,
  };
}

