/**
 * FacilityH2O — Monthly Hospital Compliance Report (PDF via browser print)
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * GET /api/report/:hospitalId?month=YYYY-MM
 *   &ai=0     skip the AI council summary
 *   &print=0  don't auto-open the print dialog
 *
 * Renders a print-ready report. The browser's print dialog saves it as PDF.
 * The Executive Summary is produced by a 3-pass AI council:
 *   independent draft → anonymous peer review against the computed numbers
 *   → chairman synthesis. The peer review is attached as an appendix.
 */

import { NextResponse } from 'next/server';
import { getEntriesForHospital } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';

const RANGES = {
  boiler: [
    { key: 'ph', label: 'pH', min: 8.5, max: 10.5, unit: '' },
    { key: 'phosphate', label: 'Phosphate', min: 20, max: 60, unit: 'ppm' },
    { key: 'sulfite', label: 'Sulfite', min: 20, max: 80, unit: 'ppm' },
    { key: 'hardness', label: 'Hardness', min: 0, max: 5, unit: 'ppm' },
    { key: 'conductivity', label: 'Conductivity', min: 0, max: 3500, unit: 'µS' },
    { key: 'alkalinity', label: 'Alkalinity', min: 100, max: 700, unit: 'ppm' },
    { key: 'tds', label: 'TDS', min: 0, max: 3000, unit: 'ppm' },
    { key: 'amine', label: 'Amine', min: 0, max: 10, unit: 'ppm' },
  ],
  chilled: [
    { key: 'ph', label: 'pH', min: 7.5, max: 9.5, unit: '' },
    { key: 'conductivity', label: 'Conductivity', min: 0, max: 2000, unit: 'µS' },
    { key: 'inhibitor', label: 'Inhibitor', min: 50, max: 300, unit: 'ppm' },
    { key: 'hardness', label: 'Hardness', min: 0, max: 200, unit: 'ppm' },
    { key: 'iron', label: 'Iron', min: 0, max: 2, unit: 'ppm' },
    { key: 'tds', label: 'TDS', min: 0, max: 2000, unit: 'ppm' },
    { key: 'molybdate', label: 'Molybdate', min: 5, max: 30, unit: 'ppm' },
    { key: 'bacteria', label: 'Bacteria', min: 0, max: 1000, unit: 'CFU/mL' },
  ],
};

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function buildStats(entries) {
  const out = {};
  for (const system of ['boiler', 'chilled']) {
    const sysEntries = entries.filter((e) => e.system === system);
    out[system] = {
      count: sysEntries.length,
      fields: RANGES[system].map((f) => {
        const vals = sysEntries
          .map((e) => ({ v: Number(e.values?.[f.key]), e }))
          .filter((x) => Number.isFinite(x.v));
        const nums = vals.map((x) => x.v);
        const oor = vals.filter((x) => x.v < f.min || x.v > f.max);
        return {
          ...f,
          readings: nums.length,
          avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null,
          lo: nums.length ? Math.min(...nums) : null,
          hi: nums.length ? Math.max(...nums) : null,
          exceed: oor.map((x) => ({
            date: x.e.date,
            shift: x.e.shift,
            value: x.v,
          })),
        };
      }),
    };
  }
  return out;
}

function statsDigest(hospitalName, month, entries, stats) {
  const lines = [
    `Hospital: ${hospitalName}. Reporting month: ${monthLabel(month)}.`,
    `Total readings logged: ${entries.length} (${stats.boiler.count} boiler, ${stats.chilled.count} chilled water).`,
  ];
  for (const system of ['boiler', 'chilled']) {
    for (const f of stats[system].fields) {
      if (!f.readings) continue;
      lines.push(
        `${system} ${f.label}: ${f.readings} readings, avg ${round(f.avg)}, range ${round(f.lo)}–${round(f.hi)}, acceptable ${f.min}–${f.max} ${f.unit}, out-of-range count ${f.exceed.length}${
          f.exceed.length ? ' (' + f.exceed.slice(0, 4).map((x) => `${x.date} ${x.shift}: ${x.value}`).join('; ') + (f.exceed.length > 4 ? '; …' : '') + ')' : ''
        }`
      );
    }
  }
  const notes = entries.filter((e) => e.notes && !/normal|no issue/i.test(e.notes)).slice(0, 6);
  if (notes.length) lines.push('Operator notes of interest: ' + notes.map((e) => `${e.date} ${e.system}: "${e.notes.slice(0, 110)}"`).join(' | '));
  return lines.join('\n');
}

