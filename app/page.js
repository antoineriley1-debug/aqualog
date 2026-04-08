import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#164E63] to-[#0891B2] text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-block bg-white/10 text-cyan-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            ASHRAE 188 · JCAHO Ready
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6 max-w-3xl mx-auto">
            Water Chemistry Compliance.<br />Simplified.
          </h1>
          <p className="text-xl text-cyan-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track boiler and chilled water readings across all your facilities. Stay compliant. Get alerted instantly when values go out of range.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup" className="bg-white text-[#0891B2] font-bold px-8 py-3.5 rounded-xl hover:bg-cyan-50 transition text-base shadow-lg">
              Start Free Trial →
            </Link>
            <Link href="/pricing" className="border border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition text-base">
              See Pricing
            </Link>
          </div>
          <p className="text-cyan-200 text-sm mt-5">14-day free trial · No credit card required</p>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="bg-[#0E7490] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-cyan-100">
          {['✅ ASHRAE 188 Compliant', '✅ JCAHO Documentation Ready', '✅ Multi-Facility Dashboard', '✅ 2-Year Data Retention', '✅ Instant Email Alerts'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to stay compliant</h2>
            <p className="text-gray-500 mt-3 text-lg">Built for facilities engineers. Designed for compliance officers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📋', title: 'Shift-Based Logging', desc: 'Log boiler and chilled water readings per shift — day, evening, and night. Every reading timestamped with tester name and time.' },
              { icon: '📈', title: 'Trend Analysis', desc: 'Chart any parameter across any time range — 7 days to 2 years. Spot drift before it becomes a problem.' },
              { icon: '🔔', title: 'Instant Alerts', desc: 'Out-of-range readings trigger immediate email alerts to your team. Never miss a compliance issue.' },
              { icon: '🏢', title: 'Multi-Facility', desc: 'Manage all your buildings from one dashboard. Each facility fully isolated — operators only see their site.' },
              { icon: '📊', title: 'Compliance Reports', desc: 'One-click compliance summaries by facility. Export to CSV for JCAHO audits and regulatory documentation.' },
              { icon: '🔐', title: 'Role-Based Access', desc: 'Admins see everything. Operators see only their facility. Your data stays where it belongs.' },
            ].map(f => (
              <div key={f.title} className="bg-[#F0F9FF] rounded-2xl p-6 border border-cyan-100">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-24 bg-[#F0F9FF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Built for every facility type</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏥', title: 'Hospitals & Healthcare', desc: 'Meet Joint Commission water management plan requirements. Track Legionella prevention program data automatically.' },
              { icon: '🏨', title: 'Hotels & Hospitality', desc: 'Keep cooling towers, boilers, and domestic water systems in spec. Protect guests and staff from waterborne pathogens.' },
              { icon: '🏢', title: 'Commercial Buildings', desc: 'ASHRAE 188 compliance made simple. Document your water treatment program with shift-by-shift precision.' },
            ].map(w => (
              <div key={w.title} className="bg-white rounded-2xl p-8 shadow-sm border border-cyan-100 text-center">
                <div className="text-5xl mb-4">{w.icon}</div>
                <h3 className="font-bold text-gray-900 text-xl mb-3">{w.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-[#164E63] to-[#0891B2] text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Start your free 14-day trial today</h2>
          <p className="text-cyan-100 mb-8 text-lg">No credit card required. Cancel anytime. Setup takes 5 minutes.</p>
          <Link href="/signup" className="bg-white text-[#0891B2] font-bold px-10 py-4 rounded-xl hover:bg-cyan-50 transition text-base shadow-lg inline-block">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm">
        <div className="text-white font-bold text-lg mb-2">💧 FacilityH2O</div>
        <p>Water Chemistry Compliance. Simplified.</p>
        <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
          <Link href="/login" className="hover:text-white transition">Log In</Link>
          <span className="text-gray-600">·</span>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <span className="text-gray-600">·</span>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
        </div>
        <p className="mt-4 text-gray-500">© 2026 Antoine Riley. FacilityH2O™. All rights reserved.</p>
      </footer>
    </div>
  );
}
