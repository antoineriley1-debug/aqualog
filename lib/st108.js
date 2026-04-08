/**
 * FacilityH2O — ANSI/AAMI ST108:2023 Compliance Engine
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Reference: ANSI/AAMI ST108:2023 — Water for the Processing of Medical Devices
 * Effective: August 4, 2023 (ANSI ratification)
 */

// ─────────────────────────────────────────────────────────────
// WATER CATEGORIES (ST108 Section 4)
// ─────────────────────────────────────────────────────────────
export const ST108_WATER_TYPES = {
  utility: {
    id: 'utility',
    label: 'Utility Water',
    description: 'Tap/pretreated water. Used for flushing, washing, intermediate rinsing.',
    color: 'blue',
    frequency: 'Daily or per shift',
  },
  critical: {
    id: 'critical',
    label: 'Critical Water',
    description: 'RO/DI treated. Used for final rinsing, reprocessing, disinfection.',
    color: 'purple',
    frequency: 'Daily minimum; continuous monitoring preferred',
  },
  steam: {
    id: 'steam',
    label: 'Steam / Condensate',
    description: 'Boiler or local steam generator output. Used for sterilization.',
    color: 'orange',
    frequency: 'Per sterilization cycle; monthly lab test',
  },
};

// ─────────────────────────────────────────────────────────────
// PARAMETER LIMITS (ST108 Table 4 + Table 5)
// ─────────────────────────────────────────────────────────────
export const ST108_PARAMETERS = {
  utility: [
    { key: 'ph',           label: 'pH',               unit: '',         min: 5.0,  max: 9.5,   precision: 1,  frequency: 'Daily',   method: 'Meter/strip', notesKey: 'ph_notes' },
    { key: 'conductivity', label: 'Conductivity',      unit: 'µS/cm',   min: null, max: 500,   precision: 0,  frequency: 'Daily',   method: 'Meter' },
    { key: 'turbidity',    label: 'Turbidity',         unit: 'NTU',     min: null, max: 1.0,   precision: 2,  frequency: 'Daily',   method: 'Turbidimeter' },
    { key: 'hardness',     label: 'Total Hardness',    unit: 'mg/L CaCO₃', min: null, max: 500, precision: 0, frequency: 'Weekly', method: 'Test kit/lab' },
    { key: 'chlorine',     label: 'Free Chlorine',     unit: 'mg/L',    min: null, max: 0.5,   precision: 2,  frequency: 'Daily',   method: 'Colorimetric' },
    { key: 'tds',          label: 'Total Dissolved Solids', unit: 'mg/L', min: null, max: 500, precision: 0,  frequency: 'Daily',   method: 'Meter' },
    { key: 'bacteria',     label: 'Heterotrophic Bacteria', unit: 'CFU/mL', min: null, max: 200, precision: 0, frequency: 'Monthly', method: 'Lab culture' },
    { key: 'iron',         label: 'Iron (total)',       unit: 'mg/L',    min: null, max: 0.3,   precision: 2,  frequency: 'Monthly', method: 'Lab/kit' },
  ],
  critical: [
    { key: 'ph',           label: 'pH',               unit: '',         min: 5.0,  max: 7.5,   precision: 1,  frequency: 'Daily',   method: 'Meter' },
    { key: 'conductivity', label: 'Conductivity',      unit: 'µS/cm',   min: null, max: 15,    precision: 1,  frequency: 'Daily (continuous preferred)', method: 'Meter/sensor' },
    { key: 'turbidity',    label: 'Turbidity',         unit: 'NTU',     min: null, max: 0.2,   precision: 2,  frequency: 'Daily',   method: 'Turbidimeter' },
    { key: 'toc',          label: 'Total Organic Carbon', unit: 'mg/L', min: null, max: 0.5,   precision: 2,  frequency: 'Monthly', method: 'Lab' },
    { key: 'endotoxins',   label: 'Endotoxins (LAL)',  unit: 'EU/mL',   min: null, max: 0.25,  precision: 3,  frequency: 'Monthly', method: 'LAL lab test' },
    { key: 'bacteria',     label: 'Heterotrophic Bacteria', unit: 'CFU/mL', min: null, max: 10, precision: 0, frequency: 'Monthly', method: 'Lab culture (R2A agar)' },
    { key: 'tds',          label: 'Total Dissolved Solids', unit: 'mg/L', min: null, max: 10,  precision: 1,  frequency: 'Daily',   method: 'Meter' },
    { key: 'silica',       label: 'Silica',             unit: 'mg/L',    min: null, max: 0.1,   precision: 2,  frequency: 'Monthly', method: 'Lab' },
    { key: 'hardness',     label: 'Total Hardness',    unit: 'mg/L CaCO₃', min: null, max: 1, precision: 1, frequency: 'Daily',   method: 'Meter/kit' },
    { key: 'chlorine',     label: 'Free Chlorine',     unit: 'mg/L',    min: null, max: 0.1,   precision: 2,  frequency: 'Daily',   method: 'Colorimetric' },
    { key: 'iron',         label: 'Iron (total)',       unit: 'mg/L',    min: null, max: 0.1,   precision: 2,  frequency: 'Monthly', method: 'Lab/ICP' },
    { key: 'copper',       label: 'Copper',             unit: 'mg/L',    min: null, max: 0.1,   precision: 2,  frequency: 'Monthly', method: 'Lab/ICP' },
    { key: 'lead',         label: 'Lead',               unit: 'mg/L',    min: null, max: 0.005, precision: 3,  frequency: 'Annual',  method: 'Lab/ICP' },
  ],
  steam: [
    { key: 'conductivity', label: 'Condensate Conductivity', unit: 'µS/cm', min: null, max: 3.0, precision: 1, frequency: 'Monthly', method: 'Meter' },
    { key: 'ph',           label: 'pH',               unit: '',         min: 5.0,  max: 7.0,   precision: 1,  frequency: 'Monthly', method: 'Meter' },
    { key: 'hardness',     label: 'Hardness',          unit: 'mg/L CaCO₃', min: null, max: 0.02, precision: 3, frequency: 'Monthly', method: 'Lab' },
    { key: 'silica',       label: 'Silica',             unit: 'mg/L',    min: null, max: 0.1,   precision: 2,  frequency: 'Monthly', method: 'Lab' },
    { key: 'iron',         label: 'Iron',               unit: 'mg/L',    min: null, max: 0.1,   precision: 2,  frequency: 'Monthly', method: 'Lab/ICP' },
    { key: 'bacteria',     label: 'Heterotrophic Bacteria', unit: 'CFU/mL', min: null, max: 10, precision: 0, frequency: 'Quarterly', method: 'Lab culture' },
    { key: 'endotoxins',   label: 'Endotoxins (LAL)',  unit: 'EU/mL',   min: null, max: 0.25,  precision: 3,  frequency: 'Quarterly', method: 'LAL lab test' },
    { key: 'superheat',    label: 'Superheat',          unit: '°C',      min: null, max: 25,    precision: 1,  frequency: 'Per cycle', method: 'Thermometer/recorder' },
    { key: 'dryness',      label: 'Steam Dryness',      unit: '%',       min: 97,   max: null,  precision: 1,  frequency: 'Quarterly', method: 'Dryness test / Bowie-Dick' },
  ],
};

