import { cookies } from 'next/headers';
import { getUserByUsername } from './store';

const SUPER_ADMIN = {
  id: 'usr_superadmin',
  username: 'ariley',
  password: '51351853',
  role: 'superadmin',
  orgId: null,
  name: 'Antoine Riley',
  email: 'ariley@facilityh2o.com',
  facilities: null,
};

const SESSION_SECRET = process.env.SESSION_SECRET || 'facilityh2o_dev_secret_32chars!!';

// Simple base64 session token (production would use JWT or signed cookies)
export function createSessionToken(user) {
  const payload = {
    id: user.id,
    username: user.username || user.email,
    role: user.role,
    orgId: user.orgId,
    name: user.name,
    facilities: user.facilities,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseSessionToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function validateCredentials(username, password) {
  // Check super admin
  if (
    (username === SUPER_ADMIN.username || username === SUPER_ADMIN.email) &&
    password === SUPER_ADMIN.password
  ) {
    return SUPER_ADMIN;
  }
  // Check file-based users
  const user = getUserByUsername(username);
  if (!user) return null;
  if (user.password !== password) return null; // plain text for prototype
  if (user.active === false) return null;
  return user;
}

export async function getSession() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('facilityh2o_session')?.value;
    if (!token) return null;
    return parseSessionToken(token);
  } catch {
    return null;
  }
}

export function isSuperAdmin(session) {
  return session?.role === 'superadmin';
}

export function isAdmin(session) {
  return session?.role === 'admin' || session?.role === 'superadmin';
}

export function canAccessFacility(session, facilityId) {
  if (!session) return false;
  if (session.role === 'superadmin') return true;
  if (session.role === 'admin') return true; // admin sees all org facilities
  if (!session.facilities) return true; // operator with no restriction
  return session.facilities.includes(facilityId);
}
