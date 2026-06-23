import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAllEntries, getEntriesForHospital, addEntry, logAudit, addAlert, updateAlertNotification, getEquipmentProfile } from '@/lib/store';
import { sendEmail, sendSMS, getEnvEmails } from '@/lib/notify';
import { getOutOfRangeParams, CHEMISTRY_RANGES } from '@/lib/chemistryRanges';
import { detectDrift } from '@/lib/driftDetection';
import { getHospital, getHospitalVendor } from '@/lib/hospitals';
import { SYSTEM_META } from '@/lib/systemFields';
import { BRAND } from '@/lib/branding';
import fs from 'fs';
import path from 'path';
import {
  shouldSendAlert,
  recordAlertSent,
  queueDigestAlert,
  determineLevel,
  getContactsForLevel,
  isInQuietHours,
  readRules,
} from '@/lib/alertThrottle';

// ── Enterprise custom-equipment ranges ───────────────────────────────────────
// Built-in systems live in CHEMISTRY_RANGES. Custom equipment (steam sterilizers,
// dialysis water, etc.) stores its own params on the facility's equipment profile.
// These helpers let out-of-range alerting + drift detection work for custom equipment too.
function customRangesFor(hospitalId, system) {
  if (CHEMISTRY_RANGES[system]) return {};            // built-in → handled by CHEMISTRY_RANGES
  try {
    const profile = getEquipmentProfile(hospitalId);
    const custom = Array.isArray(profile?.custom) ? profile.custom : [];
    const item = custom.find(c => (typeof c === 'string' ? c : c?.key) === system);
    if (!item || !Array.isArray(item.params)) return {};
    const ranges = {};
    for (const pr of item.params) {
      ranges[pr.key] = { min: pr.min, max: pr.max, unit: pr.unit, label: pr.label, targetZero: (pr.min === 0 && pr.max === 0) };
    }
    return ranges;
  } catch { return {}; }
}
function oorFromRanges(ranges, values) {
  const oor = [];
  for (const [key, range] of Object.entries(ranges)) {
    const val = values[key];
    if (val === undefined || val === null || val === '') continue;
    const num = parseFloat(val);
    if (isNaN(num)) continue;
    const out = range.targetZero ? num !== 0 : (num < range.min || num > range.max);
    if (out) oor.push({ param: key, label: range.label, value: num, min: range.min, max: range.max, unit: range.unit, targetZero: !!range.targetZero });
  }
  return oor;
}

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

// Email/SMS senders + getEnvEmails now come from '@/lib/notify' (imported above).
// They RETURN delivery results and log failures loudly, instead of swallowing them.

