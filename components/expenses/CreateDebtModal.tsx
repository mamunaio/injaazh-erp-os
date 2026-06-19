'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Banknote, User, FileText, Calendar, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  initialData?: any;
}

export default function CreateDebtModal({ isOpen, onClose, onSubmit, initialData }: CreateDebtModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    personName: '',
    amount: '',
    type: 'borrowed',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          personName: initialData.personName,
          amount: initialData.amount.toString(),
          type: initialData.type,
          description: initialData.description || '',
          date: new Date(initialData.date).toISOString().split('T')[0],
        });
      } else {
        setFormData({
          personName: '',
          amount: '',
          type: 'borrowed',
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
              className="pointer-events-auto w-full max-w-lg neu-flat rounded-2xl sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] sm:max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800/50">
                <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-400">
                  {initialData ? 'Edit Record' : 'Add Loan / Debt'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                <form id="debtForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  
                  {/* Type Toggle */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Record Type
                    </label>
                    <div className="flex p-1 neu-pressed rounded-xl sm:rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'borrowed' })}
                        className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all ${
                          formData.type === 'borrowed' 
                            ? 'neu-button text-rose-500' 
                            : 'text-slate-500 hover:neu-flat'
                        }`}
                      >
                        I Owe Them (Borrowed)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'lent' })}
                        className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all ${
                          formData.type === 'lent' 
                            ? 'neu-button text-teal-500' 
                            : 'text-slate-500 hover:neu-flat'
                        }`}
                      >
                        They Owe Me (Lent)
                      </button>
                    </div>
                  </div>

                  {/* Person Name */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Person Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.personName}
                        onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 neu-pressed rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all font-semibold text-sm sm:text-base"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>

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
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 neu-pressed rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all font-semibold text-sm sm:text-base"
                        placeholder="0.00"
                      />
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
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 neu-pressed rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all font-semibold text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Description (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 sm:top-3.5 left-3 pointer-events-none">
                        <FileText size={18} className="text-slate-400" />
                      </div>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 neu-pressed rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-slate-900 dark:text-white transition-all min-h-[80px] sm:min-h-[100px] resize-none font-medium text-sm sm:text-base"
                        placeholder="e.g. Borrowed for emergency..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-800/50">
                <button
                  type="submit"
                  form="debtForm"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 neu-button text-indigo-500 rounded-xl sm:rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Saving...</>
                  ) : (
                    <>{initialData ? 'Update Record' : 'Save Record'}</>
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
