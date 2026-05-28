'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditMarketplaceProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  project: any;
}

export default function EditMarketplaceProjectModal({ 
  isOpen, 
  onClose, 
  onSave,
  project
}: EditMarketplaceProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    budget: '',
    startDate: '',
    deadline: '',
    scope: '',
    tasks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      // Extract budget number from string like "$250"
      const budgetValue = project.budget ? project.budget.replace(/[^0-9.-]+/g, '') : '';
      
      // Convert tasks array to string (one per line)
      const tasksString = project.tasks && Array.isArray(project.tasks)
        ? project.tasks.map((t: any) => t.title || t).join('\n')
        : '';

      setFormData({
        title: project.title || '',
        client: project.clientDetails?.clientName || '',
        budget: budgetValue,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        scope: project.scope || '',
        tasks: tasksString,
      });
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const taskList = formData.tasks
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    await onSave({
      ...formData,
      tasks: taskList,
    });
    
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                Edit Project
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Update project details</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-5">
              
              {/* Project Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Project Title *
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Website Redesign for Acme Corp"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Client Name
                </label>
                <input 
                  type="text" 
                  value={formData.client}
                  onChange={e => setFormData({...formData, client: e.target.value})}
                  placeholder="Client or company name"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Start Date & Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Start Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Deadline
                  </label>
                  <input 
                    type="date" 
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <DollarSign size={14} /> Budget (USD)
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: e.target.value})}
                  placeholder="5000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Scope
                </label>
                <textarea 
                  value={formData.scope}
                  onChange={e => setFormData({...formData, scope: e.target.value})}
                  rows={6}
                  placeholder="Detailed project scope and requirements..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Tasks (Optional) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tasks (Optional)
                </label>
                <textarea 
                  value={formData.tasks}
                  onChange={e => setFormData({...formData, tasks: e.target.value})}
                  rows={4}
                  placeholder="One task per line&#10;Task 1&#10;Task 2&#10;Task 3"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder:text-slate-400 font-mono"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter one task per line</p>
              </div>

            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title}
              className="px-8 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
