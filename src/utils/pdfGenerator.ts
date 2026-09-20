import jsPDF from 'jspdf';
import { FullAnalysisDashboard } from '../types';

export function exportAnalysisToPdf(dashboard: FullAnalysisDashboard) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryGreen = [15, 60, 40];
  const accentGold = [217, 145, 25];
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  // Header Banner
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, 210, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ECOGRID AI', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Intelligent Renewable Energy Planning & Forecasting Platform', 14, 23);
  doc.text(`Report Generated: ${new Date(dashboard.timestamp).toLocaleString()}`, 130, 23);

  // Gold accent bar
  doc.setFillColor(accentGold[0], accentGold[1], accentGold[2]);
  doc.rect(0, 32, 210, 2, 'F');

  // Section 1: Site Identification
  let y = 42;
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PROJECT SITE IDENTIFICATION & GIS PROFILE', 14, y);

  y += 6;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Location: ${dashboard.location.name} (${dashboard.location.country})`, 14, y);
  y += 5;
  doc.text(`Coordinates: ${dashboard.location.lat.toFixed(4)}°N, ${dashboard.location.lng.toFixed(4)}°E`, 14, y);
  doc.text(`Elevation: ${dashboard.location.elevationM} m MSL`, 110, y);
  y += 5;
  doc.text(`Terrain Slope: ${dashboard.location.terrainSlopeDeg.toFixed(1)}° (${dashboard.location.landCover})`, 14, y);
  doc.text(`Grid Distance: ${dashboard.location.gridDistanceKm.toFixed(1)} km to substation`, 110, y);

  // Section 2: GIS Suitability & Resource Indices
  y += 10;
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. GIS RESOURCE SUITABILITY ASSESSMENT', 14, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  // Scores Box
  doc.setFillColor(245, 247, 246);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F');

  const s = dashboard.suitability as any;
  const solarScore = dashboard.suitability.solarScore ?? s.solar_score ?? s.solar_suitability_score ?? s.solar?.score ?? 0;
  const windScore = dashboard.suitability.windScore ?? s.wind_score ?? s.wind_suitability_score ?? s.wind?.score ?? 0;
  const hybridScore = dashboard.suitability.hybridScore ?? s.hybrid_score ?? s.hybrid?.score ?? 0;
  const overallScore = dashboard.suitability.overallScore ?? s.overall_score ?? 0;

  doc.setFont('helvetica', 'bold');
  doc.text(`Overall Suitability: ${overallScore} / 100 (${dashboard.suitability.rating})`, 20, y + 7);
  doc.text(`Confidence Metric: ${dashboard.suitability.confidencePct}%`, 120, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.text(`• Solar Suitability: ${solarScore}/100 (GHI: ${dashboard.suitability.rawResourceData.ghiKwhM2Day} kWh/m²/day)`, 20, y + 14);
  doc.text(`• Wind Suitability: ${windScore}/100 (100m Speed: ${dashboard.suitability.rawResourceData.windSpeed100mMs} m/s)`, 105, y + 14);
  doc.text(`• Hybrid Complementarity Score: ${hybridScore}/100`, 20, y + 19);

  // Section 3: Machine Learning Inferences
  y += 30;
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. MACHINE LEARNING GENERATION INFERENCES', 14, y);

  y += 7;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 88, 42, 2, 2, 'F');
  doc.roundedRect(108, y, 88, 42, 2, 2, 'F');

  // Solar ML Card
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentGold[0], accentGold[1], accentGold[2]);
  doc.text('SOLAR PV ML INFERENCE', 18, y + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Model: ${dashboard.solarPrediction.modelInfo.name}`, 18, y + 12);
  doc.text(`Algorithm: Physics-Informed GBDT (R² = ${dashboard.solarPrediction.modelInfo.r2Score})`, 18, y + 17);
  doc.text(`Rated Capacity: ${dashboard.solarPrediction.ratedCapacityKwp.toLocaleString()} kWp`, 18, y + 22);
  doc.text(`Predicted Output: ${dashboard.solarPrediction.predictedPowerKw.toLocaleString()} kW`, 18, y + 27);
  doc.text(`Annual Generation: ${dashboard.solarPrediction.annualGenerationMwh.toLocaleString()} MWh/yr`, 18, y + 32);
  doc.text(`Capacity Factor: ${dashboard.solarPrediction.capacityFactorPct}%`, 18, y + 37);

  // Wind ML Card
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('WIND TURBINE ML INFERENCE', 112, y + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Model: ${dashboard.windPrediction.modelInfo.name}`, 112, y + 12);
  doc.text(`Algorithm: Random Forest Ensemble (R² = ${dashboard.windPrediction.modelInfo.r2Score})`, 112, y + 17);
  doc.text(`Rated Capacity: ${dashboard.windPrediction.ratedCapacityKw.toLocaleString()} kW`, 112, y + 22);
  doc.text(`Predicted Output: ${dashboard.windPrediction.predictedPowerKw.toLocaleString()} kW`, 112, y + 27);
  doc.text(`Annual Generation: ${dashboard.windPrediction.annualGenerationMwh.toLocaleString()} MWh/yr`, 112, y + 32);
  doc.text(`Capacity Factor: ${dashboard.windPrediction.capacityFactorPct}%`, 112, y + 37);

  // Section 4: Economic & Environmental Valuation
  y += 50;
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('4. FINANCIAL VALUATION & CO2 OFFSET', 14, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  doc.text(`Total Project CAPEX: $${dashboard.economics.totalCapex.toLocaleString()}`, 14, y);
  doc.text(`Annual Revenue: $${dashboard.economics.annualRevenue.toLocaleString()}/yr`, 110, y);
  y += 5;
  doc.text(`Levelized Cost of Energy (LCOE): $${dashboard.economics.lcoePerMwh}/MWh`, 14, y);
  doc.text(`Payback Period: ${dashboard.economics.paybackPeriodYrs} Years`, 110, y);
  y += 5;
  doc.text(`25-Year Net Present Value (NPV): $${dashboard.economics.npv25Yr.toLocaleString()}`, 14, y);
  doc.text(`Return on Investment (ROI): ${dashboard.economics.roiPct}%`, 110, y);
  y += 5;
  doc.text(`CO2 Emissions Displaced: ${dashboard.economics.co2ReductionTonsYr.toLocaleString()} Metric Tons/yr`, 14, y);
  doc.text(`Vehicles Displaced: ~${dashboard.economics.equivalentCarsRemoved.toLocaleString()} passenger cars/yr`, 110, y);

  // Section 5: Engineering Recommendation
  y += 11;
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('5. ARCHITECTURAL RECOMMENDATION & VERDICT', 14, y);

  y += 7;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text(`RECOMMENDED TECHNOLOGY: ${dashboard.recommendation.recommendedTech.toUpperCase()}`, 20, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const splitRationale = doc.splitTextToSize(dashboard.recommendation.executiveRationale, 172);
  doc.text(splitRationale, 20, y + 15);

  // Footer Disclaimers
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Notice: Economic calculations represent engineering estimates based on NREL/IEC benchmarks. ML predictions derived from surrogate models.', 14, 285);
  doc.text('EcoGrid AI Renewable Engineering Suite — Confidential Planning Document', 14, 289);

  // Save the PDF
  const filename = `EcoGrid_AI_Report_${dashboard.location.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
