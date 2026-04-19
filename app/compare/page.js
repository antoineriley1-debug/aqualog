'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function timeSince(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '<1h ago';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function statusColor(oorCount) {
  if (oorCount === 0) return 'green';
  if (oorCount <= 2) return 'yellow';
  return 'red';
}

const STATUS_STYLES = {
  green: {
    badge: 'bg-green-100 text-green-700 border-green-200',
    border: 'border-green-200',
    dot: 'bg-green-500',
    label: '✅ Compliant',
  },
  yellow: {
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
    label: '⚠️ Caution',
  },
  red: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    border: 'border-red-300',
    dot: 'bg-red-500',
    label: '🚨 Non-Compliant',
  },
};

function TrendArrow({ trend }) {
  if (trend === 'up') return <span className="text-green-600 font-bold text-lg">↗</span>;
  if (trend === 'down') return <span className="text-red-600 font-bold text-lg">↘</span>;
  return <span className="text-gray-400 font-bold text-lg">→</span>;
}

function pHColor(ph) {
  if (ph === null || ph === undefined) return 'text-gray-400';
  return (ph >= 7.5 && ph <= 10.5) ? 'text-green-600' : 'text-red-600';
}

const SORT_OPTIONS = [
  { key: 'compliance', label: 'Compliance Score' },
  { key: 'oor', label: 'OOR Count' },
  { key: 'recent', label: 'Most Recent Entry' },
  { key: 'name', label: 'Name' },
];

export default function ComparePage() {
  const [user, setUser] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('compliance');
  const [error, setError] = useState('');

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u || u.role !== 'admin') {
      setError('Admin access required.');
      setLoading(false);
      return;
    }
    fetch('/api/compare')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setFacilities(data.facilities || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load comparison data.');
        setLoading(false);
      });
  }, []);

  const sorted = [...facilities].sort((a, b) => {
    switch (sortBy) {
      case 'compliance':
        return a.complianceScore - b.complianceScore; // worst first
      case 'oor':
        return b.oorCount7d - a.oorCount7d; // most OOR first
      case 'recent':
        if (!a.lastEntry) return 1;
        if (!b.lastEntry) return -1;
        return new Date(b.lastEntry.createdAt) - new Date(a.lastEntry.createdAt);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-gray-400">Loading comparison data...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Compare Facilities</h1>
            <p className="text-gray-500 text-sm mt-1">Side-by-side compliance overview — last 7 days</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">
              {facilities.filter((f) => statusColor(f.oorCount7d) === 'green').length}
            </div>
            <div className="text-xs text-gray-500 mt-1">✅ Compliant</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {facilities.filter((f) => statusColor(f.oorCount7d) === 'yellow').length}
            </div>
            <div className="text-xs text-gray-500 mt-1">⚠️ Caution</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-red-600">
              {facilities.filter((f) => statusColor(f.oorCount7d) === 'red').length}
            </div>
            <div className="text-xs text-gray-500 mt-1">🚨 Non-Compliant</div>
          </div>
        </div>

        {/* Facility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sorted.map((f) => {
            const status = statusColor(f.oorCount7d);
            const styles = STATUS_STYLES[status];

            return (
              <Link
                key={f.id}
                href={`/hospital/${f.id}`}
                className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-all cursor-pointer ${styles.border}`}
              >
                {/* Card Header */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm leading-tight">{f.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{f.code}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles.badge}`}>
                      {styles.label}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="px-5 py-3">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-0.5">Boiler pH</div>
                      <div className={`font-bold text-lg ${pHColor(f.latestBoilerPH)}`}>
                        {f.latestBoilerPH !== null ? f.latestBoilerPH : '—'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-0.5">Chilled pH</div>
                      <div className={`font-bold text-lg ${pHColor(f.latestChilledPH)}`}>
                        {f.latestChilledPH !== null ? f.latestChilledPH : '—'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-0.5">Cond.</div>
                      <div className="font-bold text-lg text-gray-700">
                        {f.latestConductivity !== null ? f.latestConductivity : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Trend + Stats row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <TrendArrow trend={f.trend} />
                      <span className="text-xs text-gray-400">pH trend</span>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      Score: <span className={`font-bold ${f.complianceScore >= 80 ? 'text-green-600' : f.complianceScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {f.complianceScore}
                      </span>/100
                    </div>
                  </div>
                </div>

                {/* Footer stats */}
                <div className="px-5 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${f.oorCount7d > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {f.oorCount7d} OOR
                      </span>
                      <span className={`font-semibold ${f.missedShifts7d > 5 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {f.missedShifts7d} missed
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {f.lastEntry ? timeSince(f.lastEntry.createdAt) : 'No entries'}
                    </span>
                  </div>
                  {f.lastEntry && (
                    <div className="text-xs text-gray-400 mt-1 truncate">
                      by {f.lastEntry.operatorName}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
