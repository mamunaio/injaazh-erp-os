'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  User, 
  FileText, 
  CheckSquare, 
  Sparkles, 
  Plus, 
  Clock, 
  Globe, 
  ShoppingCart, 
  Users, 
  ChevronDown,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMarketplaceClients, createMarketplaceClient } from '@/actions/marketplaceClientActions';
import toast from 'react-hot-toast';
import DatePicker from '@/components/ui/DatePicker';
import { generateMarketplaceProjectScope } from '@/app/actions/aiActions';
import { useScrollLock } from '@/lib/useScrollLock';

interface EditMarketplaceProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  project: any;
}

const PLATFORMS_MAP: Record<string, { name: string; icon: any; color: string; gradient: string; glow: string }> = {
  direct: { 
    name: 'Direct Client', 
    icon: Users, 
    color: '#6324FC', 
    gradient: 'from-[#6324FC] to-[#8B5CF6]',
    glow: 'rgba(99, 36, 252, 0.4)' 
  },
  freelancer: { 
    name: 'Freelancer.com', 
    icon: Globe, 
    color: '#00E5FF', 
    gradient: 'from-[#00E5FF] to-[#0099FF]',
    glow: 'rgba(0, 229, 255, 0.4)' 
  },
  upwork: { 
    name: 'Upwork', 
    icon: Briefcase, 
    color: '#10B981', 
    gradient: 'from-[#10B981] to-[#059669]',
    glow: 'rgba(16, 185, 129, 0.4)' 
  },
  fiverr: { 
    name: 'Fiverr', 
    icon: ShoppingCart, 
    color: '#EC4899', 
    gradient: 'from-[#EC4899] to-[#D946EF]',
    glow: 'rgba(236, 72, 153, 0.4)' 
  },
};

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
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Client Selection State
  const [clients, setClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  // Platform styling resolution
  const platformKey = (project?.platform || 'direct').toLowerCase();
  const platformConfig = PLATFORMS_MAP[platformKey] || PLATFORMS_MAP.direct;
  const PlatformIcon = platformConfig.icon;

  useEffect(() => {
    if (isOpen) {
      getMarketplaceClients().then(res => {
        if (res.success && res.data) setClients(res.data);
      });
    }
  }, [isOpen]);

  // Click outside to close client dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Esc to close, Ctrl+Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('edit-project-form') as HTMLFormElement;
        if (form) form.requestSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background page scrolling when modal is open
  useScrollLock(isOpen);

  // Populate form with existing project values
  useEffect(() => {
    if (project) {
      const budgetValue = project.budget ? String(project.budget).replace(/[^0-9.-]+/g, '') : '';
      const tasksString = project.tasks && Array.isArray(project.tasks)
        ? project.tasks.map((t: any) => typeof t === 'string' ? t : t.title || '').filter(Boolean).join('\n')
        : '';

      const clientName = project.clientDetails?.clientName || project.clientName || project.client || '';
      const clientIdStr = typeof project.clientId === 'object' && project.clientId?._id 
        ? String(project.clientId._id) 
        : (project.clientId ? String(project.clientId) : '');

      setFormData({
        title: project.title || '',
        clientId: clientIdStr,
        clientName: clientName,
        budget: budgetValue,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        scope: project.scope || '',
        tasks: tasksString,
      });
      setClientSearch(clientName);
    }
  }, [project]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => 
      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) || 
      (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
    );
  }, [clients, clientSearch]);

  const handleCreateClient = async () => {
    if (!clientSearch.trim() || isCreatingClient) return;
    setIsCreatingClient(true);
    try {
      const res = await createMarketplaceClient({ 
        name: clientSearch.trim(), 
        platform: project?.platform || 'Direct' 
      });
      if (res.success && res.data) {
        setClients([res.data, ...clients]);
        setFormData(prev => ({ ...prev, clientId: res.data._id, clientName: res.data.name }));
        setShowClientDropdown(false);
        toast.success(`Client "${res.data.name}" added`);
      } else {
        toast.error('Failed to create client');
      }
    } catch {
      toast.error('Error creating client');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleGenerateAi = async (mode: 'both' | 'scope' | 'tasks' = 'both') => {
    if (!formData.title.trim()) {
      toast.error('Please enter a Project Title first so AI can understand your project!');
      return;
    }
    setIsGeneratingAi(true);
    const toastId = toast.loading('AI is crafting scope & deliverable specs...', { id: 'ai-scope' });
    try {
      const res = await generateMarketplaceProjectScope({
        projectTitle: formData.title,
        clientName: formData.clientName,
        platform: project?.platform || 'Direct',
        budget: formData.budget,
        currentScope: formData.scope,
        target: mode,
      });

      if (res.success) {
        setFormData(prev => ({
          ...prev,
          scope: mode === 'tasks' ? prev.scope : (res.scope || prev.scope),
          tasks: mode === 'scope' ? prev.tasks : (res.tasks && res.tasks.length > 0 ? res.tasks.join('\n') : prev.tasks),
        }));
        toast.success(
          res.isFallback
            ? 'Generated standard deliverables & milestone checklist!'
            : 'AI successfully crafted custom scope & milestone checklist!',
          { id: toastId }
        );
      } else {
        toast.error(res.error || 'Failed to generate content with AI', { id: toastId });
      }
    } catch {
      toast.error('AI generation error', { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const durationDays = useMemo(() => {
    if (!formData.startDate || !formData.deadline) return null;
    const start = new Date(formData.startDate);
    const end = new Date(formData.deadline);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [formData.startDate, formData.deadline]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    setIsSubmitting(true);

    const taskList = formData.tasks
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    const payload: any = {
      ...formData,
      tasks: taskList,
      clientName: formData.clientName,
      clientDetails: {
        clientName: formData.clientName || 'Unknown Client',
      }
    };

    if (formData.clientId && formData.clientId.trim() !== '') {
      payload.clientId = formData.clientId;
    } else {
      delete payload.clientId;
    }

    try {
      await onSave(payload);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black/80 backdrop-blur-xl" 
          onClick={onClose} 
        />
        
        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-2xl my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25),0_0_30px_rgba(99,36,252,0.12)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(99,36,252,0.18)] flex flex-col overflow-hidden z-10 max-h-[92vh] overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Neon Accent Glow Line */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2.5px] z-20"
            style={{ 
              backgroundImage: `linear-gradient(to right, transparent, ${platformConfig.color}, transparent)`,
              boxShadow: `0 0 15px ${platformConfig.color}`
            }}
          />
          
          {/* Header */}
          <div className="relative flex justify-between items-center p-5 md:p-6 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex gap-3.5 items-center">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform hover:scale-105"
                style={{
                  backgroundColor: `${platformConfig.color}15`,
                  border: `1px solid ${platformConfig.color}35`,
                  color: platformConfig.color,
                  boxShadow: `0 0 15px ${platformConfig.color}25`
                }}
              >
                <PlatformIcon size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Edit {platformConfig.name} Project
                  </h2>
                  <span 
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ 
                      backgroundColor: `${platformConfig.color}15`,
                      color: platformConfig.color,
                      border: `1px solid ${platformConfig.color}30`
                    }}
                  >
                    Contract Scope
                  </span>
                </div>
                <p className="text-xs font-sans text-secondary mt-0.5">
                  Update contract deliverables, client info, milestones & financial terms.
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 border border-black/5 dark:border-white/5 hover:border-rose-500/30 transition-colors"
              title="Close modal (Esc)"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Content Area: Single unified view without tabs */}
          <form 
            id="edit-project-form" 
            onSubmit={handleSubmit} 
            className="p-5 md:p-6 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1"
          >
            {/* Project Title */}
            <div>
              <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Briefcase size={12} className="text-secondary" /> Project Title <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Next.js ERP Ecosystem Architecture"
                className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-all shadow-inner focus:ring-1 focus:ring-[#6324FC]/30 font-medium"
              />
            </div>

            {/* Client Selection */}
            <div className="relative" ref={clientSearchRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <User size={12} className="text-secondary" /> Client / Organization
                </label>
                {formData.clientName && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={11} /> Linked
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={showClientDropdown ? clientSearch : (formData.clientName || clientSearch)}
                  onChange={e => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                    if (formData.clientId) {
                      setFormData(prev => ({ ...prev, clientId: '', clientName: e.target.value }));
                    }
                  }}
                  onFocus={() => {
                    setShowClientDropdown(true);
                    if (!clientSearch && formData.clientName) {
                      setClientSearch(formData.clientName);
                    }
                  }}
                  placeholder="Search existing client or type new name..."
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-all shadow-inner focus:ring-1 focus:ring-[#6324FC]/30"
                />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none opacity-60" />

                {/* Dropdown Menu */}
                {showClientDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-[#0e0e13] border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-52 overflow-y-auto custom-scrollbar">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(c => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, clientId: c._id, clientName: c.name }));
                            setClientSearch(c.name);
                            setShowClientDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between border-b border-black/5 dark:border-white/5 last:border-0 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
                              style={{
                                backgroundColor: `${platformConfig.color}15`,
                                color: platformConfig.color
                              }}
                            >
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-heading font-bold text-slate-900 dark:text-white text-xs group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
                                {c.name}
                              </div>
                              {c.company && <div className="text-[10px] text-secondary">{c.company}</div>}
                            </div>
                          </div>
                          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-secondary">
                            {c.platform || project?.platform || 'Direct'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3.5 text-center">
                        <p className="text-xs text-secondary mb-2.5">No client found matching "{clientSearch}"</p>
                        {clientSearch.trim() && (
                          <button 
                            type="button"
                            onClick={handleCreateClient}
                            disabled={isCreatingClient}
                            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-white font-heading font-bold rounded-xl text-xs transition-all shadow-md hover:brightness-110"
                            style={{
                              backgroundColor: platformConfig.color,
                              boxShadow: `0 0 15px ${platformConfig.glow}`
                            }}
                          >
                            <Plus size={13} /> {isCreatingClient ? 'Registering...' : `Create "${clientSearch.trim()}"`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Financial & Timeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Budget */}
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={12} className="text-emerald-500" /> Budget (USD)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="5000"
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-secondary outline-none transition-all shadow-inner focus:ring-1 focus:ring-emerald-500/30 font-semibold"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Calendar size={12} className="text-secondary" /> Start Date
                </label>
                <DatePicker 
                  value={formData.startDate}
                  onChange={val => setFormData({ ...formData, startDate: val })}
                  placeholder="Select start date"
                  icon="calendar"
                  color={platformConfig.color}
                  align="left"
                  direction="auto"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Clock size={12} className="text-secondary" /> Target Deadline
                </label>
                <DatePicker 
                  value={formData.deadline}
                  onChange={val => setFormData({ ...formData, deadline: val })}
                  placeholder="Select deadline"
                  icon="clock"
                  color={platformConfig.color}
                  align="right"
                  direction="auto"
                />
              </div>
            </div>

            {/* Quick Presets & Duration Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-secondary font-mono mr-1">Presets:</span>
                {[500, 1000, 2500, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFormData({ ...formData, budget: String(amt) })}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border ${
                      formData.budget === String(amt)
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {durationDays !== null && (
                <div 
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-heading font-bold flex items-center gap-1.5 ${
                    durationDays > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                      : durationDays === 0
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <Clock size={12} />
                  <span>
                    {durationDays > 0 
                      ? `${durationDays} Days Turnaround` 
                      : durationDays === 0 
                      ? 'Same-Day Delivery' 
                      : 'Deadline precedes start'}
                  </span>
                </div>
              )}
            </div>

            {/* AI Scope & Deliverables Copilot Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/25 dark:border-purple-500/30 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(99,36,252,0.08)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6324FC] to-[#EC4899] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Sparkles size={15} className={isGeneratingAi ? 'animate-spin' : ''} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-heading font-extrabold text-slate-900 dark:text-white leading-tight">
                      AI Scope & Task Copilot
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                      Smart Assistant
                    </span>
                  </div>
                  <p className="text-[10px] text-secondary truncate mt-0.5">
                    Auto-writes scope specifications & milestone checklists from your project title
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateAi('both')}
                disabled={isGeneratingAi || !formData.title.trim()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold text-white transition-all shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
                style={{
                  background: 'linear-gradient(135deg, #6324FC 0%, #A855F7 50%, #EC4899 100%)',
                  boxShadow: '0 0 14px rgba(99, 36, 252, 0.4)'
                }}
                title="Auto-generate both Scope and Initial Tasklist from project title"
              >
                <Sparkles size={12} className={isGeneratingAi ? 'animate-spin' : 'animate-pulse text-amber-300'} />
                <span>{isGeneratingAi ? 'Thinking...' : '✨ Generate with AI'}</span>
              </button>
            </div>

            {/* Scope & Deliverables */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={12} className="text-secondary" /> Scope & Deliverable Specifications
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateAi('scope')}
                    disabled={isGeneratingAi || !formData.title.trim()}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-heading font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all disabled:opacity-50"
                    title="Write or polish scope description using AI"
                  >
                    <Sparkles size={10} />
                    <span>AI Scope</span>
                  </button>
                  <span className="text-[9px] font-mono text-secondary">
                    {formData.scope.length} chars
                  </span>
                </div>
              </div>
              <textarea 
                value={formData.scope}
                onChange={e => setFormData({ ...formData, scope: e.target.value })}
                rows={3}
                placeholder="Detailed project requirements, client specifications, contract milestones or deliverable terms..."
                className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-all shadow-inner focus:ring-1 focus:ring-[#6324FC]/30 resize-none leading-relaxed"
              />
            </div>

            {/* Tasks / Checklist */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <CheckSquare size={12} style={{ color: platformConfig.color }} /> Initial Task Checklist (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateAi('tasks')}
                    disabled={isGeneratingAi || !formData.title.trim()}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-heading font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all disabled:opacity-50"
                    title="Generate milestone deliverables checklist using AI"
                  >
                    <Sparkles size={10} />
                    <span>AI Tasks</span>
                  </button>
                  <span className="text-[9px] font-mono text-secondary">One item per line</span>
                </div>
              </div>
              <textarea 
                value={formData.tasks}
                onChange={e => setFormData({ ...formData, tasks: e.target.value })}
                rows={3}
                placeholder="1. Setup Github repository & architecture&#10;2. Design modern UI system&#10;3. API endpoint integration & testing"
                className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-secondary/60 outline-none font-mono transition-all shadow-inner focus:ring-1 focus:ring-[#6324FC]/30 resize-none leading-relaxed"
              />
            </div>
          </form>

          {/* Modal Footer */}
          <div className="p-4 md:px-6 md:py-4 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between gap-3 z-20">
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-secondary">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                Ctrl + Enter
              </span>
              <span>to quick save</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
                disabled={isSubmitting || !formData.title.trim()}
                className="px-6 py-2.5 rounded-xl text-xs font-heading font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:brightness-110 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${platformConfig.color}, #8B5CF6)`,
                  boxShadow: `0 0 18px ${platformConfig.glow}`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Sparkles size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
