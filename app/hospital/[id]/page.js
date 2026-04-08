'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';
import { BOILER_TESTS, CHILLED_TESTS } from '@/lib/testGuide';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts';

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
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function timeSince(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Less than 1h ago';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HospitalPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [testSystem, setTestSystem] = useState('boiler');
  const [imgError, setImgError] = useState(false);
  const [siteRules, setSiteRules] = useState(null);

  const hospital = HOSPITALS.find((h) => h.id === id);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    // Operators can only view their own hospital
    if (u?.role === 'operator' && u.hospital !== id) {
      router.push('/dashboard');
      return;
    }
    Promise.all([
      fetch(`/api/entries?hospital=${id}`).then((r) => r.json()),
      fetch('/api/alerts').then((r) => r.json()).catch(() => ({ alerts: [] })),
      fetch(`/api/notifications?hospital=${id}`).then((r) => r.json()).catch(() => null),
    ]).then(([ed, ad, nr]) => {
      const allEntries = ed.entries || [];
      setEntries(allEntries.filter((e) => e.hospitalId === id));
      setAlerts((ad.alerts || []).filter((a) => a.hospitalId === id));
      if (nr) setSiteRules(nr.merged || nr.global);
      setLoading(false);
    });
  }, [id]);

  if (!hospital) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-gray-400">Hospital not found.</div>
        </main>
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const boilerEntries = sortedEntries.filter((e) => e.system === 'boiler');
  const chilledEntries = sortedEntries.filter((e) => e.system === 'chilled');
  const openAlerts = alerts.filter((a) => !a.acknowledged);

  const lastBoilerPH = boilerEntries[0]?.values?.ph;
  const lastChilledPH = chilledEntries[0]?.values?.ph;

  const countOOR = (entry) => {
    const fields = entry.system === 'boiler' ? BOILER_FIELDS : CHILLED_FIELDS;
    return fields.filter((f) => {
      const v = parseFloat(entry.values?.[f.key]);
      if (isNaN(v)) return false;
      if (f.targetZero) return v !== 0;
      return v < f.min || v > f.max;
    }).length;
  };

  // Build pH trend for last 14 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const phTrend = sortedEntries
    .filter((e) => e.system === 'boiler' && new Date(e.createdAt) >= cutoff && e.values?.ph !== undefined)
    .reverse()
    .map((e) => ({ date: e.date, ph: parseFloat(e.values.ph), shift: e.shift }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative h-56 overflow-hidden bg-[#003366]">
          {!imgError ? (
            <img
              src={hospital.image}
              alt={hospital.name}
              className="w-full h-full object-cover opacity-60"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#003366] to-[#0072CE]">
              <span className="text-6xl">🏥</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/90 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <div className="text-white/70 text-xs uppercase tracking-widest mb-1">FacilityH2O Inc. · FacilityH2O Healthcare</div>
            <h1 className="text-white text-2xl font-bold leading-tight">{hospital.name}</h1>
            <div className="text-blue-200 text-sm mt-1 flex items-center gap-2">
              <span>📍</span>
              <a href={hospital.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {hospital.address}
              </a>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Link
              href="/dashboard"
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Boiler pH</span>
            <span className={`font-bold ${lastBoilerPH !== undefined ? (lastBoilerPH >= 8.5 && lastBoilerPH <= 10.5 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
              {lastBoilerPH ?? '—'}
            </span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Chilled pH</span>
            <span className={`font-bold ${lastChilledPH !== undefined ? (lastChilledPH >= 7.5 && lastChilledPH <= 9.5 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
              {lastChilledPH ?? '—'}
            </span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Open Alerts</span>
            <span className={`font-bold ${openAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {openAlerts.length}
            </span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Last Entry</span>
            <span className="text-gray-600">{timeSince(sortedEntries[0]?.createdAt)}</span>
          </div>
          <div className="ml-auto">
            <Link
              href={`/entry?hospital=${id}`}
              className="bg-[#0072CE] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#005fa3] transition"
            >
              + New Entry
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-1">
            {['overview', 'history', 'contacts', 'testguide', 'alertrules'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#0072CE] text-[#0072CE]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' ? '📊 Overview' : tab === 'history' ? '📋 History' : tab === 'contacts' ? '👥 Contacts' : tab === 'testguide' ? '🔬 Test Guide' : '🔔 Alert Rules'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Recent entries */}
                  <div className="grid grid-cols-2 gap-6">
                    {[['boiler', '🔥 Boiler Water', boilerEntries, BOILER_FIELDS], ['chilled', '❄️ Chilled Water', chilledEntries, CHILLED_FIELDS]].map(([sys, label, sysEntries, fields]) => {
                      const last = sysEntries[0];
                      return (
                        <div key={sys} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <div className="font-semibold text-gray-800 mb-4">{label}</div>
                          {!last ? (
                            <div className="text-gray-400 text-sm">No entries yet</div>
                          ) : (
                            <>
                              <div className="text-xs text-gray-400 mb-3">{last.date} · {last.shift} shift · {last.operatorName}</div>
                              <div className="grid grid-cols-2 gap-2">
                                {fields.map((f) => {
                                  const val = last.values?.[f.key];
                                  const n = parseFloat(val);
                                  const inRange = !isNaN(n) && n >= f.min && n <= f.max;
                                  return (
                                    <div key={f.key} className={`px-3 py-2 rounded-lg text-xs ${val !== undefined ? (inRange ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-200') : 'bg-gray-50 border border-gray-100'}`}>
                                      <div className="text-gray-500">{f.label}</div>
                                      <div className={`font-bold mt-0.5 ${val !== undefined ? (inRange ? 'text-green-700' : 'text-red-700') : 'text-gray-400'}`}>
                                        {val ?? '—'} {val !== undefined ? (inRange ? '🟢' : '🔴') : ''}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Boiler pH Trend */}
                  {phTrend.length > 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <div className="font-semibold text-gray-800 mb-4">Boiler pH — Last 14 Days</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={phTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={[7, 12]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <ReferenceLine y={8.5} stroke="#ef4444" strokeDasharray="4 4" />
                          <ReferenceLine y={10.5} stroke="#ef4444" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="ph" stroke="#0072CE" strokeWidth={2} dot={(p) => {
                            const inRange = p.payload.ph >= 8.5 && p.payload.ph <= 10.5;
                            return <circle key={p.cx} cx={p.cx} cy={p.cy} r={4} fill={inRange ? '#16a34a' : '#dc2626'} stroke="white" strokeWidth={2} />;
                          }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Open alerts */}
                  {openAlerts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                      <div className="font-semibold text-red-700 mb-3">⚠️ {openAlerts.length} Open Alert{openAlerts.length > 1 ? 's' : ''}</div>
                      <div className="space-y-2">
                        {openAlerts.map((a) => (
                          <div key={a.id} className="text-sm text-red-600">
                            {a.system === 'boiler' ? '🔥' : '❄️'} {a.date} · {a.shift} shift ·{' '}
                            {(a.outOfRange || a.outOfRangeParams || []).map((o) => `${o.label}: ${o.value}`).join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {sortedEntries.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No entries logged yet for this facility.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Shift</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">System</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Operator</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">pH</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sortedEntries.map((e) => {
                          const oor = countOOR(e);
                          return (
                            <tr key={e.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-700">{e.date}</td>
                              <td className="px-4 py-3 text-gray-600">{e.shift}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${e.system === 'boiler' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {e.system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{e.operatorName}</td>
                              <td className="px-4 py-3 font-semibold">
                                <span className={e.values?.ph !== undefined ? (parseFloat(e.values.ph) >= 7.5 && parseFloat(e.values.ph) <= 10.5 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}>
                                  {e.values?.ph ?? '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {oor > 0
                                  ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{oor} OOR</span>
                                  : <span className="text-xs text-green-600">✅ OK</span>
                                }
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{e.notes || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* CONTACTS TAB */}
              {activeTab === 'contacts' && (
                <div className="space-y-3">
                  {hospital.contacts.map((c, i) => (
                    <div key={i} className={`bg-white rounded-xl shadow-sm border p-5 ${c.name === 'VACANT' ? 'opacity-50 border-gray-100' : 'border-gray-100'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs text-[#0072CE] font-semibold uppercase tracking-wide mb-1">{c.title}</div>
                          <div className="font-semibold text-gray-900">{c.name === 'VACANT' ? '— VACANT —' : c.name}</div>
                        </div>
                        {c.name !== 'VACANT' && (
                          <div className="text-right space-y-1 text-xs text-gray-500">
                            {c.office && <div>📞 Office: <a href={`tel:${c.office}`} className="text-[#0072CE] hover:underline">{c.office}</a></div>}
                            {c.mobile && <div>📱 Mobile: <a href={`tel:${c.mobile}`} className="text-[#0072CE] hover:underline">{c.mobile}</a></div>}
                          </div>
                        )}
                      </div>
                      {c.name !== 'VACANT' && (c.FacilityH2OEmail || c.FacilityH2OEmail) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.FacilityH2OEmail && (
                            <a href={`mailto:${c.FacilityH2OEmail}`} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                              ✉️ {c.FacilityH2OEmail}
                            </a>
                          )}
                          {c.FacilityH2OEmail && (
                            <a href={`mailto:${c.FacilityH2OEmail}`} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition">
                              ✉️ {c.FacilityH2OEmail}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TEST GUIDE TAB */}
              {activeTab === 'testguide' && (
                <div>
                  {/* System selector */}
                  <div className="flex gap-3 mb-6">
                    {[['boiler','🔥 Boiler Water'],['chilled','❄️ Chilled Water']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setTestSystem(val)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${testSystem === val ? 'bg-[#003366] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#003366]'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {(testSystem === 'boiler' ? BOILER_TESTS : CHILLED_TESTS).map((test) => (
                      <TestCard key={test.key} test={test} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TestCard({ test }) {
  const [expanded, setExpanded] = useState(false);

  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  const badgeClass = colorMap[test.color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">{test.icon}</span>
          <div>
            <div className="font-bold text-gray-900 text-base">{test.label}</div>
            <div className="text-sm text-gray-500 mt-0.5">{test.description.slice(0, 80)}...</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeClass}`}>
            Target: {test.target}
          </span>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {/* Image + Description */}
          <div className="grid grid-cols-3 gap-0">
            <div className="col-span-1">
              <img
                src={test.image}
                alt={test.label}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="col-span-2 p-5 bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-2">What It Measures</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{test.description}</p>
              <div className="mt-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Test Kit: </span>
                <span className="text-sm text-gray-700">{test.testKit}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-0 border-t border-gray-100">
            {/* Test Procedure */}
            <div className="col-span-1 p-5 border-r border-gray-100">
              <h4 className="font-semibold text-[#003366] mb-3 flex items-center gap-2">
                <span className="bg-[#003366] text-white text-xs px-2 py-0.5 rounded-full">HOW TO TEST</span>
              </h4>
              <ol className="space-y-2">
                {test.procedure.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#003366] text-white rounded-full text-xs flex items-center justify-center font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* If High */}
            <div className="col-span-1 p-5 border-r border-gray-100 bg-red-50/30">
              <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">🔴 IF TOO HIGH</span>
              </h4>
              <div className="text-xs font-semibold text-red-700 mb-2">{test.ifHigh.title}</div>
              <ul className="space-y-2">
                {test.ifHigh.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* If Low */}
            <div className="col-span-1 p-5 bg-blue-50/30">
              <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">🔵 IF TOO LOW</span>
              </h4>
              <div className="text-xs font-semibold text-blue-700 mb-2">{test.ifLow.title}</div>
              <ul className="space-y-2">
                {test.ifLow.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ALERT RULES TAB */}
      {activeTab === 'alertrules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Alert Rules — {hospital?.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Current notification settings for this site. Only admin can change these.</p>
            </div>
            {user?.id === 'usr_ariley' && (
              <a href="/notifications" className="text-xs bg-[#0072CE] text-white px-4 py-2 rounded-lg hover:bg-[#005fa3] transition font-semibold">
                ✏️ Edit in Admin Panel
              </a>
            )}
          </div>

          {!siteRules ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 italic">No rules configured — using system defaults.</div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-700 text-sm mb-3">📏 Alert Thresholds</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Trending days before escalation', value: siteRules.thresholds?.trending_days ?? 3, unit: 'days', color: 'text-orange-600' },
                    { label: 'Missed shifts before alert', value: siteRules.thresholds?.missed_shifts ?? 1, unit: 'shifts', color: 'text-yellow-600' },
                    { label: 'Out-of-range readings', value: siteRules.thresholds?.out_of_range_count ?? 2, unit: 'consecutive', color: 'text-orange-600' },
                    { label: 'Legionella CFU/mL trigger', value: siteRules.thresholds?.legionella_cfu_alert ?? 1, unit: 'CFU/mL', color: 'text-red-600' },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className={`text-2xl font-black ${color}`}>{value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{unit}</div>
                      <div className="text-xs font-medium text-gray-600 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(siteRules.levels || []).map((lv, i) => (
                  <div key={lv.id} className={`bg-white rounded-xl border shadow-sm p-4 border-l-4 ${i===0?'border-l-yellow-400':i===1?'border-l-orange-400':'border-l-red-500'}`}>
                    <div className={`text-xs font-bold uppercase mb-1 ${i===0?'text-yellow-600':i===1?'text-orange-600':'text-red-600'}`}>
                      Level {i+1}
                    </div>
                    <div className="font-semibold text-gray-800 text-sm mb-2">{lv.name?.replace(/Level \d — /,'') || lv.name}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {lv.trigger === 'immediate' && '⚡ Immediately on any OOR reading'}
                      {lv.trigger === 'trending'  && `📈 After ${lv.triggerDays||3} consecutive bad days`}
                      {lv.trigger === 'missed_shift' && '⏰ When a shift is missed'}
                      {lv.trigger === 'critical'  && '🚨 Critical / shutdown level only'}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(lv.channels||[]).map(ch => (
                        <span key={ch} className="text-xs bg-blue-50 text-[#0072CE] px-2 py-0.5 rounded-full border border-[#0072CE]/20">
                          {ch === 'email' ? '✉️ Email' : ch === 'phone' ? '📞 Phone' : '📱 SMS'}
                        </span>
                      ))}
                    </div>
                    {(lv.contacts||[]).length > 0 ? (
                      <div className="space-y-1 border-t border-gray-100 pt-2">
                        {lv.contacts.map(c => (
                          <div key={c.id} className="text-xs">
                            <span className="font-medium text-gray-700">{c.name}</span>
                            {c.title && <span className="text-gray-400"> · {c.title}</span>}
                            <div className="text-gray-400">
                              {c.email && <span className="mr-2">{c.email}</span>}
                              {c.phone && <span>{c.phone}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic border-t border-gray-100 pt-2">No contacts assigned yet</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
