/**
 * FacilityH2O — Data Store
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 *
 * Retention policy: 3 years (1095 days) per regulatory requirements
 * Entry integrity: SHA-256 hash seal — entries are immutable after creation
 */

import fs from 'fs';
import path from 'path';
import { randomUUID, createHash } from 'crypto';

const DATA_DIR    = path.join(process.cwd(), 'data');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');
const ALERTS_FILE  = path.join(DATA_DIR, 'alerts.json');
const AUDIT_FILE   = path.join(DATA_DIR, 'audit.json');
const TREND_FILE   = path.join(DATA_DIR, 'trend-log.json');

// 3-year retention in milliseconds
const RETENTION_MS = 1095 * 24 * 60 * 60 * 1000;

/**
 * Generate a SHA-256 integrity hash for an entry.
 * Seals the data at creation time — any tamper changes the hash.
 */
function sealEntry(entry) {
  const payload = JSON.stringify({
    id:         entry.id,
    hospitalId: entry.hospitalId,
    system:     entry.system,
    shift:      entry.shift,
    date:       entry.date,
    time:       entry.time,
    values:     entry.values,
    createdAt:  entry.createdAt,
  });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Verify an entry's integrity seal.
 * Returns true if untampered, false if modified after creation.
 */
export function verifyEntry(entry) {
  if (!entry.integrityHash) return null; // legacy entry, no hash
  return sealEntry(entry) === entry.integrityHash;
}

/**
 * Purge records older than 3 years from a JSON array.
 * Uses the 'createdAt' field for comparison.
 */
function purgeOldRecords(records) {
  const cutoff = Date.now() - RETENTION_MS;
  return records.filter((r) => {
    const ts = r.createdAt ? new Date(r.createdAt).getTime() : Date.now();
    return ts >= cutoff;
  });
}

// Detect serverless/read-only environments (Vercel, etc.)
function isReadOnlyFS() {
  try {
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    return false;
  } catch {
    return true;
  }
}

function ensureFile(filePath, defaultContent = '[]') {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, defaultContent, 'utf8');
    }
  } catch {
    // Read-only filesystem (Vercel serverless) — skip silently
  }
}

function readJSON(filePath, defaultContent = '[]') {
  try {
    ensureFile(filePath, defaultContent);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return JSON.parse(defaultContent);
  }
}

function writeJSON(filePath, data) {
  try {
    ensureFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Read-only filesystem (Vercel serverless) — writes are no-ops
  }
}

export function generateId(prefix = 'id') {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

// ——— Entries ———

export function getAllEntries() {
  return readJSON(ENTRIES_FILE);
}

export function getEntriesForHospital(hospitalId) {
  const all = getAllEntries();
  return all.filter((e) => e.hospitalId === hospitalId);
}

export function addEntry(data) {
  const entries = getAllEntries();
  const now = new Date().toISOString();
  const entry = {
    id:        randomUUID(),
    createdAt: now,
    ...data,
    // Immutability marker — entry is locked at creation
    _locked:   true,
    _lockedAt: now,
  };
  // Seal with integrity hash AFTER setting all fields
  entry.integrityHash = sealEntry(entry);

  entries.push(entry);
  // Apply 3-year retention on write (keeps file from growing unbounded)
  writeJSON(ENTRIES_FILE, purgeOldRecords(entries));
  return entry;
}

export function getEntryById(entryId) {
  const entries = getAllEntries();
  return entries.find((e) => e.id === entryId) || null;
}

export function addCorrectiveAction(entryId, data) {
  const entries = getAllEntries();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  entries[idx].correctiveAction = {
    taken: true,
    action: data.action || '',
    actionBy: data.actionBy || '',
    actionAt: new Date().toISOString(),
    followUpRequired: data.followUpRequired || false,
    followUpNotes: data.followUpNotes || '',
  };
  writeJSON(ENTRIES_FILE, entries);
  return entries[idx];
}

// ——— Alerts ———

export function getAllAlerts() {
  return readJSON(ALERTS_FILE);
}

export function getAlertsForHospital(hospitalId) {
  const all = getAllAlerts();
  return all.filter((a) => a.hospitalId === hospitalId);
}

export function addAlert(data) {
  const alerts = getAllAlerts();
  const alert = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    acknowledged: false,
    ...data,
  };
  alerts.push(alert);
  writeJSON(ALERTS_FILE, alerts);
  return alert;
}

export function acknowledgeAlert(alertId) {
  const alerts = getAllAlerts();
  const idx = alerts.findIndex((a) => a.id === alertId);
  if (idx === -1) return null;
  alerts[idx].acknowledged = true;
  alerts[idx].acknowledgedAt = new Date().toISOString();
  writeJSON(ALERTS_FILE, alerts);
  return alerts[idx];
}

/**
 * Record the notification delivery outcome onto an alert so a swallowed
 * email/SMS failure becomes visible in the API/dashboard instead of invisible.
 * notification shape: { email: {ok, error, recipients}, sms: {...}, at }
 */
