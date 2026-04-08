import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAllEntries, getEntriesForHospital, addEntry, logAudit, addAlert } from '@/lib/store';
import { getOutOfRangeParams, CHEMISTRY_RANGES } from '@/lib/chemistryRanges';
import { detectDrift } from '@/lib/driftDetection';
import { getHospital, getHospitalVendor } from '@/lib/hospitals';
import fs from 'fs';
import path from 'path';

// ── Load notification contacts from rules file ───────────────────────────────
function getNotificationContacts(hospitalId, level) {
  try {
    const rulesFile = path.join(process.cwd(), 'data', 'notification-rules.json');
    if (!fs.existsSync(rulesFile)) return [];
    const rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
    // Hospital-specific first, fall back to global
    const hContacts = rules.hospitals?.[hospitalId]?.levels?.[level]?.contacts || [];
    const gContacts = rules.global?.levels?.[level]?.contacts || [];
    const all = [...hContacts, ...gContacts];
    // Deduplicate by email
    const seen = new Set();
    return all.filter(c => {
      if (!c.email) return false;
      if (seen.has(c.email)) return false;
      seen.add(c.email); return true;
    });
  } catch { return []; }
}

function getEnvEmails() {
  const to = process.env.ALERT_EMAIL_TO || '';
  return to.split(',').map(e => e.trim()).filter(Boolean);
}

// ── Send email via Resend ────────────────────────────────────────────────────
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) return;
  const allTo = Array.isArray(to) ? to : [to];
  if (!allTo.length) return;
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.ALERT_EMAIL_FROM || 'alerts@facilityh2o.com';
    await resend.emails.send({ from, to: allTo, subject, text, html });
  } catch (err) {
    console.warn('[email] Failed:', err.message);
  }
}

// ── Send SMS via Twilio ──────────────────────────────────────────────────────
async function sendSMS(numbers, message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) return;
  if (!numbers?.length) return;
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    for (const num of numbers) {
      if (!num) continue;
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to: num,
      });
    }
  } catch (err) {
    console.warn('[sms] Failed:', err.message);
  }
}

// ── Dispatch OOR alert notifications ────────────────────────────────────────
async function dispatchAlertNotifications({ hospitalId, hospitalName, system, shift, date, operatorName, oor, vendor }) {
  const paramList = oor.map(p => `  • ${p.label}: ${p.value}${p.unit} (range: ${p.min}–${p.max}${p.unit})`).join('\n');
  const vendorLine = vendor ? `\nWater Treatment Vendor: ${vendor.company} | Emergency: ${vendor.emergency || 'N/A'}` : '';

  const subject = `🚨 Out-of-Range Alert — ${hospitalName} | ${system === 'boiler' ? 'Boiler' : 'Chilled'} Water | ${shift}`;
  const text = `OUT-OF-RANGE WATER CHEMISTRY ALERT\n\nFacility: ${hospitalName}\nSystem: ${system === 'boiler' ? 'Boiler Water' : 'Chilled Water'}\nShift: ${shift} | Date: ${date}\nLogged By: ${operatorName}\n\nOUT-OF-RANGE PARAMETERS:\n${paramList}${vendorLine}\n\n— FacilityH2O Alert System`;
  const html = `<div style="font-family:sans-serif;max-width:600px"><div style="background:#c0392b;color:white;padding:16px;border-radius:8px 8px 0 0"><h2 style="margin:0">🚨 Out-of-Range Alert</h2></div><div style="border:1px solid #e0e0e0;border-top:none;padding:20px;border-radius:0 0 8px 8px"><p><strong>Facility:</strong> ${hospitalName}<br><strong>System:</strong> ${system === 'boiler' ? '🔥 Boiler Water' : '❄️ Chilled Water'}<br><strong>Shift:</strong> ${shift} | <strong>Date:</strong> ${date}<br><strong>Logged By:</strong> ${operatorName}</p><h3 style="color:#c0392b">Out-of-Range Parameters:</h3><ul>${oor.map(p => `<li><strong>${p.label}:</strong> ${p.value}${p.unit} <em>(acceptable: ${p.min}–${p.max}${p.unit})</em></li>`).join('')}</ul>${vendor ? `<p style="color:#666;font-size:12px">Vendor: ${vendor.company} | Emergency: ${vendor.emergency || 'N/A'}</p>` : ''}<hr style="border:none;border-top:1px solid #eee;margin:16px 0"><p style="color:#999;font-size:11px">FacilityH2O Alert System</p></div></div>`;

  // Collect all recipients — env var + notification rules (Level 0 = immediate)
  const ruleContacts = getNotificationContacts(hospitalId, 0);
  const envEmails = getEnvEmails();
  const ruleEmails = ruleContacts.map(c => c.email).filter(Boolean);
  const allEmails = [...new Set([...envEmails, ...ruleEmails])];
  const smsNumbers = ruleContacts.map(c => c.sms).filter(Boolean);

  const smsText = `🚨 OOR Alert: ${hospitalName} ${system} ${shift} on ${date}. Params: ${oor.map(p => `${p.label}=${p.value}`).join(', ')}. See portal for details.`;

  await Promise.all([
    allEmails.length ? sendEmail({ to: allEmails, subject, text, html }) : Promise.resolve(),
    smsNumbers.length ? sendSMS(smsNumbers, smsText) : Promise.resolve(),
  ]);
}

