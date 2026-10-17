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

interface CreateMarketplaceProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  defaultPlatform?: string;
}

const PLATFORMS = [
  { id: 'Freelancer', name: 'Freelancer', icon: Globe, color: '#00E5FF' },
  { id: 'Direct', name: 'Direct Client', icon: Users, color: '#6324FC' },
  { id: 'Upwork', name: 'Upwork', icon: Briefcase, color: '#10B981' },
  { id: 'Fiverr', name: 'Fiverr', icon: ShoppingCart, color: '#EC4899' },
];

export default function CreateMarketplaceProjectModal({ 
  isOpen, 
  onClose, 
  onSave,
  defaultPlatform = 'Freelancer'
}: CreateMarketplaceProjectModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform);
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    clientName: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    scope: '',
    tasks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client Selection State
  const [clients, setClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedPlatform(defaultPlatform);
  }, [defaultPlatform]);

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
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const handleCreateClient = async () => {
    if (!clientSearch.trim() || isCreatingClient) return;
    setIsCreatingClient(true);
    try {
      const res = await createMarketplaceClient({ name: clientSearch.trim(), platform: selectedPlatform });
      if (res.success && res.data) {
        setClients([res.data, ...clients]);
        setFormData(prev => ({ ...prev, clientId: res.data._id, clientName: res.data.name }));
        setShowClientDropdown(false);
        toast.success(`Client "${res.data.name}" created!`);
      } else {
        toast.error('Failed to create client');
      }
    } catch {
      toast.error('Error creating client');
    } finally {
      setIsCreatingClient(false);
    }
  };

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

    try {
      await onSave({
        ...formData,
        platform: selectedPlatform,
        tasks: taskList,
        clientDetails: {
          clientName: formData.clientName || clientSearch || 'Direct Client',
        }
      });
      
      // Reset form on success
      setFormData({
        title: '',
        clientId: '',
        clientName: '',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        deadline: '',
        scope: '',
        tasks: '',
      });
      setClientSearch('');
    } catch {
      // handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentPlatformObj = PLATFORMS.find(p => p.id.toLowerCase() === selectedPlatform.toLowerCase()) || PLATFORMS[0];
  const CurrentIcon = currentPlatformObj.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-2xl my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2),0_0_30px_rgba(99,36,252,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_30px_rgba(99,36,252,0.2)] flex flex-col overflow-hidden z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Neon Accent Glow Line */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2.5px] z-20"
            style={{ 
              backgroundImage: `linear-gradient(to right, transparent, ${currentPlatformObj.color}, transparent)`,
              boxShadow: `0 0 15px ${currentPlatformObj.color}`
            }}
          />

          {/* Modal Header */}
          <div className="relative flex justify-between items-center p-5 md:p-6 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0 transition-colors"
                style={{
                  backgroundColor: `${currentPlatformObj.color}15`,
                  border: `1px solid ${currentPlatformObj.color}35`,
                  color: currentPlatformObj.color,
                  boxShadow: `0 0 15px ${currentPlatformObj.color}25`
                }}
              >
                <CurrentIcon size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                    New {currentPlatformObj.name} Project
                  </h2>
                  <span 
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase"
                    style={{ 
                      backgroundColor: `${currentPlatformObj.color}15`,
                      color: currentPlatformObj.color,
                      border: `1px solid ${currentPlatformObj.color}30`
                    }}
                  >
                    Contract Scope
                  </span>
                </div>
                <p className="text-xs font-sans text-secondary mt-0.5">
                  Configure deliverables, client details, budget & milestones.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 border border-black/5 dark:border-white/5 hover:border-rose-500/30 transition-colors"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Body */}
          <form id="create-project-modal-form" onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 max-h-[78vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
            
            {/* Channel Selector Pills */}
            <div>
              <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                Channel / Platform
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map((plat) => {
                  const PIcon = plat.icon;
                  const isSelected = selectedPlatform.toLowerCase() === plat.id.toLowerCase();
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => setSelectedPlatform(plat.id)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-bold transition-all border ${
                        isSelected 
                          ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border-black/20 dark:border-white/30 shadow-md' 
                          : 'bg-slate-50 dark:bg-[#060608] text-secondary hover:text-slate-900 dark:hover:text-white border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15'
                      }`}
                      style={{
                        borderColor: isSelected ? plat.color : undefined,
                        boxShadow: isSelected ? `0 0 12px ${plat.color}30` : undefined
                      }}
                    >
                      <PIcon size={14} style={{ color: plat.color }} />
                      <span>{plat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row: Project Title */}
            <div>
              <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                Project Title <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Fullstack Next.js ERP & API Integration..."
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row: Client Selection & Search */}
            <div className="relative" ref={clientSearchRef}>
              <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                Client / Company
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                <input 
                  type="text" 
                  value={showClientDropdown ? clientSearch : (formData.clientName || clientSearch)}
                  onChange={e => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                    if (formData.clientId) setFormData({ ...formData, clientId: '', clientName: e.target.value });
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Search existing client or type new name..."
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none opacity-60" />

                {/* Dropdown Menu */}
                {showClientDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-[#0e0e13] border border-black/10 dark:border-white/15 rounded-xl shadow-2xl overflow-hidden z-30 max-h-52 overflow-y-auto custom-scrollbar">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(c => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, clientId: c._id, clientName: c.name });
                            setClientSearch(c.name);
                            setShowClientDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between border-b border-black/5 dark:border-white/5 last:border-0 transition-colors group"
                        >
                          <div>
                            <div className="font-heading font-bold text-slate-900 dark:text-white text-xs group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{c.name}</div>
                            {c.company && <div className="text-[10px] text-secondary">{c.company}</div>}
                          </div>
                          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-secondary">{c.platform || selectedPlatform}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center">
                        <p className="text-xs text-secondary mb-2">No client found matching "{clientSearch}"</p>
                        {clientSearch.trim() && (
                          <button 
                            type="button"
                            onClick={handleCreateClient}
                            disabled={isCreatingClient}
                            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#6324FC] hover:bg-[#521bd6] text-white font-heading font-bold rounded-lg text-xs transition-all shadow-md"
                          >
                            <Plus size={13} /> {isCreatingClient ? 'Creating...' : `Create "${clientSearch}"`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row: Financial & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Budget */}
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                  Budget (USD)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="1500"
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-secondary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                  Start Date
                </label>
                <DatePicker 
                  value={formData.startDate}
                  onChange={val => setFormData({ ...formData, startDate: val })}
                  placeholder="Select start date"
                  icon="calendar"
                  color={currentPlatformObj.color}
                  align="left"
                  direction="auto"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                  Target Deadline
                </label>
                <DatePicker 
                  value={formData.deadline}
                  onChange={val => setFormData({ ...formData, deadline: val })}
                  placeholder="Select deadline"
                  icon="clock"
                  color={currentPlatformObj.color}
                  align="right"
                  direction="auto"
                />
              </div>
            </div>

            {/* Row: Project Scope */}
            <div>
              <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                Project Scope & Deliverable Notes
              </label>
              <textarea 
                rows={3}
                value={formData.scope}
                onChange={e => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Overview of requirements, milestones, client specifications or contract terms..."
                className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Row: Initial Tasks / Checklist (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <CheckSquare size={12} className="text-[#00E5FF]" /> Initial Task Checklist (Optional)
                </label>
                <span className="text-[9px] font-mono text-secondary">One item per line</span>
              </div>
              <textarea 
                rows={3}
                value={formData.tasks}
                onChange={e => setFormData({ ...formData, tasks: e.target.value })}
                placeholder="1. Setup Github repository & architecture&#10;2. Complete Milestone 1 frontend sprint&#10;3. API testing & deployment"
                className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-secondary/60 outline-none font-mono transition-colors resize-none leading-relaxed"
              />
            </div>

          </form>

          {/* Modal Footer */}
          <div className="p-4 md:px-6 md:py-4 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="create-project-modal-form"
              disabled={isSubmitting || !formData.title.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-2"
            >
              <Sparkles size={14} />
              <span>{isSubmitting ? 'Creating Project...' : 'Launch Project'}</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
