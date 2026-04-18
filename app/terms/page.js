import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | AquaLog',
  description: 'AquaLog Terms of Service — effective April 2026',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#164E63] to-[#0891B2] text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link href="/" className="text-cyan-200 hover:text-white text-sm mb-4 inline-block transition">
            ← Back to AquaLog
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💧</span>
            <span className="text-sm font-semibold text-cyan-200 uppercase tracking-widest">AquaLog</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-2">Terms of Service</h1>
          <p className="text-cyan-200 text-sm">
            Effective Date: April 1, 2026 &nbsp;·&nbsp; Last Updated: April 2, 2026
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Quick Nav */}
        <div className="bg-[#F0F9FF] border border-cyan-200 rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#164E63] mb-3 text-sm uppercase tracking-wide">Contents</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-[#0891B2]">
            {[
              [1, 'Acceptance of Terms'],
              [2, 'Description of Service'],
              [3, 'Subscription Plans & Billing'],
              [4, 'Free Trial'],
              [5, 'Cancellation & Refund Policy'],
              [6, 'Data Ownership'],
              [7, 'Acceptable Use'],
              [8, 'Uptime & Service Levels'],
              [9, 'Intellectual Property'],
              [10, 'Limitation of Liability'],
              [11, 'Disclaimer of Warranties'],
              [12, 'Indemnification'],
              [13, 'Governing Law'],
            ].map(([num, title]) => (
              <li key={num}>
                <a href={`#section-${num}`} className="hover:underline">
                  {num}. {title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="prose prose-slate max-w-none">

          <section id="section-1" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using AquaLog ("the Service"), you ("Customer," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you are accepting these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              If you do not agree to these Terms, do not access or use the Service. These Terms constitute a legally binding agreement between you and AquaLog (a pending LLC owned by Antoine Riley).
            </p>
          </section>

          <section id="section-2" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              AquaLog is a cloud-based Software as a Service (SaaS) platform designed for water chemistry compliance tracking in commercial, healthcare, and hospitality environments. The Service enables facilities to log and analyze water chemistry readings, monitor compliance with ASHRAE 188 and The Joint Commission standards, generate alerts for out-of-range values, and produce compliance reports.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
              <p className="text-amber-800 text-sm font-medium">
                ⚠️ The Service is intended for facility infrastructure management only. It is not a clinical system and does not interface with patient care systems or electronic health records.
              </p>
            </div>
          </section>

          <section id="section-3" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">3. Subscription Plans &amp; Billing</h2>
            <div className="overflow-x-auto rounded-xl border border-cyan-100 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#164E63] text-white">
                    <th className="text-left px-4 py-3 font-semibold">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold">Price</th>
                    <th className="text-left px-4 py-3 font-semibold">Highlights</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-cyan-100">
                    <td className="px-4 py-3 font-medium text-gray-900">Starter</td>
                    <td className="px-4 py-3 text-gray-700">$49/month</td>
                    <td className="px-4 py-3 text-gray-600">Up to 3 facilities, 5 users, standard reporting</td>
                  </tr>
                  <tr className="border-t border-cyan-100 bg-[#F0F9FF]">
                    <td className="px-4 py-3 font-medium text-gray-900">Professional</td>
                    <td className="px-4 py-3 text-gray-700">$149/month</td>
                    <td className="px-4 py-3 text-gray-600">Up to 10 facilities, 25 users, email alerts, advanced reporting</td>
                  </tr>
                  <tr className="border-t border-cyan-100">
                    <td className="px-4 py-3 font-medium text-gray-900">Enterprise</td>
                    <td className="px-4 py-3 text-gray-700">$299/month</td>
                    <td className="px-4 py-3 text-gray-600">Unlimited facilities &amp; users, API access, 99% SLA, priority support</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Subscription fees are billed monthly in advance in U.S. dollars. Payment is processed via Stripe. Invoices are delivered electronically to the billing email on file. You are responsible for all applicable taxes.
            </p>
          </section>

          <section id="section-4" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">4. Free Trial</h2>
            <div className="bg-[#F0F9FF] border border-cyan-200 rounded-xl p-5">
              <p className="text-gray-700">
                New customers are eligible for a <strong className="text-[#0891B2]">14-day free trial</strong> of the Professional plan. <strong>No credit card required.</strong> One free trial per organization. Trial accounts are subject to all terms of this Agreement. Upon expiration, select a paid plan to continue; your data is retained for 30 days after trial end.
              </p>
            </div>
          </section>

          <section id="section-5" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">5. Cancellation &amp; Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You may cancel your subscription at any time by providing <strong>30 days' written notice</strong> to{' '}
              <a href="mailto:antoine.riley@facilityh2o.com" className="text-[#0891B2] hover:underline">antoine.riley@facilityh2o.com</a>{' '}
              or via your account settings. Cancellation takes effect at the end of the billing period following the 30-day notice.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              Subscription fees are generally non-refundable. Pro-rata refunds are issued at our discretion in cases of documented service outages exceeding SLA thresholds (Enterprise only), or if we terminate your account due to our own material breach.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon cancellation, you have <strong>30 days</strong> to export your data before permanent deletion.
            </p>
          </section>

          <section id="section-6" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">6. Data Ownership</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>You own your data.</strong> You retain full ownership of all water chemistry data, facility information, readings, reports, and other content you upload or generate through the Service ("Customer Data"). We claim no ownership rights over your data.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using the Service, you grant us a limited license to store, process, and transmit Customer Data solely as necessary to provide the Service. You may export your data at any time in standard formats (CSV, PDF).
            </p>
          </section>

          <section id="section-7" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">7. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Use the Service for any unlawful purpose or in violation of applicable regulations</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Store, transmit, or process Protected Health Information (PHI) as defined under HIPAA</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Resell, sublicense, or transfer access to the Service without prior written consent</li>
              <li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
              <li>Use the Service in a manner that interferes with its integrity or performance</li>
            </ul>
          </section>

          <section id="section-8" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">8. Uptime &amp; Service Levels</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We target best-effort availability for Starter and Professional plans. Enterprise plan customers are entitled to a <strong className="text-[#0891B2]">99% monthly uptime guarantee</strong>.
            </p>
            <div className="overflow-x-auto rounded-xl border border-cyan-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#164E63] text-white">
                    <th className="text-left px-4 py-3">Monthly Uptime</th>
                    <th className="text-left px-4 py-3">Service Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-cyan-100"><td className="px-4 py-3 text-gray-700">98–98.99%</td><td className="px-4 py-3 text-gray-700">5% of monthly fee</td></tr>
                  <tr className="border-t border-cyan-100 bg-[#F0F9FF]"><td className="px-4 py-3 text-gray-700">95–97.99%</td><td className="px-4 py-3 text-gray-700">10% of monthly fee</td></tr>
                  <tr className="border-t border-cyan-100"><td className="px-4 py-3 text-gray-700">Below 95%</td><td className="px-4 py-3 text-gray-700">25% of monthly fee</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 text-xs mt-2">SLA credits must be requested within 30 days of the incident. Excludes scheduled maintenance.</p>
          </section>

          <section id="section-9" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">9. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All software, algorithms, designs, trademarks, and content comprising the Service (excluding Customer Data) are the exclusive intellectual property of Antoine Riley / AquaLog. Nothing in these Terms transfers any ownership of our intellectual property to you. "AquaLog" and associated logos are trademarks of Antoine Riley.
            </p>
          </section>

          <section id="section-10" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">10. Limitation of Liability</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-gray-700 text-sm leading-relaxed uppercase font-medium">
                To the maximum extent permitted by law, AquaLog shall not be liable for indirect, incidental, special, consequential, or punitive damages. Our total aggregate liability for any claims shall not exceed the greater of the fees paid by you in the three months preceding the claim or $500.
              </p>
            </div>
          </section>

          <section id="section-11" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">11. Disclaimer of Warranties</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-gray-700 text-sm leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED. WATER CHEMISTRY COMPLIANCE IS THE CUSTOMER'S RESPONSIBILITY — THE SERVICE IS A TOOL TO ASSIST, NOT A SUBSTITUTE FOR PROFESSIONAL JUDGMENT.
              </p>
            </div>
          </section>

          <section id="section-12" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">12. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless AquaLog and its owner from claims, damages, and expenses (including reasonable attorneys' fees) arising from your use of the Service in violation of these Terms, your violation of applicable laws, or any claim that your Customer Data infringes third-party rights.
            </p>
          </section>

          <section id="section-13" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">13. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of the <strong>State of Maryland</strong>, without regard to conflict-of-law principles. Disputes shall be resolved in state or federal courts in Maryland.
            </p>
          </section>

        </div>

        {/* Contact box */}
        <div className="mt-12 bg-gradient-to-r from-[#164E63] to-[#0891B2] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Questions about these Terms?</h3>
          <p className="text-cyan-100 mb-4">We're happy to clarify anything before you sign up.</p>
          <a
            href="mailto:antoine.riley@facilityh2o.com"
            className="bg-white text-[#0891B2] font-bold px-6 py-3 rounded-xl hover:bg-cyan-50 transition inline-block"
          >
            Contact Us
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm">
        <div className="text-white font-bold text-lg mb-2">💧 AquaLog</div>
        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span className="text-gray-600">·</span>
          <Link href="/terms" className="hover:text-white transition text-white">Terms of Service</Link>
          <span className="text-gray-600">·</span>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
        </div>
        <p className="mt-4 text-gray-500">© 2026 Antoine Riley. AquaLog™. All rights reserved.</p>
      </footer>
    </div>
  );
}
