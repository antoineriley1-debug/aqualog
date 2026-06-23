'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const INDUSTRIES = [
  { value: 'healthcare', label: '[SITE] Healthcare / Hospital' },
  { value: 'commercial', label: '[ORG] Commercial Buildings' },
  { value: 'manufacturing', label: '[MFG] Manufacturing' },
  { value: 'university', label: '[EDU] University / Education' },
  { value: 'pharmaceutical', label: '⚗ Pharmaceutical' },
  { value: 'datacenter', label: '[DC] Data Center' },
  { value: 'municipal', label: '[GOVT] Municipal / Government' },
  { value: 'hospitality', label: '[HOTEL] Hotel / Hospitality' },
  { value: 'other', label: '⚙ Other' },
];

const FACILITY_TYPES = [
  'Hospital', 'Medical Office Building', 'Manufacturing Plant', 'Campus',
  'Utility Plant', 'Office Building', 'Hotel', 'Data Center', 'Laboratory',
  'Distribution Center', 'Government Facility', 'University Building', 'Other',
];

const ALL_SYSTEMS = [
  { id: 'boiler', label: 'Boiler Water', icon: '[BOILER]', desc: 'Steam & hot water boilers' },
  { id: 'chilled', label: 'Chilled Water', icon: '[CHILLED]️', desc: 'Chilled water loops' },
  { id: 'cooling_tower', label: 'Cooling Towers', icon: '', desc: 'Open cooling systems' },
  { id: 'domestic', label: 'Domestic Water', icon: '[WATER]', desc: 'Potable water systems' },
  { id: 'legionella', label: 'Legionella / WMP', icon: '⌬', desc: 'Water management program' },
  { id: 'st108', label: 'ST108 / Reprocessing', icon: '⊕', desc: 'Medical device reprocessing water' },
  { id: 'steam', label: 'Steam Distribution', icon: '♨️', desc: 'Steam condensate & distribution' },
  { id: 'glycol', label: 'Glycol Systems', icon: '[FREEZE]', desc: 'Closed loop glycol systems' },
  { id: 'softener', label: 'Water Softeners', icon: '', desc: 'Ion exchange softening' },
  { id: 'ro', label: 'RO / DI Systems', icon: '[WAVE]', desc: 'Reverse osmosis & deionization' },
  { id: 'fire', label: 'Fire Protection', icon: '', desc: 'Sprinkler & standpipe systems' },
  { id: 'wastewater', label: 'Wastewater', icon: '', desc: 'Wastewater treatment & neutralization' },
];

