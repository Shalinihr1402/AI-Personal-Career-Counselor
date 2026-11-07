import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-violet-700 text-white hover:bg-violet-800 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_2px_8px_rgba(109,40,217,0.18)] border border-violet-800/40 focus-visible:ring-violet-600',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200/80 border border-slate-200/60 focus-visible:ring-slate-400',
  outline:
    'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 focus-visible:ring-slate-400 shadow-xs',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 border border-rose-700/50 focus-visible:ring-rose-500 shadow-xs',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'text-xs font-semibold px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm font-semibold px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base font-bold px-5 py-3 rounded-xl gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        VARIANT_STYLES[variant]
      } ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
