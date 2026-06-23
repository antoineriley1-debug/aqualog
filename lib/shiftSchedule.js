/**
 * FacilityH2O — Per-Facility Shift Schedule + timezone-aware status logic
 *
 * Each facility has up to 3 shifts; each shift: { enabled, start "HH:MM", end "HH:MM" }.
 * A facility also has a `timezone` (IANA, e.g. "America/New_York"). Defaults to Eastern.
 * Schedules are stored in data/shift-schedules.json keyed by facilityId.
 *
 * Shifts may cross midnight (e.g. 3rd shift 21:00 -> 05:30). Logic handles that.
 */

export const DEFAULT_SCHEDULE = {
  timezone: 'America/New_York',
  shifts: {
    '1st Shift': { enabled: true, start: '05:00', end: '13:30' },
    '2nd Shift': { enabled: true, start: '13:00', end: '21:30' },
    '3rd Shift': { enabled: true, start: '21:00', end: '05:30' },
  },
};

export const SHIFT_NAMES = ['1st Shift', '2nd Shift', '3rd Shift'];

// Minutes-since-midnight for "HH:MM"
function toMin(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h * 60) + (m || 0);
}

/**
 * Get current wall-clock minutes-since-midnight AND the YYYY-MM-DD date
 * in a given IANA timezone, using Intl (DST-correct, no manual offsets).
 */
export function nowInZone(tz, when = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(when).map(p => [p.type, p.value]));
    let hour = parseInt(parts.hour, 10);
    if (hour === 24) hour = 0; // some engines emit 24 at midnight
    const minutes = hour * 60 + parseInt(parts.minute, 10);
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    return { minutes, date, hour };
  } catch {
    // Fallback: treat `when` as-is in UTC
    const minutes = when.getUTCHours() * 60 + when.getUTCMinutes();
    return { minutes, date: when.toISOString().slice(0, 10), hour: when.getUTCHours() };
  }
}

/**
 * Status of one shift right now.
 * Returns: 'open' (in window, countdown), 'closed' (window passed today), or 'upcoming' (not started yet today).
 * Also returns minutesUntilClose when open.
 * Handles shifts that cross midnight.
 */
export function shiftStatus(shift, tz, when = new Date()) {
  if (!shift || !shift.enabled) return { state: 'disabled' };
  const { minutes } = nowInZone(tz, when);
  const s = toMin(shift.start);
  const e = toMin(shift.end);
  const crossesMidnight = e <= s;

  let isOpen;
  if (!crossesMidnight) {
    isOpen = minutes >= s && minutes < e;
  } else {
    // open if after start (late today) OR before end (early next day)
    isOpen = minutes >= s || minutes < e;
  }

  if (isOpen) {
    let untilClose;
    if (!crossesMidnight) untilClose = e - minutes;
    else untilClose = (minutes >= s) ? (1440 - minutes + e) : (e - minutes);
    return { state: 'open', minutesUntilClose: untilClose };
  }

  // Not open. Has it already closed today, or is it still upcoming?
  if (!crossesMidnight) {
    if (minutes >= e) return { state: 'closed' };
    return { state: 'upcoming' };
  } else {
    // crosses midnight: closed window is [end, start) same day
    if (minutes >= e && minutes < s) {
      // between this morning's close and tonight's start
      return { state: 'closed_or_upcoming', morningClosed: true };
    }
    return { state: 'open' };
  }
}

/**
 * Did `shift` close within the last `windowMin` minutes (for the cron)?
 * Used to decide "this shift just ended and we should check for a missed reading."
 */
export function didShiftCloseRecently(shift, tz, windowMin = 60, when = new Date()) {
  if (!shift || !shift.enabled) return false;
  const { minutes } = nowInZone(tz, when);
  const e = toMin(shift.end);
  // distance (in minutes) since close, accounting for midnight wrap
  let since = minutes - e;
  if (since < 0) since += 1440;
  return since >= 0 && since < windowMin;
}

/** Merge a stored schedule with defaults so missing fields never break logic. */
export function normalizeSchedule(raw) {
  const base = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  if (!raw) return base;
  if (raw.timezone) base.timezone = raw.timezone;
  if (raw.shifts) {
    for (const name of SHIFT_NAMES) {
      if (raw.shifts[name]) base.shifts[name] = { ...base.shifts[name], ...raw.shifts[name] };
    }
  }
  return base;
}
