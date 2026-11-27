import {
  X,
  Sparkles,
  Heart,
  Clock,
  ArrowRight,
  Layers,
  Briefcase,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import {
  type InterestDomain,
  type InteractiveActivity,
  type EducationLevelFilter,
} from '../../lib/interestDomains';

interface DomainDetailModalProps {
  domain: InterestDomain;
  isDeclaredFavorite: boolean;
  isExplored: boolean;
  isEmerging: boolean;
  isConfirmed: boolean;
  completedActivityIds: string[];
  selectedLevel?: EducationLevelFilter;
  onToggleFavorite: () => void;
  onStartActivity: (activity: InteractiveActivity) => void;
  onClose: () => void;
}

export default function DomainDetailModal({
  domain,
  isDeclaredFavorite,
  isExplored: _isExplored,
  isEmerging,
  isConfirmed,
  completedActivityIds,
  selectedLevel,
  onToggleFavorite,
  onStartActivity,
  onClose,
}: DomainDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#142B4A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-[#142B4A] text-white p-6 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#168C89] text-white">
                Domain Explorer
              </span>
              {isConfirmed && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
                  ✓ Confirmed Interest
                </span>
              )}
              {isEmerging && !isConfirmed && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A5F3FC] text-[#142B4A]">
                  ★ Emerging Interest
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {domain.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {domain.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDeclaredFavorite
                  ? 'bg-rose-500 border-rose-400 text-white shadow-xs'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
              title={isDeclaredFavorite ? 'Marked as declared favorite' : 'Mark as favorite'}
            >
              <Heart className={`w-4 h-4 ${isDeclaredFavorite ? 'fill-white' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Detailed Description */}
          <div>
            <h4 className="font-bold text-[#172638] text-sm mb-1.5">
              About This Domain
            </h4>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {domain.description}
            </p>
          </div>

          {/* 3 Information Grids: Subjects, Subdomains, Careers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Relevant Subject Areas */}
            <div className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#142B4A] mb-2.5">
                <BookOpen className="w-4 h-4 text-[#168C89]" />
                <span>Subject Areas</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#64748B]">
                {domain.relevantSubjectAreas.map((sub, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#168C89]" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Subdomains */}
            <div className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#142B4A] mb-2.5">
                <Layers className="w-4 h-4 text-[#168C89]" />
                <span>Specific Subdomains</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#64748B]">
                {domain.subdomains.map((sub, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#168C89]" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Related Careers */}
            <div className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#142B4A] mb-2.5">
                <Briefcase className="w-4 h-4 text-[#168C89]" />
                <span>Related Career Areas</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#64748B]">
                {domain.relatedCareerAreas.map((career, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#168C89]" />
                    <span>{career}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Interactive Activities Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h4 className="font-extrabold text-[#172638] text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#168C89]" />
                <span>Interactive Challenges ({domain.activities.length})</span>
              </h4>
              <span className="text-xs text-[#64748B]">
                No advanced knowledge required
              </span>
            </div>

            <div className="space-y-3">
              {domain.activities.map((act) => {
                const isCompleted = completedActivityIds.includes(act.id);
                const isRecommended =
                  !selectedLevel ||
                  selectedLevel === 'all' ||
                  act.recommendedLevels.includes('all') ||
                  act.recommendedLevels.includes(selectedLevel);

                return (
                  <div
                    key={act.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                      isRecommended
                        ? 'border-[#C5E6E4] bg-white hover:border-[#168C89]'
                        : 'border-[#E2E8F0] bg-slate-50/60 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#172638]">
                          {act.title}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAF5F4] text-[#168C89] uppercase tracking-wider">
                          {act.difficulty}
                        </span>
                        {isRecommended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#168C89] border border-[#C5E6E4]">
                            ★ Recommended for your level
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {act.shortDescription}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#64748B] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#168C89]" />
                          <span>~{act.estimatedMinutes} mins</span>
                        </span>
                        <span>•</span>
                        <span>
                          Levels:{' '}
                          {act.recommendedLevels.includes('all')
                            ? 'All Levels'
                            : act.recommendedLevels.join(', ')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartActivity(act)}
                      className="px-4 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>{isCompleted ? 'Replay Challenge' : 'Start Challenge'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#168C89]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-bold text-[#172638] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
