'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loan, User } from '@/types';
import { formatCurrency } from '@/lib/interest';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [reason, setReason] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  async function fetchLoans() {
    try {
      const data = await api.get<{ loans: Loan[] }>('/api/loans');
      setLoans(data.loans.filter((l) => l.status === 'SANCTIONED'));
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }

  function openDisburseModal(loan: Loan) {
    setSelectedLoan(loan);
    setReason('');
    setModalError('');
    setModalOpen(true);
  }

  async function handleDisburse() {
    if (!selectedLoan) return;
    
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setModalError('Reason is required');
      return;
    }

    setActionLoading(selectedLoan._id);
    setModalError('');
    
    try {
      await api.patch(`/api/loans/${selectedLoan._id}/disburse`, {
        reason: trimmedReason
      });
      setModalOpen(false);
      await fetchLoans();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Disbursement failed');
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<Loan>[] = [
    {
      key: 'borrowerId',
      header: 'Borrower',
      render: (loan) => {
        const borrower = loan.borrowerId as User;
        return <span className="font-medium">{typeof borrower === 'object' ? borrower.name : 'N/A'}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (loan) => <span>{formatCurrency(loan.amount)}</span>,
    },
    {
      key: 'totalRepayment',
      header: 'Total Repayment',
      render: (loan) => <span>{formatCurrency(loan.totalRepayment)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (loan) => <StatusBadge status={loan.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (loan) => (
        <Button size="sm" onClick={() => openDisburseModal(loan)} isLoading={actionLoading === loan._id}>
          Disburse
        </Button>
      ),
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Disbursement</h1>
          <p className="text-slate-400 mt-1">Disburse sanctioned loans</p>
        </div>
        <Button onClick={fetchLoans} variant="secondary" size="sm">Refresh</Button>
      </div>
      <DataTable columns={columns} data={loans} emptyMessage="No loans awaiting disbursement" />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Disburse Loan"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {selectedLoan ? `Amount to Disburse: ${formatCurrency(selectedLoan.amount)}` : ''}
          </p>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="disburse-reason">
              Reason / Notes
            </label>
            <textarea
              id="disburse-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="E.g., Funds transferred successfully via NEFT..."
            />
          </div>

          {modalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {modalError}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleDisburse} isLoading={!!(selectedLoan && actionLoading === selectedLoan._id)} className="flex-1">
              Confirm Disbursement
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
