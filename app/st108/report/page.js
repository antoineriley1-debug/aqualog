'use client';
/**
 * FacilityH2O — AAMI ST108:2023 Monthly Compliance Report
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * This report is designed to be printed / exported for:
 * - Joint Commission (EC.02.05.02) surveys
 * - CMS QSO17-30 compliance
 * - Internal WMP team review
 * - DNV/ACHC accreditation surveys
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';
import { ST108_WATER_TYPES, ST108_PARAMETERS } from '@/lib/st108';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('facilityh2o_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function ST108ReportPage() {
  const router  = useRouter();
  const [user, setUser] = useState(null);
  const now     = new Date();
  const [selHospital, setSelHospital] = useState('');
  const [selYear, setSelYear]         = useState(now.getFullYear());
  const [selMonth, setSelMonth]       = useState(now.getMonth() + 1);
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [generated, setGenerated]     = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
  }, []);

  const generate = async () => {
    setLoading(true);
    const from = `${selYear}-${String(selMonth).padStart(2,'0')}-01`;
    const lastDay = new Date(selYear, selMonth, 0).getDate();
    const to   = `${selYear}-${String(selMonth).padStart(2,'0')}-${lastDay}`;
    const q    = new URLSearchParams({ hospital: selHospital, from, to });
    const res  = await fetch(`/api/st108/entries?${q}`);
    const data = await res.json();
    setEntries(data.entries || []);
    setGenerated(true);
    setLoading(false);
  };

  const hospitalName = HOSPITALS.find((h) => h.id === selHospital)?.name || selHospital;
  const monthLabel   = `${MONTHS[selMonth - 1]} ${selYear}`;

  // Aggregate by water type
  const byType = {};
  for (const wt of Object.keys(ST108_WATER_TYPES)) {
    const typeEntries = entries.filter((e) => e.waterType === wt);
    const allParams   = ST108_PARAMETERS[wt] || [];
    let total = 0, pass = 0, fail = 0;
    const failedParams = {};

    typeEntries.forEach((e) => {
      allParams.forEach((p) => {
        const v = e.values?.[p.key];
        if (v !== undefined && v !== '') {
          total++;
          const oor = p.max !== null && parseFloat(v) > p.max ||
                      p.min !== null && parseFloat(v) < p.min;
          if (oor) {
            fail++;
            failedParams[p.label] = (failedParams[p.label] || 0) + 1;
          } else {
            pass++;
          }
        }
      });
    });

    byType[wt] = {
      label: ST108_WATER_TYPES[wt].label,
      entryCount: typeEntries.length,
      total, pass, fail,
      pct: total > 0 ? Math.round((pass / total) * 100) : null,
      failedParams,
      corrections: typeEntries.flatMap((e) => e.corrections || []),
      entries: typeEntries,
    };
  }

  const totalEntries     = entries.length;
  const totalFailures    = entries.filter((e) => e.evaluation?.failCount > 0).length;
  const overallPass      = entries.reduce((acc, e) => acc + (e.evaluation?.passCount || 0), 0);
  const overallTotal     = entries.reduce((acc, e) => acc + (e.evaluation?.total || 0), 0);
  const overallPct       = overallTotal > 0 ? Math.round((overallPass / overallTotal) * 100) : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">

        {/* Controls */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:hidden">
          <h1 className="text-xl font-bold text-gray-900 mb-4">AAMI ST108:2023 — Monthly Compliance Report</h1>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hospital</label>
              <select
                value={selHospital} onChange={(e) => setSelHospital(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
              >
                <option value="">All Hospitals</option>
                {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Month</label>
              <select
                value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
              >
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
              <select
                value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button
              onClick={generate} disabled={loading}
              className="bg-[#0072CE] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#005fa3] transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : '📊 Generate Report'}
            </button>
            {generated && (
              <button
                onClick={() => window.print()}
                className="bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
              >
                🖨️ Print / Save PDF
              </button>
            )}
          </div>
        </div>

        {generated && (
          <div className="space-y-6" id="report-body">

            {/* Report Header */}
            <div className="bg-[#003366] text-white rounded-xl p-6 print:rounded-none">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-blue-300 font-semibold mb-1">ANSI/AAMI ST108:2023 COMPLIANCE REPORT</div>
                  <h2 className="text-2xl font-bold">{selHospital ? hospitalName : 'All FacilityH2O Inc. Facilities'}</h2>
                  <div className="text-blue-200 text-sm mt-1">Reporting Period: {monthLabel}</div>
                  <div className="text-blue-300 text-xs mt-1">Generated: {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black">
                    {overallPct !== null ? `${overallPct}%` : 'N/A'}
                  </div>
                  <div className="text-blue-300 text-xs">Overall Compliance</div>
                  <div className="text-blue-200 text-sm mt-2">{totalEntries} entries logged</div>
                  <div className={`text-sm font-semibold ${totalFailures > 0 ? 'text-red-300' : 'text-green-300'}`}>
                    {totalFailures} entries with failures
                  </div>
                </div>
              </div>
            </div>

            {/* Summary by Water Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(byType).map(([wt, d]) => (
                <div key={wt} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">{d.label}</div>
                  <div className={`text-3xl font-black ${d.pct === null ? 'text-gray-300' : d.pct >= 95 ? 'text-green-600' : d.pct >= 80 ? 'text-yellow-500' : 'text-red-600'}`}>
                    {d.pct !== null ? `${d.pct}%` : '—'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{d.entryCount} entries · {d.pass}/{d.total} readings in spec</div>
                  {d.fail > 0 && (
                    <div className="mt-3 border-t border-red-100 pt-3">
                      <div className="text-xs font-semibold text-red-600 mb-1">Failed parameters:</div>
                      {Object.entries(d.failedParams).map(([param, count]) => (
                        <div key={param} className="text-xs text-red-500">• {param} ({count}×)</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Corrective Actions Log */}
            {entries.some((e) => e.corrections?.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  ⚠️ Corrective Action Log
                  <span className="text-xs font-normal text-gray-400">(ST108 §9 — required documentation)</span>
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b">
                      <th className="text-left py-2 pr-4">Date / Time</th>
                      <th className="text-left py-2 pr-4">POU</th>
                      <th className="text-left py-2 pr-4">Parameter</th>
                      <th className="text-left py-2 pr-4">Value</th>
                      <th className="text-left py-2 pr-4">Limit</th>
                      <th className="text-left py-2 pr-4">CA Level</th>
                      <th className="text-left py-2">Notes / Action Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entries.filter((e) => e.corrections?.length > 0).map((e) =>
                      e.corrections.map((c, i) => (
                        <tr key={`${e.id}-${i}`} className={c.requiresHalt ? 'bg-red-50' : 'bg-yellow-50/50'}>
                          <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">{e.testDate} {e.testTime}</td>
                          <td className="py-2 pr-4 text-xs">{e.pou}</td>
                          <td className="py-2 pr-4 text-xs font-medium">{c.label}</td>
                          <td className="py-2 pr-4 text-xs font-mono text-red-600">{c.value}</td>
                          <td className="py-2 pr-4 text-xs text-gray-500">{c.limit}</td>
                          <td className="py-2 pr-4">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              c.level === 'Critical' ? 'bg-red-100 text-red-700' :
                              c.level === 'Action' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{c.level}</span>
                            {c.requiresHalt && <div className="text-xs text-red-600 font-bold mt-0.5">HALT REQUIRED</div>}
                          </td>
                          <td className="py-2 text-xs text-gray-600">{e.notes || <span className="text-gray-300 italic">None documented</span>}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Full Entry Log */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                Complete Water Quality Log — {monthLabel}
              </h3>
              {entries.length === 0 ? (
                <p className="text-gray-400 italic text-sm">No ST108 entries recorded for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="text-left py-2 pr-3">Date</th>
                        <th className="text-left py-2 pr-3">Time</th>
                        <th className="text-left py-2 pr-3">Water Type</th>
                        <th className="text-left py-2 pr-3">POU</th>
                        <th className="text-left py-2 pr-3">Technician</th>
                        <th className="text-left py-2 pr-3">Readings</th>
                        <th className="text-left py-2">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {entries.map((e) => (
                        <tr key={e.id} className={e.evaluation?.failCount > 0 ? 'bg-red-50' : ''}>
                          <td className="py-2 pr-3 whitespace-nowrap">{e.testDate}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{e.testTime}</td>
                          <td className="py-2 pr-3">{ST108_WATER_TYPES[e.waterType]?.label}</td>
                          <td className="py-2 pr-3">{e.pou}</td>
                          <td className="py-2 pr-3">{e.technician}</td>
                          <td className="py-2 pr-3">{e.evaluation?.passCount}/{e.evaluation?.total}</td>
                          <td className="py-2">
                            {e.evaluation?.failCount > 0
                              ? <span className="text-red-600 font-bold">✗ {e.evaluation.failCount} FAIL</span>
                              : <span className="text-green-600 font-bold">✓ PASS</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Certification Block */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:break-inside-avoid">
              <h3 className="text-base font-bold text-gray-800 mb-4">Report Certification</h3>
              <p className="text-sm text-gray-500 mb-6">
                I certify that the water quality data contained in this report was collected and recorded in
                accordance with ANSI/AAMI ST108:2023 — Water for the Processing of Medical Devices,
                Joint Commission Standard EC.02.05.02, and CMS QSO17-30.
              </p>
              <div className="grid grid-cols-2 gap-8">
                {[['Water Management Program Coordinator', ''], ['Facilities Director / Designee', ''], ['Date Reviewed', '']].map(([title], i) => (
                  <div key={i} className="border-t border-gray-300 pt-4">
                    <div className="h-8"></div>
                    <div className="text-xs text-gray-500">{title}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-xs text-gray-400 border-t border-gray-100 pt-4">
                Report generated by FacilityH2O — FacilityH2O Inc. Water Chemistry Portal | Author: Antoine Riley | ANSI/AAMI ST108:2023
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
