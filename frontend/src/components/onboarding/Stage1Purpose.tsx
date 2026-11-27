import React from 'react';
import { Compass, Target, TrendingUp } from 'lucide-react';
import type { CareerMode, OnboardingRecord } from '../../lib/onboarding';
import { CAREER_GROWTH_SUBTYPES } from '../../lib/onboarding';

interface Stage1PurposeProps {
  data: Partial<OnboardingRecord>;
  onChange: (patch: Partial<OnboardingRecord>) => void;
}

const CAREER_MODES: Array<{
  id: CareerMode;
  title: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'career_discovery',
    title: 'Career Discovery & Exploration',
    badge: 'Exploring Options',
    desc: 'You want to discover suitable career directions that match your genuine strengths, cognitive style, and personal potential.',
    icon: Compass,
  },
  {
    id: 'career_planning',
    title: 'Targeted Career Planning',
    badge: 'Focused Goal',
    desc: 'You already have a general or specific career in mind and need an actionable execution roadmap, skill strategy, and timeline.',
    icon: Target,
  },
  {
    id: 'career_growth_transition',
    title: 'Career Transition & Growth',
    badge: 'Switching or Advancing',
    desc: 'You want to switch into a new domain, accelerate your growth in your current profession, or return after a career break.',
    icon: TrendingUp,
  },
];

const DILEMMA_PRESETS = [
  'Unsure which roles genuinely fit my strengths & degree',
  'Deciding between higher studies (Master’s/MBA) vs immediate job',
  'Want to enter a new field without formal relevant experience',
  'Need to know which practical skills to learn for placements',
  'Balancing personal interests with family or earning expectations',
];

export const Stage1Purpose: React.FC<Stage1PurposeProps> = ({ data, onChange }) => {
  const selectedMode = data.career_mode || (data.path === 'know_goal' ? 'career_planning' : data.path === 'need_plan' ? 'career_growth_transition' : 'career_discovery');
  const guidance = data.guidance_expectations || {};
  const selectedDilemmas = guidance.counselor_expectations || [];

  const handleSelectMode = (mode: CareerMode) => {
    onChange({
      career_mode: mode,
      path: mode === 'career_planning' ? 'know_goal' : mode === 'career_growth_transition' ? 'need_plan' : 'not_sure',
    });
  };

  const handleToggleDilemma = (dilemma: string) => {
    const updated = selectedDilemmas.includes(dilemma)
      ? selectedDilemmas.filter((d) => d !== dilemma)
      : [...selectedDilemmas, dilemma];

    onChange({
      guidance_expectations: {
        ...guidance,
        counselor_expectations: updated,
      },
    });
  };

  const handleDilemmaTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange({
      career_dilemma: val,
      guidance_reason: val,
      guidance_expectations: {
        ...guidance,
        career_dilemma: val,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stage Header */}
      <div className="flex items-start gap-4 pb-2 border-b border-[#E2E8F0]">
        <div className="w-12 h-12 rounded-xl bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4] flex items-center justify-center shrink-0 shadow-xs">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172638] tracking-tight">
            What guidance are you seeking today?
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
            Tell us about your current career situation. We adapt our questions and recommendations to where you are right now.
          </p>
        </div>
      </div>

      {/* 1. Career Mode Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
          Select Your Primary Objective <span className="text-[#168C89]">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3">
          {CAREER_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectMode(mode.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectMode(mode.id);
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-[#142B4A] bg-[#EAF5F4]/60 shadow-xs ring-1 ring-[#142B4A]/10'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'bg-[#142B4A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#172638]">{mode.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-[#168C89] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{mode.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1B. Growth Subtype (conditional if transition selected) */}
      {selectedMode === 'career_growth_transition' && (
        <div className="p-4 rounded-xl border border-[#C5E6E4] bg-[#EAF5F4]/60 space-y-3 animate-in fade-in">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#142B4A]">
            Specific Transition Focus <span className="text-[#168C89]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAREER_GROWTH_SUBTYPES.map((sub) => {
              const isSubSelected = data.career_growth_subtype === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onChange({ career_growth_subtype: sub.id })}
                  className={`p-2.5 rounded-lg border text-left transition-all text-xs font-semibold cursor-pointer ${
                    isSubSelected
                      ? 'border-[#142B4A] bg-[#142B4A] text-white shadow-2xs'
                      : 'border-[#E2E8F0] bg-white text-[#172638] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div>{sub.title}</div>
                  <div className={`text-[10px] font-normal mt-0.5 ${isSubSelected ? 'text-teal-100' : 'text-[#64748B]'}`}>
                    {sub.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Target Role (Optional) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
          Target Role or Domain in Mind (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Data Analyst, UX Designer, Financial Analyst, or leave blank"
          value={data.targetRole || ''}
          onChange={(e) => onChange({ targetRole: e.target.value })}
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
        />
        <p className="text-[11px] text-[#64748B]">
          If you have a role in mind, we will include it in your gap analysis. Otherwise, we discover it together.
        </p>
      </div>

      {/* 3. Immediate Career Dilemmas (Multi-select) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
          What challenges are on your mind right now? (Select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {DILEMMA_PRESETS.map((dilemma) => {
            const isSelected = selectedDilemmas.includes(dilemma);
            return (
              <button
                key={dilemma}
                type="button"
                onClick={() => handleToggleDilemma(dilemma)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'border-[#168C89] bg-[#EAF5F4] text-[#168C89] font-semibold'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1] hover:text-[#172638]'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {dilemma}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Natural-Language Dilemma Input */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#172638]">
          Describe your career dilemma in your own words (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="e.g. I just completed my BCA. I like UI/UX and web development, but my college placements mostly offer general support roles. I want to build a portfolio for frontend engineer roles..."
          value={guidance.career_dilemma || data.career_dilemma || ''}
          onChange={handleDilemmaTextChange}
          className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172638] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#168C89]/30 focus:border-[#168C89] transition-all"
        />
      </div>
    </div>
  );
};
