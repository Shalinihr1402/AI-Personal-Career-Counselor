import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Compass, TrendingUp, Target,
  User, Mail, Lock, Eye, EyeOff, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getJourneyStatus } from '../lib/profile';

const Signup: React.FC = () => {
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const { profile, assessment, activeGoal, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && !profileLoading) {
      const status = getJourneyStatus(profile, assessment, activeGoal);
      navigate(status.nextRoute, { replace: true });
    }
  }, [user, authLoading, profile, assessment, activeGoal, profileLoading, navigate]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!firstName || !email || !password) {
      setError('Please fill in your name, email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('Please accept the Terms and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();
    const { error: signUpError } = await signUp(email.trim(), password, fullName);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }
    setNotice(
      'Account created. Check your email to confirm your address, then log in.',
    );
    setTimeout(() => navigate('/login'), 2500);
  };

  const handleGoogle = async () => {
    setError(null);
    setNotice(null);
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) setError(oauthError);
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-6 lg:p-12 font-sans relative">

      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row items-center gap-12 lg:gap-24 z-10 relative">

        {/* Left Side Content */}
        <div className="w-full lg:w-1/2 pt-8 lg:pt-0">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#142B4A] text-white flex items-center justify-center shadow-xs">
              <BrainCircuit className="w-5 h-5 text-[#168C89]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#172638]">AI Personal Career Counselor</span>
          </div>

          <h1 className="text-5xl md:text-[54px] font-extrabold text-[#172638] leading-[1.1] mb-4 tracking-tight">
            Your career <br/>
            <span className="text-[#168C89]">deserves more</span> <br/>
            than guesswork.
          </h1>

          <p className="text-base text-[#64748B] mb-8 max-w-md leading-relaxed font-normal">
            Join students who stopped guessing and started following an evidence-grounded career discovery roadmap.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-2xs">
                <Compass className="w-5 h-5 text-[#168C89]" />
              </div>
              <div>
                <h3 className="font-bold text-[#172638] text-sm mb-0.5">Discover the right career</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">Adaptive assessments mapped to Holland codes and 1,016 real careers.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingUp className="w-5 h-5 text-[#168C89]" />
              </div>
              <div>
                <h3 className="font-bold text-[#172638] text-sm mb-0.5">Plan with clarity</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">Actionable stage roadmaps with verified statutory licensing pathways.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-2xs">
                <Target className="w-5 h-5 text-[#168C89]" />
              </div>
              <div>
                <h3 className="font-bold text-[#172638] text-sm mb-0.5">Stay on track</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">Skill gap milestones and realistic weekly learning commitments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form Card */}
        <div className="w-full lg:w-1/2 max-w-[480px] mx-auto relative">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#E2E8F0] relative z-10 w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-[#172638] mb-1 tracking-tight">Create your account</h2>
              <p className="text-[#64748B] text-xs font-normal">Let's map out your career discovery, <span className="text-[#168C89] font-semibold">step by step.</span></p>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="block text-xs font-bold uppercase tracking-wider text-[#172638]">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                      <User className="w-4 h-4" />
                    </div>
                    <input id="firstName" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] outline-none text-[#172638] text-xs font-medium placeholder:text-[#94A3B8]" placeholder="First name" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="block text-xs font-bold uppercase tracking-wider text-[#172638]">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                      <User className="w-4 h-4" />
                    </div>
                    <input id="lastName" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] outline-none text-[#172638] text-xs font-medium placeholder:text-[#94A3B8]" placeholder="Last name" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#172638]">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] outline-none text-[#172638] text-xs font-medium placeholder:text-[#94A3B8]" placeholder="you@example.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#172638]">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] outline-none text-[#172638] text-xs font-medium placeholder:text-[#94A3B8]" placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] cursor-pointer hover:text-[#172638] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-[#172638]">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] outline-none text-[#172638] text-xs font-medium placeholder:text-[#94A3B8]" placeholder="Re-enter your password" />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-[11px] font-semibold text-rose-600">Passwords do not match.</p>
                )}
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#64748B] font-medium cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#168C89] focus:ring-[#168C89]" />
                <span>I agree to the <a href="#" className="text-[#168C89] font-semibold hover:underline">Terms</a> and <a href="#" className="text-[#168C89] font-semibold hover:underline">Privacy Policy</a>.</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-xs"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up for Free <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-4">
              <div className="h-px bg-[#E2E8F0] flex-1"></div>
              <span className="text-[11px] font-medium text-[#64748B]">or continue with</span>
              <div className="h-px bg-[#E2E8F0] flex-1"></div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full bg-white border border-[#E2E8F0] text-[#172638] font-bold py-2.5 px-4 rounded-xl hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-3 text-xs shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="mt-5 text-center">
              <p className="text-[#64748B] text-xs font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-[#168C89] font-bold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
