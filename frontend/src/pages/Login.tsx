import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BrainCircuit, Mail, Lock, Eye, EyeOff, ArrowRight,
  Compass, TrendingUp, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import {
  getJourneyStatus,
  loadProfile,
  loadLatestAssessment,
  loadActiveGoal,
} from '../lib/profile';

const Login: React.FC = () => {
  const { user, loading: authLoading, signIn, signInWithGoogle, resetPassword } = useAuth();
  const { profile, assessment, activeGoal, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const explicitRedirect = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (!authLoading && user && !profileLoading) {
      const status = getJourneyStatus(profile, assessment, activeGoal);
      const target = status.stage === 'complete' ? (explicitRedirect ?? '/dashboard') : status.nextRoute;
      navigate(target, { replace: true });
    }
  }, [user, authLoading, profile, assessment, activeGoal, profileLoading, navigate, explicitRedirect]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const { error: signInError, user: signedInUser } = await signIn(email.trim(), password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    if (signedInUser) {
      try {
        const p = await loadProfile(signedInUser.id);
        const a = p?.onboardingComplete ? await loadLatestAssessment(signedInUser.id) : null;
        const g = a ? await loadActiveGoal(signedInUser.id).catch(() => null) : null;
        const status = getJourneyStatus(p, a, g);
        const target =
          status.stage === 'complete'
            ? (explicitRedirect ?? '/dashboard')
            : status.nextRoute;
        navigate(target, { replace: true });
        return;
      } catch {
        const onboardingDone = Boolean(
          (signedInUser?.user_metadata as Record<string, unknown> | undefined)?.onboarding_complete,
        );
        const target = explicitRedirect ?? (onboardingDone ? '/assessment' : '/onboarding');
        navigate(target, { replace: true });
        return;
      }
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) setError(oauthError);
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?".');
      return;
    }
    const { error: resetError } = await resetPassword(email.trim());
    if (resetError) {
      setError(resetError);
      return;
    }
    setNotice('Check your inbox for a password reset link.');
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-6 lg:p-12 font-sans relative">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row items-center gap-12 lg:gap-24 z-10 relative">

        {/* Left Side Content */}
        <div className="w-full lg:w-1/2 pt-8 lg:pt-0">
          <div className="flex items-center gap-2.5 mb-10">
            <Link to="/" className="w-10 h-10 rounded-xl bg-[#142B4A] text-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 text-[#168C89]" />
            </Link>
            <span className="text-xl font-bold tracking-tight text-[#172638]">AI Personal Career Counselor</span>
          </div>

          <h1 className="text-5xl md:text-[54px] font-extrabold text-[#172638] leading-[1.1] mb-4 tracking-tight">
            Welcome back to your <br/>
            <span className="text-[#168C89]">career trajectory</span>.
          </h1>

          <p className="text-base text-[#64748B] mb-8 max-w-md leading-relaxed font-normal">
            Pick up exactly where you left off with evidence-grounded career discovery, skill gap analysis, and tailored roadmaps.
          </p>

          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-2xs">
                <Target className="w-5 h-5 text-[#168C89]" />
              </div>
              <div>
                <h3 className="font-bold text-[#172638] text-sm mb-0.5">Targeted Execution Roadmaps</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">Personalized week-by-week plans tailored to your real college schedule.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-2xs">
                <Compass className="w-5 h-5 text-[#168C89]" />
              </div>
              <div>
                <h3 className="font-bold text-[#172638] text-sm mb-0.5">Holland RIASEC Career Intelligence</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">Objective matching across 1,016 verified career options with zero bias.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingUp className="w-5 h-5 text-[#168C89]" />
              </div>
              <div>
                <h3 className="font-bold text-[#172638] text-sm mb-0.5">Skill Gap Diagnostics</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">Benchmark your competencies against real job market requirements.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Login Card */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-xs border border-[#E2E8F0] overflow-hidden relative z-10 flex flex-col">
            <div className="p-6 sm:p-8 flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-[#172638] tracking-tight mb-1">Sign In</h2>
                <p className="text-[#64748B] font-medium text-sm">Enter your credentials to access your counselor portal.</p>
              </div>

              {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
              {notice && (
                <div className="mb-4 bg-[#EAF5F4] border border-[#C5E6E4] text-[#168C89] text-xs font-semibold rounded-xl px-4 py-3">
                  {notice}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#172638]">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] outline-none transition-all text-[#172638] text-sm font-medium placeholder:text-[#94A3B8]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#172638]">Password</label>
                    <button type="button" tabIndex={3} onClick={handleForgotPassword} className="text-xs font-semibold text-[#168C89] hover:underline cursor-pointer">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      tabIndex={2}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] outline-none transition-all text-[#172638] text-sm font-medium placeholder:text-[#94A3B8]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] cursor-pointer hover:text-[#172638] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#142B4A] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#0E1F36] active:scale-[0.98] transition-all mt-3 shadow-xs flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="h-px bg-[#E2E8F0] flex-1"></div>
                <span className="text-[12px] font-medium text-[#64748B]">or continue with</span>
                <div className="h-px bg-[#E2E8F0] flex-1"></div>
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full bg-white border border-[#E2E8F0] text-[#172638] font-bold py-2.5 px-4 rounded-xl hover:bg-[#F8FAFC] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  type="button"
                  id="explore-demo-btn"
                  onClick={async () => {
                    const res = await signIn('demo@career.ai', 'demo123');
                    if (res.user) {
                      navigate('/dashboard');
                    }
                  }}
                  className="w-full bg-[#EAF5F4] border border-[#168C89]/30 text-[#168C89] font-bold py-2.5 px-4 rounded-xl hover:bg-[#D7ECE9] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-2xs"
                >
                  <BrainCircuit className="w-4 h-4 text-[#168C89]" />
                  Explore Demo Portal (One-Click)
                </button>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-5 sm:px-8 border-t border-[#E2E8F0] text-center">
              <p className="text-[#64748B] text-xs font-medium">
                Don't have an account yet?{' '}
                <Link to="/signup" className="text-[#168C89] font-bold hover:underline">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
