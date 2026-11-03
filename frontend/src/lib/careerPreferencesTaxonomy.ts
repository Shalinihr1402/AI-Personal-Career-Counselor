export type CareerMotivationId =
  | 'first_job'
  | 'financial_independence'
  | 'explore_opportunities'
  | 'long_term_career'
  | 'start_business'
  | 'develop_skills'
  | 'explore_interests'
  | 'find_right_stream'
  | 'future_career_clarity'
  | 'college_preparation'
  | 'creative_practical';

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

export type WorkStyleId =
  | 'independent'
  | 'collaborative_team'
  | 'leadership_coordination'
  | 'analytical_research'
  | 'creative_exploratory';

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

export type SwitchingChallengeId =
  | 'domain_gap'
  | 'skill_gap'
  | 'resume_rebranding'
  | 'network_guidance'
  | 'salary_parity';

export type AdvancementGoalId =
  | 'senior_role'
  | 'people_management'
  | 'tech_specialist'
  | 'architecture_strategy'
  | 'compensation_growth';

export type BreakReturnConcernId =
  | 'tool_freshness'
  | 'confidence_readiness'
  | 'flexible_hours'
  | 'resume_gap'
  | 'peer_network';

export type SupportNeedId =
  | 'mentorship'
  | 'upskilling_roadmap'
  | 'flexible_work'
  | 'interview_prep'
  | 'confidence_building';

export type DropoutPathwayId =
  | 'resume_studies'
  | 'skill_based_jobs'
  | 'diploma_cert'
  | 'freelancing_gigs'
  | 'entrepreneurship';

export interface CareerDiscoveryPreferences {
  career_motivations: CareerMotivationId[];
  career_priorities: CareerPriorityId[];
  preferred_work_environment: WorkEnvironmentId | null;
  daily_learning_commitment: LearningCommitmentId | null;
  career_timeline: CareerTimelineId | null;
}

/**
 * Unified CareerPreferences structure used across all personas and career modes.
 * Stored inside profiles.know_me.career_preferences (JSONB).
 */
export interface CareerPreferences {
  // Discovery & General Preferences
  motivation?: string[];
  career_priorities?: string[];
  preferred_work_environment?: string[];
  preferred_work_style?: string[];
  preferred_domains?: string[];
  learning_commitment?: {
    hours_per_week: number | null;
    daily_commitment?: string;
  };

  // Career Planning / Target Direction
  target_role?: string;
  target_industry?: string;
  reason_for_choice?: string;
  career_expectations?: string[];
  preparation_timeline?: string;
  skills_to_develop?: string[];

  // School Students Exploration (Class 10 & Class 12)
  subjects_to_explore?: string[];
  areas_of_curiosity?: string[];
  preferred_future_study_options?: string[];
  activities_enjoyed?: string[];

  // Career Switching (Track 3A)
  transition_reason?: string;
  transition_challenges?: string[];
  skills_to_acquire?: string[];
  target_timeline?: string;

  // Career Advancement (Track 3B)
  growth_goals?: string[];
  desired_next_role?: string;
  advancement_focus?: 'leadership' | 'specialization' | 'both' | 'individual_contributor';
  growth_challenges?: string[];

  // Career Break Return (Track 3C)
  return_goal?: string;
  readiness_concerns?: string[];
  skills_to_refresh?: string[];
  support_needs?: string[];

  // Dropouts & Alternative Pathways
  preferred_pathways?: string[];

