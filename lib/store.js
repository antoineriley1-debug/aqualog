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

function generateId(prefix = 'id') {
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
