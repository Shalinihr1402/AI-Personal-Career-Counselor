import type { EducationStage } from './onboarding';

export type EducationLevel =
  | 'sslc_10th'
  | 'puc_12th'
  | 'diploma'
  | 'undergraduate'
  | 'postgraduate'
  | 'doctoral_phd'
  | 'other';

export type EducationStatus =
  | 'currently_studying'
  | 'completed'
  | 'discontinued'
  | 'gap_year';

export type StudyStageType = 'year' | 'semester' | 'medical_phase' | 'standard' | 'graduation_year';

export interface EducationDetails {
  education_level: EducationLevel;
  education_status: EducationStatus;
  degree: string;
  degree_other?: string;
  specialization: string;
  specialization_other?: string;
  institution?: string;
  study_stage_type: StudyStageType;
  study_stage_value: string;
  graduation_year?: string;
  last_attended_stage?: string;
  highest_qualification?: string;
  gap_year_reason?: string;
  discontinuation_reason?: string;
  year_discontinued?: string;
  prior_qualification?: string;
  plan_to_resume?: 'yes' | 'no' | 'undecided';
  school_board?: string;
  school_board_other?: string;
  school_stream?: string;
  favorite_school_subjects?: string[];
}

export interface DegreeConfig {
  id: string;
  name: string;
  durationYears: number;
  totalSemesters?: number;
  customPhases?: string[];
  defaultSpecializations?: string[];
}

export const EDUCATION_LEVELS: { id: EducationLevel; label: string; icon: string; hint: string }[] = [
  { id: 'undergraduate', label: 'Undergraduate (UG)', icon: '🏛️', hint: 'B.Tech, BCA, BSc, B.Com, MBBS, BA, etc.' },
  { id: 'postgraduate', label: 'Postgraduate (PG)', icon: '🎓', hint: 'MCA, M.Tech, MBA, MSc, M.Com, MA, etc.' },
  { id: 'diploma', label: 'Diploma / Polytechnic', icon: '📜', hint: '3-Year Polytechnic, D.Pharm, D.Voc' },
  { id: 'puc_12th', label: '12th / PUC / Intermediate', icon: '📘', hint: 'Higher Secondary (Science, Commerce, Arts)' },
  { id: 'sslc_10th', label: '10th / SSLC', icon: '🏫', hint: 'Secondary School / 10th Board' },
  { id: 'doctoral_phd', label: 'Doctoral / PhD', icon: '🔬', hint: 'Ph.D, Pharm.D, Post-Doctoral Fellowship' },
  { id: 'other', label: 'Other / Certification', icon: '✨', hint: 'Open Schooling, Vocational, Certificate Programs' },
];

export const EDUCATION_STATUSES: { id: EducationStatus; label: string; icon: string; desc: string }[] = [
  { id: 'currently_studying', label: 'Currently studying', icon: '📖', desc: 'Enrolled and actively pursuing coursework' },
  { id: 'completed', label: 'Graduated / Completed', icon: '🎓', desc: 'Finished all academic requirements and exams' },
  { id: 'discontinued', label: 'Discontinued / Dropout', icon: '⏸️', desc: 'Paused or left before degree completion' },
  { id: 'gap_year', label: 'On a gap year', icon: '⏳', desc: 'Taking a planned break or preparing for admissions' },
];

export interface SchoolBoardConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

export const SCHOOL_BOARDS: SchoolBoardConfig[] = [
  { id: 'cbse', name: 'Central Board of Secondary Education (CBSE)', shortName: 'CBSE', description: 'National curriculum with comprehensive board examinations' },
  { id: 'icse', name: 'Indian Certificate of Secondary Education (ICSE / ISC)', shortName: 'ICSE / CISCE', description: 'In-depth conceptual application and language focus' },
  { id: 'state_board', name: 'State Board of Education (SSLC / State Board)', shortName: 'State Board', description: 'Regional curriculum prescribed by state education departments' },
  { id: 'ib_cambridge', name: 'International Baccalaureate (IB) / Cambridge (IGCSE / A-Levels)', shortName: 'IB / Cambridge', description: 'Global inquiry-based international curriculum' },
  { id: 'nios', name: 'National Institute of Open Schooling (NIOS)', shortName: 'NIOS', description: 'Flexible self-paced open schooling' },
  { id: 'other', name: 'Other Recognized School Board', shortName: 'Other', description: 'Alternative or foreign board' },
];