// 14-day trial = all systems at enterprise tier
const TIER_SYSTEM_LIMITS = {
  trial: 999,
  starter: 3,
  professional: 8,
  enterprise: 999,
};

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            s < current ? 'bg-[#0891B2] text-white' :
            s === current ? 'bg-[#0891B2] text-white ring-4 ring-[#0891B2]/20' :
            'bg-gray-100 text-gray-400'
          }`}>{s < current ? '✓' : s}</div>
          {s < total && <div className={`w-10 h-0.5 transition-all ${s < current ? 'bg-[#0891B2]' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function SystemCard({ system, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(system.id)}
      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-[#0891B2] bg-[#F0F9FF] shadow-md'
          : 'border-gray-200 bg-white hover:border-[#0891B2]/40 hover:bg-[#F0F9FF]/50'
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-[#0891B2] rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <div className="text-2xl mb-2">{system.icon}</div>
      <div className="font-semibold text-gray-900 text-sm">{system.label}</div>
      <div className="text-xs text-gray-500 mt-1">{system.desc}</div>
    </button>
  );
}

function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Organization
  const [org, setOrg] = useState({ name: '', industry: '', facilityCount: '1' });

  // Step 2 — Sites
  const [sites, setSites] = useState([{
    name: '', address: '', city: '', state: '', zip: '', facilityType: '', buildingCount: '1',
  }]);

  // Step 3 — Systems (multi-select)
  const [selectedSystems, setSelectedSystems] = useState([]);

  // Step 4 — Admin account
  const [account, setAccount] = useState({ name: '', email: '', password: '' });

  const updateOrg = (f, v) => setOrg(p => ({ ...p, [f]: v }));
  const updateSite = (idx, f, v) => setSites(p => p.map((s, i) => i === idx ? { ...s, [f]: v } : s));
  const addSite = () => setSites(p => [...p, { name: '', address: '', city: '', state: '', zip: '', facilityType: '', buildingCount: '1' }]);
  const removeSite = idx => setSites(p => p.filter((_, i) => i !== idx));

  const toggleSystem = (id) => {
    setSelectedSystems(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  };

  const canNextStep1 = org.name.trim() && org.industry;
  const canNextStep2 = sites.every(s => s.name.trim() && s.facilityType);
  const canNextStep3 = selectedSystems.length > 0;
  const canSubmit = account.name.trim() && account.email.trim() && account.password.length >= 6;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: org.name,
          industry: org.industry,
          facilityCount: String(sites.length),
          sites,
          systems: selectedSystems,
          name: account.name,
          email: account.email,
          password: account.password,
        }),
      });
      const data = await res.json();
      if (data.ok) router.push('/welcome');
      else setError(data.error || 'Signup failed. Please try again.');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Facility count guard
  const maxSites = parseInt(org.facilityCount) || 1;

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="text-3xl">[WATER]</span>
        <span className="text-xl font-bold text-[#164E63]">FacilityH2O</span>
      </Link>

      <StepIndicator current={step} total={4} />

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl">

        {/* ── STEP 1: ORGANIZATION ── */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create your organization</h2>
            <p className="text-gray-400 text-sm mb-6">Your workspace. Your data. Completely isolated from other organizations.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name *</label>
                <input
                  type="text"
                  value={org.name}
                  onChange={e => updateOrg('name', e.target.value)}
                  placeholder="e.g. Metro Health System, Acme Manufacturing"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => updateOrg('industry', ind.value)}
                      className={`p-3 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                        org.industry === ind.value
                          ? 'border-[#0891B2] bg-[#F0F9FF] text-[#0891B2]'
                          : 'border-gray-200 text-gray-600 hover:border-[#0891B2]/40'
                      }`}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Facilities</label>
                <select
                  value={org.facilityCount}
                  onChange={e => updateOrg('facilityCount', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'facility' : 'facilities'}</option>
                  ))}
                  <option value="11">11–25 facilities</option>
                  <option value="26">26+ facilities (Enterprise)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5">All new accounts get a 14-day free trial at the Enterprise tier — no credit card required.</p>
              </div>
              <button
                disabled={!canNextStep1}
                onClick={() => setStep(2)}
                className="w-full bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: SITES / FACILITIES ── */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Add your facilities</h2>
            <p className="text-gray-400 text-sm mb-6">Add each site or location you manage. You can add more later.</p>
            <div className="space-y-6">
              {sites.map((site, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-5 relative bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">Facility {idx + 1}</h3>
                    {sites.length > 1 && (
                      <button type="button" onClick={() => removeSite(idx)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Site Name *</label>
                      <input
                        type="text"
                        value={site.name}
                        onChange={e => updateSite(idx, 'name', e.target.value)}
                        placeholder="e.g. Main Campus, Plant 1, Building A"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Facility Type *</label>
                      <select
                        value={site.facilityType}
                        onChange={e => updateSite(idx, 'facilityType', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white"
                      >
                        <option value="">Select type...</option>
                        {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                      <input
                        type="text"
                        value={site.address}
                        onChange={e => updateSite(idx, 'address', e.target.value)}
                        placeholder="Street address"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                      <input type="text" value={site.city} onChange={e => updateSite(idx, 'city', e.target.value)}
                        placeholder="City" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                      <input type="text" value={site.state} onChange={e => updateSite(idx, 'state', e.target.value)}
                        placeholder="State" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Zip Code</label>
                      <input type="text" value={site.zip} onChange={e => updateSite(idx, 'zip', e.target.value)}
                        placeholder="Zip" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Buildings</label>
                      <input type="number" min="1" value={site.buildingCount} onChange={e => updateSite(idx, 'buildingCount', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-white" />
                    </div>
                  </div>
                </div>
              ))}

              {sites.length < maxSites && (
                <button
                  type="button"
                  onClick={addSite}
                  className="w-full border-2 border-dashed border-[#0891B2]/40 rounded-xl py-3 text-sm text-[#0891B2] font-medium hover:bg-[#F0F9FF] transition"
                >
                  + Add Another Facility
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
                <button disabled={!canNextStep2} onClick={() => setStep(3)} className="flex-1 bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">
                  Continue →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: SYSTEMS (MULTI-SELECT) ── */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Select your water systems</h2>
            <p className="text-gray-400 text-sm mb-2">Select all that apply. FacilityH2O tracks chemistry, compliance, and alerts for each system you choose.</p>
            <div className="inline-flex items-center gap-2 bg-[#0891B2]/10 border border-[#0891B2]/30 rounded-lg px-3 py-1.5 mb-5">
              <span className="text-[#0891B2] text-xs font-bold"> 14-Day Trial</span>
              <span className="text-gray-500 text-xs">All systems unlocked — select freely</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {ALL_SYSTEMS.map(sys => (
                <SystemCard
                  key={sys.id}
                  system={sys}
                  selected={selectedSystems.includes(sys.id)}
                  onToggle={toggleSystem}
                />
              ))}
            </div>

            {selectedSystems.length > 0 && (
              <p className="text-xs text-[#0891B2] font-medium mb-4">
                ✓ {selectedSystems.length} system{selectedSystems.length > 1 ? 's' : ''} selected
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
              <button disabled={!canNextStep3} onClick={() => setStep(4)} className="flex-1 bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40">
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4: ADMIN ACCOUNT ── */}
        {step === 4 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create your admin account</h2>
            <p className="text-gray-400 text-sm mb-6">This will be the primary administrator for <span className="font-semibold text-gray-700">{org.name}</span>.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={account.name}
                  onChange={e => setAccount(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
                <input
                  type="email"
                  value={account.email}
                  onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@yourcompany.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={account.password}
                  onChange={e => setAccount(p => ({ ...p, password: e.target.value }))}
                  placeholder="At least 6 characters"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                />
              </div>

              {/* Review summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Account Summary</p>
                <div className="flex justify-between"><span className="text-gray-500">Organization</span><span className="font-medium text-gray-900">{org.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Industry</span><span className="font-medium text-gray-900">{INDUSTRIES.find(i=>i.value===org.industry)?.label || org.industry}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Facilities</span><span className="font-medium text-gray-900">{sites.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Systems</span><span className="font-medium text-gray-900">{selectedSystems.length} selected</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-medium text-[#0891B2]">14-Day Free Trial</span></div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">← Back</button>
                <button
                  disabled={!canSubmit || loading}
                  onClick={handleSubmit}
                  className="flex-1 bg-[#0891B2] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0E7490] transition disabled:opacity-40"
                >
                  {loading ? 'Creating account...' : 'Launch FacilityH2O →'}
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
