'use client';
import Link from 'next/link';

export default function PricingCard({ plan, name, price, features, highlighted, ctaHref = '/signup' }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 ${
        highlighted
          ? 'bg-cyan-700 text-white shadow-2xl scale-105 border-2 border-cyan-400'
          : 'bg-white text-gray-900 shadow-md border border-gray-100'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-xl font-bold mb-1 ${highlighted ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <div className="flex items-end gap-1">
          {price !== null ? (
            <>
              <span className={`text-4xl font-extrabold ${highlighted ? 'text-white' : 'text-cyan-700'}`}>
                ${price}
              </span>
              <span className={`text-sm pb-1 ${highlighted ? 'text-cyan-200' : 'text-gray-500'}`}>/month</span>
            </>
          ) : (
            <span className={`text-2xl font-semibold ${highlighted ? 'text-white' : 'text-cyan-700'}`}>
              Custom pricing
            </span>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <svg
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${highlighted ? 'text-cyan-300' : 'text-cyan-600'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className={highlighted ? 'text-cyan-100' : 'text-gray-700'}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`${ctaHref}?plan=${plan}`}
        className={`block text-center font-semibold py-3 rounded-xl transition-colors ${
          highlighted
            ? 'bg-white text-cyan-700 hover:bg-cyan-50'
            : 'bg-cyan-600 text-white hover:bg-cyan-700'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
