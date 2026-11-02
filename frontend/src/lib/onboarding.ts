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

export interface OnboardingRecord {
  path: CareerPath | null;
  career_mode?: CareerMode | null;
  educationStage?: EducationStage;
  education_details?: import("./educationTaxonomy").EducationDetails;
  interest_details?: import("./interestsTaxonomy").InterestDetails;
  skills_and_experience?: import("./skillsTaxonomy").SkillsAndExperienceDetails;
  career_discovery_preferences?: import("./careerPreferencesTaxonomy").CareerDiscoveryPreferences;
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
