/**
 * POST /api/password/request  { email }
 * Generates a one-time reset token, stores it (1-hour expiry), and emails a reset link
 * to the address on file via Resend. Always returns ok (never reveals whether an email exists).
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getUserByEmail } from '@/lib/store';
import { sendEmail } from '@/lib/notify';

const RESET_FILE = path.join(process.cwd(), 'data', 'password-resets.json');
function readResets() { try { return JSON.parse(fs.readFileSync(RESET_FILE, 'utf8')); } catch { return []; } }
function writeResets(d) { try { fs.writeFileSync(RESET_FILE, JSON.stringify(d, null, 2)); } catch {} }

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    const user = getUserByEmail(email);
    // Always behave the same whether or not the user exists (no account enumeration).
    if (user) {
      const token = randomUUID() + randomUUID().replace(/-/g, '');
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      const resets = readResets().filter((r) => r.userId !== user.id); // one active token per user
      resets.push({ token, userId: user.id, email: user.email, expires, used: false, createdAt: new Date().toISOString() });
      writeResets(resets);

      const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://medstarh20log.com').replace(/\/+$/, '');
      const link = `${base}/reset-password?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your FacilityH2O password',
        text: `Hello ${user.name || ''},\n\nWe received a request to reset your FacilityH2O password. Open the link below to choose a new one. It expires in 1 hour.\n\n${link}\n\nIf you didn't request this, you can ignore this email — your password won't change.\n\n— FacilityH2O`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a"><h2 style="color:#0b3d5c">Reset your password</h2><p>Hello ${user.name || ''},</p><p>We received a request to reset your FacilityH2O password. Click below to choose a new one — this link expires in 1 hour.</p><p style="margin:26px 0"><a href="${link}" style="background:#0891b2;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;display:inline-block">Reset Password</a></p><p style="font-size:13px;color:#64748b">If the button doesn't work, paste this into your browser:<br>${link}</p><p style="font-size:13px;color:#64748b">If you didn't request this, ignore this email — your password won't change.</p></div>`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[password/request] Error:', err);
    return NextResponse.json({ ok: true }); // still generic
  }
}
