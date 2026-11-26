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
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Stage Header */}
      <div className="text-left space-y-1.5 border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider">
          Stage 1 of 6
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          What guidance are you seeking today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Tell us about your current career situation. We adapt our questions and recommendations to where you are right now.
        </p>
      </div>

      {/* 1. Career Mode Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Select Your Primary Objective <span className="text-rose-500">*</span>
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
                    ? 'border-slate-900 bg-slate-50/70 shadow-2xs ring-1 ring-slate-900/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{mode.title}</span>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mode.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1B. Growth Subtype (conditional if transition selected) */}
      {selectedMode === 'career_growth_transition' && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 animate-in fade-in">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Specify Your Transition Focus <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CAREER_GROWTH_SUBTYPES.map((sub) => {
              const isSubSelected = data.career_growth_subtype === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onChange({ career_growth_subtype: sub.id })}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSubSelected
                      ? 'border-slate-900 bg-white shadow-2xs font-semibold text-slate-900'
                      : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{sub.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{sub.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1C. Target Role for Planning (With Undecided Toggle) */}
      {selectedMode === 'career_planning' && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Direction or Role (Optional)
            </label>
            <span className="text-[11px] text-slate-400">Can leave general if undecided</span>
          </div>
          <input
            type="text"
            placeholder="e.g. Data Scientist, Investment Banker, Full Stack Developer, or FinTech"
            value={data.targetRole || ''}
            onChange={(e) => onChange({ targetRole: e.target.value })}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={Boolean(guidance.is_undecided_goal)}
              onChange={(e) =>
                onChange({
                  guidance_expectations: {
                    ...guidance,
                    is_undecided_goal: e.target.checked,
                  },
                })
              }
              className="rounded text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs text-slate-600">
              I have a general domain in mind, but I am open to exploring specific occupational titles.
            </span>
          </label>
        </div>
      )}

      {/* 2. Natural-Language Dilemma Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            In your own words: What is your primary career question or dilemma?
          </label>
          <span className="text-[11px] text-slate-400">Optional</span>
        </div>
        <textarea
          rows={3}
          value={data.career_dilemma || data.guidance_reason || ''}
          onChange={handleDilemmaTextChange}
          placeholder="e.g., I'm finishing my degree in Commerce, but I've realized I enjoy programming and UI design. I want to know if transitioning into Tech is feasible without starting over."
          className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-800 placeholder:text-slate-400"
        />
        <p className="text-[11px] text-slate-500">
          Our AI counselor reads this statement to provide personalized conversational context.
        </p>
      </div>

      {/* 3. Common Decisions / Challenges Checklist */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          What decisions are you currently navigating? (Select any that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {DILEMMA_PRESETS.map((preset) => {
            const isSelected = selectedDilemmas.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleToggleDilemma(preset)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white font-medium shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {preset}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
