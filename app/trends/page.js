'use client';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts';

import { HOSPITALS as ALL_HOSPITALS } from '@/lib/hospitals';
const HOSPITALS = ALL_HOSPITALS.map((h) => ({ id: h.id, name: h.name }));

const PARAM_CONFIG = {
  boiler: [
    { key: 'ph', label: 'pH', min: 8.5, max: 10.5 },
    { key: 'phosphate', label: 'Phosphate', min: 20, max: 60 },
    { key: 'sulfite', label: 'Sulfite', min: 20, max: 80 },
    { key: 'hardness', label: 'Hardness', min: 0, max: 5 },
    { key: 'conductivity', label: 'Conductivity', min: 0, max: 3500 },
    { key: 'alkalinity', label: 'Alkalinity', min: 100, max: 700 },
    { key: 'tds', label: 'TDS', min: 0, max: 3000 },
    { key: 'amine', label: 'Amine', min: 0, max: 10 },
  ],
  chilled: [
    { key: 'ph', label: 'pH', min: 7.5, max: 9.5 },
    { key: 'conductivity', label: 'Conductivity', min: 0, max: 2000 },
    { key: 'inhibitor', label: 'Inhibitor', min: 50, max: 300 },
    { key: 'hardness', label: 'Hardness', min: 0, max: 200 },
    { key: 'iron', label: 'Iron', min: 0, max: 2 },
    { key: 'tds', label: 'TDS', min: 0, max: 2000 },
    { key: 'molybdate', label: 'Molybdate', min: 5, max: 30 },
    { key: 'bacteria', label: 'Bacteria', min: 0, max: 1000 },
  ],
  cooling_tower: [
    { key: 'ph', label: 'pH', min: 8.0, max: 9.0 },
    { key: 'conductivity', label: 'Conductivity', min: 1000, max: 3000 },
    { key: 'free_chlorine', label: 'Free Cl', min: 0.2, max: 1.0 },
    { key: 'inhibitor', label: 'Inhibitor', min: 8, max: 12 },
    { key: 'hardness', label: 'Hardness', min: 0, max: 400 },
    { key: 'bacteria', label: 'Bacteria', min: 0, max: 10000 },
  ],
  condensate: [
    { key: 'ph', label: 'pH', min: 7.5, max: 9.0 },
    { key: 'iron', label: 'Iron', min: 0, max: 1.0 },
    { key: 'conductivity', label: 'Conductivity', min: 0, max: 100 },
    { key: 'amine', label: 'Amine', min: 0, max: 10 },
  ],
  softener: [
    { key: 'hardness', label: 'Hardness', min: 0, max: 0 },
    { key: 'conductivity', label: 'Conductivity', min: 0, max: 1500 },
  ],
};

