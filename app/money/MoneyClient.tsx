'use client';

import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Search, Edit2, Trash2, Download, FileText, BarChart3, Calendar } from 'lucide-react';
import { createTransaction, updateTransaction, deleteTransaction } from '@/app/actions/transactionActions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddTransactionModal from '@/components/AddTransactionModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import MoneyAnalytics from '@/components/MoneyAnalytics';
import { calculateTotals, groupTransactionsByPlatform } from '@/lib/analyticsUtils';
import { formatCurrency as formatCurrencyUtil, formatDateDisplay } from '@/lib/formattingUtils';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';

interface MoneyClientProps {
  initialTransactions: any[];
  platformSummary: any;
}

const PLATFORM_COLORS = {
  'Freelancer': 'from-blue-500 to-cyan-500',
  'Direct': 'from-purple-500 to-pink-500',
  'Upwork': 'from-green-500 to-emerald-500',
  'Fiverr': 'from-teal-500 to-cyan-500',
};

const PLATFORM_DOTS = {
  'Freelancer': 'bg-gradient-to-r from-blue-500 to-cyan-500',
  'Direct': 'bg-gradient-to-r from-purple-500 to-pink-500',
  'Upwork': 'bg-gradient-to-r from-green-500 to-emerald-500',
  'Fiverr': 'bg-gradient-to-r from-teal-500 to-cyan-500',
};