const round = (n) => (n == null ? '—' : Math.round(n * 100) / 100);

async function councilSummary(hospitalName, month, digest) {
  if (!process.env.ANTHROPIC_API_KEY) return { summary: null, critique: null, reason: 'AI key not configured' };
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const MODEL = 'claude-sonnet-4-20250514';
    const ask = (system, content, max_tokens) =>
      client.messages
        .create({ model: MODEL, max_tokens, system, messages: [{ role: 'user', content }] })
        .then((r) => (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim());

    const baseSystem =
      'You write executive summaries for hospital water-chemistry monthly compliance reports. Plain professional prose, no bullets, no headers, 170-230 words. Cover: overall compliance posture for the month, the specific exceedances and what they indicate, any trends, operational risk, and recommended next actions. Use only the numbers provided. Defer any treatment changes to the water treatment vendor.';

    const draft = await ask(baseSystem, `DATA:\n${digest}\n\nWrite the executive summary for ${hospitalName}, ${monthLabel(month)}.`, 600);

    const critique = await ask(
      'You are an anonymous peer reviewer on a hospital water-chemistry compliance council. You did NOT write the draft. Verify every number and claim strictly against the DATA. Flag anything unsupported, list concrete corrections or omissions as a short numbered list, confirm treatment changes are deferred to the vendor, and end with a one-line verdict. Be blunt.',
      `DATA:\n${digest}\n\nDRAFT UNDER REVIEW:\n${draft}`,
      450
    );

    const summary = await ask(
      'You are the council chairman. Output ONLY the final executive summary — no preamble, no mention of the draft or review. Incorporate every valid correction. Plain professional prose, 170-230 words.',
      `DATA:\n${digest}\n\nDRAFT:\n${draft}\n\nANONYMOUS PEER REVIEW:\n${critique}`,
      600
    );

    return { summary, critique, reason: null };
  } catch (e) {
    console.error('Council summary failed:', e.message);
    return { summary: null, critique: null, reason: e.message };
  }
}

