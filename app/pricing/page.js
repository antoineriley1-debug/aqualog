'use client';
/**
 * FacilityH2O — Pricing & Plans (public)
 * Three tiers, monthly + annual (1-year commitment) columns, and a full feature-comparison table.
 * PRICES ARE INTENTIONALLY BLANK — fill the PRICES object below when ready.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// ─── FILL THESE IN WHEN READY. Leave '' to show "Contact us". ───
const PRICES = {
  starter:      { monthly: '', annual: '' },   // e.g. monthly:'$149', annual:'$1,490'
  professional: { monthly: '', annual: '' },
  enterprise:   { monthly: '', annual: '' },
};

const TIERS = [
  { key:'starter', name:'Starter', blurb:'For a single facility getting compliant.', highlight:false,
    bullets:['1 facility','Up to 5 users','Boiler & chilled logging','PDF compliance reports','Email alerts'] },
  { key:'professional', name:'Professional', blurb:'For growing multi-site operations.', highlight:true,
    bullets:['Up to 10 facilities','Up to 25 users','Everything in Starter','AI Chemistry Advisor','Falsification detection','ST108 + Legionella modules'] },
  { key:'enterprise', name:'Enterprise', blurb:'For health systems and large portfolios.', highlight:false,
    bullets:['Unlimited facilities','Unlimited users','Everything in Professional','Specialized equipment library','Council-reviewed reports','API access','Priority support & onboarding'] },
];

const FEATURE_MATRIX = [
  { group:'Logging & Monitoring', rows:[
    ['Shift-based boiler & chilled logging', true, true, true],
    ['Live system health gauges & trends', true, true, true],
    ['Out-of-range & missed-reading alerts', true, true, true],
    ['Multi-facility dashboard', '1 site', 'Up to 10', 'Unlimited'],
    ['Specialized equipment library (sterilizers, dialysis water, RO/DI, Legionella temps & more)', false, false, true],
  ]},
  { group:'Compliance', rows:[
    ['PDF compliance reports', true, true, true],
    ['ANSI/AAMI ST108 module', false, true, true],
    ['Legionella / Water Management Program', false, true, true],
    ['Chain-of-custody forms', false, true, true],
    ['Tamper-evident audit log', true, true, true],
  ]},
  { group:'Intelligence', rows:[
    ['AI Chemistry Advisor', false, true, true],
    ['Falsification detection', false, true, true],
    ['Council-reviewed AI reports', false, false, true],
  ]},
  { group:'Platform', rows:[
    ['Role-based access', true, true, true],
    ['Custom branding', false, true, true],
    ['API access', false, false, true],
    ['Priority support & onboarding', false, false, true],
  ]},
];

function Cell({ v }) {
  if (v === true)  return <span className="text-green-600 font-bold">✓</span>;
  if (v === false) return <span className="text-gray-300">—</span>;
  return <span className="text-gray-700 text-xs font-semibold">{v}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setLoggedIn(document.cookie.split(';').some(c => c.trim().startsWith('FacilityH2O_user=')));
    }
  }, []);
  const priceFor = (k) => {
    const p = PRICES[k]?.[annual ? 'annual' : 'monthly'];
    return p && p.trim() ? p : null;
  };

  return (
    <div className="min-h-screen bg-white">
      {loggedIn && (
        <div className="sticky top-0 z-50 bg-[#003366] text-white px-4 py-2.5 flex items-center justify-between text-sm shadow">
          <a href="/dashboard" className="inline-flex items-center gap-2 font-semibold hover:text-blue-200 transition">← Back to FacilityH2O app</a>
          <a href="/dashboard" className="text-blue-200 hover:text-white text-xs">You're viewing the public pricing page</a>
        </div>
      )}
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#003366] to-[#0072CE] text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold">Simple pricing. Serious compliance.</h1>
        <p className="text-blue-100 text-lg mt-4 max-w-2xl mx-auto">Every plan is billed annually on a one-year commitment. Pick the tier that fits your facilities — upgrade anytime as you grow.</p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-white/10 rounded-full p-1.5 mt-8">
          <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${!annual ? 'bg-white text-[#003366]' : 'text-blue-100'}`}>Monthly</button>
          <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-full text-sm font-semibold transition ${annual ? 'bg-white text-[#003366]' : 'text-blue-100'}`}>Annual <span className="text-xs opacity-80">(1-yr)</span></button>
        </div>
      </section>

      {/* TIER CARDS */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 pb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map(t => {
          const price = priceFor(t.key);
          return (
            <div key={t.key} className={`bg-white rounded-2xl border p-7 flex flex-col ${t.highlight ? 'border-[#0891B2] shadow-xl ring-2 ring-[#0891B2]/20 relative' : 'border-gray-200 shadow-md'}`}>
              {t.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0891B2] text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>}
              <h3 className="text-xl font-bold text-gray-900">{t.name}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-5 min-h-[40px]">{t.blurb}</p>
              <div className="mb-5">
                {price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{price}</span>
                    <span className="text-gray-400 text-sm">/{annual ? 'year' : 'month'}</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-[#0891B2]">Contact us</div>
                )}
                {annual && <div className="text-xs text-gray-400 mt-1">Billed annually · 1-year commitment</div>}
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {t.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-600 font-bold mt-0.5">✓</span>{b}</li>
                ))}
              </ul>
              <Link href="/signup" className={`text-center font-semibold py-3 rounded-xl text-sm transition ${t.highlight ? 'bg-[#0891B2] text-white hover:bg-[#0E7490]' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                Start 14-Day Trial →
              </Link>
            </div>
          );
        })}
      </section>

      {/* FEATURE COMPARISON TABLE */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Compare every feature</h2>
        <p className="text-gray-500 text-center mb-10">Exactly what's included in each plan.</p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="px-4 py-4 text-left font-semibold">Feature</th>
                <th className="px-4 py-4 font-semibold text-center">Starter</th>
                <th className="px-4 py-4 font-semibold text-center bg-[#0891B2]">Professional</th>
                <th className="px-4 py-4 font-semibold text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map(section => (
                <>
                  <tr key={section.group} className="bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 font-bold text-gray-700 text-xs uppercase tracking-wide">{section.group}</td>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr key={section.group + i} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-700">{row[0]}</td>
                      <td className="px-4 py-3 text-center"><Cell v={row[1]} /></td>
                      <td className="px-4 py-3 text-center bg-[#0891B2]/5"><Cell v={row[2]} /></td>
                      <td className="px-4 py-3 text-center"><Cell v={row[3]} /></td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Ready to get compliant?</h2>
        <p className="text-gray-500 mt-2 mb-6">Start a 14-day trial. No credit card required.</p>
        <Link href="/signup" className="inline-block bg-[#0891B2] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#0E7490] transition">Start Free Trial →</Link>
      </section>
    </div>
  );
}
