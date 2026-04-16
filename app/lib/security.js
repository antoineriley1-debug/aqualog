/**
 * FacilityH2O — Security Utilities
 * Author: Antoine W. Riley Sr.
 * © 2026 FacilityH2O Inc. All Rights Reserved.
 * 
 * CSRF protection, input sanitization, error handling, secrets rotation.
 */

import crypto from 'crypto';
import { NextResponse } from 'next/server';

// ════════════════════════════════════════════════════════════════════════════════
// CSRF PROTECTION
// ════════════════════════════════════════════════════════════════════════════════

const csrfTokenStore = new Map();

/**
 * Generate a CSRF token for a session
 */
export function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokenStore.set(sessionId, {
    token: crypto.createHash('sha256').update(token).digest('hex'),
    createdAt: Date.now(),
  });
  return token; // Send this to frontend
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(sessionId, token) {
  const stored = csrfTokenStore.get(sessionId);
  
  if (!stored) return false;
  
  // Token expires after 1 hour
  if (Date.now() - stored.createdAt > 3600000) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenHash === stored.token;
}

/**
 * CSRF middleware for POST/PUT/DELETE requests
 */
export async function withCSRFProtection(request) {
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return null; // No CSRF check needed for GET
  }
  
  const sessionId = request.cookies.get('FacilityH2O_user')?.value;
  const token = request.headers.get('x-csrf-token');
  
  if (!sessionId || !token || !verifyCSRFToken(sessionId, token)) {
    return Response.json(
      { error: 'CSRF token validation failed' },
      { status: 403 }
    );
  }
  
  return null; // Token is valid
}

// ════════════════════════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj) {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// ════════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING (Sanitized)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Production-safe error response
 * Logs full error internally, returns generic message to client
 */
export function handleError(error, context = {}) {
  const errorId = crypto.randomUUID();
  
  // Log full error with context (for debugging)
  console.error(`[${errorId}] Error:`, {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // Return safe error to client
  return Response.json(
    {
      error: 'An error occurred while processing your request.',
      errorId, // User can reference this for support
    },
    { status: 500 }
  );
}

/**
 * Validation error response (safe to show details)
 */
export function validationError(errors) {
  return Response.json(
    {
      error: 'Validation failed',
      details: errors, // Safe to show validation details
    },
    { status: 400 }
  );
}

/**
 * Authentication error response
 */
export function authError(message = 'Authentication required') {
  return Response.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Authorization error response
 */
export function forbiddenError(message = 'You do not have permission to perform this action') {
  return Response.json(
    { error: message },
    { status: 403 }
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECRETS ROTATION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validate that secrets are not exposed in code.
 * Scans all JS/TS source files under a root directory.
 * Returns { success, issues } — safe to log, never throws.
 *
 * @param {string} rootDir - Absolute path to project root (Node.js only)
 */
export async function validateSecretsNotExposed(rootDir) {
  // Import dynamically so this module stays Edge-compatible when rootDir is absent
  if (!rootDir) {
    return { success: true, issues: [], skipped: true };
  }

  const { default: fs } = await import('fs');
  const { default: path } = await import('path');

  /** Patterns that indicate a real secret value hardcoded in source */
  const FORBIDDEN = [
    { label: 'Resend API key',         pattern: /re_[A-Za-z0-9_]{20,}/g },
    { label: 'Stripe secret key',      pattern: /sk_(live|test)_[A-Za-z0-9]{24,}/g },
    { label: 'GitHub PAT',             pattern: /ghp_[A-Za-z0-9]{36}/g },
    { label: 'Twilio auth token',      pattern: /TWILIO_AUTH_TOKEN\s*=\s*['"][^'"]{10,}['"]/g },
    { label: 'Session secret literal', pattern: /SESSION_SECRET\s*=\s*['"][^'"]{10,}['"]/g },
    { label: 'Supabase service key',   pattern: /eyJ[A-Za-z0-9_-]{50,}/g }, // JWT prefix
    { label: 'Plaintext password map', pattern: /password\s*:\s*['"][^'"]{4,}['"]/g },
  ];

  /** File extensions to scan */
  const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

  /** Directories to skip */
  const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.vercel']);

  const issues = [];

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
        continue;
      }
      if (!EXTENSIONS.has(path.extname(entry.name))) continue;

      const filePath = path.join(dir, entry.name);
      let content;
      try { content = fs.readFileSync(filePath, 'utf8'); } catch { continue; }

      for (const { label, pattern } of FORBIDDEN) {
        pattern.lastIndex = 0;
        const match = pattern.exec(content);
        if (match) {
          issues.push({
            file: path.relative(rootDir, filePath),
            label,
            excerpt: match[0].slice(0, 60),
          });
        }
      }
    }
  }

  walk(rootDir);

  return { success: issues.length === 0, issues };
}

/**
 * Generate a cryptographically secure secret
 */
export function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a secret for storage (bcrypt would be better)
 */
export function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// ════════════════════════════════════════════════════════════════════════════════
// SESSION SECURITY
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Create a secure session cookie
 */
export function createSessionCookie(userId, role, sessionData = {}) {
  const sessionId = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('hex');
  
  return {
    sessionId,
    token: hashSecret(token), // Store hash only
    cookie: {
      name: 'FacilityH2O_user',
      value: JSON.stringify({
        userId,
        role,
        sessionId,
        issuedAt: Date.now(),
        ...sessionData,
      }),
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'Strict', // CSRF protection
      maxAge: 8 * 3600, // 8 hours
    },
  };
}

/**
 * Validate session and return user data or null
 */
export function validateSession(cookieValue) {
  try {
    const session = JSON.parse(cookieValue);
    
    // Check expiration (8 hours)
    const age = Date.now() - session.issuedAt;
    if (age > 8 * 3600 * 1000) {
      return null; // Session expired
    }
    
    return session;
  } catch {
    return null; // Invalid session format
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Create audit log entry for a mutation
 * Call this in all POST/PUT/DELETE handlers
 */
export async function logAudit(supabase, {
  orgId,
  userId,
  tableName,
  recordId,
  operation, // CREATE, UPDATE, DELETE, BACKDATE
  oldValues = null,
  newValues = null,
  reason = null,
  request = null,
}) {
  try {
    const ip = request?.headers?.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = request?.headers?.get('user-agent') || '';
    
    await supabase.from('audit_log').insert({
      org_id: orgId,
      table_name: tableName,
      record_id: recordId,
      operation,
      user_id: userId,
      old_values: oldValues,
      new_values: newValues,
      reason,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't fail the request if audit logging fails
  }
}

