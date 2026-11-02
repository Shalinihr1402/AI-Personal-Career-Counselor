export type CareerPath = 'know_goal' | 'not_sure' | 'need_plan';

export type CareerMode = 'career_planning' | 'career_discovery' | 'career_growth_transition';

export const CAREER_MODE_TO_PATH: Record<CareerMode, CareerPath> = {
  career_planning: 'know_goal',
  career_discovery: 'not_sure',
  career_growth_transition: 'need_plan',
};

export const PATH_TO_CAREER_MODE: Record<CareerPath, CareerMode> = {
  know_goal: 'career_planning',
  not_sure: 'career_discovery',
  need_plan: 'career_growth_transition',
};

export type {
  EducationLevel,
  EducationStatus,
  StudyStageType,
  EducationDetails,
} from './educationTaxonomy';

export type {
  InterestCategoryConfig,
  InterestDetails,
} from './interestsTaxonomy';

export type {
  SkillProficiency,
  UserSkill,
  ExperienceType,
  ExperienceItem,
  ProfessionalDuration,
  SkillsAndExperienceDetails,
} from './skillsTaxonomy';

export type {
  CareerMotivationId,
  CareerPriorityId,
  WorkEnvironmentId,
  LearningCommitmentId,
  CareerTimelineId,
  CareerDiscoveryPreferences,
} from './careerPreferencesTaxonomy';

export type EducationStage =
  | 'sslc_10th'
  | 'puc_12th'
  | 'diploma'
  | 'degree_ug'
  | 'postgrad';

export type CareerGrowthSubtype =
  | 'career_switching'
  | 'career_advancement'
  | 'career_break_return';

export interface CareerGrowthSubtypeConfig {
  id: CareerGrowthSubtype;
  title: string;
  desc: string;
  shortLabel: string;
}

export const CAREER_GROWTH_SUBTYPES: CareerGrowthSubtypeConfig[] = [
  {
    id: 'career_switching',
    title: 'Career Switching',
    desc: 'Moving into a different industry, domain, or profession.',
    shortLabel: 'Switching',
  },
  {
    id: 'career_advancement',
    title: 'Career Advancement',
    desc: 'Growing, upskilling, or seeking promotion in the current profession.',
    shortLabel: 'Advancement',
  },
  {
    id: 'career_break_return',
    title: 'Career-Break Return',
    desc: 'Returning to work after a parental, medical, or personal career break.',
    shortLabel: 'Return after break',
  },
];

export type UserPersona =
  | 'school_student_10th'
  | 'high_school_12th'
  | 'diploma_student'
  | 'college_undergrad'
  | 'postgrad_doctoral'
  | 'experienced_professional'
  | 'career_switcher'
  | 'career_break_returner'
  | 'dropout_or_gap_year';

export interface StudentExplorationPreferences {
  favorite_subjects: string[];
  curiosity_domains: string[];
  preferred_after_school_track: 'higher_studies_degree' | 'vocational_diploma' | 'competitive_exams' | 'undecided';
  guidance_need: 'stream_selection' | 'career_options' | 'college_planning' | 'exam_preparation';
}

export interface CareerPlanningPreferences {
  target_career_title: string;
  target_career_domain: string;
  goal_readiness_level: 'beginner' | 'learning_foundations' | 'job_ready';
  weekly_commitment_hours: string;
  target_timeline: string;
}

export interface CareerTransitionPreferences {
  transition_type: CareerGrowthSubtype;
  previous_or_current_domain: string;
  target_direction: string;
  break_duration?: string;
  primary_transition_hurdle: 'skill_gap' | 'credential_gap' | 'experience_gap' | 'network_guidance' | 'confidence';
  weekly_commitment_hours: string;
  transition_timeline: string;
}

/**
 * Deterministically determines the user persona using EXPLICIT signals only:
 * 1. Career Intention (career_mode + growth subtype)
 * 2. Education status and level
 * 3. Declared professional experience (never inferred from graduation year)
 */
