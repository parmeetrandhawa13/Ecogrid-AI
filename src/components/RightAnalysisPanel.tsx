import React from 'react';
import { ShieldCheck, Sun, Wind, Layers, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { GisSuitability, LocationInfo, RecommendationResult } from '../types';

interface RightAnalysisPanelProps {
  location: LocationInfo;
  suitability: GisSuitability;
  recommendation: RecommendationResult;
  onNavigateTab: (tab: string) => void;
  isLoading: boolean;
}

export const RightAnalysisPanel: React.FC<RightAnalysisPanelProps> = ({
  location,
  suitability,
  recommendation,
  onNavigateTab,
  isLoading
}) => {
  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case 'Exceptional':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'High':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Moderate':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  const getTechColor = (tech: string) => {
    if (tech.includes('Hybrid')) return 'from-emerald-500 to-amber-500';
    if (tech.includes('Solar')) return 'from-amber-400 to-amber-600';
    return 'from-cyan-400 to-teal-500';
  };

  const s = suitability as any;
  const solarScore = suitability?.solarScore ?? s?.solar_score ?? s?.solar_suitability_score ?? s?.solar?.score ?? 0;
  const windScore = suitability?.windScore ?? s?.wind_score ?? s?.wind_suitability_score ?? s?.wind?.score ?? 0;
  const hybridScore = suitability?.hybridScore ?? s?.hybrid_score ?? s?.hybrid?.score ?? 0;
  const overallScore = suitability?.overallScore ?? s?.overall_score ?? 0;

  const getScoreDescriptor = (score: number, type: 'solar' | 'wind' | 'hybrid' | 'overall') => {
    if (score >= 80) {
      if (type === 'solar') return 'Prime Solar Zone';
      if (type === 'wind') return 'High Wind Corridor';
      if (type === 'hybrid') return 'Optimal Synergy';
      return 'Exceptional Suitability';
    }
    if (score >= 65) return 'Strong Potential';
    if (score >= 50) return 'Moderate Viability';
    return 'Marginal Resource';
  };

  return (
    <div className="w-full xl:w-96 flex-shrink-0 bg-[#071911] border-l border-[#143826] flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      {/* Site Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            GIS Assessment
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getRatingBadgeClass(suitability.rating)}`}>
            {suitability.rating}
          </span>
        </div>
        <h2 className="text-base font-bold text-slate-100 tracking-tight mt-1 truncate" title={location.name}>
          {location.name}
        </h2>
        <p className="text-xs text-slate-400">
          {location.country} • {location.lat.toFixed(3)}°N, {location.lng.toFixed(3)}°E
        </p>
      </div>

      {/* Overall Score Circular/Gauge Box */}
      <div className="p-4 rounded-xl bg-gradient-to-b from-[#0e2c1e] to-[#0a2016] border border-[#1b4832] shadow-inner relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-300 font-mono">
              Overall Suitability Index
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-slate-100 font-['Plus_Jakarta_Sans']">
                {overallScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                {getScoreDescriptor(overallScore, 'overall')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400">Confidence</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {suitability.confidencePct}%
            </div>
          </div>
        </div>

        {/* Multi-Resource Score Bars */}
        <div className="mt-4 space-y-2.5 pt-3 border-t border-[#173d2b]">
          {/* Solar Score */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Solar Resource
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400/90 font-medium">{getScoreDescriptor(solarScore, 'solar')}</span>
                <span className="font-mono text-amber-300 font-bold">{solarScore}/100</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#071911] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                style={{ width: `${solarScore}%` }}
              />
            </div>
          </div>

          {/* Wind Score */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Wind Resource
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400/90 font-medium">{getScoreDescriptor(windScore, 'wind')}</span>
                <span className="font-mono text-cyan-300 font-bold">{windScore}/100</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#071911] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                style={{ width: `${windScore}%` }}
              />
            </div>
          </div>

          {/* Hybrid Score */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Hybrid Synergy
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400/90 font-medium">{getScoreDescriptor(hybridScore, 'hybrid')}</span>
                <span className="font-mono text-emerald-300 font-bold">{hybridScore}/100</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#071911] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: `${hybridScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Technology Banner */}
      <div className="p-3.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 shadow-md">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Recommended Technology
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {recommendation.confidencePct}% Conf.
          </span>
        </div>
        <div className="text-base font-bold text-slate-100 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${getTechColor(recommendation.recommendedTech)}`} />
          {recommendation.recommendedTech}
        </div>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {suitability.explanation}
        </p>

        <button
          onClick={() => onNavigateTab('recommendations')}
          className="mt-3 w-full py-1.5 px-3 rounded-lg bg-[#0e3020] hover:bg-[#15422d] border border-[#1b4d35] text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1 transition-colors"
        >
          <span>View Full Decision Matrix</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Contributing GIS Factors Breakdown */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Contributing Resource Factors
        </div>
        <div className="space-y-2">
          {suitability.contributingFactors.map((factor, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-[#0a2116] border border-[#143c28] text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{factor.name}</span>
                <span className="font-mono text-emerald-400 font-bold">{factor.measuredValue}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {factor.description}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Weight: {factor.weightPct}%</span>
                <span className={factor.impact === 'Positive' ? 'text-emerald-400' : 'text-slate-400'}>
                  Impact: {factor.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Resource Data Details */}
      <div className="p-3 rounded-lg bg-[#081c13] border border-[#123624] text-[11px] font-mono text-slate-400 space-y-1">
        <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">
          Source Data Fidelity
        </div>
        <div className="flex justify-between">
          <span>Elevation / Air Density:</span>
          <span className="text-slate-200">{location.elevationM}m / {suitability.rawResourceData.airDensityKgM3} kg/m³</span>
        </div>
        <div className="flex justify-between">
          <span>Grid Interconnection:</span>
          <span className="text-slate-200">{suitability.rawResourceData.gridInterconnectionRating}</span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-[#123624]">
          Prov: {suitability.rawResourceData.dataSource}
        </div>
      </div>
    </div>
  );
};
