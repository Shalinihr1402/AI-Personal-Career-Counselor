import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft, Target,
  AlertTriangle, RotateCcw, Compass, Mic, FileText,
  Lock, CheckCircle2, Check, ShieldCheck, GraduationCap,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import AppHeader from '../components/AppHeader';
import KnowMeSection from '../components/KnowMeSection';
import CounselorVoiceChat from '../components/CounselorVoiceChat';
import { confirmCareerGoal } from '../lib/profile';
import { EMPTY_KNOW_ME, MAX_VALUES, SITUATION_QUESTIONS, knowMeForApi, type KnowMe } from '../lib/knowMe';
import {
  fetchQuestions, scoreAssessment, fetchCareerMatches,
  fetchAdaptiveQuestions, scoreAdaptiveAssessment, buildProfilePayload,
  DIM_LABEL, DIM_ORDER, WORK_STYLE_QUESTIONS,
  type ScenarioQuestion, type ScoreResult, type MatchResult, type Dim, type CareerMatch,
  type AdaptiveQuestion, type AdaptiveScoreResult,
} from '../lib/assessment';

type Phase =
  | 'loading' | 'intro' | 'quiz' | 'workstyle'
  | 'values' | 'strengths' | 'identity' | 'situation'
  | 'scoring' | 'results' | 'error';

const STORAGE_ANSWERS_KEY = 'career_discovery_answers';
const STORAGE_INDEX_KEY = 'career_discovery_index';

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

