import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ChevronDown,
  ChevronUp,
  Scale,
  Building2,
  Info,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { AdaptiveScoreResult } from '../../lib/assessment';

interface StatutoryPathwaysCardProps {
  statutoryEligibility: NonNullable<AdaptiveScoreResult['statutory_eligibility']>;
  practicalDisclaimer?: string;
}

export const StatutoryPathwaysCard: React.FC<StatutoryPathwaysCardProps> = ({
  statutoryEligibility,
  practicalDisclaimer,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'alternative' | 'restrictions'>('direct');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const eligible = statutoryEligibility.eligible_pathways || [];
  const alternative = statutoryEligibility.alternative_pathways || [];
  const restrictions = statutoryEligibility.statutory_restrictions || [];

  const toggleExpand = (slug: string) => {
    setExpandedItems((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <Card padding="md">
      <CardHeader
        eyebrow="Indian Regulatory Compliance"
        title="Statutory Career Eligibility & Pathways"
        subtitle="Audited against official Indian statutory frameworks (NMC, BCI, ICAI, AICTE, NCVT)"
        icon={<GraduationCap className="w-5 h-5 text-emerald-700" />}
        badge={
          <Badge variant="success" size="xs">
            Regulatory Verification
          </Badge>
        }
      />

      {/* Philosophy banner */}
      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 mb-6 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
        <Scale className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Statutory Notice: </span>
          Certain professional professions in India (e.g. Medicine, Law, Chartered Accountancy) require statutory licensing and mandatory degree streams. We ensure you are informed of exact entrance criteria and bridge pathways.
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="flex bg-slate-100/90 p-1 rounded-xl mb-5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'direct'
              ? 'bg-white text-emerald-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Direct Pathways ({eligible.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alternative')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'alternative'
              ? 'bg-white text-indigo-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Alternative & Bridge ({alternative.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('restrictions')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'restrictions'
              ? 'bg-white text-amber-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Statutory Rules ({restrictions.length})</span>
        </button>
      </div>

      {/* Tab 1: Direct Pathways */}
      {activeTab === 'direct' && (
        <div className="space-y-3">
          {eligible.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {eligible.map((p) => (
                <div
                  key={p.slug}
                  className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-emerald-950">{p.title}</h4>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                      Direct Eligible
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
              No direct statutory benchmarks activated for current profile filters.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Alternative & Bridge Pathways */}
      {activeTab === 'alternative' && (
        <div className="space-y-3">
          {alternative.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alternative.map((p) => (
                <div
                  key={p.slug}
                  className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold text-indigo-950">{p.title}</h4>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-md shrink-0">
                      Bridge Pathway
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
              No bridge pathways required for this profile.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Statutory Restrictions & Licensing */}
      {activeTab === 'restrictions' && (
        <div className="space-y-3">
          {restrictions.length > 0 ? (
            restrictions.map((p) => {
              const isExpanded = Boolean(expandedItems[p.slug]);
              return (
                <div
                  key={p.slug}
                  className="border border-amber-200/70 bg-amber-50/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <h4 className="text-sm font-bold text-amber-950">{p.title}</h4>
                    </div>
                    {p.regulatory_body && (
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 self-start sm:self-auto">
                        <Building2 className="w-3 h-3 text-amber-700" />
                        {p.regulatory_body}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mb-3">{p.reason}</p>

                  {/* Expandable Prerequisites & Bridge steps */}
                  {(p.missing_prerequisites?.length || p.recommended_bridge_steps?.length) ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(p.slug)}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide regulatory requirements' : 'Inspect requirements & bridge steps'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2.5 pt-3 border-t border-amber-200/50 text-xs animate-in fade-in duration-150">
                          {p.missing_prerequisites && p.missing_prerequisites.length > 0 && (
                            <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200/60 text-amber-950">
                              <span className="font-bold text-amber-900 block mb-0.5">Missing Prerequisites:</span>
                              <p className="text-slate-600">{p.missing_prerequisites.join(', ')}</p>
                            </div>
                          )}
                          {p.recommended_bridge_steps && p.recommended_bridge_steps.length > 0 && (
                            <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-200/60 text-indigo-950">
                              <span className="font-bold text-indigo-900 block mb-0.5">Recommended Bridge Pathway:</span>
                              <p className="text-slate-600">{p.recommended_bridge_steps.join(' • ')}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
              No statutory restrictions identified for your background.
            </div>
          )}
        </div>
      )}

      {/* Practical Evidence Notice Banner */}
      {practicalDisclaimer && (
        <div className="mt-5 p-3.5 bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700">Official Disclaimer: </span>
            {practicalDisclaimer}
          </div>
        </div>
      )}
    </Card>
  );
};

export default StatutoryPathwaysCard;
