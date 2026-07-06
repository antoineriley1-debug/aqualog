/**
 * DEBUG: Test email and SMS sending directly
 * This endpoint bypasses entry logic and sends test alerts
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

async function sendEmail({ to, subject, text }) {
  console.log('[DEBUG] sendEmail called with:', { to, subject });
  if (!process.env.RESEND_API_KEY) {
    console.error('[DEBUG] RESEND_API_KEY not set');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }
  console.log('[DEBUG] RESEND_API_KEY is set');
  
  const allTo = Array.isArray(to) ? to : [to];
  if (!allTo.length) {
    console.error('[DEBUG] No email recipients');
    return { ok: false, error: 'No email recipients' };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.ALERT_EMAIL_FROM || 'alerts@medstarh20log.com';
    console.log('[DEBUG] Sending email from:', from, 'to:', allTo);
    
    const result = await resend.emails.send({ from, to: allTo, subject, text });
    console.log('[DEBUG] Email sent:', result);
    return { ok: true, result };
  } catch (err) {
    console.error('[DEBUG] Email error:', err);
    return { ok: false, error: err.message };
  }
}

async function sendSMS(numbers, message) {
  return { ok: false, skipped: true, disabled: true, error: 'SMS retired — email only', recipients: (numbers||[]).filter(Boolean) };
}

export async function GET(request) {
  try {
    // Load notification rules
    const rulesFile = path.join(process.cwd(), 'data', 'notification-rules.json');
    let rules = { global: { levels: { 0: { contacts: [] } } } };
    
    if (fs.existsSync(rulesFile)) {
      rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
    }
    
    const contacts = rules.global?.levels?.[0]?.contacts || [];
    const emails = contacts.map(c => c.email).filter(Boolean);
    const sms = contacts.map(c => c.sms).filter(Boolean);

    console.log('[DEBUG] Loaded contacts:', { emails, sms });

    const emailResult = await sendEmail({
      to: emails.length ? emails : 'antoine.riley.1@gmail.com',
      subject: '⚗ DEBUG TEST ALERT — MedStar H2O',
      text: 'This is a debug test email. If you received this, email alerts are working.',
    });

    const smsResult = await sendSMS(
      sms,
      '⚗ DEBUG TEST: SMS alerts working on medstarh20log.com'
    );

    return NextResponse.json({
      status: 'debug test',
      email: emailResult,
      sms: smsResult,
      env_vars: {
        resend_key_set: !!process.env.RESEND_API_KEY,
        twilio_sid_set: !!process.env.TWILIO_ACCOUNT_SID,
        twilio_token_set: !!process.env.TWILIO_AUTH_TOKEN,
        twilio_from_set: !!process.env.TWILIO_FROM_NUMBER,
        alert_email_to: process.env.ALERT_EMAIL_TO,
      },
      contacts_loaded: { emails, sms },
    });
  } catch (err) {
    console.error('[DEBUG] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
