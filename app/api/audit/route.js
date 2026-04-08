import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAuditLogs } from '@/lib/store';



export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type');
  const hospitalFilter = searchParams.get('hospital');
  const userFilter = searchParams.get('user');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const limitParam = parseInt(searchParams.get('limit') || '500', 10);

  let logs = getAuditLogs();

  if (typeFilter) {
    logs = logs.filter((l) => l.type === typeFilter);
  }
  if (hospitalFilter) {
    logs = logs.filter((l) => l.hospitalId === hospitalFilter);
  }
  if (userFilter) {
    logs = logs.filter((l) => l.username === userFilter);
  }
  if (fromDate) {
    logs = logs.filter((l) => l.createdAt >= fromDate);
  }
  if (toDate) {
    logs = logs.filter((l) => l.createdAt <= toDate + 'T23:59:59Z');
  }

  // Sort newest first
  logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply limit
  const total = logs.length;
  logs = logs.slice(0, limitParam);

  return NextResponse.json({ logs, total });
}