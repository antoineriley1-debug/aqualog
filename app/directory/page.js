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

export default function DirectoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedHospital, setExpandedHospital] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (u?.role !== 'admin') { router.push('/dashboard'); return; }
    // Expand all by default
    setExpandedHospital('all');
  }, []);

  const exportCSV = () => {
    const rows = [['Hospital', 'Title', 'Name', 'Office Phone', 'Mobile Phone', 'FacilityH2O Email', 'FacilityH2O Email']];
    HOSPITALS.forEach((h) => {
      h.contacts.forEach((c) => {
        rows.push([
          h.name,
          c.title,
          c.name,
          c.office || '',
          c.mobile || '',
          c.FacilityH2OEmail || '',
          c.FacilityH2OEmail || '',
        ]);
      });
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FacilityH2O-directory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Flatten all contacts for search
  const allContacts = HOSPITALS.flatMap((h) =>
    h.contacts.map((c) => ({ ...c, hospitalName: h.name, hospitalCode: h.code, hospitalId: h.id }))
  );

  const searchLower = search.toLowerCase();
  const filteredContacts = search
    ? allContacts.filter((c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.title.toLowerCase().includes(searchLower) ||
        c.hospitalName.toLowerCase().includes(searchLower) ||
        (c.FacilityH2OEmail || '').toLowerCase().includes(searchLower) ||
        (c.FacilityH2OEmail || '').toLowerCase().includes(searchLower) ||
        (c.office || '').includes(searchLower) ||
        (c.mobile || '').includes(searchLower)
      )
    : null;

  const totalContacts = HOSPITALS.reduce((sum, h) => sum + h.contacts.filter(c => c.name !== 'VACANT').length, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 pt-16 md:pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📞 Staff Directory</h1>
            <p className="text-gray-500 text-sm mt-1">
              {HOSPITALS.length} facilities · {totalContacts} contacts · Managed by FacilityH2O
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-[#003366] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#002244] transition"
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, title, hospital, phone, or email..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE] bg-white shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Search Results */}
        {search && (
          <div className="mb-8">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {filteredContacts.length} result{filteredContacts.length !== 1 ? 's' : ''} for "{search}"
            </div>
            {filteredContacts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100 shadow-sm">
                No contacts found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredContacts.map((c, i) => (
                  <ContactCard key={i} contact={c} showHospital />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Full Directory by Hospital */}
        {!search && (
          <div className="space-y-6">
            {HOSPITALS.map((h) => {
              const isOpen = expandedHospital === 'all' || expandedHospital === h.id;
              const activeContacts = h.contacts.filter((c) => c.name !== 'VACANT');
              const vacantCount = h.contacts.filter((c) => c.name === 'VACANT').length;

              return (
                <div key={h.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Hospital header */}
                  <button
                    onClick={() => setExpandedHospital(isOpen && expandedHospital !== 'all' ? null : h.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-[#003366] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {h.code.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{h.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                          <span>📍 {h.address}</span>
                          <span>· {activeContacts.length} contacts{vacantCount > 0 ? ` · ${vacantCount} vacant` : ''}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm ml-4">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100">
                      {/* Director highlight */}
                      {(() => {
                        const director = h.contacts.find((c) => c.title.toLowerCase().includes('director') && c.name !== 'VACANT');
                        if (!director) return null;
                        return (
                          <div className="mx-4 my-4 bg-[#003366]/5 border border-[#003366]/15 rounded-xl p-4 flex items-start justify-between gap-4">
                            <div>
                              <div className="text-xs font-bold text-[#0072CE] uppercase tracking-wide mb-1">{director.title}</div>
                              <div className="font-bold text-gray-900 text-base">{director.name}</div>
                              <div className="flex flex-wrap gap-3 mt-2">
                                {director.office && (
                                  <a href={`tel:${director.office}`} className="text-xs text-gray-600 hover:text-[#0072CE] flex items-center gap-1">
                                    📞 {director.office}
                                  </a>
                                )}
                                {director.mobile && (
                                  <a href={`tel:${director.mobile}`} className="text-xs text-gray-600 hover:text-[#0072CE] flex items-center gap-1">
                                    📱 {director.mobile}
                                  </a>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {director.FacilityH2OEmail && (
                                  <a href={`mailto:${director.FacilityH2OEmail}`} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100">
                                    ✉️ {director.FacilityH2OEmail}
                                  </a>
                                )}
                                {director.FacilityH2OEmail && (
                                  <a href={`mailto:${director.FacilityH2OEmail}`} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200">
                                    ✉️ {director.FacilityH2OEmail}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 bg-[#003366] text-white text-xs px-2 py-1 rounded-lg">
                              Director
                            </div>
                          </div>
                        );
                      })()}

                      {/* Rest of team */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-100">
                        {h.contacts
                          .filter((c) => !c.title.toLowerCase().includes('director'))
                          .map((c, i) => (
                            <ContactCard key={i} contact={c} />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function ContactCard({ contact: c, showHospital }) {
  if (c.name === 'VACANT') {
    return (
      <div className="bg-white p-4 opacity-40">
        <div className="text-xs text-gray-400 font-medium">{c.title}</div>
        {showHospital && <div className="text-xs text-[#0072CE] mt-0.5">{c.hospitalName}</div>}
        <div className="text-sm text-gray-400 italic mt-1">— Vacant —</div>
        {(c.office || c.mobile) && (
          <div className="text-xs text-gray-400 mt-1">
            {c.office && <span>📞 {c.office}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 hover:bg-gray-50 transition-colors">
      <div className="text-xs font-semibold text-[#0072CE] uppercase tracking-wide">{c.title}</div>
      {showHospital && (
        <div className="text-xs text-gray-400 mt-0.5">
          {c.hospitalName} · <span className="font-medium">{c.hospitalCode}</span>
        </div>
      )}
      <div className="font-semibold text-gray-900 mt-1">{c.name}</div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {c.office && (
          <a href={`tel:${c.office}`} className="text-xs text-gray-500 hover:text-[#0072CE] transition-colors">
            📞 <span className="font-mono">{c.office}</span>
          </a>
        )}
        {c.mobile && (
          <a href={`tel:${c.mobile}`} className="text-xs text-gray-500 hover:text-[#0072CE] transition-colors">
            📱 <span className="font-mono">{c.mobile}</span>
          </a>
        )}
      </div>

      {(c.FacilityH2OEmail || c.FacilityH2OEmail) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {c.FacilityH2OEmail && (
            <a
              href={`mailto:${c.FacilityH2OEmail}`}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
            >
              ✉️ {c.FacilityH2OEmail}
            </a>
          )}
          {c.FacilityH2OEmail && (
            <a
              href={`mailto:${c.FacilityH2OEmail}`}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              ✉️ {c.FacilityH2OEmail}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
