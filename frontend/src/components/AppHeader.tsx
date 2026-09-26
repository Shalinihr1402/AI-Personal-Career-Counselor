import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/assessment', label: 'Discover' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/today', label: 'Today' },
];

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const { setupNeeded } = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <BrainCircuit className="w-6 h-6 text-purple-600" />
          <span className="font-bold text-slate-900 hidden sm:inline">AI Personal Career Counselor</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-semibold">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === item.to
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className="text-slate-400 font-medium hidden lg:inline max-w-[180px] truncate">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
      {setupNeeded && (
        <div className="bg-amber-50 border-t border-amber-100 text-amber-800 text-xs font-medium px-6 py-2 text-center">
          Database not set up yet — your answers can't be saved. Run{' '}
          <code className="font-mono">supabase/migrations/0001_phase1_counselor.sql</code> in the
          Supabase SQL Editor, then refresh.
        </div>
      )}
    </header>
  );
}
