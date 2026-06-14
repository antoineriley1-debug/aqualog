/**
 * Equipment Profile API
 * GET  → { facilities:[{id,name,code,orgId,canEdit, profile}], systems:[{key,label,icon}], library, customEquipmentEnabled }
 * POST → { facilityId, profile } saves which built-in systems a facility has + (Enterprise) custom equipment.
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getEquipmentProfile, saveEquipmentProfile, canEditFacility, getFacilities, BUILTIN_SYSTEM_KEYS, hasCustomEquipmentFeature, getLicenses } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';
import { SYSTEM_META } from '@/lib/systemFields';
import { EQUIPMENT_LIBRARY } from '@/lib/equipmentLibrary';

function facilitiesForUser(user) {
  const isOwner = user.username === 'ariley' || user.id === 'usr_ariley';
  const legacy = HOSPITALS.map(h => ({ id: h.id, name: h.name, code: h.code, orgId: null }));
  const orgFacs = (getFacilities() || []).map(f => ({ id: f.id, name: f.name, code: f.code || '', orgId: f.orgId || null }));
  if (isOwner) return [...legacy, ...orgFacs];
  // Operators get READ access to just their own assigned facility (so they can log its equipment).
  if (user.role === 'operator') return [...legacy, ...orgFacs].filter(f => f.id === user.hospital);
  if (!user.orgId) return legacy;
  return orgFacs.filter(f => f.orgId === user.orgId);
}

// Is the specialized-equipment feature active for a given facility?
// Legacy facilities (no org) are the owner's own install → always entitled.
// Org facilities require an active/trial license that includes 'custom_equipment'
// (this is what makes downgrade hide custom equipment for SaaS clients).
function facilityCustomEnabled(facility) {
  if (!facility) return false;
  if (!facility.orgId) return true;
  const lic = (getLicenses() || []).find(l => l.orgId === facility.orgId);
  if (!lic) return false;
  const okStatus = lic.status === 'active' || lic.status === 'trial';
  return okStatus && Array.isArray(lic.features) && lic.features.includes('custom_equipment');
}

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });  // admins, owner, and operators (read-only) all allowed
  const facs = facilitiesForUser(user).map(f => ({
    ...f, canEdit: canEditFacility(user, f), profile: getEquipmentProfile(f.id),
  }));
  const systems = BUILTIN_SYSTEM_KEYS.map(k => ({ key: k, label: SYSTEM_META[k]?.label || k, icon: SYSTEM_META[k]?.icon || '•' }));
  // Custom equipment is enabled for this requester if they're the owner, or any facility they can
  // see is entitled (covers org admins via license AND operators logging at their own facility).
  const isOwner = user.username === 'ariley' || user.id === 'usr_ariley';
  const customEquipmentEnabled = isOwner || facs.some(f => facilityCustomEnabled(f));
  const library = customEquipmentEnabled
    ? EQUIPMENT_LIBRARY.map(e => ({ key: e.key, label: e.label, icon: e.icon, standard: e.standard, summary: e.summary, verifyNote: e.verifyNote, params: e.params }))
    : [];
  return NextResponse.json({ facilities: facs, systems, library, customEquipmentEnabled });
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
  // persist known boolean system keys (built-ins)
  const clean = {};
  for (const k of BUILTIN_SYSTEM_KEYS) if (profile[k] !== undefined) clean[k] = !!profile[k];

  // Stage B: persist custom equipment selections — gated on the Enterprise feature.
  if (hasCustomEquipmentFeature(user)) {
    if (Array.isArray(profile.custom)) {
      const validKeys = new Set(EQUIPMENT_LIBRARY.map(e => e.key));
      // store just the keys the facility has turned on; drop anything not in the curated library
      clean.custom = profile.custom
        .map(c => (typeof c === 'string' ? c : c?.key))
        .filter(k => validKeys.has(k))
        .map(k => {
          const item = EQUIPMENT_LIBRARY.find(e => e.key === k);
          return { key: item.key, label: item.label, icon: item.icon, params: item.params.map(p => ({ key: p.key, label: p.label, unit: p.unit, min: p.min, max: p.max })) };
        });
    }
  }
  // NOTE: if the org lacks the feature we simply don't touch `custom` — existing selections are
  // preserved in storage (dormant), so a later re-upgrade restores them automatically.

  const saved = saveEquipmentProfile(facilityId, clean);
  return NextResponse.json({ ok: true, profile: saved });
}
