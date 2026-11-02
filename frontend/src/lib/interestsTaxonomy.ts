export interface InterestCategoryConfig {
  id: string;
  label: string;
  iconName: string;
  subInterests: string[];
}

export interface InterestDetails {
  interest_categories: string[]; // Category IDs e.g. ['coding_tech', 'design_creativity']
  specific_interests: string[]; // Sub-interest labels e.g. ['Web Development', 'AI & Machine Learning']
  additional_interests: string; // Freeform notes
  interest_exploration_status: 'focused' | 'exploring';
}

export const INTEREST_CATEGORIES: InterestCategoryConfig[] = [
  {
    id: 'coding_tech',
    label: 'Coding & Tech',
    iconName: 'Code2',
    subInterests: [
      'Web Development',
      'App Development',
      'AI & Machine Learning',
      'Data Science',
      'Cybersecurity',
      'Software Engineering',
      'Cloud Computing',
    ],
  },
  {
    id: 'design_creativity',
    label: 'Design & Creativity',
    iconName: 'Palette',
    subInterests: [
      'UI/UX Design',
      'Graphic Design',
      'Animation',
      'Video Editing',
      'Fashion Design',
    ],
  },
  {
    id: 'data_numbers',
    label: 'Data & Numbers',
    iconName: 'Calculator',
    subInterests: [
      'Data Analytics',
      'Statistics',
      'Finance',
      'Accounting',
      'Business Intelligence',
    ],
  },
  {
    id: 'communication_people',
    label: 'Communication & People',
    iconName: 'Users',
    subInterests: [
      'Human Resources',
      'Counseling',
      'Teaching',
      'Customer Relations',
      'Team Collaboration',
    ],
  },
  {
    id: 'business_management',
    label: 'Business & Management',
    iconName: 'Briefcase',
    subInterests: [
      'Entrepreneurship',
      'Marketing',
      'Project Management',
      'Sales',
      'Operations',
    ],
  },
  {
    id: 'science_research',
    label: 'Science & Research',
    iconName: 'FlaskConical',
    subInterests: [
      'Scientific Research',
      'Biotechnology',
      'Physics',
      'Chemistry',
      'Environmental Science',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    iconName: 'HeartPulse',
    subInterests: [
      'Medicine',
      'Nursing',
      'Pharmacy',
      'Psychology',
      'Healthcare Administration',
    ],
  },
  {
    id: 'sports_fitness',
    label: 'Sports & Fitness',
    iconName: 'Dumbbell',
    subInterests: [
      'Fitness Training',
      'Sports Coaching',
      'Sports Management',
    ],
  },
  {
    id: 'writing_content',
    label: 'Writing & Content',
    iconName: 'PenTool',
    subInterests: [
      'Blogging',
      'Technical Writing',
      'Copywriting',
      'Journalism',
    ],
  },
  {
    id: 'public_speaking',
    label: 'Public Speaking',
    iconName: 'Mic',
    subInterests: [
      'Presentations',
      'Training',
      'Hosting',
      'Debating',
    ],
  },
];

/**
 * Builds a unified list of interest strings for legacy consumers
 * (AI prompt, hybrid vector cosine search, rule-based matching).
 */
export function buildCombinedInterests(details: InterestDetails): string[] {
  if (details.interest_exploration_status === 'exploring') {
    return ["I'm still exploring my interests"];
  }

  const categoryLabels = details.interest_categories
    .map((catId) => INTEREST_CATEGORIES.find((c) => c.id === catId)?.label)
    .filter(Boolean) as string[];

  // Merge categories and specific sub-interests, removing duplicates
  return Array.from(new Set([...categoryLabels, ...details.specific_interests]));
}
