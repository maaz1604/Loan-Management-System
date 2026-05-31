'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Loan, LoanApplication } from '@/types';
import { formatCurrency } from '@/lib/interest';
import Card from '@/components/ui/Card';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLoans() {
      try {
        if (!user) return;
        const loansUrl = user.role === 'Borrower' ? '/api/loans/mine' : '/api/loans';
        const appsUrl = user.role === 'Borrower' ? '/api/applications/mine' : '/api/applications';
        
        const [loanData, applicationData] = await Promise.all([
          api.get<{ loans: Loan[] }>(loansUrl),
          api.get<{ applications: LoanApplication[] }>(appsUrl),
        ]);
        setLoans(loanData.loans);
        setApplications(applicationData.applications);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoans();
  }, [user]);

  const stats = [
    {
      label: 'Total Loans',
      value: loans.length + applications.length,
      icon: '📋',
      color: 'from-blue-600/20 to-cyan-600/20 border-blue-500/30',
    },
    {
      label: 'Pending',
      value:
        loans.filter((l) => l.status === 'PENDING' || l.status === 'APPLIED').length +
        applications.filter((a) => a.status === 'LEAD' || a.status === 'APPLIED' || a.status === 'UNDER_REVIEW').length,
      icon: '⏳',
      color: 'from-yellow-600/20 to-orange-600/20 border-yellow-500/30',
    },
    {
      label: 'Sanctioned',
      value: loans.filter((l) => l.status === 'SANCTIONED').length,
      icon: '✅',
      color: 'from-green-600/20 to-emerald-600/20 border-green-500/30',
    },
    {
      label: 'Disbursed',
      value: loans.filter((l) => l.status === 'DISBURSED').length,
      icon: '💰',
      color: 'from-purple-600/20 to-pink-600/20 border-purple-500/30',
    },
    {
      label: 'Total Volume',
      value: formatCurrency(
        loans.reduce((sum, l) => sum + l.amount, 0) +
        applications.reduce((sum, a) => sum + a.requestedAmount, 0),
      ),
      icon: '📊',
      color: 'from-indigo-600/20 to-violet-600/20 border-indigo-500/30',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Welcome back, {user?.name}</h1>
        <p className="text-slate-400 mt-1">Here&apos;s your loan management overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className={`bg-linear-to-br ${stat.color}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-100">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {user?.role === 'Borrower' && (
        <div className="space-y-6">
          {applications.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-4">My Applications</h2>
              <div className="grid gap-4">
                {applications.map((app) => (
                  <Card key={app._id} className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-300">Requested Amount: <span className="font-semibold text-white">{formatCurrency(app.requestedAmount)}</span></p>
                      <p className="text-sm text-slate-400">Tenure: {app.tenure} days</p>
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {app.status}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {loans.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-4">My Loans</h2>
              <div className="grid gap-4">
                {loans.map((loan) => (
                  <Card key={loan._id} className="flex justify-between items-center">
                    <div>
                      <p className="text-slate-300">Loan Amount: <span className="font-semibold text-white">{formatCurrency(loan.amount)}</span></p>
                      <p className="text-sm text-slate-400">Total Repayment: {formatCurrency(loan.totalRepayment)}</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        loan.status === 'DISBURSED' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : loan.status === 'SANCTIONED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
