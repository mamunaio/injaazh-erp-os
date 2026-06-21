'use client';

import React, { useState } from 'react';
import { Mail, MessageCircle, Globe, Plus, X, Trash2, Edit, MoreHorizontal, Building2, User, Calendar, Tag, Loader2, AlertTriangle, FileText, Clock, LayoutGrid, List, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, deleteLead } from '@/app/actions/leadActions';
import { useRouter } from 'next/navigation';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';
import OutreachComposerModal from '@/components/leads/OutreachComposerModal';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', contact_person: '', email: '', phone: '', source: 'Manual',
    targetService: 'High-end Web Development', website_url: '', facebook_url: '',
    instagram_url: '', linkedin_url: '', reportFileUrl: '',
    timezone: 'EST', outreach_scheduled_for: '', lead_context: '', email_draft: '', email_subject_draft: '', facebook_draft: ''
  });
  const [formStep, setFormStep] = useState(1);

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

  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      const { generateAIEmailDraft } = await import('@/app/actions/aiActions');
      const result = await generateAIEmailDraft(formData);
      if (result.success && result.data) {
        setFormData(prev => ({ 
          ...prev, 
          email_draft: result.data.body || '',
          email_subject_draft: result.data.subject || '' 
        }));
      } else {
        toast.error(result.error || 'Failed to generate AI draft');
      }
    } catch(err) {
      console.error("Draft generation failed", err);
      toast.error('Failed to generate draft');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent premature saving if user hits Enter on steps 1, 2, or 3
    if (formStep < 4) {
      if (formStep === 1 && !formData.company_name) {
        alert("Company Name is required!");
        return;
      }
      setFormStep(prev => prev + 1);
      return;
    }

    setIsCreating(true);
    try {
      const res = await createLead(formData);
      if (res.success) {
        setLeads([res.data, ...leads]);
        setIsFormOpen(false);
        setFormData({ 
          company_name: '', contact_person: '', email: '', phone: '', source: 'Manual',
          targetService: 'High-end Web Development', website_url: '', facebook_url: '',
          instagram_url: '', linkedin_url: '', reportFileUrl: '',
          timezone: 'EST', outreach_scheduled_for: '', lead_context: '', email_draft: '', email_subject_draft: '', facebook_draft: ''
        });
        setFormStep(1);
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
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-800 dark:text-slate-200">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4 md:gap-6">
        <div>
          <h1 className="mb-2 md:mb-3">
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
            className="flex items-center gap-2 md:gap-2.5 px-5 md:px-7 py-2.5 md:py-3 neu-button text-slate-800 dark:text-slate-200 font-jakarta font-bold rounded-xl text-sm md:text-sm flex-1 md:flex-initial justify-center"
          >
            <Plus size={20} strokeWidth={2.5} className="text-indigo-500" />
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
            className="w-full px-5 py-3.5 pl-12 neu-pressed rounded-xl focus:outline-none text-slate-800 dark:text-white placeholder-slate-500 font-inter transition-all"
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
        <div className="flex flex-col items-center justify-center py-24 neu-flat">
          <div className="w-20 h-20 rounded-2xl neu-pressed flex items-center justify-center mb-6">
            <Building2 size={40} strokeWidth={2.5} className="text-indigo-500" />
          </div>
          <h3 className="mb-3">
            {searchQuery ? 'No leads found' : showFollowUps ? 'No follow-ups today' : 'No leads found'}
          </h3>
          <p className="text-sm font-inter text-slate-600 dark:text-slate-400 mb-8 font-medium tracking-wide">
            {searchQuery ? 'Try adjusting your search query' : showFollowUps ? 'All caught up! Great work! 🎉' : 'Create your first lead to get started'}
          </p>
          {!showFollowUps && !searchQuery && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2.5 px-7 py-3 neu-button text-slate-800 dark:text-slate-200 font-jakarta font-bold rounded-xl text-sm"
            >
              <Plus size={20} strokeWidth={2.5} className="text-indigo-500" /> Create First Lead
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
                  <div className="flex items-center gap-3 neu-flat px-5 py-3">
                    <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h2 className="">
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
                  className="group neu-flat p-5 transition-all duration-300 flex flex-col cursor-pointer relative h-full hover:-translate-y-1"
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
                    <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Building2 size={18} strokeWidth={2.5} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="line-clamp-1 mb-0.5 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
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
                  <div className="flex items-center gap-3 neu-flat rounded-xl px-5 py-3 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h2 className="">
                      {formatDateHeader(dateKey)}
                    </h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-jakarta font-black rounded-full">
                      {dateLeads.length} {dateLeads.length === 1 ? 'lead' : 'leads'}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-white/5 dark:via-white/10 dark:to-transparent"></div>
                </div>

                {/* Table for this date */}
                <div className="w-full overflow-x-auto neu-flat rounded-2xl border-none">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 neu-pressed text-slate-500 dark:text-slate-400 font-jakarta font-black uppercase tracking-widest text-[11px]">
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
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer group"
                  >
                    {/* Company Name & Target Service */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl neu-pressed flex items-center justify-center text-indigo-500">
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
                        <div className="flex items-center gap-1.5 text-xs font-inter font-semibold text-slate-700 dark:text-gray-300 neu-pressed px-2.5 py-1 rounded-lg w-max border-none">
                          <User size={12} className="text-indigo-400" />
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
            className="z-[110] w-52 neu-flat p-3 flex flex-col gap-2"
          >
            <button
              onClick={(e) => {
                const lead = leads.find(l => l._id === openMenuId);
                if (lead) handleEditClick(lead, e);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 neu-button text-sm font-bold text-slate-700 dark:text-gray-300 rounded-xl"
            >
              <Edit size={16} strokeWidth={2.5} className="text-indigo-500" />
              Edit Lead
            </button>
            <button
              onClick={(e) => {
                const lead = leads.find(l => l._id === openMenuId);
                if (lead) handleDeleteClick(lead, e);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 neu-button text-sm font-bold text-red-600 dark:text-red-400 rounded-xl"
            >
              <Trash2 size={16} strokeWidth={2.5} className="text-red-500" />
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
              className="relative w-full max-w-md neu-flat rounded-3xl p-8"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl neu-pressed flex items-center justify-center mb-6 relative border border-red-500/20">
                  <Trash2 size={36} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" strokeWidth={2.5} />
                  <div className="absolute inset-0 rounded-2xl bg-red-500/10 animate-ping opacity-20" />
                </div>
                
                <h3 className="mb-3">
                  Delete Lead?
                </h3>
                
                <p className="text-slate-700 dark:text-gray-300 mb-2 font-medium">
                  Are you sure you want to delete
                </p>
                <p className="font-black text-lg text-slate-900 dark:text-white mb-6 px-5 py-3 neu-pressed rounded-xl border border-red-500/10">
                  "{leadToDelete.company_name}"?
                </p>
                
                <div className="flex items-center gap-2 px-4 py-3 neu-pressed rounded-xl mb-8 border border-red-500/10">
                  <AlertTriangle size={18} className="text-red-500" strokeWidth={2.5} />
                  <p className="text-sm font-bold text-red-500">
                    This action cannot be undone
                  </p>
                </div>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setLeadToDelete(null);
                    }}
                    disabled={deletingId !== null}
                    className="flex-1 px-5 py-3 neu-button text-slate-700 dark:text-gray-300 font-bold rounded-xl disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deletingId !== null}
                    className="flex-1 px-5 py-3 neu-button text-red-500 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
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
              className="relative w-full max-w-2xl neu-flat rounded-[28px] p-8 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/50">
                <div>
                  <h2 className="">
                    Add New Lead
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 font-medium">Fill in the details to create a new lead</p>
                </div>
                <button 
                  onClick={() => { setIsFormOpen(false); setFormStep(1); }} 
                  className="neu-button p-2.5 rounded-xl hover:rotate-90 transition-all duration-300 text-slate-500 dark:text-gray-400"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 neu-pressed rounded-full z-0">
                  <div 
                    className="h-full neu-button rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((formStep - 1) / 3) * 100}%` }}
                  />
                </div>
                
                {[
                  { step: 1, label: 'Basic Info', icon: Building2 },
                  { step: 2, label: 'Contact', icon: Mail },
                  { step: 3, label: 'Automation', icon: Sparkles },
                  { step: 4, label: 'Draft', icon: FileText }
                ].map((item) => {
                  const isActive = formStep >= item.step;
                  const isCurrent = formStep === item.step;
                  return (
                    <div key={item.step} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isActive ? 'neu-button text-indigo-500' : 'neu-flat text-slate-500'}`}>
                        {isActive ? <CheckCircle size={18} /> : <span>{item.step}</span>}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 w-max ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <form className="space-y-6 overflow-y-auto pr-2 flex-1 pb-8">
                
                {/* STEP 1: Basic Information */}
                {formStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
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
                            className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all font-medium"
                            placeholder="e.g. Acme Corp"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Contact Person</label>
                          <input 
                            type="text" 
                            value={formData.contact_person}
                            onChange={e => setFormData({...formData, contact_person: e.target.value})}
                            className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all font-medium"
                            placeholder="John Doe"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Source</label>
                          <input 
                            type="text" 
                            value={formData.source}
                            onChange={e => setFormData({...formData, source: e.target.value})}
                            className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="e.g. LinkedIn"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                        <Tag size={16} strokeWidth={2.5} />
                        Target Service
                      </h3>
                      <select 
                        value={formData.targetService}
                        onChange={e => setFormData({...formData, targetService: e.target.value})}
                        className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent cursor-pointer font-medium"
                      >
                        {['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design'].map(srv => (
                          <option key={srv} value={srv}>{srv}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Contact & Social */}
                {formStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                        <Mail size={16} strokeWidth={2.5} />
                        Contact Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Email</label>
                          <input 
                            type="email" 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all font-medium"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Phone</label>
                          <input 
                            type="tel" 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            placeholder="+1234567890"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Website URL</label>
                          <input 
                            type="url" 
                            value={formData.website_url}
                            onChange={e => setFormData({...formData, website_url: e.target.value})}
                            className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                        <Globe size={16} strokeWidth={2.5} />
                        Social Links
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="url" value={formData.facebook_url} onChange={e => setFormData({...formData, facebook_url: e.target.value})} className="w-full px-4 py-2.5 neu-pressed rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-sm" placeholder="Facebook URL" />
                        <input type="url" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} className="w-full px-4 py-2.5 neu-pressed rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-sm" placeholder="Instagram URL" />
                        <input type="url" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} className="w-full px-4 py-2.5 neu-pressed rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-sm" placeholder="LinkedIn URL" />
                        <input type="url" value={formData.reportFileUrl} onChange={e => setFormData({...formData, reportFileUrl: e.target.value})} className="w-full px-4 py-2.5 neu-pressed rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-sm" placeholder="Report / Proposal Link" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: AI & Automation */}
                {formStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                        <MessageCircle size={16} strokeWidth={2.5} />
                        AI Outreach Context
                      </h3>
                      <div className="neu-pressed p-5 rounded-2xl">
                        <label className="block text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-3">
                          Detailed Notes for Gemini AI
                        </label>
                        <textarea 
                          value={formData.lead_context}
                          onChange={e => setFormData({...formData, lead_context: e.target.value})}
                          className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none h-32"
                          placeholder="What makes this lead unique? Write down their pain points so AI can generate a highly personalized email."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
                        <Clock size={16} strokeWidth={2.5} />
                        Outreach Schedule
                      </h3>
                      <div className="grid grid-cols-2 gap-4 neu-flat p-5 rounded-2xl">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Recipient Timezone</label>
                          <select 
                            value={formData.timezone}
                            onChange={e => setFormData({...formData, timezone: e.target.value})}
                            className="w-full px-4 py-2.5 neu-pressed rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-sm"
                          >
                            <option value="EST">EST (New York)</option>
                            <option value="CST">CST (Chicago)</option>
                            <option value="MST">MST (Denver)</option>
                            <option value="PST">PST (Los Angeles)</option>
                            <option value="GMT">GMT (London)</option>
                            <option value="CET">CET (Paris)</option>
                            <option value="AEST">AEST (Sydney)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Schedule Date</label>
                          <DatePicker 
                            selected={formData.outreach_scheduled_for ? new Date(formData.outreach_scheduled_for) : null}
                            onChange={(date: Date | null) => setFormData({...formData, outreach_scheduled_for: date ? date.toISOString().split('T')[0] : ''})}
                            minDate={new Date()}
                            className="w-full px-4 py-2.5 neu-pressed rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent text-sm text-slate-800 dark:text-slate-200"
                            placeholderText="Select Schedule Date"
                            dateFormat="MMM d, yyyy"
                            showPopperArrow={false}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Review & Draft */}
                {formStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                        <h3 className="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
                          <FileText size={16} strokeWidth={2.5} />
                          Review Email Draft
                        </h3>
                        <button
                          type="button"
                          onClick={handleGenerateDraft}
                          disabled={isGeneratingDraft}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg transition-colors border border-purple-500/20 disabled:opacity-50"
                        >
                          {isGeneratingDraft ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          {isGeneratingDraft ? 'Generating...' : '✨ Auto-Generate Draft'}
                        </button>
                      </div>
                      <div className="neu-pressed p-5 rounded-2xl space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                            Email Subject
                          </label>
                          <input 
                            type="text"
                            value={formData.email_subject_draft}
                            onChange={e => setFormData({...formData, email_subject_draft: e.target.value})}
                            className="w-full px-4 py-2.5 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent font-semibold"
                            placeholder="e.g. Quick question regarding Acme Corp"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                            Email Body
                          </label>
                          <textarea 
                            value={formData.email_draft}
                            onChange={e => setFormData({...formData, email_draft: e.target.value})}
                            className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none h-48"
                            placeholder="Write your email here, or click 'Auto-Generate Draft' to have AI write it for you..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                            Facebook Message Draft
                          </label>
                          <textarea 
                            value={formData.facebook_draft}
                            onChange={e => setFormData({...formData, facebook_draft: e.target.value})}
                            className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none h-32"
                            placeholder="Write your Facebook outreach message here..."
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          This exact draft will be sent automatically on {formData.outreach_scheduled_for ? new Date(formData.outreach_scheduled_for).toLocaleDateString() : 'the scheduled date'}.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Navigation Buttons */}
                <div className="pt-6 border-t border-slate-800/50 sticky bottom-0 bg-transparent pb-2 mt-auto flex gap-4">
                  {formStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setFormStep(prev => prev - 1)}
                      className="px-6 py-4 neu-button text-slate-500 font-bold rounded-xl transition-all w-1/3"
                    >
                      Back
                    </button>
                  )}
                  
                  {formStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        // Quick validation before moving next
                        if (formStep === 1 && !formData.company_name) {
                          alert("Company Name is required!");
                          return;
                        }
                        setFormStep(prev => prev + 1);
                      }}
                      className={`${formStep === 1 ? 'w-full' : 'w-2/3'} px-6 py-4 neu-button text-indigo-500 font-black rounded-xl transition-all flex items-center justify-center gap-2`}
                    >
                      Next Step <ArrowRight size={18} strokeWidth={3} />
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleCreateLead}
                      disabled={isCreating}
                      className="w-2/3 px-6 py-4 neu-button text-purple-500 font-black text-base rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wide"
                    >
                      {isCreating ? (
                        <><Loader2 size={22} className="animate-spin" strokeWidth={2.5} /> Creating...</>
                      ) : (
                        <><Sparkles size={22} strokeWidth={2.5} /> Create Lead</>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
