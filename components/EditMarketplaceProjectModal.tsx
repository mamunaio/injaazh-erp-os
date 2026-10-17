'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  User, 
  FileText, 
  CheckSquare, 
  Sparkles, 
  Search, 
  Plus,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMarketplaceClients, createMarketplaceClient } from '@/actions/marketplaceClientActions';
import toast from 'react-hot-toast';

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
  const clientSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      getMarketplaceClients().then(res => {
        if (res.success) setClients(res.data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
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
    const res = await createMarketplaceClient({ name: clientSearch, platform: project?.platform || 'Direct' });
    if (res.success) {
      setClients([res.data, ...clients]);
      setFormData({ ...formData, clientId: res.data._id, clientName: res.data.name });
      setShowClientDropdown(false);
      toast.success('Client created successfully');
    } else {
      toast.error('Failed to create client');
    }
  };

  useEffect(() => {
    if (project) {
      const budgetValue = project.budget ? project.budget.replace(/[^0-9.-]+/g, '') : '';
      const tasksString = project.tasks && Array.isArray(project.tasks)
        ? project.tasks.map((t: any) => t.title || t).join('\n')
        : '';

      setFormData({
        title: project.title || '',
        clientId: project.clientId || '',
        clientName: project.clientDetails?.clientName || '',
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
      clientDetails: {
        clientName: formData.clientName || 'Unknown Client',
      }
    });
    
    setIsSubmitting(false);
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors";
  const labelClasses = "block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5";
  const iconClasses = "absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none";

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
          className="relative w-full max-w-3xl my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2),0_0_30px_rgba(99,36,252,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(99,36,252,0.2)] flex flex-col overflow-hidden z-10 max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Neon Accent Line */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2.5px] z-20 bg-gradient-to-r from-transparent via-[#6324FC] to-transparent shadow-[0_0_15px_#6324FC]"
          />
          
          {/* Header */}
          <div className="relative flex justify-between items-center p-5 md:p-6 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex gap-3.5 items-center">
              <div className="w-11 h-11 rounded-xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-indigo-600 dark:text-[#6324FC] shadow-sm">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Edit Marketplace Project
                </h2>
                <p className="text-xs font-sans text-secondary mt-0.5">
                  Update contract parameters, scope details & deadlines.
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
          
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-52 border-r border-black/5 dark:border-white/10 p-4 hidden md:block overflow-y-auto z-10 relative bg-slate-50/50 dark:bg-[#060608]/50">
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'general', icon: <Briefcase size={15} />, label: 'General & Scope' },
                  { id: 'timeline', icon: <Calendar size={15} />, label: 'Timeline & Budget' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all ${
                      activeSection === item.id 
                        ? 'bg-[#6324FC] text-white shadow-[0_0_12px_rgba(99,36,252,0.4)]' 
                        : 'text-slate-600 dark:text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.icon} <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Area */}
            <form id="edit-project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar relative z-10 space-y-4">
              
              {/* General Info Section */}
              {activeSection === 'general' && (
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Project Title */}
                  <div className="group relative">
                    <label className={labelClasses}>Project Title <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Briefcase className={iconClasses} size={15} />
                      <input 
                        type="text" 
                        required
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. E-Commerce Redesign"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* Client Selection */}
                  <div className="group relative" ref={clientSearchRef}>
                    <label className={labelClasses}>Client Name</label>
                    <div className="relative">
                      <User className={iconClasses} size={15} />
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
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none opacity-60" />
                      
                      {showClientDropdown && (
                        <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-[#0e0e13] border border-black/10 dark:border-white/15 rounded-xl shadow-2xl overflow-hidden z-30 max-h-52 overflow-y-auto custom-scrollbar">
                          {filteredClients.length > 0 ? (
                            filteredClients.map(c => (
                              <button
                                key={c._id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, clientId: c._id, clientName: c.name });
                                  setShowClientDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between border-b border-black/5 dark:border-white/5 last:border-0 transition-colors group"
                              >
                                <div>
                                  <div className="font-heading font-bold text-slate-900 dark:text-white text-xs group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{c.name}</div>
                                  {c.company && <div className="text-[10px] text-secondary">{c.company}</div>}
                                </div>
                                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-secondary">{c.platform}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center">
                              <p className="text-xs text-secondary mb-2">No client found matching "{clientSearch}"</p>
                              <button 
                                type="button"
                                onClick={handleCreateClient}
                                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#6324FC] hover:bg-[#521bd6] text-white font-heading font-bold rounded-lg text-xs transition-all shadow-md"
                              >
                                <Plus size={13} /> Create "{clientSearch}"
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
                      <FileText size={13} className="text-secondary" /> Project Scope & Deliverables
                    </label>
                    <textarea 
                      value={formData.scope}
                      onChange={e => setFormData({...formData, scope: e.target.value})}
                      rows={5}
                      placeholder="Detailed project scope and requirements..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Tasks (Optional) */}
                  <div className="group relative">
                    <label className={labelClasses}>
                      <CheckSquare size={13} className="text-secondary" /> Initial Tasklist (Optional)
                    </label>
                    <textarea 
                      value={formData.tasks}
                      onChange={e => setFormData({...formData, tasks: e.target.value})}
                      rows={4}
                      placeholder="1. Setup repository&#10;2. Design homepage&#10;3. Integrate API"
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors resize-none font-mono leading-relaxed"
                    />
                  </div>
                </motion.div>
              )}

              {/* Timeline & Budget Section */}
              {activeSection === 'timeline' && (
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Start Date */}
                    <div className="group relative">
                      <label className={labelClasses}>Start Date</label>
                      <div className="relative">
                        <Calendar className={iconClasses} size={15} />
                        <input 
                          type="date" 
                          value={formData.startDate}
                          onChange={e => setFormData({...formData, startDate: e.target.value})}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                    {/* Deadline */}
                    <div className="group relative">
                      <label className={labelClasses}>Deadline</label>
                      <div className="relative">
                        <Calendar className={iconClasses} size={15} />
                        <input 
                          type="date" 
                          value={formData.deadline}
                          onChange={e => setFormData({...formData, deadline: e.target.value})}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="group relative">
                    <label className={labelClasses}>Budget (USD)</label>
                    <div className="relative">
                      <DollarSign className={iconClasses} size={15} />
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
                </motion.div>
              )}

              {/* Mobile Section Navigation */}
              <div className="flex justify-between items-center md:hidden pt-4 border-t border-black/5 dark:border-white/10">
                <button 
                  type="button"
                  onClick={() => setActiveSection('general')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold ${activeSection === 'general' ? 'opacity-0 pointer-events-none' : 'bg-slate-100 dark:bg-white/5 text-secondary'}`}
                >
                  Previous
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveSection('timeline')}
                  className={`px-4 py-2 rounded-xl text-xs font-heading font-bold bg-[#6324FC] text-white ${activeSection === 'timeline' ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  Next
                </button>
              </div>

            </form>
          </div>

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
              form="edit-project-form"
              disabled={isSubmitting || !formData.title}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Sparkles size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
