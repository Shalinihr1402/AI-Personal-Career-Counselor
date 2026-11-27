import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'brand'
  | 'navy'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'outline';

export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-[#F1F5F9] text-[#172638] border-[#E2E8F0]',
  brand: 'bg-[#EAF5F4] text-[#168C89] border-[#C5E6E4]',
  navy: 'bg-[#142B4A] text-white border-[#142B4A]',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-rose-50 text-rose-800 border-rose-200',
  neutral: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
  outline: 'bg-white text-[#172638] border-[#E2E8F0]',
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-2 py-0.5 font-semibold gap-1 rounded-md',
  sm: 'text-xs px-2.5 py-0.5 font-semibold gap-1.5 rounded-lg',
  md: 'text-xs px-3 py-1 font-bold gap-1.5 rounded-lg',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  icon,
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center border tracking-tight transition-colors ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
