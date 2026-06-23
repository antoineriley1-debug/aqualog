'use client';
/**
 * FacilityH2O — AAMI ST108:2023 Annual Self-Audit Checklist
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Based on: ANSI/AAMI ST108:2023 and Apex Healthcare ST108 Self-Audit framework
 * For use in preparation for: Joint Commission, CMS, DNV, ACHC surveys
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';
import { ST108_AUDIT_SECTIONS } from '@/lib/st108';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const RESPONSE_OPTIONS = [
  { value: 'yes',  label: '✓ Yes — Compliant',      color: 'green' },
  { value: 'no',   label: '× No — Not Compliant',    color: 'red' },
  { value: 'na',   label: '− N/A',                   color: 'gray' },
  { value: 'ip',   label: '↺ In Progress',           color: 'yellow' },
];

export default function ST108AuditPage() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [hospital, setHospital]   = useState('');
  const [auditor, setAuditor]     = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
  const [responses, setResponses] = useState({});
  const [comments, setComments]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    setAuditor(u.name || u.username);
    if (u.hospital) setHospital(u.hospital);
  }, []);

  const setResponse = (itemId, val) => setResponses((p) => ({ ...p, [itemId]: val }));
  const setComment  = (itemId, val) => setComments((p) => ({ ...p, [itemId]: val }));

  // Score calculation
  const allItems    = ST108_AUDIT_SECTIONS.flatMap((s) => s.items);
  const answered    = allItems.filter((i) => responses[i.id] && responses[i.id] !== 'na');
  const compliant   = answered.filter((i) => responses[i.id] === 'yes');
  const nonCompliant = answered.filter((i) => responses[i.id] === 'no');
  const inProgress  = answered.filter((i) => responses[i.id] === 'ip');
  const reqItems    = allItems.filter((i) => i.required);
  const reqAnswered = reqItems.filter((i) => responses[i.id] === 'yes');
  const score       = answered.length > 0 ? Math.round((compliant.length / answered.length) * 100) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { hospital, auditor, auditDate, responses, comments, score, standard: 'ANSI/AAMI ST108:2023' };
      await fetch('/api/st108/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">

        {/* Header */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:hidden">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                AAMI ST108:2023 — Annual Self-Audit Checklist
              </h1>
              <p className="text-sm text-gray-500">
                Assess ST108 compliance readiness. Complete all sections before Joint Commission, CMS, DNV, or ACHC surveys.
              </p>
            </div>
            {score !== null && (
              <div className={`text-center px-6 py-3 rounded-xl ${score >= 90 ? 'bg-green-50 border border-green-200' : score >= 70 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                <div className={`text-3xl font-black ${score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{score}%</div>
                <div className="text-xs text-gray-500 mt-0.5">Compliance Score</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hospital / Facility *</label>
              <select value={hospital} onChange={(e) => setHospital(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]">
                <option value="">Select...</option>
                {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Auditor Name *</label>
              <input type="text" value={auditor} onChange={(e) => setAuditor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Audit Date</label>
              <input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]" />
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            <Stat label="Compliant"     value={compliant.length}    color="green" />
            <Stat label="Non-Compliant" value={nonCompliant.length} color="red" />
            <Stat label="In Progress"   value={inProgress.length}   color="yellow" />
            <Stat label="Required items met" value={`${reqAnswered.length}/${reqItems.length}`} color={reqAnswered.length === reqItems.length ? 'green' : 'red'} />
          </div>
        </div>

        {saved && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium print:hidden">
            ✓ Audit saved successfully.
          </div>
        )}

        {/* Sections */}
        {ST108_AUDIT_SECTIONS.map((section) => {
          const sectionItems   = section.items;
          const sectionYes     = sectionItems.filter((i) => responses[i.id] === 'yes').length;
          const sectionNo      = sectionItems.filter((i) => responses[i.id] === 'no').length;
          const sectionAnswered = sectionItems.filter((i) => responses[i.id] && responses[i.id] !== 'na').length;
          const sectionPct     = sectionAnswered > 0 ? Math.round((sectionYes / sectionAnswered) * 100) : null;

          return (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-[#003366] text-white">
                <div>
                  <div className="font-bold text-base">{section.title}</div>
                  <div className="text-xs text-blue-300 mt-0.5">{section.reference}</div>
                </div>
                {sectionPct !== null && (
                  <div className={`text-lg font-black px-3 py-1 rounded-lg ${sectionPct >= 90 ? 'bg-green-500' : sectionPct >= 70 ? 'bg-yellow-500 text-gray-900' : 'bg-red-500'}`}>
                    {sectionPct}%
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-50">
                {section.items.map((item) => {
                  const resp = responses[item.id];
                  return (
                    <div key={item.id} className={`px-6 py-4 ${resp === 'no' ? 'bg-red-50' : resp === 'yes' ? 'bg-green-50/30' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{item.text}</span>
                            {item.required && <span className="text-xs bg-[#003366] text-white px-1.5 py-0.5 rounded">Required</span>}
                          </div>
                          {resp === 'no' && (
                            <input
                              type="text"
                              value={comments[item.id] || ''}
                              onChange={(e) => setComment(item.id, e.target.value)}
                              placeholder="Describe gap and remediation plan..."
                              className="mt-2 w-full border border-red-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                          )}
                          {resp === 'ip' && (
                            <input
                              type="text"
                              value={comments[item.id] || ''}
                              onChange={(e) => setComment(item.id, e.target.value)}
                              placeholder="Status update / target completion date..."
                              className="mt-2 w-full border border-yellow-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                          {RESPONSE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setResponse(item.id, opt.value)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition
                                ${resp === opt.value
                                  ? opt.color === 'green' ? 'bg-green-600 text-white border-green-600'
                                  : opt.color === 'red'   ? 'bg-red-600 text-white border-red-600'
                                  : opt.color === 'yellow'? 'bg-yellow-500 text-white border-yellow-500'
                                  :                         'bg-gray-500 text-white border-gray-500'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Action bar */}
        <div className="flex items-center gap-4 mb-8 print:hidden">
          <button
            onClick={handleSave} disabled={saving || !hospital}
            className="bg-[#0072CE] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#005fa3] transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Save Audit'}
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
          >
            Print️ Print / Save PDF
          </button>
          <span className="text-xs text-gray-400">Records retained for minimum 3 years per ST108 §10</span>
        </div>

        {/* Print signature block */}
        <div className="hidden print:block bg-white border border-gray-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-gray-800 mb-4">Audit Certification</h3>
          <div className="grid grid-cols-2 gap-8">
            {['Auditor Signature', 'WMP Program Coordinator', 'Facilities Director', 'Date'].map((label) => (
              <div key={label} className="border-t border-gray-400 pt-4">
                <div className="h-10"></div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-6 border-t border-gray-100 pt-4">
            ANSI/AAMI ST108:2023 Self-Audit · FacilityH2O — FacilityH2O Inc. Water Chemistry Portal · Author: Antoine Riley
          </div>
        </div>

      </main>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className={`px-4 py-2 rounded-lg border text-center
      ${color === 'green' ? 'bg-green-50 border-green-200 text-green-700'
      : color === 'red'   ? 'bg-red-50 border-red-200 text-red-700'
      : color === 'yellow'? 'bg-yellow-50 border-yellow-200 text-yellow-700'
      :                     'bg-gray-50 border-gray-200 text-gray-600'}`}>
      <div className="text-xl font-black">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
