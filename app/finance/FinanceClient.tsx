'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Search, Plus, FileText, Download,
  X, Loader2, ArrowUpRight, ArrowDownRight, CreditCard,
  Briefcase, Trash2, Sparkles, Zap, ShieldCheck, CheckCircle2,
  RefreshCw, BarChart3, Clock, Check, ChevronDown, ChevronRight,
  Sliders, ArrowRight, Layers, HelpCircle, Coins, ExternalLink,
  CheckCircle, ArrowUpDown
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

import { 
  createTransaction, 
  updateTransaction, 
  deleteTransaction,
  syncTimesheetProjectRevenue,
  saveExchangeRate,
} from '@/app/actions/transactionActions';
import { analyzeFinancialHealth } from '@/app/actions/aiActions';
import { useScrollLock } from '@/lib/useScrollLock';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Transaction {
  _id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: string | Date;
  category: string;
  description: string;
  platform: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr';
  projectId?: any;
}

export interface TimesheetProjectRevenueItem {
  project: string;
  totalSeconds: number;
  totalEarnings: number;
  effectiveRate: number;
  logsCount: number;
  lastDate: string;
  isSynced: boolean;
  platform: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr';
}

export interface TimesheetRevenueSummaryData {
  totalBillableSeconds: number;
  totalBillableEarnings: number;
  projects: TimesheetProjectRevenueItem[];
}

export interface FinanceProjectOption {
  _id: string;
  title: string;
  platform: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr';
  budget: number;
  hourlyRate: number;
  clientName: string;
}

interface FinanceClientProps {
  initialTransactions: Transaction[];
  platformSummary: any;
  projectAnalytics: any;
  timesheetSummary?: TimesheetRevenueSummaryData;
  projectsList?: FinanceProjectOption[];
  initialExchangeRate?: number;
  authUser?: any;
}

