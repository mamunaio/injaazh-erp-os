'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, Plus, Search, Trash2, Edit,
  ArrowLeft, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { deleteInvoice } from '@/app/actions/invoiceActions';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import { format } from 'date-fns';

export default function InvoicesClient({ initialInvoices }: { initialInvoices: any[] }) {
  const { confirm } = useConfirm();
  const [invoices, setInvoices] = useState(initialInvoices || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = (inv.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (inv.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Invoice Analytics
  const totalInvoiced = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.total || 0), 0), [invoices]);
  const totalPaid = useMemo(() => invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + (inv.total || 0), 0), [invoices]);
  const totalPending = useMemo(() => invoices.filter(i => i.status === 'Sent' || i.status === 'Draft').reduce((sum, inv) => sum + (inv.total || 0), 0), [invoices]);
  const overdueCount = useMemo(() => invoices.filter(i => i.status === 'Overdue').length, [invoices]);

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ 
      title: 'Delete Invoice',
      message: 'Are you sure you want to delete this invoice permanently?', 
      variant: 'danger',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;

    const res = await deleteInvoice(id);
    if (res.success) {
      toast.success('Invoice deleted successfully');
      setInvoices(invoices.filter(i => i._id !== id));
    } else {
      toast.error(res.error || 'Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Sent': return 'text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 border-[#6324FC]/20';
      case 'Overdue': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Cancelled': return 'text-secondary bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20'; // Draft
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] p-4 md:p-8 selection:bg-[#6324FC]/30">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/finance" className="flex items-center gap-1 text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft size={13} /> Finance
              </Link>
              <span className="text-secondary opacity-40">/</span>
              <span className="text-[10px] font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-widest">Invoice Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              Client Invoices
            </h1>
            <p className="text-xs text-secondary font-medium">
              Generate branded A4 PDFs, track payment milestones, and dispatch bills.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Link href="/finance" className="px-3.5 py-2 rounded-xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white transition-all shadow-xs">
              Back to Finance
            </Link>
            <Link href="/finance/invoices/create" className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white transition-all shadow-[0_0_20px_rgba(99,36,252,0.35)]">
              <Plus size={15} strokeWidth={2.5} />
              New Invoice
            </Link>
          </div>
        </div>

        {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Total Invoiced</span>
              <div className="w-7 h-7 rounded-xl bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center">
                <FileText size={13} />
              </div>
            </div>
            <p className="text-2xl font-heading font-extrabold font-mono text-slate-900 dark:text-white">
              ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-secondary font-mono mt-1">{invoices.length} total issued invoices</p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Paid / Collected</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={13} />
              </div>
            </div>
            <p className="text-2xl font-heading font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-emerald-500 font-mono mt-1">Settled in full</p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Pending / Sent</span>
              <div className="w-7 h-7 rounded-xl bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center">
                <Clock size={13} />
              </div>
            </div>
            <p className="text-2xl font-heading font-extrabold font-mono text-[#6324FC] dark:text-[#00E5FF]">
              ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-secondary font-mono mt-1">Awaiting client payment</p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Overdue</span>
              <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertCircle size={13} />
              </div>
            </div>
            <p className="text-2xl font-heading font-extrabold font-mono text-rose-500">
              {overdueCount} <span className="text-xs text-secondary font-normal font-sans">Invoices</span>
            </p>
            <p className="text-[10px] text-rose-500 font-mono mt-1">Requires follow-up</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-3.5 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80 group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by client or invoice #..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-3.5 py-2 focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary" 
            />
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-[#6324FC]/15 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30' 
                    : 'text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#060608]/50 border-b border-black/5 dark:border-white/5">
                  <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Invoice #</th>
                  <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Client</th>
                  <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Issued / Due</th>
                  <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap text-right">Total Amount</th>
                  <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 mb-3">
                        <FileText size={20} className="text-secondary" />
                      </div>
                      <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">No invoices found</p>
                      <p className="text-[11px] text-secondary mt-0.5">Adjust your search or create your first invoice.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="font-heading font-bold font-mono text-[#6324FC] dark:text-[#00E5FF] block">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-heading font-bold text-slate-900 dark:text-white block">{inv.clientName}</span>
                        {inv.clientEmail && <span className="text-[10px] text-secondary font-mono">{inv.clientEmail}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-700 dark:text-slate-300 block font-mono">{format(new Date(inv.issueDate || Date.now()), 'MMM d, yyyy')}</span>
                        <span className="text-[9px] text-secondary font-mono uppercase tracking-wider block mt-0.5">Due: {format(new Date(inv.dueDate || Date.now()), 'MMM d, yyyy')}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-heading font-bold font-mono text-slate-900 dark:text-white block">
                          ${(inv.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[9px] font-heading font-bold uppercase tracking-widest border ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/finance/invoices/create?edit=${inv._id}`} className="p-1.5 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors" title="Edit & Preview PDF">
                            <Edit size={14} />
                          </Link>
                          <button onClick={() => handleDelete(inv._id)} className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