export function detectUserPersona(record: Partial<OnboardingRecord>): UserPersona {
  const ed = record.education_details;
  const se = record.skills_and_experience;
  const growthSubtype = record.career_growth_subtype;

  // 1. Explicit career intention subtypes
  if (growthSubtype === 'career_switching') {
    return 'career_switcher';
  }
  if (growthSubtype === 'career_break_return') {
    return 'career_break_returner';
  }

  // 2. High school / School students (Rule 4: exploration assessments)
  if (ed?.education_level === 'sslc_10th') {
    return 'school_student_10th';
  }
  if (ed?.education_level === 'puc_12th') {
    return 'high_school_12th';
  }

  // 3. Dropouts or gap-year students
  if (ed?.education_status === 'discontinued' || ed?.education_status === 'gap_year') {
    return 'dropout_or_gap_year';
  }

  // 4. Diploma students
  if (ed?.education_level === 'diploma') {
    return 'diploma_student';
  }

  // 5. Explicit declared professional employment (Never infer from graduation year - Rule 2)
  const hasDeclaredEmploymentDuration =
    se?.professional_duration &&
    ['1_to_2_years', '2_to_5_years', '5_plus_years'].includes(se.professional_duration);

  const hasEmploymentRecords =
    se?.experiences &&
    se.experiences.some((exp) => ['full_time', 'part_time'].includes(exp.type) && exp.title?.trim());

  if (growthSubtype === 'career_advancement' || hasDeclaredEmploymentDuration || hasEmploymentRecords) {
    return 'experienced_professional';
  }

  // 6. Postgraduate / Doctoral
  if (ed?.education_level === 'postgraduate' || ed?.education_level === 'doctoral_phd') {
    return 'postgrad_doctoral';
  }

  // Default: College undergrad / Fresher (without declared employment)
  return 'college_undergrad';
}

export interface OnboardingRecord {
  path: CareerPath | null;
  career_mode?: CareerMode | null;
  career_growth_subtype?: CareerGrowthSubtype | null;
  user_persona?: UserPersona | null;
  educationStage?: EducationStage;
  education_details?: import("./educationTaxonomy").EducationDetails;
  interest_details?: import("./interestsTaxonomy").InterestDetails;
  skills_and_experience?: import("./skillsTaxonomy").SkillsAndExperienceDetails;
  career_discovery_preferences?: import("./careerPreferencesTaxonomy").CareerDiscoveryPreferences;
  student_exploration_preferences?: StudentExplorationPreferences;
  career_planning_preferences?: CareerPlanningPreferences;
  career_transition_preferences?: CareerTransitionPreferences;
  streamOrBranch?: string;
  college?: string;
  course?: string;
  year?: string;
  interests?: string[];
  strengthsNote?: string;
  targetRole?: string;
  hoursPerWeek?: string;
  resume?: {
    name?: string;
    education?: string[];
    skills?: string[];
    experience?: string[];
  };
}

/**
 * Rule-based interest -> career lookup. Placeholder for a real matching model.
 * Every title must exist in the backend taxonomy (backend/careers.py CAREERS).
 */
export const CAREER_MATCHES: Record<string, string[]> = {
  'Coding & Tech': ['Software Engineer', 'Frontend Developer', 'DevOps / Cloud Engineer'],
  'Design & Creativity': ['UX Designer', 'Graphic Designer', 'Product Designer'],
  'Data & Numbers': ['Data Analyst', 'Data Scientist', 'Business Analyst'],
  'Communication & People': ['HR Specialist', 'Customer Success Manager', 'Teacher / Trainer'],
  'Business & Management': ['Product Manager', 'Management Consultant', 'Operations Manager'],
  'Science & Research': ['Research Scientist', 'Data Scientist', 'Pharmacist'],
  Healthcare: ['Nurse', 'Pharmacist'],
  'Sports & Fitness': ['Sports Coach', 'Fitness Trainer'],
  'Writing & Content': ['Content Writer', 'Technical Writer', 'Social Media Manager'],
  'Public Speaking': ['Teacher / Trainer', 'Sales Executive', 'Digital Marketer'],
};

export function suggestCareers(interests: string[]): string[] {
  const scores = new Map<string, number>();
  for (const interest of interests) {
    for (const career of CAREER_MATCHES[interest] ?? []) {
      scores.set(career, (scores.get(career) ?? 0) + 1);
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([career]) => career);
}

/** Turn the onboarding time bucket into a usable weekly-hours number. */
export function parseWeeklyHours(bucket: string | undefined): number {
  switch (bucket) {
    case 'Less than 5 hrs/week':
      return 4;
    case '5-10 hrs/week':
      return 8;
    case '10-20 hrs/week':
      return 15;
    case '20+ hrs/week':
      return 24;
    default:
      return 6;
  }
}

export interface EducationPace {
  condenseFoundations: boolean;
  note: string;
}

export function educationPace(year: string | undefined): EducationPace {
  switch (year) {
    case '1st year':
      return {
        condenseFoundations: false,
        note: "You're early — spend real time on Foundations, there's no rush.",
      };
    case '2nd year':
      return {
        condenseFoundations: false,
        note: 'Good timing. Build Foundations well, then pick up pace on Core skills.',
      };
    case '3rd year':
      return {
        condenseFoundations: false,
        note: 'Focus on Core skills and start a portfolio project soon.',
      };
    case 'Final year':
      return {
        condenseFoundations: true,
        note: 'Final year — Foundations are condensed to review. Prioritise job-ready skills.',
      };
    case 'Graduate':
      return {
        condenseFoundations: true,
        note: 'Move fast — Foundations are condensed so you can reach job-ready projects sooner.',
      };
    default:
      return { condenseFoundations: false, note: 'Work through the stages in order.' };
  }
}
