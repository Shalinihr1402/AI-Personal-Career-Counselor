import { useState } from 'react';
import {
  X,
  RotateCcw,
  SkipForward,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import {
  type InteractiveActivity,
  type InterestDomain,
} from '../../lib/interestDomains';

interface ActivityPlayerProps {
  activity: InteractiveActivity;
  domain: InterestDomain;
  onComplete: (responses: Record<string, any>) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function ActivityPlayer({
  activity,
  domain,
  onComplete,
  onSkip,
  onClose,
}: ActivityPlayerProps) {
  // Scenario Choice / Pattern Solver State
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Step Sequencer State
  const [sequenceOrder, setSequenceOrder] = useState<string[]>(() =>
    activity.sequenceItems ? activity.sequenceItems.map((s) => s.id) : []
  );

  // Resource Allocation State
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (activity.allocationItems) {
      activity.allocationItems.forEach((item) => {
        initial[item.id] = item.defaultValue;
      });
    }
    return initial;
  });

  // Text Completion State
  const [blankSelections, setBlankSelections] = useState<Record<string, string>>({});

  // UI state
  const [showHint, setShowHint] = useState(false);

  // Calculate total allocation for resource allocation type
  const totalAllocated = Object.values(allocations).reduce((acc, curr) => acc + curr, 0);
  const allocationLimit = activity.totalAllocationLimit || 20;
  const isAllocationValid = totalAllocated === allocationLimit;

  // Move item up in sequence
  const moveSequenceItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sequenceOrder.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sequenceOrder];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSequenceOrder(updated);
  };

  // Reset/Restart activity
  const handleReset = () => {
    setSelectedOptionId(null);
    setShowHint(false);
    if (activity.sequenceItems) {
      setSequenceOrder(activity.sequenceItems.map((s) => s.id));
    }
    if (activity.allocationItems) {
      const initial: Record<string, number> = {};
      activity.allocationItems.forEach((item) => {
        initial[item.id] = item.defaultValue;
      });
      setAllocations(initial);
    }
    setBlankSelections({});
  };

  // Handle final submission
  const handleSubmit = () => {
    const responses: Record<string, any> = {
      interactionType: activity.interactionType,
      activityId: activity.id,
      timestamp: new Date().toISOString(),
    };

    if (activity.interactionType === 'scenario_choice' || activity.interactionType === 'pattern_solver') {
      responses.selectedOptionId = selectedOptionId;
    } else if (activity.interactionType === 'step_sequencer') {
      responses.sequenceOrder = sequenceOrder;
      responses.isCorrect =
        JSON.stringify(sequenceOrder) === JSON.stringify(activity.correctSequenceIds);
    } else if (activity.interactionType === 'resource_allocation') {
      responses.allocations = allocations;
      responses.totalAllocated = totalAllocated;
    } else if (activity.interactionType === 'text_completion') {
      responses.blankSelections = blankSelections;
    }

    onComplete(responses);
  };

  // Check if current activity can be submitted
  const canSubmit = () => {
    if (activity.interactionType === 'scenario_choice' || activity.interactionType === 'pattern_solver') {
      return Boolean(selectedOptionId);
    }
    if (activity.interactionType === 'step_sequencer') {
      return sequenceOrder.length > 0;
    }
    if (activity.interactionType === 'resource_allocation') {
      return isAllocationValid;
    }
    if (activity.interactionType === 'text_completion') {
      return (
        activity.textBlanks &&
        activity.textBlanks.every((b) => Boolean(blankSelections[b.id]))
      );
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#142B4A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="bg-[#142B4A] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-[#168C89] border border-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#2DD4BF]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A5F3FC]">
                {domain.name}
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                {activity.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              title="Reset Activity"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Scenario Context Box */}
          <div className="p-4 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#168C89] uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Real-World Context</span>
            </div>
            <p className="text-sm text-[#172638] leading-relaxed">
              {activity.contextScenario}
            </p>
          </div>

          {/* Task Prompt */}
          <div>
            <h4 className="font-bold text-[#172638] text-base leading-snug">
              {activity.taskPrompt}
            </h4>
          </div>

          {/* Interaction Area 1: Scenario Choice or Pattern Solver */}
          {(activity.interactionType === 'scenario_choice' || activity.interactionType === 'pattern_solver') &&
            activity.options && (
              <div className="space-y-3">
                {activity.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedOptionId(option.id);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#168C89] bg-[#EAF5F4] ring-1 ring-[#168C89]/30 shadow-xs'
                          : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#168C89]/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-[#168C89] bg-[#168C89] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-sm text-[#172638] block">
                            {option.label}
                          </span>
                          {option.description && (
                            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                              {option.description}
                            </p>
                          )}

                          {isSelected && option.feedbackInsight && (
                            <div className="mt-2.5 p-2.5 rounded-lg bg-white/80 border border-[#C5E6E4] text-xs font-medium text-[#168C89] flex items-start gap-2">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{option.feedbackInsight}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          {/* Interaction Area 2: Step Sequencer */}
          {activity.interactionType === 'step_sequencer' && activity.sequenceItems && (
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-[#64748B] block">
                Use arrows to rearrange the steps into the correct execution order:
              </span>
              {sequenceOrder.map((stepId, index) => {
                const item = activity.sequenceItems?.find((s) => s.id === stepId);
                if (!item) return null;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-[#168C89]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#EAF5F4] text-[#168C89] font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-[#172638]">
                        {item.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveSequenceItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#168C89] hover:bg-[#EAF5F4] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSequenceItem(index, 'down')}
                        disabled={index === sequenceOrder.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#168C89] hover:bg-[#EAF5F4] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interaction Area 3: Resource Allocation */}
          {activity.interactionType === 'resource_allocation' && activity.allocationItems && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#EAF5F4] border border-[#C5E6E4] flex items-center justify-between text-xs">
                <span className="font-bold text-[#142B4A]">
                  Budget Constraint Target: {allocationLimit} Lakhs
                </span>
                <span
                  className={`font-extrabold px-2.5 py-0.5 rounded-full text-xs ${
                    isAllocationValid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Allocated: {totalAllocated} / {allocationLimit} Lakhs
                </span>
              </div>

              {activity.allocationItems.map((item) => {
                const value = allocations[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#172638]">
                      <span>{item.name}</span>
                      <span className="text-[#168C89] font-extrabold text-sm">
                        ₹{value} {item.unit}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={value}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setAllocations((prev) => ({ ...prev, [item.id]: val }));
                      }}
                      className="w-full accent-[#168C89] cursor-pointer"
                    />

                    <p className="text-[11px] text-[#64748B]">
                      {item.impactDescription}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interaction Area 4: Text Completion */}
          {activity.interactionType === 'text_completion' && activity.textBlanks && (
            <div className="space-y-4">
              {activity.textBlanks.map((blank) => (
                <div key={blank.id} className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172638] block">
                    {blank.label}
                  </label>
                  <select
                    value={blankSelections[blank.id] || ''}
                    onChange={(e) =>
                      setBlankSelections((prev) => ({ ...prev, [blank.id]: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-white text-xs sm:text-sm font-medium text-[#172638] focus:border-[#168C89] focus:outline-hidden"
                  >
                    <option value="">{blank.placeholder}</option>
                    {blank.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Explanation Hint Toggle */}
          {activity.explanationHint && (
            <div>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-semibold text-[#168C89] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Reasoning Hint' : 'Need a hint?'}</span>
              </button>

              {showHint && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                  {activity.explanationHint}
                </div>
              )}
            </div>
          )}

          {/* Takeaway Insight Message */}
          <div className="p-3.5 rounded-xl bg-[#F0FAF9] border border-[#C5E6E4] text-xs text-[#142B4A] leading-relaxed">
            <span className="font-bold text-[#168C89]">Why this matters: </span>
            <span>{activity.takeawayMessage}</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#172638] hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip for now</span>
          </button>

          <button
            type="button"
            disabled={!canSubmit()}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-[#142B4A] hover:bg-[#0E1F36] text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <span>Complete & Rate Activity</span>
            <ArrowRight className="w-4 h-4 text-[#168C89]" />
          </button>
        </div>

      </div>
    </div>
  );
}
