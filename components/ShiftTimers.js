'use client';
/**
 * ShiftTimers — live, per-facility shift status shown on the dashboard.
 * Reads each facility's schedule + timezone and today's entries to show:
 *   🟢 logged · 🟡 open (countdown) · 🔴 missed (closed, no reading) · ⚪ off/upcoming
 * Computed fresh on load and ticks every minute. No cron needed for this view.
 */
import { useEffect, useState } from 'react';
import { shiftStatus, nowInZone, normalizeSchedule, SHIFT_NAMES } from '@/lib/shiftSchedule';

function fmtLeft(mins) {
  if (mins == null) return '';
  const h = Math.floor(mins/60), m = mins%60;
  return h>0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function ShiftTimers() {
  const [data, setData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/shift-schedules', { credentials:'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/entries', { credentials:'include' }).then(r => r.json()),
    ]).then(([sch, ent]) => { setData(sch); setEntries(ent.entries || []); }).catch(()=>{});
    const t = setInterval(() => setTick(x => x+1), 60000); // re-render every minute
    return () => clearInterval(t);
  }, []);

  if (!data || !data.facilities?.length) return null;

  const hasReading = (fid, system, shift, dateStr) =>
    entries.some(e => e.hospitalId === fid && e.system === system && e.shift === shift && e.date === dateStr);

  // Build rows only for facilities that have at least one enabled shift
  const rows = data.facilities.map(f => {
    const sch = normalizeSchedule(data.schedules[f.id]);
    const { date } = nowInZone(sch.timezone);
    const shiftCells = SHIFT_NAMES.filter(n => sch.shifts[n].enabled).map(name => {
      const st = shiftStatus(sch.shifts[name], sch.timezone);
      // a shift "needs" both systems; consider it logged if BOTH boiler+chilled are in
      const boiler = hasReading(f.id, 'boiler', name, date);
      const chilled = hasReading(f.id, 'chilled', name, date);
      const bothLogged = boiler && chilled;
      let status, label, tone;
      if (st.state === 'open') {
        status = bothLogged ? 'logged' : 'open';
        if (bothLogged) { label = 'Logged'; tone = 'green'; }
        else { label = fmtLeft(st.minutesUntilClose); tone = 'amber'; }
      } else if (st.state === 'closed' || st.morningClosed) {
        status = bothLogged ? 'logged' : 'missed';
        label = bothLogged ? 'Logged' : 'Missed'; tone = bothLogged ? 'green' : 'red';
      } else { // upcoming
        status = 'upcoming'; label = 'Upcoming'; tone = 'gray';
      }
      // partial logging note
      const partial = !bothLogged && (boiler || chilled) ? (boiler ? 'chilled missing' : 'boiler missing') : '';
      return { name, status, label, tone, partial };
    });
    const anyMissed = shiftCells.some(c => c.status === 'missed');
    const anyOpen = shiftCells.some(c => c.status === 'open');
    return { f, shiftCells, anyMissed, anyOpen };
  });

  const toneClass = {
    green:'bg-green-100 text-green-700 border-green-200',
    amber:'bg-amber-100 text-amber-700 border-amber-200',
    red:'bg-red-100 text-red-700 border-red-200',
    gray:'bg-gray-100 text-gray-500 border-gray-200',
  };
  const totalMissed = rows.reduce((a,r)=>a+r.shiftCells.filter(c=>c.status==='missed').length,0);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-700">⏱️ Shift Reading Status — today</h2>
        {totalMissed > 0
          ? <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">🔴 {totalMissed} missed reading{totalMissed!==1?'s':''}</span>
          : <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">✓ All caught up</span>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {rows.map(({f, shiftCells, anyMissed}) => (
          <div key={f.id} className={`px-4 py-3 flex items-center gap-3 flex-wrap ${anyMissed?'bg-red-50/40':''}`}>
            <div className="w-48 flex-shrink-0 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{f.name}</div>
              <div className="text-xs text-gray-400">{f.code}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {shiftCells.length === 0 && <span className="text-xs text-gray-400">No shifts configured</span>}
              {shiftCells.map(c => (
                <span key={c.name} className={`text-xs font-semibold border rounded-lg px-2.5 py-1 ${toneClass[c.tone]}`} title={c.partial || ''}>
                  {c.name.replace(' Shift','')}: {c.label}{c.partial?` (${c.partial})`:''}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
