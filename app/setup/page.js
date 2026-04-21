'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const TIER_LIMITS = {
  starter: { maxHospitals: 1 },
  pro: { maxHospitals: 10 },
  custom: { maxHospitals: 999 }, // effectively unlimited
};

function AccountSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');
  const tier = searchParams.get('tier') || 'starter';

  const [step, setStep] = useState(1); // 1: Hospital Info, 2: Operator Credentials, 3: Review
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
    
    // Validate hospital data
    if (!hospitalData.name.trim()) {
      setError('Hospital name is required');
      return;
    }

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Validate operators
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

      const response = await fetch('/api/setup/complete', {
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
      
      // Redirect to hospital dashboard after a short delay
      setTimeout(() => {
        router.push(`/hospital-single?hospitalId=${data.hospitalId}`);
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/pricing" className="text-[#0891B2] hover:underline text-sm font-medium">
            ← Back to pricing
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Progress */}
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

          {/* Step 1: Hospital Info */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hospital Information</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={hospitalData.name}
                    onChange={handleHospitalChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                    placeholder="e.g., MedStar Washington Hospital Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={hospitalData.address}
                    onChange={handleHospitalChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={hospitalData.city}
                      onChange={handleHospitalChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                      placeholder="Washington"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={hospitalData.state}
                      onChange={handleHospitalChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                      placeholder="DC"
                      maxLength="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={hospitalData.zipCode}
                      onChange={handleHospitalChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                      placeholder="20010"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={hospitalData.phone}
                    onChange={handleHospitalChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                    placeholder="(202) 555-0123"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Plan Limit:</strong> Your {tier} plan allows up to{' '}
                    <strong>{tierLimits.maxHospitals}</strong> hospital
                    {tierLimits.maxHospitals !== 1 ? 's' : ''}. You can add more from settings later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Operators */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Operator Credentials</h2>
              
              <p className="text-gray-600 mb-6">
                Create credentials for water operators who will enter daily readings.
              </p>

              <div className="space-y-6 mb-6">
                {operators.map((op, idx) => (
                  <div key={idx} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">Operator {idx + 1}</h3>
                      {operators.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOperator(idx)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={op.name}
                          onChange={(e) => handleOperatorChange(idx, 'name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                          placeholder="John Smith"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={op.email}
                          onChange={(e) => handleOperatorChange(idx, 'email', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                          placeholder="operator@hospital.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={op.password}
                          onChange={(e) => handleOperatorChange(idx, 'password', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                          placeholder="Minimum 8 characters"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Must contain uppercase, number, and be at least 8 characters
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {operators.length < 5 && (
                <button
                  type="button"
                  onClick={addOperator}
                  className="mb-6 px-4 py-2 border-2 border-[#0891B2] text-[#0891B2] rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  + Add Another Operator
                </button>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900">
                  You can add or remove operators anytime from the admin panel.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Activate</h2>

              <div className="space-y-6 mb-6">
                <div className="border border-gray-300 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Hospital Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium text-gray-900">{hospitalData.name}</dd>
                    </div>
                    {hospitalData.address && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Address:</dt>
                        <dd className="font-medium text-gray-900">
                          {hospitalData.address} {hospitalData.city} {hospitalData.state} {hospitalData.zipCode}
                        </dd>
                      </div>
                    )}
                    {hospitalData.phone && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Phone:</dt>
                        <dd className="font-medium text-gray-900">{hospitalData.phone}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="border border-gray-300 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Operators ({operators.length})</h3>
                  <ul className="space-y-2 text-sm">
                    {operators.map((op, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span className="text-gray-600">{op.name}</span>
                        <span className="text-gray-600">{op.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Plan Details</h3>
                  <p className="text-sm text-green-900">
                    <strong>{tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</strong> — Up to{' '}
                    {tierLimits.maxHospitals} hospital{tierLimits.maxHospitals !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6">
                <p className="text-sm text-gray-700">
                  By activating, you agree to our{' '}
                  <Link href="/terms" className="text-[#0891B2] hover:underline">
                    Terms of Service
                  </Link>
                  . You can edit this information from the admin panel anytime.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="ml-auto px-6 py-2 bg-[#0891B2] text-white rounded-lg font-semibold hover:bg-[#0a7a99] transition-colors disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Activating...' : 'Activate Account'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountSetupContent />
    </Suspense>
  );
}
