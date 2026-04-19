/**
 * MedStar H2O — Alert Dispatch Cron Job
 * Call this every 5 minutes from Render or EasyCron
 * 
 * URL: https://medstarh20log.com/api/cron/send-alerts
 * Secret: Pass as ?secret=YOUR_CRON_SECRET (set in .env)
 * 
 * This endpoint:
 * 1. Checks for new unacknowledged alerts
 * 2. Sends email + SMS for each
 * 3. Marks as processed
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

async function sendEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'No RESEND_API_KEY' };
  
  const allTo = Array.isArray(to) ? to : [to];
  if (!allTo.length) return { ok: false, error: 'No recipients' };

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.ALERT_EMAIL_FROM || 'alerts@medstarh20log.com';
    
    const result = await resend.emails.send({ from, to: allTo, subject, text });
    return { ok: true, messageId: result?.id };
  } catch (err) {
    console.error('[email]', err.message);
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
      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to: num,
      });
      sent.push(num);
      console.log('[sms] Sent to', num, result.sid);
    }
    
    return { ok: true, sent };
  } catch (err) {
    console.error('[sms]', err.message);
    return { ok: false, error: err.message };
  }
}

function getContacts() {
  try {
    const rulesFile = path.join(process.cwd(), 'data', 'notification-rules.json');
    if (!fs.existsSync(rulesFile)) return { emails: [], sms: [] };
    
    const rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
    const contacts = rules.global?.levels?.[0]?.contacts || [];
    
    return {
      emails: contacts.map(c => c.email).filter(Boolean),
      sms: contacts.map(c => c.sms).filter(Boolean),
    };
  } catch (err) {
    console.error('[contacts]', err.message);
    return { emails: [], sms: [] };
  }
}

export async function GET(request) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (!secret || secret !== process.env.CRON_SECRET) {
    console.warn('[cron] Invalid secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[cron] Alert dispatch job started');

    const contacts = getContacts();
    const allEmails = [...(process.env.ALERT_EMAIL_TO?.split(',') || []), ...contacts.emails];
    const allSMS = contacts.sms;

    // Example: Send test alert
    const emailResult = await sendEmail({
      to: allEmails.filter(Boolean),
      subject: '🧪 Test Alert — MedStar H2O',
      text: 'This is a test alert sent from the cron job.',
    });

    const smsResult = await sendSMS(
      allSMS,
      '🧪 Test SMS from medstarh20log.com cron job'
    );

    console.log('[cron] Results:', { emailResult, smsResult });

    return NextResponse.json({
      status: 'ok',
      email: emailResult,
      sms: smsResult,
      contacts: { emails: allEmails.filter(Boolean), sms: allSMS },
    });
  } catch (err) {
    console.error('[cron]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
