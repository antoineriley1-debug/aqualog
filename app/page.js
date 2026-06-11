import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-xl font-bold text-[#003366]">
            <span className="text-2xl">💧</span>
            <span>FacilityH2O</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#0072CE] transition">Features</a>
            <a href="#compliance" className="hover:text-[#0072CE] transition">Compliance</a>
            <a href="#demo" className="hover:text-[#0072CE] transition">Request Demo</a>
          </div>
          <Link
            href="/login"
            className="bg-[#0072CE] hover:bg-[#005fa3] text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
          >
            Sign In →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#003366] to-[#0072CE] text-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Water Chemistry Compliance.<br />Built for Facilities.
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            FacilityH2O is the purpose-built water treatment logging platform trusted by facility engineers and compliance officers. Shift-based logging, real-time alerts, and audit-ready reports — all in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="bg-white text-[#003366] font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition shadow-lg text-base">
              Sign In to Your Portal →
            </Link>
            <a href="#demo" className="border border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition text-base">
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-[#0072CE] text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-blue-100">
          {['✓ ASHRAE 188 Compliant', '✓ Joint Commission Ready', '✓ CMS QSO17-30', '✓ ANSI/AAMI ST108', '✓ Shift-Based Logging', '✓ Audit Trail Built-In', '✓ Multi-Facility Dashboard'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything Your Team Needs</h2>
            <p className="text-gray-500 mt-3 text-lg">From shift logging to ST108 compliance — one platform, zero paperwork.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Shift-Based Logging', desc: 'Log boiler and chilled water readings by shift — day, evening, night. Every reading timestamped with operator name, time, and system.' },
              { icon: '📈', title: 'Trend Analysis', desc: 'Interactive charts for any parameter over any time range. Spot drift early before it becomes a compliance failure or equipment issue.' },
              { icon: '🔔', title: 'Instant Out-of-Range Alerts', desc: 'When a reading falls outside acceptable limits, your team is notified immediately. Every alert tracked with an acknowledge workflow.' },
              { icon: '🏢', title: 'Multi-Facility Dashboard', desc: 'Manage all your buildings from one screen. Each facility isolated — operators see only their site, admins see everything.' },
              { icon: '✅', title: 'ST108 Compliance Tracking', desc: 'Built-in ST108 water log compliance with audit trail and one-click compliance reports. Joint Commission inspection ready.' },
              { icon: '🧫', title: 'Legionella Program Tracking', desc: 'Log and track your Legionella water management program entries. Full audit history for regulatory submissions.' },
              { icon: '🔍', title: 'Tamper-Evident Audit Log', desc: 'Every login, every entry, every change is permanently logged with timestamp, user, and IP. SHA-256 sealed — immutable chain of custody.' },
              { icon: '👥', title: 'Role-Based Access', desc: 'Admin accounts see all facilities and reports. Operator accounts are scoped to their assigned building only. No configuration needed.' },
              { icon: '🎨', title: 'Custom Branding', desc: 'Set your color scheme, dark/light mode, and site-wide theme. Make FacilityH2O look like it belongs to your organization.' },
            ].map(f => (
              <div key={f.title} className="bg-[#F0F9FF] rounded-2xl p-6 border border-blue-100 hover:shadow-md transition">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE / REGULATORY COVERAGE */}
      <section id="compliance" className="py-24 px-6 bg-[#003366] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-yellow-300 uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full mb-4">Regulatory Coverage</div>
            <h2 className="text-3xl font-bold mb-3">Every Standard. Covered.</h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              FacilityH2O is built around the regulations that govern healthcare water systems — so you're never scrambling to prove compliance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { badge: 'TJC', title: 'The Joint Commission', desc: 'EC.02.05.02 — Water management plan requirement. TJC can cite you on the spot for missing documentation. FacilityH2O keeps it current, accessible, and audit-ready at all times.' },
              { badge: 'AAMI', title: 'ANSI/AAMI ST108:2023', desc: 'Water quality standards for medical device reprocessing. Our compliance module tracks every required parameter — conductivity, endotoxin, bacterial levels, and more.' },
              { badge: 'ASHRAE', title: 'ASHRAE 188-2018', desc: 'Legionella risk management for building water systems. Full Water Management Program logging, biological testing tracking, and corrective action documentation.' },
              { badge: 'CMS', title: 'CMS QSO17-30', desc: 'Centers for Medicare & Medicaid Services water management program requirements. Stay compliant and reimbursable — one missed requirement shouldn\'t cost you CMS status.' },
              { badge: 'DOH', title: 'State DOH Requirements', desc: 'Department of Health water quality and Legionella regulations vary by state. Our flexible logging system captures what your state requires with customizable parameters.' },
              { badge: '+', title: 'Always Up To Date', desc: 'Regulations change. We track them so you don\'t have to. When standards update, FacilityH2O updates — your workflow stays the same, your compliance stays current.' },
            ].map(c => (
              <div key={c.badge} className="bg-white/10 rounded-2xl p-7">
                <div className="inline-block bg-[#F6C90E] text-[#003366] text-xs font-bold px-3 py-1 rounded-full mb-4">{c.badge}</div>
                <h3 className="font-bold text-white text-lg mb-2">{c.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Built for Every Facility Type</h2>
            <p className="text-gray-500 mt-3 text-lg">From a single hospital campus to a multi-state health system.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏥', title: 'Hospitals & Healthcare', desc: 'Meet Joint Commission water management plan requirements. Track Legionella prevention program data automatically. Purpose-built for healthcare facilities.' },
              { icon: '🏨', title: 'Hotels & Hospitality', desc: 'Keep cooling towers, boilers, and domestic water systems in spec. Protect guests and staff from waterborne pathogens with shift-by-shift documentation.' },
              { icon: '🏢', title: 'Commercial Buildings', desc: 'ASHRAE 188 compliance made simple. Document your water treatment program with the same rigor as a major health system — at any scale.' },
            ].map(w => (
              <div key={w.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="text-5xl mb-4">{w.icon}</div>
                <h3 className="font-bold text-gray-900 text-xl mb-3">{w.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING — COMING SOON */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Pricing & Plans</h2>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-12">
            <div className="text-6xl mb-4">🔜</div>
            <h3 className="text-2xl font-bold text-amber-900 mb-3">Coming Soon</h3>
            <p className="text-lg text-amber-800 mb-6 leading-relaxed">
              Flexible, transparent pricing plans are being finalized. We're committed to affordable water compliance for facilities of all sizes — from single campuses to multi-state health systems.
            </p>
            <p className="text-base text-amber-700 mb-8">
              Early adopters and pilot programs: <a href="mailto:sales@medstarh20log.com" className="font-bold text-amber-900 underline hover:text-amber-950">Contact Sales</a>
            </p>
            <Link href="#demo" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3 rounded-lg transition">
              Request Early Access →
            </Link>
          </div>
        </div>
      </section>

      {/* DEMO / CTA */}
      <section id="demo" className="py-24 px-6 bg-gradient-to-br from-[#003366] to-[#0072CE] text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: pitch */}
          <div>
            <div className="inline-block text-xs font-bold text-yellow-300 uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full mb-6">Get Started</div>
            <h2 className="text-3xl font-bold mb-4">Your Next Inspection Is Coming.<br />Be Ready.</h2>
            <p className="text-blue-100 mb-6 leading-relaxed">
              Don't wait for a citation to fix your water management program. Request a demo today and see how FacilityH2O transforms compliance from a liability into a competitive advantage.
            </p>
            <ul className="space-y-3 text-sm text-blue-100">
              {[
                '30-minute live walkthrough',
                'Tailored to your hospital count and systems',
                'No commitment required',
              ].map(item => (
                <li key={item} className="flex items-center gap-2"><span className="text-yellow-300 font-bold">✓</span>{item}</li>
              ))}
            </ul>
          </div>
          {/* Right: contact form */}
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-[#003366] font-bold text-xl mb-6">Request a Demo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name</label>
                <input type="text" placeholder="Your Name" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#0072CE]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Title</label>
                <input type="text" placeholder="Facilities Director" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#0072CE]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Organization</label>
                <input type="text" placeholder="Your Organization" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#0072CE]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Work Email</label>
                <input type="email" placeholder="you@organization.com" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#0072CE]" />
              </div>
              <a href="mailto:info@facilityh2o.com?subject=Demo Request" className="block w-full text-center bg-[#0072CE] hover:bg-[#005fa3] text-white font-bold py-3 rounded-xl transition mt-2">
                Send Demo Request →
              </a>
              <p className="text-xs text-gray-400 text-center">Or email directly: <a href="mailto:info@facilityh2o.com" className="text-[#0072CE]">info@facilityh2o.com</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6 text-center text-sm">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-3">
          <span className="text-xl">💧</span> FacilityH2O
        </div>
        <p className="text-gray-500 mb-1">Water Chemistry Compliance. Built for Facilities.</p>
        <div className="flex items-center justify-center gap-6 flex-wrap mb-4">
          <Link href="/login" className="hover:text-white transition">Sign In</Link>
          <a href="#demo" className="hover:text-white transition">Request Demo</a>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <a href="mailto:info@facilityh2o.com" className="hover:text-white transition">info@facilityh2o.com</a>
        </div>
        <p className="text-gray-600">© 2026 FacilityH2O. All rights reserved.</p>
      </footer>
    </div>
  );
}
