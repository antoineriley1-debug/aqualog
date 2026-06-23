import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 text-xl font-bold text-[#003366]">
            <span className="text-2xl">[WATER]</span>
            <span>FacilityH2O</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#0072CE] transition">Features</a>
            <a href="#reports" className="hover:text-[#0072CE] transition">Reports</a>
            <a href="#compliance" className="hover:text-[#0072CE] transition">Compliance</a>
            <a href="/demo.html" className="hover:text-[#0072CE] transition">Request Demo</a>
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
            <a href="/demo.html" className="border border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition text-base">
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-[#0072CE] text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-blue-100">
          {['✓ ASHRAE 188 Compliant', '✓ Joint Commission Ready', '✓ CMS QSO17-30', '✓ ANSI/AAMI ST108', '✓ Shift-Based Logging', '✓ Audit Trail Built-In', '✓ Multi-Facility Dashboard', '✓ AI-Reviewed Reports'].map(item => (
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
              { icon: '≡', title: 'Shift-Based Logging', desc: 'Log readings by shift — 1st, 2nd, 3rd. Every reading timestamped with operator name, time, and system. Set each facility\'s shift hours and timezone.' },
              { icon: '', title: 'Five Systems, Not Just Two', desc: 'Track boiler, chilled water, cooling tower, condensate, and softener — each with its own parameters and safe ranges. Turn on only the systems a facility runs.' },
              { icon: '↗', title: 'Live Trends & System Health', desc: 'Animated health gauges and interactive charts for any parameter over any time range. Spot drift early — before it becomes a compliance failure.' },
              { icon: '', title: 'Instant Out-of-Range Alerts', desc: 'When a reading falls outside acceptable limits, your team is notified immediately. Every alert tracked with an acknowledge workflow.' },
              { icon: '️', title: 'Missed-Reading Detection', desc: 'When a shift ends without a logged reading, it automatically becomes an alert — so a skipped round never slips through unnoticed.' },
              { icon: '', title: 'Reading Consistency Check', desc: 'An advisory signal flags shifts whose readings look suspiciously identical compared to other shifts — a prompt to spot-verify before an auditor does.' },
              { icon: '[ORG]', title: 'Multi-Facility Dashboard', desc: 'Manage all your buildings from one screen. Each facility isolated — operators see only their site, admins see everything.' },
              { icon: '✓', title: 'ST108 Compliance Tracking', desc: 'Built-in ST108 water log compliance with audit trail and one-click compliance reports. Joint Commission inspection ready.' },
              { icon: '', title: 'Legionella Program Tracking', desc: 'Log and track your Legionella water management program entries. Full audit history for regulatory submissions.' },
              { icon: '', title: 'Chain-of-Custody Forms', desc: 'Generate chain-of-custody forms for lab samples in one click. Print and send with your sample containers — no separate paperwork.' },
              { icon: '', title: 'Tamper-Evident Audit Log', desc: 'Every login, every entry, every change is permanently logged with timestamp, user, and IP. SHA-256 sealed — immutable chain of custody.' },
              { icon: '○○', title: 'Role-Based Access', desc: 'Admin accounts see all facilities and reports. Operator accounts are scoped to their assigned building only. No configuration needed.' },
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

      {/* AI REPORT REVIEW */}
      <section id="reports" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-[#0891B2] uppercase tracking-widest bg-cyan-50 px-4 py-1.5 rounded-full mb-4">Audit-Ready Reporting</div>
            <h2 className="text-3xl font-bold text-gray-900">Every report is reviewed before it reaches you</h2>
            <p className="text-gray-500 mt-3 text-lg max-w-2xl mx-auto">
              Your monthly compliance summaries don't come from a single pass. Each one runs through a three-stage AI review — drafted, independently critiqued against your actual data, then finalized — so the numbers hold up under scrutiny.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F0F9FF] rounded-2xl p-7 border border-blue-100">
              <div className="text-3xl mb-3">✍️</div>
              <div className="text-xs font-bold text-[#0072CE] mb-1">STAGE 1 · DRAFT</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Drafted from your data</h3>
              <p className="text-gray-500 text-sm leading-relaxed">An executive summary is written using only the readings and exceedances on record for the month — no invented numbers.</p>
            </div>
            <div className="bg-[#F0F9FF] rounded-2xl p-7 border border-blue-100">
              <div className="text-3xl mb-3"></div>
              <div className="text-xs font-bold text-[#0072CE] mb-1">STAGE 2 · REVIEW</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Independently critiqued</h3>
              <p className="text-gray-500 text-sm leading-relaxed">A separate reviewer pass verifies every figure against your data, flags anything unsupported, and confirms treatment changes are deferred to your vendor.</p>
            </div>
            <div className="bg-[#F0F9FF] rounded-2xl p-7 border border-blue-100">
              <div className="text-3xl mb-3">✓</div>
              <div className="text-xs font-bold text-[#0072CE] mb-1">STAGE 3 · FINALIZE</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Corrected & finalized</h3>
              <p className="text-gray-500 text-sm leading-relaxed">A final pass folds in every valid correction and produces the clean, professional summary you hand to leadership or an inspector.</p>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-8 max-w-2xl mx-auto">
            The review checks internal consistency and grounding against your logged data. It does not replace professional judgment or your water-treatment vendor's recommendations.
          </p>
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
              { icon: '[SITE]', title: 'Hospitals & Healthcare', desc: 'Meet Joint Commission water management plan requirements. Track Legionella prevention program data automatically. Purpose-built for healthcare facilities.' },
              { icon: '[HOTEL]', title: 'Hotels & Hospitality', desc: 'Keep cooling towers, boilers, and domestic water systems in spec. Protect guests and staff from waterborne pathogens with shift-by-shift documentation.' },
              { icon: '[ORG]', title: 'Commercial Buildings', desc: 'ASHRAE 188 compliance made simple. Document your water treatment program with the same rigor as a major health system — at any scale.' },
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

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6 text-center text-sm">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-3">
          <span className="text-xl">[WATER]</span> FacilityH2O
        </div>
        <p className="text-gray-500 mb-1">Water Chemistry Compliance. Built for Facilities.</p>
        <div className="flex items-center justify-center gap-6 flex-wrap mb-4">
          <Link href="/login" className="hover:text-white transition">Sign In</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <a href="mailto:info@facilityh2o.com" className="hover:text-white transition">info@facilityh2o.com</a>
        </div>
        <p className="text-gray-600">© 2026 FacilityH2O. All rights reserved.</p>
      </footer>
    </div>
  );
}
