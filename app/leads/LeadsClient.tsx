'use client';

import React, { useState } from 'react';
import { Mail, MessageCircle, Globe, Copy, ChevronDown, Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLead, updateLeadStatus, updateLead } from '@/app/actions/leadActions';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';

const PITCH_TEMPLATES = {
  webDev: `Hi [Name],\n\nI noticed your website could use a revamp. We specialize in high-end web development that drives conversions. Let's chat!\n\nBest,\n[Your Name]`,
  seo: `Hi [Name],\n\nWe found some critical technical SEO issues on your site that are costing you traffic. We'd love to help you fix them and boost your rankings.\n\nBest,\n[Your Name]`
};

const STATUS_OPTIONS = ['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'];

export default function LeadsClient({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', contact_person: '', email: '', phone: '', source: 'Manual', facebook_url: '',
    targetService: 'High-end Web Development', reportFileUrl: '', instagram_url: '', linkedin_url: '', website_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = (text: string, templateKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(templateKey);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'New': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Contacted': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      case 'Meeting Booked': return 'bg-green-500/10 text-green-400 border border-green-500/30';
      case 'Closed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Not Interested': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-300 border border-slate-500/30';
    }
  };

  const handleRowClick = (lead: any) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateLead = async (id: string, updateData: any) => {
    const res = await updateLead(id, updateData);
    if (res.success) {
      setLeads(leads.map(l => l._id === id ? res.data : l));
      if (selectedLead && selectedLead._id === id) {
        setSelectedLead(res.data);
      }
    } else {
      alert(res.error || 'Failed to update lead');
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!showFollowUps) return true;
    if (!lead.nextFollowUpDate) return false;
    
    // Check if nextFollowUpDate is today or earlier
    const followUpDate = new Date(lead.nextFollowUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    return followUpDate <= today;
  });

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createLead(formData);
    if (res.success) {
      setLeads([res.data, ...leads]);
      setIsFormOpen(false);
      setFormData({ company_name: '', contact_person: '', email: '', phone: '', source: 'Manual', facebook_url: '', targetService: 'High-end Web Development', reportFileUrl: '', instagram_url: '', linkedin_url: '', website_url: '' });
    } else {
      alert(res.error || 'Failed to create lead');
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    const originalLeads = [...leads];
    setLeads(leads.map(l => l._id === id ? { ...l, outreach_status: newStatus } : l));
    
    const res = await updateLeadStatus(id, newStatus);
    if (!res.success) {
      alert('Failed to update status');
      setLeads(originalLeads); // Revert
    }
  };

  return (
    <div className="min-h-screen p-8 text-slate-800 dark:text-slate-200">
      {/* Header & Controls */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-600 dark:from-white dark:to-gray-400">
            Leads & Outreach
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage high-density pipeline and cold outreach</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Pitch Templates Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-all backdrop-blur-md text-sm text-slate-800 dark:text-slate-200"
            >
              Pitch Templates <ChevronDown size={16} />
            </button>

            {isTemplatesOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white/80 dark:bg-purple-950/20 border border-slate-200 dark:border-purple-500/10 rounded-xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-purple-500/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">High-End Web Dev</span>
                    <button onClick={() => handleCopy(PITCH_TEMPLATES.webDev, 'web')} className="text-slate-400 hover:text-slate-700 dark:text-purple-300/50 dark:hover:text-white transition">
                      {copiedTemplate === 'web' ? <Check size={14} className="text-green-500 dark:text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-purple-200/70 line-clamp-3 whitespace-pre-line">{PITCH_TEMPLATES.webDev}</p>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Technical SEO</span>
                    <button onClick={() => handleCopy(PITCH_TEMPLATES.seo, 'seo')} className="text-slate-400 hover:text-slate-700 dark:text-purple-300/50 dark:hover:text-white transition">
                      {copiedTemplate === 'seo' ? <Check size={14} className="text-green-500 dark:text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-purple-200/70 line-clamp-3 whitespace-pre-line">{PITCH_TEMPLATES.seo}</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowFollowUps(!showFollowUps)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all text-sm font-medium ${showFollowUps ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-400' : 'bg-white/70 border-slate-200 text-slate-800 hover:bg-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-white'}`}
          >
            Follow-ups Today
          </button>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors text-sm"
          >
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-gray-400 uppercase bg-slate-100/80 dark:bg-black/40 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-600 dark:text-gray-300">Company</th>
                <th className="px-6 py-4 font-medium text-slate-600 dark:text-gray-300">Contact</th>
                <th className="px-6 py-4 font-medium text-slate-600 dark:text-gray-300">Source</th>
                <th className="px-6 py-4 font-medium text-slate-600 dark:text-gray-300">Date Added</th>
                <th className="px-6 py-4 font-medium text-slate-600 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 font-medium text-right text-slate-600 dark:text-gray-300">Outreach Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No leads found. Add your first lead to get started.
                  </td>
                </tr>
              ) : filteredLeads.map((lead) => {
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
                  onClick={() => handleRowClick(lead)}
                  className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-all duration-200 border-b border-slate-100 dark:border-white/5 group"
                >
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {isFollowUpToday && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] dark:shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" title="Follow-up due today!" />
                    )}
                    {lead.company_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-gray-300">
                    {lead.contact_person || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400">
                    {lead.source}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400 text-xs">
                    {lead.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(lead.createdAt)) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={lead.outreach_status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(lead._id, e.target.value); }}
                      className={`px-3 py-1 rounded-full text-xs tracking-wide border bg-transparent cursor-pointer outline-none appearance-none ${getStatusColor(lead.outreach_status)}`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      {lead.email ? (
                        <a 
                          href={`mailto:${lead.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/20 text-slate-400 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-transparent hover:border-blue-200 dark:hover:border-blue-500/30 transition-all"
                          title="Send Email"
                        >
                          <Mail size={16} />
                        </a>
                      ) : (
                        <button disabled className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 opacity-40 dark:opacity-30 cursor-not-allowed text-slate-400"><Mail size={16} /></button>
                      )}
                      
                      {lead.phone ? (
                        <a 
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-green-50 dark:hover:bg-green-500/20 text-slate-400 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] border border-transparent hover:border-green-200 dark:hover:border-green-500/30 transition-all"
                          title="WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>
                      ) : (
                        <button disabled className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 opacity-40 dark:opacity-30 cursor-not-allowed text-slate-400"><MessageCircle size={16} /></button>
                      )}

                      {lead.website_url ? (
                        <a 
                          href={lead.website_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all"
                          title="Website"
                        >
                          <Globe size={16} />
                        </a>
                      ) : (
                        <button disabled className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 opacity-40 dark:opacity-30 cursor-not-allowed text-slate-400"><Globe size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => { setIsDetailsModalOpen(false); setSelectedLead(null); }} 
        lead={selectedLead} 
        onUpdateLead={handleUpdateLead} 
      />

      {/* Centered Modal Form (New Lead) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/40 backdrop-blur-sm" 
              onClick={() => setIsFormOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white/80 dark:bg-purple-950/20 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/10 p-8 shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-400">Add New Lead</h2>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreateLead} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Company Name *</label>
                    <input 
                      required type="text" 
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Target Service</label>
                    <select 
                      value={formData.targetService}
                      onChange={e => setFormData({...formData, targetService: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design'].map(srv => (
                        <option key={srv} value={srv} className="bg-white dark:bg-slate-900">{srv}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Contact Person</label>
                    <input 
                      type="text" 
                      value={formData.contact_person}
                      onChange={e => setFormData({...formData, contact_person: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Source</label>
                    <input 
                      type="text" 
                      value={formData.source}
                      onChange={e => setFormData({...formData, source: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="e.g. LinkedIn"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Phone (WhatsApp)</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Website URL</label>
                    <input 
                      type="url" 
                      value={formData.website_url}
                      onChange={e => setFormData({...formData, website_url: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Report File URL</label>
                    <input 
                      type="url" 
                      value={formData.reportFileUrl}
                      onChange={e => setFormData({...formData, reportFileUrl: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Facebook URL</label>
                    <input 
                      type="url" 
                      value={formData.facebook_url}
                      onChange={e => setFormData({...formData, facebook_url: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="FB link"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">LinkedIn URL</label>
                    <input 
                      type="url" 
                      value={formData.linkedin_url}
                      onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="LI link"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Instagram URL</label>
                    <input 
                      type="url" 
                      value={formData.instagram_url}
                      onChange={e => setFormData({...formData, instagram_url: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="IG link"
                    />
                  </div>
                </div>

                <div className="pt-8 pb-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Saving Lead...' : 'Save Lead'}
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
