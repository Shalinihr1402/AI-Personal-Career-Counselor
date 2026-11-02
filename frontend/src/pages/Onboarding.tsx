import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, CheckCircle2, X, Sparkles, ArrowRight, ArrowLeft, ArrowRightLeft,
  LogOut, Target, Search, TrendingUp, Clock,
  Code2, Palette, Calculator, Users, Briefcase, FlaskConical, HeartPulse,
  Dumbbell, PenTool, Mic, Check,
  BarChart2, BookOpen, Wrench, Plus, Trash2, HelpCircle, Layers,
  Coins, Rocket, ShieldCheck, Smile, Heart, Lightbulb, Home, Building2, Laptop, DollarSign, Globe,
  AlertTriangle, RotateCcw, RefreshCw, Eye,
} from 'lucide-react';
import { ResumeReviewModal } from '../components/ResumeReviewModal';
import type { ExtractedResumeData } from '../lib/resumeReview';
import {
  loadUserDraft,
  loadUserStep,
  saveUserDraft,
  saveUserStep,
  clearUserDraft,
} from '../lib/onboardingDraft';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { API_BASE } from '../lib/api';
import { isMissingTable, type Profile } from '../lib/profile';
import {
  type CareerMode,
  type CareerPath,
  type CareerGrowthSubtype,
  type UserPersona,
  type EducationStage,
  CAREER_MODE_TO_PATH,
  PATH_TO_CAREER_MODE,
  CAREER_GROWTH_SUBTYPES,
  detectUserPersona,
} from '../lib/onboarding';
import { SearchableSelect } from '../components/SearchableSelect';
import {
  type EducationDetails,
  type EducationLevel,
  EDUCATION_LEVELS,
  EDUCATION_STATUSES,
  DEGREE_CATALOG,
  GRADUATION_YEARS,
  HIGHEST_QUALIFICATIONS,
  SCHOOL_BOARDS,
  CLASS_10_SUBJECTS,
  HIGH_SCHOOL_STREAMS,
  DIPLOMA_SPECS,
  mapLevelToLegacyStage,
  getStudyStageOptions,
} from '../lib/educationTaxonomy';
import {
  type InterestDetails,
  INTEREST_CATEGORIES,
  buildCombinedInterests,
} from '../lib/interestsTaxonomy';
import {
  type SkillProficiency,
  type SkillSource,
  type UserSkill,
  type ExperienceType,
  type ExperienceItem,
  type ProfessionalDuration,
  type SkillsAndExperienceDetails,
  SKILL_CATEGORIES,
  PROFICIENCY_OPTIONS,
  EXPERIENCE_TYPE_OPTIONS,
  SCHOOL_EXPERIENCE_OPTIONS,
  SCHOOL_EXPLORATION_AREAS,
  PROFESSIONAL_DURATION_OPTIONS,
  DEFAULT_SKILLS_AND_EXPERIENCE,
} from '../lib/skillsTaxonomy';
import {
  type CareerMotivationId,
  type CareerPriorityId,
  type WorkEnvironmentId,
  type LearningCommitmentId,
  type CareerTimelineId,
  type CareerDiscoveryPreferences,
  CAREER_MOTIVATIONS,
  CAREER_PRIORITIES,
  WORK_ENVIRONMENTS,
  LEARNING_COMMITMENTS,
  CAREER_TIMELINES,
  DEFAULT_CAREER_DISCOVERY_PREFERENCES,
} from '../lib/careerPreferencesTaxonomy';
import { Calendar, GraduationCap, Compass, ChevronDown } from 'lucide-react';

type Path = CareerPath;

interface OnboardingData {
  path: Path | null;
  career_mode?: CareerMode | null;
  career_growth_subtype?: CareerGrowthSubtype | null;
  user_persona?: UserPersona | null;
  educationStage: EducationStage;
  education_details?: EducationDetails;
  interest_details?: InterestDetails;
  skills_and_experience?: SkillsAndExperienceDetails;
  career_discovery_preferences?: CareerDiscoveryPreferences;
  streamOrBranch: string;
  college: string;
  course: string;
  year: string;
  interests: string[];
  strengthsNote: string;
  targetRole: string;
  hoursPerWeek: string;
}

const defaultEducationDetails: EducationDetails = {
  education_level: 'undergraduate',
  education_status: 'currently_studying',
  degree: 'btech_be',
  specialization: 'Computer Science & Engineering',
  institution: '',
  study_stage_type: 'year',
  study_stage_value: '1st Year',
};

const defaultInterestDetails: InterestDetails = {
  interest_categories: [],
  specific_interests: [],
  additional_interests: '',
  interest_exploration_status: 'focused',
};

const emptyData: OnboardingData = {
  path: null,
  career_mode: null,
  career_growth_subtype: null,
  user_persona: null,
  educationStage: 'degree_ug',
  education_details: defaultEducationDetails,
  interest_details: defaultInterestDetails,
  skills_and_experience: DEFAULT_SKILLS_AND_EXPERIENCE,
  career_discovery_preferences: DEFAULT_CAREER_DISCOVERY_PREFERENCES,
  streamOrBranch: 'Computer Science & Engineering',
  college: '',
  course: 'BE / BTech - Computer Science & Engineering',
  year: '1st Year',
  interests: [],
  strengthsNote: '',
  targetRole: '',
  hoursPerWeek: '',
};

const STEPS = ['Your goal', 'About you', 'Interests', 'Skills & experience', 'Target & time', 'Resume'] as const;

const PATH_OPTIONS: { value: CareerMode; icon: React.ReactNode; title: string; desc: string }[] = [
  {
    value: 'career_planning',
    icon: <Target className="w-6 h-6" />,
    title: 'I know my career goal',
    desc: 'I have a specific career in mind. Help me identify the skills, qualifications, and steps needed to achieve it.',
  },
  {
    value: 'career_discovery',
    icon: <Search className="w-6 h-6" />,
    title: 'Help me discover my ideal career',
    desc: "I'm not sure which career suits me. Help me explore suitable careers based on my interests, strengths, skills, and personality.",
  },
  {
    value: 'career_growth_transition',
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'I want to grow or change my career',
    desc: "I'm currently studying or working. Help me advance in my current field or explore a different career path.",
  },
];

const INTEREST_OPTIONS: { value: string; icon: React.ReactNode }[] = [
  { value: 'Coding & Tech', icon: <Code2 className="w-4 h-4" /> },
  { value: 'Design & Creativity', icon: <Palette className="w-4 h-4" /> },
  { value: 'Data & Numbers', icon: <Calculator className="w-4 h-4" /> },
  { value: 'Communication & People', icon: <Users className="w-4 h-4" /> },
  { value: 'Business & Management', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'Science & Research', icon: <FlaskConical className="w-4 h-4" /> },
  { value: 'Healthcare', icon: <HeartPulse className="w-4 h-4" /> },
  { value: 'Sports & Fitness', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'Writing & Content', icon: <PenTool className="w-4 h-4" /> },
  { value: 'Public Speaking', icon: <Mic className="w-4 h-4" /> },
];

const HOURS_OPTIONS = ['Less than 5 hrs/week', '5-10 hrs/week', '10-20 hrs/week', '20+ hrs/week'];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal';

