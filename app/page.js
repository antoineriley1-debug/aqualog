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
            <a href="#story" className="hover:text-[#0072CE] transition">Our Story</a>
            <a href="#compliance" className="hover:text-[#0072CE] transition">Compliance</a>
            <a href="#pricing" className="hover:text-[#0072CE] transition">Pricing</a>
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
          <div className="inline-block bg-white/10 text-cyan-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            ASHRAE 188 · Joint Commission Ready · OSHA Compliant
          </div>
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
            <a href="#features" className="border border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition text-base">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-[#0072CE] text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-blue-100">
          {['✅ ASHRAE 188 Compliant', '✅ Joint Commission Ready', '✅ Shift-Based Logging', '✅ Real-Time Alerts', '✅ Audit Trail Built-In', '✅ Multi-Facility Dashboard'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      {/* STORY / ORIGIN */}
      <section id="story" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">The Story Behind FacilityH2O</h2>
            <p className="text-gray-500 text-lg">Built from real-world experience inside major health systems.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 space-y-6 text-gray-700 leading-relaxed">
            <p className="text-lg">
              <span className="font-bold text-[#003366]">FacilityH2O was born on the floor of a busy hospital boiler room.</span> The founder spent years managing water treatment programs across large healthcare facilities — logging readings on paper, chasing operators for missed shifts, scrambling during Joint Commission inspections to pull together months of handwritten data.
            </p>
            <p>
              In 2025, after one too many compliance near-misses caused by disorganized paper logs and disconnected spreadsheets, the decision was made: <em>there had to be a better way.</em> The first version was built in a weekend to serve a single campus. Within months, it was running across multiple facilities — tracking boiler water, chilled water, cooling towers, and domestic water systems in real time.
            </p>
            <p>
              What started as an internal tool quickly became something facility managers at other organizations wanted. Water treatment compliance is not glamorous — but it is critical. Legionella outbreaks, scale buildup, and corrosion failures cost healthcare systems millions of dollars and, in the worst cases, patient lives.
            </p>
            <p className="text-lg font-semibold text-[#003366]">
              FacilityH2O exists to make doing the right thing as easy as possible — for every engineer, on every shift, at every facility.
            </p>
          </div>
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
              { icon: '🔔', title: 'Instant Out-of-Range Alerts', desc: 'When a reading falls outside acceptable limits, your team is notified immediately. Every alert tracked with acknowledge workflow.' },
              { icon: '🏢', title: 'Multi-Facility Dashboard', desc: 'Manage all your buildings from one screen. Each facility isolated — operators see only their site, admins see everything.' },
              { icon: '📊', title: 'ST108 Compliance Tracking', desc: 'Built-in ST108 water log compliance with audit trail and one-click compliance reports. Joint Commission inspection ready.' },
              { icon: '🦠', title: 'Legionella Program Tracking', desc: 'Log and track your Legionella water management program entries. Full audit history for regulatory submissions.' },
              { icon: '📁', title: 'Audit Log', desc: 'Every login, every entry, every change is permanently logged with timestamp, user, and IP address. Immutable chain of custody.' },
              { icon: '👥', title: 'Role-Based Access', desc: 'Admin accounts see all facilities and reports. Operator accounts are scoped to their assigned building only. No configuration needed.' },
              { icon: '🎨', title: 'Custom Branding', desc: 'Set your color scheme, dark mode, and site-wide theme. Make FacilityH2O look like it belongs to your organization.' },
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

      {/* COMPLIANCE SECTION */}
      <section id="compliance" className="py-24 px-6 bg-[#003366] text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Built for Regulatory Compliance</h2>
          <p className="text-blue-200 text-lg mb-12 max-w-2xl mx-auto">
            FacilityH2O was designed from day one to satisfy the documentation requirements of the toughest regulatory frameworks in healthcare.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { badge: 'ASHRAE 188', title: 'Water Management Plans', desc: 'Log every required parameter for your ASHRAE 188 Water Management Plan. Shift-by-shift precision, always audit-ready.' },
              { badge: 'Joint Commission', title: 'Inspection Ready', desc: 'Pull a full compliance summary for any facility, any time range in one click. Stop scrambling during inspections.' },
              { badge: 'OSHA / CDC', title: 'Legionella Prevention', desc: 'Track your Legionella risk assessment and control measures with a dedicated logging module and permanent audit trail.' },
            ].map(c => (
              <div key={c.badge} className="bg-white/10 rounded-2xl p-8 text-left">
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏥', title: 'Hospitals & Healthcare', desc: 'Meet Joint Commission water management plan requirements. Track Legionella prevention program data automatically. Built by someone who worked in healthcare facilities.' },
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

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 text-lg mb-12">Per-facility monthly lease. No long-term contracts. Cancel anytime.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$99', per: '/facility/mo', features: ['Up to 2 facilities', 'Shift logging', 'Basic alerts', 'History & trends', 'Email support'], highlight: false },
              { name: 'Professional', price: '$249', per: '/facility/mo', features: ['Unlimited facilities', 'ST108 compliance module', 'Legionella tracking', 'Audit log', 'Custom branding', 'Priority support'], highlight: true },
              { name: 'Enterprise', price: 'Custom', per: '', features: ['Volume pricing', 'Dedicated onboarding', 'SLA guarantee', 'Custom integrations', 'HIPAA BAA available', 'Phone support'], highlight: false },
            ].map(p => (
              <div key={p.name} className={`rounded-2xl p-8 border-2 flex flex-col ${p.highlight ? 'border-[#0072CE] shadow-lg bg-[#F0F9FF]' : 'border-gray-200'}`}>
                {p.highlight && <div className="text-xs font-bold text-[#0072CE] uppercase tracking-widest mb-2">Most Popular</div>}
                <div className="text-2xl font-bold text-gray-900 mb-1">{p.name}</div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-[#003366]">{p.price}</span>
                  <span className="text-gray-400 text-sm">{p.per}</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-600 flex-1 mb-8">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>)}
                </ul>
                <Link href="/login" className={`block w-full text-center font-semibold py-3 rounded-xl transition ${p.highlight ? 'bg-[#0072CE] text-white hover:bg-[#005fa3]' : 'border border-gray-300 text-gray-700 hover:border-[#0072CE] hover:text-[#0072CE]'}`}>
                  {p.name === 'Enterprise' ? 'Contact Us' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#003366] to-[#0072CE] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to get compliant?</h2>
          <p className="text-blue-100 mb-8 text-lg">Sign in to your portal or contact us to get started with a demo.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="bg-white text-[#003366] font-bold px-10 py-4 rounded-xl hover:bg-blue-50 transition shadow-lg inline-block">
              Sign In →
            </Link>
            <a href="mailto:info@facilityh2o.com" className="border border-white/40 text-white font-semibold px-10 py-4 rounded-xl hover:bg-white/10 transition inline-block">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6 text-center text-sm">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-3">
          <span className="text-xl">💧</span> FacilityH2O
        </div>
        <p className="text-gray-500 mb-4">Water Chemistry Compliance. Built for Facilities.</p>
        <div className="flex items-center justify-center gap-6 flex-wrap mb-4">
          <Link href="/login" className="hover:text-white transition">Sign In</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <a href="mailto:info@facilityh2o.com" className="hover:text-white transition">info@facilityh2o.com</a>
        </div>
        <p className="text-gray-600">© 2026 Antoine Riley. FacilityH2O™. All rights reserved.</p>
      </footer>
    </div>
  );
}
