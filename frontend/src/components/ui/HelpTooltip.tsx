import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  title?: string;
  content: string;
  icon?: 'info' | 'help';
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  icon = 'info',
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-[#64748B] hover:text-[#172638] transition-colors p-0.5 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#168C89] cursor-help"
        aria-label="Information note"
      >
        {icon === 'info' ? (
          <Info className="w-3.5 h-3.5" />
        ) : (
          <HelpCircle className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#142B4A] text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none animate-in fade-in duration-150 leading-relaxed border border-[#0E1F36]">
          {title && <span className="font-bold block text-white mb-1">{title}</span>}
          <span className="text-slate-200">{content}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#142B4A]" />
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
