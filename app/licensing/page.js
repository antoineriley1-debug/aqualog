'use client';
/**
 * FacilityH2O — Licensing & Sales Command Center (owner only)
 * Create client companies, control what each gets, see who's active,
 * and read the sales rollup. No payments yet — Square slots in later.
 */
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const FEATURES = [
  ['boiler','Boiler logging'], ['chilled','Chilled water'], ['st108','ST108 log'],
  ['legionella','Legionella / WMP'], ['coc','Chain of custody'], ['advisor','AI advisor'],
  ['reports','PDF reports'], ['compliance','Compliance center'], ['api_access','API access'],
];
const STATUSES = ['trial','active','past_due','suspended','cancelled'];
const STATUS_STYLE = {
  trial:'bg-blue-100 text-blue-700 border-blue-200',
  active:'bg-green-100 text-green-700 border-green-200',
  past_due:'bg-amber-100 text-amber-700 border-amber-200',
  suspended:'bg-orange-100 text-orange-700 border-orange-200',
  cancelled:'bg-gray-100 text-gray-500 border-gray-200',
};
const blank = () => ({ company:'', contactName:'', contactEmail:'', plan:'standard', status:'trial',
  seats:1, facilities:1, features:['boiler','chilled','reports'], monthlyValue:0, renewalDate:'', notes:'' });

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
  const [form, setForm] = useState(null);   // null = closed; object = create/edit
  const [saving, setSaving] = useState(false);

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
    const active = licenses.filter(l => l.status === 'active');
    const trial = licenses.filter(l => l.status === 'trial');
    const mrr = active.reduce((s, l) => s + (Number(l.monthlyValue) || 0), 0);
    const pipeline = trial.reduce((s, l) => s + (Number(l.monthlyValue) || 0), 0);
    const facilities = active.reduce((s, l) => s + (Number(l.facilities) || 0), 0);
    return { total: licenses.length, active: active.length, trial: trial.length, mrr, pipeline, facilities, arr: mrr * 12 };
  }, [licenses]);

  const save = async () => {
    setSaving(true);
    const method = form.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/licenses', { method, credentials:'include',
      headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setForm(null); load(); } else { const e = await res.json(); alert(e.error || 'Save failed'); }
  };
  const remove = async (id, company) => {
    if (!confirm(`Delete the license for ${company}? This cannot be undone.`)) return;
    await fetch(`/api/licenses?id=${id}`, { method:'DELETE', credentials:'include' });
    load();
  };
  const toggleFeature = (key) => setForm(f => ({ ...f,
    features: f.features.includes(key) ? f.features.filter(x => x !== key) : [...f.features, key] }));

  const money = (n) => '$' + (Number(n) || 0).toLocaleString();

  if (loading) return (<div className="flex"><Sidebar /><div className="flex-1 p-8 text-gray-400">Loading…</div></div>);
  if (forbidden) return (
    <div className="flex"><Sidebar />
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center"><div className="text-4xl mb-3">🔒</div>
          <div className="text-lg font-bold text-gray-900">Owner only</div>
          <div className="text-sm text-gray-500 mt-1">The licensing console is restricted to the account owner.</div></div>
      </div></div>
  );

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Licensing &amp; Sales</h1>
              <p className="text-sm text-gray-500">Your revenue rollup and every client license, in one place.</p>
            </div>
            <button onClick={() => setForm(blank())}
              className="bg-[#0891B2] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#0E7490] transition">
              + New Client License
            </button>
          </div>

          {/* SALES ROLLUP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              ['Monthly Recurring', money(stats.mrr), `${stats.active} active`, 'from-green-500 to-emerald-600'],
              ['Annual Run-Rate', money(stats.arr), 'MRR × 12', 'from-cyan-500 to-blue-600'],
              ['Trial Pipeline', money(stats.pipeline), `${stats.trial} in trial`, 'from-blue-500 to-indigo-600'],
              ['Facilities Licensed', String(stats.facilities), `${stats.total} clients`, 'from-violet-500 to-purple-600'],
            ].map(([label, val, sub, grad]) => (
              <div key={label} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${grad} shadow-md`}>
                <div className="text-xs font-medium opacity-90">{label}</div>
                <div className="text-2xl font-extrabold mt-1">{val}</div>
                <div className="text-[11px] opacity-80 mt-1">{sub}</div>
              </div>
            ))}
          </div>

          {/* CLIENT COUNTS (merged from the former Revenue & Sales page) */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl p-5 bg-white border border-gray-100">
              <div className="text-xs text-gray-400">Total Clients</div>
              <div className="text-2xl font-extrabold mt-1 text-gray-900">{stats.total}</div>
            </div>
            <div className="rounded-2xl p-5 bg-white border border-gray-100">
              <div className="text-xs text-gray-400">Active Clients</div>
              <div className="text-2xl font-extrabold mt-1 text-green-600">{stats.active}</div>
            </div>
            <div className="rounded-2xl p-5 bg-white border border-gray-100">
              <div className="text-xs text-gray-400">In Trial</div>
              <div className="text-2xl font-extrabold mt-1 text-amber-600">{stats.trial}</div>
            </div>
          </div>

          {/* CLIENT LIST */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Client Licenses</h2>
              <span className="text-xs text-gray-400">{licenses.length} total</span>
            </div>
            {licenses.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-sm text-gray-500 mb-4">No client licenses yet. Add the first company you're licensing to.</div>
                <button onClick={() => setForm(blank())} className="bg-[#0891B2] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0E7490]">+ New Client License</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {licenses.map(l => (
                  <div key={l.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{l.company}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${STATUS_STYLE[l.status] || ''}`}>{l.status.replace('_',' ')}</span>
                          <span className="text-[11px] text-gray-400">{l.plan}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {l.contactName ? `${l.contactName} · ` : ''}{l.contactEmail || 'no contact email'} · {l.facilities} facilities · {l.seats} seats
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {l.features.map(f => (
                            <span key={f} className="text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-100 rounded px-1.5 py-0.5">
                              {(FEATURES.find(x => x[0] === f) || [f, f])[1]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{money(l.monthlyValue)}<span className="text-xs font-normal text-gray-400">/mo</span></div>
                        {l.renewalDate && <div className="text-[11px] text-gray-400 mt-0.5">renews {l.renewalDate}</div>}
                        <div className="flex gap-2 mt-2 justify-end">
                          <button onClick={() => setForm({ ...l })} className="text-xs text-[#0891B2] font-semibold hover:underline">Edit</button>
                          <button onClick={() => remove(l.id, l.company)} className="text-xs text-red-500 font-semibold hover:underline">Delete</button>
                        </div>
                      </div>
                    </div>
                    {l.notes && <div className="text-xs text-gray-400 mt-2 italic">{l.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-400 mt-4 text-center">
            Payment processing not yet connected. Monthly values are what you intend to bill; Square integration plugs into the billing fields when you're ready.
          </div>
        </div>
      </div>

      {/* CREATE / EDIT DRAWER */}
      {form && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit License' : 'New Client License'}</h2>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              {[['company','Company name','text'],['contactName','Contact name','text'],['contactEmail','Contact email','email']].map(([k,label,type]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Plan</label>
                  <input value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['seats','Seats'],['facilities','Facilities'],['monthlyValue','$/month']].map(([k,label]) => (
                  <div key={k}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                    <input type="number" min="0" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Features granted</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map(([key, label]) => (
                    <label key={key} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg border cursor-pointer transition ${form.features.includes(key) ? 'bg-cyan-50 border-cyan-300 text-cyan-800' : 'border-gray-200 text-gray-500'}`}>
                      <input type="checkbox" checked={form.features.includes(key)} onChange={() => toggleFeature(key)} className="accent-[#0891B2]" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Renewal date</label>
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
                {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create License'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
