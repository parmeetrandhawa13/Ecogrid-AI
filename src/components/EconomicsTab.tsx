import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { DollarSign, TrendingUp, Award, Leaf, Sliders, AlertCircle, ShieldCheck } from 'lucide-react';
import { EconomicAssumptions, EconomicsResult, SolarMlPrediction, WindMlPrediction } from '../types';
import { calculateEconomics } from '../services/economicsEngine';

interface EconomicsTabProps {
  initialEconomics: EconomicsResult;
  solarPred: SolarMlPrediction;
  windPred: WindMlPrediction;
  onEconomicsChange?: (result: EconomicsResult) => void;
}

export const EconomicsTab: React.FC<EconomicsTabProps> = ({
  initialEconomics,
  solarPred,
  windPred,
  onEconomicsChange
}) => {
  const [assumptions, setAssumptions] = useState<EconomicAssumptions>(initialEconomics.assumptions);
  const [economics, setEconomics] = useState<EconomicsResult>(initialEconomics);

  const handleAssumptionChange = (key: keyof EconomicAssumptions, value: number) => {
    const updatedAssumptions = { ...assumptions, [key]: value };
    setAssumptions(updatedAssumptions);
    const updatedResult = calculateEconomics(solarPred, windPred, updatedAssumptions);
    setEconomics(updatedResult);
    if (onEconomicsChange) onEconomicsChange(updatedResult);
  };

  return (
    <div className="space-y-6">
      {/* Top Warning / Disclaimer */}
      <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] flex items-center gap-2.5 text-xs">
        <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="text-slate-300">
          <strong className="text-emerald-400">Financial Modeling Notice:</strong> Projections utilize discounted cash flow (DCF) accounting over a 25-year operational lifecycle, factoring in panel degradation (0.5%/yr) and turbine maintenance escalation.
        </span>
      </div>

      {/* Main Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI: Total CAPEX */}
        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Project CAPEX</div>
          <div className="text-xl font-bold text-slate-100 font-mono mt-1">
            ${(economics.totalCapex / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            ${economics.totalCapex.toLocaleString()}
          </div>
        </div>

        {/* KPI: Annual Revenue */}
        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Annual Revenue</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            ${(economics.annualRevenue / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            ${assumptions.electricityTariffPerKwh}/kWh PPA
          </div>
        </div>

        {/* KPI: Annual OPEX */}
        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Annual OPEX</div>
          <div className="text-xl font-bold text-slate-200 font-mono mt-1">
            ${(economics.annualOpex / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            O&M + insurance
          </div>
        </div>

        {/* KPI: LCOE */}
        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-emerald-500/30">
          <div className="text-[10px] font-mono uppercase text-emerald-300">Levelized Cost (LCOE)</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            ${economics.lcoePerMwh}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            per MWh produced
          </div>
        </div>

        {/* KPI: Payback Period */}
        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Payback Period</div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {economics.paybackPeriodYrs} <span className="text-xs text-slate-400">Yrs</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Simple undiscounted
          </div>
        </div>

        {/* KPI: 25-Yr Net Present Value */}
        <div className="p-3.5 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">25-Yr Net Present Value</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            +${(economics.npv25Yr / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            ROI: {economics.roiPct}%
          </div>
        </div>
      </div>

      {/* Interactive Assumptions Modeler */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Financial & Grid Assumptions Modeler
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Live DCF & Payback Sensitivity</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Solar Capex */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Solar CAPEX ($/kWp)</span>
              <span className="font-mono text-amber-400 font-bold">${assumptions.solarCapexPerKw}/kW</span>
            </div>
            <input
              type="range"
              min="600"
              max="1600"
              step="50"
              value={assumptions.solarCapexPerKw}
              onChange={(e) => handleAssumptionChange('solarCapexPerKw', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Wind Capex */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Wind CAPEX ($/kW)</span>
              <span className="font-mono text-cyan-400 font-bold">${assumptions.windCapexPerKw}/kW</span>
            </div>
            <input
              type="range"
              min="900"
              max="2200"
              step="50"
              value={assumptions.windCapexPerKw}
              onChange={(e) => handleAssumptionChange('windCapexPerKw', Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Tariff */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Electricity PPA Tariff ($/kWh)</span>
              <span className="font-mono text-emerald-400 font-bold">${assumptions.electricityTariffPerKwh}/kWh</span>
            </div>
            <input
              type="range"
              min="0.04"
              max="0.25"
              step="0.01"
              value={assumptions.electricityTariffPerKwh}
              onChange={(e) => handleAssumptionChange('electricityTariffPerKwh', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Discount Rate */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">WACC Discount Rate (%)</span>
              <span className="font-mono text-slate-200 font-bold">{assumptions.discountRatePct}%</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={assumptions.discountRatePct}
              onChange={(e) => handleAssumptionChange('discountRatePct', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Grid Carbon Intensity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Grid Carbon Intensity (kg CO₂/MWh)</span>
              <span className="font-mono text-slate-200 font-bold">{assumptions.gridCarbonIntensityKgPerMwh} kg</span>
            </div>
            <input
              type="range"
              min="200"
              max="800"
              step="25"
              value={assumptions.gridCarbonIntensityKgPerMwh}
              onChange={(e) => handleAssumptionChange('gridCarbonIntensityKgPerMwh', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Project Lifetime */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Asset Operating Lifetime</span>
              <span className="font-mono text-slate-200 font-bold">{assumptions.projectLifeYears} Years</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pt-1">
              Standard utility asset depreciation cycle
            </div>
          </div>
        </div>
      </div>

      {/* 25-Year Cumulative Cash Flow Chart */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            25-Year Cumulative Cash Flow & Payback Trajectory ($M)
          </h4>
          <span className="text-[11px] font-mono text-emerald-400">
            Breakeven in Year {economics.paybackPeriodYrs}
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={economics.cumulativeCashFlows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#133624" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Project Year', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} 
              />
              <Tooltip 
                formatter={(value: any) => [`$${(Number(value) / 1000000).toFixed(2)}M`, 'Cumulative Net Flow']}
                labelFormatter={(label) => `Year ${label}`}
                contentStyle={{ 
                  backgroundColor: '#071911', 
                  borderColor: '#1b4330', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  color: '#f8fafc',
                  fontFamily: 'monospace'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="netCumulativeFlow" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 2, fill: '#10b981' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Carbon Impact Offsets */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-4">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-400" />
          Quantified Environmental Abatement (GHG Protocol Scope 2)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#061811] border border-[#103222] text-center">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {economics.co2ReductionTonsYr.toLocaleString()}
            </div>
            <div className="text-xs text-slate-200 font-semibold mt-1">Metric Tons CO₂ / Year</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Displaced from baseline electric grid</div>
          </div>

          <div className="p-4 rounded-xl bg-[#061811] border border-[#103222] text-center">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              ~{economics.equivalentCarsRemoved.toLocaleString()}
            </div>
            <div className="text-xs text-slate-200 font-semibold mt-1">Passenger Vehicles Removed</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Annual emissions equivalent</div>
          </div>

          <div className="p-4 rounded-xl bg-[#061811] border border-[#103222] text-center">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              ~{economics.equivalentTreesPlanted.toLocaleString()}
            </div>
            <div className="text-xs text-slate-200 font-semibold mt-1">Tree Seedlings Sequestering</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Over a 10-year growth duration</div>
          </div>
        </div>
      </div>
    </div>
  );
};
