'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function SignupForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    orgName: '', industry: 'healthcare',
    name: '', email: '', password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) router.push('/dashboard');
      else setError(data.error || 'Signup failed. Please try again.');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="text-3xl">💧</span>
        <span className="text-xl font-bold text-[#164E63]">FacilityH2O</span>
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#0891B2] text-white' : 'bg-gray-200 text-gray-400'}`}>{s}</div>
            {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#0891B2]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        {/* Step 1: Organization */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about your organization</h2>
            <p className="text-gray-400 text-sm mb-6">We'll set up your account based on your needs.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                <input type="text" value={form.orgName} onChange={e => update('orgName', e.target.value)} required placeholder="e.g. Metro Health System" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                <select value={form.industry} onChange={e => update('industry', e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
                  <option value="healthcare">Healthcare / Hospital</option>
                  <option value="hospitality">Hotel / Hospitality</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="education">Education / University</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button disabled={!form.orgName} onClick={() => setStep(2)} className="w-full bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">
                Continue →
              </button>
            </div>
          </>
        )}

        {/* Step 2: Admin Account */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create your admin account</h2>
            <p className="text-gray-400 text-sm mb-6">This will be the primary account for {form.orgName}.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Your full name" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="you@company.com" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required placeholder="At least 8 characters" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
                <button disabled={!form.name || !form.email || form.password.length < 6 || loading} onClick={handleSubmit} className="flex-1 bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="text-gray-400 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#0891B2] hover:underline font-medium">Sign in →</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return <SignupForm />;
}
