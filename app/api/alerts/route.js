import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAllAlerts, acknowledgeAlert, logAudit, getAllEntries, getEquipmentProfile, getShiftScheduleFor } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';
import { SYSTEM_META } from '@/lib/systemFields';
import { normalizeSchedule, shiftStatus, nowInZone, SHIFT_NAMES } from '@/lib/shiftSchedule';

/**
 * Compute LIVE missed-reading "alerts" for shifts that have already CLOSED today,
 * for each facility and each system it actually has. These are synthetic (not stored):
 * they appear in the Open Alerts list and disappear automatically once the reading is logged.
 * They accumulate naturally day-over-day as shifts close without readings.
 */
function computeMissedReadingAlerts() {
  const entries = getAllEntries();
  const out = [];
  for (const h of HOSPITALS) {
    const profile = getEquipmentProfile(h.id);
    const systems = ['boiler','chilled','cooling_tower','condensate','softener'].filter(k => profile[k]);
    if (!systems.length) continue;
    const sched = normalizeSchedule(getShiftScheduleFor(h.id));
    const { date } = nowInZone(sched.timezone);
    for (const shiftName of SHIFT_NAMES) {
      const sh = sched.shifts[shiftName];
      if (!sh || !sh.enabled) continue;
      const st = shiftStatus(sh, sched.timezone);
      const closed = st.state === 'closed' || st.morningClosed;
      if (!closed) continue; // only flag shifts whose window has fully passed today
      for (const sys of systems) {
        const logged = entries.some(e => e.hospitalId === h.id && e.system === sys && e.shift === shiftName && e.date === date);
        if (!logged) {
          out.push({
            id: `missed-${h.id}-${sys}-${shiftName.replace(/\s/g,'')}-${date}`,
            kind: 'missed_reading',
            hospitalId: h.id,
            hospitalName: h.name,
            system: sys,
            systemLabel: SYSTEM_META[sys]?.label || sys,
            shift: shiftName,
            date,
            acknowledged: false,
            createdAt: new Date().toISOString(),
            message: `No ${SYSTEM_META[sys]?.label || sys} reading logged for ${shiftName}`,
          });
        }
      }
    }
  }
  return out;
}

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const hospitalFilter = searchParams.get('hospital');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const ackFilter = searchParams.get('acknowledged');

  let alerts = getAllAlerts();

  // Merge in live missed-reading alerts (synthetic, computed fresh)
  let missed = computeMissedReadingAlerts();

  if (hospitalFilter) {
    alerts = alerts.filter((a) => a.hospitalId === hospitalFilter);
    missed = missed.filter((a) => a.hospitalId === hospitalFilter);
  }
  if (fromDate) alerts = alerts.filter((a) => a.date >= fromDate);
  if (toDate) alerts = alerts.filter((a) => a.date <= toDate);

  // missed readings are always "unacknowledged" (they resolve by logging the reading)
  let combined = [...missed, ...alerts];
  if (ackFilter === 'false') combined = combined.filter((a) => !a.acknowledged);
  else if (ackFilter === 'true') combined = combined.filter((a) => a.acknowledged);

  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return NextResponse.json({ alerts: combined, missedCount: missed.length });
}

export async function PATCH(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const { alertId } = body;
    if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    const updated = acknowledgeAlert(alertId);
    if (!updated) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
    return NextResponse.json({ success: true, alert: updated });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
