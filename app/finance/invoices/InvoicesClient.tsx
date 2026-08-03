'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, MoreHorizontal, Download, Trash2, Edit, Mail } from 'lucide-react';
import { deleteInvoice } from '@/app/actions/invoiceActions';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import { format } from 'date-fns';

export default function InvoicesClient({ initialInvoices }: { initialInvoices: any[] }) {
  const { confirm } = useConfirm();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = (inv.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (inv.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this invoice?', danger: true });
    if (!isConfirmed) return;

    const res = await deleteInvoice(id);
    if (res.success) {
      toast.success('Invoice deleted');
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#8B5CF6]/30">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-[10px] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                <FileText size={17} />
              </div>
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Finance / Invoices</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Manage Invoices</h1>
            <p className="text-sm font-medium text-[#94A3B8]">Create, send, and track client invoices.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href="/finance" className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#111111] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] border border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-900 dark:text-white transition-all shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] dark:shadow-none">
              Back to Finance
            </Link>
            <Link href="/finance/invoices/create" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]">
              <Plus size={16} strokeWidth={2.5} />
              Create Invoice
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] p-6 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] dark:shadow-none flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80 group">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#8B5CF6] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by client or invoice number..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-800 dark:text-white text-sm font-medium rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[#8B5CF6]/60 focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all" 
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full md:w-auto bg-white hover:bg-slate-50 dark:bg-[#111111] hover:dark:bg-[#141414] border border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-[#8B5CF6]/60 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Invoice List */}
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] overflow-hidden shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#09090B] border-b border-[#E2E8F0] dark:border-[#1a1a1a]">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Invoice</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Client</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Date & Due</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1a1a1a]">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] mb-4">
                        <FileText size={20} className="text-[#94A3B8]" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">No invoices found</p>
                      <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or create a new invoice.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-[#141414] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block">{inv.clientName}</span>
                        {inv.clientEmail && <span className="text-[11px] text-slate-500">{inv.clientEmail}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block">{format(new Date(inv.issueDate || Date.now()), 'MMM d, yyyy')}</span>
                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Due: {format(new Date(inv.dueDate || Date.now()), 'MMM d, yyyy')}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          ${(inv.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/finance/invoices/create?edit=${inv._id}`} className="p-2 text-slate-400 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-colors" title="Edit">
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
