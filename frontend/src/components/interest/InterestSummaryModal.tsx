import { useState } from 'react';
import {
  X,
  Sparkles,
  Heart,
  TrendingUp,
  CheckCircle2,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import {
  INTEREST_DOMAINS,
  type InterestDomainId,
} from '../../lib/interestDomains';
import {
  type StudentInterestProfile,
} from '../../lib/interestEvidenceService';

interface InterestSummaryModalProps {
  profile: StudentInterestProfile;
  onConfirmInterest: (domainId: InterestDomainId, reflection?: string) => void;
  onRemoveConfirmed: (domainId: InterestDomainId) => void;
  onClose: () => void;
}

export default function InterestSummaryModal({
  profile,
  onConfirmInterest,
  onRemoveConfirmed,
  onClose,
}: InterestSummaryModalProps) {
  const [activeTab, setActiveTab] = useState<'emerging' | 'confirmed' | 'declared' | 'explored'>('emerging');

  return (
    <div className="fixed inset-0 z-50 bg-[#142B4A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#142B4A] text-white p-6 flex items-start justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#2DD4BF] font-bold text-xs border border-white/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />
              <span>Multi-Category Interest Evidence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Your Subject & Domain Discovery Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Transparent evidence distinguishing what you declared, what you explored, and patterns you enjoyed.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* AI Counselor Grounded Summary Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#F0FAF9] via-[#F4FBFA] to-[#EAF5F4] border border-[#C5E6E4] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#168C89] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#168C89]" />
              <span className="text-[#142B4A] font-extrabold">Counselor's Grounded Synthesis</span>
            </div>
            <p className="text-xs sm:text-sm text-[#172638] leading-relaxed font-medium">
              {profile.counselorSummary ||
                'Explore activities in any domain to start uncovering your natural engagement patterns.'}
            </p>
          </div>

          {/* 4 Category Tabs (A. Declared -> B. Explored -> C. Emerging -> D. Confirmed) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-[#E2E8F0] pb-2 text-xs sm:text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('declared')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'declared'
                  ? 'bg-[#142B4A] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172638] hover:bg-[#F1F5F9]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
              <span>A. Declared ({profile.declaredInterests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('explored')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'explored'
                  ? 'bg-[#142B4A] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172638] hover:bg-[#F1F5F9]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#168C89]" />
              <span>B. Explored ({profile.exploredInterests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('emerging')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'emerging'
                  ? 'bg-[#142B4A] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172638] hover:bg-[#F1F5F9]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#168C89]" />
              <span>C. Emerging ({profile.emergingInterests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('confirmed')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'confirmed'
                  ? 'bg-[#142B4A] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#172638] hover:bg-[#F1F5F9]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span>D. Confirmed ({profile.confirmedInterests.length})</span>
            </button>
          </div>

          {/* Tab 1: Emerging Interests */}
          {activeTab === 'emerging' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F5F8FC] rounded-xl text-xs text-[#64748B] border border-[#E2E8F0]">
                <strong>Emerging Interests</strong> are detected through your repeated high enjoyment ratings across interactive activities. They are never automatically confirmed without your review.
              </div>

              {profile.emergingInterests.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  No emerging interests detected yet. Complete activities and rate your enjoyment to establish patterns!
                </div>
              ) : (
                profile.emergingInterests.map((em) => {
                  const domain = INTEREST_DOMAINS.find((d) => d.id === em.domainId);
                  const isAlreadyConfirmed = profile.confirmedInterests.some((c) => c.domainId === em.domainId);
                  return (
                    <div
                      key={em.domainId}
                      className="p-4 rounded-xl border border-[#C5E6E4] bg-[#F0FAF9] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="font-extrabold text-[#172638] text-sm sm:text-base">
                          {domain?.name || em.domainId}
                        </span>
                        <p className="text-xs text-[#64748B]">
                          {em.evidenceReason}
                        </p>
                        <span className="text-[10px] text-[#168C89] font-bold block">
                          Positive Ratings: {em.positiveRatingCount}
                        </span>
                      </div>

                      {isAlreadyConfirmed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed by You</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onConfirmInterest(em.domainId)}
                          className="px-4 py-2 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#168C89]" />
                          <span>Confirm This Interest</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Confirmed Interests */}
          {activeTab === 'confirmed' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F5F8FC] rounded-xl text-xs text-[#64748B] border border-[#E2E8F0]">
                <strong>Confirmed Interests</strong> are domains you have personally reviewed and decided you want to prioritize in your career planning.
              </div>

              {profile.confirmedInterests.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  You have not yet confirmed any interests. Review your emerging interests above to confirm areas you want to pursue.
                </div>
              ) : (
                profile.confirmedInterests.map((conf) => {
                  const domain = INTEREST_DOMAINS.find((d) => d.id === conf.domainId);
                  return (
                    <div
                      key={conf.domainId}
                      className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="font-extrabold text-[#172638] text-sm sm:text-base">
                          {domain?.name || conf.domainId}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Confirmed on {new Date(conf.confirmedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveConfirmed(conf.domainId)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer"
                      >
                        Remove confirmation
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Declared Interests */}
          {activeTab === 'declared' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F5F8FC] rounded-xl text-xs text-[#64748B] border border-[#E2E8F0]">
                <strong>Declared Interests</strong> reflect areas you explicitly liked or favorited using the heart icon on any domain card.
              </div>

              {profile.declaredInterests.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  No declared interests yet. Click the heart icon on any domain card to mark it as a declared interest.
                </div>
              ) : (
                profile.declaredInterests.map((dec) => {
                  const domain = INTEREST_DOMAINS.find((d) => d.id === dec.domainId);
                  return (
                    <div
                      key={dec.domainId}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span className="font-bold text-[#172638] text-sm">
                          {domain?.name || dec.domainId}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-medium">
                        Source: {dec.source}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 4: Explored Interests */}
          {activeTab === 'explored' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F5F8FC] rounded-xl text-xs text-[#64748B] border border-[#E2E8F0]">
                <strong>Explored Interests</strong> track the domains where you voluntarily tried or finished challenges.
              </div>

              {profile.exploredInterests.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  You have not yet explored any domain activities.
                </div>
              ) : (
                profile.exploredInterests.map((exp) => {
                  const domain = INTEREST_DOMAINS.find((d) => d.id === exp.domainId);
                  return (
                    <div
                      key={exp.domainId}
                      className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="font-bold text-[#172638] text-sm">
                          {domain?.name || exp.domainId}
                        </span>
                        <span className="text-[11px] text-[#64748B] block">
                          Last explored on {new Date(exp.lastExploredAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF5F4] text-[#168C89]">
                        {exp.activitiesCompleted} Completed
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Statutory and RIASEC Independence Reassurance */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-[#168C89] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#172638] block mb-0.5">
                RIASEC & Statutory Independence
              </span>
              <span>
                Your domain exploration evidence is tracked independently from your Holland RIASEC diagnostic scores and statutory career eligibility formulas. This guarantees that your curiosity can roam freely without distorting baseline psychological traits or regulatory checks.
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
