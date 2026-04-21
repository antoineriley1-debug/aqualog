import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PricingCard from '@/components/PricingCard';

const TIERS = [
  {
    tier: 'starter',
    name: 'Starter',
    price: 499,
    description: 'Perfect for small facilities',
    hospitalLimit: 1,
    accountLimit: '∞ (unlimited)',
    features: [
      '1 hospital',
      'Unlimited operator accounts',
      'ST108 water chemistry tracking',
      'Legionella monitoring',
      'Email alerts & notifications',
      'Audit trail & compliance logs',
      '3-year data retention',
      'CSV export',
      'Email support'
    ],
    cta: 'Get Started',
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 999,
    description: 'Scaled for multi-hospital networks',
    hospitalLimit: 10,
    accountLimit: '∞ (unlimited)',
    features: [
      'Up to 10 hospitals',
      'Unlimited operator accounts',
      'Everything in Starter',
      'Cross-hospital dashboards',
      'Trend analysis & alerts',
      'Compliance scoring',
      'Advanced reporting',
      'Priority email & phone support'
    ],
    highlighted: true,
    cta: 'Get Started',
  },
  {
    tier: 'custom',
    name: 'Custom',
    price: null,
    description: 'Enterprise-grade solutions',
    hospitalLimit: '∞ (unlimited)',
    accountLimit: '∞ (unlimited)',
    features: [
      'Unlimited hospitals',
      'Unlimited operator accounts',
      'Everything in Pro',
      'Custom parameters & integrations',
      'SSO / LDAP',
      'Custom branding',
      'Dedicated account manager',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F0F9FF]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">Choose the plan that fits your facility network.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.tier}
              className={`rounded-lg border-2 p-8 flex flex-col ${
                tier.highlighted
                  ? 'border-[#0891B2] bg-[#E0F7FA] shadow-lg'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-bold text-[#0891B2] uppercase mb-4 bg-[#B3E5FC] px-3 py-1 rounded-full inline-block">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{tier.description}</p>

              <div className="mb-6">
                {tier.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                    <span className="text-gray-500 text-lg">/month</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">Custom pricing</div>
                )}
              </div>

              <div className="mb-6 pb-6 border-b border-gray-300">
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Hospitals</div>
                  <div className="text-lg font-bold text-gray-900">{tier.hospitalLimit}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Accounts</div>
                  <div className="text-lg font-bold text-gray-900">{tier.accountLimit}</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.tier === 'custom' ? '/checkout?tier=custom' : `/checkout?tier=${tier.tier}`}
                className={`block text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                  tier.highlighted
                    ? 'bg-[#0891B2] text-white hover:bg-[#0a7a99]'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <Link href="/login" className="text-[#0891B2] hover:underline">Already have an account?</Link>
        </div>
      </div>
    </div>
  );
}
