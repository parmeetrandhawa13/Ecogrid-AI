# EcoGrid AI — System Architecture & Design Specification

## 1. High-Level Architectural Overview

EcoGrid AI is an enterprise-grade full-stack platform for renewable energy prospecting, GIS multi-criteria suitability analysis, physics-informed machine learning power prediction, diurnal forecasting, and discounted cash flow (DCF) financial appraisal.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (React 18)                         │
│  Interactive Leaflet Map   │   Technical Inspector   │   Comparison Modal   │
│  - CartoDB / Mapbox Tiles  │   - Solar / Wind Tabs   │   - Benchmark Sites  │
│  - OpenStreetMap Geocoding │   - Economics & ROI     │   - Multi-Site Radar │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST JSON
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                         BACKEND APPLICATION LAYER                           │
│  API Gateway / Router (server.ts)                                           │
│  ├── /api/geocoding (Forward & Reverse OSM/Mapbox Geocoding)                │
│  ├── /api/suitability (MCDA Topographic & Resource Engine)                  │
│  ├── /api/ml/solar & /api/ml/wind (Physics-Informed GBDT & Random Forest)   │
│  ├── /api/forecast (Perez Irradiance & Weibull Boundary Layer Baseline)     │
│  ├── /api/economics (25-Yr DCF, WACC, LCOE, NPV, Payback)                   │
│  └── /api/locations (Project Repository & Persistence)                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            DATA & STORAGE LAYER                             │
│  PostgreSQL 16 (Connection Pool) / Local Persistent Atomic Storage           │
│  ├── Projects Table (Spatial Coordinates, MCDA Scores, Financial JSONB)    │
│  └── Users Table (PBKDF2 Hashing, Scoped Session Tokens)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Core Architectural Patterns

1. **Clean Service-Oriented Architecture**:
   - `services/`: Encapsulates pure domain logic and scientific calculations.
   - `repositories/`: Abstracted data access layer providing seamless switching between PostgreSQL and resilient file-backed storage.
   - `controllers/routes`: Request validation and serialization in `server.ts`.

2. **Zero Fabricated Telemetry**:
   - GIS suitability calculations use real physical formulas (solar geometry, barometric pressure formulas, Hellmann power law).
   - Real forward/reverse geocoding connects to OpenStreetMap Nominatim and Mapbox.
   - Real elevation connects to Open-Meteo SRTM DEM services.
   - ML models report verified evaluation metrics ($R^2$, MAE, RMSE) from historical training on NREL NSRDB and WIND Toolkit datasets.

3. **High-Performance Bundling & Deployment**:
   - Client is compiled with Vite.
   - Backend TypeScript server is bundled into `dist/server.cjs` via `esbuild` with `--packages=external`.
