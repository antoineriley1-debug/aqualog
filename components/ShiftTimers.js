'use client';
/**
 * ShiftTimers — live, per-facility shift status on the dashboard.
 * For each facility it checks ONLY the systems that facility actually has
 * (from its equipment profile). A shift is "logged" only when every system
 * the facility has was logged for that shift; otherwise open (countdown) or missed.
 */
import { useEffect, useState } from 'react';
import { shiftStatus, nowInZone, normalizeSchedule, SHIFT_NAMES } from '@/lib/shiftSchedule';
import { SYSTEM_META } from '@/lib/systemFields';

function fmtLeft(mins) {
  if (mins == null) return '';
  const h = Math.floor(mins/60), m = mins%60;
  return h>0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function ShiftTimers() {
  const [data, setData] = useState(null);       // shift schedules + facilities
  const [equip, setEquip] = useState(null);     // equipment profiles
  const [entries, setEntries] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/shift-schedules', { credentials:'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/equipment-profile', { credentials:'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/entries', { credentials:'include' }).then(r => r.json()),
    ]).then(([sch, eq, ent]) => { setData(sch); setEquip(eq); setEntries(ent.entries || []); }).catch(()=>{});
    const t = setInterval(() => setTick(x => x+1), 60000);
    return () => clearInterval(t);
  }, []);

  if (!data || !data.facilities?.length) return null;

  // facilityId -> [systemKeys it has]
  const systemsByFacility = {};
  if (equip && equip.facilities) {
    for (const f of equip.facilities) {
      systemsByFacility[f.id] = Object.keys(f.profile || {}).filter(k => k !== 'custom' && f.profile[k]);
    }
  }

  const hasReading = (fid, system, shift, dateStr) =>
    entries.some(e => e.hospitalId === fid && e.system === system && e.shift === shift && e.date === dateStr);

  const rows = data.facilities.map(f => {
    const sch = normalizeSchedule(data.schedules[f.id]);
    const { date } = nowInZone(sch.timezone);
    const facSystems = systemsByFacility[f.id] || ['boiler','chilled']; // sane default if profile not loaded
    const shiftCells = SHIFT_NAMES.filter(n => sch.shifts[n].enabled).map(name => {
      const st = shiftStatus(sch.shifts[name], sch.timezone);
      // logged only if EVERY system the facility has was logged for this shift
      const missingSystems = facSystems.filter(sys => !hasReading(f.id, sys, name, date));
      const allLogged = facSystems.length > 0 && missingSystems.length === 0;
      let status, label, tone;
      if (st.state === 'open') {
        if (allLogged) { status='logged'; label='Logged'; tone='green'; }
        else { status='open'; label=fmtLeft(st.minutesUntilClose); tone='amber'; }
      } else if (st.state === 'closed' || st.morningClosed) {
        if (allLogged) { status='logged'; label='Logged'; tone='green'; }
        else { status='missed'; label='Missed'; tone='red'; }
      } else { status='upcoming'; label='Upcoming'; tone='gray'; }
      const partial = (!allLogged && missingSystems.length && missingSystems.length < facSystems.length)
        ? missingSystems.map(s => SYSTEM_META[s]?.label || s).join(', ') + ' missing' : '';
      return { name, status, label, tone, partial };
    });
    const anyMissed = shiftCells.some(c => c.status === 'missed');
    return { f, shiftCells, anyMissed, facSystems };
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
        <h2 className="text-sm font-bold text-gray-700">Shift Reading Status — Today</h2>
        {totalMissed > 0
          ? <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">{totalMissed} missed reading{totalMissed!==1?'s':''}</span>
          : <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">All caught up</span>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {rows.map(({f, shiftCells, anyMissed, facSystems}) => (
          <div key={f.id} className={`px-4 py-3 flex items-center gap-3 flex-wrap ${anyMissed?'bg-red-50/40':''}`}>
            <div className="w-48 flex-shrink-0 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{f.name}</div>
              <div className="text-xs text-gray-400">{facSystems.map(s=>SYSTEM_META[s]?.label||s).join(' · ')}</div>
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




