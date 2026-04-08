/**
 * FacilityH2O — Notification Rules API (per-hospital + global)
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';

const DATA_DIR      = path.join(process.cwd(), 'data');
const RULES_FILE    = path.join(DATA_DIR, 'notification-rules.json');
const SUPER_ADMIN_ID = 'usr_ariley';

const DEFAULT_THRESHOLDS = {
  trending_days:        3,
  missed_shifts:        1,
  out_of_range_count:   2,
  legionella_cfu_alert: 1,
};

const DEFAULT_LEVELS = [
  {
    id: 'level_1', name: 'Level 1 — Operator',
    description: 'First alert — assigned operator + supervisor',
    trigger: 'immediate', channels: ['email'], contacts: [],
  },
  {
    id: 'level_2', name: 'Level 2 — Facilities Management',
    description: 'Escalate after trending or repeated issues',
    trigger: 'trending', triggerDays: 3, channels: ['email','phone'], contacts: [],
  },
  {
    id: 'level_3', name: 'Level 3 — Critical',
    description: 'Immediate: Legionella, shutdown-level readings',
    trigger: 'critical', channels: ['email','phone','sms'], contacts: [],
  },
];

function readRules() {
  try { if (fs.existsSync(RULES_FILE)) return JSON.parse(fs.readFileSync(RULES_FILE,'utf8')); } catch {}
  return { global: { thresholds: DEFAULT_THRESHOLDS, levels: DEFAULT_LEVELS }, hospitals: {} };
}

function writeRules(r) { fs.writeFileSync(RULES_FILE, JSON.stringify(r, null, 2), 'utf8'); }

// GET /api/notifications?hospital=whc — returns global + hospital-specific rules
export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get('hospital');
  const rules = readRules();

  if (hospitalId) {
    // Merge global defaults with hospital overrides
    const hospitalRules = rules.hospitals?.[hospitalId] || {};
    return NextResponse.json({
      global: rules.global,
      hospital: hospitalRules,
      merged: {
        thresholds: { ...rules.global.thresholds, ...(hospitalRules.thresholds || {}) },
        levels: hospitalRules.levels || rules.global.levels,
        contacts: hospitalRules.contacts || [],
      },
    });
  }

  return NextResponse.json({ rules });
}

// POST /api/notifications — save global or hospital-specific rules
export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.id !== SUPER_ADMIN_ID) {
    return NextResponse.json({ error: 'Only the system owner can configure notification rules.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { hospitalId, thresholds, levels, contacts } = body;
  const rules = readRules();

  if (hospitalId) {
    // Hospital-specific rules
    if (!rules.hospitals) rules.hospitals = {};
    if (!rules.hospitals[hospitalId]) rules.hospitals[hospitalId] = {};
    if (thresholds) rules.hospitals[hospitalId].thresholds = { ...rules.hospitals[hospitalId].thresholds, ...thresholds };
    if (levels)     rules.hospitals[hospitalId].levels     = levels;
    if (contacts)   rules.hospitals[hospitalId].contacts   = contacts;
    rules.hospitals[hospitalId].updatedAt = new Date().toISOString();
    rules.hospitals[hospitalId].updatedBy = user.username;
  } else {
    // Global rules
    if (!rules.global) rules.global = { thresholds: DEFAULT_THRESHOLDS, levels: DEFAULT_LEVELS };
    if (thresholds) rules.global.thresholds = { ...rules.global.thresholds, ...thresholds };
    if (levels)     rules.global.levels     = levels;
    if (contacts)   rules.global.contacts   = contacts;
    rules.global.updatedAt = new Date().toISOString();
    rules.global.updatedBy = user.username;
  }

  writeRules(rules);
  return NextResponse.json({ ok: true, rules });
}
