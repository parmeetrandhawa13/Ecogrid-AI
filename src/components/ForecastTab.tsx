import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Clock, TrendingUp, AlertTriangle, ShieldCheck, Sun, Wind, Layers } from 'lucide-react';
import { ForecastHorizon, ForecastResult, GisSuitability, SolarMlPrediction, WindMlPrediction } from '../types';
import { generateForecast } from '../services/forecastEngine';

interface ForecastTabProps {
  initialForecast: ForecastResult;
  suitability: GisSuitability;
  solarPred: SolarMlPrediction;
  windPred: WindMlPrediction;
}

export const ForecastTab: React.FC<ForecastTabProps> = ({
  initialForecast,
  suitability,
  solarPred,
  windPred
}) => {
  const [horizon, setHorizon] = useState<ForecastHorizon>(initialForecast.horizon);
  const [forecast, setForecast] = useState<ForecastResult>(initialForecast);

  const handleHorizonChange = (newHorizon: ForecastHorizon) => {
    setHorizon(newHorizon);
    const updated = generateForecast(suitability, solarPred, windPred, newHorizon);
    setForecast(updated);
  };

  // Format timestamp for chart X-Axis
  const chartData = forecast.dataPoints.map(pt => {
    const d = new Date(pt.timestamp);
    let label = '';
    if (horizon === '24h') {
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (horizon === '7d' || horizon === '30d') {
      label = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}h`;
    } else {
      label = d.toLocaleString([], { month: 'short' });
    }

    return {
      time: label,
      Solar: pt.solarKw,
      Wind: pt.windKw,
      Combined: pt.combinedKw,
      LowerConfidence: pt.confidenceLowerKw,
      UpperConfidence: pt.confidenceUpperKw,
      ghi: pt.ghi,
      windSpeed: pt.windSpeed
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Horizon Selector */}
      <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Atmospheric Time-Series Generation Forecast
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Physics-informed autoregressive diurnal/seasonal simulation with 95% confidence intervals
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#061811] p-1 rounded-lg border border-[#103020]">
          {(['24h', '7d', '30d', '12m'] as ForecastHorizon[]).map((h) => (
            <button
              key={h}
              onClick={() => handleHorizonChange(h)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                horizon === h
                  ? 'bg-emerald-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e2c1e]'
              }`}
            >
              {h.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Statistics KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Peak Combined Power</div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
            {forecast.summary.peakCombinedKw.toLocaleString()} <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[10px] text-amber-400 font-mono mt-1">
            Max system output
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Mean Generation</div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
            {forecast.summary.meanCombinedKw.toLocaleString()} <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">
            Average baseline delivery
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Firm Baseload Capacity</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {forecast.summary.firmCapacityEstimateKw.toLocaleString()} <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            P90 firm capacity
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Curtailment Risk</div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
            {forecast.summary.curtailmentRiskPct}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Expected thermal congestion
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Forecast Chart */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-amber-400">
              <Sun className="w-3.5 h-3.5" /> Solar PV (kW)
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Wind className="w-3.5 h-3.5" /> Wind Turbine (kW)
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Layers className="w-3.5 h-3.5" /> Combined (kW)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Shaded band = 95% Confidence Interval
          </span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#133624" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                unit=" kW"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#071911', 
                  borderColor: '#1b4330', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  color: '#f8fafc',
                  fontFamily: 'monospace'
                }} 
              />

              {/* Confidence Band */}
              <Area 
                type="monotone" 
                dataKey="UpperConfidence" 
                stroke="transparent" 
                fill="#10b981" 
                fillOpacity={0.1} 
                name="P95 Upper"
              />
              <Area 
                type="monotone" 
                dataKey="LowerConfidence" 
                stroke="transparent" 
                fill="#071911" 
                fillOpacity={0.8} 
                name="P95 Lower"
              />

              {/* Resource Layers */}
              <Area 
                type="monotone" 
                dataKey="Solar" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#solarGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="Wind" 
                stroke="#06b6d4" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#windGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="Combined" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                fill="transparent" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disclaimers & Model Architecture Notes */}
      <div className="p-4 rounded-xl bg-[#081e15] border border-[#143d2a] text-xs text-slate-400 space-y-2 font-mono">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Forecast Methodology & Boundary Disclaimers
        </div>
        <p className="leading-relaxed">
          Forecast outputs reflect autoregressive simulation based on seasonal solar elevation angles (ASHRAE/NREL algorithm) and boundary-layer Weibull wind profiles calibrated to NOAA/ERA5 reanalysis. Unforeseen cloud cover transients, grid curtailment orders, and localized icing events are incorporated via stochastic noise (±{forecast.summary.curtailmentRiskPct}% variance).
        </p>
      </div>
    </div>
  );
};
