/**
 * FacilityH2O — Multi-Tenant Self-Signup
 * Creates: org → org-scoped sites/facilities → trial license → admin user → session
 * All data is org-scoped. Nothing bleeds across tenants.
 */
import { NextResponse } from 'next/server';
import {
  getUsers, saveUser, saveOrg, makeId, saveFacility, addLicense,
} from '@/lib/store';

// 14-day trial gets all features at enterprise level
const TRIAL_FEATURES = [
  'boiler','chilled','cooling_tower','domestic','legionella','st108',
  'steam','glycol','softener','ro','fire','wastewater',
  'reports','advisor','compliance','api_access','custom_equipment',
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { orgName, industry, facilityCount, sites, systems, name, email, password } = body;

    if (!orgName || !email || !password || !name) {
      return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    if (!orgName.trim()) {
      return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();

    // Email uniqueness check
    const existing = getUsers().find(
      (u) => (u.email || '').toLowerCase() === emailNorm || (u.username || '').toLowerCase() === emailNorm
    );
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // 1) Organization — fully scoped, no MedStar references
    const org = {
      id: makeId('org'),
      name: orgName.trim(),
      industry: industry || 'other',
      facilityCount: facilityCount || String((sites || []).length || 1),
      active: true,
      systems: systems || [],
      createdAt: new Date().toISOString(),
    };
    saveOrg(org);

    // 2) Create each site provided by user (org-scoped)
    const createdFacilities = [];
    const sitesToCreate = (sites && sites.length > 0)
      ? sites
      : [{ name: org.name + ' — Main Facility', facilityType: 'Other', buildingCount: '1' }];

    for (const site of sitesToCreate) {
      if (!site.name?.trim()) continue;
      const fac = {
        id: makeId('fac'),
        orgId: org.id,
        name: site.name.trim(),
        address: site.address || '',
        city: site.city || '',
        state: site.state || '',
        zip: site.zip || '',
        facilityType: site.facilityType || 'Other',
        buildingCount: site.buildingCount || '1',
        // No hardcoded hospital IDs, codes, or MedStar references
        code: site.name.trim().slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, ''),
        active: true,
        systems: systems || [],
        createdAt: new Date().toISOString(),
      };
      saveFacility(fac);
      createdFacilities.push(fac);
    }

    // 3) 14-day trial license — full enterprise features
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    addLicense({
      orgId: org.id,
      company: org.name,
      contactName: name.trim(),
      contactEmail: emailNorm,
      plan: 'trial',
      status: 'trial',
      seats: 999,
      facilities: createdFacilities.length,
      // Trial gets ALL features regardless of tier
      features: TRIAL_FEATURES,
      monthlyValue: 0,
      renewalDate: trialEnds,
      notes: `Auto-created on self-signup. 14-day trial. Industry: ${org.industry}.`,
    });

    // 4) Admin user — scoped to org, no global hospital assignment
    const user = {
      id: makeId('usr'),
      orgId: org.id,
      username: emailNorm,
      password: password,
      role: 'admin',
      hospital: null,       // not hospital-scoped — org admin sees all org sites
      name: name.trim(),
      email: emailNorm,
      active: true,
      createdAt: new Date().toISOString(),
    };
    saveUser(user);

    // 5) Session cookie — same shape as login route
    const { password: _pw, ...safeUser } = user;
    const res = NextResponse.json({
      ok: true,
      orgId: org.id,
      facilityCount: createdFacilities.length,
    });
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
