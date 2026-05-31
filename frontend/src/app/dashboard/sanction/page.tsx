'use client';

import { useEffect, useState } from 'react';
import { api, getApiUrl } from '@/lib/api';
import { LoanApplication, User } from '@/types';
import { formatCurrency } from '@/lib/interest';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function SanctionPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');
  const [decisionError, setDecisionError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const data = await api.get<{ applications: LoanApplication[] }>('/api/applications');
      setApplications(data.applications.filter((application) =>
        application.status === 'APPLIED' || application.status === 'UNDER_REVIEW',
      ));
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }

  function openDecisionModal(application: LoanApplication, type: 'approve' | 'reject') {
    setSelectedApplication(application);
    setDecisionType(type);
    setReason('');
    setDecisionError('');
    setDecisionModalOpen(true);
  }

  async function handleDecisionSubmit() {
    if (!selectedApplication) return;

    const reasonText = reason.trim();
    if (!reasonText) {
      setDecisionError('Reason is required');
      return;
    }

    setActionLoading(selectedApplication._id);
    setDecisionError('');

    try {
      await api.patch(`/api/applications/${selectedApplication._id}/sanction`, {
        approve: decisionType === 'approve',
        reason: reasonText,
      });
      setDecisionModalOpen(false);
      await fetchApplications();
    } catch (err: unknown) {
      setDecisionError(err instanceof Error ? err.message : 'Decision failed');
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<LoanApplication>[] = [
    {
      key: 'borrowerId',
      header: 'Borrower',
      render: (application) => {
        const borrower = application.borrowerId as User;
        return <span className="font-medium">{typeof borrower === 'object' ? borrower.name : 'N/A'}</span>;
      },
    },
    {
      key: 'requestedAmount',
      header: 'Requested Amount',
      render: (application) => <span>{formatCurrency(application.requestedAmount)}</span>,
    },
    {
      key: 'tenure',
      header: 'Tenure',
      render: (application) => <span>{application.tenure} days</span>,
    },
    {
      key: 'employmentMode',
      header: 'Employment',
      render: (application) => <span>{application.employmentMode}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (application) => <StatusBadge status={application.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (application) => <span className="text-slate-400">{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'document',
      header: 'Document',
      render: (application) => {
        if (!application.salarySlipUrl) {
          return <span className="text-slate-500 text-sm">N/A</span>;
        }
        const fileUrl = application.salarySlipUrl.startsWith('http')
          ? application.salarySlipUrl
          : `${getApiUrl()}${application.salarySlipUrl.startsWith('/') ? '' : '/'}${application.salarySlipUrl}`;
          
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline underline-offset-4"
          >
            View File
          </a>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (application) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => openDecisionModal(application, 'approve')}
            isLoading={actionLoading === application._id}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => openDecisionModal(application, 'reject')}
            isLoading={actionLoading === application._id}
          >
            Reject
          </Button>
        </div>
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
          <h1 className="text-2xl font-bold text-slate-100">Sanction Queue</h1>
          <p className="text-slate-400 mt-1">Review applied loans and approve/reject with reason</p>
        </div>
        <Button onClick={fetchApplications} variant="secondary" size="sm">Refresh</Button>
      </div>
      <DataTable columns={columns} data={applications} emptyMessage="No applications pending review" />

      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`${decisionType === 'approve' ? 'Approve' : 'Reject'} Application`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {selectedApplication ? `Borrower: ${typeof selectedApplication.borrowerId === 'object' ? selectedApplication.borrowerId.name : 'N/A'}` : ''}
          </p>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="sanction-reason">
              Reason
            </label>
            <textarea
              id="sanction-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder={decisionType === 'approve' ? 'Explain why this application is approved' : 'Explain why this application is rejected'}
            />
          </div>

          {decisionError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {decisionError}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleDecisionSubmit} isLoading={!!(selectedApplication && actionLoading === selectedApplication._id)} className="flex-1">
              Confirm {decisionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
            <Button variant="secondary" onClick={() => setDecisionModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