export const CLASS_10_SUBJECTS = [
  'Mathematics',
  'Science (Physics, Chemistry, Biology)',
  'Social Studies (History, Geography, Civics, Economics)',
  'Computer Applications / Coding',
  'English & Literature',
  'Second Language (Hindi, Regional, French, Sanskrit)',
  'Art & Visual Expression',
  'Physical Education & Sports',
];

export const HIGH_SCHOOL_STREAMS = [
  { id: 'science_pcmb', label: 'Science — PCMB (Physics, Chemistry, Math, Biology)', group: 'Science' },
  { id: 'science_pcmc', label: 'Science — PCMC (Physics, Chemistry, Math, Computer Science)', group: 'Science' },
  { id: 'science_pcme', label: 'Science — PCME (Physics, Chemistry, Math, Electronics)', group: 'Science' },
  { id: 'science_pcb', label: 'Science — PCB (Physics, Chemistry, Biology - Medical Focus)', group: 'Science' },
  { id: 'commerce_math', label: 'Commerce — with Mathematics / Business Math', group: 'Commerce' },
  { id: 'commerce_comp', label: 'Commerce — with Computer Applications / Informatics Practices', group: 'Commerce' },
  { id: 'commerce_general', label: 'Commerce — General (Accounts, Business Studies, Economics)', group: 'Commerce' },
  { id: 'arts_humanities', label: 'Arts & Humanities (History, Psychology, Political Science, Sociology)', group: 'Arts' },
  { id: 'vocational_applied', label: 'Vocational / Applied Sciences / Design', group: 'Vocational' },
  { id: 'other', label: 'Other Custom Stream', group: 'Other' },
];

// Specialization presets
const CS_ENGG_SPECS = [
  'Computer Science & Engineering',
  'Information Science & Technology',
  'Artificial Intelligence & Machine Learning (AI & ML)',
  'Data Science & Analytics',
  'Cybersecurity & Ethical Hacking',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology Engineering',
  'Chemical Engineering',
  'Aerospace / Aeronautical Engineering',
  'Automobile Engineering',
  'Robotics & Automation',
  'Other',
];

const BASIC_SCIENCES_SPECS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology / Life Sciences',
  'Biotechnology',
  'Statistics',
  'Electronics',
  'Microbiology',
  'Biochemistry',
  'Data Science',
  'Other',
];

const COMMERCE_SPECS = [
  'General Commerce',
  'Accounting & Finance',
  'Banking & Insurance',
  'Taxation & Law',
  'Financial Markets',
  'Corporate Secretaryship',
  'Business Analytics',
  'Other',
];

const MANAGEMENT_SPECS = [
  'Marketing Management',
  'Financial Management',
  'Human Resources (HR)',
  'Operations & Supply Chain',
  'Business Analytics',
  'International Business',
  'Information Technology Management',
  'Healthcare & Hospital Management',
  'Other',
];

const COMPUTER_APPS_SPECS = [
  'Computer Applications & Software Development',
  'Cloud Computing & DevOps',
  'Data Science & Big Data',
  'Cyber Security & Networking',
  'AI & Machine Learning',
  'Full Stack Web Development',
  'Mobile App Development',
  'Other',
];

const ARTS_HUMANITIES_SPECS = [
  'English Literature',
  'Psychology',
  'Economics',
  'Journalism & Mass Communication',
  'Political Science',
  'History',
  'Sociology',
  'Public Administration',
  'Other',
];

const MEDICAL_SPECS = [
  'General Medicine & Surgery',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Cardiology',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Radiology',
  'Other',
];

const DENTAL_SPECS = [
  'General Dentistry',
  'Orthodontics',
  'Oral & Maxillofacial Surgery',
  'Periodontics',
  'Prosthodontics',
  'Conservative Dentistry & Endodontics',
  'Other',
];

const AYUSH_SPECS = [
  'General Ayurvedic Medicine (Kayachikitsa)',
  'Shalya Tantra (Surgery)',
  'Panchakarma',
  'Homeopathic Materia Medica',
  'Organon of Medicine',
  'Repertory & Pharmacy',
  'Other',
];

const PHARMACY_SPECS = [
  'Pharmaceutics',
  'Pharmacology',
  'Pharmaceutical Chemistry',
  'Pharmacognosy',
  'Pharmacy Practice & Clinical Pharmacy',
  'Other',
];

const ARCHITECTURE_SPECS = [
  'Architectural Design',
  'Urban Planning & Design',
  'Landscape Architecture',
  'Interior Architecture',
  'Sustainable & Environmental Architecture',
  'Other',
];

