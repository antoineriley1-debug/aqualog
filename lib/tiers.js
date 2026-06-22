/**
 * ════════════════════════════════════════════════════════════════
 *  ACCESS TIERS — EDIT THIS ONE FILE TO CHANGE WHAT EACH TIER ALLOWS
 * ════════════════════════════════════════════════════════════════
 *
 *  "Assets" = equipment units a client can track. Each boiler, softener,
 *  chiller, cooling tower, condensate system, or custom unit counts as ONE.
 *
 *    assetLimit : max equipment units for the tier   (null = unlimited)
 *    price      : left null for now — add when ready to publish prices
 *    features   : which modules the client gets (keys listed below)
 *
 *  Feature keys available:
 *    boiler, chilled, st108, legionella, coc, advisor,
 *    reports, compliance, api_access, custom_equipment
 */

export const TIERS = [
  {
    id: 'tier1',
    name: 'Tier 1',
    assetLimit: 3,                 // ← up to 3 equipment units
    price: null,                   // ← no price yet
    features: ['boiler', 'chilled', 'reports'],
    blurb: 'Up to 3 equipment units',
  },
  {
    id: 'tier2',
    name: 'Tier 2',
    assetLimit: 10,                // ← up to 10 equipment units
    price: null,
    features: ['boiler', 'chilled', 'reports', 'compliance', 'advisor'],
    blurb: 'Up to 10 equipment units',
  },
  {
    id: 'tier3',
    name: 'Tier 3',
    assetLimit: null,              // ← unlimited (null = no cap)
    price: null,
    features: ['boiler', 'chilled', 'st108', 'legionella', 'coc', 'advisor', 'reports', 'compliance', 'api_access', 'custom_equipment'],
    blurb: 'Unlimited equipment units',
  },
];

// ── Lookups (used by the Accounts control matrix) ──────────────────────────
export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t]));
export function tierName(id) { return TIER_BY_ID[id]?.name || id || '—'; }
export function tierAssetLimit(id) { const t = TIER_BY_ID[id]; return t ? t.assetLimit : null; } // null = unlimited
export function tierLabel(id) {
  const t = TIER_BY_ID[id];
  if (!t) return id || '—';
  return t.assetLimit === null ? `${t.name} · Unlimited units` : `${t.name} · ${t.assetLimit} units`;
}