// ─────────────────────────────────────────────────────────────
// POINT-OF-USE LOCATIONS (ST108 Section 8 - common SPD/CS locations)
// ─────────────────────────────────────────────────────────────
export const ST108_POINTS_OF_USE = [
  { id: 'pou_washer',     label: 'Washer-Disinfector Inlet',    waterTypes: ['utility', 'critical'] },
  { id: 'pou_ultrasonic', label: 'Ultrasonic Cleaner',          waterTypes: ['utility'] },
  { id: 'pou_rinsing',    label: 'Final Rinse Station',         waterTypes: ['critical'] },
  { id: 'pou_aer',        label: 'Automatic Endoscope Reprocessor (AER)', waterTypes: ['critical'] },
  { id: 'pou_autoclave',  label: 'Steam Sterilizer Inlet',      waterTypes: ['critical', 'steam'] },
  { id: 'pou_storage',    label: 'Critical Water Storage Tank', waterTypes: ['critical'] },
  { id: 'pou_distribution', label: 'Distribution Loop',        waterTypes: ['critical'] },
  { id: 'pou_ro',         label: 'RO System Permeate',          waterTypes: ['critical'] },
  { id: 'pou_di',         label: 'DI Polisher Output',          waterTypes: ['critical'] },
  { id: 'pou_steam_gen',  label: 'Steam Generator/Boiler',      waterTypes: ['steam'] },
];

