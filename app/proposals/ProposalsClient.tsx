'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Send, Eye, CheckCircle, Clock, MoreHorizontal, DollarSign, Calendar, Loader2, Trash2, Edit } from 'lucide-react';
import { createProposal, deleteProposal } from '@/app/actions/proposalActions';

interface Proposal {
  _id: string;
  title: string;
  clientName: string;
  value: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
  dateSent?: string;
  createdAt: string;
}

interface ProposalsClientProps {
  initialProposals: Proposal[];
  initialStats: {
    activeCount: number;
    wonThisMonth: number;
    draftsCount: number;
    acceptedCount: number;
    rejectedCount: number;
    totalValue: number;
    conversionRate: number;
  };
}

export default function ProposalsClient({ initialProposals, initialStats }: ProposalsClientProps) {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [stats] = useState(initialStats);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const router = useRouter();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Accepted':
        return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/20', border: 'border-green-200 dark:border-green-500/30', icon: CheckCircle };
      case 'Sent':
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/30', icon: Send };
      case 'Viewed':
        return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/30', icon: Eye };
      case 'Rejected':
        return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/20', border: 'border-red-200 dark:border-red-500/30', icon: Clock };
      case 'Draft':
      default:
        return { color: 'text-slate-600 dark:text-gray-400', bg: 'bg-slate-100 dark:bg-white/5', border: 'border-slate-200 dark:border-white/10', icon: Clock };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not sent';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleCreateProposal = async () => {
    setIsCreating(true);
    try {
      const result = await createProposal();
      if (result.success && result.data) {
        router.push(`/proposals/${result.data._id}`);
      } else {
        console.error('Failed to create proposal:', result.error);
        alert('Failed to create proposal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (proposal: Proposal, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProposalToDelete(proposal);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!proposalToDelete) return;

    setDeletingId(proposalToDelete._id);
    try {
      const result = await deleteProposal(proposalToDelete._id);
      if (result.success) {
        // Close modal first
        setShowDeleteModal(false);
        setProposalToDelete(null);
        
        // Force full page reload to ensure everything is in sync
        window.location.reload();
      } else {
        alert('Failed to delete proposal. Please try again.');
        setDeletingId(null);
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('An error occurred. Please try again.');
      setDeletingId(null);
    }
  };

  const handleEditClick = (proposalId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    router.push(`/proposals/${proposalId}`);
  };

  const toggleMenu = (proposalId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === proposalId ? null : proposalId);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen p-8 text-slate-800 dark:text-slate-200">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-6xl md:text-7xl font-jakarta font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-3">
            Smart Proposals
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-500 dark:text-gray-400">Design, send, and track stunning client proposals</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Dynamic Stat Badges */}
          <div className="flex bg-white/70 dark:bg-purple-950/10 backdrop-blur-md border border-slate-200 dark:border-purple-500/10 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <div className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10">
              <span className="text-xs font-inter text-slate-500 dark:text-gray-400 block mb-0.5">Active</span>
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-white">{stats.activeCount}</span>
            </div>
            <div className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10">
              <span className="text-xs font-inter text-slate-500 dark:text-gray-400 block mb-0.5">Drafts</span>
              <span className="text-sm font-mono font-bold text-slate-600 dark:text-gray-300">{stats.draftsCount}</span>
            </div>
            <div className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10">
              <span className="text-xs font-inter text-slate-500 dark:text-gray-400 block mb-0.5">Accepted</span>
              <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400">{stats.acceptedCount}</span>
            </div>
            <div className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10">
              <span className="text-xs font-inter text-slate-500 dark:text-gray-400 block mb-0.5">Rejected</span>
              <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">{stats.rejectedCount}</span>
            </div>
            <div className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10">
              <span className="text-xs font-inter text-slate-500 dark:text-gray-400 block mb-0.5">Win Rate</span>
              <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{stats.conversionRate.toFixed(0)}%</span>
            </div>
            <div className="px-4 py-2">
              <span className="text-xs font-inter text-slate-500 dark:text-gray-400 block mb-0.5">Total Won</span>
              <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalValue)}</span>
            </div>
          </div>

          <button 
            onClick={handleCreateProposal}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isCreating ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus size={18} /> Create Proposal
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/70 dark:bg-purple-950/10 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 rounded-3xl shadow-sm">
          <FileText size={64} className="text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-2xl font-jakarta font-black text-slate-600 dark:text-slate-400 mb-2">No proposals found</h3>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-500 dark:text-slate-500 mb-6">Create your first proposal to get started</p>
          <button 
            onClick={handleCreateProposal}
            disabled={isCreating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-jakarta font-bold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isCreating ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus size={18} /> Create Proposal
              </>
            )}
          </button>
        </div>
      ) : (
        /* Pipeline Grid */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {proposals.map((proposal) => {
            const StatusIcon = getStatusConfig(proposal.status).icon;
            const statusStyle = getStatusConfig(proposal.status);

            return (
              <motion.div
                key={proposal._id}
                variants={itemVariants}
              >
                <div className="relative">
                  <Link href={`/proposals/${proposal._id}`} className="block">
                    <div className="group bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 shadow-sm dark:shadow-none hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] hover:border-indigo-200 dark:hover:border-purple-500/30 transition-all duration-300 flex flex-col cursor-pointer relative overflow-hidden h-full">
                      {/* Top Row: Client & Options */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-all duration-300">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-jakarta font-bold text-slate-800 dark:text-white line-clamp-1">{proposal.clientName}</h3>
                            <p className="text-xs font-inter text-slate-500 dark:text-gray-400">Client</p>
                          </div>
                        </div>
                        <div className="relative">
                          <button 
                            onClick={(e) => toggleMenu(proposal._id, e)}
                            className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          
                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {openMenuId === proposal._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                              >
                                <button
                                  onClick={(e) => handleEditClick(proposal._id, e)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <Edit size={16} />
                                  Edit Proposal
                                </button>
                                <button
                                  onClick={(e) => handleDeleteClick(proposal, e)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 size={16} />
                                  Delete Proposal
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                    {/* Title */}
                    <h2 className="text-xl font-jakarta font-black text-slate-900 dark:text-slate-100 mb-6 line-clamp-2 leading-tight">
                      {proposal.title}
                    </h2>

                    <div className="mt-auto space-y-4">
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300 font-mono font-bold">
                          <DollarSign size={16} className="text-slate-400" />
                          {formatCurrency(proposal.value)}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 text-xs font-inter">
                          <Calendar size={14} />
                          {formatDate(proposal.dateSent)}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`flex items-center gap-2 w-max px-3 py-1.5 rounded-lg border text-xs font-jakarta font-bold ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        <StatusIcon size={14} />
                        {proposal.status}
                      </div>
                    </div>

                    {/* Subtle accent line on hover */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
              </div>
            </motion.div>
            );
          })}
        </motion.div>
      )}
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && proposalToDelete && (
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
                  <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                </div>
                
                <h3 className="text-3xl font-jakarta font-black text-slate-900 dark:text-white mb-2">
                  Delete Proposal?
                </h3>
                
                <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-600 dark:text-gray-400 mb-2">
                  Are you sure you want to delete
                </p>
                <p className="font-jakarta font-bold text-slate-900 dark:text-white mb-6">
                  "{proposalToDelete.title}"?
                </p>
                
                <p className="text-sm font-inter text-red-600 dark:text-red-400 mb-6">
                  This action cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProposalToDelete(null);
                    }}
                    disabled={deletingId !== null}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 font-jakarta font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deletingId !== null}
                    className="flex-1 px-6 py-3 bg-red-600 text-white font-jakarta font-bold text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deletingId ? (
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
      </AnimatePresence>
    </div>
  );
}
