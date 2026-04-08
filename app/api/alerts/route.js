import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAllAlerts, acknowledgeAlert, logAudit } from '@/lib/store';



export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const hospitalFilter = searchParams.get('hospital');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const ackFilter = searchParams.get('acknowledged');

  let alerts = getAllAlerts();

  if (hospitalFilter) {
    alerts = alerts.filter((a) => a.hospitalId === hospitalFilter);
  }
  if (fromDate) {
    alerts = alerts.filter((a) => a.date >= fromDate);
  }
  if (toDate) {
    alerts = alerts.filter((a) => a.date <= toDate);
  }
  if (ackFilter === 'false') {
    alerts = alerts.filter((a) => !a.acknowledged);
  } else if (ackFilter === 'true') {
    alerts = alerts.filter((a) => a.acknowledged);
  }

  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return NextResponse.json({ alerts });
}

export async function PATCH(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { alertId } = body;
    if (!alertId) {
      return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    }

    const updated = acknowledgeAlert(alertId);
    if (!updated) {
      return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
    }

    logAudit({
      type: 'alert',
      action: 'acknowledge',
      userId: user.id,
      username: user.username,
      hospitalId: updated.hospitalId,
      entityId: alertId,
      entityType: 'alert',
      detail: `Acknowledged alert for ${updated.hospitalId} ${updated.system} on ${updated.date}`,
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}