import React from 'react';
import {
  DollarSign,
  ShieldCheck,
  Clock,
  Compass,
  Laptop,
  Building2,
  Home,
  Check,
} from 'lucide-react';
import type { OnboardingRecord } from '../../lib/onboarding';
import {
  type CareerPreferences,
  type CareerDiscoveryPreferences,
  type PracticalConstraints,
  type EarningUrgency,
  type RelocationFlexibility,
} from '../../lib/careerPreferencesTaxonomy';

interface Stage5PrioritiesConstraintsProps {
  data: Partial<OnboardingRecord>;
  onChange: (patch: Partial<OnboardingRecord>) => void;
}

const CAREER_PRIORITIES = [
  {
    id: 'high_salary',
    title: 'High Earning Potential & Fast Salary Growth',
    desc: 'Prioritizing roles with high starting packages or rapid promotion ladders.',
    icon: DollarSign,
  },
  {
    id: 'job_security',
    title: 'Job Stability & Long-Term Security',
    desc: 'Prioritizing stable employers, predictable career tracks, and resilient industries.',
    icon: ShieldCheck,
  },
  {
    id: 'work_life_balance',
    title: 'Work-Life Balance & Sustainable Hours',
    desc: 'Prioritizing manageable workweeks, minimal overtime, and flexibility.',
    icon: Clock,
  },
  {
    id: 'career_growth',
    title: 'Rapid Skill Acceleration & Learning',
    desc: 'Prioritizing steep learning curves, mentorship, and high-impact projects.',
    icon: Compass,
  },
  {
    id: 'helping_society',
    title: 'Societal Impact & Mission-Driven Work',
    desc: 'Prioritizing work that directly benefits public health, education, or society.',
    icon: ShieldCheck,
  },
];

const WORK_ENVIRONMENTS = [
  { id: 'work_from_home', title: 'Remote / Work from Home', icon: Home },
  { id: 'hybrid', title: 'Hybrid (Part Office, Part Home)', icon: Laptop },
  { id: 'office_based', title: 'Office-Based / On-Site', icon: Building2 },
  { id: 'no_preference', title: 'Flexible / Open to Any', icon: Compass },
];

const EARNING_URGENCY_OPTIONS: Array<{ id: EarningUrgency; title: string; desc: string }> = [
  {
    id: 'immediate_1_to_3_months',
    title: 'Immediate Necessity (Within 1-3 Months)',
    desc: 'Need to secure an income quickly; cannot afford long unpaid study periods.',
  },
  {
    id: 'moderate_6_to_12_months',
    title: 'Moderate Runway (Within 6-12 Months)',
    desc: 'Can spend 6 to 12 months upskilling, doing bootcamps or internships before a full job.',
  },
  {
    id: 'extended_1_to_2_years',
    title: 'Extended Runway (1-2 Years)',
    desc: 'Planning for a Master’s degree, competitive exams, or deep multi-year preparation.',
  },
  {
    id: 'flexible_not_urgent',
    title: 'Flexible / No Urgent Earning Pressure',
    desc: 'Focus is entirely on long-term career satisfaction and optimal fit.',
  },
];

const RELOCATION_OPTIONS: Array<{ id: RelocationFlexibility; title: string; desc: string }> = [
  {
    id: 'open_to_relocation',
    title: 'Open to Relocate Anywhere',
    desc: 'Willing to move to major tech/finance hubs or anywhere for the right job.',
  },
  {
    id: 'home_city_only',
    title: 'Home City / Region Only',
    desc: 'Family, personal commitments, or preferences require staying in current city.',
  },
  {
    id: 'remote_only',
    title: 'Strictly Remote / Work-from-Home Only',
    desc: 'Require roles that do not mandate physical relocation.',
  },
  {
    id: 'flexible',
    title: 'Flexible / Depends on Offer',
    desc: 'Open to discuss based on company tier and compensation.',
  },
];

