'use client';
/**
 * FacilityH2O — Password Reset Page
 * Author & Owner: Antoine Riley
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [step, setStep]         = useState(token ? 'newpassword' : 'request');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [msg, setMsg]           = useState(null);
  const [loading, setLoading]   = useState(false);
  const [resetUrl, setResetUrl] = useState(null);

  // Validate token on load
  useEffect(() => {
    if (!token) return;
    fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'validate', token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setMsg({ type: 'error', text: d.error || 'This reset link is invalid or has expired.' });
          setStep('expired');
        }
      });
  }, [token]);

  // Step 1: request reset
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const res  = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', username }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.resetUrl) {
      setResetUrl(data.resetUrl);
    }
    setMsg({ type: 'success', text: data.message });
    setStep('sent');
  };

  // Step 2: set new password
  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (password.length < 8)  { setMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    setLoading(true); setMsg(null);
    const res  = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', token, newPassword: password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      setMsg({ type: 'success', text: 'Password updated! Redirecting to sign in...' });
      setTimeout(() => router.push('/login'), 2500);
    } else {
      setMsg({ type: 'error', text: data.error || 'Reset failed.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💧</div>
          <h1 className="text-3xl font-bold text-[#003366]">AquaLog</h1>
          <p className="text-gray-500 mt-1 text-sm">MedStar Health · Water Chemistry Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* ── Step: Request ── */}
          {step === 'request' && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Forgot Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your username. If it matches the owner account, a reset link will be generated.
              </p>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <input
                    type="text" required value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus placeholder="Enter your username"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                  />
                </div>
                {msg && (
                  <div className={`text-sm px-4 py-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                    {msg.text}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full bg-[#0072CE] hover:bg-[#005fa3] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          {/* ── Step: Sent ── */}
          {step === 'sent' && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Check Your Email</h2>
              {msg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
                  {msg.text}
                </div>
              )}
              {resetUrl && (
                <div className="bg-blue-50 border border-[#0072CE] rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-[#003366] mb-2">Email not configured — use this link directly:</p>
                  <a href={resetUrl} className="text-[#0072CE] text-xs break-all underline">{resetUrl}</a>
                </div>
              )}
              <p className="text-sm text-gray-500">The link expires in 1 hour.</p>
            </>
          )}

          {/* ── Step: New Password ── */}
          {step === 'newpassword' && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Set New Password</h2>
              <p className="text-sm text-gray-500 mb-6">Choose a new password for your owner account.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus placeholder="Min 8 characters"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password" required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072CE]"
                  />
                </div>
                {msg && (
                  <div className={`text-sm px-4 py-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                    {msg.text}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full bg-[#0072CE] hover:bg-[#005fa3] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

          {/* ── Step: Expired ── */}
          {step === 'expired' && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Link Expired</h2>
              {msg && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{msg.text}</div>}
              <p className="text-sm text-gray-500">Please request a new reset link.</p>
            </>
          )}

          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-[#0072CE] hover:underline">← Back to Sign In</a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Managed by Crothall Healthcare · Confidential
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
