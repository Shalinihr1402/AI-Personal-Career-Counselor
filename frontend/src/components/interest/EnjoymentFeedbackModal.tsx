import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  ThumbsUp,
  Meh,
  ThumbsDown,
  RotateCcw,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { type EnjoymentRating } from '../../lib/interestEvidenceService';
import { type InteractiveActivity, type InterestDomain } from '../../lib/interestDomains';

interface EnjoymentFeedbackModalProps {
  activity: InteractiveActivity;
  domain: InterestDomain;
  onSaveFeedback: (rating: EnjoymentRating, note?: string) => void;
  onReplay: () => void;
  onClose: () => void;
}

export default function EnjoymentFeedbackModal({
  activity: _activity,
  domain: _domain,
  onSaveFeedback,
  onReplay,
  onClose,
}: EnjoymentFeedbackModalProps) {
  const [selectedRating, setSelectedRating] = useState<EnjoymentRating>('enjoyed');
  const [feedbackNote, setFeedbackNote] = useState('');

  const ratings: {
    id: EnjoymentRating;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    activeStyle: string;
  }[] = [
    {
      id: 'loved',
      label: 'Loved it!',
      sublabel: 'Felt exciting & want more',
      icon: <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600" />,
      activeStyle: 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400',
    },
    {
      id: 'enjoyed',
      label: 'Enjoyed it',
      sublabel: 'Engaging & interesting',
      icon: <ThumbsUp className="w-5 h-5 text-[#168C89]" />,
      activeStyle: 'border-[#168C89] bg-[#EAF5F4] ring-1 ring-[#168C89]/30',
    },
    {
      id: 'neutral',
      label: 'Neutral',
      sublabel: 'Okay, but didn’t spark much',
      icon: <Meh className="w-5 h-5 text-slate-500" />,
      activeStyle: 'border-slate-400 bg-slate-50 ring-1 ring-slate-400',
    },
    {
      id: 'disliked',
      label: 'Not for me',
      sublabel: 'Felt tedious or unappealing',
      icon: <ThumbsDown className="w-5 h-5 text-rose-500" />,
      activeStyle: 'border-rose-300 bg-rose-50 ring-1 ring-rose-300',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFeedback(selectedRating, feedbackNote.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#142B4A]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#F0FAF9] via-[#F4FBFA] to-[#EAF5F4] border-b border-[#C5E6E4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#142B4A] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#168C89]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#168C89] bg-white px-2 py-0.5 rounded-full border border-[#C5E6E4]">
                Activity Completed
              </span>
              <h3 className="font-extrabold text-[#172638] text-base sm:text-lg mt-0.5">
                How did you enjoy this challenge?
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <p className="text-xs text-[#64748B] leading-relaxed">
            Your honest feedback helps us discover your authentic interests. There are no right or wrong reactions—disliking an activity is just as valuable as loving it!
          </p>

          {/* 4 Rating Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            {ratings.map((r) => {
              const isSelected = selectedRating === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRating(r.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                    isSelected
                      ? r.activeStyle
                      : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {r.icon}
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#168C89] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-[#172638] block mt-2">
                      {r.label}
                    </span>
                    <span className="text-[11px] text-[#64748B] leading-tight block">
                      {r.sublabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional Explanation Note */}
          <div>
            <label className="text-xs font-bold text-[#172638] block mb-1.5">
              Why did you feel this way? (Optional reflection)
            </label>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g., I enjoyed finding the pattern, or I found the calculations tedious..."
              className="w-full p-3 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#172638] focus:border-[#168C89] focus:outline-hidden resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReplay}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-bold text-[#64748B] hover:text-[#172638] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Activity</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Record & Continue</span>
              <ArrowRight className="w-4 h-4 text-[#168C89]" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
