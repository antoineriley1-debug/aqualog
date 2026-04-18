/**
 * FacilityH2O — Digest Alerts Cron
 * Sends batched alert summaries for throttled/digest-mode alerts.
 * Call via Vercel cron or external scheduler.
 *
 * Author: Antoine Riley
 * © 2026 FacilityH2O Inc. All rights reserved.
 */

import { NextResponse } from 'next/server';
import { flushDigestAlerts, readRules } from '@/lib/alertThrottle';
import fs from 'fs';
import path from 'path';

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
    console.warn('[digest-email] Failed:', err.message);
  }
}

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
    console.warn('[digest-sms] Failed:', err.message);
  }
}

export async function GET(request) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const pending = flushDigestAlerts();
  if (!pending.length) {
    return NextResponse.json({ ok: true, message: 'No pending digest alerts', count: 0 });
  }

  const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' });

  // Group alerts by contact email
  const byEmail = {};
  const bySms = {};

  for (const alert of pending) {
    const email = alert.contact?.email;
    const sms = alert.contact?.sms;
    if (email) {
      if (!byEmail[email]) byEmail[email] = [];
      byEmail[email].push(alert);
    }
    if (sms) {
      if (!bySms[sms]) bySms[sms] = [];
      bySms[sms].push(alert);
    }
  }

  // Send digest emails
  for (const [email, alerts] of Object.entries(byEmail)) {
    const alertSummary = alerts.map(a => {
      if (a.oor) {
        return `• ${a.hospitalName} — ${a.system} ${a.shift} (${a.date}): ${a.oor.map(p => `${p.label}=${p.value}`).join(', ')}`;
      }
      if (a.drift) {
        return `• ${a.hospitalName} — ${a.system} ${a.param}: drifting ${a.drift.direction}`;
      }
      return `• Alert at ${a.hospitalName || 'unknown'}`;
    }).join('\n');

    const subject = `📋 AquaLog Alert Digest — ${alerts.length} alert${alerts.length > 1 ? 's' : ''} | ${now}`;
    const text = `ALERT DIGEST — AquaLog\n\n${alerts.length} alert(s) since last digest:\n\n${alertSummary}\n\nReview details at your AquaLog portal.\n\n— AquaLog Alert System`;
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0072CE;color:white;padding:16px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">📋 Alert Digest</h2>
          <p style="margin:4px 0 0;opacity:0.8;font-size:13px">${alerts.length} queued alert${alerts.length > 1 ? 's' : ''} · ${now}</p>
        </div>
        <div style="border:1px solid #e0e0e0;border-top:none;padding:20px;border-radius:0 0 8px 8px;background:#fff">
          <ul style="padding-left:16px">${alerts.map(a => {
            if (a.oor) return `<li style="margin-bottom:8px"><strong>${a.hospitalName}</strong> — ${a.system} ${a.shift} (${a.date}): ${a.oor.map(p => `${p.label}=${p.value}`).join(', ')}</li>`;
            if (a.drift) return `<li style="margin-bottom:8px"><strong>${a.hospitalName}</strong> — ${a.system} ${a.param}: drifting ${a.drift.direction}</li>`;
            return `<li style="margin-bottom:8px">Alert at ${a.hospitalName || 'unknown'}</li>`;
          }).join('')}</ul>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p style="color:#999;font-size:11px">AquaLog Alert Digest · Sent ${now}</p>
        </div>
      </div>`;

    await sendEmail({ to: email, subject, text, html });
  }

  // Send digest SMS
  for (const [sms, alerts] of Object.entries(bySms)) {
    const smsText = `📋 AquaLog Digest: ${alerts.length} alert(s). ${alerts.slice(0, 3).map(a => a.hospitalName || 'alert').join(', ')}${alerts.length > 3 ? '...' : ''}. Check portal.`;
    await sendSMS([sms], smsText);
  }

  return NextResponse.json({
    ok: true,
    count: pending.length,
    emailsSent: Object.keys(byEmail).length,
    smsSent: Object.keys(bySms).length,
    timestamp: now,
  });
}
