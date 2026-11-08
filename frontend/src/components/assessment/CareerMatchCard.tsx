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
import { Badge } from '../ui/Badge';
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

  const fitPercent = Math.round(career.fit);

  // SPOTLIGHT FEATURED LAYOUT FOR TOP #1 RECOMMENDATION
  if (isTopMatch) {
    return (
      <div className="bg-gradient-to-br from-white via-violet-50/20 to-white rounded-2xl border-2 border-violet-500/80 p-6 sm:p-8 shadow-[0_4px_24px_rgba(109,40,217,0.08)] relative overflow-hidden transition-all hover:shadow-[0_8px_32px_rgba(109,40,217,0.12)]">
        {/* Top Spotlight Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-violet-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>TOP CAREER RECOMMENDATION</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Highest Cognitive & Psychological Resonance</span>
            <Badge variant="success" size="sm" className="font-mono font-bold">
              {fitPercent}% Fit
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Title, Metadata, and Fit Narrative */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-violet-700 text-white font-mono text-sm font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                #{rank}
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {career.title}
                </h3>
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {career.field && (
                    <Badge variant="brand" size="xs">
                      {career.field}
                    </Badge>
                  )}
                  {career.salary_india?.mid && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/70">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      Mid: {career.salary_india.mid}
                    </span>
                  )}
                  {career.education && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/80">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                      {career.education}
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
            <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100 text-slate-800 leading-relaxed text-sm">
              <span className="font-extrabold text-violet-950 block mb-1 text-xs uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Why It Fits You
              </span>
              <p>{career.why_it_fits}</p>
            </div>

            {/* Typical Day-to-Day */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-0.5 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Typical Day-to-Day:
              </span>
              <p>{career.day_to_day}</p>
            </div>
          </div>

          {/* Right Column: Skills, Considerations & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
            <div>
              {/* Demonstrated Matching Skills vs Gap Skills or Fallback to Key Skills */}
              {career.matched_skills && career.matched_skills.length > 0 ? (
                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Demonstrated Matching Skills ({career.matched_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {career.matched_skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-semibold text-emerald-900 bg-emerald-50/90 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 stroke-[2.5] text-emerald-600" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {career.missing_skills && career.missing_skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-slate-400" />
                        Target Areas & Skill Gap
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {career.missing_skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-medium text-slate-600 bg-slate-50 border border-dashed border-slate-300 px-2.5 py-1 rounded-lg"
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Core Demonstrated & Required Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {career.key_skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs"
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
            <div className="pt-4 border-t border-violet-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                to={`/careers/${careerSlug}`}
                className="inline-flex items-center justify-center gap-1.5 text-violet-700 hover:text-violet-900 font-bold text-xs group py-2"
              >
                <span>Explore Day-to-Day & Skill Gap</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Button
                variant={isActiveGoal ? 'secondary' : 'primary'}
                size="sm"
                isLoading={isSettingGoal}
                leftIcon={isActiveGoal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Target className="w-3.5 h-3.5 text-white" />}
                onClick={() => onSetGoal(career)}
                disabled={isActiveGoal}
                className="shadow-sm"
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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] hover:border-violet-300 hover:shadow-[0_6px_24px_rgba(109,40,217,0.06)] transition-all flex flex-col justify-between group">
      <div>
        {/* Header: Rank + Title + Fit Badge */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold font-mono flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:bg-violet-50 group-hover:text-violet-700 group-hover:border-violet-200 transition-colors">
              #{rank}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-violet-950 transition-colors">
              {career.title}
            </h3>
          </div>

          <Badge variant="success" size="sm" className="shrink-0 font-mono font-bold">
            {fitPercent}% Fit
          </Badge>
        </div>

        {/* Metadata row: Field, Salary, Education */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          {career.field && (
            <Badge variant="brand" size="xs">
              {career.field}
            </Badge>
          )}
          {career.salary_india?.mid && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <Banknote className="w-3 h-3 text-emerald-600" />
              Mid: {career.salary_india.mid}
            </span>
          )}
          {career.education && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/70 truncate max-w-[220px]">
              <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{career.education}</span>
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
        <div className="mb-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <span className="font-bold text-violet-700 block mb-0.5 text-xs uppercase tracking-wider">
            Why It Fits You:
          </span>
          <p className="line-clamp-3">{career.why_it_fits}</p>
        </div>

        {/* Typical Day-to-Day */}
        <p className="text-xs text-slate-500 mb-3.5 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <span className="font-semibold text-slate-700">Typical Day-to-Day: </span>
          <span className="line-clamp-2">{career.day_to_day}</span>
        </p>

        {/* Skills: Demonstrated Matched vs Gap or Fallback to Key Skills */}
        {career.matched_skills && career.matched_skills.length > 0 ? (
          <div className="mb-3.5 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Demonstrated Skills ({career.matched_skills.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {career.matched_skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-0.5"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[2.5] text-emerald-600" />
                    {skill}
                  </span>
                ))}
                {career.matched_skills.length > 4 && (
                  <span className="text-[10px] font-medium text-emerald-700 px-1 py-0.5">
                    +{career.matched_skills.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {career.missing_skills && career.missing_skills.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3 text-slate-400" />
                  Target Growth
                </span>
                <div className="flex flex-wrap gap-1">
                  {career.missing_skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-dashed border-slate-300 px-2 py-0.5 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {career.missing_skills.length > 3 && (
                    <span className="text-[10px] font-medium text-slate-400 px-1 py-0.5">
                      +{career.missing_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : career.key_skills && career.key_skills.length > 0 ? (
          <div className="mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Core Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {career.key_skills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs"
                >
                  {skill}
                </span>
              ))}
              {career.key_skills.length > 5 && (
                <span className="text-[11px] font-medium text-slate-400 px-1 py-0.5">
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
      <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 mt-1">
        <Link
          to={`/careers/${careerSlug}`}
          className="inline-flex items-center gap-1.5 text-violet-700 hover:text-violet-900 font-bold text-xs group"
        >
          <span>Explore day-to-day & skill gap</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Button
          variant={isActiveGoal ? 'secondary' : 'outline'}
          size="sm"
          isLoading={isSettingGoal}
          leftIcon={isActiveGoal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Target className="w-3.5 h-3.5 text-violet-600" />}
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
