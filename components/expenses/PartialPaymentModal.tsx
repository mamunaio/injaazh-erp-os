'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Banknote, FileText, Calendar, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentAmount: number, note: string) => Promise<boolean>;
  debt: {
    personName: string;
    amount: number; // Remaining amount
    originalAmount: number;
    paidAmount: number;
    type: 'borrowed' | 'lent';
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function PartialPaymentModal({ isOpen, onClose, onSubmit, debt }: PartialPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Safety check for undefined values
  const safeDebt = {
    ...debt,
    originalAmount: debt.originalAmount || debt.amount || 0,
    paidAmount: debt.paidAmount || 0,
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened with debt:', debt);
      console.log('Safe debt:', safeDebt);
      setPaymentAmount('');
      setNote('');
      setError('');
    }
  }, [isOpen, debt]);

  const handleAmountChange = (value: string) => {
    setPaymentAmount(value);
    setError('');
    
    const amount = parseFloat(value);
    if (amount > safeDebt.amount) {
      setError(`Amount cannot exceed remaining balance of ${formatCurrency(safeDebt.amount)}`);
    } else if (amount <= 0) {
      setError('Amount must be greater than 0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amount > safeDebt.amount) {
      setError(`Amount cannot exceed ${formatCurrency(safeDebt.amount)}`);
      return;
    }
    
    setIsSubmitting(true);
    const success = await onSubmit(amount, note);
    setIsSubmitting(false);
    
    if (success) onClose();
  };

  const setQuickAmount = (percentage: number) => {
    const amount = (safeDebt.amount * percentage / 100).toFixed(2);
    setPaymentAmount(amount);
    setError('');
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
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-400">
                    Record Payment
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {safeDebt.type === 'borrowed' ? 'Paying back' : 'Receiving from'} {safeDebt.personName}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Debt Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Original Amount</span>
                    <span className="text-sm font-mono font-bold text-slate-800 dark:text-white">{formatCurrency(safeDebt.originalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Paid So Far</span>
                    <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400">{formatCurrency(safeDebt.paidAmount)}</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Remaining Balance</span>
                    <span className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(safeDebt.amount)}</span>
                  </div>
                </div>

                <form id="paymentForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  
                  {/* Payment Amount */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Payment Amount
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={paymentAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border ${
                          error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                        } rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all font-semibold text-sm sm:text-base`}
                        placeholder="0.00"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <span>⚠</span> {error}
                      </p>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Quick Select
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickAmount(25)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickAmount(50)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickAmount(75)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickAmount(100)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-green-900/30 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
                      >
                        Full
                      </button>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Note (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 sm:top-3.5 left-3 pointer-events-none">
                        <FileText size={18} className="text-slate-400" />
                      </div>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all min-h-[80px] sm:min-h-[100px] resize-none font-medium text-sm sm:text-base"
                        placeholder="e.g. Partial payment via bank transfer..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="submit"
                  form="paymentForm"
                  disabled={isSubmitting || !!error || !paymentAmount}
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl sm:rounded-2xl font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Recording Payment...</>
                  ) : (
                    <><TrendingDown size={18} /> Record Payment</>
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
