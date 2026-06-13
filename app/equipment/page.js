'use client';
/**
 * Facility Equipment — which water systems each facility has.
 * Toggle systems off for sites that don't have them (e.g. steam sites with no boiler).
 * A system turned off is not offered for logging and never flagged as a missed reading.
 * Owner edits any facility; org admin edits only their own.
 */
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function EquipmentPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [systems, setSystems] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const load = () => fetch('/api/equipment-profile', { credentials:'include' })
    .then(r => { if (r.status === 403) { setForbidden(true); return null; } return r.json(); })
    .then(d => {
      if (d) {
        setFacilities(d.facilities||[]); setSystems(d.systems||[]);
        const map = {}; (d.facilities||[]).forEach(f => { map[f.id] = { ...f.profile }; });
        setProfiles(map);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const toggle = (fid, key) => setProfiles(prev => ({ ...prev, [fid]: { ...prev[fid], [key]: !prev[fid][key] } }));

  const save = async (fid) => {
    setSavingId(fid); setSavedId(null);
    try {
      const res = await fetch('/api/equipment-profile', {
        method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ facilityId: fid, profile: profiles[fid] }),
      });
      if (res.ok) { setSavedId(fid); setTimeout(()=>setSavedId(null), 2500); }
      else { const e = await res.json(); alert(e.error || 'Save failed'); }
    } catch { alert('Connection error.'); }
    finally { setSavingId(null); }
  };

  if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-8 text-gray-400">Loading…</div></div>;
  if (forbidden) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-3">🔒</div><b className="text-gray-900">Admins only</b><div className="text-sm text-gray-500 mt-1">Equipment setup is managed by administrators.</div></div></div></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🛠️ Facility Equipment</h1>
          <p className="text-gray-500 text-sm mt-1">Turn off any system a facility doesn't have (e.g. a steam-fed site with no boiler). Systems left off aren't offered for logging and never count as missed readings.</p>
        </div>

        <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-3xl">
          ⚠️ Cooling tower, condensate, and softener ranges are typical industry defaults — verify them against your water treatment program.
        </div>

        {facilities.length === 0 && <div className="text-gray-400 text-sm">No facilities available.</div>}

        <div className="space-y-4 max-w-3xl">
          {facilities.map(f => {
            const prof = profiles[f.id] || {};
            const editable = f.canEdit;
            return (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="font-bold text-gray-900">{f.name}</div>
                  <div className="text-xs text-gray-400">{f.code}{!editable && ' · view only'}</div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {systems.map(sys => {
                    const on = !!prof[sys.key];
                    return (
                      <label key={sys.key} className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition ${on ? 'border-[#0891B2] bg-cyan-50/40' : 'border-gray-200 bg-gray-50'} ${!editable && 'cursor-default opacity-80'}`}>
                        <span className={`text-sm font-semibold ${on?'text-gray-900':'text-gray-400'}`}>{sys.icon} {sys.label}</span>
                        <input type="checkbox" disabled={!editable} checked={on} onChange={()=>toggle(f.id, sys.key)} className="accent-[#0891B2] w-4 h-4" />
                      </label>
                    );
                  })}
                </div>
                {editable && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <button onClick={()=>save(f.id)} disabled={savingId===f.id}
                      className="bg-[#0891B2] text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">
                      {savingId===f.id ? 'Saving…' : 'Save Equipment'}
                    </button>
                    {savedId===f.id && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
