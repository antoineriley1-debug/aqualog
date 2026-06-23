/**
 * FacilityH2O — Legionella & Water Management Plan Engine
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Reference: ASHRAE 188-2018, CDC MMWR Water Management Programs,
 *            Joint Commission EC.02.05.02, CMS QSO17-30
 */

// ─────────────────────────────────────────────────────────────
// WATER SYSTEM TYPES (Legionella risk systems per ASHRAE 188)
// ─────────────────────────────────────────────────────────────
export const LEGIONELLA_SYSTEMS = {
  cooling_tower: {
    id: 'cooling_tower',
    label: 'Cooling Tower / Evaporative Condenser',
    risk: 'HIGH',
    icon: '[MFG]',
    description: 'Primary Legionella amplification risk. Must be on WMP.',
    frequency: 'Weekly operational + quarterly culture',
  },
  domestic_hot: {
    id: 'domestic_hot',
    label: 'Domestic Hot Water System',
    risk: 'HIGH',
    icon: '[DOMESTIC]',
    description: 'Hot water distribution, storage tanks, water heaters.',
    frequency: 'Monthly culture + weekly temp checks',
  },
  domestic_cold: {
    id: 'domestic_cold',
    label: 'Domestic Cold Water System',
    risk: 'MEDIUM',
    icon: '[WATER]',
    description: 'Cold water distribution, ice machines, drinking water.',
    frequency: 'Quarterly culture',
  },
  decorative: {
    id: 'decorative',
    label: 'Decorative Fountain / Water Feature',
    risk: 'HIGH',
    icon: '[TOWER]',
    description: 'Decorative water features with aerosol generation.',
    frequency: 'Weekly operational + monthly culture',
  },
  ice_machine: {
    id: 'ice_machine',
    label: 'Ice Machine',
    risk: 'MEDIUM',
    icon: '[FREEZE]',
    description: 'Patient-use ice machines.',
    frequency: 'Monthly swab + quarterly culture',
  },
  humidifier: {
    id: 'humidifier',
    label: 'Humidifier / Evaporative Cooler',
    risk: 'MEDIUM',
    icon: '[AIR]',
    description: 'HVAC-linked humidification systems.',
    frequency: 'Monthly operational + quarterly culture',
  },
  hydrotherapy: {
    id: 'hydrotherapy',
    label: 'Hydrotherapy / Whirlpool',
    risk: 'HIGH',
    icon: '[DRAIN]',
    description: 'Physical therapy pools, whirlpools.',
    frequency: 'Daily operational + monthly culture',
  },
};

