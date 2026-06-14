/**
 * Shift Schedules API
 * GET  → { facilities:[{id,name,code,orgId,canEdit}], schedules:{[id]:{timezone,shifts}}, timezones:[{id,label}] }
 * POST → { facilityId, schedule } saves a facility's shift schedule (permission enforced).
 *
 * Scoping matches equipment-profile: owner (ariley) sees ALL facilities; an org admin sees
 * only their org's facilities.
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getShiftScheduleFor, saveShiftSchedule, canEditFacility, getFacilities } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';
import { normalizeSchedule, SHIFT_NAMES } from '@/lib/shiftSchedule';

const TIMEZONES = [
  { id: 'America/New_York', label: 'Eastern (ET)' },
  { id: 'America/Chicago',  label: 'Central (CT)' },
  { id: 'America/Denver',   label: 'Mountain (MT)' },
  { id: 'America/Phoenix',  label: 'Arizona (no DST)' },
  { id: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { id: 'America/Anchorage', label: 'Alaska (AKT)' },
  { id: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
];

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

  const facs = facilitiesForUser(user).map(f => ({ ...f, canEdit: canEditFacility(user, f) }));
  const schedules = {};
  for (const f of facs) {
    schedules[f.id] = normalizeSchedule(getShiftScheduleFor(f.id));
  }
  return NextResponse.json({ facilities: facs, schedules, timezones: TIMEZONES });
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admins only.' }, { status: 403 });

  const { facilityId, schedule } = await request.json();
  if (!facilityId || !schedule) return NextResponse.json({ error: 'facilityId and schedule required.' }, { status: 400 });

  const facility = facilitiesForUser(user).find(f => f.id === facilityId);
  if (!facility || !canEditFacility(user, facility)) {
    return NextResponse.json({ error: 'You do not have permission to edit this facility.' }, { status: 403 });
  }

  // Normalize + clean before saving: keep only the three known shifts with valid fields.
  const norm = normalizeSchedule(schedule);
  const clean = { timezone: norm.timezone, shifts: {} };
  for (const name of SHIFT_NAMES) {
    const sh = norm.shifts[name] || {};
    clean.shifts[name] = {
      enabled: !!sh.enabled,
      start: typeof sh.start === 'string' ? sh.start : '00:00',
      end: typeof sh.end === 'string' ? sh.end : '00:00',
    };
  }
  const saved = saveShiftSchedule(facilityId, clean);
  return NextResponse.json({ ok: true, schedule: saved });
}
