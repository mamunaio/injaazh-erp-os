'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, UploadCloud, Plus, Trash2, Check } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: string;
  isEditMode?: boolean;
  initialData?: {
    title: string;
    client: string;
    budget: string;
    scope?: string;
  };
  onSave?: (data: { title: string; client: string; budget: string; scope: string; tasks: string[] }) => void;
}

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  defaultPlatform = 'freelancer',
  isEditMode = false,
  initialData,
  onSave
}: CreateProjectModalProps) {
  const [deliverables, setDeliverables] = useState([{ id: Date.now(), text: '' }]);
  const [scope, setScope] = useState(initialData?.scope || '');

  React.useEffect(() => {
    if (isOpen) {
      setScope(initialData?.scope || '');
      setDeliverables([{ id: Date.now(), text: '' }]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const addDeliverable = () => {
    setDeliverables([...deliverables, { id: Date.now(), text: '' }]);
  };

  const removeDeliverable = (id: number) => {
    setDeliverables(deliverables.filter(d => d.id !== id));
  };

  const updateDeliverable = (id: number, text: string) => {
    setDeliverables(deliverables.map(d => d.id === id ? { ...d, text } : d));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      const formData = new FormData(e.target as HTMLFormElement);
      onSave({
        title: (formData.get('title') as string) || initialData?.title || '',
        client: (formData.get('client') as string) || initialData?.client || '',
        budget: (formData.get('budget') as string) || initialData?.budget || '',
        scope: scope,
        tasks: deliverables.map(d => d.text).filter(t => t.trim() !== '')
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
      />
      
      {/* Command Center Modal Canvas */}
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/20 rounded-3xl shadow-[0_0_50px_-12px_rgba(167,139,250,0.15)] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-8 pb-6 border-b border-slate-200/50 dark:border-white/10">
          <div>
            <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-600 dark:from-white dark:to-gray-400">
              {isEditMode ? 'Edit Project Details' : 'Initialize Project'}
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
              {isEditMode ? 'Update project DNA, scope, and logistical tracking.' : 'Configure project DNA, scope, and logistical tracking.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-gray-400 transition-colors outline-none"
          >
            <X size={24} />
          </button>
        </div>

        {/* Bento-Style Form Layout (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          
          {/* Left Column (Core DNA) */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-5">Core DNA</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Project Title</label>
                  <input name="title" type="text" defaultValue={initialData?.title} key={initialData?.title} placeholder="e.g. Injaazh ERP Dashboard Redesign" className="w-full px-4 py-3 text-lg font-medium bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all shadow-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Client Name</label>
                    <input name="client" type="text" defaultValue={initialData?.client} key={initialData?.client} placeholder="e.g. Acme Corp" className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Platform</label>
                    <select 
                      defaultValue={defaultPlatform.toLowerCase()}
                      className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all shadow-sm appearance-none"
                    >
                      <option value="upwork">Upwork</option>
                      <option value="fiverr">Fiverr</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="direct">Direct Client</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Project Scope / Brief</label>
                  <RichTextEditor 
                    value={scope}
                    onChange={setScope}
                    placeholder="Enter deep project context here. Use / commands for formatting..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Logistics & Milestones) */}
          <div className="flex flex-col gap-6">
            
            {/* Logistics Bento */}
            <div className="bg-white/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-5">Financial & Timeline</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Budget ($)</label>
                  <input name="budget" type="number" defaultValue={initialData?.budget?.replace(/[^0-9]/g, '')} key={initialData?.budget} placeholder="10000" className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-lg font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Deadline</label>
                  <input type="date" className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all shadow-sm [&::-webkit-calendar-picker-indicator]:dark:invert" />
                </div>
              </div>
            </div>

            {/* Deliverables Bento */}
            <div className="bg-white/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 rounded-2xl p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Initial Deliverables</h3>
                <button 
                  onClick={addDeliverable}
                  type="button"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[220px] pr-2">
                {deliverables.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 dark:text-gray-600 w-4">{index + 1}.</span>
                    <input 
                      type="text" 
                      value={item.text}
                      onChange={(e) => updateDeliverable(item.id, e.target.value)}
                      placeholder="e.g. Figma Wireframing" 
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all shadow-sm" 
                    />
                    <button 
                      onClick={() => removeDeliverable(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {deliverables.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-8 italic">No deliverables added yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 pt-6 border-t border-slate-200/50 dark:border-white/10 flex justify-end gap-4 bg-slate-50/50 dark:bg-black/10 rounded-b-3xl">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
            {isEditMode ? 'Save Changes' : 'Deploy Project'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
