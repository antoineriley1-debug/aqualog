'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 49, desc: '1 facility, up to 5 users' },
  { id: 'professional', name: 'Professional', price: 149, desc: 'Up to 5 facilities, unlimited users', popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 299, desc: 'Unlimited everything + SLA' },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan') || 'professional';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    orgName: '', industry: 'healthcare', facilityCount: '1',
    name: '', email: '', password: '',
    plan: defaultPlan,
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
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#0891B2] text-white' : 'bg-gray-200 text-gray-400'}`}>{s}</div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#0891B2]' : 'bg-gray-200'}`} />}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Facilities</label>
                <select value={form.facilityCount} onChange={e => update('facilityCount', e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
                  <option value="1">1 facility</option>
                  <option value="2-5">2–5 facilities</option>
                  <option value="6-10">6–10 facilities</option>
                  <option value="10+">10+ facilities</option>
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
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
                <button disabled={!form.name || !form.email || form.password.length < 6} onClick={() => setStep(3)} className="flex-1 bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">Continue →</button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Plan */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Choose your plan</h2>
            <p className="text-gray-400 text-sm mb-6">14-day free trial on all plans. Cancel anytime.</p>
            <div className="space-y-3 mb-6">
              {PLANS.map(p => (
                <button key={p.id} onClick={() => update('plan', p.id)} className={`w-full text-left p-4 rounded-xl border-2 transition ${form.plan === p.id ? 'border-[#0891B2] bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{p.name}</span>
                        {p.popular && <span className="text-xs bg-[#0891B2] text-white px-2 py-0.5 rounded-full">Most Popular</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${p.price}</div>
                      <div className="text-xs text-gray-400">/month</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-60">
                {loading ? 'Creating account...' : 'Start Free Trial →'}
              </button>
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
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}><SignupForm /></Suspense>;
}
