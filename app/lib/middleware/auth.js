/**
 * FacilityH2O — Auth Middleware (Improved Session Validation)
 * Author: Antoine W. Riley Sr.
 * © 2026 FacilityH2O Inc. All Rights Reserved.
 *
 * Wraps API route handlers with authenticated-session enforcement.
 * Validates session integrity, expiration, and role requirements.
 * Usage:
 *   export const GET = withAuth(handler);
 *   export const POST = withAuth(handler, { role: 'admin' });
 */

import { getUserFromRequest } from '@/lib/auth';

const SESSION_MAX_AGE_MS = (parseInt(process.env.SESSION_DURATION, 10) || 28800) * 1000;

/**
 * Extract and validate the session from a request.
 * Returns the user object or null.
 */
export async function getValidatedSession(request) {
  const user = await getUserFromRequest(request);
  if (!user) return null;

  // If the session carries an issuedAt timestamp, enforce max-age
  if (user.issuedAt) {
    const age = Date.now() - user.issuedAt;
    if (age > SESSION_MAX_AGE_MS) return null;
  }

  // Minimum fields required for a valid session
  if (!user.username || !user.role) return null;

  return user;
}

/**
 * Higher-order function that wraps a Next.js route handler with auth.
 *
 * @param {Function} handler          - The original (request, context) handler
 * @param {Object}   options
 * @param {string}   [options.role]   - Required role: 'admin' | 'operator' | 'superadmin'
 * @param {string[]} [options.roles]  - Accept any of these roles (alternative to role)
 * @returns Wrapped handler that returns 401/403 before the real handler runs
 */
export function withAuth(handler, options = {}) {
  return async function authWrapper(request, context) {
    const user = await getValidatedSession(request);

    if (!user) {
      return Response.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Role enforcement
    const allowedRoles = options.roles
      ? options.roles
      : options.role
      ? [options.role]
      : null;

    if (allowedRoles) {
      const ROLE_RANK = { operator: 1, admin: 2, superadmin: 3 };
      const userRank = ROLE_RANK[user.role] ?? 0;

      // Superadmin always passes role checks
      const passes =
        user.role === 'superadmin' ||
        allowedRoles.some((r) => {
          // Exact match OR user outranks the required role
          return user.role === r || userRank >= (ROLE_RANK[r] ?? 99);
        });

      if (!passes) {
        return Response.json(
          { error: 'You do not have permission to perform this action.' },
          { status: 403 }
        );
      }
    }

    // Attach user to request for downstream use
    request._user = user;

    return handler(request, context);
  };
}

/**
 * Shorthand wrappers for common role requirements.
 */
export const withAdminAuth = (handler) => withAuth(handler, { role: 'admin' });
export const withSuperAdminAuth = (handler) => withAuth(handler, { role: 'superadmin' });
export const withOperatorAuth = (handler) => withAuth(handler, { roles: ['operator', 'admin', 'superadmin'] });

/**
 * Asserts the user from a request is authenticated and optionally has the
 * required role. Throws a Response-like object if validation fails.
 * Useful for inline checks inside handlers that aren't wrapped with withAuth.
 *
 * @param {Request} request
 * @param {string|string[]} [requiredRole]
 * @returns {Promise<object>} user
 */
export async function requireAuth(request, requiredRole = null) {
  const user = await getValidatedSession(request);

  if (!user) {
    throw Response.json({ error: 'Authentication required.' }, { status: 401 });
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const ROLE_RANK = { operator: 1, admin: 2, superadmin: 3 };
    const userRank = ROLE_RANK[user.role] ?? 0;
    const passes =
      user.role === 'superadmin' ||
      roles.some((r) => user.role === r || userRank >= (ROLE_RANK[r] ?? 99));

    if (!passes) {
      throw Response.json(
        { error: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }
  }

  return user;
}
