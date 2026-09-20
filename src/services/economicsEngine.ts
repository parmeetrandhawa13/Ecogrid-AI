import { EconomicAssumptions, EconomicsResult, SolarMlPrediction, WindMlPrediction } from '../types';

export const DEFAULT_ECONOMIC_ASSUMPTIONS: EconomicAssumptions = {
  solarCapacityKwp: 1000,          // 1,000 kWp (1 MWp)
  windCapacityKw: 2500,            // 2,500 kW (2.5 MW)
  solarCapexPerKw: 920,            // $920/kW installed (NREL benchmark)
  windCapexPerKw: 1350,            // $1,350/kW installed (onshore utility scale)
  solarOpexPerKwYr: 15,            // $15/kW/yr O&M
  windOpexPerKwYr: 38,             // $38/kW/yr O&M
  electricityTariffPerKwh: 0.085,  // $0.085/kWh wholesale PPA rate
  discountRatePct: 6.5,            // 6.5% weighted average cost of capital (WACC)
  projectLifespanYrs: 25,          // 25-year financial modeling horizon
  gridCarbonIntensityKgPerMwh: 420 // 420 kg CO2/MWh (average regional grid offset)
};

/**
 * Calculates project-level financial and environmental metrics using standard LCOE, NPV,
 * and discounted cash flow methodology.
 */
