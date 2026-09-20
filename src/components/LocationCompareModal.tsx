import React, { useState } from 'react';
import { X, Compass, Check, ArrowRight, Sun, Wind, Layers } from 'lucide-react';
import { BENCHMARK_SITES } from '../services/gisEngine';
import { runFullAnalysis } from '../services/analysisPipeline';
import { FullAnalysisDashboard } from '../types';

interface LocationCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDashboard: FullAnalysisDashboard | null;
  onSelectSite: (lat: number, lng: number, override?: any) => void;
}

export const LocationCompareModal: React.FC<LocationCompareModalProps> = ({
  isOpen,
  onClose,
  currentDashboard,
  onSelectSite
}) => {
  if (!isOpen) return null;

  // Compute dashboards for benchmark sites to compare
  const benchmarkDashboards = React.useMemo(() => {
    return BENCHMARK_SITES.slice(0, 3).map(site => runFullAnalysis(
      { lat: site.lat, lng: site.lng },
      { locationOverride: { name: site.name, country: site.country } }
    ));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#071911] border border-[#1b4832] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#143826] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['Plus_Jakarta_Sans']">
              Multi-Site Renewable Benchmark Comparison
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Comparison Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-xs text-slate-300">
            Compare resource suitability indices, machine-learning power predictions, and 25-year financial metrics across key regional benchmark locations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benchmarkDashboards.map((dash) => {
              const isCurrent = currentDashboard && (
                Math.abs(currentDashboard.location.lat - dash.location.lat) < 0.01 &&
                Math.abs(currentDashboard.location.lng - dash.location.lng) < 0.01
              );

              return (
                <div
                  key={dash.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'bg-[#0a271c] border-emerald-500 shadow-md'
                      : 'bg-[#092016] border-[#163a28]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-semibold">
                        {dash.location.country}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active Site
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-100">{dash.location.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {dash.location.lat.toFixed(2)}°, {dash.location.lng.toFixed(2)}°
                    </p>

                    {/* Scores Snapshot */}
                    <div className="my-4 p-3 rounded-lg bg-[#061811] border border-[#103222] space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Overall Score:</span>
                        <span className="font-bold text-slate-100">{dash.suitability.overallScore ?? (dash.suitability as any).overall_score}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-400">Solar Score:</span>
                        <span className="font-bold text-amber-400">{dash.suitability.solarScore ?? (dash.suitability as any).solar_score ?? (dash.suitability as any).solar?.score ?? 0}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Wind Score:</span>
                        <span className="font-bold text-cyan-400">{dash.suitability.windScore ?? (dash.suitability as any).wind_score ?? (dash.suitability as any).wind?.score ?? 0}/100</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#103222]">
                        <span className="text-emerald-400 font-bold">Optimal Tech:</span>
                        <span className="font-bold text-slate-100">{dash.recommendation.recommendedTech}</span>
                      </div>
                    </div>

                    {/* Financial Snapshot */}
                    <div className="space-y-1 text-xs font-mono text-slate-300 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Annual Yield:</span>
                        <span>{dash.economics.annualTotalGenerationMwh.toLocaleString()} MWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">LCOE:</span>
                        <span>${dash.economics.lcoePerMwh}/MWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payback:</span>
                        <span className="text-amber-400">{dash.economics.paybackPeriodYrs} Yrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">25-Yr NPV:</span>
                        <span className="text-emerald-400 font-bold">+${(dash.economics.npv25Yr / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectSite(dash.location.lat, dash.location.lng, dash.location);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#0e2c1e] hover:bg-[#153e2b] text-emerald-300 border border-[#1b4832] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Load & Analyze This Site</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#143826] bg-[#05140e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-200 text-xs font-medium border border-[#1b4832]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
