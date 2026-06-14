/**
 * User management by ID — PATCH (update password / active / profile / role) and DELETE.
 *
 * The Users page calls /api/users/{id} with PATCH (reset password, toggle active) and DELETE
 * (remove user). Without this route those calls 404'd, so password reset, activate/deactivate,
 * and delete were all silently broken. This restores them, with proper admin scoping and
 * super-admin protection.
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest, getAllUsers, updateUser, deleteUser, canManageUser, SUPER_ADMIN_ID } from '@/lib/auth';
import { logAudit } from '@/lib/store';

export async function PATCH(request, { params }) {
  const requester = await getUserFromRequest(request);
  if (!requester || requester.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  }

  const { id } = params;
  const target = (getAllUsers() || []).find(u => u.id === id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (!canManageUser(requester, target)) {
    return NextResponse.json({ error: 'You do not have permission to manage this user.' }, { status: 403 });
  }

  const body = await request.json();
  const patch = {};

  // Password change
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    patch.password = body.password;
  }

  // Active toggle — the owner account can never be deactivated
  if (body.active !== undefined) {
    if (target.id === SUPER_ADMIN_ID && body.active === false) {
      return NextResponse.json({ error: 'The owner account cannot be deactivated.' }, { status: 400 });
    }
    patch.active = !!body.active;
  }

  // Profile fields anyone managing the user may edit
  for (const f of ['name', 'hospital', 'email']) {
    if (body[f] !== undefined) patch[f] = body[f];
  }

  // Role changes are restricted to the owner (super-admin)
  if (body.role !== undefined) {
    if (requester.id !== SUPER_ADMIN_ID) {
      return NextResponse.json({ error: 'Only the owner can change a user\'s role.' }, { status: 403 });
    }
    if (target.id === SUPER_ADMIN_ID && body.role !== 'admin') {
      return NextResponse.json({ error: 'The owner must remain an admin.' }, { status: 400 });
    }
    patch.role = body.role;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const updated = updateUser(id, patch);  // updateUser strips the password from its return value
  logAudit({
    type: 'user', action: 'update',
    userId: requester.id, username: requester.username,
    entityId: id, entityType: 'user',
    detail: `Updated ${target.username}: ${Object.keys(patch).join(', ')}`,
  });
  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE(request, { params }) {
  const requester = await getUserFromRequest(request);
  if (!requester || requester.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  }

  const { id } = params;
  if (id === SUPER_ADMIN_ID) {
    return NextResponse.json({ error: 'The owner account cannot be deleted.' }, { status: 400 });
  }

  const target = (getAllUsers() || []).find(u => u.id === id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (!canManageUser(requester, target)) {
    return NextResponse.json({ error: 'You do not have permission to manage this user.' }, { status: 403 });
  }
  if (target.id === requester.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  deleteUser(id);
  logAudit({
    type: 'user', action: 'delete',
    userId: requester.id, username: requester.username,
    entityId: id, entityType: 'user',
    detail: `Removed ${target.username}`,
  });
  return NextResponse.json({ ok: true });
}
