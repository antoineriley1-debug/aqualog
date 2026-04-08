/**
 * FacilityH2O â€” ST108 Entries API
 * Author & Owner: Antoine Riley
 * Â© 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';
import { evaluateST108Entry, getCorrectionLevel } from '@/lib/st108';
import { logAudit } from '@/lib/store';

const ST108_FILE = path.join(process.cwd(), 'data', 'st108-entries.json');

function readEntries() {
  try {
    if (!fs.existsSync(ST108_FILE)) return [];
    return JSON.parse(fs.readFileSync(ST108_FILE, 'utf8'));
  } catch { return []; }
}

function writeEntries(entries) {
  fs.writeFileSync(ST108_FILE, JSON.stringify(entries, null, 2), 'utf8');
}



export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hospital  = searchParams.get('hospital');
  const waterType = searchParams.get('waterType');
  const from      = searchParams.get('from');
  const to        = searchParams.get('to');

  let entries = readEntries();

  // Operators only see their hospital
  if (user.role !== 'admin' && user.hospital) {
    entries = entries.filter((e) => e.hospital === user.hospital);
  } else if (hospital) {
    entries = entries.filter((e) => e.hospital === hospital);
  }

  if (waterType) entries = entries.filter((e) => e.waterType === waterType);
  if (from) entries = entries.filter((e) => e.testDate >= from);
  if (to)   entries = entries.filter((e) => e.testDate <= to);

  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ entries, total: entries.length });
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { hospital, waterType, pou, testDate, testTime, technician, values, notes } = body;

    if (!hospital || !waterType || !pou || !testDate || !testTime) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Evaluate compliance
    const evaluation = evaluateST108Entry(waterType, values || {});

    // Build corrective action flags
    const corrections = [];
    if (evaluation.failures.length > 0) {
      for (const f of evaluation.failures) {
        const level = getCorrectionLevel(waterType, f.param?.key, f.value);
        corrections.push({
          param: f.param?.key,
          label: f.param?.label,
          value: f.value,
          limit: f.limit,
          level: level?.label || 'Action',
          requiresHalt: level?.label === 'Critical',
        });
      }
    }

    const entries = readEntries();
    const { randomUUID } = require('crypto');
    const entry = {
      id:           `st108_${randomUUID().slice(0, 8)}`,
      hospital,
      waterType,
      pou,
      testDate,
      testTime,
      technician,
      values:       values || {},
      notes:        notes || '',
      evaluation,
      corrections,
      submittedBy:  user.id,
      submittedByName: user.name || user.username,
      createdAt:    new Date().toISOString(),
      standard:     'ANSI/AAMI ST108:2023',
    };

    entries.push(entry);
    writeEntries(entries);

    // Audit log
    logAudit({
      type:     'st108',
      action:   'entry',
      userId:   user.id,
      username: user.username,
      entityId: entry.id,
      detail:   `ST108 ${waterType} entry â€” ${hospital} â€” ${evaluation.failCount > 0 ? evaluation.failCount + ' FAILURES' : 'ALL PASS'}`,
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}