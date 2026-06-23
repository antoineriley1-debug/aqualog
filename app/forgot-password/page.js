'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await fetch('/api/password/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {}
    setBusy(false);
    setSent(true); // always show the same confirmation (no account enumeration)
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8"><span className="text-3xl">💧</span><span className="text-xl font-bold text-[#164E63]">FacilityH2O</span></Link>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {!sent ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot your password?</h1>
            <p className="text-gray-400 text-sm mb-6">Enter the email on your account and we'll send you a reset link.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="you@company.com" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
              <button onClick={submit} disabled={busy || !email.trim()} className="w-full bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">{busy ? 'Sending…' : 'Send Reset Link'}</button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📧</div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm mb-6">If an account exists for that email, we've sent a password reset link. It expires in 1 hour. Be sure to check spam.</p>
            <Link href="/login" className="inline-block text-[#0891B2] font-semibold text-sm hover:underline">← Back to Sign In</Link>
          </div>
        )}
        {!sent && <p className="text-center text-sm text-gray-400 mt-6"><Link href="/login" className="text-[#0891B2] hover:underline">← Back to Sign In</Link></p>}
      </div>
    </div>
  );
}
