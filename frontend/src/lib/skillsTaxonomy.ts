export type SkillProficiency =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'not_sure';

export type SkillSource =
  | 'academic_project'
  | 'personal_project'
  | 'internship'
  | 'professional_employment'
  | 'certification'
  | 'competition'
  | 'self_learning'
  | 'volunteering'
  | 'school_activity'
  | 'other';

export interface UserSkill {
  name: string;
  skill_name?: string;
  category: string;
  proficiency?: SkillProficiency;
  source?: SkillSource;
  years_used?: number | string | null;
  is_custom?: boolean;
}

export type ExperienceType =
  | 'no_experience'
  | 'academic_projects'
  | 'personal_projects'
  | 'internship'
  | 'freelancing'
  | 'full_time'
  | 'part_time'
  | 'volunteering'
  | 'science_fairs'
  | 'coding_robotics'
  | 'competitions'
  | 'extracurricular'
  | 'hobbies_self_learning'
  | 'certification'
  | 'other';

export interface ExperienceItem {
  id: string;
  type: ExperienceType;
  title: string;
  organization?: string;
  role?: string;
  technologies?: string[];
  description?: string;
  duration?: string;
}

export type ProfessionalDuration =
  | 'no_experience'
  | 'less_than_6_months'
  | '6_to_12_months'
  | '1_to_2_years'
  | '2_to_5_years'
  | '5_plus_years';

export interface SkillsAndExperienceDetails {
  skills: UserSkill[];
  custom_skills: string[];
  experience_types: ExperienceType[];
  experiences: ExperienceItem[];
  professional_duration: ProfessionalDuration;
  has_no_experience?: boolean;
  not_sure_skills?: boolean;
  // Experienced professionals fields:
  current_job_role?: string;
  industry?: string;
  previous_job_roles?: string;
  key_responsibilities?: string;
  major_achievements?: string;
  leadership_experience?: string;
  // Career switchers fields:
  current_profession?: string;
  previous_experience_summary?: string;
  target_domain?: string;
  target_skills_acquired?: string[];
  skills_to_develop?: string[];
  transferable_skills?: string[];
  // Career break returners fields:
  previous_industry?: string;
  break_duration?: string;
  break_reason?: string;
  recent_learning_certifications?: string;
  readiness_status?: 'ready_now' | 'need_upskilling' | 'exploring_options';
  // School students exploration fields:
  areas_interested_in_exploring?: string[];
}

export interface SkillCategoryConfig {
  id: string;
  label: string;
  iconName: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategoryConfig[] = [
  {
    id: 'prog_tech',
    label: 'Programming & Technology',
    iconName: 'Code2',
    skills: [
      'Python',
      'Java',
      'JavaScript',
      'TypeScript',
      'C',
      'C++',
      'C#',
      'Go',
      'Rust',
      'PHP',
      'HTML/CSS',
      'React',
      'Node.js',
      'Next.js',
      'Angular',
      'Vue.js',
      'Django',
      'Flask',
      'Spring Boot',
    ],
  },
  {
    id: 'data_analytics',
    label: 'Data & Analytics',
    iconName: 'BarChart2',
    skills: [
      'SQL',
      'Data Analysis',
      'Excel',
      'Statistics',
      'Power BI',
      'Tableau',
      'Machine Learning',
      'Deep Learning',
      'Data Visualization',
      'Data Interpretation',
      'Pandas / NumPy',
    ],
  },
  {
    id: 'biz_mgmt',
    label: 'Business & Management',
    iconName: 'Briefcase',
    skills: [
      'Project Management',
      'Business Analysis',
      'Financial Modeling',
      'Accounting',
      'Digital Marketing',
      'SEO',
      'Sales Strategy',
      'Product Management',
      'Entrepreneurship',
      'Strategic Planning',
      'Budget Management',
    ],
  },
  {
    id: 'comm_people',
    label: 'Communication & People',
    iconName: 'Users',
    skills: [
      'Public Speaking',
      'Presentation Skills',
      'Leadership',
      'Teamwork',
      'Negotiation',
      'Active Listening',
      'Customer Service',
      'Client Relationship Management',
      'Conflict Resolution',
      'Interpersonal Communication',
    ],
  },
  {
    id: 'creative_design',
    label: 'Creative & Design',
    iconName: 'Palette',
    skills: [
      'UI/UX Design',
      'Figma',
      'Graphic Design',
      'Adobe Photoshop',
      'Adobe Illustrator',
      'Video Editing',
      'Animation',
      'Photography',
      'Creative Writing',
      'Storyboarding',
    ],
  },
  {
    id: 'health_life',
    label: 'Healthcare & Life Sciences',
    iconName: 'HeartPulse',
    skills: [
      'Patient Care',
      'Medical Terminology',
      'Healthcare Administration',
      'Clinical Research',
      'Laboratory Skills',
      'First Aid',
      'Medical Documentation',
      'Public Health Awareness',
      'Healthcare Communication',
    ],
  },
  {
    id: 'edu_research',
    label: 'Education & Research',
    iconName: 'BookOpen',
    skills: [
      'Teaching',
      'Mentoring',
      'Training',
      'Academic Writing',
      'Research',
      'Data Collection',
      'Critical Analysis',
      'Curriculum Development',
      'Knowledge Sharing',
      'Documentation',
    ],
  },
  {
    id: 'ops_practical',
    label: 'Operations & Practical Skills',
    iconName: 'Wrench',
    skills: [
      'Administration',
      'Inventory Management',
      'Logistics',
      'Operations Management',
      'Record Keeping',
      'Quality Control',
      'Time Management',
      'Problem Solving',
      'Critical Thinking',
      'Process Coordination',
    ],
  },
];

export const PROFICIENCY_OPTIONS: { id: SkillProficiency; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'I know the basics.' },
  { id: 'intermediate', label: 'Intermediate', desc: 'I can perform tasks independently.' },
  { id: 'advanced', label: 'Advanced', desc: 'I can handle complex tasks.' },
  { id: 'expert', label: 'Expert', desc: 'I have strong practical knowledge and can guide others.' },
  { id: 'not_sure', label: 'Not sure', desc: "I'm still evaluating my level." },
];

