'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-cyan-700">
            <span className="text-2xl">💧</span>
            <span>FacilityH2O</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/#features" className="text-sm font-medium text-gray-600 hover:text-cyan-700 transition-colors">
              Features
            </a>
          </div>

          {/* Right buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-cyan-700 px-4 py-2 rounded-lg transition-colors"
            >
              Log In
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <a href="/#features" className="block text-sm font-medium text-gray-700 py-2">Features</a>
          <Link href="/login" className="block text-sm font-medium text-gray-700 py-2">Log In</Link>
        </div>
      )}
    </nav>
  );
}
