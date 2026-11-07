import React from 'react';
import { Compass, Info } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { HelpTooltip } from '../ui/HelpTooltip';
import type { Dim, RiasecScores } from '../../lib/assessment';

const RIASEC_META: Record<
  Dim,
  { label: string; tag: string; description: string; traits: string }
> = {
  R: {
    label: 'Realistic',
    tag: 'The Doer',
    description: 'Practical, hands-on problem solving using tools, hardware, and physical systems.',
    traits: 'Engineering, robotics, mechanics, agriculture, construction',
  },
  I: {
    label: 'Investigative',
    tag: 'The Thinker',
    description: 'Analytical reasoning, scientific inquiry, research, and deep technical problem solving.',
    traits: 'Data science, medical research, software architecture, astronomy',
  },
  A: {
    label: 'Artistic',
    tag: 'The Creator',
    description: 'Creative expression, visual aesthetics, storytelling, and novel design thinking.',
    traits: 'UI/UX design, media production, industrial design, creative direction',
  },
  S: {
    label: 'Social',
    tag: 'The Helper',
    description: 'Interpersonal empathy, mentoring, healthcare, teaching, and human collaboration.',
    traits: 'Counseling, clinical medicine, education, community leadership',
  },
  E: {
    label: 'Enterprising',
    tag: 'The Leader',
    description: 'Persuasion, initiative, strategic decision-making, and entrepreneurial leadership.',
    traits: 'Product management, venture creation, corporate strategy, marketing',
  },
  C: {
    label: 'Conventional',
    tag: 'The Organizer',
    description: 'Structured methodologies, meticulous accuracy, regulatory systems, and data integrity.',
    traits: 'Chartered accountancy, statutory compliance, quality assurance, logistics',
  },
};

const DIM_ORDER: Dim[] = ['R', 'I', 'A', 'S', 'E', 'C'];

interface InterestIntelligenceCardProps {
  scores: RiasecScores;
  code: string;
  topFields?: string[];
  source?: string;
}

export const InterestIntelligenceCard: React.FC<InterestIntelligenceCardProps> = ({
  scores,
  code,
  topFields = [],
  source,
}) => {
  const topLetters = code ? code.split('') : [];

  // Sort dimensions descending by student score
  const sortedDims = [...DIM_ORDER].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));

  return (
    <Card padding="md">
      <CardHeader
        eyebrow="Psychological Career Profiling"
        title="Interest Intelligence (Holland RIASEC)"
        subtitle="Aggregated deterministically across calibrated occupational scenarios"
        icon={<Compass className="w-5 h-5" />}
        badge={
          <span className="font-mono font-extrabold text-sm tracking-widest bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded-lg border border-violet-100">
            {code}
          </span>
        }
      />

      {/* Overview explanation */}
      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 mb-6 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">How to interpret this: </span>
          Holland RIASEC measures the occupational environments and activities you naturally enjoy.
          A higher percentage indicates strong cognitive resonance and work satisfaction—it is not an academic grading or IQ test.
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="space-y-4">
        {sortedDims.map((dim) => {
          const isDominant = topLetters.includes(dim);
          const meta = RIASEC_META[dim];
          const val = Math.round(scores[dim] ?? 0);

          return (
            <div
              key={dim}
              className={`p-3.5 rounded-xl border transition-all ${
                isDominant
                  ? 'bg-violet-50/40 border-violet-200/80 shadow-xs'
                  : 'bg-white border-slate-100/90 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                      isDominant
                        ? 'bg-violet-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {dim}
                  </span>
                  <span className={`text-sm font-bold ${isDominant ? 'text-violet-950' : 'text-slate-800'}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">• {meta.tag}</span>
                  {isDominant && (
                    <Badge variant="brand" size="xs" className="hidden sm:inline-flex">
                      Dominant Trait
                    </Badge>
                  )}
                  <HelpTooltip title={meta.label} content={meta.description} />
                </div>
                <span className={`text-sm font-bold font-mono ${isDominant ? 'text-violet-700' : 'text-slate-600'}`}>
                  {val}%
                </span>
              </div>

              {/* Progress track */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isDominant ? 'bg-violet-600' : 'bg-slate-300'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(4, val))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{meta.description}</span>
                <span className="text-slate-400 shrink-0 ml-2 hidden md:inline">e.g. {meta.traits}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Occupational Fields Affinity */}
      {topFields && topFields.length > 0 && (
        <div className="pt-5 mt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Top Occupational Field Affinities
          </h4>
          <div className="flex flex-wrap gap-2">
            {topFields.map((field) => (
              <span
                key={field}
                className="text-xs font-semibold text-violet-800 bg-violet-50/70 px-3 py-1 rounded-lg border border-violet-100 flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-violet-600" />
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm matching source note */}
      <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
        {source === 'ai'
          ? 'Matched deterministically and personalized by the AI Career Intelligence Engine with full holistic profile synthesis.'
          : source === 'hybrid_vector'
          ? 'Ranked via AI Vector Embeddings & Psychological RIASEC alignment across 1,016 official O*NET occupations.'
          : 'Matched via deterministic rule-based profile alignment.'}
      </p>
    </Card>
  );
};

export default InterestIntelligenceCard;
