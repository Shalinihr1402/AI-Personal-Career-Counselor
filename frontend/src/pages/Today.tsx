import AppFooter from '../components/AppFooter';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import ThisWeekPanel from '../components/ThisWeekPanel';
import { parseWeeklyHours, educationPace, suggestCareers } from '../lib/onboarding';
import { useProfile } from '../context/ProfileContext';
import { getRoadmap } from '../data/roadmaps';
import { buildTasks, generateTimetable, currentWeekIndex } from '../lib/planner';
import { useProgress } from '../lib/useProgress';

const Today: React.FC = () => {
  const { user } = useAuth();
  const { profile: onboarding } = useProfile();
  const interests = useMemo<string[]>(() => onboarding?.interests ?? [], [onboarding?.interests]);

  const resolvedRole =
    onboarding?.targetRole?.trim() ||
    (interests.length > 0 ? suggestCareers(interests)[0] : '') ||
    '';

  const roadmap = useMemo(() => getRoadmap(resolvedRole, interests), [resolvedRole, interests]);
  const pace = educationPace(onboarding?.year);

  const { done, skipped, hoursOverride, startISO, toggleTask, setHours } = useProgress(user?.id);

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

  const hasPlan = Boolean(onboarding);

  return (
    <div className="min-h-screen bg-ambient-glow font-sans flex flex-col">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex items-center gap-2 text-violet-600 mb-1">
          <CalendarCheck className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Today's work</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">What to do now</h1>
        <p className="text-slate-500 mb-8">
          Your focus for this week on the path to <strong className="text-slate-700">{roadmap.role}</strong>.
        </p>

        {!hasPlan ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center">
            <p className="text-slate-500 mb-4">Finish onboarding to generate your plan.</p>
            <Link
              to="/onboarding"
              className="inline-block bg-violet-700 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-violet-800 transition-colors"
            >
              Complete onboarding
            </Link>
          </div>
        ) : (
          <>
            <ThisWeekPanel
              week={currentWeek}
              weekCount={weeks.length}
              done={done}
              onToggle={toggleTask}
              weeklyHours={weeklyHours}
              onSetHours={setHours}
              hoursFromProfile={hoursFromProfile}
            />
            <p className="text-center mt-6">
              <Link to="/roadmap" className="text-violet-700 font-bold text-sm hover:underline">
                See the full roadmap →
              </Link>
            </p>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
};

export default Today;
