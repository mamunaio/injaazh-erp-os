'use client';

import React, { useState } from 'react';
import { X, Calendar, DollarSign, Briefcase, User, Sparkles, Layers, Users as UsersIcon, Percent, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: any) => Promise<void>;
}

const TECH_STACK_OPTIONS = [
  'Next.js',
  'Laravel',
  'WordPress',
  'SEO',
  'Technical SEO',
  'UI/UX',
  'TailwindCSS',
  'React',
  'Node.js',
  'Python',
  'Custom ERP',
  'SaaS',
];

export default function CreateProjectModal({ isOpen, onClose, onCreateProject }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientName: '',
    status: 'Planning',
    techStack: [] as string[],
    assignees: '',
    progress: 0,
    startDate: '',
    deadline: '',
    priority: 'Medium',
    budget: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const projectData = {
      ...formData,
      assignees: formData.assignees.split(',').map(a => a.trim()).filter(Boolean),
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      tags: ['Manual'],
      attachments: 0,
      comments: 0,
    };

    await onCreateProject(projectData);
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      clientName: '',
      status: 'Planning',
      techStack: [],
      assignees: '',
      progress: 0,
      startDate: '',
      deadline: '',
      priority: 'Medium',
      budget: '',
    });
    
    onClose();
  };

  const toggleTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }));
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors";
  const labelClasses = "block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-2xl my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2),0_0_30px_rgba(99,36,252,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(99,36,252,0.2)] flex flex-col overflow-hidden z-10 max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] z-20 bg-gradient-to-r from-transparent via-[#6324FC] to-transparent shadow-[0_0_15px_#6324FC]" />

          {/* Header */}
          <div className="flex justify-between items-center p-5 md:p-6 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-indigo-600 dark:text-[#6324FC] shadow-sm">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Create New Project
                </h2>
                <p className="text-xs font-sans text-secondary mt-0.5">
                  Launch a new manual project workflow on your internal board.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 border border-black/5 dark:border-white/5 hover:border-rose-500/30 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Form */}
          <form id="create-manual-project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar space-y-4">
            
            {/* Project Title */}
            <div>
              <label className={labelClasses}>
                <Briefcase size={13} className="text-secondary" /> Project Title <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Website Redesign for Acme Corp"
                className={inputClasses}
              />
            </div>

            {/* Client Name & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>
                  <User size={13} className="text-secondary" /> Client Name
                </label>
                <input 
                  type="text" 
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                  placeholder="Client or company name"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <Layers size={13} className="text-secondary" /> Initial Status
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className={`${inputClasses} cursor-pointer`}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClasses}>
                Description & Summary
              </label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Brief summary of project goals and deliverables..."
                rows={3}
                className={`${inputClasses} resize-none leading-relaxed`}
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label className={labelClasses}>
                Tech Stack / Category Tags
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
                {TECH_STACK_OPTIONS.map(tech => {
                  const isSelected = formData.techStack.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTechStack(tech)}
                      className={`px-2.5 py-1 text-[11px] font-heading font-bold rounded-lg transition-all border ${
                        isSelected
                          ? 'bg-[#6324FC] text-white border-transparent shadow-[0_0_10px_rgba(99,36,252,0.4)]'
                          : 'bg-white dark:bg-white/5 text-secondary hover:text-slate-900 dark:hover:text-white border-black/10 dark:border-white/10'
                      }`}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignees, Progress, Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClasses}>
                  <UsersIcon size={13} className="text-secondary" /> Assignees
                </label>
                <input 
                  type="text" 
                  value={formData.assignees}
                  onChange={e => setFormData({...formData, assignees: e.target.value})}
                  placeholder="John, Jane, Bob"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <Percent size={13} className="text-secondary" /> Initial Progress (%)
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={formData.progress}
                  onChange={e => setFormData({...formData, progress: parseInt(e.target.value) || 0})}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <AlertCircle size={13} className="text-secondary" /> Priority Level
                </label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className={`${inputClasses} cursor-pointer`}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent 🔥</option>
                </select>
              </div>
            </div>

            {/* Start Date, Deadline & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClasses}>
                  <Calendar size={13} className="text-secondary" /> Start Date
                </label>
                <input 
                  type="date" 
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <Calendar size={13} className="text-secondary" /> Target Deadline
                </label>
                <input 
                  type="date" 
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  <DollarSign size={13} className="text-secondary" /> Budget (USD)
                </label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: e.target.value})}
                  placeholder="5000"
                  className={inputClasses}
                />
              </div>
            </div>

          </form>

          {/* Footer */}
          <div className="p-4 md:px-6 md:py-4 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3 z-20">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="create-manual-project-form"
              disabled={isSubmitting || !formData.title}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-2"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
