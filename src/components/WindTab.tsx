import React, { useState } from 'react';
import { Wind, Cpu, Sliders, AlertCircle, Compass, Gauge } from 'lucide-react';
import { GisSuitability, WindMlPrediction } from '../types';
import { predictWindPower } from '../services/windMlEngine';

interface WindTabProps {
  suitability: GisSuitability;
  initialPrediction: WindMlPrediction;
  onPredictionChange?: (pred: WindMlPrediction) => void;
}

export const WindTab: React.FC<WindTabProps> = ({
  suitability,
  initialPrediction,
  onPredictionChange
}) => {
  const [ratedKw, setRatedKw] = useState(initialPrediction.ratedCapacityKw);
  const [hubHeightM, setHubHeightM] = useState(initialPrediction.inputFeatures.hubHeightM);
  const [prediction, setPrediction] = useState<WindMlPrediction>(initialPrediction);

  const handleTurbineChange = (newKw: number) => {
    setRatedKw(newKw);
    const updated = predictWindPower(suitability, {
      turbineRatedKw: newKw,
      hubHeightM
    });
    setPrediction(updated);
    if (onPredictionChange) onPredictionChange(updated);
  };

  const handleHeightChange = (newHeight: number) => {
    setHubHeightM(newHeight);
    const updated = predictWindPower(suitability, {
      turbineRatedKw: ratedKw,
      hubHeightM: newHeight
    });
    setPrediction(updated);
    if (onPredictionChange) onPredictionChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Semantic Distinction Warning Banner */}
      <div className="p-3.5 rounded-xl bg-[#092218] border border-[#143a27] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-300">
            <strong className="text-cyan-400">Engineering Distinction:</strong> Wind Suitability Score ({suitability.windScore}/100) reflects regional meteorological suitability. Wind ML Predicted Power ({prediction.predictedPowerKw} kW) represents aeromechanical rotor generation.
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Metric 1: Wind Suitability Score */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">GIS Wind Suitability</div>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">
            {suitability.windScore} <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            100m Velocity: {suitability.rawResourceData.windSpeed100mMs} m/s
          </div>
        </div>

        {/* Metric 2: ML Predicted Power */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-cyan-500/30">
          <div className="text-[10px] font-mono uppercase text-cyan-300 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            ML Predicted Power
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">
            {prediction.predictedPowerKw.toLocaleString()} <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">
            Rated Generator: {prediction.ratedCapacityKw.toLocaleString()} kW
          </div>
        </div>

        {/* Metric 3: Estimated Annual Yield */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Estimated Annual Yield</div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">
            {prediction.annualGenerationMwh.toLocaleString()} <span className="text-xs text-slate-400">MWh</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Weibull k: {prediction.inputFeatures.weibullShapeK} | c: {prediction.inputFeatures.weibullScaleC} m/s
          </div>
        </div>

        {/* Metric 4: Capacity Factor */}
        <div className="p-4 rounded-xl bg-[#0a2318] border border-[#163e2a]">
          <div className="text-[10px] font-mono uppercase text-slate-400">Net Capacity Factor</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            {prediction.capacityFactorPct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standard IEC Class II/III
          </div>
        </div>
      </div>

      {/* Interactive Parameter Tuner */}
      <div className="p-5 rounded-xl bg-[#092218] border border-[#143a27] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Turbine Sizing & Hub Height Simulation
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Random Forest Ensemble recalculation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Turbine Nameplate Capacity (kW)</span>
              <span className="font-mono text-cyan-400 font-bold">{ratedKw.toLocaleString()} kW ({(ratedKw / 1000).toFixed(1)} MW)</span>
            </div>
            <input
              type="range"
              min="1500"
              max="15000"
              step="500"
              value={ratedKw}
              onChange={(e) => handleTurbineChange(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>1.5 MW (Class III)</span>
              <span>5.0 MW (Utility)</span>
              <span>15.0 MW (Offshore)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Tower Hub Height (m)</span>
              <span className="font-mono text-cyan-400 font-bold">{hubHeightM}m Hub</span>
            </div>
            <input
              type="range"
              min="70"
              max="160"
              step="5"
              value={hubHeightM}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>70m</span>
              <span>100m (Standard)</span>
              <span>160m (High Shear)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Power Curve Aerodynamics & IEC Transitions */}
      <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27] space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          IEC 61400-1 Power Curve Specification
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Cut-In Wind Speed</div>
            <div className="text-slate-200 font-semibold">{prediction.powerCurveMetrics.cutInSpeedMs} m/s</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Rated Wind Speed</div>
            <div className="text-emerald-400 font-semibold">{prediction.powerCurveMetrics.ratedSpeedMs} m/s</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Cut-Out Wind Speed</div>
            <div className="text-amber-400 font-semibold">{prediction.powerCurveMetrics.cutOutSpeedMs} m/s</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">Rotor Swept Area</div>
            <div className="text-slate-200 font-semibold">{prediction.powerCurveMetrics.sweptAreaM2.toLocaleString()} m²</div>
          </div>
        </div>
      </div>

      {/* Model Information & Provenance */}
      <div className="p-4 rounded-xl bg-[#092218] border border-[#143a27] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Model Specification & Telemetry Provenance
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
            Random Forest Ensemble
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
            <div className="text-cyan-400 font-semibold">{prediction.modelInfo.r2Score}</div>
          </div>
          <div className="p-2.5 rounded bg-[#061811] border border-[#103020]">
            <div className="text-[10px] text-slate-400">RMSE Error</div>
            <div className="text-slate-200 font-semibold">±{prediction.modelInfo.rmseKw} kW</div>
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
    </div>
  );
};
