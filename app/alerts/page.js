'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const HOSPITALS = [
  { id: 'whc', name: 'FacilityH2O Washington Hospital Center' },
  { id: 'somd', name: 'FacilityH2O Southern Maryland Hospital Center' },
  { id: 'harbor', name: 'FacilityH2O Harbor Hospital' },
  { id: 'mont', name: 'FacilityH2O Montgomery Medical Center' },
  { id: 'geo', name: 'FacilityH2O Georgetown University Hospital' },
  { id: 'frank', name: 'FacilityH2O Franklin Square Medical Center' },
  { id: 'gs', name: 'FacilityH2O Good Samaritan Hospital' },
  { id: 'union', name: 'FacilityH2O Union Memorial Hospital' },
  { id: 'stm', name: "FacilityH2O St. Mary's Hospital" },
];

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterHospital, setFilterHospital] = useState('');
  const [filterAcked, setFilterAcked] = useState('unacknowledged');

  useEffect(() => {
    const u = getUser();
    if (u?.role !== 'admin') { router.push('/dashboard'); return; }
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => { setAlerts(d.alerts || []); setLoading(false); });
  }, []);

  const acknowledge = async (id) => {
    await fetch(`/api/alerts/${id}/ack`, { method: 'POST' });
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const filtered = alerts
    .filter((a) => !filterHospital || a.hospitalId === filterHospital)
    .filter((a) => {
      if (filterAcked === 'unacknowledged') return !a.acknowledged;
      if (filterAcked === 'acknowledged') return a.acknowledged;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const hospitalName = (id) => HOSPITALS.find((h) => h.id === id)?.name || id;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">⚠️ Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">
            {alerts.filter((a) => !a.acknowledged).length} unacknowledged · {alerts.length} total
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex gap-3">
          <select
            value={filterHospital}
            onChange={(e) => setFilterHospital(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            <option value="">All Hospitals</option>
            {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select
            value={filterAcked}
            onChange={(e) => setFilterAcked(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="all">All Alerts</option>
          </select>
        </div>

        {/* Alerts list */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
              {filterAcked === 'unacknowledged' ? '✅ No open alerts' : 'No alerts found'}
            </div>
          ) : (
            filtered.map((a) => (
              <div
                key={a.id}
                className={`bg-white rounded-xl shadow-sm border p-5 ${
                  a.acknowledged ? 'border-gray-100 opacity-60' : 'border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">{hospitalName(a.hospitalId)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.system === 'boiler' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {a.system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled'}
                      </span>
                      <span className="text-xs text-gray-500">{a.shift} shift · {a.date}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Operator: <span className="font-medium">{a.operatorName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(a.outOfRange || a.outOfRangeParams || []).map((oor) => (
                        <div
                          key={oor.param}
                          className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs"
                        >
                          <span className="font-semibold text-red-700">{oor.label}</span>
                          <span className="text-red-500 ml-1">
                            {oor.value} (range: {oor.min}–{oor.max})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {!a.acknowledged && (
                    <button
                      onClick={() => acknowledge(a.id)}
                      className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg transition-colors"
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                  {a.acknowledged && (
                    <span className="flex-shrink-0 text-xs text-green-600 font-medium">✅ Acknowledged</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
