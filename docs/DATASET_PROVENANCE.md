# EcoGrid AI — Dataset Provenance & Engineering Standards

## 1. Primary Scientific Datasets

1. **NREL NSRDB (National Solar Radiation Database)**:
   - **Provider**: National Renewable Energy Laboratory (NREL), US Department of Energy.
   - **Resolution**: 4 km spatial resolution, 30-minute temporal intervals across 1998–2022.
   - **Usage**: Training data for Solar PV GBDT inference, cloud cover modeling, and Perez transposition coefficients.

2. **NREL WIND Toolkit (Wind Integration National Database)**:
   - **Provider**: National Renewable Energy Laboratory.
   - **Parameters**: 100m wind speeds, directional shear, atmospheric pressure, temperature profiles.
   - **Usage**: Random Forest regressor training, Weibull shape ($k$) and scale ($c$) factor derivation.

3. **Sandia National Laboratories Photovoltaic Array Performance Database**:
   - **Provider**: Sandia National Laboratories.
   - **Usage**: Inverter polynomial efficiency clipping, NOCT thermal equilibrium constants.

4. **NREL Annual Technology Baseline (ATB 2024)**:
   - **Provider**: NREL Strategic Energy Analysis Center.
   - **Usage**: Utility-scale Solar PV Capex ($890/kWp), Onshore Wind Capex ($1,280/kW), O&M degradation schedules.

5. **USGS SRTM & Open-Meteo DEM**:
   - **Provider**: NASA / USGS Shuttle Radar Topography Mission.
   - **Usage**: Real 30-meter elevation profiling and terrain slope calculation.

6. **OpenStreetMap / CARTO**:
   - **Provider**: OpenStreetMap contributors & CARTO basemaps.
   - **Usage**: Geocoding, place names, cartographic rendering.
