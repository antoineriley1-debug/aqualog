import { NextResponse } from 'next/server';
import { getUserFromRequest, getUserFromCookie } from '@/lib/auth';
import { logAudit } from '@/lib/store';

export async function POST(request) {
  try {
    const cookieHeader = request.headers?.get?.('cookie') || '';
    const match = cookieHeader.match(/FacilityH2O_user=([^;]+)/);
    const user = match ? getUserFromCookie(decodeURIComponent(match[1])) : null;

    if (user) {
      logAudit({
        type: 'auth',
        action: 'logout',
        userId: user.id,
        username: user.username,
        detail: 'User logged out',
      });
    }
  } catch {
    // Best effort audit — don't block logout
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('FacilityH2O_user', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
  });
  return response;
}
