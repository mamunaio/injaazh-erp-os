'use client';

import React, { useState } from 'react';
import { Mail, MessageCircle, Globe, Plus, X, Trash2, Edit, MoreHorizontal, Building2, User, Calendar, Tag, Loader2, AlertTriangle, FileText, Clock, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, deleteLead } from '@/app/actions/leadActions';
import { useRouter } from 'next/navigation';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';
import OutreachComposerModal from '@/components/leads/OutreachComposerModal';
import { toast } from 'react-hot-toast';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cold Email Outreach state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerLead, setComposerLead] = useState<any>(null);
  
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
        toast.success(res.message || 'Lead created successfully! 🎉');
        router.refresh();
      } else {
        // Handle duplicate error with detailed message
        if (res.isDuplicate && res.details) {
          const detailsMessage = res.details.join('\n• ');
          toast.error(
            `${res.error}\n\n• ${detailsMessage}`,
            { 
              duration: 5000,
              style: {
                maxWidth: '500px',
              }
            }
          );
        } else {
          toast.error(res.error || 'Failed to create lead');
        }
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('An error occurred. Please try again.');
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

  // Apply search filter
  const searchedLeads = searchQuery.trim()
    ? filteredLeads.filter(lead => 
        lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery) ||
        lead.targetService?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredLeads;

  // Group leads by date
  const groupedLeads = searchedLeads.reduce((groups: Record<string, any[]>, lead) => {
    const date = new Date(lead.createdAt);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(lead);
    return groups;
  }, {});

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedLeads).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0B0E1A] dark:via-[#0F1220] dark:to-[#0B0E1A] p-4 md:p-8 text-slate-800 dark:text-slate-200">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4 md:gap-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-jakarta font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-2 md:mb-3 tracking-tight leading-none">
            Leads & Outreach
          </h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base font-inter font-medium tracking-wide">Manage high-density pipeline and cold outreach</p>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/50 dark:bg-slate-800/40 p-1 border border-slate-300 dark:border-white/10 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button 
            onClick={() => setShowFollowUps(!showFollowUps)}
            className={`flex items-center gap-2 md:gap-2.5 px-4 md:px-6 py-2.5 md:py-3 border-2 rounded-xl transition-all text-sm md:text-sm font-jakarta font-bold shadow-sm hover:shadow-md ${
              showFollowUps 
                ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300 text-red-700 dark:from-red-500/20 dark:to-orange-500/20 dark:border-red-400/50 dark:text-red-300 shadow-red-200/50 dark:shadow-red-500/20' 
                : 'bg-white/90 border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/15 dark:text-white'
            }`}
          >
            <Calendar size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Follow-ups Today</span>
            <span className="sm:hidden">Follow-ups</span>
          </button>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 md:gap-2.5 px-5 md:px-7 py-2.5 md:py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-jakarta font-bold rounded-xl hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all text-sm md:text-sm shadow-lg flex-1 md:flex-initial justify-center"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search leads by company, contact, email, phone, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3.5 pl-12 bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-xl shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-inter transition-all"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-inter">
            Found <span className="font-bold text-indigo-600 dark:text-indigo-400">{searchedLeads.length}</span> lead{searchedLeads.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Empty State */}
      {searchedLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mb-6">
            <Building2 size={40} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-jakarta font-black text-slate-800 dark:text-white mb-3 tracking-tight">
            {searchQuery ? 'No leads found' : showFollowUps ? 'No follow-ups today' : 'No leads found'}
          </h3>
          <p className="text-sm font-inter text-slate-600 dark:text-slate-400 mb-8 font-medium tracking-wide">
            {searchQuery ? 'Try adjusting your search query' : showFollowUps ? 'All caught up! Great work! 🎉' : 'Create your first lead to get started'}
          </p>
          {!showFollowUps && !searchQuery && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-jakarta font-bold rounded-xl hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all text-sm shadow-lg"
            >
              <Plus size={20} strokeWidth={2.5} /> Create First Lead
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Date-wise Grouped Cards Grid */
        <div className="space-y-8">
          {sortedDates.map((dateKey) => {
            const dateLeads = groupedLeads[dateKey];
            return (
              <div key={dateKey} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-xl px-5 py-3 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-jakarta font-black text-slate-800 dark:text-white tracking-tight">
                      {formatDateHeader(dateKey)}
                    </h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-jakarta font-black rounded-full">
                      {dateLeads.length} {dateLeads.length === 1 ? 'lead' : 'leads'}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-white/5 dark:via-white/10 dark:to-transparent"></div>
                </div>

                {/* Cards Grid for this date */}
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {dateLeads.map((lead) => {
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
                  className="group bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-xl dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] hover:border-indigo-300/40 dark:hover:border-indigo-500/30 transition-all duration-300 flex flex-col cursor-pointer relative h-full"
                >
                  {/* Header: Status & Menu Action */}
                  <div className="flex justify-between items-center mb-3 relative z-10 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        {lead.outreach_status}
                      </span>
                      {isFollowUpToday && (
                        <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                          <span className="text-[9px] font-black uppercase text-red-500">Due</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={(e) => toggleMenu(lead._id, e)}
                      className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Company Info Header */}
                  <div className="flex items-start gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-300">
                      <Building2 size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-jakarta font-black text-slate-900 dark:text-white line-clamp-1 mb-0.5 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                        {lead.company_name}
                      </h3>
                      {lead.contact_person && lead.contact_person !== lead.company_name ? (
                        <p className="text-[11px] font-inter text-slate-500 dark:text-gray-400 font-semibold truncate flex items-center gap-1">
                          <User size={10} /> {lead.contact_person}
                        </p>
                      ) : (
                        <p className="text-[11px] font-inter text-slate-400 dark:text-gray-500 font-medium">Outreach Target</p>
                      )}
                    </div>
                  </div>

                  {/* Service and Source Tags (Side-by-side) */}
                  <div className="flex flex-wrap gap-1.5 mb-3.5 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-500/10">
                      {lead.targetService || 'No service'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-500/10 rounded-md">
                      Source: {lead.source}
                    </span>
                  </div>

                  {/* Metadata Row: Created and Next Follow Up */}
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 space-y-1.5 mb-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-auto relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 font-medium"><Calendar size={11} /> Created:</span>
                      <span className="text-slate-700 dark:text-slate-350 font-black">{formatDate(lead.createdAt)}</span>
                    </div>
                    {lead.nextFollowUpDate && (
                      <div className="flex justify-between items-center">
                        <span className={`flex items-center gap-1 font-medium ${isFollowUpToday ? 'text-red-500' : 'text-blue-500'}`}>
                          <Clock size={11} /> {isFollowUpToday ? 'Follow-up (Due!):' : 'Follow-up:'}
                        </span>
                        <span className={`font-black ${isFollowUpToday ? 'text-red-500' : 'text-blue-500'}`}>{formatDate(lead.nextFollowUpDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Capsules */}
                  <div className="flex gap-2 relative z-10 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {lead.email ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setComposerLead(lead);
                          setIsComposerOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors text-[9px] font-black uppercase"
                        title="Send Email"
                      >
                        <Mail size={12} strokeWidth={2.5} /> Email
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-600 transition-colors text-[9px] font-black uppercase cursor-not-allowed opacity-40">
                        <Mail size={12} strokeWidth={2.5} /> Email
                      </div>
                    )}
                    
                    {lead.phone ? (
                      <a 
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors text-[9px] font-black uppercase"
                        title="WhatsApp"
                      >
                        <MessageCircle size={12} strokeWidth={2.5} /> Chat
                      </a>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-600 transition-colors text-[9px] font-black uppercase cursor-not-allowed opacity-40">
                        <MessageCircle size={12} strokeWidth={2.5} /> Chat
                      </div>
                    )}

                    {lead.website_url ? (
                      <a 
                        href={lead.website_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors text-[9px] font-black uppercase"
                        title="Visit Website"
                      >
                        <Globe size={12} strokeWidth={2.5} /> Site
                      </a>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-gray-600 transition-colors text-[9px] font-black uppercase cursor-not-allowed opacity-40">
                        <Globe size={12} strokeWidth={2.5} /> Site
                      </div>
                    )}
                  </div>

                  {/* Accent bottom hover line & glow shine */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Date-wise Grouped Table/List View */
        <div className="space-y-8">
          {sortedDates.map((dateKey) => {
            const dateLeads = groupedLeads[dateKey];
            return (
              <div key={dateKey} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-xl px-5 py-3 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-jakarta font-black text-slate-800 dark:text-white tracking-tight">
                      {formatDateHeader(dateKey)}
                    </h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-jakarta font-black rounded-full">
                      {dateLeads.length} {dateLeads.length === 1 ? 'lead' : 'leads'}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-white/5 dark:via-white/10 dark:to-transparent"></div>
                </div>

                {/* Table for this date */}
                <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-slate-500 dark:text-slate-400 font-jakarta font-black uppercase tracking-widest text-[11px]">
                        <th className="px-6 py-4">Company & Target</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Next Follow-up</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                      {dateLeads.map((lead) => {
                const statusStyle = getStatusConfig(lead.outreach_status);
                let isFollowUpToday = false;
                if (lead.nextFollowUpDate) {
                  const followUpDate = new Date(lead.nextFollowUpDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  isFollowUpToday = followUpDate <= today;
                }

                return (
                  <tr 
                    key={lead._id}
                    onClick={() => handleCardClick(lead)}
                    className="hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer group"
                  >
                    {/* Company Name & Target Service */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
                          <Building2 size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-jakarta font-black text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[200px] sm:max-w-[300px] tracking-tight">
                            {lead.company_name}
                          </span>
                          <span className="text-[11px] font-jakarta font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider mt-0.5">
                            {lead.targetService || 'No service'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="px-6 py-4">
                      {lead.contact_person && lead.contact_person !== lead.company_name ? (
                        <div className="flex items-center gap-1.5 text-xs font-inter font-semibold text-slate-700 dark:text-gray-300 bg-slate-50/80 dark:bg-white/5 px-2.5 py-1 rounded-lg w-max border border-slate-200/50 dark:border-white/5">
                          <User size={12} className="text-slate-400" />
                          <span>{lead.contact_person}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-inter text-slate-400 dark:text-gray-500 font-medium italic">Not set</span>
                      )}
                    </td>

                    {/* Outreach Status */}
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        {lead.outreach_status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-xs font-inter font-semibold text-slate-600 dark:text-slate-400">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* Next Follow-up */}
                    <td className="px-6 py-4">
                      {lead.nextFollowUpDate ? (
                        <div className="flex items-center gap-1.5">
                          {isFollowUpToday && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          <span className={`text-xs font-inter font-semibold ${isFollowUpToday ? 'text-red-500' : 'text-blue-500'}`}>
                            {formatDate(lead.nextFollowUpDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-inter text-slate-400 dark:text-gray-500 font-medium">No follow-up</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {lead.email ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setComposerLead(lead);
                              setIsComposerOpen(true);
                            }}
                            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                            title="Send Email"
                          >
                            <Mail size={14} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-650 opacity-40 cursor-not-allowed">
                            <Mail size={14} strokeWidth={2.5} />
                          </div>
                        )}

                        {lead.phone ? (
                          <a 
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle size={14} strokeWidth={2.5} />
                          </a>
                        ) : (
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-650 opacity-40 cursor-not-allowed">
                            <MessageCircle size={14} strokeWidth={2.5} />
                          </div>
                        )}

                        {lead.website_url ? (
                          <a 
                            href={lead.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                            title="Visit Website"
                          >
                            <Globe size={14} strokeWidth={2.5} />
                          </a>
                        ) : (
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-650 opacity-40 cursor-not-allowed">
                            <Globe size={14} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Options Menu */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => toggleMenu(lead._id, e)}
                        className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
              </div>
            );
          })}
        </div>
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

      {/* Outreach Email Composer Modal */}
      <OutreachComposerModal
        isOpen={isComposerOpen}
        onClose={() => { setIsComposerOpen(false); setComposerLead(null); }}
        lead={composerLead}
        onEmailSent={(updatedLead) => {
          setLeads(leads.map(l => l._id === updatedLead._id ? updatedLead : l));
          if (selectedLead && selectedLead._id === updatedLead._id) {
            setSelectedLead(updatedLead);
          }
          router.refresh();
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
