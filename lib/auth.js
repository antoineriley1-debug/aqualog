/**
 * FacilityH2O — FacilityH2O Inc. Water Chemistry Portal
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 * Unauthorized access, copying, or distribution of this code is prohibited.
 */

import fs from 'fs';
import path from 'path';

// Super-admin: only this account has unrestricted visibility into all users and credentials.
// All other admins are scoped: they see hospital info and can reset operator passwords only.
export const SUPER_ADMIN_ID = 'usr_ariley';
export const SUPER_ADMIN_USERNAME = 'ariley';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// ⚠️  SECURITY WARNING — PRODUCTION BLOCKER
// FALLBACK_USERS contains plaintext passwords visible in source control.
// Before deploying to production:
//   1. Remove all entries below and migrate all users to the Supabase `users` table
//      with bcrypt-hashed passwords (use bcrypt.hash(password, 12)).
//   2. Update validateUser() to compare bcrypt hashes (bcrypt.compare).
//   3. Delete this array entirely — there must be no plaintext credentials in code.
//   4. The pre-deploy-check.js script will FAIL if this array still contains passwords.
//
// For local dev only — these credentials must never reach a production environment.
// DO NOT ADD NEW USERS HERE. Add them through the /api/users endpoint instead.
// PRODUCTION: All user credentials are stored in data/users.json with bcrypt hashing.
// No passwords in source code.
const FALLBACK_USERS = [];

function readUsers() {
  try {
    const fileExists = fs.existsSync(USERS_FILE);
    console.log(`[auth.js] Checking for users file at: ${USERS_FILE}`);
    console.log(`[auth.js] File exists: ${fileExists}`);
    
    if (!fileExists) {
      console.log(`[auth.js] USERS_FILE not found, returning FALLBACK_USERS (empty)`);
      return FALLBACK_USERS;
    }
    
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(content);
    console.log(`[auth.js] Successfully loaded ${users.length} users from file`);
    return users.length > 0 ? users : FALLBACK_USERS;
  } catch (err) {
    console.error(`[auth.js] ERROR reading users file:`, err.message);
    return FALLBACK_USERS;
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch {
    // Read-only filesystem (Vercel serverless) — write is a no-op
  }
}

export function getAllUsers() {
  return readUsers();
}

/**
 * Returns users visible to the requesting admin.
 * Super-admin (ariley): sees all users including other admins and their credentials.
 * Regular admin: sees only operators (no admin accounts, no passwords).
 */
export function getUsersForAdmin(requestingUser) {
  const all = readUsers();
  if (!requestingUser) return [];

  // Super-admin sees everything
  if (requestingUser.id === SUPER_ADMIN_ID) {
    return all; // passwords stripped at API layer
  }

  // Regular admin: operators only, own account only from admins
  return all.filter(
    (u) => u.role === 'operator' || u.id === requestingUser.id
  );
}

/**
 * Returns true if the requesting user can manage (edit/delete/toggle) the target user.
 * Super-admin can manage anyone.
 * Regular admin can only manage operators.
 */
export function canManageUser(requestingUser, targetUser) {
  if (!requestingUser || !targetUser) return false;
  if (requestingUser.id === SUPER_ADMIN_ID) return true;
  // Regular admins can only manage operators, not other admins
  return targetUser.role === 'operator';
}

export function validateUser(username, password) {
  const users = readUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password && u.active !== false
  );
  if (!user) return null;
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

export function getUserFromCookie(cookieValue) {
  if (!cookieValue) return null;
  try {
    return JSON.parse(cookieValue);
  } catch {
    return null;
  }
}

export function addUser(data) {
  const users = readUsers();
  const { randomUUID } = require('crypto');
  const newUser = {
    id: `usr_${randomUUID().slice(0, 8)}`,
    username: data.username,
    password: data.password,
    role: data.role || 'operator',
    hospital: data.hospital || null,
    name: data.name || data.username,
    email: data.email || null,
    active: true,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

export function updateUser(id, patch) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  writeUsers(users);
  const { password: _pw, ...safe } = users[idx];
  return safe;
}

export function deleteUser(id) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  writeUsers(users);
  return true;
}

/**
 * Primary auth helper for all API routes.
 * Supports both cookie (web browser) and X-Aqualog-User header (mobile app).
 * Pass the NextRequest object from the route handler.
 */
export async function getUserFromRequest(request) {
  try {
    // 1. Mobile: X-Aqualog-User header
    if (request?.headers) {
      const headerUser = request.headers.get('x-facilityh2o-user');
      if (headerUser) {
        try {
          const u = JSON.parse(headerUser);
          if (u && u.username && u.id) return u;
        } catch {}
      }
    }
    // 2. Web: cookie — try direct cookie header first, then next/headers fallback
    const cookieHeader = request.headers?.get?.('cookie') || '';
    if (cookieHeader) {
      const match = cookieHeader.match(/FacilityH2O_user=([^;]+)/);
      if (match && match[1]) {
        try {
          return getUserFromCookie(decodeURIComponent(match[1]));
        } catch {}
      }
    }
    // 3. Fallback: try next/headers (server context)
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      const cookie = cookieStore.get('FacilityH2O_user');
      return getUserFromCookie(cookie?.value);
    } catch {
      // next/headers may not be available in all contexts
    }
    return null;
  } catch {
    return null;
  }
}

// Legacy alias kept for compatibility
export async function getSession(request) {
  return getUserFromRequest(request);
}
