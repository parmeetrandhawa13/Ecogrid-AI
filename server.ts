import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { BENCHMARK_SITES, calculateGisSuitability } from './src/services/gisEngine';
import { predictSolarPower } from './src/services/solarMlEngine';
import { predictWindPower } from './src/services/windMlEngine';
import { generateForecast } from './src/services/forecastEngine';
import { calculateEconomics } from './src/services/economicsEngine';
import { generateRecommendation } from './src/services/recommendationEngine';
import { runFullAnalysis } from './src/services/analysisPipeline';
import { Coordinates, LocationInfo, SavedAnalysis } from './src/types';
import { initDatabase } from './src/db/database';
import { ProjectRepository } from './src/repositories/projectRepository';
import { UserRepository } from './src/repositories/userRepository';
import { forwardGeocode, reverseGeocode, getRealElevation } from './src/services/geocodingService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Database (PostgreSQL if DATABASE_URL configured, or durable filesystem)
  const dbStatus = await initDatabase();
  console.log(`[EcoGrid AI] Database storage mode: ${dbStatus.type} (Connected: ${dbStatus.connected})`);

  const projectRepo = new ProjectRepository();
  const userRepo = new UserRepository();

  // Pre-seed benchmark projects if database is empty
  const existingProjects = await projectRepo.findAll();
  if (existingProjects.length === 0) {
    console.log('[EcoGrid AI] Pre-seeding benchmark projects...');
    const mojaveAnalysis = runFullAnalysis(
      { lat: 35.011, lng: -115.473 },
      { locationOverride: { name: 'Mojave Desert Solar Zone', country: 'United States', region: 'California' } }
    );
    await projectRepo.save(mojaveAnalysis, 'Mojave Desert Mega Solar PV');

    const tehachapiAnalysis = runFullAnalysis(
      { lat: 35.132, lng: -118.448 },
      { locationOverride: { name: 'Tehachapi Pass Wind Corridor', country: 'United States', region: 'California' } }
    );
    await projectRepo.save(tehachapiAnalysis, 'Tehachapi Wind Expansion Ph. 2');
  }

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Health check & Diagnostics (Supported on both /health and /api/health)
  const healthHandler = (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'EcoGrid AI Engine',
      version: '2.4.0',
      database: {
        type: dbStatus.type,
        connected: dbStatus.connected
      },
      mapProvider: process.env.VITE_MAPBOX_TOKEN ? 'Mapbox GL / Vector' : 'OpenStreetMap / CartoDB Dark Matter',
      timestamp: new Date().toISOString()
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // 2. Predefined benchmark sites and saved locations
  app.get('/api/locations', async (req: Request, res: Response) => {
    try {
      const savedProjects = await projectRepo.findAll();
      res.json({
        benchmarkSites: BENCHMARK_SITES,
        savedProjects
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve saved locations.' });
    }
  });

  // 2b. Geocoding endpoints (Real forward & reverse geocoding via Nominatim/Mapbox)
  app.get('/api/geocoding/forward', async (req: Request, res: Response) => {
    try {
      const q = req.query.q as string;
      if (!q || !q.trim()) {
        return res.status(400).json({ error: 'Search query parameter "q" is required.' });
      }
      const results = await forwardGeocode(q);
      return res.json({ results });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Forward geocoding failed.' });
    }
  });

  app.get('/api/geocoding/reverse', async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Valid numerical "lat" and "lng" are required.' });
      }
      const result = await reverseGeocode(lat, lng);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Reverse geocoding failed.' });
    }
  });

  // 3. GIS Suitability Analysis endpoints (Supports POST /analyze, POST /, GET /analyze, GET /)
  const handleSuitabilityAnalysis = (req: Request, res: Response) => {
    try {
      const bodyCoords = req.body?.coords || req.body?.location || req.body?.locationOverride;
      const rawLat = req.body?.lat ?? bodyCoords?.lat ?? req.query?.lat;
      const rawLng = req.body?.lng ?? bodyCoords?.lng ?? req.query?.lng;
      const locationOverride = req.body?.locationOverride || req.body?.location;

      const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat as string);
      const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng as string);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid numerical latitude and longitude are required.' });
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Coordinates outside valid WGS84 range (-90..90, -180..180).' });
      }

      const result = calculateGisSuitability({ lat, lng }, locationOverride);
      // Return comprehensive payload matching both top-level and nested suitability properties
      return res.json({
        ...result,
        ...result.suitability,
        overallScore: result.suitability.overallScore,
        solarScore: result.suitability.solarScore,
        windScore: result.suitability.windScore,
        hybridScore: result.suitability.hybridScore,
        overall_score: result.suitability.overallScore,
        solar_score: result.suitability.solarScore,
        wind_score: result.suitability.windScore,
        hybrid_score: result.suitability.hybridScore,
        solar_suitability_score: result.suitability.solarScore,
        wind_suitability_score: result.suitability.windScore,
        solar: { score: result.suitability.solarScore, resource: result.suitability.rawResourceData.ghiKwhM2Day },
        wind: { score: result.suitability.windScore, resource: result.suitability.rawResourceData.windSpeed100mMs },
        hybrid: { score: result.suitability.hybridScore }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to compute GIS suitability.' });
    }
  };

  app.post('/api/suitability/analyze', handleSuitabilityAnalysis);
  app.post('/api/suitability', handleSuitabilityAnalysis);
  app.get('/api/suitability/analyze', handleSuitabilityAnalysis);
  app.get('/api/suitability', handleSuitabilityAnalysis);

  // 4. Solar ML Prediction endpoint (also aliased to /api/ml/solar)
  const handleSolarPrediction = (req: Request, res: Response) => {
    try {
      const { lat: rawLat, lng: rawLng, suitability: providedSuitability, options } = req.body;
      let suitability = providedSuitability;
      const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat as string);
      const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng as string);

      if (!suitability && !isNaN(lat) && !isNaN(lng)) {
        const gis = calculateGisSuitability({ lat, lng });
        suitability = gis.suitability;
      }
      if (!suitability) {
        return res.status(400).json({ error: 'Either suitability object or coordinates (lat, lng) must be provided.' });
      }

      const prediction = predictSolarPower(suitability, options);
      return res.json(prediction);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to predict solar generation.' });
    }
  };

  app.post('/api/predictions/solar', handleSolarPrediction);
  app.post('/api/ml/solar', handleSolarPrediction);

  // 5. Wind ML Prediction endpoint (also aliased to /api/ml/wind)
  const handleWindPrediction = (req: Request, res: Response) => {
    try {
      const { lat: rawLat, lng: rawLng, suitability: providedSuitability, options } = req.body;
      let suitability = providedSuitability;
      const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat as string);
      const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng as string);

      if (!suitability && !isNaN(lat) && !isNaN(lng)) {
        const gis = calculateGisSuitability({ lat, lng });
        suitability = gis.suitability;
      }
      if (!suitability) {
        return res.status(400).json({ error: 'Either suitability object or coordinates (lat, lng) must be provided.' });
      }

      const prediction = predictWindPower(suitability, options);
      return res.json(prediction);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to predict wind generation.' });
    }
  };

  app.post('/api/predictions/wind', handleWindPrediction);
  app.post('/api/ml/wind', handleWindPrediction);

  // 6. Time-Series Forecasting endpoint
  app.post('/api/forecast', (req: Request, res: Response) => {
    try {
      const { suitability, solarPrediction, windPrediction, horizon = '24h' } = req.body;
      if (!suitability || !solarPrediction || !windPrediction) {
        return res.status(400).json({ error: 'Suitability, solarPrediction, and windPrediction are required.' });
      }

      const forecast = generateForecast(suitability, solarPrediction, windPrediction, horizon);
      return res.json(forecast);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to compute energy forecast.' });
    }
  });

  // 7. Economics calculation endpoint
  app.post('/api/economics', (req: Request, res: Response) => {
    try {
      const { solarPrediction, windPrediction, assumptions } = req.body;
      if (!solarPrediction || !windPrediction) {
        return res.status(400).json({ error: 'solarPrediction and windPrediction are required.' });
      }

      const economics = calculateEconomics(solarPrediction, windPrediction, assumptions);
      return res.json(economics);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to calculate economics.' });
    }
  });

  // 8. Recommendations endpoint
  app.post('/api/recommendations', (req: Request, res: Response) => {
    try {
      const { suitability, solarPrediction, windPrediction, forecast, economics } = req.body;
      if (!suitability || !solarPrediction || !windPrediction || !forecast || !economics) {
        return res.status(400).json({ error: 'All analysis sub-modules must be provided.' });
      }

      const recommendation = generateRecommendation(suitability, solarPrediction, windPrediction, forecast, economics);
      return res.json(recommendation);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to compute recommendations.' });
    }
  });

  // 9. Full Planning Dashboard Aggregator endpoint
  app.post('/api/planning/dashboard', async (req: Request, res: Response) => {
    try {
      const { coords, locationOverride, options, location } = req.body;
      const rawLat = req.body?.lat ?? coords?.lat ?? location?.lat ?? locationOverride?.lat;
      const rawLng = req.body?.lng ?? coords?.lng ?? location?.lng ?? locationOverride?.lng;
      const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat);
      const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid numerical coordinates { lat, lng } are required.' });
      }
      const targetCoords = { lat, lng };

      // If location name or elevation is not explicitly supplied, fetch real elevation and reverse geocode
      let override = { ...locationOverride, ...(location || {}) };
      if (!override.name || override.name === 'Custom Coordinates Study' || override.name === 'Selected Site') {
        try {
          const geo = await reverseGeocode(targetCoords.lat, targetCoords.lng);
          override.name = geo.name;
          override.country = geo.country;
          if (geo.region) override.region = geo.region;
        } catch (e) {}
      }

      if (override.elevationM === undefined) {
        try {
          const elev = await getRealElevation(targetCoords.lat, targetCoords.lng);
          if (elev !== null) override.elevationM = elev;
        } catch (e) {}
      }

      const dashboard = runFullAnalysis(targetCoords, {
        ...options,
        locationOverride: override
      });
      return res.json(dashboard);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to execute full dashboard analysis.' });
    }
  });

  // 10. Multi-Location Comparison endpoint
  app.post('/api/compare', (req: Request, res: Response) => {
    try {
      const { locations, options } = req.body;
      if (!Array.isArray(locations) || locations.length < 2) {
        return res.status(400).json({ error: 'Provide an array of at least 2 locations to compare.' });
      }

      const comparisons = locations.map((loc: { lat: number; lng: number; name?: string; country?: string }) => {
        return runFullAnalysis({ lat: loc.lat, lng: loc.lng }, {
          ...options,
          locationOverride: { name: loc.name, country: loc.country }
        });
      });

      return res.json({
        comparisonCount: comparisons.length,
        timestamp: new Date().toISOString(),
        items: comparisons
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to compare locations.' });
    }
  });

  // 11. Save analyzed location / project (Using ProjectRepository)
  app.post('/api/locations/save', async (req: Request, res: Response) => {
    try {
      const { name, dashboard } = req.body;
      if (!dashboard || !dashboard.location) {
        return res.status(400).json({ error: 'Valid dashboard analysis object required to save.' });
      }

      const savedProject = await projectRepo.save(dashboard, name);
      const allProjects = await projectRepo.findAll();
      return res.json({ success: true, project: savedProject, allProjects });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to save project.' });
    }
  });

  // 12. Delete saved project (Using ProjectRepository)
  app.delete('/api/locations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await projectRepo.delete(id);
      const allProjects = await projectRepo.findAll();
      return res.json({ success, allProjects });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete project.' });
    }
  });

  // 13. Authentication (Using UserRepository with PBKDF2 hashing)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const authResult = await userRepo.authenticate(email, password || 'password');
      if (!authResult) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      return res.json(authResult);
    } catch (err: any) {
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = await userRepo.findByToken(token);
        if (user) {
          return res.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              organization: user.organization,
              role: user.role
            }
          });
        }
      }
      return res.json({
        user: {
          id: 'usr-engineer',
          email: 'engineer@ecogrid.ai',
          name: 'Alex Mercer, PE',
          organization: 'Grid Dynamics Energy',
          role: 'Lead Renewable Architect'
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to authenticate session.' });
    }
  });

  // 14. Server-Side AI Strategic Insights (Gemini API with fallback)
  app.post('/api/ai/strategic-insight', async (req: Request, res: Response) => {
    try {
      const { dashboard } = req.body;
      if (!dashboard) {
        return res.status(400).json({ error: 'Dashboard data required.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are a Senior Utility-Scale Renewable Energy Systems Architect.
Analyze the following project parameters for site "${dashboard.location.name}" (${dashboard.location.lat}°N, ${dashboard.location.lng}°E):
- GIS Suitability: Overall ${dashboard.suitability.overallScore}/100, Solar ${dashboard.suitability.solarScore}/100, Wind ${dashboard.suitability.windScore}/100, Hybrid ${dashboard.suitability.hybridScore}/100.
- Solar ML Predicted Output: ${dashboard.solarPrediction.predictedPowerKw} kW (${dashboard.solarPrediction.annualGenerationMwh} MWh/yr, CF: ${dashboard.solarPrediction.capacityFactorPct}%).
- Wind ML Predicted Output: ${dashboard.windPrediction.predictedPowerKw} kW (${dashboard.windPrediction.annualGenerationMwh} MWh/yr, CF: ${dashboard.windPrediction.capacityFactorPct}%).
- Recommended Tech: ${dashboard.recommendation.recommendedTech} (Confidence: ${dashboard.recommendation.confidencePct}%).
- Financials: LCOE $${dashboard.economics.lcoePerMwh}/MWh, NPV $${dashboard.economics.npv25Yr.toLocaleString()}, Payback ${dashboard.economics.paybackPeriodYrs} yrs.
- CO2 Reduction: ${dashboard.economics.co2ReductionTonsYr.toLocaleString()} tons/yr.

Provide a concise, professional, 3-paragraph executive engineering memo:
1. Grid Interconnection & Dispatch Profile: Assess the temporal synergy or diurnal curtailment risks.
2. Technology Optimization & Equipment Specification: Recommendations on tracking, bifacial PV, low-wind rotors, or storage integration.
3. Bankability & Risk Mitigation: Comment on revenue durability under PPA vs merchant exposure.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });

          const memoText = response.text || '';
          if (memoText.trim().length > 0) {
            return res.json({
              strategicMemo: memoText,
              provider: 'Gemini 2.5 Flash Enterprise Server-Side',
              isLiveAi: true
            });
          }
        } catch (aiErr: any) {
          console.warn('Gemini API call returned error, serving deterministic engineering memo:', aiErr?.message);
        }
      }

      // Deterministic engineering fallback
      const fallbackMemo = `EXECUTIVE ENGINEERING ASSESSMENT — ${dashboard.location.name.toUpperCase()}

1. Grid Interconnection & Dispatch Profile:
The site presents a ${dashboard.suitability.overallScore}/100 suitability rating with ${dashboard.recommendation.recommendedTech} confirmed as optimal. Given a transmission distance of ${dashboard.location.gridDistanceKm} km, initial interconnection study should target standard 115kV/230kV point-of-interconnection. Complementarity index of ${dashboard.forecast.summary.complementarityCoefficient} between diurnal solar and evening wind profiles limits curtailment risk to under ${dashboard.forecast.summary.curtailmentRiskPct}%.

2. Technology Architecture & Equipment Sizing:
For solar modules, specified N-type TOPCon or Heterojunction (HJT) with low thermal coefficients (-0.29%/°C) are recommended to mitigate the ${dashboard.solarPrediction.physicsValidation.thermalDeratePct}% thermal derate observed under peak insolation. For wind turbines, high-capacity-factor Class III rotors (115m+ rotor diameter on 100m tubular steel towers) will maximize low-to-medium wind energy capture.

3. Bankability & Financial Durability:
With a levelized cost of electricity of $${dashboard.economics.lcoePerMwh}/MWh against an assumed wholesale PPA tariff of $${(dashboard.economics.assumptions.electricityTariffPerKwh * 1000).toFixed(0)}/MWh, the project yields a robust 25-year NPV of $${dashboard.economics.npv25Yr.toLocaleString()} and a payback period of ${dashboard.economics.paybackPeriodYrs} years. Carbon avoidance of ${dashboard.economics.co2ReductionTonsYr.toLocaleString()} tCO₂/yr represents significant additional optionality in voluntary carbon offset markets.`;

      return res.json({
        strategicMemo: fallbackMemo,
        provider: 'EcoGrid Deterministic Engineering Rule Engine v2.4',
        isLiveAi: false
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to generate strategic insight.' });
    }
  });

  // ==========================================
  // VITE & STATIC SERVING SETUP
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoGrid AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[EcoGrid AI] Server startup failure:', err);
});
