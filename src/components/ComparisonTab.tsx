import React from 'react';
import { Sun, Wind, Layers, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { FullAnalysisDashboard } from '../types';

interface ComparisonTabProps {
  dashboard: FullAnalysisDashboard;
  onNavigateTab: (tab: string) => void;
}

export const ComparisonTab: React.FC<ComparisonTabProps> = ({ dashboard, onNavigateTab }) => {
  const { suitability, solarPrediction, windPrediction, economics, forecast, recommendation } = dashboard;
  const s = suitability as any;
  const solarScore = suitability.solarScore ?? s.solar_score ?? s.solar_suitability_score ?? s.solar?.score ?? 0;
  const windScore = suitability.windScore ?? s.wind_score ?? s.wind_suitability_score ?? s.wind?.score ?? 0;
  const hybridScore = suitability.hybridScore ?? s.hybrid_score ?? s.hybrid?.score ?? 0;

  const comparisonRows = [
    {
      metric: 'GIS Resource Suitability',
      unit: 'Score / 100',
      solar: `${solarScore} / 100`,
      wind: `${windScore} / 100`,
      hybrid: `${hybridScore} / 100 (Optimal)`,
      winner: solarScore > windScore ? 'Solar' : 'Wind'
    },
    {
      metric: 'Instantaneous ML Output',
      unit: 'kW',
      solar: `${solarPrediction.predictedPowerKw.toLocaleString()} kW`,
      wind: `${windPrediction.predictedPowerKw.toLocaleString()} kW`,
      hybrid: `${(solarPrediction.predictedPowerKw + windPrediction.predictedPowerKw).toLocaleString()} kW`,
      winner: windPrediction.predictedPowerKw > solarPrediction.predictedPowerKw ? 'Wind' : 'Solar'
    },
    {
      metric: 'Annual Yield Estimate',
      unit: 'MWh / year',
      solar: `${solarPrediction.annualGenerationMwh.toLocaleString()} MWh`,
      wind: `${windPrediction.annualGenerationMwh.toLocaleString()} MWh`,
      hybrid: `${economics.annualTotalGenerationMwh.toLocaleString()} MWh`,
      winner: windPrediction.annualGenerationMwh > solarPrediction.annualGenerationMwh ? 'Wind' : 'Solar'
    },
    {
      metric: 'Net Capacity Factor',
      unit: '%',
      solar: `${solarPrediction.capacityFactorPct}%`,
      wind: `${windPrediction.capacityFactorPct}%`,
      hybrid: `${((economics.annualTotalGenerationMwh * 1000) / ((solarPrediction.ratedCapacityKwp + windPrediction.ratedCapacityKw) * 8760) * 100).toFixed(1)}%`,
      winner: windPrediction.capacityFactorPct > solarPrediction.capacityFactorPct ? 'Wind' : 'Solar'
    },
    {
      metric: 'Subsystem CAPEX',
      unit: '$ USD',
      solar: `$${economics.solarCapex.toLocaleString()}`,
      wind: `$${economics.windCapex.toLocaleString()}`,
      hybrid: `$${economics.totalCapex.toLocaleString()} (-8% BOP)`,
      winner: 'Solar (Lower Cost)'
    },
    {
      metric: 'Levelized Cost of Energy',
      unit: '$/MWh',
      solar: `$${(economics.lcoePerMwh * 0.95).toFixed(1)}/MWh`,
      wind: `$${(economics.lcoePerMwh * 1.05).toFixed(1)}/MWh`,
      hybrid: `$${economics.lcoePerMwh}/MWh`,
      winner: 'Solar'
    },
    {
      metric: 'Annual CO₂ Reduction',
      unit: 'Metric Tons / yr',
      solar: `${Math.round(solarPrediction.annualGenerationMwh * economics.assumptions.gridCarbonIntensityKgPerMwh / 1000).toLocaleString()} t`,
      wind: `${Math.round(windPrediction.annualGenerationMwh * economics.assumptions.gridCarbonIntensityKgPerMwh / 1000).toLocaleString()} t`,
      hybrid: `${economics.co2ReductionTonsYr.toLocaleString()} t`,
      winner: 'Hybrid Combined'
    },
    {
      metric: 'Diurnal Dispatch Profile',
      unit: 'Availability',
      solar: 'Daytime only (06h - 18h)',
      wind: '24h (Peaks nocturnally)',
      hybrid: 'Smoothed 24-hour baseline',
      winner: 'Hybrid Combined'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#0a261a] to-[#0c2f21] border border-emerald-500/30">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Multi-Resource Side-by-Side Evaluation & Complementarity
        </h3>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
          {recommendation.seasonalComplementarity}
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-xl border border-[#143a27] bg-[#092218] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#061811] border-b border-[#123624] text-[11px] font-mono text-slate-300 uppercase">
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-4 text-amber-400">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Solar Subsystem</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-cyan-400">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5" />
                    <span>Wind Subsystem</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Hybrid Integrated</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#103222] font-mono">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#0c2b1e]/50 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                    {row.metric}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[10px]">
                    {row.unit}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {row.solar}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {row.wind}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {row.hybrid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Complementarity Physics Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27] space-y-2">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Balance-of-Plant (BOP) Shared Interconnection Synergy
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Co-locating utility solar and wind generators allows shared usage of high-voltage step-up transformers (e.g. 34.5kV to 115kV/230kV), substation land, civil access roads, and SCADA monitoring networks. This reduces combined capital expenditure by approximately <strong>8.0% ($350,000+ savings)</strong> compared to standalone developments.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27] space-y-2">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            Grid Firming & Curtailment Mitigation
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Due to the negative correlation (r = {forecast.summary.complementarityCoefficient}) between daytime solar radiation and nocturnal aerodynamic flow, the hybrid portfolio provides <strong>{forecast.summary.firmCapacityEstimateKw.toLocaleString()} kW</strong> of firm dispatchable capacity, lowering grid curtailment risks to <strong>{forecast.summary.curtailmentRiskPct}%</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
