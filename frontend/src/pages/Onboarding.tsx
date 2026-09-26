import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, CheckCircle2, X, Sparkles, ArrowRight, ArrowLeft,
  LogOut, Target, Search, TrendingUp, Clock,
  Code2, Palette, Calculator, Users, Briefcase, FlaskConical, HeartPulse,
  Dumbbell, PenTool, Mic, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { API_BASE } from '../lib/api';
import type { Profile } from '../lib/profile';

type Path = 'know_goal' | 'not_sure' | 'need_plan';

interface OnboardingData {
  path: Path | null;
  college: string;
  course: string;
  year: string;
  interests: string[];
  strengthsNote: string;
  targetRole: string;
  hoursPerWeek: string;
}

const emptyData: OnboardingData = {
  path: null,
  college: '',
  course: '',
  year: '',
  interests: [],
  strengthsNote: '',
  targetRole: '',
  hoursPerWeek: '',
};

const STEPS = ['Your goal', 'About you', 'Interests', 'Target & time', 'Resume'] as const;

const PATH_OPTIONS: { value: Path; icon: React.ReactNode; title: string; desc: string }[] = [
  { value: 'know_goal', icon: <Target className="w-6 h-6" />, title: 'I know my career goal', desc: "I know what I want. Help me build a plan to reach it." },
  { value: 'not_sure', icon: <Search className="w-6 h-6" />, title: "I'm not sure which career fits me", desc: 'Help me discover careers that match my interests and skills.' },
  { value: 'need_plan', icon: <TrendingUp className="w-6 h-6" />, title: 'I have a career, need a plan', desc: 'Show me exactly what to learn and do to get there.' },
];

const YEAR_OPTIONS = ['1st year', '2nd year', '3rd year', 'Final year', 'Graduate'];

const INTEREST_OPTIONS: { value: string; icon: React.ReactNode }[] = [
  { value: 'Coding & Tech', icon: <Code2 className="w-4 h-4" /> },
  { value: 'Design & Creativity', icon: <Palette className="w-4 h-4" /> },
  { value: 'Data & Numbers', icon: <Calculator className="w-4 h-4" /> },
  { value: 'Communication & People', icon: <Users className="w-4 h-4" /> },
  { value: 'Business & Management', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'Science & Research', icon: <FlaskConical className="w-4 h-4" /> },
  { value: 'Healthcare', icon: <HeartPulse className="w-4 h-4" /> },
  { value: 'Sports & Fitness', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'Writing & Content', icon: <PenTool className="w-4 h-4" /> },
  { value: 'Public Speaking', icon: <Mic className="w-4 h-4" /> },
];

const HOURS_OPTIONS = ['Less than 5 hrs/week', '5-10 hrs/week', '10-20 hrs/week', '20+ hrs/week'];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal';

