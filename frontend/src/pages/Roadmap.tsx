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
    <div className="min-h-screen bg-[#F8F9FE] font-sans">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-purple-500 mb-1">
          <Target className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Your roadmap</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
          The path to {roadmap.role}
        </h1>
        <p className="text-slate-500 mb-1">{pace.note}</p>
        <p className="text-slate-400 text-sm mb-8">
          {weeks.length} weeks at {weeklyHours}h/week · {overallPct}% complete
        </p>

        {/* Change target role */}
        {configured && (
          <div className="bg-white rounded-[1.25rem] p-4 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-6 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label htmlFor="role" className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Target role
              </label>
              <input
                id="role"
                value={roleInput}
                onChange={(e) => {
                  setRoleInput(e.target.value);
                  setRoleSaved(false);
                }}
                placeholder="e.g. Data Analyst"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-medium text-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={saveRole}
              disabled={savingRole || roleInput.trim() === (onboarding?.targetRole ?? '').trim()}
              className="px-5 py-2.5 rounded-xl bg-[#6D28D9] text-white font-bold text-sm hover:bg-[#5B21B6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingRole ? 'Saving…' : roleSaved ? 'Saved ✓' : 'Update roadmap'}
            </button>
          </div>
        )}

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
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-500 text-xs font-semibold transition-colors"
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
                <div key={stage.id} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                      {si + 1}
                    </span>
                    <h2 className="font-extrabold text-slate-900">{stage.title}</h2>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{stage.goal}</p>

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
                                <h3 className="font-bold text-slate-800 text-sm">{skill.title}</h3>
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
                                className="text-slate-300 hover:text-purple-500 transition-colors"
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
                                    className={`w-full flex items-center gap-2 text-left text-xs rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors ${
                                      isDone ? 'opacity-60' : ''
                                    }`}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                    )}
                                    <span className="text-purple-400 shrink-0">{TYPE_ICON[res.type]}</span>
                                    <span className={`flex-1 truncate font-medium text-slate-600 ${isDone ? 'line-through' : ''}`}>
                                      {res.title}
                                    </span>
                                    {res.url && (
                                      <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-slate-300 hover:text-purple-500 shrink-0"
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
              <h2 className="font-extrabold text-slate-900 mb-3">Full schedule</h2>
              <div className="space-y-2">
                {weeks.map((w) => {
                  const wDone = w.tasks.filter((t) => done.has(t.id)).length;
                  const wPct = w.tasks.length ? Math.round((wDone / w.tasks.length) * 100) : 0;
                  return (
                    <details
                      key={w.index}
                      open={w.index === curIdx}
                      className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgb(0,0,0,0.02)] group"
                    >
                      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                        <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                        <span className="font-bold text-slate-800 text-sm shrink-0">
                          Week {w.index}
                          {w.index === curIdx && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
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
              <Link to="/today" className="text-[#6D28D9] font-bold text-sm hover:underline">
                Go to today's tasks →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Roadmap;
