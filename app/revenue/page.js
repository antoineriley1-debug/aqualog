'use client';
/**
 * Revenue & Sales — OWNER ONLY (ariley). Moved off the dashboard so the dashboard
 * stays focused on FacilityH2O water-chemistry operations. Pulls the licensing rollup.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function RevenuePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    const isOwner = u?.id === 'usr_ariley' || u?.username === 'ariley';
    if (!isOwner) { setDenied(true); setLoading(false); return; }
    fetch('/api/licenses', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { licenses: [] })
      .then(d => {
        const L = d.licenses || [];
        const active = L.filter(x => x.status === 'active');
        const trial = L.filter(x => x.status === 'trial');
        const mrr = active.reduce((a,x) => a + (Number(x.monthlyValue)||0), 0);
        const pipeline = trial.reduce((a,x) => a + (Number(x.monthlyValue)||0), 0);
        setRevenue({ clients: L.length, active: active.length, trial: trial.length, mrr, arr: mrr*12, pipeline });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 p-8 text-gray-400">Loading…</div></div>;
  if (denied) return (
    <div className="flex min-h-screen"><Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl mb-3">🔒</div><b className="text-gray-900">Owner only</b>
          <div className="text-sm text-gray-500 mt-1">Sales & revenue is private to the account owner.</div>
          <Link href="/dashboard" className="inline-block mt-4 text-sm text-[#0891B2] font-semibold hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        {/* Back button */}
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-flex items-center gap-1">
          ← Back
        </button>

        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Revenue &amp; Sales</h1>
            <p className="text-gray-500 text-sm mt-1">Private to you. This is separate from FacilityH2O operations.</p>
          </div>
          <Link href="/licensing" className="text-sm text-white bg-[#0891B2] hover:bg-[#0E7490] font-semibold px-4 py-2 rounded-lg transition">Open Licensing console →</Link>
        </div>

        {revenue && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-green-500 to-emerald-600">
                <div className="text-xs opacity-90">Monthly Recurring (MRR)</div>
                <div className="text-3xl font-extrabold mt-1">${revenue.mrr.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-cyan-500 to-blue-600">
                <div className="text-xs opacity-90">Annual Run-Rate (ARR)</div>
                <div className="text-3xl font-extrabold mt-1">${revenue.arr.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                <div className="text-xs opacity-90">Trial Pipeline</div>
                <div className="text-3xl font-extrabold mt-1">${revenue.pipeline.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-5 bg-white border border-gray-100">
                <div className="text-xs text-gray-400">Total Clients</div>
                <div className="text-2xl font-extrabold mt-1 text-gray-900">{revenue.clients}</div>
              </div>
              <div className="rounded-2xl p-5 bg-white border border-gray-100">
                <div className="text-xs text-gray-400">Active Clients</div>
                <div className="text-2xl font-extrabold mt-1 text-green-600">{revenue.active}</div>
              </div>
              <div className="rounded-2xl p-5 bg-white border border-gray-100">
                <div className="text-xs text-gray-400">In Trial</div>
                <div className="text-2xl font-extrabold mt-1 text-amber-600">{revenue.trial}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-6">Figures are derived from license records (monthly value × status). Set or update client values in the Licensing console.</p>
          </>
        )}
      </main>
    </div>
  );
}
