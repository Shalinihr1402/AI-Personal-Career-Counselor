import React from 'react';
import { Badge, type BadgeVariant } from './Badge';

interface SectionHeaderProps {
  tag?: string;
  tagVariant?: BadgeVariant;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  tag,
  tagVariant = 'brand',
  title,
  description,
  actions,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-5 border-b border-slate-200/70 ${className}`}>
      <div className="space-y-1.5 max-w-3xl">
        {(tag || icon) && (
          <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-violet-600">{icon}</span>}
            {tag && (
              <Badge variant={tagVariant} size="xs">
                {tag}
              </Badge>
            )}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-normal">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
