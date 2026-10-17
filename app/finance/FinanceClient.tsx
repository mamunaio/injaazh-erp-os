'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Search, Plus, FileText, Download,
  X, Loader2, ArrowUpRight, ArrowDownRight, CreditCard,
  Briefcase, Trash2, Sparkles, Zap, ShieldCheck, CheckCircle2,
  RefreshCw, BarChart3
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
  const [isExporting, setIsExporting] = useState(false);

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

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q) ||
        t.platform.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, typeFilter, searchQuery]);

  // KPI Calculations
  const totalIncome = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const totalExpense = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Platform Distribution
  const platformStats = useMemo(() => {
    const stats: Record<string, number> = { Direct: 0, Upwork: 0, Fiverr: 0, Freelancer: 0 };
    filteredTransactions.filter(t => t.type === 'Income').forEach(t => {
      const p = t.platform || 'Direct';
      stats[p] = (stats[p] || 0) + t.amount;
    });
    return stats;
  }, [filteredTransactions]);

  // Chart Data Processing (Daily aggregations)
  const chartData = useMemo(() => {
    const map = new Map<string, { dateStr: string; Income: number; Expense: number }>();
    
    // Sort transactions chronologically
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, { dateStr: formatDate(d), Income: 0, Expense: 0 });
      }
      const entry = map.get(key)!;
      if (t.type === 'Income') entry.Income += t.amount;
      if (t.type === 'Expense') entry.Expense += t.amount;
    });

    return Array.from(map.values()).slice(-14);
  }, [filteredTransactions]);

  // Net Profit Margin trend
  const profitChartData = useMemo(() => {
    return chartData.map(d => ({
      name: d.dateStr,
      Profit: d.Income - d.Expense,
      Margin: d.Income > 0 ? Math.round(((d.Income - d.Expense) / d.Income) * 100) : 0
    }));
  }, [chartData]);

  // ── AI Financial Health Analysis ───────────────────────────────────────────
  const handleRunAiDiagnostic = async () => {
    setIsLoadingAi(true);
    try {
      const res = await analyzeFinancialHealth({
        totalIncome,
        totalExpense,
        netProfit,
        profitMarginPercent: profitMargin,
        timeframe: dateFilter,
        platformBreakdown: platformStats
      });
      if (res.success && res.data) {
        setAiReport(res.data);
        notify.success('Financial diagnostic complete');
      } else {
        notify.error('Could not generate AI diagnostic');
      }
    } catch {
      notify.error('Failed to run AI diagnostic');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openAddPanel = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'Income',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Sales',
      description: '',
      platform: 'Direct'
    });
    setIsSlidePanelOpen(true);
  };

  const openEditPanel = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      amount: t.amount.toString(),
      date: new Date(t.date).toISOString().split('T')[0],
      category: t.category,
      description: t.description,
      platform: t.platform || 'Direct'
    });
    setIsSlidePanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      category: formData.category,
      description: formData.description,
      platform: formData.platform
    };

    if (editingTransaction) {
      notify.edit('Transaction updated');
      setIsSlidePanelOpen(false);
      const res = await updateTransaction(editingTransaction._id, payload);
      if (res.success) {
        setTransactions(transactions.map(x => x._id === editingTransaction._id ? { ...x, ...payload } : x));
      } else {
        notify.error(res.error || 'Failed to update');
      }
    } else {
      // 🚀 0ms Instant Feedback
      notify.instant({
        type: payload.type === 'Income' ? 'payment' : 'system',
        sound: payload.type === 'Income' ? 'income' : 'expense',
        message: `A new ${payload.type.toLowerCase()} of $${payload.amount} was recorded.`,
        link: '/finance'
      });
      setIsSlidePanelOpen(false);

      const res = await createTransaction(payload);
      if (res.success && res.data) {
        setTransactions(prev => [res.data, ...prev]);
      } else {
        notify.error(res.error || 'Failed to create');
      }
    }
    setIsSubmitting(false);
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    setIsSubmitting(true);

    const payload = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      category: formData.category,
      description: formData.description,
      platform: formData.platform
    };

    // 🚀 0ms Instant Feedback
    notify.instant({
      type: payload.type === 'Income' ? 'payment' : 'system',
      sound: payload.type === 'Income' ? 'income' : 'expense',
      message: `A new ${payload.type.toLowerCase()} of $${payload.amount} was recorded.`,
      link: '/finance'
    });
    setFormData(prev => ({ ...prev, amount: '', description: '' }));

    const res = await createTransaction(payload);
    if (res.success && res.data) {
      setTransactions(prev => [res.data, ...prev]);
    } else {
      notify.error('Failed to save');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction record? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    const res = await deleteTransaction(id);
    if (res.success) {
      notify.success('Transaction deleted');
      setTransactions(transactions.filter(t => t._id !== id));
    } else {
      notify.error('Failed to delete transaction');
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Platform'];
        const rows = filteredTransactions.map(t => [
          `"${formatDate(t.date)}"`,
          `"${t.type}"`,
          t.amount,
          `"${t.category}"`,
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.platform}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `financial-transactions-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify.success('Export completed');
      } catch {
        notify.error('Failed to export CSV');
      } finally {
        setIsExporting(false);
      }
    }, 100);
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
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xs">
                  <DollarSign size={16} />
                </div>
                <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Finance & Cash Flow Studio</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                Financial Operations
              </h1>
              <p className="text-xs text-secondary font-medium">
                Live cash flow analytics, AI burn rate diagnostics, and platform revenues.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button 
                onClick={handleRunAiDiagnostic}
                disabled={isLoadingAi}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white shadow-[0_0_20px_rgba(99,36,252,0.35)] transition-all disabled:opacity-50"
              >
                {isLoadingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-300" />}
                <span>AI Health Diagnostic</span>
              </button>

              <Link href="/finance/invoices" className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white transition-all shadow-xs">
                <FileText size={14} /> Manage Invoices
              </Link>
              
              <button onClick={handleExport} disabled={isExporting} className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white transition-all disabled:opacity-50 shadow-xs">
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              
              <button onClick={openAddPanel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all">
                <Plus size={15} strokeWidth={2.5} /> Record Entry
              </button>
            </div>
          </motion.div>

          {/* ── AI Executive Financial Health Card ───────────────────────────── */}
          {aiReport && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl mb-6 bg-gradient-to-br from-[#6324FC]/10 via-[#0a0a0d] to-[#00E5FF]/5 border border-[#6324FC]/30 backdrop-blur-xl relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#6324FC]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#6324FC]/20 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      Gemini Fractional CFO Diagnostic
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30">
                        Score: {aiReport.financialHealthScore}/100
                      </span>
                    </h3>
                    <p className="text-[11px] text-secondary">Cash Flow Status: <strong className="text-emerald-500">{aiReport.cashFlowStatus}</strong> • Margin: <strong className="text-[#6324FC] dark:text-[#00E5FF]">{profitMargin.toFixed(1)}%</strong></p>
                  </div>
                </div>

                <button 
                  onClick={handleRunAiDiagnostic}
                  className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 transition-colors"
                >
                  <RefreshCw size={12} className={isLoadingAi ? 'animate-spin' : ''} /> Refresh Analysis
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                <div className="bg-white/60 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="text-[10px] font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Burn Rate & Stability
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{aiReport.burnRateAssessment}</p>
                </div>

                <div className="bg-white/60 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="text-[10px] font-heading font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Zap size={13} /> Growth Opportunity
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{aiReport.growthOpportunity}</p>
                </div>

                <div className="bg-white/60 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="text-[10px] font-heading font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Strategic Next Steps
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {(aiReport.strategicRecommendations || []).slice(0, 2).map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500">•</span>
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
              { title: 'Net Profit', value: formatCurrency(netProfit), icon: Briefcase, color: '#6324FC', trend: '+18%', data: [30, 20, 40, 30, 50, 40, 60, 50, 70, 60, 80] },
              { title: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, icon: TrendingUp, color: '#00E5FF', trend: profitMargin >= 30 ? 'Healthy' : 'Standard', data: [50, 40, 60, 50, 70, 60, 80, 70, 90, 80, 100] }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between relative z-10 mb-2">
                  <div>
                    <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1">{kpi.title}</p>
                    <h3 className="text-2xl font-heading font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">{kpi.value}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color, borderColor: `${kpi.color}30` }}>
                    <kpi.icon size={15} />
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
              <div key={platform} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 p-4 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">{platform}</span>
                  <span className="text-[10px] font-heading font-bold font-mono px-1.5 py-0.5 rounded bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]">{pct}%</span>
                </div>
                <p className="text-base font-heading font-extrabold font-mono text-slate-900 dark:text-white">{formatCurrency(amount)}</p>
                <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={15} className="text-[#6324FC] dark:text-[#00E5FF]" />
                <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Revenue vs Expenses Cash Flow</h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-heading font-bold">
                <span className="flex items-center gap-1 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</span>
                <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500" /> Expenses</span>
              </div>
            </div>

            <div className="flex-1 min-h-[260px] relative">
              {filteredTransactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={openAddPanel} className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 hover:border-[#6324FC] transition-all shadow-sm">
                    <div className="w-7 h-7 rounded-xl bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                      <Plus size={14} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">Add first transaction</p>
                      <p className="text-[9px] text-secondary font-mono uppercase">To populate charts</p>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-black/5 dark:text-white/5" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl p-2.5 shadow-lg">
                              <p className="text-[10px] font-heading font-bold text-secondary mb-1">{label}</p>
                              {payload.map((entry: any, i: number) => (
                                <p key={i} className="text-xs font-heading font-extrabold font-mono" style={{ color: entry.color }}>
                                  {entry.name}: {formatCurrency(entry.value)}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="Expense" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden shadow-sm">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Net Profit Margin Trend</h3>
            <div className="flex-1 min-h-[260px] relative">
              {filteredTransactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-secondary font-mono">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-black/5 dark:text-white/5" vertical={false} />
                    <XAxis dataKey="name" stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-secondary" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                    />
                    <Bar dataKey="Profit" radius={[4, 4, 4, 4]}>
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
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row gap-3 justify-between items-center bg-white dark:bg-[#0a0a0d]">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search description, category, platform..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-3.5 py-2 focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary" 
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer w-full md:w-auto">
                <option value="All">All Transactions</option>
                <option value="Income">Income Only</option>
                <option value="Expense">Expenses Only</option>
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
                  <th className="pl-5 pr-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Transaction</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Platform</th>
                  <th className="pr-5 pl-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {/* ── Inline Quick Add Row ── */}
                <tr className="bg-slate-50/70 dark:bg-white/[0.02]">
                  <td className="pl-5 pr-4 py-2.5">
                    <form id="inline-form" onSubmit={handleInlineSubmit} className="hidden" />
                    <input form="inline-form" type="text" placeholder="Quick record transaction description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs font-heading font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6324FC] placeholder:text-secondary" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <select form="inline-form" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'Income' | 'Expense'})}
                        className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-1.5 py-1.5 focus:outline-none w-10 cursor-pointer appearance-none text-center">
                        <option value="Income">+</option>
                        <option value="Expense">-</option>
                      </select>
                      <input form="inline-form" required type="number" step="0.01" min="0" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        className="w-20 bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <select form="inline-form" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-24 bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-[10px] font-heading font-bold uppercase tracking-wider rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer">
                      <option value="Sales">Sales</option>
                      <option value="Services">Services</option>
                      <option value="Software">Software</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Salary">Salary</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input form="inline-form" required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-[120px] bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-[11px] font-mono rounded-xl px-2.5 py-1.5 focus:outline-none" />
                  </td>
                  <td className="px-4 py-2.5">
                    <select form="inline-form" required value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-24 bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-[11px] font-heading font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer">
                      <option value="Direct">Direct</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </td>
                  <td className="pr-5 pl-4 py-2.5 text-right">
                    <button form="inline-form" type="submit" disabled={isSubmitting || !formData.amount}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white rounded-xl font-heading font-bold text-[11px] disabled:opacity-50 shadow-xs">
                      {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                    </button>
                  </td>
                </tr>

                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 mb-3">
                        <Search size={20} className="text-secondary" />
                      </div>
                      <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">No transactions found</p>
                      <p className="text-[11px] text-secondary mt-0.5">Try adjusting your filters or search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, i) => (
                    <motion.tr key={t._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => openEditPanel(t)}>
                      <td className="pl-5 pr-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                            t.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {t.type === 'Income' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          </div>
                          <span className="font-heading font-bold text-slate-900 dark:text-white truncate max-w-[240px] group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-heading font-bold font-mono tracking-tight ${t.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-secondary text-[10px] font-heading font-bold uppercase tracking-wider border border-black/5 dark:border-white/5">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-secondary font-mono text-[11px]">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 text-secondary font-heading font-semibold text-[11px]">{t.platform}</td>
                      <td className="pr-5 pl-4 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }} className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 text-secondary transition-all">
                          <Trash2 size={13} />
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
                onClick={() => setIsSlidePanelOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex-shrink-0 p-5 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0d]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</span>
                    <button type="button" onClick={() => setIsSlidePanelOpen(false)} className="p-1.5 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] flex-shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {editingTransaction ? 'Update Entry' : 'Record Transaction'}
                      </h2>
                      <p className="text-xs text-secondary">Add to accounting and cash flow ledger.</p>
                    </div>
                  </div>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  
                  {/* Type Selector */}
                  <div className="flex bg-slate-100 dark:bg-[#060608] p-1 rounded-2xl border border-black/10 dark:border-white/10">
                    <button type="button" onClick={() => setFormData({...formData, type: 'Income'})}
                      className={`flex-1 py-1.5 text-xs font-heading font-bold rounded-xl transition-all ${formData.type === 'Income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-secondary hover:text-slate-900 dark:hover:text-white'}`}>
                      + Income (Revenue)
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'Expense'})}
                      className={`flex-1 py-1.5 text-xs font-heading font-bold rounded-xl transition-all ${formData.type === 'Expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-secondary hover:text-slate-900 dark:hover:text-white'}`}>
                      - Expense (Cost)
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Amount ($ USD)</label>
                    <input required type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-base font-mono font-bold focus:border-[#6324FC] focus:outline-none" placeholder="0.00" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Description / Client Note</label>
                    <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-[#6324FC] focus:outline-none placeholder:text-secondary" placeholder="e.g. Next.js SaaS Milestone 1" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Date</label>
                      <DatePicker 
                        selected={new Date(formData.date + 'T00:00:00')} 
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
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Platform / Channel</label>
                    <select required value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold focus:border-[#6324FC] focus:outline-none appearance-none cursor-pointer">
                      <option value="Direct">Direct (Bank / Stripe)</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5">
                    <button type="submit" disabled={isSubmitting || !formData.amount || !formData.description}
                      className="w-full py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,36,252,0.4)]">
                      {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Transaction'}
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