export default function MoneyClient({ initialTransactions, platformSummary }: MoneyClientProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [viewPeriod, setViewPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<'thisMonth' | 'last3Months' | 'thisYear' | 'custom'>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [dateError, setDateError] = useState<string>('');
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter transactions by date range
  // Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 15.5, 15.9
  const dateFilteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          // Validate date range
          const customStart = new Date(customStartDate);
          const customEnd = new Date(customEndDate);
          
          if (customEnd < customStart) {
            setDateError('End date must be greater than or equal to start date');
            return initialTransactions;
          }
          
          setDateError('');
          startDate = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 0, 0, 0, 0);
          endDate = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999);
        }
        break;
      default:
        return transactions;
    }

    // Filter with inclusive boundaries using local timezone
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, dateRange, customStartDate, customEndDate]);

  // Calculate totals from date-filtered transactions
  // Requirements: 15.6 (exclude deleted transactions)
  const totals = useMemo(() => {
    return calculateTotals(dateFilteredTransactions);
  }, [dateFilteredTransactions]);

  // Calculate platform breakdown from date-filtered transactions
  const platformBreakdown = useMemo(() => {
    return groupTransactionsByPlatform(dateFilteredTransactions);
  }, [dateFilteredTransactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return dateFilteredTransactions.filter((t) => {
      const matchesPlatform = filterPlatform === 'All' || t.platform === filterPlatform;
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesSearch = searchQuery === '' || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesPlatform && matchesType && matchesSearch;
    });
  }, [dateFilteredTransactions, filterPlatform, filterType, searchQuery]);

  // Sync with initialTransactions if it changes from server
  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const handleAddTransaction = async (data: any) => {
    const result = await createTransaction(data);
    if (result.success) {
      setTransactions([result.data, ...transactions]);
      setIsAddModalOpen(false);
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
      router.refresh();
    } else {
      alert('Failed to create transaction: ' + (result.error || 'Unknown error'));
    }
  };

  const handleEditTransaction = async (transactionId: string, data: any) => {
    const result = await updateTransaction(transactionId, data);
    if (result.success) {
      setTransactions(transactions.map(t => t._id === transactionId ? result.data : t));
      setIsEditModalOpen(false);
      setSelectedTransaction(null);
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
      router.refresh();
    } else {
      alert('Failed to update transaction: ' + (result.error || 'Unknown error'));
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this transaction?', danger: true });
    if (!isConfirmed) return;
    
    const result = await deleteTransaction(transactionId);
    if (result.success) {
      setTransactions(transactions.filter(t => t._id !== transactionId));
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
      router.refresh();
    } else {
      alert('Failed to delete transaction: ' + (result.error || 'Unknown error'));
    }
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString);
  };

  const handleExportCSV = async () => {
    // Check for large datasets
    if (filteredTransactions.length > 100) {
      const isConfirmed = await confirm({ message: `You are about to export ${filteredTransactions.length} transactions. This may take a moment. Continue?` });
      if (!isConfirmed) return;
    }
    
    const result = exportToCSV(filteredTransactions);
    
    if (result.success) {
      setExportStatus({ type: 'success', message: 'CSV exported successfully!' });
      setTimeout(() => setExportStatus(null), 3000);
    } else {
      setExportStatus({ type: 'error', message: result.error || 'Failed to export CSV. Please try again.' });
    }
  };

  const handleExportPDF = async () => {
    // Check for large datasets
    if (filteredTransactions.length > 1000) {
      const isConfirmed = await confirm({ message: `You are about to export ${filteredTransactions.length} transactions. Only the first 1000 will be included. Continue?`, danger: true });
      if (!isConfirmed) return;
    }
    
    const result = exportToPDF(filteredTransactions, platformSummary, totals);
    
    if (result.success) {
      setExportStatus({ type: 'success', message: 'PDF export initiated!' });
      setTimeout(() => setExportStatus(null), 3000);
    } else {
      setExportStatus({ type: 'error', message: result.error || 'Failed to export PDF. Please try again.' });
    }
  };

  // Calculate monthly summary
  const monthlySummary = useMemo(() => {
    const monthMap = new Map<string, { income: number; expense: number; profit: number; transactions: number }>();
    
    dateFilteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { income: 0, expense: 0, profit: 0, transactions: 0 });
      }
      
      const data = monthMap.get(monthKey)!;
      data.transactions++;
      
      if (t.type === 'Income') {
        data.income += t.amount;
      } else {
        data.expense += t.amount;
      }
      data.profit = data.income - data.expense;
    });
    
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
  }, [dateFilteredTransactions]);

  return (
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Export Status Notification */}
      {exportStatus && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in ${
          exportStatus.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {exportStatus.message}
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="mb-3">
            💰 Money Management
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-600 dark:text-gray-400">Track income, expenses, and profits across platforms</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex neu-pressed rounded-xl overflow-hidden">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-6 py-3 bg-transparent text-sm font-jakarta font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="thisMonth">This Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {dateRange === 'custom' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <DatePicker
                  value={customStartDate}
                  onChange={(val) => setCustomStartDate(val)}
                  placeholder="Start Date"
                />
                <span className="text-slate-500 dark:text-slate-400 font-bold px-2">to</span>
                <DatePicker
                  value={customEndDate}
                  onChange={(val) => setCustomEndDate(val)}
                  placeholder="End Date"
                />
              </div>
              {dateError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                  {dateError}
                </div>
              )}
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex neu-pressed rounded-xl overflow-hidden p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-jakarta font-bold transition-all ${viewMode === 'list' ? 'neu-button text-indigo-500' : 'text-slate-600 dark:text-gray-400 hover:neu-flat'}`}
            >
              <FileText size={16} /> List
            </button>
            <button 
              onClick={() => setViewMode('analytics')}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-jakarta font-bold transition-all ${viewMode === 'analytics' ? 'neu-button text-indigo-500' : 'text-slate-600 dark:text-gray-400 hover:neu-flat'}`}
            >
              <BarChart3 size={16} /> Analytics
            </button>
          </div>

          {/* Period Toggle (only show in analytics mode) */}
          {viewMode === 'analytics' && (
            <div className="flex neu-pressed rounded-xl overflow-hidden p-1">
              <button 
                onClick={() => setViewPeriod('monthly')}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-jakarta font-bold transition-all ${viewPeriod === 'monthly' ? 'neu-button text-indigo-500' : 'text-slate-600 dark:text-gray-400 hover:neu-flat'}`}
              >
                <Calendar size={16} /> Monthly
              </button>
              <button 
                onClick={() => setViewPeriod('yearly')}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-jakarta font-bold transition-all ${viewPeriod === 'yearly' ? 'neu-button text-indigo-500' : 'text-slate-600 dark:text-gray-400 hover:neu-flat'}`}
              >
                <Calendar size={16} /> Yearly
              </button>
            </div>
          )}

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-6 py-3 neu-button text-slate-700 dark:text-slate-300 font-jakarta font-bold rounded-xl hover:-translate-y-1 transition-all text-sm">
              <Download size={18} /> Export
            </button>
            <div className="absolute right-0 mt-2 w-48 neu-flat rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-2">
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-3 text-left text-sm font-inter text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-xl transition-colors flex items-center gap-2"
              >
                <FileText size={16} /> Export as CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full px-4 py-3 text-left text-sm font-inter text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-xl transition-colors flex items-center gap-2"
              >
                <FileText size={16} /> Export as PDF
              </button>
            </div>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 neu-button text-indigo-500 dark:text-indigo-400 font-jakarta font-bold rounded-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/40 transition-all text-sm"
          >
            <Plus size={20} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Income */}
        <div className="neu-flat rounded-[2rem] p-6 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 neu-pressed rounded-2xl flex items-center justify-center text-green-500">
              <TrendingUp size={24} className="text-white" />
            </div>
            <span className="text-xs font-jakarta font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-3 py-1 rounded-full">
              Income
            </span>
          </div>
          <h3 className="mb-1">
            {formatCurrency(totals.income)}
          </h3>
          <p className="text-sm font-inter text-slate-600 dark:text-slate-400">Total earnings</p>
        </div>

        {/* Total Expense */}
        <div className="neu-flat rounded-[2rem] p-6 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 neu-pressed rounded-2xl flex items-center justify-center text-red-500">
              <TrendingDown size={24} className="text-white" />
            </div>
            <span className="text-xs font-jakarta font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-3 py-1 rounded-full">
              Expense
            </span>
          </div>
          <h3 className="mb-1">
            {formatCurrency(totals.expense)}
          </h3>
          <p className="text-sm font-inter text-slate-600 dark:text-slate-400">Total spending</p>
        </div>

        {/* Net Profit */}
        <div className="neu-flat rounded-[2rem] p-6 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 neu-pressed rounded-2xl flex items-center justify-center text-purple-500">
              <DollarSign size={24} className="text-white" />
            </div>
            <span className="text-xs font-jakarta font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-3 py-1 rounded-full">
              Profit
            </span>
          </div>
          <h3 className="mb-1">
            {formatCurrency(totals.profit)}
          </h3>
          <p className="text-sm font-inter text-slate-600 dark:text-slate-400">Net earnings</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="mb-10">
        <h2 className="mb-6">Platform Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Freelancer', 'Direct', 'Upwork', 'Fiverr'].map(platform => {
            const data = platformBreakdown.find(p => p.platform === platform) || {
              income: 0,
              expense: 0,
              profit: 0
            };
            return (
              <div
                key={platform}
                className="neu-flat rounded-3xl p-6 hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-4 h-4 rounded-full ${PLATFORM_DOTS[platform as keyof typeof PLATFORM_DOTS] || 'bg-slate-400'} shadow-md`} />
                  <h3 className="">{platform}</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-inter text-slate-600 dark:text-slate-400">Income</span>
                    <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(data.income)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-inter text-slate-600 dark:text-slate-400">Expense</span>
                    <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(data.expense)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-jakarta font-bold text-slate-700 dark:text-slate-300">Profit</span>
                      <span className={`text-lg font-mono font-bold ${data.profit >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(data.profit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions List */}
      {viewMode === 'list' && (
        <div className="neu-flat rounded-[2rem] p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="">Recent Transactions</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Platform Filter */}
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none transition-all placeholder:text-slate-400 appearance-none"
            >
              <option value="All">All Platforms</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Direct">Direct</option>
              <option value="Upwork">Upwork</option>
              <option value="Fiverr">Fiverr</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none transition-all placeholder:text-slate-400 appearance-none"
            >
              <option value="All">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 neu-pressed text-slate-800 dark:text-white rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Platform</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Project</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${PLATFORM_DOTS[transaction.platform as keyof typeof PLATFORM_DOTS]}`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {transaction.platform}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {transaction.category}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        transaction.type === 'Income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right text-sm font-bold ${
                      transaction.type === 'Income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {transaction.description || '-'}
                    </td>
                    {/* 
                      Project Link Display with Error Handling
                      
                      This cell displays the linked marketplace project for transactions
                      that were created from or linked to a project. It handles three states:
                      
                      1. Valid Project Link: When transaction.projectId exists and contains
                         all required fields (_id, title, platform), display a clickable
                         link to the project details page.
                      
                      2. Deleted Project: When transaction.projectId exists but the populated
                         data is incomplete (missing _id, title, or platform), this indicates
                         the referenced project was deleted. Display "Project deleted" message.
                      
                      3. No Project Link: When transaction.projectId is null/undefined,
                         the transaction was created standalone without a project link.
                         Display a dash "-" to indicate no project association.
                      
                      This graceful degradation ensures the transaction list remains functional
                      even when project references become invalid due to project deletion.
                    */}
                    <td className="py-4 px-4 text-sm">
                      {transaction.projectId ? (
                        transaction.projectId._id && transaction.projectId.title && transaction.projectId.platform ? (
                          <Link 
                            href={`/marketplace/${transaction.projectId.platform.toLowerCase()}/${transaction.projectId._id}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            {transaction.projectId.title}
                          </Link>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Project deleted</span>
                        )
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-600 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction._id)}
                          className="p-2 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
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
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <>
          <MoneyAnalytics 
            transactions={dateFilteredTransactions}
            viewPeriod={viewPeriod}
          />

          {/* Monthly Summary Table */}
          <div className="mt-10 neu-flat rounded-[2rem] p-6">
            <h2 className="mb-6">Monthly Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Month</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Transactions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Income</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Expense</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        No data for selected period
                      </td>
                    </tr>
                  ) : (
                    monthlySummary.map((month, idx) => {
                      const margin = month.income > 0 ? ((month.profit / month.income) * 100).toFixed(1) : '0.0';
                      return (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {month.month}
                          </td>
                          <td className="py-4 px-4 text-right text-sm text-slate-600 dark:text-slate-400">
                            {month.transactions}
                          </td>
                          <td className="py-4 px-4 text-right text-sm font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(month.income)}
                          </td>
                          <td className="py-4 px-4 text-right text-sm font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(month.expense)}
                          </td>
                          <td className={`py-4 px-4 text-right text-sm font-bold ${
                            month.profit >= 0 
                              ? 'text-purple-600 dark:text-purple-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(month.profit)}
                          </td>
                          <td className={`py-4 px-4 text-right text-sm font-bold ${
                            parseFloat(margin) >= 50 
                              ? 'text-green-600 dark:text-green-400'
                              : parseFloat(margin) >= 30
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {margin}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {monthlySummary.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 dark:border-slate-600">
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td className="py-4 px-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                        Total
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-bold text-slate-800 dark:text-slate-200">
                        {monthlySummary.reduce((sum, m) => sum + m.transactions, 0)}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(monthlySummary.reduce((sum, m) => sum + m.income, 0))}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(monthlySummary.reduce((sum, m) => sum + m.expense, 0))}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(monthlySummary.reduce((sum, m) => sum + m.profit, 0))}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-bold text-slate-800 dark:text-slate-200">
                        {(() => {
                          const totalIncome = monthlySummary.reduce((sum, m) => sum + m.income, 0);
                          const totalProfit = monthlySummary.reduce((sum, m) => sum + m.profit, 0);
                          return totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : '0.0';
                        })()}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onUpdateTransaction={handleEditTransaction}
      />
    </div>
  );
}
