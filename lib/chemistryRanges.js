export const CHEMISTRY_RANGES = {
  boiler: {
    ph: { min: 8.5, max: 10.5, unit: '', label: 'pH' },
    phosphate: { min: 20, max: 60, unit: 'ppm', label: 'Phosphate' },
    sulfite: { min: 20, max: 80, unit: 'ppm', label: 'Sulfite' },
    hardness: { min: 0, max: 0, unit: 'ppm', label: 'Hardness', targetZero: true },
    conductivity: { min: 0, max: 3500, unit: 'µS/cm', label: 'Conductivity' },
    alkalinity: { min: 100, max: 700, unit: 'ppm', label: 'Alkalinity' },
    tds: { min: 0, max: 3000, unit: 'ppm', label: 'TDS' },
    amine: { min: 0, max: 10, unit: 'ppm', label: 'Amine' },
  },
  chilled: {
    ph: { min: 7.5, max: 9.5, unit: '', label: 'pH' },
    conductivity: { min: 0, max: 2000, unit: 'µS/cm', label: 'Conductivity' },
    inhibitor: { min: 50, max: 300, unit: 'ppm', label: 'Inhibitor' },
    hardness: { min: 0, max: 200, unit: 'ppm', label: 'Hardness' },
    iron: { min: 0, max: 2, unit: 'ppm', label: 'Iron' },
    tds: { min: 0, max: 2000, unit: 'ppm', label: 'TDS' },
    molybdate: { min: 5, max: 30, unit: 'ppm', label: 'Molybdate' },
    bacteria: { min: 0, max: 1000, unit: 'CFU/mL', label: 'Bacteria' },
  },
};

export function getFields(system) {
  return CHEMISTRY_RANGES[system] || {};
}

export function isInRange(system, param, value) {
  const ranges = CHEMISTRY_RANGES[system];
  if (!ranges || !ranges[param]) return true;
  const { min, max, targetZero } = ranges[param];
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (targetZero) return num === 0; // hardness must be exactly 0
  return num >= min && num <= max;
}

export function getOutOfRangeParams(system, values) {
  const fields = getFields(system);
  const oor = [];
  for (const [key, range] of Object.entries(fields)) {
    const val = values[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseFloat(val);
      const outOfRange = range.targetZero ? num !== 0 : (num < range.min || num > range.max);
      if (!isNaN(num) && outOfRange) {
        oor.push({ param: key, label: range.label, value: num, min: range.min, max: range.max, unit: range.unit });
      }
    }
  }
  return oor;
}
