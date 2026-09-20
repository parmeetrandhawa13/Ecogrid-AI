# EcoGrid AI — GIS & Suitability Analysis Methodology

## 1. Multi-Criteria Decision Analysis (MCDA) Framework

EcoGrid AI utilizes an Analytical Hierarchy Process (AHP) framework to evaluate location suitability:

### Solar Suitability Weighting
| Parameter | Weight | Optimal Range | Mathematical Penalty |
|---|---|---|---|
| Global Horizontal Irradiance (GHI) | 40% | > 5.5 kWh/m²/day | Linear scaling below 2.5 kWh/m² |
| Direct Normal Irradiance (DNI) | 20% | > 6.0 kWh/m²/day | Sub-tropical atmospheric factor |
| Topographic Slope | 20% | 0° to 3° | 80% score at ≤7°, 45% at ≤12°, 15% >12° |
| Interconnection Distance | 20% | < 5 km | 85% at ≤15 km, 65% at ≤35 km, 40% >35 km |

### Wind Suitability Weighting
| Parameter | Weight | Optimal Range | Mathematical Penalty |
|---|---|---|---|
| 100m Hub-Height Wind Speed | 50% | > 7.5 m/s | Class I (≥8.5 m/s), Class II (≥7.5 m/s), Class III (≥6.0 m/s) |
| Air Density ($\rho$) | 15% | $\geq 1.225 \text{ kg/m}^3$ | Ratio against sea-level standard atmosphere |
| Terrain Roughness & Slope | 15% | ≤ 10° | Wake and turbulence penalties on steep grades |
| Interconnection Proximity | 20% | < 10 km | Exponential transmission extension capex |

## 2. Spatial Data Providers
- **Vector Base Tiles**: CartoDB Dark Matter / Positron & Mapbox Vector Tiles.
- **Geocoding**: OpenStreetMap Nominatim administrative reverse/forward lookup.
- **Digital Elevation Model (DEM)**: Open-Meteo SRTM 30m topographic grid.
