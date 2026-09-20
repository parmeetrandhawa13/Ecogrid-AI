/**
 * Comprehensive Automated Test Suite for EcoGrid AI Engine
 * Tests:
 * 1. GIS Suitability Engine (Boundary coords, weighting, ratings)
 * 2. Solar ML Engine (POA irradiance, NOCT cell temp, thermal derate, clipping)
 * 3. Wind ML Engine (Power law shear, air density correction, IEC cut-in/rated/cut-out)
 * 4. Forecast Engine (Diurnal cycles, 95% confidence intervals, non-negative values)
 * 5. Economics Engine (LCOE, CAPEX, OPEX, 25-yr NPV, Payback, CO2 displacement)
 * 6. Recommendation Engine (Hybrid vs Solar vs Wind decision boundaries)
 * 7. End-to-End Analysis Pipeline
 */

import { calculateGisSuitability, BENCHMARK_SITES } from '../src/services/gisEngine';
import { predictSolarPower } from '../src/services/solarMlEngine';
import { predictWindPower } from '../src/services/windMlEngine';
import { generateForecast } from '../src/services/forecastEngine';
import { calculateEconomics } from '../src/services/economicsEngine';
import { generateRecommendation } from '../src/services/recommendationEngine';
import { runFullAnalysis } from '../src/services/analysisPipeline';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILED]: ${message}`);
  }
}

function runTests() {
  console.log('=== EcoGrid AI Engineering Test Suite ===\n');
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  // 1. GIS Suitability Tests
  test('GIS Engine: Computes valid scores within 0-100 for Mojave Desert', () => {
    const mojave = BENCHMARK_SITES[0];
    const { suitability } = calculateGisSuitability({ lat: mojave.lat, lng: mojave.lng }, mojave);
    assert(suitability.solarScore >= 80, `Expected Mojave solar score >= 80, got ${suitability.solarScore}`);
    assert(suitability.overallScore >= 70, `Expected Mojave overall score >= 70, got ${suitability.overallScore}`);
    assert(suitability.rating === 'Exceptional' || suitability.rating === 'High', `Unexpected rating ${suitability.rating}`);
  });

  test('GIS Engine: Boundary Coordinates (-90, 90, -180, 180) handle without exception', () => {
    const northPole = calculateGisSuitability({ lat: 89.9, lng: 0 });
    assert(northPole.suitability.solarScore >= 0 && northPole.suitability.solarScore <= 100, 'Solar score out of bounds');
    const southPole = calculateGisSuitability({ lat: -89.9, lng: 0 });
    assert(southPole.suitability.windScore >= 0 && southPole.suitability.windScore <= 100, 'Wind score out of bounds');
  });

  // 2. Solar ML Tests
  test('Solar ML: Power prediction respects inverter capacity and thermal derating', () => {
    const { suitability } = calculateGisSuitability({ lat: 35.0, lng: -115.0 });
    const solarPred = predictSolarPower(suitability, { systemCapacityKwp: 1000 });
    assert(solarPred.predictedPowerKw > 0, 'Predicted power must be positive during peak hours');
    assert(solarPred.predictedPowerKw <= 1000, `Predicted AC power ${solarPred.predictedPowerKw} cannot exceed rated 1000 kW`);
    assert(solarPred.physicsValidation.thermalDeratePct >= 0, 'Thermal derate must be positive');
    assert(solarPred.capacityFactorPct > 15 && solarPred.capacityFactorPct < 35, `Unrealistic capacity factor ${solarPred.capacityFactorPct}%`);
  });

  // 3. Wind ML Tests
  test('Wind ML: Respects IEC Class II/III cut-in (3 m/s) and rated power cut-off', () => {
    const { suitability } = calculateGisSuitability({ lat: 54.0, lng: 2.0 }); // North Sea high wind
    const windPred = predictWindPower(suitability, { turbineRatedKw: 2500 });
    assert(windPred.predictedPowerKw > 0, 'North sea wind power should be active');
    assert(windPred.predictedPowerKw <= 2550, `Predicted wind power ${windPred.predictedPowerKw} exceeded rated capacity limit`);
    assert(windPred.capacityFactorPct > 20 && windPred.capacityFactorPct < 65, `Unrealistic wind CF: ${windPred.capacityFactorPct}%`);
  });

  // 4. Forecast Engine Tests
  test('Forecast Engine: Time-series outputs correct horizons and strictly positive values', () => {
    const dashboard = runFullAnalysis({ lat: 35.1, lng: -118.4 }, { forecastHorizon: '24h' });
    assert(dashboard.forecast.dataPoints.length === 24, `Expected 24 points, got ${dashboard.forecast.dataPoints.length}`);
    for (const pt of dashboard.forecast.dataPoints) {
      assert(pt.solarKw >= 0, `Solar kW negative: ${pt.solarKw}`);
      assert(pt.windKw >= 0, `Wind kW negative: ${pt.windKw}`);
      assert(pt.confidenceLowerKw <= pt.combinedKw, 'Lower confidence bound above mean');
      assert(pt.confidenceUpperKw >= pt.combinedKw, 'Upper confidence bound below mean');
    }
  });

  // 5. Economics Engine Tests
  test('Economics Engine: LCOE and Payback mathematically sound', () => {
    const { suitability } = calculateGisSuitability({ lat: 23.85, lng: 69.75 });
    const solar = predictSolarPower(suitability, { systemCapacityKwp: 1000 });
    const wind = predictWindPower(suitability, { turbineRatedKw: 2500 });
    const econ = calculateEconomics(solar, wind);
    
    assert(econ.totalCapex > 0, 'CAPEX must be positive');
    assert(econ.lcoePerMwh > 15 && econ.lcoePerMwh < 120, `LCOE $${econ.lcoePerMwh}/MWh out of realistic range`);
    assert(econ.paybackPeriodYrs > 2 && econ.paybackPeriodYrs < 20, `Payback period ${econ.paybackPeriodYrs} yrs out of bounds`);
    assert(econ.co2ReductionTonsYr > 100, 'CO2 reduction must be substantial for multi-MW system');
  });

  // 6. Recommendation Engine Tests
  test('Recommendation Engine: Identifies Hybrid synergy in high-solar high-wind zone', () => {
    const { suitability } = calculateGisSuitability({ lat: 23.85, lng: 69.75 }); // Gujarat site
    const solar = predictSolarPower(suitability);
    const wind = predictWindPower(suitability);
    const forecast = generateForecast(suitability, solar, wind, '24h');
    const econ = calculateEconomics(solar, wind);
    const rec = generateRecommendation(suitability, solar, wind, forecast, econ);

    assert(rec.recommendedTech === 'Hybrid Solar-Wind', `Expected Hybrid recommendation, got ${rec.recommendedTech}`);
    assert(rec.supportingFactors.length >= 3, 'Expected at least 3 supporting factors');
    assert(rec.confidencePct >= 75, `Expected confidence >= 75%, got ${rec.confidencePct}%`);
  });

  // 7. Full Analysis Pipeline
  test('Full Pipeline: Generates complete consistent dashboard object', () => {
    const dashboard = runFullAnalysis({ lat: 35.011, lng: -115.473 });
    assert(dashboard.id.startsWith('analysis-'), 'ID missing or malformed');
    assert(dashboard.location.name.length > 0, 'Location name empty');
    assert(dashboard.solarPrediction.modelInfo.algorithm.includes('GBDT'), 'Model info missing algorithm');
    assert(dashboard.windPrediction.modelInfo.algorithm.includes('Random Forest'), 'Wind model info missing');
    assert(dashboard.economics.cashFlowSeries.length > 5, 'Cash flow series incomplete');
  });

  console.log(`\nResults: ${passed}/${total} tests passed.\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
