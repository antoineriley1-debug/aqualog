import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PricingCard from '@/components/PricingCard';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F0F9FF]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">Start free for 14 days. No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <PricingCard plan="starter" name="Starter" price={349} features={['1 facility','Up to 5 users','Boiler + chilled water tracking','Shift-based entry (3x/day)','Email alerts','2-year history','CSV export']} ctaHref="/signup?plan=starter" />
          <PricingCard plan="professional" name="Professional" price={599} highlighted features={['Up to 5 facilities','Unlimited users','Everything in Starter','Trend analysis & charts','Cross-facility reports','Compliance scoring','Priority support']} ctaHref="/signup?plan=professional" />
          <PricingCard plan="enterprise" name="Enterprise" price={null} features={['Unlimited facilities','Unlimited users','Everything in Pro','Custom chemistry parameters','API access','Dedicated onboarding','SLA guarantee','White-label option']} ctaHref="/signup?plan=enterprise" />
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          All plans include a 14-day free trial. No credit card needed. Cancel anytime.{' '}
          <Link href="/login" className="text-[#0891B2] hover:underline">Already have an account?</Link>
        </div>
      </div>
    </div>
  );
}
