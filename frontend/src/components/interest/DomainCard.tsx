import React from 'react';
import {
  Calculator,
  BookOpen,
  BarChart2,
  Code,
  Activity,
  Wrench,
  Compass,
  DollarSign,
  Palette,
  Users,
  Shield,
  GraduationCap,
  Sparkles,
  Heart,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { type InterestDomain } from '../../lib/interestDomains';

interface DomainCardProps {
  domain: InterestDomain;
  isDeclaredFavorite: boolean;
  isExplored: boolean;
  isEmerging: boolean;
  isConfirmed: boolean;
  completedCount: number;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onSelect: () => void;
}

export default function DomainCard({
  domain,
  isDeclaredFavorite,
  isExplored,
  isEmerging,
  isConfirmed,
  completedCount,
  onToggleFavorite,
  onSelect,
}: DomainCardProps) {
  // Render domain icon
  const renderIcon = () => {
    const iconClass = 'w-5 h-5 text-[#168C89]';
    switch (domain.iconName) {
      case 'Calculator':
        return <Calculator className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'BarChart2':
        return <BarChart2 className={iconClass} />;
      case 'Code':
        return <Code className={iconClass} />;
      case 'Activity':
        return <Activity className={iconClass} />;
      case 'Wrench':
        return <Wrench className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      case 'DollarSign':
        return <DollarSign className={iconClass} />;
      case 'Palette':
        return <Palette className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'Shield':
        return <Shield className={iconClass} />;
      case 'GraduationCap':
        return <GraduationCap className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative ${
        isConfirmed
          ? 'bg-[#F0FAF9] border-[#168C89] shadow-xs ring-1 ring-[#168C89]/20'
          : isEmerging
          ? 'bg-white border-[#168C89]/50 shadow-xs'
          : 'bg-white border-[#E2E8F0] hover:border-[#168C89]/40 hover:bg-[#F8FAFC]'
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-center shrink-0">
              {renderIcon()}
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Domain
              </span>
              <h3 className="font-extrabold text-[#172638] text-sm sm:text-base leading-tight group-hover:text-[#168C89] transition-colors">
                {domain.name}
              </h3>
            </div>
          </div>

          {/* Favorite Declare Button */}
          <button
            type="button"
            onClick={onToggleFavorite}
            title={isDeclaredFavorite ? 'Remove declared favorite' : 'Mark as declared favorite'}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDeclaredFavorite
                ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isDeclaredFavorite ? 'fill-rose-500' : ''}`}
            />
          </button>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {isConfirmed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#142B4A] text-white">
              <CheckCircle2 className="w-3 h-3 text-[#2DD4BF]" />
              <span>Confirmed Interest</span>
            </span>
          )}

          {isEmerging && !isConfirmed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF5F4] text-[#168C89] border border-[#C5E6E4]">
              <TrendingUp className="w-3 h-3 text-[#168C89]" />
              <span>Emerging Interest</span>
            </span>
          )}

          {isExplored && !isEmerging && !isConfirmed && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Explored ({completedCount} done)
            </span>
          )}

          {!isExplored && !isEmerging && !isConfirmed && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
              Unexplored
            </span>
          )}

          {isDeclaredFavorite && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
              ★ Declared
            </span>
          )}
        </div>

        {/* Tagline & Description */}
        <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed mb-3">
          {domain.description}
        </p>

        {/* Subdomains Chips */}
        <div className="flex flex-wrap gap-1 mb-4">
          {domain.subdomains.slice(0, 3).map((sub, i) => (
            <span
              key={i}
              className="text-[10px] font-medium bg-[#F5F8FC] text-[#64748B] px-2 py-0.5 rounded-md border border-[#E2E8F0]"
            >
              {sub}
            </span>
          ))}
          {domain.subdomains.length > 3 && (
            <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
              +{domain.subdomains.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-[#64748B]">
          {domain.activities.length} interactive challenge{domain.activities.length > 1 ? 's' : ''}
        </span>
        <span className="text-xs font-bold text-[#168C89] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
