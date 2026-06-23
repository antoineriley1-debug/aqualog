/**
 * FacilityH2O - Single source of truth for all built-in water systems and their entry fields.
 */

export const SYSTEM_META = {
  boiler:        { label: 'Boiler Water',      icon: 'BLR' },
  chilled:       { label: 'Chilled Water',     icon: 'CHW' },
  cooling_tower: { label: 'Cooling Tower',     icon: 'CTW' },
  condensate:    { label: 'Condensate',        icon: 'CDN' },
  softener:      { label: 'Water Softener',    icon: 'SFT' },
};

export const SYSTEM_ORDER = ['boiler', 'chilled', 'cooling_tower', 'condensate', 'softener'];

export const SYSTEM_FIELDS = {
  boiler: [
    { key: 'ph', label: 'pH', unit: '', min: 8.5, max: 10.5, presets: [8.5, 9.0, 9.5, 10.0, 10.5] },
    { key: 'phosphate', label: 'Phosphate', unit: 'ppm', min: 20, max: 60, presets: [20, 30, 40, 50, 60] },
    { key: 'sulfite', label: 'Sulfite', unit: 'ppm', min: 20, max: 80, presets: [20, 40, 60, 80] },
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 0, targetZero: true, presets: [0] },
    { key: 'conductivity', label: 'Conductivity', unit: 'uS/cm', min: 0, max: 3500, presets: [500, 1000, 2000, 3000] },
    { key: 'alkalinity', label: 'Alkalinity (M)', unit: 'ppm', min: 100, max: 700, presets: [200, 350, 500, 700] },
    { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 3000, presets: [500, 1000, 2000, 3000] },
    { key: 'amine', label: 'Amine Residual', unit: 'ppm', min: 0, max: 10, presets: [0, 2, 5, 8, 10] },
  ],
  chilled: [
    { key: 'ph', label: 'pH', unit: '', min: 7.5, max: 9.5, presets: [7.5, 8.0, 8.5, 9.0, 9.5] },
    { key: 'conductivity', label: 'Conductivity', unit: 'uS/cm', min: 0, max: 2000, presets: [500, 1000, 1500, 2000] },
    { key: 'inhibitor', label: 'Inhibitor', unit: 'ppm', min: 50, max: 300, presets: [50, 100, 150, 200, 300] },
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 300, presets: [0, 50, 100, 200, 300] },
    { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 2, presets: [0, 0.5, 1.0, 1.5, 2.0] },
    { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 2000, presets: [500, 1000, 1500, 2000] },
    { key: 'molybdate', label: 'Molybdate', unit: 'ppm', min: 5, max: 30, presets: [5, 10, 15, 20, 30] },
    { key: 'bacteria', label: 'Bacteria (HPC)', unit: 'CFU/mL', min: 0, max: 1000, targetZero: false, presets: [0, 100, 500, 1000] },
  ],
  cooling_tower: [
    { key: 'ph', label: 'pH', unit: '', min: 7.0, max: 9.0, presets: [7.0, 7.5, 8.0, 8.5, 9.0] },
    { key: 'conductivity', label: 'Conductivity', unit: 'uS/cm', min: 0, max: 3000, presets: [500, 1000, 2000, 3000] },
    { key: 'inhibitor', label: 'Inhibitor', unit: 'ppm', min: 50, max: 400, presets: [50, 100, 200, 300, 400] },
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 500, presets: [0, 100, 200, 300, 500] },
    { key: 'cycles', label: 'Cycles of Concentration', unit: '', min: 2, max: 8, presets: [2, 3, 4, 5, 6, 7, 8] },
    { key: 'bacteria', label: 'Bacteria (HPC)', unit: 'CFU/mL', min: 0, max: 10000, presets: [0, 1000, 5000, 10000] },
    { key: 'legionella', label: 'Legionella', unit: 'CFU/mL', min: 0, max: 0, targetZero: true, presets: [0] },
  ],
  condensate: [
    { key: 'ph', label: 'pH', unit: '', min: 7.5, max: 9.5, presets: [7.5, 8.0, 8.5, 9.0, 9.5] },
    { key: 'conductivity', label: 'Conductivity', unit: 'uS/cm', min: 0, max: 200, presets: [10, 50, 100, 150, 200] },
    { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 0.3, presets: [0, 0.05, 0.1, 0.2, 0.3] },
    { key: 'toc', label: 'TOC', unit: 'ppm', min: 0, max: 5, presets: [0, 1, 2, 3, 5] },
  ],
  softener: [
    { key: 'hardness_in', label: 'Hardness In', unit: 'gpg', min: 0, max: 30, presets: [5, 10, 15, 20, 30] },
    { key: 'hardness_out', label: 'Hardness Out', unit: 'gpg', min: 0, max: 0, targetZero: true, presets: [0] },
    { key: 'salt_level', label: 'Salt Level', unit: '%', min: 25, max: 100, presets: [25, 50, 75, 100] },
    { key: 'flow', label: 'Flow Rate', unit: 'gpm', min: 0, max: 100, presets: [10, 25, 50, 75, 100] },
  ],
};