// ─────────────────────────────────────────────────────────────
// COMPLIANCE EVALUATION
// ─────────────────────────────────────────────────────────────
export function evaluateST108Reading(waterType, paramKey, value) {
  const params = ST108_PARAMETERS[waterType] || [];
  const param  = params.find((p) => p.key === paramKey);
  if (!param) return { status: 'unknown', param: null };

  const num = parseFloat(value);
  if (isNaN(num)) return { status: 'no-data', param };

  let pass = true;
  if (param.min !== null && num < param.min) pass = false;
  if (param.max !== null && num > param.max) pass = false;

  return {
    status: pass ? 'pass' : 'fail',
    param,
    value: num,
    limit: param.max !== null ? `≤ ${param.max} ${param.unit}` : `≥ ${param.min} ${param.unit}`,
  };
}

export function evaluateST108Entry(waterType, values) {
  const params = ST108_PARAMETERS[waterType] || [];
  const results = [];
  let passCount = 0;

  for (const param of params) {
    const v = values?.[param.key];
    if (v !== undefined && v !== null && v !== '') {
      const r = evaluateST108Reading(waterType, param.key, v);
      results.push(r);
      if (r.status === 'pass') passCount++;
    }
  }

  const total   = results.length;
  const failures = results.filter((r) => r.status === 'fail');

  return {
    total,
    passCount,
    failCount: failures.length,
    pass: failures.length === 0,
    failures,
    results,
    compliancePct: total > 0 ? Math.round((passCount / total) * 100) : null,
  };
}

