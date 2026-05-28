'use client';

import React, { useState } from 'react';
import { Mail, MessageCircle, Globe, Plus, X, Trash2, Edit, MoreHorizontal, Building2, User, Calendar, Tag, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, deleteLead } from '@/app/actions/leadActions';
import { useRouter } from 'next/navigation';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';

const STATUS_OPTIONS = ['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'];

export default function LeadsClient({ initialLeads }: { initialLeads: any[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', contact_person: '', email: '', phone: '', source: 'Manual',
    targetService: 'High-end Web Development', website_url: '', facebook_url: '',
    instagram_url: '', linkedin_url: '', reportFileUrl: ''
  });

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'New': 
        return { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-600/10', border: 'border-blue-300 dark:border-blue-400/40' };
      case 'Contacted': 
        return { color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-500/20 dark:to-yellow-600/10', border: 'border-yellow-300 dark:border-yellow-400/40' };
      case 'Replied':
        return { color: 'text-purple-700 dark:text-purple-300', bg: 'bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-500/20 dark:to-purple-600/10', border: 'border-purple-300 dark:border-purple-400/40' };
      case 'Meeting Booked': 
        return { color: 'text-green-700 dark:text-green-300', bg: 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-500/20 dark:to-green-600/10', border: 'border-green-300 dark:border-green-400/40' };
      case 'Closed': 
        return { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-600/10', border: 'border-emerald-300 dark:border-emerald-400/40' };
      case 'Not Interested': 
        return { color: 'text-red-700 dark:text-red-300', bg: 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-600/10', border: 'border-red-300 dark:border-red-400/40' };
      default: 
        return { color: 'text-slate-700 dark:text-gray-300', bg: 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-white/10 dark:to-white/5', border: 'border-slate-300 dark:border-white/20' };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await createLead(formData);
      if (res.success) {
        setLeads([res.data, ...leads]);
        setIsFormOpen(false);
        setFormData({ 
          company_name: '', contact_person: '', email: '', phone: '', source: 'Manual',
          targetService: 'High-end Web Development', website_url: '', facebook_url: '',
          instagram_url: '', linkedin_url: '', reportFileUrl: ''
        });
        router.refresh();
      } else {
        alert(res.error || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (lead: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLeadToDelete(lead);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    setDeletingId(leadToDelete._id);
    try {
      const result = await deleteLead(leadToDelete._id);
      if (result.success) {
        setShowDeleteModal(false);
        setLeadToDelete(null);
        window.location.reload();
      } else {
        alert('Failed to delete lead. Please try again.');
        setDeletingId(null);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('An error occurred. Please try again.');
      setDeletingId(null);
    }
  };

  const handleEditClick = (lead: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCardClick = (lead: any) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const toggleMenu = (leadId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (openMenuId === leadId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
      setOpenMenuId(leadId);
    }
  };

  const filteredLeads = showFollowUps 
    ? leads.filter(lead => {
        if (!lead.nextFollowUpDate) return false;
        const followUpDate = new Date(lead.nextFollowUpDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return followUpDate <= today;
      })
    : leads;

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-1 md:mb-2">
            Leads & Outreach
          </h1>
          <p className="text-slate-600 dark:text-gray-400 text-xs md:text-sm font-medium">Manage high-density pipeline and cold outreach</p>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap w-full md:w-auto">
          <button 
            onClick={() => setShowFollowUps(!showFollowUps)}
            className={`flex items-center gap-2 md:gap-2.5 px-3 md:px-5 py-2 md:py-2.5 border-2 rounded-xl transition-all text-xs md:text-sm font-bold shadow-sm hover:shadow-md ${
              showFollowUps 
                ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300 text-red-700 dark:from-red-500/20 dark:to-orange-500/20 dark:border-red-400/50 dark:text-red-300 shadow-red-200/50 dark:shadow-red-500/20' 
                : 'bg-white/90 border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/15 dark:text-white'
            }`}
          >
            <Calendar size={16} className="md:hidden" strokeWidth={2.5} />
            <Calendar size={18} className="hidden md:block" strokeWidth={2.5} />
            <span className="hidden sm:inline">Follow-ups Today</span>
            <span className="sm:hidden">Follow-ups</span>
          </button>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 md:gap-2.5 px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/40 transition-all text-xs md:text-sm shadow-lg flex-1 md:flex-initial justify-center"
          >
            <Plus size={18} className="md:hidden" strokeWidth={2.5} />
            <Plus size={20} className="hidden md:block" strokeWidth={2.5} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-purple-950/20 dark:to-purple-900/10 backdrop-blur-3xl border-2 border-slate-200/60 dark:border-purple-500/20 rounded-3xl shadow-xl">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mb-6">
            <Building2 size={40} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            {showFollowUps ? 'No follow-ups today' : 'No leads found'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium">
            {showFollowUps ? 'All caught up! Great work! 🎉' : 'Create your first lead to get started'}
          </p>
          {!showFollowUps && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/40 transition-all text-sm shadow-lg"
            >
              <Plus size={20} strokeWidth={2.5} /> Create First Lead
            </button>
          )}
        </div>
      ) : (
        /* Cards Grid */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredLeads.map((lead) => {
            const statusStyle = getStatusConfig(lead.outreach_status);
            let isFollowUpToday = false;
            if (lead.nextFollowUpDate) {
              const followUpDate = new Date(lead.nextFollowUpDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              isFollowUpToday = followUpDate <= today;
            }

            return (
              <motion.div
                key={lead._id}
                variants={itemVariants}
              >
                <div 
                  onClick={() => handleCardClick(lead)}
                  className="group bg-gradient-to-br from-white/90 to-white/70 dark:from-purple-950/30 dark:to-purple-900/20 backdrop-blur-2xl border border-slate-200/60 dark:border-purple-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-[0_20px_60px_rgba(168,85,247,0.25)] hover:border-indigo-300/60 dark:hover:border-purple-400/40 transition-all duration-500 flex flex-col cursor-pointer relative h-full"
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 rounded-3xl" />
                  
                  {/* Follow-up Indicator */}
                  {isFollowUpToday && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
                      </div>
                    </div>
                  )}

                  {/* Top Row: Company & Menu */}
                  <div className="flex justify-between items-start mb-4 md:mb-5 relative z-10">
                    <div className="flex items-center gap-2 md:gap-3 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <Building2 size={18} className="md:hidden" strokeWidth={2.5} />
                        <Building2 size={22} className="hidden md:block" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-0.5">{lead.company_name}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-gray-400 font-medium">Company</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => toggleMenu(lead._id, e)}
                        className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white transition-colors p-1.5 md:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 backdrop-blur-sm"
                      >
                        <MoreHorizontal size={18} className="md:hidden" />
                        <MoreHorizontal size={20} className="hidden md:block" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Person */}
                  {lead.contact_person && (
                    <div className="flex items-center gap-2 md:gap-2.5 mb-2 md:mb-3 px-2.5 md:px-3 py-1.5 md:py-2 bg-slate-50/80 dark:bg-white/5 rounded-lg md:rounded-xl relative z-10">
                      <div className="w-6 h-6 md:w-7 md:h-7 rounded-md md:rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                        <User size={12} className="md:hidden" strokeWidth={2.5} />
                        <User size={14} className="hidden md:block" strokeWidth={2.5} />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-gray-200 line-clamp-1">{lead.contact_person}</span>
                    </div>
                  )}

                  {/* Service Tag */}
                  <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 px-2.5 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-lg md:rounded-xl border border-indigo-100 dark:border-indigo-500/20 relative z-10">
                    <Tag size={11} className="text-indigo-600 dark:text-indigo-400 md:hidden" strokeWidth={2.5} />
                    <Tag size={13} className="text-indigo-600 dark:text-indigo-400 hidden md:block" strokeWidth={2.5} />
                    <span className="text-[10px] md:text-xs font-semibold text-indigo-700 dark:text-indigo-300 line-clamp-1">{lead.targetService || 'No service'}</span>
                  </div>

                  <div className="mt-auto space-y-3 md:space-y-4 relative z-10">
                    {/* Meta Info - Dates */}
                    <div className="space-y-1.5 md:space-y-2">
                      {/* Created Date */}
                      <div className="flex items-center justify-between px-2.5 md:px-3 py-1.5 md:py-2 bg-slate-50/80 dark:bg-white/5 rounded-lg md:rounded-xl border border-slate-200/50 dark:border-white/10">
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-600 dark:text-gray-400">
                          <Calendar size={12} className="text-slate-400 md:hidden" strokeWidth={2.5} />
                          <Calendar size={14} className="text-slate-400 hidden md:block" strokeWidth={2.5} />
                          <span className="font-medium">Created</span>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-gray-300">
                          {formatDate(lead.createdAt)}
                        </span>
                      </div>

                      {/* Next Follow-up Date */}
                      {lead.nextFollowUpDate ? (
                        <div className={`flex items-center justify-between px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl border ${
                          isFollowUpToday 
                            ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 border-red-200/50 dark:border-red-500/30' 
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border-blue-200/50 dark:border-blue-500/30'
                        }`}>
                          <div className={`flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs ${
                            isFollowUpToday 
                              ? 'text-red-700 dark:text-red-400' 
                              : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">
                              {isFollowUpToday ? 'Due!' : 'Next'}
                            </span>
                          </div>
                          <span className={`text-[10px] md:text-xs font-bold ${
                            isFollowUpToday 
                              ? 'text-red-700 dark:text-red-300' 
                              : 'text-blue-700 dark:text-blue-300'
                          }`}>
                            {formatDate(lead.nextFollowUpDate)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-2.5 md:px-3 py-1.5 md:py-2 bg-slate-50/80 dark:bg-white/5 rounded-lg md:rounded-xl border border-slate-200/50 dark:border-white/10">
                          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-500 dark:text-gray-400">
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">No Follow-up</span>
                          </div>
                          <span className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-gray-400">
                            {lead.source}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center justify-center gap-2 w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border-2 text-[10px] md:text-xs font-bold uppercase tracking-wide shadow-sm ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                      {lead.outreach_status}
                    </div>

                    {/* Action Buttons - Enhanced */}
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2 pt-2 md:pt-3 border-t-2 border-slate-200/60 dark:border-white/10">
                      {lead.email ? (
                        <a 
                          href={`mailto:${lead.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col items-center justify-center gap-1 md:gap-1.5 p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-500/20 dark:hover:to-cyan-500/20 border border-blue-200/50 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-400/50 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all hover:scale-105 hover:shadow-md group/btn"
                          title="Send Email"
                        >
                          <Mail size={14} className="md:hidden group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                          <Mail size={18} className="hidden md:block group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase">Email</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 md:gap-1.5 p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 opacity-40 cursor-not-allowed">
                          <Mail size={14} className="md:hidden text-slate-400" strokeWidth={2.5} />
                          <Mail size={18} className="hidden md:block text-slate-400" strokeWidth={2.5} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400">Email</span>
                        </div>
                      )}
                      
                      {lead.phone ? (
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col items-center justify-center gap-1 md:gap-1.5 p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-500/20 dark:hover:to-emerald-500/20 border border-green-200/50 dark:border-green-500/30 hover:border-green-300 dark:hover:border-green-400/50 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-all hover:scale-105 hover:shadow-md group/btn"
                          title="WhatsApp"
                        >
                          <MessageCircle size={14} className="md:hidden group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                          <MessageCircle size={18} className="hidden md:block group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase">WhatsApp</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 md:gap-1.5 p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 opacity-40 cursor-not-allowed">
                          <MessageCircle size={14} className="md:hidden text-slate-400" strokeWidth={2.5} />
                          <MessageCircle size={18} className="hidden md:block text-slate-400" strokeWidth={2.5} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400">WhatsApp</span>
                        </div>
                      )}

                      {lead.website_url ? (
                        <a 
                          href={lead.website_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col items-center justify-center gap-1 md:gap-1.5 p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/20 border border-indigo-200/50 dark:border-indigo-500/30 hover:border-indigo-300 dark:hover:border-indigo-400/50 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all hover:scale-105 hover:shadow-md group/btn"
                          title="Visit Website"
                        >
                          <Globe size={14} className="md:hidden group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                          <Globe size={18} className="hidden md:block group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase">Website</span>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 md:gap-1.5 p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 opacity-40 cursor-not-allowed">
                          <Globe size={14} className="md:hidden text-slate-400" strokeWidth={2.5} />
                          <Globe size={18} className="hidden md:block text-slate-400" strokeWidth={2.5} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400">Website</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced accent line on hover */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-3xl" />
                  
                  {/* Shine effect on hover - with overflow control */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Lead Details Modal */}
      <LeadDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => { setIsDetailsModalOpen(false); setSelectedLead(null); }} 
        lead={selectedLead} 
        onUpdateLead={async (id: string, updateData: any) => {
          const { updateLead } = await import('@/app/actions/leadActions');
          const res = await updateLead(id, updateData);
          if (res.success) {
            setLeads(leads.map(l => l._id === id ? res.data : l));
            if (selectedLead && selectedLead._id === id) {
              setSelectedLead(res.data);
            }
            router.refresh();
          } else {
            alert(res.error || 'Failed to update lead');
          }
        }} 
      />

      {/* Global Dropdown Menu - Fixed Position */}
      {openMenuId && menuPosition && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
            className="z-[110] w-52 bg-white dark:bg-slate-800 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={(e) => {
                const lead = leads.find(l => l._id === openMenuId);
                if (lead) handleEditClick(lead, e);
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors border-b border-slate-100 dark:border-slate-700"
            >
              <Edit size={18} strokeWidth={2.5} />
              Edit Lead
            </button>
            <button
              onClick={(e) => {
                const lead = leads.find(l => l._id === openMenuId);
                if (lead) handleDeleteClick(lead, e);
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={18} strokeWidth={2.5} />
              Delete Lead
            </button>
          </motion.div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && leadToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, type: "spring", damping: 25 }}
              className="relative w-full max-w-md bg-gradient-to-br from-white to-red-50/30 dark:from-slate-900 dark:to-red-950/20 backdrop-blur-2xl border-2 border-red-300 dark:border-red-500/40 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-6 shadow-2xl shadow-red-500/40 relative">
                  <Trash2 size={36} className="text-white" strokeWidth={2.5} />
                  <div className="absolute inset-0 rounded-2xl bg-red-400 animate-ping opacity-20" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  Delete Lead?
                </h3>
                
                <p className="text-slate-700 dark:text-gray-300 mb-2 font-medium">
                  Are you sure you want to delete
                </p>
                <p className="font-black text-lg text-slate-900 dark:text-white mb-6 px-4 py-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
                  "{leadToDelete.company_name}"?
                </p>
                
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-500/20 rounded-xl mb-8 border border-red-200 dark:border-red-500/30">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
                  <p className="text-sm font-bold text-red-700 dark:text-red-300">
                    This action cannot be undone
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setLeadToDelete(null);
                    }}
                    disabled={deletingId !== null}
                    className="flex-1 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 border-2 border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deletingId !== null}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-red-500"
                  >
                    {deletingId ? (
                      <>
                        <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={20} strokeWidth={2.5} />
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

      {/* Create Lead Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md" 
              onClick={() => setIsFormOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-purple-950/30 dark:to-purple-900/20 backdrop-blur-2xl border-2 border-slate-200/60 dark:border-purple-500/20 p-8 shadow-2xl dark:shadow-[0_0_80px_rgba(168,85,247,0.3)] rounded-3xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-200 dark:border-purple-500/20">
                <div>
                  <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                    Add New Lead
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 font-medium">Fill in the details to create a new lead</p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)} 
                  className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 hover:rotate-90 transition-all duration-300"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
              
              <form onSubmit={handleCreateLead} className="space-y-6 overflow-y-auto pr-2 flex-1">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                    <Building2 size={16} strokeWidth={2.5} />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={formData.company_name}
                        onChange={e => setFormData({...formData, company_name: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Contact Person</label>
                      <input 
                        type="text" 
                        value={formData.contact_person}
                        onChange={e => setFormData({...formData, contact_person: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Source</label>
                      <input 
                        type="text" 
                        value={formData.source}
                        onChange={e => setFormData({...formData, source: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="e.g. LinkedIn"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                    <Mail size={16} strokeWidth={2.5} />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Phone (WhatsApp)</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="+1234567890"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Website URL</label>
                      <input 
                        type="url" 
                        value={formData.website_url}
                        onChange={e => setFormData({...formData, website_url: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links Section */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                    <Globe size={16} strokeWidth={2.5} />
                    Social Media & Links
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </label>
                      <input 
                        type="url" 
                        value={formData.facebook_url}
                        onChange={e => setFormData({...formData, facebook_url: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-pink-600 dark:text-pink-400 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Instagram
                      </label>
                      <input 
                        type="url" 
                        value={formData.instagram_url}
                        onChange={e => setFormData({...formData, instagram_url: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </label>
                      <input 
                        type="url" 
                        value={formData.linkedin_url}
                        onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-700 transition-all text-sm"
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                        <FileText size={14} strokeWidth={2.5} />
                        Report File
                      </label>
                      <input 
                        type="url" 
                        value={formData.reportFileUrl}
                        onChange={e => setFormData({...formData, reportFileUrl: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                    <Tag size={16} strokeWidth={2.5} />
                    Target Service
                  </h3>
                  
                  <select 
                    value={formData.targetService}
                    onChange={e => setFormData({...formData, targetService: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer font-medium"
                  >
                    {['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design'].map(srv => (
                      <option key={srv} value={srv} className="bg-white dark:bg-slate-900">{srv}</option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t-2 border-slate-200 dark:border-purple-500/20 sticky bottom-0 bg-gradient-to-t from-white/95 to-transparent dark:from-purple-950/30 dark:to-transparent backdrop-blur-sm pb-2">
                  <button 
                    type="submit" 
                    disabled={isCreating}
                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black text-base rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wide"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={22} className="animate-spin" strokeWidth={2.5} />
                        Creating Lead...
                      </>
                    ) : (
                      <>
                        <Plus size={22} strokeWidth={2.5} />
                        Create Lead
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
