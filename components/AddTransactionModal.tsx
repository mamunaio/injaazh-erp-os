'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Props for the AddTransactionModal component
 */
interface AddTransactionModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Callback function to handle transaction creation with form data */
  onAddTransaction: (data: any) => void;
  /**
   * Optional project ID to link the transaction to a marketplace project.
   * When provided, the transaction will be created with this projectId reference.
   * This field is hidden from the user and automatically included in submission data.
   * 
   * @since marketplace-integration feature
   */
  projectId?: string;
  /**
   * Optional initial data to pre-populate form fields.
   * Used when creating transactions from project details page to auto-fill
   * platform, amount, and description based on project data.
   * Users can modify all pre-populated fields before submission.
   * 
   * @since marketplace-integration feature
   */
  initialData?: {
    /** Pre-populated platform (Freelancer, Direct, Upwork, Fiverr) */
    platform?: string;
    /** Pre-populated transaction amount */
    amount?: string;
    /** Pre-populated transaction description */
    description?: string;
  };
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

/**
 * AddTransactionModal Component
 * 
 * A modal dialog for creating new financial transactions in the Money Management system.
 * Supports both standalone transaction creation and project-linked transaction creation.
 * 
 * @component
 * @example
 * ```tsx
 * // Standalone transaction
 * <AddTransactionModal 
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   onAddTransaction={(data) => createTransaction(data)}
 * />
 * 
 * // Project-linked transaction with pre-populated data
 * <AddTransactionModal 
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   onAddTransaction={(data) => createTransactionFromProject(projectId, data)}
 *   projectId="project123"
 *   initialData={{
 *     platform: "Upwork",
 *     amount: "1500",
 *     description: "Website Development Project"
 *   }}
 * />
 * ```
 * 
 * Features:
 * - Pre-population support for project-linked transactions
 * - All pre-populated fields are user-editable
 * - Automatic projectId inclusion when provided (hidden from user)
 * - Form validation for required fields
 * - Responsive design with dark mode support
 * - Category selection from predefined list
 * 
 * Form Fields:
 * - Platform: Freelancer, Direct, Upwork, Fiverr
 * - Type: Income or Expense
 * - Amount: Numeric value with 2 decimal places
 * - Date: Date picker (defaults to current date)
 * - Category: Predefined categories
 * - Description: Optional text area
 * 
 * @param {AddTransactionModalProps} props - Component props
 * @returns {JSX.Element | null} Rendered modal or null if not open
 */
export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onAddTransaction, 
  projectId, 
  initialData 
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    platform: initialData?.platform || 'Freelancer',
    type: 'Income',
    amount: initialData?.amount || '',
    date: new Date().toISOString().split('T')[0],
    category: 'Project Payment',
    description: initialData?.description || '',
  });

  /**
   * Effect: Synchronize form data with initialData prop changes
   * 
   * When initialData changes (e.g., when modal is opened with different project data),
   * this effect updates the form fields while preserving user's current selections
   * for fields not provided in initialData.
   * 
   * This ensures pre-population works correctly when the modal is reused for
   * different projects without requiring a full component remount.
   */
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        platform: initialData.platform || prev.platform,
        amount: initialData.amount || prev.amount,
        description: initialData.description || prev.description,
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount is positive number
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    /**
     * Include projectId in submission data if provided
     * 
     * The projectId is hidden from the user but automatically included
     * when creating transactions from project details page. This establishes
     * the transaction-to-project link in the database.
     */
    const submissionData = {
      ...formData,
      ...(projectId && { projectId }),
    };

    onAddTransaction(submissionData);
    
    // Reset form to default values after successful submission
    setFormData({
      platform: 'Freelancer',
      type: 'Income',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Project Payment',
      description: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md">
      <div className="neu-flat rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Add Transaction</h2>
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
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
