import React from 'react';
import {
  CheckCircle2, Circle, ExternalLink, Clock,
  PlayCircle, GraduationCap, BookOpen, Code2, Rocket,
} from 'lucide-react';
import type { PlanTask, PlanWeek } from '../lib/planner';
import { formatDateRange } from '../lib/planner';
import type { ResourceType } from '../data/roadmaps';

const TYPE_ICON: Record<ResourceType, React.ReactNode> = {
  video: <PlayCircle className="w-4 h-4" />,
  course: <GraduationCap className="w-4 h-4" />,
  article: <BookOpen className="w-4 h-4" />,
  practice: <Code2 className="w-4 h-4" />,
  project: <Rocket className="w-4 h-4" />,
};

const HOURS_CHOICES = [4, 8, 15, 24];

function TaskRow({
  task,
  done,
  onToggle,
  emphasis = false,
}: {
  task: PlanTask;
  done: boolean;
  onToggle: () => void;
  emphasis?: boolean;
}) {
  const { resource } = task;
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        emphasis ? 'border-purple-200 bg-purple-50/50' : 'border-slate-100'
      } ${done ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        className={`mt-0.5 shrink-0 ${done ? 'text-green-600' : 'text-slate-300 hover:text-purple-500'} transition-colors`}
      >
        {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`flex items-center gap-1.5 text-sm font-semibold text-slate-800 ${done ? 'line-through' : ''}`}>
          <span className="text-purple-500 shrink-0">{TYPE_ICON[resource.type]}</span>
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-purple-700 hover:underline inline-flex items-center gap-1 truncate"
            >
              <span className="truncate">{resource.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
            </a>
          ) : (
            <span className="truncate">{resource.title}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
          <span className="truncate">{task.skillTitle}</span>
          <span className="shrink-0 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> ~{resource.hours}h
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ThisWeekPanel({
  week,
  weekCount,
  done,
  onToggle,
  weeklyHours,
  onSetHours,
  hoursFromProfile,
}: {
  week: PlanWeek | null;
  weekCount: number;
  done: Set<string>;
  onToggle: (id: string) => void;
  weeklyHours: number;
  onSetHours: (n: number | null) => void;
  hoursFromProfile: number;
}) {
  const tasks = week?.tasks ?? [];
  const incomplete = tasks.filter((t) => !done.has(t.id));
  const doneCount = tasks.length - incomplete.length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const todayFocus = incomplete.slice(0, 3);
  const later = tasks.filter((t) => !todayFocus.includes(t));
  const overriding = weeklyHours !== hoursFromProfile;

  return (
    <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h3 className="font-bold text-slate-900">
          This week{week ? ` · Week ${week.index} of ${weekCount}` : ''}
        </h3>
        {week && (
          <span className="text-xs font-medium text-slate-400">
            {formatDateRange(week.startISO, week.endISO)}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">
          Nothing scheduled here yet. Set a target role and weekly hours to generate your plan.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              {doneCount}/{tasks.length} done
            </span>
          </div>

          {todayFocus.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Today's focus</p>
              <div className="space-y-2">
                {todayFocus.map((t) => (
                  <TaskRow key={t.id} task={t} done={done.has(t.id)} onToggle={() => onToggle(t.id)} emphasis />
                ))}
              </div>
            </div>
          )}

          {later.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {todayFocus.length > 0 ? 'Rest of this week' : 'This week'}
              </p>
              <div className="space-y-2">
                {later.map((t) => (
                  <TaskRow key={t.id} task={t} done={done.has(t.id)} onToggle={() => onToggle(t.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Weekly hours</p>
        <div className="flex flex-wrap items-center gap-2">
          {HOURS_CHOICES.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onSetHours(h === hoursFromProfile ? null : h)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                weeklyHours === h
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
              }`}
            >
              {h} h
            </button>
          ))}
          {overriding && (
            <button
              type="button"
              onClick={() => onSetHours(null)}
              className="text-xs font-semibold text-[#6D28D9] hover:underline ml-1"
            >
              Reset to profile ({hoursFromProfile}h)
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">Changing this rebuilds your whole schedule.</p>
      </div>
    </div>
  );
}
