import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Sparkles,
  BookOpen,
  Check,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { API_BASE } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { confirmCareerGoal } from '../lib/profile';

interface CareerData {
  title: string;
  slug: string;
  code: string;
  field: string;
  summary: string;
  skills: string[];
  salary_india: {
    entry: string;
    mid: string;
    senior: string;
  };
  day_in_the_life: {
    time: string;
    activity: string;
  }[];
  pros: string[];
  cons: string[];
  learning_path: string[];
  growth_outlook: string;
}

const CareerDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, assessment, saveProfile } = useProfile();

  const [career, setCareer] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Goal confirmation modal state
  const [showModal, setShowModal] = useState(false);
  const [goalReason, setGoalReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [goalSet, setGoalSet] = useState(false);

  // Check if this career matches the user's current targetRole
  const isCurrentGoal = profile?.targetRole?.toLowerCase() === career?.title.toLowerCase();

  // Find match fit from user's latest assessment (if any)
  const matchedInfo = assessment?.matches.find(
    (m) => m.title.toLowerCase() === career?.title.toLowerCase(),
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/careers/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Career not found');
        return res.json();
      })
      .then((data: CareerData) => {
        if (!cancelled) {
          setCareer(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Could not load career details.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleConfirmGoal = async () => {
    if (!user || !career) return;
    setConfirming(true);
    try {
      await confirmCareerGoal(
        user.id,
        career.title,
        career.field,
        goalReason.trim() || undefined,
      );
      await saveProfile({ targetRole: career.title, path: 'know_goal' });
      setGoalSet(true);
      setTimeout(() => {
        navigate('/roadmap');
      }, 1200);
    } catch (err) {
      console.error('Failed to confirm career goal:', err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans pb-16">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Navigation back */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Link
            to="/assessment"
            className="text-xs font-bold text-purple-600 hover:underline inline-flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5" /> Career Discovery
          </Link>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
            <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-sm">Loading career details…</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-3xl p-10 text-center border border-red-100">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800 mb-1">Career Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-bold py-2.5 px-5 rounded-xl hover:bg-[#5B21B6] transition-all text-sm"
            >
              Return to Dashboard
            </Link>
          </div>
        )}

        {!loading && career && (
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {career.field}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                    Holland Code: {career.code}
                  </span>
                </div>
                {matchedInfo && (
                  <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-green-600" />
                    {matchedInfo.fit}% Match for You
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">
                {career.title}
              </h1>
              <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-2xl">
                {career.summary}
              </p>

              {matchedInfo?.why_it_fits && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-6 text-sm text-purple-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-purple-950">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" /> Why this fits you:
                  </p>
                  <p className="text-purple-800">{matchedInfo.why_it_fits}</p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center gap-4 pt-2">
                {isCurrentGoal ? (
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 font-bold px-5 py-3 rounded-xl text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    This is your current confirmed goal
                  </div>
                ) : (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-extrabold py-3 px-6 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/25 text-sm"
                  >
                    <Target className="w-4 h-4" />
                    Make this my Career Goal
                  </button>
                )}
                <Link
                  to="/roadmap"
                  className="text-slate-600 hover:text-purple-600 font-bold text-sm px-3 py-3 transition-colors"
                >
                  View Roadmaps →
                </Link>
              </div>
            </div>

            {/* Salary Expectations Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Expected Salary in India</h3>
                  <p className="text-xs text-slate-400">Based on domestic tech & corporate hiring trends</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Entry Level (0–2 yrs)
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {career.salary_india?.entry}
                  </span>
                </div>
                <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider block mb-1">
                    Mid Level (3–6 yrs)
                  </span>
                  <span className="text-xl font-black text-purple-950">
                    {career.salary_india?.mid}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Senior Level (7+ yrs)
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {career.salary_india?.senior}
                  </span>
                </div>
              </div>
            </div>

            {/* A Day in the Life */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-lg">A Day in the Life</h3>
              </div>
              <div className="relative pl-6 border-l-2 border-purple-100 space-y-4 ml-2">
                {career.day_in_the_life.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-white shadow-sm" />
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-0.5">
                      {item.time}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {item.activity}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Skills & Growth Outlook */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Skills */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Key Skills Required</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {career.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-purple-50 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Growth Outlook */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Industry Outlook</h3>
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-2">
                  {career.growth_outlook}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Demand across Indian tech hubs (Bengaluru, Hyderabad, Pune, NCR) remains robust with global capability centers expanding.
                </p>
              </div>
            </div>

            {/* Pros and Cons */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Pros */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <h4 className="font-extrabold text-green-800 text-sm flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> What Makes it Great
                </h4>
                <ul className="space-y-2.5">
                  {career.pros.map((pro, i) => (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons / Watch-outs */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <h4 className="font-extrabold text-amber-800 text-sm flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Honest Downsides to Know
                </h4>
                <ul className="space-y-2.5">
                  {career.cons.map((con, i) => (
                    <li key={i} className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggested Learning Path */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-lg">Recommended Path to Get Started</h3>
              </div>
              <div className="space-y-2.5">
                {career.learning_path.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Goal Confirmation Modal */}
        {showModal && career && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Commit to {career.title}?
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                Setting this as your official career goal will tailor your weekly roadmap, daily tasks,
                and recommendations toward becoming a job-ready <strong>{career.title}</strong>.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Why did you pick this career? (Optional)
                </label>
                <textarea
                  value={goalReason}
                  onChange={(e) => setGoalReason(e.target.value)}
                  maxLength={250}
                  placeholder="e.g. It matches my passion for creative problem solving and offers good salary growth."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-sm resize-none h-20"
                />
              </div>

              {goalSet ? (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-center text-sm font-bold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-green-600" /> Goal confirmed! Redirecting to roadmap…
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={handleConfirmGoal}
                    className="inline-flex items-center gap-2 bg-[#6D28D9] text-white font-extrabold px-6 py-2.5 rounded-xl hover:bg-[#5B21B6] transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 text-sm"
                  >
                    {confirming ? 'Saving…' : 'Yes, Set as My Goal'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CareerDetail;
