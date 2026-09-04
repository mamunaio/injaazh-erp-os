'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Search, Filter, Plus, FileText, Download,
  MoreHorizontal, Calendar, X, Loader2, ArrowUpRight, ArrowDownRight, CreditCard,
  Briefcase, Trash2, Sparkles, Zap, ShieldCheck, CheckCircle2, AlertTriangle, 
  Layers, PieChart as PieChartIcon, RefreshCw, ChevronRight, BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { format } from 'date-fns';
import { notify } from '@/lib/notify';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

import { createTransaction, updateTransaction, deleteTransaction } from '@/app/actions/transactionActions';
import { analyzeFinancialHealth } from '@/app/actions/aiActions';

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
  projectAnalytics: any;
}

// ─── Formatter Helpers ────────────────────────────────────────────────────────
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

const formatDate = (date: string | Date) => 
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function FinanceClient({ initialTransactions, platformSummary, projectAnalytics }: MoneyClientProps) {
  const { confirm } = useConfirm();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'ThisMonth' | 'Last3Months' | 'ThisYear'>('ThisMonth');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Diagnostic State
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    type: 'Income' | 'Expense';
    amount: string;
    date: string;
    category: string;
    description: string;
    platform: string;
  }>({
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

  // ── KPIs (Filtered Period) ──────────────────────────────────────────────────
  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
  const totalExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // All-time KPIs for Global Summary
  const allTimeIncome = useMemo(() => transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const allTimeExpense = useMemo(() => transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const allTimeProfit = allTimeIncome - allTimeExpense;

  // ── AI Financial Health Trigger ─────────────────────────────────────────────
  const handleRunAiDiagnostic = async () => {
    setIsLoadingAi(true);
    toast.loading('Analyzing cash flow with Gemini AI...', { id: 'ai-finance' });
    try {
      const categoryMap = new Map<string, number>();
      filteredTransactions.forEach(t => {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
      });
      const topCategories = Array.from(categoryMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const res = await analyzeFinancialHealth({
        totalIncome,
        totalExpense,
        netProfit,
        profitMarginPercent: profitMargin,
        timeframe: dateFilter === 'ThisMonth' ? 'Current Month' : dateFilter === 'Last3Months' ? 'Last 3 Months' : dateFilter === 'ThisYear' ? 'Current Year' : 'All Time',
        topCategories,
        platformBreakdown: platformSummary || projectAnalytics,
      });

      if (res.success && res.data) {
        setAiReport(res.data);
        toast.success('AI Financial Health diagnostic complete!', { id: 'ai-finance' });
      } else {
        toast.error(res.error || 'Diagnostic failed', { id: 'ai-finance' });
      }
    } catch {
      toast.error('Failed to run AI diagnostic', { id: 'ai-finance' });
    } finally {
      setIsLoadingAi(false);
    }
  };

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const map = new Map<string, { dateStr: string; Income: number; Expense: number }>();
    
    // Group by month
    transactions.forEach(t => {
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
  }, [transactions]);

  const profitChartData = chartData.map(d => ({
    name: d.dateStr,
    Profit: d.Income - d.Expense
  }));

  // ── Platform Totals ─────────────────────────────────────────────────────────
  const platformStats = useMemo(() => {
    const platforms: Record<string, number> = { 'Direct': 0, 'Upwork': 0, 'Fiverr': 0, 'Freelancer': 0 };
    filteredTransactions.filter(t => t.type === 'Income').forEach(t => {
      const p = t.platform || 'Direct';
      platforms[p] = (platforms[p] || 0) + t.amount;
    });
    return platforms;
  }, [filteredTransactions]);

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
        setTransactions(prev => prev.map(t => t._id === editingTransaction._id ? { ...t, ...data } : t));
      } else {
        toast.error(res.error || 'Failed to update');
      }
    } else {
      const res = await createTransaction(data);
      if (res.success) {
        toast.success(data.type === 'Income' ? 'Income recorded!' : 'Expense recorded!');
        setIsSlidePanelOpen(false);
        if (res.data) setTransactions(prev => [res.data, ...prev]);
      } else {
        toast.error(res.error || 'Failed to create');
      }
    }
    setIsSubmitting(false);
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = { ...formData, amount: parseFloat(formData.amount) || 0 };
    if (!data.description.trim()) {
      data.description = data.category + ' Transaction';
    }
    const res = await createTransaction(data);
    if (res.success) {
      toast.success(data.type === 'Income' ? 'Income recorded!' : 'Expense recorded!');
      setFormData({ type: 'Income', amount: '', date: new Date().toISOString().split('T')[0], category: 'Sales', description: '', platform: 'Direct' });
      if (res.data) setTransactions(prev => [res.data, ...prev]);
    } else {
      toast.error(res.error || 'Failed to create');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: 'Delete this transaction entry?', danger: true });
    if (!isConfirmed) return;
    
    const res = await deleteTransaction(id);
    if (res.success) {
      toast.success('Transaction deleted');
      setTransactions(prev => prev.filter(t => t._id !== id));
    } else {
      toast.error(res.error || 'Failed to delete');
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const headers = ['Transaction Title', 'Amount', 'Category', 'Date', 'Platform'];
        const rows = filteredTransactions.map(t => {
          return [
            `"${t.description.replace(/"/g, '""')}"`,
            t.type === 'Income' ? t.amount : -t.amount,
            `"${t.category}"`,
            `"${formatDate(t.date)}"`,
            `"${t.platform}"`
          ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `finance-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Finance CSV exported successfully!');
      } catch {
        toast.error('Failed to export CSV');
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm">
                  <DollarSign size={18} />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Finance & Cash Flow Studio</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">
                Financial Operations
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Live cash flow analytics, AI burn rate diagnostics, and platform revenues.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button 
                onClick={handleRunAiDiagnostic}
                disabled={isLoadingAi}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
              >
                {isLoadingAi ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-300" />}
                <span>AI Health Diagnostic</span>
              </button>

              <Link href="/finance/invoices" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 transition-all">
                <FileText size={16} /> Manage Invoices
              </Link>
              
              <button onClick={handleExport} disabled={isExporting} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#11131A] hover:bg-slate-100 dark:hover:bg-[#1A1D27] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50 shadow-sm">
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              
              <button onClick={openAddPanel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 transition-all">
                <Plus size={16} strokeWidth={2.5} /> Record Entry
              </button>
            </div>
          </motion.div>

          {/* ── AI Executive Financial Health Card ───────────────────────────── */}
          {aiReport && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-[24px] mb-6 bg-gradient-to-br from-indigo-900/20 via-slate-900/60 to-purple-900/20 border border-indigo-500/30 backdrop-blur-xl relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Gemini Fractional CFO Diagnostic
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Score: {aiReport.financialHealthScore}/100
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Cash Flow Status: <strong className="text-emerald-400">{aiReport.cashFlowStatus}</strong> • Margin: <strong className="text-indigo-300">{profitMargin.toFixed(1)}%</strong></p>
                  </div>
                </div>

                <button 
                  onClick={handleRunAiDiagnostic}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                >
                  <RefreshCw size={12} className={isLoadingAi ? 'animate-spin' : ''} /> Refresh Analysis
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Burn Rate & Stability
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{aiReport.burnRateAssessment}</p>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Zap size={14} /> Growth Opportunity
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{aiReport.growthOpportunity}</p>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Strategic Next Steps
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {(aiReport.strategicRecommendations || []).slice(0, 2).map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Period Revenue', value: formatCurrency(totalIncome), icon: ArrowUpRight, color: '#10B981', trend: '+14%', data: [40, 30, 50, 40, 60, 50, 70, 60, 80, 70, 90] },
              { title: 'Period Expenses', value: formatCurrency(totalExpense), icon: ArrowDownRight, color: '#EF4444', trend: '-4%', data: [60, 50, 70, 60, 80, 70, 90, 80, 100, 90, 110] },
              { title: 'Net Profit', value: formatCurrency(netProfit), icon: Briefcase, color: '#2563EB', trend: '+18%', data: [30, 20, 40, 30, 50, 40, 60, 50, 70, 60, 80] },
              { title: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, icon: TrendingUp, color: '#7C3AED', trend: profitMargin >= 30 ? 'Healthy' : 'Standard', data: [50, 40, 60, 50, 70, 60, 80, 70, 90, 80, 100] }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 flex flex-col justify-center relative overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none">
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: kpi.color }} />
                
                {/* Background Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-14 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.data.map((val, i) => ({ val, i }))}>
                      <defs>
                        <linearGradient id={`gradient-fin-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={kpi.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="val" stroke={kpi.color} fill={`url(#gradient-fin-${idx})`} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{kpi.title}</p>
                    <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{kpi.value}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color, borderColor: `${kpi.color}30` }}>
                    <kpi.icon size={16} />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Platform Revenue Breakdown ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(platformStats).map(([platform, amount]) => {
            const pct = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(0) : '0';
            return (
              <div key={platform} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{platform}</span>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-500">{pct}%</span>
                </div>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(amount)}</p>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 flex flex-col relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-primary-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue vs Expenses Cash Flow</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Revenue</span>
                <span className="flex items-center gap-1.5 text-rose-500"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses</span>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] relative">
              {filteredTransactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={openAddPanel} className="bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] px-5 py-3 rounded-2xl flex items-center gap-3 hover:border-primary-500 transition-all shadow-xl">
                    <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                      <Plus size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Add first transaction</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">To populate charts</p>
                    </div>
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#232734" vertical={false} opacity={0.5} />
                    <XAxis dataKey="dateStr" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} tickMargin={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #232734', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
                    />
                    <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, fill: '#10B981', stroke: '#11131A', strokeWidth: 3 }} />
                    <Area type="monotone" dataKey="Expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, fill: '#EF4444', stroke: '#11131A', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 flex flex-col relative overflow-hidden shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Net Profit Margin Trend</h3>
            <div className="flex-1 min-h-[300px] relative">
              {filteredTransactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold">
                  No data to display
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProfitPos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorProfitNeg" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#232734" vertical={false} opacity={0.5} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} tickMargin={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #232734', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                      cursor={{ fill: '#232734', opacity: 0.2 }}
                    />
                    <Bar dataKey="Profit" radius={[6, 6, 6, 6]}>
                      {profitChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Profit >= 0 ? 'url(#colorProfitPos)' : 'url(#colorProfitNeg)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Filters & Table ──────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] overflow-hidden shadow-sm dark:shadow-none">
          {/* Table Toolbar */}
          <div className="p-6 border-b border-slate-200 dark:border-[#232734] flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#11131A]">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72 group">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search description, category, platform..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-800 dark:text-white text-sm font-medium rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/10 transition-all" 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                className="bg-white hover:bg-slate-50 dark:bg-[#09090B] dark:hover:bg-[#141414] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-primary-500/60 cursor-pointer w-full md:w-auto">
                <option value="All">All Transactions</option>
                <option value="Income">Income Only</option>
                <option value="Expense">Expenses Only</option>
              </select>
              
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}
                className="bg-white hover:bg-slate-50 dark:bg-[#09090B] dark:hover:bg-[#141414] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-primary-500/60 cursor-pointer w-full md:w-auto">
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
              <thead className="bg-slate-50 dark:bg-[#09090B]">
                <tr className="border-b border-slate-200 dark:border-[#232734]">
                  <th className="pl-6 pr-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Transaction</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Category</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Platform</th>
                  <th className="pr-6 pl-4 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {/* ── Inline Quick Add Row ── */}
                <tr className="border-b-2 border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#11131A] shadow-sm relative z-10">
                  <td className="pl-6 pr-4 py-3">
                    <form id="inline-form" onSubmit={handleInlineSubmit} className="hidden" />
                    <input form="inline-form" type="text" placeholder="Quick record transaction description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none transition-colors placeholder:text-slate-400" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select form="inline-form" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'Income' | 'Expense'})}
                        className="bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] focus:ring-2 focus:ring-primary-500/50 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl px-1 py-2.5 focus:outline-none transition-colors w-12 cursor-pointer appearance-none text-center">
                        <option value="Income">+</option>
                        <option value="Expense">-</option>
                      </select>
                      <input form="inline-form" required type="number" step="0.01" min="0" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        className="w-24 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-slate-100 text-sm font-mono font-bold rounded-xl px-3 py-2.5 focus:outline-none transition-colors" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select form="inline-form" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-28 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-slate-100 text-[11px] font-bold uppercase tracking-widest rounded-xl px-3 py-2.5 focus:outline-none transition-colors cursor-pointer">
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
                      className="w-[140px] bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
                  </td>
                  <td className="px-4 py-3">
                    <select form="inline-form" required value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-28 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none transition-colors cursor-pointer">
                      <option value="Direct">Direct</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </td>
                  <td className="pr-6 pl-4 py-3 text-right">
                    <button form="inline-form" type="submit" disabled={isSubmitting || !formData.amount}
                      className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors font-bold text-xs disabled:opacity-50 shadow-sm w-full">
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                    </button>
                  </td>
                </tr>

                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] mb-4">
                        <Search size={24} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">No transactions found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, i) => (
                    <motion.tr key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                      className="border-b border-slate-200 dark:border-[#232734] hover:bg-slate-50 dark:hover:bg-[#141414] transition-colors group cursor-pointer"
                      onClick={() => openEditPanel(t)}>
                      <td className="pl-6 pr-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            t.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {t.type === 'Income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[240px]">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-bold font-mono tracking-tight ${t.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{formatDate(t.date)}</td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{t.platform}</td>
                      <td className="pr-6 pl-4 py-4 text-right">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }} className="p-2 opacity-0 group-hover:opacity-100 hover:text-rose-500 text-slate-400 transition-all">
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
        
        {/* ── Centered Modal (Add / Edit) ───────────────────────────────── */}
        <AnimatePresence>
          {isSlidePanelOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => setIsSlidePanelOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                className="relative w-full max-w-[500px] bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] z-50 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</span>
                    <button type="button" onClick={() => setIsSlidePanelOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1D27] border border-slate-200 dark:border-[#232734] transition-all">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 flex-shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {editingTransaction ? 'Update Entry' : 'Record Transaction'}
                      </h2>
                      <p className="text-xs text-slate-400">Add to accounting and cash flow ledger.</p>
                    </div>
                  </div>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-5">
                  
                  {/* Type Selector */}
                  <div className="flex bg-slate-50 dark:bg-[#09090B] p-1 rounded-xl border border-slate-200 dark:border-[#232734]">
                    <button type="button" onClick={() => setFormData({...formData, type: 'Income'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.type === 'Income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}>
                      + Income (Revenue)
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'Expense'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${formData.type === 'Expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}>
                      - Expense (Cost)
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 ml-1">Amount ($ USD)</label>
                    <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-lg font-mono font-bold focus:border-primary-500 focus:outline-none" placeholder="0.00" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 ml-1">Description / Client Note</label>
                    <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:outline-none" placeholder="e.g. Next.js SaaS Milestone 1" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 ml-1">Date</label>
                      <DatePicker 
                        selected={new Date(formData.date + 'T00:00:00')} 
                        onChange={(date: Date | null) => setFormData({...formData, date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')})}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:outline-none" 
                        dateFormat="MMMM d, yyyy"
                        required
                        popperPlacement="bottom-start"
                        popperClassName="z-[60]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 ml-1">Category</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:outline-none appearance-none cursor-pointer">
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
                    <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 ml-1">Platform / Channel</label>
                    <select required value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:outline-none appearance-none cursor-pointer">
                      <option value="Direct">Direct (Bank / Stripe)</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-[#232734]">
                    <button type="submit" disabled={isSubmitting || !formData.amount || !formData.description}
                      className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30">
                      {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Transaction'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
