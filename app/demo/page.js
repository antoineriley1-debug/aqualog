'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function DemoPage() {
  const [videoStarted, setVideoStarted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const demoVideoUrl = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  const demoVideoTitle = 'MedStar H2O Platform — Complete Overview';

  return (
    <div className="min-h-screen bg-[#F0F9FF]">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/" className="text-[#0891B2] hover:underline text-sm font-medium">
            ← Back to home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            See MedStar H2O in Action
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Watch a complete walkthrough of the MedStar H2O platform, including dashboard features, 
            compliance reporting, alerts, and the Chemistry Advisor AI system.
          </p>
        </div>

        {/* Video Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg mb-12 overflow-hidden">
          <div className="aspect-video bg-black flex items-center justify-center relative">
            {!videoStarted ? (
              <>
                <iframe
                  width="100%"
                  height="100%"
                  src={demoVideoUrl}
                  title={demoVideoTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setVideoStarted(true)}
                  className="w-full h-full"
                ></iframe>
              </>
            ) : (
              <iframe
                width="100%"
                height="100%"
                src={demoVideoUrl}
                title={demoVideoTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            )}
          </div>
        </div>

        {/* Demo Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-[#0891B2] text-xl mr-2">📊</span>
              Dashboard Overview
            </h3>
            <p className="text-gray-600 text-sm">
              Tour of the hospital-single dashboard showing real-time water chemistry monitoring, 
              system status, and quick-access controls.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-[#0891B2] text-xl mr-2">⚠️</span>
              Alerts & Notifications
            </h3>
            <p className="text-gray-600 text-sm">
              See how out-of-range readings trigger immediate alerts and notifications to keep 
              operations teams informed in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-[#0891B2] text-xl mr-2">🤖</span>
              Chemistry Advisor AI
            </h3>
            <p className="text-gray-600 text-sm">
              Learn how the AI-powered Chemistry Advisor provides real-time recommendations 
              for corrective actions based on water chemistry data.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-[#0891B2] text-xl mr-2">📄</span>
              Compliance Reports
            </h3>
            <p className="text-gray-600 text-sm">
              See how reports are generated with full compliance information, audit trails, 
              and confidentiality markings for regulatory requirements.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-[#0891B2] text-xl mr-2">📋</span>
              ST108 & Legionella Tracking
            </h3>
            <p className="text-gray-600 text-sm">
              Explore dedicated modules for ST108 water chemistry compliance and Legionella 
              risk monitoring with automated checkpoints.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-[#0891B2] text-xl mr-2">🏥</span>
              Account Management
            </h3>
            <p className="text-gray-600 text-sm">
              Manage hospitals, operators, billing, and account settings with role-based 
              access control and detailed audit logs.
            </p>
          </div>
        </div>

        {/* Why Water Chemistry Compliance Matters */}
        <div className="bg-[#E0F7FA] border border-[#0891B2] rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Why Water Chemistry Compliance Matters
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                <span className="text-[#0891B2] text-2xl mr-2">⚖️</span>
                Regulatory Compliance
              </h3>
              <p className="text-gray-700 text-sm">
                Meet ANSI/ASHE A788 and CDC/State regulations for water chemistry monitoring. 
                Avoid penalties and ensure license protection.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                <span className="text-[#0891B2] text-2xl mr-2">🛡️</span>
                Patient Safety
              </h3>
              <p className="text-gray-700 text-sm">
                Prevent Legionella, waterborne pathogens, and contamination. Protect patients 
                and staff from serious health risks.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                <span className="text-[#0891B2] text-2xl mr-2">📋</span>
                Liability Protection
              </h3>
              <p className="text-gray-700 text-sm">
                Maintain complete audit trails and compliance documentation. Defend against 
                litigation and regulatory inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Tiers Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Starter</h3>
              <p className="text-gray-600 text-sm mb-4">Perfect for small facilities</p>
              <p className="text-2xl font-bold text-[#0891B2] mb-4">$499<span className="text-sm text-gray-600">/mo</span></p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ 1 hospital</li>
                <li>✓ ST108 tracking</li>
                <li>✓ Alerts & notifications</li>
                <li>✓ Audit trails</li>
              </ul>
            </div>

            <div className="p-4 border-2 border-[#0891B2] rounded-lg bg-[#E0F7FA]">
              <div className="text-xs font-bold text-[#0891B2] mb-2">MOST POPULAR</div>
              <h3 className="font-bold text-lg mb-2">Pro</h3>
              <p className="text-gray-600 text-sm mb-4">Scaled for networks</p>
              <p className="text-2xl font-bold text-[#0891B2] mb-4">$999<span className="text-sm text-gray-600">/mo</span></p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Up to 10 hospitals</li>
                <li>✓ Everything in Starter</li>
                <li>✓ Cross-hospital dashboards</li>
                <li>✓ Advanced reporting</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Custom</h3>
              <p className="text-gray-600 text-sm mb-4">Enterprise solutions</p>
              <p className="text-2xl font-bold text-[#0891B2] mb-4">Contact Us</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Unlimited hospitals</li>
                <li>✓ Everything in Pro</li>
                <li>✓ SSO/LDAP</li>
                <li>✓ Custom integrations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#0891B2] to-cyan-600 rounded-lg p-12 text-center text-white mb-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join hospitals across the country using MedStar H2O to ensure water chemistry compliance and patient safety.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-3 bg-white text-[#0891B2] font-bold rounded-lg hover:bg-gray-100 transition"
            >
              View All Plans
            </Link>
            <Link
              href="/checkout?tier=custom"
              className="px-8 py-3 bg-[#0891B2] border-2 border-white text-white font-bold rounded-lg hover:bg-cyan-700 transition"
            >
              Request Demo
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">What makes MedStar H2O different?</h3>
              <p className="text-gray-600 text-sm">
                MedStar H2O combines real-time water chemistry monitoring with AI-powered recommendations 
                and comprehensive compliance reporting. Built specifically for hospital networks.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-gray-600 text-sm">
                Yes. Changes take effect immediately and are reflected in your next billing cycle. 
                Downgrading may require adjustment of hospital count to match tier limits.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">What support is included?</h3>
              <p className="text-gray-600 text-sm">
                Starter plans include email support. Pro plans include priority email and phone support. 
                Custom plans include a dedicated account manager and SLA guarantee.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-600 text-sm">
                Yes. All data is encrypted at rest and in transit. We comply with HIPAA and maintain 
                regular security audits. See our security policy for details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
