import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Shield,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import {
  INTEREST_DOMAINS,
  type InterestDomain,
  type InteractiveActivity,
  type EducationLevelFilter,
} from '../lib/interestDomains';
import {
  getLocalInterestProfile,
  loadStudentActivityLogs,
  logActivityEvent,
  toggleDeclaredInterest,
  confirmStudentInterest,
  removeConfirmedInterest,
  type ActivityLogEntry,
  type StudentInterestProfile,
  type EnjoymentRating,
} from '../lib/interestEvidenceService';
import DomainCard from '../components/interest/DomainCard';
import DomainDetailModal from '../components/interest/DomainDetailModal';
import ActivityPlayer from '../components/interest/ActivityPlayer';
import EnjoymentFeedbackModal from '../components/interest/EnjoymentFeedbackModal';
import InterestSummaryModal from '../components/interest/InterestSummaryModal';

export default function InterestDiscovery() {
  const { user } = useAuth();
  const { profile: onboardingProfile } = useProfile();
  const userId = user?.id || 'demo-student-id';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<EducationLevelFilter>('all');

  // Modals & Active State
  const [selectedDomain, setSelectedDomain] = useState<InterestDomain | null>(null);
  const [activeActivity, setActiveActivity] = useState<InteractiveActivity | null>(null);
  const [activeActivityDomain, setActiveActivityDomain] = useState<InterestDomain | null>(null);
  const [completedActivityToRate, setCompletedActivityToRate] = useState<InteractiveActivity | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Evidence Data State
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [interestProfile, setInterestProfile] = useState<StudentInterestProfile>(() =>
    getLocalInterestProfile(userId)
  );

  // Initial Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const logs = await loadStudentActivityLogs(userId);
      if (!cancelled) {
        setActivityLogs(logs);
        const prof = getLocalInterestProfile(userId);
        setInterestProfile(prof);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Set initial education level based on onboarding profile if available
  useEffect(() => {
    const eduStage = (onboardingProfile?.educationStage || onboardingProfile?.course || '').toLowerCase();
    if (eduStage.includes('10')) setSelectedLevel('class_10');
    else if (eduStage.includes('puc') || eduStage.includes('12')) setSelectedLevel('puc');
    else if (eduStage.includes('diploma')) setSelectedLevel('diploma');
    else if (
      eduStage.includes('undergraduate') ||
      eduStage.includes('ug') ||
      eduStage.includes('bachelor') ||
      eduStage.includes('b.tech') ||
      eduStage.includes('bca') ||
      eduStage.includes('bsc')
    )
      setSelectedLevel('undergraduate');
    else if (
      eduStage.includes('postgraduate') ||
      eduStage.includes('pg') ||
      eduStage.includes('master') ||
      eduStage.includes('mca') ||
      eduStage.includes('m.tech')
    )
      setSelectedLevel('graduate');
  }, [onboardingProfile]);

  // Filtered Domains
  const filteredDomains = useMemo(() => {
    return INTEREST_DOMAINS.filter((domain) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        domain.name.toLowerCase().includes(query) ||
        domain.tagline.toLowerCase().includes(query) ||
        domain.description.toLowerCase().includes(query) ||
        domain.relevantSubjectAreas.some((s) => s.toLowerCase().includes(query)) ||
        domain.subdomains.some((sub) => sub.toLowerCase().includes(query));

      const matchesLevel =
        selectedLevel === 'all' ||
        domain.activities.some(
          (act) => act.recommendedLevels.includes('all') || act.recommendedLevels.includes(selectedLevel)
        );

      return matchesQuery && matchesLevel;
    });
  }, [searchQuery, selectedLevel]);

  // Activity Launch Handler
  const handleStartActivity = (activity: InteractiveActivity, domain: InterestDomain) => {
    setActiveActivity(activity);
    setActiveActivityDomain(domain);
    setSelectedDomain(null); // Close detail modal if open

    // Log started event
    logActivityEvent({
      userId,
      domainId: domain.id,
      activityId: activity.id,
      status: 'started',
      responses: {},
      educationLevel: selectedLevel,
      difficulty: activity.difficulty,
    });
  };

  // Activity Completion Handler
  const handleActivityComplete = (responses: Record<string, any>) => {
    if (!activeActivity || !activeActivityDomain) return;

    // Log completed event
    logActivityEvent({
      userId,
      domainId: activeActivityDomain.id,
      activityId: activeActivity.id,
      status: 'completed',
      responses,
      educationLevel: selectedLevel,
      difficulty: activeActivity.difficulty,
    }).then(() => {
      loadStudentActivityLogs(userId).then((logs) => {
        setActivityLogs(logs);
        setInterestProfile(getLocalInterestProfile(userId));
      });
    });

    // Open Enjoyment Feedback Modal
    setCompletedActivityToRate(activeActivity);
    setActiveActivity(null);
  };

  // Activity Skip Handler
  const handleActivitySkip = () => {
    if (!activeActivity || !activeActivityDomain) return;

    logActivityEvent({
      userId,
      domainId: activeActivityDomain.id,
      activityId: activeActivity.id,
      status: 'skipped',
      responses: {},
      educationLevel: selectedLevel,
      difficulty: activeActivity.difficulty,
    }).then(() => {
      loadStudentActivityLogs(userId).then(setActivityLogs);
    });

    setActiveActivity(null);
    setActiveActivityDomain(null);
  };

  // Save Enjoyment Feedback Handler
  const handleSaveFeedback = (rating: EnjoymentRating, feedbackNote?: string) => {
    if (!completedActivityToRate || !activeActivityDomain) return;

    logActivityEvent({
      userId,
      domainId: activeActivityDomain.id,
      activityId: completedActivityToRate.id,
      status: 'completed',
      responses: {},
      enjoymentRating: rating,
      feedbackNote,
      educationLevel: selectedLevel,
      difficulty: completedActivityToRate.difficulty,
    }).then(() => {
      loadStudentActivityLogs(userId).then((logs) => {
        setActivityLogs(logs);
        setInterestProfile(getLocalInterestProfile(userId));
      });
    });

    setCompletedActivityToRate(null);
    setActiveActivityDomain(null);
  };

  // Replay Activity Handler
  const handleReplayActivity = () => {
    if (completedActivityToRate && activeActivityDomain) {
      const act = completedActivityToRate;
      const dom = activeActivityDomain;
      setCompletedActivityToRate(null);
      handleStartActivity(act, dom);
    }
  };

  // Toggle Declared Favorite
  const handleToggleFavorite = async (domainId: InterestDomain['id'], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = await toggleDeclaredInterest(userId, domainId);
    setInterestProfile(updated);
  };

  // Confirm Interest
  const handleConfirmInterest = async (domainId: InterestDomain['id'], reflection?: string) => {
    const updated = await confirmStudentInterest(userId, domainId, reflection);
    setInterestProfile(updated);
  };

  // Remove Confirmed Interest
  const handleRemoveConfirmed = async (domainId: InterestDomain['id']) => {
    const updated = await removeConfirmedInterest(userId, domainId);
    setInterestProfile(updated);
  };

  // Helper sets
  const declaredSet = useMemo(
    () => new Set(interestProfile.declaredInterests.map((d) => d.domainId)),
    [interestProfile.declaredInterests]
  );
  const exploredSet = useMemo(
    () => new Set(interestProfile.exploredInterests.map((e) => e.domainId)),
    [interestProfile.exploredInterests]
  );
  const emergingSet = useMemo(
    () => new Set(interestProfile.emergingInterests.map((em) => em.domainId)),
    [interestProfile.emergingInterests]
  );
  const confirmedSet = useMemo(
    () => new Set(interestProfile.confirmedInterests.map((c) => c.domainId)),
    [interestProfile.confirmedInterests]
  );

  const completedActivityIds = useMemo(
    () =>
      activityLogs
        .filter((l) => l.status === 'completed' || l.status === 'replayed')
        .map((l) => l.activityId),
    [activityLogs]
  );

  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans flex flex-col text-[#172638]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Cinematic Deep Navy Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1930] via-[#142B4A] to-[#0A182E] text-white p-7 sm:p-10 mb-8 border border-white/10 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(22,140,137,0.22)_0%,transparent_70%)] pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-teal-200 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#168C89]" />
                <span className="uppercase tracking-wider text-[11px] font-bold">Interactive Discovery Engine</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Discover What You Enjoy
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-2 font-normal leading-relaxed">
                Explore real-world problem scenarios across 12 subject domains. No tests, no grades—discover which topics and problem types you voluntarily love to solve.
              </p>

              {/* Discovery Evidence Progress Chips */}
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span>Explored: <strong className="text-white font-mono">{exploredSet.size}/12</strong></span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#168C89]" />
                  <span>Emerging Patterns: <strong className="text-teal-200 font-bold">{emergingSet.size}</strong></span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#168C89]/25 border border-[#168C89]/50 text-xs text-teal-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Confirmed Interests: <strong className="text-white font-bold">{confirmedSet.size}</strong></span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsSummaryOpen(true)}
                className="px-5 py-3 bg-[#168C89] hover:bg-[#137471] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>View Evidence Summary</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* C. Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domains, topics, or subjects (e.g., Code, Biology, Law)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#172638] focus:border-[#168C89] focus:outline-hidden"
            />
          </div>

          {/* Education Level Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-[#64748B] flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#168C89]" />
              <span>Level:</span>
            </span>

            {[
              { id: 'all', label: 'All Levels' },
              { id: 'class_10', label: 'Class 10' },
              { id: 'puc', label: 'PUC / +2' },
              { id: 'diploma', label: 'Diploma' },
              { id: 'undergraduate', label: 'Undergraduate' },
              { id: 'graduate', label: 'Graduate' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id as EducationLevelFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedLevel === lvl.id
                    ? 'bg-[#142B4A] text-white shadow-2xs'
                    : 'bg-white text-[#64748B] hover:text-[#172638] border border-[#E2E8F0]'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

        </div>

        {/* D. 12-Domain Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {filteredDomains.map((domain) => {
            const completedCount = activityLogs.filter(
              (l) => l.domainId === domain.id && (l.status === 'completed' || l.status === 'replayed')
            ).length;

            return (
              <DomainCard
                key={domain.id}
                domain={domain}
                isDeclaredFavorite={declaredSet.has(domain.id)}
                isExplored={exploredSet.has(domain.id)}
                isEmerging={emergingSet.has(domain.id)}
                isConfirmed={confirmedSet.has(domain.id)}
                completedCount={completedCount}
                onToggleFavorite={(e) => handleToggleFavorite(domain.id, e)}
                onSelect={() => setSelectedDomain(domain)}
              />
            );
          })}
        </div>

        {/* Reassurance Footer Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-3.5 text-xs text-[#64748B] leading-relaxed">
          <Shield className="w-5 h-5 text-[#168C89] shrink-0" />
          <div>
            <strong className="text-[#172638]">Freedom to Explore: </strong>
            You are not restricted to any single stream. You can try activities in arts, sciences, engineering, or commerce regardless of your current degree. Your activity logs never affect your academic marks or statutory eligibility.
          </div>
        </div>

      </main>

      <AppFooter />

      {/* Domain Detail Modal */}
      {selectedDomain && (
        <DomainDetailModal
          domain={selectedDomain}
          isDeclaredFavorite={declaredSet.has(selectedDomain.id)}
          isExplored={exploredSet.has(selectedDomain.id)}
          isEmerging={emergingSet.has(selectedDomain.id)}
          isConfirmed={confirmedSet.has(selectedDomain.id)}
          completedActivityIds={completedActivityIds}
          selectedLevel={selectedLevel}
          onToggleFavorite={() => handleToggleFavorite(selectedDomain.id)}
          onStartActivity={(activity) => handleStartActivity(activity, selectedDomain)}
          onClose={() => setSelectedDomain(null)}
        />
      )}

      {/* Activity Player Modal */}
      {activeActivity && activeActivityDomain && (
        <ActivityPlayer
          activity={activeActivity}
          domain={activeActivityDomain}
          onComplete={handleActivityComplete}
          onSkip={handleActivitySkip}
          onClose={() => {
            setActiveActivity(null);
            setActiveActivityDomain(null);
          }}
        />
      )}

      {/* Enjoyment Feedback Modal */}
      {completedActivityToRate && activeActivityDomain && (
        <EnjoymentFeedbackModal
          activity={completedActivityToRate}
          domain={activeActivityDomain}
          onSaveFeedback={handleSaveFeedback}
          onReplay={handleReplayActivity}
          onClose={() => {
            setCompletedActivityToRate(null);
            setActiveActivityDomain(null);
          }}
        />
      )}

      {/* Multi-Category Interest Summary Modal */}
      {isSummaryOpen && (
        <InterestSummaryModal
          profile={interestProfile}
          onConfirmInterest={handleConfirmInterest}
          onRemoveConfirmed={handleRemoveConfirmed}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}

    </div>
  );
}
