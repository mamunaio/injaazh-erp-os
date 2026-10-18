'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  PlusCircle,
  Receipt,
  CreditCard,
  Check,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { Invoice, Expense, Client } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface FinancialsViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  onAddInvoice: (inv: Omit<Invoice, 'id'>) => Promise<void>;
  onUpdateInvoice: (id: string, inv: Partial<Invoice>) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onAddExpense: (exp: Omit<Expense, 'id'>) => Promise<void>;
  onUpdateExpense: (id: string, exp: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export default function FinancialsView({
  invoices,
  expenses,
  clients,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: FinancialsViewProps) {
  const { confirm } = useConfirm();
  const [subTab, setSubTab] = useState<'pnl' | 'invoices' | 'expenses'>('pnl');

  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Invoice form state
  const [invClient, setInvClient] = useState(clients[0]?.name || 'Acme Heating & Air');
  const [invAmount, setInvAmount] = useState(1000);
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [invStatus, setInvStatus] = useState<'Draft' | 'Sent' | 'Paid' | 'Overdue'>('Sent');
  const [invNote, setInvNote] = useState('');

  // Expense form state
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

  const handleStartEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvClient(inv.client);
    setInvAmount(inv.amount);
    setInvIssueDate(inv.issueDate);
    setInvDueDate(inv.dueDate);
    setInvStatus(inv.status);
    setInvNote(inv.note || '');
    setShowAddInvoiceModal(true);
  };

  const handleCloseInvoiceModal = () => {
    setShowAddInvoiceModal(false);
    setEditingInvoice(null);
    setInvAmount(1000);
    setInvNote('');
  };

  const handleDeleteInvoiceWithConfirm = async (inv: Invoice) => {
    const confirmed = await confirm({
      title: 'Delete Invoice',
      message: `Are you sure you want to permanently delete invoice #${inv.invoiceNumber} ($${inv.amount.toLocaleString()}) for "${inv.client}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteInvoice(inv.id);
    }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInvoice) {
      await onUpdateInvoice(editingInvoice.id, {
        client: invClient,
        amount: Number(invAmount),
        issueDate: invIssueDate,
        dueDate: invDueDate,
        status: invStatus,
        note: invNote,
        ...(invStatus === 'Paid' && !editingInvoice.paidDate
          ? { paidDate: new Date().toISOString().split('T')[0] }
          : {}),
      });
    } else {
      const invNum = `INV-26-${String(invoices.length + 1).padStart(3, '0')}`;
      await onAddInvoice({
        invoiceNumber: invNum,
        client: invClient,
        amount: Number(invAmount),
        issueDate: invIssueDate,
        dueDate: invDueDate,
        status: invStatus,
        paidDate: invStatus === 'Paid' ? invIssueDate : undefined,
        note: invNote,
      });
    }
    handleCloseInvoiceModal();
  };

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpDate(exp.date);
    setExpCategory(exp.category);
    setExpVendor(exp.vendor);
    setExpAmount(exp.amount);
    setExpRecurring(exp.isRecurring);
    setExpNote(exp.note || '');
    setShowAddExpenseModal(true);
  };

  const handleCloseExpenseModal = () => {
    setShowAddExpenseModal(false);
    setEditingExpense(null);
    setExpAmount(48);
    setExpNote('');
  };

  const handleDeleteExpenseWithConfirm = async (exp: Expense) => {
    const confirmed = await confirm({
      title: 'Delete Expense',
      message: `Are you sure you want to permanently delete this $${exp.amount.toLocaleString()} expense for "${exp.vendor}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteExpense(exp.id);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      await onUpdateExpense(editingExpense.id, {
        date: expDate,
        category: expCategory,
        vendor: expVendor,
        amount: Number(expAmount),
        isRecurring: expRecurring,
        note: expNote,
      });
    } else {
      await onAddExpense({
        date: expDate,
        category: expCategory,
        vendor: expVendor,
        amount: Number(expAmount),
        isRecurring: expRecurring,
        note: expNote,
      });
    }
    handleCloseExpenseModal();
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Agency Financials &amp; Unit PnL</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track collected retainer invoices, cold email stack operating expenses, and monthly bottom-line profitability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingInvoice(null);
              setShowAddInvoiceModal(true);
            }}
            className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <Receipt className="h-4 w-4" />
            <span>+ Invoice</span>
          </button>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowAddExpenseModal(true);
            }}
            className="flex items-center space-x-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-500/20 transition active:scale-95"
          >
            <CreditCard className="h-4 w-4" />
            <span>+ Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 shadow-sm backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Invoiced</span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-mono">${totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 shadow-sm backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cash Collected</span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${totalCollected.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 shadow-sm backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tool &amp; Infra Expenses</span>
          <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-5 shadow-sm backdrop-blur-xl">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Profit</span>
          <p className="mt-1 text-2xl font-black text-[#6324FC] dark:text-[#00E5FF] font-mono">${netProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-black/10 dark:border-white/10 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setSubTab('pnl')}
          className={`pb-3 transition-colors ${
            subTab === 'pnl'
              ? 'border-b-2 border-[#6324FC] text-[#6324FC] dark:text-[#00E5FF]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Monthly PnL Summary
        </button>
        <button
          onClick={() => setSubTab('invoices')}
          className={`pb-3 transition-colors ${
            subTab === 'invoices'
              ? 'border-b-2 border-[#6324FC] text-[#6324FC] dark:text-[#00E5FF]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setSubTab('expenses')}
          className={`pb-3 transition-colors ${
            subTab === 'expenses'
              ? 'border-b-2 border-[#6324FC] text-[#6324FC] dark:text-[#00E5FF]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Expenses ({expenses.length})
        </button>
      </div>

      {/* SUB-TAB 1: Monthly PnL Table */}
      {subTab === 'pnl' && (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <tr>
                  <th className="py-4 pl-5 pr-3">Month</th>
                  <th className="px-3 py-4">Invoiced ($)</th>
                  <th className="px-3 py-4">Collected ($)</th>
                  <th className="px-3 py-4">Expenses ($)</th>
                  <th className="px-3 py-4">Net Profit ($)</th>
                  <th className="py-4 pl-3 pr-5 font-bold">Cumulative Net ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {pnlRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      No financial records found. Add invoices and expenses to populate PnL.
                    </td>
                  </tr>
                ) : (
                  pnlRows.map((r) => (
                    <tr key={r.month} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-5 pr-3 font-bold text-slate-900 dark:text-white font-mono">{r.month}</td>
                      <td className="px-3 py-3.5 font-mono">${r.invoiced.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">${r.collected.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-mono text-rose-600 dark:text-rose-400">${r.expenses.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-bold font-mono">
                        <span className={r.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          ${r.net.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5 font-bold font-mono text-[#6324FC] dark:text-[#00E5FF]">
                        ${r.cumulative.toLocaleString()}
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
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <tr>
                  <th className="py-4 pl-5 pr-3">Invoice #</th>
                  <th className="px-3 py-4">Client</th>
                  <th className="px-3 py-4">Issue Date</th>
                  <th className="px-3 py-4">Amount ($)</th>
                  <th className="px-3 py-4">Due Date</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="py-4 pl-3 pr-5 text-right min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      No invoices recorded. Click &apos;+ Invoice&apos; to create your first retainer invoice.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-5 pr-3 font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">{inv.client}</td>
                      <td className="px-3 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">{inv.issueDate}</td>
                      <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-base font-mono">${inv.amount.toLocaleString()}</td>
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
                        <div className="flex items-center justify-end space-x-1.5">
                          {inv.status !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(inv)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white transition inline-flex items-center space-x-1 shadow-sm active:scale-95"
                              title="Mark Paid"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Paid</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditInvoice(inv)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                            title="Edit Invoice"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoiceWithConfirm(inv)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}

      {/* SUB-TAB 3: Expenses List */}
      {subTab === 'expenses' && (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <tr>
                  <th className="py-4 pl-5 pr-3">Date</th>
                  <th className="px-3 py-4">Expense Category</th>
                  <th className="px-3 py-4">Vendor</th>
                  <th className="px-3 py-4">Amount ($)</th>
                  <th className="px-3 py-4">Recurring?</th>
                  <th className="px-3 py-4">Note</th>
                  <th className="py-4 pl-3 pr-5 text-right min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      No expenses recorded. Click &apos;+ Expense&apos; to log your operational tools and subscriptions.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-5 pr-3 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">{exp.date}</td>
                      <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">{exp.category}</td>
                      <td className="px-3 py-3.5 text-[#6324FC] dark:text-[#00E5FF] font-semibold">{exp.vendor}</td>
                      <td className="px-3 py-3.5 font-bold text-rose-600 dark:text-rose-400 text-base font-mono">${exp.amount.toLocaleString()}</td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {exp.isRecurring ? 'Yes (Monthly)' : 'No (One-time)'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 dark:text-slate-400 truncate max-w-xs text-xs sm:text-sm">{exp.note || '—'}</td>
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditExpense(exp)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                            title="Edit Expense"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpenseWithConfirm(exp)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
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
      )}

      {/* Add / Edit Invoice Modal */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-5">
              {editingInvoice ? `Edit Invoice #${editingInvoice.invoiceNumber}` : 'Create Client Retainer Invoice'}
            </h3>
            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
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
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all font-mono"
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Notes</label>
                <input
                  type="text"
                  placeholder="Notes or transaction reference..."
                  value={invNote}
                  onChange={(e) => setInvNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end space-x-3.5 pt-5 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCloseInvoiceModal}
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition active:scale-95"
                >
                  {editingInvoice ? 'Update Invoice' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-5">
              {editingExpense ? 'Edit Operating Expense' : 'Log Operating Expense'}
            </h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
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
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all font-mono"
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Notes</label>
                <input
                  type="text"
                  placeholder="Optional expense note..."
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end space-x-3.5 pt-5 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCloseExpenseModal}
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-500 transition shadow active:scale-95"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
