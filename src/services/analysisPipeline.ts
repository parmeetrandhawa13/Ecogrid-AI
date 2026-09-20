import { calculateEconomics } from './economicsEngine';
import { generateForecast } from './forecastEngine';
import { calculateGisSuitability } from './gisEngine';
import { generateRecommendation } from './recommendationEngine';
import { predictSolarPower, SolarMlInputOptions } from './solarMlEngine';
import { predictWindPower, WindMlInputOptions } from './windMlEngine';
import { Coordinates, EconomicAssumptions, FullAnalysisDashboard, LocationInfo } from '../types';

export interface AnalysisPipelineOptions {
  locationOverride?: Partial<LocationInfo>;
  solarOptions?: SolarMlInputOptions;
  windOptions?: WindMlInputOptions;
  economicAssumptions?: Partial<EconomicAssumptions>;
  forecastHorizon?: '24h' | '7d' | '30d' | '12m';
}

export function runFullAnalysis(
  coords: Coordinates,
  options?: AnalysisPipelineOptions
): FullAnalysisDashboard {
  // Step 1: GIS Suitability
  const { location, suitability } = calculateGisSuitability(coords, options?.locationOverride);

  // Step 2: Solar ML Prediction
  const solarPrediction = predictSolarPower(suitability, options?.solarOptions);

  // Step 3: Wind ML Prediction
  const windPrediction = predictWindPower(suitability, options?.windOptions);

  // Step 4: Time-Series Forecast
  const forecast = generateForecast(
    suitability,
    solarPrediction,
    windPrediction,
    options?.forecastHorizon ?? '24h'
  );

  // Step 5: Economics & Carbon Accounting
  const economics = calculateEconomics(
    solarPrediction,
    windPrediction,
    options?.economicAssumptions
  );

  // Step 6: Recommendation Engine
  const recommendation = generateRecommendation(
    suitability,
    solarPrediction,
    windPrediction,
    forecast,
    economics,
    location.name
  );

  const id = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    timestamp: new Date().toISOString(),
    location,
    suitability,
    solarPrediction,
    windPrediction,
    forecast,
    economics,
    recommendation
  };
}
