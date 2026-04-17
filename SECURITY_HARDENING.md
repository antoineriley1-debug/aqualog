# FacilityH2O Security Hardening Plan

## 🚨 IMMEDIATE ACTIONS (Priority 1)

### 1. Git Remote Token Exposure
**Status:** CRITICAL
- [ ] Revoke exposed GitHub PAT (old token in git remote URL)
- [ ] Generate new GitHub PAT with minimal scopes
- [ ] Update git remote to use SSH or new token (store in GitHub secrets, never in URL)
- [ ] Audit git log for token exposure
- [ ] Force push to remove token from history (or rewrite)

### 2. Environment Variables Exposure
**Status:** HIGH
- [ ] Create `.env.local.example` (never commit actual .env)
- [ ] Verify `.env` and `.env.local` are in `.gitignore`
- [ ] Scan git history for leaked secrets (resend key, session secret, etc.)
- [ ] Rotate all exposed keys:
  - RESEND_API_KEY
  - SESSION_SECRET
  - CRON_SECRET
  - Any Stripe keys, Twilio keys, etc.

---

## 🔒 BACKEND SECURITY (Next.js API Routes)

### 3. API Security Hardening
- [ ] Rate limiting on all endpoints (express-rate-limit or custom)
- [ ] Request validation (zod schemas)
- [ ] CSRF protection
- [ ] API key rotation & versioning
- [ ] Remove verbose error messages in production (log internally, return generic errors)
- [ ] Add request signing/HMAC verification for sensitive endpoints
- [ ] Input sanitization (SQL injection, XSS prevention)
- [ ] Output encoding

### 4. Authentication & Authorization
- [ ] Session validation on every request (not just from middleware)
- [ ] JWT or secure session tokens (never plain JSON in cookies)
- [ ] Implement proper token expiration & refresh
- [ ] Audit user permissions in all routes (double-check role checks)
- [ ] Remove hardcoded credentials from environment
- [ ] Implement password hashing (bcrypt min 12 rounds)

### 5. Database Security
- [ ] Enable RLS (Row Level Security) on ALL tables
- [ ] Create proper RLS policies (admin/operator/superadmin tiers)
- [ ] Encrypt sensitive columns at rest (patient names, email, etc.)
- [ ] Audit Supabase JWT claims in policies
- [ ] Disable public access to tables
- [ ] Enable audit logging on modifications
- [ ] Backup encryption

### 6. Logging & Monitoring
- [ ] Audit log all mutations (creates, updates, deletes, past-date changes)
- [ ] Log failed auth attempts
- [ ] Log API access with timestamps & user ID
- [ ] Implement alerts for suspicious activity
- [ ] Never log sensitive data (passwords, tokens, etc.)

---

## 🎨 FRONTEND SECURITY

### 7. Code Obfuscation & Minification
- [ ] Enable source map removal (already done in next.config)
- [ ] Add terser obfuscation plugin
- [ ] Minify CSS & JS aggressively
- [ ] Remove console.log in production (already done)
- [ ] Obfuscate API endpoint URLs / sensitive constants
- [ ] Use environment variables for API base URLs

### 8. Secret Management (Frontend)
- [ ] Move sensitive constants to `NEXT_PUBLIC_*` env vars (only non-sensitive ones!)
- [ ] **Never** put API keys in frontend code
- [ ] **Never** expose database URLs, admin endpoints, etc.
- [ ] Implement CSP (Content Security Policy) headers
- [ ] Add X-Content-Type-Options, X-Frame-Options (already done)

### 9. XSS Prevention
- [ ] Use React's built-in escaping (already safe)
- [ ] Sanitize HTML input (DOMPurify if needed)
- [ ] CSP headers with nonce for inline scripts
- [ ] Disable dangerous eval, Function constructor

### 10. CSRF Protection
- [ ] Implement CSRF tokens in forms
- [ ] Validate origin/referer headers
- [ ] Use SameSite cookies (Strict or Lax)