  // Optional notes / other field
  other_notes?: string;
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

export interface WorkStyleOption {
  id: WorkStyleId;
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

export interface SwitchingChallengeOption {
  id: SwitchingChallengeId;
  label: string;
  desc: string;
}

export interface AdvancementGoalOption {
  id: AdvancementGoalId;
  label: string;
  desc: string;
}

export interface BreakReturnConcernOption {
  id: BreakReturnConcernId;
  label: string;
  desc: string;
}

export interface SupportNeedOption {
  id: SupportNeedId;
  label: string;
  desc: string;
}

export interface DropoutPathwayOption {
  id: DropoutPathwayId;
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

export const SCHOOL_MOTIVATIONS: MotivationOption[] = [
  {
    id: 'explore_interests',
    label: 'Discover my strengths & passions',
    desc: 'Find out what subjects and activities I naturally excel at',
    iconName: 'Sparkles',
  },
  {
    id: 'find_right_stream',
    label: 'Choose the best stream / course',
    desc: 'Pick the right 11th/12th stream, diploma, or future college track',
    iconName: 'Compass',
  },
  {
    id: 'future_career_clarity',
    label: 'Get clarity on future careers',
    desc: 'Learn what modern jobs exist and what education they require',
    iconName: 'Lightbulb',
  },
  {
    id: 'college_preparation',
    label: 'Prepare for top colleges & entrances',
    desc: 'Understand entrance exams, college prerequisites, and milestones',
    iconName: 'GraduationCap',
  },
  {
    id: 'creative_practical',
    label: 'Build hands-on & creative projects',
    desc: 'Engage in coding, robotics, arts, or practical science models',
    iconName: 'Rocket',
  },
];

export const SCHOOL_STUDY_OPTIONS: { id: string; label: string; group: string }[] = [
  { id: 'btech_engineering', label: 'Engineering & Technology (B.Tech / B.E.)', group: 'STEM' },
  { id: 'medical_healthcare', label: 'Medicine & Healthcare (MBBS, BDS, Allied Health)', group: 'Medical & Life Sciences' },
  { id: 'pure_applied_science', label: 'Pure & Applied Sciences (B.Sc, Research)', group: 'Sciences' },
  { id: 'commerce_finance', label: 'Commerce, Accounting & Finance (B.Com, CA)', group: 'Commerce' },
  { id: 'management_bba', label: 'Business Management & Startups (BBA / BMS)', group: 'Management' },
  { id: 'law_public_policy', label: 'Law, Humanities & Public Policy (BA LLB)', group: 'Humanities & Law' },
  { id: 'design_animation_arts', label: 'Design, Animation, Architecture & Fine Arts', group: 'Creative' },
  { id: 'polytechnic_diploma', label: 'Vocational Training & Polytechnic Diploma', group: 'Technical & Vocational' },
  { id: 'undecided_exploring', label: 'Still exploring multiple study options', group: 'Exploration' },
];

export const SCHOOL_ACTIVITIES_ENJOYED: { id: string; label: string }[] = [
  { id: 'problem_solving', label: 'Solving puzzles, math problems, or logic games' },
  { id: 'building_tech', label: 'Coding, robotics, building gadgets or tinkering' },
  { id: 'scientific_experiments', label: 'Conducting science experiments & observing nature' },
  { id: 'creative_arts', label: 'Drawing, graphic design, writing stories, or music' },
  { id: 'debating_speech', label: 'Debating, public speaking, and reading literature' },
  { id: 'business_money', label: 'Managing events, budgeting, and business ideas' },
  { id: 'helping_teaching', label: 'Helping classmates, community work, and tutoring' },
];

export const CAREER_PRIORITIES: PriorityOption[] = [
  { id: 'high_salary', label: 'High salary & earnings', iconName: 'DollarSign' },
  { id: 'job_security', label: 'Job security & stability', iconName: 'ShieldCheck' },
  { id: 'work_life_balance', label: 'Work-life balance', iconName: 'Smile' },
  { id: 'career_growth', label: 'Rapid career growth & promotion', iconName: 'TrendingUp' },
  { id: 'passion_interest', label: 'Personal interest & passion', iconName: 'Heart' },
  { id: 'creativity_innovation', label: 'Creativity & innovation', iconName: 'Lightbulb' },
  { id: 'helping_society', label: 'Helping people & social impact', iconName: 'Users' },
];

export const WORK_ENVIRONMENTS: WorkEnvironmentOption[] = [
  {
    id: 'work_from_home',
    label: 'Work from home (Remote)',
    desc: 'Full remote flexibility from anywhere',
    iconName: 'Home',
  },
  {
    id: 'office_based',
    label: 'Office-based',
    desc: 'In-person collaboration in a physical workplace',
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
    label: 'Freelancing & Consulting',
    desc: 'Autonomous client projects and independent contracts',
    iconName: 'Globe',
  },
  {
    id: 'self_employment',
    label: 'Self-employment / Entrepreneurship',
    desc: 'Running an independent agency, startup, or practice',
    iconName: 'Briefcase',
  },
  {
    id: 'no_preference',
    label: 'No preference',
    desc: 'Open to any work setting that aligns with my goals',
    iconName: 'CheckCircle2',
  },
];

export const WORK_STYLES: WorkStyleOption[] = [
  {
    id: 'independent',
    label: 'Independent & Deep Focus',
    desc: 'Thrive when working autonomously with minimal interruptions',
    iconName: 'Laptop',
  },
  {
    id: 'collaborative_team',
    label: 'Collaborative Team Player',
    desc: 'Energized by team discussions, co-creation, and agile brainstorms',
    iconName: 'Users',
  },
  {
    id: 'leadership_coordination',
    label: 'Leadership & Project Lead',
    desc: 'Enjoy driving initiatives, guiding colleagues, and coordinating deliverables',
    iconName: 'TrendingUp',
  },
  {
    id: 'analytical_research',
    label: 'Analytical & Research-Oriented',
    desc: 'Love investigating data, evaluating patterns, and methodical problem-solving',
    iconName: 'Compass',
  },
  {
    id: 'creative_exploratory',
    label: 'Creative & Exploratory',
    desc: 'Prefer prototyping novel ideas, designing experiences, and experimenting',
    iconName: 'Lightbulb',
  },
];

export const LEARNING_COMMITMENTS: LearningCommitmentOption[] = [
  { id: 'less_than_1_hr', label: 'Less than 1 hour per day (2–5 hrs/week)', desc: 'Bite-sized, steady progress alongside busy schedule' },
  { id: '1_to_2_hrs', label: '1–2 hours per day (5–10 hrs/week)', desc: 'Moderate, consistent daily self-study' },
  { id: '2_to_4_hrs', label: '2–4 hours per day (10–20 hrs/week)', desc: 'Accelerated, dedicated learning sprint' },
  { id: 'more_than_4_hrs', label: 'More than 4 hours per day (20+ hrs/week)', desc: 'Full-time immersive bootcamp pace' },
  { id: 'weekends_only', label: 'Weekends only (6–8 hrs/weekend)', desc: 'Dedicated focus blocks on Saturdays & Sundays' },
  { id: 'flexible', label: 'Flexible / Self-paced schedule', desc: 'Study whenever time allows without strict deadlines' },
];

export const CAREER_TIMELINES: CareerTimelineOption[] = [
  { id: 'asap', label: 'As soon as possible', desc: 'Urgent entry, prioritize quick job-ready skills' },
  { id: 'within_3_months', label: 'Within 3 months', desc: 'Fast turnaround, targeted skill sprints' },
  { id: 'within_6_months', label: 'Within 6 months', desc: 'Balanced timeline, solid skill-building' },
  { id: 'within_1_year', label: 'Within 1 year', desc: 'Comprehensive depth, degree/diploma completion' },
  { id: 'no_fixed_timeline', label: 'No fixed timeline', desc: 'Exploratory journey, prioritize best long-term fit' },
];

export const SWITCHING_CHALLENGES: SwitchingChallengeOption[] = [
  { id: 'domain_gap', label: 'Domain Experience Gap', desc: 'Lack of past work history or proof-of-work in target domain' },
  { id: 'skill_gap', label: 'Technical / Core Skill Gap', desc: 'Need to learn new frameworks, tools, or domain concepts' },
  { id: 'resume_rebranding', label: 'Resume & Brand Repositioning', desc: 'Translating past achievements into target-industry language' },
  { id: 'network_guidance', label: 'Industry Network & Referrals', desc: 'Need connections, mentor guidance, and insider referrals' },
  { id: 'salary_parity', label: 'Compensation & Seniority Parity', desc: 'Balancing new entry requirements with prior compensation level' },
];

export const ADVANCEMENT_GOALS: AdvancementGoalOption[] = [
  { id: 'senior_role', label: 'Senior / Lead Title Promotion', desc: 'Step up to Senior, Staff, or Principal role in current specialization' },
  { id: 'people_management', label: 'People Leadership & Management', desc: 'Transition into engineering manager, team lead, or director role' },
  { id: 'tech_specialist', label: 'Deep Technical Specialization', desc: 'Become the authoritative subject matter expert on high-impact systems' },
  { id: 'architecture_strategy', label: 'System Architecture & Strategy', desc: 'Influence cross-team architecture, product roadmap, and strategy' },
  { id: 'compensation_growth', label: 'Substantial Compensation Growth', desc: 'Achieve significant salary revision, bonuses, and leadership equity' },
];

export const BREAK_RETURN_CONCERNS: BreakReturnConcernOption[] = [
  { id: 'tool_freshness', label: 'Tool & Technology Freshness', desc: 'Catching up on recent versions, frameworks, and modern workflows' },
  { id: 'confidence_readiness', label: 'Interview Confidence & Fluency', desc: 'Rebuilding test readiness, technical interviews, and domain pitch' },
  { id: 'flexible_hours', label: 'Schedule Flexibility & Work Balance', desc: 'Finding roles that support family, health, or personal balance' },
  { id: 'resume_gap', label: 'Framing the Career Break', desc: 'Confidently communicating the break period to hiring managers' },
  { id: 'peer_network', label: 'Reactivating Professional Network', desc: 'Reconnecting with mentors, peers, and industry communities' },
];

export const SUPPORT_NEEDS: SupportNeedOption[] = [
  { id: 'mentorship', label: '1-on-1 Mentorship & Career Guidance', desc: 'Direct feedback and advice from experienced practitioners' },
  { id: 'upskilling_roadmap', label: 'Structured Learning Roadmap', desc: 'Clear step-by-step milestones without overwhelming options' },
  { id: 'flexible_work', label: 'Flexible / Hybrid Work Guidance', desc: 'Strategies to find accommodating employers and returnships' },
  { id: 'interview_prep', label: 'Mock Interviews & Refreshers', desc: 'Safe practice environments to sharpen presentation skills' },
  { id: 'confidence_building', label: 'Paced Practice & Confidence Rebuilding', desc: 'Low-stress assignments to restore technical fluency' },
];

export const DROPOUT_PATHWAYS: DropoutPathwayOption[] = [
  { id: 'resume_studies', label: 'Resume Degree / Distance Education', desc: 'Explore credit transfers, distance degrees, or open university' },
  { id: 'skill_based_jobs', label: 'Skill-First Employment', desc: 'Secure entry through verifiable portfolio projects and practical tests' },
  { id: 'diploma_cert', label: 'Industry Certifications & Bootcamps', desc: 'Fast-track practical credentials valued directly by recruiters' },
  { id: 'freelancing_gigs', label: 'Freelancing & Independent Contracts', desc: 'Build steady client revenue with flexible working autonomy' },
  { id: 'entrepreneurship', label: 'Small Business / Entrepreneurship', desc: 'Apply practical skills to launch an independent venture' },
];

export const DEFAULT_CAREER_DISCOVERY_PREFERENCES: CareerDiscoveryPreferences = {
  career_motivations: [],
  career_priorities: [],
  preferred_work_environment: null,
  daily_learning_commitment: null,
  career_timeline: null,
};

export const DEFAULT_CAREER_PREFERENCES: CareerPreferences = {
  motivation: [],
  career_priorities: [],
  preferred_work_environment: [],
  preferred_work_style: [],
  preferred_domains: [],
  learning_commitment: {
    hours_per_week: 5,
    daily_commitment: '1_to_2_hrs',
  },
  growth_goals: [],
  transition_challenges: [],
  support_needs: [],
  preferred_future_study_options: [],
  activities_enjoyed: [],
  preferred_pathways: [],
};
