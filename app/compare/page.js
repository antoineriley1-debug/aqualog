'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

function getUser() {
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

function timeSince(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function statusColor(oorCount) {
  if (oorCount === 0) return 'green';
  if (oorCount <= 3) return 'yellow';
  return 'red';
}

function statusStyles(color) {
  switch (color) {
    case 'green': return { dot: 'bg-green-500', ring: 'border-green-200', bg: 'bg-green-50' };
    case 'yellow': return { dot: 'bg-yellow-500', ring: 'border-yellow-200', bg: 'bg-yellow-50' };
    case 'red': return { dot: 'bg-red-500', ring: 'border-red-200', bg: 'bg-red-50' };
    default: return { dot: 'bg-gray-400', ring: 'border-gray-200', bg: 'bg-gray-50' };
  }
}

function pHColor(ph) {
  if (ph === null || ph === undefined) return 'text-gray-400';
  return (ph >= 7.5 && ph <= 10.5) ? 'text-green-600' : 'text-red-600';
}

const SORT_OPTIONS = [
  { key: 'compliance', label: 'Compliance Score' },
  { key: 'oor', label: 'OOR Count' },
  { key: 'missed', label: 'Missed Readings' },
  { key: 'recent', label: 'Most Recent Entry' },
  { key: 'name', label: 'Name' },
];

export default function ComparePage() {
  const [user, setUser] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('compliance');

  useEffect(() => {
    const u = getUser();
    setUser(u);
    fetch('/api/compare')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.facilities) {
          setFacilities(data.facilities || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...facilities].sort((a, b) => {
    switch (sortBy) {
      case 'compliance':
        return a.complianceScore - b.complianceScore; // worst first
      case 'oor':
        return b.oorCount7d - a.oorCount7d; // most OOR first
      case 'missed':
        return (b.missedShifts7d || 0) - (a.missedShifts7d || 0); // most missed first
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
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
          <div className="text-gray-400">Loading comparison…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"> Compare Facilities</h1>
            <p className="text-gray-500 text-sm mt-1">Side-by-side compliance overview — last 7 days</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            >
              {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
            <div className="text-3xl font-bold text-green-600">
              {facilities.filter((f) => statusColor(f.oorCount7d) === 'green').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">✓ Healthy</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-100">
            <div className="text-3xl font-bold text-yellow-600">
              {facilities.filter((f) => statusColor(f.oorCount7d) === 'yellow').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">!️ Watch</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
            <div className="text-3xl font-bold text-red-600">
              {facilities.filter((f) => statusColor(f.oorCount7d) === 'red').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">!! Action Needed</div>
          </div>
        </div>

        {/* Facility cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((f) => {
            const color = statusColor(f.oorCount7d);
            const styles = statusStyles(color);
            return (
              <Link
                key={f.id}
                href={`/hospital-single/${f.id}`}
                className={`bg-white rounded-xl p-5 shadow-sm border-2 hover:shadow-md transition-shadow cursor-pointer ${styles.ring}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm leading-tight">{f.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{f.code}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${styles.dot}`} />
                </div>

                <div className={`rounded-lg ${styles.bg} p-3 mb-3`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">7-day status</span>
                    <span className="font-semibold text-gray-900">
                      {color === 'green' ? 'Healthy' : color === 'yellow' ? 'Watch' : 'Action Needed'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Boiler pH</div>
                    <div className={`font-bold ${pHColor(f.lastBoilerPH)}`}>
                      {f.lastBoilerPH ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Chilled pH</div>
                    <div className={`font-bold ${pHColor(f.lastChilledPH)}`}>
                      {f.lastChilledPH ?? '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Compliance</span>
                    <span>
                      Score: <span className={`font-bold ${f.complianceScore >= 80 ? 'text-green-600' : f.complianceScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {f.complianceScore}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">OOR (7d)</span>
                    <span className={`font-semibold ${f.oorCount7d > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {f.oorCount7d}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Missed shifts (7d)</span>
                    <span className={`font-semibold ${f.missedShifts7d > 5 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {f.missedShifts7d} missed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Last entry</span>
                    <span className="text-gray-600">{timeSince(f.lastEntry?.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
