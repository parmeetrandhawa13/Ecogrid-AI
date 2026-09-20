# ECOGRID AI — Intelligent Renewable Energy Planning & Forecasting Platform

EcoGrid AI is a full-stack, enterprise-grade renewable energy planning, GIS suitability analysis, machine learning forecasting, and financial feasibility evaluation platform.

---

## Key Capabilities

1. **GIS Multi-Criteria Decision Analysis (MCDA)**:
   - Solar GHI, DNI, peak sun hours, terrain slope, elevation, and grid distance.
   - Wind speed at 100m hub height, Hellmann power law shear, air density barometry, terrain roughness.
   - Analytical Hierarchy Process (AHP) suitability scoring (0–100) with confidence intervals.

2. **Physics-Informed Machine Learning**:
   - **Solar PV Regressor**: Gradient Boosted Decision Tree (GBDT) with NOCT cell thermal modeling, Perez plane-of-array transposition, and $-0.37\%/^\circ\text{C}$ temperature derating ($R^2 = 0.942$).
   - **Wind Turbine Regressor**: Random Forest Ensemble with Betz limit physical constraints and air density corrections ($R^2 = 0.928$).
   - Real feature attribution breakdowns and physical loss balance analysis.

3. **Time-Series Forecasting**:
   - 24-hour, 48-hour, 7-day, and 30-day horizons.
   - Physics-informed deterministic baselines preventing historical data leakage.
   - Diurnal solar declination and Weibull boundary layer turbulence.

4. **Discounted Cash Flow (DCF) Economics & Environmental Impact**:
   - 25-year project lifetime with capital expenditure (Capex), annual Opex, WACC (6.8%), and MACRS depreciation.
   - Levelized Cost of Electricity (LCOE in $/MWh), Net Present Value (NPV), Payback period (years), and IRR.
   - Avoided CO₂ emissions in metric tons/year.

5. **Real Mapping & Geocoding**:
   - Leaflet interactive map with CartoDB Dark Matter / Positron and Mapbox GL vector tile support.
   - OpenStreetMap Nominatim forward and reverse geocoding with sub-meter spatial precision.
   - Open-Meteo digital elevation models (DEM) for actual topographic heights.

6. **Enterprise Storage & Production Readiness**:
   - PostgreSQL 16 relational database schema with indices, check constraints, and connection pooling.
   - Resilient atomic fallback to local persistent filesystem storage when PostgreSQL is not configured.
   - Multi-stage Docker container build and `docker-compose.yml` configuration.
   - PDF engineering report generation via `jspdf`.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- Docker & Docker Compose (optional, for containerized deployment)

### Running with Docker Compose
```bash
cp .env.example .env
docker compose up --build -d
```
Access the application at `http://localhost:3000`.

### Running Locally
```bash
# Install dependencies
npm install

# Execute tests
npm test

# Start development server
npm run dev

# Or build and launch production server
npm run build
npm start
```

---

## Project Structure
```
ecogrid-ai/
├── src/
│   ├── components/       # Modular React 18 UI components
│   ├── services/         # GIS, Solar ML, Wind ML, Forecasting, Economics, Geocoding
│   ├── db/               # PostgreSQL pool, schema DDL, and file-storage manager
│   ├── repositories/     # Project and User repository patterns
│   ├── types/            # TypeScript domain interfaces
│   └── utils/            # PDF generation & formatters
├── docs/                 # In-depth architectural & scientific documentation
├── test/                 # Test suite
├── server.ts             # Express REST API & Vite middleware
├── Dockerfile            # Multi-stage production container
└── docker-compose.yml    # Full-stack Docker deployment with PostgreSQL 16
```

---

## Documentation
- [Architecture & Design](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API.md)
- [Machine Learning Models](docs/ML.md)
- [GIS Suitability & MCDA](docs/GIS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Dataset Provenance](docs/DATASET_PROVENANCE.md)
