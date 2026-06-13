'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('FacilityH2O-theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('FacilityH2O-theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    const raw = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('FacilityH2O_user='));
    if (raw) {
      try {
        const val = decodeURIComponent(raw.split('=')[1]);
        setUser(JSON.parse(val));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/alerts')
        .then((r) => r.json())
        .then((data) => {
          const unread = (data.alerts || []).filter((a) => !a.acknowledged).length;
          setAlertCount(unread);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: '🏠 Dashboard', shortLabel: 'Home' },
    { href: '/entry', label: '➕ New Entry', shortLabel: 'Entry' },
    { href: '/history', label: '📋 History', shortLabel: 'History' },
    { href: '/trends', label: '📈 Trends', shortLabel: 'Trends' },
    { href: '/advisor', label: '🧪 Chemistry Advisor', shortLabel: 'Advisor' },
    ...(user?.role === 'admin'
      ? [
          { href: '/alerts', label: '🔔 Alerts', shortLabel: 'Alerts', badge: alertCount },
          ...((user?.id === 'usr_ariley' || user?.username === 'ariley') ? [{ href: '/settings', label: '🎨 Site Settings', shortLabel: 'Settings' }, { href: '/licensing', label: '💼 Licensing & Sales', shortLabel: 'Licensing' }, { href: '/contract', label: '📄 New Contract', shortLabel: 'Contract' }, { href: '/pricing', label: '🏷️ Pricing Page', shortLabel: 'Pricing' }] : []),
          { href: '/reports', label: '📊 Reports', shortLabel: 'Reports' },
          { href: '/compliance', label: '📈 Compliance', shortLabel: 'Compliance' },
          { href: '/compare', label: '📊 Compare Facilities', shortLabel: 'Compare' },
          { href: '/audit', label: '🔍 Audit Log', shortLabel: 'Audit' },
          { href: '/notifications', label: '🔔 Alert Rules', shortLabel: 'Alerts' },
          { href: '/settings/notifications', label: '⚙️ Notification Settings', shortLabel: 'Notif Settings' },
          { href: '/users', label: '👥 Users', shortLabel: 'Users' },
          { href: '/directory', label: '📞 Directory', shortLabel: 'Directory' },
          { href: '/st108', label: '💧 ST108 Water Log', shortLabel: 'ST108' },
          { href: '/st108/report', label: '📋 ST108 Report', shortLabel: 'ST108 Report' },
          { href: '/st108/audit', label: '✅ ST108 Self-Audit', shortLabel: 'ST108 Audit' },
          { href: '/legionella', label: '🦠 Legionella / WMP', shortLabel: 'Legionella' },
          { href: '/coc', label: '🧪 Chain of Custody', shortLabel: 'COC' },
        ]
      : []),
    { href: '/legal', label: '📋 Legal & Policies', shortLabel: 'Legal' },
  ];


  const hospitalNames = {
    whc: 'Washington Hospital Center',
    somd: 'Southern Maryland',
    harbor: 'Harbor Hospital',
    mont: 'Montgomery Medical',
    geo: 'Georgetown University',
    frank: 'Franklin Square',
    gs: 'Good Samaritan',
    union: 'Union Memorial',
    stm: "St. Mary's Hospital",
    nrh: 'National Rehab',
  };

  const NavLink = ({ href, label, badge, onClick }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-[#0072CE] text-white'
            : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
        }`}
      >
        <span>{label}</span>
        {badge > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <aside className="hidden md:flex w-64 min-h-screen bg-[#003366] text-white flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-blue-800">
          <div className="text-2xl font-bold">💧 FacilityH2O</div>
          <div className="text-xs text-blue-300 mt-1">FacilityH2O Inc.</div>
        </div>

        {user && (
          <div className="px-6 py-4 border-b border-blue-800 bg-blue-900/30">
            <div className="text-sm font-semibold">{user.name}</div>
            {user.role === 'admin' ? (
              <div className="text-xs text-blue-300 mt-0.5">Administrator · All Facilities</div>
            ) : (
              <div className="text-xs text-blue-300 mt-0.5">
                {hospitalNames[user.hospital] || user.hospital}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, badge }) => (
            <NavLink key={href} href={href} label={label} badge={badge} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800 space-y-1">
          <button onClick={toggleTheme} className="theme-toggle">
            {isDark ? '☀️ Day Mode' : '🌙 Night Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-blue-800/50 rounded-lg text-left transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#003366] text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg hover:bg-blue-800/50 transition"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <span className="font-bold text-lg">💧 FacilityH2O</span>
        </div>
        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <Link href="/alerts" className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {alertCount}
            </Link>
          )}
          <Link href="/entry" className="bg-[#0072CE] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
            + Entry
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#003366] text-white flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-blue-800 flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">💧 FacilityH2O</div>
                <div className="text-xs text-blue-300 mt-0.5">FacilityH2O Inc.</div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-blue-800/50 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {user && (
              <div className="px-6 py-3 border-b border-blue-800 bg-blue-900/30">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-blue-300 mt-0.5">
                  {user.role === 'admin' ? 'Administrator · All Facilities' : hospitalNames[user.hospital] || user.hospital}
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map(({ href, label, badge }) => (
                <NavLink key={href} href={href} label={label} badge={badge} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-blue-800 space-y-1">
              <button onClick={toggleTheme} className="theme-toggle">
                {isDark ? '☀️ Day Mode' : '🌙 Night Mode'}
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-3 text-sm text-blue-200 hover:text-white hover:bg-blue-800/50 rounded-lg text-left transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <div className="md:hidden h-14 flex-shrink-0" />
    </>
  );
}
