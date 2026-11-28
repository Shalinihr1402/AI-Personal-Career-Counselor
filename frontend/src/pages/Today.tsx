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
    <div className="min-h-screen bg-[#F5F8FC] font-sans flex flex-col">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Cinematic Deep Navy Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1930] via-[#142B4A] to-[#0A182E] text-white p-7 sm:p-9 mb-8 border border-white/10 shadow-xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(circle,rgba(22,140,137,0.2)_0%,transparent_70%)] pointer-events-none -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-teal-200 text-xs font-semibold mb-3">
              <CalendarCheck className="w-3.5 h-3.5 text-[#168C89]" />
              <span className="uppercase tracking-wider text-[11px] font-bold">Daily Priority & Learning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              What to do this week
            </h1>
            <p className="text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Your focused execution priorities on the path to <strong className="text-teal-200 font-semibold">{roadmap.role}</strong>.
            </p>
          </div>
        </div>

        {!hasPlan ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center shadow-sm">
            <p className="text-[#64748B] mb-4">Finish onboarding to generate your plan.</p>
            <Link
              to="/onboarding"
              className="inline-block bg-[#142B4A] text-white font-bold py-2.5 px-5 rounded-xl hover:bg-[#10233D] transition-colors"
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
              <Link to="/roadmap" className="text-[#168C89] font-bold text-sm hover:underline">
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
