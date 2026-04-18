import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-xl font-bold text-[#003366]">
            <span className="text-2xl">💧</span>
            <span>AquaLog</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#0072CE] transition">Features</a>
            <a href="#story" className="hover:text-[#0072CE] transition">Our Story</a>
            <a href="#compliance" className="hover:text-[#0072CE] transition">Compliance</a>
            <a href="#pricing" className="hover:text-[#0072CE] transition">Pricing</a>
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
          <div className="inline-block bg-white/10 text-cyan-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            Built by a Stationary Engineer turned Systems Director
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Water Chemistry Compliance.<br />Built for Facilities.
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            AquaLog is the purpose-built water treatment logging platform trusted by facility engineers and compliance officers. Shift-based logging, real-time alerts, and audit-ready reports — all in one place.
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

      {/* FOUNDER STORY */}
      <section id="story" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-bold text-[#0072CE] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full mb-4">Founder Story</div>
            <h2 className="text-3xl font-bold text-gray-900">From the Boiler Room to the Boardroom — to the Code</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Story text */}
            <div className="space-y-5 text-gray-700 leading-relaxed">
              <p className="text-lg">
                <span className="font-bold text-[#003366]">I spent over a decade in mechanical rooms before I ever sat in a director's chair.</span> Seven years as a High Pressure Stationary Engineer at Temple University — running boilers, managing chemical treatment, knowing every gauge and valve in the plant. Then Main Line Health. Then MEP Supervisor at UPenn.
              </p>
              <p>
                I knew water chemistry from the floor up — not from a textbook. I knew what a bad conductivity reading smelled like before I even looked at the gauge. I knew the difference between a treatment schedule that works and one that just looks good on paper.
              </p>
              <p>
                Then I became a Systems Director at MedStar Health — overseeing facilities across 10 hospitals in the DC/Maryland/Virginia region — and inherited paper logs. I watched facility teams scramble before Joint Commission visits. I saw Legionella alerts get missed because someone forgot to check a notebook. I knew exactly what was wrong because I&apos;d <em>been</em> the one filling out those logs.
              </p>
              <p className="text-lg font-semibold text-[#003366]">So I built AquaLog. Because no one else was going to.</p>
              <blockquote className="border-l-4 border-[#0072CE] pl-6 py-2 bg-blue-50 rounded-r-xl">
                <p className="text-gray-700 italic text-sm leading-relaxed">
                  &ldquo;I spent over a decade in mechanical rooms — running high-pressure boilers at Temple University, maintaining systems at Main Line Health, supervising MEP operations at UPenn. I knew every valve, every gauge, every chemical treatment schedule. Then I became a director and inherited paper logs. I built AquaLog because no one else was going to.&rdquo;
                </p>
                <cite className="block mt-3 text-xs font-semibold text-[#003366] not-italic">
                  — Antoine W. Riley Sr., Founder | Systems Director, Crothall Healthcare / MedStar Health
                </cite>
              </blockquote>
            </div>

            {/* Founder card + career timeline */}
            <div className="space-y-6">
              {/* Founder card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">AWR</div>
                  <div>
                    <div className="font-bold text-gray-900">Antoine W. Riley Sr.</div>
                    <div className="text-sm text-gray-500">Founder, AquaLog</div>
                    <div className="text-xs text-[#0072CE]">Systems Director — Crothall Healthcare / MedStar Health</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { num: '10+', label: 'Hospitals Managed' },
                    { num: '15+', label: 'Years on the Floor' },
                    { num: 'DC/MD/VA', label: 'MedStar Region' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#F0F9FF] rounded-xl p-3">
                      <div className="font-extrabold text-[#003366] text-lg">{s.num}</div>
                      <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Career Path</div>
                <div className="space-y-4">
                  {[
                    { role: 'High Pressure Stationary Engineer', org: 'Temple University — 7 years' },
                    { role: 'Stationary Engineer', org: 'Main Line Health — 3 years' },
                    { role: 'MEP Supervisor', org: 'University of Pennsylvania' },
                    { role: 'Systems Director', org: 'Crothall Healthcare / MedStar Health — 10 hospitals' },
                    { role: 'Founder, AquaLog', org: 'Built the system the field actually needed', highlight: true },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${step.highlight ? 'bg-[#0072CE] ring-4 ring-blue-100' : 'bg-gray-300'}`} />
                      <div>
                        <div className={`font-semibold text-sm ${step.highlight ? 'text-[#0072CE]' : 'text-gray-800'}`}>{step.role}</div>
                        <div className="text-xs text-gray-400">{step.org}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CREDIBILITY PILLARS */}
      <section className="py-16 px-6 bg-[#003366] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-blue-200 text-lg font-semibold">
              Built for facilities professionals, by a facilities professional.
            </p>
            <p className="text-blue-300 text-sm mt-2 max-w-2xl mx-auto">
              Not by a software company that&apos;s never seen a mechanical room. Not by consultants who&apos;ve never held a wrench. By someone who&apos;s done this work — and knows exactly what you need.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🏥', title: 'Healthcare-Specific', desc: 'Designed exclusively for hospital and healthcare facility water systems.' },
              { icon: '📜', title: 'Regulation-First', desc: 'Every feature maps to a regulatory requirement. No fluff — just compliance.' },
              { icon: '⚡', title: 'Built for the Field', desc: 'Simple enough to use on the floor. Powerful enough for the director\'s office.' },
              { icon: '🔒', title: 'Audit-Proof', desc: 'Tamper-evident, timestamped, exportable. Ready when the inspector walks in.' },
            ].map(p => (
              <div key={p.title} className="bg-white/10 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">{p.icon}</div>
                <div className="font-bold text-white mb-2">{p.title}</div>
                <div className="text-blue-200 text-xs leading-relaxed">{p.desc}</div>
              </div>
            ))}
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
              { icon: '🔔', title: 'Instant Out-of-Range Alerts', desc: 'When a reading falls outside acceptable limits, your team is notified immediately. Every alert tracked with an acknowledge workflow.' },
              { icon: '🏢', title: 'Multi-Facility Dashboard', desc: 'Manage all your buildings from one screen. Each facility isolated — operators see only their site, admins see everything.' },
              { icon: '✅', title: 'ST108 Compliance Tracking', desc: 'Built-in ST108 water log compliance with audit trail and one-click compliance reports. Joint Commission inspection ready.' },
              { icon: '🧫', title: 'Legionella Program Tracking', desc: 'Log and track your Legionella water management program entries. Full audit history for regulatory submissions.' },
              { icon: '🔍', title: 'Tamper-Evident Audit Log', desc: 'Every login, every entry, every change is permanently logged with timestamp, user, and IP. SHA-256 sealed — immutable chain of custody.' },
              { icon: '👥', title: 'Role-Based Access', desc: 'Admin accounts see all facilities and reports. Operator accounts are scoped to their assigned building only. No configuration needed.' },
              { icon: '🎨', title: 'Custom Branding', desc: 'Set your color scheme, dark/light mode, and site-wide theme. Make AquaLog look like it belongs to your organization.' },
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
              AquaLog is built around the regulations that govern healthcare water systems — so you&apos;re never scrambling to prove compliance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { badge: 'TJC', title: 'The Joint Commission', desc: 'EC.02.05.02 — Water management plan requirement. TJC can cite you on the spot for missing documentation. AquaLog keeps it current, accessible, and audit-ready at all times.' },
              { badge: 'AAMI', title: 'ANSI/AAMI ST108:2023', desc: 'Water quality standards for medical device reprocessing. Our compliance module tracks every required parameter — conductivity, endotoxin, bacterial levels, and more.' },
              { badge: 'ASHRAE', title: 'ASHRAE 188-2018', desc: 'Legionella risk management for building water systems. Full Water Management Program logging, biological testing tracking, and corrective action documentation.' },
              { badge: 'CMS', title: 'CMS QSO17-30', desc: 'Centers for Medicare & Medicaid Services water management program requirements. Stay compliant and reimbursable — one missed requirement shouldn\'t cost you CMS status.' },
              { badge: 'DOH', title: 'State DOH Requirements', desc: 'Department of Health water quality and Legionella regulations vary by state. Our flexible logging system captures what your state requires with customizable parameters.' },
              { badge: '+', title: 'Always Up To Date', desc: 'Regulations change. We track them so you don\'t have to. When standards update, AquaLog updates — your workflow stays the same, your compliance stays current.' },
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
              { icon: '🏥', title: 'Hospitals & Healthcare', desc: 'Meet Joint Commission water management plan requirements. Track Legionella prevention program data automatically. Built by someone who\'s worked inside major health systems.' },
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
                <Link href={p.name === 'Enterprise' ? '#demo' : '/login'} className={`block w-full text-center font-semibold py-3 rounded-xl transition ${p.highlight ? 'bg-[#0072CE] text-white hover:bg-[#005fa3]' : 'border border-gray-300 text-gray-700 hover:border-[#0072CE] hover:text-[#0072CE]'}`}>
                  {p.name === 'Enterprise' ? 'Contact Us' : 'Get Started'}
                </Link>
              </div>
            ))}
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
              Don&apos;t wait for a citation to fix your water management program. Request a demo today and see how AquaLog transforms compliance from a liability into a competitive advantage.
            </p>
            <ul className="space-y-3 text-sm text-blue-100">
              {[
                '30-minute live walkthrough',
                'Tailored to your hospital count and systems',
                'No commitment required',
                'Talk directly to Antoine — not a sales rep',
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
                <input type="text" placeholder="Antoine Riley" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#0072CE]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Title</label>
                <input type="text" placeholder="Facilities Director" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#0072CE]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Organization</label>
                <input type="text" placeholder="MedStar Health" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-[#0072CE]" />
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
          <span className="text-xl">💧</span> AquaLog
        </div>
        <p className="text-gray-500 mb-1">Water Chemistry Compliance. Built for Facilities.</p>
        <p className="text-gray-600 text-xs mb-5">Built by a Stationary Engineer turned Systems Director — Antoine W. Riley Sr.</p>
        <div className="flex items-center justify-center gap-6 flex-wrap mb-4">
          <Link href="/login" className="hover:text-white transition">Sign In</Link>
          <a href="#demo" className="hover:text-white transition">Request Demo</a>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <a href="mailto:info@facilityh2o.com" className="hover:text-white transition">info@facilityh2o.com</a>
        </div>
        <p className="text-gray-600">© 2026 Antoine Riley. AquaLog™. All rights reserved.</p>
      </footer>
    </div>
  );
}