// ── Dispatch drift warning notifications ────────────────────────────────────
async function dispatchDriftNotifications({ hospitalId, hospitalName, system, param, drift }) {
  const subject = `⚠️ Trend Warning — ${hospitalName} | ${param} drifting ${drift.direction}`;
  const text = `WATER CHEMISTRY TREND WARNING\n\nFacility: ${hospitalName}\nSystem: ${system === 'boiler' ? 'Boiler Water' : 'Chilled Water'}\nParameter: ${param}\n\nTrend: ${drift.direction.toUpperCase()}\nLast readings: ${drift.trend.join(' → ')}\nCurrent: ${drift.current} | Limit: ${drift.limit}\n\n— FacilityH2O Alert System`;

  const ruleContacts = getNotificationContacts(hospitalId, 1); // Level 1 = trending
  const envEmails = getEnvEmails();
  const ruleEmails = ruleContacts.map(c => c.email).filter(Boolean);
  const allEmails = [...new Set([...envEmails, ...ruleEmails])];
  const smsNumbers = ruleContacts.map(c => c.sms).filter(Boolean);

  const smsText = `⚠️ Trend Warning: ${hospitalName} ${system} ${param} drifting ${drift.direction}. Current: ${drift.current}, limit: ${drift.limit}.`;

  await Promise.all([
    allEmails.length ? sendEmail({ to: allEmails, subject, text }) : Promise.resolve(),
    smsNumbers.length ? sendSMS(smsNumbers, smsText) : Promise.resolve(),
  ]);
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hospitalFilter = searchParams.get('hospital');
  const systemFilter   = searchParams.get('system');
  const shiftFilter    = searchParams.get('shift');
  const fromDate       = searchParams.get('from');
  const toDate         = searchParams.get('to');

  let entries;
  if (user.role === 'admin') {
    entries = hospitalFilter ? getEntriesForHospital(hospitalFilter) : getAllEntries();
  } else {
    entries = getEntriesForHospital(user.hospital);
  }

  if (systemFilter) entries = entries.filter(e => e.system === systemFilter);
  if (shiftFilter)  entries = entries.filter(e => e.shift === shiftFilter);
  if (fromDate)     entries = entries.filter(e => e.date >= fromDate);
  if (toDate)       entries = entries.filter(e => e.date <= toDate);

  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ entries });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { hospitalId, system, shift, date, time, testerName, operatorName, values, notes, correctiveAction } = body;

    if (!hospitalId || !system || !shift || !date || !operatorName || !testerName || !values) {
      return NextResponse.json({ error: 'Missing required fields. Tester name is required.' }, { status: 400 });
    }

    if (user.role === 'operator' && user.hospital !== hospitalId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const entryData = { hospitalId, system, shift, date, time: time || null, testerName, operatorName, values, notes };

    if (correctiveAction?.action) {
      entryData.correctiveAction = {
        taken: true,
        action: correctiveAction.action,
        actionBy: correctiveAction.actionBy || operatorName,
        actionAt: new Date().toISOString(),
        followUpRequired: correctiveAction.followUpRequired || false,
        followUpNotes: correctiveAction.followUpNotes || '',
      };
    }

    const entry = addEntry(entryData);

    logAudit({
      type: 'entry', action: 'create',
      userId: user.id, username: user.username,
      hospitalId, entityId: entry.id, entityType: 'entry',
      detail: `${system} ${shift} shift on ${date}`,
    });

    // ── Out-of-range check ──────────────────────────────────────────────────
    const oor = getOutOfRangeParams(system, values);
    let alert = null;
    if (oor.length > 0) {
      alert = addAlert({ entryId: entry.id, hospitalId, system, shift, date, operatorName, outOfRangeParams: oor });
      const hospital = getHospital(hospitalId);
      const vendor   = getHospitalVendor(hospitalId);
      // Fire-and-forget — don't block the response
      dispatchAlertNotifications({
        hospitalId,
        hospitalName: hospital?.name || hospitalId,
        system, shift, date, operatorName, oor, vendor,
      }).catch(err => console.warn('[notify] OOR dispatch error:', err.message));
    }

    // ── Drift detection ─────────────────────────────────────────────────────
    const driftWarnings = [];
    const allEntries    = getAllEntries();
    const systemRanges  = CHEMISTRY_RANGES[system] || {};
    for (const [param, range] of Object.entries(systemRanges)) {
      const drift = detectDrift(allEntries, hospitalId, system, param, range);
      if (drift) {
        driftWarnings.push(drift);
        const hospital = getHospital(hospitalId);
        dispatchDriftNotifications({
          hospitalId,
          hospitalName: hospital?.name || hospitalId,
          system, param, drift,
        }).catch(err => console.warn('[notify] Drift dispatch error:', err.message));
      }
    }

    const response = { success: true, entry, alert };
    if (driftWarnings.length > 0) response.drift_warnings = driftWarnings;
    return NextResponse.json(response, { status: 201 });

  } catch (err) {
    console.error('POST /api/entries error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
