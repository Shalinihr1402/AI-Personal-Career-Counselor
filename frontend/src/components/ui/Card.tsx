import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const PADDING_STYLES = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-6 sm:p-7',
  lg: 'p-8 sm:p-10',
};

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(20,43,74,0.03)] ${
        hoverable ? 'hover:border-[#CBD5E1] hover:shadow-[0_10px_25px_-5px_rgba(20,43,74,0.06)] transition-all duration-200' : ''
      } ${PADDING_STYLES[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, eyebrow, icon, badge, actions, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4 mb-5 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#EAF5F4] text-[#168C89] flex items-center justify-center shrink-0 border border-[#C5E6E4] mt-0.5">
            {icon}
          </div>
        )}
        <div>
          {eyebrow && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#168C89] block mb-0.5">
              {eyebrow}
            </span>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#172638] text-base sm:text-lg tracking-tight">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">{actions}</div>}
    </div>
  );
};

export default Card;
