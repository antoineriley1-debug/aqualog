import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | FacilityH2O',
  description: 'FacilityH2O Terms of Service — effective April 2026',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#164E63] to-[#0891B2] text-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link href="/" className="text-cyan-200 hover:text-white text-sm mb-4 inline-block transition">
            ← Back to FacilityH2O
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">[WATER]</span>
            <span className="text-sm font-semibold text-cyan-200 uppercase tracking-widest">FacilityH2O</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-2">Terms of Service</h1>
          <p className="text-cyan-200 text-sm">
            Effective Date: April 1, 2026 &nbsp;·&nbsp; Last Updated: April 2, 2026
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">

        <div className="bg-[#F0F9FF] border border-cyan-200 rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#164E63] mb-3 text-sm uppercase tracking-wide">Contents</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-[#0891B2]">
            {[
              [1, 'Acceptance of Terms'],
              [2, 'Description of Service'],
              [3, 'Data Ownership'],
              [4, 'Acceptable Use'],
              [5, 'Intellectual Property'],
              [6, 'Limitation of Liability'],
              [7, 'Disclaimer of Warranties'],
              [8, 'Indemnification'],
              [9, 'Governing Law'],
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
              By accessing or using FacilityH2O ("the Service"), you ("Customer," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not access or use the Service.
            </p>
          </section>

          <section id="section-2" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              FacilityH2O is a cloud-based Software as a Service (SaaS) platform designed for water chemistry compliance tracking in commercial, healthcare, and hospitality environments. The Service enables facilities to log and analyze water chemistry readings, monitor compliance with ASHRAE 188 and The Joint Commission standards, generate alerts for out-of-range values, and produce compliance reports.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
              <p className="text-amber-800 text-sm font-medium">
                !️ The Service is intended for facility infrastructure management only. It is not a clinical system and does not interface with patient care systems or electronic health records.
              </p>
            </div>
          </section>

          <section id="section-3" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">3. Data Ownership</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>You own your data.</strong> You retain full ownership of all water chemistry data, facility information, readings, reports, and other content you upload or generate through the Service ("Customer Data"). We claim no ownership rights over your data.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using the Service, you grant us a limited license to store, process, and transmit Customer Data solely as necessary to provide the Service. You may export your data at any time in standard formats (CSV, PDF).
            </p>
          </section>

          <section id="section-4" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Use the Service for any unlawful purpose or in violation of applicable regulations</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Resell, sublicense, or transfer access to the Service without prior written consent</li>
              <li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
            </ul>
          </section>

          <section id="section-5" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All software, algorithms, designs, trademarks, and content comprising the Service (excluding Customer Data) are the exclusive intellectual property of FacilityH2O. Nothing in these Terms transfers any ownership of our intellectual property to you.
            </p>
          </section>

          <section id="section-6" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">6. Limitation of Liability</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-gray-700 text-sm leading-relaxed uppercase font-medium">
                To the maximum extent permitted by law, FacilityH2O shall not be liable for indirect, incidental, special, consequential, or punitive damages.
              </p>
            </div>
          </section>

          <section id="section-7" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">7. Disclaimer of Warranties</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-gray-700 text-sm leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WATER CHEMISTRY COMPLIANCE IS THE CUSTOMER'S RESPONSIBILITY — THE SERVICE IS A TOOL TO ASSIST, NOT A SUBSTITUTE FOR PROFESSIONAL JUDGMENT.
              </p>
            </div>
          </section>

          <section id="section-8" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">8. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless FacilityH2O from claims arising from your use of the Service in violation of these Terms or applicable laws.
            </p>
          </section>

          <section id="section-9" className="mb-10">
            <h2 className="text-2xl font-bold text-[#164E63] mb-4 pb-2 border-b border-cyan-100">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of the <strong>State of Maryland</strong>.
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
        <div className="text-white font-bold text-lg mb-2">[WATER] FacilityH2O</div>
        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span className="text-gray-600">·</span>
          <Link href="/terms" className="hover:text-white transition text-white">Terms of Service</Link>
          <span className="text-gray-600">·</span>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
        </div>
        <p className="mt-4 text-gray-500">© 2026 FacilityH2O. All rights reserved.</p>
      </footer>
    </div>
  );
}
