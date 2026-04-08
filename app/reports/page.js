'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

import { HOSPITALS } from '@/lib/hospitals';

const ALL_FIELDS = {
  boiler: [
    { key: 'ph', min: 8.5, max: 10.5 },
    { key: 'phosphate', min: 20, max: 60 },
    { key: 'sulfite', min: 20, max: 80 },
    { key: 'hardness', min: 0, max: 5 },
    { key: 'conductivity', min: 0, max: 3500 },
    { key: 'alkalinity', min: 100, max: 700 },
    { key: 'tds', min: 0, max: 3000 },
    { key: 'amine', min: 0, max: 10 },
  ],
  chilled: [
    { key: 'ph', min: 7.5, max: 9.5 },
    { key: 'conductivity', min: 0, max: 2000 },
    { key: 'inhibitor', min: 50, max: 300 },
    { key: 'hardness', min: 0, max: 200 },
    { key: 'iron', min: 0, max: 2 },
    { key: 'tds', min: 0, max: 2000 },
    { key: 'molybdate', min: 5, max: 30 },
    { key: 'bacteria', min: 0, max: 1000 },
  ],
};

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function ReportsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (u?.role !== 'admin') { router.push('/dashboard'); return; }
    Promise.all([
      fetch('/api/entries').then((r) => r.json()),
      fetch('/api/alerts').then((r) => r.json()),
    ]).then(([ed, ad]) => {
      setEntries(ed.entries || []);
      setAlerts(ad.alerts || []);
      setLoading(false);
    });
  }, []);

  const cutoff30 = daysAgo(30);

  const hospitalStats = useMemo(() => {
    return HOSPITALS.map((h) => {
      const all = entries.filter((e) => e.hospitalId === h.id);
      const recent = all.filter((e) => e.date >= cutoff30);
      const openAlerts = alerts.filter((a) => a.hospitalId === h.id && !a.acknowledged).length;
      const lastEntry = all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      let totalReadings = 0;
      let oorReadings = 0;
      recent.forEach((e) => {
        const fields = ALL_FIELDS[e.system] || [];
        fields.forEach((f) => {
          const v = parseFloat(e.values?.[f.key]);
          if (!isNaN(v)) {
            totalReadings++;
            if (v < f.min || v > f.max) oorReadings++;
          }
        });
      });

      const compliance = totalReadings > 0
        ? (((totalReadings - oorReadings) / totalReadings) * 100).toFixed(1)
        : null;

      return {
        ...h,
        entriesLast30: recent.length,
        openAlerts,
        compliance,
        lastEntry: lastEntry?.date || null,
      };
    });
  }, [entries, alerts]);

  const exportCSV = () => {
    const headers = ['Hospital', 'Code', 'Entries (30d)', '% Compliant', 'Open Alerts', 'Last Entry'];
    const rows = hospitalStats.map((h) => [
      h.name, h.code, h.entriesLast30, h.compliance ?? 'N/A', h.openAlerts, h.lastEntry || 'Never',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FacilityH2O-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportAllData = () => {
    const headers = ['Date', 'Shift', 'Hospital', 'System', 'Operator', 'ph', 'phosphate', 'sulfite', 'hardness', 'conductivity', 'alkalinity', 'tds', 'amine', 'inhibitor', 'iron', 'molybdate', 'bacteria', 'Notes'];
    const rows = entries.map((e) => [
      e.date, e.shift, HOSPITALS.find((h) => h.id === e.hospitalId)?.name || e.hospitalId,
      e.system, e.operatorName,
      e.values?.ph ?? '', e.values?.phosphate ?? '', e.values?.sulfite ?? '',
      e.values?.hardness ?? '', e.values?.conductivity ?? '', e.values?.alkalinity ?? '',
      e.values?.tds ?? '', e.values?.amine ?? '', e.values?.inhibitor ?? '',
      e.values?.iron ?? '', e.values?.molybdate ?? '', e.values?.bacteria ?? '',
      e.notes || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FacilityH2O-all-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 text-sm mt-1">System-wide summary — all 9 facilities</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="bg-[#003366] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#002244] transition-colors"
            >
              ⬇️ Summary CSV
            </button>
            <button
              onClick={exportAllData}
              className="bg-[#0072CE] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#005fa3] transition-colors"
            >
              ⬇️ All Data CSV
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-[#0072CE]">{entries.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Entries</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">
              {entries.filter((e) => e.date >= cutoff30).length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Entries Last 30 Days</div>
          </div>
          <div className={`bg-white rounded-xl p-5 shadow-sm border ${alerts.filter((a) => !a.acknowledged).length > 0 ? 'border-red-200' : 'border-gray-100'}`}>
            <div className={`text-3xl font-bold ${alerts.filter((a) => !a.acknowledged).length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {alerts.filter((a) => !a.acknowledged).length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Open Alerts</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entries (30d)</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Compliance</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Open Alerts</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Entry</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hospitalStats.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">{h.name}</div>
                      <div className="text-xs text-gray-400">{h.code}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-semibold ${h.entriesLast30 === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                        {h.entriesLast30}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {h.compliance === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={`font-semibold ${
                          parseFloat(h.compliance) >= 95 ? 'text-green-600' :
                          parseFloat(h.compliance) >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {h.compliance}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {h.openAlerts > 0 ? (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {h.openAlerts}
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs">✅ None</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500 text-xs">
                      {h.lastEntry || <span className="text-red-400">Never</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <a
                        href={`/api/report/${h.id}?month=${new Date().toISOString().slice(0, 7)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-[#003366] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#002244] transition-colors"
                      >
                        📄 PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
