'use client';
/**
 * FacilityH2O — Operator Visual Suite
 * Interactive, animated reading visuals + falsification signal.
 * Pure presentation; reads entries already loaded by the page. No data writes.
 */
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, CartesianGrid, Dot,
} from 'recharts';

export const RANGES = {
  boiler: {
    ph:{label:'pH',min:8.5,max:10.5}, phosphate:{label:'Phosphate',min:20,max:60,unit:'ppm'},
    sulfite:{label:'Sulfite',min:20,max:80,unit:'ppm'}, hardness:{label:'Hardness',min:0,max:5,unit:'ppm'},
    conductivity:{label:'Conductivity',min:0,max:3500,unit:'µS'}, alkalinity:{label:'Alkalinity',min:100,max:700,unit:'ppm'},
    tds:{label:'TDS',min:0,max:3000,unit:'ppm'}, amine:{label:'Amine',min:0,max:10,unit:'ppm'},
  },
  chilled: {
    ph:{label:'pH',min:7.5,max:9.5}, conductivity:{label:'Conductivity',min:0,max:2000,unit:'µS'},
    inhibitor:{label:'Inhibitor',min:50,max:300,unit:'ppm'}, hardness:{label:'Hardness',min:0,max:200,unit:'ppm'},
    iron:{label:'Iron',min:0,max:2,unit:'ppm'}, tds:{label:'TDS',min:0,max:2000,unit:'ppm'},
    molybdate:{label:'Molybdate',min:5,max:30,unit:'ppm'}, bacteria:{label:'Bacteria',min:0,max:1000,unit:'CFU/mL'},
  },
  cooling_tower: {
    ph:{label:'pH',min:8.0,max:9.0}, conductivity:{label:'Conductivity',min:1000,max:3000,unit:'µS'},
    free_chlorine:{label:'Free Cl',min:0.2,max:1.0,unit:'ppm'}, inhibitor:{label:'Inhibitor',min:8,max:12,unit:'ppm'},
    hardness:{label:'Hardness',min:0,max:400,unit:'ppm'}, bacteria:{label:'Bacteria',min:0,max:10000,unit:'CFU/mL'},
  },
  condensate: {
    ph:{label:'pH',min:7.5,max:9.0}, iron:{label:'Iron',min:0,max:1.0,unit:'ppm'},
    conductivity:{label:'Conductivity',min:0,max:100,unit:'µS'}, amine:{label:'Amine',min:0,max:10,unit:'ppm'},
  },
  softener: {
    hardness:{label:'Hardness',min:0,max:0,unit:'ppm'}, conductivity:{label:'Conductivity',min:0,max:1500,unit:'µS'},
  },
};

const SYSTEM_LABELS = {
  boiler: '🔥 Boiler', chilled: '❄️ Chilled', cooling_tower: '🌫️ Cooling Tower',
  condensate: '💧 Condensate', softener: '🧂 Softener',
};

const inRange = (v, r) => v != null && Number.isFinite(+v) && +v >= r.min && +v <= r.max;

/* ---------- at-a-glance system health gauge (animated SVG arc) ---------- */
export function HealthGauge({ entries, system }) {
  const ranges = RANGES[system];
  const score = useMemo(() => {
    const recent = entries.filter(e => e.system === system).slice(0, 8);
    if (!recent.length) return null;
    let tot = 0, good = 0;
    for (const e of recent) for (const k of Object.keys(ranges)) {
      const v = e.values?.[k]; if (v == null) continue;
      tot++; if (inRange(v, ranges[k])) good++;
    }
    return tot ? Math.round((good / tot) * 100) : null;
  }, [entries, system, ranges]);

  const R = 52, C = 2 * Math.PI * R, pct = score ?? 0;
  const off = C * (1 - pct / 100);
  const color = score == null ? '#cbd5e1' : score >= 85 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const label = score == null ? 'No data' : score >= 85 ? 'Healthy' : score >= 60 ? 'Watch' : 'Action';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 132, height: 132 }}>
        <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="66" cy="66" r={R} fill="none" stroke="#eef2f6" strokeWidth="11" />
          <circle cx="66" cy="66" r={R} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={off}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,.9,.3,1), stroke .6s' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold" style={{ color }}>{score == null ? '—' : score}</span>
          <span className="text-[11px] font-semibold tracking-wide" style={{ color }}>{label}</span>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{SYSTEM_LABELS[system] || system} health</div>
    </div>
  );
}

/* ---------- where today's reading sits inside the safe band (animated) ---------- */
export function RangePosition({ value, range }) {
  if (value == null || !Number.isFinite(+value)) {
    return <div className="text-xs text-gray-400">No reading</div>;
  }
  const v = +value;
  const span = range.max - range.min || 1;
  const lo = range.min - span * 0.25, hi = range.max + span * 0.25, full = hi - lo;
  const pos = Math.max(0, Math.min(100, ((v - lo) / full) * 100));
  const bandL = ((range.min - lo) / full) * 100, bandW = (span / full) * 100;
  const ok = inRange(v, range);
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold text-gray-700">{range.label}</span>
        <span className={`text-sm font-bold ${ok ? 'text-green-600' : 'text-red-600'}`}>{v}{range.unit ? ` ${range.unit}` : ''}</span>
      </div>
      <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className="absolute top-0 bottom-0 bg-green-100" style={{ left: `${bandL}%`, width: `${bandW}%` }} />
        <div className="absolute top-0 bottom-0 border-l-2 border-green-400" style={{ left: `${bandL}%` }} />
        <div className="absolute top-0 bottom-0 border-l-2 border-green-400" style={{ left: `${bandL + bandW}%` }} />
        <div className="absolute -top-0.5 w-1.5 h-4 rounded-full shadow"
          style={{ left: `calc(${pos}% - 3px)`, background: ok ? '#16a34a' : '#dc2626', transition: 'left 1s cubic-bezier(.22,.9,.3,1)' }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{range.min}</span><span className="text-green-600 font-medium">safe range</span><span>{range.max}</span>
      </div>
    </div>
  );
}

