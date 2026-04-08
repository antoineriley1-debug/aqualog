import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function readJson(filename) {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJson(filename, data) {
  const file = path.join(DATA_DIR, filename);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ──── ORGS ────
export function getOrgs() { return readJson('orgs.json'); }
export function getOrgById(id) { return getOrgs().find(o => o.id === id) || null; }
export function saveOrg(org) {
  const orgs = getOrgs();
  const idx = orgs.findIndex(o => o.id === org.id);
  if (idx >= 0) orgs[idx] = org; else orgs.push(org);
  writeJson('orgs.json', orgs);
}

// ──── USERS ────
export function getUsers() { return readJson('users.json'); }
export function getUserByUsername(username) {
  return getUsers().find(u => u.username === username || u.email === username) || null;
}
export function getUsersByOrg(orgId) { return getUsers().filter(u => u.orgId === orgId); }
export function saveUser(user) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user; else users.push(user);
  writeJson('users.json', users);
}
export function deleteUser(id) {
  const users = getUsers().filter(u => u.id !== id);
  writeJson('users.json', users);
}

// ──── FACILITIES ────
export function getFacilities() { return readJson('facilities.json'); }
export function getFacilitiesByOrg(orgId) {
  if (!orgId) return getFacilities().filter(f => f.active !== false); // superadmin sees all
  return getFacilities().filter(f => f.orgId === orgId && f.active !== false);
}
export function getFacilityById(id) { return getFacilities().find(f => f.id === id) || null; }
export function saveFacility(facility) {
  const facilities = getFacilities();
  const idx = facilities.findIndex(f => f.id === facility.id);
  if (idx >= 0) facilities[idx] = facility; else facilities.push(facility);
  writeJson('facilities.json', facilities);
}

// ──── ENTRIES ────
export function getEntries() { return readJson('entries.json'); }
export function getEntriesByOrg(orgId) {
  if (!orgId) return getEntries(); // superadmin
  return getEntries().filter(e => e.orgId === orgId);
}
export function getEntriesByFacility(facilityId) {
  return getEntries().filter(e => e.facilityId === facilityId);
}
export function saveEntry(entry) {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry; else entries.push(entry);
  writeJson('entries.json', entries);
}

// ──── ALERTS ────
export function getAlerts() { return readJson('alerts.json'); }
export function getAlertsByOrg(orgId) {
  if (!orgId) return getAlerts(); // superadmin
  return getAlerts().filter(a => a.orgId === orgId);
}
export function saveAlert(alert) {
  const alerts = getAlerts();
  const idx = alerts.findIndex(a => a.id === alert.id);
  if (idx >= 0) alerts[idx] = alert; else alerts.push(alert);
  writeJson('alerts.json', alerts);
}
export function acknowledgeAlert(id) {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    writeJson('alerts.json', alerts);
  }
}

// ──── ID GENERATION ────
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
