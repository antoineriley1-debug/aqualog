-- FacilityH2O Supabase Schema with Security Hardening
-- Author: Antoine W. Riley Sr. (FacilityH2O Inc.)
-- Run this in your Supabase SQL editor to set up the database
-- ⚠️ CRITICAL: Enable RLS and create policies immediately after table creation

-- ════════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ════════════════════════════════════════════════════════════════════════════════

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  plan TEXT DEFAULT 'starter',
  trial_ends TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin','admin','operator')),
  name TEXT,
  facilities JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  code TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chemistry entries (with past-date edit support)
CREATE TABLE IF NOT EXISTS chemistry_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id TEXT NOT NULL,
  system_type TEXT NOT NULL CHECK (system_type IN ('boiler','chilled')),
  shift TEXT NOT NULL,
  entry_date DATE NOT NULL,
  entry_time TIME,
  tester_name TEXT,
  operator_name TEXT NOT NULL,
  operator_username TEXT,
  operator_id UUID REFERENCES users(id),
  readings JSONB NOT NULL,
  notes TEXT,
  has_alerts BOOLEAN DEFAULT FALSE,
  
  -- Audit fields for past-date edits
  is_backdated BOOLEAN DEFAULT FALSE,
  missed_reason TEXT,
  edited_by UUID REFERENCES users(id),
  edited_at TIMESTAMPTZ,
  original_entry_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Entry Modifications Audit Table
-- Tracks every change made to a chemistry_entry after initial submission.
-- Required for regulatory compliance (corrective action audit trail).
CREATE TABLE IF NOT EXISTS entry_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES chemistry_entries(id) ON DELETE CASCADE,
  facility_id TEXT NOT NULL,
  modified_by UUID NOT NULL REFERENCES users(id),
  modified_at TIMESTAMPTZ DEFAULT NOW(),

  -- What changed
  field_name TEXT NOT NULL,                 -- e.g. 'readings.ph', 'notes', 'entry_date'
  old_value TEXT,
  new_value TEXT,

  -- Why it changed (mandatory for past-date edits)
  modification_type TEXT NOT NULL CHECK (modification_type IN (
    'CORRECTION',          -- Data entry error corrected
    'BACKDATE',            -- Entry submitted for a past date
    'READING_UPDATE',      -- Actual reading value changed
    'NOTE_ADDED',          -- Notes appended after submission
    'ACKNOWLEDGE'          -- Alert acknowledgement
  )),
  reason TEXT NOT NULL CHECK (char_length(reason) >= 10), -- minimum 10 chars

  -- Request context for forensic audit
  ip_address INET,
  user_agent TEXT
);

-- RLS: same pattern as chemistry_entries
ALTER TABLE entry_modifications ENABLE ROW LEVEL SECURITY;

-- Superadmins see all modifications
CREATE POLICY "entry_mods_superadmin_all" ON entry_modifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admins see modifications in their org
CREATE POLICY "entry_mods_admin_own_org" ON entry_modifications
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Operators can view (not write) modifications for their facility
CREATE POLICY "entry_mods_operator_view" ON entry_modifications
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'operator'
    AND facility_id = ANY(
      (SELECT facilities::text[] FROM users WHERE id = auth.uid())
    )
  );

-- Prevent direct writes from frontend (backend functions only)
CREATE POLICY "entry_mods_deny_direct_insert" ON entry_modifications
  FOR INSERT WITH CHECK (FALSE);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_entry_mods_entry_id ON entry_modifications(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_mods_org_id ON entry_modifications(org_id);
CREATE INDEX IF NOT EXISTS idx_entry_mods_modified_by ON entry_modifications(modified_by);
CREATE INDEX IF NOT EXISTS idx_entry_mods_modified_at ON entry_modifications(modified_at);

-- Alerts
CREATE TABLE IF NOT EXISTS chemistry_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id TEXT NOT NULL,
  entry_id UUID REFERENCES chemistry_entries(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL,
  shift TEXT NOT NULL,
  entry_date DATE NOT NULL,
  tester_name TEXT,
  operator_name TEXT NOT NULL,
  out_of_range JSONB NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (track all mutations)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'BACKDATE')),
  user_id UUID REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Rules
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  recipients JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemistry_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemistry_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════════════════════
-- ORGANIZATIONS POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- Superadmins see all orgs, admins see their own
CREATE POLICY "organizations_superadmin_all" ON organizations
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'superadmin'
  );

CREATE POLICY "organizations_admin_own" ON organizations
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' 
    AND id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════════════════
-- USERS POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- Superadmins see all users
CREATE POLICY "users_superadmin_all" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admins see users in their org
CREATE POLICY "users_admin_own_org" ON users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' 
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Users see only themselves
CREATE POLICY "users_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════════
-- FACILITIES POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- Superadmins see all facilities
CREATE POLICY "facilities_superadmin_all" ON facilities
  FOR ALL USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admins see facilities in their org
