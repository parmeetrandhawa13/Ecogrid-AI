import React, { useState } from 'react';
import { Sun, Cpu, ShieldCheck, Thermometer, Sliders, ArrowUpRight, AlertCircle } from 'lucide-react';
import { GisSuitability, SolarMlPrediction } from '../types';
import { predictSolarPower } from '../services/solarMlEngine';

interface SolarTabProps {
  suitability: GisSuitability;
  initialPrediction: SolarMlPrediction;
  onPredictionChange?: (pred: SolarMlPrediction) => void;
}

export const SolarTab: React.FC<SolarTabProps> = ({
  suitability,
  initialPrediction,
  onPredictionChange
}) => {
  const [capacityKwp, setCapacityKwp] = useState(initialPrediction.ratedCapacityKwp);
  const [tiltDeg, setTiltDeg] = useState(initialPrediction.inputFeatures.panelTiltDeg);
  const [prediction, setPrediction] = useState<SolarMlPrediction>(initialPrediction);

  const handleCapacityChange = (newCapacity: number) => {
    setCapacityKwp(newCapacity);
    const updated = predictSolarPower(suitability, {
      systemCapacityKwp: newCapacity,
      panelTiltDeg: tiltDeg
    });
    setPrediction(updated);
    if (onPredictionChange) onPredictionChange(updated);
  };

  const handleTiltChange = (newTilt: number) => {
    setTiltDeg(newTilt);
    const updated = predictSolarPower(suitability, {
      systemCapacityKwp: capacityKwp,
      panelTiltDeg: newTilt
    });
    setPrediction(updated);
    if (onPredictionChange) onPredictionChange(updated);
  };

  const s = suitability as any;
  const solarScore = suitability?.solarScore ?? s?.solar_score ?? s?.solar_suitability_score ?? s?.solar?.score ?? 0;

  return (
    <div className="space-y-6">
      {/* Semantic Distinction Banner */}
      <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-slate-300">
            <strong className="text-amber-400">Engineering Distinction:</strong> Solar Suitability Score ({solarScore}/100) is a geographic multi-criteria site index. Solar ML Predicted Output ({prediction.predictedPowerKw} kW) is an instantaneous physics-calibrated electrical inference.
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Metric 1: Solar Suitability Score */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">GIS Solar Suitability</div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
            {solarScore} <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            GHI: {suitability.rawResourceData.ghiKwhM2Day} kWh/m²/day
          </div>
        </div>

        {/* Metric 2: ML Predicted Power */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-amber-500/30">
          <div className="text-[10px] font-mono uppercase text-amber-300 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-amber-400" />
            ML Predicted Power (AC)
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">
            {prediction.predictedPowerKw.toLocaleString()} <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">
            Rated: {prediction.ratedCapacityKwp.toLocaleString()} kWp DC
          </div>
        </div>

        {/* Metric 3: Annual Energy Yield */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Estimated Annual Yield</div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">
            {prediction.annualGenerationMwh.toLocaleString()} <span className="text-xs text-slate-400">MWh</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Peak Sun Hours: {suitability.rawResourceData.solarPeakSunHours} h/day
          </div>
        </div>

        {/* Metric 4: Capacity Factor */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Net Capacity Factor</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            {prediction.capacityFactorPct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Based on 8,760 hours/yr
          </div>
        </div>
      </div>

      {/* Interactive Parameter Tuner */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Simulate System Sizing & Tracker Tilt
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Real-time GBDT recalculation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Installed DC Capacity (kWp)</span>
              <span className="font-mono text-amber-400 font-bold">{capacityKwp.toLocaleString()} kWp ({(capacityKwp / 1000).toFixed(1)} MW)</span>
            </div>
            <input
              type="range"
              min="200"
              max="20000"
              step="200"
              value={capacityKwp}
              onChange={(e) => handleCapacityChange(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>200 kWp (Commercial)</span>
              <span>5,000 kWp</span>
              <span>20,000 kWp (Utility)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Panel Tilt Angle</span>
              <span className="font-mono text-amber-400 font-bold">{tiltDeg}° Tilt</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={tiltDeg}
              onChange={(e) => handleTiltChange(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>0° (Flat)</span>
              <span>25° (Latitude Optimal)</span>
              <span>50° (Steep)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Information & Provenance */}
      <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            Model Specification & Telemetry Provenance
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
            Validated Surrogate
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Model Name</div>
            <div className="text-slate-200 font-semibold truncate">{prediction.modelInfo.name}</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Algorithm</div>
            <div className="text-slate-200 font-semibold">{prediction.modelInfo.algorithm}</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Accuracy (R² Score)</div>
            <div className="text-emerald-400 font-semibold">{prediction.modelInfo.r2Score}</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Mean Abs Error (MAE)</div>
            <div className="text-slate-200 font-semibold">±{prediction.modelInfo.maeKw} kW</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 leading-tight">
          <strong>Training Dataset:</strong> {prediction.modelInfo.trainingDataset}
        </div>
      </div>

      {/* Feature Contributions & Explainability */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          Feature Attribution & Model Explainability
        </h3>

        <div className="space-y-3">
          {prediction.featureContributions.map((contrib, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-[#061811] border border-[#103222] text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-200">{contrib.feature}</span>
                <span className="font-mono text-slate-300 font-bold">{contrib.value}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {contrib.description}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Attribution Impact:</span>
                <span className={`font-bold ${contrib.contributionPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {contrib.contributionPct >= 0 ? `+${contrib.contributionPct}%` : `${contrib.contributionPct}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Physics Validation Diagnostics */}
      <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27] text-xs">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3">
          Physics Engine Validation Bounds
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-2.5 rounded bg-[#061811] border border-[#103222]">
            <div className="text-[10px] text-slate-400">Theoretical STC Max</div>
            <div className="text-slate-100 font-bold mt-0.5">{prediction.physicsValidation.theoreticalMaxKw} kW</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103222]">
            <div className="text-[10px] text-slate-400">NOCT Thermal Derating</div>
            <div className="text-amber-400 font-bold mt-0.5">-{prediction.physicsValidation.thermalDeratePct}%</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103222]">
            <div className="text-[10px] text-slate-400">Total BOS System Losses</div>
            <div className="text-slate-300 font-bold mt-0.5">-{prediction.physicsValidation.systemLossesPct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
