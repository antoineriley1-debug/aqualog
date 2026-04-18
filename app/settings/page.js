'use client';
/**
 * FacilityH2O — Owner Settings (ariley only)
 * Author & Owner: Antoine Riley
 * Global theme control — changes apply to ALL users site-wide.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const PRESET_META = {
  FacilityH2O:  { label: 'MedStar (Default)', preview: ['#003366','#0072CE','#F6C90E'], dark: false },
  dark:     { label: 'Dark Mode',         preview: ['#0d1526','#0072CE','#F6C90E'], dark: true  },
  ocean:    { label: 'Ocean',             preview: ['#0c4a6e','#0891b2','#22d3ee'], dark: false },
  forest:   { label: 'Forest',            preview: ['#14532d','#16a34a','#86efac'], dark: false },
  midnight: { label: 'Midnight',          preview: ['#1e1b4b','#6366f1','#a5b4fc'], dark: true  },
  slate:    { label: 'Slate',             preview: ['#1e293b','#475569','#94a3b8'], dark: true  },
  crimson:  { label: 'Crimson',           preview: ['#7f1d1d','#dc2626','#fca5a5'], dark: true  },
};

export default function SettingsPage() {
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState(null);
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState(null);
  const [custom, setCustom] = useState({ primary: '#0072CE', navy: '#003366', accent: '#F6C90E', mode: 'light' });
  const [testingAlert, setTestingAlert] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u || (u.id !== 'usr_ariley' && u.username !== 'ariley')) { router.push('/dashboard'); return; }
    fetch('/api/theme').then((r) => r.json()).then((d) => {
      setCurrentTheme(d.theme);
      if (d.theme) setCustom({ primary: d.theme.primary, navy: d.theme.navy, accent: d.theme.accent || '#F6C90E', mode: d.theme.mode || 'light' });
    });
  }, []);

  const applyPreset = async (preset) => {
    setSaving(preset); setMsg(null);
    const res  = await fetch('/api/theme', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset }),
    });
    const data = await res.json();
    setSaving(null);
    if (data.ok) {
      setCurrentTheme(data.theme);
      setMsg({ type: 'success', text: `Theme changed to "${PRESET_META[preset]?.label}". Refresh to see changes site-wide.` });
      // Apply locally immediately
      applyThemeLocally(data.theme);
    } else {
      setMsg({ type: 'error', text: data.error });
    }
  };

  const applyCustom = async () => {
    setSaving('custom'); setMsg(null);
    const res  = await fetch('/api/theme', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom }),
    });
    const data = await res.json();
    setSaving(null);
    if (data.ok) {
      setCurrentTheme(data.theme);
      setMsg({ type: 'success', text: 'Custom theme saved. Refresh to see changes site-wide.' });
      applyThemeLocally(data.theme);
    } else {
      setMsg({ type: 'error', text: data.error });
    }
  };

  const fireTestAlert = async () => {
    setTestingAlert(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-alert', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingAlert(false);
    }
  };

  const applyThemeLocally = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--navy', theme.navy);
    root.style.setProperty('--FacilityH2O-blue', theme.primary);
    root.style.setProperty('--accent', theme.accent || '#F6C90E');
    if (theme.mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            ?? Changes you make here apply to <strong>all users</strong> across the entire site.
          </p>
        </div>

        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* Color Scheme Presets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-1">Color Scheme</h2>
          <p className="text-sm text-gray-500 mb-5">Select a preset — changes the colors and light/dark mode for everyone.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(PRESET_META).map(([key, meta]) => {
              const isActive = currentTheme?.preset === key;
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  disabled={saving === key}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isActive ? 'border-[#0072CE] ring-2 ring-[#0072CE]/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Color preview dots */}
                  <div className="flex gap-1.5 mb-3">
                    {meta.preview.map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">{meta.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{meta.dark ? '?? Dark' : '?? Light'}</div>
                  {isActive && <div className="text-xs text-[#0072CE] font-bold mt-1">? Active</div>}
                  {saving === key && <div className="text-xs text-gray-400 mt-1">Applying...</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-1">Custom Colors</h2>
          <p className="text-sm text-gray-500 mb-5">Set your own hex colors for full control.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { key: 'primary', label: 'Primary Blue', hint: 'Buttons, links, highlights' },
              { key: 'navy',    label: 'Sidebar / Header', hint: 'Navigation background' },
              { key: 'accent',  label: 'Accent', hint: 'Badges, highlights' },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={custom[key] || '#000000'}
                    onChange={(e) => setCustom((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={custom[key] || ''}
                    onChange={(e) => setCustom((p) => ({ ...p, [key]: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">{hint}</div>
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mode</label>
              <div className="flex gap-2 mt-1">
                {['light', 'dark'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCustom((p) => ({ ...p, mode: m }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                      custom.mode === m ? 'bg-[#0072CE] text-white border-[#0072CE]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {m === 'light' ? '?? Light' : '?? Dark'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview strip */}
          <div className="flex gap-2 mb-4 p-3 rounded-lg border border-gray-200 items-center">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: custom.navy }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: custom.primary }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: custom.accent }} />
            <span className="text-xs text-gray-500 ml-2">Preview</span>
            <div className="ml-auto flex gap-2">
              <div className="px-3 py-1 rounded text-white text-xs font-semibold" style={{ backgroundColor: custom.primary }}>Button</div>
              <div className="px-3 py-1 rounded text-xs font-semibold" style={{ backgroundColor: custom.accent, color: custom.navy }}>Badge</div>
            </div>
          </div>

          <button
            onClick={applyCustom}
            disabled={saving === 'custom'}
            className="bg-[#0072CE] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#005fa3] transition disabled:opacity-50"
          >
            {saving === 'custom' ? 'Applying...' : '?? Apply Custom Theme'}
          </button>
        </div>

        {/* -- TEST ALERT SYSTEM -- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">??</div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-800">Test Alert Notifications</h2>
              <p className="text-sm text-gray-500 mt-1">
                Fires a real test email and SMS to every configured recipient to verify your notification system is working. This is logged to the audit trail.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="font-semibold text-gray-700">?? Email:</span> Sends to <code className="bg-gray-100 px-1 rounded text-xs">ALERT_EMAIL_TO</code> env var + notification rules
                </div>
                <div>
                  <span className="font-semibold text-gray-700">?? SMS:</span> Sends to all phone numbers in notification rules (Twilio)
                </div>
              </div>

              <button
                onClick={fireTestAlert}
                disabled={testingAlert}
                className="mt-4 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                {testingAlert ? (
                  <><span className="animate-spin">?</span> Sending test alert...</>
                ) : (
                  <>?? Send Test Alert</>
                )}
              </button>

              {/* Results */}
              {testResult && (
                <div className="mt-4 rounded-xl border overflow-hidden">
                  {/* Email result */}
                  <div className={`flex items-start gap-3 p-4 border-b ${testResult.email?.ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <span className="text-lg">{testResult.email?.ok ? '?' : '?'}</span>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        Email — {testResult.email?.ok ? 'Sent Successfully' : 'Failed'}
                      </div>
                      {testResult.email?.ok ? (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Delivered to: {testResult.email?.recipients?.join(', ') || 'configured recipients'}
                          {testResult.email?.messageId && <span className="ml-2 text-gray-400">ID: {testResult.email.messageId}</span>}
                        </div>
                      ) : (
                        <div className="text-xs text-red-600 mt-0.5">{testResult.email?.error}</div>
                      )}
                    </div>
                  </div>
                  {/* SMS result */}
                  <div className={`flex items-start gap-3 p-4 ${testResult.sms?.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className="text-lg">{testResult.sms?.ok ? '?' : '?'}</span>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        SMS — {testResult.sms?.ok ? 'Sent Successfully' : 'Failed / Not Configured'}
                      </div>
                      {testResult.sms?.ok ? (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Sent to: {testResult.sms?.recipients?.join(', ') || 'configured numbers'}
                        </div>
                      ) : (
                        <div className="text-xs text-red-600 mt-0.5">{testResult.sms?.error}</div>
                      )}
                    </div>
                  </div>
                  {/* Timestamp */}
                  {testResult.timestamp && (
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                      Test fired at: {testResult.timestamp}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
