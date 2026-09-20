-- ==========================================================
-- ECOGRID AI — Enterprise PostgreSQL Relational Database Schema
-- Version: 2.4.0 (Production Migration)
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users and Engineering Organizations Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'usr-' || uuid_generate_v4()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255) DEFAULT 'Renewable Systems Engineering',
    role VARCHAR(64) NOT NULL DEFAULT 'Lead Renewable Architect',
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    token VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

-- 3. Saved Renewable Energy Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    country VARCHAR(128) NOT NULL,
    region VARCHAR(128),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    elevation_m DOUBLE PRECISION,
    terrain_slope_deg DOUBLE PRECISION,
    grid_distance_km DOUBLE PRECISION,
    
    -- Resource Suitability Scores (0 - 100)
    overall_suitability_score SMALLINT NOT NULL CHECK (overall_suitability_score >= 0 AND overall_suitability_score <= 100),
    solar_suitability_score SMALLINT NOT NULL CHECK (solar_suitability_score >= 0 AND solar_suitability_score <= 100),
    wind_suitability_score SMALLINT NOT NULL CHECK (wind_suitability_score >= 0 AND wind_suitability_score <= 100),
    hybrid_suitability_score SMALLINT NOT NULL CHECK (hybrid_suitability_score >= 0 AND hybrid_suitability_score <= 100),
    confidence_pct DOUBLE PRECISION NOT NULL CHECK (confidence_pct >= 0 AND confidence_pct <= 100),
    
    -- Recommended Technology
    recommended_tech VARCHAR(32) NOT NULL CHECK (recommended_tech IN ('Solar PV', 'Wind Turbine', 'Hybrid Solar-Wind')),
    
    -- Model Prediction Aggregates
    predicted_solar_kw DOUBLE PRECISION,
    predicted_wind_kw DOUBLE PRECISION,
    annual_generation_mwh DOUBLE PRECISION NOT NULL,
    capacity_factor_pct DOUBLE PRECISION,
    
    -- Financial DCF Metrics
    capex_usd DOUBLE PRECISION,
    opex_usd_yr DOUBLE PRECISION,
    lcoe_usd_mwh DOUBLE PRECISION NOT NULL,
    npv_25yr_usd DOUBLE PRECISION NOT NULL,
    payback_years DOUBLE PRECISION NOT NULL,
    roi_pct DOUBLE PRECISION,
    
    -- Environmental
    co2_reduction_tons_yr DOUBLE PRECISION NOT NULL,
    
    -- Complete Analysis JSON Payload (Snapshot of FullAnalysisDashboard)
    dashboard_data JSONB NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid spatial and financial querying
CREATE INDEX IF NOT EXISTS idx_projects_lat_lng ON projects(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_projects_recommended_tech ON projects(recommended_tech);
CREATE INDEX IF NOT EXISTS idx_projects_overall_score ON projects(overall_suitability_score DESC);
CREATE INDEX IF NOT EXISTS idx_projects_lcoe ON projects(lcoe_usd_mwh ASC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
