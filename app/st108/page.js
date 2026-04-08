'use client';
/**
 * FacilityH2O — AAMI ST108:2023 Water Quality Entry
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';
import { ST108_WATER_TYPES, ST108_PARAMETERS, ST108_POINTS_OF_USE, evaluateST108Entry, getCorrectionLevel } from '@/lib/st108';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const now = () => new Date().toISOString().slice(0, 16);
const todayDate = () => new Date().toISOString().slice(0, 10);

export default function ST108EntryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [hospital, setHospital]     = useState('');
  const [waterType, setWaterType]   = useState('utility');
  const [pou, setPou]               = useState('');
  const [testDate, setTestDate]     = useState(todayDate());
  const [testTime, setTestTime]     = useState(new Date().toTimeString().slice(0, 5));
  const [technician, setTechnician] = useState('');
  const [values, setValues]         = useState({});
  const [notes, setNotes]           = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    setTechnician(u.name || u.username);
    if (u.hospital) setHospital(u.hospital);
  }, []);

  const params  = ST108_PARAMETERS[waterType] || [];
  const pouList = ST108_POINTS_OF_USE.filter((p) => p.waterTypes.includes(waterType));
  const eval_   = evaluateST108Entry(waterType, values);

  const setValue = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/st108/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital, waterType, pou, testDate, testTime, technician, values, notes,
          submittedBy: user?.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setSaved(true);
      setValues({});
      setNotes('');
      setTestDate(todayDate());
      setTestTime(new Date().toTimeString().slice(0, 5));
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">💧</span>
            <h1 className="text-2xl font-bold text-gray-900">AAMI ST108 Water Quality Log</h1>
            <span className="text-xs bg-[#003366] text-white px-2 py-1 rounded-full font-medium">ANSI/AAMI ST108:2023</span>
          </div>
          <p className="text-gray-500 text-sm">Log water quality readings per ST108 testing requirements. All entries are timestamped and retained for regulatory inspection.</p>
        </div>

        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            ✅ Entry saved successfully — recorded for ST108 compliance reporting.
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1 — Location & Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">1. Location & Water Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hospital / Facility *</label>
                <select
                  required value={hospital} onChange={(e) => setHospital(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                >
                  <option value="">Select hospital...</option>
                  {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Water Type (ST108) *</label>
                <select
                  value={waterType} onChange={(e) => { setWaterType(e.target.value); setPou(''); setValues({}); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                >
                  {Object.values(ST108_WATER_TYPES).map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">{ST108_WATER_TYPES[waterType]?.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Point of Use (POU) *</label>
                <select
                  required value={pou} onChange={(e) => setPou(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                >
                  <option value="">Select POU...</option>
                  {pouList.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Test Date *</label>
                <input
                  type="date" required value={testDate} onChange={(e) => setTestDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Test Time *</label>
                <input
                  type="time" required value={testTime} onChange={(e) => setTestTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Technician / Operator *</label>
                <input
                  type="text" required value={technician} onChange={(e) => setTechnician(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                  placeholder="Full name"
                />
              </div>
            </div>
          </div>

          {/* Step 2 — Parameter Readings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                2. {ST108_WATER_TYPES[waterType]?.label} Parameters
              </h2>
              {eval_.total > 0 && (
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${eval_.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {eval_.passCount}/{eval_.total} in spec
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold">Parameter</th>
                    <th className="text-left py-2 pr-4 font-semibold">ST108 Limit</th>
                    <th className="text-left py-2 pr-4 font-semibold">Frequency</th>
                    <th className="text-left py-2 pr-4 font-semibold">Method</th>
                    <th className="text-left py-2 font-semibold">Measured Value</th>
                    <th className="text-left py-2 pl-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {params.map((param) => {
                    const val = values[param.key] ?? '';
                    const result = val !== '' ? evaluateST108Entry(waterType, { [param.key]: val }) : null;
                    const isPass = result?.passCount === 1;
                    const isFail = result?.failCount === 1;
                    const caLevel = isFail ? getCorrectionLevel(waterType, param.key, val) : null;

                    const limitStr = param.max !== null && param.min !== null
                      ? `${param.min}–${param.max} ${param.unit}`
                      : param.max !== null ? `≤ ${param.max} ${param.unit}`
                      : `≥ ${param.min} ${param.unit}`;

                    return (
                      <tr key={param.key} className={`${isFail ? 'bg-red-50' : isPass ? 'bg-green-50/40' : ''}`}>
                        <td className="py-3 pr-4 font-medium text-gray-800 whitespace-nowrap">{param.label}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap font-mono text-xs">{limitStr}</td>
                        <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{param.frequency}</td>
                        <td className="py-3 pr-4 text-gray-400 text-xs">{param.method}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={val}
                              onChange={(e) => setValue(param.key, e.target.value)}
                              placeholder="—"
                              className={`w-24 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0072CE]
                                ${isFail ? 'border-red-400 bg-red-50' : isPass ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                            />
                            <span className="text-xs text-gray-400">{param.unit}</span>
                          </div>
                        </td>
                        <td className="py-3 pl-3">
                          {val === '' ? <span className="text-gray-300 text-xs">—</span>
                            : isPass ? <span className="text-green-600 text-xs font-bold">✓ PASS</span>
                            : (
                              <div>
                                <span className="text-red-600 text-xs font-bold">✗ FAIL</span>
                                {caLevel && (
                                  <div className={`text-xs mt-0.5 font-semibold
                                    ${caLevel === CA_LEVELS?.critical ? 'text-red-700' : caLevel?.color === 'orange' ? 'text-orange-600' : 'text-yellow-600'}`}>
                                    {caLevel?.label} action required
                                  </div>
                                )}
                              </div>
                            )
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3 — Corrective Action Notes */}
          {eval_.failCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                ⚠️ Out-of-Specification — Corrective Action Required (ST108 §9)
              </h2>
              <ul className="text-sm text-red-700 mb-4 space-y-1">
                {eval_.failures.map((f, i) => (
                  <li key={i}>• <strong>{f.param?.label}</strong>: measured {f.value} {f.param?.unit} — limit {f.limit}</li>
                ))}
              </ul>
              <label className="block text-xs font-semibold text-red-700 mb-1">
                Corrective Action Taken / Notes * (required when parameters fail)
              </label>
              <textarea
                required={eval_.failCount > 0}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe corrective action: retest scheduled, device reprocessing halted, system flushed, maintenance notified, etc."
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          )}

          {eval_.failCount === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">3. Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes about conditions, equipment state, sample collection method, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !hospital || !pou}
              className="bg-[#0072CE] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#005fa3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : '💾 Save ST108 Entry'}
            </button>
            <span className="text-xs text-gray-400">
              Entry will be logged with timestamp and included in monthly compliance report
            </span>
          </div>

        </form>
      </main>
    </div>
  );
}
