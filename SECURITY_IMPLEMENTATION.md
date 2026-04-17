# FacilityH2O Security Implementation Guide

**Status:** 🚨 CRITICAL - Security hardening in progress
**Last Updated:** April 16, 2026
**Author:** Antoine W. Riley Sr. (with security team assistance)

---

## 🚨 IMMEDIATE ACTIONS REQUIRED (DO THIS NOW)

### 1. Git Security — Token Exposure
**Priority:** CRITICAL - Action Required NOW

The GitHub PAT is exposed in your git remote URL. This is a **live security breach**.

```bash
# Check what's exposed
git remote -v

# Expected output:
# origin	https://ghp_xxxxx...@github.com/antoineriley1-debug/facilityh2o.git
```

**ACTION ITEMS (in order):**

1. **Revoke the exposed token NOW:**
   - Go to https://github.com/settings/tokens
   - Find and delete any token matching what's in your git remote
   - GitHub will immediately invalidate it

2. **Generate new GitHub PAT:**
   - Go to https://github.com/settings/tokens/new
   - Name: "facilityh2o-deployment"
   - Scopes: `repo` (full control of private repos)
   - Copy and save it (you'll only see it once)

3. **Switch to SSH (recommended):**
   ```bash
   # Generate SSH key if needed
   ssh-keygen -t ed25519 -C "your-email@example.com"
   
   # Add to GitHub: https://github.com/settings/keys
   
   # Update git remote to use SSH
   git remote set-url origin git@github.com:antoineriley1-debug/facilityh2o.git
   
   # Verify it's clean
   git remote -v
   ```

4. **OR update to use new token (temporary):**
   ```bash
   git remote set-url origin https://YOUR_NEW_TOKEN@github.com/antoineriley1-debug/facilityh2o.git
   ```

5. **Verify remote is clean:**
   ```bash
   git remote -v
   # Should show NO credentials in the URL
   ```

6. **Run the security fix script:**
   ```bash
   bash scripts/fix-git-security.sh
   ```

---

### 2. Environment Secrets Rotation
**Priority:** CRITICAL - Complete today

ALL of these secrets may be compromised if the git token was accessible:

```
❌ RESEND_API_KEY
❌ SESSION_SECRET
❌ CRON_SECRET
❌ STRIPE_SECRET_KEY
❌ TWILIO_AUTH_TOKEN
```

**ACTION ITEMS:**

1. **Resend (Email Alerts):**
   - Go to https://resend.com/api-keys
   - Create a new API key
   - Copy the new key to:
     - GitHub Secrets: `RESEND_API_KEY`
     - Vercel Environment Variables: `RESEND_API_KEY`

2. **Stripe (if using billing):**
   - Go to https://dashboard.stripe.com/apikeys
   - Generate new restricted API key
   - Rotate in GitHub Secrets & Vercel

3. **Twilio (if using SMS):**
   - Go to https://www.twilio.com/console/account/auth-tokens
   - Generate new token
   - Rotate in GitHub Secrets & Vercel

4. **Session Secret:**
   ```bash
   # Generate new random secret
   openssl rand -hex 32
   # Output: abc123def456...
   
   # Update in GitHub Secrets and Vercel
   # Name: SESSION_SECRET
   # Value: abc123def456...
   ```

5. **CRON Secret:**
   ```bash
   # Generate new secret
   openssl rand -hex 32
   
   # Update in:
   # - GitHub Secrets: CRON_SECRET
   # - Vercel Environment: CRON_SECRET
   # - EasyCron / AWS EventBridge config
   ```

---

### 3. Git History Cleanup (Optional but Recommended)
**Priority:** MEDIUM - Complete this week

If token was in git history:

```bash
# Check if token is in history
git log --all -p | grep "ghp_"

# If found, rewrite history (FORCE PUSH REQUIRED)
# Use git-filter-repo: https://github.com/newren/git-filter-repo
# DO NOT use git filter-branch (slow, error-prone)

# After cleanup, force push:
git push --force-with-lease
```

---

## 📋 Security Features Implemented

### 1. ✅ Database Security (Supabase)

**What's been done:**
- ✅ RLS (Row Level Security) enabled on ALL tables
- ✅ Fine-grained policies for admin/operator/superadmin roles
- ✅ Audit log table for tracking all mutations
- ✅ Chemistry entries support for past-date updates with mandatory reason
- ✅ Automatic audit trail on entry modifications

**What you need to do:**
```sql
-- Run this in Supabase SQL editor:
-- 1. Copy the entire contents of: supabase_schema.sql
-- 2. Paste into Supabase SQL editor
-- 3. Click "Run" to execute

-- THEN TEST:
-- 1. Try to access entries as an operator (should only see own facility)
-- 2. Try to access entries as an admin (should see all in their org)
-- 3. Try to create a backdated entry (should require missed_reason)
-- 4. Check audit_log table (should have entries for all mutations)
```

**RLS Policies Implemented:**
- Operators: Can only see/edit entries for their assigned facilities
- Admins: Can see/edit all entries in their organization
- Superadmins: Can see/edit everything
- Audit log: Read-only to frontend (backend only)

### 2. ✅ Backend Security

**Rate Limiting:** `/app/lib/middleware/rateLimit.js`
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per minute
- Upload endpoints: 20 requests per minute
- **STATUS:** ✅ Implemented, ready to integrate

**Input Validation:** `/app/lib/schemas.js`
- Zod schemas for all inputs
- Prevents SQL injection, XSS, malformed data
- **STATUS:** ✅ Implemented, ready to integrate

**CSRF Protection:** `/app/lib/security.js`
- Token generation and verification
- SameSite cookie flags
- **STATUS:** ✅ Implemented, ready to integrate

**Error Handling:** `/app/lib/security.js`
- Sanitized errors (no stack traces to client)
- Error IDs for support reference
- **STATUS:** ✅ Implemented, ready to integrate

**Audit Logging:** `/app/lib/security.js`
- Logs all mutations (CREATE, UPDATE, DELETE, BACKDATE)
- Includes user ID, IP, user agent, reason for change
- **STATUS:** ✅ Implemented, ready to integrate

### 3. ✅ Frontend Security

**Code Obfuscation:** `next.config.mjs`
- ✅ SWC minification enabled
- ✅ Source maps disabled in production
- ✅ Console.logs removed in production
- ✅ Headers configured (X-Frame-Options, X-Content-Type-Options, etc)

**Environment Variables:** `.env.example`
- ✅ Comprehensive template with no secrets
- ✅ Clear documentation on what goes where
- ✅ Instructions for GitHub Secrets & Vercel

**API Versioning:**
- Structure ready for `/api/v1/` endpoint prefixing
- Allows graceful deprecation of old endpoints

---

## 🔧 Integration Checklist

### Phase 1: Database (This Week)
- [ ] Run `supabase_schema.sql` in Supabase SQL editor
- [ ] Verify RLS policies are created
- [ ] Test RLS with different user roles
- [ ] Verify audit_log table exists
- [ ] Test backdated entry insertion

### Phase 2: Backend Security (This Week)
- [ ] Add `zod` to package.json: `npm install zod`
- [ ] Import validation schemas in all API routes
- [ ] Add rate limiting to API route handlers
- [ ] Add CSRF protection to form endpoints
- [ ] Test rate limiting (`curl` in rapid succession)
- [ ] Test CSRF protection (should reject invalid tokens)
- [ ] Update error handling (catch and sanitize)

**Example API route with security:**

```javascript
// app/api/entries/route.js
import { validateInput, ChemistryEntrySchema } from '@/lib/schemas';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { withCSRFProtection, logAudit, handleError } from '@/lib/security';

async function handler(request, { params }) {
  // Check CSRF
  const csrfError = await withCSRFProtection(request);
  if (csrfError) return csrfError;
  
  // Validate input
  const body = await request.json();
  const validation = await validateInput(ChemistryEntrySchema, body);
  if (!validation.success) {
    return Response.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 }
    );
  }
  
  try {
    // Process request...
    
    // Log to audit trail
    await logAudit(supabase, {
      orgId: user.org_id,
      userId: user.id,
      tableName: 'chemistry_entries',
      recordId: newEntry.id,
      operation: 'CREATE',
      newValues: newEntry,
      request,
    });
    
    return Response.json(newEntry);
  } catch (error) {
    return handleError(error, { endpoint: '/api/entries', method: 'POST' });
  }
}

// Apply rate limiting
export const POST = withRateLimit(handler, 'api');
```

### Phase 3: Testing (Next Week)
- [ ] Run pre-deployment checks: `npm run pre-deploy`
- [ ] Run security tests: `npm run test:security`
- [ ] Manual test: Try SQL injection (`'; DROP TABLE users; --`)
- [ ] Manual test: Try XSS (`<script>alert('xss')</script>`)
- [ ] Manual test: Try CSRF (forge request without token)
- [ ] Manual test: Try rate limit bypass (rapid requests)

### Phase 4: Deployment (After Testing)
- [ ] Set GitHub Secrets (all rotated values)
- [ ] Set Vercel Environment Variables (all rotated values)
- [ ] Disable source maps: verify in Vercel build
- [ ] Test on staging before production
- [ ] Monitor logs after deploy

---

## 📚 File Reference

### New Security Files Created

| File | Purpose | Status |
|------|---------|--------|
| `supabase_schema.sql` | Database schema with RLS | ✅ Ready to deploy |
| `app/lib/schemas.js` | Zod validation schemas | ✅ Ready to integrate |
| `app/lib/middleware/rateLimit.js` | Rate limiting middleware | ✅ Ready to integrate |
| `app/lib/security.js` | CSRF, sanitization, error handling | ✅ Ready to integrate |
| `.env.example` | Environment variables template | ✅ Ready to use |
| `scripts/pre-deploy-check.js` | Pre-deployment security validation | ✅ Ready to run |
| `scripts/fix-git-security.sh` | Git security remediation | ✅ Ready to run |
| `SECURITY_HARDENING.md` | Detailed hardening plan | ✅ Reference document |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Added zod dependency, pre-deploy script |
| `next.config.mjs` | Already has security headers & minification |
| `.gitignore` | Already has .env patterns |

---

## 🔍 Verification Commands

After implementing each phase, verify with:

```bash
# Check pre-deployment validation
npm run pre-deploy

# Check for security vulnerabilities in dependencies
npm audit

# Run security tests
npm run test:security

# Check rate limiting
curl http://localhost:3000/api/entries (run 101 times quickly)
# Should get 429 Too Many Requests on 101st request

# Check CSRF protection
curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{}' \
  # Should get 403 Forbidden (no CSRF token)

# Check git remote is clean
git remote -v
# Should show NO credentials in URL
```

---

## 🆘 Troubleshooting

**"CSRF token validation failed"**
- Check that frontend is sending `X-CSRF-Token` header
- Check that CSRF token is valid (not expired)
- Verify cookie is being set correctly

**"Rate limit exceeded"**
- Expected behavior after too many requests
- Wait 60 seconds for window to reset
- Check `X-RateLimit-Remaining` header

**"Validation failed"**
- Check that input matches schema requirements
- Look at `details` array for specific field errors
- Verify data types (strings, numbers, dates)

**RLS policy not working**
- Verify RLS is enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Check Supabase JWT claims match policy conditions
- Test with different user roles

---

## 📞 Support & Questions

For security questions or issues:
1. Check logs in Vercel/Render dashboards
2. Check Supabase audit logs
3. Reference the error ID from error responses
4. Check GitHub issues or project documentation

---

## ⚠️ Remember

This security implementation is **ongoing**. Regular audits, dependency updates, and secret rotations are essential for maintaining security posture.

**Key principles:**
- ✅ Never commit secrets to git
- ✅ Rotate secrets regularly
- ✅ Validate all user input
- ✅ Sanitize all output
- ✅ Log all mutations
- ✅ Use HTTPS only
- ✅ Enable RLS on all tables
- ✅ Test security measures frequently

---

**Last reviewed:** April 16, 2026
**Next review:** May 16, 2026 (monthly)