function SectionStepper({ current }: { current: Phase }) {
  const idx = SECTIONS.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center gap-1.5 mb-6" aria-label="Discovery progress">
      {SECTIONS.map((s, i) => (
        <li key={s.id} className="flex-1 min-w-0">
          <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-purple-600' : 'bg-slate-200'}`} />
          <span
            className={`mt-1.5 block text-[11px] font-bold uppercase tracking-wide truncate ${
              i === idx ? 'text-purple-700' : i < idx ? 'text-slate-500' : 'text-slate-300'
            }`}
            aria-current={i === idx ? 'step' : undefined}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, assessment: saved, saveProfile, saveAssessment, refreshActiveGoal } = useProfile();

  // Mode defaults to 'quiz' if not completed to enforce mandatory assessment
  const [mode, setMode] = useState<'voice' | 'quiz'>('quiz');
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
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [settingGoal, setSettingGoal] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [showLockNotice, setShowLockNotice] = useState(false);

  const isAssessmentComplete = Boolean(saved || (score && match));

  const updateKnowMe = (patch: Partial<KnowMe>) => setKnowMe((k) => ({ ...k, ...patch }));

  useEffect(() => {
    if (profile?.knowMe) {
      setKnowMe((k) => ({ ...k, ...profile.knowMe }));
    }
  }, [profile?.knowMe]);

  const questionsLoadedRef = useRef(false);

  // Load questions calibrated to user's stage and restore state or saved results
  useEffect(() => {
    let cancelled = false;

    if (saved) {
      // Returning student: show their saved results
      setScore({ code: saved.code, scores: saved.scores });
      setMatch({ source: saved.source, matches: saved.matches });
      setResultsAt(saved.createdAt);
      if (saved.adaptiveEvidence) {
        setAdaptiveScore(saved.adaptiveEvidence);
        if (saved.adaptiveEvidence.stage) {
          setCalibratedStage(saved.adaptiveEvidence.stage);
        }
      }
      setPhase('results');
      setMode('quiz');
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
        try {
          const cachedAnswers = localStorage.getItem(STORAGE_ANSWERS_KEY);
          const cachedIndex = localStorage.getItem(STORAGE_INDEX_KEY);
          if (cachedAnswers) {
            const parsed = JSON.parse(cachedAnswers);
            if (parsed && typeof parsed === 'object') {
              setAnswers(parsed);
              const answeredCount = Object.keys(parsed).length;
              if (answeredCount > 0) {
                setPhase('quiz');
              } else {
                setPhase('intro');
              }
            } else {
              setPhase('intro');
            }
          } else {
            setPhase('intro');
          }

          if (cachedIndex) {
            const idx = parseInt(cachedIndex, 10);
            if (!isNaN(idx) && idx >= 0) {
              setCurrentQuestionIndex(idx);
            }
          }
        } catch {
          setPhase('intro');
        }
      })
      .catch(async () => {
        // Fallback to legacy endpoint if adaptive endpoint is unreachable
        try {
          const fallbackData = await fetchQuestions();
          if (cancelled) return;
          questionsLoadedRef.current = true;
          setQuestions(fallbackData.questions || []);

          try {
            const cachedAnswers = localStorage.getItem(STORAGE_ANSWERS_KEY);
            const cachedIndex = localStorage.getItem(STORAGE_INDEX_KEY);
            if (cachedAnswers) {
              const parsed = JSON.parse(cachedAnswers);
              if (parsed && typeof parsed === 'object') {
                setAnswers(parsed);
                const answeredCount = Object.keys(parsed).length;
                if (answeredCount > 0) {
                  setPhase('quiz');
                } else {
                  setPhase('intro');
                }
              } else {
                setPhase('intro');
              }
            } else {
              setPhase('intro');
            }

            if (cachedIndex) {
              const idx = parseInt(cachedIndex, 10);
              if (!isNaN(idx) && idx >= 0) {
                setCurrentQuestionIndex(idx);
              }
            }
          } catch {
            setPhase('intro');
          }
        } catch (e: unknown) {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : 'Could not load the assessment.');
          setPhase('error');
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
    setCurrentQuestionIndex(index);
    try {
      localStorage.setItem(STORAGE_INDEX_KEY, index.toString());
    } catch {
      // Ignore storage errors
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setPhase('scoring');
    setError(null);
    setSaveWarning(null);
    let s: ScoreResult;
    let m: MatchResult;

    try {
      const payload = buildProfilePayload(profile, knowMe);
      const adaptiveRes = await scoreAdaptiveAssessment(answers, payload);
      setAdaptiveScore(adaptiveRes);
      s = {
        scores: adaptiveRes.scores,
        code: adaptiveRes.code,
        top_fields: adaptiveRes.top_fields,
        field_scores: adaptiveRes.field_scores,
      };

      m = await fetchCareerMatches({
        riasec_scores: s.scores,
        code: s.code,
        interests: profile?.interests ?? [],
        education: [profile?.course, profile?.year].filter(Boolean).join(' — ') || undefined,
        work_style: workStyle,
        resume_skills: profile?.resume?.skills ?? [],
        strengths_note: profile?.strengthsNote || undefined,
        know_me: knowMeForApi(knowMe),
      });
    } catch {
      try {
        // Fallback to legacy scoring if adaptive endpoint fails
        s = await scoreAssessment(answers);
        m = await fetchCareerMatches({
          riasec_scores: s.scores,
          code: s.code,
          interests: profile?.interests ?? [],
          education: [profile?.course, profile?.year].filter(Boolean).join(' — ') || undefined,
          work_style: workStyle,
          resume_skills: profile?.resume?.skills ?? [],
          strengths_note: profile?.strengthsNote || undefined,
          know_me: knowMeForApi(knowMe),
        });
      } catch (fallbackErr: unknown) {
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Something went wrong. Is the backend running?');
        setPhase('error');
        setSubmitting(false);
        return;
      }
    }

    setScore(s);
    setMatch(m);
    setResultsAt(new Date().toISOString());
    setPhase('results');
    setSubmitting(false);

    // Clear local storage cache upon successful completion
    try {
      localStorage.removeItem(STORAGE_ANSWERS_KEY);
      localStorage.removeItem(STORAGE_INDEX_KEY);
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
        matches: m.matches,
        source: m.source,
        adaptiveEvidence: adaptiveRes,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not save assessment:', e);
      setSaveWarning("Your results couldn't be saved to your permanent profile, but they are available for this session.");
    }
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
    } catch {
      // Ignore
    }
    setPhase('intro');
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

  const topLetters = score ? score.code.split('') : [];
  const currentQuestion = questions[currentQuestionIndex];
  const currentAdaptive = adaptiveQuestions[currentQuestionIndex];
  const isCurrentAnswered = currentQuestion && Boolean(answers[currentQuestion.id]);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length || 12;
  const stageInfo = STAGE_LABELS[calibratedStage] || STAGE_LABELS.general;
  const categoryInfo = currentAdaptive ? CATEGORY_BADGES[currentAdaptive.category] : null;

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans pb-16">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Compass className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Career discovery assessment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Find careers that fit you
            </h1>
          </div>

          {phase !== 'loading' && phase !== 'error' && (
            <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-200 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isAssessmentComplete) {
                    setShowLockNotice(true);
                    return;
                  }
                  setShowLockNotice(false);
                  setMode('voice');
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  !isAssessmentComplete
                    ? 'opacity-60 text-slate-500 hover:text-slate-700 cursor-pointer'
                    : mode === 'voice'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={!isAssessmentComplete ? 'Mandatory: Complete the discovery assessment first' : undefined}
              >
                {!isAssessmentComplete ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Mic className="w-3.5 h-3.5" />}
                <span>Voice Counselor</span>
                {!isAssessmentComplete && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">Locked</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLockNotice(false);
                  setMode('quiz');
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  mode === 'quiz'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Discovery Quiz
              </button>
            </div>
          )}
        </div>

        {/* Lock warning banner if user attempts to switch before completing assessment */}
        {showLockNotice && !isAssessmentComplete && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900">
              <span className="font-bold">Assessment Required:</span> Please complete the 12-question Career Discovery Assessment below first. This ensures our AI Counselor understands your authentic occupational interests across all fields before advising you.
            </div>
            <button
              onClick={() => setShowLockNotice(false)}
              className="ml-auto text-amber-700 hover:text-amber-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {phase === 'loading' && (
          <div className="bg-white rounded-[1.5rem] p-10 border border-slate-100 text-center">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading discovery assessment...</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="bg-white rounded-[1.5rem] p-8 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-slate-700 font-semibold mb-1">{error}</p>
            <p className="text-slate-400 text-sm mb-5">
              The assessment needs the backend running on <code>localhost:8000</code>.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#6D28D9] text-white font-bold py-2.5 px-5 rounded-xl hover:bg-[#5B21B6] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Interactive Voice Counselor Mode (Unlocked after assessment completion) */}
        {phase !== 'loading' && phase !== 'error' && mode === 'voice' && isAssessmentComplete && (
          <CounselorVoiceChat
            onRestartAssessment={() => {
              setPhase('intro');
              setMode('quiz');
            }}
          />
        )}

        {phase === 'intro' && mode === 'quiz' && (
          <div className="bg-white rounded-[1.5rem] p-8 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                {totalQuestions}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{stageInfo.title}</h2>
                <p className="text-xs text-slate-500">
                  {totalQuestions} questions calibrated to your profile • ~3–4 minutes
                </p>
              </div>
            </div>

            <p className="text-slate-600 mb-4 leading-relaxed">
              {stageInfo.subtitle}
            </p>
            <ul className="text-sm text-slate-500 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Stage-Calibrated:</strong> Questions are tailored specifically to your educational stage and stream.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>No Duplicate Questions:</strong> Deduplicated against your onboarding interests and skills.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Evidence-Grounded:</strong> Distinguishes conceptual knowledge from practical workplace problem-solving.</span>
              </li>
            </ul>
            <button
              onClick={() => {
                setShowLockNotice(false);
                setPhase('quiz');
              }}
              className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
            >
              Start Adaptive Assessment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* One Question at a Time Scenario-Based Discovery */}
        {mode === 'quiz' && phase === 'quiz' && currentQuestion && (
          <div>
            <SectionStepper current="quiz" />

            {/* Progress indicator */}
            <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <span className="text-purple-700">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span>{answeredCount} of {totalQuestions} answered</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%` }}
                />
              </div>
            </div>

            {/* Scenario Card */}
            <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  Scenario {currentQuestionIndex + 1}
                </div>
                {categoryInfo && (
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${categoryInfo.className}`}>
                    {categoryInfo.label}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-slate-400 ml-auto hidden sm:inline">
                  {stageInfo.title}
                </span>
              </div>

              {currentAdaptive?.explanation_tip && (
                <div className="mb-4 p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-900 leading-relaxed">
                  <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Counselor Context: </span>
                    <span>{currentAdaptive.explanation_tip}</span>
                  </div>
                </div>
              )}

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-6">
                {currentQuestion.scenario}
              </h2>

              {/* 4 Large Plausible Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.id;
                  const letter = opt.id.toUpperCase();
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start gap-4 group ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 shadow-[0_4px_16px_rgba(109,40,217,0.08)] ring-1 ring-purple-600/30'
                          : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-purple-100 group-hover:text-purple-700'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : letter}
                      </span>
                      <span
                        className={`text-sm sm:text-base leading-relaxed pt-0.5 ${
                          isSelected ? 'font-semibold text-purple-950' : 'font-normal text-slate-700'
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
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm px-3 py-2 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                disabled={!isCurrentAnswered}
                onClick={() => {
                  if (currentQuestionIndex + 1 < questions.length) {
                    handleGoToQuestion(currentQuestionIndex + 1);
                  } else {
                    setPhase('workstyle');
                  }
                }}
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex + 1 < questions.length ? (
                  <>
                    Next question <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue to work style <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Workstyle preferences */}
        {mode === 'quiz' && phase === 'workstyle' && (
          <div>
            <SectionStepper current="workstyle" />
            <p className="text-slate-500 mb-5 text-sm">Four quick preferences to sharpen the match.</p>
            <div className="space-y-3">
              {WORK_STYLE_QUESTIONS.map((q) => (
                <div key={q.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 mb-3">{q.prompt}</p>
                  <div className="flex gap-2">
                    {[q.a, q.b].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setWorkStyle((w) => ({ ...w, [q.id]: opt }))}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                          workStyle[q.id] === opt
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => {
                  setPhase('quiz');
                  handleGoToQuestion(questions.length - 1);
                }}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to questions
              </button>
              <button
                type="button"
                onClick={() => setPhase('values')}
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#5B21B6] transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Holistic discovery sections */}
        {mode === 'quiz' && (phase === 'values' || phase === 'strengths' || phase === 'identity' || phase === 'situation') && (
          <div>
            <SectionStepper current={phase} />
            <h2 className="text-xl font-extrabold text-slate-900">{SECTION_INTRO[phase]?.title}</h2>
            <p className="text-slate-500 text-sm mb-5">{SECTION_INTRO[phase]?.subtitle}</p>

            <KnowMeSection section={phase} value={knowMe} onChange={updateKnowMe} />

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => setPhase(PREV_OF[phase] ?? 'workstyle')}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm"
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
                  <button
                    type="button"
                    disabled={!sectionReady}
                    onClick={submit}
                    className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    See my career matches <Sparkles className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!sectionReady}
                    onClick={() => setPhase(NEXT_OF[phase] ?? 'situation')}
                    className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#5B21B6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scoring loader */}
        {mode === 'quiz' && phase === 'scoring' && (
          <div className="bg-white rounded-[1.5rem] p-10 border border-slate-100 text-center">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-base mb-1">Scoring Your Discovery Profile...</h3>
            <p className="text-slate-500 text-sm">Matching your occupational interests against 1,016 O*NET careers.</p>
          </div>
        )}

        {/* Results Screen */}
        {mode === 'quiz' && phase === 'results' && score && match && (
          <div className="space-y-6">
            {/* Celebratory completion header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white rounded-[1.5rem] p-6 sm:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Discovery Assessment Complete
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">
                    Your Career Profile is Unlocked!
                  </h2>
                  <p className="text-purple-100 text-sm mt-1 max-w-xl">
                    You can now speak with your AI Voice Counselor, explore matched occupations, and set your career milestones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('voice')}
                  className="inline-flex items-center gap-2 bg-white text-purple-900 font-extrabold text-sm px-5 py-3 rounded-xl hover:bg-purple-50 transition-all shadow-md shrink-0"
                >
                  <Mic className="w-4 h-4 text-purple-700" />
                  Chat with Voice Counselor →
                </button>
              </div>
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
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {saveWarning && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                {saveWarning}
              </p>
            )}

            {resultsAt && (
              <p className="text-xs text-slate-400 -mb-3">
                Results from {new Date(resultsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}

            {/* Holland profile & Top Occupational Fields */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-900">Your Interest Profile (Holland RIASEC)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Aggregated deterministically across all 12 discovery scenarios</p>
                </div>
                <span className="text-base font-extrabold text-purple-600 tracking-widest bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                  {score.code}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                {[...DIM_ORDER]
                  .sort((a, b) => score.scores[b] - score.scores[a])
                  .map((d: Dim) => {
                    const isTop = topLetters.includes(d);
                    return (
                      <div key={d} className="flex items-center gap-3">
                        <span className={`w-28 text-xs font-semibold shrink-0 ${isTop ? 'text-purple-700' : 'text-slate-500'}`}>
                          {DIM_LABEL[d]}
                        </span>
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isTop ? 'bg-purple-600' : 'bg-slate-300'}`}
                            style={{ width: `${score.scores[d]}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold text-slate-500 shrink-0">
                          {score.scores[d]}%
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Top Occupational Fields Affinity */}
              {score.top_fields && score.top_fields.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Top Occupational Field Affinities:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {score.top_fields.map((field) => (
                      <span
                        key={field}
                        className="text-xs font-bold text-indigo-700 bg-indigo-50/80 px-3 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5"
                      >
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-4">
                {match.source === 'ai'
                  ? 'Careers below were personalized by our AI Counselor using your full holistic profile, RIASEC scores, and subconscious preferences.'
                  : match.source === 'hybrid_vector'
                  ? 'Careers below were ranked by AI Vector Embeddings & Psychological RIASEC alignment across 1,016 official O*NET occupations.'
                  : 'Careers below were matched using rule-based profile alignment.'}
              </p>
            </div>

            {/* Competency Evidence Hierarchy Card */}
            {adaptiveScore && adaptiveScore.evidence_breakdown && (
              <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Competency Evidence Hierarchy</h2>
                      <p className="text-xs text-slate-500">
                        Separating self-reported skills, conceptual knowledge, and applied situational judgment
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 self-start sm:self-auto">
                    4-Tier Evidence Model
                  </span>
                </div>

                {/* Tier 1: Self-Reported Skills */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Tier 1: Self-Reported Skills ({adaptiveScore.evidence_breakdown.self_reported_skills.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Declared in onboarding / resume</span>
                  </div>
                  {adaptiveScore.evidence_breakdown.self_reported_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {adaptiveScore.evidence_breakdown.self_reported_skills.map((s) => (
                        <span
                          key={s.skill}
                          className="text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.skill}</span>
                          <span className="text-[10px] text-slate-400 font-normal ml-0.5">• Self-Reported</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No self-reported skills declared in onboarding.</p>
                  )}
                </div>

                {/* Tier 2: Conceptual Knowledge */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Tier 2: Conceptual Knowledge ({adaptiveScore.evidence_breakdown.conceptual_knowledge.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-blue-600 font-medium hidden sm:inline">Multiple-choice domain recall</span>
                  </div>
                  {adaptiveScore.evidence_breakdown.conceptual_knowledge.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adaptiveScore.evidence_breakdown.conceptual_knowledge.map((c) => (
                        <div key={c.competency_id} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-blue-950 capitalize">
                              {c.competency_id.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                              +{c.rubric_points} pts
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-800/80">
                            Level: <span className="font-semibold capitalize">{c.level}</span> • Conceptual Awareness
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Broad discovery pathway; no specialized conceptual items triggered.</p>
                  )}
                </div>

                {/* Tier 3: Applied Scenario Problem-Solving */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                        Tier 3: Applied Scenario Problem-Solving ({adaptiveScore.evidence_breakdown.applied_scenario.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-purple-700 font-medium hidden sm:inline">Situational judgment & code troubleshooting</span>
                  </div>
                  {adaptiveScore.evidence_breakdown.applied_scenario.length > 0 ? (
                    <div className="space-y-2.5">
                      {adaptiveScore.evidence_breakdown.applied_scenario.map((c) => (
                        <div key={c.competency_id} className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-purple-950 capitalize">
                                {c.competency_id.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                Applied Scenario • {c.level}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-purple-800">+{c.rubric_points} pts</span>
                          </div>
                          {c.practical_verification_note && (
                            <p className="text-[11px] text-purple-900/80 leading-relaxed bg-white/80 p-2 rounded-lg border border-purple-100 mt-1.5">
                              <span className="font-bold">Next Stage Requirement: </span>
                              {c.practical_verification_note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No applied scenario items completed in this questionnaire.</p>
                  )}
                </div>

                {/* Tier 4: Verified Practical Demonstration (CAPPED BY MCQ) */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200">
                    <div className="flex items-start gap-3">
                      <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Tier 4: Verified Practical Demonstration
                          </h3>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            0 Verified Practical Artifacts (Capped by MCQ Standards)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Multiple-choice responses assess conceptual awareness and situational problem-solving. In compliance with industry standards and statutory licensing frameworks (NMC, BCI, ICAI, AICTE), verified practical proficiency cannot be proven through multiple-choice answers alone and requires verified code repositories, clinical rotation logs, or certified articleship records.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statutory Career Pathways & Regulatory Eligibility Card */}
            {adaptiveScore && adaptiveScore.statutory_eligibility && (
              <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Statutory Career Eligibility & Pathways</h2>
                      <p className="text-xs text-slate-500">
                        Validated against Indian statutory licensing frameworks (NMC, BCI, ICAI, AICTE, NCVT)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
                    Regulatory Verification
                  </span>
                </div>

                {/* Direct / Preferred Pathways */}
                {adaptiveScore.statutory_eligibility.eligible_pathways.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Direct & Preferred Pathways ({adaptiveScore.statutory_eligibility.eligible_pathways.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adaptiveScore.statutory_eligibility.eligible_pathways.map((p) => (
                        <div key={p.slug} className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-xs font-bold text-emerald-950">{p.title}</h4>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                              Direct Eligible
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-900/80 leading-relaxed">{p.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alternative & Bridge Pathways */}
                {adaptiveScore.statutory_eligibility.alternative_pathways.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-2.5 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      Alternative & Bridge Pathways ({adaptiveScore.statutory_eligibility.alternative_pathways.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adaptiveScore.statutory_eligibility.alternative_pathways.map((p) => (
                        <div key={p.slug} className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-xs font-bold text-indigo-950">{p.title}</h4>
                            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md shrink-0">
                              Bridge Pathway
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-900/80 leading-relaxed">{p.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statutory Restrictions */}
                {adaptiveScore.statutory_eligibility.statutory_restrictions.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Statutory Restrictions & Licensing Requirements ({adaptiveScore.statutory_eligibility.statutory_restrictions.length})
                    </h3>
                    <div className="space-y-3">
                      {adaptiveScore.statutory_eligibility.statutory_restrictions.map((p) => (
                        <div key={p.slug} className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/70">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                            <h4 className="text-xs font-bold text-amber-950">{p.title}</h4>
                            {p.regulatory_body && (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200/60 self-start sm:self-auto">
                                {p.regulatory_body}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-900/90 leading-relaxed mb-2">{p.reason}</p>
                          {p.missing_prerequisites && p.missing_prerequisites.length > 0 && (
                            <div className="text-[11px] text-amber-950 bg-white/80 p-2 rounded-lg border border-amber-200/60 mb-2">
                              <span className="font-bold">Missing Prerequisites: </span>
                              {p.missing_prerequisites.join(', ')}
                            </div>
                          )}
                          {p.recommended_bridge_steps && p.recommended_bridge_steps.length > 0 && (
                            <div className="text-[11px] text-indigo-950 bg-indigo-50/70 p-2 rounded-lg border border-indigo-200/60">
                              <span className="font-bold text-indigo-900">Recommended Pathway: </span>
                              {p.recommended_bridge_steps.join(' • ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Practical Evidence Disclaimer Banner */}
            {adaptiveScore && adaptiveScore.practical_disclaimer && (
              <div className="p-4 bg-slate-100/90 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold">Statutory Evidence Notice: </span>
                  {adaptiveScore.practical_disclaimer}
                </p>
              </div>
            )}

            {/* Career matches */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">Top Matched Careers For You</h3>
              {match.matches.map((c, i) => (
                <div key={c.title} className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-purple-200 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base truncate">{c.title}</h3>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                      {c.fit}% fit
                    </span>
                  </div>

                  {/* Metadata badges (Field, Salary, Education) */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {c.field && (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-100">
                        {c.field}
                      </span>
                    )}
                    {c.salary_india?.mid && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Mid: {c.salary_india.mid}
                      </span>
                    )}
                    {c.education && (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        {c.education}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 font-medium mb-1.5 leading-relaxed">{c.why_it_fits}</p>
                  <p className="text-xs text-slate-400 mb-3">{c.day_to_day}</p>

                  {c.key_skills && c.key_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.key_skills.map((s) => (
                        <span key={s} className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {c.watch_outs && (
                    <p className="text-xs text-amber-800 bg-amber-50/90 border border-amber-200/60 rounded-xl px-3.5 py-2 mb-3 flex items-start gap-1.5 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span><strong>Watch-out:</strong> {c.watch_outs}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-2">
                    <Link
                      to={`/careers/${c.slug || c.title.toLowerCase().replace(/[/&]/g, ' ').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}`}
                      className="inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-xs hover:underline bg-purple-50 hover:bg-purple-100/70 px-3 py-1.5 rounded-xl border border-purple-100 transition-colors"
                    >
                      Explore day-to-day & skill gap <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setGoal(c)}
                      disabled={settingGoal !== null}
                      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      <Target className="w-3.5 h-3.5 text-purple-600" />
                      {settingGoal === c.title ? 'Setting goal…' : 'Quick select as goal'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setMode('voice')}
                className="inline-flex items-center gap-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-600/20"
              >
                <Mic className="w-4 h-4" /> Start Voice Counselor Session
              </button>
              <button
                onClick={restart}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold bg-white border border-slate-200 px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake questionnaire
              </button>
              <Link to="/dashboard" className="text-[#6D28D9] font-bold text-xs hover:underline">
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Assessment;
