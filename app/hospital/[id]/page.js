'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';
import { BOILER_TESTS, CHILLED_TESTS } from '@/lib/testGuide';

export default function HospitalPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [activeTab, setActiveTab] = useState('boiler');

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

  if (!hospital) return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 p-8"><div className="text-red-500">Hospital not found</div></main></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
          <p className="text-gray-500 mt-1">Testing Procedures</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          {[
            { id: 'boiler', label: '🔥 Boiler Water Tests', icon: '🔥' },
            { id: 'chilled', label: '❄️ Chilled Water Tests', icon: '❄️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-[#003366] border-[#003366]'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Test Procedures */}
        <div className="space-y-6">
          {(activeTab === 'boiler' ? BOILER_TESTS : CHILLED_TESTS).map((test, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-3xl">{test.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{test.number || idx + 1}. {test.label}</h3>
                  <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 font-semibold">Acceptable Range</div>
                  <div className="text-gray-900 font-mono mt-1">{test.target || `${test.min}–${test.max} ${test.unit}`}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 font-semibold">Frequency</div>
                  <div className="text-gray-900 font-mono mt-1">{test.frequency || 'Every shift'}</div>
                </div>
              </div>

              {test.testKit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                  <div className="font-semibold text-blue-900">Test Kit</div>
                  <div className="text-blue-800 mt-1">{test.testKit}</div>
                </div>
              )}

              {test.procedure && (
                <div className="mb-4">
                  <div className="font-semibold text-gray-900 mb-2">Procedure</div>
                  <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside ml-2">
                    {test.procedure.map((step, sidx) => (
                      <li key={sidx} className="text-gray-600">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {test.ifHigh && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3 text-sm">
                  <div className="font-semibold text-orange-900 mb-2">⚠️ {test.ifHigh.title}</div>
                  <ol className="space-y-1 text-orange-800 list-decimal list-inside ml-2">
                    {test.ifHigh.steps.map((step, sidx) => (
                      <li key={sidx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {test.ifLow && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                  <div className="font-semibold text-red-900 mb-2">🔴 {test.ifLow.title}</div>
                  <ol className="space-y-1 text-red-800 list-decimal list-inside ml-2">
                    {test.ifLow.steps.map((step, sidx) => (
                      <li key={sidx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