export function updateAlertNotification(alertId, notification) {
  const alerts = getAllAlerts();
  const idx = alerts.findIndex((a) => a.id === alertId);
  if (idx === -1) return null;
  alerts[idx].notification = { ...notification, at: new Date().toISOString() };
  // delivered = at least one channel actually went out
  alerts[idx].notified = !!(notification?.email?.ok || notification?.sms?.ok);
  writeJSON(ALERTS_FILE, alerts);
  return alerts[idx];
}

// ——— Audit Log ———

export function logAudit(event) {
  // event: { type, userId, username, hospitalId, entityId, entityType, action, detail, ip, userAgent }
  const logs = readJSON(AUDIT_FILE);
  logs.push({
    id:        generateId('aud'),
    createdAt: new Date().toISOString(),
    ...event,
  });
  // Apply 3-year retention (regulatory requirement)
  const retained = purgeOldRecords(logs);
  writeJSON(AUDIT_FILE, retained);
}

/**
 * Log a trend observation for a parameter.
 * Kept for 3 years for regulatory trending analysis.
 */
export function logTrend(event) {
  // event: { hospitalId, system, parameter, value, direction, trend, limit, date }
  ensureFile(TREND_FILE, '[]');
  const logs = readJSON(TREND_FILE, '[]');
  logs.push({
    id:        generateId('trnd'),
    createdAt: new Date().toISOString(),
    ...event,
  });
  writeJSON(TREND_FILE, purgeOldRecords(logs));
}

export function getTrendLog(hospitalId, days = 90) {
  const logs = readJSON(TREND_FILE, '[]');
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return logs.filter((l) =>
    (!hospitalId || l.hospitalId === hospitalId) &&
    new Date(l.createdAt).getTime() >= cutoff
  );
}

export function getAuditLogs() {
  return readJSON(AUDIT_FILE);
}

/* ============ LICENSING / CLIENT SUBSCRIPTIONS (no payment integration) ============ */
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const FEATURE_KEYS = ['boiler','chilled','st108','legionella','coc','advisor','reports','compliance','api_access'];

export function getLicenses() { return readJSON(LICENSES_FILE); }

export function addLicense(data) {
  const list = readJSON(LICENSES_FILE);
  const { randomUUID } = require('crypto');
  const now = new Date().toISOString();
  const lic = {
    id: 'lic_' + randomUUID().slice(0, 8),
    orgId: data.orgId || null,
    company: data.company || 'Unnamed Client',
    contactName: data.contactName || '',
    contactEmail: data.contactEmail || '',
    plan: data.plan || 'standard',
    status: data.status || 'trial',            // trial | active | past_due | suspended | cancelled
    seats: Number(data.seats) || 1,
    facilities: Number(data.facilities) || 1,
    features: Array.isArray(data.features) ? data.features.filter(f => FEATURE_KEYS.includes(f)) : ['boiler','chilled','reports'],
    monthlyValue: Number(data.monthlyValue) || 0,   // what you intend to bill — informational until Square is wired
    startDate: data.startDate || now.slice(0, 10),
    renewalDate: data.renewalDate || '',
    notes: data.notes || '',
    // placeholder for the future Square layer — never used yet
    billing: { provider: null, customerId: null, subscriptionId: null },
    createdAt: now, updatedAt: now,
  };
  list.push(lic);
  writeJSON(LICENSES_FILE, list);
  return lic;
}

export function updateLicense(id, patch) {
  const list = readJSON(LICENSES_FILE);
  const i = list.findIndex(l => l.id === id);
  if (i < 0) return null;
  const safe = { ...patch };
  delete safe.id; delete safe.createdAt;
  if (safe.features) safe.features = safe.features.filter(f => FEATURE_KEYS.includes(f));
  list[i] = { ...list[i], ...safe, updatedAt: new Date().toISOString() };
  writeJSON(LICENSES_FILE, list);
  return list[i];
}

export function deleteLicense(id) {
  const list = readJSON(LICENSES_FILE);
  const next = list.filter(l => l.id !== id);
  writeJSON(LICENSES_FILE, next);
  return next.length !== list.length;
}

export const LICENSE_FEATURES = FEATURE_KEYS;

/* ============ ORGANIZATIONS + COMPANY-SCOPED USERS (multi-tenant SaaS layer) ============ */
const ORGS_FILE  = path.join(DATA_DIR, 'orgs.json');
const USERS_FILE_SAAS = path.join(DATA_DIR, 'users.json');
const RESET_FILE = path.join(DATA_DIR, 'password-resets.json');

// expose generateId (was internal) for signup/reset
export function makeId(prefix = 'id') { return generateId(prefix); }

export function getOrgs() { return readJSON(ORGS_FILE); }
export function getOrgById(id) { return getOrgs().find(o => o.id === id) || null; }
export function saveOrg(org) {
  const orgs = getOrgs();
  const i = orgs.findIndex(o => o.id === org.id);
  if (i >= 0) orgs[i] = { ...orgs[i], ...org }; else orgs.push(org);
  writeJSON(ORGS_FILE, orgs);
  return org;
}

