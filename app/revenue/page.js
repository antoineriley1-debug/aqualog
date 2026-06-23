'use client';
/**
 * Revenue & Sales has been merged into the Licensing & Sales console.
 * This page now redirects there so any existing link or bookmark to /revenue keeps working.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RevenuePage() {
  const router = useRouter();
  useEffect(() => { router.replace('/licensing'); }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center text-gray-400 text-sm">
      Redirecting to Licensing &amp; Sales…
    </div>
  );
}
