'use client';
/**
 * TierGate Component
 * Restricts access to premium features based on subscription tier
 */

import { useRouter } from 'next/navigation';

const TIER_HIERARCHY = {
  enterprise: 3,
  professional: 2,
  starter: 1,
};

export default function TierGate({ requiredTier = 'professional', user, children }) {
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access this feature.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#0072CE] text-white px-6 py-2 rounded-lg hover:bg-[#005fa3] transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const userTierLevel = TIER_HIERARCHY[user.tier] || 0;
  const requiredTierLevel = TIER_HIERARCHY[requiredTier] || 0;

  if (userTierLevel < requiredTierLevel) {
    const tierNames = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Premium Feature</h2>
          <p className="text-gray-600 mb-4">
            This feature is available on <strong>{tierNames[requiredTier]}</strong> plans and above.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your current plan: <strong>{tierNames[user.tier] || 'Unknown'}</strong>
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-[#0072CE] text-white px-6 py-2 rounded-lg hover:bg-[#005fa3] transition-colors w-full mb-3"
          >
            Upgrade Plan
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-[#0072CE] transition-colors w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}
