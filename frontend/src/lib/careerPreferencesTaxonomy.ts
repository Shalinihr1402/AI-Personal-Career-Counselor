export type CareerMotivationId =
  | 'first_job'
  | 'financial_independence'
  | 'explore_opportunities'
  | 'long_term_career'
  | 'start_business'
  | 'develop_skills';

export type CareerPriorityId =
  | 'high_salary'
  | 'job_security'
  | 'work_life_balance'
  | 'career_growth'
  | 'passion_interest'
  | 'creativity_innovation'
  | 'helping_society';

export type WorkEnvironmentId =
  | 'work_from_home'
  | 'office_based'
  | 'hybrid'
  | 'freelancing'
  | 'self_employment'
  | 'no_preference';

export type LearningCommitmentId =
  | 'less_than_1_hr'
  | '1_to_2_hrs'
  | '2_to_4_hrs'
  | 'more_than_4_hrs'
  | 'weekends_only'
  | 'flexible';

export type CareerTimelineId =
  | 'asap'
  | 'within_3_months'
  | 'within_6_months'
  | 'within_1_year'
  | 'no_fixed_timeline';

export interface CareerDiscoveryPreferences {
  career_motivations: CareerMotivationId[];
  career_priorities: CareerPriorityId[];
  preferred_work_environment: WorkEnvironmentId | null;
  daily_learning_commitment: LearningCommitmentId | null;
  career_timeline: CareerTimelineId | null;
}

export interface MotivationOption {
  id: CareerMotivationId;
  label: string;
  desc: string;
  iconName: string;
}

export interface PriorityOption {
  id: CareerPriorityId;
  label: string;
  iconName: string;
}

export interface WorkEnvironmentOption {
  id: WorkEnvironmentId;
  label: string;
  desc: string;
  iconName: string;
}

export interface LearningCommitmentOption {
  id: LearningCommitmentId;
  label: string;
  desc: string;
}

export interface CareerTimelineOption {
  id: CareerTimelineId;
  label: string;
  desc: string;
}

export const CAREER_MOTIVATIONS: MotivationOption[] = [
  {
    id: 'first_job',
    label: 'Get my first job',
    desc: 'Launch my professional journey and secure an entry-level role',
    iconName: 'GraduationCap',
  },
  {
    id: 'financial_independence',
    label: 'Become financially independent',
    desc: 'Achieve stable income and take charge of my personal finances',
    iconName: 'Coins',
  },
  {
    id: 'explore_opportunities',
    label: 'Explore different career opportunities',
    desc: 'Discover multiple viable paths aligned with my potential',
    iconName: 'Compass',
  },
  {
    id: 'long_term_career',
    label: 'Build a long-term career',
    desc: 'Establish solid foundations for lifelong career progression',
    iconName: 'TrendingUp',
  },
  {
    id: 'start_business',
    label: 'Start my own business',
    desc: 'Pursue entrepreneurial ambitions and build something of my own',
    iconName: 'Rocket',
  },
  {
    id: 'develop_skills',
    label: 'Develop my skills',
    desc: 'Master industry-relevant capabilities and continuous learning',
    iconName: 'Sparkles',
  },
];

export const CAREER_PRIORITIES: PriorityOption[] = [
  { id: 'high_salary', label: 'High salary', iconName: 'DollarSign' },
  { id: 'job_security', label: 'Job security', iconName: 'ShieldCheck' },
  { id: 'work_life_balance', label: 'Work-life balance', iconName: 'Smile' },
  { id: 'career_growth', label: 'Career growth', iconName: 'TrendingUp' },
  { id: 'passion_interest', label: 'Personal interest and passion', iconName: 'Heart' },
  { id: 'creativity_innovation', label: 'Creativity and innovation', iconName: 'Lightbulb' },
  { id: 'helping_society', label: 'Helping people and society', iconName: 'Users' },
];

export const WORK_ENVIRONMENTS: WorkEnvironmentOption[] = [
  {
    id: 'work_from_home',
    label: 'Work from home',
    desc: 'Full remote flexibility from anywhere',
    iconName: 'Home',
  },
  {
    id: 'office_based',
    label: 'Office-based',
    desc: 'In-person collaboration in a physical office',
    iconName: 'Building2',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    desc: 'Balanced mix of office and remote days',
    iconName: 'Laptop',
  },
  {
    id: 'freelancing',
    label: 'Freelancing',
    desc: 'Autonomous project-based contract gigs',
    iconName: 'Globe',
  },
  {
    id: 'self_employment',
    label: 'Self-employment',
    desc: 'Running an independent practice or agency',
    iconName: 'Briefcase',
  },
  {
    id: 'no_preference',
    label: 'No preference',
    desc: 'Open to any setting that fits my goals',
    iconName: 'CheckCircle2',
  },
];

export const LEARNING_COMMITMENTS: LearningCommitmentOption[] = [
  { id: 'less_than_1_hr', label: 'Less than 1 hour per day', desc: 'Bite-sized, steady progress' },
  { id: '1_to_2_hrs', label: '1–2 hours per day', desc: 'Moderate, consistent daily study' },
  { id: '2_to_4_hrs', label: '2–4 hours per day', desc: 'Accelerated, dedicated learning' },
  { id: 'more_than_4_hrs', label: 'More than 4 hours per day', desc: 'Full-time immersive bootcamp pace' },
  { id: 'weekends_only', label: 'Weekends only', desc: 'Dedicated focus blocks on weekends' },
  { id: 'flexible', label: 'Flexible schedule', desc: 'Self-paced learning whenever time allows' },
];

export const CAREER_TIMELINES: CareerTimelineOption[] = [
  { id: 'asap', label: 'As soon as possible', desc: 'Urgent entry, prioritize quick job-ready skills' },
  { id: 'within_3_months', label: 'Within 3 months', desc: 'Fast turnaround, targeted skill sprints' },
  { id: 'within_6_months', label: 'Within 6 months', desc: 'Balanced timeline, solid skill-building' },
  { id: 'within_1_year', label: 'Within 1 year', desc: 'Comprehensive depth, degree/diploma completion' },
  { id: 'no_fixed_timeline', label: 'No fixed timeline', desc: 'Exploratory journey, prioritize best long-term fit' },
];

export const DEFAULT_CAREER_DISCOVERY_PREFERENCES: CareerDiscoveryPreferences = {
  career_motivations: [],
  career_priorities: [],
  preferred_work_environment: null,
  daily_learning_commitment: null,
  career_timeline: null,
};
