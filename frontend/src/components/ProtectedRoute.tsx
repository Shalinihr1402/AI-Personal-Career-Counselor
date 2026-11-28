import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

/**
 * Gate for authenticated-only pages. While the session or profile data is loading
 * it shows a spinner; if there is no user it redirects to /login.
 * Once authenticated, permits valid navigation between all student pages.
 * Brand new accounts without initial onboarding data are guided to /onboarding.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#168C89]/20 border-t-[#168C89] rounded-full animate-spin" />
      </div>
    );
  }

  // If auth isn't configured yet, don't lock the developer out of the page.
  if (!configured) return <>{children}</>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Guide brand new accounts without initial onboarding data to /onboarding
  const hasOnboarding = Boolean(
    profile?.onboardingComplete ||
    profile?.course ||
    profile?.college ||
    profile?.education_details ||
    user.user_metadata?.onboarding_complete
  );

  if (!hasOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated students can freely navigate all permitted pages
  return <>{children}</>;
}
