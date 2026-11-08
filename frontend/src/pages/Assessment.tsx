import AppFooter from '../components/AppFooter';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft,
  AlertTriangle, RotateCcw, Compass, Mic, FileText,
  Lock, CheckCircle2, Check,
  Info, Users, Cpu, CheckSquare, Hammer, Search, Users2, User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import AppHeader from '../components/AppHeader';
import KnowMeSection from '../components/KnowMeSection';
import CounselorVoiceChat from '../components/CounselorVoiceChat';
import ProfileOverviewCard from '../components/assessment/ProfileOverviewCard';
import InterestIntelligenceCard from '../components/assessment/InterestIntelligenceCard';
import CompetencyEvidenceCard from '../components/assessment/CompetencyEvidenceCard';
import StatutoryPathwaysCard from '../components/assessment/StatutoryPathwaysCard';
import CareerMatchCard from '../components/assessment/CareerMatchCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { confirmCareerGoal } from '../lib/profile';
import { EMPTY_KNOW_ME, MAX_VALUES, SITUATION_QUESTIONS, type KnowMe } from '../lib/knowMe';
import {
  fetchQuestions, scoreAssessment,
  fetchAdaptiveQuestions, scoreAdaptiveAssessment, buildProfilePayload,
  WORK_STYLE_QUESTIONS,
  type ScenarioQuestion, type ScoreResult, type MatchResult, type CareerMatch,
  type AdaptiveQuestion, type AdaptiveScoreResult,
  type DiagnosticProfileData, type DiagnosticRecommendationResult,
} from '../lib/assessment';

type Phase =
  | 'loading' | 'intro' | 'quiz' | 'workstyle'
  | 'values' | 'strengths' | 'identity' | 'situation'
  | 'scoring' | 'counselor_diagnostic' | 'results' | 'error';

const STORAGE_ANSWERS_KEY = 'career_discovery_answers';
const STORAGE_INDEX_KEY = 'career_discovery_index';
const STORAGE_PHASE_KEY = 'career_discovery_phase';

