'use client';
/**
 * FacilityH2O — Lab Sample Chain of Custody Form Generator
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Generates prepopulated COC forms for:
 * - AAMI ST108 critical water samples (endotoxin, bacteria, TOC, metals)
 * - Legionella culture samples (cooling tower, domestic water)
 * - Ready to print and send with lab samples
 * Required for: JCAHO, CMS, DOH, accreditation surveys
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const SAMPLE_TYPES = [
  {
    id: 'st108_critical_micro',
    label: 'ST108 Critical Water — Microbial',
    standard: 'ANSI/AAMI ST108:2023 Table 4',
    tests: ['Heterotrophic Bacteria (CFU/mL) — R2A agar, 3-day incubation', 'Endotoxins / LAL (EU/mL)'],
    container: '250mL sterile bottle with sodium thiosulfate',
    preservation: 'Refrigerate 2–8°C, deliver within 6 hours',
    turnaround: '3–5 business days',
    color: 'purple',
  },
  {
    id: 'st108_critical_chem',
    label: 'ST108 Critical Water — Chemical',
    standard: 'ANSI/AAMI ST108:2023 Table 4',
    tests: ['Total Organic Carbon (TOC)', 'Silica', 'Iron (total)', 'Copper', 'Lead', 'Total Dissolved Solids'],
    container: '1L HDPE bottle, no preservative (TOC: 40mL amber glass with HCl)',
    preservation: 'Refrigerate 2–8°C, deliver within 24 hours',
    turnaround: '5–7 business days',
    color: 'blue',
  },
  {
    id: 'st108_steam',
    label: 'ST108 Steam Condensate',
    standard: 'ANSI/AAMI ST108:2023 Table 5',
    tests: ['Heterotrophic Bacteria (CFU/mL)', 'Endotoxins / LAL (EU/mL)', 'Conductivity (µS/cm)', 'Silica (mg/L)', 'Iron (mg/L)'],
    container: '250mL sterile glass bottle',
    preservation: 'Refrigerate 2–8°C, deliver within 6 hours',
    turnaround: '3–5 business days',
    color: 'orange',
  },
  {
    id: 'legionella_culture',
    label: 'Legionella Culture — Water System',
    standard: 'ASHRAE 188-2018 / CDC WMP Guidelines',
    tests: ['Legionella pneumophila culture (CFU/mL)', 'Legionella species ID (if positive)', 'Total viable count'],
    container: '1L sterile bottle with sodium thiosulfate (0.1%)',
    preservation: 'Refrigerate 2–8°C, deliver within 24 hours — PRIORITY',
    turnaround: '7–14 days (culture)',
    color: 'red',
  },
  {
    id: 'legionella_pcr',
    label: 'Legionella PCR / Rapid Test',
    standard: 'ASHRAE 188-2018',
    tests: ['Legionella pneumophila PCR (qualitative)', 'Legionella spp. PCR'],
    container: '250mL sterile bottle with sodium thiosulfate',
    preservation: 'Refrigerate 2–8°C, same-day delivery preferred',
    turnaround: '24–48 hours',
    color: 'red',
  },
  {
    id: 'utility_water',
    label: 'Utility Water — Routine',
    standard: 'ANSI/AAMI ST108:2023 Table 4',
    tests: ['pH', 'Conductivity', 'Turbidity (NTU)', 'Total Hardness', 'Free Chlorine', 'Total Dissolved Solids', 'Iron (total)', 'Heterotrophic Bacteria'],
    container: '1L sterile bottle',
    preservation: 'Refrigerate, deliver within 24 hours',
    turnaround: '3–5 business days',
    color: 'green',
  },
];

const COC_NUMBER = () => {
  const d = new Date();
  return `COC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;
};

export default function CoCPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    cocNumber:        '',
    sampleType:       'legionella_culture',
    hospital:         '',
    collectionPoint:  '',
    collectionDate:   new Date().toISOString().slice(0,10),
    collectionTime:   new Date().toTimeString().slice(0,5),
    collectedBy:      '',
    labName:          'Eurofins Environment Testing / Nelson Labs',
    labAddress:       '',
    labPhone:         '',
    labAccountNo:     '',
    priority:         'routine',
    additionalTests:  '',
    relinquishedBy:   '',
    relinquishedDate: '',
    carrierName:      'FedEx / Lab Courier',
    conditions:       'Refrigerated (2–8°C)',
    notes:            '',
  });

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    setForm((p) => ({
      ...p,
      cocNumber:    COC_NUMBER(),
      collectedBy:  u.name || u.username,
      hospital:     u.hospital || '',
    }));
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const sample = SAMPLE_TYPES.find((s) => s.id === form.sampleType);
  const hospital = HOSPITALS.find((h) => h.id === form.hospital);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">

        {/* Controls — hidden on print */}
        <div className="mb-6 print:hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚗</span>
            <h1 className="text-2xl font-bold text-gray-900">Chain of Custody Form</h1>
            <span className="text-xs bg-purple-700 text-white px-2 py-1 rounded-full font-medium">Lab Sample COC</span>
          </div>
          <p className="text-gray-500 text-sm mb-6">Generate a prepopulated chain of custody form for lab samples. Print and send with the sample container.</p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            {/* Sample Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Sample Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SAMPLE_TYPES.map((s) => (
                  <button key={s.id} type="button" onClick={() => set('sampleType', s.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition
                      ${form.sampleType === s.id ? 'border-[#0072CE] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="font-bold text-gray-800 mb-0.5">{s.label}</div>
                    <div className="text-gray-400">{s.standard}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hospital</label>
                <select value={form.hospital} onChange={(e) => set('hospital', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Collection Point / POU</label>
                <input type="text" value={form.collectionPoint} onChange={(e) => set('collectionPoint', e.target.value)}
                  placeholder="e.g. RO Permeate, CT-1 Basin, Floor 3 HW Return"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="routine">Routine</option>
                  <option value="rush">RUSH (24–48h)</option>
                  <option value="stat">STAT — Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Collection Date</label>
                <input type="date" value={form.collectionDate} onChange={(e) => set('collectionDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Collection Time</label>
                <input type="time" value={form.collectionTime} onChange={(e) => set('collectionTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Collected By</label>
                <input type="text" value={form.collectedBy} onChange={(e) => set('collectedBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Lab Name</label>
                <input type="text" value={form.labName} onChange={(e) => set('labName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Lab Account #</label>
                <input type="text" value={form.labAccountNo} onChange={(e) => set('labAccountNo', e.target.value)}
                  placeholder="Your account number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Carrier</label>
                <input type="text" value={form.carrierName} onChange={(e) => set('carrierName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Additional Notes</label>
              <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)}
                placeholder="Any special instructions, condition notes, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <button onClick={() => window.print()}
              className="bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#002244] transition">
              ⎙️ Print COC Form
            </button>
          </div>
        </div>

        {/* ──────────────────────────────────────────────
            PRINTABLE COC FORM (visible always, formatted for print)
        ────────────────────────────────────────────── */}
        <div id="coc-form" className="bg-white border-2 border-gray-800 rounded-xl print:rounded-none print:border-2 max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b-2 border-gray-800">
            <div>
              <div className="text-2xl font-black text-[#003366]">[WATER] FacilityH2O</div>
              <div className="text-sm font-semibold text-gray-600">FacilityH2O Inc. · Water Chemistry Portal</div>
              <div className="text-xs text-gray-400 mt-1">Author: Antoine Riley · FacilityH2O</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-gray-800">CHAIN OF CUSTODY</div>
              <div className="text-sm text-gray-500">Laboratory Sample Form</div>
              <div className="mt-2 text-xs">
                <span className="font-bold">COC #:</span>{' '}
                <span className="font-mono text-[#003366] text-base">{form.cocNumber}</span>
              </div>
              {form.priority !== 'routine' && (
                <div className={`mt-1 inline-block px-3 py-0.5 rounded font-bold text-xs text-white ${form.priority === 'stat' ? 'bg-red-600' : 'bg-orange-500'}`}>
                  {form.priority === 'stat' ? '!! STAT' : '↯ RUSH'}
                </div>
              )}
            </div>
          </div>

          {/* Sample Info */}
          <div className="p-6 border-b border-gray-300">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Sample Information</h3>
                <Row label="Sample Type"      value={sample?.label} />
                <Row label="Standard"         value={sample?.standard} />
                <Row label="Collection Point" value={form.collectionPoint || '_______________'} />
                <Row label="Collection Date"  value={form.collectionDate} />
                <Row label="Collection Time"  value={form.collectionTime} />
                <Row label="Collected By"     value={form.collectedBy || '_______________'} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Facility</h3>
                <Row label="Hospital"   value={hospital?.name || form.hospital || '_______________'} />
                <Row label="Address"    value={hospital?.address || '_______________'} />
                <Row label="Phone"      value={hospital?.phone || '_______________'} />
                <Row label="Account #"  value={form.labAccountNo || '_______________'} />
              </div>
            </div>
          </div>

          {/* Tests Requested */}
          <div className="p-6 border-b border-gray-300">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Tests Requested</h3>
            <div className="grid grid-cols-2 gap-2">
              {sample?.tests.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 rounded flex-shrink-0"></div>
                  <span className="text-sm text-gray-800">{t}</span>
                </div>
              ))}
              {form.additionalTests && (
                <div className="col-span-2 text-sm text-gray-600 mt-2">
                  <strong>Additional:</strong> {form.additionalTests}
                </div>
              )}
            </div>
          </div>

          {/* Container & Preservation */}
          <div className="p-6 border-b border-gray-300 bg-gray-50 print:bg-white">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Container</div>
                <div className="text-gray-800">{sample?.container}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Preservation / Handling</div>
                <div className="text-gray-800">{sample?.preservation}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-1">Expected Turnaround</div>
                <div className="text-gray-800">{sample?.turnaround}</div>
              </div>
            </div>
          </div>

          {/* Lab Info */}
          <div className="p-6 border-b border-gray-300">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Laboratory</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Row label="Lab Name"    value={form.labName} />
              <Row label="Carrier"     value={form.carrierName} />
              <Row label="Conditions"  value={form.conditions} />
            </div>
          </div>

          {/* Chain of Custody Signatures */}
          <div className="p-6 border-b border-gray-300">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Chain of Custody — Signatures</h3>
            <table className="w-full text-sm border border-gray-300">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Action</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Name (Print)</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Signature</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Relinquished by (Collector)', form.collectedBy, form.collectionDate, form.collectionTime],
                  ['Received by (Courier/Lab)', '', '', ''],
                  ['Received at Lab', '', '', ''],
                  ['Analyzed by (Lab Technician)', '', '', ''],
                ].map(([action, name, date, time], i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 px-3 py-4 text-xs font-medium">{action}</td>
                    <td className="border border-gray-300 px-3 py-4 text-sm">{name || <span className="text-gray-200">________________________</span>}</td>
                    <td className="border border-gray-300 px-3 py-4"><span className="text-gray-200">________________________</span></td>
                    <td className="border border-gray-300 px-3 py-4 text-sm">{date || <span className="text-gray-200">__________</span>}</td>
                    <td className="border border-gray-300 px-3 py-4 text-sm">{time || <span className="text-gray-200">________</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes + Footer */}
          <div className="p-6">
            {form.notes && (
              <div className="mb-4 text-sm">
                <span className="font-bold text-gray-600">Notes: </span>
                <span className="text-gray-800">{form.notes}</span>
              </div>
            )}
            <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
              COC #{form.cocNumber} · Generated by FacilityH2O — FacilityH2O Inc. Water Chemistry Portal · Author: Antoine Riley ·{' '}
              ANSI/AAMI ST108:2023 / ASHRAE 188-2018 / Joint Commission EC.02.05.02 ·{' '}
              Generated: {new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 mb-2">
      <span className="text-gray-500 text-xs font-semibold w-32 flex-shrink-0">{label}:</span>
      <span className="text-gray-800 text-sm font-medium">{value}</span>
    </div>
  );
}