export const Stage5PrioritiesConstraints: React.FC<Stage5PrioritiesConstraintsProps> = ({
  data,
  onChange,
}) => {
  const cp: CareerPreferences = data.career_preferences || {};
  const cdp: CareerDiscoveryPreferences = data.career_discovery_preferences || {
    career_motivations: [],
    career_priorities: [],
    preferred_work_environment: null,
    daily_learning_commitment: null,
    career_timeline: null,
  };

  const constraints: PracticalConstraints = cp.practical_constraints || cdp.practical_constraints || {};
  const selectedPriorities = cp.career_priorities || (cdp.career_priorities as string[]) || [];
  const selectedEnv = cp.preferred_work_environment?.[0] || cdp.preferred_work_environment || 'hybrid';
  const hoursPerWeek = data.hoursPerWeek || '10_to_15_hrs';

  const updatePreferences = (
    patchCP: Partial<CareerPreferences>,
    patchCDP: Partial<CareerDiscoveryPreferences> = {},
    patchGeneral: Partial<OnboardingRecord> = {}
  ) => {
    const updatedCP = { ...cp, ...patchCP };
    const updatedCDP = { ...cdp, ...patchCDP };
    onChange({
      career_preferences: updatedCP,
      career_discovery_preferences: updatedCDP,
      hoursPerWeek: patchGeneral.hoursPerWeek || data.hoursPerWeek,
      ...patchGeneral,
    });
  };

  const togglePriority = (id: string) => {
    const updated = selectedPriorities.includes(id)
      ? selectedPriorities.filter((p) => p !== id)
      : [...selectedPriorities, id];

    updatePreferences(
      { career_priorities: updated },
      { career_priorities: updated as any }
    );
  };

  const handleUpdateConstraint = (patch: Partial<PracticalConstraints>) => {
    const updatedConstraints = { ...constraints, ...patch };
    updatePreferences({ practical_constraints: updatedConstraints }, { practical_constraints: updatedConstraints });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-left space-y-1.5 border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider">
          Stage 5 of 6
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Career Priorities & Practical Realities
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Career advice only works if it fits your real life. Tell us what matters most to you and your practical constraints.
        </p>
      </div>

      {/* 1. Core Career Priorities */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. What Matters Most in Your Next Step? (Select up to 3)
          </label>
          <p className="text-xs text-slate-500">
            Helps our matching engine rank roles that align with your core values.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {CAREER_PRIORITIES.map((p) => {
            const isSelected = selectedPriorities.includes(p.id);
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => togglePriority(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePriority(p.id);
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50/80 shadow-2xs ring-1 ring-slate-900/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{p.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-900" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Qualitative Priority Explanation */}
        <div className="pt-1">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Why does this matter most to you right now? (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. I need financial independence early to support my family; or I want a role that lets me learn AI quickly."
            value={cp.reason_for_choice || ''}
            onChange={(e) => updatePreferences({ reason_for_choice: e.target.value })}
            className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* 2. Earning Urgency & Financial Runway (CRITICAL GROUNDING) */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Earning Urgency & Timeline
          </label>
          <p className="text-xs text-slate-500">
            Prevents recommending long unpaid master's programs or extended training to someone who needs to earn immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EARNING_URGENCY_OPTIONS.map((urg) => {
            const isSelected = constraints.earning_urgency === urg.id;
            return (
              <div
                key={urg.id}
                role="button"
                tabIndex={0}
                onClick={() => handleUpdateConstraint({ earning_urgency: urg.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUpdateConstraint({ earning_urgency: urg.id });
                  }
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50/80 shadow-2xs font-semibold'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">{urg.title}</span>
                <span className="text-[11px] text-slate-500 block mt-1 leading-snug">{urg.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Work Setting & Relocation Mobility */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Work Environment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Work Setting Preference
            </label>
            <div className="space-y-2">
              {WORK_ENVIRONMENTS.map((env) => {
                const isSelected = selectedEnv === env.id;
                const Icon = env.icon;
                return (
                  <div
                    key={env.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      updatePreferences(
                        { preferred_work_environment: [env.id] },
                        { preferred_work_environment: env.id as any }
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updatePreferences(
                          { preferred_work_environment: [env.id] },
                          { preferred_work_environment: env.id as any }
                        );
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-2xs font-semibold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-xs text-slate-800">{env.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Relocation Flexibility */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Relocation & Mobility
            </label>
            <div className="space-y-2">
              {RELOCATION_OPTIONS.map((rel) => {
                const isSelected = constraints.relocation_flexibility === rel.id;
                return (
                  <div
                    key={rel.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleUpdateConstraint({ relocation_flexibility: rel.id })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUpdateConstraint({ relocation_flexibility: rel.id });
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-2xs font-semibold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{rel.title}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{rel.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Weekly Learning Bandwidth */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Realistic Weekly Learning Bandwidth
          </label>
          <p className="text-xs text-slate-500 mb-2">
            How many hours per week can you realistically invest alongside your college coursework or job?
          </p>
          <select
            value={hoursPerWeek}
            onChange={(e) =>
              updatePreferences(
                {
                  learning_commitment: {
                    hours_per_week: parseInt(e.target.value) || 10,
                    daily_commitment: e.target.value,
                  },
                },
                {},
                { hoursPerWeek: e.target.value }
              )
            }
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="less_than_5_hrs">Light (Under 5 hours / week — weekends only)</option>
            <option value="5_to_10_hrs">Moderate (5 - 10 hours / week — 1 hour / day)</option>
            <option value="10_to_20_hrs">Dedicated (10 - 20 hours / week — serious preparation)</option>
            <option value="20_plus_hrs">Intensive (20+ hours / week — full-time upskilling)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
