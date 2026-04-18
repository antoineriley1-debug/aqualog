/**
 * FacilityH2O — FacilityH2O Inc. Water Chemistry Portal
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 * Unauthorized access, copying, or distribution of this code is prohibited.
 */
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/reset-password' ||
    pathname === '/signup' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/legal' ||
    pathname === '/pricing' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/reset-password') ||
    pathname.startsWith('/api/signup') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('FacilityH2O_user');
  const isApi = pathname.startsWith('/api/');

  if (!cookie) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let parsedUser;
  try {
    parsedUser = JSON.parse(cookie.value);
    if (!parsedUser || !parsedUser.username) {
      if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect admin-only page routes
  const adminOnlyPaths = [
    '/alerts', '/reports', '/users', '/directory', '/compliance', '/audit',
    '/st108/report', '/st108/audit',   // ST108 compliance reports = admin only
    '/coc',                            // Chain of custody = admin only
    '/settings',                       // Owner-only site settings
    '/notifications',                  // Alert rules — admin only
  ];

  // Admin-only API routes
  const adminOnlyApiPaths = [
    '/api/test-alert',
    '/api/debug-alert',
    '/api/send-alert',
    '/api/users',
    '/api/notifications',
  ];

  // /st108, /legionella = all authenticated users (operators log readings)
  // /st108 (water log entry) is accessible to all authenticated users
  const isAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p)) ||
                      adminOnlyApiPaths.some((p) => pathname.startsWith(p));

  if (isAdminOnly) {
    if (parsedUser.role !== 'admin') {
      if (isApi) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
