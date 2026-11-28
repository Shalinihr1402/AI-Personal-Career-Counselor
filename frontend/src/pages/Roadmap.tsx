import AppFooter from '../components/AppFooter';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Circle, ExternalLink, Clock, Target, RotateCcw,
  EyeOff, Eye, ChevronDown, PlayCircle, GraduationCap, BookOpen, Code2, Rocket,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import ThisWeekPanel from '../components/ThisWeekPanel';
import { parseWeeklyHours, educationPace, suggestCareers } from '../lib/onboarding';
import { useProfile } from '../context/ProfileContext';
import { getRoadmap, skillHours, type ResourceType } from '../data/roadmaps';
import {
  buildTasks, generateTimetable, currentWeekIndex, formatDateRange,
} from '../lib/planner';
import { useProgress } from '../lib/useProgress';

const TYPE_ICON: Record<ResourceType, React.ReactNode> = {
  video: <PlayCircle className="w-4 h-4" />,
  course: <GraduationCap className="w-4 h-4" />,
  article: <BookOpen className="w-4 h-4" />,
  practice: <Code2 className="w-4 h-4" />,
  project: <Rocket className="w-4 h-4" />,
};

const Roadmap: React.FC = () => {
  const { user, configured } = useAuth();
  const { profile: onboarding, saveProfile } = useProfile();
  const interests = useMemo<string[]>(() => onboarding?.interests ?? [], [onboarding?.interests]);

  const resolvedRole =
    onboarding?.targetRole?.trim() ||
    (interests.length > 0 ? suggestCareers(interests)[0] : '') ||
    '';

  const roadmap = useMemo(() => getRoadmap(resolvedRole, interests), [resolvedRole, interests]);
  const pace = educationPace(onboarding?.year);

  const progress = useProgress(user?.id);
  const { done, skipped, hoursOverride, startISO, toggleTask, toggleSkill, setHours, reset } = progress;

  const hoursFromProfile = parseWeeklyHours(onboarding?.hoursPerWeek);
  const weeklyHours = hoursOverride ?? hoursFromProfile;

  const tasks = useMemo(
    () => buildTasks(roadmap, { condenseFoundations: pace.condenseFoundations, skipped }),
    [roadmap, pace.condenseFoundations, skipped],
  );
  const weeks = useMemo(
    () => generateTimetable(tasks, weeklyHours, startISO),
    [tasks, weeklyHours, startISO],
  );
  const curIdx = currentWeekIndex(weeks, startISO);
  const currentWeek = weeks[curIdx - 1] ?? null;

  const totalTasks = tasks.length;
  const doneInPlan = tasks.filter((t) => done.has(t.id)).length;
  const overallPct = totalTasks ? Math.round((doneInPlan / totalTasks) * 100) : 0;

  const [roleInput, setRoleInput] = useState(onboarding?.targetRole ?? '');
  const [savingRole, setSavingRole] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);

  const saveRole = async () => {
    if (!configured) return;
    setSavingRole(true);
    setRoleSaved(false);
    try {
      await saveProfile({ targetRole: roleInput.trim() });
      setRoleSaved(true);
    } catch {
      /* ignore — non-blocking */
    }
    setSavingRole(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset all roadmap progress and start the schedule from today?')) {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans flex flex-col">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Cinematic Deep Navy Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1930] via-[#142B4A] to-[#0A182E] text-white p-7 sm:p-10 mb-8 border border-white/10 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(22,140,137,0.22)_0%,transparent_70%)] pointer-events-none -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-teal-200 text-xs font-semibold mb-3">
                <Target className="w-3.5 h-3.5 text-[#168C89]" />
                <span className="uppercase tracking-wider text-[11px] font-bold">Execution Roadmap</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                The path to {roadmap.role}
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl font-normal leading-relaxed">
                {pace.note}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-slate-200">
                  {weeks.length} weeks scheduled
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-slate-200">
                  {weeklyHours}h / week intensity
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#168C89]/25 border border-[#168C89]/50 text-teal-200 font-bold">
                  {overallPct}% completed
                </span>
              </div>
            </div>

            {/* Target Role input embedded inside banner */}
            {configured && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl shrink-0 w-full md:w-80 space-y-2.5">
                <label htmlFor="role" className="block text-xs font-bold text-slate-200">
                  Change Target Goal
                </label>
                <div className="flex gap-2">
                  <input
                    id="role"
                    value={roleInput}
                    onChange={(e) => {
                      setRoleInput(e.target.value);
                      setRoleSaved(false);
                    }}
                    placeholder="e.g. Data Analyst"
                    className="w-full px-3 py-2 rounded-xl bg-white/95 border border-white/20 focus:ring-2 focus:ring-[#168C89] outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={saveRole}
                    disabled={savingRole || roleInput.trim() === (onboarding?.targetRole ?? '').trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#168C89] hover:bg-[#137471] text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                  >
                    {savingRole ? 'Saving…' : roleSaved ? 'Saved ✓' : 'Update'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: this week */}
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-20 self-start">
            <ThisWeekPanel
              week={currentWeek}
              weekCount={weeks.length}
              done={done}
              onToggle={toggleTask}
              weeklyHours={weeklyHours}
              onSetHours={setHours}
              hoursFromProfile={hoursFromProfile}
            />
            <div className="text-center">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-500 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset progress
              </button>
            </div>
          </div>

          {/* Right: full roadmap + schedule */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stages */}
            <section className="space-y-5">
              {roadmap.stages.map((stage, si) => (
                <div key={stage.id} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-[#EAF5F4] text-[#142B4A] text-xs font-bold flex items-center justify-center">
                      {si + 1}
                    </span>
                    <h2 className="font-extrabold text-[#172638]">{stage.title}</h2>
                  </div>
                  <p className="text-[#64748B] text-sm mb-4">{stage.goal}</p>

                  <div className="space-y-4">
                    {stage.skills.map((skill) => {
                      const isSkipped = skipped.has(skill.id);
                      const resourceIds = skill.resources.map((_, ri) => `${skill.id}::${ri}`);
                      const doneCount = resourceIds.filter((id) => done.has(id)).length;
                      const allDone = doneCount === resourceIds.length && !isSkipped;
                      return (
                        <div key={skill.id} className={isSkipped ? 'opacity-50' : ''}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {allDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                                )}
                                <h3 className="font-bold text-[#172638] text-sm">{skill.title}</h3>
                              </div>
                              <p className="text-slate-400 text-xs ml-6 mt-0.5">{skill.summary}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-slate-400 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {skillHours(skill)}h
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleSkill(skill.id)}
                                title={isSkipped ? 'Add back to schedule' : 'Skip — I already know this'}
                                className="text-slate-300 hover:text-[#168C89] transition-colors cursor-pointer"
                              >
                                {isSkipped ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {!isSkipped && (
                            <div className="ml-6 mt-2 space-y-1.5">
                              {skill.resources.map((res, ri) => {
                                const id = `${skill.id}::${ri}`;
                                const isDone = done.has(id);
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggleTask(id)}
                                    className={`w-full flex items-center gap-2 text-left text-xs rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                                      isDone ? 'opacity-60' : ''
                                    }`}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                    )}
                                    <span className="text-[#168C89] shrink-0">{TYPE_ICON[res.type]}</span>
                                    <span className={`flex-1 truncate font-medium text-slate-600 ${isDone ? 'line-through' : ''}`}>
                                      {res.title}
                                    </span>
                                    {res.url && (
                                      <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-slate-300 hover:text-[#168C89] shrink-0"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                    <span className="text-slate-300 shrink-0">~{res.hours}h</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            {/* Full schedule */}
            <section>
              <h2 className="font-extrabold text-[#172638] mb-3">Full schedule</h2>
              <div className="space-y-2">
                {weeks.map((w) => {
                  const wDone = w.tasks.filter((t) => done.has(t.id)).length;
                  const wPct = w.tasks.length ? Math.round((wDone / w.tasks.length) * 100) : 0;
                  return (
                    <details
                      key={w.index}
                      open={w.index === curIdx}
                      className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm group"
                    >
                      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                        <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                        <span className="font-bold text-[#172638] text-sm shrink-0">
                          Week {w.index}
                          {w.index === curIdx && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-[#EAF5F4] text-[#142B4A] px-1.5 py-0.5 rounded border border-[#168C89]/20">
                              now
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:inline shrink-0">
                          {formatDateRange(w.startISO, w.endISO)}
                        </span>
                        <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${wPct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 shrink-0">
                          {wDone}/{w.tasks.length} · ~{w.hours}h
                        </span>
                      </summary>
                      <div className="px-4 pb-3 pt-0 space-y-1">
                        {w.tasks.map((t) => {
                          const isDone = done.has(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleTask(t.id)}
                              className={`w-full flex items-center gap-2 text-left text-xs rounded-lg px-2 py-1.5 hover:bg-slate-50 ${
                                isDone ? 'opacity-60' : ''
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              )}
                              <span className={`flex-1 truncate font-medium text-slate-600 ${isDone ? 'line-through' : ''}`}>
                                {t.resource.title}
                              </span>
                              <span className="text-slate-300 shrink-0">{t.skillTitle}</span>
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>

            <p className="text-center">
              <Link to="/today" className="text-[#168C89] font-bold text-sm hover:underline">
                Go to today's tasks →
              </Link>
            </p>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
};

export default Roadmap;
