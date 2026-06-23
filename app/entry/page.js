'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

import { HOSPITALS as ALL_HOSPITALS } from '@/lib/hospitals';
import { SYSTEM_FIELDS, SYSTEM_META, SYSTEM_ORDER } from '@/lib/systemFields';
const HOSPITALS = ALL_HOSPITALS.map((h) => ({ id: h.id, name: h.name }));

const BOILER_FIELDS = [
  { key: 'ph', label: 'pH', unit: '', min: 8.5, max: 10.5, presets: [8.5, 9.0, 9.5, 10.0, 10.5] },
  { key: 'phosphate', label: 'Phosphate', unit: 'ppm', min: 20, max: 60, presets: [20, 30, 40, 50, 60] },
  { key: 'sulfite', label: 'Sulfite', unit: 'ppm', min: 20, max: 80, presets: [20, 40, 60, 80] },
  { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 0, targetZero: true, presets: [0] },
  { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 3500, presets: [500, 1000, 2000, 3000] },
  { key: 'alkalinity', label: 'Alkalinity (M)', unit: 'ppm', min: 100, max: 700, presets: [200, 350, 500, 700] },
  { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 3000, presets: [500, 1000, 2000, 3000] },
  { key: 'amine', label: 'Amine Residual', unit: 'ppm', min: 0, max: 10, presets: [0, 2, 5, 8, 10] },
];

const CHILLED_FIELDS = [
  { key: 'ph', label: 'pH', unit: '', min: 7.5, max: 9.5, presets: [7.5, 8.0, 8.5, 9.0, 9.5] },
  { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 2000, presets: [500, 1000, 1500, 2000] },
  { key: 'inhibitor', label: 'Inhibitor Level', unit: 'ppm', min: 50, max: 300, presets: [50, 100, 200, 300] },
  { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 200, presets: [0, 50, 100, 150, 200] },
  { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 2, presets: [0, 0.5, 1.0, 1.5, 2.0] },
  { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 2000, presets: [500, 1000, 1500, 2000] },
  { key: 'molybdate', label: 'Molybdate', unit: 'ppm', min: 5, max: 30, presets: [5, 10, 15, 20, 30] },
  { key: 'bacteria', label: 'Bacteria (Dip Slide)', unit: 'CFU/mL', min: 0, max: 1000, presets: [0, 100, 500, 1000] },
];

const SHIFT_TIMES = {
  '1st Shift': '5:00 AM – 1:30 PM',
  '2nd Shift': '1:00 PM – 9:30 PM',
  '3rd Shift': '9:00 PM – 5:30 AM',
};

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function isInRange(value, min, max, targetZero) {
  if (value === '' || value === undefined || value === null) return null;
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  if (targetZero) return n === 0;
  if (min === 0 && max === 0 && !targetZero) return null;
  return n >= min && n <= max;
}