const LAW_SPECS = [
  'Corporate & Commercial Law',
  'Constitutional & Administrative Law',
  'Criminal Law & Criminology',
  'Intellectual Property Rights (IPR)',
  'Cyber Law & Technology',
  'International Law & Human Rights',
  'Other',
];

const PUC_SPECS = [
  'Science — PCMB (Physics, Chemistry, Math, Biology)',
  'Science — PCMC (Physics, Chemistry, Math, Computer Science)',
  'Science — PCME (Physics, Chemistry, Math, Electronics)',
  'Commerce — with Mathematics / Statistics',
  'Commerce — with Computer Science / IP',
  'Arts / Humanities — Psychology, History, Pol Science',
  'Other',
];

const SSLC_SPECS = [
  'State Board Curriculum',
  'CBSE (Central Board of Secondary Education)',
  'ICSE (Indian Certificate of Secondary Education)',
  'International Baccalaureate (IB) / IGCSE',
  'NIOS (National Institute of Open Schooling)',
  'Other',
];

export const DIPLOMA_SPECS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics Engineering',
  'Electronics & Communication Engineering',
  'Automobile Engineering',
  'Chemical Engineering',
  'Pharmacy Practice (D.Pharm)',
  'Commercial Practice',
  'Other',
];

export const DEGREE_CATALOG: Record<EducationLevel, DegreeConfig[]> = {
  undergraduate: [
    { id: 'btech_be', name: 'BE / BTech', durationYears: 4, totalSemesters: 8, defaultSpecializations: CS_ENGG_SPECS },
    { id: 'bca', name: 'BCA (Bachelor of Computer Applications)', durationYears: 3, totalSemesters: 6, defaultSpecializations: COMPUTER_APPS_SPECS },
    { id: 'bsc', name: 'BSc (Bachelor of Science)', durationYears: 3, totalSemesters: 6, defaultSpecializations: BASIC_SCIENCES_SPECS },
    { id: 'bcom', name: 'BCom (Bachelor of Commerce)', durationYears: 3, totalSemesters: 6, defaultSpecializations: COMMERCE_SPECS },
    { id: 'ba', name: 'BA (Bachelor of Arts)', durationYears: 3, totalSemesters: 6, defaultSpecializations: ARTS_HUMANITIES_SPECS },
    { id: 'bba_bbm', name: 'BBA / BBM', durationYears: 3, totalSemesters: 6, defaultSpecializations: MANAGEMENT_SPECS },
    {
      id: 'mbbs',
      name: 'MBBS (Bachelor of Medicine & Surgery)',
      durationYears: 5,
      customPhases: [
        '1st Professional (Phase I)',
        '2nd Professional (Phase II)',
        '3rd Professional Part 1 (Phase III Part 1)',
        '3rd Professional Part 2 (Phase III Part 2)',
        'Compulsory Rotating Medical Internship (CRMI)',
      ],
      defaultSpecializations: MEDICAL_SPECS,
    },
    { id: 'bds', name: 'BDS (Bachelor of Dental Surgery)', durationYears: 5, totalSemesters: 10, defaultSpecializations: DENTAL_SPECS },
    { id: 'bams', name: 'BAMS (Ayurvedic Medicine & Surgery)', durationYears: 5, customPhases: ['1st Professional Year', '2nd Professional Year', '3rd Professional Year', 'Final Professional Year', 'Compulsory Internship'], defaultSpecializations: AYUSH_SPECS },
    { id: 'bhms', name: 'BHMS (Homeopathic Medicine & Surgery)', durationYears: 5, customPhases: ['1st Professional Year', '2nd Professional Year', '3rd Professional Year', 'Final Professional Year', 'Compulsory Internship'], defaultSpecializations: AYUSH_SPECS },
    { id: 'barch', name: 'BArch (Bachelor of Architecture)', durationYears: 5, totalSemesters: 10, defaultSpecializations: ARCHITECTURE_SPECS },
    { id: 'bpharm', name: 'BPharm (Bachelor of Pharmacy)', durationYears: 4, totalSemesters: 8, defaultSpecializations: PHARMACY_SPECS },
    { id: 'llb', name: 'LLB (3-Year or 5-Year Integrated Law)', durationYears: 5, totalSemesters: 10, defaultSpecializations: LAW_SPECS },
    { id: 'bsc_agri', name: 'BSc Agriculture / Horticulture', durationYears: 4, totalSemesters: 8, defaultSpecializations: ['Agronomy', 'Horticulture', 'Agricultural Economics', 'Entomology', 'Plant Pathology', 'Soil Science', 'Other'] },
    { id: 'bed', name: 'BEd (Bachelor of Education)', durationYears: 2, totalSemesters: 4, defaultSpecializations: ['Science & Mathematics Teaching', 'Social Sciences Teaching', 'Languages Teaching', 'Special Education', 'Other'] },
    { id: 'other', name: 'Other Undergraduate Degree', durationYears: 3, totalSemesters: 6, defaultSpecializations: ['General', 'Other'] },
  ],
  postgraduate: [
    { id: 'mca', name: 'MCA (Master of Computer Applications)', durationYears: 2, totalSemesters: 4, defaultSpecializations: COMPUTER_APPS_SPECS },
    { id: 'mtech_me', name: 'ME / MTech', durationYears: 2, totalSemesters: 4, defaultSpecializations: CS_ENGG_SPECS },
    { id: 'mba_pgdm', name: 'MBA / PGDM', durationYears: 2, totalSemesters: 4, defaultSpecializations: MANAGEMENT_SPECS },
    { id: 'msc', name: 'MSc (Master of Science)', durationYears: 2, totalSemesters: 4, defaultSpecializations: BASIC_SCIENCES_SPECS },
    { id: 'mcom', name: 'MCom (Master of Commerce)', durationYears: 2, totalSemesters: 4, defaultSpecializations: COMMERCE_SPECS },
    { id: 'ma', name: 'MA (Master of Arts)', durationYears: 2, totalSemesters: 4, defaultSpecializations: ARTS_HUMANITIES_SPECS },
    { id: 'md_ms', name: 'MD / MS (Doctor of Medicine / Master of Surgery)', durationYears: 3, defaultSpecializations: MEDICAL_SPECS },
    { id: 'mpharm', name: 'MPharm (Master of Pharmacy)', durationYears: 2, totalSemesters: 4, defaultSpecializations: PHARMACY_SPECS },
    { id: 'march', name: 'MArch (Master of Architecture)', durationYears: 2, totalSemesters: 4, defaultSpecializations: ARCHITECTURE_SPECS },
    { id: 'llm', name: 'LLM (Master of Laws)', durationYears: 2, totalSemesters: 4, defaultSpecializations: LAW_SPECS },
    { id: 'other', name: 'Other Postgraduate Degree', durationYears: 2, totalSemesters: 4, defaultSpecializations: ['General', 'Other'] },
  ],
  diploma: [
    { id: 'diploma_engg', name: 'Diploma in Engineering / Polytechnic', durationYears: 3, totalSemesters: 6, defaultSpecializations: DIPLOMA_SPECS },
    { id: 'dpharm', name: 'Diploma in Pharmacy (D.Pharm)', durationYears: 2, defaultSpecializations: ['Pharmacy Practice', 'Clinical Dispensing', 'Other'] },
    { id: 'd_comm', name: 'Diploma in Commercial Practice', durationYears: 3, totalSemesters: 6, defaultSpecializations: ['Secretarial Practice', 'Accountancy', 'Office Automation', 'Other'] },
    { id: 'd_voc', name: 'Diploma in Vocational Studies (D.Voc)', durationYears: 3, totalSemesters: 6, defaultSpecializations: ['Refrigeration & AC', 'Automotive Repair', 'Graphic Arts', 'Other'] },
    { id: 'other', name: 'Other Polytechnic / Vocational Diploma', durationYears: 3, totalSemesters: 6, defaultSpecializations: ['General Technical', 'Other'] },
  ],
  puc_12th: [
    {
      id: 'puc_12th_general',
      name: 'Higher Secondary / 12th / PUC / Intermediate',
      durationYears: 2,
      customPhases: ['1st PUC / 11th Standard', '2nd PUC / 12th Standard (Board Appearing)'],
      defaultSpecializations: PUC_SPECS,
    },
    { id: 'other', name: 'Other Higher Secondary Certification', durationYears: 2, defaultSpecializations: PUC_SPECS },
  ],
  sslc_10th: [
    {
      id: 'sslc_10th_general',
      name: 'Secondary School Certificate (10th / SSLC / Matriculation)',
      durationYears: 1,
      customPhases: ['9th Standard', '10th Standard / Board Appearing'],
      defaultSpecializations: SSLC_SPECS,
    },
    { id: 'other', name: 'Other Secondary Education', durationYears: 1, defaultSpecializations: SSLC_SPECS },
  ],
  doctoral_phd: [
    { id: 'phd', name: 'PhD (Doctor of Philosophy)', durationYears: 4, customPhases: ['Coursework & Proposal Defense', 'Research & Literature Review', 'Data Collection & Experimentation', 'Thesis Writing & Pre-Submission', 'Final Viva Voce'], defaultSpecializations: CS_ENGG_SPECS },
    { id: 'pharmd', name: 'PharmD (Doctor of Pharmacy)', durationYears: 6, totalSemesters: 12, defaultSpecializations: PHARMACY_SPECS },
    { id: 'postdoc', name: 'Post-Doctoral Fellowship', durationYears: 2, customPhases: ['Year 1 Fellowship', 'Year 2 Fellowship / Principal Investigator'], defaultSpecializations: ['Engineering & AI', 'Life Sciences', 'Physical Sciences', 'Social Sciences', 'Other'] },
    { id: 'other', name: 'Other Doctoral Qualification', durationYears: 4, defaultSpecializations: ['General Research', 'Other'] },
  ],
  other: [
    { id: 'cert_course', name: 'Professional Certification / Boot Camp', durationYears: 1, customPhases: ['Ongoing Coursework', 'Capstone Project Phase', 'Placement Preparation'], defaultSpecializations: ['Full Stack Development', 'Data Science & AI', 'Cloud & DevOps', 'UI/UX Design', 'Digital Marketing', 'Other'] },
    { id: 'open_school', name: 'Open Schooling / Distance Learning', durationYears: 2, defaultSpecializations: ['General Studies', 'Other'] },
    { id: 'other', name: 'Custom Educational Program', durationYears: 1, defaultSpecializations: ['General', 'Other'] },
  ],
};

