'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onUpdateProject: (projectId: string, data: any) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
}

const TECH_STACK_OPTIONS = [
  'Next.js',
  'Laravel',
  'WordPress',
  'SEO',
  'Technical SEO',
  'UI/UX',
  'Glassmorphism',
  'High-end Dev',
  'React',
  'Node.js',
  'Python',
  'Custom ERP',
  'SaaS',
];

export default function EditProjectModal({ isOpen, onClose, project, onUpdateProject, onDeleteProject }: EditProjectModalProps) {
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

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        clientName: project.clientName || '',
        status: project.status || 'Planning',
        techStack: project.techStack || [],
        assignees: Array.isArray(project.assignees) ? project.assignees.join(', ') : '',
        progress: project.progress || 0,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        priority: project.priority || 'Medium',
        budget: project.budget?.toString() || '',
      });
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData = {
      ...formData,
      assignees: formData.assignees.split(',').map(a => a.trim()).filter(Boolean),
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
    };

    await onUpdateProject(project._id, updateData);
    setIsSubmitting(false);
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[90vh] neu-flat rounded-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/5">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Edit Project
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update project details</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-500 dark:text-gray-400 neu-button p-2 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              
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
                  className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                />
              </div>

              {/* Client Name & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Client Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all appearance-none cursor-pointer"
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
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Tech Stack
                </label>
                <div className="flex flex-wrap gap-2">
                  {TECH_STACK_OPTIONS.map(tech => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTechStack(tech)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        formData.techStack.includes(tech)
                          ? 'neu-pressed text-indigo-500 dark:text-indigo-400'
                          : 'neu-button text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignees, Progress, Priority */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Assignees
                  </label>
                  <input 
                    type="text" 
                    value={formData.assignees}
                    onChange={e => setFormData({...formData, assignees: e.target.value})}
                    placeholder="John, Jane, Bob"
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Progress (%)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={e => setFormData({...formData, progress: parseInt(e.target.value) || 0})}
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Priority
                  </label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Start Date, Deadline & Budget */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Start Date
                  </label>
                  <DatePicker 
                    selected={formData.startDate ? new Date(formData.startDate) : null}
                    onChange={(date: Date | null) => setFormData({...formData, startDate: date ? date.toISOString().split('T')[0] : ''})}
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all bg-transparent"
                    placeholderText="mm/dd/yyyy"
                    dateFormat="MM/dd/yyyy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Deadline
                  </label>
                  <DatePicker 
                    selected={formData.deadline ? new Date(formData.deadline) : null}
                    onChange={(date: Date | null) => setFormData({...formData, deadline: date ? date.toISOString().split('T')[0] : ''})}
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all bg-transparent"
                    placeholderText="mm/dd/yyyy"
                    dateFormat="MM/dd/yyyy"
                  />
                </div>
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
                    className="w-full neu-pressed text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 flex justify-between items-center gap-3">
            <div>
              {onDeleteProject && (
                <button 
                  type="button"
                  onClick={() => onDeleteProject(project._id)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 neu-button text-sm font-semibold text-red-500 transition-all"
                >
                  Delete Project
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 neu-button text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title}
                className="px-8 py-2.5 neu-button text-indigo-500 dark:text-indigo-400 font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
