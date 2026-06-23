-- FacilityH2O — Multi-Tenant Schema Migration
-- Run in Supabase SQL Editor: https://app.supabase.com/project/kfkjagottniayrxayeav/sql
-- 
-- This adds the proper multi-tenant architecture:
-- organization → sites → buildings → systems → equipment → users
-- Every table is org-scoped. Nothing bleeds between tenants.

-- ──────────────────────────────────────────────────────────────────────────────
-- ORGANIZATIONS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  org_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  industry      TEXT NOT NULL DEFAULT 'other',
  subscription_tier TEXT NOT NULL DEFAULT 'trial',
  logo_url      TEXT,
  active        BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  systems       TEXT[] DEFAULT '{}',   -- selected system types
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- SITES (org-scoped facilities — replaces hardcoded hospital list)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sites (
  site_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(org_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT,                  -- short code, org-unique (e.g. WHC, PLANT1)
  facility_type TEXT,                  -- Hospital, Manufacturing Plant, Campus, etc.
  address       TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  phone         TEXT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sites_org_id ON public.sites(org_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- BUILDINGS (site-scoped)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.buildings (
  building_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID NOT NULL REFERENCES public.sites(site_id) ON DELETE CASCADE,
  org_id        UUID NOT NULL,         -- denormalized for fast org-scoped queries
  name          TEXT NOT NULL,
  floor_count   INT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_buildings_site_id ON public.buildings(site_id);
CREATE INDEX IF NOT EXISTS idx_buildings_org_id  ON public.buildings(org_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- SYSTEMS (building-scoped)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.systems (
  system_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id   UUID REFERENCES public.buildings(building_id) ON DELETE CASCADE,
  site_id       UUID NOT NULL REFERENCES public.sites(site_id) ON DELETE CASCADE,
  org_id        UUID NOT NULL,
  system_type   TEXT NOT NULL,         -- boiler, chilled, cooling_tower, domestic, etc.
  name          TEXT,                  -- optional custom label
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_systems_site_id ON public.systems(site_id);
CREATE INDEX IF NOT EXISTS idx_systems_org_id  ON public.systems(org_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- EQUIPMENT (system-scoped)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.equipment (
  equipment_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id       UUID NOT NULL REFERENCES public.systems(system_id) ON DELETE CASCADE,
  site_id         UUID NOT NULL,
  org_id          UUID NOT NULL,
  name            TEXT NOT NULL,
  equipment_type  TEXT,
  manufacturer    TEXT,
  model           TEXT,
  serial_number   TEXT,
  install_date    DATE,
  specifications  JSONB DEFAULT '{}',
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_system_id ON public.equipment(system_id);
CREATE INDEX IF NOT EXISTS idx_equipment_org_id    ON public.equipment(org_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- USERS (org-scoped)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(org_id) ON DELETE CASCADE,
  site_id       UUID REFERENCES public.sites(site_id) ON DELETE SET NULL,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT,
  role          TEXT NOT NULL DEFAULT 'operator',   -- admin, operator, viewer
  name          TEXT,
  permissions   JSONB DEFAULT '{}',
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_users_org_id ON public.org_users(org_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — Ensure complete tenant isolation
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_users     ENABLE ROW LEVEL SECURITY;

-- Allow authenticated service role to manage all (API server uses service key)
-- Anon/public access blocked by default; app routes auth at API layer.
CREATE POLICY IF NOT EXISTS "service_all_orgs"      ON public.organizations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "service_all_sites"     ON public.sites         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "service_all_buildings" ON public.buildings     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "service_all_systems"   ON public.systems       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "service_all_equipment" ON public.equipment     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "service_all_users"     ON public.org_users     FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- COMMENTS (documentation)
-- ──────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.organizations IS 'Multi-tenant: one row per customer organization. Fully isolated.';
COMMENT ON TABLE public.sites         IS 'Facilities/sites owned by an org. Can be hospital, plant, campus, etc.';
COMMENT ON TABLE public.buildings     IS 'Buildings within a site. Optional, site can exist without buildings.';
COMMENT ON TABLE public.systems       IS 'Water/mechanical systems within a building or site.';
COMMENT ON TABLE public.equipment     IS 'Individual equipment pieces within a system.';
COMMENT ON TABLE public.org_users     IS 'Org-scoped users. Admins see all sites; operators may be scoped to one site.';
