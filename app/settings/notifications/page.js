'use client';
/**
 * FacilityH2O — Notification Settings (Admin-only)
 * Contact management, throttle/digest, quiet hours, escalation levels.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find(c => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const E164_REGEX = /^\+1\d{10}$/;

const THROTTLE_MODES = [
  { value: 'immediate', label: 'Immediate', desc: 'Send on every alert' },
  { value: 'throttled', label: 'Throttled', desc: 'Max 1 per X minutes' },
  { value: 'digest', label: 'Digest', desc: 'Batch summary every X hours' },
  { value: 'off', label: 'Off', desc: 'Disabled' },
];
const THROTTLE_MINUTES = [15, 30, 60, 120];
const DIGEST_HOURS = [1, 2, 4, 8, 12, 24];

const LEVEL_META = {
  0: { name: 'Critical', icon: '🔴', desc: 'Legionella, extreme OOR — always immediate, bypasses quiet hours' },
  1: { name: 'Warning', icon: '🟡', desc: 'Standard OOR — respects throttle + quiet hours' },
  2: { name: 'Info', icon: '🔵', desc: 'Drift warnings — digest only recommended' },
};

function defaultThrottle() {
  return { mode: 'immediate', minutes: 60, digestHours: 4 };
}

function defaultLevel(lvl) {
  const base = {
    name: LEVEL_META[lvl]?.name?.toLowerCase() || 'unknown',
    contacts: [],
    throttle: {
      email: { ...defaultThrottle() },
      sms: { ...defaultThrottle() },
    },
  };
  if (lvl === 0) {
    base.throttle.email.mode = 'immediate';
    base.throttle.sms.mode = 'immediate';
  } else if (lvl === 2) {
    base.throttle.email.mode = 'digest';
    base.throttle.sms.mode = 'off';
  }
  return base;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rules, setRules] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [activeTab, setActiveTab] = useState('contacts');

  // Contact form state
  const [newContact, setNewContact] = useState({ name: '', email: '', sms: '', emailEnabled: true, smsEnabled: true });
  const [contactError, setContactError] = useState('');

  // Quiet hours
  const [quietHours, setQuietHours] = useState({ enabled: false, start: '22:00', end: '06:00' });

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      const r = data.rules || data;
      // Ensure levels 0,1,2 exist with throttle config
      if (!r.global) r.global = { levels: {} };
      if (!r.global.levels) r.global.levels = {};
      for (const lvl of [0, 1, 2]) {
        if (!r.global.levels[lvl]) {
          r.global.levels[lvl] = defaultLevel(lvl);
        } else {
          // Ensure throttle structure exists
          if (!r.global.levels[lvl].throttle) {
            r.global.levels[lvl].throttle = {
              email: { ...defaultThrottle() },
              sms: { ...defaultThrottle() },
            };
          }
          if (!r.global.levels[lvl].throttle.email) r.global.levels[lvl].throttle.email = { ...defaultThrottle() };
          if (!r.global.levels[lvl].throttle.sms) r.global.levels[lvl].throttle.sms = { ...defaultThrottle() };
        }
      }
      if (r.global.quietHours) setQuietHours(r.global.quietHours);
      setRules(r);
    } catch {
      setRules({ hospitals: {}, global: { levels: { 0: defaultLevel(0), 1: defaultLevel(1), 2: defaultLevel(2) } } });
    }
  };

  const saveRules = async () => {
    if (!rules) return;
    setSaving(true);
    setSaveMsg('');
    try {
      // Attach quiet hours
      rules.global.quietHours = quietHours;
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levels: rules.global.levels,
          quietHours: quietHours,
        }),
      });
      if (res.ok) {
        setSaveMsg('✅ Settings saved');
      } else {
        const d = await res.json();
        setSaveMsg(`❌ ${d.error || 'Failed to save'}`);
      }
    } catch (e) {
      setSaveMsg(`❌ ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  // ── Contact management ──────────────────────────────────────────────────

  const allContacts = useCallback(() => {
    if (!rules) return [];
    const contacts = [];
    const seen = new Set();
    for (const lvl of Object.values(rules.global?.levels || {})) {
      for (const c of (lvl.contacts || [])) {
        const key = `${c.email || ''}|${c.sms || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          contacts.push(c);
        }
      }
    }
    return contacts;
  }, [rules]);

  const addContact = () => {
    setContactError('');
    if (!newContact.name.trim()) { setContactError('Name is required'); return; }
    if (!newContact.email.trim() && !newContact.sms.trim()) { setContactError('Email or SMS number required'); return; }
    if (newContact.sms.trim() && !E164_REGEX.test(newContact.sms.trim())) {
      setContactError('SMS must be E.164 format: +1XXXXXXXXXX');
      return;
    }

    const contact = {
      name: newContact.name.trim(),
      email: newContact.emailEnabled && newContact.email.trim() ? newContact.email.trim() : undefined,
      sms: newContact.smsEnabled && newContact.sms.trim() ? newContact.sms.trim() : undefined,
    };

    // Add to all levels
    const updated = { ...rules };
    for (const lvl of [0, 1, 2]) {
      if (!updated.global.levels[lvl]) updated.global.levels[lvl] = defaultLevel(lvl);
      if (!updated.global.levels[lvl].contacts) updated.global.levels[lvl].contacts = [];
      // Avoid dupes
      const exists = updated.global.levels[lvl].contacts.some(
        c => (c.email && c.email === contact.email) || (c.sms && c.sms === contact.sms)
      );
      if (!exists) updated.global.levels[lvl].contacts.push({ ...contact });
    }
    setRules(updated);
    setNewContact({ name: '', email: '', sms: '', emailEnabled: true, smsEnabled: true });
  };

  const removeContact = (email, sms) => {
    const updated = { ...rules };
    for (const lvl of Object.keys(updated.global?.levels || {})) {
      updated.global.levels[lvl].contacts = (updated.global.levels[lvl].contacts || []).filter(
        c => !(c.email === email && c.sms === sms)
      );
    }
    setRules(updated);
  };

  const removeContactFromLevel = (lvlKey, email, sms) => {
    const updated = { ...rules };
    updated.global.levels[lvlKey].contacts = (updated.global.levels[lvlKey].contacts || []).filter(
      c => !(c.email === email && c.sms === sms)
    );
    setRules(updated);
  };

  // ── Throttle updater ────────────────────────────────────────────────────

  const updateThrottle = (lvl, channel, field, value) => {
    const updated = { ...rules };
    if (!updated.global.levels[lvl].throttle) {
      updated.global.levels[lvl].throttle = { email: defaultThrottle(), sms: defaultThrottle() };
    }
    updated.global.levels[lvl].throttle[channel][field] = value;
    setRules(updated);
  };

  if (!user || !rules) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 p-8 pt-16 md:pt-8 flex items-center justify-center">
          <div className="text-gray-400">Loading…</div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'contacts', label: '👥 Contacts' },
    { id: 'throttle', label: '⏱️ Throttle & Digest' },
    { id: 'quiet', label: '🌙 Quiet Hours' },
    { id: 'levels', label: '🚦 Escalation Levels' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔔 Notification Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Configure contacts, alert frequency, quiet hours & escalation</p>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && <span className="text-sm">{saveMsg}</span>}
            <button
              onClick={saveRules}
              disabled={saving}
              className="bg-[#0072CE] hover:bg-[#005fa3] text-white px-5 py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              💾 Save Settings
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === t.id
                  ? 'bg-[#0072CE] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTACTS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Add Contact */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="John Smith"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Email
                    <input
                      type="checkbox"
                      checked={newContact.emailEnabled}
                      onChange={e => setNewContact({ ...newContact, emailEnabled: e.target.checked })}
                      className="ml-2"
                    />
                    <span className="text-gray-400 ml-1">enabled</span>
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="john@hospital.org"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    SMS
                    <input
                      type="checkbox"
                      checked={newContact.smsEnabled}
                      onChange={e => setNewContact({ ...newContact, smsEnabled: e.target.checked })}
                      className="ml-2"
                    />
                    <span className="text-gray-400 ml-1">enabled</span>
                  </label>
                  <input
                    type="tel"
                    value={newContact.sms}
                    onChange={e => setNewContact({ ...newContact, sms: e.target.value })}
                    placeholder="+14845551234"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                  />
                </div>
              </div>
              {contactError && <p className="text-red-500 text-sm mb-3">{contactError}</p>}
              <button
                onClick={addContact}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                ➕ Add Contact
              </button>
            </div>

            {/* Contact List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Contacts</h2>
              {allContacts().length === 0 ? (
                <p className="text-gray-400 text-sm">No contacts configured yet.</p>
              ) : (
                <div className="space-y-3">
                  {allContacts().map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{c.name || '(unnamed)'}</span>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          {c.email && <span>✉️ {c.email}</span>}
                          {c.sms && <span>📱 {c.sms}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeContact(c.email, c.sms)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── THROTTLE & DIGEST TAB ─────────────────────────────────────── */}
        {activeTab === 'throttle' && (
          <div className="space-y-6">
            {[0, 1, 2].map(lvl => {
              const meta = LEVEL_META[lvl];
              const levelConfig = rules.global.levels[lvl];
              const emailT = levelConfig?.throttle?.email || defaultThrottle();
              const smsT = levelConfig?.throttle?.sms || defaultThrottle();

              return (
                <div key={lvl} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{meta.icon}</span>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Level {lvl} — {meta.name}</h2>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{meta.desc}</p>

                  {lvl === 0 ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
                      ⚠️ Critical alerts <strong>always send immediately</strong> and bypass quiet hours. No throttle configuration needed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email settings */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">✉️ Email</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Mode</label>
                            <select
                              value={emailT.mode}
                              onChange={e => updateThrottle(lvl, 'email', 'mode', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                            >
                              {THROTTLE_MODES.map(m => (
                                <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                              ))}
                            </select>
                          </div>
                          {emailT.mode === 'throttled' && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Max 1 alert every</label>
                              <select
                                value={emailT.minutes || 60}
                                onChange={e => updateThrottle(lvl, 'email', 'minutes', Number(e.target.value))}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                              >
                                {THROTTLE_MINUTES.map(m => (
                                  <option key={m} value={m}>{m} minutes</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {emailT.mode === 'digest' && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Send digest every</label>
                              <select
                                value={emailT.digestHours || 4}
                                onChange={e => updateThrottle(lvl, 'email', 'digestHours', Number(e.target.value))}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                              >
                                {DIGEST_HOURS.map(h => (
                                  <option key={h} value={h}>Every {h} hour{h > 1 ? 's' : ''}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SMS settings */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">📱 SMS</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Mode</label>
                            <select
                              value={smsT.mode}
                              onChange={e => updateThrottle(lvl, 'sms', 'mode', e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                            >
                              {THROTTLE_MODES.map(m => (
                                <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                              ))}
                            </select>
                          </div>
                          {smsT.mode === 'throttled' && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Max 1 alert every</label>
                              <select
                                value={smsT.minutes || 60}
                                onChange={e => updateThrottle(lvl, 'sms', 'minutes', Number(e.target.value))}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                              >
                                {THROTTLE_MINUTES.map(m => (
                                  <option key={m} value={m}>{m} minutes</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {smsT.mode === 'digest' && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Send digest every</label>
                              <select
                                value={smsT.digestHours || 4}
                                onChange={e => updateThrottle(lvl, 'sms', 'digestHours', Number(e.target.value))}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                              >
                                {DIGEST_HOURS.map(h => (
                                  <option key={h} value={h}>Every {h} hour{h > 1 ? 's' : ''}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── QUIET HOURS TAB ───────────────────────────────────────────── */}
        {activeTab === 'quiet' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🌙 Quiet Hours</h2>
            <p className="text-gray-500 text-sm mb-6">
              During quiet hours, SMS alerts are suppressed (queued for morning). Email still sends for Level 0 (Critical).
              Timezone: <strong>America/New_York (ET)</strong>
            </p>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quietHours.enabled}
                  onChange={e => setQuietHours({ ...quietHours, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-[#0072CE] focus:ring-[#0072CE]"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable quiet hours</span>
              </label>

              {quietHours.enabled && (
                <div className="flex flex-col sm:flex-row gap-4 ml-8">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start (suppress from)</label>
                    <input
                      type="time"
                      value={quietHours.start}
                      onChange={e => setQuietHours({ ...quietHours, start: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End (resume at)</label>
                    <input
                      type="time"
                      value={quietHours.end}
                      onChange={e => setQuietHours({ ...quietHours, end: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0072CE] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300 mt-4">
                <strong>Note:</strong> Level 0 (Critical) alerts <strong>always</strong> send immediately via both email and SMS, even during quiet hours.
              </div>
            </div>
          </div>
        )}

        {/* ── ESCALATION LEVELS TAB ─────────────────────────────────────── */}
        {activeTab === 'levels' && (
          <div className="space-y-6">
            {[0, 1, 2].map(lvl => {
              const meta = LEVEL_META[lvl];
              const levelConfig = rules.global.levels[lvl] || defaultLevel(lvl);
              const contacts = levelConfig.contacts || [];

              return (
                <div key={lvl} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{meta.icon}</span>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Level {lvl} — {meta.name}</h2>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{meta.desc}</p>

                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contacts for this level ({contacts.length})
                  </h3>

                  {contacts.length === 0 ? (
                    <p className="text-gray-400 text-sm mb-3">No contacts assigned. Add contacts in the Contacts tab first.</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {contacts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm">
                          <div>
                            <span className="font-medium">{c.name || '(unnamed)'}</span>
                            <span className="text-gray-400 ml-2">
                              {c.email && `✉️ ${c.email}`} {c.sms && `📱 ${c.sms}`}
                            </span>
                          </div>
                          <button
                            onClick={() => removeContactFromLevel(String(lvl), c.email, c.sms)}
                            className="text-red-400 hover:text-red-600 text-xs font-medium"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick add from all contacts */}
                  {allContacts().filter(ac => !contacts.some(c => c.email === ac.email && c.sms === ac.sms)).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Add existing contact:</p>
                      <div className="flex flex-wrap gap-2">
                        {allContacts()
                          .filter(ac => !contacts.some(c => c.email === ac.email && c.sms === ac.sms))
                          .map((ac, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                const updated = { ...rules };
                                if (!updated.global.levels[lvl].contacts) updated.global.levels[lvl].contacts = [];
                                updated.global.levels[lvl].contacts.push({ ...ac });
                                setRules(updated);
                              }}
                              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                            >
                              + {ac.name || ac.email}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
