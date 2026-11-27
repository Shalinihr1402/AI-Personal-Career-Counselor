import React from 'react';
import {
  Palette,
  Calculator,
  Users,
  FlaskConical,
  BookOpen,
  Check,
  Sparkles,
} from 'lucide-react';
import type { OnboardingRecord } from '../../lib/onboarding';
import {
  type InterestDetails,
  INTEREST_CATEGORIES,
} from '../../lib/interestsTaxonomy';

interface Stage3InterestsProps {
  data: Partial<OnboardingRecord>;
  onChange: (patch: Partial<OnboardingRecord>) => void;
}

const PROBLEM_SOLVING_ORIENTATIONS = [
  {
    id: 'data_and_logic',
    title: 'Data & Logical Systems',
    desc: 'Analyzing numerical patterns, writing code, debugging logic, optimizing workflows.',
    icon: Calculator,
  },
  {
    id: 'people_and_society',
    title: 'People & Human Dynamics',
    desc: 'Mentoring, psychology, teaching, active collaboration, understanding behavior.',
    icon: Users,
  },
  {
    id: 'visuals_and_design',
    title: 'Visuals & Creative Design',
    desc: 'Aesthetics, user interfaces, branding, visual storytelling, creative arts.',
    icon: Palette,
  },
  {
    id: 'words_and_strategy',
    title: 'Words, Communication & Strategy',
    desc: 'Writing, policy analysis, journalism, legal reasoning, business planning.',
    icon: BookOpen,
  },
  {
    id: 'tools_and_science',
    title: 'Physical Systems & Science',
    desc: 'Laboratory research, engineering hardware, clinical medicine, hands-on tools.',
    icon: FlaskConical,
  },
];

