/**
 * Send test alert via email + SMS
 * ADMIN ONLY
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

async function sendEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'No RESEND_API_KEY' };
  const allTo = Array.isArray(to) ? to : [to];
  if (!allTo.length) return { ok: false, error: 'No recipients' };
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.ALERT_EMAIL_FROM || 'alerts@facilityh2o.com';
    const result = await resend.emails.send({ from, to: allTo, subject, text });
    return { ok: true, messageId: result?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendSMS(numbers, message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    return { ok: false, error: 'Twilio not configured' };
  }
  if (!numbers?.length) return { ok: false, error: 'No numbers' };
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
    return { ok: true, sent };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function GET(request) {
  // Require admin auth
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Load contacts
    const rulesFile = path.join(process.cwd(), 'data', 'notification-rules.json');
    let contacts = { emails: [], sms: [] };
    if (fs.existsSync(rulesFile)) {
      const rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
      const c = rules.global?.levels?.[0]?.contacts || [];
      contacts.emails = c.map(x => x.email).filter(Boolean);
      contacts.sms = c.map(x => x.sms).filter(Boolean);
    }

    const allEmails = [...(process.env.ALERT_EMAIL_TO?.split(',') || []), ...contacts.emails].filter(Boolean);

    const emailResult = await sendEmail({
      to: allEmails,
      subject: '🧪 Test Alert — AquaLog',
      text: 'This is a test alert. If you received this, email alerts are working!',
    });

    const smsResult = await sendSMS(
      contacts.sms,
      '🧪 SMS Test from medstarh20log.com — alerts working!'
    );

    return NextResponse.json({
      status: 'test alert sent',
      email: { ok: emailResult.ok },
      sms: { ok: smsResult.ok },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