// ─────────────────────────────────────────────────────────────
// PARAMETERS BY SYSTEM TYPE
// ─────────────────────────────────────────────────────────────
export const LEGIONELLA_PARAMETERS = {
  cooling_tower: [
    { key: 'temp_basin',    label: 'Basin Water Temp',     unit: '°F', min: null, max: 68,   precision: 1, frequency: 'Weekly', note: 'Keep below 68°F or treat' },
    { key: 'conductivity',  label: 'Conductivity',         unit: 'µS/cm', min: null, max: 2000, precision: 0, frequency: 'Weekly' },
    { key: 'ph',            label: 'pH',                   unit: '',   min: 6.5,  max: 8.5,  precision: 1, frequency: 'Weekly' },
    { key: 'biocide',       label: 'Biocide Level',        unit: 'ppm', min: 1.0, max: null, precision: 1, frequency: 'Weekly', note: 'Oxidizing or non-oxidizing per WMP' },
    { key: 'chlorine',      label: 'Free Chlorine',        unit: 'ppm', min: 0.5, max: 2.0,  precision: 1, frequency: 'Weekly' },
    { key: 'turbidity',     label: 'Turbidity',            unit: 'NTU', min: null, max: 1.0, precision: 2, frequency: 'Weekly' },
    { key: 'blowdown',      label: 'Blowdown Confirmed',   unit: 'Y/N', min: null, max: null, precision: 0, frequency: 'Weekly', isBoolean: true },
    { key: 'legionella_culture', label: 'Legionella Culture (lab)', unit: 'CFU/mL', min: null, max: 1, precision: 0, frequency: 'Quarterly', isLab: true, note: '<1 CFU/mL target; >10 = action; >100 = shutdown' },
  ],
  domestic_hot: [
    { key: 'temp_heater',   label: 'Water Heater Outlet Temp', unit: '°F', min: 140, max: null, precision: 1, frequency: 'Weekly', note: 'Must be ≥140°F at heater' },
    { key: 'temp_distal',   label: 'Distal Outlet Temp',   unit: '°F', min: 120, max: null,  precision: 1, frequency: 'Monthly', note: 'Must reach ≥120°F within 1 min at farthest fixture' },
    { key: 'temp_return',   label: 'Return Loop Temp',     unit: '°F', min: 124, max: null,  precision: 1, frequency: 'Weekly', note: '≥124°F in recirculating loop' },
    { key: 'chlorine',      label: 'Residual Disinfectant', unit: 'ppm', min: 0.2, max: 2.0, precision: 1, frequency: 'Monthly' },
    { key: 'ph',            label: 'pH',                   unit: '',   min: 6.5, max: 8.5,   precision: 1, frequency: 'Monthly' },
    { key: 'legionella_culture', label: 'Legionella Culture (lab)', unit: 'CFU/mL', min: null, max: 1, precision: 0, frequency: 'Monthly', isLab: true },
  ],
  domestic_cold: [
    { key: 'temp',          label: 'Cold Water Temp',      unit: '°F', min: null, max: 68,   precision: 1, frequency: 'Monthly', note: 'Keep ≤68°F' },
    { key: 'chlorine',      label: 'Residual Disinfectant', unit: 'ppm', min: 0.2, max: 2.0, precision: 1, frequency: 'Monthly' },
    { key: 'ph',            label: 'pH',                   unit: '',   min: 6.5, max: 8.5,   precision: 1, frequency: 'Monthly' },
    { key: 'legionella_culture', label: 'Legionella Culture (lab)', unit: 'CFU/mL', min: null, max: 1, precision: 0, frequency: 'Quarterly', isLab: true },
  ],
  decorative: [
    { key: 'temp',          label: 'Water Temp',           unit: '°F', min: null, max: 68,   precision: 1, frequency: 'Weekly' },
    { key: 'chlorine',      label: 'Free Chlorine',        unit: 'ppm', min: 1.0, max: 3.0,  precision: 1, frequency: 'Weekly' },
    { key: 'ph',            label: 'pH',                   unit: '',   min: 7.2, max: 7.8,   precision: 1, frequency: 'Weekly' },
    { key: 'turbidity',     label: 'Turbidity',            unit: 'NTU', min: null, max: 0.5, precision: 2, frequency: 'Weekly' },
    { key: 'legionella_culture', label: 'Legionella Culture (lab)', unit: 'CFU/mL', min: null, max: 1, precision: 0, frequency: 'Monthly', isLab: true },
  ],
  ice_machine: [
    { key: 'swab_mold',     label: 'Mold/Biofilm Swab',   unit: 'Pass/Fail', min: null, max: null, precision: 0, frequency: 'Monthly', isBoolean: true, passValue: 'pass' },
    { key: 'chlorine',      label: 'Water Inlet Chlorine', unit: 'ppm', min: 0.2, max: 2.0, precision: 1, frequency: 'Monthly' },
    { key: 'legionella_culture', label: 'Legionella Culture (lab)', unit: 'CFU/mL', min: null, max: 1, precision: 0, frequency: 'Quarterly', isLab: true },
  ],
  humidifier: [
    { key: 'temp',          label: 'Feed Water Temp',      unit: '°F', min: null, max: 68,   precision: 1, frequency: 'Monthly' },
    { key: 'chlorine',      label: 'Residual Disinfectant', unit: 'ppm', min: 0.2, max: null, precision: 1, frequency: 'Monthly' },
    { key: 'legionella_culture', label: 'Legionella Culture (lab)', unit: 'CFU/mL', min: null, max: 1, precision: 0, frequency: 'Quarterly', isLab: true },
  ],
  hydrotherapy: [
    { key: 'temp',          label: 'Pool Water Temp',      unit: '°F', min: null, max: 104,  precision: 1, frequency: 'Daily' },
    { key: 'chlorine',      label: 'Free Chlorine',        unit: 'ppm', min: 1.5, max: 3.0,  precision: 1, frequency: 'Daily' },
    { key: 'ph',            label: 'pH',                   unit: '',   min: 7.2, max: 7.8,   precision: 1, frequency: 'Daily' },
    { key: 'turbidity',     label: 'Turbidity',            unit: 'NTU', min: null, max: 1.0, precision: 2, frequency: 'Daily' },
    { key: 'legionella_culture', label: 'Legionella Culture (lab)', unit: 'CFU/mL', min: null, max: 1, precision: 0, frequency: 'Monthly', isLab: true },
  ],
};

