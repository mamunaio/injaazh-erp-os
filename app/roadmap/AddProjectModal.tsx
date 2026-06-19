'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus } from 'lucide-react';
import { createRoadmapProject } from '@/app/actions/roadmapActions';
import toast from 'react-hot-toast';

export const AddProjectModal = ({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Core Business Systems');
  const [status, setStatus] = useState<'Planning' | 'In Progress' | 'On Hold' | 'Completed'>('Planning');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    const result = await createRoadmapProject({ title, category, status });
    setIsLoading(false);

    if (result.success) {
      toast.success('Project added successfully');
      setTitle('');
      onSuccess();
    } else {
      toast.error('Failed to add project');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md neu-flat rounded-3xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-slate-800 dark:text-white font-bold text-xl">Add New Project</h2>
              <button 
                onClick={onClose}
                className="p-2 neu-button rounded-xl transition-all hover:rotate-90 text-slate-500 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full ERP System"
                  className="w-full neu-pressed text-slate-800 dark:text-white px-5 py-3.5 rounded-xl focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Core Business Systems"
                  className="w-full neu-pressed text-slate-800 dark:text-white px-5 py-3.5 rounded-xl focus:outline-none transition-all"
                  list="categories"
                />
                <datalist id="categories">
                  <option value="Core Business Systems" />
                  <option value="Healthcare Ecosystem" />
                  <option value="Education Systems" />
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full appearance-none bg-black/40 border border-white/10 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer"
                >
                  <option value="Planning" className="bg-[#0a0a0a]">Planning</option>
                  <option value="In Progress" className="bg-[#0a0a0a]">In Progress</option>
                  <option value="On Hold" className="bg-[#0a0a0a]">On Hold</option>
                  <option value="Completed" className="bg-[#0a0a0a]">Completed</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 neu-button text-violet-500 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                {isLoading ? 'Adding...' : 'Add Project'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
