import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  Info,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { AdaptiveScoreResult } from '../../lib/assessment';

interface CompetencyEvidenceCardProps {
  adaptiveScore: AdaptiveScoreResult | null;
}

export const CompetencyEvidenceCard: React.FC<CompetencyEvidenceCardProps> = ({
  adaptiveScore,
}) => {
  const [expandedTier, setExpandedTier] = useState<number | null>(3); // Default open Tier 3

  if (!adaptiveScore || !adaptiveScore.evidence_breakdown) {
    return null;
  }

  const breakdown = adaptiveScore.evidence_breakdown;
  const selfReported = breakdown.self_reported_skills || [];
  const conceptual = breakdown.conceptual_knowledge || [];
  const applied = breakdown.applied_scenario || [];
  const verifiedCount = 0; // Strictly capped at 0 for MCQ

  const toggleTier = (tier: number) => {
    setExpandedTier(expandedTier === tier ? null : tier);
  };

  return (
    <Card padding="md">
      <CardHeader
        eyebrow="Evidence-Based Profiling"
        title="Competency Evidence Intelligence"
        subtitle="Separating declared skills, conceptual awareness, and situational reasoning into strict verification tiers"
        icon={<ShieldCheck className="w-5 h-5 text-violet-600" />}
        badge={
          <Badge variant="brand" size="xs">
            4-Tier Evidence Model
          </Badge>
        }
      />

      {/* Philosophy banner */}
      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 mb-6 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Verification Integrity Standard: </span>
          Multiple-choice answers can verify conceptual recall and situational judgment, but cannot prove hands-on workplace production. We strictly distinguish what you reported from what you demonstrated.
        </div>
      </div>

      <div className="space-y-3.5">
        {/* Tier 1: Declared & Self-Reported Skills */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden transition-all bg-white">
          <button
            type="button"
            onClick={() => toggleTier(1)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                T1
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Tier 1: Declared Skills
                  </h4>
                  <Badge variant="neutral" size="xs">
                    {selfReported.length} Declared
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Skills you stated during onboarding or extracted from your resume
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {expandedTier === 1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedTier === 1 && (
            <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/40 text-xs">
              <div className="mb-3 p-2.5 bg-white rounded-lg border border-slate-200/70 text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-700">Audit Rule: </span>
                Self-reported skills provide baseline discovery direction. They do not demonstrate tested proficiency or verified production problem solving.
              </div>

              {selfReported.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selfReported.map((s) => (
                    <span
                      key={s.skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.skill}</span>
                      <span className="text-[10px] text-slate-400 font-normal">• Self-Reported</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No self-reported skills declared in onboarding.</p>
              )}
            </div>
          )}
        </div>

        {/* Tier 2: Conceptual Knowledge */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden transition-all bg-white">
          <button
            type="button"
            onClick={() => toggleTier(2)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                T2
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Tier 2: Conceptual Knowledge
                  </h4>
                  <Badge variant="default" size="xs" className="bg-blue-50 text-blue-700 border-blue-200">
                    {conceptual.length} Demonstrated
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Domain terminology and conceptual recall demonstrated in assessment scenarios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {expandedTier === 2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedTier === 2 && (
            <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/40 text-xs">
              <div className="mb-3 p-2.5 bg-white rounded-lg border border-slate-200/70 text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-700">Audit Rule: </span>
                Demonstrates accurate theoretical grasp and foundational concepts. Does not prove code production, clinical practice, or audit execution.
              </div>

              {conceptual.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {conceptual.map((c) => (
                    <div
                      key={c.competency_id}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 capitalize text-xs block">
                          {c.competency_id.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          Proficiency: {c.level}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        +{c.rubric_points} pts
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">Broad discovery pathway; no specialized conceptual items triggered.</p>
              )}
            </div>
          )}
        </div>

        {/* Tier 3: Applied Scenario Problem-Solving */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden transition-all bg-white">
          <button
            type="button"
            onClick={() => toggleTier(3)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 border border-violet-200/60 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                T3
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Tier 3: Applied Situational Judgment
                  </h4>
                  <Badge variant="brand" size="xs">
                    {applied.length} Demonstrated
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Practical troubleshooting and reasoning in realistic workplace dilemmas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {expandedTier === 3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {expandedTier === 3 && (
            <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/40 text-xs">
              <div className="mb-3 p-2.5 bg-white rounded-lg border border-slate-200/70 text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-700">Audit Rule: </span>
                Demonstrates authentic situational awareness and problem-solving instinct. Points toward careers requiring high diagnostic and decision judgment.
              </div>

              {applied.length > 0 ? (
                <div className="space-y-2.5">
                  {applied.map((c) => (
                    <div
                      key={c.competency_id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 capitalize text-xs">
                            {c.competency_id.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                            Applied Scenario • {c.level}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-violet-800">+{c.rubric_points} pts</span>
                      </div>
                      {c.practical_verification_note && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 leading-relaxed">
                          <span className="font-bold text-slate-700">Next Practical Step: </span>
                          {c.practical_verification_note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No applied scenario items completed in this questionnaire.</p>
              )}
            </div>
          )}
        </div>

        {/* Tier 4: Verified Practical Demonstration (CAPPED BY MCQ) */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
          <div className="p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-slate-800">
                  Tier 4: Verified Practical Demonstration
                </h4>
                <Badge variant="outline" size="xs" className="bg-slate-200/60 text-slate-700 border-slate-300">
                  {verifiedCount} Artifacts (Capped by MCQ Standards)
                </Badge>
              </div>
              <p className="text-slate-500 leading-relaxed">
                In compliance with educational integrity and Indian statutory licensing frameworks (NMC, BCI, ICAI, AICTE), multiple-choice scenarios cannot prove verified hands-on proficiency. Practical mastery requires certified GitHub repositories, clinical logs, or registered articleship records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CompetencyEvidenceCard;