// ── Dispatch OOR alert notifications (with smart throttle/quiet hours) ──────
async function dispatchAlertNotifications({ alertId, hospitalId, hospitalName, system, unit, shift, date, operatorName, oor, vendor }) {
  const alertLevel = determineLevel('oor', oor);
  const sysLabel = SYSTEM_META[system]?.label || system;
  const sysIcon = SYSTEM_META[system]?.icon || '';
  const unitLabel = unit ? ` — ${unit}` : '';

  const paramList = oor.map(p => `  • ${p.label}: ${p.value}${p.unit} (range: ${p.min}–${p.max}${p.unit})`).join('\n');
  const vendorLine = vendor ? `\nWater Treatment Vendor: ${vendor.company} | Emergency: ${vendor.emergency || 'N/A'}` : '';

  const subject = `🚨 Out-of-Range Alert — ${hospitalName} | ${sysLabel}${unitLabel} | ${shift}`;
  const text = `OUT-OF-RANGE WATER CHEMISTRY ALERT\n\nFacility: ${hospitalName}\nSystem: ${sysLabel}${unitLabel}\nShift: ${shift} | Date: ${date}\nLogged By: ${operatorName}\n\nOUT-OF-RANGE PARAMETERS:\n${paramList}${vendorLine}\n\n— ${BRAND.name} Alert System`;
  const html = `<div style="font-family:sans-serif;max-width:600px"><div style="background:#c0392b;color:white;padding:16px;border-radius:8px 8px 0 0"><h2 style="margin:0">🚨 Out-of-Range Alert</h2></div><div style="border:1px solid #e0e0e0;border-top:none;padding:20px;border-radius:0 0 8px 8px"><p><strong>Facility:</strong> ${hospitalName}<br><strong>System:</strong> ${sysIcon} ${sysLabel}${unitLabel}<br><strong>Shift:</strong> ${shift} | <strong>Date:</strong> ${date}<br><strong>Logged By:</strong> ${operatorName}</p><h3 style="color:#c0392b">Out-of-Range Parameters:</h3><ul>${oor.map(p => `<li><strong>${p.label}:</strong> ${p.value}${p.unit} <em>(acceptable: ${p.min}–${p.max}${p.unit})</em></li>`).join('')}</ul>${vendor ? `<p style="color:#666;font-size:12px">Vendor: ${vendor.company} | Emergency: ${vendor.emergency || 'N/A'}</p>` : ''}<hr style="border:none;border-top:1px solid #eee;margin:16px 0"><p style="color:#999;font-size:11px">${BRAND.name} Alert System</p></div></div>`;
  const smsText = `🚨 OOR Alert: ${hospitalName} ${sysLabel}${unitLabel} ${shift} on ${date}. Params: ${oor.map(p => `${p.label}=${p.value}`).join(', ')}. See portal for details.`;

  // Track every delivery so a swallowed failure becomes visible on the alert.
  const emailSent = new Set();
  const smsSent = new Set();
  const errors = [];
  let attemptedEmail = false;
  let attemptedSms = false;

  // Use smart dispatch per contact
  const contacts = getContactsForLevel(hospitalId, alertLevel);
  const envEmails = getEnvEmails();

  // For env-configured emails, always send (durable fallback recipients)
  if (envEmails.length) {
    attemptedEmail = true;
    const r = await sendEmail({ to: envEmails, subject, text, html });
    if (r.ok) (r.recipients || []).forEach(e => emailSent.add(e));
    else if (!r.skipped || r.error !== 'No recipients') errors.push(`email(env): ${r.error}`);
  }

  for (const contact of contacts) {
    const decision = shouldSendAlert({
      hospitalId, system, level: alertLevel,
      contactEmail: contact.email, contactSms: contact.sms,
    });

    const alertData = { hospitalId, hospitalName, system, shift, date, operatorName, oor, level: alertLevel, contact, subject, text, html, smsText };

    if (decision.sendEmail && contact.email) {
      attemptedEmail = true;
      const r = await sendEmail({ to: contact.email, subject, text, html });
      if (r.ok) emailSent.add(contact.email);
      else errors.push(`email(${contact.email}): ${r.error}`);
    }
    if (decision.sendSms && contact.sms) {
      attemptedSms = true;
      const r = await sendSMS([contact.sms], smsText);
      if (r.ok) smsSent.add(contact.sms);
      else errors.push(`sms(${contact.sms}): ${r.error}`);
    }

    // Record sent timestamps for throttle tracking
    if (decision.sendEmail || decision.sendSms) {
      recordAlertSent({ hospitalId, system, level: alertLevel, contactEmail: contact.email, contactSms: contact.sms });
    }

    // Queue for digest if throttled/suppressed
    if (decision.queueForDigest) {
      queueDigestAlert(alertData);
    }
  }

  const emailResult = { ok: emailSent.size > 0, sent: [...emailSent], attempted: attemptedEmail };
  const smsResult = { ok: smsSent.size > 0, sent: [...smsSent], attempted: attemptedSms };
  const deliveredSomewhere = emailResult.ok || smsResult.ok;

  // Persist delivery outcome onto the alert record (visible in API/dashboard).
  if (alertId) {
    updateAlertNotification(alertId, { email: emailResult, sms: smsResult, errors });
  }

  // LIFE-SAFETY: a real out-of-range alert that reached NO ONE must be loud.
  if (!deliveredSomewhere) {
    console.error(
      `[notify] CRITICAL — OOR alert for ${hospitalName} (${system}/${shift}/${date}) was NOT delivered to anyone.`,
      `Contacts found: ${contacts.length}, env recipients: ${envEmails.length}.`,
      errors.length ? `Errors: ${errors.join(' | ')}` : 'No recipients configured and/or RESEND_API_KEY unset.'
    );
  }

  return { emailResult, smsResult, errors, deliveredSomewhere };
}

