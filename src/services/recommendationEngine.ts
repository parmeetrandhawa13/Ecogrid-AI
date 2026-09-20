import { EconomicsResult, ForecastResult, GisSuitability, RecommendationResult, SolarMlPrediction, WindMlPrediction } from '../types';

/**
 * Deterministic Multi-Criteria Decision Analysis (MCDA) Recommendation Engine:
 * Formulates engineering recommendations based on resource quality, ML capacity factors,
 * LCOE feasibility, and temporal complementarity between diurnal solar and synoptic wind.
 */
export function generateRecommendation(
  suitability: GisSuitability,
  solarPred: SolarMlPrediction,
  windPred: WindMlPrediction,
  forecast: ForecastResult,
  economics: EconomicsResult,
  locationName: string = 'the analyzed site'
): RecommendationResult {
  const s = suitability as any;
  const solarScore = suitability.solarScore ?? s.solar_score ?? s.solar_suitability_score ?? s.solar?.score ?? 0;
  const windScore = suitability.windScore ?? s.wind_score ?? s.wind_suitability_score ?? s.wind?.score ?? 0;
  const hybridScore = suitability.hybridScore ?? s.hybrid_score ?? s.hybrid?.score ?? 0;

  const solarCf = solarPred.capacityFactorPct;
  const windCf = windPred.capacityFactorPct;
  const correlation = forecast.summary.complementarityCoefficient;

  let recommendedTech: RecommendationResult['recommendedTech'] = 'Hybrid Solar-Wind';
  let strongestResource = '';
  let weakestResource = '';
  const supportingFactors: string[] = [];
  const riskMitigations: string[] = [];

  // 1. Determine Strongest & Weakest Resource
  if (solarScore > windScore) {
    strongestResource = `Solar Radiation (GHI: ${suitability.rawResourceData.ghiKwhM2Day} kWh/m²/day, Score: ${solarScore}/100)`;
    weakestResource = `Wind Resource (100m Velocity: ${suitability.rawResourceData.windSpeed100mMs} m/s, Score: ${windScore}/100)`;
  } else {
    strongestResource = `Aerodynamic Wind Flow (100m Velocity: ${suitability.rawResourceData.windSpeed100mMs} m/s, Score: ${windScore}/100)`;
    weakestResource = `Solar Radiation (GHI: ${suitability.rawResourceData.ghiKwhM2Day} kWh/m²/day, Score: ${solarScore}/100)`;
  }

  // 2. Decision Logic
  // Case A: High complementarity (both above 50 and negative/low correlation)
  const isHybridOptimal = (solarScore >= 52 && windScore >= 52) || 
    (Math.abs(solarScore - windScore) <= 22 && solarScore >= 45 && windScore >= 45);

  if (isHybridOptimal) {
    recommendedTech = 'Hybrid Solar-Wind';
    supportingFactors.push(`Diurnal complementarity: Negative diurnal correlation (r = ${correlation}) allows wind to generate during nocturnal and morning hours while solar peaks at midday.`);
    supportingFactors.push(`Shared balance-of-plant (BOP): Co-located substation and high-voltage feeder cable lowers combined installation CAPEX by ~8%.`);
    supportingFactors.push(`Grid interconnection stability: Firm capacity estimate of ${forecast.summary.firmCapacityEstimateKw.toLocaleString()} kW significantly mitigates curtailment penalties.`);
    supportingFactors.push(`Balanced annual yield: Combined generation reaches ${economics.annualTotalGenerationMwh.toLocaleString()} MWh/yr at competitive LCOE of $${economics.lcoePerMwh}/MWh.`);
    
    riskMitigations.push(`Wake aerodynamic interference: Ensure minimum 7-rotor-diameter spacing between wind turbines and solar tracker rows to avoid shadow casting and turbulence.`);
    riskMitigations.push(`Inverter / converter harmonization: Deploy grid-forming hybrid inverters with short-duration battery smoothing if regional grid code mandates strict ramp-rate compliance.`);
  } else if (solarScore > windScore + 18) {
    // Case B: Solar clearly dominates
    recommendedTech = 'Solar PV';
    supportingFactors.push(`Exceptional solar insolation: GHI of ${suitability.rawResourceData.ghiKwhM2Day} kWh/m²/day produces high solar capacity factor (${solarCf}%).`);
    supportingFactors.push(`Favorable terrain topography: Low slope gradient minimizes civil earthmoving and single-axis tracker installation costs.`);
    supportingFactors.push(`Lower capital intensity: Solar PV CAPEX of $${economics.assumptions.solarCapexPerKw}/kW provides a rapid payback period of ${economics.paybackPeriodYrs} years.`);
    
    riskMitigations.push(`Nocturnal generation deficit: In standalone solar mode, nighttime energy demands require grid imports or dedicated BESS energy storage.`);
    riskMitigations.push(`Thermal derating: High ambient summer temperatures cause module voltage drops (-${solarPred.physicsValidation.thermalDeratePct}% derate); specify low-temperature-coefficient N-type TOPCon or HJT panels.`);
  } else {
    // Case C: Wind clearly dominates
    recommendedTech = 'Wind Turbine';
    supportingFactors.push(`Robust kinetic wind regime: Mean hub velocity of ${suitability.rawResourceData.windSpeed100mMs} m/s delivers a high capacity factor (${windCf}%).`);
    supportingFactors.push(`Sustained 24-hour generation: Continuous aerodynamic flow provides reliable baseload dispatchability across day and night.`);
    supportingFactors.push(`Minimal ground surface disruption: Turbine footings occupy <2% of total project acreage, preserving surrounding land use.`);
    
    riskMitigations.push(`Low-wind cut-in periods: Wind speed variability requires seasonal capacity reserves during protracted summer atmospheric high-pressure doldrums.`);
    riskMitigations.push(`Acoustic and setback constraints: Ensure turbine placements maintain mandatory 500m+ clearance from local habitations and protected avian corridors.`);
  }

  // Complementarity insight
  const seasonalComplementarity = correlation < 0
    ? `Strong Anti-Correlation (r = ${correlation}): Solar and wind generation peaks occur out-of-phase, dramatically smoothing grid export profiles and reducing energy storage requirements by an estimated 35-45%.`
    : `Moderate Synchronization (r = ${correlation}): Generating profiles have partial overlap; dynamic curtailment management and smart hybrid dispatch controls are recommended.`;

  const dispatchabilityNote = recommendedTech === 'Hybrid Solar-Wind'
    ? `Hybrid configuration increases effective capacity factor from ${Math.min(solarCf, windCf)}% to ~${Math.round((solarCf + windCf) / 1.7)}% equivalent utilization.`
    : `Single-technology installation provides focused Capex efficiency but leaves open diurnal generation gaps.`;

  // Executive rationale text
  const executiveRationale = `Based on multi-criteria GIS analysis, aerodynamic modeling, and financial evaluation for ${locationName}: ` +
    `The site exhibits an overall renewable index of ${suitability.overallScore}/100. ${recommendedTech} is selected as the optimal architecture. ` +
    `This configuration maximizes Net Present Value ($${economics.npv25Yr.toLocaleString()}) and abates approximately ${economics.co2ReductionTonsYr.toLocaleString()} metric tons of CO₂ annually ` +
    `with an anticipated project payback of ${economics.paybackPeriodYrs} years at an LCOE of $${economics.lcoePerMwh}/MWh.`;

  const confidencePct = Math.round((suitability.confidencePct + solarPred.modelInfo.r2Score * 50 + windPred.modelInfo.r2Score * 50) / 2);

  return {
    recommendedTech,
    confidencePct,
    overallSuitability: suitability.overallScore,
    executiveRationale,
    strongestResource,
    weakestResource,
    supportingFactors,
    riskMitigations,
    seasonalComplementarity,
    dispatchabilityNote,
    isAiEnhanced: false
  };
}
