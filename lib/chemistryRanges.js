/**
 * Chemistry ranges for boiler and chilled water systems.
 * targetZero: true means the acceptable value is 0 (e.g. boiler hardness).
 * All display logic must check targetZero before using min/max.
 */
export const CHEMISTRY_RANGES = {
  boiler: {
    ph:           { min: 8.5,  max: 10.5, unit: '',       label: 'pH' },
    phosphate:    { min: 20,   max: 60,   unit: 'ppm',    label: 'Phosphate' },
    sulfite:      { min: 20,   max: 80,   unit: 'ppm',    label: 'Sulfite' },
    hardness:     { min: 0,    max: 0,    unit: 'ppm',    label: 'Hardness', targetZero: true },
    conductivity: { min: 0,    max: 3500, unit: 'µS/cm',  label: 'Conductivity' },
    alkalinity:   { min: 100,  max: 700,  unit: 'ppm',    label: 'Alkalinity' },
    tds:          { min: 0,    max: 3000, unit: 'ppm',    label: 'TDS' },
    amine:        { min: 0,    max: 10,   unit: 'ppm',    label: 'Amine' },
  },
  chilled: {
    ph:           { min: 7.5,  max: 9.5,  unit: '',       label: 'pH' },
    conductivity: { min: 0,    max: 2000, unit: 'µS/cm',  label: 'Conductivity' },
    inhibitor:    { min: 50,   max: 300,  unit: 'ppm',    label: 'Inhibitor' },
    hardness:     { min: 0,    max: 200,  unit: 'ppm',    label: 'Hardness' },
    iron:         { min: 0,    max: 2,    unit: 'ppm',    label: 'Iron' },
    tds:          { min: 0,    max: 2000, unit: 'ppm',    label: 'TDS' },
    molybdate:    { min: 5,    max: 30,   unit: 'ppm',    label: 'Molybdate' },
    bacteria:     { min: 0,    max: 1000, unit: 'CFU/mL', label: 'Bacteria' },
  },
  // !️ TYPICAL DEFAULTS — VERIFY EVERY RANGE AGAINST YOUR WATER TREATMENT PROGRAM (Nalco/Chemstar/etc.) before relying on them.
  cooling_tower: {
    ph:           { min: 8.0,  max: 9.0,  unit: '',       label: 'pH' },
    conductivity: { min: 1000, max: 3000, unit: 'µS/cm',  label: 'Conductivity' },
    free_chlorine:{ min: 0.2,  max: 1.0,  unit: 'ppm',    label: 'Free Chlorine' },
    inhibitor:    { min: 8,    max: 12,   unit: 'ppm',    label: 'Inhibitor/Molybdate' },
    hardness:     { min: 0,    max: 400,  unit: 'ppm',    label: 'Hardness' },
    bacteria:     { min: 0,    max: 10000,unit: 'CFU/mL', label: 'Bacteria (dip slide)' },
  },
  condensate: {
    ph:           { min: 7.5,  max: 9.0,  unit: '',       label: 'pH' },
    iron:         { min: 0,    max: 1.0,  unit: 'ppm',    label: 'Iron' },
    hardness:     { min: 0,    max: 0,    unit: 'ppm',    label: 'Hardness', targetZero: true },
    conductivity: { min: 0,    max: 100,  unit: 'µS/cm',  label: 'Conductivity' },
    amine:        { min: 0,    max: 10,   unit: 'ppm',    label: 'Amine' },
  },
  softener: {
    hardness:     { min: 0,    max: 0,    unit: 'ppm',    label: 'Hardness', targetZero: true },
    conductivity: { min: 0,    max: 1500, unit: 'µS/cm',  label: 'Conductivity' },
  },
};

export function getFields(system) {
  return CHEMISTRY_RANGES[system] || {};
}

/**
 * Returns true if a value is in acceptable range.
 * Handles targetZero (boiler hardness must be exactly 0).
 */
export function isInRange(system, param, value) {
  const ranges = CHEMISTRY_RANGES[system];
  if (!ranges || !ranges[param]) return true;
  const { min, max, targetZero } = ranges[param];
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (targetZero) return num === 0;
  return num >= min && num <= max;
}

/**
 * Returns a human-readable range label for a parameter.
 * e.g. "Target: 0 ppm" for hardness, "8.5 – 10.5" for pH
 */
export function rangeLabel(system, param) {
  const ranges = CHEMISTRY_RANGES[system];
  if (!ranges || !ranges[param]) return '';
  const { min, max, unit, targetZero } = ranges[param];
  if (targetZero) return `Target: 0${unit ? ' ' + unit : ''}`;
  return `${min}–${max}${unit ? ' ' + unit : ''}`;
}

/**
 * Returns all out-of-range parameters for a set of values.
 */
export function getOutOfRangeParams(system, values) {
  const fields = getFields(system);
  const oor = [];
  for (const [key, range] of Object.entries(fields)) {
    const val = values[key];
    if (val === undefined || val === null || val === '') continue;
    const num = parseFloat(val);
    if (isNaN(num)) continue;
    const outOfRange = range.targetZero ? num !== 0 : (num < range.min || num > range.max);
    if (outOfRange) {
      oor.push({
        param: key,
        label: range.label,
        value: num,
        min: range.min,
        max: range.max,
        unit: range.unit,
        targetZero: range.targetZero || false,
      });
    }
  }
  return oor;
}
