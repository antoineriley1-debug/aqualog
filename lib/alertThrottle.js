/**
 * FacilityH2O — Smart Alert Dispatch: Throttle, Quiet Hours & Digest
 * Author: Antoine Riley
 * © 2026 FacilityH2O Inc. All rights reserved.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const RULES_FILE = path.join(DATA_DIR, 'notification-rules.json');
const STATE_FILE = path.join(DATA_DIR, 'alert-state.json');

// ── Read / Write helpers ────────────────────────────────────────────────────

export function readRules() {
  try {
    if (fs.existsSync(RULES_FILE)) return JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
  } catch {}
  return { hospitals: {}, global: { levels: {} } };
}

export function writeRules(rules) {
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), 'utf8');
}

export function readAlertState() {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {}
  return { lastAlertSent: {}, pendingDigest: [] };
}

export function writeAlertState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ── Time helpers (America/New_York) ─────────────────────────────────────────

function getNowET() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function getHourMinuteET() {
  const now = getNowET();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

/**
 * Parse "HH:MM" → { hour, minute }
 */
function parseTime(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

/**
 * Check if current ET time is within quiet hours.
 * Handles overnight spans (e.g. 22:00–06:00).
 */
export function isInQuietHours(quietHoursConfig) {
  if (!quietHoursConfig?.enabled) return false;
  const start = parseTime(quietHoursConfig.start);
  const end = parseTime(quietHoursConfig.end);
  if (!start || !end) return false;

  const { hour, minute } = getHourMinuteET();
  const nowMin = hour * 60 + minute;
  const startMin = start.hour * 60 + start.minute;
  const endMin = end.hour * 60 + end.minute;

  if (startMin <= endMin) {
    // Same-day range (e.g. 08:00–17:00)
    return nowMin >= startMin && nowMin < endMin;
  } else {
    // Overnight range (e.g. 22:00–06:00)
    return nowMin >= startMin || nowMin < endMin;
  }
}

// ── Throttle key ────────────────────────────────────────────────────────────

function throttleKey(hospitalId, system, level, contactId) {
  return `${hospitalId}_${system}_${level}_${contactId || 'all'}`;
}

// ── Determine alert level from context ──────────────────────────────────────

/**
 * Map alert context to escalation level:
 *  0 = Critical (Legionella, extreme OOR)
 *  1 = Warning (standard OOR)
 *  2 = Info (drift)
 */
export function determineLevel(alertType, oor) {
  if (alertType === 'legionella') return 0;
  if (alertType === 'drift') return 2;

  // Check for critical params in OOR
  const criticalParams = ['legionella', 'bacteria', 'cfu'];
  if (oor && oor.some(p => criticalParams.some(c => (p.param || p.label || '').toLowerCase().includes(c)))) {
    return 0;
  }
  return 1; // standard OOR
}

// ── Get throttle settings for a level+channel ───────────────────────────────

function getThrottleSettings(rules, level, channel) {
  const levelConfig = rules.global?.levels?.[String(level)];
  if (!levelConfig?.throttle) return { mode: 'immediate' };
  const channelThrottle = levelConfig.throttle[channel];
  if (!channelThrottle) return { mode: 'immediate' };
  return channelThrottle;
}

// ── Core: Should we send this alert? ────────────────────────────────────────

/**
 * Decide whether to send, queue (digest), or suppress an alert.
 *
 * Returns: {
 *   sendEmail: boolean,
 *   sendSms: boolean,
 *   queueForDigest: boolean,
 *   reason?: string
 * }
 */
export function shouldSendAlert({ hospitalId, system, level, contactEmail, contactSms }) {
  const rules = readRules();
  const state = readAlertState();
  const now = Date.now();
  const quietHours = isInQuietHours(rules.global?.quietHours);

  // Level 0 (Critical) ALWAYS sends immediately, bypasses quiet hours
  if (level === 0) {
    return { sendEmail: true, sendSms: true, queueForDigest: false, reason: 'critical-always-send' };
  }

  const emailThrottle = getThrottleSettings(rules, level, 'email');
  const smsThrottle = getThrottleSettings(rules, level, 'sms');

  let sendEmail = true;
  let sendSms = true;
  let queueForDigest = false;

  // ── Email throttle check ──────────────────────────────────────────────
  if (emailThrottle.mode === 'off') {
    sendEmail = false;
  } else if (emailThrottle.mode === 'digest') {
    sendEmail = false;
    queueForDigest = true;
  } else if (emailThrottle.mode === 'throttled') {
    const key = throttleKey(hospitalId, system, level, contactEmail);
    const lastSent = state.lastAlertSent?.[key];
    const cooldownMs = (emailThrottle.minutes || 60) * 60 * 1000;
    if (lastSent && (now - lastSent) < cooldownMs) {
      sendEmail = false;
      queueForDigest = true;
    }
  }

  // ── SMS throttle check ────────────────────────────────────────────────
  if (smsThrottle.mode === 'off') {
    sendSms = false;
  } else if (smsThrottle.mode === 'digest') {
    sendSms = false;
    queueForDigest = true;
  } else if (smsThrottle.mode === 'throttled') {
    const key = throttleKey(hospitalId, system, level, contactSms);
    const lastSent = state.lastAlertSent?.[key];
    const cooldownMs = (smsThrottle.minutes || 60) * 60 * 1000;
    if (lastSent && (now - lastSent) < cooldownMs) {
      sendSms = false;
      queueForDigest = true;
    }
  }

  // ── Quiet hours: suppress SMS for non-critical ────────────────────────
  if (quietHours && level !== 0) {
    sendSms = false;
    // Level 1 email still goes; for level 2 respect its own settings
  }

  return { sendEmail, sendSms, queueForDigest };
}

// ── Record that an alert was sent ───────────────────────────────────────────

export function recordAlertSent({ hospitalId, system, level, contactEmail, contactSms }) {
  const state = readAlertState();
  const now = Date.now();

  if (!state.lastAlertSent) state.lastAlertSent = {};

  if (contactEmail) {
    state.lastAlertSent[throttleKey(hospitalId, system, level, contactEmail)] = now;
  }
  if (contactSms) {
    state.lastAlertSent[throttleKey(hospitalId, system, level, contactSms)] = now;
  }

  writeAlertState(state);
}

// ── Queue an alert for digest ───────────────────────────────────────────────

export function queueDigestAlert(alertData) {
  const state = readAlertState();
  if (!state.pendingDigest) state.pendingDigest = [];
  state.pendingDigest.push({
    ...alertData,
    queuedAt: Date.now(),
  });
  writeAlertState(state);
}

// ── Flush pending digest alerts ─────────────────────────────────────────────

export function flushDigestAlerts() {
  const state = readAlertState();
  const pending = state.pendingDigest || [];
  state.pendingDigest = [];
  writeAlertState(state);
  return pending;
}

// ── Get contacts for a level ────────────────────────────────────────────────

export function getContactsForLevel(hospitalId, level) {
  const rules = readRules();
  const lvl = String(level);
  const hContacts = rules.hospitals?.[hospitalId]?.levels?.[lvl]?.contacts || [];
  const gContacts = rules.global?.levels?.[lvl]?.contacts || [];
  const all = [...hContacts, ...gContacts];

  // Deduplicate by email
  const seen = new Set();
  return all.filter(c => {
    const key = c.email || c.sms || '';
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
