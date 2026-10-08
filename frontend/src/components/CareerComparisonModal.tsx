import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Target,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { confirmCareerGoal } from '../lib/profile';

export interface ComparisonCareer {
  title: string;
  slug: string;
  code?: string;
  field: string;
  summary?: string;
  description?: string;
  education?: string;
  skills?: string[];
  software_tools?: string[];
  salary_india?: {
    entry?: string;
    mid?: string;
    senior?: string;
  };
  day_in_the_life?: {
    time: string;
    activity: string;
  }[];
  pros?: string[];
  cons?: string[];
  growth_outlook?: string;
}

interface Props {
  careers: ComparisonCareer[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (slug: string) => void;
}

export default function CareerComparisonModal({
  careers,
  isOpen,
  onClose,
  onRemove,
}: Props) {
  const { user } = useAuth();
  const { profile, saveProfile } = useProfile();
  const [settingGoalSlug, setSettingGoalSlug] = useState<string | null>(null);
  const [successGoalSlug, setSuccessGoalSlug] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetGoal = async (career: ComparisonCareer) => {
    if (!user) return;
    setSettingGoalSlug(career.slug);
    try {
      await confirmCareerGoal(
        user.id,
        career.title,
        career.field,
        'Selected via side-by-side Career Comparison tool',
      );
      await saveProfile({ targetRole: career.title });
      setSuccessGoalSlug(career.slug);
      setTimeout(() => setSuccessGoalSlug(null), 3000);
    } catch (err) {
      console.error('Failed to set career goal:', err);
    } finally {
      setSettingGoalSlug(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Side-by-Side Comparison
            </div>
            <h2 className="text-2xl font-black">Compare Career Options</h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-0.5">
              Evaluating {careers.length} career {careers.length === 1 ? 'path' : 'paths'} to make a confident, informed decision.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table / Columns */}
        <div className="flex-1 overflow-y-auto p-6">
          {careers.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No careers selected for comparison.</p>
              <p className="text-sm text-slate-400 mt-1">
                Select up to 3 careers from the catalog to see them side-by-side.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="grid gap-6 min-w-[700px]"
                style={{
                  gridTemplateColumns: `repeat(${careers.length}, minmax(0, 1fr))`,
                }}
              >
                {careers.map((career) => {
                  const isCurrentGoal =
                    profile?.targetRole?.toLowerCase() === career.title.toLowerCase();

                  return (
                    <div
                      key={career.slug}
                      className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between hover:border-purple-300 transition-all shadow-sm"
                    >
                      {/* Top Action & Title */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-700">
                            {career.field}
                          </span>
                          <button
                            onClick={() => onRemove(career.slug)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 leading-snug">
                          {career.title}
                        </h3>

                        <div className="flex items-center gap-2 mt-2">
                          {career.code && (
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              RIASEC: {career.code}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-slate-500">
                            {career.education || "Bachelor's Degree"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                          {career.summary || career.description}
                        </p>

                        {/* Salary Tier in India */}
                        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200/80">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            Estimated Salary (India)
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-slate-600">
                              <span>Fresher / Entry:</span>
                              <span className="font-bold text-slate-800">
                                {career.salary_india?.entry || '₹4 - ₹7 LPA'}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Mid-Career (3-5y):</span>
                              <span className="font-bold text-purple-700">
                                {career.salary_india?.mid || '₹10 - ₹18 LPA'}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Senior / Lead:</span>
                              <span className="font-bold text-slate-800">
                                {career.salary_india?.senior || '₹20 - ₹35+ LPA'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Key Skills & Tools */}
                        <div className="mt-4">
                          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            Top Skills & Competencies
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {career.skills?.slice(0, 5).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Pros */}
                        {career.pros && career.pros.length > 0 && (
                          <div className="mt-4">
                            <div className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Key Advantages
                            </div>
                            <ul className="space-y-1 text-xs text-slate-600">
                              {career.pros.slice(0, 2).map((p, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">•</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Cons / Trade-offs */}
                        {career.cons && career.cons.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Real-World Challenges
                            </div>
                            <ul className="space-y-1 text-xs text-slate-600">
                              {career.cons.slice(0, 2).map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-500 font-bold">•</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
                        {isCurrentGoal ? (
                          <div className="w-full py-2.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Current Career Goal
                          </div>
                        ) : successGoalSlug === career.slug ? (
                          <div className="w-full py-2.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" /> Goal Confirmed!
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSetGoal(career)}
                            disabled={settingGoalSlug === career.slug}
                            className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Target className="w-4 h-4" />
                            {settingGoalSlug === career.slug
                              ? 'Setting Goal...'
                              : 'Set as My Career Goal'}
                          </button>
                        )}

                        <Link
                          to={`/careers/${career.slug}`}
                          onClick={onClose}
                          className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          View Full Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Comparing up to 3 careers from the O*NET database</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
