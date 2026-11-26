import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
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
  { id: 0, label: 'Purpose & Guidance', shortLabel: 'Purpose' },
  { id: 1, label: 'Education & Learning', shortLabel: 'Education' },
  { id: 2, label: 'Interests & Curiosity', shortLabel: 'Interests' },
  { id: 3, label: 'Skills & Projects', shortLabel: 'Skills & Projects' },
  { id: 4, label: 'Priorities & Constraints', shortLabel: 'Priorities' },
  { id: 5, label: 'Review & Submit', shortLabel: 'Review' },
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
    // Career planning does NOT force a targetRole if the student is exploratory or undecided
    return true;
  }, [data.career_mode, data.path, data.career_growth_subtype]);

  const isStep1Valid = useMemo(() => {
    const ed = data.education_details;
    if (!ed) return Boolean(data.course);
    if (!ed.education_level || !ed.education_status) return false;
    // Require degree selection unless 10th standard
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
    // Valid if user has declared skills, or toggled no projects, or has coursework highlights, or not_sure
    if ((se.skills || []).length > 0) return true;
    if (se.has_no_standalone_projects && se.academic_coursework_highlights?.trim()) return true;
    if (se.not_sure_skills) return true;
    return true; // Keep accessible so students without skills are not blocked
  }, [data.skills_and_experience]);

  const isStep4Valid = useMemo(() => {
    // Valid as long as step is reviewed
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

      // Navigate to assessment or dashboard
      navigate('/assessment');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight text-sm">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              AG
            </div>
            <span>Career Discovery</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-semibold">{STEPS[step].label}</span>
          </div>
        </div>

        {/* Clean Step Progress Indicator */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-6 gap-1 pb-2">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (idx <= step || isCurrentStepValid) {
                    setStep(idx);
                  }
                }}
                className={`group flex flex-col text-left py-1 cursor-pointer transition-all ${
                  idx === step
                    ? 'opacity-100'
                    : idx < step
                    ? 'opacity-80 hover:opacity-100'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className={`h-1.5 w-full rounded-full transition-all ${
                    idx === step
                      ? 'bg-slate-900'
                      : idx < step
                      ? 'bg-slate-400'
                      : 'bg-slate-200'
                  }`}
                />
                <span className="text-[10px] font-semibold text-slate-600 mt-1 truncate hidden sm:block">
                  {s.shortLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Form Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-10">
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

          {/* Navigation Action Buttons */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                to="/"
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                &larr; Back to home
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!isCurrentStepValid}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <span>{isSaving ? 'Saving Profile...' : 'Finish & Start Assessment'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
