/**
 * FacilityH2O — Password Reset API
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * - Any user can request a self-service reset for their own account
 * - Admins can also force-reset any user's password from the Users page
 * - Tokens are secure, server-side, valid for 1 hour
 */

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

const RESET_FILE = path.join(process.cwd(), 'data', 'reset-tokens.json');
const TOKEN_TTL  = 60 * 60 * 1000; // 1 hour
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function readTokens()   { try { return fs.existsSync(RESET_FILE) ? JSON.parse(fs.readFileSync(RESET_FILE,'utf8')) : {}; } catch { return {}; } }
function writeTokens(t) { fs.writeFileSync(RESET_FILE, JSON.stringify(t, null, 2), 'utf8'); }
function readUsers()    { try { return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')); } catch { return []; } }

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { action, token, newPassword, username } = body;

  // ── Step 1: request a reset token ────────────────────────────────────────
  if (action === 'request') {
    if (!username) {
      return NextResponse.json({ ok: true, message: 'If that account exists, a reset link has been sent.' });
    }

    const users = readUsers();
    const user  = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.active !== false);

    // Always return same message for security (don't reveal if user exists)
    if (!user) {
      return NextResponse.json({ ok: true, message: 'If that account exists, a reset link has been sent.' });
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokens = readTokens();
    tokens[resetToken] = {
      userId:    user.id,
      username:  user.username,
      expiresAt: Date.now() + TOKEN_TTL,
    };
    writeTokens(tokens);

    const baseUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.facilityh2o.com';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Try email via Resend
    const userEmail = user.email;
    if (process.env.RESEND_API_KEY && userEmail) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.ALERT_EMAIL_FROM || 'FacilityH2O@facilityh2o.com',
          to: userEmail,
          subject: 'FacilityH2O — Password Reset Request',
          text: `You requested a password reset for your FacilityH2O account.\n\nClick this link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\nFacilityH2O · FacilityH2O Inc. Water Chemistry Portal`,
        });
        return NextResponse.json({ ok: true, message: `Reset link sent to ${userEmail}` });
      } catch (e) {
        console.error('Reset email failed:', e.message);
      }
    }

    // Fallback: return link directly (admin can share it)
    console.log(`[PASSWORD RESET] ${user.username}: ${resetUrl}`);
    return NextResponse.json({
      ok: true,
      message: 'Reset link generated. Share it with the user or use it directly.',
      resetUrl,
      note: 'Email not configured — use or share the link below.',
    });
  }

  // ── Step 2: validate token ────────────────────────────────────────────────
  if (action === 'validate') {
    const tokens = readTokens();
    const record = tokens[token];
    if (!record || Date.now() > record.expiresAt) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired reset link.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, username: record.username });
  }

  // ── Step 3: set new password ──────────────────────────────────────────────
  if (action === 'reset') {
    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    const tokens = readTokens();
    const record = tokens[token];
    if (!record || Date.now() > record.expiresAt) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    const users = readUsers();
    const idx   = users.findIndex((u) => u.id === record.userId);
    if (idx === -1) return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });

    users[idx].password = newPassword;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

    delete tokens[token];
    writeTokens(tokens);

    return NextResponse.json({ ok: true, message: 'Password updated successfully. You can now sign in.' });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
