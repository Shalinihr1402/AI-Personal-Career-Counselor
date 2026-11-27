import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Target,
  Lightbulb,
  Code,
  Sliders,
  FileText,
  Check,
  Home,
  Rocket,
  BookOpen,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import {
  PATH_TO_CAREER_MODE,
  detectUserPersona,
  type OnboardingRecord,
} from '../lib/onboarding';
import {
  loadUserDraft,
  loadUserStep,
  saveUserDraft,
  saveUserStep,
  clearUserDraft,
} from '../lib/onboardingDraft';
import { Stage1Purpose } from '../components/onboarding/Stage1Purpose';
import { Stage2Education } from '../components/onboarding/Stage2Education';
import { Stage3Interests } from '../components/onboarding/Stage3Interests';
import { Stage4SkillsProjects } from '../components/onboarding/Stage4SkillsProjects';
import { Stage5PrioritiesConstraints } from '../components/onboarding/Stage5PrioritiesConstraints';
import { Stage6ResumeReview } from '../components/onboarding/Stage6ResumeReview';

const STEPS = [
  {
    id: 0,
    number: '1',
    label: '1. Your Goal',
    subtitle: 'Career purpose & expectations',
    icon: Target,
  },
  {
    id: 1,
    number: '2',
    label: '2. Education & Learning',
    subtitle: 'Your academic journey & skills',
    icon: GraduationCap,
  },
  {
    id: 2,
    number: '3',
    label: '3. Interests & Curiosity',
    subtitle: 'What excites and engages you',
    icon: Lightbulb,
  },
  {
    id: 3,
    number: '4',
    label: '4. Skills & Projects',
    subtitle: 'Your skills, projects & experience',
    icon: Code,
  },
  {
    id: 4,
    number: '5',
    label: '5. Priorities & Constraints',
    subtitle: 'Career goals, work & practical needs',
    icon: Sliders,
  },
  {
    id: 5,
    number: '6',
    label: '6. Review & Confirm',
    subtitle: 'Verify your profile & proceed',
    icon: FileText,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, saveProfile } = useProfile();

  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<Partial<OnboardingRecord>>({
    path: 'not_sure',
    career_mode: 'career_discovery',
    interests: [],
    education_details: {
      education_level: 'undergraduate',
      education_status: 'currently_studying',
      degree: '',
      specialization: '',
      institution: '',
      study_stage_type: 'year',
      study_stage_value: '1st Year',
      academic_strengths: [],
      subjects_enjoyed: [],
      certifications_and_courses: [],
    },
    interest_details: {
      interest_categories: [],
      specific_interests: [],
      additional_interests: '',
      interest_exploration_status: 'focused',
      problem_solving_preference: [],
      curiosity_topics: [],
      independent_activities: '',
    },
    skills_and_experience: {
      skills: [],
      custom_skills: [],
      experience_types: [],
      experiences: [],
      structured_projects: [],
      professional_duration: 'no_experience',
      has_no_standalone_projects: false,
      academic_coursework_highlights: '',
    },
    career_preferences: {
      career_priorities: [],
      preferred_work_environment: ['hybrid'],
      practical_constraints: {
        earning_urgency: 'moderate_6_to_12_months',
        relocation_flexibility: 'open_to_relocation',
      },
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Restore saved profile or draft on mount
  useEffect(() => {
    if (user?.id) {
      const draft = loadUserDraft(user.id);
      const savedStep = loadUserStep(user.id);

      if (draft && Object.keys(draft).length > 0) {
        setData((prev) => ({ ...prev, ...draft }));
      } else if (profile && Object.keys(profile).length > 0) {
        setData((prev) => ({
          ...prev,
          path: profile.path || prev.path,
          career_mode: profile.career_mode || (profile.path ? PATH_TO_CAREER_MODE[profile.path] : prev.career_mode),
          career_growth_subtype: profile.career_growth_subtype || prev.career_growth_subtype,
          user_persona: profile.user_persona || prev.user_persona,
          college: profile.college || prev.college,
          course: profile.course || prev.course,
          year: profile.year || prev.year,
          interests: profile.interests || prev.interests,
          strengthsNote: profile.strengthsNote || prev.strengthsNote,
          targetRole: profile.targetRole || prev.targetRole,
          hoursPerWeek: profile.hoursPerWeek || prev.hoursPerWeek,
          resume: profile.resume || prev.resume,
          education_details: profile.education_details || prev.education_details,
          interest_details: profile.interest_details || prev.interest_details,
          skills_and_experience: profile.skills_and_experience || prev.skills_and_experience,
          career_preferences: profile.career_preferences || prev.career_preferences,
          career_discovery_preferences: profile.career_discovery_preferences || prev.career_discovery_preferences,
        }));
      }

      if (typeof savedStep === 'number' && savedStep >= 0 && savedStep < STEPS.length) {
        setStep(savedStep);
      }
    }
  }, [user?.id, profile]);

  // Persist draft on changes
  useEffect(() => {
    if (user?.id && data) {
      saveUserDraft(user.id, data);
      saveUserStep(user.id, step);
    }
  }, [user?.id, data, step]);

  const handleChange = (patch: Partial<OnboardingRecord>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setSaveError(null);
  };

  // Step Validations
  const isStep0Valid = useMemo(() => {
    const mode = data.career_mode || (data.path ? PATH_TO_CAREER_MODE[data.path] : null);
    if (!mode) return false;
    if (mode === 'career_growth_transition') {
      return Boolean(data.career_growth_subtype);
    }
    return true;
  }, [data.career_mode, data.path, data.career_growth_subtype]);

  const isStep1Valid = useMemo(() => {
    const ed = data.education_details;
    if (!ed) return Boolean(data.course);
    if (!ed.education_level || !ed.education_status) return false;
    if (ed.education_level === 'sslc_10th') return true;
    if (ed.education_level === 'puc_12th') return Boolean(ed.specialization || ed.school_stream);
    return Boolean(ed.degree?.trim());
  }, [data.education_details, data.course]);

  const isStep2Valid = useMemo(() => {
    const ind = data.interest_details;
    if (!ind) return (data.interests || []).length > 0;
    if (ind.interest_exploration_status === 'exploring') return true;
    return (ind.interest_categories || []).length > 0;
  }, [data.interest_details, data.interests]);

  const isStep3Valid = useMemo(() => {
    const se = data.skills_and_experience;
    if (!se) return false;
    if ((se.skills || []).length > 0) return true;
    if (se.has_no_standalone_projects && se.academic_coursework_highlights?.trim()) return true;
    if (se.not_sure_skills) return true;
    return true;
  }, [data.skills_and_experience]);

  const isStep4Valid = useMemo(() => {
    return true;
  }, []);

  const isCurrentStepValid = useMemo(() => {
    switch (step) {
      case 0:
        return isStep0Valid;
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return isStep4Valid;
      case 5:
        return true;
      default:
        return true;
    }
  }, [step, isStep0Valid, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const finishOnboarding = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const activePersona = data.user_persona || detectUserPersona(data);
      const recordToSave: Partial<OnboardingRecord> = {
        ...data,
        user_persona: activePersona,
        career_mode: data.career_mode,
        career_growth_subtype: data.career_growth_subtype,
      };

      await saveProfile(recordToSave);

      if (user?.id) {
        clearUserDraft(user.id);
      }

      navigate('/assessment');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar initials
  const userInitials = useMemo(() => {
    const name = user?.user_metadata?.full_name || (profile as any)?.fullName;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return 'SH';
  }, [user, profile]);

  const completionPercent = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col font-sans text-[#172638] selection:bg-[#EAF5F4] selection:text-[#168C89]">
      {/* Top Application Header in Primary Navy */}
      <header className="bg-[#142B4A] border-b border-[#0E1F36] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Subtitle */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-xs group-hover:bg-white/15 transition-all">
              <GraduationCap className="w-5 h-5 text-[#168C89]" />
            </div>
            <div>
              <div className="text-white font-bold text-sm sm:text-base tracking-tight leading-tight flex items-center gap-1.5">
                <span>Personal Career Counselor</span>
              </div>
              <p className="text-[11px] text-teal-200/80 font-medium tracking-wide">
                AI-Powered Career Discovery
              </p>
            </div>
          </Link>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-200">
              <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link to="/careers" className="hover:text-white transition-colors flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" />
                <span>Career Paths</span>
              </Link>
              <Link to="/roadmap" className="hover:text-white transition-colors flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Roadmap</span>
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                type="button"
                aria-label="Notifications"
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 bg-[#168C89] rounded-full absolute top-1.5 right-1.5 ring-2 ring-[#142B4A]" />
              </button>

              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#EAF5F4] text-[#142B4A] font-bold text-xs flex items-center justify-center shadow-xs border border-white/30 cursor-pointer">
                {userInitials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] xl:grid-cols-[320px_1fr] gap-6 items-start">
          
          {/* Left Sidebar: Journey Stepper & Quote */}
          <aside className="space-y-5">
            {/* 1. Onboarding Journey Card */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#E2E8F0]">
              {/* Sidebar Header */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E2E8F0]">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5F4] text-[#168C89] flex items-center justify-center shrink-0 shadow-2xs border border-[#C5E6E4]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#172638] tracking-tight uppercase">
                    Onboarding Journey
                  </h2>
                  <p className="text-[11px] text-[#64748B] leading-snug">
                    Build your personalized profile in 6 simple steps.
                  </p>
                </div>
              </div>

              {/* 6-Step Vertical Progression List */}
              <div className="space-y-1.5 relative">
                {STEPS.map((s, idx) => {
                  const isActive = idx === step;
                  const isCompleted = idx < step;
                  const StepIcon = s.icon;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (idx <= step || isCurrentStepValid) {
                          setStep(idx);
                        }
                      }}
                      className={`transition-all rounded-xl ${
                        isActive
                          ? 'bg-[#142B4A] text-white p-3 shadow-xs'
                          : isCompleted
                          ? 'flex items-center gap-3 p-2.5 hover:bg-[#F8FAFC] cursor-pointer text-[#172638]'
                          : 'flex items-center gap-3 p-2.5 opacity-60 cursor-not-allowed text-[#64748B]'
                      }`}
                    >
                      {isActive ? (
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white">
                            <StepIcon className="w-4 h-4 text-[#168C89]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold tracking-tight text-white leading-tight">
                              {s.label}
                            </div>
                            <div className="text-[10px] text-teal-200/90 truncate leading-tight mt-0.5">
                              {s.subtitle}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-[#168C89] text-white shadow-2xs'
                                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <StepIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-[#172638] truncate leading-tight">
                              {s.label}
                            </div>
                            <div className="text-[10px] text-[#64748B] truncate leading-tight">
                              {s.subtitle}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Inspirational Quote Card in Subtle Teal */}
            <div className="bg-[#EAF5F4] rounded-2xl p-5 relative overflow-hidden border border-[#C5E6E4] hidden sm:block">
              <span className="font-serif text-[#168C89]/40 text-4xl leading-none font-bold block mb-1">
                “
              </span>
              <p className="text-xs text-[#172638] font-medium italic leading-relaxed relative z-10">
                A clear understanding of yourself is the first step to the right career.
              </p>
            </div>
          </aside>

          {/* Right Main Content Card */}
          <main className="bg-white rounded-2xl p-6 sm:p-9 shadow-xs border border-[#E2E8F0]">
            {/* Top Step Progress Bar Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-7 border-b border-[#E2E8F0]">
              {/* Left Step Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#142B4A] text-white text-xs font-semibold shadow-2xs shrink-0 self-start sm:self-auto">
                Step {step + 1} of {STEPS.length}
              </div>

              {/* 6-Segment Rounded Progress Bar */}
              <div className="flex-1 max-w-sm mx-0 sm:mx-4 flex items-center gap-1.5 w-full">
                {STEPS.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      idx <= step ? 'bg-[#168C89]' : 'bg-[#E2E8F0]'
                    }`}
                  />
                ))}
              </div>

              {/* Right Percentage Pill */}
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] text-xs font-bold shrink-0 self-start sm:self-auto">
                {completionPercent}% Complete
              </div>
            </div>

            {/* Dynamic Stage Render */}
            <div className="min-h-[420px]">
              {step === 0 && <Stage1Purpose data={data} onChange={handleChange} />}
              {step === 1 && <Stage2Education data={data} onChange={handleChange} />}
              {step === 2 && <Stage3Interests data={data} onChange={handleChange} />}
              {step === 3 && <Stage4SkillsProjects data={data} onChange={handleChange} />}
              {step === 4 && <Stage5PrioritiesConstraints data={data} onChange={handleChange} />}
              {step === 5 && (
                <Stage6ResumeReview
                  data={data}
                  onChange={handleChange}
                  saveError={saveError}
                />
              )}
            </div>

            {/* Bottom Navigation Action Buttons */}
            <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex items-center justify-between gap-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#172638] hover:bg-[#F8FAFC] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <Link
                  to="/"
                  className="text-xs font-semibold text-[#64748B] hover:text-[#142B4A] transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to home</span>
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!isCurrentStepValid}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#142B4A] text-white text-xs font-bold hover:bg-[#0E1F36] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishOnboarding}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#168C89] text-white text-xs font-bold hover:bg-[#116A68] active:scale-[0.98] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-100" />
                  <span>{isSaving ? 'Saving Profile...' : 'Finish & Start Assessment'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
