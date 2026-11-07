import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'narrow' | 'standard' | 'wide' | 'full';
  className?: string;
  hasAmbientGlow?: boolean;
}

const MAX_WIDTHS = {
  narrow: 'max-w-3xl',
  standard: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'wide',
  className = '',
  hasAmbientGlow = true,
}) => {
  return (
    <div className={`min-h-[calc(100vh-4rem)] ${hasAmbientGlow ? 'bg-ambient-glow' : 'bg-[#F8F9FB]'} transition-colors`}>
      <main className={`${MAX_WIDTHS[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${className}`}>
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
