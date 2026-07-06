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
            <a href="#security" className="hover:text-[#0072CE] transition">Security</a>
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
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-[#0072CE] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full mb-4">Features</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything You Need, Nothing You Don't.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              FacilityH2O has every feature healthcare facilities need to implement a water management program while staying lean and focused.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '[FORM]', title: 'Shift-Based Logging', desc: 'Easy data entry templates for each shift, area, and test type — organized by round.' },
              { icon: '[BELL]', title: 'Real-Time Alerts', desc: 'Instant notifications when a reading is out of spec, right on your phone. No more spreadsheets to babysit.' },
              { icon: '[CHART]', title: 'Trend Analysis', desc: 'Visualize your chemistry data over time to spot issues early and optimize your program.' },
              { icon: '[CLOCK]', title: 'Automatic Retention', desc: 'Set your data retention policy and FacilityH2O enforces it — readings auto-purge on schedule, audit-ready.' },
              { icon: '[LOCK]', title: 'Audit-Ready Security', desc: 'Tamper-evident record sealing, least-privilege access, and a complete chain of custody for every data point.' },
              { icon: '[GRAPH]', title: 'AI-Assisted Insights', desc: 'Predictive alerts, intelligent diagnostics, and compliance forecasts — your data, made smarter.' },
            ].map(f => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
                <div className="text-3xl text-[#0072CE] mb-4">{f.icon}</div>
                <h3 className="text-xl text-gray-900 font-bold mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>  
            ))}
          </div>
        </div>
      </section>

      {/* REPORTS */}
      <section id="reports" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-[#0072CE] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full mb-4">Reports</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">All Your Compliance Docs, Auto-Generated</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Stop spending hours formatting compliance reports. FacilityH2O creates them for you, always inspection-ready.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-[#0072CE] text-white w-16 h-16 flex items-center justify-center text-3xl mb-6">
                [DOC]  
              </div>
              <h3 className="text-2xl text-gray-900 font-bold mb-4">ASHRAE 188 Report</h3>
              <p className="text-gray-500 text-base mx-auto max-w-sm">
                Covers every element ASHRAE requires for your water management program documentation.  
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-[#0072CE] text-white w-16 h-16 flex items-center justify-center text-3xl mb-6">
                [DOC]
              </div>
              <h3 className="text-2xl text-gray-900 font-bold mb-4">Legionella Compliance</h3>
              <p className="text-gray-500 text-base mx-auto max-w-sm">
                Automatically assembles your Legionella control data into a survey-ready package.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-[#0072CE] text-white w-16 h-16 flex items-center justify-center text-3xl mb-6">
                [DOC]  
              </div>
              <h3 className="text-2xl text-gray-900 font-bold mb-4">CMS 1135 Waivers</h3>
              <p className="text-gray-500 text-base mx-auto max-w-sm">
                Creates the documentation CMS requires when you need to request a 1135 waiver.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
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
              { badge: 'CMS', title: 'CMS QSO17-30', desc: 'Centers for Medicare & Medicaid Services water management program requirements. Stay compliant and reimbursable — one missed requirement shouldn't cost you CMS status.' },
              { badge: 'DOH', title: 'State DOH Requirements', desc: 'Department of Health water quality and Legionella regulations vary by state. Our flexible logging system captures what your state requires with customizable parameters.' },
              { badge: '+', title: 'Always Up To Date', desc: 'Regulations change. We track them so you don't have to. When standards update, FacilityH2O updates — your workflow stays the same, your compliance stays current.' },
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

      {/* SECURITY & DATA INTEGRITY */}
      <section id="security" className="py-24 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-emerald-300 uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full mb-4">Security &amp; Data Integrity</div>
            <h2 className="text-3xl font-bold mb-3">Records a Surveyor Can Trust.</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Compliance data is only as good as its integrity. FacilityH2O treats every reading like evidence — because during a survey, it is.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '[SEAL]', title: 'Tamper-Evident Records', desc: 'Every reading is cryptographically sealed with a SHA-256 integrity hash the moment it\'s logged. If a value is altered after the fact, the seal breaks and the system flags it. Your logs prove they haven\'t been touched.' },
              { icon: '[ROLE]', title: 'Least-Privilege Access', desc: 'Operators see their facility — nothing else. Scoped admins manage their sites without visibility into credentials. Access follows the job, not the org chart.' },
              { icon: '[RETAIN]', title: 'Retention Discipline', desc: 'A built-in retention policy keeps records for the full survey window automatically — no manual housekeeping, no accidental gaps in your compliance history.' },
              { icon: '[DOMAIN]', title: 'Your Brand, Your Domain', desc: 'Client organizations run on their own assigned domain — their name, their bookmark, their portal — while the platform stays independent. Clean separation between your program and the software behind it.' },
              { icon: '[LEAN]', title: 'Lean Attack Surface', desc: 'No SMS brokers, no ad trackers, no data resellers. Alerts flow through a single vetted email provider. Fewer third parties touching your data means fewer places it can leak.' },
              { icon: '[AUDIT]', title: 'Audit-Ready by Default', desc: 'Corrective actions, shift records, and integrity checks live in one exportable trail. When TJC asks, the answer is a report — not a scramble.' },
            ].map(s => (
              <div key={s.title} className="bg-white/5 border border-white/10 rounded-2xl p-7">
                <div className="inline-block bg-emerald-400/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-4">{s.icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT
