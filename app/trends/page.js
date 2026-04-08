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
};

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

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u?.hospital) setHospital(u.hospital);
    fetch('/api/entries')
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries || []); setLoading(false); });
  }, []);

  const params = PARAM_CONFIG[system] || [];
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
            onChange={(e) => { setSystem(e.target.value); setParam(PARAM_CONFIG[e.target.value][0].key); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
          >
            <option value="boiler">🔥 Boiler Water</option>
            <option value="chilled">❄️ Chilled Water</option>
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
              <div className="font-semibold text-gray-800 mb-4">
                {currentParam?.label} — {HOSPITALS.find((h) => h.id === hospital)?.name}
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  {currentParam && (
                    <>
                      <ReferenceLine y={currentParam.min} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Min ${currentParam.min}`, fill: '#ef4444', fontSize: 11 }} />
                      <ReferenceLine y={currentParam.max} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Max ${currentParam.max}`, fill: '#ef4444', fontSize: 11 }} />
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0072CE"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const inRange = currentParam && payload.value >= currentParam.min && payload.value <= currentParam.max;
                      return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={inRange ? '#16a34a' : '#dc2626'} stroke="white" strokeWidth={2} />;
                    }}
                    name={currentParam?.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Stats — 3-year analysis */}
        {stats && (
          <div className="space-y-4">
            {/* Primary stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Readings',     value: stats.count,       sub: `over ${stats.rangeDays === '1095' ? '3 years' : stats.rangeDays + ' days'}` },
                { label: 'Average',      value: stats.avg,         sub: currentParam?.label },
                { label: 'Median',       value: stats.median,      sub: 'middle value' },
                { label: 'Std Dev',      value: stats.stddev,      sub: 'variability' },
                { label: 'Min Recorded', value: stats.min,         sub: '', highlight: parseFloat(stats.min) < (currentParam?.min || 0) },
                { label: 'Max Recorded', value: stats.max,         sub: '', highlight: parseFloat(stats.max) > (currentParam?.max || Infinity) },
                { label: '% Compliant',  value: `${stats.compliance}%`, sub: `${stats.oor} OOR`, highlight: parseFloat(stats.compliance) < 90 },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className={`text-lg font-bold ${s.highlight ? 'text-red-600' : 'text-gray-800'}`}>{s.value}</div>
                  {s.sub && <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>}
                </div>
              ))}
            </div>

            {/* Trend direction + long-term shift */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Overall Trend Direction</div>
                  <div className={`text-2xl font-black ${stats.dirColor}`}>{stats.direction}</div>
                  <div className="text-xs text-gray-400 mt-1">Slope: {stats.slope} per reading (linear regression over {stats.count} data points)</div>
                </div>
                {stats.longTermShift !== null && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Long-Term Shift</div>
                    <div className={`text-2xl font-bold ${Math.abs(stats.longTermShift) > 0.5 ? 'text-orange-600' : 'text-green-600'}`}>
                      {stats.longTermShift > 0 ? '+' : ''}{stats.longTermShift}
                    </div>
                    <div className="text-xs text-gray-400">early vs recent period avg</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Regulatory Assessment</div>
                  <div className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                    parseFloat(stats.compliance) >= 98 ? 'bg-green-100 text-green-700' :
                    parseFloat(stats.compliance) >= 90 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {parseFloat(stats.compliance) >= 98 ? '✅ Excellent' :
                     parseFloat(stats.compliance) >= 90 ? '⚠️ Acceptable' :
                     '❌ Below Target'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Target: ≥ 98% in-range</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
