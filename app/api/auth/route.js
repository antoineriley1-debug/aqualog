/**
 * FacilityH2O — Authentication API
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Every login attempt (success AND failure) is logged to the audit trail
 * with timestamp, IP address, user agent, and outcome.
 */

import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { logAudit } from '@/lib/store';

export async function POST(request) {
  const ip        = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required.' }, { status: 400 });
    }

    const user = validateUser(username, password);

    if (!user) {
      // Log FAILED login attempt — always record these
      logAudit({
        type:      'auth',
        action:    'login_failed',
        userId:    null,
        username:  username,
        detail:    `Failed login attempt for username "${username}"`,
        outcome:   'FAILED',
        ip,
        userAgent,
        timestamp,
      });
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    // Log SUCCESSFUL login
    logAudit({
      type:      'auth',
      action:    'login',
      userId:    user.id,
      username:  user.username,
      detail:    `Successful login — ${user.role} account`,
      outcome:   'SUCCESS',
      role:      user.role,
      ip,
      userAgent,
      timestamp,
    });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('FacilityH2O_user', JSON.stringify(user), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    // Log error during auth
    logAudit({
      type:     'auth',
      action:   'login_error',
      detail:   `Auth error: ${err.message}`,
      outcome:  'ERROR',
      ip,
      userAgent,
      timestamp,
    });
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
