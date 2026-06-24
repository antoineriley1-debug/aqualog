'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Inline SVG icons (Heroicons 2.0 outline)
const Icon = ({ d, d2, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
);

const ICONS = {
  dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  entry:        'M12 4v16m8-8H4',
  history:      'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  trends:       'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
  advisor:      'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
  alerts:       'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  shifts:       'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  equipment:    'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  settings:     'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z',
  reports:      'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  compliance:   'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  compare:      'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  audit:        'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  notifications:'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  users:        'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  directory:    'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z',
  st108:        'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  legionella:   'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  coc:          'M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3',
  help:         'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
  legal:        'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z',
  licensing:    'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  contract:     'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  pricing:      'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  signout:      'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
  back:         'M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18',
  menu:         'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  close:        'M6 18L18 6M6 6l12 12',
  sun:          'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  moon:         'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
};

function NavIcon({ name }) {
  const d = ICONS[name];
  if (!d) return null;
  return <Icon d={d} />;
}

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
    const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
    if (raw) {
      try { setUser(JSON.parse(decodeURIComponent(raw.split('=')[1]))); } catch {}
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/alerts').then(r => r.json()).then(data => {
        setAlertCount((data.alerts || []).filter(a => !a.acknowledged).length);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  // Nav items — icon key references ICONS object above
  const navItems = [
    { href: '/dashboard',  label: 'Dashboard',           icon: 'dashboard',     shortLabel: 'Home' },
    { href: '/entry',      label: 'New Entry',            icon: 'entry',         shortLabel: 'Entry' },
    { href: '/history',    label: 'History',              icon: 'history',       shortLabel: 'History' },
    { href: '/trends',     label: 'Trends',               icon: 'trends',        shortLabel: 'Trends' },
    { href: '/advisor',    label: 'Chemistry Advisor',    icon: 'advisor',       shortLabel: 'Advisor' },
    ...(user?.role === 'admin' ? [
      { href: '/alerts',                 label: 'Alerts',                icon: 'alerts',        shortLabel: 'Alerts', badge: alertCount },
      { href: '/shift-schedules',        label: 'Shift Schedules',       icon: 'shifts',        shortLabel: 'Shifts' },
      { href: '/equipment',              label: 'Facility Equipment',    icon: 'equipment',     shortLabel: 'Equipment' },
      ...((user?.id === 'usr_ariley' || user?.username === 'ariley') ? [
        { href: '/settings',    label: 'Site Settings',   icon: 'settings',   shortLabel: 'Settings' },
        { href: '/licensing',   label: 'Licensing',        icon: 'licensing',  shortLabel: 'Licensing' },
        { href: '/contract',    label: 'New Contract',     icon: 'contract',   shortLabel: 'Contract' },
        { href: '/pricing',     label: 'Pricing',          icon: 'pricing',    shortLabel: 'Pricing' },
      ] : []),
      { href: '/reports',                label: 'Reports',               icon: 'reports',       shortLabel: 'Reports' },
      { href: '/compliance',             label: 'Compliance',            icon: 'compliance',    shortLabel: 'Comply' },
      { href: '/compare',                label: 'Compare Facilities',    icon: 'compare',       shortLabel: 'Compare' },
      { href: '/audit',                  label: 'Audit Log',             icon: 'audit',         shortLabel: 'Audit' },
      { href: '/notifications',          label: 'Alert Rules',           icon: 'notifications', shortLabel: 'Alerts' },
      { href: '/settings/notifications', label: 'Notification Settings', icon: 'notifications', shortLabel: 'Notif.' },
      { href: '/users',                  label: 'Users',                 icon: 'users',         shortLabel: 'Users' },
      { href: '/directory',              label: 'Directory',             icon: 'directory',     shortLabel: 'Directory' },
      { href: '/st108',                  label: 'ST108 Water Log',       icon: 'st108',         shortLabel: 'ST108' },
      { href: '/st108/report',           label: 'ST108 Report',          icon: 'reports',       shortLabel: 'ST108 Rpt' },
      { href: '/st108/audit',            label: 'ST108 Self-Audit',      icon: 'compliance',    shortLabel: 'ST108 Audit' },
      { href: '/legionella',             label: 'Legionella / WMP',      icon: 'legionella',    shortLabel: 'Legionella' },
      { href: '/coc',                    label: 'Chain of Custody',      icon: 'coc',           shortLabel: 'COC' },
    ] : []),
    { href: '/help',  label: 'Help & Guide', icon: 'help',  shortLabel: 'Help' },
    { href: '/legal', label: 'Legal',         icon: 'legal', shortLabel: 'Legal' },
  ];

  const siteLabel = user?.hospital
    ? (user.hospital.length <= 8 ? user.hospital.toUpperCase() : user.hospital)
    : 'All Sites';

  const NavLink = ({ href, label, icon, badge, onClick }) => {
    const active = pathname === href;
    return (
      <Link href={href} onClick={onClick}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
          active ? 'bg-[#0072CE] text-white' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
        }`}>
        {icon && (
          <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-blue-300 group-hover:text-white'}`}>
            <NavIcon name={icon} />
          </span>
        )}
        <span className="truncate">{label}</span>
        {badge > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Brand */}
      <div className="px-5 py-4 border-b border-blue-800/60">
        <div className="flex items-center gap-2.5">
          <svg className="w-6 h-6 text-[#0072CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
          </svg>
          <div>
            <div className="text-base font-bold tracking-tight text-white">FacilityH2O</div>
            <div className="text-[10px] text-blue-400 leading-none mt-0.5">FacilityH2O Inc.</div>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-5 py-3 border-b border-blue-800/60 bg-blue-900/20">
          <div className="text-sm font-semibold text-white truncate">{user.name}</div>
          <div className="text-xs text-blue-400 mt-0.5">
            {user.role === 'admin' ? 'Administrator · All Sites' : siteLabel}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {pathname !== '/dashboard' && (
          <button onClick={() => { router.back(); if (mobile) setMobileOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 mb-1 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800/50 hover:text-white transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.back} />
            </svg>
            Back
          </button>
        )}
        {navItems.map(({ href, label, icon, badge }) => (
          <NavLink key={href} href={href} label={label} icon={icon} badge={badge}
            onClick={mobile ? () => setMobileOpen(false) : undefined} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-blue-800/60 space-y-0.5">
        <button onClick={toggleTheme}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-blue-800/50 transition-colors">
          <svg className="w-4 h-4 flex-shrink-0 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={isDark ? ICONS.sun : ICONS.moon} />
          </svg>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-blue-800/50 transition-colors">
          <svg className="w-4 h-4 flex-shrink-0 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.signout} />
          </svg>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 min-h-screen bg-[#003366] text-white flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#003366] text-white flex items-center justify-between px-4 py-3 shadow-lg h-14">
        <div className="flex items-center gap-3">
          {pathname !== '/dashboard' && (
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-blue-800/50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.back} />
              </svg>
            </button>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-blue-800/50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? ICONS.close : ICONS.menu} />
            </svg>
          </button>
          <span className="font-bold text-base tracking-tight">FacilityH2O</span>
        </div>
        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <Link href="/alerts" className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{alertCount}</Link>
          )}
          <Link href="/entry" className="bg-[#0072CE] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Entry
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#003366] text-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-800/60">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6 text-[#0072CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                </svg>
                <span className="font-bold text-base">FacilityH2O</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-blue-800/50 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.close} />
                </svg>
              </button>
            </div>
            <SidebarContent mobile />
          </div>
        </>
      )}

      {/* Mobile spacer */}
      <div className="md:hidden h-14 flex-shrink-0" />
    </>
  );
}
