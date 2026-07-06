/**
 * FacilityH2O — Client-Assigned Domain Registry
 * Author & Owner: Antoine Riley — © 2026 FacilityH2O. All rights reserved.
 *
 * The platform lives at facilityh2o.com. Each client organization gets its OWN
 * assigned domain (their brand, their bookmark) that lands directly on their
 * portal — while the platform, code, and data remain FacilityH2O property.
 * This separation is deliberate: no client can claim the platform because the
 * product's home has their name on it.
 *
 * To onboard a client with a branded domain:
 *   1. Add their domain(s) below.
 *   2. Point the domain's DNS (A record) at the FacilityH2O server.
 *   3. Done — their domain skips the marketing site and lands on their login.
 */
export const TENANTS = {
  'medstarh20log.com':     { id: 'medstar', name: 'MedStarH2OLog', org: 'MedStar Health' },
  'www.medstarh20log.com': { id: 'medstar', name: 'MedStarH2OLog', org: 'MedStar Health' },
};

export function tenantForHost(host) {
  if (!host) return null;
  return TENANTS[String(host).toLowerCase().split(':')[0]] || null;
}
