import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft, Target,
  AlertTriangle, RotateCcw, Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AppHeader from '../components/AppHeader';
import { readOnboarding } from '../lib/onboarding';
import {
  fetchQuestions, scoreAssessment, fetchCareerMatches,
  DIM_LABEL, DIM_ORDER, WORK_STYLE_QUESTIONS,
  type RiasecQuestion, type ScaleOption, type ScoreResult, type MatchResult, type Dim,
} from '../lib/assessment';

type Phase = 'loading' | 'intro' | 'quiz' | 'workstyle' | 'scoring' | 'results' | 'error';

const PER_PAGE = 6;

const Assessment: React.FC = () => {
  const { user, configured } = useAuth();
  const navigate = useNavigate();
  const onboarding = readOnboarding(user);

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<RiasecQuestion[]>([]);
  const [scale, setScale] = useState<ScaleOption[]>([]);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [workStyle, setWorkStyle] = useState<Record<string, string>>({});
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingGoal, setSettingGoal] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchQuestions()
      .then((data) => {
        if (cancelled) return;
        setQuestions(data.questions);
        setScale(data.scale);
        setPhase('intro');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load the assessment.');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
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
    try {
      const filled: Record<string, number> = {};
      for (const q of questions) filled[q.id] = answers[q.id] ?? 1;

      const s = await scoreAssessment(filled);
      const m = await fetchCareerMatches({
        riasec_scores: s.scores,
        code: s.code,
        interests: onboarding?.interests ?? [],
        education: [onboarding?.course, onboarding?.year].filter(Boolean).join(' — ') || undefined,
        work_style: workStyle,
        resume_skills: onboarding?.resume?.skills ?? [],
      });

      setScore(s);
      setMatch(m);
      setPhase('results');

      if (configured) {
        try {
          await supabase.auth.updateUser({
            data: {
              assessment: {
                code: s.code,
                scores: s.scores,
                source: m.source,
                topMatches: m.matches.slice(0, 3).map((x) => x.title),
                at: new Date().toISOString(),
              },
            },
          });
        } catch {
          /* non-blocking */
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Is the backend running?');
      setPhase('error');
    }
  };

  const setGoal = async (title: string) => {
    setSettingGoal(title);
    if (configured) {
      try {
        await supabase.auth.updateUser({
          data: { onboarding: { ...(onboarding ?? {}), targetRole: title, path: 'know_goal' } },
        });
      } catch {
        /* non-blocking */
      }
    }
    navigate('/roadmap');
  };

  const restart = () => {
    setAnswers({});
    setWorkStyle({});
    setScore(null);
    setMatch(null);
    setPage(0);
    setError(null);
    setPhase('intro');
  };

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
              Rate {questions.length} short statements by how much you'd enjoy each activity. It
              takes about 5 minutes. We use your answers (a standard{' '}
              <strong>RIASEC / Holland</strong> profile) plus your interests to rank careers that
              match — with a clear reason for each.
            </p>
            <ul className="text-sm text-slate-500 space-y-1.5 mb-6">
              <li>• No right or wrong answers</li>
              <li>• Your results feed straight into your roadmap</li>
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
                {page + 1 < pageCount ? 'Continue' : 'Almost done'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {phase === 'workstyle' && (
          <div>
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
                onClick={submit}
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
              >
                See my career matches <Sparkles className="w-4 h-4" />
              </button>
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
                  ? 'Careers below were ranked by AI from your profile.'
                  : 'Careers below were ranked from your profile (rule-based — add a Gemini key for AI reasoning).'}
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
