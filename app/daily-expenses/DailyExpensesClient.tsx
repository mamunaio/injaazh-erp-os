'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, Search, Filter, Edit2, Trash2, Tag, Calendar, Download, ArrowRightLeft, CheckCircle2, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import CreateExpenseModal from '@/components/expenses/CreateExpenseModal';
import CreateDebtModal from '@/components/expenses/CreateDebtModal';
import PartialPaymentModal from '@/components/expenses/PartialPaymentModal';
import { createDailyExpense, updateDailyExpense, deleteDailyExpense } from '@/app/actions/dailyExpenseActions';
import { createPersonalDebt, updatePersonalDebt, deletePersonalDebt, settlePersonalDebt, makePartialPayment } from '@/app/actions/personalDebtActions';

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  'Transportation': '#3b82f6',
  'Office Supplies': '#10b981',
  'Utilities': '#8b5cf6',
  'Shopping': '#ec4899',
  'Entertainment': '#6366f1',
  'Healthcare': '#ef4444',
  'Software & Subscriptions': '#14b8a6',
  'Miscellaneous': '#64748b',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function DailyExpensesClient({ initialExpenses, initialDebts = [] }: { initialExpenses: any[], initialDebts?: any[] }) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'debts'>('expenses');
  const [timeFilter, setTimeFilter] = useState<'7days' | 'month' | 'year' | 'all'>('7days');

  // ================= EXPENSES STATE =================
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ================= DEBTS STATE =================
  const [debts, setDebts] = useState(initialDebts);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [debtSearchQuery, setDebtSearchQuery] = useState('');
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<any>(null);

  // ================= DATE RANGE FILTER HELPER =================
  const filterByDateRange = useMemo(() => {
    return (items: any[]) => {
      const now = new Date();
      return items.filter(item => {
        if (!item.date) return true;
        const dateParts = item.date.split('T')[0].split('-');
        if (dateParts.length !== 3) return true;
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
        const day = parseInt(dateParts[2], 10);
        const itemDate = new Date(year, month, day);
        
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (timeFilter === '7days') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return itemDate >= sevenDaysAgo && itemDate <= today;
        }
        if (timeFilter === 'month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (timeFilter === 'year') {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true; // 'all'
      });
    };
  }, [timeFilter]);

  // ================= EXPENSES LOGIC =================
  const dateFilteredExpenses = useMemo(() => {
    return filterByDateRange(expenses);
  }, [expenses, filterByDateRange]);

  const filteredExpenses = useMemo(() => {
    return dateFilteredExpenses.filter(expense => {
      const matchesSearch = 
        expense.description.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(expenseSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [dateFilteredExpenses, expenseSearchQuery, selectedCategory]);

  const currentMonthSpent = useMemo(() => {
    let currentMonth = 0;
    const now = new Date();
    expenses.forEach(expense => {
      if (!expense.date) return;
      const dateParts = expense.date.split('T')[0].split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        if (month === now.getMonth() && year === now.getFullYear()) {
          currentMonth += expense.amount;
        }
      }
    });
    return currentMonth;
  }, [expenses]);

  const { totalSpent, allTimeTotal, categoryData } = useMemo(() => {
    let total = 0;
    const catTotals: Record<string, number> = {};

    dateFilteredExpenses.forEach(expense => {
      total += expense.amount;
      catTotals[expense.category] = (catTotals[expense.category] || 0) + expense.amount;
    });

    let allTime = 0;
    expenses.forEach(expense => {
      allTime += expense.amount;
    });

    const chartData = Object.keys(catTotals).map(name => ({
      name,
      value: catTotals[name],
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Miscellaneous']
    })).sort((a, b) => b.value - a.value);

    return { totalSpent: total, allTimeTotal: allTime, categoryData: chartData };
  }, [dateFilteredExpenses, expenses]);

  const handleSaveExpense = async (data: any) => {
    if (editingExpense) {
      const res = await updateDailyExpense(editingExpense._id, data);
      if (res.success) {
        setExpenses(expenses.map(e => e._id === editingExpense._id ? res.data : e));
        setEditingExpense(null);
        return true;
      }
    } else {
      const res = await createDailyExpense(data);
      if (res.success) {
        setExpenses([res.data, ...expenses]);
        return true;
      }
    }
    return false;
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      const res = await deleteDailyExpense(id);
      if (res.success) {
        setExpenses(expenses.filter(e => e._id !== id));
      }
    }
  };

  // ================= DEBTS LOGIC =================
  const dateFilteredDebts = useMemo(() => {
    return filterByDateRange(debts);
  }, [debts, filterByDateRange]);

  const filteredDebts = useMemo(() => {
    return dateFilteredDebts.filter(debt => 
      debt.personName.toLowerCase().includes(debtSearchQuery.toLowerCase()) ||
      debt.description?.toLowerCase().includes(debtSearchQuery.toLowerCase())
    );
  }, [dateFilteredDebts, debtSearchQuery]);

  const { totalBorrowed, totalLent } = useMemo(() => {
    let borrowed = 0;
    let lent = 0;
    dateFilteredDebts.forEach(debt => {
      if (debt.status === 'pending') {
        if (debt.type === 'borrowed') borrowed += debt.amount;
        if (debt.type === 'lent') lent += debt.amount;
      }
    });
    return { totalBorrowed: borrowed, totalLent: lent };
  }, [dateFilteredDebts]);

  const handleSaveDebt = async (data: any) => {
    if (editingDebt) {
      const res = await updatePersonalDebt(editingDebt._id, data);
      if (res.success) {
        setDebts(debts.map(d => d._id === editingDebt._id ? res.data : d));
        setEditingDebt(null);
        return true;
      }
    } else {
      const res = await createPersonalDebt(data);
      if (res.success) {
        setDebts([res.data, ...debts]);
        return true;
      }
    }
    return false;
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const res = await deletePersonalDebt(id);
      if (res.success) {
        setDebts(debts.filter(d => d._id !== id));
      }
    }
  };

  const handleSettleDebt = async (id: string) => {
    if (confirm('Mark this record as settled?')) {
      const res = await settlePersonalDebt(id);
      if (res.success) {
        setDebts(debts.map(d => d._id === id ? res.data : d));
      }
    }
  };

  const handlePartialPayment = async (paymentAmount: number, note: string) => {
    if (!selectedDebtForPayment) return false;
    
    console.log('Making payment:', { 
      debtId: selectedDebtForPayment._id, 
      paymentAmount, 
      note,
      currentDebt: selectedDebtForPayment 
    });
    
    const res = await makePartialPayment(selectedDebtForPayment._id, paymentAmount, note);
    
    console.log('Payment response:', res);
    
    if (res.success) {
      console.log('Updated debt:', res.data);
      
      // Update the debts state with the new data
      const updatedDebts = debts.map(d => 
        d._id === selectedDebtForPayment._id ? res.data : d
      );
      
      console.log('New debts state:', updatedDebts);
      setDebts(updatedDebts);
      
      // Show success message
      if (res.message) {
        alert(res.message);
      }
      return true;
    } else {
      console.error('Payment failed:', res.error);
      alert(res.error || 'Failed to record payment');
      return false;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="mb-3">
            Personal Finances
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-600 dark:text-gray-400">Track day-to-day expenditures and personal debts</p>
        </div>
        
        <div className="flex neu-pressed p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 rounded-lg text-sm font-jakarta font-bold transition-all ${
              activeTab === 'expenses'
                ? 'neu-button text-indigo-500'
                : 'text-slate-500 hover:neu-flat'
            }`}
          >
            Daily Expenses
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`px-6 py-3 rounded-lg text-sm font-jakarta font-bold transition-all ${
              activeTab === 'debts'
                ? 'neu-button text-rose-500'
                : 'text-slate-500 hover:neu-flat'
            }`}
          >
            Loans & Debts
          </button>
        </div>
      </div>

      {/* Unified Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 neu-flat rounded-2xl p-4">
        <div className="flex neu-pressed p-1 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setTimeFilter('7days')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-jakarta font-bold transition-all ${
              timeFilter === '7days'
                ? 'neu-button text-indigo-500'
                : 'text-slate-500 hover:neu-flat'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-jakarta font-bold transition-all ${
              timeFilter === 'month'
                ? 'neu-button text-indigo-500'
                : 'text-slate-500 hover:neu-flat'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeFilter('year')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-jakarta font-bold transition-all ${
              timeFilter === 'year'
                ? 'neu-button text-indigo-500'
                : 'text-slate-500 hover:neu-flat'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-jakarta font-bold transition-all ${
              timeFilter === 'all'
                ? 'neu-button text-indigo-500'
                : 'text-slate-500 hover:neu-flat'
            }`}
          >
            All Time
          </button>
        </div>

        {activeTab === 'expenses' ? (
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 neu-button text-indigo-500 rounded-xl text-sm font-jakarta font-bold transition-all"
          >
            <Plus size={16} />
            <span>Log Expense</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingDebt(null);
              setIsDebtModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 neu-button text-rose-500 rounded-xl text-sm font-jakarta font-bold transition-all"
          >
            <Plus size={16} />
            <span>Add Record</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'expenses' && (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="neu-flat rounded-[2rem] p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-gray-400 text-sm font-jakarta font-bold uppercase tracking-wider mb-1">
                    {timeFilter === '7days' && 'Spent (Last 7 Days)'}
                    {timeFilter === 'month' && 'Spent (This Month)'}
                    {timeFilter === 'year' && 'Spent (This Year)'}
                    {timeFilter === 'all' && 'Spent (All Time)'}
                  </p>
                  <h3 className="">{formatCurrency(totalSpent)}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl neu-pressed flex items-center justify-center">
                  <Wallet size={24} className="text-indigo-500 dark:text-indigo-400" />
                </div>
              </div>
              <div className="neu-flat rounded-[2rem] p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-gray-400 text-sm font-jakarta font-bold uppercase tracking-wider mb-1">
                    {timeFilter === 'all' ? 'Spent (This Month)' : 'Spent (All Time)'}
                  </p>
                  <h3 className="">
                    {formatCurrency(timeFilter === 'all' ? currentMonthSpent : allTimeTotal)}
                  </h3>
                </div>
                <div className="w-14 h-14 rounded-2xl neu-pressed flex items-center justify-center">
                  <Calendar size={24} className="text-pink-500 dark:text-pink-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Expenses Table */}
              <div className="neu-flat rounded-[2rem] overflow-hidden flex flex-col lg:col-span-2">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:max-w-xs group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={expenseSearchQuery}
                      onChange={(e) => setExpenseSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 neu-pressed text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none transition-all text-sm placeholder:text-slate-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Filter size={16} className="text-slate-400" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full sm:w-auto pl-3 pr-8 py-2 neu-pressed text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none transition-all text-sm appearance-none"
                    >
                      <option value="All">All Categories</option>
                      {Object.keys(CATEGORY_COLORS).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800/50">
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                        <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                        <th className="text-center py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">No expenses found matching your criteria.</td>
                        </tr>
                      ) : (
                        filteredExpenses.map((expense) => (
                          <tr key={expense._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {formatDate(expense.date)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                                  style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['Miscellaneous'] }}
                                />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{expense.category}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                              {expense.description || '-'}
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                              {expense.paymentMethod}
                            </td>
                            <td className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-white text-right">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex justify-center gap-3">
                                <button onClick={() => { setEditingExpense(expense); setIsExpenseModalOpen(true); }} className="text-slate-400 hover:text-indigo-500 transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteExpense(expense._id)} className="text-slate-400 hover:text-red-500 transition-colors">
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

              {/* Expense Breakdown Chart */}
              <div className="neu-flat rounded-[2rem] p-6 flex flex-col h-full">
                <h2 className="mb-6">Expense Breakdown</h2>
                
                {categoryData.length > 0 ? (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => formatCurrency(Number(value) || 0)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full mt-6 space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {categoryData.map((data, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: data.color }} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{data.name}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(data.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <PieChartIcon size={64} className="mb-4 opacity-50" />
                    <p>No expense data available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'debts' && (
          <motion.div
            key="debts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="neu-flat rounded-[2rem] p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">
                    {timeFilter === '7days' && 'I Owe (Last 7 Days)'}
                    {timeFilter === 'month' && 'I Owe (This Month)'}
                    {timeFilter === 'year' && 'I Owe (This Year)'}
                    {timeFilter === 'all' && 'Total I Owe'}
                  </p>
                  <h3 className="">{formatCurrency(totalBorrowed)}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl neu-pressed flex items-center justify-center">
                  <ArrowRightLeft size={24} className="text-rose-500 dark:text-rose-400" />
                </div>
              </div>
              <div className="neu-flat rounded-[2rem] p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">
                    {timeFilter === '7days' && 'Owed to Me (Last 7 Days)'}
                    {timeFilter === 'month' && 'Owed to Me (This Month)'}
                    {timeFilter === 'year' && 'Owed to Me (This Year)'}
                    {timeFilter === 'all' && 'Total Owed To Me'}
                  </p>
                  <h3 className="">{formatCurrency(totalLent)}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl neu-pressed flex items-center justify-center">
                  <Wallet size={24} className="text-teal-500 dark:text-teal-400" />
                </div>
              </div>
            </div>

            {/* Main Debts Table */}
            <div className="neu-flat rounded-[2rem] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-xs group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={debtSearchQuery}
                    onChange={(e) => setDebtSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 neu-pressed text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none transition-all text-sm placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800/50">
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Person</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Original</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paid</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Remaining</th>
                      <th className="text-center py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="text-center py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDebts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">No records found.</td>
                      </tr>
                    ) : (
                      filteredDebts.map((debt) => (
                        <tr key={debt._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {formatDate(debt.date)}
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-white">
                            {debt.personName}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              debt.type === 'borrowed' 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' 
                                : 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400'
                            }`}>
                              {debt.type === 'borrowed' ? 'I Owe' : 'Owed to Me'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                            {debt.description || '-'}
                          </td>
                          <td className="py-4 px-6 text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 text-right">
                            {formatCurrency(debt.originalAmount || debt.amount)}
                          </td>
                          <td className="py-4 px-6 text-sm font-mono font-semibold text-green-600 dark:text-green-400 text-right">
                            {formatCurrency(debt.paidAmount || 0)}
                          </td>
                          <td className="py-4 px-6 text-sm font-mono font-bold text-slate-800 dark:text-white text-right">
                            {formatCurrency(debt.amount)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              debt.status === 'settled' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            }`}>
                              {debt.status === 'settled' ? 'Settled' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center gap-2">
                              {debt.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => { 
                                      setSelectedDebtForPayment(debt); 
                                      setIsPartialPaymentModalOpen(true); 
                                    }} 
                                    className="text-slate-400 hover:text-blue-500 transition-colors" 
                                    title="Make Payment"
                                  >
                                    <Wallet size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleSettleDebt(debt._id)} 
                                    className="text-slate-400 hover:text-green-500 transition-colors" 
                                    title="Mark as Settled"
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => { setEditingDebt(debt); setIsDebtModalOpen(true); }} 
                                className="text-slate-400 hover:text-indigo-500 transition-colors" 
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteDebt(debt._id)} 
                                className="text-slate-400 hover:text-red-500 transition-colors" 
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
          </motion.div>
        )}
      </AnimatePresence>

      <CreateExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }}
        onSubmit={handleSaveExpense}
        initialData={editingExpense}
      />

      <CreateDebtModal 
        isOpen={isDebtModalOpen}
        onClose={() => { setIsDebtModalOpen(false); setEditingDebt(null); }}
        onSubmit={handleSaveDebt}
        initialData={editingDebt}
      />

      <PartialPaymentModal
        isOpen={isPartialPaymentModalOpen}
        onClose={() => { setIsPartialPaymentModalOpen(false); setSelectedDebtForPayment(null); }}
        onSubmit={handlePartialPayment}
        debt={selectedDebtForPayment || { personName: '', amount: 0, originalAmount: 0, paidAmount: 0, type: 'borrowed' }}
      />
    </div>
  );
}
