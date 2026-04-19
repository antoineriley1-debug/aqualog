import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAllEntries, getAllAlerts } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const entries = getAllEntries();
  const alerts = getAllAlerts();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().split('T')[0];

  // Expected shifts per day: 3 (1st, 2nd, 3rd) x 2 systems (boiler, chilled) = 6
  const EXPECTED_SHIFTS_PER_DAY = 6;

  const facilities = HOSPITALS.map((h) => {
    const hEntries = entries.filter((e) => e.hospitalId === h.id);
    const hAlerts = alerts.filter((a) => a.hospitalId === h.id);

    // Last entry
    const sorted = [...hEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const lastEntry = sorted[0] || null;

    // Entries in last 7 days
    const recent = hEntries.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);
    const entryCount7d = recent.length;

    // OOR count in last 7 days
    const oorCount7d = hAlerts.filter(
      (a) => new Date(a.createdAt) >= sevenDaysAgo && !a.acknowledged
    ).length;

    // Total OOR (including acknowledged) for compliance scoring
    const totalOor7d = hAlerts.filter(
      (a) => new Date(a.createdAt) >= sevenDaysAgo
    ).length;

    // Missed shifts in last 7 days
    // Count days in last 7, multiply by expected shifts, subtract actual unique shift entries
    const daysInRange = 7;
    const expectedShifts = daysInRange * EXPECTED_SHIFTS_PER_DAY;
    const uniqueShifts = new Set(
      recent.map((e) => `${e.date}_${e.system}_${e.shift}`)
    ).size;
    const missedShifts7d = Math.max(0, expectedShifts - uniqueShifts);

    // Latest boiler pH
    const boilerEntries = hEntries
      .filter((e) => e.system === 'boiler')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestBoilerPH = boilerEntries[0]?.values?.ph ?? null;

    // Latest chilled pH
    const chilledEntries = hEntries
      .filter((e) => e.system === 'chilled')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestChilledPH = chilledEntries[0]?.values?.ph ?? null;

    // Latest conductivity (boiler)
    const latestConductivity = boilerEntries[0]?.values?.conductivity ?? null;

    // Compliance score: 100 - (oorCount * 10) - (missedShifts * 2), min 0
    const complianceScore = Math.max(0, 100 - (totalOor7d * 10) - (missedShifts7d * 2));

    // Trend: compare last 2 boiler pH readings
    let trend = 'stable';
    if (boilerEntries.length >= 2) {
      const curr = parseFloat(boilerEntries[0]?.values?.ph);
      const prev = parseFloat(boilerEntries[1]?.values?.ph);
      if (!isNaN(curr) && !isNaN(prev)) {
        if (curr > prev + 0.2) trend = 'up';
        else if (curr < prev - 0.2) trend = 'down';
      }
    }

    return {
      id: h.id,
      name: h.name,
      code: h.code,
      lastEntry: lastEntry
        ? {
            date: lastEntry.date,
            operatorName: lastEntry.operatorName,
            createdAt: lastEntry.createdAt,
          }
        : null,
      entryCount7d,
      oorCount7d,
      missedShifts7d,
      latestBoilerPH,
      latestChilledPH,
      latestConductivity,
      complianceScore,
      trend,
    };
  });

  return NextResponse.json({ facilities });
}
