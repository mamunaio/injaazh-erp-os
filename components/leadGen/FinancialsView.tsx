'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  PlusCircle,
  Receipt,
  CreditCard,
  Check,
} from 'lucide-react';
import { Invoice, Expense, Client } from '@/types/leadGen';

interface FinancialsViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  onAddInvoice: (inv: Omit<Invoice, 'id'>) => Promise<void>;
  onUpdateInvoice: (id: string, inv: Partial<Invoice>) => Promise<void>;
  onAddExpense: (exp: Omit<Expense, 'id'>) => Promise<void>;
}

export default function FinancialsView({
  invoices,
  expenses,
  clients,
  onAddInvoice,
  onUpdateInvoice,
  onAddExpense,
}: FinancialsViewProps) {
  const [subTab, setSubTab] = useState<'pnl' | 'invoices' | 'expenses'>('pnl');

  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Add Invoice state
  const [invClient, setInvClient] = useState(clients[0]?.name || 'Acme Heating & Air');
  const [invAmount, setInvAmount] = useState(1000);
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [invStatus, setInvStatus] = useState<'Draft' | 'Sent' | 'Paid'>('Sent');
  const [invNote, setInvNote] = useState('');

  // Add Expense state
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState('Domains & Inboxes');
  const [expVendor, setExpVendor] = useState('Namecheap');
  const [expAmount, setExpAmount] = useState(48);
  const [expRecurring, setExpRecurring] = useState(true);
  const [expNote, setExpNote] = useState('');

  // Financial totals
  const totalInvoiced = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalCollected = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;

  // Monthly PnL aggregation
  const pnlMap: Record<string, { invoiced: number; collected: number; expenses: number }> = {};

  invoices.forEach((inv) => {
    const m = (inv.issueDate || '').slice(0, 7) || '2026-10';
    if (!pnlMap[m]) pnlMap[m] = { invoiced: 0, collected: 0, expenses: 0 };
    pnlMap[m].invoiced += Number(inv.amount) || 0;
    if (inv.status === 'Paid') {
      const paidM = (inv.paidDate || inv.issueDate || '').slice(0, 7) || m;
      if (!pnlMap[paidM]) pnlMap[paidM] = { invoiced: 0, collected: 0, expenses: 0 };
      pnlMap[paidM].collected += Number(inv.amount) || 0;
    }
  });

  expenses.forEach((exp) => {
    const m = (exp.date || '').slice(0, 7) || '2026-10';
    if (!pnlMap[m]) pnlMap[m] = { invoiced: 0, collected: 0, expenses: 0 };
    pnlMap[m].expenses += Number(exp.amount) || 0;
  });

  const pnlMonths = Object.keys(pnlMap).sort();
  let runningCumulative = 0;
  const pnlRows = pnlMonths.map((m) => {
    const item = pnlMap[m];
    const net = item.collected - item.expenses;
    runningCumulative += net;
    return {
      month: m,
      invoiced: item.invoiced,
      collected: item.collected,
      expenses: item.expenses,
      net,
      cumulative: runningCumulative,
    };
  });

  const handleMarkPaid = async (inv: Invoice) => {
    await onUpdateInvoice(inv.id, {
      status: 'Paid',
      paidDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddInvoice({
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      issueDate: invIssueDate,
      client: invClient,
      amount: Number(invAmount),
      status: invStatus,
      dueDate: invDueDate,
      paidDate: invStatus === 'Paid' ? invIssueDate : null,
      note: invNote,
    });
    setShowAddInvoiceModal(false);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddExpense({
      date: expDate,
      category: expCategory,
      vendor: expVendor,
      amount: Number(expAmount),
      isRecurring: expRecurring,
      note: expNote,
    });
    setShowAddExpenseModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Financials, Invoices &amp; Monthly PnL</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track billed client retainers, collected cashflow, operating overhead, and net agency margins.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddInvoiceModal(true)}
            className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition"
          >
            <Receipt className="h-4 w-4" />
            <span>Create Invoice</span>
          </button>
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center space-x-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition shadow-sm"
          >
            <CreditCard className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Invoiced</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">${totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Collected Cash</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">${totalCollected.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">From Paid Invoices</span>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Operating Expenses</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">${totalExpenses.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">Domains, Inboxes, Tools</span>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Net Profit Margin</span>
          <p
            className={`text-2xl font-black mt-1.5 ${
              netProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            ${netProfit.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">Collected - Expenses</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 space-x-6">
        <button
          onClick={() => setSubTab('pnl')}
          className={`pb-3.5 text-sm font-bold transition border-b-2 ${
            subTab === 'pnl'
              ? 'border-[#6324FC] dark:border-[#00E5FF] text-[#6324FC] dark:text-[#00E5FF]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Monthly PnL Statement
        </button>
        <button
          onClick={() => setSubTab('invoices')}
          className={`pb-3.5 text-sm font-bold transition border-b-2 ${
            subTab === 'invoices'
              ? 'border-[#6324FC] dark:border-[#00E5FF] text-[#6324FC] dark:text-[#00E5FF]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Invoices Directory ({invoices.length})
        </button>
        <button
          onClick={() => setSubTab('expenses')}
          className={`pb-3.5 text-sm font-bold transition border-b-2 ${
            subTab === 'expenses'
              ? 'border-[#6324FC] dark:border-[#00E5FF] text-[#6324FC] dark:text-[#00E5FF]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Operating Expenses ({expenses.length})
        </button>
      </div>

      {/* SUB-TAB 1: Monthly PnL Table */}
      {subTab === 'pnl' && (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
          <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Monthly Profit &amp; Loss Breakdown
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Calculated based on paid dates and expense schedules</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-4 pl-5 pr-3">Billing Month</th>
                  <th className="px-3 py-4">Invoiced ($)</th>
                  <th className="px-3 py-4">Collected ($)</th>
                  <th className="px-3 py-4">Total Expenses ($)</th>
                  <th className="px-3 py-4">Monthly Net ($)</th>
                  <th className="py-4 pl-3 pr-5 text-right">Cumulative Net ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {pnlRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      No financial transaction logs found.
                    </td>
                  </tr>
                ) : (
                  pnlRows.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-5 pr-3 font-bold text-slate-900 dark:text-white font-mono">{row.month}</td>
                      <td className="px-3 py-3.5 text-slate-700 dark:text-slate-300 font-medium">${row.invoiced.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">${row.collected.toLocaleString()}</td>
                      <td className="px-3 py-3.5 text-rose-600 dark:text-rose-400 font-semibold">${row.expenses.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-bold">
                        <span className={row.net >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}>
                          ${row.net.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right font-black text-slate-900 dark:text-white font-mono text-base">
                        ${row.cumulative.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Invoices List */}
      {subTab === 'invoices' && (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-4 pl-5 pr-3">Invoice #</th>
                  <th className="px-3 py-4">Client</th>
                  <th className="px-3 py-4">Issue Date</th>
                  <th className="px-3 py-4">Amount ($)</th>
                  <th className="px-3 py-4">Due Date</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="py-4 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pl-5 pr-3 font-mono font-bold text-[#6324FC] dark:text-[#00E5FF]">{inv.invoiceNumber}</td>
                    <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">{inv.client}</td>
                    <td className="px-3 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">{inv.issueDate}</td>
                    <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-base">${inv.amount.toLocaleString()}</td>
                    <td className="px-3 py-3.5 font-mono text-slate-600 dark:text-slate-300 text-xs sm:text-sm">{inv.dueDate}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          inv.status === 'Paid'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : inv.status === 'Sent'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                            : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => handleMarkPaid(inv)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition ml-auto inline-flex items-center space-x-1 shadow"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Expenses List */}
      {subTab === 'expenses' && (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-4 pl-5 pr-3">Date</th>
                  <th className="px-3 py-4">Expense Category</th>
                  <th className="px-3 py-4">Vendor</th>
                  <th className="px-3 py-4">Amount ($)</th>
                  <th className="px-3 py-4">Recurring?</th>
                  <th className="py-4 pl-3 pr-5">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pl-5 pr-3 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">{exp.date}</td>
                    <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">{exp.category}</td>
                    <td className="px-3 py-3.5 text-[#6324FC] dark:text-[#00E5FF] font-semibold">{exp.vendor}</td>
                    <td className="px-3 py-3.5 font-bold text-rose-600 dark:text-rose-400 text-base">${exp.amount.toLocaleString()}</td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {exp.isRecurring ? 'Yes (Monthly)' : 'No (One-time)'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-slate-500 dark:text-slate-400 truncate max-w-xs text-xs sm:text-sm">{exp.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-5">Create Client Retainer Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Client *</label>
                <select
                  value={invClient}
                  onChange={(e) => setInvClient(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Invoice Amount ($) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={invAmount}
                  onChange={(e) => setInvAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={invIssueDate}
                    onChange={(e) => setInvIssueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
                <select
                  value={invStatus}
                  onChange={(e) => setInvStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3.5 pt-5 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-5">Log Operating Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                >
                  <option value="Domains & Inboxes">Domains &amp; Inboxes</option>
                  <option value="Email Warmup & Sending">Email Warmup &amp; Sending</option>
                  <option value="Lead Verification & Scraping">Lead Verification &amp; Scraping</option>
                  <option value="Team & Freelancers">Team &amp; Freelancers</option>
                  <option value="Software & Subscriptions">Software &amp; Subscriptions</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Namecheap, Instantly, Clay, Google Workspace"
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Amount ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2.5 pt-1.5">
                <input
                  type="checkbox"
                  id="recurringCheck"
                  checked={expRecurring}
                  onChange={(e) => setExpRecurring(e.target.checked)}
                  className="rounded border-slate-300 text-[#6324FC] h-4 w-4"
                />
                <label htmlFor="recurringCheck" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Monthly recurring subscription expense
                </label>
              </div>

              <div className="flex justify-end space-x-3.5 pt-5 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-500 transition shadow"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
