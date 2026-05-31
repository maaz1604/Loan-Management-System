'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { LoanApplication } from '@/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

interface BREResult {
  passed: boolean;
  reasons: string[];
}

function runBRE(data: { dob: string; monthlySalary: number; pan: string; employmentMode: string }): BREResult {
  const reasons: string[] = [];

  // Age check (23-50)
  if (data.dob) {
    const birthDate = new Date(data.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 23 || age > 50) {
      reasons.push(`Age must be between 23 and 50 years (current: ${age})`);
    }
  }

  // Salary check
  if (data.monthlySalary < 25000) {
    reasons.push('Monthly salary must be at least ₹25,000');
  }

  // PAN check
  const panRegex = /^[A-Z]{3}[PCHFTBGLJG][A-Z]\d{4}[A-Z]$/;
  if (!panRegex.test(data.pan)) {
    reasons.push('Invalid PAN format');
  }

  // Employment check
  if (data.employmentMode === 'Unemployed') {
    reasons.push('Unemployed applicants are not eligible');
  }

  return { passed: reasons.length === 0, reasons };
}

export default function PersonalDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [latestApplication, setLatestApplication] = useState<LoanApplication | null>(null);
  const [name, setName] = useState(user?.name || '');
  const [pan, setPan] = useState(user?.pan || '');
  const [dob, setDob] = useState(user?.dob ? user.dob.split('T')[0] : '');
  const [salary, setSalary] = useState(user?.monthlySalary?.toString() || '');
  const [employment, setEmployment] = useState(user?.employmentMode || '');
  const [breResult, setBreResult] = useState<BREResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchMyApplications() {
      try {
        const data = await api.get<{ applications: LoanApplication[] }>('/api/applications/mine');
        setLatestApplication(data.applications[0] ?? null);
      } catch {
        setLatestApplication(null);
      }
    }

    fetchMyApplications();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = runBRE({
      dob,
      monthlySalary: Number(salary),
      pan: pan.toUpperCase(),
      employmentMode: employment,
    });

    setBreResult(result);

    if (result.passed) {
      localStorage.setItem('personalDetails', JSON.stringify({
        name,
        pan: pan.toUpperCase(),
        dob,
        monthlySalary: Number(salary),
        employmentMode: employment,
      }));
      router.push('/apply/documents');
    }

    setIsLoading(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">Personal Details</h2>
      <p className="text-slate-400 mb-6">Tell us about yourself to check your eligibility</p>

      {latestApplication && (
        <div className="mb-6 p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-sm font-semibold text-slate-200">Latest Application Status</h3>
            <StatusBadge status={latestApplication.status} />
          </div>

          {latestApplication.status === 'REJECTED' && (
            <p className="text-sm text-red-300">
              Rejected Reason: {latestApplication.rejectionReason || latestApplication.notes || 'No reason provided'}
            </p>
          )}

          {latestApplication.status === 'CONVERTED' && (
            <p className="text-sm text-green-300">
              Approved by Sanction: {latestApplication.notes || 'No approval note provided'}
            </p>
          )}

          {(latestApplication.status === 'APPLIED' || latestApplication.status === 'UNDER_REVIEW') && (
            <p className="text-sm text-amber-300">
              Your application is under sanction review.
            </p>
          )}

          <div className="mt-3">
            <Link href="/apply/status" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View full timeline
            </Link>
          </div>
        </div>
      )}

      {breResult && !breResult.passed && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <h3 className="text-sm font-semibold text-red-400">Application Rejected</h3>
          </div>
          <ul className="space-y-1">
            {breResult.reasons.map((reason, i) => (
              <li key={i} className="text-sm text-red-300">• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input id="personal-name" label="Full Name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input id="personal-pan" label="PAN Number" type="text" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} required />
          <Input id="personal-dob" label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
          <Input id="personal-salary" label="Monthly Salary (₹)" type="number" placeholder="50000" value={salary} onChange={(e) => setSalary(e.target.value)} min={0} required />
          <Select
            id="personal-employment"
            label="Employment Mode"
            value={employment}
            onChange={(e) => setEmployment(e.target.value)}
            required
            options={[
              { value: 'Salaried', label: 'Salaried' },
              { value: 'Self-Employed', label: 'Self-Employed' },
              { value: 'Unemployed', label: 'Unemployed' },
            ]}
          />
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Check Eligibility &amp; Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
