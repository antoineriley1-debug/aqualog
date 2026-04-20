'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HOSPITALS } from '@/lib/hospitals';
import { BOILER_TESTS, CHILLED_TESTS } from '@/lib/testGuide';

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

export default function HospitalSinglePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [entries, setEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [testTab, setTestTab] = useState('boiler');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
    let currentUser = null;
    if (raw) {
      try {
        currentUser = JSON.parse(decodeURIComponent(raw.split('=')[1]));
        setUser(currentUser);
      } catch {}
    }

    // Redirect to hospital-specific login if not authenticated
    if (!currentUser) {
      window.location.href = `/hospital-single/login?hospital=${id}`;
      return;
    }

    const h = HOSPITALS.find((x) => x.id === id);
    setHospital(h);
  }, [id]);

  useEffect(() => {
    if (!hospital) return;
    Promise.all([
      fetch(`/api/entries?hospitalId=${hospital.id}`).then((r) => r.json()),
      fetch(`/api/alerts?hospitalId=${hospital.id}`).then((r) => r.json()),
    ]).then(([eData, aData]) => {
      setEntries((eData.entries || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setAlerts((aData.alerts || []).filter((a) => a.hospitalId === hospital.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [hospital]);

  if (!hospital) return <div className="flex items-center justify-center min-h-screen text-red-500">Hospital not found</div>;

  const boilerEntries = entries.filter((e) => e.system === 'boiler');
  const chilledEntries = entries.filter((e) => e.system === 'chilled');
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const lastBoilerPH = boilerEntries[0]?.values?.ph;
  const lastChilledPH = chilledEntries[0]?.values?.ph;

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
            {user && <span className="text-xs text-gray-400">{user.name}</span>}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
              <p className="text-gray-500 mt-1">{hospital.code} · Water Chemistry Operator Portal</p>
            </div>
            
            {/* Hospital Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm transition border border-gray-300"
              >
                🏥 Switch Hospital ▼
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="max-h-96 overflow-y-auto">
                    {HOSPITALS.map((h) => (
                      <Link
                        key={h.id}
                        href={`/hospital-single/${h.id}`}
                        className={`block px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50 transition ${
                          h.id === id ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-900'
                        }`}
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="font-semibold">{h.name}</div>
                        <div className="text-xs text-gray-500">{h.code}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Hospital Image */}
        <div className="mb-8 bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 relative">
          <img 
            src={`/hospitals/${id}.jpg`}
            alt={hospital.name}
            className="w-full h-72 object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 300%22%3E%3Crect fill=%22%23e5f0f7%22 width=%22800%22 height=%22300%22/%3E%3Ctext x=%22400%22 y=%22150%22 font-size=%2280%22 text-anchor=%22middle%22 fill=%22%238b9dae%22%3E🏥%3C/text%3E%3C/svg%3E';
            }}
          />
          {/* Hospital Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white">{hospital.name}</h2>
            <p className="text-gray-300 text-sm">{hospital.code}</p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-2 font-semibold">Boiler pH</div>
            <div className={`text-3xl font-bold ${pHColor(lastBoilerPH)}`}>
              {lastBoilerPH ?? '—'}
            </div>
            <div className="text-xs text-gray-400 mt-2">{boilerEntries.length} entries</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-2 font-semibold">Chilled pH</div>
            <div className={`text-3xl font-bold ${pHColor(lastChilledPH)}`}>
              {lastChilledPH ?? '—'}
            </div>
            <div className="text-xs text-gray-400 mt-2">{chilledEntries.length} entries</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-2 font-semibold">Total Entries</div>
            <div className="text-3xl font-bold text-gray-900">{entries.length}</div>
            <div className="text-xs text-gray-400 mt-2">All time</div>
          </div>
          <div className={`bg-white rounded-xl p-5 shadow-sm border ${unacknowledgedAlerts.length > 0 ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="text-xs text-gray-500 mb-2 font-semibold">Open Alerts</div>
            <div className={`text-3xl font-bold ${unacknowledgedAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {unacknowledgedAlerts.length}
            </div>
            {unacknowledgedAlerts.length > 0 && (
              <Link href="/alerts" className="text-xs text-red-600 hover:text-red-900 font-semibold mt-2 inline-block underline">
                View →
              </Link>
            )}
          </div>
        </div>

        {/* 3-Column Layout: Testing Guide | Entries+Trends | Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Testing Procedures */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">🧪 Testing Procedures</h2>
            </div>
            <div className="p-6">
              {/* Test Tabs */}
              <div className="flex gap-2 border-b border-gray-200 mb-6">
                {[
                  { id: 'boiler', label: '🔥 Boiler' },
                  { id: 'chilled', label: '❄️ Chilled' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTestTab(tab.id)}
                    className={`px-3 py-2 font-semibold text-xs border-b-2 transition-colors ${
                      testTab === tab.id
                        ? 'text-[#0072CE] border-[#0072CE]'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tests List */}
              <div className="space-y-4">
                {(testTab === 'boiler' ? BOILER_TESTS : CHILLED_TESTS).slice(0, 4).map((test, idx) => (
                  <div key={idx} className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{test.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">{test.label}</h4>
                        <p className="text-xs text-gray-600 mt-1">{test.description}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Range:</span>
                            <span className="font-mono text-gray-900 font-semibold">{test.target || `${test.min}–${test.max}`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Freq:</span>
                            <span className="text-gray-900">{test.frequency || 'Shift'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Entries + Trends */}
          <div className="space-y-6">
            {/* Recent Entries */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">📊 Recent Entries</h2>
              </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="px-6 py-8 text-center text-gray-400">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="text-sm text-gray-500 mb-3">No entries yet</div>
                  <Link href="/entry" className="inline-block bg-[#0072CE] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                    Log Entry →
                  </Link>
                </div>
              ) : (
                entries.slice(0, 6).map((e) => (
                  <div key={e.id} className="px-6 py-3 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {e.system === 'boiler' ? '🔥' : '❄️'} {e.shift}
                      </span>
                      <span className={`text-sm font-bold ${pHColor(e.values?.ph)}`}>
                        {e.values?.ph ?? '—'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {e.date} · {timeSince(e.createdAt)}
                    </div>
                    {e.hasAlerts && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded mt-2 inline-block font-semibold">
                        ⚠️ Out of Range
                      </span>
                    )}
                  </div>
                ))
              )}
              </div>
            </div>

            {/* Trends Preview */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">📈 Trends</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {/* Boiler Trend */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">🔥 Boiler pH</span>
                      <span className={`text-sm font-bold ${pHColor(lastBoilerPH)}`}>
                        {lastBoilerPH ? `${lastBoilerPH}` : '—'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pHColor(lastBoilerPH) === 'text-green-600' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: lastBoilerPH ? `${Math.max(20, Math.min(100, (lastBoilerPH / 14) * 100))}%` : '0%' }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Target: 8.5–10.5</div>
                  </div>

                  {/* Chilled Trend */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">❄️ Chilled pH</span>
                      <span className={`text-sm font-bold ${pHColor(lastChilledPH)}`}>
                        {lastChilledPH ? `${lastChilledPH}` : '—'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pHColor(lastChilledPH) === 'text-green-600' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: lastChilledPH ? `${Math.max(20, Math.min(100, (lastChilledPH / 14) * 100))}%` : '0%' }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Target: 7.5–9.5</div>
                  </div>
                </div>

                <Link
                  href={`/trends?hospital=${id}`}
                  className="block w-full text-center bg-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-700 transition"
                >
                  View Full Trends →
                </Link>
              </div>
            </div>
          </div>

          {/* Column 3: Alerts & Links */}
          <div className="space-y-6">
            {/* Alerts Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className={`border-b px-6 py-4 ${unacknowledgedAlerts.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <h2 className="text-lg font-bold text-gray-900">
                  {unacknowledgedAlerts.length > 0 ? '🚨 Open Alerts' : '✅ No Alerts'}
                </h2>
              </div>
              <div className="p-6">
                {unacknowledgedAlerts.length === 0 ? (
                  <div className="text-sm text-green-700">All readings within range</div>
                ) : (
                  <div className="space-y-3">
                    {unacknowledgedAlerts.slice(0, 4).map((a) => (
                      <div key={a.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-sm font-semibold text-red-900">
                          {a.system === 'boiler' ? '🔥' : '❄️'} {a.shift}
                        </div>
                        <div className="text-xs text-red-700 mt-1">
                          {a.outOfRange?.map((o) => o.label).join(', ')}
                        </div>
                      </div>
                    ))}
                    {unacknowledgedAlerts.length > 4 && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        +{unacknowledgedAlerts.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">⚡ Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/entry"
                  className="block w-full text-center bg-[#0072CE] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                >
                  + Log New Entry
                </Link>
                <Link
                  href="/alerts"
                  className="block w-full text-center bg-gray-100 text-gray-900 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-200 transition"
                >
                  View All Alerts
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full text-center bg-gray-100 text-gray-900 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-200 transition"
                >
                  All Facilities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