// Visual range gauge component for mobile wizard
function RangeGauge({ value, min, max, targetZero }) {
  const numVal = parseFloat(value);
  const hasValue = value !== '' && value !== undefined && !isNaN(numVal);

  if (targetZero) {
    const inRange = hasValue && numVal === 0;
    return (
      <div className="mt-3">
        <div className="h-3 rounded-full bg-gray-200 relative overflow-hidden">
          <div className={`absolute inset-0 ${hasValue ? (inRange ? 'bg-green-400' : 'bg-red-400') : 'bg-gray-200'}`} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Target: 0</span>
          <span>{hasValue ? (inRange ? '✅ In Range' : '🔴 Out of Range') : ''}</span>
        </div>
      </div>
    );
  }

  if (min === 0 && max === 0) return null;

  // Calculate position percentage with padding
  const rangeSpan = max - min;
  const viewMin = min - rangeSpan * 0.3;
  const viewMax = max + rangeSpan * 0.3;
  const viewSpan = viewMax - viewMin;

  const greenStart = ((min - viewMin) / viewSpan) * 100;
  const greenEnd = ((max - viewMin) / viewSpan) * 100;
  const markerPos = hasValue ? Math.max(0, Math.min(100, ((numVal - viewMin) / viewSpan) * 100)) : null;
  const inRange = hasValue ? (numVal >= min && numVal <= max) : null;

  return (
    <div className="mt-3">
      <div className="h-3 rounded-full bg-red-200 relative overflow-hidden">
        <div
          className="absolute top-0 bottom-0 bg-green-300"
          style={{ left: `${greenStart}%`, width: `${greenEnd - greenStart}%` }}
        />
        {markerPos !== null && (
          <div
            className={`absolute top-[-2px] w-4 h-4 rounded-full border-2 border-white shadow-md ${inRange ? 'bg-green-600' : 'bg-red-600'}`}
            style={{ left: `calc(${markerPos}% - 8px)` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span>
        <span>{hasValue ? (inRange ? '✅ In Range' : '🔴 Out of Range') : 'Enter value'}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// Mobile wizard step component
function WizardStep({ children, title, subtitle }) {
  return (
    <div className="flex flex-col min-h-[60vh] justify-center px-2">
      {title && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function EntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [hospital, setHospital] = useState('');
  const [system, setSystem] = useState('boiler');
  const [facilitySystems, setFacilitySystems] = useState(null);
  const [customLib, setCustomLib] = useState({}); // key -> { label, icon, fields:[{key,label,min,max,unit}] }
  const [shift, setShift] = useState('1st Shift');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(nowTime);
  const [operatorName, setOperatorName] = useState('');
  const [testerName, setTesterName] = useState('');
  const [values, setValues] = useState({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [driftWarnings, setDriftWarnings] = useState([]);

  const [showCorrectiveAction, setShowCorrectiveAction] = useState(false);
  const [caAction, setCaAction] = useState('');
  const [caActionBy, setCaActionBy] = useState('');
  const [caFollowUp, setCaFollowUp] = useState(false);
  const [caFollowUpNotes, setCaFollowUpNotes] = useState('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u) {
      setOperatorName(u.name);
      setCaActionBy(u.name || u.username);
      if (u.hospital) setHospital(u.hospital);
      else {
        const qh = searchParams.get('hospital');
        if (qh) setHospital(qh);
      }
    }
  }, []);

  // Fields for the selected system — built-in from SYSTEM_FIELDS, or custom from the equipment library.
  const fieldsFor = (sys) => {
    if (SYSTEM_FIELDS[sys]) return SYSTEM_FIELDS[sys];
    if (customLib[sys]) return customLib[sys].fields;
    return [];
  };
  const labelFor = (sys) => (SYSTEM_META[sys]?.label) || customLib[sys]?.label || sys;
  const iconFor  = (sys) => (SYSTEM_META[sys]?.icon)  || customLib[sys]?.icon  || '🔧';
  const fields = fieldsFor(system);
  const availableSystems = (facilitySystems && facilitySystems.length) ? facilitySystems : SYSTEM_ORDER;

  const hasOOR = fields.some((f) => {
    const v = values[f.key];
    if (v === undefined || v === '') return false;
    return isInRange(v, f.min, f.max, f.targetZero) === false;
  });

  useEffect(() => {
    if (hasOOR && !showCorrectiveAction) {
      setShowCorrectiveAction(true);
    }
  }, [hasOOR]);

  // Load which systems the selected facility has; keep `system` valid for it.
  useEffect(() => {
    if (!hospital) { setFacilitySystems(null); return; }
    fetch('/api/equipment-profile', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setFacilitySystems(SYSTEM_ORDER); return; }
        const fac = (d.facilities || []).find(f => f.id === hospital);
        const has = fac ? SYSTEM_ORDER.filter(k => fac.profile && fac.profile[k]) : SYSTEM_ORDER;
        // Enterprise custom equipment this facility has turned on (only present when feature enabled).
        const customItems = (d.customEquipmentEnabled && fac && Array.isArray(fac.profile?.custom)) ? fac.profile.custom : [];
        const libMap = {};
        const customKeys = [];
        for (const c of customItems) {
          const key = typeof c === 'string' ? c : c.key;
          if (!key) continue;
          // prefer the stored params; otherwise pull from the library payload
          const libDef = (d.library || []).find(l => l.key === key);
          const params = (c.params && c.params.length ? c.params : (libDef?.params || []));
          libMap[key] = {
            label: c.label || libDef?.label || key,
            icon: c.icon || libDef?.icon || '🔧',
            fields: params.map(p => ({ key: p.key, label: p.label + (p.unit ? ` (${p.unit})` : ''), min: p.min, max: p.max, unit: p.unit, targetZero: (p.min === 0 && p.max === 0) })),
          };
          customKeys.push(key);
        }
        setCustomLib(libMap);
        const list = [...(has.length ? has : SYSTEM_ORDER), ...customKeys];
        setFacilitySystems(list);
        setSystem(prev => list.includes(prev) ? prev : list[0]);
      })
      .catch(() => { setFacilitySystems(SYSTEM_ORDER); setCustomLib({}); });
  }, [hospital]);

    const allFilled = hospital && operatorName && testerName && time && fields.every((f) => values[f.key] !== undefined && values[f.key] !== '');

  const getMissingFields = () => {
    const missing = [];
    if (!hospital) missing.push('Hospital');
    if (!testerName) missing.push('Tester Name');
    if (!operatorName) missing.push('Logged By');
    if (!time) missing.push('Time of Reading');
    fields.forEach((f) => {
      if (values[f.key] === undefined || values[f.key] === '') missing.push(f.label);
    });
    return missing;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!allFilled) {
      const missing = getMissingFields();
      setError(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    setError('');
    setSubmitting(true);
    setDriftWarnings([]);
    try {
      const body = {
        hospitalId: hospital,
        system,
        shift,
        date,
        time,
        operatorName,
        testerName,
        values,
        notes,
      };

      if (caAction.trim()) {
        body.correctiveAction = {
          action: caAction,
          actionBy: caActionBy || operatorName,
          followUpRequired: caFollowUp,
          followUpNotes: caFollowUpNotes,
        };
      }

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setValues({});
        setNotes('');
        setCaAction('');
        setCaFollowUp(false);
        setCaFollowUpNotes('');
        setShowCorrectiveAction(false);
        if (data.drift_warnings?.length > 0) {
          setDriftWarnings(data.drift_warnings);
        }
        if (isMobile) setWizardStep(0);
        setTimeout(() => setSuccess(false), 6000);
      } else {
        setError(data.error || 'Failed to save entry');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== MOBILE WIZARD ==========
  // Steps: 0=Hospital, 1=System, 2=Shift, 3=Tester/Time, 4..4+fields.length-1=Parameters, last=Review
  const PARAM_START = 4;
  const REVIEW_STEP = PARAM_START + fields.length;
  const TOTAL_STEPS = REVIEW_STEP + 1;

  const progress = ((wizardStep + 1) / TOTAL_STEPS) * 100;

  const canGoNext = () => {
    switch (wizardStep) {
      case 0: return !!hospital;
      case 1: return !!system;
      case 2: return !!shift;
      case 3: return !!testerName && !!time;
      default:
        if (wizardStep >= PARAM_START && wizardStep < REVIEW_STEP) {
          const fieldIdx = wizardStep - PARAM_START;
          const f = fields[fieldIdx];
          return values[f.key] !== undefined && values[f.key] !== '';
        }
        return true;
    }
  };

  const renderMobileWizard = () => {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 p-4 pt-16 pb-32">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Step {wizardStep + 1} of {TOTAL_STEPS}</span>
              <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0072CE] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-4 font-medium text-sm">
              ✅ Entry saved successfully!
              {driftWarnings.length > 0 && (
                <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  ⚠️ Trend warnings:
                  {driftWarnings.map((w, i) => (
                    <div key={i} className="mt-1">• {w.param} trending {w.direction}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Hospital */}
          {wizardStep === 0 && (
            <WizardStep title="Select Hospital" subtitle="Which facility are you logging for?">
              {user?.role === 'admin' ? (
                <div className="space-y-2">
                  {HOSPITALS.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => { setHospital(h.id); setWizardStep(1); }}
                      className={`w-full text-left px-4 py-4 rounded-xl text-base font-medium border-2 transition-all ${
                        hospital === h.id
                          ? 'bg-[#003366] text-white border-[#003366]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#003366] active:bg-gray-50'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800 bg-white rounded-xl p-6 border border-gray-200">
                    {HOSPITALS.find((h) => h.id === hospital)?.name || 'Your facility'}
                  </div>
                </div>
              )}
            </WizardStep>
          )}

          {/* Step 1: System */}
          {wizardStep === 1 && (
            <WizardStep title="Select System" subtitle="What type of water system?">
              <div className="space-y-3">
                {availableSystems.map((val) => { const label = iconFor(val) + ' ' + labelFor(val); return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setSystem(val); setValues({}); setWizardStep(2); }}
                    className={`w-full py-5 rounded-xl text-lg font-semibold border-2 transition-all ${
                      system === val
                        ? 'bg-[#003366] text-white border-[#003366]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] active:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ); })}
              </div>
            </WizardStep>
          )}

          {/* Step 2: Shift */}
          {wizardStep === 2 && (
            <WizardStep title="Select Shift" subtitle="Which shift are you on?">
              <div className="space-y-3">
                {Object.entries(SHIFT_TIMES).map(([s, timeRange]) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setShift(s); setWizardStep(3); }}
                    className={`w-full py-5 rounded-xl text-lg font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                      shift === s
                        ? 'bg-[#003366] text-white border-[#003366]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] active:bg-gray-50'
                    }`}
                  >
                    <span>{s}</span>
                    <span className={`text-sm font-normal ${shift === s ? 'text-blue-200' : 'text-gray-400'}`}>{timeRange}</span>
                  </button>
                ))}
              </div>
            </WizardStep>
          )}

          {/* Step 3: Tester Name + Time */}
          {wizardStep === 3 && (
            <WizardStep title="Who & When" subtitle="Enter tester info and reading time">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tester Name *</label>
                  <input
                    type="text"
                    value={testerName}
                    onChange={(e) => setTesterName(e.target.value)}
                    placeholder="Person who ran the test"
                    className="w-full border border-gray-300 rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                    style={{ minHeight: '48px', fontSize: '18px' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time of Reading</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                    style={{ minHeight: '48px', fontSize: '18px' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={today}
                    className="w-full border border-gray-300 rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                    style={{ minHeight: '48px', fontSize: '18px' }}
                  />
                </div>
              </div>
            </WizardStep>
          )}

          {/* Steps 4+: Parameter fields */}
          {wizardStep >= PARAM_START && wizardStep < REVIEW_STEP && (() => {
            const fieldIdx = wizardStep - PARAM_START;
            const f = fields[fieldIdx];
            const val = values[f.key] ?? '';
            const inRange = val !== '' ? isInRange(val, f.min, f.max, f.targetZero) : null;

            return (
              <WizardStep
                title={f.label}
                subtitle={f.targetZero ? 'Target: 0' : (f.min === 0 && f.max === 0) ? '' : `Acceptable: ${f.min} – ${f.max}${f.unit ? ` ${f.unit}` : ''}`}
              >
                <div className="space-y-4">
                  {/* Large number input */}
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={val}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder="Enter value"
                      autoFocus
                      className={`w-full border-2 rounded-2xl px-6 py-6 text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                        inRange === null
                          ? 'border-gray-300'
                          : inRange
                          ? 'border-green-400 bg-green-50'
                          : 'border-red-400 bg-red-50'
                      }`}
                    />
                    {f.unit && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">{f.unit}</span>
                    )}
                  </div>

                  {/* Range gauge */}
                  <RangeGauge value={val} min={f.min} max={f.max} targetZero={f.targetZero} />

                  {/* Quick-fill preset buttons */}
                  {f.presets && f.presets.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2 text-center">Quick fill:</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {f.presets.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setValues((prev) => ({ ...prev, [f.key]: String(p) }))}
                            className={`px-4 py-2.5 rounded-xl text-base font-semibold border-2 transition-all min-w-[60px] ${
                              val === String(p)
                                ? 'bg-[#003366] text-white border-[#003366]'
                                : 'bg-white text-gray-600 border-gray-200 active:bg-gray-100'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </WizardStep>
            );
          })()}

          {/* Review Step */}
          {wizardStep === REVIEW_STEP && (
            <WizardStep title="Review & Submit" subtitle="Check your readings before submitting">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="font-semibold text-gray-800 text-sm">
                    {HOSPITALS.find((h) => h.id === hospital)?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {iconFor(system)} {labelFor(system)} · {shift} · {date} @ {time}
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {fields.map((f) => {
                    const val = values[f.key] ?? '';
                    const inRange = isInRange(val, f.min, f.max, f.targetZero);
                    return (
                      <div key={f.key} className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">{f.label}</span>
                        <span className={`font-bold text-base ${
                          inRange === null ? 'text-gray-400' : inRange ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {val || '—'} {f.unit && <span className="text-gray-400 text-xs">{f.unit}</span>}
                          {inRange === false && ' 🔴'}
                          {inRange === true && ' 🟢'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                  Tester: {testerName} · Logged by: {operatorName}
                </div>

                {/* Notes */}
                <div className="px-4 py-3 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Any observations..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] resize-none"
                  />
                </div>

                {/* Corrective action for OOR */}
                {hasOOR && (
                  <div className="px-4 py-3 border-t border-orange-200 bg-orange-50">
                    <div className="text-sm font-semibold text-orange-700 mb-2">⚠️ Out-of-range values detected</div>
                    <textarea
                      value={caAction}
                      onChange={(e) => setCaAction(e.target.value)}
                      rows={2}
                      placeholder="Corrective action taken..."
                      className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Big submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !allFilled}
                className="w-full mt-6 bg-[#0072CE] hover:bg-[#005fa3] text-white font-bold py-5 rounded-2xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? 'Saving...' : '✅ Submit Entry'}
              </button>
            </WizardStep>
          )}

          {/* Navigation buttons — fixed at bottom */}
          {wizardStep < REVIEW_STEP && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3 z-40">
              {wizardStep > 0 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="flex-1 py-4 rounded-xl text-base font-semibold border-2 border-gray-300 text-gray-600 active:bg-gray-100"
                >
                  ← Back
                </button>
              )}
              <button
                type="button"
                onClick={() => setWizardStep(wizardStep + 1)}
                disabled={!canGoNext()}
                className="flex-1 py-4 rounded-xl text-base font-semibold bg-[#0072CE] text-white disabled:opacity-40 disabled:cursor-not-allowed active:bg-[#005fa3]"
              >
                Next →
              </button>
            </div>
          )}
          {wizardStep === REVIEW_STEP && wizardStep > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-40">
              <button
                type="button"
                onClick={() => setWizardStep(wizardStep - 1)}
                className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-gray-300 text-gray-600 active:bg-gray-100"
              >
                ← Back to edit
              </button>
            </div>
          )}
        </main>
      </div>
    );
  };

  // ========== DESKTOP FORM (original) ==========
  const renderDesktopForm = () => {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-2xl">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-bold text-gray-900">New Chemistry Entry</h1>
              <p className="text-gray-500 text-sm mt-1">Log a water chemistry reading for your shift</p>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 font-medium">
                ✅ Entry saved successfully!
                {driftWarnings.length > 0 && (
                  <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    ⚠️ Trend warnings detected:
                    {driftWarnings.map((w, i) => (
                      <div key={i} className="mt-1">• {w.param} is trending {w.direction} (current: {w.current}, limit: {w.limit})</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-5">
              {/* Hospital */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital</label>
                {user?.role === 'admin' ? (
                  <select
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                  >
                    <option value="">Select hospital...</option>
                    {HOSPITALS.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {HOSPITALS.find((h) => h.id === hospital)?.name || '—'}
                  </div>
                )}
              </div>

              {/* System selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableSystems.map((val) => { const label = iconFor(val) + ' ' + labelFor(val); return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setSystem(val); setValues({}); }}
                      className={`py-3 sm:py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        system === val
                          ? 'bg-[#003366] text-white border-[#003366]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366]'
                      }`}
                    >
                      {label}
                    </button>
                  ); })}
                </div>
              </div>

              {/* Shift selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(SHIFT_TIMES).map(([s, timeRange]) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShift(s)}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors flex flex-col items-center gap-0.5 ${
                        shift === s
                          ? 'bg-[#003366] text-white border-[#003366]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366]'
                      }`}
                    >
                      <span>{s}</span>
                      <span className={`text-xs font-normal ${shift === s ? 'text-blue-200' : 'text-gray-400'}`}>{timeRange}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time of Reading</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
                </div>
              </div>

              {/* Tester + Operator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tester Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={testerName} onChange={(e) => setTesterName(e.target.value)} required
                    placeholder="Person who ran the test"
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Logged By <span className="text-gray-400 font-normal text-xs">(submitter)</span>
                  </label>
                  <input type="text" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
                </div>
              </div>

              {/* Chemistry fields */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  {iconFor(system)} {labelFor(system)} Chemistry Values
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fields.map((f) => {
                    const val = values[f.key] ?? '';
                    const inRange = val !== '' ? isInRange(val, f.min, f.max, f.targetZero) : null;
                    return (
                      <div key={f.key} className="relative">
                        <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1">
                          <span>{f.label}{f.unit ? ` (${f.unit})` : ''}</span>
                          <span className="text-gray-400">
                            {f.targetZero ? 'Target: 0' : (f.min === 0 && f.max === 0) ? '' : `${f.min}–${f.max}`}
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" step="any" value={val}
                            onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            required placeholder="—"
                            className={`flex-1 border rounded-lg px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                              inRange === null ? 'border-gray-300' : inRange ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                            }`}
                          />
                          <span className="text-lg flex-shrink-0 w-6 text-center">
                            {inRange === null ? '' : inRange ? '🟢' : '🔴'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  placeholder="Any observations or follow-up items..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] resize-none" />
              </div>

              {/* Corrective Action */}
              <div className={`border rounded-xl overflow-hidden transition-all ${hasOOR ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                <button type="button" onClick={() => setShowCorrectiveAction(!showCorrectiveAction)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left transition-colors ${hasOOR ? 'text-orange-700' : 'text-gray-700'}`}>
                  <span>{hasOOR ? '⚠️ Log Corrective Action (out-of-range values detected)' : '🔧 Log Corrective Action (optional)'}</span>
                  <span className="text-gray-400">{showCorrectiveAction ? '▲' : '▼'}</span>
                </button>
                {showCorrectiveAction && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Action Taken <span className="text-red-500">*</span></label>
                      <textarea value={caAction} onChange={(e) => setCaAction(e.target.value)} rows={3}
                        placeholder="Describe the corrective action taken..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Performed By</label>
                      <input type="text" value={caActionBy} onChange={(e) => setCaActionBy(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={caFollowUp} onChange={(e) => setCaFollowUp(e.target.checked)} className="accent-[#0072CE]" />
                        <span className="text-sm text-gray-700">Follow-up required</span>
                      </label>
                    </div>
                    {caFollowUp && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Notes</label>
                        <textarea value={caFollowUpNotes} onChange={(e) => setCaFollowUpNotes(e.target.value)} rows={2}
                          placeholder="Describe the follow-up needed..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] resize-none" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="sticky bottom-4 sm:relative sm:bottom-auto">
                <button type="submit" disabled={submitting}
                  className="w-full bg-[#0072CE] hover:bg-[#005fa3] text-white font-semibold py-4 sm:py-3 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg sm:shadow-none">
                  {submitting ? 'Saving...' : 'Submit Entry'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  };

  // Render mobile wizard or desktop form based on viewport
  return isMobile ? renderMobileWizard() : renderDesktopForm();
}

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>}>
      <EntryForm />
    </Suspense>
  );
}
