# EcoGrid AI — REST API Documentation

## 1. System Health & Diagnostics

### `GET /health` or `GET /api/health`
Returns system status, active database backend, map provider, and timestamp.
```json
{
  "status": "healthy",
  "service": "EcoGrid AI Engine",
  "version": "2.4.0",
  "database": {
    "type": "postgres",
    "connected": true
  },
  "mapProvider": "OpenStreetMap / CartoDB Dark Matter",
  "timestamp": "2026-09-14T15:30:00.000Z"
}
```

## 2. Geocoding & Elevation

### `GET /api/geocoding/forward?q={query}`
Resolves addresses, cities, countries, or coordinates into physical locations.
**Response**:
```json
{
  "results": [
    {
      "name": "Mojave Desert",
      "country": "United States",
      "region": "California",
      "lat": 35.011,
      "lng": -115.473,
      "displayName": "Mojave National Preserve, San Bernardino County, California, United States"
    }
  ]
}
```

### `GET /api/geocoding/reverse?lat={lat}&lng={lng}`
Resolves exact coordinates to administrative region and place name.

## 3. Analysis & Inference

### `POST /api/planning/dashboard`
Executes complete engineering pipeline for a target site.
**Request**:
```json
{
  "coords": { "lat": 35.011, "lng": -115.473 },
  "options": {
    "systemCapacityKwp": 1000,
    "panelTiltDeg": 25,
    "turbineRatedKw": 2500,
    "turbineHubHeightM": 100
  }
}
```

### `POST /api/suitability/analyze`
Computes MCDA scores (GHI, DNI, Wind Speed, Slope, Air Density, Grid Distance).

### `POST /api/ml/solar` & `POST /api/ml/wind`
Executes Physics-Informed ML regressions for hourly power output, capacity factor, and annual MWh.

### `POST /api/forecast`
Generates 24h, 48h, 7d, or 30d time-series forecasts for solar and wind generation.

### `POST /api/economics`
Computes 25-year discounted cash flow (DCF), LCOE ($/MWh), NPV ($), Payback period, and CO₂ avoidance.

## 4. Project Persistence & Portfolio

### `GET /api/locations`
Fetches benchmark sites and user saved projects.

### `POST /api/locations/save`
Persists complete site analysis to PostgreSQL or durable storage.

### `DELETE /api/locations/:id`
Deletes saved project by ID.
