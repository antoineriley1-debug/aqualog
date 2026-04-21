'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const TIER_INFO = {
  starter: {
    name: 'Starter',
    price: 499,
    hospitalLimit: 1,
    description: 'Perfect for small facilities',
  },
  pro: {
    name: 'Pro',
    price: 999,
    hospitalLimit: 10,
    description: 'Scaled for multi-hospital networks',
  },
  custom: {
    name: 'Custom',
    price: null,
    hospitalLimit: 'unlimited',
    description: 'Enterprise-grade solutions',
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'starter';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // For all tiers
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    
    // For custom tier
    hospitalsNeeded: '',
    notes: '',
    
    // For starter/pro (payment)
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const tierData = TIER_INFO[tier] || TIER_INFO.starter;
  const isCustom = tier === 'custom';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.companyName || !formData.contactName || !formData.email) {
        throw new Error('Please fill in all required fields');
      }

      if (!isCustom) {
        // Validate payment fields
        if (!formData.cardName || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
          throw new Error('Please fill in all payment information');
        }
      }

      const endpoint = isCustom ? '/api/checkout/custom' : '/api/checkout/payment';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Redirect to setup page with the account ID
      router.push(`/setup?accountId=${data.accountId}&tier=${tier}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/pricing" className="text-[#0891B2] hover:underline text-sm font-medium">
            ← Back to pricing
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="text-xl font-bold text-gray-900">{tierData.name}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Hospitals</p>
                  <p className="text-lg font-bold text-gray-900">
                    {typeof tierData.hospitalLimit === 'string' 
                      ? tierData.hospitalLimit 
                      : `up to ${tierData.hospitalLimit}`}
                  </p>
                </div>

                <p className="text-xs text-gray-500">{tierData.description}</p>
              </div>

              {!isCustom && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly price</span>
                    <span className="font-bold text-gray-900">${tierData.price}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Total/month</span>
                      <span className="text-2xl font-bold text-gray-900">${tierData.price}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Billing starts after account setup. Cancel anytime.
                  </p>
                </div>
              )}

              {isCustom && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-sm text-blue-900">
                    Our sales team will contact you within 24 hours to discuss custom pricing and features.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmitPayment} className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isCustom ? 'Contact Our Sales Team' : 'Complete Your Purchase'}
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                  <p className="text-red-900 text-sm">{error}</p>
                </div>
              )}

              {/* Company Info Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital/Organization Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                      placeholder="e.g., MedStar Washington"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                        placeholder="name@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                        placeholder="(202) 555-0123"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Tier Specific */}
              {isCustom && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Enterprise Needs</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How many hospitals do you need to manage?
                      </label>
                      <input
                        type="number"
                        name="hospitalsNeeded"
                        value={formData.hospitalsNeeded}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                        placeholder="e.g., 25"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tell us about your needs
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none resize-none"
                        placeholder="Custom features, integrations, timeline, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Section - only for starter/pro */}
              {!isCustom && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Demo mode:</strong> This is a prototype. Enter any valid-looking test credentials.
                      Stripe integration coming soon.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                        placeholder="Full name on card"
                        required={!isCustom}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                        placeholder="4111 1111 1111 1111"
                        required={!isCustom}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry (MM/YY) *
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                          placeholder="12/25"
                          required={!isCustom}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent outline-none"
                          placeholder="123"
                          required={!isCustom}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isCustom
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-[#0891B2] hover:bg-[#0a7a99]'
                }`}
              >
                {loading ? 'Processing...' : isCustom ? 'Submit Inquiry' : 'Complete Setup'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By proceeding, you agree to our{' '}
                <Link href="/terms" className="text-[#0891B2] hover:underline">
                  Terms of Service
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
