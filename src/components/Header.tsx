import React from 'react';
import { Download, Compass, Bookmark, ShieldCheck, User, Database } from 'lucide-react';
import { AuthUser, FullAnalysisDashboard } from '../types';
import { exportAnalysisToPdf } from '../utils/pdfGenerator';
import { EcoGridLogo } from './EcoGridLogo';

interface HeaderProps {
  currentDashboard: FullAnalysisDashboard | null;
  currentUser: AuthUser | null;
  onOpenCompare: () => void;
  onOpenBookmarks: () => void;
  onOpenAuth: () => void;
  onOpenMethodology?: () => void;
  onSaveCurrent: () => void;
  isSaved: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDashboard,
  currentUser,
  onOpenCompare,
  onOpenBookmarks,
  onOpenAuth,
  onOpenMethodology,
  onSaveCurrent,
  isSaved,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="h-16 border-b border-[#143826] bg-[#071911]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand Identity with bespoke EcoGrid AI Logo */}
      <EcoGridLogo size="md" />

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System telemetry indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0b2419] border border-[#1b4330] text-xs font-mono text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-300">GIS & ML Inference Active</span>
        </div>

        {/* Methodology & Provenance Button */}
        {onOpenMethodology && (
          <button
            onClick={onOpenMethodology}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-200 border border-[#1b4832] transition-colors"
            title="Scientific methodology, datasets, and ML architectures"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Methodology</span>
          </button>
        )}

        {/* Compare Locations Action */}
        <button
          onClick={onOpenCompare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-200 border border-[#1b4832] transition-colors"
          title="Compare multiple benchmark renewable sites"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Compare Sites</span>
        </button>

        {/* Save/Bookmark Project */}
        {currentDashboard && (
          <button
            onClick={onSaveCurrent}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSaved
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-200 border-[#1b4832]'
            }`}
            title="Save this analysis to your workspace portfolio"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{isSaved ? 'Saved' : 'Save Project'}</span>
          </button>
        )}

        {/* Export PDF Report */}
        {currentDashboard && (
          <button
            onClick={() => exportAnalysisToPdf(currentDashboard)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 shadow-md shadow-emerald-950/50 transition-all active:scale-95"
            title="Export complete technical engineering PDF report"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export PDF</span>
          </button>
        )}

        {/* User Profile / Auth button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-200 border border-[#1b4832] transition-colors"
          title={currentUser ? `${currentUser.name} (${currentUser.role})` : 'Sign in to EcoGrid'}
        >
          <div className="w-5 h-5 rounded-full bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-200 flex-shrink-0">
            {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3 h-3 text-slate-300" />}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-slate-200 font-semibold truncate max-w-[120px] leading-tight">
              {currentUser ? currentUser.name : 'Sign In'}
            </span>
            {currentUser && (
              <span className="text-[9px] text-emerald-400 font-medium truncate max-w-[120px] leading-tight">
                {currentUser.role}
              </span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
