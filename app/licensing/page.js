'use client';
/**
 * FacilityH2O — Accounts Control Matrix (owner only)
 * One row per client account: account type (tier), status, and asset cap —
 * with one-click upgrade/downgrade, suspend/reactivate, password reset,
 * and a per-account audit trail. Tiers are defined in lib/tiers.js.
 */
import { useEffect, useState, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { TIERS, TIER_BY_ID } from '@/lib/tiers';

const FEATURE_LABELS = {
  boiler:'Boiler', chilled:'Chilled', st108:'ST108', legionella:'Legionella', coc:'Chain of custody',
  advisor:'AI advisor', reports:'Reports', compliance:'Compliance', api_access:'API access', custom_equipment:'Custom equipment',
};
const STATUSES = ['trial','active','past_due','suspended','cancelled'];
const STATUS_STYLE = {
  trial:'bg-blue-100 text-blue-700 border-blue-200',
  active:'bg-green-100 text-green-700 border-green-200',
  past_due:'bg-amber-100 text-amber-700 border-amber-200',
  suspended:'bg-orange-100 text-orange-700 border-orange-200',
  cancelled:'bg-gray-100 text-gray-500 border-gray-200',
};
function assetCap(plan) {
  const t = TIER_BY_ID[plan];
  if (!t) return '—';
  return t.assetLimit === null ? 'Unlimited' : `${t.assetLimit} units`;
}
const blank = () => ({ company:'', contactName:'', contactEmail:'', plan:'tier1', status:'trial',
  seats:1, facilities:1, features:[...(TIER_BY_ID['tier1']?.features || [])], renewalDate:'', notes:'' });

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find(c => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function LicensingPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [auditFor, setAuditFor] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 6000); };

  const load = () => fetch('/api/licenses', { credentials:'include' })
    .then(r => { if (r.status === 403) { setForbidden(true); return { licenses: [] }; } return r.json(); })
    .then(d => { setLicenses(d.licenses || []); setLoading(false); })
    .catch(() => setLoading(false));

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    if (u.id !== 'usr_ariley' && u.username !== 'ariley') { setForbidden(true); setLoading(false); return; }
    load();
  }, [router]);

  const stats = useMemo(() => {
    const by = (s) => licenses.filter(l => l.status === s).length;
    return { total: licenses.length, active: by('active'), trial: by('trial'), suspended: by('suspended') };
  }, [licenses]);

  const patchLicense = async (id, patch) => {
    setBusyId(id);
    const res = await fetch('/api/licenses', { method:'PATCH', credentials:'include',
      headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, ...patch }) });
    setBusyId(null);
    if (res.ok) { load(); } else { const e = await res.json().catch(() => ({})); alert(e.error || 'Update failed'); }
  };
  const changeTier = (lic, tierId) => {
    const t = TIER_BY_ID[tierId]; if (!t) return;
    patchLicense(lic.id, { plan: tierId, features: [...t.features] });
  };
  const toggleSuspend = (lic) => {
    const next = lic.status === 'suspended' ? 'active' : 'suspended';
    if (next === 'suspended' && !confirm(`Suspend service for ${lic.company}? Their users lose access until you reactivate.`)) return;
    patchLicense(lic.id, { status: next });
  };
  const resetPassword = async (lic) => {
    if (!lic.contactEmail) { alert('No contact email on file for this account. Add one with Edit first.'); return; }
    if (!confirm(`Send a password reset for ${lic.company}'s login (${lic.contactEmail})?`)) return;
    setBusyId(lic.id);
    const res = await fetch('/api/reset-password', { method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'request', username: lic.contactEmail }) });
    setBusyId(null);
    const d = await res.json().catch(() => ({}));
    flash(d.message || (res.ok ? 'Password reset sent.' : 'Reset failed.'));
  };
  const openAudit = async (lic) => {
    if (auditFor === lic.id) { setAuditFor(null); return; }
    setAuditFor(lic.id); setAuditLoading(true); setAuditLogs([]);
    const q = encodeURIComponent(lic.contactEmail || lic.company);
    const res = await fetch(`/api/audit?user=${q}`, { credentials:'include' });
    const d = await res.json().catch(() => ({ logs: [] }));
    setAuditLogs(d.logs || []);
    setAuditLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const method = form.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/licenses', { method, credentials:'include',
      headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setForm(null); load(); } else { const e = await res.json().catch(() => ({})); alert(e.error || 'Save failed'); }
  };
  const remove = async (id, company) => {
    if (!confirm(`Delete the account for ${company}? This cannot be undone.`)) return;
    await fetch(`/api/licenses?id=${id}`, { method:'DELETE', credentials:'include' });
    load();
  };
  const pickTier = (tierId) => {
    const t = TIER_BY_ID[tierId];
    setForm(f => ({ ...f, plan: tierId, features: t ? [...t.features] : f.features }));
  };

  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

  if (loading) return (<div className="flex"><Sidebar /><div className="flex-1 p-8 text-gray-400">Loading…</div></div>);
  if (forbidden) return (
    <div className="flex"><Sidebar />
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center"><div className="text-4xl mb-3">■</div>
          <div className="text-lg font-bold text-gray-900">Owner only</div>
          <div className="text-sm text-gray-500 mt-1">The accounts console is restricted to the account owner.</div></div>
      </div></div>
  );

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
              <p className="text-sm text-gray-500">Control every client account — tier, status, access, and audit trail.</p>
            </div>
            <button onClick={() => setForm(blank())}
              className="bg-[#0891B2] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#0E7490] transition">
              + New Account
            </button>
          </div>

          {/* STATUS ROLLUP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              ['Total Accounts', stats.total, 'text-gray-900'],
              ['Active', stats.active, 'text-green-600'],
              ['In Trial', stats.trial, 'text-blue-600'],
              ['Suspended', stats.suspended, 'text-orange-600'],
            ].map(([label, val, color]) => (
              <div key={label} className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-400">{label}</div>
                <div className={`text-2xl font-extrabold mt-1 ${color}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* CONTROL MATRIX */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Account Control Matrix</h2>
              <span className="text-xs text-gray-400">{licenses.length} total</span>
            </div>

            {licenses.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="text-3xl mb-2">[ORG]</div>
                <div className="text-sm text-gray-500 mb-4">No accounts yet. Add your first client.</div>
                <button onClick={() => setForm(blank())} className="bg-[#0891B2] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0E7490]">+ New Account</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[820px]">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 font-semibold">Account</th>
                      <th className="px-4 py-3 font-semibold">Account Type</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Assets</th>
                      <th className="px-4 py-3 font-semibold text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {licenses.map(l => (
                      <Fragment key={l.id}>
                        <tr className="hover:bg-gray-50 transition align-top">
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{l.company}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{l.contactEmail || 'no contact email'}</div>
                            {l.renewalDate && <div className="text-[11px] text-gray-400 mt-0.5">renews {l.renewalDate}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <select value={TIER_BY_ID[l.plan] ? l.plan : ''} disabled={busyId === l.id}
                              onChange={e => changeTier(l, e.target.value)}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0891B2] disabled:opacity-50">
                              {!TIER_BY_ID[l.plan] && <option value="">{l.plan || '— custom —'}</option>}
                              {TIERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${STATUS_STYLE[l.status] || ''}`}>{(l.status || '').replace('_',' ')}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{assetCap(l.plan)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 justify-end flex-wrap">
                              <button onClick={() => toggleSuspend(l)} disabled={busyId === l.id}
                                className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border disabled:opacity-50 ${l.status === 'suspended' ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-orange-300 text-orange-700 hover:bg-orange-50'}`}>
                                {l.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                              </button>
                              <button onClick={() => resetPassword(l)} disabled={busyId === l.id}
                                className="text-[11px] font-semibold rounded-lg px-2.5 py-1 border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50">Reset PW</button>
                              <button onClick={() => openAudit(l)}
                                className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border ${auditFor === l.id ? 'border-[#0891B2] text-[#0891B2] bg-cyan-50' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Audit</button>
                              <button onClick={() => setForm({ ...l })} className="text-[11px] font-semibold rounded-lg px-2.5 py-1 border border-gray-300 text-[#0891B2] hover:bg-gray-100">Edit</button>
                              <button onClick={() => remove(l.id, l.company)} className="text-[11px] font-semibold rounded-lg px-2.5 py-1 border border-gray-300 text-red-500 hover:bg-red-50">Delete</button>
                            </div>
                          </td>
                        </tr>
                        {auditFor === l.id && (
                          <tr className="bg-gray-50/70">
                            <td colSpan={5} className="px-4 py-3">
                              <div className="text-xs font-semibold text-gray-600 mb-2">Audit trail — {l.company}</div>
                              {auditLoading ? (
                                <div className="text-xs text-gray-400">Loading…</div>
                              ) : auditLogs.length === 0 ? (
                                <div className="text-xs text-gray-400">No recorded activity for this account yet.</div>
                              ) : (
                                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                                  {auditLogs.map(a => (
                                    <div key={a.id} className="px-3 py-2 flex items-start justify-between gap-3">
                                      <div>
                                        <span className="text-xs font-semibold text-gray-800">{a.action || a.type}</span>
                                        {a.detail && <span className="text-xs text-gray-500"> — {a.detail}</span>}
                                      </div>
                                      <div className="text-[10px] text-gray-400 whitespace-nowrap">{fmtDate(a.createdAt)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-400 mt-4 text-center">
            Tiers and asset caps are defined in lib/tiers.js. Changing an account's tier resets its features to that tier. Prices are not set yet.
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-[60]">{toast}</div>
      )}

      {/* CREATE / EDIT DRAWER */}
      {form && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Account' : 'New Account'}</h2>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            <div className="space-y-4">
              {[['company','Company name','text'],['contactName','Contact name','text'],['contactEmail','Contact email (their login)','email']].map(([k,label,type]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Account type (tier)</label>
                  <select value={TIER_BY_ID[form.plan] ? form.plan : 'tier1'} onChange={e => pickTier(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {TIERS.map(t => <option key={t.id} value={t.id}>{t.name} — {t.assetLimit === null ? 'Unlimited' : t.assetLimit + ' units'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['seats','Seats (users)'],['facilities','Facilities (sites)']].map(([k,label]) => (
                  <div key={k}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                    <input type="number" min="0" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-cyan-50 border border-cyan-100 px-3 py-2 text-xs text-cyan-800">
                Features for this tier: {(form.features || []).map(f => FEATURE_LABELS[f] || f).join(', ') || 'none'}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Renewal / trial-end date</label>
                <input type="date" value={form.renewalDate} onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <button onClick={save} disabled={saving || !form.company}
                className="w-full bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">
                {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
