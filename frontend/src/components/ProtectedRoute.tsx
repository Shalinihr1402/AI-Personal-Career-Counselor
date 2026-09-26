import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

/**
 * Gate for authenticated-only pages. While the session is loading it shows a
 * spinner; if there is no user it redirects to /login and remembers where the
 * user was headed so login can send them back.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const { loading: profileLoading } = useProfile();
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

  return <>{children}</>;
}