const STAGE_LABELS: Record<string, { title: string; subtitle: string }> = {
  school_10th: {
    title: 'School Education • Class 8–10',
    subtitle: 'Age-appropriate exploratory scenarios designed to uncover natural inclinations without premature technical jargon.',
  },
  higher_secondary_12th: {
    title: 'Higher Secondary • Class 11–12',
    subtitle: 'Stream-calibrated scenarios balancing academic streams (PCM, PCB, Commerce, Arts) with competitive readiness.',
  },
  diploma_polytechnic: {
    title: 'Polytechnic & ITI Technical',
    subtitle: 'Applied engineering and practical trade scenarios evaluating hands-on technical problem solving.',
  },
  college_ug_pg: {
    title: 'Higher Education • Degree & Professional',
    subtitle: 'Domain competency scenarios evaluating production problem-solving, clinical empathy, or statutory compliance.',
  },
  career_transition: {
    title: 'Career Growth & Professional Transition',
    subtitle: 'Transferable skill scenarios focusing on portfolio demonstration and bridge competencies.',
  },
  general: {
    title: 'Comprehensive Career Discovery',
    subtitle: 'Holistic interest and competency evaluation mapped to 1,016 occupational pathways.',
  },
};

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
  competency_demonstration: {
    label: 'Competency Evaluation',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  practical_scenario: {
    label: 'Situational Judgment',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  interest_exploration: {
    label: 'Interest Discovery',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  workstyle_fit: {
    label: 'Workstyle Fit',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

/** The discovery journey as the student sees it (one entry per visible section). */
const SECTIONS: { id: Phase; label: string }[] = [
  { id: 'quiz', label: 'Interests' },
  { id: 'workstyle', label: 'Work style' },
  { id: 'values', label: 'Values' },
  { id: 'strengths', label: 'Strengths' },
  { id: 'identity', label: 'Inner drive' },
  { id: 'situation', label: 'Your situation' },
];

const SECTION_INTRO: Partial<Record<Phase, { title: string; subtitle: string }>> = {
  values: { title: 'What matters to you?', subtitle: 'The same job can feel great or awful depending on what you value.' },
  strengths: { title: 'Where you shine', subtitle: 'Your strengths point to careers where you’ll grow fastest.' },
  identity: { title: 'Your inner drive & identity', subtitle: 'Uncovering what you actually crave when social expectations and salary pressure are stripped away.' },
  situation: { title: 'Your situation', subtitle: 'So we recommend careers that work in real life, not just on paper.' },
};

const WORKSTYLE_META: Record<
  string,
  {
    subtitle: string;
    options: Record<
      string,
      {
        icon: React.ComponentType<{ className?: string }>;
        desc: string;
      }
    >;
  }
> = {
  people_vs_data: {
    subtitle: 'Human-centered engagement vs structured analytical focus.',
    options: {
      'Working with people': {
        icon: Users,
        desc: 'Thriving on active collaboration, empathy, mentoring, and direct interpersonal relationships.',
      },
      'Working with data or things': {
        icon: Cpu,
        desc: 'Thriving on quantitative logic, code, structured physical systems, and technical problem solving.',
      },
    },
  },
  structure_vs_ambiguity: {
    subtitle: 'Predictable operational processes vs exploratory latitude.',
    options: {
      'Clear structure and steps': {
        icon: CheckSquare,
        desc: 'Predictable roadmaps, well-defined standards, clear instructions, and organized quality.',
      },
      'Open-ended problems': {
        icon: Sparkles,
        desc: 'First-principles thinking, uncharted territory, creative flexibility, and solving ambiguity.',
      },
    },
  },
  build_vs_analyze: {
    subtitle: 'Tangible output delivery vs diagnostic investigation.',
    options: {
      'Build and make things': {
        icon: Hammer,
        desc: 'Hands-on creation, engineering systems, executing deliverables, and building real-world solutions.',
      },
      'Analyse and understand things': {
        icon: Search,
        desc: 'Root-cause diagnosis, quantitative modeling, evaluating trade-offs, and discovering underlying patterns.',
      },
    },
  },
  team_vs_solo: {
    subtitle: 'Social density and pairing preference in daily execution.',
    options: {
      'Closely with a team': {
        icon: Users2,
        desc: 'Frequent brainstorming, shared responsibility, cross-functional pairing, and team momentum.',
      },
      'Independently, on your own': {
        icon: User,
        desc: 'Deep uninterrupted focus blocks, high autonomy, self-directed research, and solo mastery.',
      },
    },
  },
};

function SectionStepper({ current }: { current: Phase }) {
  const idx = SECTIONS.findIndex((s) => s.id === current);
  return (
    <div className="mb-8" aria-label="Discovery progress">
      <ol className="flex items-center justify-between relative">
        {/* Background connecting track */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
        {/* Active progress fill line */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-violet-600 transition-all duration-500 ease-out -z-0"
          style={{
            width: idx <= 0 ? '0%' : `${(idx / (SECTIONS.length - 1)) * 100}%`,
          }}
        />

        {SECTIONS.map((s, i) => {
          const isCurrent = i === idx;
          const isPast = i < idx;
          return (
            <li key={s.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isCurrent
                    ? 'bg-white border-2 border-violet-600 text-violet-700 ring-4 ring-violet-100 shadow-xs'
                    : isPast
                    ? 'bg-violet-700 text-white shadow-2xs'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isPast ? <Check className="w-4 h-4 stroke-[2.5]" /> : i + 1}
              </div>
              <span
                className={`mt-2 text-xs transition-colors text-center hidden sm:block ${
                  isCurrent
                    ? 'text-violet-950 font-bold'
                    : isPast
                    ? 'text-slate-700 font-semibold'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
      {/* Mobile active label */}
      <div className="sm:hidden text-center mt-2">
        <span className="text-xs font-bold text-violet-900">
          Step {idx + 1} of {SECTIONS.length}: {SECTIONS[idx]?.label}
        </span>
      </div>
    </div>
  );
}

const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, assessment: saved, saveProfile, saveAssessment, refreshActiveGoal } = useProfile();

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<ScenarioQuestion[]>([]);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestion[]>([]);
  const [calibratedStage, setCalibratedStage] = useState<string>('general');
  const [adaptiveScore, setAdaptiveScore] = useState<AdaptiveScoreResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [workStyle, setWorkStyle] = useState<Record<string, string>>({});
  const [knowMe, setKnowMe] = useState<KnowMe>(() => ({ ...EMPTY_KNOW_ME, ...profile?.knowMe }));
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [resultsAt, setResultsAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticProfile, setDiagnosticProfile] = useState<DiagnosticProfileData | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [settingGoal, setSettingGoal] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [showLockNotice, setShowLockNotice] = useState(false);

  const isAssessmentComplete = Boolean(
    (saved?.matches && saved.matches.length > 0) || (score && match && (match.matches || []).length > 0)
  );
  const isQuizScored = Boolean(saved?.scores || score);

  const updateKnowMe = (patch: Partial<KnowMe>) => setKnowMe((k) => ({ ...k, ...patch }));

  const goToPhase = (p: Phase) => {
    setPhase(p);
    try {
      localStorage.setItem(STORAGE_PHASE_KEY, p);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (profile?.knowMe) {
      setKnowMe((k) => ({ ...k, ...profile.knowMe }));
    }
  }, [profile?.knowMe]);

  const restoreProgress = (totalQuestionsCount: number) => {
    try {
      const cachedAnswers = localStorage.getItem(STORAGE_ANSWERS_KEY);
      const cachedIndex = localStorage.getItem(STORAGE_INDEX_KEY);
      const cachedPhase = localStorage.getItem(STORAGE_PHASE_KEY) as Phase | null;
      let parsedAnswers: Record<string, string> = {};
      if (cachedAnswers) {
        const parsed = JSON.parse(cachedAnswers);
        if (parsed && typeof parsed === 'object') {
          parsedAnswers = parsed;
          setAnswers(parsed);
        }
      }

      const totalQ = totalQuestionsCount || 12;
      const answeredCount = Object.keys(parsedAnswers).length;

      if (cachedIndex) {
        const idx = parseInt(cachedIndex, 10);
        if (!isNaN(idx) && idx >= 0) {
          const maxIdx = Math.max(0, totalQ - 1);
          setCurrentQuestionIndex(Math.min(idx, maxIdx));
        }
      }

      const validPhases: Phase[] = ['intro', 'quiz', 'workstyle', 'values', 'strengths', 'identity', 'situation'];
      if (cachedPhase && validPhases.includes(cachedPhase)) {
        setPhase(cachedPhase);
      } else if (answeredCount >= totalQ) {
        setPhase('workstyle');
      } else if (answeredCount > 0) {
        setPhase('quiz');
      } else {
        setPhase('intro');
      }
    } catch {
      setPhase('intro');
    }
  };

  const recommendedCareersRef = useRef<HTMLDivElement>(null);
  const questionsLoadedRef = useRef(false);

  // Load questions calibrated to user's stage and restore state or saved results
  useEffect(() => {
    let cancelled = false;

    if (saved) {
      // Returning student: check if they completed diagnostic recommendations
      setScore({ code: saved.code, scores: saved.scores });
      setResultsAt(saved.createdAt);
      if (saved.adaptiveEvidence) {
        setAdaptiveScore(saved.adaptiveEvidence);
        if (saved.adaptiveEvidence.stage) {
          setCalibratedStage(saved.adaptiveEvidence.stage);
        }
      }
      if (saved.matches && saved.matches.length > 0) {
        setMatch({ source: saved.source, matches: saved.matches });
        setPhase('results');
      } else {
        // Assessment completed, proceed to AI Counselor diagnostic
        setPhase('counselor_diagnostic');
      }
      return;
    }

    if (questionsLoadedRef.current) return;

    const payload = buildProfilePayload(profile, knowMe);
    fetchAdaptiveQuestions(payload)
      .then((data) => {
        if (cancelled) return;
        questionsLoadedRef.current = true;
        setCalibratedStage(data.stage || 'general');
        const adaptiveList = data.questions || [];
        setAdaptiveQuestions(adaptiveList);
        setQuestions(
          adaptiveList.map((q) => ({
            id: q.id,
            scenario: q.prompt,
            options: q.options.map((opt) => ({
              id: opt.id,
              text: opt.text,
              fields: opt.occupational_fields,
            })),
          }))
        );

        // Attempt refresh recovery from localStorage
        restoreProgress(adaptiveList.length);
      })
      .catch(async () => {
        // Fallback to legacy endpoint if adaptive endpoint is unreachable
        try {
          const fallbackData = await fetchQuestions();
          if (cancelled) return;
          questionsLoadedRef.current = true;
          const fbQuestions = fallbackData.questions || [];
          setQuestions(fbQuestions);
          restoreProgress(fbQuestions.length);
        } catch (e: unknown) {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : 'Could not load the assessment.');
          goToPhase('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [saved, profile]);

  const initializedSavedRef = useRef(false);
  useEffect(() => {
    if (saved && !initializedSavedRef.current) {
      initializedSavedRef.current = true;
      setScore({ code: saved.code, scores: saved.scores });
      setMatch({ source: saved.source, matches: saved.matches });
      setResultsAt(saved.createdAt);
      setPhase('results');
    }
  }, [saved]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    const updated = { ...answers, [questionId]: optionId };
    setAnswers(updated);
    try {
      localStorage.setItem(STORAGE_ANSWERS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleGoToQuestion = (index: number) => {
    const maxIdx = Math.max(0, (questions.length || 12) - 1);
    const clamped = Math.max(0, Math.min(index, maxIdx));
    setCurrentQuestionIndex(clamped);
    try {
      localStorage.setItem(STORAGE_INDEX_KEY, clamped.toString());
    } catch {
      // Ignore storage errors
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    goToPhase('scoring');
    setError(null);
    setSaveWarning(null);
    let s: ScoreResult;
    let adaptiveRes: AdaptiveScoreResult | null = null;

    try {
      const payload = buildProfilePayload(profile, knowMe);
      adaptiveRes = await scoreAdaptiveAssessment(answers, payload);
      setAdaptiveScore(adaptiveRes);
      s = {
        scores: adaptiveRes.scores,
        code: adaptiveRes.code,
        top_fields: adaptiveRes.top_fields,
        field_scores: adaptiveRes.field_scores,
      };
    } catch {
      try {
        // Fallback to legacy scoring if adaptive endpoint fails
        s = await scoreAssessment(answers);
      } catch (fallbackErr: unknown) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Something went wrong. Is the backend running?');
        goToPhase('error');
        setSubmitting(false);
        return;
      }
    }

    setScore(s);
    setResultsAt(new Date().toISOString());
    setSubmitting(false);

    // Clear local storage cache upon successful completion of questionnaire
    try {
      localStorage.removeItem(STORAGE_ANSWERS_KEY);
      localStorage.removeItem(STORAGE_INDEX_KEY);
      localStorage.removeItem(STORAGE_PHASE_KEY);
    } catch {
      // Ignore
    }

    try {
      await saveProfile({ knowMe });
      await saveAssessment({
        answers,
        workStyle,
        knowMe,
        scores: s.scores,
        code: s.code,
        matches: [], // Career recommendations generated ONLY at the end of diagnostic conversation!
        source: 'ai',
        adaptiveEvidence: adaptiveRes,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not save preliminary assessment:', e);
    }

    // Automatically transition to the AI Diagnostic Counselor consultation!
    goToPhase('counselor_diagnostic');
  };

  const handleDiagnosticComplete = async (
    result: DiagnosticRecommendationResult,
    diagProfile: DiagnosticProfileData
  ) => {
    setDiagnosticProfile(diagProfile);
    const m: MatchResult = {
      source: (result.source as 'ai' | 'hybrid_vector' | 'rule') || 'ai',
      matches: result.matches,
    };
    setMatch(m);
    setResultsAt(new Date().toISOString());

    try {
      await saveAssessment({
        answers,
        workStyle,
        knowMe,
        scores: score?.scores || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
        code: score?.code || 'EAI',
        matches: result.matches,
        source: (result.source as 'ai' | 'hybrid_vector' | 'rule') || 'ai',
        adaptiveEvidence: adaptiveScore,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not save diagnostic matches:', e);
      setSaveWarning("Your results couldn't be saved to your permanent profile, but they are available for this session.");
    }

    goToPhase('results');
  };

  const setGoal = async (career: CareerMatch) => {
    if (!user) {
      setGoalError('Please sign in to confirm your career goal.');
      return;
    }
    setSettingGoal(career.title);
    setGoalError(null);
    try {
      const reason = career.why_it_fits?.trim() || 'Selected from career assessment recommendations';
      await confirmCareerGoal(
        user.id,
        career.title,
        career.field,
        reason,
      );
      await saveProfile({ targetRole: career.title, path: 'know_goal' });
      await refreshActiveGoal?.();
      navigate('/dashboard');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to confirm career goal:', err);
      setGoalError(
        err instanceof Error
          ? `Could not save your career goal: ${err.message}`
          : 'Could not save your career goal. Please try again.',
      );
    } finally {
      setSettingGoal(null);
    }
  };

  const restart = () => {
    setAnswers({});
    setWorkStyle({});
    setScore(null);
    setAdaptiveScore(null);
    setMatch(null);
    setResultsAt(null);
    setCurrentQuestionIndex(0);
    setError(null);
    setSaveWarning(null);
    setGoalError(null);
    try {
      localStorage.removeItem(STORAGE_ANSWERS_KEY);
      localStorage.removeItem(STORAGE_INDEX_KEY);
      localStorage.removeItem(STORAGE_PHASE_KEY);
    } catch {
      // Ignore
    }
    goToPhase('intro');
  };

  const sectionReady =
    phase === 'values' ? knowMe.values.length > 0
    : phase === 'strengths' ? knowMe.subjectsStrong.length > 0
    : phase === 'identity' ? Boolean(knowMe.equalSalaryChoice && knowMe.energySource)
    : phase === 'situation' ? SITUATION_QUESTIONS.every((q) => Boolean(knowMe[q.key]))
    : true;

  const NEXT_OF: Partial<Record<Phase, Phase>> = {
    values: 'strengths',
    strengths: 'identity',
    identity: 'situation',
  };
  const PREV_OF: Partial<Record<Phase, Phase>> = {
    values: 'workstyle',
    strengths: 'values',
    identity: 'strengths',
    situation: 'identity',
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAdaptive = adaptiveQuestions[currentQuestionIndex];
  const isCurrentAnswered = currentQuestion && Boolean(answers[currentQuestion.id]);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length || 12;
  const stageInfo = STAGE_LABELS[calibratedStage] || STAGE_LABELS.general;
  const categoryInfo = currentAdaptive ? CATEGORY_BADGES[currentAdaptive.category] : null;

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-sans flex flex-col">
      <AppHeader />
      <main className={`${phase === 'results' ? 'max-w-[1240px]' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1`}>
        {/* Top Header Row with Title and Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-violet-600 mb-1">
              <Compass className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Career discovery assessment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find careers that fit you
            </h1>
          </div>

          {phase !== 'loading' && phase !== 'error' && (
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isQuizScored) {
                    setShowLockNotice(true);
                    return;
                  }
                  setShowLockNotice(false);
                  goToPhase('counselor_diagnostic');
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  !isQuizScored
                    ? 'opacity-60 text-slate-500 hover:text-slate-700 cursor-pointer'
                    : phase === 'counselor_diagnostic'
                    ? 'bg-violet-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
                title={!isQuizScored ? 'Mandatory: Complete the discovery assessment first' : undefined}
              >
                {!isQuizScored ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Mic className="w-3.5 h-3.5" />}
                <span>AI Counselor</span>
                {!isQuizScored && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">Locked</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLockNotice(false);
                  if (isAssessmentComplete) {
                    goToPhase('results');
                  } else if (isQuizScored) {
                    goToPhase('counselor_diagnostic');
                  } else {
                    goToPhase(answers && Object.keys(answers).length > 0 ? 'quiz' : 'intro');
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  phase !== 'counselor_diagnostic'
                    ? 'bg-violet-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                {isAssessmentComplete ? <Sparkles className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{isAssessmentComplete ? 'Discovery Report' : 'Discovery Quiz'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Lock warning banner if user attempts to switch before completing assessment */}
        {showLockNotice && !isQuizScored && (
          <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <span className="font-bold">Assessment Required:</span> Please complete the Career Discovery Assessment below first. This ensures our AI Counselor understands your authentic Holland RIASEC occupational interests before diagnosing your practical competencies.
            </div>
            <button
              onClick={() => setShowLockNotice(false)}
              className="ml-auto text-amber-700 hover:text-amber-900 text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {phase === 'loading' && (
          <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center shadow-xs">
            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-700 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading discovery assessment...</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center shadow-xs">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-slate-700 font-semibold mb-1">{error}</p>
            <p className="text-slate-400 text-sm mb-5">
              The assessment needs the backend running on <code>localhost:8000</code>.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Interactive AI Diagnostic Counselor Consultation */}
        {phase === 'counselor_diagnostic' && (
          <div className="w-full">
            <CounselorVoiceChat
              assessmentScore={score}
              adaptiveScore={adaptiveScore}
              initialDiagnosticProfile={diagnosticProfile}
              onDiagnosticComplete={handleDiagnosticComplete}
              onRestartAssessment={restart}
            />
          </div>
        )}

        {/* Intro Step */}
        {phase === 'intro' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 border border-violet-100/80 flex items-center justify-center font-bold text-sm font-mono shrink-0">
                {totalQuestions}Q
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{stageInfo.title}</h2>
                  <Badge variant="brand" size="xs">Stage Calibrated</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {totalQuestions} scenario questions • ~3–4 minutes • Deterministic Python scoring
                </p>
              </div>
            </div>

            <p className="text-slate-600 mb-5 leading-relaxed text-sm">
              {stageInfo.subtitle}
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs block mb-0.5">Stage-Calibrated</span>
                <p className="text-[11px] text-slate-500">Tailored to your specific academic level, stream, and background.</p>
              </div>
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs block mb-0.5">No Duplicates</span>
                <p className="text-[11px] text-slate-500">Deduplicated against interests and skills already declared.</p>
              </div>
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs block mb-0.5">Evidence-Grounded</span>
                <p className="text-[11px] text-slate-500">Separates self-reported skills from demonstrated reasoning.</p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                setShowLockNotice(false);
                goToPhase('quiz');
              }}
            >
              Start Adaptive Assessment
            </Button>
          </div>
        )}

        {/* Phase 1: Scenario Questions */}
        {phase === 'quiz' && (
          currentQuestion ? (
          <div>
            <SectionStepper current="quiz" />

            {/* Progress indicator */}
            <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold tracking-tight text-slate-500 mb-2">
                <span className="text-violet-900 font-extrabold">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span className="text-slate-400 font-medium">{answeredCount} of {totalQuestions} answered</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-700 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%` }}
                />
              </div>
            </div>

            {/* Scenario Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="brand" size="xs">
                  Scenario {currentQuestionIndex + 1}
                </Badge>
                {categoryInfo && (
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${categoryInfo.className}`}>
                    {categoryInfo.label}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium ml-auto hidden sm:inline">
                  {stageInfo.title}
                </span>
              </div>

              {currentAdaptive?.explanation_tip && (
                <div className="mb-5 p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl flex items-start gap-2.5 text-xs text-violet-900 leading-relaxed">
                  <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-violet-950">Counselor Context: </span>
                    <span>{currentAdaptive.explanation_tip}</span>
                  </div>
                </div>
              )}

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug mb-6">
                {currentQuestion.scenario}
              </h2>

              {/* 4 Plausible Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.id;
                  const letter = opt.id.toUpperCase();
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/50 shadow-xs ring-1 ring-violet-500/20'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg font-bold text-xs font-mono flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-violet-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-slate-200/80 group-hover:text-slate-800'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : letter}
                      </span>
                      <span
                        className={`text-sm sm:text-base leading-relaxed pt-0.5 ${
                          isSelected ? 'font-semibold text-slate-900' : 'font-normal text-slate-700'
                        }`}
                      >
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    handleGoToQuestion(currentQuestionIndex - 1);
                  } else {
                    setPhase('intro');
                  }
                }}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <Button
                variant="primary"
                size="md"
                disabled={!isCurrentAnswered}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  if (currentQuestionIndex + 1 < questions.length) {
                    handleGoToQuestion(currentQuestionIndex + 1);
                  } else {
                    goToPhase('workstyle');
                  }
                }}
              >
                {currentQuestionIndex + 1 < questions.length ? 'Next question' : 'Continue to work style'}
              </Button>
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center shadow-xs">
              <div className="w-12 h-12 bg-violet-100 text-violet-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Scenario Questions Complete!</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                You have finished all {totalQuestions} scenario questions. Continue to the next step to specify your work style preferences.
              </p>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => goToPhase('workstyle')}
              >
                Continue to Work Style
              </Button>
            </div>
          )
        )}

        {/* Phase 2: Workstyle Preferences */}
        {phase === 'workstyle' && (
          <div>
            <SectionStepper current="workstyle" />
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Work Style & Operating Rhythm</h2>
              <p className="text-slate-500 text-sm mt-1">Four quick preferences to fine-tune your occupational environment fit.</p>
            </div>

            <div className="space-y-4">
              {WORK_STYLE_QUESTIONS.map((q, qIndex) => {
                const meta = WORKSTYLE_META[q.id];
                return (
                  <div key={q.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-6 h-6 rounded-md bg-violet-50 text-violet-700 font-mono text-xs font-bold flex items-center justify-center border border-violet-100">
                        0{qIndex + 1}
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{q.prompt}</p>
                    </div>
                    {meta?.subtitle && (
                      <p className="text-xs text-slate-400 mb-3.5 ml-8">{meta.subtitle}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[q.a, q.b].map((optText) => {
                        const isSelected = workStyle[q.id] === optText;
                        const optMeta = meta?.options[optText];
                        const Icon = optMeta?.icon || Compass;

                        return (
                          <button
                            key={optText}
                            type="button"
                            onClick={() => setWorkStyle((w) => ({ ...w, [q.id]: optText }))}
                            className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3.5 group relative ${
                              isSelected
                                ? 'border-violet-600 bg-violet-50/50 shadow-xs ring-1 ring-violet-500/20'
                                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-violet-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-800'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0 pr-6">
                              <span
                                className={`text-sm font-bold block mb-0.5 ${
                                  isSelected ? 'text-violet-950' : 'text-slate-800'
                                }`}
                              >
                                {optText}
                              </span>
                              {optMeta?.desc && (
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {optMeta.desc}
                                </p>
                              )}
                            </div>

                            {/* Selection Radio / Check Indicator */}
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 absolute top-4 right-4 transition-all ${
                                isSelected
                                  ? 'border-violet-600 bg-violet-600 text-white shadow-2xs'
                                  : 'border-slate-300 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                onClick={() => {
                  goToPhase('quiz');
                  handleGoToQuestion(questions.length - 1);
                }}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to questions
              </button>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => goToPhase('values')}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Phase 3–6: Holistic Discovery Sections */}
        {(phase === 'values' || phase === 'strengths' || phase === 'identity' || phase === 'situation') && (
          <div>
            <SectionStepper current={phase} />
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{SECTION_INTRO[phase]?.title}</h2>
              <p className="text-slate-500 text-sm mt-1">{SECTION_INTRO[phase]?.subtitle}</p>
            </div>

            <KnowMeSection section={phase} value={knowMe} onChange={updateKnowMe} />

            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                onClick={() => goToPhase(PREV_OF[phase] ?? 'workstyle')}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                {!sectionReady && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {phase === 'values'
                      ? `Pick 1–${MAX_VALUES}`
                      : phase === 'strengths'
                        ? 'Pick at least one strong subject'
                        : phase === 'identity'
                          ? 'Select your equal-salary choice & energy source'
                          : 'Answer each question'}
                  </span>
                )}
                {phase === 'situation' ? (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!sectionReady}
                    rightIcon={<Sparkles className="w-4 h-4" />}
                    onClick={submit}
                  >
                    Start AI Diagnostic Session
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!sectionReady}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => goToPhase(NEXT_OF[phase] ?? 'situation')}
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scoring & Analysis Loading Screen */}
        {phase === 'scoring' && (
          <div className="bg-white rounded-2xl p-10 sm:p-14 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.02)] text-center">
            <div className="w-12 h-12 border-3 border-violet-200 border-t-violet-700 rounded-full animate-spin mx-auto mb-5" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyzing Your Assessment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              Scoring Assessment & Initializing AI Counselor
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              Evaluating Holland RIASEC dimensions, separating declared vs demonstrated competencies, and preparing your personalized diagnostic consultation.
            </p>
          </div>
        )}

        {/* Results Screen */}
        {phase === 'results' && (
          (score && match) ? (
            <div className="space-y-6">
              {/* Profile Overview Card */}
              <ProfileOverviewCard
                userEmail={user?.email}
                stageTitle={stageInfo.title}
                stageSubtitle={stageInfo.subtitle}
                hollandCode={score.code}
                matchesCount={(match.matches || []).length}
                resultsAt={resultsAt}
                onExploreCareers={() => {
                  recommendedCareersRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                onStartVoiceCounselor={() => goToPhase('counselor_diagnostic')}
              />

              {/* Diagnostic Synthesis Verified Banner */}
              <div className="bg-gradient-to-r from-violet-50/90 via-purple-50/40 to-white rounded-2xl border border-violet-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-violet-800">
                        Diagnostic Synthesis Complete
                      </span>
                      <Badge variant="success" size="xs" className="font-semibold">
                        AI Counselor Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {diagnosticProfile?.projects && diagnosticProfile.projects.length > 0
                        ? `Grounded in ${diagnosticProfile.projects.length} practical projects and ${diagnosticProfile.technical_skills?.length || 0} demonstrated competencies without premature guessing.`
                        : 'Personalized recommendations synthesized from your Holland RIASEC profile, practical experiences, and statutory pathways.'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Mic className="w-3.5 h-3.5 text-violet-700" />}
                  onClick={() => goToPhase('counselor_diagnostic')}
                  className="bg-white hover:bg-violet-50 shrink-0 text-xs font-bold"
                >
                  Consult Counselor
                </Button>
              </div>

              {goalError && (
                <div className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{goalError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoalError(null)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold underline shrink-0 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {saveWarning && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3">
                  {saveWarning}
                </p>
              )}

              {/* B & C. Two-Column Intelligence Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <InterestIntelligenceCard
                    scores={score.scores}
                    code={score.code}
                    topFields={score.top_fields}
                    source={match.source}
                  />
                </div>
                <div className="lg:col-span-5">
                  {adaptiveScore ? (
                    <CompetencyEvidenceCard adaptiveScore={adaptiveScore} />
                  ) : (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                      <h3 className="font-bold text-slate-800 text-sm mb-2">Stage Alignment</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{stageInfo.subtitle}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* D. Career Eligibility and Pathways (Statutory & CKB) */}
              {adaptiveScore?.statutory_eligibility && (
                <StatutoryPathwaysCard
                  statutoryEligibility={adaptiveScore.statutory_eligibility}
                  practicalDisclaimer={adaptiveScore.practical_disclaimer}
                />
              )}

              {/* E. Recommended Career Matches */}
              <div ref={recommendedCareersRef} className="space-y-5 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Recommended Career Matches
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Personalized alignment across 1,016 occupational pathways, psychological fit, and statutory requirements
                    </p>
                  </div>
                  <Badge variant="brand" size="sm">
                    {(match.matches || []).length} Verified Recommendations
                  </Badge>
                </div>

                {/* Spotlight Top Match #1 */}
                {match.matches && match.matches.length > 0 && (
                  <CareerMatchCard
                    career={match.matches[0]}
                    rank={1}
                    isSettingGoal={settingGoal === match.matches[0].title}
                    isActiveGoal={profile?.targetRole === match.matches[0].title}
                    isTopMatch={true}
                    onSetGoal={setGoal}
                  />
                )}

                {/* Subsequent Matches in a Balanced 2x2 Grid */}
                {match.matches && match.matches.length > 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {match.matches.slice(1).map((c, i) => (
                      <CareerMatchCard
                        key={c.title}
                        career={c}
                        rank={i + 2}
                        isSettingGoal={settingGoal === c.title}
                        isActiveGoal={profile?.targetRole === c.title}
                        isTopMatch={false}
                        onSetGoal={setGoal}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom utility controls */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-slate-200/70">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Mic className="w-4 h-4" />}
                  onClick={() => goToPhase('counselor_diagnostic')}
                >
                  Talk to AI Counselor
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<RotateCcw className="w-4 h-4 text-slate-500" />}
                  onClick={restart}
                >
                  Retake Assessment
                </Button>
                <Link
                  to="/dashboard"
                  className="text-violet-700 hover:text-violet-900 text-xs font-bold transition-colors ml-2"
                >
                  Back to dashboard →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center shadow-xs">
              <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-700 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 text-base mb-1">Loading Your Assessment Results...</h3>
              <p className="text-slate-500 text-xs mb-5">Retrieving your career recommendations and Holland RIASEC scores.</p>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={restart}
              >
                Start New Assessment
              </Button>
            </div>
          )
        )}
      </main>
      <AppFooter />
    </div>
  );
};

export default Assessment;
