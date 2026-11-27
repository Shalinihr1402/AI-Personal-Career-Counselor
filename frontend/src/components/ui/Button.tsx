import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'teal' | 'outline' | 'ghost' | 'danger';
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
    'bg-[#142B4A] text-white hover:bg-[#0E1F36] shadow-xs border border-[#142B4A] focus-visible:ring-[#168C89]',
  secondary:
    'bg-[#EAF5F4] text-[#168C89] hover:bg-[#D4ECE9] border border-[#C5E6E4] focus-visible:ring-[#168C89]',
  teal:
    'bg-[#168C89] text-white hover:bg-[#116A68] shadow-xs border border-[#168C89] focus-visible:ring-[#168C89]',
  outline:
    'bg-white text-[#172638] hover:bg-[#F8FAFC] hover:text-[#142B4A] border border-[#E2E8F0] focus-visible:ring-[#168C89] shadow-xs',
  ghost:
    'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#172638] border border-transparent focus-visible:ring-[#168C89]',
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
