import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Sun, Wind, Layers, Maximize2, Minimize2, Crosshair, 
  MapPin, Globe, Sparkles, HelpCircle, Info
} from 'lucide-react';
import { Coordinates, LocationInfo } from '../types';
import { BENCHMARK_SITES } from '../services/gisEngine';

interface GisMapProps {
  currentLocation: LocationInfo | null;
  onMapClick: (coords: Coordinates) => void;
  isLoading: boolean;
  onSelectBenchmark?: (site: LocationInfo) => void;
  heightMode?: 'compact' | 'normal' | 'expanded';
  onToggleHeightMode?: (mode: 'compact' | 'normal' | 'expanded') => void;
}

export const GisMap: React.FC<GisMapProps> = ({
  currentLocation,
  onMapClick,
  isLoading,
  onSelectBenchmark,
  heightMode = 'normal',
  onToggleHeightMode
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const solarOverlayRef = useRef<L.LayerGroup | null>(null);
  const windOverlayRef = useRef<L.LayerGroup | null>(null);
  const benchmarksOverlayRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<'standard' | 'solar' | 'wind' | 'hybrid'>('standard');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'topo'>('streets');
  const [currentZoom, setCurrentZoom] = useState(6);
  const [showLegend, setShowLegend] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const baseMap = L.map(mapContainerRef.current, {
      center: [currentLocation?.lat ?? 35.011, currentLocation?.lng ?? -115.473],
      zoom: 6,
      zoomControl: false,
      attributionControl: true
    });

    // Default to OpenStreetMap Standard: completely free, open-source, full-color (blue waters, green landscapes, clear roads/boundaries), NO API KEY required
    const defaultLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(baseMap);
    baseTileLayerRef.current = defaultLayer;

    // Layer groups for GIS overlays
    const solarGroup = L.layerGroup().addTo(baseMap);
    const windGroup = L.layerGroup().addTo(baseMap);
    const benchmarkGroup = L.layerGroup().addTo(baseMap);
    solarOverlayRef.current = solarGroup;
    windOverlayRef.current = windGroup;
    benchmarksOverlayRef.current = benchmarkGroup;

    // Custom pulse marker icon for the selected site
    const customIcon = L.divIcon({
      className: 'custom-gis-pin',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([currentLocation?.lat ?? 35.011, currentLocation?.lng ?? -115.473], {
      icon: customIcon,
      draggable: true
    }).addTo(baseMap);

    const circle = L.circle([currentLocation?.lat ?? 35.011, currentLocation?.lng ?? -115.473], {
      radius: 15000, // 15 km study buffer
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 6'
    }).addTo(baseMap);

    markerRef.current = marker;
    circleRef.current = circle;

    // Click handler for analyzing new location
    baseMap.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4))
      });
    });

    // Marker dragend handler
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onMapClick({
        lat: Number(pos.lat.toFixed(4)),
        lng: Number(pos.lng.toFixed(4))
      });
    });

    baseMap.on('zoomend', () => {
      setCurrentZoom(baseMap.getZoom());
    });

    mapInstanceRef.current = baseMap;

    // ResizeObserver according to framework guidelines
    const resizeObserver = new ResizeObserver(() => {
      baseMap.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      baseMap.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when style changes (100% free with NO API key needed)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (baseTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    }

    let newLayer: L.TileLayer;
    if (mapStyle === 'satellite') {
      newLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
    } else if (mapStyle === 'topo') {
      newLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey'
      });
    } else {
      // Standard vibrant OpenStreetMap
      newLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
      });
    }

    newLayer.addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Render Benchmark Site Pins
  useEffect(() => {
    if (!benchmarksOverlayRef.current || !mapInstanceRef.current) return;
    benchmarksOverlayRef.current.clearLayers();

    BENCHMARK_SITES.forEach(site => {
      // Don't duplicate current site pin
      if (currentLocation && Math.abs(site.lat - currentLocation.lat) < 0.01 && Math.abs(site.lng - currentLocation.lng) < 0.01) {
        return;
      }

      const isSolar = site.name.toLowerCase().includes('solar');
      const isWind = site.name.toLowerCase().includes('wind');
      const pinColor = isSolar ? '#fbbf24' : isWind ? '#38bdf8' : '#34d399';

      const benchmarkIcon = L.divIcon({
        className: 'benchmark-site-pin',
        html: `
          <div style="background: #071911; border: 1.5px solid ${pinColor}; border-radius: 6px; padding: 2px 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.6); white-space: nowrap; cursor: pointer; transform: translate(-50%, -50%);">
            <div style="width: 7px; height: 7px; border-radius: 50%; background: ${pinColor};"></div>
            <span style="font-family: sans-serif; font-size: 10px; font-weight: 600; color: #f1f5f9;">${site.name.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [80, 20],
        iconAnchor: [40, 10]
      });

      const bMarker = L.marker([site.lat, site.lng], { icon: benchmarkIcon });
      bMarker.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <strong>${site.name}</strong><br/>
          <span style="color: #64748b;">${site.region ? site.region + ', ' : ''}${site.country}</span><br/>
          <span style="color: #10b981; font-weight: 600;">Click to analyze site</span>
        </div>
      `, { direction: 'top', offset: [0, -10] });

      bMarker.on('click', () => {
        if (onSelectBenchmark) {
          onSelectBenchmark(site);
        } else {
          onMapClick({ lat: site.lat, lng: site.lng });
        }
      });

      bMarker.addTo(benchmarksOverlayRef.current!);
    });
  }, [currentLocation, onSelectBenchmark, onMapClick]);

  // Update center & marker when currentLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation) return;

    const latLng: L.LatLngTuple = [currentLocation.lat, currentLocation.lng];
    mapInstanceRef.current.panTo(latLng, { animate: true, duration: 0.8 });

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
      markerRef.current.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; line-height: 1.4; padding: 4px; min-width: 170px;">
          <div style="font-weight: 700; color: #064e3b; margin-bottom: 2px;">${currentLocation.name}</div>
          <div style="color: #64748b; font-family: monospace; font-size: 11px;">${currentLocation.lat.toFixed(4)}°N, ${currentLocation.lng.toFixed(4)}°E</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #334155;">
            Elevation: <strong>${currentLocation.elevationM}m</strong> | Slope: <strong>${currentLocation.terrainSlopeDeg.toFixed(1)}°</strong>
          </div>
        </div>
      `).openPopup();
    }

    if (circleRef.current) {
      circleRef.current.setLatLng(latLng);
    }
  }, [currentLocation]);

  // Handle Layer Overlays (Solar Irradiance Heatmap or Wind Isotachs or Hybrid)
  useEffect(() => {
    if (!solarOverlayRef.current || !windOverlayRef.current || !mapInstanceRef.current) return;

    solarOverlayRef.current.clearLayers();
    windOverlayRef.current.clearLayers();

    if (!currentLocation) return;

    const showSolar = activeLayer === 'solar' || activeLayer === 'hybrid';
    const showWind = activeLayer === 'wind' || activeLayer === 'hybrid';

    if (showSolar) {
      // Draw concentric solar GHI radiance contours
      const rings = [
        { r: 25000, color: '#f59e0b', opacity: 0.16 },
        { r: 50000, color: '#fbbf24', opacity: 0.08 }
      ];
      rings.forEach(ring => {
        L.circle([currentLocation.lat, currentLocation.lng], {
          radius: ring.r,
          color: ring.color,
          fillColor: ring.color,
          fillOpacity: ring.opacity,
          weight: 1.2
        }).addTo(solarOverlayRef.current!);
      });
    }

    if (showWind) {
      // Draw wind isotach directional vectors
      const rings = [
        { r: 30000, color: '#06b6d4', opacity: 0.16 },
        { r: 60000, color: '#38bdf8', opacity: 0.08 }
      ];
      rings.forEach(ring => {
        L.circle([currentLocation.lat, currentLocation.lng], {
          radius: ring.r,
          color: ring.color,
          fillColor: ring.color,
          fillOpacity: ring.opacity,
          weight: 1.2
        }).addTo(windOverlayRef.current!);
      });
    }
  }, [activeLayer, currentLocation]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 7, { animate: true });
    }
  };

  const cycleHeightMode = () => {
    if (!onToggleHeightMode) return;
    if (heightMode === 'normal') onToggleHeightMode('expanded');
    else if (heightMode === 'expanded') onToggleHeightMode('compact');
    else onToggleHeightMode('normal');
  };

  return (
    <div className="relative w-full h-full min-h-[340px] bg-[#05130d] overflow-hidden flex flex-col select-none">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Top Map HUD Bar: Location Info + Layer Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Active Coordinates & Location Chip */}
        <div className="pointer-events-auto bg-[#071911]/95 backdrop-blur-md border border-[#143826] rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 truncate max-w-[190px] sm:max-w-[280px]">
                {currentLocation ? currentLocation.name : 'Select location'}
              </span>
              {currentLocation && (
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  {currentLocation.lat.toFixed(4)}°, {currentLocation.lng.toFixed(4)}°
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{currentLocation?.country || 'Global GIS Grid'}</span>
              {currentLocation && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400">{currentLocation.elevationM}m MSL</span>
                  <span>•</span>
                  <span>Slope {currentLocation.terrainSlopeDeg.toFixed(1)}°</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Map Toolbar: Layer Selector & Style Switcher */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Base Map Style (Standard OSM / Satellite / Topo) */}
          <div className="bg-[#071911]/95 backdrop-blur-md border border-[#143826] rounded-xl p-1 shadow-xl flex items-center gap-1">
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                mapStyle === 'streets'
                  ? 'bg-emerald-700/80 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e2c1e]'
              }`}
              title="Vibrant OpenStreetMap (Roads, land cover, water, boundaries — 100% free, no API key)"
            >
              Standard
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                mapStyle === 'satellite'
                  ? 'bg-emerald-700/80 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e2c1e]'
              }`}
              title="Esri World Imagery (High-res orbital aerial view — no API key)"
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('topo')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                mapStyle === 'topo'
                  ? 'bg-emerald-700/80 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0e2c1e]'
              }`}
              title="Esri World Topographic (Terrain contours and geographic features — no API key)"
            >
              Topographic
            </button>
          </div>

          {/* Renewable Resource Overlays */}
          <div className="bg-[#071911]/95 backdrop-blur-md border border-[#143826] rounded-xl p-1 shadow-xl flex items-center gap-1">
            <button
              onClick={() => setActiveLayer('standard')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                activeLayer === 'standard'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-[#0e2c1e]'
              }`}
            >
              Base GIS
            </button>
            <button
              onClick={() => setActiveLayer('solar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                activeLayer === 'solar'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-[#0e2c1e]'
              }`}
              title="Overlay solar irradiance radiation zones"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Solar GHI</span>
            </button>
            <button
              onClick={() => setActiveLayer('wind')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                activeLayer === 'wind'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-[#0e2c1e]'
              }`}
              title="Overlay wind flow velocity isotachs"
            >
              <Wind className="w-3 h-3 text-cyan-400" />
              <span>Wind Isotach</span>
            </button>
            <button
              onClick={() => setActiveLayer('hybrid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                activeLayer === 'hybrid'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-[#0e2c1e]'
              }`}
              title="Overlay dual solar + wind synergy"
            >
              <Sparkles className="w-3 h-3 text-teal-300" />
              <span>Hybrid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating User Guide Hint: Simple, intuitive instructions */}
      <div className="absolute top-16 left-3 z-10 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#061910]/85 backdrop-blur-sm border border-emerald-500/20 text-xs text-slate-300 shadow-md">
        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span>Click anywhere on the map or drag the pin to analyze any site</span>
      </div>

      {/* Floating Zoom & Map Controls (Bottom Right) */}
      <div className="absolute right-3 bottom-12 z-10 flex flex-col gap-1.5">
        {onToggleHeightMode && (
          <button
            onClick={cycleHeightMode}
            className="w-8 h-8 rounded-lg bg-[#071911]/95 hover:bg-[#0e2c1e] text-slate-200 border border-[#143826] flex items-center justify-center shadow-lg transition-all"
            title={heightMode === 'expanded' ? 'Collapse Map View' : 'Expand Map View'}
          >
            {heightMode === 'expanded' ? (
              <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>
        )}
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-[#071911]/95 hover:bg-[#0e2c1e] text-slate-100 border border-[#143826] flex items-center justify-center text-sm font-bold shadow-lg transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-[#071911]/95 hover:bg-[#0e2c1e] text-slate-100 border border-[#143826] flex items-center justify-center text-sm font-bold shadow-lg transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-lg bg-[#071911]/95 hover:bg-[#0e2c1e] text-slate-100 border border-[#143826] flex items-center justify-center shadow-lg transition-colors"
          title="Recenter Map on Target Site"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Quick Visual Legend Pill (Bottom Left) */}
      {showLegend && (
        <div className="absolute left-3 bottom-12 z-10 pointer-events-auto bg-[#071911]/90 backdrop-blur-md border border-[#143826] rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-300 flex items-center gap-3 shadow-md">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
            <span>Site Center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 border-b border-dashed border-emerald-400" />
            <span>15km Buffer</span>
          </div>
          {activeLayer === 'solar' && (
            <div className="flex items-center gap-1.5 text-amber-300">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-400" />
              <span>GHI Radiation</span>
            </div>
          )}
          {activeLayer === 'wind' && (
            <div className="flex items-center gap-1.5 text-cyan-300">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/40 border border-cyan-400" />
              <span>Wind Isotach</span>
            </div>
          )}
          {activeLayer === 'hybrid' && (
            <div className="flex items-center gap-1.5 text-teal-300">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500/40 border border-teal-400" />
              <span>Synergy Zone</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Status Info Strip */}
      <div className="h-8 bg-[#071911]/95 border-t border-[#143826] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
        <div className="flex items-center gap-4">
          <span className="text-slate-300 font-sans">
            Interactive GIS Mode
          </span>
          <span className="hidden sm:inline">Zoom: {currentZoom}x</span>
          <span className="hidden md:inline text-slate-500">Benchmark sites highlighted on map</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-amber-400 flex items-center gap-1 font-semibold">
              <span className="animate-spin text-xs">⟳</span> Fetching GIS & NASA POWER Data...
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready · Click anywhere
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