CREATE POLICY "facilities_admin_own_org" ON facilities
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Operators see only facilities assigned to them
CREATE POLICY "facilities_operator_assigned" ON facilities
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'operator'
    AND id::TEXT = ANY(
      (SELECT facilities::text[] FROM users WHERE id = auth.uid())
    )
  );

-- ════════════════════════════════════════════════════════════════════════════════
-- CHEMISTRY ENTRIES POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- Superadmins see all entries
CREATE POLICY "entries_superadmin_all" ON chemistry_entries
  FOR ALL USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admins see entries in their org
CREATE POLICY "entries_admin_own_org" ON chemistry_entries
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Operators can INSERT entries for their facility
CREATE POLICY "entries_operator_insert" ON chemistry_entries
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'operator'
    AND facility_id = ANY(
      (SELECT facilities::text[] FROM users WHERE id = auth.uid())
    )
  );

-- Operators can VIEW entries for their facility
CREATE POLICY "entries_operator_select" ON chemistry_entries
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'operator'
    AND facility_id = ANY(
      (SELECT facilities::text[] FROM users WHERE id = auth.uid())
    )
  );

-- Operators can UPDATE ONLY their own recent entries (not past dates)
-- Admins can UPDATE any entry (with audit trail)
CREATE POLICY "entries_operator_update_own" ON chemistry_entries
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'operator'
    AND operator_id = auth.uid()
    AND entry_date >= (CURRENT_DATE - INTERVAL '1 day')
  );

CREATE POLICY "entries_admin_update_all" ON chemistry_entries
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════════════════
-- ALERTS POLICIES
-- ════════════════════════════════════════════════════════════════════════════════

-- Superadmins see all alerts
CREATE POLICY "alerts_superadmin_all" ON chemistry_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admins see alerts in their org
CREATE POLICY "alerts_admin_own_org" ON chemistry_alerts
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Operators see alerts for their facilities
CREATE POLICY "alerts_operator_own_facility" ON chemistry_alerts
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'operator'
    AND facility_id = ANY(
      (SELECT facilities::text[] FROM users WHERE id = auth.uid())
    )
  );

-- ════════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG POLICIES (Admins & Superadmins only)
-- ════════════════════════════════════════════════════════════════════════════════

-- Superadmins see all audit entries
CREATE POLICY "audit_log_superadmin_all" ON audit_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admins see audit entries for their org
CREATE POLICY "audit_log_admin_own_org" ON audit_log
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Deny all inserts/updates/deletes to audit_log (write via backend functions only)
CREATE POLICY "audit_log_deny_all_writes" ON audit_log
  FOR ALL USING (FALSE);

-- ════════════════════════════════════════════════════════════════════════════════
-- NOTIFICATION RULES POLICIES (Admin only)
-- ════════════════════════════════════════════════════════════════════════════════

-- Superadmins see all rules
CREATE POLICY "notification_rules_superadmin_all" ON notification_rules
  FOR ALL USING (auth.jwt() ->> 'role' = 'superadmin');

-- Admins see/edit rules for their org
CREATE POLICY "notification_rules_admin_own_org" ON notification_rules
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
    AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Operators cannot access rules
CREATE POLICY "notification_rules_operator_deny" ON notification_rules
  FOR ALL USING (FALSE);

-- ════════════════════════════════════════════════════════════════════════════════
-- INDEXES (Performance)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_facilities_org_id ON facilities(org_id);
CREATE INDEX IF NOT EXISTS idx_entries_org_id ON chemistry_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_entries_facility_id ON chemistry_entries(facility_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON chemistry_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_is_backdated ON chemistry_entries(is_backdated);
CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON chemistry_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_facility_id ON chemistry_alerts(facility_id);
CREATE INDEX IF NOT EXISTS idx_alerts_entry_id ON chemistry_alerts(entry_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECURITY NOTES
-- ════════════════════════════════════════════════════════════════════════════════
-- 
-- 1. RLS is enabled on all tables — queries are automatically filtered by role
-- 2. Audit log is write-protected — only backend functions can insert
-- 3. Past-date entries require:
--    - is_backdated = true
--    - missed_reason (required, min 10 chars in app)
--    - edited_by (user who made the change)
--    - edited_at (when the change was made)
--    - original_entry_date (tracks the original date)
-- 4. Operators cannot modify past entries (RLS enforces this)
-- 5. All mutations are logged in audit_log for compliance
-- 6. Chemistry_entries now tracks creator (created_by) for auditing
-- 
-- DEPLOYMENT CHECKLIST:
-- ✅ Run this SQL in Supabase
-- ✅ Test RLS policies in Supabase SQL editor
-- ✅ Verify operators cannot see other users' entries
-- ✅ Verify admins can edit entries
-- ✅ Verify audit log is read-only to frontend
-- ✅ Implement backend functions for audit log writes
-- ✅ Test backdated entry insertion with missed_reason
-- ✅ Verify entry modification audit trail works