/* ---------- animated trend line with safe-band shading ---------- */
export function TrendChart({ entries, system, field }) {
  const ranges = RANGES[system];
  const r = ranges[field];
  const data = useMemo(() => {
    return entries.filter(e => e.system === system && e.values?.[field] != null)
      .slice(0, 30).reverse()
      .map(e => ({ date: (e.date || '').slice(5), value: +e.values[field], shift: e.shift, ok: inRange(e.values[field], r) }));
  }, [entries, system, field, r]);

  if (!data.length) return <div className="text-xs text-gray-400 py-8 text-center">No {r.label} readings yet</div>;
  const vals = data.map(d => d.value);
  const yMin = Math.min(r.min, ...vals), yMax = Math.max(r.max, ...vals), pad = (yMax - yMin) * 0.1 || 1;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
        <YAxis domain={[yMin - pad, yMax + pad]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={38} />
        <ReferenceArea y1={r.min} y2={r.max} fill="#16a34a" fillOpacity={0.08} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={(val) => [`${val}${r.unit ? ' ' + r.unit : ''}`, r.label]}
          labelFormatter={(l, p) => `${l}${p && p[0] ? ' · ' + p[0].payload.shift : ''}`} />
        <Line type="monotone" dataKey="value" stroke="#0072CE" strokeWidth={2.5}
          isAnimationActive animationDuration={900}
          dot={(props) => { const { cx, cy, payload } = props;
            return <Dot key={props.key||`${cx}-${cy}`} cx={cx} cy={cy} r={3.5} fill={payload.ok ? '#0072CE' : '#dc2626'} stroke="#fff" strokeWidth={1.5} />; }}
          activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ============================================================
   FALSIFICATION SIGNAL
   Heuristic, advisory only. Flags a system+shift where the last
   3+ logs on the SAME shift are near-perfect AND barely vary,
   while OTHER shifts on the same days show materially different
   readings. Pattern-of-interest → "double-check", never an accusation.
   ============================================================ */
export function analyzeFalsification(entries, system) {
  const ranges = RANGES[system];
  const keys = Object.keys(ranges);
  const sys = entries.filter(e => e.system === system && e.values);
  if (sys.length < 6) return null;

  const center = (k) => (ranges[k].min + ranges[k].max) / 2;
  const half = (k) => (ranges[k].max - ranges[k].min) / 2 || 1;

  // "near-perfect" = every value within 20% of band center
  const nearPerfect = (e) => keys.every(k => {
    const v = e.values[k]; if (v == null) return true;
    return Math.abs(+v - center(k)) <= half(k) * 0.20;
  });

  const byShift = {};
  for (const e of sys) (byShift[e.shift] = byShift[e.shift] || []).push(e);

  const signals = [];
  for (const [shift, list] of Object.entries(byShift)) {
    const recent = list.slice(0, 3);
    if (recent.length < 3) continue;
    if (!recent.every(nearPerfect)) continue;

    // low variance across those 3 on the primary tracer (pH)
    const phs = recent.map(e => +e.values.ph).filter(Number.isFinite);
    const phVar = phs.length >= 2 ? Math.max(...phs) - Math.min(...phs) : 99;
    if (phVar > 0.3) continue; // genuinely varying → not suspicious

    // do OTHER shifts on those same dates look materially different?
    const dates = recent.map(e => e.date);
    const others = sys.filter(e => e.shift !== shift && dates.includes(e.date));
    if (!others.length) continue;
    const otherPhs = others.map(e => +e.values.ph).filter(Number.isFinite);
    const otherAvg = otherPhs.reduce((a, b) => a + b, 0) / (otherPhs.length || 1);
    const myAvg = phs.reduce((a, b) => a + b, 0) / (phs.length || 1);
    const divergence = Math.abs(myAvg - otherAvg);

    if (divergence >= half('ph') * 0.5) {
      signals.push({ shift, days: dates.length, divergence: divergence.toFixed(2),
        myAvg: myAvg.toFixed(2), otherAvg: otherAvg.toFixed(2) });
    }
  }
  return signals.length ? signals : null;
}

export function FalsificationBadge({ entries, system }) {
  const [open, setOpen] = useState(false);
  const signals = useMemo(() => analyzeFalsification(entries, system), [entries, system]);
  if (!signals) return null;
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 hover:bg-amber-100 transition w-full text-left">
        <span className="text-base">⚑</span>
        <span className="flex-1">Reading consistency check — worth a second look</span>
        <span className="text-amber-500">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="mt-2 text-xs text-gray-600 bg-white border border-amber-200 rounded-lg p-3 space-y-2">
          {signals.map((s, i) => (
            <div key={i} className="leading-relaxed">
              <b>{s.shift}</b>: last {s.days} entries are near-identical and near-perfect, while other shifts those days averaged pH {s.otherAvg} vs this shift's {s.myAvg} (gap {s.divergence}).
            </div>
          ))}
          <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
            Advisory pattern only — not proof of anything. Recommend spot-verifying these readings against logbook or a re-test.
          </div>
        </div>
      )}
    </div>
  );
}
