'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
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

export default function HospitalPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [entries, setEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('entries');
  const [testTab, setTestTab] = useState('boiler');
  const [testOpen, setTestOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
    if (raw) {
      try {
        setUser(JSON.parse(decodeURIComponent(raw.split('=')[1])));
      } catch {}
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

  if (!hospital) return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 p-8"><div className="text-red-500">Hospital not found</div></main></div>;

  const boilerEntries = entries.filter((e) => e.system === 'boiler');
  const chilledEntries = entries.filter((e) => e.system === 'chilled');
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
          <p className="text-gray-500 mt-1">{hospital.code} · Water Chemistry Data</p>
        </div>

        {/* Hospital Image */}
        <div className="mb-8 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <img 
            src={`/hospitals/${id}.jpg`}
            alt={hospital.name}
            className="w-full h-64 md:h-80 object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e5f0f7%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%22200%22 y=%22150%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22%238b9dae%22%3E🏥%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>

        {/* Testing Guide - Collapsible */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setTestOpen(!testOpen)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-bold text-gray-900">🧪 Testing Procedures Quick Reference</h2>
            <span className={`text-2xl transition-transform ${testOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {testOpen && (
            <div className="px-6 pb-6 border-t border-gray-100">
              {/* Test Tabs */}
              <div className="flex gap-4 border-b border-gray-200 mb-6 mt-4">
                {[
                  { id: 'boiler', label: '🔥 Boiler Water Tests' },
                  { id: 'chilled', label: '❄️ Chilled Water Tests' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTestTab(tab.id)}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors text-sm ${
                      testTab === tab.id
                        ? 'text-[#0072CE] border-[#0072CE]'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Test Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(testTab === 'boiler' ? BOILER_TESTS : CHILLED_TESTS).map((test, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">{test.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{test.label}</h4>
                        <p className="text-xs text-gray-600 mt-1">{test.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Range:</span>
                        <span className="font-mono text-gray-900">{test.target || `${test.min}–${test.max} ${test.unit}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-semibold text-gray-900">{test.frequency || 'Every shift'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alerts Banner */}
        {unacknowledgedAlerts.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="font-semibold text-red-700 mb-2">🚨 {unacknowledgedAlerts.length} Open Alert{unacknowledgedAlerts.length !== 1 ? 's' : ''}</div>
            {unacknowledgedAlerts.slice(0, 3).map((a) => (
              <div key={a.id} className="text-sm text-red-600">
                {a.system === 'boiler' ? '🔥' : '❄️'} {a.shift} shift — {a.outOfRange?.map((o) => o.label).join(', ')}
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Boiler pH</div>
            <div className={`text-2xl font-bold ${pHColor(boilerEntries[0]?.values?.ph)}`}>
              {boilerEntries[0]?.values?.ph ?? '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">{boilerEntries.length} entries</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Chilled pH</div>
            <div className={`text-2xl font-bold ${pHColor(chilledEntries[0]?.values?.ph)}`}>
              {chilledEntries[0]?.values?.ph ?? '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">{chilledEntries.length} entries</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Total Entries</div>
            <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
            <div className="text-xs text-gray-400 mt-1">All time</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Open Alerts</div>
            <div className={`text-2xl font-bold ${unacknowledgedAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {unacknowledgedAlerts.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Unacknowledged</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          {[
            { id: 'entries', label: '📊 Recent Entries' },
            { id: 'trends', label: '📈 Trends' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-[#0072CE] border-[#0072CE]'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : activeTab === 'entries' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {entries.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <div className="text-sm mb-3">No entries yet</div>
                <Link href="/entry" className="inline-block bg-[#0072CE] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                  Log First Entry →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {entries.map((e) => (
                  <div key={e.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">
                          {e.system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled'}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{e.shift} shift</span>
                        <span className="text-xs text-gray-500">{e.date}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Logged by {e.operatorName} · {timeSince(e.createdAt)}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">pH</div>
                        <div className={`font-bold text-lg ${pHColor(e.values?.ph)}`}>
                          {e.values?.ph ?? '—'}
                        </div>
                      </div>
                      {e.hasAlerts && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">OOR</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center text-gray-500">
              <div className="text-sm mb-3">📈 Trend analysis coming soon</div>
              <p className="text-xs">Charts will show pH trends over time for both systems</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
