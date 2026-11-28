import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  Target,
  Sparkles,
  FileText,
  Map as MapIcon,
  ArrowRight,
  ClipboardList,
  RefreshCw,
  CalendarCheck,
  Compass,
  Layers,
  Award,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { type OnboardingRecord } from '../lib/onboarding';
import { isKnowMeComplete } from '../lib/knowMe';

const PATH_LABEL: Record<NonNullable<OnboardingRecord['path']>, string> = {
  know_goal: 'Targeted Career Planning',
  not_sure: 'Career Discovery & Exploration',
  need_plan: 'Career Transition & Growth',
};

const Dashboard: React.FC = () => {
  const { profile: onboarding, assessment } = useProfile();
  const topMatches = assessment?.matches.slice(0, 3) ?? [];
  const knowMeDone = isKnowMeComplete(onboarding?.knowMe);

  const hasProfile = Boolean(onboarding);
  const targetRole = onboarding?.targetRole?.trim();
  const interests = onboarding?.interests ?? [];
  const structuredProjects = onboarding?.skills_and_experience?.structured_projects ?? [];
  const declaredSkills = onboarding?.skills_and_experience?.skills ?? [];

  // Calculate profile completion score
  const completionPercentage = React.useMemo(() => {
    let score = 20; // Started
    if (onboarding?.education_details?.degree) score += 20;
    if (interests.length > 0) score += 20;
    if (declaredSkills.length > 0 || structuredProjects.length > 0) score += 20;
    if (assessment) score += 20;
    return Math.min(score, 100);
  }, [onboarding, interests, declaredSkills, structuredProjects, assessment]);

  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans flex flex-col text-[#172638]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* 1. Cinematic Deep Navy Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1930] via-[#142B4A] to-[#0A182E] text-white p-7 sm:p-10 mb-8 border border-white/10 shadow-xl">
          {/* Subtle teal atmospheric glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(22,140,137,0.22)_0%,transparent_70%)] pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[radial-gradient(circle,rgba(20,43,74,0.4)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-teal-200 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#168C89]" />
                <span className="uppercase tracking-wider text-[11px] font-bold">Career Intelligence Hub</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Welcome back{onboarding?.college ? `, ${onboarding.college} student` : ''} <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-2 font-normal leading-relaxed">
                Here is where your career trajectory, skill competencies, and strategic milestones stand right now.
              </p>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-3 mt-5">
                {assessment && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-slate-200 flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-[#168C89]" />
                    <span>Holland RIASEC: <strong className="text-white font-mono tracking-wider">{assessment.code}</strong></span>
                  </div>
                )}
                {targetRole && (
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-slate-200 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-[#168C89]" />
                    <span>Target: <strong className="text-white">{targetRole}</strong></span>
                  </div>
                )}
                <div className="px-3.5 py-1.5 rounded-xl bg-[#168C89]/25 border border-[#168C89]/50 text-xs text-teal-200 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-[#168C89]" />
                  <span>Readiness: <strong className="text-white font-bold">{completionPercentage}%</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions inside banner */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                to={assessment ? "/assessment?retake=true" : "/assessment"}
                className="px-5 py-3 bg-[#168C89] hover:bg-[#137471] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Compass className="w-4 h-4 text-white" />
                <span>{assessment ? 'Retake Discovery' : 'Take Discovery Assessment'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/recommendations"
                className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/15 backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#168C89]" />
                <span>View Career Matches</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Profile Completion Bar */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs mb-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#172638] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#168C89]" /> Profile Completion & Readiness
            </span>
            <span className="text-[#168C89] font-extrabold text-sm">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E2E8F0]">
            <div
              className="h-full bg-[#168C89] transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-slate-400 text-[11px]">Core milestone readiness criteria:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-lg font-semibold text-[11px] border ${onboarding?.education_details?.degree ? 'bg-[#EAF5F4] text-[#168C89] border-[#C5E6E4]' : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'}`}>
                Education {onboarding?.education_details?.degree ? '✓' : ''}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg font-semibold text-[11px] border ${interests.length > 0 ? 'bg-[#EAF5F4] text-[#168C89] border-[#C5E6E4]' : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'}`}>
                Interests {interests.length > 0 ? '✓' : ''}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg font-semibold text-[11px] border ${declaredSkills.length > 0 ? 'bg-[#EAF5F4] text-[#168C89] border-[#C5E6E4]' : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'}`}>
                Skills {declaredSkills.length > 0 ? '✓' : ''}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg font-semibold text-[11px] border ${assessment ? 'bg-[#EAF5F4] text-[#168C89] border-[#C5E6E4]' : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]'}`}>
                Assessment {assessment ? '✓' : ''}
              </span>
            </div>
          </div>
        </div>

        {!hasProfile ? (
          <div className="bg-white rounded-2xl p-10 border border-[#E2E8F0] shadow-xs text-center">
            <div className="w-14 h-14 bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#172638] mb-2">Let's set up your profile first</h2>
            <p className="text-[#64748B] mb-6 max-w-md mx-auto text-sm">
              We don't have your goals or interests yet — that only takes a couple of minutes to configure.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-xs"
            >
              Start onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">

            {/* Left Column: Profile Summary */}
            <div className="md:col-span-1 bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs h-fit space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="font-bold text-[#172638] flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-[#168C89]" /> Verified Profile
                </h3>
                <Link
                  to="/onboarding"
                  className="text-xs font-semibold text-[#168C89] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Edit
                </Link>
              </div>

              <dl className="space-y-3.5 text-xs">
                {onboarding?.path && (
                  <div>
                    <dt className="text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">Status</dt>
                    <dd className="text-[#172638] font-bold mt-0.5">{PATH_LABEL[onboarding.path]}</dd>
                  </div>
                )}
                {(onboarding?.course || onboarding?.year) && (
                  <div>
                    <dt className="text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">Studying</dt>
                    <dd className="text-[#172638] font-medium mt-0.5">
                      {[onboarding?.course, onboarding?.year].filter(Boolean).join(' — ') || '—'}
                    </dd>
                  </div>
                )}
                {onboarding?.hoursPerWeek && (
                  <div>
                    <dt className="text-[#64748B] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#168C89]" /> Available Runway
                    </dt>
                    <dd className="text-[#172638] font-medium mt-0.5">{onboarding.hoursPerWeek.replace(/_/g, ' ')}</dd>
                  </div>
                )}
                {interests.length > 0 && (
                  <div>
                    <dt className="text-[#64748B] font-semibold uppercase tracking-wider text-[10px] mb-1.5">Interests</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {interests.map((i) => (
                        <span key={i} className="bg-[#EAF5F4] text-[#168C89] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#C5E6E4]">
                          {i}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {declaredSkills.length > 0 && (
                  <div>
                    <dt className="text-[#64748B] font-semibold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#168C89]" /> Declared Skills ({declaredSkills.length})
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {declaredSkills.slice(0, 6).map((s) => (
                        <span key={s.name} className="bg-[#F8FAFC] text-[#172638] text-xs font-semibold px-2.5 py-0.5 rounded-md border border-[#E2E8F0]">
                          {s.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Right Main Column */}
            <div className="md:col-span-2 space-y-6">

              {/* Career discovery matches */}
              {assessment ? (
                <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-3 border-b border-[#E2E8F0] pb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-[#168C89]" />
                      <h3 className="font-bold text-[#172638] text-base">Your Recommended Career Matches</h3>
                    </div>
                    <span className="text-xs font-extrabold text-[#168C89] bg-[#EAF5F4] border border-[#C5E6E4] px-2.5 py-0.5 rounded-full font-mono">
                      Holland {assessment.code}
                    </span>
                  </div>

                  {topMatches.length > 0 && (
                    <ul className="space-y-2.5 mb-4">
                      {topMatches.map((m, i) => (
                        <li key={m.title} className="flex items-center justify-between gap-3 text-sm p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#168C89] transition-all">
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-[#142B4A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <Link
                              to={`/careers/${m.slug || m.title.toLowerCase().replace(/[/&]/g, ' ').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}`}
                              className="font-bold text-[#172638] truncate hover:text-[#168C89] transition-colors"
                            >
                              {m.title}
                            </Link>
                          </span>
                          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4]">
                            {m.match_level || (typeof m.fit === 'number' && !isNaN(m.fit) ? `${Math.round(m.fit * 100)}% Fit` : 'Strong Fit')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!knowMeDone && (
                    <p className="text-xs text-[#64748B] bg-[#EAF5F4]/60 border border-[#C5E6E4] rounded-xl px-3 py-2.5 mb-4 leading-relaxed">
                      These recommendations are calculated from your verified assessment answers and declared preferences.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <Link
                      to="/recommendations"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold text-xs transition-all shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#168C89]" />
                      <span>View Career Recommendations Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                    <Link
                      to="/assessment?retake=true"
                      className="inline-flex items-center gap-1.5 text-[#168C89] font-bold text-xs hover:underline"
                    >
                      Retake assessment <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-[#142B4A] text-white rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-5 h-5 text-[#168C89]" />
                    <h3 className="font-bold text-base">Not sure which career fits your strengths?</h3>
                  </div>
                  <p className="text-slate-200 text-xs mb-4 leading-relaxed">
                    Take the adaptive career discovery assessment to uncover your Holland RIASEC code, evidence-grounded career matches, and statutory pathways.
                  </p>
                  <Link
                    to="/assessment"
                    className="inline-flex items-center gap-2 bg-[#168C89] hover:bg-[#116A68] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <span>Start Career Discovery</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Subject & Domain Interest Exploration Card */}
              <div className="bg-gradient-to-r from-[#F0FAF9] via-[#F4FBFA] to-[#EAF5F4] rounded-2xl p-6 border border-[#C5E6E4] shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#168C89] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Interactive Activity Engine</span>
                    </div>
                    <h3 className="font-extrabold text-[#172638] text-base">
                      Discover What You Enjoy — Subject & Domain Interests
                    </h3>
                    <p className="text-xs text-[#64748B] max-w-lg leading-relaxed">
                      Explore interactive challenges across 12 domains (Math, Data, Engineering, Psychology, Arts, Law & more) to discover which topics and problem types you naturally enjoy.
                    </p>
                  </div>
                  <Link
                    to="/discover-interests"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    <span>Explore 12 Domains</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#168C89]" />
                  </Link>
                </div>
              </div>

              {/* Target Role Card */}
              {targetRole && (
                <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#168C89]" />
                    <h3 className="font-bold text-[#172638] text-xs uppercase tracking-wider">Your Active Target Goal</h3>
                  </div>
                  <p className="text-xl font-extrabold text-[#142B4A] mb-3">{targetRole}</p>
                  <Link
                    to="/roadmap"
                    className="inline-flex items-center gap-1.5 text-[#168C89] font-bold text-xs hover:underline"
                  >
                    View your execution roadmap <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Quick Actions Grid: Roadmap, Today, Explorer */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  to="/roadmap"
                  className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs hover:border-[#168C89] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapIcon className="w-4 h-4 text-[#168C89]" />
                    <h4 className="font-bold text-[#172638] text-sm">Personalized Roadmap</h4>
                  </div>
                  <p className="text-[#64748B] text-xs leading-relaxed">Milestone stages, skills to build, curated resources, and timelines.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[#168C89] font-bold text-xs">
                    Open Roadmap <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>

                <Link
                  to="/today"
                  className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs hover:border-[#168C89] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="w-4 h-4 text-[#168C89]" />
                    <h4 className="font-bold text-[#172638] text-sm">Weekly Action Plan</h4>
                  </div>
                  <p className="text-[#64748B] text-xs leading-relaxed">Structured weekly goals, bite-sized tasks, and completion check-offs.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[#168C89] font-bold text-xs">
                    Open Tasks <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>

                <Link
                  to="/careers"
                  className="sm:col-span-2 bg-[#EAF5F4]/60 border border-[#C5E6E4] rounded-2xl p-4 flex items-center justify-between hover:bg-[#EAF5F4] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#142B4A] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Layers className="w-5 h-5 text-[#168C89]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#172638] text-sm group-hover:text-[#142B4A] transition-colors">
                        Explore 1,016 Occupational Pathways & Compare Roles
                      </div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        Filter by academic stream, inspect Indian salary benchmarks, and compare requirements side-by-side.
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#168C89] group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              </div>

            </div>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
};

export default Dashboard;