// ─────────────────────────────────────────────────────────────
// ST108 ANNUAL SELF-AUDIT CHECKLIST (based on AAMI TIR & ST108 sections)
// ─────────────────────────────────────────────────────────────
export const ST108_AUDIT_SECTIONS = [
  {
    id: 'wmp',
    title: 'Water Management Program (WMP)',
    reference: 'ST108 §5',
    items: [
      { id: 'wmp_1', text: 'A written Water Management Program (WMP) is in place and current', required: true },
      { id: 'wmp_2', text: 'WMP is reviewed and approved by senior executive sponsor', required: true },
      { id: 'wmp_3', text: 'Multidisciplinary WMP team is established (Facilities, IP, SPD, Clinical Eng.)', required: true },
      { id: 'wmp_4', text: 'All points of use (POUs) are identified and documented', required: true },
      { id: 'wmp_5', text: 'Water schematic / flow diagram is current and accurate', required: true },
      { id: 'wmp_6', text: 'WMP has been updated within the past 12 months', required: true },
      { id: 'wmp_7', text: 'Training records for all WMP team members are maintained', required: true },
    ],
  },
  {
    id: 'treatment',
    title: 'Water Treatment Equipment',
    reference: 'ST108 §6',
    items: [
      { id: 'trt_1', text: 'RO/DI system is installed and functional for critical water production', required: true },
      { id: 'trt_2', text: 'Water treatment equipment is maintained per manufacturer schedule', required: true },
      { id: 'trt_3', text: 'Pretreatment system (softener, carbon filter) is operational', required: false },
      { id: 'trt_4', text: 'Membrane replacement records are current', required: true },
      { id: 'trt_5', text: 'Sanitization/disinfection of distribution loop is performed per schedule', required: true },
      { id: 'trt_6', text: 'Storage tank(s) are inspected and sanitized per schedule', required: true },
      { id: 'trt_7', text: 'Equipment calibration records are current', required: true },
    ],
  },
  {
    id: 'monitoring',
    title: 'Water Quality Monitoring',
    reference: 'ST108 §8 / Table 4',
    items: [
      { id: 'mon_1', text: 'Utility water tested at minimum daily per ST108 Table 4 schedule', required: true },
      { id: 'mon_2', text: 'Critical water conductivity and pH tested daily', required: true },
      { id: 'mon_3', text: 'Critical water microbial (bacteria / endotoxin) tested monthly', required: true },
      { id: 'mon_4', text: 'Steam condensate tested at least quarterly', required: true },
      { id: 'mon_5', text: 'All 18 ST108 parameters are being monitored at appropriate frequency', required: true },
      { id: 'mon_6', text: 'Certified lab used for microbial / endotoxin testing', required: true },
      { id: 'mon_7', text: 'Chain of custody documented for all lab samples', required: true },
      { id: 'mon_8', text: 'All test results logged with date, time, POU, and technician', required: true },
      { id: 'mon_9', text: 'Out-of-specification results trigger corrective action within 24 hours', required: true },
    ],
  },
  {
    id: 'steam',
    title: 'Steam & Sterilization Water',
    reference: 'ST108 §7',
    items: [
      { id: 'stm_1', text: 'Steam condensate tested per ST108 Table 5 schedule', required: true },
      { id: 'stm_2', text: 'Steam quality (superheat, dryness) tested at least quarterly', required: true },
      { id: 'stm_3', text: 'Bowie-Dick test performed daily on pre-vacuum sterilizers', required: true },
      { id: 'stm_4', text: 'Feed water to steam generator meets critical water standards', required: true },
      { id: 'stm_5', text: 'Steam generator descaling performed per schedule', required: false },
    ],
  },
  {
    id: 'corrective',
    title: 'Corrective & Preventive Actions',
    reference: 'ST108 §9',
    items: [
      { id: 'ca_1', text: 'Written corrective action (CA) procedure is in place', required: true },
      { id: 'ca_2', text: 'All out-of-spec results have documented corrective actions', required: true },
      { id: 'ca_3', text: 'Root cause analysis performed for repeated failures', required: true },
      { id: 'ca_4', text: 'Device reprocessing is halted when critical water fails spec', required: true },
      { id: 'ca_5', text: 'CA log is reviewed at WMP team meetings', required: true },
    ],
  },
  {
    id: 'documentation',
    title: 'Documentation & Recordkeeping',
    reference: 'ST108 §10 / Joint Commission EC.02.05.02',
    items: [
      { id: 'doc_1', text: 'All water quality records retained for minimum 3 years', required: true },
      { id: 'doc_2', text: 'Records available for Joint Commission / CMS survey on demand', required: true },
      { id: 'doc_3', text: 'Monthly compliance reports generated and reviewed', required: true },
      { id: 'doc_4', text: 'Annual WMP review report completed and signed', required: true },
      { id: 'doc_5', text: 'Equipment service records maintained', required: true },
      { id: 'doc_6', text: 'Staff competency records up to date', required: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// CORRECTIVE ACTION LEVELS
// ─────────────────────────────────────────────────────────────
export const CA_LEVELS = {
  advisory: { label: 'Advisory',   color: 'yellow', description: 'Approaching limit — increase frequency' },
  action:   { label: 'Action',     color: 'orange', description: 'Limit exceeded — investigate, retest within 24h' },
  critical: { label: 'Critical',   color: 'red',    description: 'Immediate halt of device reprocessing required' },
};

export function getCorrectionLevel(waterType, paramKey, value) {
  const result = evaluateST108Reading(waterType, paramKey, value);
  if (result.status !== 'fail') return null;

  const num  = parseFloat(value);
  const lim  = result.param?.max;

  if (!lim) return CA_LEVELS.action;

  // Critical params always trigger critical CA
  const criticalParams = ['endotoxins', 'bacteria', 'lead'];
  if (criticalParams.includes(paramKey)) return CA_LEVELS.critical;

  // > 2x limit = critical
  if (num > lim * 2) return CA_LEVELS.critical;

  // > 1.2x limit = action
  if (num > lim * 1.2) return CA_LEVELS.action;

  return CA_LEVELS.advisory;
}
