/**
 * ════════════════════════════════════════════════════════════════
 *  PLATFORM BRANDING  —  EDIT THIS ONE FILE TO REBRAND EVERYTHING
 * ════════════════════════════════════════════════════════════════
 *
 *  Every email, report, and alert the platform sends reads its name,
 *  tagline, and "from" address from the values below. Change them here
 *  and the whole platform rebrands — you do NOT need to edit any other file.
 *
 *  HOW TO REBRAND FOR A NEW COMPANY (anyone can do this):
 *    1. Change the values marked "← EDIT" below.
 *    2. Commit the file.
 *    3. Done — every outgoing email and report now shows the new brand.
 *
 *  NOTE: individual hospital/customer names (e.g. each facility's own name)
 *  live in the customer data, not here, and are NOT affected by this file.
 */

export const BRAND = {
  // The platform name shown at the top of every email and report.
  name: 'FacilityH2O',                               // ← EDIT to rebrand

  // The small line shown under the name.
  tagline: 'Water Chemistry Compliance Portal',      // ← EDIT to rebrand

  // The email address alerts are sent FROM.
  // IMPORTANT: this domain must be verified in Resend, or emails won't send.
  fromEmail: 'alerts@facilityh2o.com',               // ← EDIT to rebrand

  // Email header-bar colors (optional — safe to leave as-is).
  headerColor: '#003366',
  accentColor: '#90c4f0',
};
