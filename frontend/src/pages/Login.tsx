import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/onboarding';

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
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }
    navigate(redirectTo, { replace: true });
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
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sans relative overflow-hidden">

      {/* Decorative background blobs & vectors */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/60 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[100px]"></div>

      {/* Decorative dashed lines (Top Left) */}
      <svg className="absolute top-[15%] left-[5%] text-purple-200 hidden md:block" width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M 0,200 C 50,100 150,50 200,0" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>
      {/* Decorative dashed lines (Bottom Right) */}
      <svg className="absolute bottom-[10%] right-[10%] text-purple-200 hidden md:block" width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M 0,0 C 50,100 150,150 200,200" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>

      {/* Stars */}
      <div className="absolute top-[20%] right-[25%] text-purple-300 hidden lg:block"><Sparkles className="w-5 h-5" /></div>
      <div className="absolute top-[25%] right-[22%] text-purple-400 hidden lg:block"><Sparkles className="w-3 h-3" /></div>
      <div className="absolute bottom-[25%] left-[20%] text-purple-400 hidden lg:block"><Sparkles className="w-4 h-4" /></div>

      <div className="w-full max-w-[440px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative z-10 flex flex-col">

        <div className="p-6 sm:p-8 flex-1">
          <div className="flex flex-col items-center mb-6 text-center">
            <Link to="/" className="w-12 h-12 bg-[#6D28D9] rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-purple-600/20 hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </Link>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Welcome back</h2>
            <p className="text-slate-500 font-medium text-sm">Resume your journey where you left off.</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] font-medium rounded-xl px-4 py-3">
              {notice}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[13px] font-semibold text-slate-700">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-[13px] font-semibold text-slate-700">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-[13px] font-semibold text-[#6D28D9] hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6D28D9] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#5B21B6] active:scale-[0.98] transition-all mt-3 shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[12px] font-medium text-slate-400">or continue with</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <div className="bg-[#F8F9FE] p-5 sm:px-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-[13px] font-medium">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-[#6D28D9] font-bold hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
