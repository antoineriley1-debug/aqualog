'use client';
/**
 * Shift Schedules — editable per facility (owner: all facilities; org admin: own org only).
 * Each shift has start, end, on/off, and the facility has a timezone.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const SHIFTS = ['1st Shift', '2nd Shift', '3rd Shift'];
const TZ_LABEL = {
  'America/New_York':'Eastern','America/Chicago':'Central','America/Denver':'Mountain',
  'America/Phoenix':'Arizona (no DST)','America/Los_Angeles':'Pacific','America/Anchorage':'Alaska','Pacific/Honolulu':'Hawaii',
};

export default function ShiftSchedulesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [timezones, setTimezones] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const load = () => fetch('/api/shift-schedules', { credentials:'include' })
    .then(r => { if (r.status === 403) { setForbidden(true); return null; } return r.json(); })
    .then(d => { if (d) { setFacilities(d.facilities||[]); setSchedules(d.schedules||{}); setTimezones(d.timezones||[]); } setLoading(false); })
    .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const update = (fid, path, value) => {
    setSchedules(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (path === 'timezone') next[fid].timezone = value;
      else { const [shift, field] = path; next[fid].shifts[shift][field] = value; }
      return next;
    });
  };

  const save = async (fid) => {
    setSavingId(fid); setSavedId(null);
    try {
      const res = await fetch('/api/shift-schedules', {
        method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ facilityId: fid, schedule: schedules[fid] }),
      });
      if (res.ok) { setSavedId(fid); setTimeout(()=>setSavedId(null), 2500); }
      else { const e = await res.json(); alert(e.error || 'Save failed'); }
    } catch { alert('Connection error.'); }
    finally { setSavingId(null); }
  };

  if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-8 text-gray-400">Loading…</div></div>;
  if (forbidden) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-3">🔒</div><b className="text-gray-900">Admins only</b><div className="text-sm text-gray-500 mt-1">Shift schedules are managed by administrators.</div></div></div></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-flex items-center gap-1">← Back</button>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">⏱️ Shift Schedules</h1>
          <p className="text-gray-500 text-sm mt-1">Set each facility's shift hours and timezone. Readings not logged by a shift's end become missed-reading alerts.</p>
        </div>

        {/* HOW THIS WORKS */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 max-w-3xl">
          <div className="font-bold text-blue-900 mb-2 flex items-center gap-2">📘 How shift schedules work</div>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-900/90">
            <li><b>Each facility has three shifts</b> (1st, 2nd, 3rd). For every shift you set a <b>Start</b> and <b>End</b> time — the window operators are expected to log a reading in.</li>
            <li><b>Set the timezone</b> (top-right of each facility card) so shift windows follow that facility's local clock. Daylight saving is handled automatically.</li>
            <li><b>Turn a shift off</b> with its checkbox if a facility doesn't run it (for example, no overnight coverage). An off shift is greyed out and <b>will never be flagged as a missed reading</b>.</li>
            <li><b>The 3rd shift can cross midnight</b> (e.g. <b>21:00 → 05:30</b>). That's expected — just enter the times and the system understands it spans two days.</li>
            <li><b>Click "Save Schedule"</b> on a facility card to apply your changes. You'll see a green ✓ Saved confirmation. Changes take effect immediately.</li>
          </ol>
          <div className="text-xs text-blue-800/70 mt-3 pt-3 border-t border-blue-200">
            <b>Why it matters:</b> once a shift's End time passes, if no reading was logged for a system that facility runs, it appears as an amber <b>missed-reading alert</b> on the Alerts page until someone logs it.
          </div>
        </div>

        {facilities.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-3xl">
            <div className="text-3xl mb-2">🏥</div>
            <div className="font-semibold text-gray-900">No facilities available to edit</div>
            <div className="text-sm text-gray-500 mt-1">Your account doesn't have any facilities assigned yet. If you expect to see facilities here, check that you're signed in to the right account, or contact your administrator.</div>
          </div>
        )}

        <div className="space-y-5 max-w-3xl">
          {facilities.map(f => {
            const sch = schedules[f.id]; if (!sch) return null;
            const editable = f.canEdit;
            return (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-gray-900">{f.name}</div>
                    <div className="text-xs text-gray-400">{f.code}{!editable && ' · view only'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Timezone</label>
                    <select disabled={!editable} value={sch.timezone} onChange={e=>update(f.id,'timezone',e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400">
                      {timezones.map(tz => <option key={tz} value={tz}>{TZ_LABEL[tz]||tz}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {SHIFTS.map(name => {
                    const sh = sch.shifts[name];
                    return (
                      <div key={name} className={`flex items-center gap-3 flex-wrap rounded-xl border p-3 ${sh.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
                        <label className="flex items-center gap-2 w-28 flex-shrink-0">
                          <input type="checkbox" disabled={!editable} checked={sh.enabled} onChange={e=>update(f.id,[name,'enabled'],e.target.checked)} className="accent-[#0891B2]" />
                          <span className={`text-sm font-semibold ${sh.enabled?'text-gray-900':'text-gray-400'}`}>{name}</span>
                        </label>
                        <div className={`flex items-center gap-2 ${!sh.enabled && 'opacity-40'}`}>
                          <span className="text-xs text-gray-500">Start</span>
                          <input type="time" disabled={!editable||!sh.enabled} value={sh.start} onChange={e=>update(f.id,[name,'start'],e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-50" />
                          <span className="text-xs text-gray-500">End</span>
                          <input type="time" disabled={!editable||!sh.enabled} value={sh.end} onChange={e=>update(f.id,[name,'end'],e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-50" />
                        </div>
                        {!sh.enabled && <span className="text-xs text-gray-400">Off — won't be flagged as missed</span>}
                      </div>
                    );
                  })}
                </div>
                {editable && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <button onClick={()=>save(f.id)} disabled={savingId===f.id}
                      className="bg-[#0891B2] text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">
                      {savingId===f.id ? 'Saving…' : 'Save Schedule'}
                    </button>
                    {savedId===f.id && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
                    <span className="text-xs text-gray-400 ml-auto">3rd shift may cross midnight (e.g. 21:00 → 05:30) — that's fine.</span>
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
