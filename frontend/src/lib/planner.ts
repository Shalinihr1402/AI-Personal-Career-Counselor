import type { Roadmap, Resource } from '../data/roadmaps';

export interface PlanTask {
  id: string; // `${skillId}::${resourceIndex}`
  skillId: string;
  skillTitle: string;
  stageId: string;
  stageTitle: string;
  resource: Resource;
}

export interface PlanWeek {
  index: number; // 1-based
  startISO: string;
  endISO: string;
  tasks: PlanTask[];
  hours: number;
}

interface BuildOptions {
  condenseFoundations: boolean;
  skipped: Set<string>;
}

/** Flatten a roadmap into an ordered task list, one task per resource. */
export function buildTasks(roadmap: Roadmap, opts: BuildOptions): PlanTask[] {
  const tasks: PlanTask[] = [];
  roadmap.stages.forEach((stage, stageIndex) => {
    const isFoundation = stageIndex === 0;
    for (const skill of stage.skills) {
      if (opts.skipped.has(skill.id)) continue;
      skill.resources.forEach((res, ri) => {
        const condense = opts.condenseFoundations && isFoundation;
        const resource: Resource = condense
          ? { ...res, hours: Math.max(1, Math.round(res.hours * 0.6)), title: `${res.title} (review)` }
          : res;
        tasks.push({
          id: `${skill.id}::${ri}`,
          skillId: skill.id,
          skillTitle: skill.title,
          stageId: stage.id,
          stageTitle: stage.title,
          resource,
        });
      });
    }
  });
  return tasks;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Greedily pack tasks into weeks that hit (at least) the weekly-hours budget. */
export function generateTimetable(
  tasks: PlanTask[],
  weeklyHours: number,
  startISO: string,
): PlanWeek[] {
  const budget = Math.max(2, weeklyHours);
  const buckets: PlanTask[][] = [];
  let current: PlanTask[] = [];
  let currentHours = 0;

  for (const task of tasks) {
    if (current.length > 0 && currentHours >= budget) {
      buckets.push(current);
      current = [];
      currentHours = 0;
    }
    current.push(task);
    currentHours += task.resource.hours;
  }
  if (current.length > 0) buckets.push(current);

  return buckets.map((bucketTasks, i) => ({
    index: i + 1,
    startISO: addDays(startISO, i * 7),
    endISO: addDays(startISO, i * 7 + 6),
    tasks: bucketTasks,
    hours: bucketTasks.reduce((sum, t) => sum + t.resource.hours, 0),
  }));
}

/** Which week the student is on now, based on when they started. */
export function currentWeekIndex(weeks: PlanWeek[], startISO: string): number {
  if (weeks.length === 0) return 1;
  const elapsedDays = Math.floor((Date.now() - new Date(startISO).getTime()) / 86_400_000);
  return Math.min(weeks.length, Math.max(1, Math.floor(elapsedDays / 7) + 1));
}

export function formatDateRange(startISO: string, endISO: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Date(startISO).toLocaleDateString(undefined, opts);
  const end = new Date(endISO).toLocaleDateString(undefined, opts);
  return `${start} – ${end}`;
}
