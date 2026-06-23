'use client';
/**
 * FacilityH2O — Account Setup (post-checkout activation)
 * Language-agnostic: works for any industry, not hospital-specific.
 * Org admin activates their account and sets up their first site + operators.
 */
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const TIER_LIMITS = {
  starter: { maxSites: 1, label: 'Starter' },
  pro: { maxSites: 10, label: 'Professional' },
  professional: { maxSites: 10, label: 'Professional' },
  custom: { maxSites: 999, label: 'Enterprise' },
  enterprise: { maxSites: 999, label: 'Enterprise' },
  trial: { maxSites: 999, label: 'Trial' },
};

function AccountSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');
  const tier = searchParams.get('tier') || 'starter';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [siteData, setSiteData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    operatorCount: 1,
  });

  const [operators, setOperators] = useState([
    { name: '', email: '', password: '', role: 'operator' }
  ]);

  const tierConfig = TIER_LIMITS[tier] || TIER_LIMITS.starter;

  useEffect(() => {
    if (!accountId) setError('Invalid setup link. Please contact support or start a new trial.');
  }, [accountId]);

  const handleSiteChange = (e) => {
    const { name, value } = e.target;
    setSiteData(prev => ({ ...prev, [name]: value }));
  };

  const handleOperatorChange = (idx, field, value) => {
    const updated = [...operators];
    updated[idx][field] = value;
    setOperators(updated);
  };

  const addOperator = () => {
    setOperators([...operators, { name: '', email: '', password: '', role: 'operator' }]);
  };

  const removeOperator = idx => setOperators(operators.filter((_, i) => i !== idx));

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!siteData.name.trim()) { setError('Site name is required'); return; }
      setStep(2);
    } else if (step === 2) {
      if (operators.some(op => !op.name.trim() || !op.email.trim() || !op.password.trim())) {
        setError('All operator fields are required'); return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!accountId) throw new Error('Missing account ID');
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, tier, site: siteData, operators }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Setup failed');
      setSuccess('Account activated! Redirecting to dashboard...');
      setTimeout(() => { router.push('/dashboard'); }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const steps = ['Site Info', 'Team', 'Review'];

  return (
    <div className="min-h-screen bg-[#F0F9FF] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">[WATER]</span>
            <span className="text-lg font-bold text-[#164E63]">FacilityH2O</span>
          </Link>
          <span className="text-sm font-medium text-[#0891B2] bg-[#F0F9FF] border border-[#0891B2]/30 px-3 py-1 rounded-full">
            {tierConfig.label} Plan
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          {/* Step progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              {steps.map((s, i) => (
                <span key={s} className={`text-sm font-semibold ${step >= i + 1 ? 'text-[#0891B2]' : 'text-gray-300'}`}>{s}</span>
              ))}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-[#0891B2] h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">{success}</div>}

          {/* Step 1: Site Info */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your First Site</h2>
              <p className="text-gray-400 text-sm mb-6">Add your first facility. You can add more from Settings after activation.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name *</label>
                  <input type="text" name="name" value={siteData.name} onChange={handleSiteChange}
                    placeholder="e.g. Main Building, Plant A, North Campus"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <input type="text" name="address" value={siteData.address} onChange={handleSiteChange}
                    placeholder="Street address"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
                    <input type="text" name="city" value={siteData.city} onChange={handleSiteChange} placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
                    <input type="text" name="state" value={siteData.state} onChange={handleSiteChange} placeholder="State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Zip</label>
                    <input type="text" name="zipCode" value={siteData.zipCode} onChange={handleSiteChange} placeholder="Zip"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleNextStep} className="bg-[#0891B2] text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-[#0E7490] transition">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Operators */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Add Your Team</h2>
              <p className="text-gray-400 text-sm mb-6">Create logins for the people who will log readings. You can add more operators from the Users page.</p>
              <div className="space-y-4 mb-4">
                {operators.map((op, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Operator {idx + 1}</h3>
                      {operators.length > 1 && (
                        <button onClick={() => removeOperator(idx)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input type="text" value={op.name} onChange={e => handleOperatorChange(idx, 'name', e.target.value)}
                        placeholder="Full name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white" />
                      <input type="email" value={op.email} onChange={e => handleOperatorChange(idx, 'email', e.target.value)}
                        placeholder="Email address" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white" />
                      <input type="password" value={op.password} onChange={e => handleOperatorChange(idx, 'password', e.target.value)}
                        placeholder="Password (min 6 characters)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white" />
                    </div>
                  </div>
                ))}
                <button onClick={addOperator} className="text-[#0891B2] text-sm font-medium hover:underline">
                  + Add another operator
                </button>
              </div>
              <div className="flex justify-between gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
                <button onClick={handleNextStep} className="flex-1 bg-[#0891B2] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#0E7490] transition">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Activate</h2>
              <p className="text-gray-400 text-sm mb-6">Everything looks good? Click Activate to go live.</p>
              <div className="bg-gray-50 rounded-xl p-5 space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Site</span>
                  <span className="font-semibold text-gray-900">{siteData.name}</span>
                </div>
                {siteData.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-700">{siteData.city}{siteData.state ? `, ${siteData.state}` : ''}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Operators</span>
                  <span className="font-semibold text-gray-900">{operators.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold text-[#0891B2]">{tierConfig.label}</span>
                </div>
              </div>
              <div className="flex justify-between gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#0891B2] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#0E7490] disabled:opacity-40 transition">
                  {loading ? 'Activating...' : 'Activate Account →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F0F9FF]"><div className="animate-spin rounded-full h-8 w-8 border-4 border-[#0891B2] border-t-transparent"></div></div>}>
      <AccountSetupContent />
    </Suspense>
  );
}
