/**
 * FacilityH2O — ST108 Audits API
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';
import { logAudit } from '@/lib/store';

const AUDITS_FILE = path.join(process.cwd(), 'data', 'st108-audits.json');

function readAudits() {
  try {
    if (!fs.existsSync(AUDITS_FILE)) return [];
    return JSON.parse(fs.readFileSync(AUDITS_FILE, 'utf8'));
  } catch { return []; }
}

function writeAudits(audits) {
  fs.writeFileSync(AUDITS_FILE, JSON.stringify(audits, null, 2), 'utf8');
}



export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const audits = readAudits().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ audits });
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { hospital, auditor, auditDate, responses, comments, score } = body;

    const audits = readAudits();
    const { randomUUID } = require('crypto');
    const audit = {
      id:         `audit_${randomUUID().slice(0, 8)}`,
      hospital,   auditor, auditDate, responses, comments, score,
      standard:   'ANSI/AAMI ST108:2023',
      savedBy:    user.id,
      savedByName:user.name || user.username,
      createdAt:  new Date().toISOString(),
    };

    audits.push(audit);
    writeAudits(audits);

    logAudit({
      type: 'st108', action: 'audit',
      userId: user.id, username: user.username, entityId: audit.id,
      detail: `ST108 Self-Audit saved — ${hospital} — score: ${score}%`,
    });

    return NextResponse.json({ success: true, audit }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