// ─────────────────────────────────────────────────────────────
// ACTION LEVELS (CDC / ASHRAE 188 tiered response)
// ─────────────────────────────────────────────────────────────
export const LEGIONELLA_ACTION_LEVELS = {
  cooling_tower: {
    monitor:  { label: 'Monitor',        threshold: '<1 CFU/mL',   color: 'green',  action: 'Continue routine monitoring' },
    action:   { label: 'Action Level',   threshold: '1–9 CFU/mL',  color: 'yellow', action: 'Increase biocide, retest within 2 weeks' },
    corrective:{ label: 'Corrective',   threshold: '10–99 CFU/mL', color: 'orange', action: 'Hyperchlorinate, shock treat, retest' },
    shutdown: { label: 'SHUTDOWN',       threshold: '≥100 CFU/mL', color: 'red',    action: 'Immediate shutdown, hyperchlorination, notify IP & DOH' },
  },
  domestic_hot: {
    monitor:  { label: 'Monitor',        threshold: '<1 CFU/mL',   color: 'green',  action: 'Continue routine monitoring' },
    action:   { label: 'Action Level',   threshold: '1–9 CFU/mL',  color: 'yellow', action: 'Thermal flush ≥158°F, retest' },
    corrective:{ label: 'Corrective',   threshold: '10–99 CFU/mL', color: 'orange', action: 'Hyperchlorinate + thermal flush, notify IP' },
    shutdown: { label: 'NOTIFICATION',  threshold: '≥100 CFU/mL',  color: 'red',    action: 'Notify IP, Facilities Director, DOH. Consider point-of-use filters' },
  },
};

export function getLegionellaActionLevel(systemType, cfu) {
  const levels = LEGIONELLA_ACTION_LEVELS[systemType] || LEGIONELLA_ACTION_LEVELS.domestic_hot;
  const val = parseFloat(cfu);
  if (isNaN(val) || val < 1) return levels.monitor;
  if (val < 10)  return levels.action;
  if (val < 100) return levels.corrective;
  return levels.shutdown;
}

export function evaluateLegionellaEntry(systemType, values) {
  const params = LEGIONELLA_PARAMETERS[systemType] || [];
  const failures = [];
  let pass = 0, total = 0;

  for (const param of params) {
    const v = values?.[param.key];
    if (v === undefined || v === null || v === '') continue;
    if (param.isBoolean) continue; // boolean handled separately
    const num = parseFloat(v);
    if (isNaN(num)) continue;
    total++;
    const inRange =
      (param.min === null || num >= param.min) &&
      (param.max === null || num <= param.max);
    if (inRange) {
      pass++;
    } else {
      const limitStr = param.max !== null && param.min !== null
        ? `${param.min}–${param.max} ${param.unit}`
        : param.max !== null ? `≤ ${param.max} ${param.unit}`
        : `≥ ${param.min} ${param.unit}`;
      failures.push({ param, value: num, limit: limitStr });
    }
  }

  return { pass, total, failures, allPass: failures.length === 0 };
}
