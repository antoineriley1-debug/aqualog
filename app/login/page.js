'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Drop = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2s7 7.7 7 12.6a7 7 0 1 1-14 0C5 9.9 12 2.2 12 2.2z" />
    </svg>
  );
  const Check = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
      strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );

  const standards = [
    'ASHRAE 188 — Legionella',
    'Joint Commission EC.02.05.02',
    'CMS QSO17-30',
    'ANSI/AAMI ST108:2023',
  ];

  return (
    <div className="min-h-screen flex bg-[#f3f6fa]">
      {/* ── Brand panel (desktop) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{ background: 'linear-gradient(150deg,#002A4E 0%,#003366 45%,#0072CE 130%)' }}
      >
        {/* ambient water rings */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-white/40" />
          <div className="absolute top-1/2 -right-32 w-[28rem] h-[28rem] rounded-full border border-white/30" />
          <div className="absolute bottom-10 left-1/3 w-64 h-64 rounded-full border border-white/20" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/25 flex items-center justify-center">
            <Drop className="w-6 h-6 text-[#7CC4FF]" />
          </div>
          <span className="text-xl font-bold tracking-tight">FacilityH2O</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            Water chemistry compliance,<br />for every building you run.
          </h1>
          <p className="mt-5 text-blue-100/90 text-[15px] leading-relaxed">
            Shift-based logging, instant out-of-range alerts, and audit-ready reports —
            one portal across your whole portfolio.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-2.5">
            {standards.map((s) => (
              <li key={s} className="flex items-center gap-2.5 text-sm text-blue-50/90">
                <span className="w-5 h-5 rounded-full bg-[#F6C90E] text-[#003366] flex items-center justify-center">
                  <Check />
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-blue-200/70">
          © 2026 FacilityH2O Inc. · Confidential · SHA-256 sealed audit trail
        </div>
      </div>

      {/* ── Sign-in panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#003366] mb-3">
              <Drop className="w-7 h-7 text-[#7CC4FF]" />
            </div>
            <h1 className="text-2xl font-bold text-[#003366]">FacilityH2O</h1>
            <p className="text-gray-500 text-sm mt-0.5">Water Chemistry Compliance Portal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(2,42,78,0.10)] ring-1 ring-gray-100 p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1 mb-7">Sign in to your portal to continue.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#0072CE]/40 focus:border-[#0072CE]"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#0072CE]/40 focus:border-[#0072CE]"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3.5 text-gray-400 hover:text-[#0072CE] transition text-xs font-semibold"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <span className="font-bold leading-none mt-0.5">!</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0072CE] hover:bg-[#005fa3] active:bg-[#004e87] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <div className="text-center pt-1">
                <a href="/reset-password" className="text-xs text-gray-400 hover:text-[#0072CE] transition-colors">
                  Forgot password?
                </a>
              </div>
            </form>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 mt-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden="true">
              <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Secured connection · every sign-in is logged
          </p>
        </div>
      </div>
    </div>
  );
}
