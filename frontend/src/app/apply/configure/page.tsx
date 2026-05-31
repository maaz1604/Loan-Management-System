'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { calculateSimpleInterest, calculateTotalRepayment, formatCurrency } from '@/lib/interest';
import RangeSlider from '@/components/ui/RangeSlider';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const INTEREST_RATE = 12;

export default function ConfigurePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState(200000);
  const [tenure, setTenure] = useState(180);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const si = calculateSimpleInterest(amount, INTEREST_RATE, tenure);
  const total = calculateTotalRepayment(amount, INTEREST_RATE, tenure);

  async function handleApply() {
    if (!user) return;
    setIsApplying(true);
    setError('');

    try {
      const personalStr = localStorage.getItem('personalDetails');
      const salarySlipUrl = localStorage.getItem('salarySlipUrl') || '';
      const personal = personalStr ? JSON.parse(personalStr) : {};

      // Create application lead
      const createData = await api.post<{ application: { _id: string } }>('/api/applications/leads', {
        borrowerId: user._id,
        requestedAmount: amount,
        tenure: tenure,
        employmentMode: personal.employmentMode || 'Salaried',
        salarySlipUrl: salarySlipUrl,
      });

      // Mark as applied
      await api.patch(`/api/applications/${createData.application._id}/apply`);

      // Clean up
      localStorage.removeItem('personalDetails');
      localStorage.removeItem('salarySlipUrl');

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setIsApplying(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Application Submitted!</h2>
        <p className="text-slate-400 mb-6">Your loan application has been submitted successfully. Our team will review it shortly.</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => router.push('/apply/status')}>Track Status</Button>
          <Button onClick={() => router.push('/login')} variant="secondary">Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">Configure Your Loan</h2>
      <p className="text-slate-400 mb-6">Adjust the amount and tenure to see your repayment details</p>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <Card>
          <div className="space-y-8">
            <RangeSlider label="Loan Amount" min={50000} max={500000} step={10000} value={amount} onChange={setAmount} formatValue={formatCurrency} />
            <RangeSlider label="Tenure (Days)" min={30} max={365} step={1} value={tenure} onChange={setTenure} formatValue={(v) => `${v} days`} />
          </div>
        </Card>

        {/* Live Calculator */}
        <Card className="bg-linear-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Loan Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Principal Amount</span>
              <span className="text-lg font-semibold text-slate-100">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Tenure</span>
              <span className="text-lg font-semibold text-slate-100">{tenure} days</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Interest Rate</span>
              <span className="text-lg font-semibold text-indigo-400">{INTEREST_RATE}% p.a.</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Simple Interest</span>
              <span className="text-lg font-semibold text-amber-400">{formatCurrency(Math.round(si))}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-slate-300">Total Repayment</span>
              <span className="text-2xl font-bold text-green-400">{formatCurrency(Math.round(total))}</span>
            </div>
          </div>

          <Button onClick={handleApply} isLoading={isApplying} className="w-full mt-6" size="lg">
            Apply for Loan
          </Button>
        </Card>
      </div>
    </div>
  );
}
