'use client';
/**
 * FacilityH2O — Help & Guide
 * Plain-language how-to for every part of the portal. Static content,
 * grouped by who needs it. Update sections here as features change.
 */
import Sidebar from '@/components/Sidebar';
import { BRAND } from '@/lib/branding';

const GROUPS = [
  {
    heading: 'For everyone',
    items: [
      { icon: '+', q: 'How do I log a reading?',
        steps: [
          'Tap New Entry in the sidebar.',
          'Choose the facility, the shift (1st / 2nd / 3rd), and the system you are logging — boiler, chilled water, cooling tower, condensate, or softener.',
          'Enter each chemistry value and tap Save.',
          'If any value falls outside its limits, an out-of-range alert is raised automatically. You do not need to do anything extra.',
        ] },
      { icon: '≡', q: 'How do I see past readings?',
        steps: [
          'Open History to see logged readings.',
          'Filter by facility, system, or date to narrow the list.',
          'Open Trends to see the same data as charts over time.',
        ] },
      { icon: '', q: 'What is the Chemistry Advisor?',
        steps: [
          'The Advisor reviews a reading and explains what it means in plain language.',
          'Use it when a value looks off and you want guidance on likely cause and corrective action.',
        ] },
    ],
  },
  {
    heading: 'For administrators',
    items: [
      { icon: '', q: 'How do alerts work, and how do I clear them?',
        steps: [
          'Open Alerts. Two kinds appear: out-of-range (a reading outside its limits) and missed-shift (a required reading was not logged).',
          'Tap Acknowledge on an alert once it has been handled. It is recorded and removed from the unacknowledged list.',
          'The red number on the Alerts menu item is the count still waiting to be acknowledged.',
        ] },
      { icon: '', q: 'How do I run a report?',
        steps: [
          'Open Reports and choose the facility and date range.',
          'A compliance summary is produced that you can save or print as a PDF.',
          'End-of-day and weekly summaries are also sent automatically by email when enabled.',
        ] },
      { icon: '️', q: 'Shift schedules, equipment, and alert rules',
        steps: [
          'Shift Schedules sets which shifts each facility runs, so missed-shift alerts fire at the right times.',
          'Facility Equipment controls which systems each facility tracks.',
          'Alert Rules and Notification Settings control who is emailed and when.',
        ] },
      { icon: '[WATER]', q: 'ST108, Legionella, and Chain of Custody',
        steps: [
          'These are specialized regulatory logs, each with its own menu item.',
          'ST108 has its own log, report, and self-audit views.',
          'Legionella / WMP and Chain of Custody work the same way: open, enter, save.',
        ] },
    ],
  },
  {
    heading: 'For the account owner',
    items: [
      { icon: '[ORG]', q: 'How do I manage client accounts?',
        steps: [
          'Open Accounts. Each client is one row showing its tier, status, and asset cap.',
          'Use the tier dropdown to upgrade or downgrade. This also resets that client to the features defined for the new tier.',
          'Suspend / Reactivate turns service for a client off or on instantly.',
          'Reset PW sends a password reset to the contact login for that client.',
          'Audit expands a per-account trail of everything that has happened on that account.',
        ] },
      { icon: '≡️', q: 'What do the tiers mean?',
        steps: [
          'A tier sets how many equipment units (boilers, softeners, chillers, and so on) a client can track.',
          'Tier 1 allows 3 units, Tier 2 allows 10, and Tier 3 is unlimited.',
          'To change a cap, adjust the features for a tier, or add prices later, edit lib/tiers.js. It is the single source of truth.',
        ] },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Help &amp; Guide</h1>
            <p className="text-sm text-gray-500">How to use {BRAND.name}. Tap any question to expand it.</p>
          </div>

          {GROUPS.map((group) => (
            <div key={group.heading} className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{group.heading}</h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <details key={item.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                    <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50">
                      <span className="flex items-center gap-3 font-semibold text-gray-900">
                        <span className="text-lg">{item.icon}</span>{item.q}
                      </span>
                      <span className="text-gray-300 group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="px-5 pb-5 pt-1">
                      <ol className="list-decimal ml-5 space-y-1.5 text-sm text-gray-600">
                        {item.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl bg-[#003366] text-white px-6 py-5 mt-2">
            <div className="font-bold mb-1">Still stuck?</div>
            <div className="text-sm text-blue-100">
              Email <a href={`mailto:${BRAND.fromEmail}`} className="underline">{BRAND.fromEmail}</a> and we will help you out.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
