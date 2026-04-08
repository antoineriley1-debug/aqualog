#!/usr/bin/env node
/**
 * FacilityH2O Missed Shift Checker
 * Run via cron or Render cron job
 * 
 * Schedule (ET):
 *   1st Shift ends 1:30 PM   → run at 2:00 PM:  0 14 * * *
 *   2nd Shift ends 9:30 PM   → run at 10:00 PM: 0 22 * * *
 *   3rd Shift ends 5:30 AM   → run at 6:00 AM:  0 6  * * *
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://facilityh2o.onrender.com';
const SECRET = process.env.CRON_SECRET || 'facilityh2o_cron_2026';

async function run() {
  try {
    console.log(`[${new Date().toISOString()}] Checking missed shifts...`);
    const res = await fetch(`${BASE_URL}/api/check-shifts?secret=${SECRET}`);
    const data = await res.json();

    if (data.missing && data.missing.length > 0) {
      console.log(`⚠️  ${data.missing.length} hospitals missed ${data.shift} shift readings:`);
      data.missing.forEach(m => {
        const missed = [m.missingBoiler && 'Boiler', m.missingChilled && 'Chilled'].filter(Boolean).join(', ');
        console.log(`  - ${m.hospital} [${m.code}]: ${missed}`);
        if (m.director) {
          console.log(`    Director: ${m.director.name} | ${m.director.office || m.director.mobile || 'No phone'}`);
        }
      });
      console.log(data.emailSent ? '✅ Alert email sent.' : '⚠️  Email not configured (no RESEND_API_KEY).');
    } else {
      console.log(`✅ All hospitals logged ${data.shift} shift readings for ${data.date}.`);
    }
  } catch (err) {
    console.error('Error checking missed shifts:', err.message);
    process.exit(1);
  }
}

run();
