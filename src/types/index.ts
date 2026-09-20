export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  id?: string;
  name: string;
  country: string;
  region?: string;
  lat: number;
  lng: number;
  elevationM: number;
  terrainSlopeDeg: number;
  landCover: string;
  gridDistanceKm: number;
}

export interface GisSuitability {
  overallScore: number; // 0 - 100
  solarScore: number;   // 0 - 100
  windScore: number;    // 0 - 100
  hybridScore: number;  // 0 - 100
  // Interoperability and schema aliases (snake_case and nested structures)
  overall_score?: number;
  solar_score?: number;
  wind_score?: number;
  hybrid_score?: number;
  solar_suitability_score?: number;
  wind_suitability_score?: number;
  solar?: { score: number; resource?: number };
  wind?: { score: number; resource?: number };
  hybrid?: { score: number };
  rating: 'Exceptional' | 'High' | 'Moderate' | 'Marginal' | 'Unsuitable';
  confidencePct: number;
  explanation: string;
  contributingFactors: {
    name: string;
    score: number;
    weightPct: number;
    impact: 'Positive' | 'Neutral' | 'Negative';
    description: string;
    measuredValue: string;
  }[];
  rawResourceData: {
    ghiKwhM2Day: number;
    dniKwhM2Day: number;
    windSpeed100mMs: number;
    windSpeed50mMs: number;
    airDensityKgM3: number;
    terrainRoughnessZ0: number;
    solarPeakSunHours: number;
    gridInterconnectionRating: string;
    dataSource: string;
  };
}

export interface SolarMlPrediction {
  predictedPowerKw: number;
  ratedCapacityKwp: number;
  capacityFactorPct: number;
  annualGenerationMwh: number;
  modelInfo: {
    name: string;
    version: string;
    algorithm: string;
    trainingDataset: string;
    r2Score: number;
    maeKw: number;
    rmseKw: number;
  };
  inputFeatures: {
    ghiKwhM2Day: number;
    dniKwhM2Day: number;
    ambientTempC: number;
    estimatedCellTempC: number;
    panelTiltDeg: number;
    panelAzimuthDeg: number;
    systemCapacityKwp: number;
    inverterEfficiencyPct: number;
    soilingLossPct: number;
  };
  featureContributions: {
    feature: string;
    value: string;
    contributionPct: number;
    impact: 'Increase' | 'Decrease' | 'Neutral';
    description: string;
  }[];
  physicsValidation: {
    theoreticalMaxKw: number;
    thermalDeratePct: number;
    systemLossesPct: number;
  };
}

export interface WindMlPrediction {
  predictedPowerKw: number;
  ratedCapacityKw: number;
  capacityFactorPct: number;
  annualGenerationMwh: number;
  modelInfo: {
    name: string;
    version: string;
    algorithm: string;
    trainingDataset: string;
    r2Score: number;
    maeKw: number;
    rmseKw: number;
  };
  inputFeatures: {
    windSpeed100mMs: number;
    windSpeed50mMs: number;
    airDensityKgM3: number;
    roughnessLengthZ0: number;
    hubHeightM: number;
    weibullShapeK: number;
    weibullScaleC: number;
    turbineRatedKw: number;
    rotorDiameterM: number;
  };
  featureContributions: {
    feature: string;
    value: string;
    contributionPct: number;
    impact: 'Increase' | 'Decrease' | 'Neutral';
    description: string;
  }[];
  powerCurveMetrics: {
    cutInSpeedMs: number;
    ratedSpeedMs: number;
    cutOutSpeedMs: number;
    sweptAreaM2: number;
  };
}

export interface ForecastPoint {
  timestamp: string;
  label: string;
  solarKw: number;
  windKw: number;
  combinedKw: number;
  confidenceLowerKw: number;
  confidenceUpperKw: number;
  ghi?: number;
  windSpeed?: number;
}

export type ForecastHorizon = '24h' | '7d' | '30d' | '12m';

export interface ForecastResult {
  horizon: ForecastHorizon;
  methodology: string;
  isBaseline: boolean;
  dataPoints: ForecastPoint[];
  summary: {
    peakCombinedKw: number;
    meanCombinedKw: number;
    firmCapacityEstimateKw: number;
    curtailmentRiskPct: number;
    complementarityCoefficient: number; // correlation between solar and wind (-1 to 1)
  };
}

export interface EconomicAssumptions {
  solarCapacityKwp: number;
  windCapacityKw: number;
  solarCapexPerKw: number;
  windCapexPerKw: number;
  solarOpexPerKwYr: number;
  windOpexPerKwYr: number;
  electricityTariffPerKwh: number;
  discountRatePct: number;
  projectLifespanYrs: number;
  gridCarbonIntensityKgPerMwh: number; // e.g. 450 kg CO2 / MWh
}

export interface EconomicsResult {
  assumptions: EconomicAssumptions;
  solarCapex: number;
  windCapex: number;
  totalCapex: number;
  annualOpex: number;
  annualSolarGenerationMwh: number;
  annualWindGenerationMwh: number;
  annualTotalGenerationMwh: number;
  annualRevenue: number;
  annualNetCashFlow: number;
  lcoePerMwh: number;
  paybackPeriodYrs: number;
  roiPct: number;
  npv25Yr: number;
  co2ReductionTonsYr: number;
  equivalentCarsRemoved: number;
  equivalentTreesPlanted: number;
  cashFlowSeries: {
    year: number;
    revenue: number;
    opex: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
  }[];
  disclosedAssumptions: string[];
}

export interface RecommendationResult {
  recommendedTech: 'Solar PV' | 'Wind Turbine' | 'Hybrid Solar-Wind';
  confidencePct: number;
  overallSuitability: number;
  executiveRationale: string;
  strongestResource: string;
  weakestResource: string;
  supportingFactors: string[];
  riskMitigations: string[];
  seasonalComplementarity: string;
  dispatchabilityNote: string;
  isAiEnhanced?: boolean;
}

export interface FullAnalysisDashboard {
  id: string;
  timestamp: string;
  location: LocationInfo;
  suitability: GisSuitability;
  solarPrediction: SolarMlPrediction;
  windPrediction: WindMlPrediction;
  forecast: ForecastResult;
  economics: EconomicsResult;
  recommendation: RecommendationResult;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role: 'Lead Renewable Architect' | 'Financial Analyst' | 'GIS Specialist' | 'Academic Researcher' | 'engineer' | 'planner' | 'executive' | string;
  provider?: 'google' | 'sso' | 'credentials' | 'demo';
  avatarUrl?: string;
}

export interface SavedAnalysis {
  id: string;
  name: string;
  locationName: string;
  country: string;
  lat: number;
  lng: number;
  overallScore: number;
  recommendedTech: string;
  annualMwh: number;
  lcoePerMwh: number;
  createdAt: string;
  dashboard?: FullAnalysisDashboard;
}
