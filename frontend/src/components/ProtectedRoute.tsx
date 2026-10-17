import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getJourneyStatus } from '../lib/profile';

/**
 * Gate for authenticated-only pages. While the session or profile data is loading
 * it shows a spinner; if there is no user it redirects to /login.
 * Once authenticated, enforces the student journey:
 * 1. Onboarding (incomplete -> /onboarding)
 * 2. Assessment (incomplete -> /assessment)
 * 3. Goal Confirmation (incomplete -> /assessment results & career selection)
 * 4. Complete -> Full access to /dashboard, /roadmap, /today, etc.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const { profile, assessment, activeGoal, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If auth isn't configured yet, don't lock the developer out of the page.
  if (!configured) return <>{children}</>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const { stage } = getJourneyStatus(profile, assessment, activeGoal);
  const currentPath = location.pathname;

  // Stage 1: Incomplete onboarding - user must complete onboarding
  if (stage === 'onboarding') {
    if (currentPath !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    return <>{children}</>;
  }

  // Stage 2: Completed onboarding, incomplete assessment - user must complete assessment
  if (stage === 'assessment') {
    if (currentPath === '/assessment' || currentPath === '/onboarding') {
      return <>{children}</>;
    }
    return <Navigate to="/assessment" replace />;
  }

  // Stage 3: Completed assessment, no active career goal confirmed
  // Allowed on /assessment (to review matches and pick goal), /careers (to explore details),
  // and /onboarding. Gated away from /dashboard, /roadmap, and /today until goal confirmed.
  if (stage === 'goal') {
    const isGoalSelectionRoute =
      currentPath === '/assessment' ||
      currentPath === '/onboarding' ||
      currentPath.startsWith('/careers');

    if (!isGoalSelectionRoute) {
      return <Navigate to="/assessment" replace />;
    }
    return <>{children}</>;
  }

  // Stage 4: All milestones completed - all routes accessible
  return <>{children}</>;
}
