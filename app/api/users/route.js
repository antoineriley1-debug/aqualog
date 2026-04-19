/**
 * MedStar H2O â€” MedStar Health Water Chemistry Portal
 * Author & Owner: Antoine Riley
 * Â© 2026 Antoine Riley / MedStar H2O. All rights reserved.
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest, getAllUsers, addUser, getUsersForAdmin, SUPER_ADMIN_ID } from '@/lib/auth';
import { logAudit } from '@/lib/store';



export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Super-admin sees all; regular admins see operators + own account only
  const visible = getUsersForAdmin(user).map(({ password: _pw, ...u }) => u);
  return NextResponse.json({ users: visible, isSuperAdmin: user.id === SUPER_ADMIN_ID });
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { username, password, hospital, name, role, email } = body;
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required.' }, { status: 400 });
    }
    // Only super-admin can create other admin accounts
    if (role === 'admin' && user.id !== SUPER_ADMIN_ID) {
      return NextResponse.json({ error: 'Only the system owner can create admin accounts.' }, { status: 403 });
    }
    const all = getAllUsers();
    if (all.find((u) => u.username === username)) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
    }
    const newUser = addUser({ username, password, hospital, name, role, email });
    const { password: _pw, ...safe } = newUser;

    // Audit log
    logAudit({
      type: 'user',
      action: 'create',
      userId: user.id,
      username: user.username,
      entityId: newUser.id,
      entityType: 'user',
      detail: `Created user ${username} (${role || 'operator'})`,
      targetUsername: username,
    });

    return NextResponse.json({ success: true, user: safe }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}