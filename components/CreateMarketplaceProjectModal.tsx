'use client';

import React, { useState } from 'react';
import { X, Calendar, DollarSign, Briefcase, User, FileText, CheckSquare, Sparkles, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMarketplaceClients, createMarketplaceClient } from '@/actions/marketplaceClientActions';
import toast from 'react-hot-toast';

interface CreateMarketplaceProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  defaultPlatform?: string;
}

export default function CreateMarketplaceProjectModal({ 
  isOpen, 
  onClose, 
  onSave,
  defaultPlatform = 'Freelancer'
}: CreateMarketplaceProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    clientName: '',
    budget: '',
    startDate: '',
    deadline: '',
    scope: '',
    tasks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  // Client Selection State
  const [clients, setClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const clientSearchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      getMarketplaceClients().then(res => {
        if (res.success) setClients(res.data);
      });
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const handleCreateClient = async () => {
    if (!clientSearch) return;
    const res = await createMarketplaceClient({ name: clientSearch, platform: defaultPlatform });
    if (res.success) {
      setClients([res.data, ...clients]);
      setFormData({ ...formData, clientId: res.data._id, clientName: res.data.name });
      setShowClientDropdown(false);
      toast.success('Client created successfully');
    } else {
      toast.error('Failed to create client');
    }
  };

  if (!isOpen) return null;

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
      clientDetails: {
        clientName: formData.clientName || 'Unknown Client',
      }
    });
    
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      title: '',
      clientId: '',
      clientName: '',
      budget: '',
      startDate: '',
      deadline: '',
      scope: '',
      tasks: '',
    });
    setActiveSection('general');
  };

  const inputClasses = "w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl px-11 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 backdrop-blur-sm shadow-sm hover:border-slate-300 dark:hover:border-white/20";
  const labelClasses = "block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-4xl h-[90vh] sm:h-auto max-h-[90vh] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          {/* Header */}
          <div className="relative flex justify-between items-start p-8 border-b border-slate-200/50 dark:border-white/10">
            <div className="flex gap-5 items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  Create Project
                </h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mt-1">
                  Add a new project to the {defaultPlatform} pipeline.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white transition-all bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 p-2.5 rounded-xl shadow-sm border border-slate-200/50 dark:border-white/5"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-slate-200/50 dark:border-white/10 p-6 hidden md:block overflow-y-auto z-10 relative">
              <div className="flex flex-col gap-2">
                {[
                  { id: 'general', icon: <Briefcase size={18} />, label: 'General Info' },
                  { id: 'timeline', icon: <Calendar size={18} />, label: 'Timeline & Budget' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                      activeSection === item.id 
                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-white/5' 
                        : 'text-slate-500 dark:text-gray-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-gray-200 border border-transparent'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Area */}
            <form id="create-project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth relative z-10">
              <div className="max-w-2xl mx-auto space-y-10">
                
                {/* General Info Section */}
                <motion.section 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={activeSection === 'general' ? 'block' : 'hidden'}
                >
                  <div className="mb-6 pb-2 border-b border-slate-200/50 dark:border-white/5">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">General Information</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Project Title */}
                    <div className="group relative">
                      <label className={labelClasses}>Project Title *</label>
                      <div className="relative">
                        <Briefcase className={iconClasses} size={18} />
                        <input 
                          type="text" 
                          required
                          value={formData.title}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                          placeholder="e.g. Website Redesign for Acme Corp"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    {/* Client Selection */}
                    <div className="group relative" ref={clientSearchRef}>
                      <label className={labelClasses}>Client Name</label>
                      <div className="relative">
                        <User className={iconClasses} size={18} />
                        <input 
                          type="text" 
                          value={showClientDropdown ? clientSearch : (formData.clientName || '')}
                          onChange={e => {
                            setClientSearch(e.target.value);
                            setShowClientDropdown(true);
                            if (formData.clientId) setFormData({ ...formData, clientId: '', clientName: '' });
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          placeholder="Search or add client..."
                          className={inputClasses}
                        />
                        {showClientDropdown && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                            {filteredClients.length > 0 ? (
                              filteredClients.map(c => (
                                <button
                                  key={c._id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, clientId: c._id, clientName: c.name });
                                    setShowClientDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between border-b border-slate-100 dark:border-white/5 last:border-0"
                                >
                                  <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">{c.name}</div>
                                    {c.company && <div className="text-xs text-slate-500 dark:text-gray-400">{c.company}</div>}
                                  </div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400">{c.platform}</span>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center">
                                <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">No client found matching "{clientSearch}"</p>
                                <button 
                                  type="button"
                                  onClick={handleCreateClient}
                                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                >
                                  <Plus size={16} /> Create "{clientSearch}"
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scope */}
                    <div className="group relative">
                      <label className={labelClasses}>
                        <FileText size={16} className="text-slate-400" /> Project Scope
                      </label>
                      <div className="relative">
                        <textarea 
                          value={formData.scope}
                          onChange={e => setFormData({...formData, scope: e.target.value})}
                          rows={8}
                          placeholder="Detailed project scope and requirements..."
                          className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400 backdrop-blur-sm shadow-sm leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Tasks (Optional) */}
                    <div className="group relative">
                      <label className={labelClasses}>
                        <CheckSquare size={16} className="text-slate-400" /> Initial Tasklist (Optional)
                      </label>
                      <div className="relative">
                        <textarea 
                          value={formData.tasks}
                          onChange={e => setFormData({...formData, tasks: e.target.value})}
                          rows={5}
                          placeholder="1. Setup repository&#10;2. Design homepage&#10;3. Integrate API"
                          className="w-full bg-slate-900/5 dark:bg-black/30 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400 font-mono shadow-inner leading-relaxed"
                        />
                        <p className="absolute bottom-3 right-4 text-xs font-bold text-slate-400 pointer-events-none">One task per line</p>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Timeline & Budget Section */}
                <motion.section 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={activeSection === 'timeline' ? 'block' : 'hidden'}
                >
                  <div className="mb-6 pb-2 border-b border-slate-200/50 dark:border-white/5">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Timeline & Budget</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {/* Start Date */}
                    <div className="group relative">
                      <label className={labelClasses}>Start Date</label>
                      <div className="relative">
                        <Calendar className={iconClasses} size={18} />
                        <input 
                          type="date" 
                          value={formData.startDate}
                          onChange={e => setFormData({...formData, startDate: e.target.value})}
                          className={`${inputClasses} [&::-webkit-calendar-picker-indicator]:dark:invert`}
                        />
                      </div>
                    </div>
                    {/* Deadline */}
                    <div className="group relative">
                      <label className={labelClasses}>Deadline</label>
                      <div className="relative">
                        <Calendar className={iconClasses} size={18} />
                        <input 
                          type="date" 
                          value={formData.deadline}
                          onChange={e => setFormData({...formData, deadline: e.target.value})}
                          className={`${inputClasses} [&::-webkit-calendar-picker-indicator]:dark:invert`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="group relative">
                    <label className={labelClasses}>Budget (USD)</label>
                    <div className="relative">
                      <DollarSign className={iconClasses} size={18} />
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
                </motion.section>


                {/* Mobile Section Navigation (Only visible on small screens) */}
                <div className="flex justify-between items-center md:hidden pt-8 mt-8 border-t border-slate-200/50 dark:border-white/10">
                  <button 
                    type="button"
                    onClick={() => {
                      if (activeSection === 'timeline') setActiveSection('general');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-white/10 ${activeSection === 'general' ? 'opacity-0 pointer-events-none' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    Previous
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (activeSection === 'general') setActiveSection('timeline');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ${activeSection === 'timeline' ? 'opacity-0 pointer-events-none' : ''}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 md:px-10 md:py-6 border-t border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col-reverse sm:flex-row justify-end gap-4 z-20">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/50 dark:hover:text-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="create-project-form"
              disabled={isSubmitting || !formData.title}
              className="w-full sm:w-auto relative group overflow-hidden px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : 'Create Project'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
