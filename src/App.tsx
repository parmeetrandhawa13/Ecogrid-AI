import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Sun, Wind, Layers, Clock, DollarSign, 
  Sparkles, AlertCircle, RefreshCw, Bookmark 
} from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GisMap } from './components/GisMap';
import { RightAnalysisPanel } from './components/RightAnalysisPanel';
import { OverviewTab } from './components/OverviewTab';
import { SolarTab } from './components/SolarTab';
import { WindTab } from './components/WindTab';
import { ComparisonTab } from './components/ComparisonTab';
import { ForecastTab } from './components/ForecastTab';
import { EconomicsTab } from './components/EconomicsTab';
import { RecommendationsTab } from './components/RecommendationsTab';
import { LocationCompareModal } from './components/LocationCompareModal';
import { AuthModal } from './components/AuthModal';
import { MethodologyModal } from './components/MethodologyModal';
import { AuthUser, Coordinates, FullAnalysisDashboard, LocationInfo, SavedAnalysis } from './types';
import { runFullAnalysis } from './services/analysisPipeline';

export const App: React.FC = () => {
  const [dashboard, setDashboard] = useState<FullAnalysisDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [recentLocations, setRecentLocations] = useState<LocationInfo[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedAnalysis[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>({
    id: 'usr-engineer',
    name: 'Alex Mercer, PE',
    email: 'engineer@ecogrid.ai',
    role: 'Lead Renewable Architect'
  });
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mapHeightMode, setMapHeightMode] = useState<'compact' | 'normal' | 'expanded'>('normal');

  // Load saved projects and history from server & localStorage on startup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.savedProjects) && data.savedProjects.length > 0) {
            setSavedProjects(data.savedProjects);
          }
        }
      } catch (e) {
        console.warn('Could not fetch server projects, using local storage fallback:', e);
        try {
          const storedSaved = localStorage.getItem('ecogrid_saved_projects');
          if (storedSaved) setSavedProjects(JSON.parse(storedSaved));
        } catch (err) {}
      }

      try {
        const storedRecent = localStorage.getItem('ecogrid_recent_locations');
        if (storedRecent) setRecentLocations(JSON.parse(storedRecent));

        const storedUser = localStorage.getItem('ecogrid_user');
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}
    };

    loadInitialData();
  }, []);

  // Initial load: Mojave Desert benchmark
  useEffect(() => {
    handleAnalyzeLocation(35.011, -115.473, {
      name: 'Mojave Desert Solar Corridor',
      country: 'United States',
      region: 'California'
    });
  }, []);

  // Execute analysis pipeline for coordinates
  const handleAnalyzeLocation = async (lat: number, lng: number, override?: Partial<LocationInfo>) => {
    setIsLoading(true);
    try {
      // First attempt full-stack API endpoint
      const response = await fetch('/api/planning/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: {
            lat,
            lng,
            name: override?.name || 'Custom Coordinates Study',
            country: override?.country || 'Global Region',
            ...override
          }
        })
      });

      if (response.ok) {
        const data: FullAnalysisDashboard = await response.json();
        setDashboard(data);
        updateRecentLocations(data.location);
      } else {
        // Fallback to in-browser pipeline execution if server is restarting
        const localData = runFullAnalysis({
          lat,
          lng,
          name: override?.name || 'Custom Coordinates Study',
          country: override?.country || 'Global Region',
          ...override
        });
        setDashboard(localData);
        updateRecentLocations(localData.location);
      }
    } catch (err) {
      // Direct local pipeline fallback
      const localData = runFullAnalysis({
        lat,
        lng,
        name: override?.name || 'Custom Coordinates Study',
        country: override?.country || 'Global Region',
        ...override
      });
      setDashboard(localData);
      updateRecentLocations(localData.location);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRecentLocations = (loc: LocationInfo) => {
    setRecentLocations(prev => {
      const filtered = prev.filter(p => Math.abs(p.lat - loc.lat) > 0.01 || Math.abs(p.lng - loc.lng) > 0.01);
      const updated = [loc, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('ecogrid_recent_locations', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSaveProject = async () => {
    if (!dashboard) return;
    const exists = savedProjects.some(p => p.id === dashboard.id);
    if (exists) {
      // Delete project via API
      try {
        const res = await fetch(`/api/locations/${dashboard.id}`, { method: 'DELETE' });
        if (res.ok) {
          const data = await res.json();
          if (data.allProjects) setSavedProjects(data.allProjects);
        }
      } catch (e) {}
      setSavedProjects(prev => prev.filter(p => p.id !== dashboard.id));
    } else {
      // Save project via API (persists in PostgreSQL / durable storage)
      try {
        const res = await fetch('/api/locations/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${dashboard.location.name} - ${dashboard.recommendation.recommendedTech}`,
            dashboard
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.allProjects) {
            setSavedProjects(data.allProjects);
            return;
          }
        }
      } catch (e) {
        console.warn('Backend save request failed, using local fallback:', e);
      }

      // Local state fallback
      const localProject: SavedAnalysis = {
        id: dashboard.id,
        name: `${dashboard.location.name} - ${dashboard.recommendation.recommendedTech}`,
        locationName: dashboard.location.name,
        country: dashboard.location.country,
        lat: dashboard.location.lat,
        lng: dashboard.location.lng,
        overallScore: dashboard.suitability.overallScore,
        recommendedTech: dashboard.recommendation.recommendedTech,
        annualMwh: dashboard.economics.annualTotalGenerationMwh,
        lcoePerMwh: dashboard.economics.lcoePerMwh,
        dashboard,
        createdAt: new Date().toISOString()
      };
      setSavedProjects(prev => [localProject, ...prev]);
    }
  };

  const isSaved = Boolean(dashboard && savedProjects.some(p => p.id === dashboard.id || (p.lat === dashboard.location.lat && p.lng === dashboard.location.lng)));

  return (
    <div className="min-h-screen bg-[#05130d] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        currentDashboard={dashboard}
        currentUser={currentUser}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenBookmarks={() => {}}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onSaveCurrent={handleSaveProject}
        isSaved={isSaved}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />

      {/* Main App Layout: 3 Columns (Sidebar, Interactive Workspace, Right Inspector) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left GIS Sidebar */}
        <Sidebar
          currentLocation={dashboard ? dashboard.location : null}
          onSelectCoordinates={(lat, lng, override) => handleAnalyzeLocation(lat, lng, override)}
          recentLocations={recentLocations}
          savedProjects={savedProjects}
          isLoading={isLoading}
        />

        {/* Center Workspace: Map on top, Technical Tabs below */}
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar bg-[#05140e]">
          {/* Top Half: Interactive Leaflet GIS Map */}
          <div className={`${
            mapHeightMode === 'expanded' 
              ? 'h-[500px] lg:h-[580px]' 
              : mapHeightMode === 'compact' 
              ? 'h-64 sm:h-72' 
              : 'h-80 sm:h-96'
          } w-full flex-shrink-0 border-b border-[#143826] transition-all duration-300 relative`}>
            <GisMap
              currentLocation={dashboard ? dashboard.location : null}
              onMapClick={(coords: Coordinates) => handleAnalyzeLocation(coords.lat, coords.lng)}
              onSelectBenchmark={(site) => handleAnalyzeLocation(site.lat, site.lng, site)}
              heightMode={mapHeightMode}
              onToggleHeightMode={setMapHeightMode}
              isLoading={isLoading}
            />
          </div>

          {/* Lower Half: Tabbed Technical Engineering Analysis */}
          {dashboard ? (
            <div className="flex-1 p-4 sm:p-6 space-y-5">
              {/* Tab Navigation Navigation Bar */}
              <div className="flex items-center justify-between border-b border-[#143826] pb-2 overflow-x-auto gap-2">
                <div className="flex items-center gap-1.5 min-w-max">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'overview'
                        ? 'bg-emerald-600 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-[#0e2c1e]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('solar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'solar'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-[#0e2c1e]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Solar ML</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('wind')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'wind'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-[#0e2c1e]'
                    }`}
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>Wind ML</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'comparison'
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-[#0e2c1e]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Comparison</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('forecast')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'forecast'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-[#0e2c1e]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Forecast</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('economics')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'economics'
                        ? 'bg-emerald-600 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-[#0e2c1e]'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Economics & ROI</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'recommendations'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-[#0e2c1e]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommendations</span>
                  </button>
                </div>

                {/* Sub-status Indicator */}
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>Site: {dashboard.location.name}</span>
                </div>
              </div>

              {/* Active Tab View */}
              {activeTab === 'overview' && (
                <OverviewTab dashboard={dashboard} onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'solar' && (
                <SolarTab suitability={dashboard.suitability} initialPrediction={dashboard.solarPrediction} />
              )}
              {activeTab === 'wind' && (
                <WindTab suitability={dashboard.suitability} initialPrediction={dashboard.windPrediction} />
              )}
              {activeTab === 'comparison' && (
                <ComparisonTab dashboard={dashboard} onNavigateTab={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'forecast' && (
                <ForecastTab
                  initialForecast={dashboard.forecast}
                  suitability={dashboard.suitability}
                  solarPred={dashboard.solarPrediction}
                  windPred={dashboard.windPrediction}
                />
              )}
              {activeTab === 'economics' && (
                <EconomicsTab
                  initialEconomics={dashboard.economics}
                  solarPred={dashboard.solarPrediction}
                  windPred={dashboard.windPrediction}
                />
              )}
              {activeTab === 'recommendations' && (
                <RecommendationsTab dashboard={dashboard} />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400">
              <div className="space-y-3 max-w-sm">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <h3 className="text-sm font-semibold text-slate-200">Evaluating Site Parameters</h3>
                <p className="text-xs text-slate-400">Ingesting satellite irradiance, surface boundary roughness, and executing surrogate physics models...</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Inspector & GIS Scoring Panel */}
        {dashboard && (
          <RightAnalysisPanel
            location={dashboard.location}
            suitability={dashboard.suitability}
            recommendation={dashboard.recommendation}
            onNavigateTab={(tab) => setActiveTab(tab)}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Benchmark Sites Comparison Modal */}
      <LocationCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        currentDashboard={dashboard}
        onSelectSite={(lat, lng, override) => handleAnalyzeLocation(lat, lng, override)}
      />

      {/* User Auth / Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          try {
            localStorage.setItem('ecogrid_user', JSON.stringify(user));
          } catch (e) {}
        }}
        onLogout={() => {
          setCurrentUser(null);
          try {
            localStorage.removeItem('ecogrid_user');
          } catch (e) {}
        }}
      />

      {/* Data Provenance & Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

export default App;
