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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/proposals')}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <input
                  type="text"
                  value={proposal.title}
                  onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                  className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 w-full"
                  placeholder="Untitled Proposal"
                />
                {lastSaved && (
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                    Last saved {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Dropdown */}
              <div className="relative status-dropdown">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-all text-sm border ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border} hover:shadow-md disabled:opacity-50`}
                >
                  <StatusIcon size={16} />
                  {currentStatus.label}
                  <ChevronDown size={14} />
                </button>

                {/* Status Dropdown Menu */}
                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                    {['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'].map((status) => {
                      const config = getStatusConfig(status);
                      const Icon = config.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status as any)}
                          disabled={isSaving}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                            proposal.status === status
                              ? `${config.bg} ${config.color} font-semibold`
                              : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          } disabled:opacity-50`}
                        >
                          <Icon size={16} />
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
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete Proposal"
              >
                <Trash2 size={18} />
              </button>

              {proposal.status !== 'Draft' && (
                <button
                  onClick={handleGenerateLink}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <LinkIcon size={16} />
                  {linkCopied ? 'Link Copied!' : 'Generate Link'}
                </button>
              )}

              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all text-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Content */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Client Name */}
          <div className="bg-white/70 dark:bg-purple-950/20 backdrop-blur-xl border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={proposal.clientName}
              onChange={(e) => setProposal({ ...proposal, clientName: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Enter client name"
            />
          </div>

          {/* Introduction */}
          <div className="bg-white/70 dark:bg-purple-950/20 backdrop-blur-xl border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
              Introduction
            </label>
            <RichTextEditor
              value={proposal.introduction}
              onChange={(value) => setProposal({ ...proposal, introduction: value })}
              placeholder="Write a compelling introduction for your proposal..."
            />
          </div>

          {/* Scope of Work / Phases */}
          <div className="bg-white/70 dark:bg-purple-950/20 backdrop-blur-xl border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Scope of Work / Phases
              </label>
              <button
                onClick={addPhase}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Add Phase
              </button>
            </div>

            <div className="space-y-4">
              {(!proposal.phases || proposal.phases.length === 0) ? (
                <p className="text-center text-slate-500 dark:text-gray-400 py-8">
                  No phases added yet. Click "Add Phase" to get started.
                </p>
              ) : (
                proposal.phases.map((phase, phaseIndex) => (
                  <div
                    key={phase.id}
                    className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <input
                        type="text"
                        value={phase.title}
                        onChange={(e) => updatePhase(phaseIndex, 'title', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                        placeholder="Phase Title"
                      />
                      <button
                        onClick={() => removePhase(phaseIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <textarea
                      value={phase.description}
                      onChange={(e) => updatePhase(phaseIndex, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                      placeholder="Phase Description"
                      rows={2}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-gray-400">
                          Deliverables
                        </label>
                        <button
                          onClick={() => addDeliverable(phaseIndex)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          + Add Deliverable
                        </button>
                      </div>
                      <div className="space-y-2">
                        {phase.deliverables.map((deliverable, deliverableIndex) => (
                          <div key={deliverableIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={deliverable}
                              onChange={(e) =>
                                updateDeliverable(phaseIndex, deliverableIndex, e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              placeholder="Deliverable item"
                            />
                            <button
                              onClick={() => removeDeliverable(phaseIndex, deliverableIndex)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Investment Breakdown */}
          <div className="bg-white/70 dark:bg-purple-950/20 backdrop-blur-xl border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Investment Breakdown
              </label>
              <button
                onClick={addInvestmentItem}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {(!proposal.investment || proposal.investment.length === 0) ? (
                <p className="text-center text-slate-500 dark:text-gray-400 py-8">
                  No investment items added yet. Click "Add Item" to get started.
                </p>
              ) : (
                <>
                  {proposal.investment.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3"
                    >
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateInvestmentItem(index, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="Description"
                      />
                      <div className="relative">
                        <DollarSign
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) =>
                            updateInvestmentItem(index, 'cost', parseFloat(e.target.value) || 0)
                          }
                          className="w-32 pl-8 pr-3 py-2 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => removeInvestmentItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                      Total Investment
                    </span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(totalInvestment)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 backdrop-blur-2xl border border-red-200 dark:border-red-500/30 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Delete Proposal?
              </h3>
              
              <p className="text-slate-600 dark:text-gray-400 mb-2">
                Are you sure you want to delete this proposal?
              </p>
              <p className="font-semibold text-slate-900 dark:text-white mb-6">
                "{proposal.title}"
              </p>
              
              <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
