/**
 * FacilityH2O — Self-Signup
 * Creates an organization, an auto-TRIAL license for it, a default facility,
 * and the company's admin user — all linked by orgId. The admin is then logged in.
 * Built on the real auth store (users.json) the login system reads.
 */
import { NextResponse } from 'next/server';
import {
  getUsers, saveUser, saveOrg, makeId, saveFacility, addLicense, getOrgs,
} from '@/lib/store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orgName, industry, facilityCount, name, email, password } = body;

    if (!orgName || !email || !password || !name) {
      return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    // Email/username uniqueness
    const existing = getUsers().find(
      (u) => (u.email || '').toLowerCase() === emailNorm || (u.username || '').toLowerCase() === emailNorm
    );
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // 1) Organization
    const org = {
      id: makeId('org'),
      name: orgName.trim(),
      industry: industry || 'other',
      facilityCount: facilityCount || '1',
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveOrg(org);

    // 2) Auto-TRIAL license tied to this org (14-day trial)
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    addLicense({
      orgId: org.id,
      company: org.name,
      contactName: name.trim(),
      contactEmail: emailNorm,
      plan: 'trial',
      status: 'trial',
      seats: 5,
      facilities: 1,
      features: ['boiler', 'chilled', 'reports', 'advisor'],
      monthlyValue: 0,
      renewalDate: trialEnds,
      notes: 'Auto-created on self-signup. 14-day trial.',
    });

    // 3) Default facility for the org
    saveFacility({
      id: makeId('fac'),
      orgId: org.id,
      name: org.name + ' — Main',
      code: 'MAIN',
      active: true,
      createdAt: new Date().toISOString(),
    });

    // 4) Company admin user — linked to org, lives in users.json so login finds it
    const user = {
      id: makeId('usr'),
      orgId: org.id,
      username: emailNorm,
      password: password, // matches existing plaintext-compare login (rotate to hashing later)
      role: 'admin',
      hospital: null,
      name: name.trim(),
      email: emailNorm,
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveUser(user);

    // 5) Log them in with the SAME cookie the login route sets
    const { password: _pw, ...safeUser } = user;
    const res = NextResponse.json({ ok: true, orgId: org.id });
    res.cookies.set('FacilityH2O_user', JSON.stringify(safeUser), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    return res;
  } catch (err) {
    console.error('[signup] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
