/**
 * MedStar H2O "” Legionella / WMP Entries API
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / MedStar H2O. All rights reserved.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';
import { logAudit } from '@/lib/store';

const FILE = path.join(process.cwd(), 'data', 'legionella-entries.json');

function read()  { try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE,'utf8')) : []; } catch { return []; } }
function write(d){ fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf8'); }


export async function GET(req) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const hospital = searchParams.get('hospital');
  const from     = searchParams.get('from');
  const to       = searchParams.get('to');
  let entries = read();
  if (user.role !== 'admin' && user.hospital) entries = entries.filter(e => e.hospital === user.hospital);
  else if (hospital) entries = entries.filter(e => e.hospital === hospital);
  if (from) entries = entries.filter(e => e.testDate >= from);
  if (to)   entries = entries.filter(e => e.testDate <= to);
  entries.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ entries, total: entries.length });
}

export async function POST(req) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { hospital, systemType, location, testDate, testTime, technician, values, notes, corrective_action, actionLevel, requiresShutdown } = body;
    if (!hospital || !systemType || !testDate) return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    const { randomUUID } = require('crypto');
    const entries = read();
    const entry = {
      id: `leg_${randomUUID().slice(0,8)}`,
      hospital, systemType, location, testDate, testTime, technician,
      values: values || {}, notes: notes || '',
      corrective_action: corrective_action || '',
      actionLevel: actionLevel || null,
      requiresShutdown: requiresShutdown || false,
      submittedBy: user.id,
      submittedByName: user.name || user.username,
      createdAt: new Date().toISOString(),
      lockedAt: null,  // will be locked 24h after creation
      standard: 'ASHRAE 188-2018 / EC.02.05.02',
    };
    entries.push(entry);
    write(entries);
    logAudit({ type:'legionella', action:'entry', userId:user.id, username:user.username, entityId:entry.id,
      detail:`WMP ${systemType} entry "” ${hospital}${requiresShutdown ? ' "” SHUTDOWN REQUIRED' : ''}` });
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Server error.' }, { status: 500 }); }
}