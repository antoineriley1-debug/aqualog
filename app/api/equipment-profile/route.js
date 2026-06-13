/**
 * Equipment Profile API
 * GET  → { facilities:[{id,name,code,orgId,canEdit, profile}], systems:[{key,label,icon}] }
 * POST → { facilityId, profile } saves which built-in systems a facility has (permission enforced).
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getEquipmentProfile, saveEquipmentProfile, canEditFacility, getFacilities, BUILTIN_SYSTEM_KEYS } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';
import { SYSTEM_META } from '@/lib/systemFields';

function facilitiesForUser(user) {
  const isOwner = user.username === 'ariley' || user.id === 'usr_ariley';
  const legacy = HOSPITALS.map(h => ({ id: h.id, name: h.name, code: h.code, orgId: null }));
  const orgFacs = (getFacilities() || []).map(f => ({ id: f.id, name: f.name, code: f.code || '', orgId: f.orgId || null }));
  if (isOwner) return [...legacy, ...orgFacs];
  if (!user.orgId) return legacy;
  return orgFacs.filter(f => f.orgId === user.orgId);
}

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const facs = facilitiesForUser(user).map(f => ({
    ...f, canEdit: canEditFacility(user, f), profile: getEquipmentProfile(f.id),
  }));
  const systems = BUILTIN_SYSTEM_KEYS.map(k => ({ key: k, label: SYSTEM_META[k]?.label || k, icon: SYSTEM_META[k]?.icon || '•' }));
  return NextResponse.json({ facilities: facs, systems });
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  const { facilityId, profile } = await request.json();
  if (!facilityId || !profile) return NextResponse.json({ error: 'facilityId and profile required.' }, { status: 400 });
  const facility = facilitiesForUser(user).find(f => f.id === facilityId);
  if (!facility || !canEditFacility(user, facility)) {
    return NextResponse.json({ error: 'You do not have permission to edit this facility.' }, { status: 403 });
  }
  // only persist known boolean system keys (Stage A) — custom comes in Stage B
  const clean = {};
  for (const k of BUILTIN_SYSTEM_KEYS) if (profile[k] !== undefined) clean[k] = !!profile[k];
  const saved = saveEquipmentProfile(facilityId, clean);
  return NextResponse.json({ ok: true, profile: saved });
}
