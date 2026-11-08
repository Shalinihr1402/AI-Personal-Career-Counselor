import React from 'react';
import {
  Sparkles,
  Mic,
  ArrowDown,
  ShieldCheck,
  GraduationCap,
  Calendar,
  CheckCircle2,
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

  const codeChars = (hollandCode || 'RIA').split('');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_24px_rgba(0,0,0,0.03)] p-6 sm:p-8 relative overflow-hidden">
      {/* Background radial accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-100/50 via-purple-50/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-slate-50/80 rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          {/* Status Badges Row */}
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

          {/* Heading */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome, <span className="capitalize">{username}</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Profile Active
              </span>
            </div>
            <p className="text-slate-600 text-sm sm:text-base mt-1.5 leading-relaxed">
              {stageSubtitle}
            </p>
          </div>

          {/* Quick metric pills & Holland Code Showcase */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Holland Code Badge with character tiles */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-50 to-purple-50/60 px-3.5 py-1.5 rounded-xl border border-violet-200/80 text-xs shadow-2xs">
              <span className="text-violet-600 font-bold uppercase tracking-wider text-[10px]">Holland RIASEC</span>
              <div className="flex items-center gap-1">
                {codeChars.map((ch, idx) => (
                  <span
                    key={idx}
                    className="w-6 h-6 rounded-md bg-violet-700 text-white font-mono font-extrabold text-xs flex items-center justify-center shadow-2xs"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            {/* Curated Matches Pill */}
            <div className="inline-flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">Curated Matches:</span>
              <span className="font-bold text-slate-900">{matchesCount} Occupations</span>
            </div>

            {/* Evidence grounded pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Evidence-Grounded Intelligence</span>
            </div>
          </div>
        </div>

        {/* Primary and secondary Action CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-[220px]">
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowDown className="w-4 h-4" />}
            onClick={onExploreCareers}
            className="w-full justify-center shadow-sm hover:shadow-violet-500/20"
          >
            Explore Matched Careers
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Mic className="w-4 h-4 text-violet-600" />}
            onClick={onStartVoiceCounselor}
            className="w-full justify-center bg-white hover:bg-violet-50/50 hover:border-violet-300"
          >
            Talk to AI Counselor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverviewCard;
