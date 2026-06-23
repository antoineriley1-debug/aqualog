'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

import { HOSPITALS as ALL_HOSPITALS } from '@/lib/hospitals';
import { SYSTEM_FIELDS, SYSTEM_META, SYSTEM_ORDER } from '@/lib/systemFields';
const HOSPITALS = ALL_HOSPITALS.map((h) => ({ id: h.id, name: h.name }));

// Badge color per system (icon + label come from SYSTEM_META). All five built-in systems supported.
const SYS_BADGE = {
  boiler:        'bg-orange-100 text-orange-700',
  chilled:       'bg-blue-100 text-blue-700',
  cooling_tower: 'bg-cyan-100 text-cyan-700',
  condensate:    'bg-sky-100 text-sky-700',
  softener:      'bg-slate-100 text-slate-700',
};

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function HistoryPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  // Filters
  const [filterHospital, setFilterHospital] = useState('');
  const [filterSystem, setFilterSystem] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    setUser(getUser());
    fetch('/api/entries')
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries || []); setLoading(false); });
  }, []);

  const filtered = entries
    .filter((e) => !filterHospital || e.hospitalId === filterHospital)
    .filter((e) => !filterSystem || e.system === filterSystem)
    .filter((e) => !filterShift || e.shift === filterShift)
    .filter((e) => !filterDateFrom || e.date >= filterDateFrom)
    .filter((e) => !filterDateTo || e.date <= filterDateTo)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const hospitalName = (id) => HOSPITALS.find((h) => h.id === id)?.name || id;

  const isFieldInRange = (f, val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return null;
    if (f.targetZero) return n === 0;
    return n >= f.min && n <= f.max;
  };

  const countOOR = (entry) => {
    const fields = SYSTEM_FIELDS[entry.system] || [];
    return fields.filter((f) => {
      const v = entry.values?.[f.key];
      if (v === undefined || v === null || v === '') return false;
      return isFieldInRange(f, v) === false;
    }).length;
  };

  const exportCSV = () => {
    const headers = ['Date', 'Shift', 'Hospital', 'System', 'Operator', 'pH', 'OOR Count', 'Notes'];
    const rows = filtered.map((e) => [
      e.date, e.shift, hospitalName(e.hospitalId), e.system,
      e.operatorName, e.values?.ph ?? '', countOOR(e), e.notes || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aqualog-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entry History</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} entries found</p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-[#003366] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#002244] transition-colors"
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {user?.role === 'admin' && (
            <select
              value={filterHospital}
              onChange={(e) => setFilterHospital(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            >
              <option value="">All Hospitals</option>
              {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
          <select
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            <option value="">All Systems</option>
            {SYSTEM_ORDER.map((sys) => (
              <option key={sys} value={sys}>{SYSTEM_META[sys]?.label || sys}</option>
            ))}
          </select>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            <option value="">All Shifts</option>
            <option value="1st Shift">1st Shift (5a–1:30p)</option>
            <option value="2nd Shift">2nd Shift (1p–9:30p)</option>
            <option value="3rd Shift">3rd Shift (9p–5:30a)</option>
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            placeholder="From"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            placeholder="To"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No entries match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shift</th>
                    {user?.role === 'admin' && (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">System</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tester</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Logged By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">pH</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">OOR</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((e) => {
                    const oor = countOOR(e);
                    const isExpanded = expanded === e.id;
                    const fields = SYSTEM_FIELDS[e.system] || [];
                    return (
                      <>
                        <tr
                          key={e.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setExpanded(isExpanded ? null : e.id)}
                        >
                          <td className="px-4 py-3 text-gray-700">{e.date}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.time || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{e.shift}</td>
                          {user?.role === 'admin' && (
                            <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{hospitalName(e.hospitalId)}</td>
                          )}
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${SYS_BADGE[e.system] || 'bg-gray-100 text-gray-700'}`}>
                              {SYSTEM_META[e.system]?.icon || '•'} {SYSTEM_META[e.system]?.label || e.system}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{e.testerName || e.operatorName}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{e.operatorName}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${
                              e.values?.ph !== undefined
                                ? (parseFloat(e.values.ph) >= 7.5 && parseFloat(e.values.ph) <= 10.5 ? 'text-green-600' : 'text-red-600')
                                : 'text-gray-400'
                            }`}>
                              {e.values?.ph ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {oor > 0 ? (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{oor} OOR</span>
                            ) : (
                              <span className="text-xs text-green-600">✓ All OK</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${e.id}-exp`} className="bg-gray-50">
                            <td colSpan={user?.role === 'admin' ? 8 : 7} className="px-6 py-4">
                              <div className="grid grid-cols-4 gap-3 mb-3">
                                {fields.map((f) => {
                                  const val = e.values?.[f.key];
                                  const inRange = val !== undefined && val !== null && val !== '' ? isFieldInRange(f, val) : null;
                                  const rangeStr = f.targetZero ? 'Target: 0' : `${f.min}–${f.max}`;
                                  return (
                                    <div key={f.key} className={`p-2 rounded-lg text-xs ${inRange === null ? 'bg-gray-50 border border-gray-200' : inRange ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                      <div className="text-gray-500">{f.label}</div>
                                      <div className={`font-bold text-sm mt-0.5 ${inRange === null ? 'text-gray-400' : inRange ? 'text-green-700' : 'text-red-700'}`}>
                                        {val ?? '—'} {inRange === null ? '' : inRange ? '●' : '●'}
                                      </div>
                                      <div className="text-gray-400">{rangeStr}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              {e.notes && (
                                <div className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200 mb-2">
                                  <span className="font-medium">Notes:</span> {e.notes}
                                </div>
                              )}
                              {e.correctiveAction?.taken && (
                                <div className="text-sm bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mt-2">
                                  <div className="font-semibold text-orange-800 mb-1">⚙ Corrective Action Taken</div>
                                  <div className="text-orange-900"><span className="font-medium">Action:</span> {e.correctiveAction.action}</div>
                                  {e.correctiveAction.actionBy && <div className="text-orange-700 text-xs mt-0.5">By: {e.correctiveAction.actionBy} · {e.correctiveAction.actionAt ? new Date(e.correctiveAction.actionAt).toLocaleString() : ''}</div>}
                                  {e.correctiveAction.followUpRequired && (
                                    <div className="mt-1 text-orange-800 font-medium">!️ Follow-up Required{e.correctiveAction.followUpNotes ? `: ${e.correctiveAction.followUpNotes}` : ''}</div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
