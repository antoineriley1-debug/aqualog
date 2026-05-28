/**
 * MedStar H2O — End-of-Day Report
 * One email per day covering the FULL prior day across all facilities:
 *   1) MISSED readings — which hospital/shift/system had no entry
 *   2) OUT-OF-RANGE readings — hospital/shift/parameter/value/acceptable range
 *
 * Sends through the shared, non-silent notify layer (loud failures, real result).
 * Auth: internal cron secret (?secret=) OR an admin session.
 *
 * Default coverage: YESTERDAY (ET), so a 6:00 AM run captures all 3 shifts
 * of the prior calendar day. Override with ?date=YYYY-MM-DD for testing.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllEntries, getAllAlerts } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';
import { sendEmail, getEnvEmails, getNotifyStatus } from '@/lib/notify';

const SHIFTS = ['1st Shift', '2nd Shift', '3rd Shift'];
const SHIFT_TIMES = {
  '1st Shift': '5:00 AM – 1:30 PM',
  '2nd Shift': '1:00 PM – 9:30 PM',
  '3rd Shift': '9:00 PM – 5:30 AM',
};

function isDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return date.getTimezoneOffset() < stdOffset;
}

function findDirector(hospital) {
  if (!hospital.contacts) return null;
  return hospital.contacts.find(
    (c) => c.title && c.title.toLowerCase().includes('director') && c.name !== 'VACANT'
  ) || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const isInternal = secret === (process.env.CRON_SECRET || 'aqualog_cron_2026');

  if (!isInternal) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Determine the report date (default: yesterday, ET)
  const now = new Date();
  const etOffset = isDST(now) ? -4 : -5;
  const etNow = new Date(now.getTime() + etOffset * 3600000);
  const defaultDate = new Date(etNow.getTime() - 86400000).toISOString().split('T')[0];
  const reportDate = searchParams.get('date') || defaultDate;

  const entries = getAllEntries();
  const alerts = getAllAlerts();

  // ── 1) MISSED readings for the report date ────────────────────────────────
  const missed = [];
  for (const hospital of HOSPITALS) {
    for (const shift of SHIFTS) {
      const boilerLogged = entries.some(
        (e) => e.hospitalId === hospital.id && e.date === reportDate && e.shift === shift && e.system === 'boiler'
      );
      const chilledLogged = entries.some(
        (e) => e.hospitalId === hospital.id && e.date === reportDate && e.shift === shift && e.system === 'chilled'
      );
      if (!boilerLogged || !chilledLogged) {
        const director = findDirector(hospital);
        missed.push({
          hospital: hospital.name,
          code: hospital.code,
          shift,
          missingBoiler: !boilerLogged,
          missingChilled: !chilledLogged,
          director: director ? { name: director.name, email: director.medstarEmail, phone: director.mobile || director.office || null } : null,
        });
      }
    }
  }

  // ── 2) OUT-OF-RANGE readings for the report date ──────────────────────────
  const oorAlerts = alerts.filter((a) => a.date === reportDate && Array.isArray(a.outOfRangeParams) && a.outOfRangeParams.length > 0);
  const outOfRange = oorAlerts.map((a) => {
    const hospital = HOSPITALS.find((h) => h.id === a.hospitalId);
    return {
      hospital: hospital ? hospital.name : a.hospitalId,
      code: hospital ? hospital.code : '',
      system: a.system,
      shift: a.shift,
      operatorName: a.operatorName || '',
      params: a.outOfRangeParams.map((p) => ({
        label: p.label, value: p.value, min: p.min, max: p.max, unit: p.unit, targetZero: p.targetZero,
      })),
    };
  });

  // ── Build the email ───────────────────────────────────────────────────────
  const html = buildHtml(reportDate, missed, outOfRange);
  const text = buildText(reportDate, missed, outOfRange);
  const subject = `📋 MedStar H2O End-of-Day Report — ${reportDate} | ${missed.length} missed, ${outOfRange.length} out-of-range`;

  const recipients = getEnvEmails();
  const emailResult = await sendEmail({ to: recipients, subject, text, html });
  const status = getNotifyStatus();

  return NextResponse.json({
    ok: true,
    date: reportDate,
    missedCount: missed.length,
    outOfRangeCount: outOfRange.length,
    missed,
    outOfRange,
    email: emailResult,
    config: { resend_configured: status.resendConfigured, from: status.from, recipients },
    verdict: emailResult.ok
      ? `End-of-day report emailed to: ${emailResult.recipients?.join(', ')}`
      : `Report did NOT email — ${emailResult.error}. ${!status.resendConfigured ? 'Set RESEND_API_KEY in Render.' : 'Check ALERT_EMAIL_FROM matches a Resend-verified domain.'}`,
  });
}

function buildText(date, missed, oor) {
  let out = `MEDSTAR H2O — END-OF-DAY REPORT\nDate: ${date}\n\n`;
  out += `MISSED READINGS (${missed.length}):\n`;
  if (!missed.length) out += '  None — all shifts logged.\n';
  else missed.forEach((m) => {
    const what = [m.missingBoiler && 'Boiler', m.missingChilled && 'Chilled'].filter(Boolean).join(' & ');
    out += `  • ${m.hospital} [${m.code}] — ${m.shift}: missing ${what}${m.director ? ` (Director: ${m.director.name})` : ''}\n`;
  });
  out += `\nOUT-OF-RANGE READINGS (${oor.length}):\n`;
  if (!oor.length) out += '  None.\n';
  else oor.forEach((o) => {
    out += `  • ${o.hospital} [${o.code}] — ${o.system} ${o.shift} (logged by ${o.operatorName}):\n`;
    o.params.forEach((p) => {
      const range = p.targetZero ? 'target 0' : `${p.min}–${p.max}`;
      out += `      ${p.label}: ${p.value}${p.unit} (acceptable: ${range}${p.unit})\n`;
    });
  });
  out += `\n— MedStar H2O Alert System`;
  return out;
}

function buildHtml(date, missed, oor) {
  const missedRows = missed.length ? missed.map((m) => {
    const what = [m.missingBoiler && '🔥 Boiler', m.missingChilled && '❄️ Chilled'].filter(Boolean).join(', ');
    const dir = m.director ? `${m.director.name}${m.director.email ? `<br/><a href="mailto:${m.director.email}" style="color:#0072CE">${m.director.email}</a>` : ''}` : '<span style="color:#999">—</span>';
    return `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:9px 12px;font-weight:600;color:#111">${m.hospital}</td><td style="padding:9px 12px;color:#444">${m.shift}</td><td style="padding:9px 12px;color:#dc2626;font-weight:600">${what}</td><td style="padding:9px 12px;font-size:13px;color:#444">${dir}</td></tr>`;
  }).join('') : `<tr><td colspan="4" style="padding:14px 12px;color:#16a34a;text-align:center">✅ All shifts logged — no missed readings.</td></tr>`;

  const oorRows = oor.length ? oor.map((o) => {
    const paramLines = o.params.map((p) => {
      const range = p.targetZero ? `target 0${p.unit ? ' ' + p.unit : ''}` : `${p.min}–${p.max}${p.unit ? ' ' + p.unit : ''}`;
      return `<div><strong>${p.label}:</strong> <span style="color:#dc2626;font-weight:600">${p.value}${p.unit}</span> <span style="color:#888;font-size:12px">(ok: ${range})</span></div>`;
    }).join('');
    return `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:9px 12px;font-weight:600;color:#111">${o.hospital}</td><td style="padding:9px 12px;color:#444">${o.system === 'boiler' ? '🔥 Boiler' : '❄️ Chilled'} · ${o.shift}</td><td style="padding:9px 12px;font-size:13px">${paramLines}</td><td style="padding:9px 12px;font-size:13px;color:#444">${o.operatorName || '—'}</td></tr>`;
  }).join('') : `<tr><td colspan="4" style="padding:14px 12px;color:#16a34a;text-align:center">✅ No out-of-range readings.</td></tr>`;

  const th = 'padding:9px 12px;text-align:left;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:0.5px';
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f8f9fa;margin:0;padding:20px">
  <div style="max-width:740px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#003366;padding:20px 28px">
      <div style="color:white;font-size:22px;font-weight:bold">💧 MedStar H2O — End-of-Day Report</div>
      <div style="color:#90c4f0;font-size:13px;margin-top:4px">${date} · MedStar Health · Water Chemistry Portal</div>
    </div>
    <div style="padding:24px 28px">
      <div style="display:flex;gap:12px;margin-bottom:24px">
        <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px">
          <div style="font-size:26px;font-weight:700;color:#dc2626">${missed.length}</div>
          <div style="color:#991b1b;font-size:13px">Missed readings</div>
        </div>
        <div style="flex:1;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px">
          <div style="font-size:26px;font-weight:700;color:#c2410c">${oor.length}</div>
          <div style="color:#9a3412;font-size:13px">Out-of-range readings</div>
        </div>
      </div>

      <h3 style="color:#003366;font-size:15px;margin:0 0 8px">Missed Readings</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:28px">
        <thead><tr style="background:#f1f5f9"><th style="${th}">Hospital</th><th style="${th}">Shift</th><th style="${th}">Missing</th><th style="${th}">Director</th></tr></thead>
        <tbody>${missedRows}</tbody>
      </table>

      <h3 style="color:#003366;font-size:15px;margin:0 0 8px">Out-of-Range Readings</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#f1f5f9"><th style="${th}">Hospital</th><th style="${th}">System · Shift</th><th style="${th}">Parameters</th><th style="${th}">Logged By</th></tr></thead>
        <tbody>${oorRows}</tbody>
      </table>

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">
        MedStar H2O · MedStar Health · Automated end-of-day report
      </div>
    </div>
  </div>
</body></html>`;
}