export const EXPERIENCE_TYPE_OPTIONS: { id: ExperienceType; label: string; desc: string; icon: string }[] = [
  { id: 'no_experience', label: 'No practical experience', desc: 'Starting fresh without past projects', icon: '🌱' },
  { id: 'academic_projects', label: 'Academic projects', desc: 'Coursework, capstones, lab assignments', icon: '🎓' },
  { id: 'personal_projects', label: 'Personal projects', desc: 'Self-initiated builds, portfolios, hobbies', icon: '💻' },
  { id: 'internship', label: 'Internship', desc: 'Supervised industry training & stints', icon: '🏢' },
  { id: 'certification', label: 'Certifications & Courses', desc: 'Industry certifications, online bootcamps', icon: '📜' },
  { id: 'freelancing', label: 'Freelancing', desc: 'Client work, gigs, independent contracts', icon: '💼' },
  { id: 'full_time', label: 'Full-time employment', desc: 'Salaried professional work experience', icon: '👔' },
  { id: 'part_time', label: 'Part-time employment', desc: 'Part-time roles alongside study/other pursuits', icon: '⏱️' },
  { id: 'volunteering', label: 'Volunteering', desc: 'Community, non-profit, student clubs', icon: '🤝' },
  { id: 'other', label: 'Other', desc: 'Custom non-traditional work or projects', icon: '✨' },
];

export const SCHOOL_EXPERIENCE_OPTIONS: { id: ExperienceType; label: string; desc: string; icon: string }[] = [
  { id: 'no_experience', label: "I haven't participated in practical activities yet", desc: 'Starting fresh without past activities', icon: '🌱' },
  { id: 'academic_projects', label: 'Academic projects & practicals', desc: 'School lab projects, exhibition models, assignments', icon: '🧪' },
  { id: 'science_fairs', label: 'Science fairs & exhibitions', desc: 'School / inter-school science models & demonstrations', icon: '🔬' },
  { id: 'coding_robotics', label: 'Coding, robotics & tech clubs', desc: 'Computer club, Scratch, Python, Arduino, Lego robotics', icon: '🤖' },
  { id: 'competitions', label: 'Competitions & Olympiads', desc: 'Math Olympiads, debate, quiz, spelling bees, hackathons', icon: '🏆' },
  { id: 'extracurricular', label: 'Extracurricular & arts', desc: 'Drama, music, school band, fine arts, student council', icon: '🎨' },
  { id: 'hobbies_self_learning', label: 'Hobbies & self-learning', desc: 'Self-taught skills, reading, writing, building things at home', icon: '💡' },
];

export const SCHOOL_EXPLORATION_AREAS = [
  'Artificial Intelligence & Coding',
  'Robotics & Gadgets',
  'Space Science & Astronomy',
  'Medicine, Biology & Health',
  'Video Game Design & Animation',
  'Creative Writing & Journalism',
  'Business, Startups & Finance',
  'Architecture & Product Design',
  'Law, Debating & Public Policy',
  'Psychology & Human Behavior',
  'Environmental Science & Wildlife',
  'Sports Analytics & Physical Fitness',
];

export const PROFESSIONAL_DURATION_OPTIONS: { id: ProfessionalDuration; label: string }[] = [
  { id: 'no_experience', label: 'No professional experience' },
  { id: 'less_than_6_months', label: 'Less than 6 months' },
  { id: '6_to_12_months', label: '6–12 months' },
  { id: '1_to_2_years', label: '1–2 years' },
  { id: '2_to_5_years', label: '2–5 years' },
  { id: '5_plus_years', label: '5+ years' },
];

export const DEFAULT_SKILLS_AND_EXPERIENCE: SkillsAndExperienceDetails = {
  skills: [],
  custom_skills: [],
  experience_types: [],
  experiences: [],
  professional_duration: 'no_experience',
};
