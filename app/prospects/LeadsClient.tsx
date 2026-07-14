'use client';

import React, { useState } from 'react';
import { Mail, MessageCircle, Globe, Plus, X, Trash2, Edit, MoreHorizontal, Building2, User, Calendar, Tag, Loader2, AlertTriangle, FileText, Clock, LayoutGrid, List, CheckCircle, Sparkles, ArrowRight, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, deleteLead, updateLead } from '@/app/actions/leadActions';
import { addLeadsToCampaign } from '@/app/actions/campaignActions';
import { useRouter } from 'next/navigation';
import OutreachComposerModal from '@/components/leads/OutreachComposerModal';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CSVImportModal from '@/components/leads/CSVImportModal';

// New UI Components
import LeadsHeader from '@/components/leads/ui/LeadsHeader';
import LeadsKPIs from '@/components/leads/ui/LeadsKPIs';
import AIInsightBar from '@/components/leads/ui/AIInsightBar';
import LeadsFilters from '@/components/leads/ui/LeadsFilters';
import QuickFilterChips from '@/components/leads/ui/QuickFilterChips';
import LeadsTable from '@/components/leads/ui/LeadsTable';
import LeadSlidePanel from '@/components/leads/ui/LeadSlidePanel';

const STATUS_OPTIONS = ['New', 'Email Sent', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'];

export default function LeadsClient({ initialLeads, initialCampaigns = [] }: { initialLeads: any[], initialCampaigns?: any[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const { confirm } = useConfirm();

  React.useEffect(() => {
    setLeads(initialLeads);
    setCampaigns(initialCampaigns);
  }, [initialLeads, initialCampaigns]);

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
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [isAddingToCampaign, setIsAddingToCampaign] = useState(false);
  
  // Bulk Delete State
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  
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
        toast.error('Failed to delete lead. Please try again.');
        setDeletingId(null);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('An error occurred. Please try again.');
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    
    const isConfirmed = await confirm({ message: `Are you sure you want to delete ${selectedLeads.length} leads? This action cannot be undone.`, danger: true });
    if (!isConfirmed) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const { bulkDeleteLeads } = await import('@/app/actions/leadActions');
      const result = await bulkDeleteLeads(selectedLeads);
      
      if (result.success) {
        toast.success(result.message || 'Success');
        setSelectedLeads([]);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete leads');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const handleAddToCampaign = async () => {
    if (!selectedCampaignId) return alert("Please select a campaign");
    if (selectedLeads.length === 0) return;
    
    setIsAddingToCampaign(true);
    const res = await addLeadsToCampaign(selectedCampaignId, selectedLeads);
    setIsAddingToCampaign(false);
    
    if (res.success) {
      toast.success(`Successfully added ${selectedLeads.length} leads to the campaign`);
      setIsCampaignModalOpen(false);
      setSelectedLeads([]);
      setSelectedCampaignId('');
    } else {
      toast.error("Failed to add leads to campaign: " + res.error);
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

  const [activeFilter, setActiveFilter] = useState('All');

  const filteredLeads = leads.filter(lead => {
    // Top follow ups filter
    if (showFollowUps) {
      if (!lead.nextFollowUpDate) return false;
      const followUpDate = new Date(lead.nextFollowUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (followUpDate > today) return false;
    }
    // Quick chips filter
    if (activeFilter !== 'All' && activeFilter !== 'All Leads') {
      if (lead.outreach_status !== activeFilter) return false;
    }
    return true;
  });

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

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 20;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showFollowUps, activeFilter]);

  const totalPages = Math.ceil(searchedLeads.length / leadsPerPage);
  const paginatedLeads = searchedLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  // Group leads by date (using paginated leads)
  const groupedLeads = paginatedLeads.reduce((groups: Record<string, any[]>, lead) => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-slate-200 p-4 md:p-8 font-inter selection:bg-blue-500/30">
      <div className="max-w-[1600px] mx-auto">
        
        <LeadsHeader 
          showFollowUps={showFollowUps} 
          setShowFollowUps={setShowFollowUps} 
          setIsCSVModalOpen={setIsCSVModalOpen} 
          setIsFormOpen={setIsFormOpen} 
        />
        
        <LeadsKPIs leads={leads} />

        <AIInsightBar />

        <LeadsFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalLeads={searchedLeads.length}
        />

        <QuickFilterChips 
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          leads={leads}
        />

        {/* Bulk Actions Floating Pill */}
        <AnimatePresence>
          {selectedLeads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className="fixed bottom-8 left-1/2 z-40 flex items-center gap-6 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl border border-slate-200 dark:border-[#232734] rounded-full px-6 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center gap-3 border-r border-slate-200 dark:border-[#232734] pr-6">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-slate-900 dark:text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                  {selectedLeads.length}
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Selected</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold bg-white text-black hover:bg-slate-200 rounded-full transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Target size={14} /> Add to Campaign
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-full transition-colors flex items-center gap-2"
                >
                  {isBulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                  Delete
                </button>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="px-4 py-2 text-xs font-bold bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'list' ? (
          <LeadsTable 
            paginatedLeads={paginatedLeads}
            selectedLeads={selectedLeads}
            setSelectedLeads={setSelectedLeads}
            handleCardClick={handleCardClick}
            toggleMenu={toggleMenu}
            getStatusConfig={getStatusConfig}
            formatDate={formatDate}
            openMenuId={openMenuId}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {paginatedLeads.map(lead => (
               <div key={lead._id} onClick={() => handleCardClick(lead)} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl p-5 hover:border-slate-600 cursor-pointer transition-colors shadow-sm">
                 <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{lead.company_name}</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{lead.contact_person}</p>
                 <div className="mt-4 flex justify-between items-center">
                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusConfig(lead.status || 'New').color} ${getStatusConfig(lead.status || 'New').bg}`}>{lead.status || 'New'}</span>
                   <span className="text-xs text-slate-500">{formatDate(lead.nextFollowUpDate)}</span>
                 </div>
               </div>
             ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * leadsPerPage + 1} - {Math.min(currentPage * leadsPerPage, searchedLeads.length)} of {searchedLeads.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      <LeadSlidePanel 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        lead={selectedLead}
        getStatusConfig={getStatusConfig}
        formatDate={formatDate}
        onOpenEmailComposer={(lead) => {
          setIsDetailsModalOpen(false);
          setComposerLead(lead);
          setIsComposerOpen(true);
        }}
        onStatusChange={async (leadId, newStatus) => {
          try {
            const result = await updateLead(leadId, { outreach_status: newStatus });
            if (result.success && result.data) {
              const updatedLead = result.data;
              setLeads(leads.map(l => l._id === updatedLead._id ? updatedLead : l));
              if (selectedLead?._id === updatedLead._id) setSelectedLead(updatedLead);
              toast.success(`Status updated to ${newStatus}`);
            } else {
              toast.error(result.error || 'Failed to update status');
            }
          } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status');
          }
        }}
      />
      
      <OutreachComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        lead={composerLead}
        onEmailSent={(updatedLead) => {
          if(updatedLead) {
            setLeads(leads.map(l => l._id === updatedLead._id ? updatedLead : l));
            if (selectedLead?._id === updatedLead._id) {
              setSelectedLead(updatedLead);
            }
          }
        }}
      />

      {/* Dropdown Menu for Action Dots */}
      <AnimatePresence>
        {openMenuId && menuPosition && (
          <>
            {/* Invisible backdrop to close the menu when clicking outside */}
            <div 
              className="fixed inset-0 z-[100]"
              onClick={() => { setOpenMenuId(null); setMenuPosition(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[101] w-48 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl shadow-xl py-2 flex flex-col"
              style={{ top: menuPosition.top, right: menuPosition.right }}
            >
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B]/60 transition-colors w-full text-left"
                onClick={(e) => {
                  setOpenMenuId(null);
                  const lead = leads.find(l => l._id === openMenuId);
                  if (lead) handleEditClick(lead, e);
                }}
              >
                <Edit size={14} /> Edit Lead
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B]/60 transition-colors w-full text-left"
                onClick={(e) => {
                  setOpenMenuId(null);
                  setSelectedLeads([openMenuId]);
                  setIsCampaignModalOpen(true);
                }}
              >
                <Target size={14} /> Move to Campaign
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B]/60 transition-colors w-full text-left"
                onClick={(e) => {
                  setOpenMenuId(null);
                  toast.success('Task added successfully');
                }}
              >
                <List size={14} /> Add Task
              </button>
              <div className="h-px bg-slate-200 dark:bg-[#232734] my-1 w-full" />
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full text-left font-medium"
                onClick={(e) => {
                  setOpenMenuId(null);
                  const lead = leads.find(l => l._id === openMenuId);
                  if (lead) handleDeleteClick(lead, e);
                }}
              >
                <Trash2 size={14} /> Delete Lead
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isCSVModalOpen && (
        <CSVImportModal 
          isOpen={isCSVModalOpen} 
          onClose={() => setIsCSVModalOpen(false)} 
          onSuccess={() => {
            router.refresh();
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}

      <AnimatePresence>
        {showDeleteModal && leadToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 dark:bg-black/60 backdrop-blur-md">
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
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800/50">
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

              <form className="space-y-6 overflow-y-auto pr-2 flex-1 pb-8 mt-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/50">
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
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Source</label>
                        <input 
                          type="text" 
                          value={formData.source}
                          onChange={e => setFormData({...formData, source: e.target.value})}
                          className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="e.g. LinkedIn"
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
                    <h3 className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/50">
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
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800/50 sticky bottom-0 bg-transparent pb-2 mt-auto flex gap-4">
                  <button 
                    type="button" 
                    onClick={handleCreateLead}
                    disabled={isCreating}
                    className="w-full px-6 py-4 neu-button text-purple-500 font-black text-base rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wide"
                  >
                    {isCreating ? (
                      <><Loader2 size={22} className="animate-spin" strokeWidth={2.5} /> Creating...</>
                    ) : (
                      <><Sparkles size={22} strokeWidth={2.5} /> Create Lead</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Campaign Select Modal */}
      <AnimatePresence>
        {isCampaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 dark:bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0f111a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add to Campaign</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add {selectedLeads.length} selected leads to a campaign</p>
                </div>
                <button onClick={() => setIsCampaignModalOpen(false)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't created any campaigns yet.</p>
                  <button onClick={() => router.push('/campaigns')} className="px-4 py-2 bg-indigo-600 text-slate-900 dark:text-white rounded-lg font-bold">
                    Go to Campaigns
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Select Campaign</label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose a Campaign --</option>
                      {campaigns.map(c => (
                        <option key={c._id} value={c._id}>{c.name} {c.niche ? `(${c.niche})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleAddToCampaign}
                    disabled={isAddingToCampaign || !selectedCampaignId}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isAddingToCampaign ? <Loader2 size={18} className="animate-spin" /> : <Target size={18} />}
                    Confirm & Add Leads
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <CSVImportModal 
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
