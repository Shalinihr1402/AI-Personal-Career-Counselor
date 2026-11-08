import React, { useState } from 'react';
import { Compass, Info, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { HelpTooltip } from '../ui/HelpTooltip';
import type { Dim, RiasecScores } from '../../lib/assessment';

const RIASEC_META: Record<
  Dim,
  { label: string; tag: string; description: string; traits: string; angleIndex: number }
> = {
  R: {
    label: 'Realistic',
    tag: 'The Doer',
    description: 'Practical, hands-on problem solving using physical tools, hardware, and structured systems.',
    traits: 'Engineering, robotics, mechanics, agriculture, construction',
    angleIndex: 0,
  },
  I: {
    label: 'Investigative',
    tag: 'The Thinker',
    description: 'Analytical reasoning, scientific inquiry, quantitative research, and deep technical problem solving.',
    traits: 'Data science, medical research, software architecture, astronomy',
    angleIndex: 1,
  },
  A: {
    label: 'Artistic',
    tag: 'The Creator',
    description: 'Creative expression, visual aesthetics, storytelling, and novel design thinking.',
    traits: 'UI/UX design, media production, industrial design, creative direction',
    angleIndex: 2,
  },
  S: {
    label: 'Social',
    tag: 'The Helper',
    description: 'Interpersonal empathy, mentoring, healthcare, teaching, and human collaboration.',
    traits: 'Counseling, clinical medicine, education, community leadership',
    angleIndex: 3,
  },
  E: {
    label: 'Enterprising',
    tag: 'The Leader',
    description: 'Persuasion, initiative, strategic decision-making, and entrepreneurial leadership.',
    traits: 'Product management, venture creation, corporate strategy, marketing',
    angleIndex: 4,
  },
  C: {
    label: 'Conventional',
    tag: 'The Organizer',
    description: 'Structured methodologies, meticulous accuracy, regulatory systems, and data integrity.',
    traits: 'Chartered accountancy, statutory compliance, quality assurance, logistics',
    angleIndex: 5,
  },
};

const DIM_ORDER: Dim[] = ['R', 'I', 'A', 'S', 'E', 'C'];

// Holland RIASEC Hexagon Geometry
const CX = 190;
const CY = 160;
const MAX_RADIUS = 95;
const RINGS = [0.25, 0.5, 0.75, 1.0];

function getVertexCoords(angleIndex: number, radiusRatio: number, r = MAX_RADIUS, cx = CX, cy = CY) {
  // 60-degree increments starting from top (-90 degrees)
  const angle = -Math.PI / 2 + (angleIndex * Math.PI) / 3;
  return {
    x: cx + r * radiusRatio * Math.cos(angle),
    y: cy + r * radiusRatio * Math.sin(angle),
    angle,
  };
}

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
  const [hoveredDim, setHoveredDim] = useState<Dim | null>(null);
  const topLetters = code ? code.split('') : [];

  // Sort dimensions descending by student score
  const sortedDims = [...DIM_ORDER].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));

  // Determine dynamic scaling factor for the polygon
  // Scores might be raw percentages (e.g. 19%, 12%) or full 0-100 scales
  const rawValues = DIM_ORDER.map((d) => scores[d] ?? 0);
  const maxRaw = Math.max(...rawValues, 10);
  const scaleMax = maxRaw <= 35 ? Math.max(25, maxRaw * 1.25) : 100;

  // Build the user polygon points
  const polygonPoints = DIM_ORDER.map((dim, i) => {
    const raw = scores[dim] ?? 0;
    const ratio = Math.max(0.12, Math.min(1.0, raw / scaleMax));
    const { x, y } = getVertexCoords(i, ratio);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Get primary archetype label
  const primaryTrait = topLetters[0] ? RIASEC_META[topLetters[0] as Dim]?.label : '';
  const secondaryTrait = topLetters[1] ? RIASEC_META[topLetters[1] as Dim]?.label : '';
  const tertiaryTrait = topLetters[2] ? RIASEC_META[topLetters[2] as Dim]?.label : '';

  return (
    <Card padding="md" className="border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_20px_rgba(0,0,0,0.02)]">
      <CardHeader
        eyebrow="Psychological Career Profiling"
        title="Interest Intelligence (Holland RIASEC)"
        subtitle="Aggregated deterministically across calibrated occupational scenarios"
        icon={<Compass className="w-5 h-5 text-violet-700" />}
        badge={
          <div className="flex items-center gap-1 bg-violet-50 text-violet-700 px-3 py-1 rounded-xl border border-violet-200/70">
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mr-1">Code</span>
            <span className="font-mono font-extrabold text-sm tracking-widest text-violet-900">
              {code}
            </span>
          </div>
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

      {/* Main Two-Column Analytics Layout: Radar Chart on Left, Dimension Breakdown on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
        {/* Left Column: Holland Hexagon Spider/Radar Chart */}
        <div className="xl:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-slate-50/50 via-white to-violet-50/20 border border-slate-200/60 shadow-xs">
          <div className="w-full flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Vocational Hexagon
            </span>
            <span className="text-[10px] font-medium text-slate-400">Holland RIASEC Model</span>
          </div>

          <div className="relative w-full max-w-[340px] aspect-[380/340] select-none">
            <svg
              viewBox="0 0 380 340"
              className="w-full h-full overflow-visible"
              aria-label="Holland RIASEC Radar Chart"
            >
              <defs>
                {/* Gradient for polygon fill */}
                <linearGradient id="riasecPolygonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.25" />
                </linearGradient>
                <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Concentric Hexagonal Grid Rings */}
              {RINGS.map((ratio, rIdx) => {
                const ringPoints = DIM_ORDER.map((_, i) => {
                  const { x, y } = getVertexCoords(i, ratio);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');

                return (
                  <polygon
                    key={rIdx}
                    points={ringPoints}
                    fill="none"
                    stroke={rIdx === RINGS.length - 1 ? '#cbd5e1' : '#e2e8f0'}
                    strokeWidth={rIdx === RINGS.length - 1 ? '1.5' : '1'}
                    strokeDasharray={rIdx < RINGS.length - 1 ? '3 3' : undefined}
                    className="transition-all"
                  />
                );
              })}

              {/* Radial Axis Lines from Center to Outer Vertices */}
              {DIM_ORDER.map((dim, i) => {
                const outer = getVertexCoords(i, 1.0);
                const isHovered = hoveredDim === dim;
                const isDominant = topLetters.includes(dim);

                return (
                  <line
                    key={dim}
                    x1={CX}
                    y1={CY}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={isHovered ? '#7c3aed' : isDominant ? '#c4b5fd' : '#e2e8f0'}
                    strokeWidth={isHovered ? '2' : '1'}
                    strokeDasharray="2 2"
                    className="transition-colors duration-200"
                  />
                );
              })}

              {/* User Score Data Polygon */}
              <polygon
                points={polygonPoints}
                fill="url(#riasecPolygonGrad)"
                stroke="#7c3aed"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-700 ease-out"
                filter="url(#radarGlow)"
              />

              {/* Vertex Points & Interactivity */}
              {DIM_ORDER.map((dim, i) => {
                const raw = scores[dim] ?? 0;
                const ratio = Math.max(0.12, Math.min(1.0, raw / scaleMax));
                const { x, y } = getVertexCoords(i, ratio);
                const isHovered = hoveredDim === dim;
                const isDominant = topLetters.includes(dim);

                return (
                  <g
                    key={dim}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDim(dim)}
                    onMouseLeave={() => setHoveredDim(null)}
                  >
                    {/* Pulsing ring on dominant or hovered */}
                    {(isDominant || isHovered) && (
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 9 : 7}
                        fill="#7c3aed"
                        fillOpacity={isHovered ? 0.35 : 0.2}
                        className="transition-all duration-200"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5.5 : isDominant ? 4.5 : 3.5}
                      fill={isDominant ? '#6d28d9' : '#ffffff'}
                      stroke={isDominant ? '#ffffff' : '#64748b'}
                      strokeWidth={isDominant ? '2' : '1.5'}
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Perimeter Labels around the Hexagon */}
              {DIM_ORDER.map((dim, i) => {
                const meta = RIASEC_META[dim];
                const raw = Math.round(scores[dim] ?? 0);
                const isDominant = topLetters.includes(dim);
                const isHovered = hoveredDim === dim;

                // Position labels comfortably outside outer ring
                const labelPos = getVertexCoords(i, 1.28);
                const isTop = i === 0;
                const isBottom = i === 3;
                const isRight = i === 1 || i === 2;

                const textAnchor = isTop || isBottom ? 'middle' : isRight ? 'start' : 'end';

                return (
                  <g
                    key={dim}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredDim(dim)}
                    onMouseLeave={() => setHoveredDim(null)}
                  >
                    {/* Label background badge */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y - 4}
                      textAnchor={textAnchor}
                      className={`text-[12px] font-bold transition-colors ${
                        isHovered
                          ? 'fill-violet-700'
                          : isDominant
                          ? 'fill-violet-950 font-extrabold'
                          : 'fill-slate-700'
                      }`}
                    >
                      {dim} • {meta.label}
                    </text>
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 11}
                      textAnchor={textAnchor}
                      className={`text-[11px] font-mono font-bold ${
                        isDominant ? 'fill-violet-700' : 'fill-slate-500'
                      }`}
                    >
                      {raw}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Dynamic Archetype Headline Pill */}
          <div className="mt-2 w-full p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 block">
              Primary Occupational Pattern
            </span>
            <p className="text-xs font-bold text-violet-950 mt-0.5">
              {[primaryTrait, secondaryTrait, tertiaryTrait].filter(Boolean).join(' • ')}
            </p>
          </div>
        </div>

        {/* Right Column: 6 Calibrated Dimension Cards */}
        <div className="xl:col-span-7 space-y-2.5">
          {sortedDims.map((dim) => {
            const isDominant = topLetters.includes(dim);
            const isHovered = hoveredDim === dim;
            const meta = RIASEC_META[dim];
            const val = Math.round(scores[dim] ?? 0);

            return (
              <div
                key={dim}
                onMouseEnter={() => setHoveredDim(dim)}
                onMouseLeave={() => setHoveredDim(null)}
                className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isHovered
                    ? 'border-violet-400 bg-violet-50/60 shadow-xs'
                    : isDominant
                    ? 'bg-violet-50/30 border-violet-200/80'
                    : 'bg-white border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                        isDominant
                          ? 'bg-violet-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {dim}
                    </span>
                    <span className={`text-sm font-bold truncate ${isDominant ? 'text-violet-950' : 'text-slate-800'}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">• {meta.tag}</span>
                    {isDominant && (
                      <Badge variant="brand" size="xs" className="shrink-0 hidden sm:inline-flex">
                        Dominant
                      </Badge>
                    )}
                    <HelpTooltip title={meta.label} content={meta.description} />
                  </div>
                  <span className={`text-sm font-bold font-mono shrink-0 ${isDominant ? 'text-violet-700' : 'text-slate-600'}`}>
                    {val}%
                  </span>
                </div>

                {/* Progress track */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isDominant ? 'bg-violet-600' : 'bg-slate-300'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(6, val))}%` }}
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
      </div>

      {/* Top Occupational Fields Affinity */}
      {topFields && topFields.length > 0 && (
        <div className="pt-4 mt-6 border-t border-slate-100">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Top Occupational Field Affinities
          </h4>
          <div className="flex flex-wrap gap-2">
            {topFields.map((field) => (
              <span
                key={field}
                className="text-xs font-semibold text-violet-800 bg-violet-50/80 px-3 py-1 rounded-lg border border-violet-150 flex items-center gap-1.5 hover:bg-violet-100/70 transition-colors"
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
