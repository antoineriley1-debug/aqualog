import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | FacilityH2O',
  description: 'FacilityH2O Privacy Policy — effective April 2026',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#164E63] to-[#0891B2] text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link href="/" className="text-cyan-200 hover:text-white text-sm mb-4 inline-block transition">
            ← Back to FacilityH2O
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💧</span>
            <span className="text-sm font-semibold text-cyan-200 uppercase tracking-widest">FacilityH2O</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-2">Privacy Policy</h1>
          <p className="text-cyan-200 text-sm">
            Effective Date: April 1, 2026 &nbsp;·&nbsp; Last Updated: April 2, 2026
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Healthcare disclaimer banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-10 flex gap-3">
          <span className="text-2xl flex-shrink-0">🏥</span>
          <div>
            <p className="font-bold text-blue-900 mb-1">Healthcare Notice</p>
            <p className="text-blue-800 text-sm leading-relaxed">
              FacilityH2O is a water chemistry compliance platform used in facility management — <strong>not a clinical system</strong>. We do not collect, store, or process Protected Health Information (PHI) as defined under HIPAA. We are not a HIPAA Covered Entity. Healthcare customers requiring a Business Associate Agreement (BAA) may request our template BAA as a courtesy.
            </p>
          </div>
        </div>

        {/* Contents */}
        <div className="bg-[#F0F9FF] border border-cyan-200 rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#164E63] mb-3 text-sm uppercase tracking-wide">Contents</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-[#0891B2]">
            {[
              [1, 'Information We Collect'],
              [2, 'What We Do NOT Collect'],
              [3, 'How We Use Your Information'],
              [4, 'Data Retention'],
              [5, 'Third-Party Providers'],
              [6, 'Your Rights'],
              [7, 'Security Measures'],
              [8, 'Data Breach Notification'],
              [9, 'Cookies & Tracking'],
              [10, 'Contact'],
            ].map(([num, title]) => (
              <li key={num}>
                <a href={`#priv-${num}`} className="hover:underline">
                  {num}. {title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-12">

          <section id="priv-1">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">1. Information We Collect</h2>

            <div className="space-y-6">
              {[
                {
                  title: '1.1 Water Chemistry Data',
                  content: 'Chemistry readings (pH, chlorine, temperature, conductivity, biological test results, etc.), test locations and equipment identifiers, timestamps, compliance notes, and corrective actions. This data relates to building infrastructure and water systems — not patients or clinical subjects.',
                },
                {
                  title: '1.2 User Account Information',
                  content: 'Full name, work email address, job title, organization/facility name, and password (hashed — we never store plaintext passwords).',
                },
                {
                  title: '1.3 Facility & Organization Information',
                  content: 'Facility name, address, type (hospital, hotel, commercial building), building system descriptions, and organizational structure.',
                },
                {
                  title: '1.4 Billing Information',
                  content: 'Billing contact name and email, subscription plan and payment history. Full credit card numbers are handled exclusively by Stripe — we never store raw payment card data.',
                },
                {
                  title: '1.5 Usage & Technical Data',
                  content: 'IP addresses, browser/device type, pages visited and features used, error logs, performance diagnostics, and session duration.',
                },
              ].map(({ title, content }) => (
                <div key={title} className="bg-[#F0F9FF] rounded-xl p-5 border border-cyan-100">
                  <h3 className="font-bold text-[#164E63] mb-2 text-sm">{title}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{content}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="priv-2">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">2. What We Do NOT Collect</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-green-800 font-medium text-sm mb-3">We explicitly do not collect or store:</p>
              <ul className="space-y-2 text-sm text-green-800">
                {[
                  'Patient names, dates of birth, or any patient identifiers',
                  'Medical records or clinical data of any kind',
                  'Protected Health Information (PHI) as defined by HIPAA',
                  'Social Security Numbers or government-issued ID numbers',
                  'Personal financial data beyond billing contact information',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-green-700 text-xs mt-4">
                If you believe PHI has been accidentally entered into FacilityH2O, contact us immediately at{' '}
                <a href="mailto:antoine.riley@facilityh2o.com" className="underline">antoine.riley@facilityh2o.com</a> for removal assistance.
              </p>
            </div>
          </section>

          <section id="priv-3">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">3. How We Use Your Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '📊', title: 'Service Delivery', desc: 'Process and store readings, generate dashboards and reports.' },
                { icon: '🔔', title: 'Alerts', desc: 'Send automated email alerts when readings fall outside configured thresholds.' },
                { icon: '📈', title: 'Trend Analysis', desc: 'Generate historical trends and predictive insights about your water systems.' },
                { icon: '👤', title: 'Account Management', desc: 'Authenticate users, manage permissions, and maintain records.' },
                { icon: '💳', title: 'Billing', desc: 'Process subscription payments and send invoices via Stripe and Resend.' },
                { icon: '🔧', title: 'Support', desc: 'Diagnose issues and respond to support requests.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3 bg-[#F0F9FF] rounded-xl p-4 border border-cyan-100">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-[#164E63] text-sm mb-1">{title}</p>
                    <p className="text-gray-600 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-4">
              We do <strong>not</strong> sell your data to third parties or use your chemistry data for advertising purposes.
            </p>
          </section>

          <section id="priv-4">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">4. Data Retention</h2>
            <div className="overflow-x-auto rounded-xl border border-cyan-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#164E63] text-white">
                    <th className="text-left px-4 py-3 font-semibold">Data Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Chemistry readings & operational data', '2 years minimum (ASHRAE 188 / TJC standard)'],
                    ['User account data', 'Active subscription + 30 days post-cancellation'],
                    ['Billing records', '7 years (tax/financial regulation)'],
                    ['Usage/security logs', '90 days'],
                  ].map(([type, period], i) => (
                    <tr key={type} className={`border-t border-cyan-100 ${i % 2 === 1 ? 'bg-[#F0F9FF]' : ''}`}>
                      <td className="px-4 py-3 text-gray-700">{type}</td>
                      <td className="px-4 py-3 text-gray-600">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="priv-5">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">5. Third-Party Providers</h2>
            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              We share data only with these trusted providers as necessary to operate the Service. Each is bound by data processing agreements.
            </p>
            <div className="overflow-x-auto rounded-xl border border-cyan-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#164E63] text-white">
                    <th className="text-left px-4 py-3 font-semibold">Provider</th>
                    <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Stripe', 'Payment processing', 'Billing contact, payment tokens'],
                    ['Resend', 'Transactional email', 'Email addresses, alert content'],
                    ['Supabase', 'Database & storage', 'All Customer Data (encrypted at rest)'],
                    ['Render', 'Cloud hosting', 'Customer Data in transit/at rest'],
                  ].map(([provider, purpose, data], i) => (
                    <tr key={provider} className={`border-t border-cyan-100 ${i % 2 === 1 ? 'bg-[#F0F9FF]' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{provider}</td>
                      <td className="px-4 py-3 text-gray-700">{purpose}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="priv-6">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">6. Your Rights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { right: 'Access', desc: 'Request a copy of personal data we hold about you.' },
                { right: 'Correction', desc: 'Request correction of inaccurate or incomplete data.' },
                { right: 'Deletion', desc: 'Request deletion subject to legal retention requirements.' },
                { right: 'Portability', desc: 'Export data in CSV format at any time via the app.' },
                { right: 'Objection', desc: 'Object to certain processing or request restriction.' },
                { right: 'Withdraw Consent', desc: 'Where processing is consent-based, withdraw at any time.' },
              ].map(({ right, desc }) => (
                <div key={right} className="bg-[#F0F9FF] rounded-xl p-4 border border-cyan-100">
                  <p className="font-bold text-[#0891B2] text-sm mb-1">{right}</p>
                  <p className="text-gray-600 text-xs">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-sm mt-4">
              To exercise these rights, contact{' '}
              <a href="mailto:antoine.riley@facilityh2o.com" className="text-[#0891B2] hover:underline">
                antoine.riley@facilityh2o.com
              </a>. We respond within 30 days.
            </p>
          </section>

          <section id="priv-7">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">7. Security Measures</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['🔒', 'TLS 1.2+ encryption for all data in transit'],
                ['🗄️', 'AES-256 encryption for data at rest (Supabase)'],
                ['👥', 'Role-based access controls limiting internal access'],
                ['🔑', 'Passwords hashed with bcrypt before storage'],
                ['🛡️', 'MFA available and recommended for all accounts'],
                ['🔍', 'Regular security assessments and patching'],
              ].map(([icon, text]) => (
                <div key={text} className="flex gap-3 items-start bg-[#F0F9FF] rounded-xl p-4 border border-cyan-100">
                  <span className="text-lg">{icon}</span>
                  <span className="text-gray-700 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="priv-8">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">8. Data Breach Notification</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              In the event of a confirmed data breach, we will notify affected customers within <strong>72 hours</strong> of discovery (where feasible), describing the breach, data affected, and remediation steps. Notifications will be sent to the primary account email on file.
            </p>
          </section>

          <section id="priv-9">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">9. Cookies &amp; Tracking</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              We use <strong>session cookies</strong> (required for authentication, deleted on browser close) and <strong>preference cookies</strong> (remember display settings). We do not use third-party advertising cookies, cross-site tracking, or Google Analytics on the core application.
            </p>
          </section>

          <section id="priv-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">10. Contact</h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-2">
              For privacy questions, data requests, BAA inquiries, or concerns:
            </p>
            <div className="bg-[#F0F9FF] border border-cyan-200 rounded-xl p-5">
              <p className="font-bold text-[#164E63]">FacilityH2O / Antoine Riley</p>
              <p className="text-gray-600 text-sm mt-1">
                Email:{' '}
                <a href="mailto:antoine.riley@facilityh2o.com" className="text-[#0891B2] hover:underline">
                  antoine.riley@facilityh2o.com
                </a>
              </p>
              <p className="text-gray-600 text-sm">
                Website:{' '}
                <a href="https://facilityh2o.com" className="text-[#0891B2] hover:underline">
                  facilityh2o.com
                </a>
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm">
        <div className="text-white font-bold text-lg mb-2">💧 FacilityH2O</div>
        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span className="text-gray-600">·</span>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <span className="text-gray-600">·</span>
          <Link href="/privacy" className="hover:text-white transition text-white">Privacy Policy</Link>
        </div>
        <p className="mt-4 text-gray-500">© 2026 Antoine Riley. FacilityH2O™. All rights reserved.</p>
      </footer>
    </div>
  );
}
