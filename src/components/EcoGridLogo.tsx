import React from 'react';

interface EcoGridLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const EcoGridLogo: React.FC<EcoGridLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 44, text: 'text-xl', sub: 'text-[11px]' },
    xl: { icon: 56, text: 'text-2xl', sub: 'text-xs' }
  };

  const { icon: iconSize, text: textSize, sub: subSize } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric SVG Logo Emblem */}
      <div 
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Emerald Eco Grid Gradient */}
            <linearGradient id="eg-emerald-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Solar Amber Sunburst Gradient */}
            <linearGradient id="eg-solar-grad" x1="12" y1="8" x2="36" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Wind Cyan Aerodynamic Gradient */}
            <linearGradient id="eg-wind-grad" x1="12" y1="24" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="eg-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hexagonal Power Boundary Container */}
          <polygon
            points="24,3 42,13.4 42,34.6 24,45 6,34.6 6,13.4"
            fill="#061c12"
            stroke="url(#eg-emerald-grad)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Micro Grid Matrix Lines */}
          <line x1="6" y1="24" x2="42" y2="24" stroke="#10b981" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 2" />
          <line x1="24" y1="3" x2="24" y2="45" stroke="#10b981" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 2" />

          {/* Solar Rising Sun Arc (Upper Half) */}
          <path
            d="M16 22 A8 8 0 0 1 32 22"
            stroke="url(#eg-solar-grad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            filter="url(#eg-glow)"
          />
          {/* Sun Rays */}
          <line x1="24" y1="10" x2="24" y2="7" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="13" x2="15" y2="11" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="31" y1="13" x2="33" y2="11" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />

          {/* Wind Flow Streamline & Kinetic Curve (Lower Half) */}
          <path
            d="M13 29 C18 27, 24 33, 31 30 C34 28.5, 36 29.5, 37 31"
            stroke="url(#eg-wind-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M11 35 C16 33.5, 22 38, 28 36 C32 34.5, 34 35.5, 35 36.5"
            stroke="url(#eg-wind-grad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />

          {/* Central Grid Interconnection Node */}
          <circle cx="24" cy="24" r="3.2" fill="#10b981" filter="url(#eg-glow)" />
          <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography Brand Name */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-white font-['Plus_Jakarta_Sans'] ${textSize}`}>
              EcoGrid<span className="text-emerald-400 font-extrabold ml-0.5">AI</span>
            </span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              GIS+ML
            </span>
          </div>
          <span className={`text-slate-400 font-medium tracking-wide ${subSize}`}>
            Renewable Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
