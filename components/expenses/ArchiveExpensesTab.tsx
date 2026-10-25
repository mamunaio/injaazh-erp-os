'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive, Search, Download, Calendar, Filter, ArrowUpDown, 
  Trash2, Edit3, ArrowLeft, Clock, History, FileText, 
  RotateCcw, Sparkles, ChevronLeft, ChevronRight, AlertCircle,
  PieChart, DollarSign
} from 'lucide-react';
import { format, differenceInDays, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';

export interface ExpenseItem {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
}

interface ArchiveExpensesTabProps {
  archivedExpenses: ExpenseItem[];
  liveCount: number;
  liveTotal: number;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onBackToLive?: () => void;
  categoryColors: Record<string, string>;
  formatCurrency: (amount: number) => string;
}

type DatePreset = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function ArchiveExpensesTab({
  archivedExpenses,
  liveCount,
  liveTotal,
  onEditExpense,
  onDeleteExpense,
  onBackToLive,
  categoryColors,
  formatCurrency
}: ArchiveExpensesTabProps) {
  const { confirm } = useConfirm();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const categories = useMemo(() => Object.keys(categoryColors), [categoryColors]);
  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Banking', 'Bank Transfer'];

  // Global Archive Telemetry
  const globalTelemetry = useMemo(() => {
    const total = archivedExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Oldest record
    let oldestDate: Date | null = null;
    archivedExpenses.forEach(e => {
      const d = new Date(e.date);
      if (!isNaN(d.getTime())) {
        if (!oldestDate || d < oldestDate) oldestDate = d;
      }
    });

    // Top Category
    const catMap = new Map<string, number>();
    archivedExpenses.forEach(e => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });

    let topCategory = { name: 'None', amount: 0 };
    catMap.forEach((amt, name) => {
      if (amt > topCategory.amount) topCategory = { name, amount: amt };
    });

    return {
      total,
      count: archivedExpenses.length,
      oldestDate,
      topCategory
    };
  }, [archivedExpenses]);

  // Filtered Archive Records
  const filteredExpenses = useMemo(() => {
    let result = [...archivedExpenses];
    const now = new Date();

    // Date Preset Filtering
    if (datePreset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter(e => new Date(e.date) >= startOfMonth);
    } else if (datePreset === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      result = result.filter(e => {
        const d = new Date(e.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
    } else if (datePreset === 'last_3_months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      result = result.filter(e => new Date(e.date) >= threeMonthsAgo);
    } else if (datePreset === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      result = result.filter(e => new Date(e.date) >= startOfYear);
    } else if (datePreset === 'custom') {
      if (customStartDate) {
        const start = new Date(`${customStartDate}T00:00:00`);
        result = result.filter(e => new Date(e.date) >= start);
      }
      if (customEndDate) {
        const end = new Date(`${customEndDate}T23:59:59`);
        result = result.filter(e => new Date(e.date) <= end);
      }
    }

    // Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category === selectedCategory);
    }

    // Payment Method Filter
    if (selectedPaymentMethod !== 'All') {
      result = result.filter(e => e.paymentMethod === selectedPaymentMethod);
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => 
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.paymentMethod.toLowerCase().includes(q) ||
        e.amount.toString().includes(q)
      );
    }

    // Sorting
    return result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortOption === 'date-desc') return dateB - dateA;
      if (sortOption === 'date-asc') return dateA - dateB;
      if (sortOption === 'amount-desc') return b.amount - a.amount;
      if (sortOption === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    archivedExpenses, 
    datePreset, 
    customStartDate, 
    customEndDate, 
    selectedCategory, 
    selectedPaymentMethod, 
    searchQuery, 
    sortOption
  ]);

  // Filtered metrics
  const filteredTotal = useMemo(() => 
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0), 
    [filteredExpenses]
  );

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(start, start + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPaymentMethod('All');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortOption('date-desc');
    setCurrentPage(1);
  };

  const handleExportArchive = () => {
    try {
      setIsExporting(true);
      if (filteredExpenses.length === 0) {
        toast.error('No archived records to export');
        return;
      }

      const headers = ['Date', 'Title / Description', 'Category', 'Payment Method', 'Amount (BDT)', 'Days Ago'];
      const rows = filteredExpenses.map(e => {
        const d = new Date(e.date);
        const daysAgo = !isNaN(d.getTime()) ? differenceInDays(new Date(), d) : '';
        return [
          `"${format(new Date(e.date), 'yyyy-MM-dd')}"`,
          `"${e.description.replace(/"/g, '""')}"`,
          `"${e.category}"`,
          `"${e.paymentMethod}"`,
          e.amount,
          `"${daysAgo} days ago"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `archived-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${filteredExpenses.length} archived records`);
    } catch {
      toast.error('Failed to export archived expenses');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (e: ExpenseItem) => {
    const confirmed = await confirm({
      title: 'Delete Archived Expense?',
      message: `Are you sure you want to permanently delete "${e.description}" (${formatCurrency(e.amount)}) from the archive?`,
      confirmText: 'Delete Permanently',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      setDeletingId(e._id);
      await onDeleteExpense(e._id);
    } finally {
      setDeletingId(null);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      
      {/* ── Top Header Navigation Bar ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 lg:p-5 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
            <Archive size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                Expense Archive & History (আর্কাইভ)
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                &gt; 7 Days Old
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Historical vault of operational expenses older than 7 days.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto self-end sm:self-auto">
          {onBackToLive && (
            <button
              onClick={onBackToLive}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl font-heading font-bold text-xs bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-black/5 dark:border-white/10 transition-all shadow-xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Live (7 Days)</span>
              <span className="text-[10px] font-mono bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] px-1.5 py-0.5 rounded-full">
                {liveCount}
              </span>
            </button>
          )}

          <button
            onClick={handleExportArchive}
            disabled={isExporting || filteredExpenses.length === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl font-heading font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Download size={14} />
            <span>Export Archive CSV</span>
          </button>
        </div>
      </motion.div>

      {/* ── Archive Telemetry KPI Cards ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Archived Burn */}
        <div className="group glass-card rounded-2xl p-5 min-h-[160px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/15 blur-[35px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
          
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
              <Archive size={19} />
            </div>
            <span className="text-[10px] font-heading font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              Total History
            </span>
          </div>
          <div>
            <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-0.5">Archived Total Burn</p>
            <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(globalTelemetry.total)}
            </p>
            <p className="text-xs text-secondary/80 mt-1 font-mono">
              {globalTelemetry.count} transactions in history vault
            </p>
          </div>
        </div>

        {/* Card 2: Filtered Query Total */}
        <div className="group glass-card rounded-2xl p-5 min-h-[160px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6324FC]/15 blur-[35px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
          
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] shadow-sm">
              <Filter size={19} />
            </div>
            <span className="text-[10px] font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 px-2 py-0.5 rounded-lg border border-[#6324FC]/20">
              Current Filter
            </span>
          </div>
          <div>
            <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-0.5">Filtered Selection</p>
            <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
              {formatCurrency(filteredTotal)}
            </p>
            <p className="text-xs text-secondary/80 mt-1 font-mono">
              {filteredExpenses.length} matching records
            </p>
          </div>
        </div>

        {/* Card 3: Top Archived Category */}
        <div className="group glass-card rounded-2xl p-5 min-h-[160px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/15 blur-[35px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
          
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
              <PieChart size={19} />
            </div>
            <span className="text-[10px] font-heading font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              Top Category
            </span>
          </div>
          <div>
            <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-0.5">Highest Archive Spend</p>
            <p className="text-xl lg:text-2xl font-heading font-extrabold text-slate-900 dark:text-white truncate">
              {globalTelemetry.topCategory.name}
            </p>
            <p className="text-xs text-secondary/80 mt-1 font-mono">
              {formatCurrency(globalTelemetry.topCategory.amount)} spent in category
            </p>
          </div>
        </div>

        {/* Card 4: Archive Inception Date */}
        <div className="group glass-card rounded-2xl p-5 min-h-[160px] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/15 blur-[35px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-sky-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#0EA5E9]" />
          
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 shadow-sm">
              <History size={19} />
            </div>
            <span className="text-[10px] font-heading font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
              Inception
            </span>
          </div>
          <div>
            <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-0.5">Earliest Archived Date</p>
            <p className="text-xl lg:text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono truncate">
              {globalTelemetry.oldestDate ? format(globalTelemetry.oldestDate, 'MMM dd, yyyy') : 'No History'}
            </p>
            <p className="text-xs text-secondary/80 mt-1 font-mono">
              {globalTelemetry.oldestDate ? formatDistanceToNow(globalTelemetry.oldestDate, { addSuffix: true }) : 'N/A'}
            </p>
          </div>
        </div>

      </motion.div>

      {/* ── Filters & Controls Toolbar ──────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
        
        {/* Row 1: Search & Quick Presets */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          
          {/* Search Box */}
          <div className="relative flex-1 group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] dark:group-focus-within:text-[#00E5FF] transition-colors" />
            <input 
              type="text" 
              placeholder="Search archive by description, category, payment method, or amount..." 
              value={searchQuery} 
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary" 
            />
          </div>

          {/* Date Presets Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Archive' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'last_3_months', label: 'Last 3 Months' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => { setDatePreset(p.id as DatePreset); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                  datePreset === p.id 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'bg-slate-100 dark:bg-white/5 text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

        </div>

        {/* Row 2: Secondary Dropdowns & Custom Range (if active) */}
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5">
          
          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 w-full md:w-auto p-2 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <span className="text-[10px] font-heading font-bold text-amber-500 uppercase tracking-wider pl-1">Range:</span>
              <div className="w-36">
                <DatePicker
                  value={customStartDate}
                  onChange={(val) => { setCustomStartDate(val); setCurrentPage(1); }}
                  placeholder="Start Date"
                  color="#F59E0B"
                />
              </div>
              <span className="text-secondary text-xs">to</span>
              <div className="w-36">
                <DatePicker
                  value={customEndDate}
                  onChange={(val) => { setCustomEndDate(val); setCurrentPage(1); }}
                  placeholder="End Date"
                  color="#F59E0B"
                />
              </div>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="w-full md:w-auto">
            <select 
              value={selectedCategory} 
              onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-auto bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl px-3.5 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer"
            >
              <option value="All">All Categories ({categories.length})</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div className="w-full md:w-auto">
            <select 
              value={selectedPaymentMethod} 
              onChange={e => { setSelectedPaymentMethod(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-auto bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl px-3.5 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer"
            >
              <option value="All">All Payment Methods</option>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="w-full md:w-auto ml-auto flex items-center gap-2">
            <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest hidden sm:inline">Sort:</span>
            <select 
              value={sortOption} 
              onChange={e => { setSortOption(e.target.value as SortOption); setCurrentPage(1); }}
              className="w-full md:w-auto bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-heading font-bold rounded-xl px-3.5 py-2 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount (৳)</option>
              <option value="amount-asc">Lowest Amount (৳)</option>
            </select>

            {(searchQuery || selectedCategory !== 'All' || selectedPaymentMethod !== 'All' || datePreset !== 'all' || customStartDate || customEndDate) && (
              <button
                onClick={resetFilters}
                className="p-2 text-secondary hover:text-rose-500 bg-slate-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors cursor-pointer shrink-0"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

        </div>

      </motion.div>

      {/* ── Archived Table ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/70 dark:bg-[#060608]/70 border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="pl-5 pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
                  Archived Expense Title
                </th>
                <th className="px-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
                  Category
                </th>
                <th className="px-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
                  Amount (৳)
                </th>
                <th className="px-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
                  Payment Method
                </th>
                <th className="px-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
                  Historical Date
                </th>
                <th className="px-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest whitespace-nowrap">
                  Archive Age
                </th>
                <th className="pr-5 pl-4 py-3.5 text-right text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-3.5">
                      <Archive size={24} />
                    </div>
                    <p className="text-sm font-heading font-extrabold text-slate-900 dark:text-white">
                      {archivedExpenses.length === 0 ? 'Archive Vault is Empty' : 'No matching archived records'}
                    </p>
                    <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                      {archivedExpenses.length === 0 
                        ? 'Expenses automatically transition to this vault once they pass the 7-day threshold.'
                        : 'Try adjusting your search query, category, or date range filters.'}
                    </p>
                    {archivedExpenses.length > 0 && (
                      <button
                        onClick={resetFilters}
                        className="mt-3.5 px-4 py-2 rounded-xl text-xs font-heading font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] hover:bg-[#6324FC]/20 transition-all cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((e, i) => {
                  const catColor = categoryColors[e.category] || '#64748B';
                  const expenseDate = new Date(e.date);
                  const daysAgo = !isNaN(expenseDate.getTime()) ? differenceInDays(new Date(), expenseDate) : 0;

                  return (
                    <motion.tr 
                      key={e._id} 
                      initial={{ opacity: 0, y: 6 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.015 }}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="pl-5 pr-4 py-3.5 w-[32%]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-amber-500">
                            <FileText size={14} />
                          </div>
                          <div className="overflow-hidden pr-3">
                            <span className="block font-heading font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                              {e.description}
                            </span>
                            <span className="text-[10px] text-secondary font-mono">
                              ID: {e._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold border border-black/5 dark:border-white/5" 
                          style={{ color: catColor, backgroundColor: `${catColor}15` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                          {e.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-heading font-extrabold font-mono text-slate-900 dark:text-white text-sm">
                          {formatCurrency(e.amount)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-secondary">
                          {e.paymentMethod}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                          {format(expenseDate, 'MMM dd, yyyy')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-secondary bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5">
                          <Clock size={10} className="text-amber-500" />
                          <span>{daysAgo} days ago</span>
                        </span>
                      </td>

                      <td className="pr-5 pl-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onEditExpense(e)}
                            className="p-1.5 rounded-lg text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition-colors cursor-pointer"
                            title="Edit this archived record"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(e)}
                            disabled={deletingId === e._id}
                            className="p-1.5 rounded-lg text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Pagination ───────────────────────────────────────── */}
        {filteredExpenses.length > 0 && (
          <div className="p-4 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-[#060608]/50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-secondary font-mono">
              Showing <strong className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredExpenses.length)}</strong> of <strong className="text-slate-900 dark:text-white">{filteredExpenses.length}</strong> archived records
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] text-secondary hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] text-secondary hover:text-slate-900 dark:hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

      </motion.div>

    </motion.div>
  );
}
