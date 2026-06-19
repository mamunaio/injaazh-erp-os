'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, MessageCircle, Mail, Globe, Phone, FileText, Sparkles, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function LeadDetailsModal({ 
  isOpen, 
  onClose, 
  lead, 
  onUpdateLead 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  lead: any; 
  onUpdateLead: (id: string, updateData: any) => Promise<void> 
}) {
  const [formData, setFormData] = useState<any>({});
  const [newLog, setNewLog] = useState({ type: 'Note', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

  // Calculate Lead Quality Score
  const getLeadScore = () => {
    let score = 20; // Base score
    if (formData.contact_person) score += 15;
    if (formData.email) score += 20;
    if (formData.phone) score += 15;
    if (formData.website_url) score += 10;
    if (formData.linkedin_url) score += 10;
    if (formData.outreach_status === 'Replied') score += 10;
    return score;
  };
  const leadScore = getLeadScore();

  const handleAutoEnrich = async () => {
    setIsEnriching(true);
    try {
      const { enrichLeadData } = await import('@/app/actions/aiActions');
      const result = await enrichLeadData(formData.company_name || lead.company_name, formData.website_url || lead.website_url);
      if (result.success && result.data) {
        setFormData((prev: any) => ({
          ...prev,
          ...result.data
        }));
      } else {
        alert(result.error || 'Failed to enrich data');
      }
    } catch (err) {
      console.error("Enrichment failed", err);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleQuickAction = async (actionType: string) => {
    setActiveQuickAction(actionType);
    try {
      const { generateQuickAction } = await import('@/app/actions/aiActions');
      const result = await generateQuickAction(actionType, formData);
      if (result.success && result.data) {
        setNewLog(prev => ({ ...prev, note: result.data }));
      } else {
        alert(result.error || 'Failed to generate action');
      }
    } catch(err) {
      console.error("Action failed", err);
    } finally {
      setActiveQuickAction(null);
    }
  };

  useEffect(() => {
    if (lead) {
      setFormData({
        company_name: lead.company_name || '',
        contact_person: lead.contact_person || '',
        email: lead.email || '',
        phone: lead.phone || '',
        outreach_status: lead.outreach_status || 'New',
        targetService: lead.targetService || 'High-end Web Development',
        website_url: lead.website_url || '',
        facebook_url: lead.facebook_url || '',
        instagram_url: lead.instagram_url || '',
        linkedin_url: lead.linkedin_url || '',
        reportFileUrl: lead.reportFileUrl || '',
        nextFollowUpDate: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] : '',
        outreach_logs: lead.outreach_logs || []
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onUpdateLead(lead._id, formData);
    setIsSubmitting(false);
    onClose();
  };

  const handleAddLog = async () => {
    if (!newLog.note.trim()) return;
    setIsSubmitting(true);
    
    const updatedLogs = [
      { method: newLog.type, notes: newLog.note, date: new Date().toISOString() },
      ...(formData.outreach_logs || [])
    ];
    
    const updatePayload = {
      ...formData,
      outreach_logs: updatedLogs
    };
    
    await onUpdateLead(lead._id, updatePayload);
    
    setFormData(updatePayload);
    setNewLog({ type: 'Note', note: '' });
    setIsSubmitting(false);
  };

  const getLogIcon = (method: string) => {
    switch (method) {
      case 'Email': return <Mail size={14} className="text-blue-400" />;
      case 'WhatsApp': return <MessageCircle size={14} className="text-green-400" />;
      case 'Phone': return <Phone size={14} className="text-purple-400" />;
      case 'Facebook': return <Globe size={14} className="text-indigo-400" />;
      default: return <FileText size={14} className="text-gray-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl h-[85vh] neu-flat rounded-[2rem] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200/50 dark:border-white/5 bg-transparent">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  {lead.company_name}
                  {/* Lead Score Badge */}
                  <span className={`px-2.5 py-1 text-[10px] uppercase font-black rounded-lg flex items-center gap-1.5 ${
                    leadScore >= 80 ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 
                    leadScore >= 50 ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                    'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                  }`}>
                    {leadScore >= 80 ? <span className="animate-pulse">🔥</span> : <Zap size={10} />} 
                    Score ({leadScore})
                  </span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lead Details & Activity Tracking</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors neu-button p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column: Lead Info */}
            <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200/50 dark:border-white/5 bg-transparent custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Lead Information</h3>
                <button
                  type="button"
                  onClick={handleAutoEnrich}
                  disabled={isEnriching}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg transition-colors border border-purple-500/20 disabled:opacity-50 shadow-inner"
                >
                  {isEnriching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isEnriching ? 'Enriching...' : '✨ Auto-Enrich'}
                </button>
              </div>
              
              <form id="lead-details-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Company Name</label>
                    <input 
                      type="text" 
                      value={formData.company_name || ''}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Contact Person</label>
                    <input 
                      type="text" 
                      value={formData.contact_person || ''}
                      onChange={e => setFormData({...formData, contact_person: e.target.value})}
                      className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Status</label>
                    <select 
                      value={formData.outreach_status || 'New'}
                      onChange={e => setFormData({...formData, outreach_status: e.target.value})}
                      className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Target Service</label>
                    <select 
                      value={formData.targetService || 'High-end Web Development'}
                      onChange={e => setFormData({...formData, targetService: e.target.value})}
                      className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Email</label>
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase flex items-center gap-2">
                    <Globe size={14} /> Website URL
                  </label>
                  <input 
                    type="url" 
                    value={formData.website_url || ''}
                    onChange={e => setFormData({...formData, website_url: e.target.value})}
                    placeholder="https://example.com"
                    className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe size={14} /> Social Media Links
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook URL
                      </label>
                      <input 
                        type="url" 
                        value={formData.facebook_url || ''}
                        onChange={e => setFormData({...formData, facebook_url: e.target.value})}
                        placeholder="https://facebook.com/..."
                        className="w-full neu-pressed rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-pink-600 dark:text-pink-400 mb-1.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Instagram URL
                      </label>
                      <input 
                        type="url" 
                        value={formData.instagram_url || ''}
                        onChange={e => setFormData({...formData, instagram_url: e.target.value})}
                        placeholder="https://instagram.com/..."
                        className="w-full neu-pressed rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn URL
                      </label>
                      <input 
                        type="url" 
                        value={formData.linkedin_url || ''}
                        onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                        placeholder="https://linkedin.com/company/..."
                        className="w-full neu-pressed rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-700/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1.5 flex items-center gap-1.5">
                        <FileText size={14} />
                        Report File URL
                      </label>
                      <input 
                        type="url" 
                        value={formData.reportFileUrl || ''}
                        onChange={e => setFormData({...formData, reportFileUrl: e.target.value})}
                        placeholder="https://drive.google.com/..."
                        className="w-full neu-pressed rounded-xl px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase flex items-center gap-2">
                    <Calendar size={14} /> Next Follow-up Date
                  </label>
                  <DatePicker 
                    selected={formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate) : null}
                    onChange={(date: Date | null) => setFormData({...formData, nextFollowUpDate: date ? date.toISOString().split('T')[0] : ''})}
                    className="w-full neu-pressed rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholderText="Select Schedule Date"
                    dateFormat="MMM d, yyyy"
                    showPopperArrow={false}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-1">
                    Set when you plan to follow up with this lead
                  </p>
                </div>

              </form>
            </div>

            {/* Right Column: Activity Timeline */}
            <div className="w-1/2 flex flex-col bg-transparent">
              <div className="p-6 border-b border-slate-200/50 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Log Activity</h3>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => handleQuickAction('linkedin')}
                      disabled={activeQuickAction !== null}
                      className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider neu-button text-blue-400 rounded-lg flex items-center gap-1 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      {activeQuickAction === 'linkedin' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} LinkedIn
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleQuickAction('summarize')}
                      disabled={activeQuickAction !== null}
                      className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider neu-button text-purple-400 rounded-lg flex items-center gap-1 hover:text-purple-300 transition-colors disabled:opacity-50"
                    >
                      {activeQuickAction === 'summarize' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Summarize
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <textarea 
                    value={newLog.note}
                    onChange={e => setNewLog({...newLog, note: e.target.value})}
                    placeholder="Write a note about your outreach..."
                    className="w-full neu-pressed rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[80px] resize-none"
                  />
                  <div className="flex gap-3">
                    <select 
                      value={newLog.type}
                      onChange={e => setNewLog({...newLog, type: e.target.value})}
                      className="flex-1 neu-pressed rounded-xl px-4 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {['Note', 'Email', 'WhatsApp', 'Facebook', 'Phone'].map(opt => (
                        <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">{opt}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={handleAddLog}
                      disabled={isSubmitting || !newLog.note.trim()}
                      className="px-6 neu-button text-indigo-500 font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg  transition-all duration-300 disabled:opacity-50"
                    >
                      Add Log
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Timeline</h3>
                  {formData.nextFollowUpDate && (
                    <span className="text-[10px] px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md font-bold uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                      🎯 Next: {new Date(formData.nextFollowUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="relative border-l border-slate-200 dark:border-white/10 ml-3 space-y-6 pb-6">
                  {(!formData.outreach_logs || formData.outreach_logs.length === 0) ? (
                    <p className="ml-6 text-sm text-slate-500 italic">No activity logged yet.</p>
                  ) : (
                    formData.outreach_logs.map((log: any, idx: number) => (
                      <div key={idx} className="relative ml-6 group">
                        <span className="absolute -left-8 top-1 flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 group-hover:border-indigo-400 transition-colors shadow-sm">
                          {getLogIcon(log.method)}
                        </span>
                        <div className="neu-flat rounded-xl p-4 group-hover:shadow-lg transition-all border border-transparent group-hover:border-indigo-500/20">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{log.method}</span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              {new Date(log.date).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{log.notes}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200/50 dark:border-white/5 bg-transparent flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              form="lead-details-form"
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2.5 neu-button text-indigo-500 font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg  transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

