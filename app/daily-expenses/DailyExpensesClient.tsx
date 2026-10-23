'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Search, Plus, FileText, Download,
  Calendar, X, Loader2, CreditCard,
  Trash2, UploadCloud, CheckCircle2, AlertCircle, Paperclip, TrendingDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { notify } from '@/lib/notify';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { createDailyExpense, updateDailyExpense, deleteDailyExpense } from '@/app/actions/dailyExpenseActions';
import BorrowLendTab from '@/components/expenses/BorrowLendTab';
import { useScrollLock } from '@/lib/useScrollLock';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
}

interface ExpensesClientProps {
  initialExpenses: Expense[];
  initialLoans: any[];
}

// ─── Configs ──────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#F59E0B',
  'Transportation': '#3B82F6',
  'Office Supplies': '#10B981',
  'Utilities': '#8B5CF6',
  'Shopping': '#EC4899',
  'Entertainment': '#6366F1',
  'Healthcare': '#EF4444',
  'Software & Subscriptions': '#14B8A6',
  'Miscellaneous': '#64748B',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Banking', 'Bank Transfer'];

// ─── Formatter Helpers ────────────────────────────────────────────────────────
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);

const formatDate = (date: string | Date) => 
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function DailyExpensesClient({ initialExpenses, initialLoans }: ExpensesClientProps) {
  const { confirm } = useConfirm();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [activeTab, setActiveTab] = useState<'expenses' | 'loans'>('expenses');
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'ThisMonth' | 'Last3Months' | 'ThisYear'>('ThisMonth');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  useScrollLock(isSlidePanelOpen || isUploadModalOpen);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Miscellaneous',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Credit Card'
  });

  useEffect(() => { setExpenses(initialExpenses); }, [initialExpenses]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    const now = new Date();

    // Date Filter
    if (dateFilter !== 'All') {
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      if (dateFilter === 'Last3Months') startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      if (dateFilter === 'ThisYear') startDate = new Date(now.getFullYear(), 0, 1);

      result = result.filter(e => new Date(e.date) >= startDate);
    }

    // Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.description.toLowerCase().includes(q) || 
        e.category.toLowerCase().includes(q) ||
        e.paymentMethod.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, categoryFilter, searchQuery]);

  // Metrics
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  const avgExpense = useMemo(() => filteredExpenses.length ? Math.round(totalExpenses / filteredExpenses.length) : 0, [filteredExpenses, totalExpenses]);

  // Charts
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const d = new Date(e.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(k, (map.get(k) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-14)
      .map(([dateStr, Amount]) => ({ dateStr: formatDate(dateStr), Amount }));
  }, [filteredExpenses]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openAddPanel = () => {
    setEditingExpense(null);
    setFormData({
      amount: '',
      category: 'Miscellaneous',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Credit Card'
    });
    setIsSlidePanelOpen(true);
  };

  const openEditPanel = (e: Expense) => {
    setEditingExpense(e);
    setFormData({
      amount: e.amount.toString(),
      category: e.category,
      description: e.description,
      date: new Date(e.date).toISOString().split('T')[0],
      paymentMethod: e.paymentMethod
    });
    setIsSlidePanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: new Date(formData.date).toISOString(),
      paymentMethod: formData.paymentMethod
    };

    if (editingExpense) {
      notify.edit('Expense updated');
      setIsSlidePanelOpen(false);
      const res = await updateDailyExpense(editingExpense._id, payload);
      if (res.success) {
        setExpenses(expenses.map(x => x._id === editingExpense._id ? { ...x, ...payload } : x));
      } else {
        notify.error(res.error || 'Failed to update');
      }
    } else {
      // 🚀 0ms ZERO-DELAY INSTANT FEEDBACK (Sound + Toast + Topbar Badge)
      notify.instant({
        type: 'system',
        sound: 'expense',
        message: `A new expense of $${payload.amount} has been added under ${payload.category}.`,
        link: '/daily-expenses'
      });
      setIsSlidePanelOpen(false);

      const res = await createDailyExpense(payload);
      if (res.success && res.data) {
        setExpenses(prev => [res.data, ...prev]);
      } else {
        notify.error(res.error || 'Failed to create');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense record? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    notify.delete('Expense deleted');
    const res = await deleteDailyExpense(id);
    if (res.success) {
      setExpenses(expenses.filter(e => e._id !== id));
    } else {
      notify.error('Failed to delete expense');
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const headers = ['Date', 'Description', 'Category', 'Payment Method', 'Amount'];
      const rows = filteredExpenses.map(e => [
        `"${formatDate(e.date)}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        `"${e.paymentMethod}"`,
        e.amount
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `daily-expenses-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Expenses exported successfully');
    } catch {
      toast.error('Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] p-4 md:p-8 selection:bg-[#6324FC]/30">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                  <DollarSign size={16} />
                </div>
                <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Financial Operations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Daily Expenses</h1>
              <p className="text-xs text-secondary font-medium">Track operational costs, company expenditures, and loans.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center bg-slate-100 dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-1">
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs' : 'text-secondary hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setActiveTab('loans')}
                  className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs transition-all ${activeTab === 'loans' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs' : 'text-secondary hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Borrow & Lend
                </button>
              </div>
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white transition-all shadow-xs">
                <UploadCloud size={14} /> Upload Receipt
              </button>
              <button onClick={handleExport} disabled={isExporting} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white transition-all disabled:opacity-50 shadow-xs">
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              {activeTab === 'expenses' && (
                <button onClick={openAddPanel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white shadow-[0_0_20px_rgba(99,36,252,0.4)] transition-all">
                  <Plus size={15} strokeWidth={2.5} /> Add Expense
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {activeTab === 'expenses' ? (
          <>
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:border-[#6324FC]/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Total Expenses</p>
                <div className="w-8 h-8 rounded-xl bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]"><DollarSign size={15} /></div>
              </div>
              <p className="text-2xl font-heading font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalExpenses)}</p>
            </div>

            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:border-[#6324FC]/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Approved</p>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CheckCircle2 size={15} /></div>
              </div>
              <p className="text-2xl font-heading font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalExpenses)}</p>
            </div>

            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:border-[#6324FC]/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Pending</p>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-secondary"><AlertCircle size={15} /></div>
              </div>
              <p className="text-2xl font-heading font-extrabold font-mono text-secondary tracking-tight">৳0</p>
            </div>

            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:border-[#6324FC]/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Avg Expense</p>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><TrendingDown size={15} /></div>
              </div>
              <p className="text-2xl font-heading font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(avgExpense)}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col shadow-sm">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Expense Trend</h3>
            <div className="flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                {trendData.length <= 2 ? (
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-black/5 dark:text-white/5" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `৳${v/1000}k`} />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl p-2.5 shadow-lg">
                              <p className="text-[10px] font-heading font-bold text-secondary mb-0.5">{label}</p>
                              <p className="text-xs font-heading font-extrabold font-mono text-slate-900 dark:text-white">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Amount" fill="#6324FC" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                ) : (
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6324FC" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6324FC" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-black/5 dark:text-white/5" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `৳${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl p-2.5 shadow-lg">
                              <p className="text-[10px] font-heading font-bold text-secondary mb-0.5">{label}</p>
                              <p className="text-xs font-heading font-extrabold font-mono text-slate-900 dark:text-white">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="Amount" stroke="#6324FC" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col shadow-sm">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Categories</h3>
            <div className="flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#64748B'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                    formatter={(val: any) => formatCurrency(val as number)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94A3B8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Filters & Table ──────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row gap-3 justify-between items-center bg-white dark:bg-[#0a0a0d]">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" />
                <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-3.5 py-2 focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer w-full md:w-auto">
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}
                className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer w-full md:w-auto">
                <option value="All">All Time</option>
                <option value="ThisMonth">This Month</option>
                <option value="Last3Months">Last 3 Months</option>
                <option value="ThisYear">This Year</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/50 dark:bg-[#060608]/50 border-b border-black/5 dark:border-white/5">
                <tr>
                  <th className="pl-5 pr-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Expense Title</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="pr-5 pl-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 mb-3">
                        <Search size={20} className="text-secondary" />
                      </div>
                      <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">No expenses found</p>
                      <p className="text-[11px] text-secondary mt-0.5">Try adjusting your filters or search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e, i) => {
                    const catColor = CATEGORY_COLORS[e.category] || '#64748B';
                    return (
                      <motion.tr key={e._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        onClick={() => openEditPanel(e)}>
                        <td className="pl-5 pr-4 py-3.5 w-[40%]">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-secondary">
                                <FileText size={13} />
                              </div>
                              {e.amount > 100 && (
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#6324FC] text-white flex items-center justify-center border border-white dark:border-[#0a0a0d]">
                                  <Paperclip size={7} />
                                </div>
                              )}
                            </div>
                            <div className="overflow-hidden pr-3">
                              <span className="block font-heading font-bold text-slate-900 dark:text-white truncate group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{e.description}</span>
                              <span className="text-[9px] text-secondary font-mono uppercase">{e.paymentMethod}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-heading font-bold border border-black/5 dark:border-white/5" style={{ color: catColor }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-heading font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                            {formatCurrency(e.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-heading font-bold uppercase tracking-widest">
                            <CheckCircle2 size={10} /> Approved
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-secondary font-mono text-[11px]">{formatDate(e.date)}</td>
                        <td className="pr-5 pl-4 py-3.5 text-right">
                          <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e._id); }} className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 text-secondary transition-all">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        {/* ── Centered Modal (Add / Edit) ───────────────────────────────── */}
        <AnimatePresence>
          {isSlidePanelOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setIsSlidePanelOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex-shrink-0 p-5 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0d]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">{editingExpense ? 'Edit Expense' : 'New Expense'}</span>
                    <button type="button" onClick={() => setIsSlidePanelOpen(false)} className="p-1.5 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] flex-shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <h2 className="text-base font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                      {editingExpense ? 'Expense Details' : 'Record Expense'}
                    </h2>
                  </div>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  
                  <div>
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Amount (৳)</label>
                    <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-base font-mono focus:border-[#6324FC] focus:outline-none" placeholder="0.00" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Expense Title</label>
                    <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-[#6324FC] focus:outline-none placeholder:text-secondary" placeholder="e.g. Client Dinner" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Date</label>
                      <DatePicker 
                        selected={formData.date && !isNaN(new Date(formData.date).getTime()) ? new Date(formData.date) : null} 
                        onChange={(date: Date | null) => setFormData({...formData, date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-[#6324FC] focus:outline-none" 
                        dateFormat="MMMM d, yyyy"
                        required
                        popperPlacement="bottom-start"
                        popperClassName="z-[60]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Category</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold focus:border-[#6324FC] focus:outline-none appearance-none cursor-pointer">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Payment Method</label>
                    <select required value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold focus:border-[#6324FC] focus:outline-none appearance-none cursor-pointer">
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5">
                    <button type="submit" disabled={isSubmitting || !formData.amount || !formData.description}
                      className="w-full py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,36,252,0.4)]">
                      {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Expense'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <BorrowLendTab initialLoans={initialLoans} />
          </motion.div>
        )}

        {/* ── Upload Receipt Modal ─────────────────────────────────────── */}
        <AnimatePresence>
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setIsUploadModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-md bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0d] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <UploadCloud size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">Upload Receipt</h2>
                      <p className="text-[9px] text-secondary font-heading font-bold uppercase tracking-widest">AI Auto-Extraction</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsUploadModalOpen(false)} className="p-1.5 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all">
                    <X size={14} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <div className="w-full h-36 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#6324FC]/50 hover:bg-[#6324FC]/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 group-hover:bg-[#6324FC]/10 flex items-center justify-center text-secondary group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
                      <UploadCloud size={18} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-0.5">Click to upload or drag & drop</p>
                      <p className="text-[10px] text-secondary font-mono">SVG, PNG, JPG or PDF (max. 5MB)</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-[#060608]/50 flex gap-2.5 rounded-b-3xl">
                  <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-heading font-bold text-xs rounded-xl transition-all shadow-xs">
                    Cancel
                  </button>
                  <button type="button" onClick={() => {
                    toast.success("Receipt uploaded successfully!");
                    setIsUploadModalOpen(false);
                  }} className="flex-1 py-2 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} /> Extract Data
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
}
