/**
 * FacilityH2O — Shared Notification Layer (Email)
 * Author & Owner: Antoine W. Riley Sr.
 * © 2026 Antoine W. Riley Sr. / FacilityH2O Inc. All Rights Reserved.
 *
 * WHY THIS FILE EXISTS:
 * Previously every route defined its own sendEmail/sendSMS that returned
 * nothing and swallowed errors with a console.warn. For life-safety alerts a
 * silent failure is the worst possible behavior — no one is warned and no one
 * knows the warning never went out. This module is the single source of truth:
 *   - It RETURNS a structured result ({ ok, error, ... }) so callers can record
 *     and surface delivery status.
 *   - It logs failures LOUDLY (console.error) so they appear in Render logs.
 *   - It uses ONE consistent, env-driven "from" address.
 *
 * Configuration (set these in Render → Environment):
 *   RESEND_API_KEY      (required for email to send at all)
 *   ALERT_EMAIL_FROM    (must match a domain you've VERIFIED in Resend)
 *   ALERT_EMAIL_TO      (comma-separated fallback recipients)
 *   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER (optional, SMS)
 */

// Single consistent fallback. Override with ALERT_EMAIL_FROM in production.
// NOTE: this domain must be VERIFIED in your Resend account or sends are rejected.
const DEFAULT_FROM = 'alerts@medstarh20log.com';

export function getFromAddress() {
  const from = (process.env.ALERT_EMAIL_FROM || '').trim();
  return from || DEFAULT_FROM;
}

export function getEnvEmails() {
  return (process.env.ALERT_EMAIL_TO || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Report exactly what is and isn't configured. Used by diagnostics so you can
 * see at a glance whether alerts can possibly fire.
 */
export function getNotifyStatus() {
  return {
    resendConfigured: !!process.env.RESEND_API_KEY,
    twilioConfigured: false, // SMS channel retired — carrier 10DLC never cleared; email is the alert channel
    from: getFromAddress(),
    envRecipients: getEnvEmails(),
  };
}

/**
 * Send an email via Resend.
 * @returns {Promise<{ok:boolean, skipped?:boolean, error?:string, recipients?:string[], messageId?:string}>}
 */
export async function sendEmail({ to, subject, text, html }) {
  const allTo = (Array.isArray(to) ? to : [to]).filter(Boolean);

  if (!process.env.RESEND_API_KEY) {
    console.error('[notify:email] BLOCKED — RESEND_API_KEY is not set. No email sent for:', subject);
    return { ok: false, skipped: true, error: 'RESEND_API_KEY not set', recipients: allTo };
  }
  if (!allTo.length) {
    console.error('[notify:email] BLOCKED — no recipients configured for:', subject);
    return { ok: false, skipped: true, error: 'No recipients', recipients: [] };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = getFromAddress();
    const result = await resend.emails.send({ from, to: allTo, subject, text, html });

    // Resend returns { data, error } in v3 — surface a rejection even on a 200.
    if (result?.error) {
      console.error('[notify:email] REJECTED by Resend:', result.error?.message || result.error, '| from:', from, '| to:', allTo.join(', '));
      return { ok: false, error: result.error?.message || String(result.error), recipients: allTo, from };
    }

    const messageId = result?.data?.id || result?.id;
    return { ok: true, recipients: allTo, messageId, from };
  } catch (err) {
    console.error('[notify:email] FAILED to send:', err.message, '| to:', allTo.join(', '));
    return { ok: false, error: err.message, recipients: allTo };
  }
}

/**
 * Send SMS via Twilio.
 * @returns {Promise<{ok:boolean, skipped?:boolean, error?:string, recipients?:string[]}>}
 */
export async function sendSMS(numbers, message) {
  // SMS channel retired (July 2026): Twilio 10DLC approval never cleared, so SMS
  // never actually delivered. The channel is permanently disabled rather than
  // half-working. Every caller keeps functioning — this stub reports the channel
  // as skipped, and email carries all alerting. One less third-party holding data.
  const nums = (numbers || []).filter(Boolean);
  return { ok: false, skipped: true, disabled: true, error: 'SMS is not offered — email alerts only', recipients: nums };
}
