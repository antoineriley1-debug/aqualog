'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { HOSPITALS } from '@/lib/hospitals';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function pHColor(ph) {
  if (ph === null || ph === undefined) return 'text-gray-400';
  return (ph >= 7.5 && ph <= 10.5) ? 'text-green-600' : 'text-red-600';
}

function timeSince(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Less than 1h ago';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function OORBanner({ alerts: alertsProp }) {
  const [dismissed, setDismissed] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState(alertsProp || []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/alerts')
        .then((r) => r.json())
        .then((data) => {
          setCurrentAlerts(data.alerts || []);
          setDismissed(false); // reset dismissal if new alerts come in
        })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentAlerts(alertsProp || []);
  }, [alertsProp]);

  const todayStr = new Date().toISOString().split('T')[0];
  const unacknowledged = currentAlerts.filter((a) => !a.acknowledged);
  const todayOOR = unacknowledged.filter((a) => a.date === todayStr || a.createdAt?.startsWith(todayStr));

  if (dismissed) return null;

  if (unacknowledged.length === 0) {
    return (
      <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="text-green-700 text-sm font-medium">✅ All facilities within range</span>
      </div>
    );
  }

  // Group OOR by hospital
  const byHospital = {};
  unacknowledged.forEach((a) => {
    const hid = a.hospitalId?.toUpperCase() || 'Unknown';
    if (!byHospital[hid]) byHospital[hid] = [];
    const params = (a.outOfRange || []).map((o) => o.label || o.param).join(', ');
    const desc = `${a.system === 'boiler' ? 'Boiler' : 'Chilled'} ${params || ''}`.trim();
    if (desc && !byHospital[hid].includes(desc)) byHospital[hid].push(desc);
  });

  const summaryParts = Object.entries(byHospital).map(
    ([h, descs]) => `${h} (${descs.slice(0, 2).join(', ')}${descs.length > 2 ? '...' : ''})`
  );

  return (
    <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 animate-pulse-subtle relative">
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.92; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-semibold text-red-800 text-sm">
            🚨 {unacknowledged.length} Out-of-Range Alert{unacknowledged.length !== 1 ? 's' : ''}
          </div>
          <div className="text-red-700 text-xs mt-1 leading-relaxed">
            {summaryParts.slice(0, 4).join(' · ')}
            {summaryParts.length > 4 && ` +${summaryParts.length - 4} more`}
          </div>
          <Link
            href="/alerts"
            className="inline-block mt-2 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
          >
            View Alerts →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(null);

  // Owner-only: pull licensing rollup for the revenue strip
  useEffect(() => {
    if (!(user?.id === 'usr_ariley' || user?.username === 'ariley')) return;
    fetch('/api/licenses', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { licenses: [] })
      .then(d => {
        const L = d.licenses || [];
        const active = L.filter(x => x.status === 'active');
        const trial = L.filter(x => x.status === 'trial');
        const mrr = active.reduce((a,x) => a + (Number(x.monthlyValue)||0), 0);
        const pipeline = trial.reduce((a,x) => a + (Number(x.monthlyValue)||0), 0);
        setRevenue({ clients: L.length, active: active.length, trial: trial.length, mrr, arr: mrr*12, pipeline });
      }).catch(() => {});
  }, [user]);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    Promise.all([
      fetch('/api/entries').then((r) => r.json()),
      fetch('/api/alerts').then((r) => r.json()),
    ]).then(([eData, aData]) => {
      setEntries(eData.entries || []);
      setAlerts(aData.alerts || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </main>
      </div>
    );
  }

  const getHospitalEntries = (hid) => entries.filter((e) => e.hospitalId === hid);
  const getLastEntry = (hid) => {
    const he = getHospitalEntries(hid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return he[0] || null;
  };
  const getLastPH = (hid, system) => {
    const he = entries
      .filter((e) => e.hospitalId === hid && e.system === system)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return he[0]?.values?.ph ?? null;
  };
  const getHospitalAlerts = (hid) => alerts.filter((a) => a.hospitalId === hid && !a.acknowledged);

  const isOverdue = (hid) => {
    const last = getLastEntry(hid);
    if (!last) return true;
    const diff = Date.now() - new Date(last.createdAt).getTime();
    return diff > 12 * 3600000;
  };

  // Admin view
  if (user?.role === 'admin') {
    const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;
    const hasOpenAlerts = unreadAlerts > 0;
    const totalEntriesToday = entries.filter(
      (e) => e.date === new Date().toISOString().split('T')[0]
    ).length;

    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">All FacilityH2O facilities — real-time overview</p>
          </div>

          {/* OOR Alerts Banner */}
          <OORBanner alerts={alerts} />

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-[#0072CE]">{HOSPITALS.length}</div>
              <div className="text-sm text-gray-500 mt-1">Facilities</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-green-600">{totalEntriesToday}</div>
              <div className="text-sm text-gray-500 mt-1">Entries Today</div>
            </div>
            <div className={`bg-white rounded-xl p-5 shadow-sm border ${unreadAlerts > 0 ? 'border-red-200' : 'border-gray-100'}`}>
              <div className={`text-3xl font-bold ${unreadAlerts > 0 ? 'text-red-600' : 'text-gray-400'}`}>{unreadAlerts}</div>
              <div className="text-sm text-gray-500 mt-1">Open Alerts</div>
            </div>
          </div>

          {/* OWNER-ONLY REVENUE STRIP */}
          {revenue && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-700">💼 Sales & Revenue <span className="text-xs font-normal text-gray-400">(visible only to you)</span></h2>
                <a href="/licensing" className="text-xs text-[#0891B2] font-semibold hover:underline">Open Licensing console →</a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-green-500 to-emerald-600"><div className="text-xs opacity-90">MRR</div><div className="text-xl font-extrabold mt-0.5">${revenue.mrr.toLocaleString()}</div></div>
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-cyan-500 to-blue-600"><div className="text-xs opacity-90">Annual Run-Rate</div><div className="text-xl font-extrabold mt-0.5">${revenue.arr.toLocaleString()}</div></div>
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-blue-500 to-indigo-600"><div className="text-xs opacity-90">Trial Pipeline</div><div className="text-xl font-extrabold mt-0.5">${revenue.pipeline.toLocaleString()}</div></div>
                <div className="rounded-xl p-4 bg-white border border-gray-100"><div className="text-xs text-gray-400">Active Clients</div><div className="text-xl font-extrabold mt-0.5 text-gray-900">{revenue.active}</div></div>
                <div className="rounded-xl p-4 bg-white border border-gray-100"><div className="text-xs text-gray-400">In Trial</div><div className="text-xl font-extrabold mt-0.5 text-amber-600">{revenue.trial}</div></div>
              </div>
            </div>
          )}

          {/* Hospital grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {HOSPITALS.map((h) => {
              const last = getLastEntry(h.id);
              const boilerPH = getLastPH(h.id, 'boiler');
              const chilledPH = getLastPH(h.id, 'chilled');
              const hospitalAlerts = getHospitalAlerts(h.id);
              const overdue = isOverdue(h.id);

              return (
                <Link
                  key={h.id}
                  href={`/hospital-single/${h.id}`}
                  className={`bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${
                    overdue ? 'border-orange-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm leading-tight">{h.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{h.code}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {hospitalAlerts.length > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {hospitalAlerts.length} alert{hospitalAlerts.length > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className={`text-xs ${overdue ? 'text-orange-600' : 'text-green-600'}`}>
                        {overdue ? '⚠️ Overdue' : '✅ Current'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">Boiler pH</div>
                      <div className={`font-bold text-lg ${pHColor(boilerPH)}`}>
                        {boilerPH !== null ? boilerPH : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">Chilled pH</div>
                      <div className={`font-bold text-lg ${pHColor(chilledPH)}`}>
                        {chilledPH !== null ? chilledPH : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                    Last entry: {last ? timeSince(last.createdAt) : 'Never'}{' '}
                    {last ? `· ${last.shift} shift · ${last.operatorName}` : ''}
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Operator view
  const myHospital = HOSPITALS.find((h) => h.id === user?.hospital);
  const myEntries = entries.filter((e) => e.hospitalId === user?.hospital)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const myAlerts = alerts.filter((a) => a.hospitalId === user?.hospital && !a.acknowledged);
  const lastBoilerPH = getLastPH(user?.hospital, 'boiler');
  const lastChilledPH = getLastPH(user?.hospital, 'chilled');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{myHospital?.name || 'Dashboard'}</h1>
          <p className="text-gray-500 text-sm mt-1">{myHospital?.code} · Water Chemistry Overview</p>
        </div>

        {myAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="font-semibold text-red-700 mb-2">⚠️ {myAlerts.length} Open Alert{myAlerts.length > 1 ? 's' : ''}</div>
            {myAlerts.slice(0, 3).map((a) => (
              <div key={a.id} className="text-sm text-red-600">
                {a.system === 'boiler' ? '🔥' : '❄️'} {a.shift} shift — {a.outOfRange?.map((o) => o.label).join(', ')}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">Last Boiler pH</div>
            <div className={`text-3xl font-bold ${pHColor(lastBoilerPH)}`}>
              {lastBoilerPH !== null ? lastBoilerPH : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Target: 8.5 – 10.5</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">Last Chilled pH</div>
            <div className={`text-3xl font-bold ${pHColor(lastChilledPH)}`}>
              {lastChilledPH !== null ? lastChilledPH : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Target: 7.5 – 9.5</div>
          </div>
        </div>

        {myAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <div className="font-semibold text-red-900">🔔 {myAlerts.length} Open Alert{myAlerts.length !== 1 ? 's' : ''}</div>
              <div className="text-sm text-red-700">Out-of-range readings detected. Review and acknowledge.</div>
            </div>
            <Link href="/alerts" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition">
              View Alerts →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-800">Recent Entries</div>
          {myEntries.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No entries yet. Log your first reading →</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {myEntries.slice(0, 8).map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">
                      {e.system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled Water'}
                    </span>
                    <span className="text-gray-400 ml-2">· {e.shift} shift · {e.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${pHColor(e.values?.ph)}`}>
                      pH {e.values?.ph ?? '—'}
                    </span>
                    {e.hasAlerts && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">OOR</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
