'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loan, User, Payment } from '@/types';
import { formatCurrency } from '@/lib/interest';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Derived state for balances
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = selectedLoan ? Math.max(0, selectedLoan.totalRepayment - totalPaid) : 0;

  useEffect(() => {
    fetchLoans();
  }, []);

  async function fetchLoans() {
    try {
      const data = await api.get<{ loans: Loan[] }>('/api/loans');
      setLoans(data.loans.filter((l) => l.status === 'DISBURSED' || l.status === 'CLOSED'));
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }

  async function openPaymentModal(loan: Loan) {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
    setPaymentError('');
    setUtrNumber('');
    setPaymentAmount('');
    try {
      const data = await api.get<{ payments: Payment[] }>(`/api/payments/loan/${loan._id}`);
      setPayments(data.payments);
    } catch {
      setPayments([]);
    }
  }

  async function handleRecordPayment() {
    if (!selectedLoan) return;
    
    const amount = Number(paymentAmount);
    if (!utrNumber.trim()) {
      setPaymentError('UTR Number is required');
      return;
    }
    if (amount <= 0) {
      setPaymentError('Amount must be greater than 0');
      return;
    }
    if (amount > outstanding) {
      setPaymentError(`Payment amount cannot exceed the outstanding balance of ${formatCurrency(outstanding)}`);
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');
    try {
      await api.post('/api/payments', {
        loanId: selectedLoan._id,
        utrNumber,
        amount,
      });
      const data = await api.get<{ payments: Payment[] }>(`/api/payments/loan/${selectedLoan._id}`);
      setPayments(data.payments);
      setUtrNumber('');
      setPaymentAmount('');
      
      // If loan is fully paid, close modal and refresh loans list
      if (amount >= outstanding) {
        setShowPaymentModal(false);
      }
      await fetchLoans();
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaymentLoading(false);
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
        <Button size="sm" onClick={() => openPaymentModal(loan)} variant={loan.status === 'CLOSED' ? 'secondary' : 'primary'}>
          {loan.status === 'CLOSED' ? 'Payment History' : 'Record Payment'}
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
          <h1 className="text-2xl font-bold text-slate-100">Collection</h1>
          <p className="text-slate-400 mt-1">Record payments for disbursed loans</p>
        </div>
        <Button onClick={fetchLoans} variant="secondary" size="sm">Refresh</Button>
      </div>

      <DataTable columns={columns} data={loans} emptyMessage="No active loans for collection" />

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={selectedLoan?.status === 'CLOSED' ? "Payment History" : "Record Payment"}
      >
        <div className="space-y-4">
          {selectedLoan && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div>
                <p className="text-sm text-slate-400">Total Repayment</p>
                <p className="font-semibold text-slate-200">{formatCurrency(selectedLoan.totalRepayment)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Paid</p>
                <p className="font-semibold text-emerald-400">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-700">
                <p className="text-sm text-slate-400">Outstanding Balance</p>
                <p className="text-lg font-bold text-indigo-400">{formatCurrency(outstanding)}</p>
              </div>
            </div>
          )}

          {paymentError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {paymentError}
            </div>
          )}

          {selectedLoan?.status !== 'CLOSED' && (
            <>
              <Input id="payment-utr" label="UTR Number" placeholder="UTR123456789" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} required />
              <Input id="payment-amount" label="Amount (₹)" type="number" placeholder="10000" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} min={1} max={outstanding} required />

              <Button onClick={handleRecordPayment} isLoading={paymentLoading} className="w-full" disabled={outstanding <= 0}>
                {outstanding > 0 ? 'Submit Payment' : 'Loan Fully Paid'}
              </Button>
            </>
          )}

          {payments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Payment History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p._id} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg text-sm border border-slate-700">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium">{p.utrNumber}</span>
                      <span className="text-slate-500 text-xs">{new Date(p.date).toLocaleString()}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