const Onboarding: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, saveProfile } = useProfile();
  const navigate = useNavigate();

  const alreadyDone = Boolean(profile?.onboardingComplete);
  const [redoing, setRedoing] = useState(false);

  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>(emptyData);

  // Resume step's own state (kept separate: it's an async upload, not a form field)
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const update = (patch: Partial<OnboardingData>) => setData((d) => ({ ...d, ...patch }));

  const toggleInterest = (value: string) => {
    setData((d) => ({
      ...d,
      interests: d.interests.includes(value)
        ? d.interests.filter((i) => i !== value)
        : [...d.interests, value],
    }));
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const finishOnboarding = async () => {
    setSaveError(null);
    try {
      await saveProfile({
        ...data,
        // Keep the previously parsed resume if they didn't upload a new one.
        resume: (parsedData as Profile['resume']) ?? profile?.resume,
        onboardingComplete: true,
      });
      setFinished(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Could not save onboarding profile:', err);
      setSaveError("We couldn't save your answers. Check your connection and try again.");
    }
  };

  // --- Resume upload (unchanged behavior, now embedded as the last step) ---
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFileSelection(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFileSelection(e.target.files[0]);
  };
  const handleFileSelection = (selectedFile: File) => {
    setResumeError(null);
    if (selectedFile.type !== 'application/pdf') {
      setResumeError('Please upload a PDF file.');
      return;
    }
    setFile(selectedFile);
  };
  const uploadResume = async () => {
    if (!file) return;
    setResumeLoading(true);
    setResumeError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE}/api/upload-resume`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to parse resume');
      const parsed = await response.json();
      setParsedData(parsed);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'An error occurred while uploading.');
    } finally {
      setResumeLoading(false);
    }
  };

  const restart = () => {
    // Start from their saved answers so "update" doesn't mean "retype everything".
    setData(
      profile
        ? {
            path: profile.path ?? null,
            college: profile.college ?? '',
            course: profile.course ?? '',
            year: profile.year ?? '',
            interests: profile.interests ?? [],
            strengthsNote: profile.strengthsNote ?? '',
            targetRole: profile.targetRole ?? '',
            hoursPerWeek: profile.hoursPerWeek ?? '',
          }
        : emptyData,
    );
    setFile(null);
    setParsedData(null);
    setResumeError(null);
    setStep(0);
    setFinished(false);
    setRedoing(true);
  };

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/60 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-[800px] relative z-10">

        {/* Account bar */}
        {user && (
          <div className="flex items-center justify-end gap-3 mb-6 text-sm">
            <span className="text-slate-500 font-medium">
              Signed in as <span className="text-slate-800 font-semibold">{user.email}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}

        {/* Already completed onboarding on a previous visit */}
        {alreadyDone && !redoing && !finished ? (
          <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome back!</h1>
            <p className="text-slate-500 mb-8">
              You've already told us about yourself. Head to your dashboard to see your career matches.
            </p>
            <div className="flex items-center justify-center gap-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
              >
                Go to dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={restart}
                className="text-[#6D28D9] font-bold hover:underline text-sm"
              >
                Update my answers
              </button>
            </div>
          </div>
        ) : finished ? (
          /* --- Completion screen --- */
          <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">You're all set! 🎉</h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Thanks, {data.college || 'friend'}! We're using what you told us to build your
              personalized career roadmap.
            </p>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8 text-left text-sm text-slate-600 space-y-1.5">
              {data.path && <p><strong className="text-slate-800">Goal status:</strong> {PATH_OPTIONS.find((p) => p.value === data.path)?.title}</p>}
              {(data.course || data.year) && <p><strong className="text-slate-800">Studying:</strong> {[data.course, data.year].filter(Boolean).join(' — ')}</p>}
              {data.interests.length > 0 && <p><strong className="text-slate-800">Interests:</strong> {data.interests.join(', ')}</p>}
              {data.targetRole && <p><strong className="text-slate-800">Target role:</strong> {data.targetRole}</p>}
              {data.hoursPerWeek && <p><strong className="text-slate-800">Time available:</strong> {data.hoursPerWeek}</p>}
              {parsedData && <p><strong className="text-slate-800">Resume:</strong> parsed and saved</p>}
            </div>
            <div className="flex items-center justify-center gap-6">
              <Link
                to={data.path === 'not_sure' ? '/assessment' : '/dashboard'}
                className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
              >
                {data.path === 'not_sure' ? 'Start career discovery' : 'Go to dashboard'}{' '}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={restart}
                className="text-[#6D28D9] font-bold hover:underline text-sm"
              >
                Edit my answers
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Step {step + 1} of {STEPS.length}</span>
                <span className="text-purple-600">{STEPS[step]}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">

              {/* --- Step 0: Path --- */}
              {step === 0 && (
                <div>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">What do you need help with?</h1>
                    <p className="text-slate-500">Choose the option that best describes you.</p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    {PATH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update({ path: opt.value })}
                        className={`text-left rounded-2xl border-2 p-5 transition-all ${
                          data.path === opt.value
                            ? 'border-purple-600 bg-purple-50/60 shadow-sm'
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-3 ${data.path === opt.value ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-500'}`}>
                          {opt.icon}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1">{opt.title}</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* --- Step 1: Profile --- */}
              {step === 1 && (
                <div>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">A bit about you</h1>
                    <p className="text-slate-500">Helps us tailor timelines to your student life.</p>
                  </div>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-700">College / University</label>
                      <input value={data.college} onChange={(e) => update({ college: e.target.value })} className={inputClass} placeholder="e.g. State University" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-700">Course / Degree</label>
                      <input value={data.course} onChange={(e) => update({ course: e.target.value })} className={inputClass} placeholder="e.g. B.Tech Computer Science" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-700">Year of study</label>
                      <div className="flex flex-wrap gap-2">
                        {YEAR_OPTIONS.map((y) => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => update({ year: y })}
                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                              data.year === y
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Step 2: Interests --- */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">What are you into?</h1>
                    <p className="text-slate-500">Pick a few — this shapes your career matches.</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 justify-center mb-6 max-w-xl mx-auto">
                    {INTEREST_OPTIONS.map((opt) => {
                      const active = data.interests.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleInterest(opt.value)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                            active
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                          }`}
                        >
                          {opt.icon} {opt.value}
                          {active && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Anything else you enjoy or are good at? <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={data.strengthsNote}
                      onChange={(e) => update({ strengthsNote: e.target.value })}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="e.g. I like solving puzzles, I've led a college club..."
                    />
                  </div>
                </div>
              )}

              {/* --- Step 3: Goal & time --- */}
              {step === 3 && (
                <div>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Target & time</h1>
                    <p className="text-slate-500">This shapes how we pace your roadmap.</p>
                  </div>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-700">
                        Target role or career <span className="text-slate-400 font-normal">(optional — leave blank if unsure)</span>
                      </label>
                      <input value={data.targetRole} onChange={(e) => update({ targetRole: e.target.value })} className={inputClass} placeholder="e.g. Data Analyst, UX Designer" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-500" /> How much time can you commit?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {HOURS_OPTIONS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => update({ hoursPerWeek: h })}
                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                              data.hoursPerWeek === h
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Step 4: Resume (optional) --- */}
              {step === 4 && (
                <div>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 text-purple-600 bg-purple-50 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-sm border border-purple-100">
                      <Sparkles className="w-3.5 h-3.5" /> Optional — but recommended
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Have a resume?</h1>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Your resume tells us what you already know and have done — the more accurately we can
                      match your career fit and find the real gaps in your skills. Don't have one? No problem, skip it.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-100">
                        <Target className="w-3.5 h-3.5" /> Sharper career match
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-100">
                        <FileText className="w-3.5 h-3.5" /> Auto-fills your skills
                      </span>
                    </div>
                  </div>

                  {parsedData ? (
                    <div className="max-w-xl mx-auto text-center">
                      <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <p className="font-bold text-slate-900 mb-1">Resume parsed successfully!</p>
                      <p className="text-slate-500 text-sm mb-4">We've picked up your skills and experience.</p>
                    </div>
                  ) : !file ? (
                    <div
                      className={`w-full max-w-xl mx-auto border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        isDragging ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Click or drag your PDF here</h3>
                      <p className="text-slate-500 mb-5 text-sm">Make sure it includes your education and skills.</p>
                      <div className="bg-white border border-slate-200 px-5 py-2 rounded-full text-slate-700 font-semibold shadow-sm pointer-events-none text-sm">
                        Select a file
                      </div>
                      <input type="file" className="hidden" ref={fileInputRef} accept="application/pdf" onChange={handleFileInput} />
                    </div>
                  ) : (
                    <div className="w-full max-w-xl mx-auto">
                      <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between mb-6 bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-900 truncate">{file.name}</p>
                            <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFile(null)}
                          className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {resumeError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100 text-center">
                          {resumeError}
                        </div>
                      )}

                      <button
                        onClick={uploadResume}
                        disabled={resumeLoading}
                        className={`w-full bg-[#6D28D9] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                          resumeLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#5B21B6] active:scale-[0.98] shadow-purple-600/20'
                        }`}
                      >
                        {resumeLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Analyzing with AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" /> Analyze my resume
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {saveError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mt-6 text-sm font-medium border border-red-100 text-center">
                {saveError}
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors ${
                  step === 0 ? 'invisible' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] active:scale-[0.98] transition-all shadow-md shadow-purple-600/20 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] active:scale-[0.98] transition-all shadow-md shadow-purple-600/20 flex items-center gap-2"
                >
                  {parsedData ? 'Finish' : "Skip & finish"} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {step === 0 && (
              <p className="text-center mt-6">
                <Link to="/" className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                  Back to home
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
