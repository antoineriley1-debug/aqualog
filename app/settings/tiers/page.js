'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    hospitalLimit: 1,
    accountLimit: 'unlimited',
    description: 'Perfect for small facilities',
    enabled: true,
    order: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    hospitalLimit: 10,
    accountLimit: 'unlimited',
    description: 'Scaled for multi-hospital networks',
    enabled: true,
    order: 2,
  },
  {
    id: 'custom',
    name: 'Custom',
    price: null,
    hospitalLimit: 'unlimited',
    accountLimit: 'unlimited',
    description: 'Enterprise-grade solutions',
    enabled: true,
    order: 3,
  },
];

export default function TiersPage() {
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tiers');
      if (!response.ok) throw new Error('Failed to load tiers');
      
      const data = await response.json();
      setTiers(data.tiers || DEFAULT_TIERS);
    } catch (err) {
      setError(err.message);
      setTiers(DEFAULT_TIERS);
    } finally {
      setLoading(false);
    }
  };

  const toggleTierEnabled = async (tierId) => {
    try {
      setError('');
      setSuccess('');

      const tier = tiers.find(t => t.id === tierId);
      if (!tier) return;

      const response = await fetch('/api/admin/tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          enabled: !tier.enabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tier');
      }

      setTiers((prev) =>
        prev.map((t) =>
          t.id === tierId ? { ...t, enabled: !t.enabled } : t
        )
      );

      setSuccess(`${tier.name} tier ${!tier.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePriceChange = (tierId, newPrice) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId ? { ...t, price: newPrice === '' ? null : parseFloat(newPrice) } : t
      )
    );
    setEditingId(tierId);
  };

  const saveTierChanges = async (tierId) => {
    try {
      setError('');
      const tier = tiers.find(t => t.id === tierId);
      if (!tier) return;

      const response = await fetch('/api/admin/tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          price: tier.price,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save changes');
      }

      setSuccess(`${tier.name} tier updated`);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const enabledCount = tiers.filter(t => t.enabled).length;

  return (
    <div className="min-h-screen bg-[#F0F9FF] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/settings" className="text-[#0891B2] hover:underline text-sm font-medium">
            ← Back to Settings
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Tiers</h1>
          <p className="text-gray-600 mb-6">
            Manage which pricing tiers are available for new customers on the pricing page.
          </p>

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

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading tier configuration...</p>
            </div>
          ) : (
            <>
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-900">
                  <strong>Active Tiers:</strong> {enabledCount} of {tiers.length} tiers are visible to customers
                </p>
              </div>

              <div className="space-y-6">
                {tiers
                  .sort((a, b) => a.order - b.order)
                  .map((tier) => (
                    <div
                      key={tier.id}
                      className={`border-2 rounded-lg p-6 transition-colors ${
                        tier.enabled
                          ? 'border-[#0891B2] bg-blue-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                          <p className="text-sm text-gray-600">{tier.description}</p>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <span className="text-sm font-medium text-gray-700">
                            {tier.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <div
                            className={`w-12 h-6 rounded-full transition-colors ${
                              tier.enabled ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                                tier.enabled ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                              style={{
                                marginTop: '2px',
                              }}
                            />
                          </div>
                          <input
                            type="checkbox"
                            checked={tier.enabled}
                            onChange={() => toggleTierEnabled(tier.id)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            Monthly Price
                          </p>
                          {tier.id === 'custom' ? (
                            <p className="text-lg font-bold text-gray-900">Custom</p>
                          ) : editingId === tier.id ? (
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  value={tier.price || ''}
                                  onChange={(e) => handlePriceChange(tier.id, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Price"
                                />
                              </div>
                              <button
                                onClick={() => saveTierChanges(tier.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-end gap-2">
                              <p className="text-lg font-bold text-gray-900">${tier.price}</p>
                              <button
                                onClick={() => setEditingId(tier.id)}
                                className="text-xs text-[#0891B2] hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            Hospital Limit
                          </p>
                          <p className="text-lg font-bold text-gray-900">{tier.hospitalLimit}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            Account Limit
                          </p>
                          <p className="text-lg font-bold text-gray-900">{tier.accountLimit}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            Status
                          </p>
                          <p
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              tier.enabled
                                ? 'bg-green-100 text-green-900'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            {tier.enabled ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600">
                          <strong>Features:</strong> ST108 water chemistry tracking, Legionella monitoring,
                          email alerts, audit trail, 3-year retention, CSV export
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
                <ul className="text-sm text-blue-900 space-y-1 ml-4">
                  <li>• <strong>Enabled</strong> tiers show on the pricing page</li>
                  <li>• <strong>Disabled</strong> tiers are hidden from customers</li>
                  <li>• Changes take effect immediately</li>
                  <li>• Existing customers keep their plan even if you disable it</li>
                  <li>• Prices apply to new subscriptions only</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
