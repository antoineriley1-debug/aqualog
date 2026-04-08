'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

import { HOSPITALS as ALL_HOSPITALS } from '@/lib/hospitals';
const HOSPITALS = ALL_HOSPITALS.map((h) => ({ id: h.id, name: h.name }));

const BOILER_FIELDS = [
  { key: 'ph', label: 'pH', unit: '', min: 8.5, max: 10.5 },
  { key: 'phosphate', label: 'Phosphate', unit: 'ppm', min: 20, max: 60 },
  { key: 'sulfite', label: 'Sulfite', unit: 'ppm', min: 20, max: 80 },
  { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 0, targetZero: true },
  { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 3500 },
  { key: 'alkalinity', label: 'Alkalinity (M)', unit: 'ppm', min: 100, max: 700 },
  { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 3000 },
  { key: 'amine', label: 'Amine Residual', unit: 'ppm', min: 0, max: 10 },
];

const CHILLED_FIELDS = [
  { key: 'ph', label: 'pH', unit: '', min: 7.5, max: 9.5 },
  { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 0, max: 2000 },
  { key: 'inhibitor', label: 'Inhibitor Level', unit: 'ppm', min: 50, max: 300 },
  { key: 'hardness', label: 'Hardness', unit: 'ppm', min: 0, max: 200 },
  { key: 'iron', label: 'Iron', unit: 'ppm', min: 0, max: 2 },
  { key: 'tds', label: 'TDS', unit: 'ppm', min: 0, max: 2000 },
  { key: 'molybdate', label: 'Molybdate', unit: 'ppm', min: 5, max: 30 },
  { key: 'bacteria', label: 'Bacteria (Dip Slide)', unit: 'CFU/mL', min: 0, max: 1000 },
];

const SHIFT_TIMES = {
  '1st Shift': '5:00 AM – 1:30 PM',
  '2nd Shift': '1:00 PM – 9:30 PM',
  '3rd Shift': '9:00 PM – 5:30 AM',
};

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('facilityh2o_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function isInRange(value, min, max, targetZero) {
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  if (targetZero) return n === 0;
  return n >= min && n <= max;
}

function EntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [hospital, setHospital] = useState('');
  const [system, setSystem] = useState('boiler');
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

  // Corrective action
  const [showCorrectiveAction, setShowCorrectiveAction] = useState(false);
  const [caAction, setCaAction] = useState('');
  const [caActionBy, setCaActionBy] = useState('');
  const [caFollowUp, setCaFollowUp] = useState(false);
  const [caFollowUpNotes, setCaFollowUpNotes] = useState('');

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

  const fields = system === 'boiler' ? BOILER_FIELDS : CHILLED_FIELDS;

  // Detect if any field is OOR
  const hasOOR = fields.some((f) => {
    const v = values[f.key];
    if (v === undefined || v === '') return false;
    const inRange = isInRange(v, f.min, f.max, f.targetZero);
    return inRange === false;
  });

  // Auto-show corrective action when OOR detected
  useEffect(() => {
    if (hasOOR && !showCorrectiveAction) {
      setShowCorrectiveAction(true);
    }
  }, [hasOOR]);

  const allFilled = hospital && operatorName && testerName && time && fields.every((f) => values[f.key] !== undefined && values[f.key] !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allFilled) return;
    setSubmitting(true);
    setError('');
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

      // Include corrective action if filled
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

            {/* System selector — card style on mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">System</label>
              <div className="grid grid-cols-2 gap-3">
                {[['boiler', '🔥 Boiler Water'], ['chilled', '❄️ Chilled Water']].map(([val, label]) => (
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
                ))}
              </div>
            </div>

            {/* Shift selector — card style */}
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
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Time of Reading</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
            </div>

            {/* Tester + Operator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tester Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  required
                  placeholder="Person who ran the test"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Logged By <span className="text-gray-400 font-normal text-xs">(submitter)</span>
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>
            </div>

            {/* Chemistry fields — single column on mobile, 2 cols on desktop */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3">
                {system === 'boiler' ? '🔥 Boiler Water' : '❄️ Chilled Water'} Chemistry Values
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
                          {f.targetZero ? 'Target: 0' : `${f.min}–${f.max}`}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          required
                          placeholder="—"
                          className={`flex-1 border rounded-lg px-3 py-3 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] ${
                            inRange === null
                              ? 'border-gray-300'
                              : inRange
                              ? 'border-green-400 bg-green-50'
                              : 'border-red-400 bg-red-50'
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
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any observations or follow-up items..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] resize-none"
              />
            </div>

            {/* Corrective Action section */}
            <div className={`border rounded-xl overflow-hidden transition-all ${hasOOR ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setShowCorrectiveAction(!showCorrectiveAction)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left transition-colors ${hasOOR ? 'text-orange-700' : 'text-gray-700'}`}
              >
                <span>{hasOOR ? '⚠️ Log Corrective Action (out-of-range values detected)' : '🔧 Log Corrective Action (optional)'}</span>
                <span className="text-gray-400">{showCorrectiveAction ? '▲' : '▼'}</span>
              </button>

              {showCorrectiveAction && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Action Taken <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={caAction}
                      onChange={(e) => setCaAction(e.target.value)}
                      rows={3}
                      placeholder="Describe the corrective action taken..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Performed By</label>
                    <input
                      type="text"
                      value={caActionBy}
                      onChange={(e) => setCaActionBy(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={caFollowUp}
                        onChange={(e) => setCaFollowUp(e.target.checked)}
                        className="accent-[#0072CE]"
                      />
                      <span className="text-sm text-gray-700">Follow-up required</span>
                    </label>
                  </div>
                  {caFollowUp && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Notes</label>
                      <textarea
                        value={caFollowUpNotes}
                        onChange={(e) => setCaFollowUpNotes(e.target.value)}
                        rows={2}
                        placeholder="Describe the follow-up needed..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit button — sticky on mobile */}
            <div className="sticky bottom-4 sm:relative sm:bottom-auto">
              <button
                type="submit"
                disabled={!allFilled || submitting}
                className="w-full bg-[#0072CE] hover:bg-[#005fa3] text-white font-semibold py-4 sm:py-3 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg sm:shadow-none"
              >
                {submitting ? 'Saving...' : 'Submit Entry'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>}>
      <EntryForm />
    </Suspense>
  );
}
