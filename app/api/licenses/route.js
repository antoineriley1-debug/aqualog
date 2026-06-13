/**
 * FacilityH2O — Licensing / Client Subscriptions API (admin only)
 * Tracks what each licensed company gets and whether they're active.
 * No payment processing — billing fields are informational placeholders.
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest, SUPER_ADMIN_ID } from '@/lib/auth';
import { getLicenses, addLicense, updateLicense, deleteLicense, logAudit } from '@/lib/store';

async function gate(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.id !== SUPER_ADMIN_ID) return null; // owner-only console
  return user;
}

export async function GET(request) {
  const user = await gate(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ licenses: getLicenses() });
}

export async function POST(request) {
  const user = await gate(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  if (!body.company) return NextResponse.json({ error: 'Company name required.' }, { status: 400 });
  const lic = addLicense(body);
  logAudit({ type: 'license', action: 'create', userId: user.id, username: user.username,
    detail: `Created license for ${lic.company} (${lic.plan}, ${lic.status})`, outcome: 'SUCCESS', timestamp: new Date().toISOString() });
  return NextResponse.json({ license: lic });
}

export async function PATCH(request) {
  const user = await gate(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'License id required.' }, { status: 400 });
  const lic = updateLicense(body.id, body);
  if (!lic) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  logAudit({ type: 'license', action: 'update', userId: user.id, username: user.username,
    detail: `Updated license ${body.id} → status ${lic.status}`, outcome: 'SUCCESS', timestamp: new Date().toISOString() });
  return NextResponse.json({ license: lic });
}

export async function DELETE(request) {
  const user = await gate(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });
  const ok = deleteLicense(id);
  logAudit({ type: 'license', action: 'delete', userId: user.id, username: user.username,
    detail: `Deleted license ${id}`, outcome: ok ? 'SUCCESS' : 'FAILED', timestamp: new Date().toISOString() });
  return NextResponse.json({ success: ok });
}
