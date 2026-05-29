'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, Search, Filter, Edit2, Trash2, Tag, Calendar, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import CreateExpenseModal from '@/components/expenses/CreateExpenseModal';
import { createDailyExpense, updateDailyExpense, deleteDailyExpense } from '@/app/actions/dailyExpenseActions';

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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function DailyExpensesClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filtering
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = 
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  // Analytics Calculation
  const { totalSpent, currentMonthSpent, categoryData } = useMemo(() => {
    let total = 0;
    let currentMonth = 0;
    const catTotals: Record<string, number> = {};
    const now = new Date();

    expenses.forEach(expense => {
      total += expense.amount;
      
      const expDate = new Date(expense.date);
      if (expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()) {
        currentMonth += expense.amount;
      }

      catTotals[expense.category] = (catTotals[expense.category] || 0) + expense.amount;
    });

    const chartData = Object.keys(catTotals).map(name => ({
      name,
      value: catTotals[name],
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Miscellaneous']
    })).sort((a, b) => b.value - a.value);

    return { totalSpent: total, currentMonthSpent: currentMonth, categoryData: chartData };
  }, [expenses]);

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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      const res = await deleteDailyExpense(id);
      if (res.success) {
        setExpenses(expenses.filter(e => e._id !== id));
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-400 mb-2">
            Daily Expenses
          </h1>
          <p className="text-slate-600 dark:text-gray-400">Track and manage your day-to-day expenditures</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-purple-950/20 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/20 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Spent</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalSpent)}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
            <Wallet size={24} className="text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>
        <div className="bg-white/80 dark:bg-purple-950/20 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/20 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">This Month</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{formatCurrency(currentMonthSpent)}</h3>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-pink-500/10 border-2 border-pink-100 dark:border-pink-500/20 flex items-center justify-center">
            <Calendar size={24} className="text-pink-500 dark:text-pink-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Expenses Table */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-black/20">
            <div className="relative w-full sm:max-w-xs group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm text-slate-700 dark:text-slate-200"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter size={16} className="text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm text-slate-700 dark:text-slate-200 appearance-none"
              >
                <option value="All">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
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
                          <button onClick={() => { setEditingExpense(expense); setIsModalOpen(true); }} className="text-slate-400 hover:text-indigo-500 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(expense._id)} className="text-slate-400 hover:text-red-500 transition-colors">
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
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Expense Breakdown</h2>
          
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
                      formatter={(value: number) => formatCurrency(value)}
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
              <PieChart size={64} className="mb-4 opacity-50" />
              <p>No expense data available</p>
            </div>
          )}
        </div>
      </div>

      <CreateExpenseModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
        onSubmit={handleSaveExpense}
        initialData={editingExpense}
      />
    </div>
  );
}