export const Stage3Interests: React.FC<Stage3InterestsProps> = ({ data, onChange }) => {
  const ind: InterestDetails = data.interest_details || {
    interest_categories: data.interests || [],
    specific_interests: [],
    additional_interests: data.strengthsNote || '',
    interest_exploration_status: 'focused',
    problem_solving_preference: [],
    curiosity_topics: [],
    independent_activities: '',
  };

  const selectedCategories = ind.interest_categories || [];
  const selectedSpecifics = ind.specific_interests || [];
  const selectedOrientations = ind.problem_solving_preference || [];
  const isExploring = ind.interest_exploration_status === 'exploring';

  const updateInterests = (patch: Partial<InterestDetails>) => {
    const updated = { ...ind, ...patch };
    onChange({
      interest_details: updated,
      interests: updated.interest_categories,
      strengthsNote: updated.additional_interests || updated.independent_activities,
    });
  };

  // Toggle Problem Solving Orientation
  const toggleOrientation = (id: string) => {
    const updated = selectedOrientations.includes(id)
      ? selectedOrientations.filter((o) => o !== id)
      : [...selectedOrientations, id];
    updateInterests({ problem_solving_preference: updated });
  };

  // Toggle Category without erasing anything
  const toggleCategory = (catId: string) => {
    const isSelected = selectedCategories.includes(catId);
    let updatedCats: string[];
    let updatedSpecs = [...selectedSpecifics];

    if (isSelected) {
      updatedCats = selectedCategories.filter((c) => c !== catId);
      const catConfig = INTEREST_CATEGORIES.find((c) => c.id === catId);
      if (catConfig) {
        updatedSpecs = updatedSpecs.filter((s) => !catConfig.subInterests.includes(s));
      }
    } else {
      updatedCats = [...selectedCategories, catId];
    }

    updateInterests({
      interest_categories: updatedCats,
      specific_interests: updatedSpecs,
    });
  };

  // Toggle Sub-Interest Chip
  const toggleSubInterest = (sub: string, parentCatId: string) => {
    const isSubSelected = selectedSpecifics.includes(sub);
    const updatedSpecs = isSubSelected
      ? selectedSpecifics.filter((s) => s !== sub)
      : [...selectedSpecifics, sub];

    let updatedCats = [...selectedCategories];
    if (!isSubSelected && !updatedCats.includes(parentCatId)) {
      updatedCats.push(parentCatId);
    }

    updateInterests({
      interest_categories: updatedCats,
      specific_interests: updatedSpecs,
    });
  };

  // Toggle Exploring mode without erasing selected interests
  const toggleExploringMode = () => {
    updateInterests({
      interest_exploration_status: isExploring ? 'focused' : 'exploring',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start gap-4 pb-2 border-b border-[#E2E8F0]">
        <div className="w-12 h-12 rounded-xl bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172638] tracking-tight">
            Personal Interests & Genuine Curiosity
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
            We never infer what you like simply from your degree. Pick areas that genuinely fascinate you, or describe what you explore in your personal time.
          </p>
        </div>
      </div>

      {/* 1. Problem-Solving Style */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
            1. Problem-Solving & Work Orientation
          </label>
          <p className="text-xs text-[#64748B]">
            What types of problems or mediums feel most natural for you to work with?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROBLEM_SOLVING_ORIENTATIONS.map((ori) => {
            const isSelected = selectedOrientations.includes(ori.id);
            const Icon = ori.icon;
            return (
              <div
                key={ori.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleOrientation(ori.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleOrientation(ori.id);
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-[#142B4A] bg-[#EAF5F4]/60 shadow-xs ring-1 ring-[#142B4A]/10'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      isSelected ? 'bg-[#142B4A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#172638]">{ori.title}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-snug">{ori.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Exploration Status Toggle */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggleExploringMode}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExploringMode();
          }
        }}
        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
          isExploring
            ? 'border-[#168C89] bg-[#EAF5F4] shadow-xs'
            : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center border text-xs ${
              isExploring ? 'bg-[#168C89] border-[#168C89] text-white' : 'border-[#CBD5E1] bg-white'
            }`}
          >
            {isExploring && <Check className="w-3 h-3 text-white" />}
          </div>
          <div>
            <span className="text-xs font-bold text-[#172638] block">
              I am open to exploring careers across multiple distinct fields
            </span>
            <span className="text-[11px] text-[#64748B] block">
              We will keep your selected preferences while surfacing broader interdisciplinary opportunities.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Domain Interest Categories */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
            2. Career & Domain Interests
          </label>
          <p className="text-xs text-[#64748B]">
            Select domains that spark your interest, then check specific sub-topics you would like to explore.
          </p>
        </div>

        <div className="space-y-3">
          {INTEREST_CATEGORIES.map((cat) => {
            const isCatSelected = selectedCategories.includes(cat.id);
            return (
              <div
                key={cat.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCatSelected ? 'border-[#C5E6E4] bg-[#EAF5F4]/30 shadow-xs' : 'border-[#E2E8F0] bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-2 text-left cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-xs ${
                        isCatSelected
                          ? 'bg-[#168C89] border-[#168C89] text-white'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isCatSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="text-xs font-bold text-[#172638]">{cat.label}</span>
                  </button>

                  <span className="text-[10px] text-[#94A3B8] font-medium">
                    {cat.subInterests.length} topics
                  </span>
                </div>

                {/* Sub-interests chips */}
                {isCatSelected && (
                  <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-wrap gap-1.5 animate-in fade-in">
                    {cat.subInterests.map((sub) => {
                      const isSubSelected = selectedSpecifics.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubInterest(sub, cat.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isSubSelected
                              ? 'border-[#168C89] bg-[#168C89] text-white font-medium shadow-2xs'
                              : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                          }`}
                        >
                          {isSubSelected ? '✓ ' : '+ '}
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Natural-Language Curiosity Expression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
            Independent Exploration & Curiosity
          </label>
          <span className="text-[11px] text-[#94A3B8]">Optional</span>
        </div>
        <textarea
          rows={3}
          value={ind.independent_activities || ind.additional_interests || ''}
          onChange={(e) =>
            updateInterests({
              independent_activities: e.target.value,
              additional_interests: e.target.value,
            })
          }
          placeholder="e.g., I follow tech podcasts on generative AI, read books on behavioral economics, and enjoy editing gameplay videos on weekends."
          className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] text-[#172638] placeholder:text-[#94A3B8]"
        />
        <p className="text-[11px] text-[#64748B]">
          Our AI counselor uses your authentic curiosity to suggest cross-functional careers you may not have considered.
        </p>
      </div>
    </div>
  );
};