export async function GET(request, { params }) {
  // signed-in users only
  const cookie = request.cookies.get('FacilityH2O_user');
  if (!cookie) {
    return new NextResponse('<h3 style="font-family:sans-serif">Please sign in to FacilityH2O, then reopen this report.</h3>', {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const { id } = params;
  const url = new URL(request.url);
  const month = /^\d{4}-\d{2}$/.test(url.searchParams.get('month') || '') ? url.searchParams.get('month') : new Date().toISOString().slice(0, 7);
  const useAI = url.searchParams.get('ai') !== '0';
  const autoPrint = url.searchParams.get('print') !== '0';

  const hospital = HOSPITALS.find((h) => h.id === id);
  if (!hospital) return new NextResponse('Unknown hospital', { status: 404 });

  const all = getEntriesForHospital(id) || [];
  const entries = all.filter((e) => (e.date || '').startsWith(month));
  const stats = buildStats(entries);
  const digest = statsDigest(hospital.name, month, entries, stats);

  const ai = useAI && entries.length ? await councilSummary(hospital.name, month, digest) : { summary: null, critique: null, reason: entries.length ? 'AI disabled for this render' : 'No readings logged this month' };

  const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://medstarh20log.com').replace(/\/+$/, '');
  const totalExceed = ['boiler', 'chilled'].reduce((s, sys) => s + stats[sys].fields.reduce((a, f) => a + f.exceed.length, 0), 0);

  const fieldTable = (system) => `
    <h2>${system === 'boiler' ? 'Boiler System' : 'Chilled Water System'} — ${stats[system].count} readings</h2>
    <table>
      <tr><th>Parameter</th><th>Acceptable Range</th><th>Readings</th><th>Average</th><th>Min–Max</th><th>Out of Range</th></tr>
      ${stats[system].fields
        .map(
          (f) => `<tr${f.exceed.length ? ' class="bad"' : ''}>
        <td>${esc(f.label)}</td><td>${f.min}–${f.max} ${esc(f.unit)}</td><td>${f.readings}</td>
        <td>${round(f.avg)}</td><td>${f.readings ? round(f.lo) + ' – ' + round(f.hi) : '—'}</td><td>${f.exceed.length || '—'}</td></tr>`
        )
        .join('')}
    </table>`;

  const exceedRows = ['boiler', 'chilled']
    .flatMap((sys) =>
      stats[sys].fields.flatMap((f) =>
        f.exceed.map((x) => `<tr><td>${esc(x.date)}</td><td>${esc(x.shift)}</td><td>${sys}</td><td>${esc(f.label)}</td><td>${x.value} ${esc(f.unit)}</td><td>${f.min}–${f.max}</td></tr>`)
      )
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${esc(hospital.name)} — Water Chemistry Compliance — ${esc(monthLabel(month))}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:0;padding:32px 40px;font-size:13px;line-height:1.55}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #164E63;padding-bottom:12px;margin-bottom:18px}
  .brand{font-size:20px;font-weight:bold;color:#164E63}
  .brand small{display:block;font-size:10px;color:#666;font-weight:normal;letter-spacing:.12em;text-transform:uppercase;margin-top:2px}
  h1{font-size:19px;margin:0 0 2px}
  h2{font-size:14px;border-bottom:1.5px solid #333;padding-bottom:3px;margin:20px 0 8px;color:#164E63}
  table{width:100%;border-collapse:collapse;font-size:11.5px;margin:6px 0}
  th,td{border:.75px solid #777;padding:4px 7px;text-align:left;vertical-align:top}
  th{background:#eef6f9}
  tr.bad td{background:#fdf0f0}
  .badge{display:inline-block;border:1.5px solid #0e7a52;color:#0e7a52;border-radius:14px;padding:2px 11px;font-size:10px;font-weight:bold;letter-spacing:.08em}
  .summary{border:1px solid #b9d9e4;background:#f4fafc;padding:13px 16px;margin:10px 0;white-space:pre-wrap}
  .links a{color:#0b6aa2;margin-right:14px;font-size:11px}
  .disc{border:1px solid #999;padding:8px 10px;font-size:10px;color:#444;margin-top:18px}
  .appendix{page-break-before:always}
  .crit{white-space:pre-wrap;font-size:11px;color:#333;border-left:3px solid #0e7a52;padding-left:12px}
  .meta{font-size:10.5px;color:#555}
  @media print{ .noprint{display:none} body{padding:0} }
</style></head><body>
  <div class="head">
    <div class="brand">💧 FacilityH2O<small>Water Chemistry Compliance Portal</small></div>
    <div style="text-align:right"><h1>${esc(hospital.name)}</h1>
      <div class="meta">Monthly Compliance Report — ${esc(monthLabel(month))}<br>Generated ${new Date().toLocaleString('en-US')} · ${entries.length} readings · ${totalExceed} out-of-range</div></div>
  </div>

  ${ai.summary ? `<div><span class="badge">⚖ COUNCIL-REVIEWED</span>
    <h2 style="margin-top:8px">Executive Summary</h2>
    <div class="summary">${esc(ai.summary)}</div>
    <div class="meta">AI-drafted, anonymously peer-reviewed against this month's logged readings, then synthesized. Peer review attached as Appendix A. Verify treatment decisions with your water treatment vendor.</div></div>`
    : `<div class="meta" style="margin:8px 0 2px">Executive summary unavailable for this render${ai.reason ? ' — ' + esc(ai.reason) : ''}.</div>`}

  ${fieldTable('boiler')}
  ${fieldTable('chilled')}

  <h2>Exceedance Log</h2>
  ${exceedRows ? `<table><tr><th>Date</th><th>Shift</th><th>System</th><th>Parameter</th><th>Value</th><th>Acceptable</th></tr>${exceedRows}</table>` : '<p class="meta">No out-of-range readings logged this month.</p>'}

  <h2>Live Records</h2>
  <p class="links">
    <a href="${BASE}/hospital-single/${esc(id)}">${esc(hospital.name)} live dashboard →</a>
    <a href="${BASE}/reports">All compliance reports →</a>
    <a href="${BASE}/advisor">AI Chemistry Advisor →</a>
  </p>

  <div class="disc">This report was generated from operator-logged readings in FacilityH2O. Entries are hash-sealed at creation. Final verification should be performed by the responsible facility representative; treatment changes should be confirmed with the water treatment vendor. Links above open the live, access-controlled records.</div>

  ${ai.critique ? `<div class="appendix"><h2>Appendix A — Anonymous Council Peer Review</h2>
    <p class="meta">Independent AI review of the draft executive summary, checked against the computed monthly statistics, prior to synthesis.</p>
    <div class="crit">${esc(ai.critique)}</div></div>` : ''}

  ${autoPrint ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},450)})</script>' : ''}
</body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
