'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Save,
  Link as LinkIcon,
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  CheckCircle,
  Loader2,
  DollarSign,
  AlertTriangle,
  Clock,
  Eye,
  XCircle,
  ChevronDown,
  Edit2,
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { updateProposal, deleteProposal } from '@/app/actions/proposalActions';

interface Phase {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
}

interface InvestmentItem {
  id: string;
  description: string;
  cost: number;
}

interface Proposal {
  _id: string;
  title: string;
  clientName: string;
  value: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
  content: string;
  introduction: string;
  phases: Phase[];
  investment: InvestmentItem[];
  dateSent?: string;
  dateAccepted?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProposalEditorClientProps {
  proposal: Proposal;
}

export default function ProposalEditorClient({ proposal: initialProposal }: ProposalEditorClientProps) {
  const router = useRouter();
  // Ensure arrays are initialized
  const normalizedProposal = {
    ...initialProposal,
    phases: initialProposal.phases || [],
    investment: initialProposal.investment || [],
  };
  const [proposal, setProposal] = useState<Proposal>(normalizedProposal);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    // Skip auto-save on initial mount
    if (!lastSaved) return;
    
    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [proposal.title, proposal.clientName, proposal.introduction, JSON.stringify(proposal.phases), JSON.stringify(proposal.investment)]);

