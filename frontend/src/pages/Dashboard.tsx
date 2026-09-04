import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, LogOut, GraduationCap, Clock, Target, Sparkles,
  FileText, Map as MapIcon, ArrowRight, ClipboardList, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OnboardingRecord {
  path: 'know_goal' | 'not_sure' | 'need_plan' | null;
  college?: string;
  course?: string;
  year?: string;
  interests?: string[];
  strengthsNote?: string;
  targetRole?: string;
  hoursPerWeek?: string;
  resume?: { name?: string; education?: string[]; skills?: string[]; experience?: string[] };
}

// Simple rule-based interest -> career lookup. Placeholder for a real
// matching model; keeps the dashboard useful before that exists.
const CAREER_MATCHES: Record<string, string[]> = {
  'Coding & Tech': ['Software Engineer', 'Web Developer', 'Mobile App Developer'],
  'Design & Creativity': ['UI/UX Designer', 'Graphic Designer', 'Product Designer'],
  'Data & Numbers': ['Data Analyst', 'Data Scientist', 'Business Analyst'],
  'Communication & People': ['HR Specialist', 'Customer Success Manager', 'Public Relations Specialist'],
  'Business & Management': ['Product Manager', 'Business Consultant', 'Operations Manager'],
  'Science & Research': ['Research Scientist', 'Lab Technician', 'Biotech Analyst'],
  'Healthcare': ['Nurse', 'Healthcare Administrator', 'Medical Researcher'],
  'Sports & Fitness': ['Sports Coach', 'Fitness Trainer', 'Sports Analyst'],
  'Writing & Content': ['Content Writer', 'Technical Writer', 'Copywriter'],
  'Public Speaking': ['Corporate Trainer', 'Sales Executive', 'Marketing Manager'],
};

function suggestCareers(interests: string[]): string[] {
  const scores = new Map<string, number>();
  for (const interest of interests) {
    for (const career of CAREER_MATCHES[interest] ?? []) {
      scores.set(career, (scores.get(career) ?? 0) + 1);
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([career]) => career);
}

const PATH_LABEL: Record<NonNullable<OnboardingRecord['path']>, string> = {
  know_goal: 'Knows their career goal',
  not_sure: 'Exploring career options',
  need_plan: 'Has a career, needs a plan',
};

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const onboarding = (user?.user_metadata as Record<string, unknown> | undefined)
    ?.onboarding as OnboardingRecord | undefined;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const hasProfile = Boolean(onboarding);
  const targetRole = onboarding?.targetRole?.trim();
  const interests = onboarding?.interests ?? [];
  const suggestions = !targetRole && interests.length > 0 ? suggestCareers(interests) : [];
  const resumeSkills = onboarding?.resume?.skills ?? [];

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-slate-900">AI Personal Career Counselor</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500 font-medium hidden sm:inline">
              Signed in as <span className="text-slate-800 font-semibold">{user?.email}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
          Welcome back{onboarding?.college ? `, ${onboarding.college} student` : ''} 👋
        </h1>
        <p className="text-slate-500 mb-8">Here's where your career journey stands right now.</p>

        {!hasProfile ? (
          /* Nudge back into onboarding if they somehow got here without it */
          <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Let's set up your profile first</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              We don't have your goals or interests yet — that only takes a couple of minutes.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20"
            >
              Start onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">

            {/* Profile summary */}
            <div className="md:col-span-1 bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-fit">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-500" /> Your profile
              </h3>
              <dl className="space-y-3 text-sm">
                {onboarding?.path && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Status</dt>
                    <dd className="text-slate-700 font-medium">{PATH_LABEL[onboarding.path]}</dd>
                  </div>
                )}
                {(onboarding?.course || onboarding?.year) && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Studying</dt>
                    <dd className="text-slate-700 font-medium">
                      {[onboarding?.course, onboarding?.year].filter(Boolean).join(' — ') || '—'}
                    </dd>
                  </div>
                )}
                {onboarding?.hoursPerWeek && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time available
                    </dt>
                    <dd className="text-slate-700 font-medium">{onboarding.hoursPerWeek}</dd>
                  </div>
                )}
                {interests.length > 0 && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Interests</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {interests.map((i) => (
                        <span key={i} className="bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-100">
                          {i}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {resumeSkills.length > 0 && (
                  <div>
                    <dt className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Skills from resume
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {resumeSkills.slice(0, 8).map((s) => (
                        <span key={s} className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              <Link
                to="/onboarding"
                className="mt-5 inline-flex items-center gap-1.5 text-[#6D28D9] font-bold text-sm hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Update my answers
              </Link>
            </div>

            {/* Main column */}
            <div className="md:col-span-2 space-y-6">

              {targetRole ? (
                <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-slate-900">Your target role</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mb-1">{targetRole}</p>
                  <p className="text-slate-500 text-sm">
                    Skill-gap analysis and your personalized roadmap for this role are coming soon.
                  </p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-slate-900">Career matches based on your interests</h3>
                  </div>
                  <div className="space-y-2.5">
                    {suggestions.map((career, i) => (
                      <div
                        key={career}
                        className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3 hover:border-purple-200 hover:bg-purple-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm">{career}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-400 text-xs mt-4">
                    These are quick suggestions from your interests — a deeper AI-driven match is on the way.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center">
                  <p className="text-slate-500 text-sm">
                    Add a few interests in onboarding and we'll suggest careers that fit.
                  </p>
                </div>
              )}

              {/* Coming soon */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-[1.5rem] p-6 border border-dashed border-slate-200 opacity-70">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <h4 className="font-bold text-slate-700 text-sm">Skill Gap Analysis</h4>
                  </div>
                  <p className="text-slate-400 text-xs">Coming soon</p>
                </div>
                <div className="bg-white rounded-[1.5rem] p-6 border border-dashed border-slate-200 opacity-70">
                  <div className="flex items-center gap-2 mb-2">
                    <MapIcon className="w-4 h-4 text-slate-400" />
                    <h4 className="font-bold text-slate-700 text-sm">Personalized Roadmap</h4>
                  </div>
                  <p className="text-slate-400 text-xs">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
