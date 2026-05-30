'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Banknote, Tag, FileText, Calendar, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXPENSE_CATEGORIES = [
  'Food & Dining', 
  'Transportation', 
  'Office Supplies', 
  'Utilities', 
  'Shopping', 
  'Entertainment', 
  'Healthcare', 
  'Software & Subscriptions',
  'Miscellaneous'
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Banking', 'Bank Transfer'];

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  initialData?: any;
}

export default function CreateExpenseModal({ isOpen, onClose, onSubmit, initialData }: ExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Miscellaneous',
    paymentMethod: 'Cash',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          amount: initialData.amount.toString(),
          category: initialData.category,
          paymentMethod: initialData.paymentMethod,
          description: initialData.description || '',
          date: new Date(initialData.date).toISOString().split('T')[0],
        });
      } else {
        setFormData({
          amount: '',
          category: 'Miscellaneous',
          paymentMethod: 'Cash',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
    
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="pointer-events-auto w-full max-w-lg bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-2xl sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] sm:max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50">
                <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-400">
                  {initialData ? 'Edit Expense' : 'Log Daily Expense'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                <form id="expenseForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  
                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Amount
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all font-semibold text-sm sm:text-base"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Category & Payment Method */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Tag size={16} className="text-slate-400" />
                        </div>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all appearance-none font-semibold cursor-pointer text-sm sm:text-base"
                        >
                          {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        Payment Method
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard size={16} className="text-slate-400" />
                        </div>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all appearance-none font-semibold cursor-pointer text-sm sm:text-base"
                        >
                          {PAYMENT_METHODS.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all font-semibold text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 sm:top-3.5 left-3 pointer-events-none">
                        <FileText size={18} className="text-slate-400" />
                      </div>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all min-h-[80px] sm:min-h-[100px] resize-none font-medium text-sm sm:text-base"
                        placeholder="e.g. Lunch at KFC, Uber ride to office..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="submit"
                  form="expenseForm"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Saving...</>
                  ) : (
                    <>{initialData ? 'Update Expense' : 'Save Expense'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
