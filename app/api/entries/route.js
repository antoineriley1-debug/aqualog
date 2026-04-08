import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAllEntries, getEntriesForHospital, addEntry, logAudit } from '@/lib/store';
import { addAlert } from '@/lib/store';
import { getOutOfRangeParams, CHEMISTRY_RANGES } from '@/lib/chemistryRanges';
import { detectDrift } from '@/lib/driftDetection';
import { getHospital, getHospitalVendor } from '@/lib/hospitals';

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hospitalFilter = searchParams.get('hospital');
  const systemFilter = searchParams.get('system');
  const shiftFilter = searchParams.get('shift');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  let entries;
  if (user.role === 'admin') {
    entries = hospitalFilter ? getEntriesForHospital(hospitalFilter) : getAllEntries();
  } else {
    entries = getEntriesForHospital(user.hospital);
  }

  if (systemFilter) {
    entries = entries.filter((e) => e.system === systemFilter);
  }
  if (shiftFilter) {
    entries = entries.filter((e) => e.shift === shiftFilter);
  }
  if (fromDate) {
    entries = entries.filter((e) => e.date >= fromDate);
  }
  if (toDate) {
    entries = entries.filter((e) => e.date <= toDate);
  }

  // Sort newest first
  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return NextResponse.json({ entries });
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hospitalId, system, shift, date, time, testerName, operatorName, values, notes, correctiveAction } = body;

    if (!hospitalId || !system || !shift || !date || !operatorName || !testerName || !values) {
      return NextResponse.json({ error: 'Missing required fields. Tester name is required.' }, { status: 400 });
    }

    // Operators can only submit for their own hospital
    if (user.role === 'operator' && user.hospital !== hospitalId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const entryData = { hospitalId, system, shift, date, time: time || null, testerName, operatorName, values, notes };

    // Attach corrective action if provided
    if (correctiveAction && correctiveAction.action) {
      entryData.correctiveAction = {
        taken: true,
        action: correctiveAction.action,
        actionBy: correctiveAction.actionBy || operatorName,
        actionAt: new Date().toISOString(),
        followUpRequired: correctiveAction.followUpRequired || false,
        followUpNotes: correctiveAction.followUpNotes || '',
      };
    }

    const entry = addEntry(entryData);

    // Audit log
    logAudit({
      type: 'entry',
      action: 'create',
      userId: user.id,
      username: user.username,
      hospitalId,
      entityId: entry.id,
      entityType: 'entry',
      detail: `${system} ${shift} shift on ${date}`,
    });

    // Check for out-of-range values
    const oor = getOutOfRangeParams(system, values);
    let alert = null;
    if (oor.length > 0) {
      alert = addAlert({
        entryId: entry.id,
        hospitalId,
        system,
        shift,
        date,
        operatorName,
        outOfRangeParams: oor,
      });

      // Attempt email notification (graceful fallback)
      if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const hospital = getHospital(hospitalId);
          const vendor = getHospitalVendor(hospitalId);
          const paramList = oor
            .map((p) => `${p.label}: ${p.value}${p.unit} (range: ${p.min}–${p.max}${p.unit})`)
            .join('\n');
          const vendorSection = vendor
            ? `\nWater Treatment Vendor: ${vendor.company}\nEmergency Line: ${vendor.emergency || 'N/A'}`
            : '';
          await resend.emails.send({
            from: process.env.ALERT_EMAIL_FROM || 'FacilityH2O@FacilityH2O.net',
            to: process.env.ALERT_EMAIL_TO,
            subject: `[FacilityH2O] Out-of-Range Alert — ${hospitalId.toUpperCase()} ${system} ${shift} shift`,
            text: `Out-of-range parameters detected:\n\n${paramList}\n\nEntry logged by ${operatorName} on ${date}.${vendorSection}`,
          });
        } catch (emailErr) {
          console.warn('Email notification failed:', emailErr.message);
        }
      }
    }

    // Drift detection — check all parameters for trending
    const driftWarnings = [];
    const allEntries = getAllEntries();
    const systemRanges = CHEMISTRY_RANGES[system] || {};
    for (const [param, range] of Object.entries(systemRanges)) {
      const drift = detectDrift(allEntries, hospitalId, system, param, range);
      if (drift) {
        driftWarnings.push(drift);

        // Send drift warning email
        if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
          try {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            const hospital = getHospital(hospitalId);
            const hospitalName = hospital?.name || hospitalId;
            await resend.emails.send({
              from: process.env.ALERT_EMAIL_FROM || 'FacilityH2O@FacilityH2O.net',
              to: process.env.ALERT_EMAIL_TO,
              subject: `⚠️ FacilityH2O Trend Warning — ${hospitalName} ${system} ${param} trending ${drift.direction}`,
              text: `Trend Warning: ${param} is trending ${drift.direction} and approaching the limit.\n\nLast 3 readings: ${drift.trend.join(', ')}\nCurrent: ${drift.current}\nLimit: ${drift.limit}\n\nFacility: ${hospitalName}\nSystem: ${system}`,
            });
          } catch (emailErr) {
            console.warn('Drift warning email failed:', emailErr.message);
          }
        }
      }
    }

    const response = { success: true, entry, alert };
    if (driftWarnings.length > 0) {
      response.drift_warnings = driftWarnings;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('POST /api/entries error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
