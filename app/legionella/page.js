'use client';
/**
 * FacilityH2O — Legionella / Water Management Plan Log
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Reference: ASHRAE 188-2018, Joint Commission EC.02.05.02, CMS QSO17-30,
 *            CDC Water Management Program guidelines
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';
import {
  LEGIONELLA_SYSTEMS, LEGIONELLA_PARAMETERS,
  getLegionellaActionLevel, evaluateLegionellaEntry,
} from '@/lib/legionella';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('facilityh2o_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const RISK_COLORS = { HIGH: 'red', MEDIUM: 'yellow', LOW: 'green' };

export default function LegionellaPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [hospital, setHospital]   = useState('');
  const [systemType, setSystemType] = useState('cooling_tower');
  // Track N/A per system type — persists across system switches so you can mark multiple
  const [naBySystem, setNaBySystem] = useState({});
  const [location, setLocation]   = useState('');
  const [testDate, setTestDate]   = useState(new Date().toISOString().slice(0, 10));
  const [testTime, setTestTime]   = useState(new Date().toTimeString().slice(0, 5));
  const [technician, setTechnician] = useState('');
  const [values, setValues]       = useState({});
  const [notes, setNotes]         = useState('');
  const [caAction, setCaAction]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    setTechnician(u.name || u.username);
    if (u.hospital) setHospital(u.hospital);
  }, []);

  const system = LEGIONELLA_SYSTEMS[systemType];
  const params = LEGIONELLA_PARAMETERS[systemType] || [];
  const eval_  = evaluateLegionellaEntry(systemType, values);

  // Check for Legionella culture result to determine action level
  const cfuVal     = values['legionella_culture'];
  const actionLevel = cfuVal ? getLegionellaActionLevel(systemType, cfuVal) : null;
  const isShutdown  = actionLevel?.label === 'SHUTDOWN' || actionLevel?.label === 'NOTIFICATION';
  const needsCA     = eval_.failures.length > 0 || (actionLevel && actionLevel.color !== 'green');

  const setValue = (key, val) => setValues((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/legionella/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital, systemType, location, testDate, testTime,
          technician,
          not_applicable: naBySystem[systemType],
          values: naBySystem[systemType] ? {} : values,
          notes: naBySystem[systemType] ? 'N/A — System not present at this facility' : notes,
          corrective_action: naBySystem[systemType] ? '' : caAction,
          actionLevel: naBySystem[systemType] ? null : (actionLevel?.label || null),
          requiresShutdown: naBySystem[systemType] ? false : isShutdown,
          submittedBy: user?.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setSaved(true);
      setValues({}); setNotes(''); setCaAction('');
      setTimeout(() => setSaved(false), 4000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🦠</span>
            <h1 className="text-2xl font-bold text-gray-900">Legionella / WMP Log</h1>
            <span className="text-xs bg-red-700 text-white px-2 py-1 rounded-full font-medium">ASHRAE 188 · EC.02.05.02</span>
          </div>
          <p className="text-gray-500 text-sm">Log water system monitoring per Water Management Program. Required for Joint Commission, CMS, and DOH compliance.</p>
        </div>

        {saved && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium">✅ Entry saved — included in WMP compliance records.</div>}
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">⚠️ {error}</div>}

        {isShutdown && (
          <div className="mb-6 bg-red-700 text-white px-6 py-4 rounded-xl font-bold text-sm animate-pulse">
            🚨 LEGIONELLA ACTION REQUIRED: {actionLevel?.action} — Notify Infection Prevention and Facilities Director immediately.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* System Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">1. Water System</h2>
              <p className="text-xs text-gray-400">Select the system to log. Check <strong>N/A</strong> on any system that doesn't exist at this site.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {Object.values(LEGIONELLA_SYSTEMS).map((sys) => {
                const isNA      = !!naBySystem[sys.id];
                const isSelected = systemType === sys.id;
                return (
                  <div key={sys.id} className="relative">
                    {/* N/A badge toggle — top right of each card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNaBySystem((prev) => ({ ...prev, [sys.id]: !prev[sys.id] }));
                        if (!naBySystem[sys.id] && systemType === sys.id) { setValues({}); setCaAction(''); }
                      }}
                      className={`absolute top-1.5 right-1.5 z-10 text-xs px-1.5 py-0.5 rounded font-bold border transition
                        ${isNA ? 'bg-gray-500 text-white border-gray-500' : 'bg-white text-gray-400 border-gray-300 hover:border-gray-500 hover:text-gray-600'}`}
                      title={isNA ? 'Click to mark as active' : 'Click to mark as N/A (not at this site)'}
                    >
                      N/A
                    </button>

                    <button
                      type="button"
                      onClick={() => { if (!isNA) { setSystemType(sys.id); setValues({}); } }}
                      disabled={isNA}
                      className={`w-full p-3 pt-5 rounded-xl border text-left transition
                        ${isNA ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed' :
                          isSelected ? 'border-[#0072CE] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="text-xl mb-1">{sys.icon}</div>
                      <div className="text-xs font-bold text-gray-800">{sys.label}</div>
                      {isNA ? (
                        <div className="text-xs mt-1 font-semibold text-gray-400 italic">Not at this site</div>
                      ) : (
                        <div className={`text-xs mt-1 font-semibold
                          ${sys.risk === 'HIGH' ? 'text-red-600' : sys.risk === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {sys.risk} RISK
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">{sys.frequency}</div>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hospital *</label>
                <select required value={hospital} onChange={(e) => setHospital(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]">
                  <option value="">Select...</option>
                  {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Location / Unit *</label>
                <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Rooftop CT-1, Floor 3 Hot Water"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date *</label>
                <input type="date" required value={testDate} onChange={(e) => setTestDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Technician *</label>
                <input type="text" required value={technician} onChange={(e) => setTechnician(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
              </div>
            </div>
          </div>

          {/* Parameters — hidden when N/A */}
          {!naBySystem[systemType] && <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">2. {system?.label} Readings</h2>
              {eval_.total > 0 && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${eval_.allPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {eval_.pass}/{eval_.total} in spec
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold">Parameter</th>
                    <th className="text-left py-2 pr-4 font-semibold">Target / Limit</th>
                    <th className="text-left py-2 pr-4 font-semibold">Frequency</th>
                    <th className="text-left py-2 font-semibold">Value</th>
                    <th className="text-left py-2 pl-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {params.map((param) => {
                    const val = values[param.key] ?? '';
                    const num = parseFloat(val);
                    const inRange = !isNaN(num) &&
                      (param.min === null || num >= param.min) &&
                      (param.max === null || num <= param.max);
                    const isPass = val !== '' && !isNaN(num) && inRange;
                    const isFail = val !== '' && !isNaN(num) && !inRange;

                    // Special handling for Legionella culture
                    const isLegCulture = param.key === 'legionella_culture';
                    const legLevel     = isLegCulture && val ? getLegionellaActionLevel(systemType, val) : null;

                    const limitStr = param.max !== null && param.min !== null
                      ? `${param.min}–${param.max} ${param.unit}`
                      : param.max !== null ? `≤ ${param.max} ${param.unit}`
                      : param.min !== null ? `≥ ${param.min} ${param.unit}`
                      : '—';

                    return (
                      <tr key={param.key} className={isLegCulture && legLevel?.color === 'red' ? 'bg-red-100' : isFail ? 'bg-red-50' : isPass ? 'bg-green-50/30' : ''}>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-gray-800">{param.label}</div>
                          {param.note && <div className="text-xs text-gray-400 mt-0.5">{param.note}</div>}
                          {param.isLab && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Lab Test</span>}
                        </td>
                        <td className="py-3 pr-4 text-gray-500 font-mono text-xs whitespace-nowrap">{limitStr}</td>
                        <td className="py-3 pr-4 text-gray-400 text-xs">{param.frequency}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <input
                              type="number" step="any" value={val}
                              onChange={(e) => setValue(param.key, e.target.value)}
                              placeholder={param.isLab ? 'Lab result' : '—'}
                              className={`w-28 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0072CE]
                                ${isFail || (legLevel && legLevel.color !== 'green') ? 'border-red-400 bg-red-50' : isPass ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                            />
                            <span className="text-xs text-gray-400">{param.unit}</span>
                          </div>
                        </td>
                        <td className="py-3 pl-3">
                          {val === '' ? <span className="text-gray-300 text-xs">—</span>
                            : isLegCulture && legLevel ? (
                              <div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                  ${legLevel.color === 'green' ? 'bg-green-100 text-green-700'
                                  : legLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-700'
                                  : legLevel.color === 'orange' ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'}`}>
                                  {legLevel.label}
                                </span>
                                <div className="text-xs text-gray-500 mt-0.5">{legLevel.action}</div>
                              </div>
                            )
                            : isPass ? <span className="text-green-600 text-xs font-bold">✓ PASS</span>
                            : <span className="text-red-600 text-xs font-bold">✗ FAIL</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>}

          {/* Corrective Action */}
          {!naBySystem[systemType] && needsCA && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-6">
              <h2 className="text-sm font-bold text-red-700 mb-3">⚠️ Corrective Action Required</h2>
              {eval_.failures.map((f, i) => (
                <div key={i} className="text-sm text-red-600 mb-1">• {f.param.label}: {f.value} {f.param.unit} — limit {f.limit}</div>
              ))}
              {actionLevel && actionLevel.color !== 'green' && (
                <div className="mt-2 mb-3 p-3 bg-red-100 rounded-lg">
                  <div className="font-bold text-red-800">{actionLevel.label}: {actionLevel.action}</div>
                </div>
              )}
              <label className="block text-xs font-semibold text-red-700 mb-1">Corrective Action Taken *</label>
              <textarea required value={caAction} onChange={(e) => setCaAction(e.target.value)} rows={3}
                placeholder="Document immediate action: hyperchlorination initiated, shutdown confirmed, IP notified, DOH notified, retest scheduled..."
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes / Observations</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Optional: sample collection method, equipment condition, weather, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving || !hospital || !location}
              className="bg-[#0072CE] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#005fa3] transition disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save WMP Entry'}
            </button>
            <span className="text-xs text-gray-400">Logged with timestamp · retained per ASHRAE 188 / EC.02.05.02</span>
          </div>

        </form>
      </main>
    </div>
  );
}
