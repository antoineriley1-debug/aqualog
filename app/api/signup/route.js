import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrgs, saveOrg, saveUser, generateId, getFacilities, saveFacility } from '@/lib/store';
import { createSessionToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orgName, industry, facilityCount, name, email, password, plan } = body;

    if (!orgName || !email || !password || !name) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    // Check email uniqueness
    const { getUsers } = await import('@/lib/store');
    const existing = getUsers().find(u => u.email === email || u.username === email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Create org
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const org = {
      id: generateId('org'),
      name: orgName.trim(),
      industry: industry || 'other',
      plan: plan || 'starter',
      trialEnds,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveOrg(org);

    // Create default facility
    const facility = {
      id: generateId('fac'),
      orgId: org.id,
      name: orgName.trim() + ' Main',
      address: '',
      code: 'MAIN',
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveFacility(facility);

    // Create admin user
    const user = {
      id: generateId('usr'),
      orgId: org.id,
      username: email.trim().toLowerCase(),
      password: password, // plain text for prototype
      role: 'admin',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      facilities: null,
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveUser(user);

    // Create session
    const token = createSessionToken(user);
    const cookieStore = cookies();
    cookieStore.set('MedStar H2O_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ ok: true, orgId: org.id });
  } catch (err) {
    console.error('[signup] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