export default function FinanceClient({ 
  initialTransactions, 
  platformSummary, 
  projectAnalytics,
  timesheetSummary,
  projectsList = [],
  initialExchangeRate = 122,
  authUser
}: FinanceClientProps) {
  const { confirm } = useConfirm();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // ── Currency State (USD vs BDT) ─────────────────────────────────────────────
  const [currency, setCurrency] = useState<'USD' | 'BDT'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('injaazh_finance_currency');
      if (saved === 'BDT' || saved === 'USD') return saved;
    }
    return 'USD';
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('injaazh_exchange_rate_bdt');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return initialExchangeRate || 122;
  });

  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [tempExchangeRateInput, setTempExchangeRateInput] = useState(exchangeRate.toString());
  const [isSavingFx, setIsSavingFx] = useState(false);

  const handleSetCurrency = (curr: 'USD' | 'BDT') => {
    setCurrency(curr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('injaazh_finance_currency', curr);
    }
    toast.success(`Currency switched to ${curr === 'BDT' ? '৳ BDT (Taka)' : '$ USD (Dollar)'}`, {
      icon: curr === 'BDT' ? '৳' : '$'
    });
  };

  const handleSaveExchangeRate = async () => {
    const parsed = parseFloat(tempExchangeRateInput);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Please enter a valid exchange rate');
      return;
    }
    setIsSavingFx(true);
    setExchangeRate(parsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('injaazh_exchange_rate_bdt', parsed.toString());
    }
    const res = await saveExchangeRate(parsed);
    if (res.success) {
      toast.success(`Exchange rate set: $1 USD = ৳${parsed} BDT`);
    }
    setIsSavingFx(false);
    setIsEditingExchangeRate(false);
  };

  // ── Universal Currency Formatter ───────────────────────────────────────────
  const formatMoney = useCallback((amountUSD: number, showBoth = false) => {
    const cleanAmount = typeof amountUSD === 'number' && !isNaN(amountUSD) ? amountUSD : 0;
    
    if (currency === 'BDT') {
      const bdt = Math.round(cleanAmount * exchangeRate);
      const bdtStr = `৳${bdt.toLocaleString('en-US')}`;
      if (showBoth) {
        const usdFormatted = cleanAmount % 1 === 0 ? cleanAmount.toString() : cleanAmount.toFixed(2);
        return `${bdtStr} ($${usdFormatted})`;
      }
      return bdtStr;
    } else {
      const usdStr = cleanAmount % 1 === 0 
        ? `$${cleanAmount.toLocaleString('en-US')}` 
        : `$${cleanAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (showBoth) {
        const bdt = Math.round(cleanAmount * exchangeRate);
        return `${usdStr} (৳${bdt.toLocaleString('en-US')})`;
      }
      return usdStr;
    }
  }, [currency, exchangeRate]);

  const formatDate = (date: string | Date) => 
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatTimeHours = (seconds: number) => {
    const totalMins = Math.round((seconds || 0) / 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // ── Timesheet Revenue Auto-Sync State ───────────────────────────────────────
  const [timesheetRevenue, setTimesheetRevenue] = useState<TimesheetRevenueSummaryData>(
    timesheetSummary || { totalBillableSeconds: 0, totalBillableEarnings: 0, projects: [] }
  );
  const [isSyncingProject, setIsSyncingProject] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleSyncProjectRevenue = async (item: TimesheetProjectRevenueItem) => {
    setIsSyncingProject(item.project);
    const hours = item.totalSeconds / 3600;
    const res = await syncTimesheetProjectRevenue({
      projectName: item.project,
      amount: item.totalEarnings,
      platform: item.platform,
      hours,
    });

    if (res.success && res.data) {
      notify.instant({
        type: 'payment',
        sound: 'income',
        message: `Synced ${item.project}: $${item.totalEarnings} (${hours.toFixed(1)}h) added to Revenue!`,
        link: '/finance'
      });
      setTransactions(prev => [res.data, ...prev]);
      setTimesheetRevenue(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.project === item.project ? { ...p, isSynced: true } : p)
      }));
    } else {
      notify.error(res.error || 'Failed to sync timesheet revenue');
    }
    setIsSyncingProject(null);
  };

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'ThisMonth' | 'Last3Months' | 'ThisYear'>('ThisMonth');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  useScrollLock(isSlidePanelOpen);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // AI Diagnostic State
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Form State (supports input in USD or BDT)
  const [formCurrencyMode, setFormCurrencyMode] = useState<'USD' | 'BDT'>('USD');
  const [formData, setFormData] = useState<{
    type: 'Income' | 'Expense';
    amount: string;
    date: string;
    category: string;
    description: string;
    platform: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr';
    selectedProjectId: string;
  }>({
    type: 'Income',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Sales',
    description: '',
    platform: 'Direct',
    selectedProjectId: ''
  });

  useEffect(() => { setTransactions(initialTransactions); }, [initialTransactions]);

  // ── Computed Filtered Transactions ──────────────────────────────────────────
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

    // Platform Filter
    if (platformFilter !== 'All') {
      result = result.filter(t => t.platform === platformFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.description || '').toLowerCase().includes(q) || 
        (t.category || '').toLowerCase().includes(q) ||
        (t.platform || '').toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, typeFilter, platformFilter, searchQuery]);

  // KPI Calculations (in USD)
  const totalIncome = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0),
    [filteredTransactions]
  );

  const totalExpense = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0),
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
    const map = new Map<string, { dateStr: string; rawDate: string; Income: number; Expense: number }>();
    
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, { dateStr: formatDate(d), rawDate: key, Income: 0, Expense: 0 });
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
      ProfitConverted: currency === 'BDT' ? Math.round((d.Income - d.Expense) * exchangeRate) : (d.Income - d.Expense),
      Margin: d.Income > 0 ? Math.round(((d.Income - d.Expense) / d.Income) * 100) : 0
    }));
  }, [chartData, currency, exchangeRate]);

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
    setFormCurrencyMode(currency);
    setFormData({
      type: 'Income',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Sales',
      description: '',
      platform: 'Direct',
      selectedProjectId: ''
    });
    setIsSlidePanelOpen(true);
  };

  const openEditPanel = (t: Transaction) => {
    setEditingTransaction(t);
    setFormCurrencyMode('USD');
    setFormData({
      type: t.type,
      amount: t.amount.toString(),
      date: new Date(t.date).toISOString().split('T')[0],
      category: t.category,
      description: t.description,
      platform: t.platform || 'Direct',
      selectedProjectId: t.projectId?._id || ''
    });
    setIsSlidePanelOpen(true);
  };

  const handleSelectProjectInForm = (projId: string) => {
    const proj = projectsList.find(p => p._id === projId);
    if (proj) {
      setFormData(prev => ({
        ...prev,
        selectedProjectId: proj._id,
        platform: proj.platform || 'Direct',
        category: prev.type === 'Income' ? 'Services' : prev.category,
        description: prev.description || `Milestone Billing - ${proj.title}`
      }));
    } else {
      setFormData(prev => ({ ...prev, selectedProjectId: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(formData.amount);
    if (isNaN(rawVal) || rawVal <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    // Convert to USD if entered in BDT
    const usdAmount = formCurrencyMode === 'BDT' ? Number((rawVal / exchangeRate).toFixed(2)) : rawVal;

    const payload = {
      type: formData.type,
      amount: usdAmount,
      date: new Date(formData.date).toISOString(),
      category: formData.category,
      description: formData.description,
      platform: formData.platform,
      projectId: formData.selectedProjectId || null
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
      notify.instant({
        type: payload.type === 'Income' ? 'payment' : 'system',
        sound: payload.type === 'Income' ? 'income' : 'expense',
        message: `A new ${payload.type.toLowerCase()} of ${formatMoney(payload.amount)} was recorded.`,
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
    const rawVal = parseFloat(formData.amount);
    if (isNaN(rawVal) || rawVal <= 0 || !formData.description) return;
    setIsSubmitting(true);

    const usdAmount = currency === 'BDT' ? Number((rawVal / exchangeRate).toFixed(2)) : rawVal;

    const payload = {
      type: formData.type,
      amount: usdAmount,
      date: new Date(formData.date).toISOString(),
      category: formData.category,
      description: formData.description,
      platform: formData.platform,
      projectId: formData.selectedProjectId || null
    };

    notify.instant({
      type: payload.type === 'Income' ? 'payment' : 'system',
      sound: payload.type === 'Income' ? 'income' : 'expense',
      message: `Recorded ${payload.type.toLowerCase()} of ${formatMoney(payload.amount)}.`,
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
        const headers = ['Date', 'Type', `Amount (${currency})`, 'Amount (USD)', 'Category', 'Description', 'Platform'];
        const rows = filteredTransactions.map(t => {
          const converted = currency === 'BDT' ? Math.round(t.amount * exchangeRate) : t.amount;
          return [
            `"${formatDate(t.date)}"`,
            `"${t.type}"`,
            converted,
            t.amount,
            `"${t.category}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            `"${t.platform}"`
          ];
        });
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 selection:bg-[#6324FC]/30">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* ── Page Header & Currency Controls ─────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xs">
                  <DollarSign size={16} />
                </div>
                <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                  Finance & Cash Flow Operating System
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                Financial Operations
              </h1>
              <p className="text-xs text-secondary font-medium">
                Live cash flow analytics, Timesheet revenue auto-sync, BDT/USD currency ledger, and AI diagnostics.
              </p>
            </div>
            
            {/* Action & Controls Bar - Well-anchored, responsive grouping */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full xl:w-auto">
              
              {/* Currency Switcher & Exchange Rate Pill Group */}
              <div className="flex items-center p-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl shadow-xs shrink-0">
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => handleSetCurrency('USD')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-1.5 ${
                      currency === 'USD'
                        ? 'bg-[#6324FC] text-white shadow-xs'
                        : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Display in US Dollars ($)"
                  >
                    <DollarSign size={13} />
                    <span>USD ($)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetCurrency('BDT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-1.5 ${
                      currency === 'BDT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Display in Bangladeshi Taka (৳)"
                  >
                    <span className="font-bold">৳</span>
                    <span>BDT (৳)</span>
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1.5" />

                {/* Editable Exchange Rate Badge */}
                <div className="relative pr-1">
                  {isEditingExchangeRate ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5">
                      <span className="text-[11px] font-mono text-secondary">1$ = ৳</span>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={tempExchangeRateInput}
                        onChange={(e) => setTempExchangeRateInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveExchangeRate();
                          if (e.key === 'Escape') setIsEditingExchangeRate(false);
                        }}
                        className="w-14 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveExchangeRate}
                        disabled={isSavingFx}
                        className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        title="Save rate"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setIsEditingExchangeRate(false)}
                        className="p-1 rounded-lg text-secondary hover:text-rose-500 transition-colors"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setTempExchangeRateInput(exchangeRate.toString());
                        setIsEditingExchangeRate(true);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-mono text-secondary hover:text-slate-900 dark:hover:text-white transition-all"
                      title="Click to edit USD to BDT exchange rate"
                    >
                      <Coins size={13} className="text-amber-500" />
                      <span>$1 = <strong className="text-slate-900 dark:text-white font-bold">৳{exchangeRate}</strong></span>
                      <span className="text-[10px] text-secondary opacity-70 underline ml-0.5">Rate</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                <button 
                  onClick={handleRunAiDiagnostic}
                  disabled={isLoadingAi}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white shadow-[0_0_20px_rgba(99,36,252,0.35)] transition-all disabled:opacity-50 shrink-0"
                >
                  {isLoadingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-300" />}
                  <span>AI Health</span>
                </button>

                <Link 
                  href="/finance/invoices" 
                  className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white transition-all shadow-xs shrink-0"
                >
                  <FileText size={14} /> <span>Invoices</span>
                </Link>
                
                <button 
                  onClick={handleExport} 
                  disabled={isExporting} 
                  className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl font-heading font-bold text-xs bg-white dark:bg-[#0a0a0d] hover:bg-slate-100 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white transition-all disabled:opacity-50 shadow-xs shrink-0"
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                  <span>Export</span>
                </button>
                
                <button 
                  onClick={openAddPanel} 
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl font-heading font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all shrink-0 whitespace-nowrap"
                >
                  <Plus size={15} strokeWidth={2.5} /> <span>Record Entry</span>
                </button>
              </div>

            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* ⚡ TIMESHEET REVENUE AUTO-SYNC STREAM (FEATURE HIGHLIGHT) */}
          {/* ========================================================================= */}
          <motion.div 
            variants={itemVariants}
            className="group mb-6 rounded-3xl bg-gradient-to-r from-[#6324FC]/10 via-white dark:via-[#0a0a0d] to-[#00E5FF]/10 border border-[#6324FC]/25 p-5 relative overflow-hidden backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-[#6324FC]/40"
          >
            {/* Top Accent Neon Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#6324FC]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] shrink-0 shadow-sm">
                  <Clock size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#6324FC] dark:text-[#00E5FF] px-2.5 py-0.5 rounded-full bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center gap-1">
                      <Zap size={11} /> Timesheet Auto-Sync Stream
                    </span>
                    <span className="text-xs text-secondary font-mono">
                      {timesheetRevenue.projects.length} billable projects logged
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 dark:text-white mt-1">
                    {formatMoney(timesheetRevenue.totalBillableEarnings, true)}
                    <span className="text-xs text-secondary font-normal font-sans ml-2">
                      ({formatTimeHours(timesheetRevenue.totalBillableSeconds)} total sprint work recorded)
                    </span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/timesheets"
                  className="px-3 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors flex items-center gap-1.5"
                >
                  <span>Open Timesheets</span>
                  <ExternalLink size={12} />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(!isSyncModalOpen)}
                  className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-white bg-gradient-to-r from-[#6324FC] to-[#00E5FF] hover:brightness-110 shadow-[0_0_15px_rgba(99,36,252,0.4)] transition-all flex items-center gap-1.5"
                >
                  <Zap size={13} />
                  <span>Review & Sync Projects ({timesheetRevenue.projects.filter(p => !p.isSynced).length})</span>
                  <ChevronDown size={13} className={`transition-transform ${isSyncModalOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expandable Project Breakdown Drawer */}
            <AnimatePresence>
              {isSyncModalOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 overflow-hidden"
                >
                  <p className="text-xs font-heading font-bold text-secondary mb-3 flex items-center gap-1.5">
                    <span>Detected billable sprint earnings per project from /timesheets. Click &quot;Sync to Ledger&quot; to post as official Revenue transaction:</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {timesheetRevenue.projects.map((projItem) => (
                      <div
                        key={projItem.project}
                        className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-heading font-bold text-xs text-slate-900 dark:text-white truncate">
                              {projItem.project}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold">
                              {projItem.platform}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-heading font-extrabold font-mono text-emerald-500">
                              {formatMoney(projItem.totalEarnings, true)}
                            </span>
                            <span className="text-xs text-secondary font-mono">
                              ({formatTimeHours(projItem.totalSeconds)} @ ${projItem.effectiveRate}/hr)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                          <span className="text-[11px] text-secondary font-mono">
                            {projItem.logsCount} entries
                          </span>

                          {projItem.isSynced ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <CheckCircle2 size={12} />
                              <span>Synced</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSyncProjectRevenue(projItem)}
                              disabled={isSyncingProject === projItem.project}
                              className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 px-3 py-1 rounded-xl shadow-xs transition-all disabled:opacity-50"
                            >
                              {isSyncingProject === projItem.project ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Zap size={12} />
                              )}
                              <span>Sync to Ledger</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                    <p className="text-[11px] text-secondary">
                      Cash Flow Status: <strong className="text-emerald-500">{aiReport.cashFlowStatus}</strong> • Margin: <strong className="text-[#6324FC] dark:text-[#00E5FF]">{profitMargin.toFixed(1)}%</strong>
                    </p>
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

          {/* ── KPI Cards (Dashboard Glass-Card Design System) ─────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Period Revenue */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-emerald-400 transition-all duration-300 shadow-sm">
                  <ArrowUpRight size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  Period Inflow
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Period Revenue</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-emerald-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-emerald-400 transition-all">
                  {formatMoney(totalIncome)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  {currency === 'BDT' ? `$${totalIncome.toFixed(2)} USD` : `৳${Math.round(totalIncome * exchangeRate).toLocaleString()} BDT`}
                </p>
              </div>
            </div>

            {/* Card 2: Period Expenses */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-rose-500/60 hover:shadow-[0_16px_36px_rgba(244,63,94,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-rose-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F43F5E]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] group-hover:border-rose-400 transition-all duration-300 shadow-sm">
                  <ArrowDownRight size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                  Total Burn
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Period Expenses</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-rose-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-rose-400 transition-all">
                  {formatMoney(totalExpense)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  {currency === 'BDT' ? `$${totalExpense.toFixed(2)} USD` : `৳${Math.round(totalExpense * exchangeRate).toLocaleString()} BDT`}
                </p>
              </div>
            </div>

            {/* Card 3: Net Profit */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#6324FC]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#A78BFA] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300 shadow-sm">
                  <Briefcase size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#A78BFA] bg-[#6324FC]/10 px-2.5 py-1 rounded-lg border border-[#6324FC]/20 group-hover:border-[#6324FC]/40 transition-colors">
                  Net Solid
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Net Profit</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {formatMoney(netProfit)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  {currency === 'BDT' ? `$${netProfit.toFixed(2)} USD` : `৳${Math.round(netProfit * exchangeRate).toLocaleString()} BDT`}
                </p>
              </div>
            </div>

            {/* Card 4: Profit Margin */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
                  <TrendingUp size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-1 rounded-lg border border-[#00E5FF]/20 group-hover:border-[#00E5FF]/40 transition-colors">
                  {profitMargin >= 30 ? 'Healthy Margin' : 'Standard Run'}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Profit Margin</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#00E5FF] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {profitMargin.toFixed(1)}%
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  {profitMargin >= 30 ? 'High Operational Efficiency' : 'Standard Margin'}
                </p>
              </div>
            </div>

          </motion.div>
        </motion.div>

        {/* ── Platform Revenue Breakdown (Dashboard Glass-Card Design System) ────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(platformStats).map(([platform, amount]) => {
            const pct = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(0) : '0';
            const platformConfig: Record<string, { color: string; neonColor: string }> = {
              Direct: { color: '#6324FC', neonColor: 'via-[#6324FC]' },
              Upwork: { color: '#00E5FF', neonColor: 'via-[#00E5FF]' },
              Fiverr: { color: '#10B981', neonColor: 'via-emerald-500' },
              Freelancer: { color: '#F59E0B', neonColor: 'via-amber-500' },
            };
            const cfg = platformConfig[platform] || { color: '#6324FC', neonColor: 'via-[#6324FC]' };

            return (
              <div 
                key={platform} 
                className="group glass-card rounded-2xl p-4 min-h-[110px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 shadow-xs"
              >
                {/* Top accent mini neon */}
                <div 
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent ${cfg.neonColor} to-transparent transition-all duration-500 opacity-90`} 
                />

                <div className="flex justify-between items-center mb-1 relative z-10">
                  <span className="text-xs font-heading font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    {platform}
                  </span>
                  <span 
                    className="text-[10px] font-heading font-bold font-mono px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="relative z-10 my-1">
                  <p className="text-lg font-heading font-extrabold font-mono text-slate-900 dark:text-white">
                    {formatMoney(amount)}
                  </p>
                </div>

                <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden relative z-10">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: cfg.color,
                      boxShadow: `0 0 8px ${cfg.color}80`
                    }} 
                  />
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
                <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Revenue vs Expenses Cash Flow ({currency})
                </h3>
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
                  <AreaChart 
                    data={chartData.map(d => ({
                      ...d,
                      IncomeConverted: currency === 'BDT' ? Math.round(d.Income * exchangeRate) : d.Income,
                      ExpenseConverted: currency === 'BDT' ? Math.round(d.Expense * exchangeRate) : d.Expense,
                    }))} 
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
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
                    <YAxis 
                      stroke="currentColor" 
                      className="text-secondary" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={v => currency === 'BDT' ? `৳${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}` : `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl p-2.5 shadow-lg">
                              <p className="text-[10px] font-heading font-bold text-secondary mb-1">{label}</p>
                              {payload.map((entry: any, i: number) => {
                                const origUSD = entry.dataKey === 'IncomeConverted' ? entry.payload.Income : entry.payload.Expense;
                                return (
                                  <p key={i} className="text-xs font-heading font-extrabold font-mono" style={{ color: entry.color }}>
                                    {entry.name === 'IncomeConverted' ? 'Revenue' : 'Expenses'}: {formatMoney(origUSD, true)}
                                  </p>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="IncomeConverted" name="IncomeConverted" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="ExpenseConverted" name="ExpenseConverted" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden shadow-sm">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Net Profit Trend ({currency})
            </h3>
            <div className="flex-1 min-h-[260px] relative">
              {filteredTransactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-secondary font-mono">
                  No data to display
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    <YAxis 
                      stroke="currentColor" 
                      className="text-secondary" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={v => currency === 'BDT' ? `৳${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}` : `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                      formatter={(val: any, name: any, item: any) => [
                        formatMoney(item.payload.Profit, true),
                        `Profit (${item.payload.Margin}%)`
                      ]}
                    />
                    <Bar dataKey="ProfitConverted" radius={[4, 4, 4, 4]}>
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
          <div className="p-4 border-b border-black/5 dark:border-white/5 flex flex-col xl:flex-row gap-3 justify-between items-center bg-white dark:bg-[#0a0a0d]">
            <div className="flex items-center gap-2.5 w-full xl:w-auto">
              <div className="relative flex-1 md:w-72 group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search description, category, platform..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary" 
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
              <select 
                value={typeFilter} 
                onChange={e => setTypeFilter(e.target.value as any)}
                className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl px-3 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Income">+ Income</option>
                <option value="Expense">- Expenses</option>
              </select>

              <select 
                value={platformFilter} 
                onChange={e => setPlatformFilter(e.target.value)}
                className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl px-3 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer"
              >
                <option value="All">All Platforms</option>
                <option value="Direct">Direct</option>
                <option value="Upwork">Upwork</option>
                <option value="Fiverr">Fiverr</option>
                <option value="Freelancer">Freelancer</option>
              </select>
              
              <select 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value as any)}
                className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl px-3 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer"
              >
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
                  <th className="pl-5 pr-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">Transaction Description</th>
                  <th className="px-4 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
                    Amount ({currency})
                  </th>
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
                    <input 
                      form="inline-form" 
                      type="text" 
                      placeholder="Quick record description (e.g. Next.js SaaS Milestone)..." 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs font-heading font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6324FC] placeholder:text-secondary" 
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5 items-center">
                      <select 
                        form="inline-form" 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value as 'Income' | 'Expense'})}
                        className="bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-1.5 py-1.5 focus:outline-none w-10 cursor-pointer appearance-none text-center"
                      >
                        <option value="Income">+</option>
                        <option value="Expense">-</option>
                      </select>
                      <div className="relative">
                        <input 
                          form="inline-form" 
                          required 
                          type="number" 
                          step="any" 
                          min="0" 
                          placeholder={currency === 'BDT' ? '৳ 0' : '$ 0.00'} 
                          value={formData.amount} 
                          onChange={e => setFormData({...formData, amount: e.target.value})}
                          className="w-24 bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none" 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <select 
                      form="inline-form" 
                      required 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-28 bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-[10px] font-heading font-bold uppercase tracking-wider rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Services">Services</option>
                      <option value="Timesheet Billing">Timesheet</option>
                      <option value="Software">Software</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Salary">Salary</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input 
                      form="inline-form" 
                      required 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-[120px] bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-[11px] font-mono rounded-xl px-2.5 py-1.5 focus:outline-none" 
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <select 
                      form="inline-form" 
                      required 
                      value={formData.platform} 
                      onChange={e => setFormData({...formData, platform: e.target.value as any})}
                      className="w-24 bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 text-[11px] font-heading font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Direct">Direct</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </td>
                  <td className="pr-5 pl-4 py-2.5 text-right">
                    <button 
                      form="inline-form" 
                      type="submit" 
                      disabled={isSubmitting || !formData.amount}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white rounded-xl font-heading font-bold text-[11px] disabled:opacity-50 shadow-xs"
                    >
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
                      <p className="text-[11px] text-secondary mt-0.5">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t, i) => {
                    const isIncome = t.type === 'Income';
                    return (
                      <motion.tr 
                        key={t._id} 
                        initial={{ opacity: 0, y: 8 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.01 }}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        onClick={() => openEditPanel(t)}
                      >
                        <td className="pl-5 pr-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                              isIncome ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}>
                              {isIncome ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            </div>
                            <div>
                              <span className="font-heading font-bold text-slate-900 dark:text-white truncate max-w-[260px] block group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
                                {t.description || 'Transaction'}
                              </span>
                              {t.projectId && (
                                <span className="text-[10px] text-secondary font-mono flex items-center gap-1">
                                  <span>Project:</span> {t.projectId.title || 'Linked Project'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={`font-heading font-bold font-mono tracking-tight text-sm ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isIncome ? '+' : '-'}{formatMoney(t.amount)}
                            </span>
                            <span className="text-[10px] font-mono text-secondary">
                              {currency === 'BDT' ? `$${t.amount.toFixed(2)} USD` : `৳${Math.round(t.amount * exchangeRate).toLocaleString()} BDT`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-secondary text-[10px] font-heading font-bold uppercase tracking-wider border border-black/5 dark:border-white/5">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-secondary font-mono text-[11px]">{formatDate(t.date)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-heading font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20">
                            {t.platform}
                          </span>
                        </td>
                        <td className="pr-5 pl-4 py-3 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }} 
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 text-secondary transition-all"
                            title="Delete transaction"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        {/* ── Centered Modal (Add / Edit) with Project Linking & BDT/USD Input ── */}
        <AnimatePresence>
          {isSlidePanelOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                transition={{ duration: 0.2 }}
                onClick={() => setIsSlidePanelOpen(false)} 
                className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex-shrink-0 p-5 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0d]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                      {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setIsSlidePanelOpen(false)} 
                      className="p-1.5 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all"
                    >
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
                      <p className="text-xs text-secondary">Record client revenues, timesheet invoices, and operating costs.</p>
                    </div>
                  </div>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  
                  {/* Type Selector */}
                  <div className="flex bg-slate-100 dark:bg-[#060608] p-1 rounded-2xl border border-black/10 dark:border-white/10">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'Income'})}
                      className={`flex-1 py-1.5 text-xs font-heading font-bold rounded-xl transition-all ${
                        formData.type === 'Income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      + Income (Revenue)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'Expense'})}
                      className={`flex-1 py-1.5 text-xs font-heading font-bold rounded-xl transition-all ${
                        formData.type === 'Expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      - Expense (Cost)
                    </button>
                  </div>

                  {/* Project Selector (Integration with ERP Projects) */}
                  {projectsList.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">
                        Link to Project / Client Contract (Optional)
                      </label>
                      <select
                        value={formData.selectedProjectId}
                        onChange={(e) => handleSelectProjectInForm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-heading font-semibold focus:border-[#6324FC] focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">-- No Project Linked (General Ledger) --</option>
                        {projectsList.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.title} ({p.platform || 'Direct'} {p.budget ? `• $${p.budget}` : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Amount with USD/BDT Input Currency Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-heading font-bold tracking-widest text-secondary uppercase">
                        Amount
                      </label>
                      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setFormCurrencyMode('USD')}
                          className={`px-1.5 py-0.5 rounded ${formCurrencyMode === 'USD' ? 'bg-[#6324FC] text-white font-bold' : 'text-secondary'}`}
                        >
                          $ USD
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormCurrencyMode('BDT')}
                          className={`px-1.5 py-0.5 rounded ${formCurrencyMode === 'BDT' ? 'bg-emerald-600 text-white font-bold' : 'text-secondary'}`}
                        >
                          ৳ BDT
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary font-mono font-bold">
                        {formCurrencyMode === 'BDT' ? '৳' : '$'}
                      </span>
                      <input 
                        required 
                        type="number" 
                        step="any" 
                        min="0" 
                        value={formData.amount} 
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-8 pr-3.5 py-2.5 text-base font-mono font-bold focus:border-[#6324FC] focus:outline-none" 
                        placeholder="0.00" 
                      />
                    </div>

                    {formData.amount && (
                      <p className="text-[11px] font-mono text-secondary mt-1">
                        {formCurrencyMode === 'BDT' ? (
                          <span>≈ ${(parseFloat(formData.amount) / exchangeRate).toFixed(2)} USD (converted at ৳{exchangeRate}/$)</span>
                        ) : (
                          <span>≈ ৳{Math.round(parseFloat(formData.amount) * exchangeRate).toLocaleString()} BDT (converted at ৳{exchangeRate}/$)</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">
                      Description / Client Note
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-[#6324FC] focus:outline-none placeholder:text-secondary" 
                      placeholder="e.g. Next.js SaaS Milestone 1" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">
                        Date
                      </label>
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
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">
                        Category
                      </label>
                      <select 
                        required 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold focus:border-[#6324FC] focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="Sales">Sales</option>
                        <option value="Services">Services</option>
                        <option value="Timesheet Billing">Timesheet Billing</option>
                        <option value="Software">Software</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Salary">Salary</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">
                      Platform / Channel
                    </label>
                    <select 
                      required 
                      value={formData.platform} 
                      onChange={e => setFormData({...formData, platform: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold focus:border-[#6324FC] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="Direct">Direct (Bank / Stripe)</option>
                      <option value="Upwork">Upwork</option>
                      <option value="Fiverr">Fiverr</option>
                      <option value="Freelancer">Freelancer</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5">
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !formData.amount || !formData.description}
                      className="w-full py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,36,252,0.4)]"
                    >
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
