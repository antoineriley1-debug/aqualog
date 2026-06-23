import { NextResponse } from 'next/server';
import { getAllEntries, getAllAlerts } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals';
import { calcComplianceScore } from '@/lib/compliance';
import { BRAND } from '@/lib/branding';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== (process.env.CRON_SECRET || 'aqualog_cron_2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entries = getAllEntries();
    const alerts = getAllAlerts();

    // Calculate for current week (last 7 days)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekDateLabel = weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Calculate compliance for current month
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const hospitalData = HOSPITALS.map((h) => {
      const result = calcComplianceScore(h.id, entries, alerts, year, month);
      const weekEntries = entries.filter(
        (e) => e.hospitalId === h.id && e.date >= weekStartStr
      );

      // Count OOR in the week
      let oorCount = 0;
      weekEntries.forEach((e) => {
        if (e.outOfRangeParams?.length > 0) oorCount += e.outOfRangeParams.length;
      });

      // Count missed shifts (expected 3 shifts/day × 2 systems × 7 days)
      const expectedWeek = 7 * 3 * 2;
      const missedShifts = Math.max(0, expectedWeek - weekEntries.length);

      const openAlerts = alerts.filter(
        (a) => a.hospitalId === h.id && !a.acknowledged
      ).length;

      return {
        id: h.id,
        name: h.name,
        code: h.code,
        grade: result.grade,
        score: result.score,
        weekEntries: weekEntries.length,
        oorCount,
        missedShifts,
        openAlerts,
        isCritical: result.grade === 'D' || result.grade === 'F',
      };
    });

    // Build HTML email
    const rowsHtml = hospitalData.map((h) => `
      <tr style="background:${h.isCritical ? '#fff5f5' : 'white'}">
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:${h.isCritical ? 'bold' : 'normal'};color:${h.isCritical ? '#b91c1c' : '#1f2937'}">${h.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center">
          <span style="font-size:18px;font-weight:bold;color:${
            h.grade.startsWith('A') ? '#15803d' :
            h.grade.startsWith('B') ? '#1d4ed8' :
            h.grade.startsWith('C') ? '#a16207' :
            h.grade === 'D' ? '#c2410c' : '#b91c1c'
          }">${h.grade}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center">${h.weekEntries}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;color:${h.oorCount > 0 ? '#b91c1c' : '#15803d'}">${h.oorCount}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;color:${h.missedShifts > 0 ? '#b91c1c' : '#15803d'}">${h.missedShifts}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;color:${h.openAlerts > 0 ? '#b91c1c' : '#15803d'}">${h.openAlerts}</td>
      </tr>
    `).join('');

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${BRAND.name} Weekly Report</title></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:700px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:${BRAND.headerColor};padding:24px 32px">
      <h1 style="color:white;margin:0;font-size:22px">💧 ${BRAND.name} Weekly Report</h1>
      <p style="color:#93c5fd;margin:6px 0 0">Week of ${weekDateLabel}</p>
    </div>
    <div style="padding:24px 32px">
      <p style="color:#374151;margin-bottom:20px">Compliance summary for all ${BRAND.name} facilities — month-to-date scores with weekly activity.</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em">Hospital</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em">Grade</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em">Entries (7d)</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em">OOR</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em">Missed Shifts</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em">Open Alerts</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${hospitalData.some(h => h.isCritical) ? `
        <div style="margin-top:20px;padding:14px 18px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px">
          <strong style="color:#991b1b">⚠️ Attention Required</strong>
          <p style="color:#991b1b;margin:6px 0 0">The following facilities have grades of D or F and require immediate attention:
            ${hospitalData.filter(h => h.isCritical).map(h => h.name).join(', ')}
          </p>
        </div>
      ` : `
        <div style="margin-top:20px;padding:14px 18px;background:#dcfce7;border:1px solid #86efac;border-radius:8px">
          <strong style="color:#166534">✅ All Facilities Performing Well</strong>
          <p style="color:#166534;margin:6px 0 0">No facilities with critical grades this week.</p>
        </div>
      `}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://facilityh2o.com'}" style="color:#0072CE">View ${BRAND.name} Portal</a> · Generated ${new Date().toLocaleString()} · ${BRAND.name}
    </div>
  </div>
</body>
</html>`;

    let emailSent = false;

    if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.ALERT_EMAIL_FROM || BRAND.fromEmail,
          to: process.env.ALERT_EMAIL_TO,
          subject: `${BRAND.name} Weekly Report — Week of ${weekDateLabel}`,
          html: htmlEmail,
        });
        emailSent = true;
      } catch (err) {
        console.warn('Weekly report email failed:', err.message);
      }
    } else {
      console.log('RESEND_API_KEY or ALERT_EMAIL_TO not set — skipping email');
    }

    return NextResponse.json({
      success: true,
      emailSent,
      hospitalCount: HOSPITALS.length,
      weekOf: weekDateLabel,
      hospitals: hospitalData,
    });
  } catch (err) {
    console.error('Weekly report error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
