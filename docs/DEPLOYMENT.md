# EcoGrid AI — Production Deployment Guide

## 1. Local & Containerized Setup via Docker Compose

EcoGrid AI includes full production Docker configurations with PostgreSQL 16:

```bash
# 1. Clone or navigate to the repository
cd ecogrid-ai

# 2. Copy environment template
cp .env.example .env

# 3. Spin up full application stack with PostgreSQL
docker compose up --build -d

# 4. Verify system health
curl http://localhost:3000/health
```

The stack exposes:
- **Web UI & API**: `http://localhost:3000`
- **PostgreSQL Database**: `localhost:5432`

---

## 2. Standalone Node.js Execution

```bash
# Install dependencies
npm install

# Run automated engineering test suite
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

---

## 3. Cloud Deployment (GCP Cloud Run / Render / Railway)

- **Environment Variables**:
  - `DATABASE_URL`: Connection string to hosted PostgreSQL instance (e.g. `postgresql://user:pass@host:5432/dbname?sslmode=require`).
  - `PORT`: Set automatically by container environment (defaults to `3000`).
  - `GEMINI_API_KEY`: (Optional) For AI executive synthesis.
  - `VITE_MAPBOX_TOKEN`: (Optional) For Mapbox vector tiles.
- **Health Check Endpoint**:
  - Path: `/health` or `/api/health`
  - Expected Status: `200 OK`
