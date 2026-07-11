'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Search, Filter, Plus, FileText, Download,
  MoreHorizontal, Calendar, X, Loader2, ArrowUpRight, ArrowDownRight, CreditCard,
  Briefcase, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

import { createTransaction, updateTransaction, deleteTransaction } from '@/app/actions/transactionActions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  _id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string | Date;
  category: string;
  description: string;
  platform: string;
}

interface MoneyClientProps {
  initialTransactions: Transaction[];
  platformSummary: any;
  projectAnalytics: any; // We'll pass projectAnalytics from page.tsx to render within MoneyClient
}

// ─── Formatter Helpers ────────────────────────────────────────────────────────
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

const formatDate = (date: string | Date) => 
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MoneyClient({ initialTransactions, platformSummary, projectAnalytics }: MoneyClientProps) {
  const { confirm } = useConfirm();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'ThisMonth' | 'Last3Months' | 'ThisYear'>('ThisMonth');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: 'Income',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Sales',
    description: '',
    platform: 'Direct'
  });

  useEffect(() => { setTransactions(initialTransactions); }, [initialTransactions]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    const now = new Date();

    // Date Filter
    if (dateFilter !== 'All') {
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      if (dateFilter === 'Last3Months') startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      if (dateFilter === 'ThisYear') startDate = new Date(now.getFullYear(), 0, 1);

      result = result.filter(t => new Date(t.date) >= startDate);
    }

    // Type Filter
    if (typeFilter !== 'All') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Search Filter
    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(lower) || 
        t.category.toLowerCase().includes(lower) ||
        t.platform.toLowerCase().includes(lower)
      );
    }

    // Sort descending by date
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, typeFilter, searchQuery]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalIncome = filteredTransactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const map = new Map<string, { dateStr: string; Income: number; Expense: number }>();
    
    // Group by month
    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { dateStr: format(d, 'MMM yyyy'), Income: 0, Expense: 0 });
      
      const item = map.get(key)!;
      if (t.type === 'Income') item.Income += t.amount;
      else item.Expense += t.amount;
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => entry[1]);
  }, [filteredTransactions]);

  const profitChartData = chartData.map(d => ({
    name: d.dateStr,
    Profit: d.Income - d.Expense
  }));

  // ── Actions ─────────────────────────────────────────────────────────────────
  const openAddPanel = () => {
    setFormData({
      type: 'Income',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Sales',
      description: '',
      platform: 'Direct'
    });
    setEditingTransaction(null);
    setIsSlidePanelOpen(true);
  };

  const openEditPanel = (t: Transaction) => {
    setFormData({
      type: t.type,
      amount: t.amount.toString(),
      date: new Date(t.date).toISOString().split('T')[0],
      category: t.category,
      description: t.description,
      platform: t.platform
    });
    setEditingTransaction(t);
    setIsSlidePanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = { ...formData, amount: parseFloat(formData.amount) || 0 };

    if (editingTransaction) {
      const res = await updateTransaction(editingTransaction._id, data);
      if (res.success) {
        toast.success('Transaction updated');
        setIsSlidePanelOpen(false);
        window.location.reload();
      } else {
        toast.error('Failed to update');
      }
    } else {
      const res = await createTransaction(data);
      if (res.success) {
        toast.success('Transaction created');
        setIsSlidePanelOpen(false);
        window.location.reload();
      } else {
        toast.error('Failed to create');
      }
    }
    setIsSubmitting(false);
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = { ...formData, amount: parseFloat(formData.amount) || 0 };
    const res = await createTransaction(data);
    if (res.success) {
      toast.success('Transaction added');
      setFormData({ type: 'Income', amount: '', date: new Date().toISOString().split('T')[0], category: 'Sales', description: '', platform: 'Direct' });
      window.location.reload();
    } else {
      toast.error('Failed to create');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: 'Delete this transaction?', danger: true });
    if (!isConfirmed) return;
    
    const res = await deleteTransaction(id);
    if (res.success) {
      toast.success('Deleted');
      window.location.reload();
    } else {
      toast.error('Failed to delete');
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                  <DollarSign size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Financial Overview</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-jakarta mb-1.5">Finance Dashboard</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Manage revenue, expenses, and track cash flow.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#11131A] hover:bg-[#232734] border border-[#232734] text-white transition-all">
                <Download size={16} /> Export
              </button>
              <button onClick={openAddPanel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> Add Transaction
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#11131A] border border-[#10B981]/20 rounded-[24px] p-6 relative overflow-hidden group shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_25px_rgba(16,185,129,0.1)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10B981]/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Total Revenue</p>
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <p className="text-4xl lg:text-5xl font-bold font-mono text-white tracking-tight drop-shadow-md">{formatCurrency(totalIncome)}</p>
            </div>

            <div className="bg-[#11131A] border border-[#EF4444]/20 rounded-[24px] p-6 relative overflow-hidden group shadow-[0_0_15px_rgba(239,68,68,0.05)] hover:shadow-[0_0_25px_rgba(239,68,68,0.1)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#EF4444]/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Total Expenses</p>
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                  <ArrowDownRight size={16} />
                </div>
              </div>
              <p className="text-4xl lg:text-5xl font-bold font-mono text-white tracking-tight drop-shadow-md">{formatCurrency(totalExpense)}</p>
            </div>

            <div className="bg-[#11131A] border border-[#2563EB]/20 rounded-[24px] p-6 relative overflow-hidden group shadow-[0_0_15px_rgba(37,99,235,0.05)] hover:shadow-[0_0_25px_rgba(37,99,235,0.1)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#2563EB]/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Net Profit</p>
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                  <Briefcase size={16} />
                </div>
              </div>
              <p className="text-4xl lg:text-5xl font-bold font-mono text-white tracking-tight drop-shadow-md">{formatCurrency(netProfit)}</p>
            </div>

            <div className="bg-[#11131A] border border-[#7C3AED]/20 rounded-[24px] p-6 relative overflow-hidden group shadow-[0_0_15px_rgba(124,58,237,0.05)] hover:shadow-[0_0_25px_rgba(124,58,237,0.1)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#7C3AED]/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Cash Flow Ratio</p>
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                  <TrendingUp size={16} />
                </div>
              </div>
              <p className="text-4xl lg:text-5xl font-bold font-mono text-white tracking-tight drop-shadow-md">
                {totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0}%
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#11131A] border border-[#232734] rounded-[24px] p-6 flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-6">Revenue vs Expenses</h3>
            <div className="flex-1 min-h-[300px] relative">
              {filteredTransactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                      <path d="M0,50 Q25,10 50,30 T100,5" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" />
                      <path d="M0,50 Q25,40 50,45 T100,30" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>
                  </div>
                  <button onClick={openAddPanel} className="z-10 bg-[#09090B]/80 backdrop-blur-md border border-[#232734] px-5 py-3 rounded-2xl flex items-center gap-3 hover:border-[#2563EB]/50 hover:shadow-[0_0_24px_rgba(37,99,235,0.2)] transition-all shadow-xl">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                      <Plus size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Add your first transaction</p>
                      <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">To generate insights</p>
                    </div>
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232734" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090B', border: '1px solid #232734', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="Expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#11131A] border border-[#232734] rounded-[24px] p-6 flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-6">Profit Trend</h3>
            <div className="flex-1 min-h-[300px] relative">
              {filteredTransactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 pointer-events-none flex items-end justify-between px-4 pb-4 gap-2">
                    {[20, 40, 30, 60, 45, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#10B981] rounded-t-md" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232734" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090B', border: '1px solid #232734', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                      cursor={{ fill: '#232734', opacity: 0.4 }}
                    />
                    <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>
                      {profitChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Profit >= 0 ? '#10B981' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Filters & Table ──────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-[#11131A] border border-[#232734] rounded-[24px] overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-6 border-b border-[#232734] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0D0F16]">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
                <input type="text" placeholder="Search transactions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#11131A] border border-[#232734] text-white text-sm font-medium rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                className="bg-[#11131A] border border-[#232734] text-white text-sm font-medium rounded-xl pl-4 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#2563EB]/60 cursor-pointer w-full md:w-auto">
                <option value="All">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}
                className="bg-[#11131A] border border-[#232734] text-white text-sm font-medium rounded-xl pl-4 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#2563EB]/60 cursor-pointer w-full md:w-auto">
                <option value="All">All Time</option>
                <option value="ThisMonth">This Month</option>
                <option value="Last3Months">Last 3 Months</option>
                <option value="ThisYear">This Year</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#09090B]">
                <tr className="border-b border-[#232734]">
                  <th className="pl-6 pr-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Transaction</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Category</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Platform</th>
                  <th className="pr-6 pl-4 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {/* ── Inline Quick Add Row ── */}
                <tr className="border-b border-[#232734]/80 bg-[#11131A] focus-within:bg-[#1C1F2E] transition-colors relative z-10 shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
                  <td className="pl-6 pr-4 py-3">
                    <form id="inline-form" onSubmit={handleInlineSubmit} className="hidden" />
                    <input form="inline-form" required type="text" placeholder="Add new transaction..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-transparent border border-dashed border-[#232734] focus:border-[#2563EB]/50 text-white text-sm font-bold rounded-lg px-3 py-2 focus:outline-none transition-colors placeholder:text-[#475569]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select form="inline-form" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                        className="bg-[#09090B] border border-dashed border-[#232734] focus:border-[#2563EB]/50 text-[#94A3B8] text-sm font-bold rounded-lg px-1 py-2 focus:outline-none transition-colors w-12 cursor-pointer appearance-none text-center">
                        <option value="Income">+</option>
                        <option value="Expense">-</option>
                      </select>
                      <input form="inline-form" required type="number" step="0.01" min="0" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        className="w-24 bg-transparent border border-dashed border-[#232734] focus:border-[#2563EB]/50 text-white text-sm font-mono font-bold rounded-lg px-3 py-2 focus:outline-none transition-colors" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select form="inline-form" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-24 bg-transparent border border-dashed border-[#232734] focus:border-[#2563EB]/50 text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-2 focus:outline-none transition-colors cursor-pointer">
                      <option value="Sales">Sales</option>
                      <option value="Services">Services</option>
                      <option value="Software">Software</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Salary">Salary</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input form="inline-form" required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-32 bg-transparent border border-dashed border-[#232734] focus:border-[#2563EB]/50 text-[#94A3B8] text-xs font-bold rounded-lg px-3 py-2 focus:outline-none transition-colors" />
                  </td>
                  <td className="px-4 py-3">
                    <select form="inline-form" required value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-24 bg-transparent border border-dashed border-[#232734] focus:border-[#2563EB]/50 text-[#94A3B8] text-xs font-bold rounded-lg px-2 py-2 focus:outline-none transition-colors cursor-pointer">
                      <option value="Direct">Direct</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </td>
                  <td className="pr-6 pl-4 py-3 text-right">
                    <button form="inline-form" type="submit" disabled={isSubmitting || !formData.amount || !formData.description}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-lg transition-colors font-bold text-xs disabled:opacity-50 shadow-md">
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                    </button>
                  </td>
                </tr>

                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#09090B] border border-[#232734] mb-4">
                        <Search size={24} className="text-[#94A3B8]" />
                      </div>
                      <p className="text-sm font-bold text-white">No transactions found</p>
                      <p className="text-xs text-[#94A3B8] mt-1">Try adjusting your filters or search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, i) => (
                    <motion.tr key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                      className="border-b border-[#232734]/50 hover:bg-[#09090B] transition-colors group cursor-pointer"
                      onClick={() => openEditPanel(t)}>
                      <td className="pl-6 pr-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            t.type === 'Income' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                          }`}>
                            {t.type === 'Income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          </div>
                          <span className="text-sm font-bold text-white truncate max-w-[200px]">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-bold font-mono tracking-tight ${t.type === 'Income' ? 'text-[#10B981]' : 'text-white'}`}>
                          {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2 py-1 rounded-md bg-[#232734] text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-[#94A3B8]">{formatDate(t.date)}</td>
                      <td className="px-4 py-4 text-xs font-bold text-[#94A3B8]">{t.platform}</td>
                      <td className="pr-6 pl-4 py-4 text-right">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }} className="p-2 opacity-0 group-hover:opacity-100 hover:text-[#EF4444] text-[#94A3B8] transition-all">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        {/* ── Right Slide Panel (Add / Edit) ───────────────────────────────── */}
        <AnimatePresence>
          {isSlidePanelOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setIsSlidePanelOpen(false)} className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-50" />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-[#09090B] border-l border-[#232734] z-50 flex flex-col shadow-2xl"
              >
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-[#232734] bg-[#11131A]">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</span>
                    <button onClick={() => setIsSlidePanelOpen(false)} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-white hover:bg-[#232734] border border-[#232734] transition-all">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-[#09090B] border border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                      {editingTransaction ? 'Update Details' : 'Record Finance'}
                    </h2>
                  </div>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  
                  {/* Type Selector */}
                  <div className="flex bg-[#11131A] p-1 rounded-xl border border-[#232734]">
                    <button type="button" onClick={() => setFormData({...formData, type: 'Income'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.type === 'Income' ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'text-[#94A3B8] hover:text-white'}`}>
                      Income
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'Expense'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.type === 'Expense' ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30' : 'text-[#94A3B8] hover:text-white'}`}>
                      Expense
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Amount ($)</label>
                    <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-lg font-mono focus:border-[#2563EB]/60 focus:outline-none" placeholder="0.00" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Description</label>
                    <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" placeholder="e.g. Website Redesign Deposit" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Date</label>
                      <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Category</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none">
                        <option value="Sales">Sales</option>
                        <option value="Services">Services</option>
                        <option value="Software">Software</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Salary">Salary</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Platform / Account</label>
                    <select required value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none">
                      <option value="Direct">Direct (Bank/Stripe)</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#232734]">
                    <button type="submit" disabled={isSubmitting || !formData.amount || !formData.description}
                      className="w-full py-3.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.25)]">
                      {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Transaction'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
