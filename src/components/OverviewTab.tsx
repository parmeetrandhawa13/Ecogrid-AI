import React, { useState } from 'react';
import { 
  Zap, DollarSign, Leaf, Award, TrendingUp, Sparkles, 
  ArrowRight, ShieldCheck, Sun, Wind, Layers, RefreshCw, Home, TreePine
} from 'lucide-react';
import { FullAnalysisDashboard } from '../types';

interface OverviewTabProps {
  dashboard: FullAnalysisDashboard;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ dashboard, onNavigateTab }) => {
  const [aiMemo, setAiMemo] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>('EcoGrid AI Engine');

  const s = dashboard.suitability as any;
  const solarScore = dashboard.suitability.solarScore ?? s.solar_score ?? s.solar_suitability_score ?? s.solar?.score ?? 0;
  const windScore = dashboard.suitability.windScore ?? s.wind_score ?? s.wind_suitability_score ?? s.wind?.score ?? 0;
  const hybridScore = dashboard.suitability.hybridScore ?? s.hybrid_score ?? s.hybrid?.score ?? 0;

  // Tangible real-world equivalencies (easy to understand)
  const homesPowered = Math.max(1, Math.round((dashboard.economics.annualTotalGenerationMwh * 1000) / 10500));
  const treesPlanted = Math.max(10, Math.round(dashboard.economics.co2ReductionTonsYr * 45));

  const fetchStrategicMemo = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/strategic-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboard })
      });
      const data = await res.json();
      if (data.strategicMemo) {
        setAiMemo(data.strategicMemo);
        setAiProvider(data.provider || 'EcoGrid AI Engine');
      }
    } catch (err) {
      console.error('Failed to fetch AI memo:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Easy-To-Understand Quick Summary Strip */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#072418] via-[#0b2f21] to-[#072016] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              Site Assessment at a Glance
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {dashboard.location.name}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {dashboard.recommendation.recommendedTech === 'Hybrid Solar-Wind' 
              ? 'This site has strong daytime sunlight and steady evening winds, making a combined Solar + Wind installation the most cost-effective and reliable solution.'
              : dashboard.recommendation.recommendedTech === 'Solar PV'
              ? 'This site enjoys high solar irradiance with gentle terrain, ideal for maximum clean solar kilowatt yield.'
              : 'This site benefits from continuous aerodynamic wind corridors, providing high-capacity turbine generation.'}
          </p>
        </div>

        {/* Real World Impact Badges */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#04160e]/80 border border-[#143a28]">
            <Home className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white font-mono">{homesPowered.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400">Homes Powered</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#04160e]/80 border border-[#143a28]">
            <TreePine className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white font-mono">{treesPlanted.toLocaleString()}</span>
              <span className="text-[9px] text-slate-400">Trees Offset</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Engineering KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Annual Generation */}
        <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono uppercase text-[10px]">Annual Generation</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono">
            {dashboard.economics.annualTotalGenerationMwh.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">
            MWh / year yield
          </div>
        </div>

        {/* KPI 2: Levelized Cost of Energy */}
        <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono uppercase text-[10px]">LCOE</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono">
            ${dashboard.economics.lcoePerMwh}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            per MWh generated
          </div>
        </div>

        {/* KPI 3: 25-Year NPV */}
        <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono uppercase text-[10px]">25-Yr Net Present Value</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            +${(dashboard.economics.npv25Yr / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            at {dashboard.economics.assumptions.discountRatePct}% WACC
          </div>
        </div>

        {/* KPI 4: Payback Period */}
        <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono uppercase text-[10px]">Project Payback</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono">
            {dashboard.economics.paybackPeriodYrs}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Years to break even
          </div>
        </div>

        {/* KPI 5: CO2 Offset */}
        <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono uppercase text-[10px]">CO₂ Displaced</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono">
            {dashboard.economics.co2ReductionTonsYr.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">
            Metric Tons / yr avoided
          </div>
        </div>
      </div>

      {/* Main Executive Assessment Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0b291d] via-[#0d3023] to-[#0a2318] border border-emerald-500/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-400/40 text-emerald-300 font-bold">
                RECOMMENDED ARCHITECTURE: {dashboard.recommendation.recommendedTech.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono text-amber-300">
                {dashboard.recommendation.confidencePct}% Decision Confidence
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              Optimal Renewable Deployment for {dashboard.location.name}
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl mt-1.5 leading-relaxed">
              {dashboard.recommendation.executiveRationale}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('recommendations')}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
          >
            <span>Decision Matrix</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Supporting Factors Checklist */}
        <div className="mt-4 pt-4 border-t border-emerald-500/20 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {dashboard.recommendation.supportingFactors.slice(0, 4).map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Renewable Generation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solar Summary */}
        <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Solar PV Subsystem</h4>
                <p className="text-[10px] font-mono text-slate-400">Model: {dashboard.solarPrediction.modelInfo.name}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('solar')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg bg-[#061811] border border-[#103222] text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Predicted Power</div>
              <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                {dashboard.solarPrediction.predictedPowerKw} kW
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Annual Yield</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {dashboard.solarPrediction.annualGenerationMwh} MWh
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Capacity Factor</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {dashboard.solarPrediction.capacityFactorPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Wind Summary */}
        <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Wind className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Wind Turbine Subsystem</h4>
                <p className="text-[10px] font-mono text-slate-400">Model: {dashboard.windPrediction.modelInfo.name}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('wind')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg bg-[#061811] border border-[#103222] text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Predicted Power</div>
              <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
                {dashboard.windPrediction.predictedPowerKw} kW
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Annual Yield</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {dashboard.windPrediction.annualGenerationMwh} MWh
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Capacity Factor</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {dashboard.windPrediction.capacityFactorPct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Strategic Engineering Memo Box */}
      <div className="p-5 rounded-xl bg-[#081e15] border border-[#143d2a] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Strategic Engineering Memo & Interconnection Review
            </h4>
          </div>
          <button
            onClick={fetchStrategicMemo}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0e2c1e] hover:bg-[#153e2b] text-emerald-300 border border-[#1b4832] text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{aiMemo ? 'Regenerate Memo' : 'Generate Strategic Memo'}</span>
          </button>
        </div>

        {aiMemo ? (
          <div className="p-4 rounded-lg bg-[#05140e] border border-[#103020] text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line space-y-2">
            {aiMemo}
            <div className="text-[10px] text-slate-400 pt-2 border-t border-[#103020]">
              Intelligence Source: {aiProvider}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#05140e] border border-dashed border-[#133624] text-center text-xs text-slate-400">
            Click "Generate Strategic Memo" to synthesize utility interconnection analysis, equipment sizing, and merchant bankability insights for {dashboard.location.name}.
          </div>
        )}
      </div>
    </div>
  );
};
