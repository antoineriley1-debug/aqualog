/**
 * FacilityH2O â€” Single source of truth for all built-in water systems and their entry fields.
 * Boiler & Chilled (existing) + Cooling Tower, Condensate, Softener (new).
 * !ï¸ The NEW systems use TYPICAL DEFAULT RANGES â€” verify against your water treatment program.
 */

export const SYSTEM_META = {
  boiler:        { label: 'Boiler Water',      icon: 'BLR' },
  chilled:       { label: 'Chilled Water',     icon: 'CHW'ï¸' },
  cooling_tower: { label: 'Cooling Tower',     icon: 'STM'ï¸' },
  condensate:    { label: 'Condensate',        icon: 'DOM' },
  softener:      { label: 'Water Softener',    icon: 'SFT' },
};

export const SYSTEM_ORDER = ['boiler', 'chilled', 'cooling_tower', 'condensate', 'softener'];

export const SYSTEM_FIELDS = {
  boiler: [
    { key: 'ph', label: 'pH', unit: '', min: 8.5, max: 10.5, presets: [8.5, 9.0, 9.5, 10.0, 10.5] },
    { key: 'phosphate', label: 'Phosphate', unit: 'ppm', min: 20, max: 60, presets: [20, 30, 40, 50, 60] },
    { key: 'sulfite', label: 'Sulfite', unit: 'ppm', min: 20, max: 80, presets: [20, 40, 60, 80] },
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 0, targetZero: true, presets: [0] },
    { key: 'conductivity', label: 'Conductivity', unit: 'ÂµS/cm', min: 0, max: 3500, presets: [500, 1000, 2000, 3000] },
    { key: 'alkalinity', label: 'Alkalinity (M)', unit: 'ppm', min: 100, max: 700, presets: [200, 350, 500, 700] },
    { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 3000, presets: [500, 1000, 2000, 3000] },
    { key: 'amine', label: 'Amine Residual', unit: 'ppm', min: 0, max: 10, presets: [0, 2, 5, 8, 10] },
  ],
  chilled: [
    { key: 'ph', label: 'pH', unit: '', min: 7.5, max: 9.5, presets: [7.5, 8.0, 8.5, 9.0, 9.5] },
    { key: 'conductivity', label: 'Conductivity', unit: 'ÂµS/cm', min: 0, max: 2000, presets: [500, 1000, 1500, 2000] },
    { key: 'inhibitor', label: 'Inhibitor Level', unit: 'ppm', min: 50, max: 300, presets: [50, 100, 200, 300] },
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 200, presets: [0, 50, 100, 150, 200] },
    { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 2, presets: [0, 0.5, 1.0, 1.5, 2.0] },
    { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 2000, presets: [500, 1000, 1500, 2000] },
    { key: 'molybdate', label: 'Molybdate', unit: 'ppm', min: 5, max: 30, presets: [5, 10, 15, 20, 30] },
    { key: 'bacteria', label: 'Bacteria (Dip Slide)', unit: 'CFU/mL', min: 0, max: 1000, presets: [0, 100, 500, 1000] },
  ],
  cooling_tower: [
    { key: 'ph', label: 'pH', unit: '', min: 8.0, max: 9.0, presets: [8.0, 8.3, 8.6, 9.0] },
    { key: 'conductivity', label: 'Conductivity', unit: 'ÂµS/cm', min: 1000, max: 3000, presets: [1000, 1500, 2000, 3000] },
    { key: 'free_chlorine', label: 'Free Chlorine', unit: 'ppm', min: 0.2, max: 1.0, presets: [0.2, 0.5, 0.8, 1.0] },
    { key: 'inhibitor', label: 'Inhibitor/Molybdate', unit: 'ppm', min: 8, max: 12, presets: [8, 9, 10, 12] },
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 400, presets: [50, 150, 250, 400] },
    { key: 'bacteria', label: 'Bacteria (Dip Slide)', unit: 'CFU/mL', min: 0, max: 10000, presets: [0, 1000, 5000, 10000] },
  ],
  condensate: [
    { key: 'ph', label: 'pH', unit: '', min: 7.5, max: 9.0, presets: [7.5, 8.0, 8.5, 9.0] },
    { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 1.0, presets: [0, 0.25, 0.5, 1.0] },
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 0, targetZero: true, presets: [0] },
    { key: 'conductivity', label: 'Conductivity', unit: 'ÂµS/cm', min: 0, max: 100, presets: [10, 25, 50, 100] },
    { key: 'amine', label: 'Amine Residual', unit: 'ppm', min: 0, max: 10, presets: [0, 2, 5, 8, 10] },
  ],
  softener: [
    { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 0, targetZero: true, presets: [0] },
    { key: 'conductivity', label: 'Conductivity', unit: 'ÂµS/cm', min: 0, max: 1500, presets: [200, 500, 1000, 1500] },
  ],
};

export function fieldsForSystem(system) { return SYSTEM_FIELDS[system] || []; }
export function systemLabel(system) { return SYSTEM_META[system]?.label || system; }
export function systemIcon(system) { return SYSTEM_META[system]?.icon || 'â€¢'; }