const Onboarding: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, assessment, saveProfile } = useProfile();
  const navigate = useNavigate();

  const alreadyDone = Boolean(profile?.onboardingComplete);
  const [redoing, setRedoing] = useState(false);

  const [step, setStep] = useState<number>(() => {
    if (user?.id) {
      return loadUserStep(user.id, STEPS.length);
    }
    return 0;
  });
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stageViewMode, setStageViewMode] = useState<'year' | 'semester'>('year');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSkillCategory, setExpandedSkillCategory] = useState<string | null>(null);
  const [customSkillInput, setCustomSkillInput] = useState<{ [catId: string]: string }>({});
  const [trayCustomSkill, setTrayCustomSkill] = useState('');
  const [notSureSkills, setNotSureSkills] = useState(false);

  const [data, setData] = useState<OnboardingData>(() => {
    if (user?.id) {
      const userDraft = loadUserDraft<OnboardingData>(user.id);
      if (userDraft) return userDraft;
    }
    if (!profile) return emptyData;
    const initialEd = (profile.knowMe as any)?.education_details || defaultEducationDetails;
    const initialInd = (profile.knowMe as any)?.interest_details || {
      ...defaultInterestDetails,
      interest_categories: (profile.interests || [])
        .map((intName) => INTEREST_CATEGORIES.find((c) => c.label === intName)?.id)
        .filter(Boolean) as string[],
      additional_interests: profile.strengthsNote || '',
    };
    const initialSe = (profile.knowMe as any)?.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
    const initialCdp = (profile.knowMe as any)?.career_discovery_preferences || DEFAULT_CAREER_DISCOVERY_PREFERENCES;
    const initialGrowthSubtype = profile.career_growth_subtype ?? (profile.knowMe as any)?.career_growth_subtype ?? null;
    const initialPersona = profile.user_persona ?? (profile.knowMe as any)?.user_persona ?? null;
    return {
      path: profile.path ?? (profile.career_mode ? CAREER_MODE_TO_PATH[profile.career_mode] : null),
      career_mode: profile.career_mode ?? (profile.path ? PATH_TO_CAREER_MODE[profile.path] : null),
      career_growth_subtype: initialGrowthSubtype,
      user_persona: initialPersona,
      educationStage: profile.educationStage ?? 'degree_ug',
      education_details: initialEd,
      interest_details: initialInd,
      skills_and_experience: initialSe,
      career_discovery_preferences: initialCdp,
      streamOrBranch: profile.streamOrBranch ?? initialEd.specialization ?? '',
      college: profile.college ?? initialEd.institution ?? '',
      course: profile.course ?? '',
      year: profile.year ?? initialEd.study_stage_value ?? '1st Year',
      interests: profile.interests ?? [],
      strengthsNote: profile.strengthsNote ?? initialInd.additional_interests ?? '',
      targetRole: profile.targetRole ?? '',
      hoursPerWeek: profile.hoursPerWeek ?? '',
    };
  });

  // Restore draft or profile when user authenticates or switches accounts
  React.useEffect(() => {
    if (!user?.id) return;
    const userDraft = loadUserDraft<OnboardingData>(user.id);
    const userStep = loadUserStep(user.id, STEPS.length);

    if (userDraft) {
      setData(userDraft);
      setStep(userStep);
    } else if (profile && !redoing) {
      setData((prev) => {
        const activeCareerMode = prev.career_mode ?? profile.career_mode ?? (profile.path ? PATH_TO_CAREER_MODE[profile.path] : null);
        const activePath = prev.path ?? profile.path ?? (activeCareerMode ? CAREER_MODE_TO_PATH[activeCareerMode] : null);
        const activeGrowthSubtype = prev.career_growth_subtype ?? profile.career_growth_subtype ?? (profile.knowMe as any)?.career_growth_subtype ?? null;
        const activePersona = prev.user_persona ?? profile.user_persona ?? (profile.knowMe as any)?.user_persona ?? null;
        const resolvedEd =
          prev.education_details ||
          (profile.knowMe as any)?.education_details ||
          defaultEducationDetails;
        const resolvedInd =
          prev.interest_details ||
          (profile.knowMe as any)?.interest_details ||
          defaultInterestDetails;
        const resolvedSe =
          prev.skills_and_experience ||
          (profile.knowMe as any)?.skills_and_experience ||
          DEFAULT_SKILLS_AND_EXPERIENCE;
        const resolvedCdp =
          prev.career_discovery_preferences ||
          (profile.knowMe as any)?.career_discovery_preferences ||
          DEFAULT_CAREER_DISCOVERY_PREFERENCES;
        return {
          path: activePath,
          career_mode: activeCareerMode,
          career_growth_subtype: activeGrowthSubtype,
          user_persona: activePersona,
          educationStage: prev.educationStage !== 'degree_ug' ? prev.educationStage : (profile.educationStage ?? 'degree_ug'),
          education_details: resolvedEd,
          interest_details: resolvedInd,
          skills_and_experience: resolvedSe,
          career_discovery_preferences: resolvedCdp,
          streamOrBranch: prev.streamOrBranch || (profile.streamOrBranch ?? resolvedEd.specialization ?? ''),
          college: prev.college || (profile.college ?? resolvedEd.institution ?? ''),
          course: prev.course || (profile.course ?? ''),
          year: prev.year !== '1st Year' && prev.year !== '1st year' ? prev.year : (profile.year ?? resolvedEd.study_stage_value ?? '1st Year'),
          interests: prev.interests.length > 0 ? prev.interests : (profile.interests ?? []),
          strengthsNote: prev.strengthsNote || (profile.strengthsNote ?? resolvedInd.additional_interests ?? ''),
          targetRole: prev.targetRole || (profile.targetRole ?? ''),
          hoursPerWeek: prev.hoursPerWeek || (profile.hoursPerWeek ?? ''),
        };
      });
    }
  }, [user?.id, profile, redoing]);

  // Debounced auto-save of draft answers (300ms)
  React.useEffect(() => {
    if (!user?.id || finished) return;
    const timer = setTimeout(() => {
      saveUserDraft(user.id, data);
    }, 300);
    return () => clearTimeout(timer);
  }, [data, user?.id, finished]);

  // Immediate auto-save of active step index
  React.useEffect(() => {
    if (!user?.id || finished) return;
    saveUserStep(user.id, step);
  }, [step, user?.id, finished]);

  const updateEducation = (patch: Partial<EducationDetails>) => {
    setData((prev) => {
      const currentEd = prev.education_details || defaultEducationDetails;
      const updatedEd: EducationDetails = { ...currentEd, ...patch };

      // Reconcile legacy fields
      const legacyStage = mapLevelToLegacyStage(updatedEd.education_level);

      let courseTitle = '';
      let specLabel = '';

      if (updatedEd.education_level === 'sslc_10th') {
        const board = updatedEd.school_board === 'other'
          ? (updatedEd.school_board_other || 'Other Board')
          : (updatedEd.school_board ? SCHOOL_BOARDS.find((b) => b.id === updatedEd.school_board)?.shortName || updatedEd.school_board.toUpperCase() : '10th Board');
        courseTitle = `10th Standard (${board})`;
        specLabel = (updatedEd.favorite_school_subjects || []).slice(0, 3).join(', ') || 'General';
      } else if (updatedEd.education_level === 'puc_12th') {
        const stream = updatedEd.school_stream === 'other'
          ? (updatedEd.specialization_other || 'Other Stream')
          : (HIGH_SCHOOL_STREAMS.find((s) => s.id === updatedEd.school_stream)?.label || updatedEd.school_stream || updatedEd.specialization || 'Higher Secondary');
        courseTitle = `12th / PUC - ${stream}`;
        specLabel = stream;
      } else if (updatedEd.education_level === 'diploma') {
        const spec = updatedEd.specialization === 'Other'
          ? (updatedEd.specialization_other || 'Other')
          : (updatedEd.specialization || 'Polytechnic');
        courseTitle = `Diploma in ${spec}`;
        specLabel = spec;
      } else {
        const degreeConfig = (DEGREE_CATALOG[updatedEd.education_level] || []).find(
          (d) => d.id === updatedEd.degree
        );
        const degreeLabel =
          updatedEd.degree === 'other'
            ? updatedEd.degree_other || 'Other Degree'
            : degreeConfig?.name || updatedEd.degree;

        specLabel =
          updatedEd.specialization === 'other' || updatedEd.specialization === 'Other'
            ? updatedEd.specialization_other || 'Other'
            : updatedEd.specialization &&
              updatedEd.specialization !== 'Not applicable' &&
              updatedEd.specialization !== 'General'
            ? updatedEd.specialization
            : '';

        courseTitle = [degreeLabel, specLabel].filter(Boolean).join(' - ');
      }

      let yearStr = updatedEd.study_stage_value;
      if (updatedEd.education_status === 'completed' && updatedEd.graduation_year) {
        yearStr = `Graduated ${updatedEd.graduation_year}`;
      } else if (updatedEd.education_status === 'discontinued') {
        yearStr = updatedEd.last_attended_stage ? `Discontinued (${updatedEd.last_attended_stage})` : 'Discontinued';
      } else if (updatedEd.education_status === 'gap_year') {
        yearStr = updatedEd.highest_qualification ? `Gap Year after ${updatedEd.highest_qualification}` : 'On Gap Year';
      }

      const nextPersona = detectUserPersona({
        ...prev,
        education_details: updatedEd,
      });

      return {
        ...prev,
        education_details: updatedEd,
        user_persona: nextPersona,
        educationStage: legacyStage,
        course: courseTitle,
        streamOrBranch: specLabel || updatedEd.specialization || prev.streamOrBranch,
        college: updatedEd.institution !== undefined ? updatedEd.institution : prev.college,
        year: yearStr || prev.year,
      };
    });
  };

  const isStep0Valid = React.useMemo(() => {
    if (!data.career_mode && !data.path) return false;
    const mode = data.career_mode || (data.path ? PATH_TO_CAREER_MODE[data.path] : null);
    if (mode === 'career_growth_transition') {
      return Boolean(data.career_growth_subtype);
    }
    return true;
  }, [data.career_mode, data.path, data.career_growth_subtype]);

  const handleSelectCareerMode = (mode: CareerMode) => {
    const newPath = CAREER_MODE_TO_PATH[mode];
    const newSubtype = mode === 'career_growth_transition' ? data.career_growth_subtype ?? null : null;
    const newPersona = detectUserPersona({
      ...data,
      career_mode: mode,
      career_growth_subtype: newSubtype,
    });
    setData((prev) => ({
      ...prev,
      career_mode: mode,
      path: newPath,
      career_growth_subtype: newSubtype,
      user_persona: newPersona,
    }));
  };

  const handleSelectGrowthSubtype = (subtype: CareerGrowthSubtype) => {
    const newPersona = detectUserPersona({
      ...data,
      career_mode: 'career_growth_transition',
      career_growth_subtype: subtype,
    });
    setData((prev) => ({
      ...prev,
      career_growth_subtype: subtype,
      user_persona: newPersona,
    }));
  };

  const renderGrowthSubtypeIcon = (subtype: CareerGrowthSubtype) => {
    switch (subtype) {
      case 'career_switching':
        return <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'career_advancement':
        return <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'career_break_return':
        return <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'science_fairs':
        return {
          titleLabel: 'Science Fair / Exhibition Project',
          titlePlaceholder: 'e.g. Solar-powered Water Purification Model, Tesla Coil Demo',
          orgLabel: 'Exhibition / Competition Level',
          orgPlaceholder: 'e.g. Inter-School Science Fair, District Science Exhibition',
          roleLabel: 'Your Role / Team',
          rolePlaceholder: 'e.g. Project Lead, Model Presenter',
          durationLabel: 'Grade / Month',
          durationPlaceholder: 'e.g. 10th Standard / November 2024',
          techLabel: 'Science Concepts & Materials',
          techPlaceholder: 'e.g. Solar Cells, Arduino, Chemical Titration',
          descLabel: 'Demonstration & Learnings',
          descPlaceholder: 'What was demonstrated or awarded in this fair?',
        };
      case 'coding_robotics':
        return {
          titleLabel: 'Coding / Robotics Project',
          titlePlaceholder: 'e.g. Line Follower Robot, Python Quiz Game, School Web Page',
          orgLabel: 'Club / Platform',
          orgPlaceholder: 'e.g. School Coding Club, Replit, Tinkercad',
          roleLabel: 'Role',
          rolePlaceholder: 'e.g. Solo Builder, Programmer',
          durationLabel: 'Timeline',
          durationPlaceholder: 'e.g. 1 month, Holiday project',
          techLabel: 'Tools & Languages Used',
          techPlaceholder: 'e.g. Scratch, Python, Arduino, HTML/CSS',
          descLabel: 'What does this project do?',
          descPlaceholder: 'Describe what you built and learned.',
        };
      case 'competitions':
        return {
          titleLabel: 'Competition / Olympiad Name',
          titlePlaceholder: 'e.g. National Science Olympiad, Inter-school Debate, Hackathon',
          orgLabel: 'Organizing Body',
          orgPlaceholder: 'e.g. Science Olympiad Foundation, Rotary Club',
          roleLabel: 'Participation Role',
          rolePlaceholder: 'e.g. Solo Participant, Captain',
          durationLabel: 'Year / Standard',
          durationPlaceholder: 'e.g. 2024, 11th Standard',
          techLabel: 'Skills / Topics Tested',
          techPlaceholder: 'e.g. Logical Reasoning, Math, Public Speaking',
          descLabel: 'Achievement / Rank',
          descPlaceholder: 'e.g. Gold Medalist, Finalist, School Rank 1',
        };
      case 'extracurricular':
        return {
          titleLabel: 'Activity / Club Initiative',
          titlePlaceholder: 'e.g. School Magazine Editor, Drama Club, Sports Captain',
          orgLabel: 'School / Club',
          orgPlaceholder: 'e.g. Cultural Committee, Scouts & Guides, Literary Club',
          roleLabel: 'Role / Designation',
          rolePlaceholder: 'e.g. Student Coordinator, Captain, Member',
          durationLabel: 'Duration',
          durationPlaceholder: 'e.g. 1 academic year',
          techLabel: 'Key Skills Exercised',
          techPlaceholder: 'e.g. Writing, Public Speaking, Team Coordination',
          descLabel: 'Key Contributions',
          descPlaceholder: 'Describe your role and impact on the team or event.',
        };
      case 'hobbies_self_learning':
        return {
          titleLabel: 'Hobby / Self-Learning Pursuit',
          titlePlaceholder: 'e.g. 3D Modeling in Blender, Mobile Photography, Guitar',
          orgLabel: 'Platform / Source',
          orgPlaceholder: 'e.g. YouTube, Coursera, FreeCodeCamp, Self-taught',
          roleLabel: 'Focus',
          rolePlaceholder: 'e.g. Independent Learner, Hobbyist',
          durationLabel: 'Time Invested',
          durationPlaceholder: 'e.g. 6 months, Weekend hobby',
          techLabel: 'Tools & Techniques Used',
          techPlaceholder: 'e.g. Blender, DaVinci Resolve, Lightroom, Logic Pro',
          descLabel: 'Creations & Learnings',
          descPlaceholder: 'Describe what you created, practiced, or produced.',
        };
      case 'certification':
        return {
          titleLabel: 'Course / Certification Title',
          titlePlaceholder: 'e.g. AWS Certified Cloud Practitioner, CS50 Python',
          orgLabel: 'Issuing Organization',
          orgPlaceholder: 'e.g. AWS, HarvardX, Coursera, Google',
          roleLabel: 'Credential ID / URL',
          rolePlaceholder: 'e.g. Verification URL or Certificate ID',
          durationLabel: 'Completion Date',
          durationPlaceholder: 'e.g. March 2024',
          techLabel: 'Core Competencies',
          techPlaceholder: 'e.g. Cloud Architecture, Python, SQL, Statistics',
          descLabel: 'Key Learnings & Takeaways',
          descPlaceholder: 'Summarize the skills verified by this certificate.',
        };
      default:
        return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const isStep1Valid = React.useMemo(() => {
    const ed = data.education_details;
    if (!ed) return Boolean(data.course && data.year);
    if (!ed.education_level || !ed.education_status) return false;

    // Discontinued / Dropout
    if (ed.education_status === 'discontinued') {
      if (!ed.highest_qualification) return false;
      if (!ed.last_attended_stage?.trim()) return false;
      if (!ed.plan_to_resume) return false;
      return true;
    }

    // Gap Year
    if (ed.education_status === 'gap_year') {
      if (!ed.highest_qualification) return false;
      if (!ed.plan_to_resume) return false;
      return true;
    }

    // Class 10 (SSLC)
    if (ed.education_level === 'sslc_10th') {
      if (!ed.school_board) return false;
      if (ed.school_board === 'other' && !ed.school_board_other?.trim()) return false;
      if (!ed.favorite_school_subjects || ed.favorite_school_subjects.length === 0) return false;
      if (ed.education_status === 'currently_studying' && !ed.study_stage_value) return false;
      if (ed.education_status === 'completed' && !ed.graduation_year) return false;
      return true;
    }

    // Class 12 / PUC
    if (ed.education_level === 'puc_12th') {
      if (!ed.school_board) return false;
      if (ed.school_board === 'other' && !ed.school_board_other?.trim()) return false;
      const stream = ed.school_stream || ed.specialization;
      if (!stream) return false;
      if (stream === 'other' && !ed.specialization_other?.trim()) return false;
      if (ed.education_status === 'currently_studying' && !ed.study_stage_value) return false;
      if (ed.education_status === 'completed' && !ed.graduation_year) return false;
      return true;
    }

    // Diploma / Polytechnic
    if (ed.education_level === 'diploma') {
      if (!ed.specialization) return false;
      if (ed.specialization === 'Other' && !ed.specialization_other?.trim()) return false;
      if (ed.education_status === 'currently_studying' && !ed.study_stage_value) return false;
      if (ed.education_status === 'completed' && !ed.graduation_year) return false;
      return true;
    }

    // Degrees: Undergraduate, Postgraduate, Doctoral, Other
    if (!ed.degree) return false;
    if (ed.degree === 'other' && !ed.degree_other?.trim()) return false;
    if (!ed.specialization) return false;
    if ((ed.specialization === 'other' || ed.specialization === 'Other') && !ed.specialization_other?.trim()) return false;

    if (ed.education_status === 'currently_studying') {
      return Boolean(ed.study_stage_value);
    }
    if (ed.education_status === 'completed') {
      return Boolean(ed.graduation_year);
    }

    return true;
  }, [data.education_details, data.course, data.year]);

  const isStep2Valid = React.useMemo(() => {
    const ind = data.interest_details;
    if (!ind) return data.interests.length > 0;
    if (ind.interest_exploration_status === 'exploring') return true;
    return ind.interest_categories.length > 0;
  }, [data.interest_details, data.interests]);

  const toggleCategory = (catId: string) => {
    setData((prev) => {
      const currentInd = prev.interest_details || defaultInterestDetails;
      const isSelected = currentInd.interest_categories.includes(catId);
      const catConfig = INTEREST_CATEGORIES.find((c) => c.id === catId);
      const subListToRemove = new Set(catConfig?.subInterests || []);

      let updatedCats: string[];
      let updatedSpecific: string[];

      if (isSelected) {
        updatedCats = currentInd.interest_categories.filter((c) => c !== catId);
        updatedSpecific = currentInd.specific_interests.filter((s) => !subListToRemove.has(s));
        if (expandedCategory === catId) {
          setExpandedCategory(null);
        }
      } else {
        updatedCats = [...currentInd.interest_categories, catId];
        updatedSpecific = currentInd.specific_interests;
        setExpandedCategory(catId);
      }

      const newInd: InterestDetails = {
        ...currentInd,
        interest_categories: updatedCats,
        specific_interests: updatedSpecific,
        interest_exploration_status: 'focused',
      };

      return {
        ...prev,
        interest_details: newInd,
        interests: buildCombinedInterests(newInd),
      };
    });
  };

  const toggleSubInterest = (sub: string) => {
    setData((prev) => {
      const currentInd = prev.interest_details || defaultInterestDetails;
      const hasSub = currentInd.specific_interests.includes(sub);
      const updatedSpecific = hasSub
        ? currentInd.specific_interests.filter((s) => s !== sub)
        : [...currentInd.specific_interests, sub];

      const newInd: InterestDetails = {
        ...currentInd,
        specific_interests: updatedSpecific,
        interest_exploration_status: 'focused',
      };

      return {
        ...prev,
        interest_details: newInd,
        interests: buildCombinedInterests(newInd),
      };
    });
  };

  const toggleExploring = () => {
    setData((prev) => {
      const currentInd = prev.interest_details || defaultInterestDetails;
      const isCurrentlyExploring = currentInd.interest_exploration_status === 'exploring';

      const newInd: InterestDetails = isCurrentlyExploring
        ? {
            ...currentInd,
            interest_exploration_status: 'focused',
          }
        : {
            ...currentInd,
            interest_categories: [],
            specific_interests: [],
            interest_exploration_status: 'exploring',
          };

      if (!isCurrentlyExploring) {
        setExpandedCategory(null);
      }

      return {
        ...prev,
        interest_details: newInd,
        interests: buildCombinedInterests(newInd),
      };
    });
  };

  const updateAdditionalInterests = (text: string) => {
    setData((prev) => {
      const currentInd = prev.interest_details || defaultInterestDetails;
      const newInd: InterestDetails = {
        ...currentInd,
        additional_interests: text,
      };
      return {
        ...prev,
        interest_details: newInd,
        strengthsNote: text,
      };
    });
  };

  const getExperienceTypeConfig = (type: ExperienceType) => {
    switch (type) {
      case 'academic_projects':
        return {
          titleLabel: 'Project Name / Capstone Title',
          titlePlaceholder: 'e.g. Automated Smart Irrigation System, Final Year Capstone',
          orgLabel: 'College / University',
          orgPlaceholder: 'e.g. National Institute of Technology',
          roleLabel: 'Your Role / Contribution',
          rolePlaceholder: 'e.g. Lead Developer, Hardware Lead, Research Contributor',
          durationLabel: 'Semester / Academic Term',
          durationPlaceholder: 'e.g. 7th Semester (3 months)',
          techLabel: 'Tools, Libraries & Technologies Used',
          techPlaceholder: 'e.g. Python, Arduino, C++, MATLAB (comma-separated)',
          descLabel: 'Project Summary & Key Outcomes',
          descPlaceholder: 'What problem did this solve? What was your contribution?',
        };
      case 'personal_projects':
        return {
          titleLabel: 'Project Name',
          titlePlaceholder: 'e.g. Personal Portfolio Website, Fitness Tracking App',
          orgLabel: 'Platform / Hosting',
          orgPlaceholder: 'e.g. GitHub, Vercel, Self-hosted',
          roleLabel: 'Role',
          rolePlaceholder: 'e.g. Solo Creator, Full-Stack Developer',
          durationLabel: 'Build Duration',
          durationPlaceholder: 'e.g. 2 months, Weekend project',
          techLabel: 'Technologies & Tools Used',
          techPlaceholder: 'e.g. React, Tailwind CSS, Supabase, Next.js',
          descLabel: 'Project Description & Features',
          descPlaceholder: 'What does this project do and what technologies did you learn?',
        };
      case 'internship':
        return {
          titleLabel: 'Internship Title / Designation',
          titlePlaceholder: 'e.g. Software Engineer Intern, Medical Trainee, Marketing Intern',
          orgLabel: 'Company / Organization / Hospital',
          orgPlaceholder: 'e.g. TechCorp, Apollo Hospital, ABC Foundation',
          roleLabel: 'Department / Team',
          rolePlaceholder: 'e.g. Frontend Team, Internal Medicine, Growth Team',
          durationLabel: 'Internship Duration',
          durationPlaceholder: 'e.g. 3 months, Summer 2024',
          techLabel: 'Key Tools, Skills & Technologies',
          techPlaceholder: 'e.g. React, Git, Clinical Auditing, Google Analytics',
          descLabel: 'Key Learnings & Deliverables',
          descPlaceholder: 'Summarize your main responsibilities, tasks, and learnings.',
        };
      case 'full_time':
      case 'part_time':
        return {
          titleLabel: 'Job Title',
          titlePlaceholder: 'e.g. Junior Accountant, Staff Nurse, Software Developer',
          orgLabel: 'Company / Employer',
          orgPlaceholder: 'e.g. Deloitte, Fortis Hospital, XYZ Technologies',
          roleLabel: 'Department / Functional Area',
          rolePlaceholder: 'e.g. Tax & Compliance, ICU, Backend Engineering',
          durationLabel: 'Employment Tenure',
          durationPlaceholder: 'e.g. 1 year 4 months, June 2023 - Present',
          techLabel: 'Core Skills, Tools & Stack',
          techPlaceholder: 'e.g. Tally, QuickBooks, Excel, Python, Docker',
          descLabel: 'Key Responsibilities & Major Achievements',
          descPlaceholder: 'Describe your responsibilities, team impact, and key accomplishments.',
        };
      case 'freelancing':
        return {
          titleLabel: 'Service / Client Project Title',
          titlePlaceholder: 'e.g. E-Commerce Web Storefront, Brand Identity Package',
          orgLabel: 'Client / Platform',
          orgPlaceholder: 'e.g. Upwork, Direct Client, Local Business',
          roleLabel: 'Role / Scope',
          rolePlaceholder: 'e.g. Freelance Web Developer, Brand Designer',
          durationLabel: 'Engagement Duration',
          durationPlaceholder: 'e.g. 6 weeks, Ongoing retainer',
          techLabel: 'Deliverables & Tools',
          techPlaceholder: 'e.g. Figma, WordPress, Shopify, Stripe',
          descLabel: 'Client Impact & Scope',
          descPlaceholder: 'What was delivered and what outcome was achieved for the client?',
        };
      case 'science_fairs':
        return {
          titleLabel: 'Science Fair / Exhibition Project',
          titlePlaceholder: 'e.g. Solar-powered Water Purification Model, Tesla Coil Demo',
          orgLabel: 'Exhibition / Competition Level',
          orgPlaceholder: 'e.g. Inter-School Science Fair, District Science Exhibition',
          roleLabel: 'Your Role / Team',
          rolePlaceholder: 'e.g. Project Lead, Model Presenter',
          durationLabel: 'Grade / Month',
          durationPlaceholder: 'e.g. 10th Standard / November 2024',
          techLabel: 'Science Concepts & Materials',
          techPlaceholder: 'e.g. Solar Cells, Arduino, Chemical Titration',
          descLabel: 'Demonstration & Learnings',
          descPlaceholder: 'What was demonstrated or awarded in this fair?',
        };
      case 'coding_robotics':
        return {
          titleLabel: 'Coding / Robotics Project',
          titlePlaceholder: 'e.g. Line Follower Robot, Python Quiz Game, School Web Page',
          orgLabel: 'Club / Platform',
          orgPlaceholder: 'e.g. School Coding Club, Replit, Tinkercad',
          roleLabel: 'Role',
          rolePlaceholder: 'e.g. Solo Builder, Programmer',
          durationLabel: 'Timeline',
          durationPlaceholder: 'e.g. 1 month, Holiday project',
          techLabel: 'Tools & Languages Used',
          techPlaceholder: 'e.g. Scratch, Python, Arduino, HTML/CSS',
          descLabel: 'What does this project do?',
          descPlaceholder: 'Describe what you built and learned.',
        };
      case 'competitions':
        return {
          titleLabel: 'Competition / Olympiad Name',
          titlePlaceholder: 'e.g. National Science Olympiad, Inter-school Debate, Hackathon',
          orgLabel: 'Organizing Body',
          orgPlaceholder: 'e.g. Science Olympiad Foundation, Rotary Club',
          roleLabel: 'Participation Role',
          rolePlaceholder: 'e.g. Solo Participant, Captain',
          durationLabel: 'Year / Standard',
          durationPlaceholder: 'e.g. 2024, 11th Standard',
          techLabel: 'Skills / Topics Tested',
          techPlaceholder: 'e.g. Logical Reasoning, Math, Public Speaking',
          descLabel: 'Achievement / Rank',
          descPlaceholder: 'e.g. Gold Medalist, Finalist, School Rank 1',
        };
      case 'extracurricular':
        return {
          titleLabel: 'Activity / Club Initiative',
          titlePlaceholder: 'e.g. School Magazine Editor, Drama Club, Sports Captain',
          orgLabel: 'School / Club',
          orgPlaceholder: 'e.g. Cultural Committee, Scouts & Guides, Literary Club',
          roleLabel: 'Role / Designation',
          rolePlaceholder: 'e.g. Student Coordinator, Captain, Member',
          durationLabel: 'Duration',
          durationPlaceholder: 'e.g. 1 academic year',
          techLabel: 'Key Skills Exercised',
          techPlaceholder: 'e.g. Writing, Public Speaking, Team Coordination',
          descLabel: 'Key Contributions',
          descPlaceholder: 'Describe your role and impact on the team or event.',
        };
      case 'hobbies_self_learning':
        return {
          titleLabel: 'Hobby / Self-Learning Pursuit',
          titlePlaceholder: 'e.g. 3D Modeling in Blender, Mobile Photography, Guitar',
          orgLabel: 'Platform / Source',
          orgPlaceholder: 'e.g. YouTube, Coursera, FreeCodeCamp, Self-taught',
          roleLabel: 'Focus',
          rolePlaceholder: 'e.g. Independent Learner, Hobbyist',
          durationLabel: 'Time Invested',
          durationPlaceholder: 'e.g. 6 months, Weekend hobby',
          techLabel: 'Tools & Techniques Used',
          techPlaceholder: 'e.g. Blender, DaVinci Resolve, Lightroom, Logic Pro',
          descLabel: 'Creations & Learnings',
          descPlaceholder: 'Describe what you created, practiced, or produced.',
        };
      case 'certification':
        return {
          titleLabel: 'Course / Certification Title',
          titlePlaceholder: 'e.g. AWS Certified Cloud Practitioner, CS50 Python',
          orgLabel: 'Issuing Organization',
          orgPlaceholder: 'e.g. AWS, HarvardX, Coursera, Google',
          roleLabel: 'Credential ID / URL',
          rolePlaceholder: 'e.g. Verification URL or Certificate ID',
          durationLabel: 'Completion Date',
          durationPlaceholder: 'e.g. March 2024',
          techLabel: 'Core Competencies',
          techPlaceholder: 'e.g. Cloud Architecture, Python, SQL, Statistics',
          descLabel: 'Key Learnings & Takeaways',
          descPlaceholder: 'Summarize the skills verified by this certificate.',
        };
      default:
        return {
          titleLabel: 'Initiative / Role Title',
          titlePlaceholder: 'e.g. Community Health Volunteer, Youth Club Lead',
          orgLabel: 'Organization / Community',
          orgPlaceholder: 'e.g. Red Cross, Rotaract, Student Union',
          roleLabel: 'Role / Responsibility',
          rolePlaceholder: 'e.g. Volunteer Coordinator, Event Lead',
          durationLabel: 'Duration',
          durationPlaceholder: 'e.g. 6 months, Weekends',
          techLabel: 'Skills & Methods Used',
          techPlaceholder: 'e.g. Event Planning, Public Speaking, First Aid',
          descLabel: 'Impact & Key Contributions',
          descPlaceholder: 'Describe your role and community or team impact.',
        };
    }
  };

  const isStep3Valid = React.useMemo(() => {
    const se = data.skills_and_experience;
    if (!se) return false;
    if (!se.experience_types || se.experience_types.length === 0) return false;
    if (!se.professional_duration) return false;
    for (const exp of se.experiences) {
      if (!exp.title?.trim()) return false;
    }
    return true;
  }, [data.skills_and_experience]);

  const isStep4Valid = React.useMemo(() => {
    const isDiscovery = data.career_mode === 'career_discovery' || data.path === 'not_sure';
    if (isDiscovery) {
      const cdp = data.career_discovery_preferences;
      if (!cdp) return false;
      if (!cdp.career_motivations || cdp.career_motivations.length === 0) return false;
      if (!cdp.preferred_work_environment) return false;
      if (!cdp.daily_learning_commitment) return false;
      if (!cdp.career_timeline) return false;
      return true;
    }
    return true;
  }, [data.career_mode, data.path, data.career_discovery_preferences]);

  const renderPreferenceIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Coins':
        return <Coins className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5" />;
      case 'Rocket':
        return <Rocket className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'DollarSign':
        return <DollarSign className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      case 'Smile':
        return <Smile className="w-4 h-4" />;
      case 'Heart':
        return <Heart className="w-4 h-4" />;
      case 'Lightbulb':
        return <Lightbulb className="w-4 h-4" />;
      case 'Users':
        return <Users className="w-4 h-4" />;
      case 'Home':
        return <Home className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5" />;
      case 'Globe':
        return <Globe className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'science_fairs':
        return {
          titleLabel: 'Science Fair / Exhibition Project',
          titlePlaceholder: 'e.g. Solar-powered Water Purification Model, Tesla Coil Demo',
          orgLabel: 'Exhibition / Competition Level',
          orgPlaceholder: 'e.g. Inter-School Science Fair, District Science Exhibition',
          roleLabel: 'Your Role / Team',
          rolePlaceholder: 'e.g. Project Lead, Model Presenter',
          durationLabel: 'Grade / Month',
          durationPlaceholder: 'e.g. 10th Standard / November 2024',
          techLabel: 'Science Concepts & Materials',
          techPlaceholder: 'e.g. Solar Cells, Arduino, Chemical Titration',
          descLabel: 'Demonstration & Learnings',
          descPlaceholder: 'What was demonstrated or awarded in this fair?',
        };
      case 'coding_robotics':
        return {
          titleLabel: 'Coding / Robotics Project',
          titlePlaceholder: 'e.g. Line Follower Robot, Python Quiz Game, School Web Page',
          orgLabel: 'Club / Platform',
          orgPlaceholder: 'e.g. School Coding Club, Replit, Tinkercad',
          roleLabel: 'Role',
          rolePlaceholder: 'e.g. Solo Builder, Programmer',
          durationLabel: 'Timeline',
          durationPlaceholder: 'e.g. 1 month, Holiday project',
          techLabel: 'Tools & Languages Used',
          techPlaceholder: 'e.g. Scratch, Python, Arduino, HTML/CSS',
          descLabel: 'What does this project do?',
          descPlaceholder: 'Describe what you built and learned.',
        };
      case 'competitions':
        return {
          titleLabel: 'Competition / Olympiad Name',
          titlePlaceholder: 'e.g. National Science Olympiad, Inter-school Debate, Hackathon',
          orgLabel: 'Organizing Body',
          orgPlaceholder: 'e.g. Science Olympiad Foundation, Rotary Club',
          roleLabel: 'Participation Role',
          rolePlaceholder: 'e.g. Solo Participant, Captain',
          durationLabel: 'Year / Standard',
          durationPlaceholder: 'e.g. 2024, 11th Standard',
          techLabel: 'Skills / Topics Tested',
          techPlaceholder: 'e.g. Logical Reasoning, Math, Public Speaking',
          descLabel: 'Achievement / Rank',
          descPlaceholder: 'e.g. Gold Medalist, Finalist, School Rank 1',
        };
      case 'extracurricular':
        return {
          titleLabel: 'Activity / Club Initiative',
          titlePlaceholder: 'e.g. School Magazine Editor, Drama Club, Sports Captain',
          orgLabel: 'School / Club',
          orgPlaceholder: 'e.g. Cultural Committee, Scouts & Guides, Literary Club',
          roleLabel: 'Role / Designation',
          rolePlaceholder: 'e.g. Student Coordinator, Captain, Member',
          durationLabel: 'Duration',
          durationPlaceholder: 'e.g. 1 academic year',
          techLabel: 'Key Skills Exercised',
          techPlaceholder: 'e.g. Writing, Public Speaking, Team Coordination',
          descLabel: 'Key Contributions',
          descPlaceholder: 'Describe your role and impact on the team or event.',
        };
      case 'hobbies_self_learning':
        return {
          titleLabel: 'Hobby / Self-Learning Pursuit',
          titlePlaceholder: 'e.g. 3D Modeling in Blender, Mobile Photography, Guitar',
          orgLabel: 'Platform / Source',
          orgPlaceholder: 'e.g. YouTube, Coursera, FreeCodeCamp, Self-taught',
          roleLabel: 'Focus',
          rolePlaceholder: 'e.g. Independent Learner, Hobbyist',
          durationLabel: 'Time Invested',
          durationPlaceholder: 'e.g. 6 months, Weekend hobby',
          techLabel: 'Tools & Techniques Used',
          techPlaceholder: 'e.g. Blender, DaVinci Resolve, Lightroom, Logic Pro',
          descLabel: 'Creations & Learnings',
          descPlaceholder: 'Describe what you created, practiced, or produced.',
        };
      case 'certification':
        return {
          titleLabel: 'Course / Certification Title',
          titlePlaceholder: 'e.g. AWS Certified Cloud Practitioner, CS50 Python',
          orgLabel: 'Issuing Organization',
          orgPlaceholder: 'e.g. AWS, HarvardX, Coursera, Google',
          roleLabel: 'Credential ID / URL',
          rolePlaceholder: 'e.g. Verification URL or Certificate ID',
          durationLabel: 'Completion Date',
          durationPlaceholder: 'e.g. March 2024',
          techLabel: 'Core Competencies',
          techPlaceholder: 'e.g. Cloud Architecture, Python, SQL, Statistics',
          descLabel: 'Key Learnings & Takeaways',
          descPlaceholder: 'Summarize the skills verified by this certificate.',
        };
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const toggleCareerMotivation = (id: CareerMotivationId) => {
    setData((prev) => {
      const currentCdp = prev.career_discovery_preferences || DEFAULT_CAREER_DISCOVERY_PREFERENCES;
      const exists = currentCdp.career_motivations.includes(id);
      const updated = exists
        ? currentCdp.career_motivations.filter((m) => m !== id)
        : [...currentCdp.career_motivations, id];
      return {
        ...prev,
        career_discovery_preferences: {
          ...currentCdp,
          career_motivations: updated,
        },
      };
    });
  };

  const toggleCareerPriority = (id: CareerPriorityId) => {
    setData((prev) => {
      const currentCdp = prev.career_discovery_preferences || DEFAULT_CAREER_DISCOVERY_PREFERENCES;
      const exists = currentCdp.career_priorities.includes(id);
      const updated = exists
        ? currentCdp.career_priorities.filter((p) => p !== id)
        : [...currentCdp.career_priorities, id];
      return {
        ...prev,
        career_discovery_preferences: {
          ...currentCdp,
          career_priorities: updated,
        },
      };
    });
  };

  const setWorkEnvironment = (env: WorkEnvironmentId) => {
    setData((prev) => {
      const currentCdp = prev.career_discovery_preferences || DEFAULT_CAREER_DISCOVERY_PREFERENCES;
      return {
        ...prev,
        career_discovery_preferences: {
          ...currentCdp,
          preferred_work_environment: env,
        },
      };
    });
  };

  const setLearningCommitment = (com: LearningCommitmentId) => {
    setData((prev) => {
      const currentCdp = prev.career_discovery_preferences || DEFAULT_CAREER_DISCOVERY_PREFERENCES;
      const hoursLabel = LEARNING_COMMITMENTS.find((l) => l.id === com)?.label || prev.hoursPerWeek;
      return {
        ...prev,
        career_discovery_preferences: {
          ...currentCdp,
          daily_learning_commitment: com,
        },
        hoursPerWeek: hoursLabel,
      };
    });
  };

  const setCareerTimeline = (timeline: CareerTimelineId) => {
    setData((prev) => {
      const currentCdp = prev.career_discovery_preferences || DEFAULT_CAREER_DISCOVERY_PREFERENCES;
      return {
        ...prev,
        career_discovery_preferences: {
          ...currentCdp,
          career_timeline: timeline,
        },
      };
    });
  };

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-5 h-5" />;
      case 'BarChart2':
        return <BarChart2 className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5" />;
      case 'science_fairs':
        return {
          titleLabel: 'Science Fair / Exhibition Project',
          titlePlaceholder: 'e.g. Solar-powered Water Purification Model, Tesla Coil Demo',
          orgLabel: 'Exhibition / Competition Level',
          orgPlaceholder: 'e.g. Inter-School Science Fair, District Science Exhibition',
          roleLabel: 'Your Role / Team',
          rolePlaceholder: 'e.g. Project Lead, Model Presenter',
          durationLabel: 'Grade / Month',
          durationPlaceholder: 'e.g. 10th Standard / November 2024',
          techLabel: 'Science Concepts & Materials',
          techPlaceholder: 'e.g. Solar Cells, Arduino, Chemical Titration',
          descLabel: 'Demonstration & Learnings',
          descPlaceholder: 'What was demonstrated or awarded in this fair?',
        };
      case 'coding_robotics':
        return {
          titleLabel: 'Coding / Robotics Project',
          titlePlaceholder: 'e.g. Line Follower Robot, Python Quiz Game, School Web Page',
          orgLabel: 'Club / Platform',
          orgPlaceholder: 'e.g. School Coding Club, Replit, Tinkercad',
          roleLabel: 'Role',
          rolePlaceholder: 'e.g. Solo Builder, Programmer',
          durationLabel: 'Timeline',
          durationPlaceholder: 'e.g. 1 month, Holiday project',
          techLabel: 'Tools & Languages Used',
          techPlaceholder: 'e.g. Scratch, Python, Arduino, HTML/CSS',
          descLabel: 'What does this project do?',
          descPlaceholder: 'Describe what you built and learned.',
        };
      case 'competitions':
        return {
          titleLabel: 'Competition / Olympiad Name',
          titlePlaceholder: 'e.g. National Science Olympiad, Inter-school Debate, Hackathon',
          orgLabel: 'Organizing Body',
          orgPlaceholder: 'e.g. Science Olympiad Foundation, Rotary Club',
          roleLabel: 'Participation Role',
          rolePlaceholder: 'e.g. Solo Participant, Captain',
          durationLabel: 'Year / Standard',
          durationPlaceholder: 'e.g. 2024, 11th Standard',
          techLabel: 'Skills / Topics Tested',
          techPlaceholder: 'e.g. Logical Reasoning, Math, Public Speaking',
          descLabel: 'Achievement / Rank',
          descPlaceholder: 'e.g. Gold Medalist, Finalist, School Rank 1',
        };
      case 'extracurricular':
        return {
          titleLabel: 'Activity / Club Initiative',
          titlePlaceholder: 'e.g. School Magazine Editor, Drama Club, Sports Captain',
          orgLabel: 'School / Club',
          orgPlaceholder: 'e.g. Cultural Committee, Scouts & Guides, Literary Club',
          roleLabel: 'Role / Designation',
          rolePlaceholder: 'e.g. Student Coordinator, Captain, Member',
          durationLabel: 'Duration',
          durationPlaceholder: 'e.g. 1 academic year',
          techLabel: 'Key Skills Exercised',
          techPlaceholder: 'e.g. Writing, Public Speaking, Team Coordination',
          descLabel: 'Key Contributions',
          descPlaceholder: 'Describe your role and impact on the team or event.',
        };
      case 'hobbies_self_learning':
        return {
          titleLabel: 'Hobby / Self-Learning Pursuit',
          titlePlaceholder: 'e.g. 3D Modeling in Blender, Mobile Photography, Guitar',
          orgLabel: 'Platform / Source',
          orgPlaceholder: 'e.g. YouTube, Coursera, FreeCodeCamp, Self-taught',
          roleLabel: 'Focus',
          rolePlaceholder: 'e.g. Independent Learner, Hobbyist',
          durationLabel: 'Time Invested',
          durationPlaceholder: 'e.g. 6 months, Weekend hobby',
          techLabel: 'Tools & Techniques Used',
          techPlaceholder: 'e.g. Blender, DaVinci Resolve, Lightroom, Logic Pro',
          descLabel: 'Creations & Learnings',
          descPlaceholder: 'Describe what you created, practiced, or produced.',
        };
      case 'certification':
        return {
          titleLabel: 'Course / Certification Title',
          titlePlaceholder: 'e.g. AWS Certified Cloud Practitioner, CS50 Python',
          orgLabel: 'Issuing Organization',
          orgPlaceholder: 'e.g. AWS, HarvardX, Coursera, Google',
          roleLabel: 'Credential ID / URL',
          rolePlaceholder: 'e.g. Verification URL or Certificate ID',
          durationLabel: 'Completion Date',
          durationPlaceholder: 'e.g. March 2024',
          techLabel: 'Core Competencies',
          techPlaceholder: 'e.g. Cloud Architecture, Python, SQL, Statistics',
          descLabel: 'Key Learnings & Takeaways',
          descPlaceholder: 'Summarize the skills verified by this certificate.',
        };
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  const toggleSkill = (category: string, skillName: string) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const exists = currentSe.skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase());
      let updatedSkills: UserSkill[];
      if (exists) {
        updatedSkills = currentSe.skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());
      } else {
        updatedSkills = [
          ...currentSe.skills,
          {
            name: skillName,
            category,
            proficiency: 'intermediate',
            is_custom: false,
          },
        ];
      }
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          skills: updatedSkills,
        },
      };
    });
  };

  const setSkillProficiency = (skillName: string, proficiency: SkillProficiency) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const updatedSkills = currentSe.skills.map((s) =>
        s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, proficiency } : s
      );
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          skills: updatedSkills,
        },
      };
    });
  };

  const handleAddCustomSkill = (categoryId: string) => {
    const val = (customSkillInput[categoryId] || '').trim();
    if (!val) return;
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const exists = currentSe.skills.some((s) => s.name.toLowerCase() === val.toLowerCase());
      if (exists) {
        return prev;
      }
      const newSkill: UserSkill = {
        name: val,
        category: categoryId,
        proficiency: 'intermediate',
        is_custom: true,
      };
      const updatedCustom = Array.from(new Set([...currentSe.custom_skills, val]));
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          skills: [...currentSe.skills, newSkill],
          custom_skills: updatedCustom,
        },
      };
    });
    setCustomSkillInput((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleAddTrayCustomSkill = () => {
    const trimmed = trayCustomSkill.trim();
    if (!trimmed) return;
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const exists = currentSe.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      const newSkill: UserSkill = {
        name: trimmed,
        category: 'ops_practical',
        proficiency: 'intermediate',
        is_custom: true,
      };
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          skills: [...currentSe.skills, newSkill],
          custom_skills: Array.from(new Set([...currentSe.custom_skills, trimmed])),
        },
      };
    });
    setTrayCustomSkill('');
  };

  const handleClearAllSkills = () => {
    setData((prev) => ({
      ...prev,
      skills_and_experience: {
        ...(prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE),
        skills: [],
        custom_skills: [],
      },
    }));
  };

  const handleRemoveSkill = (skillName: string) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const updatedSkills = currentSe.skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());
      const updatedCustom = currentSe.custom_skills.filter((s) => s.toLowerCase() !== skillName.toLowerCase());
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          skills: updatedSkills,
          custom_skills: updatedCustom,
        },
      };
    });
  };

  const handleToggleExperienceType = (typeId: ExperienceType) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      let newTypes: ExperienceType[];
      let newDuration = currentSe.professional_duration;
      let newExperiences = currentSe.experiences;

      if (typeId === 'no_experience') {
        newTypes = ['no_experience'];
        newExperiences = [];
        newDuration = 'no_experience';
      } else {
        const filtered = currentSe.experience_types.filter((t) => t !== 'no_experience');
        const exists = filtered.includes(typeId);
        if (exists) {
          newTypes = filtered.filter((t) => t !== typeId);
          newExperiences = newExperiences.filter((exp) => exp.type !== typeId);
        } else {
          newTypes = [...filtered, typeId];
        }
        const hasEmployment = newTypes.some((t) => ['full_time', 'part_time', 'freelancing'].includes(t));
        if (!hasEmployment && (!newDuration || newDuration === 'no_experience')) {
          newDuration = 'no_experience';
        }
      }

      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          experience_types: newTypes,
          experiences: newExperiences,
          professional_duration: newDuration,
        },
      };
    });
  };

  const handleAddExperienceItem = () => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      // Prevent accidental duplicate empty cards
      const hasEmptyItem = currentSe.experiences.some((exp) => !exp.title?.trim());
      if (hasEmptyItem) {
        return prev;
      }
      const validTypes = currentSe.experience_types.filter((t) => t !== 'no_experience');
      const defaultType = validTypes[0] || 'academic_projects';
      const newItem: ExperienceItem = {
        id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type: defaultType,
        title: '',
        organization: '',
        role: '',
        duration: '',
        technologies: [],
        description: '',
      };
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          experiences: [...currentSe.experiences, newItem],
        },
      };
    });
  };

  const handleUpdateExperienceItem = (id: string, patch: Partial<ExperienceItem>) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const updatedExps = currentSe.experiences.map((exp) =>
        exp.id === id ? { ...exp, ...patch } : exp
      );
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          experiences: updatedExps,
        },
      };
    });
  };

  const handleRemoveExperienceItem = (id: string) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const updatedExps = currentSe.experiences.filter((exp) => exp.id !== id);
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          experiences: updatedExps,
        },
      };
    });
  };

  const handleSetProfessionalDuration = (dur: ProfessionalDuration) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      return {
        ...prev,
        skills_and_experience: {
          ...currentSe,
          professional_duration: dur,
        },
      };
    });
  };

  // --- Step 6: Multi-format Resume Upload & AI Parsing State ---
  type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ExtractedResumeData | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [resumeMetadata, setResumeMetadata] = useState<Record<string, any> | null>(null);
  const [enrichmentSuccessNote, setEnrichmentSuccessNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const update = (patch: Partial<OnboardingData>) => setData((d) => ({ ...d, ...patch }));

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const finishOnboarding = async () => {
    setSaveError(null);
    if (!isStep0Valid) {
      setSaveError(
        data.career_mode === 'career_growth_transition'
          ? 'Please select your career transition objective before submitting.'
          : 'Please select your career goal before submitting.'
      );
      return;
    }
    if (!isStep1Valid) {
      setSaveError('Please complete your education details before submitting.');
      return;
    }
    if (!isStep2Valid) {
      setSaveError('Please select your interests before submitting.');
      return;
    }
    if (!isStep3Valid) {
      setSaveError('Please complete your skills and experience details before submitting.');
      return;
    }
    if (!isStep4Valid) {
      setSaveError('Please complete your target preferences before submitting.');
      return;
    }

    try {
      const activePersona = data.user_persona || detectUserPersona(data);
      await saveProfile({
        ...data,
        career_growth_subtype: data.career_growth_subtype,
        user_persona: activePersona,
        // Keep the previously parsed resume if they didn't upload a new one.
        resume: (parsedData as Profile['resume']) ?? profile?.resume,
        knowMe: {
          ...(profile?.knowMe || {}),
          ...((data as any).knowMe || {}),
          career_growth_subtype: data.career_growth_subtype,
          user_persona: activePersona,
          ...(resumeMetadata ? { resume_metadata: resumeMetadata } : {}),
        },
        onboardingComplete: true,
      });

      // Successful confirmation received from Supabase: clear draft and navigate to assessment
      if (user?.id) {
        clearUserDraft(user.id);
      }
      setFinished(true);
      navigate('/assessment', { replace: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Could not save onboarding profile:', err);
      setSaveError(
        isMissingTable(err as { code?: string })
          ? "The database isn't set up yet, so your answers can't be saved. Run supabase/migrations/0001_phase1_counselor.sql in the Supabase SQL Editor, then try again."
          : "We couldn't save your answers. Check your connection and try again.",
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFileSelection(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFileSelection(e.target.files[0]);
  };

  const handleFileSelection = (selectedFile: File) => {
    setResumeError(null);
    setEnrichmentSuccessNote(null);

    // Validate size (5MB max)
    const MAX_BYTES = 5 * 1024 * 1024;
    if (selectedFile.size > MAX_BYTES) {
      setResumeError(`File size exceeds 5 MB limit (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB). Please select a smaller file.`);
      setUploadStatus('error');
      return;
    }

    // Validate format: PDF, DOCX, DOC
    const nameLower = selectedFile.name.toLowerCase();
    const isPdf = nameLower.endsWith('.pdf') || selectedFile.type === 'application/pdf';
    const isDocx = nameLower.endsWith('.docx') || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isDoc = nameLower.endsWith('.doc') || selectedFile.type === 'application/msword';

    if (!isPdf && !isDocx && !isDoc) {
      setResumeError('Unsupported format. Please upload a PDF (.pdf), Word (.docx), or (.doc) resume.');
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
    setUploadStatus('idle');
    setUploadProgress(0);
    setProcessingStage(1);
    setParsedData(null);
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResumeLoading(false);
    setUploadStatus('idle');
    setUploadProgress(0);
    setProcessingStage(1);
  };

  const removeResume = () => {
    cancelUpload();
    setFile(null);
    setParsedData(null);
    setResumeError(null);
    setResumeMetadata(null);
    setEnrichmentSuccessNote(null);
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadResume = async () => {
    if (!file) return;
    setResumeLoading(true);
    setResumeError(null);
    setEnrichmentSuccessNote(null);
    setUploadStatus('uploading');
    setUploadProgress(15);
    setProcessingStage(1);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 120);

    let stageTimer: any = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadPromise = fetch(`${API_BASE}/api/upload-resume`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      // Buffer briefly then transition to processing animation
      await new Promise((r) => setTimeout(r, 450));
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('processing');

      stageTimer = setInterval(() => {
        setProcessingStage((s) => (s < 4 ? s + 1 : s));
      }, 500);

      const response = await uploadPromise;
      clearInterval(stageTimer);

      if (!response.ok) {
        let errMessage = 'Failed to parse resume';
        try {
          const errData = await response.json();
          if (errData?.detail) errMessage = errData.detail;
        } catch {
          // fallback
        }
        throw new Error(errMessage);
      }

      const parsed: ExtractedResumeData = await response.json();
      setParsedData(parsed);
      setUploadStatus('success');
      // Automatically prompt the user to review findings
      setIsReviewModalOpen(true);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setResumeError('Resume upload was cancelled.');
      } else {
        setResumeError(err instanceof Error ? err.message : 'An error occurred while uploading.');
      }
      setUploadStatus('error');
    } finally {
      clearInterval(progressInterval);
      if (stageTimer) clearInterval(stageTimer);
      setResumeLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleApplyEnrichment = (enriched: {
    skillsToAdd: string[];
    experiencesToAdd: ExperienceItem[];
    resolvedConflicts: Record<string, { value: string; source: 'onboarding' | 'resume' }>;
    resumeMetadata: Record<string, any>;
  }) => {
    setData((prev) => {
      const currentSe = prev.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE;
      const currentSkills = currentSe.skills || [];
      const existingNames = new Set(currentSkills.map((s) => s.name.toLowerCase()));

      const newSkills: UserSkill[] = enriched.skillsToAdd
        .filter((name) => !existingNames.has(name.toLowerCase()))
        .map((name) => ({
          id: 'skill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name,
          category: 'other',
          proficiency: 'intermediate',
          is_custom: true,
        }));

      const mergedSkills = [...currentSkills, ...newSkills];
      const mergedExperiences = [...currentSe.experiences, ...enriched.experiencesToAdd];

      const updatedSe: SkillsAndExperienceDetails = {
        ...currentSe,
        has_no_experience: mergedExperiences.length > 0 ? false : currentSe.has_no_experience,
        experience_types:
          mergedExperiences.length > 0
            ? Array.from(new Set([...currentSe.experience_types.filter((t) => t !== 'no_experience'), ...enriched.experiencesToAdd.map((e) => e.type)]))
            : currentSe.experience_types,
        skills: mergedSkills,
        experiences: mergedExperiences,
      };

      let updatedEdu = prev.education_details;
      if (updatedEdu && enriched.resolvedConflicts) {
        const patch: Partial<EducationDetails> = {};
        if (enriched.resolvedConflicts.graduation_year?.source === 'resume') {
          patch.graduation_year = enriched.resolvedConflicts.graduation_year.value;
        }
        if (enriched.resolvedConflicts.degree?.source === 'resume') {
          patch.degree_other = enriched.resolvedConflicts.degree.value;
        }
        if (enriched.resolvedConflicts.institution?.source === 'resume') {
          patch.institution = enriched.resolvedConflicts.institution.value;
        }
        updatedEdu = { ...updatedEdu, ...patch };
      }

      return {
        ...prev,
        skills_and_experience: updatedSe,
        education_details: updatedEdu,
      };
    });

    setResumeMetadata(enriched.resumeMetadata);
    setIsReviewModalOpen(false);
    setEnrichmentSuccessNote(
      `Profile successfully enriched! Added ${enriched.skillsToAdd.length} skills and ${enriched.experiencesToAdd.length} experience records.`
    );
  };

  const restart = () => {
    if (user?.id) {
      clearUserDraft(user.id);
    }
    // Start from their saved answers so "update" doesn't mean "retype everything".
    setData(
      profile
        ? {
            path: profile.path ?? null,
            career_mode: profile.career_mode ?? (profile.path ? PATH_TO_CAREER_MODE[profile.path] : null),
            career_growth_subtype: profile.career_growth_subtype ?? (profile.knowMe as any)?.career_growth_subtype ?? null,
            user_persona: profile.user_persona ?? (profile.knowMe as any)?.user_persona ?? null,
            educationStage: profile.educationStage ?? 'degree_ug',
            streamOrBranch: profile.streamOrBranch ?? '',
            college: profile.college ?? '',
            course: profile.course ?? '',
            year: profile.year ?? '',
            interests: profile.interests ?? [],
            skills_and_experience: (profile.knowMe as any)?.skills_and_experience || DEFAULT_SKILLS_AND_EXPERIENCE,
            career_discovery_preferences: (profile.knowMe as any)?.career_discovery_preferences || DEFAULT_CAREER_DISCOVERY_PREFERENCES,
            strengthsNote: profile.strengthsNote ?? '',
            targetRole: profile.targetRole ?? '',
            hoursPerWeek: profile.hoursPerWeek ?? '',
          }
        : emptyData,
    );
    setFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setProcessingStage(1);
    setParsedData(null);
    setResumeError(null);
    setResumeMetadata(null);
    setEnrichmentSuccessNote(null);
    setIsReviewModalOpen(false);
    setStep(0);
    setFinished(false);
    setRedoing(true);
  };

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/60 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-[800px] relative z-10">

        {/* Account bar */}
        {user && (
          <div className="flex items-center justify-end gap-3 mb-6 text-sm">
            <span className="text-slate-500 font-medium">
              Signed in as <span className="text-slate-800 font-semibold">{user.email}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}

        {/* Already completed onboarding on a previous visit */}
        {alreadyDone && !redoing && !finished ? (
          <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome back!</h1>
            <p className="text-slate-500 mb-8">
              {assessment
                ? "You've already told us about yourself. Head to your dashboard to see your career matches."
                : "You've already told us about yourself. Continue to your assessment to discover your career matches."}
            </p>
            <div className="flex items-center justify-center gap-6">
              <Link
                to={assessment ? '/dashboard' : '/assessment'}
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
              >
                {assessment ? 'Go to dashboard' : 'Continue to assessment'}{' '}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={restart}
                className="text-[#6D28D9] font-bold hover:underline text-sm"
              >
                Update my answers
              </button>
            </div>
          </div>
        ) : finished ? (
          /* --- Completion screen --- */
          <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">You're all set! 🎉</h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Thanks, {data.college || 'friend'}! We're using what you told us to discover careers that fit you best.
            </p>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8 text-left text-sm text-slate-600 space-y-1.5">
              {data.path && (
                <p>
                  <strong className="text-slate-800">Goal status:</strong>{' '}
                  {PATH_OPTIONS.find((p) => p.value === data.career_mode || CAREER_MODE_TO_PATH[p.value] === data.path)?.title}
                  {data.career_growth_subtype && (
                    <span className="text-purple-700 font-semibold">
                      {' '}— {CAREER_GROWTH_SUBTYPES.find((s) => s.id === data.career_growth_subtype)?.title}
                    </span>
                  )}
                </p>
              )}
              {(data.course || data.year) && <p><strong className="text-slate-800">Studying:</strong> {[data.course, data.year].filter(Boolean).join(' — ')}</p>}
              {data.interests.length > 0 && <p><strong className="text-slate-800">Interests:</strong> {data.interests.join(', ')}</p>}
              {data.skills_and_experience && data.skills_and_experience.skills.length > 0 && (
                <p><strong className="text-slate-800">Skills:</strong> {data.skills_and_experience.skills.map((s) => s.name).join(', ')}</p>
              )}
              {data.skills_and_experience?.professional_duration && (
                <p><strong className="text-slate-800">Experience:</strong> {data.skills_and_experience.experience_types.join(', ')} ({data.skills_and_experience.professional_duration.replace(/_/g, ' ')})</p>
              )}
              {data.career_discovery_preferences && data.career_discovery_preferences.career_motivations.length > 0 && (
                <p><strong className="text-slate-800">Motivations:</strong> {data.career_discovery_preferences.career_motivations.map((m) => CAREER_MOTIVATIONS.find((o) => o.id === m)?.label || m).join(', ')}</p>
              )}
              {data.career_discovery_preferences?.preferred_work_environment && (
                <p><strong className="text-slate-800">Work setting:</strong> {WORK_ENVIRONMENTS.find((w) => w.id === data.career_discovery_preferences?.preferred_work_environment)?.label || data.career_discovery_preferences.preferred_work_environment}</p>
              )}
              {data.career_discovery_preferences?.career_timeline && (
                <p><strong className="text-slate-800">Timeline:</strong> {CAREER_TIMELINES.find((t) => t.id === data.career_discovery_preferences?.career_timeline)?.label || data.career_discovery_preferences.career_timeline}</p>
              )}
              {data.targetRole && <p><strong className="text-slate-800">Target role:</strong> {data.targetRole}</p>}
              {data.hoursPerWeek && <p><strong className="text-slate-800">Time available:</strong> {data.hoursPerWeek}</p>}
              {parsedData && <p><strong className="text-slate-800">Resume:</strong> parsed and saved</p>}
            </div>
            <div className="flex items-center justify-center gap-6">
              <Link
                to="/assessment"
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
              >
                Start career discovery <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={restart}
                className="text-[#6D28D9] font-bold hover:underline text-sm"
              >
                Edit my answers
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Step {step + 1} of {STEPS.length}</span>
                <span className="text-purple-600">
                  {step === 4 && (data.career_mode === 'career_discovery' || data.path === 'not_sure')
                    ? 'Preferences'
                    : STEPS[step]}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">

              {/* --- Step 0: Path --- */}
              {step === 0 && (
                <div>
                  <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                      What would you like help with in your career journey?
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                      Choose the option that best describes your current situation. We'll personalize your career guidance accordingly.
                    </p>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label="What would you like help with in your career journey?"
                    className="grid sm:grid-cols-3 gap-4 mb-4"
                  >
                    {PATH_OPTIONS.map((opt) => {
                      const isSelected =
                        data.career_mode === opt.value ||
                        (!data.career_mode && data.path === CAREER_MODE_TO_PATH[opt.value]);
                      return (
                        <div
                          key={opt.value}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => handleSelectCareerMode(opt.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectCareerMode(opt.value);
                            }
                          }}
                          className={`relative text-left rounded-2xl border-2 p-5 transition-all cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-600/30'
                              : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-purple-50 text-purple-600'
                                }`}
                              >
                                {opt.icon}
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                              )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">
                              {opt.title}
                            </h3>
                            <p className="text-slate-500 text-xs leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Adaptive Sub-intents for "I want to grow or change my career" */}
                  {data.career_mode === 'career_growth_transition' && (
                    <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="text-center sm:text-left mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Select your transition objective</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                          Which describes your career transition goal?
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm">
                          Tell us whether you're switching fields, advancing in your current role, or returning after time off.
                        </p>
                      </div>

                      <div
                        role="radiogroup"
                        aria-label="Which describes your career transition goal?"
                        className="grid sm:grid-cols-3 gap-3.5"
                      >
                        {CAREER_GROWTH_SUBTYPES.map((sub) => {
                          const isSubSelected = data.career_growth_subtype === sub.id;
                          return (
                            <div
                              key={sub.id}
                              role="radio"
                              aria-checked={isSubSelected}
                              tabIndex={0}
                              onClick={() => handleSelectGrowthSubtype(sub.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelectGrowthSubtype(sub.id);
                                }
                              }}
                              className={`relative text-left rounded-2xl border-2 p-4 transition-all cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                isSubSelected
                                  ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-1 ring-purple-600/30'
                                  : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-2xs'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2.5">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                      isSubSelected
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-purple-100/70 text-purple-700'
                                    }`}
                                  >
                                    {renderGrowthSubtypeIcon(sub.id)}
                                  </div>
                                  {isSubSelected ? (
                                    <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                  )}
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                                  {sub.title}
                                </h3>
                                <p className="text-slate-500 text-xs leading-relaxed">
                                  {sub.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {!data.career_growth_subtype && (
                        <p className="text-xs text-amber-600 font-medium mt-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                          Please select one of the three transition options above to continue.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* --- Step 1: Dynamic Cascading Education Form --- */}
              {step === 1 && (
                <div className="space-y-6 max-w-xl mx-auto text-left">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                      Where are you in your education?
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base">
                      Counseling guidance is completely tailored based on your current academic stage.
                    </p>
                  </div>

                  {/* 1. Education Level (Searchable Dropdown) */}
                  <div>
                    <SearchableSelect
                      label="Education Level"
                      required
                      placeholder="Select your education level..."
                      searchPlaceholder="Search education level (e.g. Undergraduate, 12th, Diploma)..."
                      value={data.education_details?.education_level || 'undergraduate'}
                      options={EDUCATION_LEVELS.map((lvl) => ({
                        value: lvl.id,
                        label: lvl.label,
                        icon: lvl.icon,
                        hint: lvl.hint,
                      }))}
                      onChange={(newLevel) => {
                        const lvl = newLevel as EducationLevel;
                        if (lvl === 'sslc_10th') {
                          updateEducation({
                            education_level: lvl,
                            school_board: 'cbse',
                            school_board_other: '',
                            degree: 'sslc_10th_general',
                            specialization: 'General',
                            study_stage_value: '10th Standard / Board Appearing',
                            favorite_school_subjects: ['Mathematics', 'Science (Physics, Chemistry, Biology)'],
                          });
                        } else if (lvl === 'puc_12th') {
                          updateEducation({
                            education_level: lvl,
                            school_board: 'cbse',
                            school_board_other: '',
                            school_stream: 'science_pcmb',
                            specialization: 'Science — PCMB (Physics, Chemistry, Math, Biology)',
                            degree: 'puc_12th_general',
                            study_stage_value: '2nd PUC / 12th Standard (Board Appearing)',
                          });
                        } else if (lvl === 'diploma') {
                          updateEducation({
                            education_level: lvl,
                            degree: 'diploma_engg',
                            specialization: 'Computer Science & Engineering',
                            study_stage_value: '1st Year',
                          });
                        } else if (lvl === 'postgraduate') {
                          updateEducation({
                            education_level: lvl,
                            degree: 'mtech_me',
                            specialization: 'Computer Science & Engineering',
                            study_stage_value: '1st Year',
                            highest_qualification: 'Undergraduate Degree (e.g. BTech, BSc, BCom, BA)',
                          });
                        } else if (lvl === 'doctoral_phd') {
                          updateEducation({
                            education_level: lvl,
                            degree: 'phd',
                            specialization: 'Computer Science & Engineering',
                            study_stage_value: 'Coursework & Proposal Defense',
                            highest_qualification: 'Postgraduate Degree (e.g. MTech, MCA, MBA, MSc)',
                          });
                        } else {
                          const defaultDegrees = DEGREE_CATALOG[lvl] || [];
                          const firstDeg = defaultDegrees[0];
                          const firstSpec = firstDeg?.defaultSpecializations?.[0] || 'General';
                          const stageOpts = getStudyStageOptions(firstDeg, stageViewMode);
                          updateEducation({
                            education_level: lvl,
                            degree: firstDeg?.id || 'btech_be',
                            degree_other: '',
                            specialization: firstSpec,
                            specialization_other: '',
                            study_stage_value: stageOpts[0]?.id || '1st Year',
                          });
                        }
                      }}
                    />
                  </div>

                  {/* 2. Education Status (Pills / Cards) */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Current Academic Status <span className="text-purple-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {EDUCATION_STATUSES.map((status) => {
                        const isSelected = data.education_details?.education_status === status.id;
                        return (
                          <button
                            key={status.id}
                            type="button"
                            onClick={() => {
                              const currDeg = (DEGREE_CATALOG[data.education_details?.education_level || 'undergraduate'] || []).find(
                                (d) => d.id === data.education_details?.degree
                              );
                              const stageOpts = getStudyStageOptions(currDeg, stageViewMode);
                              updateEducation({
                                education_status: status.id,
                                graduation_year: status.id === 'completed' ? '2025' : undefined,
                                study_stage_value: status.id === 'currently_studying' ? (stageOpts[0]?.id || '1st Year') : '',
                                last_attended_stage: status.id === 'discontinued' ? '1st Year / 2nd Sem' : undefined,
                                highest_qualification:
                                  status.id === 'discontinued' || status.id === 'gap_year'
                                    ? HIGHEST_QUALIFICATIONS[1]
                                    : data.education_details?.highest_qualification,
                                plan_to_resume: status.id === 'gap_year' ? 'yes' : status.id === 'discontinued' ? 'no' : undefined,
                              });
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600/30 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-purple-300'
                            }`}
                          >
                            <span className="text-lg leading-none shrink-0 mt-0.5">{status.icon}</span>
                            <div className="truncate">
                              <div className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-purple-950' : 'text-slate-800'}`}>
                                {status.label}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate leading-snug mt-0.5">
                                {status.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. ADAPTIVE EDUCATION QUESTIONS */}

                  {/* CASE 1: Discontinued / Dropout OR Gap Year */}
                  {(data.education_details?.education_status === 'discontinued' || data.education_details?.education_status === 'gap_year') ? (
                    <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                          <span>{data.education_details?.education_status === 'discontinued' ? 'Discontinued / Dropout Details' : 'Gap Year Details'}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {data.education_details?.education_status === 'discontinued'
                            ? 'Help us understand your academic foundation so we can chart the best way forward.'
                            : 'Tell us about your gap period so we can align our guidance with your timeline.'}
                        </p>
                      </div>

                      <SearchableSelect
                        label="Highest Completed Qualification"
                        required
                        placeholder="Select highest completed qualification..."
                        value={data.education_details?.highest_qualification || ''}
                        options={HIGHEST_QUALIFICATIONS.map((q) => ({
                          value: q,
                          label: q,
                          icon: <GraduationCap className="w-4 h-4 text-purple-600" />,
                        }))}
                        onChange={(newQual) => updateEducation({ highest_qualification: newQual })}
                      />

                      {data.education_details?.education_status === 'discontinued' && (
                        <>
                          <div className="space-y-1.5">
                            <label className="block text-[13px] font-semibold text-slate-700">
                              Last Stage / Semester Attended <span className="text-purple-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={data.education_details?.last_attended_stage || ''}
                              onChange={(e) => updateEducation({ last_attended_stage: e.target.value })}
                              placeholder="e.g. 2nd Year Computer Science, 3rd Semester B.Com, 1st Year MBBS"
                              className={inputClass}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="block text-[13px] font-semibold text-slate-700">
                                Year Discontinued <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                              </label>
                              <select
                                value={data.education_details?.year_discontinued || ''}
                                onChange={(e) => updateEducation({ year_discontinued: e.target.value })}
                                className={inputClass}
                              >
                                <option value="">Select year (optional)...</option>
                                {GRADUATION_YEARS.map((yr) => (
                                  <option key={yr} value={yr}>{yr}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[13px] font-semibold text-slate-700">
                                Reason for Leaving <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={data.education_details?.discontinuation_reason || ''}
                                onChange={(e) => updateEducation({ discontinuation_reason: e.target.value })}
                                placeholder="e.g. Financial, started working, personal"
                                className={inputClass}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {data.education_details?.education_status === 'gap_year' && (
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-semibold text-slate-700">
                            Gap Year Focus / Purpose <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={data.education_details?.gap_year_reason || ''}
                            onChange={(e) => updateEducation({ gap_year_reason: e.target.value })}
                            placeholder="e.g. Preparing for JEE / NEET / CAT / GATE, self-studying coding"
                            className={inputClass}
                          />
                        </div>
                      )}

                      <div className="space-y-2 pt-1">
                        <label className="block text-[13px] font-semibold text-slate-700">
                          Intention to Resume Education or Enter Workforce <span className="text-purple-600">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 'yes', label: 'Planning to resume formal degree' },
                            { id: 'no', label: 'Focusing on direct employment / jobs' },
                            { id: 'undecided', label: 'Undecided / open to guidance' },
                          ].map((opt) => {
                            const isSelected = data.education_details?.plan_to_resume === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => updateEducation({ plan_to_resume: opt.id as any })}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[13px] font-semibold text-slate-700">
                          Previous College / Institute Name <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={data.education_details?.institution ?? data.college ?? ''}
                          onChange={(e) => updateEducation({ institution: e.target.value })}
                          placeholder="e.g. State University, City College"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ) : data.education_details?.education_level === 'sslc_10th' ? (
                    /* CASE 2: CLASS 10 (Secondary School / SSLC) */
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* School Board */}
                      <div className="space-y-1.5">
                        <SearchableSelect
                          label="School Examination Board"
                          required
                          placeholder="Select your school board..."
                          searchPlaceholder="Search school board (e.g. CBSE, ICSE, State Board)..."
                          value={data.education_details?.school_board || 'cbse'}
                          options={SCHOOL_BOARDS.map((b) => ({
                            value: b.id,
                            label: b.name,
                            hint: b.description,
                          }))}
                          onChange={(boardId) => updateEducation({ school_board: boardId, school_board_other: '' })}
                        />
                        {data.education_details?.school_board === 'other' && (
                          <div className="space-y-1 pt-1.5 animate-in fade-in duration-150">
                            <label className="block text-xs font-semibold text-slate-700">
                              Specify School Board <span className="text-purple-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={data.education_details?.school_board_other || ''}
                              onChange={(e) => updateEducation({ school_board_other: e.target.value })}
                              placeholder="e.g. Cambridge IGCSE, Maharashtra State Board"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* School Name (Optional) */}
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">
                          School Name <span className="text-xs text-slate-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={data.education_details?.institution ?? data.college ?? ''}
                          onChange={(e) => updateEducation({ institution: e.target.value })}
                          placeholder="e.g. Kendriya Vidyalaya, Delhi Public School, St. Joseph's School"
                          className={inputClass}
                        />
                      </div>

                      {/* Favorite School Subjects (Multi-select Chips) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[13px] font-semibold text-slate-800">
                            Favorite School Subjects <span className="text-purple-600">*</span>
                          </label>
                          <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                            {(data.education_details?.favorite_school_subjects || []).length} selected
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Pick the subjects you enjoy or are curious about. This helps us recommend the best high school stream and career directions.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {CLASS_10_SUBJECTS.map((sub) => {
                            const isSelected = (data.education_details?.favorite_school_subjects || []).includes(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => {
                                  const current = data.education_details?.favorite_school_subjects || [];
                                  const updated = isSelected
                                    ? current.filter((s) => s !== sub)
                                    : [...current, sub];
                                  updateEducation({ favorite_school_subjects: updated });
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs ring-1 ring-purple-600/30'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                                }`}
                              >
                                {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Current Standard or Passing Year */}
                      {data.education_details?.education_status === 'currently_studying' && (
                        <div className="space-y-2">
                          <label className="block text-[13px] font-semibold text-slate-700">
                            Current Standard <span className="text-purple-600">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {['9th Standard', '10th Standard / Board Appearing'].map((std) => {
                              const isSelected = data.education_details?.study_stage_value === std;
                              return (
                                <button
                                  key={std}
                                  type="button"
                                  onClick={() => updateEducation({ study_stage_value: std })}
                                  className={`p-3 rounded-xl border text-center text-xs sm:text-sm font-semibold transition-all ${
                                    isSelected
                                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600/30'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                                  }`}
                                >
                                  {std}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {data.education_details?.education_status === 'completed' && (
                        <div className="space-y-1.5">
                          <SearchableSelect
                            label="Board Passing Year"
                            required
                            placeholder="Select passing year..."
                            value={data.education_details?.graduation_year || ''}
                            options={GRADUATION_YEARS.map((yr) => ({
                              value: yr,
                              label: yr,
                              icon: <Calendar className="w-4 h-4 text-purple-600" />,
                            }))}
                            onChange={(newYear) => updateEducation({ graduation_year: newYear })}
                          />
                        </div>
                      )}
                    </div>
                  ) : data.education_details?.education_level === 'puc_12th' ? (
                    /* CASE 3: CLASS 12 / PUC / INTERMEDIATE */
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* School / Pre-University Board */}
                      <div className="space-y-1.5">
                        <SearchableSelect
                          label="Higher Secondary / Pre-University Board"
                          required
                          placeholder="Select board..."
                          searchPlaceholder="Search board (e.g. CBSE, State Board, ISC)..."
                          value={data.education_details?.school_board || 'cbse'}
                          options={SCHOOL_BOARDS.map((b) => ({
                            value: b.id,
                            label: b.name,
                            hint: b.description,
                          }))}
                          onChange={(boardId) => updateEducation({ school_board: boardId, school_board_other: '' })}
                        />
                        {data.education_details?.school_board === 'other' && (
                          <div className="space-y-1 pt-1.5 animate-in fade-in duration-150">
                            <label className="block text-xs font-semibold text-slate-700">
                              Specify Board <span className="text-purple-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={data.education_details?.school_board_other || ''}
                              onChange={(e) => updateEducation({ school_board_other: e.target.value })}
                              placeholder="e.g. Telangana State Board, Cambridge A-Levels"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* Stream / Subject Combination */}
                      <div className="space-y-1.5">
                        <SearchableSelect
                          label="Stream / Subject Combination"
                          required
                          placeholder="Select stream (e.g. Science PCMB, Commerce with Math, Arts)..."
                          searchPlaceholder="Search stream..."
                          value={data.education_details?.school_stream || 'science_pcmb'}
                          options={HIGH_SCHOOL_STREAMS.map((s) => ({
                            value: s.id,
                            label: s.label,
                            hint: s.group,
                          }))}
                          onChange={(newStream) => {
                            const cfg = HIGH_SCHOOL_STREAMS.find((s) => s.id === newStream);
                            updateEducation({
                              school_stream: newStream,
                              specialization: cfg?.label || newStream,
                              specialization_other: '',
                            });
                          }}
                        />
                        {data.education_details?.school_stream === 'other' && (
                          <div className="space-y-1 pt-1.5 animate-in fade-in duration-150">
                            <label className="block text-xs font-semibold text-slate-700">
                              Specify Custom Stream / Subjects <span className="text-purple-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={data.education_details?.specialization_other || ''}
                              onChange={(e) => updateEducation({ specialization_other: e.target.value })}
                              placeholder="e.g. Economics, Statistics, Math & Psychology"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* Junior College / School Name */}
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">
                          Junior College / School Name <span className="text-xs text-slate-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={data.education_details?.institution ?? data.college ?? ''}
                          onChange={(e) => updateEducation({ institution: e.target.value })}
                          placeholder="e.g. National PU College, St. Xavier's Junior College, DPS RK Puram"
                          className={inputClass}
                        />
                      </div>

                      {/* Current Stage or Passing Year */}
                      {data.education_details?.education_status === 'currently_studying' && (
                        <div className="space-y-2">
                          <label className="block text-[13px] font-semibold text-slate-700">
                            Current Academic Stage <span className="text-purple-600">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {['1st PUC / 11th Standard', '2nd PUC / 12th Standard (Board Appearing)'].map((stg) => {
                              const isSelected = data.education_details?.study_stage_value === stg;
                              return (
                                <button
                                  key={stg}
                                  type="button"
                                  onClick={() => updateEducation({ study_stage_value: stg })}
                                  className={`p-3 rounded-xl border text-center text-xs sm:text-sm font-semibold transition-all ${
                                    isSelected
                                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600/30'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                                  }`}
                                >
                                  {stg}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {data.education_details?.education_status === 'completed' && (
                        <div className="space-y-1.5">
                          <SearchableSelect
                            label="Passing Year"
                            required
                            placeholder="Select passing year..."
                            value={data.education_details?.graduation_year || ''}
                            options={GRADUATION_YEARS.map((yr) => ({
                              value: yr,
                              label: yr,
                              icon: <Calendar className="w-4 h-4 text-purple-600" />,
                            }))}
                            onChange={(newYear) => updateEducation({ graduation_year: newYear })}
                          />
                        </div>
                      )}
                    </div>
                  ) : data.education_details?.education_level === 'diploma' ? (
                    /* CASE 4: DIPLOMA / POLYTECHNIC */
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Specialization */}
                      <div className="space-y-1.5">
                        <SearchableSelect
                          label="Diploma Specialization / Branch"
                          required
                          placeholder="Select diploma branch..."
                          searchPlaceholder="Search branch (e.g. Mechanical, Computer Science, Pharmacy)..."
                          value={data.education_details?.specialization || 'Computer Science & Engineering'}
                          options={DIPLOMA_SPECS.map((s) => ({ value: s, label: s }))}
                          onChange={(newSpec) => updateEducation({ specialization: newSpec, specialization_other: '' })}
                        />
                        {data.education_details?.specialization === 'Other' && (
                          <div className="space-y-1 pt-1.5 animate-in fade-in duration-150">
                            <label className="block text-xs font-semibold text-slate-700">
                              Specify Specialization <span className="text-purple-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={data.education_details?.specialization_other || ''}
                              onChange={(e) => updateEducation({ specialization_other: e.target.value })}
                              placeholder="e.g. Mining Engineering, Mechatronics"
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* Polytechnic Name */}
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">
                          Polytechnic / Institute Name <span className="text-xs text-slate-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={data.education_details?.institution ?? data.college ?? ''}
                          onChange={(e) => updateEducation({ institution: e.target.value })}
                          placeholder="e.g. Government Polytechnic, S.J. Polytechnic"
                          className={inputClass}
                        />
                      </div>

                      {/* Current Year or Completion Year */}
                      {data.education_details?.education_status === 'currently_studying' && (
                        <div className="space-y-2">
                          <label className="block text-[13px] font-semibold text-slate-700">
                            Current Year <span className="text-purple-600">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {['1st Year', '2nd Year', 'Final Year (3rd Year)'].map((yr) => {
                              const isSelected = data.education_details?.study_stage_value === yr;
                              return (
                                <button
                                  key={yr}
                                  type="button"
                                  onClick={() => updateEducation({ study_stage_value: yr })}
                                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600/30'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                                  }`}
                                >
                                  {yr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {data.education_details?.education_status === 'completed' && (
                        <div className="space-y-1.5">
                          <SearchableSelect
                            label="Completion / Passing Year"
                            required
                            placeholder="Select completion year..."
                            value={data.education_details?.graduation_year || ''}
                            options={GRADUATION_YEARS.map((yr) => ({
                              value: yr,
                              label: yr,
                              icon: <Calendar className="w-4 h-4 text-purple-600" />,
                            }))}
                            onChange={(newYear) => updateEducation({ graduation_year: newYear })}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* CASE 5: UNDERGRADUATE / POSTGRADUATE / DOCTORAL */
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Prior Degree for PG & Doctoral */}
                      {(data.education_details?.education_level === 'postgraduate' || data.education_details?.education_level === 'doctoral_phd') && (
                        <div className="space-y-1.5">
                          <SearchableSelect
                            label="Prior Completed Degree"
                            required
                            placeholder="Select prior qualification..."
                            value={data.education_details?.highest_qualification || 'Undergraduate Degree (e.g. BTech, BSc, BCom, BA)'}
                            options={HIGHEST_QUALIFICATIONS.map((q) => ({
                              value: q,
                              label: q,
                              icon: <GraduationCap className="w-4 h-4 text-purple-600" />,
                            }))}
                            onChange={(newQual) => updateEducation({ highest_qualification: newQual })}
                          />
                        </div>
                      )}

                      {/* Degree / Course */}
                      <div className="space-y-3">
                        <SearchableSelect
                          label={
                            data.education_details?.education_level === 'postgraduate'
                              ? 'Postgraduate Degree / Program'
                              : data.education_details?.education_level === 'doctoral_phd'
                              ? 'Doctoral Program'
                              : 'Degree / Qualification'
                          }
                          required
                          placeholder="Select your degree / course..."
                          searchPlaceholder="Search degree (e.g. BTech, BCA, MBBS, MBA)..."
                          value={data.education_details?.degree || ''}
                          options={(DEGREE_CATALOG[data.education_details?.education_level || 'undergraduate'] || []).map((deg) => ({
                            value: deg.id,
                            label: deg.name,
                            hint: `${deg.durationYears} Years duration`,
                          }))}
                          onChange={(newDegId) => {
                            const degConfig = (DEGREE_CATALOG[data.education_details?.education_level || 'undergraduate'] || []).find(
                              (d) => d.id === newDegId
                            );
                            const firstSpec = degConfig?.defaultSpecializations?.[0] || 'General';
                            const stageOpts = getStudyStageOptions(degConfig, stageViewMode);
                            updateEducation({
                              degree: newDegId,
                              degree_other: '',
                              specialization: firstSpec,
                              specialization_other: '',
                              study_stage_value: stageOpts[0]?.id || '1st Year',
                            });
                          }}
                        />

                        {data.education_details?.degree === 'other' && (
                          <div className="space-y-1.5 animate-in fade-in duration-200">
                            <label className="block text-xs font-semibold text-slate-700">
                              Specify Degree / Course <span className="text-purple-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={data.education_details?.degree_other || ''}
                              onChange={(e) => updateEducation({ degree_other: e.target.value })}
                              placeholder="e.g. Bachelor of Design (B.Des), B.Voc, etc."
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      {/* Specialization / Major */}
                      <div className="space-y-3">
                        {(() => {
                          const currentDegConfig = (
                            DEGREE_CATALOG[data.education_details?.education_level || 'undergraduate'] || []
                          ).find((d) => d.id === data.education_details?.degree);

                          const specs = currentDegConfig?.defaultSpecializations || ['General', 'Other'];

                          return (
                            <>
                              <SearchableSelect
                                label="Specialization / Branch"
                                required
                                placeholder="Select specialization..."
                                searchPlaceholder="Search branch / major (e.g. Computer Science, AI&ML, Finance)..."
                                value={data.education_details?.specialization || ''}
                                options={specs.map((s) => ({
                                  value: s,
                                  label: s,
                                }))}
                                onChange={(newSpec) => {
                                  updateEducation({
                                    specialization: newSpec,
                                    specialization_other: '',
                                  });
                                }}
                              />

                              {(data.education_details?.specialization === 'Other' || data.education_details?.specialization === 'other') && (
                                <div className="space-y-1.5 animate-in fade-in duration-200">
                                  <label className="block text-xs font-semibold text-slate-700">
                                    Specify Specialization <span className="text-purple-600">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={data.education_details?.specialization_other || ''}
                                    onChange={(e) => updateEducation({ specialization_other: e.target.value })}
                                    placeholder="e.g. Mechatronics, Marine Biology, Visual Arts"
                                    className={inputClass}
                                  />
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* College / University Name */}
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-slate-700">
                          College / University Name <span className="text-xs text-slate-400 font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={data.education_details?.institution ?? data.college ?? ''}
                          onChange={(e) => updateEducation({ institution: e.target.value })}
                          placeholder="e.g. IIT Bombay, Delhi University, VTU, Christ University"
                          className={inputClass}
                        />
                      </div>

                      {/* Study Stage or Graduation Year */}
                      {data.education_details?.education_status === 'currently_studying' && (() => {
                        const currentDegConfig = (
                          DEGREE_CATALOG[data.education_details?.education_level || 'undergraduate'] || []
                        ).find((d) => d.id === data.education_details?.degree);

                        const hasSemesters = Boolean(currentDegConfig?.totalSemesters);
                        const stageOptions = getStudyStageOptions(currentDegConfig, stageViewMode);

                        return (
                          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-[13px] font-semibold text-slate-800">
                                Current Academic Stage <span className="text-purple-600">*</span>
                              </label>
                              {hasSemesters && (
                                <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStageViewMode('year');
                                      const opts = getStudyStageOptions(currentDegConfig, 'year');
                                      updateEducation({ study_stage_type: 'year', study_stage_value: opts[0]?.id });
                                    }}
                                    className={`px-2.5 py-1 rounded-md transition-colors ${
                                      stageViewMode === 'year'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-purple-600'
                                    }`}
                                  >
                                    Year-wise
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStageViewMode('semester');
                                      const opts = getStudyStageOptions(currentDegConfig, 'semester');
                                      updateEducation({ study_stage_type: 'semester', study_stage_value: opts[0]?.id });
                                    }}
                                    className={`px-2.5 py-1 rounded-md transition-colors ${
                                      stageViewMode === 'semester'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-purple-600'
                                    }`}
                                  >
                                    Semester-wise
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {stageOptions.map((stg) => {
                                const isSelected = data.education_details?.study_stage_value === stg.id;
                                return (
                                  <button
                                    key={stg.id}
                                    type="button"
                                    onClick={() => updateEducation({ study_stage_value: stg.id })}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                      isSelected
                                        ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                                    }`}
                                  >
                                    {stg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {data.education_details?.education_status === 'completed' && (
                        <div className="space-y-1.5">
                          <SearchableSelect
                            label="Graduation / Passing Year"
                            required
                            placeholder="Select graduation year..."
                            searchPlaceholder="Search passing year..."
                            value={data.education_details?.graduation_year || ''}
                            options={GRADUATION_YEARS.map((yr) => ({
                              value: yr,
                              label: yr,
                              icon: <Calendar className="w-4 h-4 text-purple-600" />,
                            }))}
                            onChange={(newYear) => updateEducation({ graduation_year: newYear })}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* --- Step 2: Expandable Interests & Exploration --- */}
              {step === 2 && (
                <div className="max-w-2xl mx-auto text-left space-y-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                      What are you into?
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base">
                      Pick areas you enjoy or are curious about — we'll tailor your personalized career guidance accordingly.
                    </p>
                  </div>

                  {/* Section B: Exploration Option */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={toggleExploring}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExploring();
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      data.interest_details?.interest_exploration_status === 'exploring'
                        ? 'border-purple-600 bg-purple-50/80 shadow-sm ring-1 ring-purple-600/30'
                        : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          data.interest_details?.interest_exploration_status === 'exploring'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          I'm still exploring my interests
                        </h3>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                          That's okay! Help me discover what I might enjoy.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        data.interest_details?.interest_exploration_status === 'exploring'
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {data.interest_details?.interest_exploration_status === 'exploring' && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      <span className="bg-white px-3">Or choose specific areas</span>
                    </div>
                  </div>

                  {/* Section A: 10 Expandable Interest Categories */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {INTEREST_CATEGORIES.map((cat) => {
                        const isCatSelected = data.interest_details?.interest_categories.includes(cat.id);
                        const isExpanded = expandedCategory === cat.id;
                        const selectedSubs = (data.interest_details?.specific_interests || []).filter((s) =>
                          cat.subInterests.includes(s)
                        );
                        const subCount = selectedSubs.length;

                        return (
                          <div
                            key={cat.id}
                            className={`rounded-2xl border-2 transition-all overflow-hidden ${
                              isCatSelected
                                ? 'border-purple-600 bg-white ring-1 ring-purple-600/30 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-purple-300'
                            }`}
                          >
                            {/* Card Header Button */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleCategory(cat.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleCategory(cat.id);
                                }
                              }}
                              className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                                isCatSelected ? 'bg-purple-50/60' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate pr-2">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    isCatSelected
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'bg-purple-50 text-purple-600'
                                  }`}
                                >
                                  {INTEREST_OPTIONS.find((o) => o.value === cat.label)?.icon}
                                </div>
                                <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                  {cat.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {subCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-bold">
                                    {subCount}
                                  </span>
                                )}
                                {isCatSelected && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedCategory(isExpanded ? null : cat.id);
                                    }}
                                    className="p-1 rounded-full text-purple-600 hover:bg-purple-100 transition-colors"
                                    title={isExpanded ? 'Collapse sub-interests' : 'Expand sub-interests'}
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expandable Sub-interests Drawer */}
                            {isCatSelected && isExpanded && (
                              <div className="p-3 bg-slate-50/70 border-t border-purple-100 animate-in fade-in duration-200">
                                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                  Select sub-interests:
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {cat.subInterests.map((sub) => {
                                    const isSubSelected = data.interest_details?.specific_interests.includes(sub);
                                    return (
                                      <button
                                        key={sub}
                                        type="button"
                                        onClick={() => toggleSubInterest(sub)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                          isSubSelected
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                                        }`}
                                      >
                                        {sub}
                                        {isSubSelected && <Check className="w-3 h-3 inline ml-1" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section C: Additional Interests */}
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Anything else you enjoy doing? <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={data.interest_details?.additional_interests ?? data.strengthsNote ?? ''}
                      onChange={(e) => updateAdditionalInterests(e.target.value)}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="For example, I enjoy solving puzzles, organizing events, helping people, or exploring new technologies."
                    />
                  </div>
                </div>
              )}

              {/* --- Step 3: Skills & Experience --- */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 text-purple-600 bg-purple-50 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3 border border-purple-100 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" /> Skills & Practical Background
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                      What skills and experience do you have?
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                      Tell us what you can do and what you have worked on. We'll use this information to identify suitable career paths and build your personalized roadmap.
                    </p>
                  </div>

                  {/* Section 1: Skills Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          1. Select your skills <span className="text-slate-400 font-normal text-xs">(optional)</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Click any category below to select skills or type your own custom skills.
                        </p>
                      </div>
                    </div>

                    {/* Category Grid with Dynamic Selected Counts on ALL 8 Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {SKILL_CATEGORIES.map((cat) => {
                        const isExpanded = expandedSkillCategory === cat.id;
                        const selectedInCat = (data.skills_and_experience?.skills || []).filter(
                          (s) => s.category === cat.id
                        );
                        return (
                          <div
                            key={cat.id}
                            className={`border rounded-2xl transition-all ${
                              selectedInCat.length > 0
                                ? 'border-purple-300 bg-purple-50/30'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedSkillCategory(isExpanded ? null : cat.id)}
                              className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-purple-500/40 rounded-2xl"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    selectedInCat.length > 0
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {renderCategoryIcon(cat.iconName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <p className="font-bold text-slate-800 text-xs sm:text-sm leading-snug truncate">
                                      {cat.label}
                                    </p>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 transition-colors ${
                                        selectedInCat.length > 0
                                          ? 'bg-purple-600 text-white shadow-xs'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {selectedInCat.length}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    {selectedInCat.length > 0
                                      ? `${selectedInCat.length} selected`
                                      : '0 selected · Click to browse'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-slate-400 pl-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 transition-transform" />
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expandable Drawer */}
                    {expandedSkillCategory && (() => {
                      const activeCat = SKILL_CATEGORIES.find((c) => c.id === expandedSkillCategory);
                      if (!activeCat) return null;
                      const currentSkills = data.skills_and_experience?.skills || [];
                      return (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                {renderCategoryIcon(activeCat.iconName)}
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm">{activeCat.label} Skills</h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedSkillCategory(null)}
                              className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                            >
                              Close <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {activeCat.skills.map((skillName) => {
                              const isSelected = currentSkills.some(
                                (s) => s.name.toLowerCase() === skillName.toLowerCase()
                              );
                              return (
                                <button
                                  key={skillName}
                                  type="button"
                                  onClick={() => toggleSkill(activeCat.id, skillName)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                    isSelected
                                      ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                                  }`}
                                >
                                  {skillName}
                                  {isSelected && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom Skill Input in Drawer */}
                          <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                            <input
                              type="text"
                              value={customSkillInput[activeCat.id] || ''}
                              onChange={(e) => setCustomSkillInput((prev) => ({ ...prev, [activeCat.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomSkill(activeCat.id);
                                }
                              }}
                              placeholder={`Add custom ${activeCat.label.toLowerCase()} skill...`}
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomSkill(activeCat.id)}
                              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Active Skills Tray with Individual Removal, Clear All & Quick Custom Skill */}
                    {data.skills_and_experience && data.skills_and_experience.skills.length > 0 && (
                      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                              Active Skills Tray ({data.skills_and_experience.skills.length})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearAllSkills}
                            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Clear All
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {data.skills_and_experience.skills.map((s) => {
                            const catObj = SKILL_CATEGORIES.find((c) => c.id === s.category);
                            const catLabel = catObj?.label || (s.is_custom ? 'Custom' : 'Skill');
                            return (
                              <span
                                key={s.name}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-purple-200 text-purple-900 shadow-xs"
                              >
                                <span>{s.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100/80 text-purple-700 font-medium">
                                  {catLabel}
                                </span>
                                {s.proficiency && (
                                  <span className="text-[10px] text-purple-500 font-normal">
                                    · {s.proficiency}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(s.name)}
                                  className="text-slate-400 hover:text-red-600 transition-colors ml-0.5"
                                  aria-label={`Remove ${s.name}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        {/* Direct Custom Skill Input right in Active Skills Tray */}
                        <div className="pt-2 border-t border-purple-200/60 flex items-center gap-2">
                          <input
                            type="text"
                            value={trayCustomSkill}
                            onChange={(e) => setTrayCustomSkill(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTrayCustomSkill();
                              }
                            }}
                            placeholder="Can't find your skill? Type custom skill name..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 text-xs text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddTrayCustomSkill}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Custom Skill
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Unsure option - Does NOT block progress and users can still select skills */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setNotSureSkills((prev) => !prev)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          notSureSkills
                            ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600/30'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              notSureSkills ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <HelpCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold">I'm not sure what my skills are yet</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              That's completely fine! Skills are optional. Our career counselor will evaluate your natural strengths and aptitudes during your assessment. You can proceed directly or still explore and select any skills below.
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                            notSureSkills ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {notSureSkills && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Skill Proficiency */}
                  <div className="pt-6 border-t border-slate-200/80">
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-slate-900">
                        2. Skill Proficiency <span className="text-slate-400 font-normal text-xs">(optional)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Rate your current confidence in your selected skills, or skip this section.
                      </p>
                    </div>

                    {(!data.skills_and_experience?.skills || data.skills_and_experience.skills.length === 0) ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        Select one or more skills above to rate your proficiency, or proceed to experience.
                      </div>
                    ) : (
                      <div className="space-y-3 mt-3">
                        {data.skills_and_experience.skills.map((skill) => {
                          return (
                            <div
                              key={skill.name}
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{skill.name}</span>
                                  {skill.is_custom && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-600 font-semibold">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {PROFICIENCY_OPTIONS.find((p) => p.id === skill.proficiency)?.desc || 'Select proficiency'}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-1.5 shrink-0">
                                {PROFICIENCY_OPTIONS.map((opt) => {
                                  const isSelected = skill.proficiency === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => setSkillProficiency(skill.name, opt.id)}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                        isSelected
                                          ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Experience Types */}
                  <div className="pt-6 border-t border-slate-200/80">
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        3. Practical Experience Types <span className="text-purple-600">*</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select all that describe your journey. If you have no past projects or jobs, select "No practical experience".
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {EXPERIENCE_TYPE_OPTIONS.map((expOpt) => {
                        const isSelected = (data.skills_and_experience?.experience_types || []).includes(expOpt.id);
                        return (
                          <button
                            key={expOpt.id}
                            type="button"
                            onClick={() => handleToggleExperienceType(expOpt.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600/30'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{expOpt.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                                  {expOpt.label}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                                    isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {expOpt.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 4: Dynamic Experience Details Forms */}
                  {!(data.skills_and_experience?.experience_types || []).includes('no_experience') &&
                    (data.skills_and_experience?.experience_types || []).length > 0 && (
                      <div className="pt-6 border-t border-slate-200/80">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              4. Project & Work Details <span className="text-slate-400 font-normal text-xs">(optional)</span>
                            </h3>
                            <p className="text-xs text-slate-500">
                              Add any projects, internships, or jobs you'd like us to factor in.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddExperienceItem}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Project / Role
                          </button>
                        </div>

                        {(data.skills_and_experience?.experiences || []).length === 0 ? (
                          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                            <p className="text-xs font-medium text-slate-600 mb-2">
                              No projects or roles added yet.
                            </p>
                            <button
                              type="button"
                              onClick={handleAddExperienceItem}
                              className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              + Add your first project or experience
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {data.skills_and_experience?.experiences.map((exp, idx) => {
                              const config = getExperienceTypeConfig(exp.type);
                              const validTypes = (data.skills_and_experience?.experience_types || []).filter(
                                (t) => t !== 'no_experience'
                              );
                              return (
                                <div
                                  key={exp.id}
                                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 relative space-y-3"
                                >
                                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                                      Item #{idx + 1} · {EXPERIENCE_TYPE_OPTIONS.find((o) => o.id === exp.type)?.label || exp.type}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExperienceItem(exp.id)}
                                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                                      title="Delete record"
                                      aria-label={`Delete record ${idx + 1}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Experience Type
                                      </label>
                                      <select
                                        value={exp.type}
                                        onChange={(e) =>
                                          handleUpdateExperienceItem(exp.id, {
                                            type: e.target.value as ExperienceType,
                                          })
                                        }
                                        className={inputClass}
                                      >
                                        {validTypes.map((typeKey) => {
                                          const opt = EXPERIENCE_TYPE_OPTIONS.find((o) => o.id === typeKey);
                                          return (
                                            <option key={typeKey} value={typeKey}>
                                              {opt?.label || typeKey}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {config.titleLabel} <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={exp.title}
                                        onChange={(e) => handleUpdateExperienceItem(exp.id, { title: e.target.value })}
                                        placeholder={config.titlePlaceholder}
                                        className={inputClass}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {config.orgLabel} <span className="text-slate-400 font-normal">(optional)</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={exp.organization || ''}
                                        onChange={(e) =>
                                          handleUpdateExperienceItem(exp.id, { organization: e.target.value })
                                        }
                                        placeholder={config.orgPlaceholder}
                                        className={inputClass}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {config.roleLabel} <span className="text-slate-400 font-normal">(optional)</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={exp.role || ''}
                                        onChange={(e) => handleUpdateExperienceItem(exp.id, { role: e.target.value })}
                                        placeholder={config.rolePlaceholder}
                                        className={inputClass}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {config.durationLabel} <span className="text-slate-400 font-normal">(optional)</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={exp.duration || ''}
                                        onChange={(e) =>
                                          handleUpdateExperienceItem(exp.id, { duration: e.target.value })
                                        }
                                        placeholder={config.durationPlaceholder}
                                        className={inputClass}
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {config.techLabel} <span className="text-slate-400 font-normal">(optional)</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={(exp.technologies || []).join(', ')}
                                        onChange={(e) => {
                                          const tags = e.target.value
                                            .split(',')
                                            .map((t) => t.trim())
                                            .filter(Boolean);
                                          handleUpdateExperienceItem(exp.id, { technologies: tags });
                                        }}
                                        placeholder={config.techPlaceholder}
                                        className={inputClass}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      {config.descLabel} <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={exp.description || ''}
                                      onChange={(e) =>
                                        handleUpdateExperienceItem(exp.id, { description: e.target.value })
                                      }
                                      placeholder={config.descPlaceholder}
                                      className={`${inputClass} resize-none`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Section 5: Professional Experience Duration with Distinction Guidance */}
                  <div className="pt-6 border-t border-slate-200/80">
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        5. Total Professional Employment Experience <span className="text-purple-600">*</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Academic coursework and personal side projects do not count as corporate or salaried employment.
                      </p>
                    </div>

                    {/* Contextual Guidance Callout */}
                    {(() => {
                      const types = data.skills_and_experience?.experience_types || [];
                      const hasEmployment = types.some((t) => ['full_time', 'part_time', 'freelancing'].includes(t));
                      const hasInternship = types.includes('internship');
                      const onlyAcademicOrPersonal =
                        types.length > 0 &&
                        types.every((t) => ['academic_projects', 'personal_projects', 'volunteering', 'other'].includes(t));

                      if (onlyAcademicOrPersonal) {
                        return (
                          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 mb-3 text-left">
                            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs mb-1">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Academic & Personal Projects
                            </div>
                            <p className="text-xs text-purple-950/80 leading-relaxed">
                              Academic coursework and personal builds demonstrate practical capability, but do <strong>not</strong> count as corporate or salaried employment. We have preset this to <strong>"No professional experience"</strong>.
                            </p>
                          </div>
                        );
                      }

                      if (hasInternship && !hasEmployment) {
                        return (
                          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 mb-3 text-left">
                            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs mb-1">
                              <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Internship Distinction
                            </div>
                            <p className="text-xs text-indigo-950/80 leading-relaxed">
                              Internships are supervised industry training stints. Unless you held regular salaried employment, you may select <strong>"No professional experience"</strong> or select the specific duration of your internship.
                            </p>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {PROFESSIONAL_DURATION_OPTIONS.map((durOpt) => {
                        const isSelected = data.skills_and_experience?.professional_duration === durOpt.id;
                        return (
                          <button
                            key={durOpt.id}
                            type="button"
                            onClick={() => handleSetProfessionalDuration(durOpt.id)}
                            className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all text-center ${
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                            }`}
                          >
                            {durOpt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- Step 4: Preferences (for Discovery) OR Target & Time (for other modes) --- */}
              {step === 4 && (
                <div>
                  {(data.career_mode === 'career_discovery' || data.path === 'not_sure') ? (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {/* Step Header */}
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-1.5 text-purple-600 bg-purple-50 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3 border border-purple-100 shadow-xs">
                          <Compass className="w-3.5 h-3.5" /> Career Discovery Preferences
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                          Let's understand what matters to you.
                        </h1>
                        <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
                          You don't need to have a career in mind. Tell us what you expect from your future, and we'll help you discover suitable career paths.
                        </p>
                      </div>

                      {/* Section 1: Career Motivation */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                            1. What would you like to achieve in your career? <span className="text-purple-600">*</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Select all that apply. Choose the primary outcomes guiding your future.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {CAREER_MOTIVATIONS.map((opt) => {
                            const isSelected = (data.career_discovery_preferences?.career_motivations || []).includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleCareerMotivation(opt.id)}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600/30'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {renderPreferenceIcon(opt.iconName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className={`font-bold text-xs sm:text-sm leading-snug ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                                      {opt.label}
                                    </p>
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                                        isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                    {opt.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: Career Priorities */}
                      <div className="pt-6 border-t border-slate-200/80 space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                            2. What matters most to you in a job? <span className="text-slate-400 font-normal text-xs">(optional)</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Select any factors that matter to your job satisfaction and fulfillment.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {CAREER_PRIORITIES.map((opt) => {
                            const isSelected = (data.career_discovery_preferences?.career_priorities || []).includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleCareerPriority(opt.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/40'
                                }`}
                              >
                                <span className={isSelected ? 'text-white' : 'text-purple-600'}>
                                  {renderPreferenceIcon(opt.iconName)}
                                </span>
                                <span>{opt.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 3: Preferred Work Environment */}
                      <div className="pt-6 border-t border-slate-200/80 space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                            3. Where would you prefer to work? <span className="text-purple-600">*</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Select your primary work setting preference (choose one).
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {WORK_ENVIRONMENTS.map((opt) => {
                            const isSelected = data.career_discovery_preferences?.preferred_work_environment === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setWorkEnvironment(opt.id)}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600/30'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {renderPreferenceIcon(opt.iconName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className={`font-bold text-xs sm:text-sm leading-snug ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                                      {opt.label}
                                    </p>
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                                        isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                    {opt.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 4: Learning Commitment */}
                      <div className="pt-6 border-t border-slate-200/80 space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                            4. How much time can you dedicate to learning? <span className="text-purple-600">*</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Be realistic with your schedule so our AI can pace your preparation roadmap (choose one).
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {LEARNING_COMMITMENTS.map((opt) => {
                            const isSelected = data.career_discovery_preferences?.daily_learning_commitment === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setLearningCommitment(opt.id)}
                                className={`p-3.5 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600/30'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                                    {opt.label}
                                  </span>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                                      isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 5: Career Timeline */}
                      <div className="pt-6 border-t border-slate-200/80 space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                            5. When would you like to start your career? <span className="text-purple-600">*</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Your timeframe helps us balance fast-track job readiness with deep skill foundations (choose one).
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {CAREER_TIMELINES.map((opt) => {
                            const isSelected = data.career_discovery_preferences?.career_timeline === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCareerTimeline(opt.id)}
                                className={`p-3.5 rounded-2xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600/30'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                                    {opt.label}
                                  </span>
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                                      isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Target & time</h1>
                        <p className="text-slate-500">This shapes how we pace your roadmap.</p>
                      </div>
                      <div className="space-y-4 max-w-md mx-auto">
                        <div className="space-y-2">
                          <label className="block text-[13px] font-semibold text-slate-700">
                            Target role or career <span className="text-slate-400 font-normal">(optional — leave blank if unsure)</span>
                          </label>
                          <input
                            value={data.targetRole}
                            onChange={(e) => update({ targetRole: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. Data Analyst, UX Designer"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-purple-500" /> How much time can you commit?
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {HOURS_OPTIONS.map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => update({ hoursPerWeek: h })}
                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                                  data.hoursPerWeek === h
                                    ? 'bg-purple-600 border-purple-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                                }`}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- Step 5 (0-indexed, 6th step): Multi-format Resume Upload --- */}
              {step === 5 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 text-purple-600 bg-purple-50 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-sm border border-purple-100">
                      <Sparkles className="w-3.5 h-3.5" /> Optional — but recommended
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Have a resume?</h1>
                    <p className="text-slate-500 max-w-lg mx-auto text-sm sm:text-base">
                      Upload your resume in PDF, Word (.docx), or (.doc) format up to 5 MB. We'll parse it with
                      AI and let you review and reconcile extracted skills and experiences with your profile.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-100">
                        <Target className="w-3.5 h-3.5" /> Sharper career match
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-100">
                        <FileText className="w-3.5 h-3.5" /> Auto-fills your skills
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-100">
                        <ShieldCheck className="w-3.5 h-3.5" /> Strict privacy & safety
                      </span>
                    </div>
                  </div>

                  {/* Hidden standard file input supporting PDF, DOCX, DOC */}
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={handleFileInput}
                  />

                  {/* STATE 4: SUCCESS (parsedData exists and not currently uploading/processing) */}
                  {parsedData && uploadStatus !== 'uploading' && uploadStatus !== 'processing' ? (
                    <div className="max-w-xl mx-auto space-y-4">
                      {/* Success banner */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center shadow-xs">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 mx-auto shadow-xs">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-950 mb-1">Resume Parsed Successfully!</h3>
                        <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
                          We extracted and analyzed your resume using AI. You can review and enrich your profile or finish now.
                        </p>
                      </div>

                      {/* Enrichment note if applied */}
                      {enrichmentSuccessNote && (
                        <div className="bg-purple-50 border border-purple-200 text-purple-800 text-xs sm:text-sm font-semibold p-3.5 rounded-2xl flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>{enrichmentSuccessNote}</span>
                        </div>
                      )}

                      {/* Extracted overview card */}
                      <div className="border border-slate-200 bg-white rounded-3xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase">
                              {parsedData.metadata?.file_type || 'PDF'}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold text-slate-900 text-sm truncate max-w-[220px] sm:max-w-[300px]">
                                {file?.name || parsedData.metadata?.filename || 'Uploaded Resume'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • ` : ''}
                                {parsedData.metadata?.skills_count || (parsedData.skills?.length ?? 0)} skills found
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                              title="Replace file"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={removeResume}
                              className="text-xs font-semibold text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Extracted statistics */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-base font-extrabold text-slate-900 block">
                              {parsedData.metadata?.skills_count || (parsedData.skills?.length ?? 0)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">Skills Identified</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-base font-extrabold text-slate-900 block">
                              {parsedData.metadata?.experience_count || (parsedData.experience?.length ?? 0)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">Work Roles</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-base font-extrabold text-slate-900 block">
                              {parsedData.metadata?.projects_count || (parsedData.projects?.length ?? 0)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">Projects</span>
                          </div>
                        </div>

                        {/* Extracted Skills Preview */}
                        {parsedData.skills && parsedData.skills.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700">Skills Preview:</span>
                              <span className="text-slate-400 font-medium">Top extracted items</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {parsedData.skills.slice(0, 8).map((s: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-purple-50 text-purple-700 font-medium px-2.5 py-1 rounded-full border border-purple-100/80"
                                >
                                  {s}
                                </span>
                              ))}
                              {parsedData.skills.length > 8 && (
                                <span className="text-xs text-slate-400 font-medium self-center pl-1">
                                  +{parsedData.skills.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interactive Review Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setIsReviewModalOpen(true)}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            <Sparkles className="w-4 h-4" /> Review & Enrich Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : uploadStatus === 'uploading' ? (
                    /* STATE 2: UPLOADING */
                    <div className="max-w-xl mx-auto border border-slate-200 bg-white rounded-3xl p-8 shadow-xs space-y-5 text-center">
                      <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                        <UploadCloud className="w-7 h-7 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Uploading Resume...</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {file?.name} ({((file?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                          <span>Uploading to secure counselor engine</span>
                          <span>{uploadProgress}%</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={cancelUpload}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        Cancel Upload
                      </button>
                    </div>
                  ) : uploadStatus === 'processing' ? (
                    /* STATE 3: PROCESSING (4 meaningful stages) */
                    <div className="max-w-xl mx-auto border border-slate-200 bg-white rounded-3xl p-8 shadow-xs space-y-6">
                      <div className="text-center">
                        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-7 h-7 animate-pulse text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Analyzing with AI Engine</h3>
                        <p className="text-xs text-slate-500">
                          Extracting skills, qualifications, and practical experience...
                        </p>
                      </div>

                      {/* Stepper with 4 stages */}
                      <div className="space-y-3 max-w-md mx-auto">
                        {[
                          { stage: 1, title: 'Reading resume document & structure' },
                          { stage: 2, title: 'Extracting structured information with AI' },
                          { stage: 3, title: 'Identifying skills and experience records' },
                          { stage: 4, title: 'Preparing profile reconciliation & enrichment' },
                        ].map((item) => {
                          const isDone = processingStage > item.stage;
                          const isCurrent = processingStage === item.stage;
                          return (
                            <div
                              key={item.stage}
                              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                isDone
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                  : isCurrent
                                  ? 'bg-purple-50 border-purple-200 text-purple-900 ring-1 ring-purple-600/30'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-purple-600 text-white animate-spin'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : isCurrent ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                  item.stage
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-semibold">{item.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : file && uploadStatus !== 'error' ? (
                    /* FILE SELECTED, READY TO ANALYZE */
                    <div className="w-full max-w-xl mx-auto space-y-4">
                      <div className="border border-slate-200 rounded-3xl p-5 flex items-center justify-between bg-slate-50 shadow-xs">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{file.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for AI analysis
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Replace file"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={removeResume}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={uploadResume}
                        disabled={resumeLoading}
                        className="w-full bg-[#6D28D9] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-purple-600/20 hover:bg-[#5B21B6] active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" /> Analyze my resume with AI
                      </button>
                    </div>
                  ) : (
                    /* STATE 1: INITIAL / EMPTY DROPZONE */
                    <div className="w-full max-w-xl mx-auto space-y-4">
                      <div
                        className={`w-full border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isDragging
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/20'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center text-purple-600 mb-4 shadow-xs">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Click or drag your resume here</h3>
                        <p className="text-slate-500 mb-4 text-xs sm:text-sm max-w-xs">
                          Supported formats: PDF (.pdf), Word (.docx, .doc) • Max 5 MB
                        </p>
                        <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-full text-slate-700 font-semibold shadow-xs pointer-events-none text-xs sm:text-sm hover:border-purple-300">
                          Select a file
                        </div>
                      </div>

                      {/* STATE 5: ERROR MESSAGE */}
                      {resumeError && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-2">
                          <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Upload Issue</span>
                          </div>
                          <p className="text-xs text-rose-600 font-medium max-w-md mx-auto">{resumeError}</p>
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setResumeError(null);
                                setUploadStatus('idle');
                                fileInputRef.current?.click();
                              }}
                              className="text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Try different file
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Resume Review Modal */}
                  {parsedData && (
                    <ResumeReviewModal
                      isOpen={isReviewModalOpen}
                      onClose={() => setIsReviewModalOpen(false)}
                      extractedResume={parsedData}
                      onboardingEdu={data.education_details}
                      onboardingSkills={data.skills_and_experience}
                      onApplyEnrichment={handleApplyEnrichment}
                    />
                  )}
                </div>
              )}
            </div>

            {saveError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mt-6 text-sm font-medium border border-red-100 text-center">
                {saveError}
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors ${
                  step === 0 ? 'invisible' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={(step === 0 && !isStep0Valid) || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid) || (step === 4 && !isStep4Valid)}
                  className="bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] active:scale-[0.98] transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#6D28D9] disabled:shadow-none"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] active:scale-[0.98] transition-all shadow-md shadow-purple-600/20 flex items-center gap-2"
                >
                  {parsedData ? 'Finish & View Careers' : 'Skip & finish'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {step === 0 && (
              <p className="text-center mt-6">
                <Link to="/" className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                  Back to home
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
