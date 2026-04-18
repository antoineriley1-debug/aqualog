'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { HOSPITALS } from '@/lib/hospitals';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

const EVENT_TYPE_STYLES = {
  auth:    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '🔐 Auth' },
  entry:   { bg: 'bg-green-100',  text: 'text-green-700',  label: '📝 Entry' },
  alert:   { bg: 'bg-orange-100', text: 'text-orange-700', label: '🔔 Alert' },
  user:    { bg: 'bg-purple-100', text: 'text-purple-700', label: '👤 User' },
  action:  { bg: 'bg-teal-100',   text: 'text-teal-700',   label: '🔧 Action' },
  st108:   { bg: 'bg-cyan-100',   text: 'text-cyan-700',   label: '💧 ST108' },
  legionella: { bg: 'bg-red-100', text: 'text-red-700',    label: '🦠 WMP' },
};

export default function AuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterHospital, setFilterHospital] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    const u = getUser();
    if (u?.role !== 'admin') { router.push('/dashboard'); return; }
    loadLogs();
  }, []);

  const loadLogs = (params = {}) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (params.type || filterType) qs.set('type', params.type ?? filterType);
    if (params.hospital || filterHospital) qs.set('hospital', params.hospital ?? filterHospital);
    if (params.user || filterUser) qs.set('user', params.user ?? filterUser);
    if (params.from || filterFrom) qs.set('from', params.from ?? filterFrom);
    if (params.to || filterTo) qs.set('to', params.to ?? filterTo);
    qs.set('limit', '500');

    fetch(`/api/audit?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setLoading(false);
      });
  };

  const handleFilter = (e) => {
    e.preventDefault();
    loadLogs();
  };

  const exportCSV = () => {
    const headers = ['Date/Time', 'Type', 'Action', 'User', 'Hospital', 'Entity ID', 'Detail'];
    const rows = logs.map((l) => [
      l.createdAt,
      l.type,
      l.action,
      l.username || '',
      l.hospitalId || '',
      l.entityId || '',
      l.detail || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FacilityH2O-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hospitalName = (id) => {
    if (!id) return '—';
    return HOSPITALS.find((h) => h.id === id)?.code || id;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-500 text-sm mt-1">
              {loading ? 'Loading...' : `${logs.length} of ${total} entries`}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-[#003366] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#002244] transition-colors"
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* Filters */}
        <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            >
              <option value="">All Types</option>
              <option value="auth">🔐 Auth (all)</option>
              <option value="login">✓ Logins (success)</option>
              <option value="login_failed">✗ Failed logins</option>
              <option value="entry">📝 Entries</option>
              <option value="alert">🔔 Alerts</option>
              <option value="user">👤 User changes</option>
              <option value="st108">💧 ST108</option>
              <option value="legionella">🦠 WMP/Legionella</option>
            </select>
            <select
              value={filterHospital}
              onChange={(e) => setFilterHospital(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            >
              <option value="">All Hospitals</option>
              {HOSPITALS.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Filter by user..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
            />
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
              placeholder="From"
            />
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
              placeholder="To"
            />
            <button
              type="submit"
              className="bg-[#0072CE] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#005fa3] transition-colors"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading audit log...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No audit entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date/Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail / IP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => {
                    const typeStyle = EVENT_TYPE_STYLES[log.type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: log.type };
                    const dt = new Date(log.createdAt);
                    const isFailedLogin = log.action === 'login_failed';
                    const isSuccessLogin = log.action === 'login';
                    return (
                      <tr key={log.id} className={`hover:bg-gray-50 ${isFailedLogin ? 'bg-red-50/50' : isSuccessLogin ? 'bg-green-50/30' : ''}`}>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">
                          {dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          <br />
                          {dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                            {typeStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-xs">{log.action}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs font-mono">{log.username || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{hospitalName(log.hospitalId)}</td>
                        <td className="px-4 py-3 text-xs max-w-xs">
                          <div className={`truncate ${isFailedLogin ? 'text-red-600' : 'text-gray-500'}`} title={log.detail}>
                            {log.detail || '—'}
                          </div>
                          {log.ip && log.ip !== 'unknown' && (
                            <div className="text-gray-400 font-mono mt-0.5">IP: {log.ip}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {log.outcome === 'SUCCESS' && <span className="text-green-600 font-bold">✓ Success</span>}
                          {log.outcome === 'FAILED'  && <span className="text-red-600 font-bold">✗ Failed</span>}
                          {log.outcome === 'ERROR'   && <span className="text-orange-600 font-bold">⚠ Error</span>}
                          {!log.outcome && <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
