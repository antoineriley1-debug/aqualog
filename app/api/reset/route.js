/**
 * POST /api/password/reset  { token, password }
 * Validates the token (exists, not used, not expired), sets the new password, burns the token.
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { setUserPassword } from '@/lib/store';

const RESET_FILE = path.join(process.cwd(), 'data', 'password-resets.json');
function readResets() { try { return JSON.parse(fs.readFileSync(RESET_FILE, 'utf8')); } catch { return []; } }
function writeResets(d) { try { fs.writeFileSync(RESET_FILE, JSON.stringify(d, null, 2)); } catch {} }

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: 'Token and password required.' }, { status: 400 });
    if (String(password).length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

    const resets = readResets();
    const rec = resets.find((r) => r.token === token);
    if (!rec) return NextResponse.json({ error: 'This reset link is invalid.' }, { status: 400 });
    if (rec.used) return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 });
    if (Date.now() > rec.expires) return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });

    const ok = setUserPassword(rec.userId, password);
    if (!ok) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    rec.used = true;
    rec.usedAt = new Date().toISOString();
    writeResets(resets);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[password/reset] Error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