  // Close status menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.status-dropdown')) {
          setShowStatusMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusMenu]);

  const handleSave = async (silent = false) => {
    if (!silent) setIsSaving(true);

    try {
      const result = await updateProposal(proposal._id, {
        title: proposal.title,
        clientName: proposal.clientName,
        introduction: proposal.introduction,
        phases: proposal.phases,
        investment: proposal.investment,
      });

      if (result.success) {
        setLastSaved(new Date());
        if (result.data) {
          setProposal(result.data);
        }
      } else {
        console.error('Failed to save:', result.error);
        if (!silent) alert('Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving:', error);
      if (!silent) alert('An error occurred while saving.');
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const handleGenerateLink = () => {
    const publicUrl = `${window.location.origin}/p/${proposal._id}`;
    navigator.clipboard.writeText(publicUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected') => {
    setIsSaving(true);
    setShowStatusMenu(false);
    try {
      const result = await updateProposal(proposal._id, {
        status: newStatus,
      });

      if (result.success && result.data) {
        setProposal(result.data);
        setLastSaved(new Date());
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('An error occurred while updating status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProposal(proposal._id);
      if (result.success) {
        router.push('/proposals');
      } else {
        alert('Failed to delete proposal. Please try again.');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('An error occurred while deleting.');
      setIsDeleting(false);
    }
  };

  // Phase Management
  const addPhase = () => {
    const newPhase: Phase = {
      id: Date.now().toString(),
      title: '',
      description: '',
      deliverables: [''],
    };
    setProposal({ ...proposal, phases: [...(proposal.phases || []), newPhase] });
  };

  const updatePhase = (index: number, field: keyof Phase, value: any) => {
    const updatedPhases = [...(proposal.phases || [])];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    setProposal({ ...proposal, phases: updatedPhases });
  };

  const removePhase = (index: number) => {
    const updatedPhases = (proposal.phases || []).filter((_, i) => i !== index);
    setProposal({ ...proposal, phases: updatedPhases });
  };

  const addDeliverable = (phaseIndex: number) => {
    const updatedPhases = [...(proposal.phases || [])];
    updatedPhases[phaseIndex].deliverables.push('');
    setProposal({ ...proposal, phases: updatedPhases });
  };

  const updateDeliverable = (phaseIndex: number, deliverableIndex: number, value: string) => {
    const updatedPhases = [...(proposal.phases || [])];
    updatedPhases[phaseIndex].deliverables[deliverableIndex] = value;
    setProposal({ ...proposal, phases: updatedPhases });
  };

  const removeDeliverable = (phaseIndex: number, deliverableIndex: number) => {
    const updatedPhases = [...(proposal.phases || [])];
    updatedPhases[phaseIndex].deliverables = updatedPhases[phaseIndex].deliverables.filter(
      (_, i) => i !== deliverableIndex
    );
    setProposal({ ...proposal, phases: updatedPhases });
  };

  // Investment Management
  const addInvestmentItem = () => {
    const newItem: InvestmentItem = {
      id: Date.now().toString(),
      description: '',
      cost: 0,
    };
    setProposal({ ...proposal, investment: [...(proposal.investment || []), newItem] });
  };

  const updateInvestmentItem = (index: number, field: keyof InvestmentItem, value: any) => {
    const updatedInvestment = [...(proposal.investment || [])];
    updatedInvestment[index] = { ...updatedInvestment[index], [field]: value };
    setProposal({ ...proposal, investment: updatedInvestment });
  };

  const removeInvestmentItem = (index: number) => {
    const updatedInvestment = (proposal.investment || []).filter((_, i) => i !== index);
    setProposal({ ...proposal, investment: updatedInvestment });
  };

  const totalInvestment = (proposal.investment || []).reduce((sum, item) => sum + (item.cost || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Draft':
        return { 
          color: 'text-slate-600 dark:text-gray-400', 
          bg: 'bg-slate-100 dark:bg-white/5', 
          border: 'border-slate-200 dark:border-white/10',
          icon: Clock,
          label: 'Draft'
        };
      case 'Sent':
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bg: 'bg-blue-100 dark:bg-blue-500/20', 
          border: 'border-blue-200 dark:border-blue-500/30',
          icon: Send,
          label: 'Sent'
        };
      case 'Viewed':
        return { 
          color: 'text-purple-600 dark:text-purple-400', 
          bg: 'bg-purple-100 dark:bg-purple-500/20', 
          border: 'border-purple-200 dark:border-purple-500/30',
          icon: Eye,
          label: 'Viewed'
        };
      case 'Accepted':
        return { 
          color: 'text-green-600 dark:text-green-400', 
          bg: 'bg-green-100 dark:bg-green-500/20', 
          border: 'border-green-200 dark:border-green-500/30',
          icon: CheckCircle,
          label: 'Accepted'
        };
      case 'Rejected':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bg: 'bg-red-100 dark:bg-red-500/20', 
          border: 'border-red-200 dark:border-red-500/30',
          icon: XCircle,
          label: 'Rejected'
        };
      default:
        return { 
          color: 'text-slate-600 dark:text-gray-400', 
          bg: 'bg-slate-100 dark:bg-white/5', 
          border: 'border-slate-200 dark:border-white/10',
          icon: Clock,
          label: 'Draft'
        };
    }
  };

  const currentStatus = getStatusConfig(proposal.status);
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-slate-200 font-outfit selection:bg-[#2563EB]/30">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl border-b border-slate-200 dark:border-[#232734]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={() => router.push('/proposals')}
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-all flex-shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-full max-w-md">
                <div className="relative flex items-center w-full group">
                  <input
                    type="text"
                    value={proposal.title}
                    onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                    className="text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-transparent hover:border-slate-200 dark:border-[#232734] focus:border-[#2563EB] outline-none text-slate-900 dark:text-white placeholder-[#94A3B8]/50 w-full pr-8 py-1 transition-all tracking-tight"
                    placeholder="Untitled Proposal"
                  />
                  <Edit2 size={16} className="absolute right-2 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                {lastSaved && (
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Last saved {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Status Dropdown */}
              <div className="relative status-dropdown">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl transition-all text-xs bg-white dark:bg-[#11131A] text-slate-900 dark:text-white border border-slate-200 dark:border-[#232734] hover:bg-slate-200 dark:bg-[#232734] disabled:opacity-50"
                >
                  <StatusIcon size={14} style={{ color: currentStatus.color.includes('text-blue') ? '#2563EB' : currentStatus.color.includes('text-green') ? '#10B981' : currentStatus.color.includes('text-purple') ? '#7C3AED' : currentStatus.color.includes('text-red') ? '#EF4444' : '#94A3B8' }} />
                  {currentStatus.label}
                  <ChevronDown size={14} className="text-[#94A3B8]" />
                </button>

                {/* Status Dropdown Menu */}
                {showStatusMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-1">
                    {['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'].map((status) => {
                      const config = getStatusConfig(status);
                      const Icon = config.icon;
                      return (
                         <button
                           key={status}
                           onClick={() => handleStatusChange(status as any)}
                           disabled={isSaving}
                           className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors rounded-lg ${
                             proposal.status === status
                               ? 'bg-[#2563EB]/10 text-[#2563EB]'
                               : 'text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734]'
                           } disabled:opacity-50 mb-0.5 last:mb-0`}
                         >
                           <Icon size={14} />
                           {config.label}
                           {proposal.status === status && (
                             <CheckCircle size={14} className="ml-auto" />
                           )}
                         </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2.5 text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 hover:bg-[#EF4444]/20 rounded-xl transition-colors"
                title="Delete Proposal"
              >
                <Trash2 size={16} />
              </button>

              {proposal.status !== 'Draft' && (
                <button
                  onClick={handleGenerateLink}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB]/10 border border-[#2563EB]/20 hover:bg-[#2563EB]/20 text-[#2563EB] font-bold rounded-xl transition-colors text-xs"
                >
                  <LinkIcon size={14} />
                  {linkCopied ? 'Link Copied!' : 'Copy Link'}
                </button>
              )}

              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold rounded-xl transition-all text-xs disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.25)] border border-[#2563EB]/80"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Client Name */}
          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 shadow-sm">
            <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">
              Client Name
            </label>
            <input
              type="text"
              value={proposal.clientName}
              onChange={(e) => setProposal({ ...proposal, clientName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/50 outline-none transition-all text-sm font-medium"
              placeholder="Enter client name"
            />
          </div>

          {/* Introduction */}
          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 shadow-sm">
            <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-4">
              Introduction
            </label>
            <div className="bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl overflow-hidden focus-within:border-[#2563EB]/50 focus-within:ring-1 focus-within:ring-[#2563EB]/50 transition-all">
              <RichTextEditor
                value={proposal.introduction}
                onChange={(value) => setProposal({ ...proposal, introduction: value })}
                placeholder="Write a compelling introduction for your proposal..."
              />
            </div>
          </div>

          {/* Scope of Work / Phases */}
          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">
                Scope of Work / Phases
              </label>
              <button
                onClick={addPhase}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-[#232734] hover:bg-[#2563EB] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]"
              >
                <Plus size={14} /> Add Phase
              </button>
            </div>

            <div className="space-y-4">
              {(!proposal.phases || proposal.phases.length === 0) ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#94A3B8] text-center border border-dashed border-slate-200 dark:border-[#232734] rounded-xl bg-[#09090B]/50">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-3">
                    <Plus size={20} className="text-[#232734]" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No phases added</p>
                  <p className="text-xs">Click "Add Phase" to outline your scope of work.</p>
                </div>
              ) : (
                proposal.phases.map((phase, phaseIndex) => (
                  <div
                    key={phase.id}
                    className="bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl p-5 space-y-4 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={phase.title}
                          onChange={(e) => updatePhase(phaseIndex, 'title', e.target.value)}
                          className="w-full px-0 py-1 bg-transparent text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:outline-none text-base font-bold border-b border-transparent focus:border-[#2563EB] transition-colors"
                          placeholder="Phase Title (e.g., Discovery & Research)"
                        />
                      </div>
                      <button
                        onClick={() => removePhase(phaseIndex)}
                        className="w-8 h-8 flex items-center justify-center text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <textarea
                      value={phase.description}
                      onChange={(e) => updatePhase(phaseIndex, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-lg text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:border-[#2563EB]/50 focus:outline-none text-sm resize-none transition-all"
                      placeholder="Briefly describe the objective of this phase..."
                      rows={2}
                    />

                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Deliverables
                        </label>
                      </div>
                      <div className="space-y-2">
                        {phase.deliverables.map((deliverable, deliverableIndex) => (
                          <div key={deliverableIndex} className="flex items-center gap-2 group/item">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] flex-shrink-0" />
                            <input
                              type="text"
                              value={deliverable}
                              onChange={(e) =>
                                updateDeliverable(phaseIndex, deliverableIndex, e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 bg-transparent border-b border-slate-200 dark:border-[#232734] focus:border-[#2563EB] text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:outline-none text-sm transition-colors"
                              placeholder="e.g., Final UI/UX Design Figma File"
                            />
                            <button
                              onClick={() => removeDeliverable(phaseIndex, deliverableIndex)}
                              className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-md transition-colors opacity-0 group-hover/item:opacity-100"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addDeliverable(phaseIndex)}
                          className="mt-2 text-[11px] font-bold text-[#2563EB] hover:text-[#2563EB]/80 transition-colors flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Deliverable
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Investment Breakdown */}
          <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">
                Investment Breakdown
              </label>
              <button
                onClick={addInvestmentItem}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-[#232734] hover:bg-[#2563EB] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {(!proposal.investment || proposal.investment.length === 0) ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#94A3B8] text-center border border-dashed border-slate-200 dark:border-[#232734] rounded-xl bg-[#09090B]/50">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-3">
                    <DollarSign size={20} className="text-[#232734]" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No items added</p>
                  <p className="text-xs">Click "Add Item" to build your pricing table.</p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl overflow-hidden">
                  {/* Table Header */}
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
                    <div className="flex-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Description</div>
                    <div className="w-32 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-right pr-12">Cost</div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y divide-[#232734]">
                    {proposal.investment.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 group"
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateInvestmentItem(index, 'description', e.target.value)}
                          className="flex-1 px-3 py-2 bg-transparent text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:bg-white dark:bg-[#11131A] rounded-lg focus:outline-none text-sm transition-colors"
                          placeholder="Item Description (e.g., UI/UX Design)"
                        />
                        <div className="relative flex items-center w-32">
                          <DollarSign
                            size={14}
                            className="absolute left-3 text-[#94A3B8]"
                          />
                          <input
                            type="number"
                            value={item.cost || ''}
                            onChange={(e) =>
                              updateInvestmentItem(index, 'cost', parseFloat(e.target.value) || 0)
                            }
                            className="w-full pl-8 pr-3 py-2 bg-transparent text-slate-900 dark:text-white font-mono placeholder-[#94A3B8]/30 focus:bg-white dark:bg-[#11131A] rounded-lg focus:outline-none text-sm transition-colors text-right"
                            placeholder="0"
                          />
                        </div>
                        <button
                          onClick={() => removeInvestmentItem(index)}
                          className="w-8 h-8 flex items-center justify-center text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-[#11131A] border-t border-slate-200 dark:border-[#232734]">
                    <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
                      Total Investment
                    </span>
                    <span className="text-xl font-bold font-mono text-[#2563EB] tracking-tight">
                      {formatCurrency(totalInvestment)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-[24px] p-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-[#EF4444]" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Delete Proposal?
            </h3>
            
            <p className="text-sm text-[#94A3B8] mb-1">
              Are you sure you want to delete:
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-5 line-clamp-2">
              "{proposal.title || 'Untitled Proposal'}"
            </p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white text-sm font-bold rounded-xl hover:bg-slate-200 dark:bg-[#232734] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-slate-900 dark:text-white text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.25)] border border-[#EF4444]/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
