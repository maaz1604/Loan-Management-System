'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyPage() {
  const router = useRouter();
  useEffect(() => {
    router.push('/apply/personal');
  }, [router]);
  return null;
}
