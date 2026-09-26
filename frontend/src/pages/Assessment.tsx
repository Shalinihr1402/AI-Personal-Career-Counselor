import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft, Target,
  AlertTriangle, RotateCcw, Compass,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import AppHeader from '../components/AppHeader';
import KnowMeSection from '../components/KnowMeSection';
import { EMPTY_KNOW_ME, MAX_VALUES, SITUATION_QUESTIONS, knowMeForApi, type KnowMe } from '../lib/knowMe';
import {
  fetchQuestions, scoreAssessment, fetchCareerMatches,
  DIM_LABEL, DIM_ORDER, WORK_STYLE_QUESTIONS,
  type RiasecQuestion, type ScaleOption, type ScoreResult, type MatchResult, type Dim,
} from '../lib/assessment';

type Phase =
  | 'loading' | 'intro' | 'quiz' | 'workstyle'
  | 'values' | 'strengths' | 'situation'
  | 'scoring' | 'results' | 'error';

const PER_PAGE = 6;

/** The discovery journey as the student sees it (one entry per visible section). */
const SECTIONS: { id: Phase; label: string }[] = [
  { id: 'quiz', label: 'Interests' },
  { id: 'workstyle', label: 'Work style' },
  { id: 'values', label: 'Values' },
  { id: 'strengths', label: 'Strengths' },
  { id: 'situation', label: 'Your situation' },
];

