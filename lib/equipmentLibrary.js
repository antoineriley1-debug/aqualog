/**
 * FacilityH2O — Curated Healthcare Equipment Library (ENTERPRISE tier only)
 *
 * Each item carries parameters with thresholds anchored to U.S. national healthcare
 * standards (AAMI ST79, ANSI/AAMI/ISO 23500 / RD52 / RD62, ASHRAE 188, CMS/CDC WMP).
 *
 * !️ These are TYPICAL VALUES PER THE CITED STANDARD. Every facility MUST verify each
 * threshold against its own equipment manual and the current applicable standard.
 * All values are editable per facility.
 *
 * Shape mirrors the built-in systems so alerts + falsification + live-health all work:
 *   params: [{ key, label, unit, min, max, targetZero?, note }]
 */

export const EQUIPMENT_LIBRARY = [
  {
    key: 'steam_sterilizer',
    label: 'Steam Sterilizer / Autoclave',
    icon: '[FIRE]',
    standard: 'ANSI/AAMI ST79',
    summary: 'Sterile processing steam sterilizer. Monitor cycle lethality, air removal, and leak rate.',
    verifyNote: 'Typical per ANSI/AAMI ST79 — verify against your sterilizer manual and current ST79.',
    params: [
      { key: 'cycle_temp_f', label: 'Cycle Temperature', unit: '°F', min: 250, max: 275, note: 'Common gravity 250°F / prevac 270–275°F per cycle IFU' },
      { key: 'exposure_min', label: 'Exposure Time', unit: 'min', min: 4, max: 30, note: 'Per cycle type and device IFU' },
      { key: 'bowie_dick_pass', label: 'Bowie-Dick Air Removal (1=Pass,0=Fail)', unit: '', min: 1, max: 1, note: 'Daily for prevac sterilizers; 1 = pass' },
      { key: 'bi_result_pass', label: 'Biological Indicator (1=Negative,0=Positive)', unit: '', min: 1, max: 1, note: 'Weekly, preferably daily; 1 = negative/pass' },
      { key: 'leak_rate_mmhg_min', label: 'Leak Rate', unit: 'mmHg/min', min: 0, max: 1.0, note: 'Threshold ≤1.0 mmHg/min' },
    ],
  },
  {
    key: 'washer_disinfector',
    label: 'Washer-Disinfector (Sterile Processing)',
    icon: '[FOAM]',
    standard: 'ANSI/AAMI ST79 / ST15883',
    summary: 'Automated cleaning/disinfection of instruments prior to sterilization.',
    verifyNote: 'Typical per AAMI cleaning-verification guidance — verify against your unit manual.',
    params: [
      { key: 'wash_temp_f', label: 'Wash Temperature', unit: '°F', min: 110, max: 140, note: 'Per manufacturer cycle' },
      { key: 'thermal_a0', label: 'Thermal Disinfection A0 Value', unit: '', min: 600, max: 3000, note: 'A0 ≥600 typical for instruments' },
      { key: 'cleaning_verify_pass', label: 'Cleaning Verification (1=Pass,0=Fail)', unit: '', min: 1, max: 1, note: 'Routine cleaning-efficacy test; 1 = pass' },
    ],
  },
  {
    key: 'ro_di_water',
    label: 'RO / DI Water System',
    icon: '[WATER]',
    standard: 'ANSI/AAMI/ISO 23500',
    summary: 'Reverse-osmosis / deionized water purification feeding critical equipment.',
    verifyNote: 'Typical per ANSI/AAMI/ISO 23500 — verify against your system manual and standard.',
    params: [
      { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 100, note: 'Lower is purer; per intended use' },
      { key: 'rejection_pct', label: 'RO % Rejection', unit: '%', min: 90, max: 100, note: 'Membrane rejection, typically 95–98%' },
      { key: 'total_chlorine', label: 'Total Chlorine', unit: 'ppm', min: 0, max: 0.1, note: 'AAMI max 0.1 mg/L pre-membrane carbon check' },
      { key: 'bacteria', label: 'Bacteria (HPC)', unit: 'CFU/mL', min: 0, max: 200, note: 'Action 50 / max 200 CFU/mL' },
    ],
  },
  {
    key: 'dialysis_water',
    label: 'Dialysis Water System',
    icon: '[FLUID]',
    standard: 'ANSI/AAMI/ISO 23500 (RD52/RD62)',
    summary: 'Hemodialysis water treatment. Strict microbial and endotoxin limits.',
    verifyNote: 'Typical per ANSI/AAMI/ISO 23500 / CMS ESRD — verify against your standard and manual.',
    params: [
      { key: 'bacteria', label: 'Bacteria (HPC)', unit: 'CFU/mL', min: 0, max: 200, note: 'Action level 50, maximum 200 CFU/mL' },
      { key: 'endotoxin', label: 'Endotoxin', unit: 'EU/mL', min: 0, max: 2, note: 'Action level 1, maximum 2 EU/mL' },
      { key: 'total_chlorine', label: 'Total Chlorine', unit: 'ppm', min: 0, max: 0.1, note: 'Max 0.1 mg/L' },
      { key: 'aluminum', label: 'Aluminum', unit: 'mg/L', min: 0, max: 0.01, note: 'Max 0.01 mg/L' },
      { key: 'fluoride', label: 'Fluoride', unit: 'mg/L', min: 0, max: 0.2, note: 'Max 0.2 mg/L' },
    ],
  },
  {
    key: 'domestic_hot_water',
    label: 'Domestic Hot Water (Legionella)',
    icon: '[TEMP]️',
    standard: 'ASHRAE 188 / CMS WMP',
    summary: 'Hot water storage & distribution temperature control for Legionella risk management.',
    verifyNote: 'Typical per ASHRAE 188 / CMS — verify against your Water Management Program.',
    params: [
      { key: 'storage_temp_f', label: 'Storage Tank Temp', unit: '°F', min: 140, max: 160, note: '≥140°F (60°C) at tank outlet' },
      { key: 'distribution_temp_f', label: 'Distribution / Return Temp', unit: '°F', min: 124, max: 140, note: 'Return loop ≥124°F' },
      { key: 'point_of_use_temp_f', label: 'Point-of-Use Hot Temp', unit: '°F', min: 122, max: 140, note: '≥122°F within 1 min of flow; cap per scald-prevention policy (often ~120–125°F at fixtures via mixing valves) — adjust to your WMP' },
    ],
  },
  {
    key: 'cold_water_legionella',
    label: 'Cold Water (Legionella)',
    icon: '[CHILLED]️',
    standard: 'ASHRAE 188',
    summary: 'Cold water temperature kept low enough to suppress Legionella growth.',
    verifyNote: 'Typical per ASHRAE 188 — verify against your Water Management Program.',
    params: [
      { key: 'cold_temp_f', label: 'Cold Water Temp', unit: '°F', min: 0, max: 68, note: 'Keep below 68°F (20°C)' },
    ],
  },
  {
    key: 'heat_exchanger',
    label: 'Heat Exchanger',
    icon: '[LOOP]',
    standard: 'Facility WMP / mfr',
    summary: 'Closed heat-transfer unit. Monitor approach temperature and differential pressure for fouling.',
    verifyNote: 'Typical operating monitoring — verify targets against your equipment manual.',
    params: [
      { key: 'approach_temp_f', label: 'Approach Temperature', unit: '°F', min: 0, max: 10, note: 'Rising approach indicates fouling' },
      { key: 'dp_psi', label: 'Differential Pressure', unit: 'psi', min: 0, max: 15, note: 'Per design; rising DP indicates fouling' },
    ],
  },
  {
    key: 'humidifier',
    label: 'Humidifier / Steam Humidification',
    icon: '[STEAM]️',
    standard: 'ASHRAE 188 / ASHRAE 170',
    summary: 'Humidification serving HVAC. Monitor microbial control and reservoir condition.',
    verifyNote: 'Typical per ASHRAE 188/170 — verify against your equipment manual and WMP.',
    params: [
      { key: 'bacteria', label: 'Reservoir Bacteria', unit: 'CFU/mL', min: 0, max: 1000, note: 'Per WMP control limit' },
      { key: 'rh_pct', label: 'Supplied RH', unit: '%', min: 20, max: 60, note: 'Per ASHRAE 170 space requirements' },
    ],
  },
  {
    key: 'decorative_fountain',
    label: 'Decorative Fountain / Water Feature',
    icon: '[TOWER]',
    standard: 'ASHRAE 188 / CDC',
    summary: 'Aerosol-generating water feature. A named Legionella risk in ASHRAE 188.',
    verifyNote: 'Typical per ASHRAE 188 / CDC WMP — verify against your Water Management Program.',
    params: [
      { key: 'free_chlorine', label: 'Free Chlorine (or biocide)', unit: 'ppm', min: 0.5, max: 3.0, note: 'Maintain disinfectant residual per WMP' },
      { key: 'ph', label: 'pH', unit: '', min: 7.2, max: 7.8, note: 'Supports disinfectant efficacy' },
      { key: 'bacteria', label: 'Bacteria', unit: 'CFU/mL', min: 0, max: 10000, note: 'Per WMP control limit' },
    ],
  },
  {
    key: 'eyewash_safety_shower',
    label: 'Emergency Eyewash / Safety Shower',
    icon: '[DOMESTIC]',
    standard: 'ANSI/ISEA Z358.1',
    summary: 'Emergency fixture. Weekly activation and tepid-water delivery per ANSI Z358.1.',
    verifyNote: 'Typical per ANSI/ISEA Z358.1 — verify against the current standard.',
    params: [
      { key: 'weekly_activation_pass', label: 'Weekly Activation (1=Done,0=Missed)', unit: '', min: 1, max: 1, note: 'Weekly activation flush; 1 = completed' },
      { key: 'water_temp_f', label: 'Delivered Water Temp (tepid)', unit: '°F', min: 60, max: 100, note: 'Tepid 60–100°F (16–38°C)' },
    ],
  },
];

export function getLibraryItem(key) {
  return EQUIPMENT_LIBRARY.find(e => e.key === key) || null;
}
// Build a ranges-style object {param: {min,max,unit,label,targetZero}} for alert/falsification reuse.
export function rangesForLibraryItem(key) {
  const item = getLibraryItem(key);
  if (!item) return {};
  const out = {};
  for (const p of item.params) {
    out[p.key] = { min: p.min, max: p.max, unit: p.unit, label: p.label, targetZero: p.targetZero || false };
  }
  return out;
}
