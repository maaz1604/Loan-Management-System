'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Stepper from '@/components/Stepper';

const stepMap: Record<string, number> = {
  '/apply/personal': 1,
  '/apply/documents': 2,
  '/apply/configure': 3,
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!user) return null;

  const currentStep = stepMap[pathname] ?? 1;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Stepper currentStep={currentStep} />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