// Users live in the SAME users.json the login system reads.
export function getUsers() { return readJSON(USERS_FILE_SAAS); }
export function saveUser(user) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === user.id || (u.username && u.username === user.username));
  if (i >= 0) users[i] = { ...users[i], ...user }; else users.push(user);
  writeJSON(USERS_FILE_SAAS, users);
  return user;
}
export function getUserByEmail(email) {
  const e = (email || '').trim().toLowerCase();
  return getUsers().find(u => (u.email || '').toLowerCase() === e || (u.username || '').toLowerCase() === e) || null;
}
export function setUserPassword(userId, newPassword) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === userId);
  if (i < 0) return false;
  users[i].password = newPassword;
  writeJSON(USERS_FILE_SAAS, users);
  return true;
}

// Facilities (kept minimal; used by signup default site)
const FACILITIES_FILE = path.join(DATA_DIR, 'facilities.json');
export function getFacilities() { return readJSON(FACILITIES_FILE); }
export function getFacilitiesByOrg(orgId) { return getFacilities().filter(f => f.orgId === orgId); }
export function saveFacility(f) {
  const list = getFacilities();
  const i = list.findIndex(x => x.id === f.id);
  if (i >= 0) list[i] = { ...list[i], ...f }; else list.push(f);
  writeJSON(FACILITIES_FILE, list);
  return f;
}

// ---- License <-> Org link + status resolution ----
// A license is tied to an org via license.orgId. Returns the org's license or null.
export function getLicenseForOrg(orgId) {
  if (!orgId) return null;
  return getLicenses().find(l => l.orgId === orgId) || null;
}

/* ============ PER-FACILITY SHIFT SCHEDULES ============ */
const SHIFT_SCHED_FILE = path.join(DATA_DIR, 'shift-schedules.json');

// Returns { [facilityId]: { timezone, shifts:{...} } }
export function getShiftSchedules() { return readJSON(SHIFT_SCHED_FILE, '{}'); }
export function getShiftScheduleFor(facilityId) {
  const all = getShiftSchedules();
  return all[facilityId] || null;
}
export function saveShiftSchedule(facilityId, schedule) {
  const all = getShiftSchedules();
  all[facilityId] = { ...schedule, updatedAt: new Date().toISOString() };
  writeJSON(SHIFT_SCHED_FILE, all);
  return all[facilityId];
}

/* ============ PER-FACILITY EQUIPMENT PROFILE (which systems a facility has) ============ */
const EQUIPMENT_FILE = path.join(DATA_DIR, 'equipment-profiles.json');
const BUILTIN_SYSTEMS = ['boiler','chilled','cooling_tower','condensate','softener'];

// { [facilityId]: { boiler:true, chilled:true, cooling_tower:true, condensate:true, softener:true, custom:[...] } }
export function getEquipmentProfiles() { return readJSON(EQUIPMENT_FILE, '{}'); }

// Default: all five built-in systems present (switch off the exceptions per facility).
export function getEquipmentProfile(facilityId) {
  const all = getEquipmentProfiles();
  const stored = all[facilityId] || {};
  const profile = {};
  for (const sys of BUILTIN_SYSTEMS) profile[sys] = stored[sys] !== undefined ? !!stored[sys] : true;
  profile.custom = Array.isArray(stored.custom) ? stored.custom : []; // Stage B: Enterprise custom equipment
  return profile;
}
export function saveEquipmentProfile(facilityId, profile) {
  const all = getEquipmentProfiles();
  all[facilityId] = { ...all[facilityId], ...profile, updatedAt: new Date().toISOString() };
  writeJSON(EQUIPMENT_FILE, all);
  return all[facilityId];
}
// The list of system keys a facility actually has enabled (built-ins only here).
export function systemsForFacility(facilityId) {
  const p = getEquipmentProfile(facilityId);
  return BUILTIN_SYSTEMS.filter(sys => p[sys]);
}
export const BUILTIN_SYSTEM_KEYS = BUILTIN_SYSTEMS;

export function canEditFacility(user, facility) {
  if (!user) return false;
  if (user.username === 'ariley' || user.id === 'usr_ariley') return true;
  if (user.role !== 'admin') return false;
  if (!user.orgId) return !facility || !facility.orgId;   // legacy admin ↔ legacy (orgless) facilities
  return facility && facility.orgId === user.orgId;        // org admin ↔ same-org facilities
}

export function resolveAccess(user) {
  // Owner/super-admin and the original single-tenant operators (no orgId) are always allowed.
  if (!user) return { allowed: false, status: 'none', reason: 'No user' };
  if (user.username === 'ariley' || user.id === 'usr_ariley') return { allowed: true, status: 'owner', reason: 'Owner' };
  if (!user.orgId) return { allowed: true, status: 'legacy', reason: 'Legacy account (no org)' };
  const lic = getLicenseForOrg(user.orgId);
  if (!lic) return { allowed: true, status: 'no-license', reason: 'No license on file (default allow)' };
  const blocked = ['suspended', 'cancelled'];
  if (blocked.includes(lic.status)) {
    return { allowed: false, status: lic.status, reason: 'This organization\'s subscription is ' + lic.status + '.' };
  }
  return { allowed: true, status: lic.status, reason: 'Active/trial' };
}
