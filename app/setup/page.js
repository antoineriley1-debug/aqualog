'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const TIER_LIMITS = {
  starter: { maxHospitals: 1 },
  pro: { maxHospitals: 10 },
  custom: { maxHospitals: 999 },
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
  
  const [hospitalData, setHospitalData] = useState({
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

  const tierLimits = TIER_LIMITS[tier] || TIER_LIMITS.starter;

  useEffect(() => {
    if (!accountId) {
      setError('Invalid checkout. Please start over.');
    }
  }, [accountId]);

  const handleHospitalChange = (e) => {
    const { name, value } = e.target;
    setHospitalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOperatorChange = (idx, field, value) => {
    const updated = [...operators];
    updated[idx][field] = value;
    setOperators(updated);
  };

  const addOperator = () => {
    if (operators.length < parseInt(hospitalData.operatorCount)) {
      setOperators([
        ...operators,
        { name: '', email: '', password: '', role: 'operator' }
      ]);
    }
  };

  const removeOperator = (idx) => {
    setOperators(operators.filter((_, i) => i !== idx));
  };

  const handleNextStep = () => {
    setError('');
    
    if (!hospitalData.name.trim()) {
      setError('Hospital name is required');
      return;
    }

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (operators.some(op => !op.name.trim() || !op.email.trim() || !op.password.trim())) {
        setError('All operator fields are required');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          tier,
          hospital: hospitalData,
          operators,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setSuccess('Account activated! Redirecting to dashboard...');
      
      setTimeout(() => {
        router.push(`/hospital-single/${data.hospitalId}`);
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-[#0891B2] hover:underline text-sm font-medium">
            ← Back to home
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className={`text-sm font-semibold ${step >= 1 ? 'text-[#0891B2]' : 'text-gray-400'}`}>
                Hospital Info
              </span>
              <span className={`text-sm font-semibold ${step >= 2 ? 'text-[#0891B2]' : 'text-gray-400'}`}>
                Operators
              </span>
              <span className={`text-sm font-semibold ${step >= 3 ? 'text-[#0891B2]' : 'text-gray-400'}`}>
                Review
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#0891B2] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <p className="text-red-900 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
              <p className="text-green-900 text-sm">{success}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hospital Information</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
                  <input type="text" name="name" value={hospitalData.name} onChange={handleHospitalChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none" placeholder="e.g., MedStar Washington Hospital Center" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={handleNextStep} className="bg-[#0891B2] hover:bg-[#0E7490] text-white font-semibold px-6 py-2 rounded-lg transition">
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Operator Credentials</h2>
              <div className="space-y-4 mb-6">
                {operators.map((op, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-700">Operator {idx + 1}</h3>
                      {operators.length > 1 && (
                        <button onClick={() => removeOperator(idx)} className="text-red-500 text-sm hover:underline">Remove</button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input type="text" value={op.name} onChange={(e) => handleOperatorChange(idx, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" placeholder="Operator name" />
                      <input type="email" value={op.email} onChange={(e) => handleOperatorChange(idx, 'email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" placeholder="Email" />
                      <input type="password" value={op.password} onChange={(e) => handleOperatorChange(idx, 'password', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" placeholder="Password" />
                    </div>
                  </div>
                ))}
                {operators.length < parseInt(hospitalData.operatorCount) && (
                  <button onClick={addOperator} className="text-[#0891B2] text-sm font-medium hover:underline">+ Add another operator</button>
                )}
              </div>
              <div className="flex justify-between gap-3">
                <button onClick={handlePrevStep} className="border border-gray-300 text-gray-600 font-semibold px-6 py-2 rounded-lg hover:bg-gray-50 transition">← Back</button>
                <button onClick={handleNextStep} className="bg-[#0891B2] hover:bg-[#0E7490] text-white font-semibold px-6 py-2 rounded-lg transition">Next →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Confirm</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Hospital</h3>
                <p className="text-gray-600 text-sm">{hospitalData.name}</p>
              </div>
              <div className="flex justify-between gap-3">
                <button type="button" onClick={handlePrevStep} className="border border-gray-300 text-gray-600 font-semibold px-6 py-2 rounded-lg hover:bg-gray-50 transition">← Back</button>
                <button type="submit" disabled={loading} className="bg-[#0891B2] hover:bg-[#0E7490] disabled:opacity-40 text-white font-semibold px-6 py-2 rounded-lg transition">{loading ? 'Completing...' : 'Complete Setup'}</button>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AccountSetupContent />
    </Suspense>
  );
}