---

## 🔐 DEPLOYMENT & INFRASTRUCTURE

### 11. Environment Isolation
- [ ] Separate dev/staging/prod environments
- [ ] Use different Supabase projects per environment
- [ ] Rotate credentials per environment
- [ ] Use GitHub secrets (not committed values)
- [ ] Encrypt secrets in Vercel environment variables

### 12. Build Security
- [ ] Run build on CI/CD pipeline (GitHub Actions)
- [ ] Disable source map uploads in production
- [ ] Scan dependencies for vulnerabilities (npm audit, snyk)
- [ ] Pin dependency versions (no floating ~, ^)
- [ ] Code signing for releases

### 13. Render.yaml & Deployment Security
- [ ] Don't expose database URL in deploy configs
- [ ] Use Render environment secrets (not hardcoded)
- [ ] Enable HTTPS only
- [ ] Implement DDoS protection
- [ ] Rate limit at infrastructure level

### 14. API Endpoint Obfuscation
- [ ] Rename API routes to be non-descriptive (e.g., `/api/v1/data` not `/api/chemistry-entries`)
- [ ] Use POST for queries that might be cached
- [ ] Implement API versioning `/api/v1/`, `/api/v2/` (rotate old versions out)
- [ ] Add request fingerprinting to prevent enumeration attacks

---

## 🛡️ MISSED ENTRY AUDIT TRAIL FEATURE

### 15. Past-Date Entry Updates
- [ ] Allow entries to be updated on past dates ONLY by:
  - [ ] Original technician (with reason mandatory)
  - [ ] Admin (no reason required, but logged)
- [ ] Mandatory "reason for miss" field (required, min 10 chars)
- [ ] Highlight past-date entries in UI
- [ ] Implement audit log for all past-date changes
- [ ] Schema: Add `edited_at`, `edited_by`, `missed_reason`, `original_entry_date` to entries table
- [ ] Create audit_trail table for all entry modifications

### 16. Audit Trail Table
```sql
CREATE TABLE entry_modifications (
  id UUID PRIMARY KEY,
  entry_id UUID REFERENCES chemistry_entries(id),
  modified_by UUID REFERENCES users(id),
  modified_at TIMESTAMPTZ DEFAULT NOW(),
  change_type TEXT ('created', 'updated', 'backdated'),
  old_values JSONB,
  new_values JSONB,
  reason_for_miss TEXT,
  ip_address INET,
  user_agent TEXT
);
```

---

## 🔍 TESTING & VALIDATION

### 17. Security Testing
- [ ] OWASP Top 10 audit
- [ ] SQL injection tests
- [ ] XSS tests
- [ ] CSRF tests
- [ ] Rate limit tests
- [ ] Authentication bypass tests
- [ ] Authorization bypass tests
- [ ] Dependency vulnerability scan

### 18. Code Review
- [ ] Internal security review of all API endpoints
- [ ] Review RLS policies
- [ ] Check for hardcoded secrets
- [ ] Verify error messages are non-verbose

---

## 📋 CHECKLIST BY PRIORITY

**TODAY (Critical):**
1. Revoke exposed GitHub token
2. Rotate all environment secrets
3. Update git remote URL
4. Audit git history for leaks
5. Enable RLS on database
6. Remove verbose error messages

**THIS WEEK (High):**
1. Implement rate limiting
2. Add request validation (zod)
3. Create audit trail table
4. Implement past-date entry feature
5. Add API versioning
6. Obfuscate endpoints

**THIS MONTH (Medium):**
1. Add terser obfuscation
2. Implement CSRF protection
3. Full OWASP audit
4. Dependency scanning
5. Security testing suite

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:
- [ ] All secrets rotated
- [ ] RLS enabled & tested
- [ ] Rate limiting active
- [ ] Error messages sanitized
- [ ] Source maps disabled
- [ ] Audit trail functional
- [ ] Monitoring alerts active
- [ ] Backup encryption enabled

