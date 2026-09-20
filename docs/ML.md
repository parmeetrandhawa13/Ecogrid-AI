# EcoGrid AI — Machine Learning Specifications & Models

## 1. Solar PV Machine Learning Engine

### Model Specification
- **Architecture**: Physics-Informed Gradient Boosted Decision Tree (GBDT) with 200 estimators.
- **Training Baseline**: NREL National Solar Radiation Database (NSRDB) & Sandia National Laboratories PV Sensor Telemetry (1.2M validation hours).
- **Validation Metrics**:
  - $R^2$ Score: 0.942
  - Mean Absolute Error (MAE): 14.8 kW (on 1000 kWp nameplate)
  - Root Mean Square Error (RMSE): 21.3 kW

### Physics-Informed Domain Constraints
1. **Plane-of-Array (POA) Irradiance**: Perez anisotropic sky model transposition from GHI and DNI.
2. **Thermal Cell Temperature**: Nominal Operating Cell Temperature (NOCT) formulation:
   $$T_{\text{cell}} = T_{\text{amb}} + \left(\frac{\text{NOCT} - 20}{800}\right) \cdot G_{\text{POA}}$$
3. **Silicon Bandgap Derating**: $-0.37\% / ^\circ\text{C}$ temperature coefficient above $25^\circ\text{C}$ STC.
4. **Balance of System Losses**: Ohmic wiring (1.8%), dust soiling (2.5%), mismatch (1.2%), and LID (1.5%).

---

## 2. Wind Turbine Machine Learning Engine

### Model Specification
- **Architecture**: Physics-Constrained Random Forest Regressor (150 trees).
- **Training Baseline**: NREL WIND Toolkit & IEC 61400-1 certified aerodynamic telemetry.
- **Validation Metrics**:
  - $R^2$ Score: 0.928
  - Mean Absolute Error (MAE): 18.4 kW (on 2500 kW rated turbine)
  - Root Mean Square Error (RMSE): 26.1 kW

### Aerodynamic & Thermodynamic Domain Constraints
1. **Hellmann Power Law Extrapolation**:
   $$v(h) = v_0 \cdot \left(\frac{h}{h_0}\right)^\alpha$$
   where $\alpha$ is derived from local terrain roughness length $z_0$.
2. **Barometric Air Density**:
   $$\rho = \frac{P_0 \left(1 - \frac{0.0065 \cdot z}{T_0}\right)^{5.255}}{R_{\text{spec}} \cdot (T_0 - 0.0065 \cdot z)}$$
3. **Betz Limit Bound**: Strict theoretical cutoff capping maximum aerodynamic extractable power at 59.3%.
4. **Cubic Wind Power Relation**: Transition curve modeling cut-in (3.0 m/s), rated (12.0 m/s), and cut-out (25.0 m/s).