// Display label + icon for every system, including custom Enterprise equipment (filled in at runtime).
const SYSTEM_META = {
  boiler:        { label: 'Boiler Water',  icon: '🔥' },
  chilled:       { label: 'Chilled Water', icon: '❄️' },
  cooling_tower: { label: 'Cooling Tower', icon: '🌫️' },
  condensate:    { label: 'Condensate',    icon: '💧' },
  softener:      { label: 'Softener',      icon: '🧂' },
};
const BUILTIN_SYSTEMS = ['boiler','chilled','cooling_tower','condensate','softener'];

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function TrendsPage() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hospital, setHospital] = useState('');
  const [system, setSystem] = useState('boiler');
  const [param, setParam] = useState('ph');
  const [range, setRange] = useState('1095'); // Default: full 3 years
  const [facilityProfiles, setFacilityProfiles] = useState({}); // { hid: { systems:[...], custom:[{key,label,icon,params}] } }
  const [paramConfig, setParamConfig] = useState(PARAM_CONFIG); // merged with any custom-equipment params

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u?.hospital) setHospital(u.hospital);
    fetch('/api/entries')
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries || []); setLoading(false); });
    // Load equipment profiles so the System dropdown shows only what each facility actually has,
    // plus any Enterprise custom equipment (forward-compatible: appears automatically once enabled).
    fetch('/api/equipment-profile', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || !d.facilities) return;
        const profiles = {};
        const mergedCfg = { ...PARAM_CONFIG };
        for (const f of d.facilities) {
          const prof = f.profile || {};
          const systems = BUILTIN_SYSTEMS.filter(k => prof[k]);
          const custom = Array.isArray(prof.custom) ? prof.custom : [];
          for (const c of custom) {
            if (!c || !c.key) continue;
            systems.push(c.key);
            SYSTEM_META[c.key] = { label: c.label || c.key, icon: c.icon || '🔧' };
            // custom params: [{key,label,min,max}] — fall back to a generic value param
            mergedCfg[c.key] = Array.isArray(c.params) && c.params.length
              ? c.params.map(p => ({ key: p.key, label: p.label || p.key, min: p.min ?? 0, max: p.max ?? 0 }))
              : [{ key: 'value', label: 'Value', min: 0, max: 0 }];
          }
          profiles[f.id] = { systems: systems.length ? systems : BUILTIN_SYSTEMS, custom };
        }
        setFacilityProfiles(profiles);
        setParamConfig(mergedCfg);
      }).catch(() => {});
  }, []);

  // Which systems can be charted for the currently-selected facility?
  const availableSystems = (facilityProfiles[hospital]?.systems) || BUILTIN_SYSTEMS;

  // If the selected system isn't available for this facility, snap to the first available one.
  useEffect(() => {
    if (!availableSystems.includes(system)) {
      const next = availableSystems[0];
      if (next) {
        setSystem(next);
        const firstParam = (paramConfig[next] || [])[0];
        if (firstParam) setParam(firstParam.key);
      }
    }
  }, [hospital, availableSystems, system, paramConfig]);

  const params = paramConfig[system] || [];
  const currentParam = params.find((p) => p.key === param) || params[0];

  const chartData = useMemo(() => {
    const cutoff = daysAgo(parseInt(range));
    return entries
      .filter((e) =>
        e.hospitalId === hospital &&
        e.system === system &&
        e.date >= cutoff &&
        e.values?.[param] !== undefined
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((e) => ({
        date: e.date,
        shift: e.shift,
        value: parseFloat(e.values[param]),
      }));
  }, [entries, hospital, system, param, range]);

  const stats = useMemo(() => {
    if (!chartData.length || !currentParam) return null;
    const vals = chartData.map((d) => d.value);
    const oor = vals.filter((v) => v < currentParam.min || v > currentParam.max).length;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const stddev = Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);

    // Linear regression slope — positive = trending up, negative = trending down
    const n = vals.length;
    const xMean = (n - 1) / 2;
    let num = 0, den = 0;
    vals.forEach((y, x) => { num += (x - xMean) * (y - avg); den += (x - xMean) ** 2; });
    const slope = den === 0 ? 0 : num / den;

    // Split into 4 equal time segments for trend comparison
    const segSize = Math.floor(vals.length / 4);
    const seg1Avg = segSize > 0 ? vals.slice(0, segSize).reduce((a,b)=>a+b,0)/segSize : null;
    const seg4Avg = segSize > 0 ? vals.slice(-segSize).reduce((a,b)=>a+b,0)/segSize : null;
    const longTermShift = (seg1Avg != null && seg4Avg != null) ? parseFloat((seg4Avg - seg1Avg).toFixed(3)) : null;

    return {
      avg:          avg.toFixed(3),
      median:       median.toFixed(3),
      min:          Math.min(...vals).toFixed(3),
      max:          Math.max(...vals).toFixed(3),
      stddev:       stddev.toFixed(3),
      slope:        slope.toFixed(4),
      direction:    slope > 0.001 ? 'RISING ↑' : slope < -0.001 ? 'FALLING ↓' : 'STABLE →',
      dirColor:     slope > 0.001 ? 'text-red-600' : slope < -0.001 ? 'text-blue-600' : 'text-green-600',
      longTermShift,
      oor,
      compliance:   (((vals.length - oor) / vals.length) * 100).toFixed(1),
      count:        vals.length,
      rangeDays:    range,
    };
  }, [chartData, currentParam, range]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value;
    const inRange = currentParam && val >= currentParam.min && val <= currentParam.max;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-sm">
        <div className="font-medium text-gray-700">{label}</div>
        <div className={`font-bold ${inRange ? 'text-green-600' : 'text-red-600'}`}>
          {currentParam?.label}: {val} {inRange ? '🟢' : '🔴'}
        </div>
        {currentParam && (
          <div className="text-gray-400 text-xs">Range: {currentParam.min}–{currentParam.max}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Trend Analysis</h1>
          <p className="text-gray-500 text-sm mt-1">View chemistry trends over time</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
          {user?.role === 'admin' && (
            <select
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            >
              <option value="">Select Hospital</option>
              {HOSPITALS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
          <select
            value={system}
            onChange={(e) => { const sys = e.target.value; setSystem(sys); const fp = (paramConfig[sys] || [])[0]; if (fp) setParam(fp.key); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            {availableSystems.map((sys) => (
              <option key={sys} value={sys}>{(SYSTEM_META[sys]?.icon || '🔧')} {(SYSTEM_META[sys]?.label || sys)}</option>
            ))}
          </select>
          <select
            value={param}
            onChange={(e) => setParam(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            {params.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last 1 year</option>
            <option value="730">Last 2 years</option>
            <option value="1095">Last 3 years (full history)</option>
          </select>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {!hospital ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Select a hospital to view trends
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No data for selected filters
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">
                  {currentParam?.label} — {HOSPITALS.find((h) => h.id === hospital)?.name}
                </h2>
                <span className="text-xs text-gray-400">{chartData.length} readings</span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  {currentParam && currentParam.min !== currentParam.max && (
                    <>
                      <ReferenceLine y={currentParam.min} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `min ${currentParam.min}`, fontSize: 10, fill: '#f59e0b', position: 'insideBottomLeft' }} />
                      <ReferenceLine y={currentParam.max} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `max ${currentParam.max}`, fontSize: 10, fill: '#f59e0b', position: 'insideTopLeft' }} />
                    </>
                  )}
                  <Line type="monotone" dataKey="value" stroke="#0072CE" strokeWidth={2.5} dot={{ r: 3, fill: '#0072CE' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-xs text-gray-400 mb-1">Average</div>
              <div className="text-2xl font-bold text-gray-900">{stats.avg}</div>
              <div className="text-xs text-gray-400 mt-1">Median {stats.median}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-xs text-gray-400 mb-1">Range</div>
              <div className="text-2xl font-bold text-gray-900">{stats.min}–{stats.max}</div>
              <div className="text-xs text-gray-400 mt-1">σ {stats.stddev}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-xs text-gray-400 mb-1">Direction</div>
              <div className={`text-lg font-bold ${stats.dirColor}`}>{stats.direction}</div>
              <div className="text-xs text-gray-400 mt-1">
                {stats.longTermShift != null ? `Δ ${stats.longTermShift > 0 ? '+' : ''}${stats.longTermShift} over period` : 'slope ' + stats.slope}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-xs text-gray-400 mb-1">Compliance</div>
              <div className={`text-2xl font-bold ${
                parseFloat(stats.compliance) >= 95 ? 'text-green-600' :
                parseFloat(stats.compliance) >= 90 ? 'text-amber-600' : 'text-red-600'
              }`}>{stats.compliance}%</div>
              <div className="text-xs text-gray-400 mt-1">
                {parseFloat(stats.compliance) >= 95 ? '✅ Excellent' :
                 parseFloat(stats.compliance) >= 90 ? '⚠️ Acceptable' : '🔴 Needs attention'}
                {' '}· {stats.oor} OOR
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
