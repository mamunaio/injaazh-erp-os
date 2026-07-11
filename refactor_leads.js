const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/leads/LeadsClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace imports
const newImports = `import React, { useState } from 'react';
import { Mail, MessageCircle, Globe, Plus, X, Trash2, Edit, MoreHorizontal, Building2, User, Calendar, Tag, Loader2, AlertTriangle, FileText, Clock, LayoutGrid, List, CheckCircle, Sparkles, ArrowRight, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, deleteLead } from '@/app/actions/leadActions';
import { addLeadsToCampaign } from '@/app/actions/campaignActions';
import { useRouter } from 'next/navigation';
import OutreachComposerModal from '@/components/leads/OutreachComposerModal';
import { toast } from 'react-hot-toast';
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

const STATUS_OPTIONS = ['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'];`;

content = content.replace(/import React, { useState } from 'react';[\s\S]*?const STATUS_OPTIONS = \['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'\];/, newImports);

// Replace filteredLeads logic
const newFilteredLeads = `  const [activeFilter, setActiveFilter] = useState('All');

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
    if (activeFilter !== 'All') {
      if (lead.status !== activeFilter) return false;
    }
    return true;
  });`;

content = content.replace(/  const filteredLeads = showFollowUps[\s\S]*?: leads;/, newFilteredLeads);

// Replace the return block
const newReturn = `  return (
    <div className="min-h-screen bg-[#09090B] text-slate-200 p-4 md:p-8 font-inter selection:bg-blue-500/30">
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

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedLeads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center justify-between bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {selectedLeads.length}
                </span>
                <span className="text-sm font-semibold text-blue-200">leads selected</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors border border-blue-500 flex items-center gap-1"
                >
                  <Target size={14} /> Add to Campaign
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1"
                >
                  {isBulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                  Delete
                </button>
                <button
                  onClick={() => setSelectedLeads([])}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
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
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {paginatedLeads.map(lead => (
               <div key={lead._id} onClick={() => handleCardClick(lead)} className="bg-[#11131A] border border-[#232734] rounded-2xl p-5 hover:border-slate-600 cursor-pointer transition-colors shadow-sm">
                 <h3 className="text-sm font-bold text-white truncate">{lead.company_name}</h3>
                 <p className="text-xs text-slate-400 truncate mt-1">{lead.contact_person}</p>
                 <div className="mt-4 flex justify-between items-center">
                   <span className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${getStatusConfig(lead.status || 'New').color} \${getStatusConfig(lead.status || 'New').bg}\`}>{lead.status || 'New'}</span>
                   <span className="text-xs text-slate-500">{formatDate(lead.nextFollowUpDate)}</span>
                 </div>
               </div>
             ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 bg-[#11131A] border border-[#232734] p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-slate-400">
              Showing {(currentPage - 1) * leadsPerPage + 1} - {Math.min(currentPage * leadsPerPage, searchedLeads.length)} of {searchedLeads.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-lg bg-[#09090B] border border-[#232734] text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-lg bg-[#09090B] border border-[#232734] text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      />
      
      <OutreachComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        lead={composerLead}
      />

      {isCSVModalOpen && (
        <CSVImportModal 
          isOpen={isCSVModalOpen} 
          onClose={() => setIsCSVModalOpen(false)} 
          onImportSuccess={(newLeads) => {
            setLeads([...newLeads, ...leads]);
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}
`;

const startIndex = content.indexOf('  return (\r\n    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-200">');
const endIndex = content.indexOf('      {/* Delete Confirmation Modal */}');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newReturn + content.substring(endIndex + 39);
} else {
  console.log("Could not find start or end index for return block.");
  // fallbacks
  const startIdx2 = content.indexOf('  return (\n    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-200">');
  const endIdx2 = content.indexOf('      {/* Delete Confirmation Modal */}');
  if (startIdx2 !== -1 && endIdx2 !== -1) {
    content = content.substring(0, startIdx2) + newReturn + content.substring(endIdx2 + 39);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored LeadsClient.tsx');
