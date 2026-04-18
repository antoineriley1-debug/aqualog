import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllEntries } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';

// Shift windows (ET):
// 1st Shift: 5:00 AM – 1:30 PM  ? check at 2:00 PM
// 2nd Shift: 1:00 PM – 9:30 PM  ? check at 10:00 PM
// 3rd Shift: 9:00 PM – 5:30 AM  ? check at 6:00 AM

export async function GET(request) {
  // Allow internal calls with secret key OR admin session
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const isInternal = secret === (process.env.CRON_SECRET || 'aqualog_cron_2026');

  if (!isInternal) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const now = new Date();
  // Use ET offset (UTC-4 in summer, UTC-5 in winter)
  const etOffset = isDST(now) ? -4 : -5;
  const etNow = new Date(now.getTime() + etOffset * 3600000);
  const etHour = etNow.getUTCHours();
  const today = etNow.toISOString().split('T')[0];
  const yesterday = new Date(etNow.getTime() - 86400000).toISOString().split('T')[0];

  // Determine which shift to check based on current time
  // Day shift: check after 1:30 PM (13:30) — so if hour >= 14 and hour < 22
  // Evening shift: check after 9:30 PM (21:30) — so if hour >= 22
  // Night shift: check after 5:00 AM (05:00) — so if hour >= 6 and hour < 14
  let shiftToCheck = null;
  let checkDate = today;

  if (etHour >= 6 && etHour < 14) {
    // After 6am: check if 3rd Shift was logged
    shiftToCheck = '3rd Shift';
    checkDate = today;
  } else if (etHour >= 14 && etHour < 22) {
    // After 2pm: check if 1st Shift was logged today
    shiftToCheck = '1st Shift';
    checkDate = today;
  } else {
    // After 10pm: check if 2nd Shift was logged today
    shiftToCheck = '2nd Shift';
    checkDate = today;
  }

  const entries = getAllEntries();

  // Find which hospitals are missing entries for this shift
  const missing = [];

  for (const hospital of HOSPITALS) {
    // Check both boiler and chilled water
    const boilerLogged = entries.some(
      e => e.hospitalId === hospital.id &&
           e.shift === shiftToCheck &&
           e.date === checkDate &&
           e.system === 'boiler'
    );
    const chilledLogged = entries.some(
      e => e.hospitalId === hospital.id &&
           e.shift === shiftToCheck &&
           e.date === checkDate &&
           e.system === 'chilled'
    );

    if (!boilerLogged || !chilledLogged) {
      const director = hospital.contacts.find(
        c => c.title.toLowerCase().includes('director') && c.name !== 'VACANT'
      );

      missing.push({
        hospital: hospital.name,
        code: hospital.code,
        missingBoiler: !boilerLogged,
        missingChilled: !chilledLogged,
        director: director ? {
          name: director.name,
          office: director.office,
          mobile: director.mobile,
          email: director.medstarEmail,
        } : null,
      });
    }
  }

  if (missing.length === 0) {
    return NextResponse.json({ ok: true, shift: shiftToCheck, date: checkDate, missing: [] });
  }

  // Build summary email
  const emailBody = buildEmailBody(shiftToCheck, checkDate, missing);

  // Send email if configured
  let emailSent = false;
  if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'AquaLog Alerts <alerts@facilityh2o.com>',
        to: process.env.ALERT_EMAIL_TO,
        subject: `?? AquaLog: ${missing.length} Missed ${shiftToCheck} Shift Reading${missing.length > 1 ? 's' : ''} — ${checkDate}`,
        html: emailBody,
      });
      emailSent = true;
    } catch (err) {
      console.error('Failed to send missed shift email:', err.message);
    }
  }

  return NextResponse.json({
    ok: true,
    shift: shiftToCheck,
    date: checkDate,
    missedCount: missing.length,
    missing,
    emailSent,
    emailBody: !emailSent ? emailBody : undefined,
  });
}

function buildEmailBody(shift, date, missing) {
  const shiftTimes = {
    '1st Shift': '5:00 AM – 1:30 PM',
    '2nd Shift': '1:00 PM – 9:30 PM',
    '3rd Shift': '9:00 PM – 5:30 AM',
  };

  const rows = missing.map(m => {
    const missed = [m.missingBoiler && '?? Boiler', m.missingChilled && '?? Chilled'].filter(Boolean).join(', ');
    const dirInfo = m.director
      ? `${m.director.name}<br/>${[m.director.office, m.director.mobile].filter(Boolean).join(' / ')}<br/><a href="mailto:${m.director.email}">${m.director.email}</a>`
      : '<span style="color:#999">—</span>';

    return `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:10px 12px;font-weight:600;color:#111">${m.hospital}</td>
        <td style="padding:10px 12px;color:#dc2626;font-weight:600">${missed}</td>
        <td style="padding:10px 12px;font-size:13px;color:#444;line-height:1.5">${dirInfo}</td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f8f9fa;margin:0;padding:20px">
  <div style="max-width:700px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#003366;padding:20px 28px">
      <div style="color:white;font-size:22px;font-weight:bold">?? AquaLog</div>
      <div style="color:#90c4f0;font-size:13px;margin-top:4px">MedStar Health · Water Chemistry Portal</div>
    </div>
    <div style="padding:24px 28px">
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:18px;font-weight:700;color:#dc2626">?? Missed ${shift} Shift Readings</div>
        <div style="color:#666;margin-top:6px;font-size:14px">
          ${shift} Shift (${shiftTimes[shift]}) · ${date} · ${missing.length} facilit${missing.length !== 1 ? 'ies' : 'y'} missing
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 12px;text-align:left;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Hospital</th>
            <th style="padding:10px 12px;text-align:left;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Missing</th>
            <th style="padding:10px 12px;text-align:left;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Facilities Director</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">
        AquaLog · MedStar Health · Managed by Crothall Healthcare
      </div>
    </div>
  </div>
</body>
</html>`;
}

function isDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return date.getTimezoneOffset() < stdOffset;
}
