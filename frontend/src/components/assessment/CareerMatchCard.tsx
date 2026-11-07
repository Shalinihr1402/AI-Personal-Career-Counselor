import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  AlertTriangle,
  Banknote,
  GraduationCap,
  Check,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { CareerMatch } from '../../lib/assessment';

interface CareerMatchCardProps {
  career: CareerMatch;
  rank: number;
  isSettingGoal: boolean;
  isActiveGoal?: boolean;
  onSetGoal: (career: CareerMatch) => void;
}

export const CareerMatchCard: React.FC<CareerMatchCardProps> = ({
  career,
  rank,
  isSettingGoal,
  isActiveGoal = false,
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between">
      <div>
        {/* Header: Rank + Title + Fit Badge */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold font-mono flex items-center justify-center shrink-0 border border-slate-200/60">
              #{rank}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {career.title}
            </h3>
          </div>

          <Badge variant="success" size="sm" className="shrink-0 font-mono">
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
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2.5 py-0.5 rounded-md border border-emerald-100/80">
              <Banknote className="w-3 h-3 text-emerald-600" />
              Mid: {career.salary_india.mid}
            </span>
          )}
          {career.education && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100/70 px-2.5 py-0.5 rounded-md border border-slate-200/60">
              <GraduationCap className="w-3 h-3 text-slate-400" />
              {career.education}
            </span>
          )}
        </div>

        {/* Why it fits narrative */}
        <div className="mb-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          <span className="font-bold text-slate-900 block mb-0.5 text-xs uppercase tracking-wider text-violet-700">
            Why It Fits You:
          </span>
          {career.why_it_fits}
        </div>

        {/* Typical Day-to-Day */}
        <p className="text-xs text-slate-500 mb-3.5 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
          <span className="font-semibold text-slate-700">Typical Day-to-Day: </span>
          {career.day_to_day}
        </p>

        {/* Key skills tags */}
        {career.key_skills && career.key_skills.length > 0 && (
          <div className="mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Core Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {career.key_skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Watch-out callout */}
        {career.watch_outs && (
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl mb-4 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950">Watch-out: </span>
              {career.watch_outs}
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
