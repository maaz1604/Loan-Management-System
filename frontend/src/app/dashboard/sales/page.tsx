'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SalesLead } from '@/types';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function SalesPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const data = await api.get<{ leads: SalesLead[] }>('/api/applications?view=sales-leads');
      setLeads(data.leads ?? []);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }

  const columns: Column<SalesLead>[] = [
    {
      key: 'name',
      header: 'Borrower',
      render: (lead) => <span className="font-medium">{lead.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (lead) => <span className="text-slate-300">{lead.email}</span>,
    },
    {
      key: 'monthlySalary',
      header: 'Monthly Salary',
      render: (lead) => <span>{lead.monthlySalary ? `₹${lead.monthlySalary.toLocaleString('en-IN')}` : '-'}</span>,
    },
    {
      key: 'employmentMode',
      header: 'Employment',
      render: (lead) => <span>{lead.employmentMode || '-'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Registered',
      render: (lead) => <span className="text-slate-400">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'status',
      header: 'Stage',
      render: (lead) => <StatusBadge status={lead.status} />,
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
          <h1 className="text-2xl font-bold text-slate-100">Lead Tracking</h1>
          <p className="text-slate-400 mt-1">Registered borrowers who have not started an application yet</p>
        </div>
        <Button onClick={fetchLeads} variant="secondary" size="sm">Refresh</Button>
      </div>

      <DataTable columns={columns} data={leads} emptyMessage="No registered borrower leads found" />
    </div>
  );
}
