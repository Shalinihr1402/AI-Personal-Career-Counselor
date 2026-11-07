import React from 'react';
import {
  Sparkles,
  Mic,
  ArrowDown,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Compass,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ProfileOverviewCardProps {
  userEmail?: string;
  stageTitle: string;
  stageSubtitle: string;
  hollandCode: string;
  matchesCount: number;
  resultsAt: string | null;
  onExploreCareers: () => void;
  onStartVoiceCounselor: () => void;
}

export const ProfileOverviewCard: React.FC<ProfileOverviewCardProps> = ({
  userEmail,
  stageTitle,
  stageSubtitle,
  hollandCode,
  matchesCount,
  resultsAt,
  onExploreCareers,
  onStartVoiceCounselor,
}) => {
  const username = userEmail ? userEmail.split('@')[0] : 'Student';
  const formattedDate = resultsAt
    ? new Date(resultsAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Assessment Verified
            </Badge>
            <Badge variant="default" size="sm" icon={<GraduationCap className="w-3.5 h-3.5 text-slate-500" />}>
              {stageTitle}
            </Badge>
            {formattedDate && (
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium ml-1">
                <Calendar className="w-3 h-3" /> {formattedDate}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, <span className="capitalize">{username}</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-1.5 leading-relaxed">
              {stageSubtitle}
            </p>
          </div>

          {/* Quick metric pills */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs">
              <Compass className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-slate-500">Holland Code:</span>
              <span className="font-extrabold text-violet-900 tracking-wider font-mono">{hollandCode}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">Curated Matches:</span>
              <span className="font-bold text-slate-800">{matchesCount} Occupations</span>
            </div>
          </div>
        </div>

        {/* Primary and secondary CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowDown className="w-4 h-4" />}
            onClick={onExploreCareers}
            className="w-full justify-center"
          >
            Explore Matched Careers
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Mic className="w-4 h-4 text-violet-600" />}
            onClick={onStartVoiceCounselor}
            className="w-full justify-center"
          >
            Talk to AI Counselor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverviewCard;
