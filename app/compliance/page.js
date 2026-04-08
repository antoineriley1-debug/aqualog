'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';
import { calcComplianceScore, gradeColor } from '@/lib/compliance';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('facilityh2o_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function ScoreBar({ value, color }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, transition: 'width 0.5s ease' }}
      />
    </div>
  );
}

export default function CompliancePage() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

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

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const scores = useMemo(() => {
    if (loading) return [];
    return HOSPITALS.map((h) => {
      const result = calcComplianceScore(h.id, entries, alerts, year, month);
      return { ...h, ...result };
    }).sort((a, b) => a.score - b.score); // worst first
  }, [entries, alerts, year, month, loading]);

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build month options (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthOptions.push({ val, label });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">{monthLabel} · All 10 facilities · Sorted worst first</p>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            {monthOptions.map(({ val, label }) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading compliance data...</div>
        ) : (
          <>
            {/* Grade cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {scores.map((h) => {
                const colors = gradeColor(h.grade);
                return (
                  <a
                    key={h.id}
                    href={`/hospital/${h.id}`}
                    className={`bg-white rounded-xl shadow-sm border-2 ${colors.border} p-5 block hover:shadow-md transition-shadow cursor-pointer`}
                    title={`Go to ${h.name} — data entry`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-[#0072CE] text-sm leading-tight hover:underline">{h.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{h.code} · Tap to enter data</div>
                      </div>
                      <div className={`text-center ml-2 flex-shrink-0`}>
                        <div className={`text-3xl font-bold ${colors.text}`}>{h.grade}</div>
                        <div className={`text-sm font-semibold ${colors.text}`}>{h.score}%</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Entry Completeness</span>
                          <span>{h.breakdown.entryCompleteness}%</span>
                        </div>
                        <ScoreBar
                          value={h.breakdown.entryCompleteness}
                          color={h.breakdown.entryCompleteness >= 80 ? 'bg-green-500' : h.breakdown.entryCompleteness >= 60 ? 'bg-yellow-500' : 'bg-red-500'}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Chemistry</span>
                          <span>{h.breakdown.chemCompliance}%</span>
                        </div>
                        <ScoreBar
                          value={h.breakdown.chemCompliance}
                          color={h.breakdown.chemCompliance >= 90 ? 'bg-green-500' : h.breakdown.chemCompliance >= 75 ? 'bg-yellow-500' : 'bg-red-500'}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Alert Response</span>
                          <span>{h.breakdown.alertResponse}%</span>
                        </div>
                        <ScoreBar
                          value={h.breakdown.alertResponse}
                          color={h.breakdown.alertResponse >= 90 ? 'bg-green-500' : h.breakdown.alertResponse >= 70 ? 'bg-yellow-500' : 'bg-red-500'}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                      <span>{h.breakdown.totalEntries} entries</span>
                      <span>{h.breakdown.alertsTotal} alerts</span>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Detailed breakdown table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Detailed Breakdown — {monthLabel}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entries</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry %</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chem %</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Readings</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">In Range</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Alerts</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Responded</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Alert %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {scores.map((h) => {
                      const colors = gradeColor(h.grade);
                      return (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <a
                              href={`/hospital/${h.id}`}
                              className="group flex items-start gap-1"
                              title={`Go to ${h.name} data entry`}
                            >
                              <div>
                                <div className="font-medium text-[#0072CE] group-hover:underline">{h.name}</div>
                                <div className="text-xs text-gray-400">{h.code} · <span className="text-[#0072CE] opacity-70">View →</span></div>
                              </div>
                            </a>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                              {h.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-700">{h.score}%</td>
                          <td className="px-4 py-3 text-center text-gray-700">{h.breakdown.totalEntries}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{h.breakdown.expectedEntries}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={h.breakdown.entryCompleteness >= 80 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {h.breakdown.entryCompleteness}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={h.breakdown.chemCompliance >= 90 ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                              {h.breakdown.chemCompliance}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">{h.breakdown.totalReadings}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{h.breakdown.inRangeReadings}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{h.breakdown.alertsTotal}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{h.breakdown.alertsResponded}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={h.breakdown.alertResponse >= 90 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {h.breakdown.alertResponse}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
