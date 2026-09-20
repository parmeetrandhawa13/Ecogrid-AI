import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, 
  ArrowRight, Layers, Sun, Wind, Download, RefreshCw 
} from 'lucide-react';
import { FullAnalysisDashboard } from '../types';
import { exportAnalysisToPdf } from '../utils/pdfGenerator';

interface RecommendationsTabProps {
  dashboard: FullAnalysisDashboard;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ dashboard }) => {
  const { recommendation, suitability, economics, location } = dashboard;
  const [strategicMemo, setStrategicMemo] = useState<string | null>(null);
  const [isLoadingMemo, setIsLoadingMemo] = useState(false);

  const fetchMemo = async () => {
    setIsLoadingMemo(true);
    try {
      const res = await fetch('/api/ai/strategic-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboard })
      });
      const data = await res.json();
      if (data.strategicMemo) {
        setStrategicMemo(data.strategicMemo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMemo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prime Recommendation Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c2e1f] via-[#0e3524] to-[#092218] border border-emerald-500/50 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-mono px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
              Engineering Architecture Verdict
            </span>
            <span className="text-xs font-mono text-amber-300 font-semibold">
              Confidence Index: {recommendation.confidencePct}%
            </span>
          </div>

          <button
            onClick={() => exportAnalysisToPdf(dashboard)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Official Dossier</span>
          </button>
        </div>

        <h2 className="text-2xl font-black text-slate-100 mt-3 tracking-tight font-['Plus_Jakarta_Sans']">
          {recommendation.recommendedTech.toUpperCase()} DEPLOYMENT
        </h2>

        <p className="text-sm text-slate-200 mt-2 leading-relaxed max-w-4xl">
          {recommendation.executiveRationale}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-emerald-500/30">
          <div className="p-2.5 rounded-lg bg-[#071d13]/70 border border-[#144229]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Optimal Sizing Target</span>
            <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
              {recommendation.recommendedTech.includes('Solar') ? `${dashboard.solarPrediction.ratedCapacityKwp.toLocaleString()} kWp PV` : ''}
              {recommendation.recommendedTech.includes('Hybrid') ? ' + ' : ''}
              {recommendation.recommendedTech.includes('Wind') ? `${dashboard.windPrediction.ratedCapacityKw.toLocaleString()} kW Wind` : ''}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#071d13]/70 border border-[#144229]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Project Payback</span>
            <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
              {economics.paybackPeriodYrs} Years (at ${economics.assumptions.electricityTariffPerKwh}/kWh)
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#071d13]/70 border border-[#144229]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Levelized Electricity Cost</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
              ${economics.lcoePerMwh} / MWh
            </span>
          </div>
        </div>
      </div>

      {/* Decision Rationale & Engineering Justifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supporting Factors */}
        <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Supporting Site Factors & Multi-Criteria Strengths
          </h3>
          <div className="space-y-2 text-xs">
            {recommendation.supportingFactors.map((factor, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#061811] border border-[#103222] flex items-start gap-2.5 text-slate-200 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Site Risks & Engineering Mitigations */}
        <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Identified Site Constraints & Recommended Mitigations
          </h3>
          <div className="space-y-2 text-xs">
            {recommendation.riskMitigations.map((risk, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#061811] border border-[#103222] flex items-start gap-2.5 text-slate-300 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispatchability & Diurnal Complementarity Insight */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Grid Dispatchability & Baseload Profile
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {recommendation.dispatchabilityNote}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          {recommendation.seasonalComplementarity}
        </p>
      </div>

      {/* AI Engineering Synthesis Memo */}
      <div className="p-5 rounded-xl bg-[#081e15] border border-[#143d2a] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              AI Strategic Engineering Synthesis Memo
            </h4>
          </div>
          <button
            onClick={fetchMemo}
            disabled={isLoadingMemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0e2c1e] hover:bg-[#153e2b] text-emerald-300 border border-[#1b4832] text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMemo ? 'animate-spin' : ''}`} />
            <span>{strategicMemo ? 'Regenerate Analysis' : 'Synthesize Insights'}</span>
          </button>
        </div>

        {strategicMemo ? (
          <div className="p-4 rounded-lg bg-[#05140e] border border-[#103020] text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line space-y-2">
            {strategicMemo}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#05140e] border border-dashed border-[#133624] text-center text-xs text-slate-400">
            Generate an AI-synthesized engineering memo covering environmental permitting, geotechnical foundation specifications, interconnection queue dynamics, and financial bankability.
          </div>
        )}
      </div>
    </div>
  );
};