const SECTION_INTRO: Partial<Record<Phase, { title: string; subtitle: string }>> = {
  values: { title: 'What matters to you?', subtitle: 'The same job can feel great or awful depending on what you value.' },
  strengths: { title: 'Where you shine', subtitle: 'Your strengths point to careers where you’ll grow fastest.' },
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
  const { profile, assessment: saved, saveProfile, saveAssessment } = useProfile();

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<RiasecQuestion[]>([]);
  const [scale, setScale] = useState<ScaleOption[]>([]);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [workStyle, setWorkStyle] = useState<Record<string, string>>({});
  const [knowMe, setKnowMe] = useState<KnowMe>(() => ({ ...EMPTY_KNOW_ME, ...profile?.knowMe }));
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [resultsAt, setResultsAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [settingGoal, setSettingGoal] = useState<string | null>(null);

  const updateKnowMe = (patch: Partial<KnowMe>) => setKnowMe((k) => ({ ...k, ...patch }));

  useEffect(() => {
    let cancelled = false;
    fetchQuestions()
      .then((data) => {
        if (cancelled) return;
        setQuestions(data.questions);
        setScale(data.scale);
        if (saved) {
          // Returning student: show their saved results instead of restarting the quiz.
          setScore({ code: saved.code, scores: saved.scores });
          setMatch({ source: saved.source, matches: saved.matches });
          setResultsAt(saved.createdAt);
          setPhase('results');
        } else {
          setPhase('intro');
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load the assessment.');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
    // Load once; `saved` is already available because ProtectedRoute waits for the profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.ceil(questions.length / PER_PAGE);
  const pageQuestions = useMemo(
    () => questions.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [questions, page],
  );
  const pageComplete = pageQuestions.every((q) => answers[q.id] !== undefined);
  const answeredCount = Object.keys(answers).length;

  const submit = async () => {
    setPhase('scoring');
    setError(null);
    setSaveWarning(null);
    let s: ScoreResult;
    let m: MatchResult;
    const filled: Record<string, number> = {};
    for (const q of questions) filled[q.id] = answers[q.id] ?? 1;
    try {
      s = await scoreAssessment(filled);
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Is the backend running?');
      setPhase('error');
      return;
    }

    setScore(s);
    setMatch(m);
    setResultsAt(new Date().toISOString());
    setPhase('results');

    try {
      await saveProfile({ knowMe });
      await saveAssessment({
        answers: filled, workStyle, knowMe,
        scores: s.scores, code: s.code, matches: m.matches, source: m.source,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not save assessment:', e);
      setSaveWarning("Your results couldn't be saved, so they'll be gone if you leave this page.");
    }
  };

  const setGoal = async (title: string) => {
    setSettingGoal(title);
    try {
      await saveProfile({ targetRole: title, path: 'know_goal' });
    } catch {
      /* non-blocking — the roadmap page lets them set it again */
    }
    navigate('/roadmap');
  };

  const restart = () => {
    setAnswers({});
    setWorkStyle({});
    setScore(null);
    setMatch(null);
    setResultsAt(null);
    setPage(0);
    setError(null);
    setSaveWarning(null);
    setPhase('intro');
  };

  const sectionReady =
    phase === 'values' ? knowMe.values.length > 0
    : phase === 'strengths' ? knowMe.subjectsStrong.length > 0
    : phase === 'situation' ? SITUATION_QUESTIONS.every((q) => Boolean(knowMe[q.key]))
    : true;
  const NEXT_OF: Partial<Record<Phase, Phase>> = { values: 'strengths', strengths: 'situation' };
  const PREV_OF: Partial<Record<Phase, Phase>> = { values: 'workstyle', strengths: 'values', situation: 'strengths' };

  const topLetters = score ? score.code.split('') : [];

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-purple-500 mb-1">
          <Compass className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Career discovery</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Find careers that fit you</h1>

        {phase === 'loading' && (
          <div className="bg-white rounded-[1.5rem] p-10 border border-slate-100 text-center">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
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

        {phase === 'intro' && (
          <div className="bg-white rounded-[1.5rem] p-8 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <p className="text-slate-600 mb-4">
              Like a session with a career counselor, we'll get to know you in{' '}
              <strong>5 short sections</strong> (about 8 minutes): what you enjoy doing, how you like
              to work, what you value, where you're strong, and your real-life situation. Then we
              rank careers that genuinely fit — with a clear reason for each.
            </p>
            <ul className="text-sm text-slate-500 space-y-1.5 mb-6">
              <li>• No right or wrong answers</li>
              <li>• Your answers are saved and stay private</li>
              <li>• You can retake it anytime</li>
            </ul>
            <button
              onClick={() => setPhase('quiz')}
              className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
            >
              Start assessment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {phase === 'quiz' && (
          <div>
            <SectionStepper current="quiz" />
            <div className="mb-5">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>Page {page + 1} of {pageCount}</span>
                <span>{answeredCount}/{questions.length} answered</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {pageQuestions.map((q) => (
                <div key={q.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 mb-3">{q.text}</p>
                  <div className="flex gap-2">
                    {scale.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          answers[q.id] === opt.value
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => (page === 0 ? setPhase('intro') : setPage((p) => p - 1))}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                disabled={!pageComplete}
                onClick={() => (page + 1 < pageCount ? setPage((p) => p + 1) : setPhase('workstyle'))}
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#5B21B6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {phase === 'workstyle' && (
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
                onClick={() => setPhase('quiz')}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
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

        {(phase === 'values' || phase === 'strengths' || phase === 'situation') && (
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

        {phase === 'scoring' && (
          <div className="bg-white rounded-[1.5rem] p-10 border border-slate-100 text-center">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Scoring your profile and matching careers…</p>
          </div>
        )}

        {phase === 'results' && score && match && (
          <div className="space-y-6">
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
            {/* Holland profile */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-bold text-slate-900">Your interest profile</h2>
                <span className="text-sm font-extrabold text-purple-600 tracking-widest">{score.code}</span>
              </div>
              <div className="space-y-2">
                {[...DIM_ORDER]
                  .sort((a, b) => score.scores[b] - score.scores[a])
                  .map((d: Dim) => {
                    const isTop = topLetters.includes(d);
                    return (
                      <div key={d} className="flex items-center gap-3">
                        <span className={`w-24 text-xs font-semibold shrink-0 ${isTop ? 'text-purple-700' : 'text-slate-400'}`}>
                          {DIM_LABEL[d]}
                        </span>
                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isTop ? 'bg-purple-600' : 'bg-slate-300'}`}
                            style={{ width: `${score.scores[d]}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold text-slate-500 shrink-0">
                          {score.scores[d]}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-slate-400 mt-4">
                {match.source === 'ai'
                  ? 'Careers below were ranked by AI from your whole profile — interests, values, strengths and situation.'
                  : 'Careers below were ranked from your interest profile (the AI counselor was unavailable, so this is a simpler rule-based match).'}
              </p>
            </div>

            {/* Career matches */}
            <div className="space-y-3">
              {match.matches.map((c, i) => (
                <div key={c.title} className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 truncate">{c.title}</h3>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                      {c.fit}% fit
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{c.why_it_fits}</p>
                  <p className="text-xs text-slate-400 mb-3">{c.day_to_day}</p>
                  {c.key_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.key_skills.map((s) => (
                        <span key={s} className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.watch_outs && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {c.watch_outs}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setGoal(c.title)}
                    disabled={settingGoal !== null}
                    className="inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-sm hover:underline disabled:opacity-50"
                  >
                    <Target className="w-4 h-4" />
                    {settingGoal === c.title ? 'Setting…' : 'Set as my goal & build roadmap'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 pt-2">
              <button
                onClick={restart}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake assessment
              </button>
              <Link to="/dashboard" className="text-[#6D28D9] font-bold text-sm hover:underline">
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
