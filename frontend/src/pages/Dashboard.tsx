import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Clock, Target, Sparkles, FileText, Map as MapIcon,
  ArrowRight, ClipboardList, RefreshCw, CalendarCheck, Compass,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import AppHeader from '../components/AppHeader';
import { suggestCareers, type OnboardingRecord } from '../lib/onboarding';
import { isKnowMeComplete } from '../lib/knowMe';

const PATH_LABEL: Record<NonNullable<OnboardingRecord['path']>, string> = {
  know_goal: 'Knows their career goal',
  not_sure: 'Exploring career options',
  need_plan: 'Has a career, needs a plan',
};

const Dashboard: React.FC = () => {
  const { profile: onboarding, assessment } = useProfile();
  const topMatches = assessment?.matches.slice(0, 3) ?? [];
  const knowMeDone = isKnowMeComplete(onboarding?.knowMe);

  const hasProfile = Boolean(onboarding);
  const targetRole = onboarding?.targetRole?.trim();
  const interests = onboarding?.interests ?? [];
  // Interest-only suggestions are a stopgap until the student has real discovery results.
  const suggestions = !targetRole && !assessment && interests.length > 0 ? suggestCareers(interests) : [];
  const resumeSkills = onboarding?.resume?.skills ?? [];

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
          Welcome back{onboarding?.college ? `, ${onboarding.college} student` : ''} 👋
        </h1>
        <p className="text-slate-500 mb-8">Here's where your career journey stands right now.</p>

        {!hasProfile ? (
          <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Let's set up your profile first</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              We don't have your goals or interests yet — that only takes a couple of minutes.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
            >
              Start onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">

            {/* Profile summary */}
            <div className="md:col-span-1 bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-fit">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-500" /> Your profile
              </h3>
              <dl className="space-y-3 text-sm">
                {onboarding?.path && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Status</dt>
                    <dd className="text-slate-700 font-medium">{PATH_LABEL[onboarding.path]}</dd>
                  </div>
                )}
                {(onboarding?.course || onboarding?.year) && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Studying</dt>
                    <dd className="text-slate-700 font-medium">
                      {[onboarding?.course, onboarding?.year].filter(Boolean).join(' — ') || '—'}
                    </dd>
                  </div>
                )}
                {onboarding?.hoursPerWeek && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time available
                    </dt>
                    <dd className="text-slate-700 font-medium">{onboarding.hoursPerWeek}</dd>
                  </div>
                )}
                {interests.length > 0 && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Interests</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {interests.map((i) => (
                        <span key={i} className="bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-100">
                          {i}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {resumeSkills.length > 0 && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Skills from resume
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {resumeSkills.slice(0, 8).map((s) => (
                        <span key={s} className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              <Link
                to="/onboarding"
                className="mt-5 inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-sm hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Update my answers
              </Link>
            </div>

            {/* Main column */}
            <div className="md:col-span-2 space-y-6">

              {/* Career discovery */}
              {assessment ? (
                <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-purple-500" />
                      <h3 className="font-bold text-slate-900">Your interest profile</h3>
                    </div>
                    <span className="text-sm font-extrabold text-purple-600 tracking-widest">
                      {assessment.code}
                    </span>
                  </div>
                  {topMatches.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {topMatches.map((m, i) => (
                        <li key={m.title} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">{m.title}</span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-green-700">{m.fit}% fit</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!knowMeDone && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                      These matches were made before we asked about your values, strengths and
                      situation. Retake discovery for more personal results.
                    </p>
                  )}
                  <Link
                    to="/assessment"
                    className="inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-sm hover:underline"
                  >
                    View full results <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/assessment"
                  className="block bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-[1.5rem] p-6 shadow-md shadow-purple-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Compass className="w-5 h-5" />
                    <h3 className="font-bold">Not sure which career fits? Find out.</h3>
                  </div>
                  <p className="text-purple-100 text-sm mb-3">
                    Take the 5-minute interest assessment and get ranked career matches with reasons.
                  </p>
                  <span className="inline-flex items-center gap-1.5 font-bold text-sm">
                    Start career discovery <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              )}

              {targetRole ? (
                <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-slate-900">Your target role</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mb-3">{targetRole}</p>
                  <Link
                    to="/roadmap"
                    className="inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-sm hover:underline"
                  >
                    View your roadmap <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-slate-900">Career matches based on your interests</h3>
                  </div>
                  <div className="space-y-2.5">
                    {suggestions.map((career, i) => (
                      <div
                        key={career}
                        className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3 hover:border-purple-200 hover:bg-purple-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm">{career}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/roadmap"
                    className="mt-4 inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-sm hover:underline"
                  >
                    See a roadmap for the top match <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : assessment ? null : (
                <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center">
                  <p className="text-slate-500 text-sm">
                    Add a few interests in onboarding and we'll suggest careers that fit.
                  </p>
                </div>
              )}

              {/* Roadmap + Today (live) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  to="/roadmap"
                  className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-purple-200 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapIcon className="w-4 h-4 text-purple-500" />
                    <h4 className="font-bold text-slate-900 text-sm">Personalized Roadmap</h4>
                  </div>
                  <p className="text-slate-500 text-xs">Stages, skills, resources and a weekly schedule.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[#6D28D9] font-bold text-xs">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
                <Link
                  to="/today"
                  className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-purple-200 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="w-4 h-4 text-purple-500" />
                    <h4 className="font-bold text-slate-900 text-sm">Today's Tasks</h4>
                  </div>
                  <p className="text-slate-500 text-xs">What to work on this week, with check-offs.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[#6D28D9] font-bold text-xs">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>

              {/* Still coming */}
              <div className="bg-white rounded-[1.5rem] p-6 border border-dashed border-slate-200 opacity-70">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  <h4 className="font-bold text-slate-700 text-sm">Skill Gap Analysis</h4>
                </div>
                <p className="text-slate-400 text-xs">
                  A precise match of your current skills against your target role — coming soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
