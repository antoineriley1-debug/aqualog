'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HospitalPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect old /hospital/[id] to new /hospital-single/[id]
    router.push(`/hospital-single/${id}`);
  }, [id, router]);

  return null;
}
