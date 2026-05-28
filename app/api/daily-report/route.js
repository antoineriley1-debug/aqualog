/**
 * MedStar H2O — End-of-Day Report
 * One email per day covering the FULL prior day across all facilities:
 *   1) MISSED readings — which hospital/shift/system had no entry
 *   2) OUT-OF-RANGE readings — hospital/shift/parameter/value/acceptable range
 *
 * Sends through the shared, non-silent notify layer (loud failures, real result).
 * Auth: internal cron secret (?secret=) OR an admin session.
 *
 * Default coverage: YESTERDAY (ET), so a 6:00 AM run captures all 3 shifts
 * of the prior calendar day. Override with ?date=YYYY-MM-DD for testing.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllEntries, getAllAlerts } from '@/lib/store';
import { HOSPITALS } from '@/lib/hospitals'
