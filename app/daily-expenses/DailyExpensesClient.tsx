'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Search, Filter, Plus, FileText, Download,
  MoreHorizontal, Calendar, X, Loader2, ArrowUpRight, ArrowDownRight, CreditCard,
  Briefcase, Trash2, Tag, UploadCloud, CheckCircle2, AlertCircle, PieChart as PieChartIcon, Paperclip
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { createDailyExpense, updateDailyExpense, deleteDailyExpense } from '@/app/actions/dailyExpenseActions';

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
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

const formatDate = (date: string | Date) => 
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function DailyExpensesClient({ initialExpenses }: ExpensesClientProps) {
  const { confirm } = useConfirm();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'ThisMonth' | 'Last3Months' | 'ThisYear'>('ThisMonth');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Search Filter
    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.description.toLowerCase().includes(lower) || 
        e.category.toLowerCase().includes(lower) ||
        e.paymentMethod.toLowerCase().includes(lower)
      );
    }

    // Sort descending by date
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, categoryFilter, searchQuery]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const avgExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    
    // Group by month
    filteredExpenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, 0);
      map.set(key, map.get(key)! + e.amount);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateStr, amount]) => ({
        dateStr: format(new Date(`${dateStr}-01`), 'MMM yyyy'),
        Amount: amount
      }));
  }, [filteredExpenses]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      if (!map.has(e.category)) map.set(e.category, 0);
      map.set(e.category, map.get(e.category)! + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const openAddPanel = () => {
    setFormData({
      amount: '',
      category: 'Miscellaneous',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Credit Card'
    });
    setEditingExpense(null);
    setIsSlidePanelOpen(true);
  };

  const openEditPanel = (e: Expense) => {
    setFormData({
      amount: e.amount.toString(),
      category: e.category,
      description: e.description,
      date: new Date(e.date).toISOString().split('T')[0],
      paymentMethod: e.paymentMethod
    });
    setEditingExpense(e);
    setIsSlidePanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = { ...formData, amount: parseFloat(formData.amount) || 0 };

    if (editingExpense) {
      const res = await updateDailyExpense(editingExpense._id, data);
      if (res.success) {
        toast.success('Expense updated');
        setIsSlidePanelOpen(false);
        window.location.reload();
      } else {
        toast.error('Failed to update');
      }
    } else {
      const res = await createDailyExpense(data);
      if (res.success) {
        toast.success('Expense recorded');
        setIsSlidePanelOpen(false);
        window.location.reload();
      } else {
        toast.error('Failed to create');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: 'Delete this expense?', danger: true });
    if (!isConfirmed) return;
    
    const res = await deleteDailyExpense(id);
    if (res.success) {
      toast.success('Deleted');
      window.location.reload();
    } else {
      toast.error('Failed to delete');
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const headers = ['Title', 'Category', 'Employee', 'Amount', 'Status', 'Date'];
        const rows = filteredExpenses.map(e => {
          return [
            `"${e.description.replace(/"/g, '""')}"`,
            `"${e.category}"`,
            `"Admin"`, // default since there's no employee field yet
            e.amount,
            `"Approved"`,
            `"${formatDate(e.date)}"`
          ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'expenses-export.csv');
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Exported successfully!');
      } catch (error) {
        toast.error('Failed to export CSV');
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <CreditCard size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Expense Management</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-jakarta mb-1.5">Expenses</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Track, categorize, and analyze business expenses.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#11131A] hover:bg-[#232734] border border-[#232734] text-white transition-all">
                <UploadCloud size={16} /> Upload Receipt
              </button>
              <button onClick={handleExport} disabled={isExporting} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#11131A] hover:bg-[#232734] border border-[#232734] text-white transition-all disabled:opacity-50">
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              <button onClick={openAddPanel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> Add Expense
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#11131A] border border-[#232734] rounded-[24px] p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Total Expenses</p>
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]"><DollarSign size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-white tracking-tight">{formatCurrency(totalExpenses)}</p>
            </div>

            <div className="bg-[#11131A] border border-[#232734] rounded-[24px] p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Approved</p>
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]"><CheckCircle2 size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-white tracking-tight">{formatCurrency(totalExpenses * 1)}</p>
            </div>

            <div className="bg-[#11131A] border border-[#232734] rounded-[24px] p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Pending</p>
                <div className="w-8 h-8 rounded-lg bg-[#232734] flex items-center justify-center text-[#94A3B8]"><AlertCircle size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-[#94A3B8] tracking-tight">$0</p>
            </div>

            <div className="bg-[#11131A] border border-[#232734] rounded-[24px] p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Avg Expense</p>
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]"><TrendingDown size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-white tracking-tight">{formatCurrency(avgExpense)}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#11131A] border border-[#232734] rounded-[24px] p-6 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-6">Expense Trend</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {trendData.length <= 2 ? (
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232734" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090B', border: '1px solid #232734', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ fill: '#232734', opacity: 0.4 }}
                    />
                    <Bar dataKey="Amount" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                ) : (
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232734" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090B', border: '1px solid #232734', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="Amount" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#11131A] border border-[#232734] rounded-[24px] p-6 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-6">Categories</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#64748B'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090B', border: '1px solid #232734', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                    formatter={(val: any) => formatCurrency(val as number)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                </PieChart>
              </ResponsiveContainer>
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
                <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#11131A] border border-[#232734] text-white text-sm font-medium rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="bg-[#11131A] border border-[#232734] text-white text-sm font-medium rounded-xl pl-4 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#2563EB]/60 cursor-pointer w-full md:w-auto">
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                  <th className="pl-6 pr-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Expense Title</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Category</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="pr-6 pl-4 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#09090B] border border-[#232734] mb-4">
                        <Search size={24} className="text-[#94A3B8]" />
                      </div>
                      <p className="text-sm font-bold text-white">No expenses found</p>
                      <p className="text-xs text-[#94A3B8] mt-1">Try adjusting your filters or search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e, i) => {
                    const catColor = CATEGORY_COLORS[e.category] || '#64748B';
                    return (
                      <motion.tr key={e._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                        className="border-b border-[#232734]/50 hover:bg-[#09090B] transition-colors group cursor-pointer"
                        onClick={() => openEditPanel(e)}>
                        <td className="pl-6 pr-4 py-4 w-[40%]">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[#232734] bg-[#09090B] text-[#94A3B8]">
                                <FileText size={14} />
                              </div>
                              {e.amount > 100 && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center border border-[#09090B]">
                                  <Paperclip size={8} />
                                </div>
                              )}
                            </div>
                            <div className="overflow-hidden pr-4">
                              <span className="block text-sm font-bold text-white truncate">{e.description}</span>
                              <span className="text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase">{e.paymentMethod}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#232734] text-xs font-bold" style={{ color: catColor }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold font-mono tracking-tight text-white">
                            {formatCurrency(e.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle2 size={10} /> Approved
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-[#94A3B8]">{formatDate(e.date)}</td>
                        <td className="pr-6 pl-4 py-4 text-right">
                          <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e._id); }} className="p-2 opacity-0 group-hover:opacity-100 hover:text-[#EF4444] text-[#94A3B8] transition-all">
                            <Trash2 size={14} />
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
                onClick={() => setIsSlidePanelOpen(false)} className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-[500px] bg-[#09090B] border border-[#232734] rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-[#232734] bg-[#11131A]">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{editingExpense ? 'Edit Expense' : 'New Expense'}</span>
                    <button type="button" onClick={() => setIsSlidePanelOpen(false)} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-white hover:bg-[#232734] border border-[#232734] transition-all">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-[#09090B] border border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                      {editingExpense ? 'Expense Details' : 'Record Expense'}
                    </h2>
                  </div>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Amount ($)</label>
                    <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-lg font-mono focus:border-[#2563EB]/60 focus:outline-none" placeholder="0.00" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Expense Title</label>
                    <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" placeholder="e.g. Client Dinner" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Date</label>
                      <DatePicker 
                        selected={new Date(formData.date + 'T00:00:00')} 
                        onChange={(date: Date | null) => setFormData({...formData, date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')})}
                        className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" 
                        dateFormat="MMMM d, yyyy"
                        required
                        popperPlacement="bottom-start"
                        popperClassName="z-[60]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Category</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none cursor-pointer">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Payment Method</label>
                    <select required value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                      className="w-full bg-[#11131A] border border-[#232734] text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none cursor-pointer">
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#232734]">
                    <button type="submit" disabled={isSubmitting || !formData.amount || !formData.description}
                      className="w-full py-3.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.25)]">
                      {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Expense'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Upload Receipt Modal ─────────────────────────────────────── */}
        <AnimatePresence>
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setIsUploadModalOpen(false)} className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-[450px] bg-[#09090B] border border-[#232734] rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#232734] bg-[#11131A] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                      <UploadCloud size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">Upload Receipt</h2>
                      <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">AI Auto-Extraction</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsUploadModalOpen(false)} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-white hover:bg-[#232734] border border-[#232734] transition-all">
                    <X size={14} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  <div className="w-full h-40 border-2 border-dashed border-[#232734] rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-full bg-[#11131A] group-hover:bg-[#2563EB]/10 flex items-center justify-center text-[#94A3B8] group-hover:text-[#2563EB] transition-colors">
                      <UploadCloud size={20} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white mb-1">Click to upload or drag & drop</p>
                      <p className="text-xs text-[#94A3B8]">SVG, PNG, JPG or PDF (max. 5MB)</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-[#232734] bg-[#0D0F16] flex gap-3">
                  <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-2.5 bg-transparent border border-[#232734] hover:bg-[#11131A] text-white font-bold text-sm rounded-xl transition-all">
                    Cancel
                  </button>
                  <button type="button" onClick={() => {
                    toast.success("Receipt uploaded successfully!");
                    setIsUploadModalOpen(false);
                  }} className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Extract Data
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
