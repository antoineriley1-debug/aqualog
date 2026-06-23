'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get('accountId');
  const tier = searchParams.get('tier') || 'starter';
  const [videoStarted, setVideoStarted] = useState(false);

  const demoVideoUrl = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  const demoVideoTitle = 'MedStar H2O Platform — Complete Overview';

  if (!accountId) {
    return (
      <div className="min-h-screen bg-[#F0F9FF]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-red-600">Error: Missing account information.</p>
            <Link href="/checkout" className="text-[#0891B2] hover:underline mt-4 inline-block">
              Return to checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF]">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Success Message */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
            Your {tier === 'custom' ? 'demo request' : 'order'} has been submitted successfully.
          </p>
          
          <p className="text-gray-600 mb-8">
            {tier === 'custom' 
              ? 'Our sales team will follow up within 24 hours to discuss your specific needs.'
              : 'Account setup will complete after your initial setup.'}
          </p>

          {tier === 'custom' && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-8 inline-block max-w-md">
              <p className="text-green-900 text-sm font-medium">
                ✓ Your inquiry has been saved and logged<br/>
                ✓ Confirmation email sent<br/>
                ✓ Admin dashboard updated
              </p>
            </div>
          )}
        </div>

        {/* Video Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Watch Our Demo Video
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-2xl">
            While our team reviews your {tier === 'custom' ? 'request' : 'order'}, take a few minutes to watch our complete platform walkthrough to see how MedStar H2O can help you achieve regulatory compliance.
          </p>

          {/* Video Container */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden mb-8">
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <iframe
                width="100%"
                height="100%"
                src={demoVideoUrl}
                title={demoVideoTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                autoPlay
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Demo Topics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What You'll See in the Demo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-[#0891B2] text-xl mr-2"></span>
                Dashboard Overview
              </h3>
              <p className="text-gray-600 text-sm">
                Tour of the hospital dashboard showing real-time water chemistry monitoring, 
                system status, and quick-access controls.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-[#0891B2] text-xl mr-2">!️</span>
                Alerts & Notifications
              </h3>
              <p className="text-gray-600 text-sm">
                See how out-of-range readings trigger immediate alerts and notifications to keep 
                operations teams informed in real-time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-[#0891B2] text-xl mr-2"></span>
                Chemistry Advisor AI
              </h3>
              <p className="text-gray-600 text-sm">
                Learn how the AI-powered Chemistry Advisor provides real-time recommendations 
                for corrective actions based on water chemistry data.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-[#0891B2] text-xl mr-2">◻</span>
                Compliance Reports
              </h3>
              <p className="text-gray-600 text-sm">
                See how reports are generated with full compliance information, audit trails, 
                and confidentiality markings for regulatory requirements.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-[#0891B2] text-xl mr-2">≡</span>
                ST108 & Legionella Tracking
              </h3>
              <p className="text-gray-600 text-sm">
                Explore dedicated modules for ST108 water chemistry compliance and Legionella 
                risk monitoring with automated checkpoints.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-[#0891B2] text-xl mr-2">[SITE]</span>
                Account Management
              </h3>
              <p className="text-gray-600 text-sm">
                Manage hospitals, operators, billing, and account settings with role-based 
                access control and detailed audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-[#E0F7FA] border border-[#0891B2] rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What Happens Next
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#0891B2] text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {tier === 'custom' ? 'We Review Your Request' : 'Payment Processing'}
                </h3>
                <p className="text-gray-700">
                  {tier === 'custom' 
                    ? 'Our team will review your requirements and prepare a customized proposal.'
                    : 'Your payment information will be processed securely.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#0891B2] text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Follow-up Contact
                </h3>
                <p className="text-gray-700">
                  Our admin will contact you within 24 hours via email to confirm next steps and answer questions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#0891B2] text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {tier === 'custom' ? 'Custom Implementation' : 'Account Setup'}
                </h3>
                <p className="text-gray-700">
                  {tier === 'custom'
                    ? 'We\'ll work with you to configure the platform for your specific hospitals and workflows.'
                    : 'Complete your initial setup and connect your hospital data sources.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#0891B2] text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Go Live
                </h3>
                <p className="text-gray-700">
                  Start monitoring water chemistry and stay compliant with regulatory standards.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Have Questions?
          </h2>
          
          <p className="text-gray-600 mb-6">
            Don't wait for our follow-up — reach out anytime:
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <a href="mailto:support@medstarh2o.com" className="text-[#0891B2] hover:underline font-medium">
                support@medstarh2o.com
              </a>
            </div>

            <div>
              <p className="text-sm text-gray-600">Sales Inquiry</p>
              <a href="mailto:sales@medstarh2o.com" className="text-[#0891B2] hover:underline font-medium">
                sales@medstarh2o.com
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/"
            className="px-6 py-3 bg-[#0891B2] text-white rounded-lg font-medium hover:bg-[#0a7a99] transition-colors text-center"
          >
            Return Home
          </Link>

          <Link
            href="/pricing"
            className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
          >
            View Pricing
          </Link>
        </div>

        {/* Account ID for reference */}
        <div className="text-center text-sm text-gray-500 mt-8">
          Account ID: <code className="bg-gray-100 px-2 py-1 rounded">{accountId}</code>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
