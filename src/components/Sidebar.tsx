import React, { useState } from 'react';
import { Search, MapPin, Navigation, Compass, History, ChevronRight, Layers, ArrowUpRight } from 'lucide-react';
import { LocationInfo, SavedAnalysis } from '../types';
import { BENCHMARK_SITES } from '../services/gisEngine';

interface SidebarProps {
  currentLocation: LocationInfo | null;
  onSelectCoordinates: (lat: number, lng: number, locationOverride?: Partial<LocationInfo>) => void;
  recentLocations: LocationInfo[];
  savedProjects: SavedAnalysis[];
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentLocation,
  onSelectCoordinates,
  recentLocations,
  savedProjects,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualLat, setManualLat] = useState(currentLocation ? currentLocation.lat.toFixed(4) : '35.0110');
  const [manualLng, setManualLng] = useState(currentLocation ? currentLocation.lng.toFixed(4) : '-115.4730');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ name: string; country: string; region?: string; lat: number; lng: number; displayName: string }>>([]);

  // Forward Geocoding using real OpenStreetMap / Mapbox API
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    // Check if query matches any benchmark site
    const q = cleanQuery.toLowerCase();
    const benchmarkMatch = BENCHMARK_SITES.find(
      s => s.name.toLowerCase().includes(q) || s.country.toLowerCase().includes(q) || s.region?.toLowerCase().includes(q)
    );

    if (benchmarkMatch) {
      onSelectCoordinates(benchmarkMatch.lat, benchmarkMatch.lng, benchmarkMatch);
      setManualLat(benchmarkMatch.lat.toFixed(4));
      setManualLng(benchmarkMatch.lng.toFixed(4));
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    // Try parsing as numeric "lat, lng"
    const parts = cleanQuery.split(/[\s,]+/);
    if (parts.length === 2) {
      const pLat = parseFloat(parts[0]);
      const pLng = parseFloat(parts[1]);
      if (!isNaN(pLat) && !isNaN(pLng) && pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
        onSelectCoordinates(pLat, pLng);
        setManualLat(pLat.toFixed(4));
        setManualLng(pLng.toFixed(4));
        setSearchQuery('');
        setSearchResults([]);
        return;
      }
    }

    // Execute real geocoding lookup
    setIsSearching(true);
    setGeoError(null);
    try {
      const res = await fetch(`/api/geocoding/forward?q=${encodeURIComponent(cleanQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const top = data.results[0];
          onSelectCoordinates(top.lat, top.lng, {
            name: top.name,
            country: top.country,
            region: top.region
          });
          setManualLat(top.lat.toFixed(4));
          setManualLng(top.lng.toFixed(4));
          setSearchQuery('');
          setSearchResults(data.results.slice(1, 4));
          return;
        }
      }
      setGeoError(`No geographical matches found for "${cleanQuery}". Enter coordinates directly.`);
    } catch (err) {
      setGeoError('Geocoding service unavailable. Please enter coordinates.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        setManualLat(lat.toString());
        setManualLng(lng.toString());

        // Perform reverse geocoding to resolve real address
        try {
          const rev = await fetch(`/api/geocoding/reverse?lat=${lat}&lng=${lng}`);
          if (rev.ok) {
            const loc = await rev.json();
            onSelectCoordinates(lat, lng, { name: loc.name, country: loc.country, region: loc.region });
            return;
          }
        } catch (e) {}

        onSelectCoordinates(lat, lng, { name: 'Current User Location', country: 'Detected Region' });
      },
      (err) => {
        setGeoError(`Location access denied (${err.message}).`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleManualCoordsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGeoError('Enter valid coordinates: Latitude (-90 to 90), Longitude (-180 to 180).');
      return;
    }
    setGeoError(null);
    onSelectCoordinates(lat, lng);
  };

  return (
    <aside className="w-full lg:w-80 xl:w-88 flex-shrink-0 bg-[#071911] border-r border-[#143826] flex flex-col h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
      {/* Search Input Box */}
      <div className="p-4 border-b border-[#143826]">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
          Search Location or Coordinates
        </label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, city, country, or lat,lng"
            className="w-full bg-[#0b2419] border border-[#1b4330] rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </form>

        {searchResults.length > 0 && (
          <div className="mt-2 bg-[#092116] border border-[#1b4832] rounded-lg p-2 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Other Matching Sites:</span>
            {searchResults.map((sr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectCoordinates(sr.lat, sr.lng, { name: sr.name, country: sr.country, region: sr.region });
                  setManualLat(sr.lat.toFixed(4));
                  setManualLng(sr.lng.toFixed(4));
                  setSearchResults([]);
                }}
                className="w-full text-left p-1.5 rounded hover:bg-[#123625] text-xs text-slate-200 transition-colors flex items-center justify-between"
              >
                <span className="truncate pr-2">{sr.name}, {sr.country}</span>
                <span className="text-[10px] text-emerald-400 font-mono shrink-0">{sr.lat.toFixed(2)}, {sr.lng.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Use Current Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLoading}
          className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-[#0e2c1e] hover:bg-[#153e2b] text-emerald-300 border border-[#1b4832] transition-colors disabled:opacity-50"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Use Current Location</span>
        </button>

        {geoError && (
          <p className="mt-2 text-[11px] text-amber-400/90 leading-tight">
            {geoError}
          </p>
        )}
      </div>

      {/* Manual Precision Coordinates Input */}
      <div className="p-4 border-b border-[#143826]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            WGS84 Coordinates
          </label>
          <span className="text-[10px] text-slate-400 font-mono">Decimal Degrees</span>
        </div>

        <form onSubmit={handleManualCoordsSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-1">LATITUDE</span>
              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="35.0110"
                className="w-full bg-[#0b2419] border border-[#1b4330] rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-1">LONGITUDE</span>
              <input
                type="text"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="-115.4730"
                className="w-full bg-[#0b2419] border border-[#1b4330] rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium bg-emerald-600/90 hover:bg-emerald-500 text-slate-950 font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Analyze Coordinates</span>
          </button>
        </form>
      </div>

      {/* Benchmark Utility-Scale Sites */}
      <div className="p-4 border-b border-[#143826]">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Benchmark Reference Sites
          </label>
        </div>

        <div className="space-y-1.5">
          {BENCHMARK_SITES.map((site) => {
            const isSelected = currentLocation && (
              Math.abs(currentLocation.lat - site.lat) < 0.01 &&
              Math.abs(currentLocation.lng - site.lng) < 0.01
            );
            return (
              <button
                key={site.id}
                onClick={() => {
                  setManualLat(site.lat.toFixed(4));
                  setManualLng(site.lng.toFixed(4));
                  onSelectCoordinates(site.lat, site.lng, site);
                }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#0e2f20] border-emerald-500/60 shadow-sm'
                    : 'bg-[#092116] hover:bg-[#0e2c1e] border-[#163a28]'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                    {site.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{site.country}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {site.lat.toFixed(2)}°, {site.lng.toFixed(2)}°
                    </span>
                  </div>
                </div>
                <ArrowUpRight className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 transition-colors ${isSelected ? 'text-emerald-400' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Analyzed Locations */}
      {recentLocations.length > 0 && (
        <div className="p-4 flex-1">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            <History className="w-3.5 h-3.5 text-slate-400" />
            Recent Analyses
          </div>
          <div className="space-y-1.5">
            {recentLocations.slice(0, 5).map((loc, idx) => (
              <button
                key={`${loc.lat}-${loc.lng}-${idx}`}
                onClick={() => {
                  setManualLat(loc.lat.toFixed(4));
                  setManualLng(loc.lng.toFixed(4));
                  onSelectCoordinates(loc.lat, loc.lng, loc);
                }}
                className="w-full text-left p-2 rounded-lg bg-[#092116] hover:bg-[#0e2c1e] border border-[#163a28] flex items-center justify-between transition-colors"
              >
                <div className="truncate pr-2">
                  <div className="text-xs text-slate-200 truncate">{loc.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
