'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Loan, LoanApplication } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

type TimelineStep = {
  key: 'submitted' | 'underReview' | 'decision' | 'disbursed';
  label: string;
  description: string;
  state: 'done' | 'active' | 'pending';
};

function getDecisionText(application: LoanApplication | null) {
  if (!application) return null;

  if (application.status === 'REJECTED') {
    return {
      title: 'Rejected by Sanction',
      reason: application.rejectionReason || application.notes || 'No reason provided',
      tone: 'text-red-300',
    };
  }

  if (application.status === 'CONVERTED') {
    return {
      title: 'Approved by Sanction',
      reason: application.notes || 'No approval note provided',
      tone: 'text-green-300',
    };
  }

  return null;
}

export default function ApplyStatusPage() {
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const [applicationData, loanData] = await Promise.all([
          api.get<{ applications: LoanApplication[] }>('/api/applications/mine'),
          api.get<{ loans: Loan[] }>('/api/loans'),
        ]);

        const latestApplication = applicationData.applications[0] ?? null;
        setApplication(latestApplication);

        if (!latestApplication) {
          setLoan(null);
          return;
        }

        const appLoanId = typeof latestApplication.loanId === 'string' ? latestApplication.loanId : latestApplication.loanId?._id;
        const matchedLoan = loanData.loans.find((item) => item._id === appLoanId) || null;
        setLoan(matchedLoan);
      } catch {
        setApplication(null);
        setLoan(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, []);

  const steps: TimelineStep[] = useMemo(() => {
    if (!application) {
      return [
        {
          key: 'submitted',
          label: 'Submitted',
          description: 'No application submitted yet.',
          state: 'pending',
        },
        {
          key: 'underReview',
          label: 'Under Review',
          description: 'Sanction team will review your application.',
          state: 'pending',
        },
        {
          key: 'decision',
          label: 'Decision',
          description: 'Approval or rejection with reason.',
          state: 'pending',
        },
        {
          key: 'disbursed',
          label: 'Disbursed',
          description: 'Approved loans are disbursed by operations.',
          state: 'pending',
        },
      ];
    }

    const submittedDone = ['APPLIED', 'UNDER_REVIEW', 'CONVERTED', 'REJECTED', 'WITHDRAWN'].includes(application.status);
    const reviewDone = ['UNDER_REVIEW', 'CONVERTED', 'REJECTED'].includes(application.status);
    const decisionDone = ['CONVERTED', 'REJECTED'].includes(application.status);
    const disbursedDone = loan?.status === 'DISBURSED';

    return [
      {
        key: 'submitted',
        label: 'Submitted',
        description: 'Application has been submitted.',
        state: submittedDone ? 'done' : 'active',
      },
      {
        key: 'underReview',
        label: 'Under Review',
        description: 'Sanction executive is reviewing your file.',
        state: reviewDone ? 'done' : submittedDone ? 'active' : 'pending',
      },
      {
        key: 'decision',
        label: application.status === 'REJECTED' ? 'Rejected' : 'Approved/Rejected',
        description: 'Final sanction decision with reason.',
        state: decisionDone ? 'done' : reviewDone ? 'active' : 'pending',
      },
      {
        key: 'disbursed',
        label: 'Disbursed',
        description: 'Funds released to borrower account.',
        state: disbursedDone ? 'done' : decisionDone && application.status === 'CONVERTED' ? 'active' : 'pending',
      },
    ];
  }, [application, loan]);

  const decision = getDecisionText(application);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Application Timeline</h2>
        <p className="text-slate-400">Track your loan from submission to disbursement.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Current Status</h3>
          <StatusBadge status={loan?.status || application?.status || 'PENDING'} />
        </div>

        {!application ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">You have not submitted an application yet.</p>
            <Link href="/apply/configure">
              <Button size="sm">Start Application</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {steps.map((step) => (
              <div key={step.key} className="flex items-start gap-3">
                <div
                  className={`mt-1 w-3 h-3 rounded-full ${
                    step.state === 'done'
                      ? 'bg-green-400'
                      : step.state === 'active'
                      ? 'bg-indigo-400'
                      : 'bg-slate-600'
                  }`}
                />
                <div>
                  <p className={`text-sm font-semibold ${step.state === 'pending' ? 'text-slate-500' : 'text-slate-200'}`}>{step.label}</p>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}

            {decision && (
              <div className="p-3 rounded-lg border border-slate-700/60 bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-200">{decision.title}</p>
                <p className={`text-sm ${decision.tone}`}>Reason: {decision.reason}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}