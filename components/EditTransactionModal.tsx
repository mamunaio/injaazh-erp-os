'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onUpdateTransaction: (transactionId: string, data: any) => void;
}

const CATEGORIES = [
  'Project Payment',
  'Subscription',
  'Platform Fee',
  'Connects/Bids',
  'Tools/Software',
  'Marketing',
  'Withdrawal Fee',
  'Other',
];

export default function EditTransactionModal({ isOpen, onClose, transaction, onUpdateTransaction }: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    platform: 'Freelancer',
    type: 'Income',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Project Payment',
    description: '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        platform: transaction.platform || 'Freelancer',
        type: transaction.type || 'Income',
        amount: transaction.amount?.toString() || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: transaction.category || 'Project Payment',
        description: transaction.description || '',
      });
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!transaction?._id) return;

    onUpdateTransaction(transaction._id, formData);
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md">
      <div className="neu-flat rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-all neu-flat p-2.5 rounded-xl hover:-translate-y-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Platform & Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Platform */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Platform *
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all appearance-none"
                required
              >
                <option value="Freelancer">Freelancer</option>
                <option value="Direct">Direct/Local</option>
                <option value="Upwork">Upwork</option>
                <option value="Fiverr">Fiverr</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all appearance-none"
                required
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
          </div>

          {/* Amount & Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Amount (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all appearance-none"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this transaction..."
              rows={3}
              className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 neu-button text-slate-600 dark:text-slate-300 font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 neu-button text-indigo-500 font-semibold rounded-xl transition-all"
            >
              Update Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
