'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Search, MoreHorizontal, Download, Trash2, Edit, Mail, 
  ArrowLeft, CheckCircle2, Clock, AlertCircle, DollarSign, ArrowUpRight
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
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this invoice permanently?', danger: true });
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
      case 'Sent': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Overdue': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Cancelled': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20'; // Draft
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-purple-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/finance" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft size={14} /> Finance
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-bold text-purple-500 uppercase tracking-widest">Invoice Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">
              Client Invoices
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Generate branded A4 PDFs, track payment milestones, and dispatch bills.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href="/finance" className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#11131A] hover:bg-slate-100 dark:hover:bg-[#1A1D27] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-slate-200 transition-all shadow-sm">
              Back to Finance
            </Link>
            <Link href="/finance/invoices/create" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/30">
              <Plus size={16} strokeWidth={2.5} />
              New Invoice
            </Link>
          </div>
        </div>

        {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Invoiced</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <FileText size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{invoices.length} total issued invoices</p>
          </div>

          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paid / Collected</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-500/80 mt-1">Settled in full</p>
          </div>

          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending / Sent</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Clock size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-blue-500/80 mt-1">Awaiting client payment</p>
          </div>

          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertCircle size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {overdueCount} <span className="text-xs text-slate-400">Invoices</span>
            </p>
            <p className="text-[11px] text-rose-500/80 mt-1">Requires follow-up</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80 group">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by client or invoice #..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-800 dark:text-white text-sm font-medium rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 transition-all" 
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] overflow-hidden shadow-sm dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#09090B] border-b border-slate-200 dark:border-[#232734]">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Invoice #</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Client</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Issued / Due</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Total Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#232734]">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] mb-3">
                        <FileText size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">No invoices found</p>
                      <p className="text-xs text-slate-400 mt-1">Adjust your search or create your first invoice.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-[#141414] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400 block">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">{inv.clientName}</span>
                        {inv.clientEmail && <span className="text-[11px] text-slate-400">{inv.clientEmail}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">{format(new Date(inv.issueDate || Date.now()), 'MMM d, yyyy')}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Due: {format(new Date(inv.dueDate || Date.now()), 'MMM d, yyyy')}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-white block">
                          ${(inv.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/finance/invoices/create?edit=${inv._id}`} className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors" title="Edit & Preview PDF">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => handleDelete(inv._id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
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
