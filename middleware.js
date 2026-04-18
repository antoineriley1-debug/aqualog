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
    pathname === '/login' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/reset-password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('FacilityH2O_user');

  if (!cookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const user = JSON.parse(cookie.value);
    if (!user || !user.username) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin-only routes
  const adminOnlyPaths = [
    '/alerts', '/reports', '/users', '/directory', '/compliance', '/audit',
    '/st108/report', '/st108/audit',   // ST108 compliance reports = admin only
    '/coc',                            // Chain of custody = admin only
    '/settings',                       // Owner-only site settings
    '/notifications',                  // Alert rules — admin only
  ];
  // /st108, /legionella = all authenticated users (operators log readings)
  // /st108 (water log entry) is accessible to all authenticated users
  if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
    try {
      const user = JSON.parse(cookie.value);
      if (user.role !== 'admin') {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    } catch {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
