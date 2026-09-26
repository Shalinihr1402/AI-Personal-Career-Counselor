/**
 * "Know me" — the part of career discovery a human counselor would ask about
 * beyond interests: what the student values, where they're strong, and the
 * real-life constraints that make some careers a better fit than others.
 */

export interface KnowMe {
  values: string[];
  subjectsStrong: string[];
  subjectsEnjoy: string[];
  knownFor: string[];
  earnTimeline: string;
  studyBudget: string;
  relocation: string;
  familyExpectation: string;
  familyNote: string;
  workSetting: string;
}

export const EMPTY_KNOW_ME: KnowMe = {
  values: [],
  subjectsStrong: [],
  subjectsEnjoy: [],
  knownFor: [],
  earnTimeline: '',
  studyBudget: '',
  relocation: '',
  familyExpectation: '',
  familyNote: '',
  workSetting: '',
};

export const MAX_VALUES = 3;

export const VALUE_OPTIONS: { value: string; hint: string }[] = [
  { value: 'High salary', hint: 'Earning well is a top priority' },
  { value: 'Job security', hint: 'A stable job I won’t easily lose' },
  { value: 'Creativity', hint: 'Making original things' },
  { value: 'Helping people', hint: 'Work that directly helps others' },
  { value: 'Work-life balance', hint: 'Predictable hours, time for life' },
  { value: 'Leadership & status', hint: 'Leading teams, being respected' },
  { value: 'Independence', hint: 'Freedom in how and when I work' },
  { value: 'Always learning', hint: 'New challenges and skills' },
  { value: 'Social impact', hint: 'Making society better' },
  { value: 'Travel & variety', hint: 'Different places, different days' },
];

export const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English & Languages',
  'Economics & Commerce',
  'Accounts',
  'History & Social Studies',
  'Arts & Drawing',
  'Music & Performing Arts',
  'Physical Education',
];

export const KNOWN_FOR_OPTIONS = [
  'Fixing tech problems',
  'Explaining things clearly',
  'Organising events & plans',
  'Coming up with creative ideas',
  'Listening & giving advice',
  'Convincing & negotiating',
  'Working with numbers',
  'Writing & editing',
  'Designing how things look',
  'Keeping the team motivated',
];

export interface SingleChoice {
  key: 'earnTimeline' | 'studyBudget' | 'relocation' | 'familyExpectation' | 'workSetting';
  question: string;
  options: string[];
}

export const SITUATION_QUESTIONS: SingleChoice[] = [
  {
    key: 'earnTimeline',
    question: 'When do you need to start earning?',
    options: ['Right after graduation', 'Within 1–2 years', 'I can study further first'],
  },
  {
    key: 'studyBudget',
    question: 'Budget for extra courses or a further degree?',
    options: ['Free resources only', 'Up to ₹50,000', 'Can invest more'],
  },
  {
    key: 'relocation',
    question: 'Are you open to moving for work?',
    options: ['Anywhere in India', 'Within my state', 'Prefer my home town', 'Open to abroad'],
  },
  {
    key: 'familyExpectation',
    question: 'How does your family feel about your career choice?',
    options: ['I’m free to choose', 'They prefer certain careers', 'I should stay in my degree’s field'],
  },
  {
    key: 'workSetting',
    question: 'Where would you like to work?',
    options: ['Office', 'Remote / from home', 'Field / outdoors', 'No preference'],
  },
];

/** True when the student has answered enough for "Know me" to be useful. */
export function isKnowMeComplete(k: KnowMe | undefined): boolean {
  if (!k) return false;
  return (
    k.values.length > 0 &&
    k.subjectsStrong.length > 0 &&
    SITUATION_QUESTIONS.every((q) => Boolean(k[q.key]))
  );
}

/** Backend expects snake_case; drop empty fields so the prompt stays short. */
export function knowMeForApi(k: KnowMe | undefined): Record<string, unknown> {
  if (!k) return {};
  const out: Record<string, unknown> = {
    values: k.values,
    subjects_strong: k.subjectsStrong,
    subjects_enjoy: k.subjectsEnjoy,
    known_for: k.knownFor,
    earn_timeline: k.earnTimeline,
    study_budget: k.studyBudget,
    relocation: k.relocation,
    family_expectation: k.familyNote
      ? `${k.familyExpectation} (${k.familyNote})`
      : k.familyExpectation,
    work_setting: k.workSetting,
  };
  return Object.fromEntries(
    Object.entries(out).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : Boolean(v))),
  );
}
