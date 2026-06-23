#!/usr/bin/env node
/**
 * MedStar H2O — End-of-Day Report Runner
 * Run via Render cron once daily (6:00 AM ET) to capture the full prior day.
 *
 * Schedule (ET): 6:00 AM  →  cron UTC "0 10 * * *" (during EDT/summer)
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://medstarh20log.com';
const SECRET = process.env.CRON_SECRET || 'aqualog_cron_2026';

async function run() {
  try {
    console.log(`[${new Date().toISOString()}] Running end-of-day report...`);
    const res = await fetch(`${BASE_URL}/api/daily-report?secret=${SECRET}`);
    const data = await res.json();

    if (data.error) {
      console.error('End-of-day report error:', data.error);
      process.exit(1);
    }

    console.log(`Report for ${data.date}: ${data.missedCount} missed, ${data.outOfRangeCount} out-of-range.`);
    console.log(data.email && data.email.ok ? `✅ Emailed to ${data.email.recipients?.join(', ')}` : `⚠️  Email NOT sent: ${data.email?.error || 'unknown'}`);
  } catch (err) {
    console.error('Error running end-of-day report:', err.message);
    process.exit(1);
  }
}

run();