export const GRADUATION_YEARS = [
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
  '2017',
  '2016',
  '2015',
  '2014 or earlier',
];

export const HIGHEST_QUALIFICATIONS = [
  '10th / SSLC / Secondary School',
  '12th / PUC / Higher Secondary',
  '3-Year Polytechnic Diploma',
  'Undergraduate Degree (e.g. BTech, BSc, BCom, BA)',
  'Postgraduate Degree (e.g. MTech, MCA, MBA, MSc)',
  'Other Certificate / Vocational',
];

/**
 * Maps new granular EducationLevel to the legacy 5-stage union
 * so all legacy pages and AI counselor prompts remain 100% compatible.
 */
export function mapLevelToLegacyStage(level: EducationLevel): EducationStage {
  switch (level) {
    case 'sslc_10th':
      return 'sslc_10th';
    case 'puc_12th':
      return 'puc_12th';
    case 'diploma':
      return 'diploma';
    case 'undergraduate':
      return 'degree_ug';
    case 'postgraduate':
    case 'doctoral_phd':
      return 'postgrad';
    default:
      return 'degree_ug';
  }
}

/**
 * Computes study stage options (Year vs Semester vs Custom Phase)
 * dynamically based on degree duration and custom phase configurations.
 */
export function getStudyStageOptions(
  degreeConfig: DegreeConfig | undefined,
  mode: 'year' | 'semester' = 'year'
): { id: string; label: string }[] {
  if (!degreeConfig) {
    return [
      { id: '1st Year', label: '1st Year' },
      { id: '2nd Year', label: '2nd Year' },
      { id: '3rd Year', label: '3rd Year' },
      { id: 'Final Year', label: 'Final Year' },
    ];
  }

  if (degreeConfig.customPhases && degreeConfig.customPhases.length > 0) {
    return degreeConfig.customPhases.map((phase) => ({ id: phase, label: phase }));
  }

  if (mode === 'semester' && degreeConfig.totalSemesters) {
    const list: { id: string; label: string }[] = [];
    for (let s = 1; s <= degreeConfig.totalSemesters; s++) {
      const suffix = s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th';
      const isFinal = s === degreeConfig.totalSemesters;
      list.push({
        id: `${s}${suffix} Semester`,
        label: `${s}${suffix} Semester${isFinal ? ' (Final)' : ''}`,
      });
    }
    return list;
  }

  const years: { id: string; label: string }[] = [];
  const totalY = degreeConfig.durationYears || 3;
  for (let y = 1; y <= totalY; y++) {
    const suffix = y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th';
    const isFinal = y === totalY;
    years.push({
      id: `${y}${suffix} Year`,
      label: `${y}${suffix} Year${isFinal ? ' (Final Year)' : ''}`,
    });
  }
  return years;
}
