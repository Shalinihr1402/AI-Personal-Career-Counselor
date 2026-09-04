import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Compass, TrendingUp, Target,
  User, Mail, Lock, Eye, EyeOff, ArrowRight,
  GraduationCap, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 lg:p-12 font-sans relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/60 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[100px]"></div>
      <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-blue-50/60 rounded-full blur-[80px]"></div>

      {/* Subtle Star */}
      <div className="absolute top-[10%] left-[45%] text-purple-200">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z"/></svg>
      </div>

      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row items-center gap-12 lg:gap-24 z-10 relative">

        {/* Left Side Content */}
        <div className="w-full lg:w-1/2 pt-8 lg:pt-0">
          <div className="flex items-center gap-2 mb-10">
            <BrainCircuit className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">AI Personal Career Counselor</span>
          </div>

          <h1 className="text-5xl md:text-[56px] font-extrabold text-slate-900 leading-[1.1] mb-4 tracking-tight">
            Your career <br/>
            <span className="text-[#6D28D9]">deserves more</span> <br/>
            than luck.
          </h1>

          <p className="text-lg text-slate-500 mb-8 max-w-md leading-relaxed font-medium">
            Join thousands of students who stopped guessing and started following a personalized roadmap that actually works.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200/50 shadow-sm">
                <Compass className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px] mb-0.5">Discover the right career</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Explore paths that match<br/>your interests and strengths.</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200/50 shadow-sm">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px] mb-0.5">Plan with clarity</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Get a personalized roadmap with<br/>clear next steps.</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200/50 shadow-sm">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px] mb-0.5">Stay on track</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Track progress, build consistency<br/>and achieve your goals.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-slate-500 font-medium text-[15px]">Trusted by students worldwide.</p>
          </div>
        </div>

        {/* Right Side Form Card */}
        <div className="w-full lg:w-1/2 max-w-[480px] mx-auto relative">

          {/* Decorative Dashed Arc & Icons */}
          <div className="hidden lg:block absolute -left-[140px] top-1/2 -translate-y-1/2 -z-10 w-[200px] h-[400px]">
             <svg width="100%" height="100%" viewBox="0 0 200 400" fill="none" className="text-purple-200">
                <path d="M200,20 C50,100 50,300 200,380" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
             </svg>
             <div className="absolute top-[35px] left-[105px] w-12 h-12 bg-white rounded-full shadow-sm border border-purple-50 flex items-center justify-center text-purple-500">
               <GraduationCap className="w-5 h-5" />
             </div>
             <div className="absolute top-[175px] left-[55px] w-12 h-12 bg-white rounded-full shadow-sm border border-purple-50 flex items-center justify-center text-purple-500">
               <ClipboardList className="w-5 h-5" />
             </div>
             <div className="absolute top-[315px] left-[105px] w-12 h-12 bg-white rounded-full shadow-sm border border-purple-50 flex items-center justify-center text-purple-500">
               <Target className="w-5 h-5" />
             </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-10 w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Create your account</h2>
              <p className="text-slate-500 font-medium text-sm">Let's map out your future, <span className="text-purple-600">step by step.</span></p>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-[13px] font-semibold text-slate-700">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input id="firstName" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="First name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-[13px] font-semibold text-slate-700">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input id="lastName" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="Last name" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-[13px] font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="you@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-[13px] font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="Create a strong password (min. 8 chars)" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal" placeholder="Re-enter your password" />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-[12px] font-medium text-red-500">Passwords do not match.</p>
                )}
              </div>

              <label className="flex items-start gap-2.5 text-[13px] text-slate-500 font-medium cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                <span>I agree to the <a href="#" className="text-[#6D28D9] font-semibold hover:underline">Terms</a> and <a href="#" className="text-[#6D28D9] font-semibold hover:underline">Privacy Policy</a>.</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6D28D9] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#5B21B6] active:scale-[0.98] transition-all mt-3 shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

            <div className="mt-6 text-center">
              <p className="text-slate-600 text-[13px] font-medium">
                Already have a roadmap?{' '}
                <Link to="/login" className="text-[#6D28D9] font-bold hover:underline">
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
