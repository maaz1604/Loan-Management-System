'use client';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  LEAD: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  APPLIED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  UNDER_REVIEW: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  APPROVED: 'bg-green-500/15 text-green-400 border-green-500/30',
  SANCTIONED: 'bg-green-500/15 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
  DISBURSED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  CLOSED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  CONVERTED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PAID: 'bg-green-500/15 text-green-400 border-green-500/30',
  PARTIAL: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  OVERDUE: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
