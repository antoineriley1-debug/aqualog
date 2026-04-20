'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function HospitalLoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hospitalId = searchParams.get('hospital') || 'whc';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hospitalNames = {
    whc: 'Washington Hospital Center',
    somd: 'Southern Maryland Hospital Center',
    harbor: 'Harbor Hospital',
    mont: 'Montgomery Medical Center',
    geo: 'Georgetown University Hospital',
    frank: 'Franklin Square Medical Center',
    gs: 'Good Samaritan Hospital',
    union: 'Union Memorial Hospital',
    stm: "St. Mary's Hospital",
    nrh: 'National Rehabilitation Hospital',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `op_${hospitalId}`, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/hospital-single/${hospitalId}`);
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏥</div>
          <h1 className="text-2xl font-bold text-gray-900">{hospitalNames[hospitalId] || 'Hospital'}</h1>
          <p className="text-gray-500 mt-1 text-sm">Water Chemistry Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Operator Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hospital Code
              </label>
              <input
                type="text"
                value={hospitalId.toUpperCase()}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter facility password"
                required
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <Link href="/dashboard" className="text-xs text-gray-400 hover:text-cyan-600 transition-colors">
                ← Back to Dashboard
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          FacilityH2O Inc. · Water Chemistry Compliance
        </p>
      </div>
    </div>
  );
}
