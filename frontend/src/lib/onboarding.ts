import type { User } from '@supabase/supabase-js';

export type CareerPath = 'know_goal' | 'not_sure' | 'need_plan';

export interface OnboardingRecord {
  path: CareerPath | null;
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

export function readOnboarding(user: User | null): OnboardingRecord | undefined {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  return meta?.onboarding as OnboardingRecord | undefined;
}

/** Rule-based interest -> career lookup. Placeholder for a real matching model. */
export const CAREER_MATCHES: Record<string, string[]> = {
  'Coding & Tech': ['Software Engineer', 'Web Developer', 'Mobile App Developer'],
  'Design & Creativity': ['UI/UX Designer', 'Graphic Designer', 'Product Designer'],
  'Data & Numbers': ['Data Analyst', 'Data Scientist', 'Business Analyst'],
  'Communication & People': ['HR Specialist', 'Customer Success Manager', 'Public Relations Specialist'],
  'Business & Management': ['Product Manager', 'Business Consultant', 'Operations Manager'],
  'Science & Research': ['Research Scientist', 'Lab Technician', 'Biotech Analyst'],
  Healthcare: ['Nurse', 'Healthcare Administrator', 'Medical Researcher'],
  'Sports & Fitness': ['Sports Coach', 'Fitness Trainer', 'Sports Analyst'],
  'Writing & Content': ['Content Writer', 'Technical Writer', 'Copywriter'],
  'Public Speaking': ['Corporate Trainer', 'Sales Executive', 'Marketing Manager'],
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
