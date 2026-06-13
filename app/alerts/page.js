'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';

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
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (u?.role !== 'admin') { router.push('/dashboard'); return; }
    setIsAdmin(u?.role === 'admin');
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

  const fireTestAlert = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-alert', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚠️ Alerts</h1>
            <p className="text-gray-500 text-sm mt-1">
              {alerts.filter((a) => !a.acknowledged).length} unacknowledged · {alerts.length} total
            </p>
          </div>
          {isAdmin && (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={fireTestAlert}
                disabled={testLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {testLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>🧪</span>
                )}
                {testLoading ? 'Sending…' : 'Test Alerts'}
              </button>
              {testResult && !testResult.error && (
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-xs space-y-1 max-w-sm">
                  <div className={testResult.email?.ok ? 'text-green-600' : 'text-red-600'}>
                    {testResult.email?.ok
                      ? `✅ Email sent to ${(testResult.email.recipients || []).join(', ')}`
                      : `❌ Email: ${testResult.email?.error || 'No recipients'}`}
                  </div>
                  <div className={testResult.sms?.ok ? 'text-green-600' : 'text-red-600'}>
                    {testResult.sms?.ok
                      ? `✅ SMS sent to ${(testResult.sms.recipients || []).join(', ')}`
                      : `❌ SMS: ${testResult.sms?.error || 'No recipients'}`}
                  </div>
                  <div className="text-gray-400 mt-1">{testResult.timestamp}</div>
                </div>
              )}
              {testResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 max-w-sm">
                  ❌ {testResult.error}
                </div>
              )}
            </div>
          )}
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
                      <Link href={`/hospital-single/${a.hospitalId}`} className="text-sm font-semibold text-[#0072CE] hover:text-[#005fa3] transition">
                        {hospitalName(a.hospitalId)}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.kind === 'missed_reading' ? 'bg-amber-100 text-amber-800' :
                        a.system === 'boiler' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {a.kind === 'missed_reading' ? `⏱️ ${a.systemLabel || a.system}` : (a.system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {a.shift} shift · {a.date}
                        {a.createdAt && (
                          <>
                            {' '}· {new Date(a.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </>
                        )}
                      </span>
                    </div>
                    {a.kind === 'missed_reading' ? (
                      <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        🚨 {a.message || 'Reading not logged for this shift.'} — log it to clear this alert.
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                  {!a.acknowledged && a.kind !== 'missed_reading' && (
                    <button
                      onClick={() => acknowledge(a.id)}
                      className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg transition-colors"
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                  {a.kind === 'missed_reading' && (
                    <Link href="/entry" className="flex-shrink-0 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg transition-colors font-semibold">Log reading →</Link>
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