// ── Dispatch drift warning notifications (with smart throttle) ──────────────
async function dispatchDriftNotifications({ hospitalId, hospitalName, system, param, drift }) {
  const alertLevel = 2; // Drift = Info level

  const subject = `⚠️ Trend Warning — ${hospitalName} | ${param} drifting ${drift.direction}`;
  const text = `WATER CHEMISTRY TREND WARNING\n\nFacility: ${hospitalName}\nSystem: ${SYSTEM_META[system]?.label || system}\nParameter: ${param}\n\nTrend: ${drift.direction.toUpperCase()}\nLast readings: ${drift.trend.join(' → ')}\nCurrent: ${drift.current} | Limit: ${drift.limit}\n\n— ${BRAND.name} Alert System`;
  const smsText = `⚠️ Trend Warning: ${hospitalName} ${system} ${param} drifting ${drift.direction}. Current: ${drift.current}, limit: ${drift.limit}.`;

  const contacts = getContactsForLevel(hospitalId, alertLevel);
  const envEmails = getEnvEmails();

  if (envEmails.length) {
    await sendEmail({ to: envEmails, subject, text });
  }

  for (const contact of contacts) {
    const decision = shouldSendAlert({
      hospitalId, system, level: alertLevel,
      contactEmail: contact.email, contactSms: contact.sms,
    });

    if (decision.sendEmail && contact.email) {
      await sendEmail({ to: contact.email, subject, text });
    }
    if (decision.sendSms && contact.sms) {
      await sendSMS([contact.sms], smsText);
    }

    if (decision.sendEmail || decision.sendSms) {
      recordAlertSent({ hospitalId, system, level: alertLevel, contactEmail: contact.email, contactSms: contact.sms });
    }

    if (decision.queueForDigest) {
      queueDigestAlert({ hospitalId, hospitalName, system, param, drift, level: alertLevel, contact, subject, text, smsText });
    }
  }
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
    const { hospitalId, system, unit, shift, date, time, testerName, operatorName, values, notes, correctiveAction } = body;

    if (!hospitalId || !system || !shift || !date || !operatorName || !testerName || !values) {
      return NextResponse.json({ error: 'Missing required fields. Tester name is required.' }, { status: 400 });
    }

    if (user.role === 'operator' && user.hospital !== hospitalId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const entryData = { hospitalId, system, unit: unit || null, shift, date, time: time || null, testerName, operatorName, values, notes };

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
    // Built-in systems use CHEMISTRY_RANGES; Enterprise custom equipment uses its stored param ranges.
    const customRanges = customRangesFor(hospitalId, system);
    const oor = CHEMISTRY_RANGES[system]
      ? getOutOfRangeParams(system, values)
      : oorFromRanges(customRanges, values);
    let alert = null;
    if (oor.length > 0) {
      alert = addAlert({ entryId: entry.id, hospitalId, system, unit: unit || null, shift, date, operatorName, outOfRangeParams: oor });
      const hospital = getHospital(hospitalId);
      const vendor   = getHospitalVendor(hospitalId);
      // Fire-and-forget — don't block the response
      dispatchAlertNotifications({
        alertId: alert.id,
        hospitalId,
        hospitalName: hospital?.name || hospitalId,
        system, unit, shift, date, operatorName, oor, vendor,
      }).catch(err => console.error('[notify] OOR dispatch error:', err.message));
    }

    // ── Drift detection ─────────────────────────────────────────────────────
    const driftWarnings = [];
    const allEntries    = getAllEntries();
    const systemRanges  = CHEMISTRY_RANGES[system] || customRanges;
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