export function calculateEconomics(
  solarPred: SolarMlPrediction,
  windPred: WindMlPrediction,
  userAssumptions?: Partial<EconomicAssumptions>
): EconomicsResult {
  const assumptions: EconomicAssumptions = {
    ...DEFAULT_ECONOMIC_ASSUMPTIONS,
    solarCapacityKwp: solarPred.ratedCapacityKwp,
    windCapacityKw: windPred.ratedCapacityKw,
    ...userAssumptions
  };

  // Capital Expenditure (CAPEX)
  const solarCapex = assumptions.solarCapacityKwp * assumptions.solarCapexPerKw;
  const windCapex = assumptions.windCapacityKw * assumptions.windCapexPerKw;
  // Shared Balance of Plant (BOP) and grid interconnection savings in hybrid setup (-8% synergy)
  const hybridBopSynergy = (assumptions.solarCapacityKwp > 0 && assumptions.windCapacityKw > 0) ? 0.92 : 1.0;
  const totalCapex = Math.round((solarCapex + windCapex) * hybridBopSynergy);

  // Operational Expenditure (OPEX / year)
  const solarOpex = assumptions.solarCapacityKwp * assumptions.solarOpexPerKwYr;
  const windOpex = assumptions.windCapacityKw * assumptions.windOpexPerKwYr;
  const annualOpex = Math.round(solarOpex + windOpex);

  // Annual Generation (MWh)
  const annualSolarGenerationMwh = Number(solarPred.annualGenerationMwh.toFixed(1));
  const annualWindGenerationMwh = Number(windPred.annualGenerationMwh.toFixed(1));
  const annualTotalGenerationMwh = Number((annualSolarGenerationMwh + annualWindGenerationMwh).toFixed(1));

  // Annual Revenue = Total MWh * 1000 kWh/MWh * Tariff $/kWh
  const annualRevenue = Math.round(annualTotalGenerationMwh * 1000 * assumptions.electricityTariffPerKwh);
  const annualNetCashFlow = annualRevenue - annualOpex;

  // Discounted Cash Flow and Levelized Cost of Electricity (LCOE)
  // LCOE = (CAPEX + Sum(OPEX_t / (1+r)^t)) / Sum(Energy_t / (1+r)^t)
  const r = assumptions.discountRatePct / 100;
  const n = assumptions.projectLifespanYrs;

  let discountedOpexSum = 0;
  let discountedEnergyMwhSum = 0;
  let discountedCashFlowSum = 0;

  const cashFlowSeries: EconomicsResult['cashFlowSeries'] = [];
  let cumulativeCashFlow = -totalCapex;
  let paybackPeriodYrs = -1;

  cashFlowSeries.push({
    year: 0,
    revenue: 0,
    opex: 0,
    netCashFlow: -totalCapex,
    cumulativeCashFlow
  });

  for (let year = 1; year <= n; year++) {
    // Degradation rate: 0.5%/yr for solar, 0.4%/yr for wind
    const solarDegrade = Math.pow(1 - 0.005, year - 1);
    const windDegrade = Math.pow(1 - 0.004, year - 1);
    const yearGenerationMwh = (annualSolarGenerationMwh * solarDegrade) + (annualWindGenerationMwh * windDegrade);

    // Inflation rate on OPEX: 2.0%/yr
    const inflation = Math.pow(1 + 0.02, year - 1);
    const yearOpex = annualOpex * inflation;
    const yearRevenue = yearGenerationMwh * 1000 * assumptions.electricityTariffPerKwh;
    const yearNet = yearRevenue - yearOpex;

    const discountFactor = Math.pow(1 + r, year);
    discountedOpexSum += yearOpex / discountFactor;
    discountedEnergyMwhSum += yearGenerationMwh / discountFactor;
    discountedCashFlowSum += yearNet / discountFactor;

    cumulativeCashFlow += yearNet;

    // Check simple payback crossing
    if (paybackPeriodYrs === -1 && cumulativeCashFlow >= 0) {
      const prevCumulative = cumulativeCashFlow - yearNet;
      const fraction = Math.abs(prevCumulative) / yearNet;
      paybackPeriodYrs = Number(((year - 1) + fraction).toFixed(1));
    }

    if (year <= 10 || year === 15 || year === 20 || year === 25) {
      cashFlowSeries.push({
        year,
        revenue: Math.round(yearRevenue),
        opex: Math.round(yearOpex),
        netCashFlow: Math.round(yearNet),
        cumulativeCashFlow: Math.round(cumulativeCashFlow)
      });
    }
  }

  if (paybackPeriodYrs === -1) {
    paybackPeriodYrs = Number((totalCapex / Math.max(1, annualNetCashFlow)).toFixed(1));
  }

  // Net Present Value (NPV)
  const npv25Yr = Math.round(discountedCashFlowSum - totalCapex);

  // Levelized Cost of Electricity ($/MWh)
  const lcoePerMwh = Number(((totalCapex + discountedOpexSum) / Math.max(1, discountedEnergyMwhSum)).toFixed(2));

  // Return on Investment (ROI %) = (Total Net Undiscounted Gain / CAPEX) * 100
  const totalUndiscountedNetProfit = (annualNetCashFlow * n) - totalCapex;
  const roiPct = Number(((totalUndiscountedNetProfit / totalCapex) * 100).toFixed(1));

  // Environmental Metrics (CO2 displacement)
  // CO2 avoided = Generation MWh * Grid emission factor (kg/MWh) / 1000 (kg/ton)
  const co2ReductionTonsYr = Math.round((annualTotalGenerationMwh * assumptions.gridCarbonIntensityKgPerMwh) / 1000);
  // Average passenger vehicle emits ~4.6 metric tons CO2 / year
  const equivalentCarsRemoved = Math.round(co2ReductionTonsYr / 4.6);
  // Mature tree absorbs ~0.022 tons (22 kg) CO2 / year
  const equivalentTreesPlanted = Math.round(co2ReductionTonsYr / 0.022);

  const disclosedAssumptions = [
    `Solar CAPEX estimated at $${assumptions.solarCapexPerKw}/kW; Wind CAPEX estimated at $${assumptions.windCapexPerKw}/kW (includes EPC, civil foundations, and grid substation).`,
    `Hybrid Balance-of-Plant (BOP) 8% capital synergy applied for shared high-voltage interconnection and access roads.`,
    `Annual OPEX: Solar $${assumptions.solarOpexPerKwYr}/kW-yr; Wind $${assumptions.windOpexPerKwYr}/kW-yr (includes scheduled maintenance, insurance, and land lease).`,
    `Wholesale Power Purchase Agreement (PPA) rate: $${assumptions.electricityTariffPerKwh}/kWh ($${(assumptions.electricityTariffPerKwh * 1000).toFixed(0)}/MWh).`,
    `Discount rate / WACC: ${assumptions.discountRatePct}% across a ${assumptions.projectLifespanYrs}-year operational lifecycle with 2.0% inflation and PV/Wind degradation rates.`,
    `Regional grid displacement factor: ${assumptions.gridCarbonIntensityKgPerMwh} kg CO₂e/MWh offset based on local marginal emissions.`
  ];

  return {
    assumptions,
    solarCapex,
    windCapex,
    totalCapex,
    annualOpex,
    annualSolarGenerationMwh,
    annualWindGenerationMwh,
    annualTotalGenerationMwh,
    annualRevenue,
    annualNetCashFlow,
    lcoePerMwh,
    paybackPeriodYrs,
    roiPct,
    npv25Yr,
    co2ReductionTonsYr,
    equivalentCarsRemoved,
    equivalentTreesPlanted,
    cashFlowSeries,
    disclosedAssumptions
  };
}
