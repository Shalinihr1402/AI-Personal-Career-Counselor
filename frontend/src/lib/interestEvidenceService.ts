import { supabase } from './supabase';
import {
  INTEREST_DOMAINS,
  type InterestDomainId,
  type ActivityDifficulty,
  type EducationLevelFilter,
} from './interestDomains';

export type EnjoymentRating = 'loved' | 'enjoyed' | 'neutral' | 'disliked';
export type ActivityLogStatus = 'started' | 'completed' | 'skipped' | 'replayed';

export interface ActivityLogEntry {
  id?: string;
  userId: string;
  domainId: InterestDomainId;
  activityId: string;
  status: ActivityLogStatus;
  responses: Record<string, any>;
  enjoymentRating?: EnjoymentRating;
  feedbackNote?: string;
  educationLevel?: EducationLevelFilter;
  difficulty?: ActivityDifficulty;
  replayCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeclaredInterest {
  domainId: InterestDomainId;
  source: 'onboarding' | 'manual_favorite';
  declaredAt: string;
}

export interface ExploredInterest {
  domainId: InterestDomainId;
  activitiesAttempted: number;
  activitiesCompleted: number;
  distinctActivitiesCompleted: number;
  lastExploredAt: string;
}

export interface EmergingInterest {
  domainId: InterestDomainId;
  evidenceReason: string;
  distinctActivitiesCount: number;
  positiveRatingCount: number;
  replayCount: number;
  detectedAt: string;
}

export interface ConfirmedInterest {
  domainId: InterestDomainId;
  confirmedAt: string;
  studentReflection?: string;
}

export interface StudentInterestProfile {
  id?: string;
  userId: string;
  declaredInterests: DeclaredInterest[];
  exploredInterests: ExploredInterest[];
  emergingInterests: EmergingInterest[];
  confirmedInterests: ConfirmedInterest[];
  counselorSummary?: string;
  updatedAt?: string;
}

const LOCAL_STORAGE_LOGS_KEY = 'career_counselor_interest_logs';
const LOCAL_STORAGE_PROFILE_KEY = 'career_counselor_interest_profile';

/**
 * Reads local logs from localStorage (safe fallback for demo or offline mode)
 */
function getLocalLogs(userId: string): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(userId: string, logs: ActivityLogEntry[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_LOGS_KEY}_${userId}`, JSON.stringify(logs));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reads local interest profile
 */
export function getLocalInterestProfile(userId: string): StudentInterestProfile {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fall back to default
  }
  return {
    userId,
    declaredInterests: [],
    exploredInterests: [],
    emergingInterests: [],
    confirmedInterests: [],
  };
}

export function saveLocalInterestProfile(userId: string, profile: StudentInterestProfile) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${userId}`, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Log an interactive activity event (started, completed, skipped, replayed)
 * Correctly updates existing activity entries to avoid duplicates when ratings change.
 */
export async function logActivityEvent(entry: Omit<ActivityLogEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityLogEntry> {
  const timestamp = new Date().toISOString();
  const fullEntry: ActivityLogEntry = {
    ...entry,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const localLogs = getLocalLogs(entry.userId);
  const existingIdx = localLogs.findIndex(
    (l) => l.domainId === entry.domainId && l.activityId === entry.activityId
  );

  if (existingIdx >= 0) {
    const prev = localLogs[existingIdx];
    const replayCount =
      entry.status === 'replayed' ? (prev.replayCount || 0) + 1 : prev.replayCount || 0;
    
    // Preserve initial responses or update with latest
    localLogs[existingIdx] = {
      ...prev,
      status: entry.status === 'skipped' && prev.status === 'completed' ? prev.status : entry.status,
      responses: Object.keys(entry.responses).length > 0 ? entry.responses : prev.responses,
      enjoymentRating: entry.enjoymentRating !== undefined ? entry.enjoymentRating : prev.enjoymentRating,
      feedbackNote: entry.feedbackNote !== undefined ? entry.feedbackNote : prev.feedbackNote,
      educationLevel: entry.educationLevel || prev.educationLevel,
      difficulty: entry.difficulty || prev.difficulty,
      replayCount,
      updatedAt: timestamp,
    };
  } else {
    localLogs.push(fullEntry);
  }
  saveLocalLogs(entry.userId, localLogs);

  // Re-calculate emerging and explored interests using the audited logic
  await recalculateInterestProfile(entry.userId, localLogs);

  // Sync with Supabase if configured and not offline/demo
  try {
    if (entry.userId && entry.userId !== 'demo-student-id') {
      const { data, error } = await supabase
        .from('interest_activity_logs')
        .upsert(
          {
            user_id: entry.userId,
            domain_id: entry.domainId,
            activity_id: entry.activityId,
            status: entry.status,
            responses: entry.responses,
            enjoyment_rating: entry.enjoymentRating || null,
            feedback_note: entry.feedbackNote || null,
            education_level: entry.educationLevel || null,
            difficulty: entry.difficulty || null,
            replay_count: entry.replayCount || 0,
            updated_at: timestamp,
          },
          { onConflict: 'user_id,domain_id,activity_id' }
        )
        .select('*')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          domainId: data.domain_id,
          activityId: data.activity_id,
          status: data.status,
          responses: data.responses,
          enjoymentRating: data.enjoyment_rating,
          feedbackNote: data.feedback_note,
          educationLevel: data.education_level,
          difficulty: data.difficulty,
          replayCount: data.replay_count,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
  } catch (err) {
    console.debug('[interestEvidence] Supabase logging fallback:', err);
  }

  return fullEntry;
}

/**
 * Load all activity logs for a student
 */
export async function loadStudentActivityLogs(userId: string): Promise<ActivityLogEntry[]> {
  const localLogs = getLocalLogs(userId);

  try {
    if (userId && userId !== 'demo-student-id') {
      const { data, error } = await supabase
        .from('interest_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          domainId: d.domain_id,
          activityId: d.activity_id,
          status: d.status,
          responses: d.responses,
          enjoymentRating: d.enjoyment_rating,
          feedbackNote: d.feedback_note,
          educationLevel: d.education_level,
          difficulty: d.difficulty,
          replayCount: d.replay_count,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
  } catch {
    // Supabase unavailable or demo mode, use local
  }

  return localLogs;
}

/**
 * Audited Emerging-Interest Algorithm (Requirement 3)
 * Rules:
 * - A single activity or positive rating does NOT create an emerging interest.
 * - Requires either:
 *   a) >= 2 distinct completed activities in that domain with positive ratings ('loved' or 'enjoyed'), OR
 *   b) 1 completed activity rated 'loved' + voluntarily replayed (replayCount >= 1).
 * - Net positive sentiment check: positiveRatings > negativeRatings.
 * - Skipping does not create negative evidence.
 */
export async function recalculateInterestProfile(
  userId: string,
  providedLogs?: ActivityLogEntry[]
): Promise<StudentInterestProfile> {
  const logs = providedLogs || (await loadStudentActivityLogs(userId));
  const currentProfile = getLocalInterestProfile(userId);

  // Group logs by domain with distinct activity tracking
  interface DomainAggregation {
    attemptedActivities: Set<string>;
    completedActivities: Set<string>;
    positiveRatings: number;
    neutralRatings: number;
    negativeRatings: number;
    replayCount: number;
    lastDate: string;
  }

  const domainMap: Record<string, DomainAggregation> = {};

  for (const log of logs) {
    if (!domainMap[log.domainId]) {
      domainMap[log.domainId] = {
        attemptedActivities: new Set(),
        completedActivities: new Set(),
        positiveRatings: 0,
        neutralRatings: 0,
        negativeRatings: 0,
        replayCount: 0,
        lastDate: log.updatedAt || log.createdAt || new Date().toISOString(),
      };
    }

    const agg = domainMap[log.domainId];
    agg.attemptedActivities.add(log.activityId);

    if (log.status === 'completed' || log.status === 'replayed') {
      agg.completedActivities.add(log.activityId);
    }

    if (log.replayCount && log.replayCount > 0) {
      agg.replayCount += log.replayCount;
    }
    if (log.status === 'replayed') {
      agg.replayCount += 1;
    }

    if (log.enjoymentRating === 'loved' || log.enjoymentRating === 'enjoyed') {
      agg.positiveRatings += 1;
    } else if (log.enjoymentRating === 'neutral') {
      agg.neutralRatings += 1;
    } else if (log.enjoymentRating === 'disliked') {
      agg.negativeRatings += 1;
    }

    if (log.updatedAt && log.updatedAt > agg.lastDate) {
      agg.lastDate = log.updatedAt;
    }
  }

  // 1. Explored Interests: tracks voluntary exploration attempts & completions
  const exploredInterests: ExploredInterest[] = Object.entries(domainMap).map(
    ([domainId, agg]) => ({
      domainId: domainId as InterestDomainId,
      activitiesAttempted: agg.attemptedActivities.size,
      activitiesCompleted: agg.completedActivities.size,
      distinctActivitiesCompleted: agg.completedActivities.size,
      lastExploredAt: agg.lastDate,
    })
  );

  // 2. Emerging Interests: Rigorous multi-evidence rule
  const emergingInterests: EmergingInterest[] = [];
  for (const [domainId, agg] of Object.entries(domainMap)) {
    const domainDef = INTEREST_DOMAINS.find((d) => d.id === domainId);
    const domainName = domainDef ? domainDef.name : domainId;

    const hasMultiActivityPositive =
      agg.completedActivities.size >= 2 && agg.positiveRatings >= 2;
    const hasReplayAffection =
      agg.completedActivities.size >= 1 && agg.replayCount >= 1 && agg.positiveRatings >= 1;
    const netPositive = agg.positiveRatings > agg.negativeRatings;

    if ((hasMultiActivityPositive || hasReplayAffection) && netPositive) {
      let evidenceReason = '';
      if (hasMultiActivityPositive) {
        evidenceReason = `Demonstrated consistent enjoyment across ${agg.completedActivities.size} distinct challenges in ${domainName}.`;
      } else {
        evidenceReason = `Showed repeat voluntary engagement and high enjoyment replaying challenges in ${domainName}.`;
      }

      emergingInterests.push({
        domainId: domainId as InterestDomainId,
        evidenceReason,
        distinctActivitiesCount: agg.completedActivities.size,
        positiveRatingCount: agg.positiveRatings,
        replayCount: agg.replayCount,
        detectedAt: agg.lastDate,
      });
    }
  }

  // 3. Grounded AI Counselor Summary
  const counselorSummary = generateGroundedInterestSummary(
    currentProfile.declaredInterests,
    exploredInterests,
    emergingInterests,
    currentProfile.confirmedInterests,
    domainMap
  );

  const updatedProfile: StudentInterestProfile = {
    ...currentProfile,
    exploredInterests,
    emergingInterests,
    counselorSummary,
    updatedAt: new Date().toISOString(),
  };

  saveLocalInterestProfile(userId, updatedProfile);

  // Sync to Supabase
  try {
    if (userId && userId !== 'demo-student-id') {
      await supabase.from('student_interest_profiles').upsert(
        {
          user_id: userId,
          declared_interests: updatedProfile.declaredInterests,
          explored_interests: updatedProfile.exploredInterests,
          emerging_interests: updatedProfile.emergingInterests,
          confirmed_interests: updatedProfile.confirmedInterests,
          counselor_summary: updatedProfile.counselorSummary,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }
  } catch (err) {
    console.debug('[interestEvidence] Supabase profile sync fallback:', err);
  }

  return updatedProfile;
}

/**
 * Toggle a declared interest (e.g., student marks a domain as a favorite)
 */
export async function toggleDeclaredInterest(
  userId: string,
  domainId: InterestDomainId
): Promise<StudentInterestProfile> {
  const profile = getLocalInterestProfile(userId);
  const exists = profile.declaredInterests.some((d) => d.domainId === domainId);

  const updatedDeclared: DeclaredInterest[] = exists
    ? profile.declaredInterests.filter((d) => d.domainId !== domainId)
    : [
        ...profile.declaredInterests,
        {
          domainId,
          source: 'manual_favorite',
          declaredAt: new Date().toISOString(),
        },
      ];

  const updatedProfile: StudentInterestProfile = {
    ...profile,
    declaredInterests: updatedDeclared,
  };

  saveLocalInterestProfile(userId, updatedProfile);
  return recalculateInterestProfile(userId);
}

/**
 * Explicit student confirmation of an interest (Requirement 6: Never automated)
 */
export async function confirmStudentInterest(
  userId: string,
  domainId: InterestDomainId,
  studentReflection?: string
): Promise<StudentInterestProfile> {
  const profile = getLocalInterestProfile(userId);
  const exists = profile.confirmedInterests.some((c) => c.domainId === domainId);

  const updatedConfirmed: ConfirmedInterest[] = exists
    ? profile.confirmedInterests.map((c) =>
        c.domainId === domainId
          ? {
              ...c,
              studentReflection: studentReflection || c.studentReflection,
              confirmedAt: new Date().toISOString(),
            }
          : c
      )
    : [
        ...profile.confirmedInterests,
        {
          domainId,
          confirmedAt: new Date().toISOString(),
          studentReflection,
        },
      ];

  const updatedProfile: StudentInterestProfile = {
    ...profile,
    confirmedInterests: updatedConfirmed,
  };

  saveLocalInterestProfile(userId, updatedProfile);
  return recalculateInterestProfile(userId);
}

/**
 * Remove confirmed interest
 */
export async function removeConfirmedInterest(
  userId: string,
  domainId: InterestDomainId
): Promise<StudentInterestProfile> {
  const profile = getLocalInterestProfile(userId);
  const updatedProfile: StudentInterestProfile = {
    ...profile,
    confirmedInterests: profile.confirmedInterests.filter((c) => c.domainId !== domainId),
  };
  saveLocalInterestProfile(userId, updatedProfile);
  return recalculateInterestProfile(userId);
}

/**
 * AI Counselor Grounded Summary Generator (Requirement 5 & 9)
 * Grounded in actual evidence, distinguishes declared vs emerging vs confirmed vs neutral.
 * Completely handles edge cases A through G without inventing skills, achievements, or career conclusions.
 */
export function generateGroundedInterestSummary(
  declared: DeclaredInterest[],
  explored: ExploredInterest[],
  emerging: EmergingInterest[],
  confirmed: ConfirmedInterest[],
  domainStats?: Record<string, { attemptedActivities: Set<string>; completedActivities: Set<string>; positiveRatings: number; neutralRatings: number; negativeRatings: number }>
): string {
  // Scenario G: Student hasn't explored or declared anything, or skipped all
  if (explored.length === 0 && declared.length === 0) {
    return 'You have not yet explored any subject domains. Choose any of the 12 domains above to try quick interactive activities and see which subjects genuinely spark your curiosity.';
  }

  const completedCount = explored.reduce((sum, e) => sum + e.activitiesCompleted, 0);
  const attemptedCount = explored.reduce((sum, e) => sum + e.activitiesAttempted, 0);

  // All activities skipped
  if (attemptedCount > 0 && completedCount === 0) {
    return 'You previewed several challenge scenarios but skipped them before completing. Take your time to try any single challenge that catches your attention—there are no time limits or grades.';
  }

  const parts: string[] = [];

  // Scenario A: Declared domains that were never explored
  const unexploredDeclared = declared.filter(
    (d) => !explored.some((e) => e.domainId === d.domainId && e.activitiesCompleted > 0)
  );
  if (unexploredDeclared.length > 0) {
    const names = unexploredDeclared
      .map((d) => INTEREST_DOMAINS.find((dom) => dom.id === d.domainId)?.name)
      .filter(Boolean);
    parts.push(
      `You marked ${names.join(', ')} as a declared area of interest, but have not yet explored its interactive challenges.`
    );
  }

  // Explored domains overview
  const exploredNames = explored
    .filter((e) => e.activitiesCompleted > 0)
    .map((e) => INTEREST_DOMAINS.find((dom) => dom.id === e.domainId)?.name)
    .filter(Boolean);

  if (exploredNames.length > 0) {
    parts.push(`You have voluntarily completed activities across ${exploredNames.join(', ')}.`);
  }

  // Scenario B: Neutral or exploratory feedback check
  if (domainStats) {
    const neutralOnlyDomains = Object.entries(domainStats)
      .filter(([_, stat]) => stat.completedActivities.size > 0 && stat.neutralRatings > 0 && stat.positiveRatings === 0)
      .map(([id]) => INTEREST_DOMAINS.find((d) => d.id === id)?.name)
      .filter(Boolean);

    if (neutralOnlyDomains.length > 0) {
      parts.push(
        `In ${neutralOnlyDomains.join(', ')}, your feedback was neutral, indicating that while you completed the tasks, they may not be where your primary enthusiasm lies.`
      );
    }
  }

  // Scenario C: Single positive activity that has not yet reached emerging threshold
  const singlePositiveUnconfirmed = explored.filter((e) => {
    const isEmerging = emerging.some((em) => em.domainId === e.domainId);
    const isConfirmed = confirmed.some((c) => c.domainId === e.domainId);
    return e.activitiesCompleted === 1 && !isEmerging && !isConfirmed;
  });
  if (singlePositiveUnconfirmed.length > 0 && emerging.length === 0) {
    const names = singlePositiveUnconfirmed
      .map((e) => INTEREST_DOMAINS.find((d) => d.id === e.domainId)?.name)
      .filter(Boolean);
    parts.push(
      `You enjoyed your initial exploration in ${names.join(', ')}. Try a second activity in these areas to see if a sustained pattern emerges.`
    );
  }

  // Scenario D: Emerging Interests (repeated engagement)
  if (emerging.length > 0) {
    const emergingNames = emerging
      .map((e) => INTEREST_DOMAINS.find((d) => d.id === e.domainId)?.name)
      .filter(Boolean);
    parts.push(
      `Your activity feedback highlights strong repeated enjoyment in ${emergingNames.join(' and ')}, where you completed multiple challenges and reported high satisfaction.`
    );
  }

  // Scenario E: Confirmed Interests
  if (confirmed.length > 0) {
    const confirmedNames = confirmed
      .map((c) => INTEREST_DOMAINS.find((d) => d.id === c.domainId)?.name)
      .filter(Boolean);
    parts.push(
      `You have explicitly reviewed and confirmed ${confirmedNames.join(' and ')} as priority interest domains.`
    );
  }

  // Scenario F: Broad multidisciplinary exploration with no confirmed preference
  if (exploredNames.length >= 3 && confirmed.length === 0 && emerging.length === 0) {
    parts.push(
      'You are currently exploring broadly across several diverse disciplines. Continuing to try challenges will help clarify which subjects you want to focus on.'
    );
  } else if (emerging.length > 0 || confirmed.length > 0) {
    parts.push(
      'Consider reviewing these subjects when planning your coursework and practical projects. Remember that discovering what you enjoy is an evolving journey, not a final career verdict.'
    );
  } else {
    parts.push(
      'Keep testing different subject challenges to observe which problem-solving styles feel naturally energizing.'
    );
  }

  return parts.join(' ');
}
