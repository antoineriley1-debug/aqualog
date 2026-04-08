'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

import { HOSPITALS as ALL_HOSPITALS } from '@/lib/hospitals';
const HOSPITALS = ALL_HOSPITALS.map((h) => ({ id: h.id, name: h.name }));

const BOILER_FIELDS = [
  { key: 'ph', label: 'pH', min: 8.5, max: 10.5 },
  { key: 'phosphate', label: 'Phosphate', min: 20, max: 60 },
  { key: 'sulfite', label: 'Sulfite', min: 20, max: 80 },
  { key: 'hardness', label: 'Hardness', min: 0, max: 0, targetZero: true },
  { key: 'conductivity', label: 'Conductivity', min: 0, max: 3500 },
  { key: 'alkalinity', label: 'Alkalinity', min: 100, max: 700 },
  { key: 'tds', label: 'TDS', min: 0, max: 3000 },
  { key: 'amine', label: 'Amine', min: 0, max: 10 },
];

const CHILLED_FIELDS = [
  { key: 'ph', label: 'pH', min: 7.5, max: 9.5 },
  { key: 'conductivity', label: 'Conductivity', min: 0, max: 2000 },
  { key: 'inhibitor', label: 'Inhibitor', min: 50, max: 300 },
  { key: 'hardness', label: 'Hardness', min: 0, max: 200 },
  { key: 'iron', label: 'Iron', min: 0, max: 2 },
  { key: 'tds', label: 'TDS', min: 0, max: 2000 },
  { key: 'molybdate', label: 'Molybdate', min: 5, max: 30 },
  { key: 'bacteria', label: 'Bacteria', min: 0, max: 1000 },
];

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('facilityh2o_user='));
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

  const countOOR = (entry) => {
    const fields = entry.system === 'boiler' ? BOILER_FIELDS : CHILLED_FIELDS;
    return fields.filter((f) => {
      const v = parseFloat(entry.values?.[f.key]);
      if (isNaN(v)) return false;
      if (f.targetZero) return v !== 0;
      return v < f.min || v > f.max;
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
    a.download = `FacilityH2O-history-${new Date().toISOString().split('T')[0]}.csv`;
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
            <option value="boiler">Boiler Water</option>
            <option value="chilled">Chilled Water</option>
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
                    const fields = e.system === 'boiler' ? BOILER_FIELDS : CHILLED_FIELDS;
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
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              e.system === 'boiler' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {e.system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled'}
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
                              <span className="text-xs text-green-600">✅ All OK</span>
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
                                  const n = parseFloat(val);
                                  const inRange = !isNaN(n) && n >= f.min && n <= f.max;
                                  return (
                                    <div key={f.key} className={`p-2 rounded-lg text-xs ${inRange ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                      <div className="text-gray-500">{f.label}</div>
                                      <div className={`font-bold text-sm mt-0.5 ${inRange ? 'text-green-700' : 'text-red-700'}`}>
                                        {val ?? '—'} {inRange ? '🟢' : '🔴'}
                                      </div>
                                      <div className="text-gray-400">{f.min}–{f.max}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              {e.notes && (
                                <div className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200">
                                  <span className="font-medium">Notes:</span> {e.notes}
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
