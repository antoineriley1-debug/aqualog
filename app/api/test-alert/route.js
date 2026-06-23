/**
 * FacilityH2O — Test Alert API
 * Admin-only. Fires a real test email + SMS to verify notification delivery.
 * Author: Antoine Riley
 */

import { NextResponse } from 'next/server';
import { getUserFromRequest, SUPER_ADMIN_ID } from '@/lib/auth';
import { logAudit } from '@/lib/store';
import fs from 'fs';
import path from 'path';
import { BRAND } from '@/lib/branding';

function getNotificationContacts(hospitalId, level) {
  try {
    const rulesFile = path.join(process.cwd(), 'data', 'notification-rules.json');
    if (!fs.existsSync(rulesFile)) return [];
    const rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
    const hContacts = rules.hospitals?.[hospitalId]?.levels?.[level]?.contacts || [];
    const gContacts = rules.global?.levels?.[level]?.contacts || [];
    const all = [...hContacts, ...gContacts];
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

async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }
  const allTo = Array.isArray(to) ? to : [to];
  if (!allTo.length) return { ok: false, error: 'No email recipients configured' };
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.ALERT_EMAIL_FROM || BRAND.fromEmail;
    const result = await resend.emails.send({ from, to: allTo, subject, text, html });
    return { ok: true, recipients: allTo, messageId: result?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendSMS(numbers, message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    return { ok: false, error: 'Twilio not configured (TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM_NUMBER missing)' };
  }
  if (!numbers?.length) return { ok: false, error: 'No SMS numbers configured' };
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const sent = [];
    for (const num of numbers) {
      if (!num) continue;
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to: num,
      });
      sent.push(num);
    }
    return { ok: true, recipients: sent };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 });
  }

  const now = new Date();
  const ts = now.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' });

  // Collect email recipients
  const envEmails = getEnvEmails();
  const ruleContacts = getNotificationContacts('*', 0);
  const ruleEmails = ruleContacts.map(c => c.email).filter(Boolean);
  const allEmails = [...new Set([...envEmails, ...ruleEmails])];

  // Collect SMS numbers from rule contacts
  const smsNumbers = ruleContacts.map(c => c.sms).filter(Boolean);

  const subject = `✓ TEST ALERT — ${BRAND.name} Notification System | ${ts}`;
  const text = `TEST ALERT — ${BRAND.name}\n\nThis is a test notification triggered by ${user.name} (${user.username}) to verify the alert system is working correctly.\n\nTimestamp: ${ts}\nTriggered by: ${user.name}\nRole: ${user.role}\n\nIf you received this message, email alerts are working correctly.\n\n— ${BRAND.name} Alert System`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0072CE;color:white;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">✓ TEST ALERT — ${BRAND.name}</h2>
        <p style="margin:6px 0 0;opacity:0.8;font-size:14px">Notification system verification</p>
      </div>
      <div style="border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff">
        <p style="color:#003366;font-size:16px">This is a <strong>test notification</strong> triggered to verify the alert delivery system is working correctly.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#F0F9FF"><td style="padding:8px 12px;font-weight:bold;color:#003366;width:40%">Triggered By</td><td style="padding:8px 12px">${user.name} (${user.username})</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#003366">Timestamp</td><td style="padding:8px 12px">${ts}</td></tr>
          <tr style="background:#F0F9FF"><td style="padding:8px 12px;font-weight:bold;color:#003366">System</td><td style="padding:8px 12px">${BRAND.name} Alert System</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#003366">Status</td><td style="padding:8px 12px"><span style="color:#00C85A;font-weight:bold">✓ DELIVERY CONFIRMED</span></td></tr>
        </table>
        <p style="color:#666;font-size:13px">If you received this email, your notification system is configured correctly. No action required.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
        <p style="color:#999;font-size:11px">${BRAND.name} · Triggered by ${user.name}</p>
      </div>
    </div>`;

  const smsText = `TEST ALERT - ${BRAND.name}\nTriggered by ${user.name} at ${ts}.\nIf you received this, SMS alerts are working. No action needed.`;

  // Fire both in parallel
  const [emailResult, smsResult] = await Promise.all([
    sendEmail({ to: allEmails, subject, text, html }),
    sendSMS(smsNumbers, smsText),
  ]);

  // Log to audit trail
  logAudit({
    type: 'system',
    action: 'test_alert',
    userId: user.id,
    username: user.username,
    detail: `Test alert fired. Email: ${emailResult.ok ? 'sent to ' + (emailResult.recipients?.join(', ') || 'none') : 'FAILED: ' + emailResult.error}. SMS: ${smsResult.ok ? 'sent to ' + (smsResult.recipients?.join(', ') || 'none') : 'FAILED: ' + smsResult.error}`,
    outcome: (emailResult.ok || smsResult.ok) ? 'SUCCESS' : 'FAILED',
  });

  return NextResponse.json({
    success: true,
    email: emailResult,
    sms: smsResult,
    emailRecipients: allEmails,
    smsRecipients: smsNumbers,
    timestamp: ts,
  });
}
