import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  AlertTriangle,
  Banknote,
  GraduationCap,
  Check,
  Star,
  Sparkles,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { CareerMatch } from '../../lib/assessment';

interface CareerMatchCardProps {
  career: CareerMatch;
  rank: number;
  isSettingGoal: boolean;
  isActiveGoal?: boolean;
  isTopMatch?: boolean;
  onSetGoal: (career: CareerMatch) => void;
}

export const CareerMatchCard: React.FC<CareerMatchCardProps> = ({
  career,
  rank,
  isSettingGoal,
  isActiveGoal = false,
  isTopMatch = false,
  onSetGoal,
}) => {
  const careerSlug =
    career.slug ||
    career.title
      .toLowerCase()
      .replace(/[/&]/g, ' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const matchLevel = career.match_level || (
    typeof career.fit === 'number' && !isNaN(career.fit)
      ? career.fit >= 72
        ? 'Strong Match'
        : career.fit >= 58
        ? 'Good Match'
        : 'Exploratory Match'
      : (typeof career.score === 'number' && !isNaN(career.score)
        ? career.score >= 0.72
          ? 'Strong Match'
          : career.score >= 0.58
          ? 'Good Match'
          : 'Exploratory Match'
        : 'Good Match')
  );

  const getSalaryDisplay = () => {
    const s = career.salary_india as any;
    if (!s) return null;
    const fresherVal = s.fresher || s.entry;
    if (fresherVal) {
      return { label: 'Est. Fresher', value: fresherVal };
    }
    if (s.mid) {
      return { label: 'Est. Mid-Level', value: s.mid };
    }
    return null;
  };
  const salaryDisplay = getSalaryDisplay();

  const getMatchLevelVariant = (level: string): BadgeVariant => {
    switch (level.toLowerCase()) {
      case 'strong match':
        return 'success';
      case 'good match':
        return 'brand';
      case 'exploratory match':
      default:
        return 'neutral';
    }
  };

  // SPOTLIGHT FEATURED LAYOUT FOR TOP #1 RECOMMENDATION
  if (isTopMatch) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#168C89] p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        {/* Top Spotlight Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E2E8F0]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#142B4A] text-white shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-[#168C89] text-[#168C89]" />
            <span>TOP CAREER RECOMMENDATION</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium">Highest Cognitive & Practical Alignment</span>
            <Badge variant={getMatchLevelVariant(matchLevel)} size="sm" className="font-semibold">
              {matchLevel}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Title, Metadata, and Fit Narrative */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#142B4A] text-white font-mono text-sm font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                #{rank}
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#172638] tracking-tight">
                  {career.title}
                </h3>
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {career.field && (
                    <Badge variant="brand" size="xs">
                      {career.field}
                    </Badge>
                  )}
                  {salaryDisplay && (
                    <span 
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/70"
                      title="Indicative Indian compensation estimate based on market industry benchmarks (not guaranteed compensation)"
                    >
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      {salaryDisplay.label}: {salaryDisplay.value}
                    </span>
                  )}
                  {career.education && (
                    <span 
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] bg-[#F8FAFC] px-2.5 py-0.5 rounded-md border border-[#E2E8F0]"
                      title="Typical occupational entry benchmark qualification (O*NET standard)"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-[#168C89]" />
                      Req: {career.education}
                    </span>
                  )}
                  {career.readiness && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                        career.readiness.toLowerCase() === 'high'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : career.readiness.toLowerCase() === 'medium'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          career.readiness.toLowerCase() === 'high'
                            ? 'bg-emerald-500'
                            : career.readiness.toLowerCase() === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      {career.readiness} Readiness
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Why It Fits Callout Box */}
            <div className="p-4 rounded-xl bg-[#EAF5F4]/60 border border-[#C5E6E4] text-[#172638] leading-relaxed text-sm">
              <span className="font-extrabold text-[#142B4A] block mb-1 text-xs uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#168C89]" />
                Why It Fits You
              </span>
              <p>{career.why_it_fits}</p>
            </div>

            {/* Typical Day-to-Day */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed">
              <span className="font-bold text-[#172638] block mb-0.5 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#168C89]" />
                Typical Day-to-Day:
              </span>
              <p>{career.day_to_day}</p>
            </div>
          </div>

          {/* Right Column: Skills, Considerations & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
            <div>
              {career.matched_skills && career.matched_skills.length > 0 ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#168C89] block mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#168C89]" />
                      Demonstrated Matching Skills ({career.matched_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {career.matched_skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-semibold text-[#168C89] bg-[#EAF5F4] border border-[#C5E6E4] px-2.5 py-1 rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {career.missing_skills && career.missing_skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-[#64748B]" />
                        Target Areas & Skill Gap
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {career.missing_skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-medium text-[#64748B] bg-[#F8FAFC] border border-dashed border-[#CBD5E1] px-2.5 py-1 rounded-lg"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : career.key_skills && career.key_skills.length > 0 ? (
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-2">
                    Core Demonstrated & Required Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {career.key_skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-semibold text-[#172638] bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Watch-out Consideration Box */}
              {career.watch_outs && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block mb-0.5">Critical Consideration:</span>
                    {career.watch_outs}
                  </div>
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                to={`/careers/${careerSlug}`}
                className="inline-flex items-center justify-center gap-1.5 text-[#168C89] hover:text-[#116A68] font-bold text-xs group py-2"
              >
                <span>Explore Day-to-Day & Skill Gap</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Button
                variant={isActiveGoal ? 'secondary' : 'primary'}
                size="sm"
                isLoading={isSettingGoal}
                leftIcon={isActiveGoal ? <Check className="w-3.5 h-3.5 text-[#168C89]" /> : <Target className="w-3.5 h-3.5 text-white" />}
                onClick={() => onSetGoal(career)}
                disabled={isActiveGoal}
                className="shadow-xs"
              >
                {isActiveGoal ? 'Active Career Goal' : 'Set as Primary Goal'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD CARD FOR RECOMMENDATIONS #2 - #5
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs hover:border-[#168C89] hover:shadow-sm transition-all flex flex-col justify-between group">
      <div>
        {/* Header: Rank + Title + Fit Badge */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-[#F1F5F9] text-[#172638] text-xs font-bold font-mono flex items-center justify-center shrink-0 border border-[#E2E8F0] group-hover:bg-[#EAF5F4] group-hover:text-[#168C89] transition-colors">
              #{rank}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#172638] truncate group-hover:text-[#142B4A] transition-colors">
              {career.title}
            </h3>
          </div>

          <Badge variant={getMatchLevelVariant(matchLevel)} size="sm" className="shrink-0 font-semibold">
            {matchLevel}
          </Badge>
        </div>

        {/* Metadata row: Field, Salary, Education */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          {career.field && (
            <Badge variant="brand" size="xs">
              {career.field}
            </Badge>
          )}
          {salaryDisplay && (
            <span 
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"
              title="Indicative Indian compensation estimate based on market industry benchmarks (not guaranteed compensation)"
            >
              <Banknote className="w-3 h-3 text-emerald-600" />
              {salaryDisplay.label}: {salaryDisplay.value}
            </span>
          )}
          {career.education && (
            <span 
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#E2E8F0] truncate max-w-[220px]"
              title="Typical occupational entry benchmark qualification (O*NET standard)"
            >
              <GraduationCap className="w-3 h-3 text-[#168C89] shrink-0" />
              <span className="truncate">Req: {career.education}</span>
            </span>
          )}
          {career.readiness && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                career.readiness.toLowerCase() === 'high'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : career.readiness.toLowerCase() === 'medium'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  career.readiness.toLowerCase() === 'high'
                    ? 'bg-emerald-500'
                    : career.readiness.toLowerCase() === 'medium'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
              />
              {career.readiness}
            </span>
          )}
        </div>

        {/* Why it fits narrative */}
        <div className="mb-3 text-xs sm:text-sm text-[#172638] leading-relaxed">
          <span className="font-bold text-[#168C89] block mb-0.5 text-xs uppercase tracking-wider">
            Why It Fits You:
          </span>
          <p className="line-clamp-3 text-[#64748B]">{career.why_it_fits}</p>
        </div>

        {/* Typical Day-to-Day */}
        <p className="text-xs text-[#64748B] mb-3.5 leading-relaxed bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
          <span className="font-semibold text-[#172638]">Typical Day-to-Day: </span>
          <span className="line-clamp-2">{career.day_to_day}</span>
        </p>

        {/* Skills: Demonstrated Matched vs Gap */}
        {career.matched_skills && career.matched_skills.length > 0 ? (
          <div className="mb-3.5 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#168C89] block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#168C89]" />
                Demonstrated Skills ({career.matched_skills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {career.matched_skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold text-[#168C89] bg-[#EAF5F4] border border-[#C5E6E4] px-2 py-0.5 rounded-md flex items-center gap-0.5"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    {skill}
                  </span>
                ))}
                {career.matched_skills.length > 4 && (
                  <span className="text-[10px] font-medium text-[#168C89] px-1 py-0.5">
                    +{career.matched_skills.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {career.missing_skills && career.missing_skills.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3 text-[#64748B]" />
                  Target Growth
                </span>
                <div className="flex flex-wrap gap-1">
                  {career.missing_skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-medium text-[#64748B] bg-[#F8FAFC] border border-dashed border-[#CBD5E1] px-2 py-0.5 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {career.missing_skills.length > 3 && (
                    <span className="text-[10px] font-medium text-[#64748B] px-1 py-0.5">
                      +{career.missing_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : career.key_skills && career.key_skills.length > 0 ? (
          <div className="mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
              Core Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {career.key_skills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md shadow-2xs"
                >
                  {skill}
                </span>
              ))}
              {career.key_skills.length > 5 && (
                <span className="text-[11px] font-medium text-[#64748B] px-1 py-0.5">
                  +{career.key_skills.length - 5} more
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Watch-out callout */}
        {career.watch_outs && (
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl mb-4 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950">Watch-out: </span>
              <span className="line-clamp-2">{career.watch_outs}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 mt-1">
        <Link
          to={`/careers/${careerSlug}`}
          className="inline-flex items-center gap-1.5 text-[#168C89] hover:text-[#116A68] font-bold text-xs group"
        >
          <span>Explore day-to-day & skill gap</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Button
          variant={isActiveGoal ? 'secondary' : 'outline'}
          size="sm"
          isLoading={isSettingGoal}
          leftIcon={isActiveGoal ? <Check className="w-3.5 h-3.5 text-[#168C89]" /> : <Target className="w-3.5 h-3.5 text-[#168C89]" />}
          onClick={() => onSetGoal(career)}
          disabled={isActiveGoal}
        >
          {isActiveGoal ? 'Active Career Goal' : 'Set as Career Goal'}
        </Button>
      </div>
    </div>
  );
};

export default CareerMatchCard;
