'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MessageCircle, Mail, Globe, Phone, FileText, Sparkles, Loader2, Zap, Building, User, Target, Link as LinkIcon, Activity, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Custom Select Component for Neumorphic Dropdowns
const CustomSelect = ({ value, onChange, options, className = "", dropdownUp = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between cursor-pointer select-none ${className}`}
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownUp ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownUp ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[100] w-full neu-flat rounded-2xl py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden ${dropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          >
            {options.map((opt: string) => (
              <div 
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer transition-all border-l-2 ${
                  value === opt 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 font-bold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder = "" }: any) => (
  <div className="relative group">
    <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
      {Icon && <Icon size={12} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />}
      {label}
    </label>
    <input 
      type={type} 
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full neu-pressed rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder-slate-500"
    />
  </div>
);

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

  const getLeadScore = () => {
    let score = 20;
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
        setFormData((prev: any) => ({ ...prev, ...result.data }));
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
        setNewLog(prev => ({ ...prev, note: result.data || '' }));
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
        email_draft: lead.email_draft || '',
        email_subject_draft: lead.email_subject_draft || '',
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
    const updatePayload = { ...formData, outreach_logs: updatedLogs };
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
      default: return <FileText size={14} className="text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
          className="relative w-full max-w-6xl h-[90vh] neu-flat rounded-3xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-start p-8 border-b border-slate-200/10 bg-transparent">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                  {lead.company_name}
                  <div className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-2 neu-button ${
                    leadScore >= 80 ? 'text-orange-500' : 
                    leadScore >= 50 ? 'text-indigo-500' : 
                    'text-slate-500'
                  }`}>
                    {leadScore >= 80 ? <Sparkles size={12} className="animate-pulse" /> : <Zap size={12} />} 
                    Score: {leadScore}
                  </div>
                </h2>
              </div>
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                Manage lead details, enrich data, and track outreach activity.
              </p>
            </div>
            <button onClick={onClose} className="p-2 neu-button rounded-xl text-slate-500 hover:text-indigo-500 transition-all">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column: Lead Info */}
            <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-200/10 custom-scrollbar bg-transparent">
              
              <div className="flex justify-between items-end mb-8">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <User size={18} className="text-indigo-500" />
                  Lead Profile
                </h3>
                <button
                  type="button"
                  onClick={handleAutoEnrich}
                  disabled={isEnriching}
                  className="flex items-center gap-2 px-4 py-2 neu-button text-indigo-500 text-xs font-bold rounded-xl transition-all hover:text-indigo-400 disabled:opacity-50"
                >
                  {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{isEnriching ? 'Enriching Data...' : 'Auto-Enrich'}</span>
                </button>
              </div>
              
              <form id="lead-details-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <InputField label="Company Name" icon={Building} value={formData.company_name} onChange={(e:any) => setFormData({...formData, company_name: e.target.value})} />
                  <InputField label="Contact Person" icon={User} value={formData.contact_person} onChange={(e:any) => setFormData({...formData, contact_person: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-5 relative z-20">
                  <div className="relative group">
                    <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
                      <Activity size={12} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" /> Status
                    </label>
                    <CustomSelect 
                      value={formData.outreach_status || 'New'}
                      onChange={(val: string) => setFormData({...formData, outreach_status: val})}
                      options={['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested']}
                      className="neu-pressed rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="relative group">
                    <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
                      <Target size={12} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" /> Target Service
                    </label>
                    <CustomSelect 
                      value={formData.targetService || 'High-end Web Development'}
                      onChange={(val: string) => setFormData({...formData, targetService: val})}
                      options={['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design']}
                      className="neu-pressed rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 relative z-10">
                  <InputField type="email" label="Email Address" icon={Mail} value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} />
                  <InputField type="tel" label="Phone Number" icon={Phone} value={formData.phone} onChange={(e:any) => setFormData({...formData, phone: e.target.value})} />
                </div>

                <InputField type="url" label="Website URL" icon={Globe} placeholder="https://..." value={formData.website_url} onChange={(e:any) => setFormData({...formData, website_url: e.target.value})} />

                <div className="pt-4 mt-4 border-t border-slate-200/10">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LinkIcon size={12} /> Social & External Links
                  </h4>
                  <div className="space-y-4">
                    <InputField type="url" label="LinkedIn URL" value={formData.linkedin_url} placeholder="https://linkedin.com/in/..." onChange={(e:any) => setFormData({...formData, linkedin_url: e.target.value})} />
                    <InputField type="url" label="Facebook URL" value={formData.facebook_url} placeholder="https://facebook.com/..." onChange={(e:any) => setFormData({...formData, facebook_url: e.target.value})} />
                    <InputField type="url" label="Instagram URL" value={formData.instagram_url} placeholder="https://instagram.com/..." onChange={(e:any) => setFormData({...formData, instagram_url: e.target.value})} />
                    <InputField type="url" label="Report / Drive URL" value={formData.reportFileUrl} placeholder="https://drive.google.com/..." onChange={(e:any) => setFormData({...formData, reportFileUrl: e.target.value})} />
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t border-slate-200/10">
                  <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
                    <Calendar size={12} className="text-slate-500" /> Next Follow-up Date
                  </label>
                  <DatePicker 
                    selected={formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate) : null}
                    onChange={(date: Date | null) => setFormData({...formData, nextFollowUpDate: date ? date.toISOString().split('T')[0] : ''})}
                    className="w-full neu-pressed rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder-slate-500"
                    placeholderText="Select Schedule Date"
                    dateFormat="MMM d, yyyy"
                    showPopperArrow={false}
                  />
                </div>


              </form>
            </div>

            {/* Right Column: Activity Timeline */}
            <div className="w-1/2 flex flex-col bg-transparent">
              {/* Log Entry Area */}
              <div className="p-8 border-b border-slate-200/10 relative z-30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MessageCircle size={16} className="text-indigo-500" /> Log Activity
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => handleQuickAction('linkedin')}
                      disabled={activeQuickAction !== null}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider neu-button text-blue-500 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {activeQuickAction === 'linkedin' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} LinkedIn Gen
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleQuickAction('summarize')}
                      disabled={activeQuickAction !== null}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider neu-button text-purple-500 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {activeQuickAction === 'summarize' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Summarize
                    </button>
                  </div>
                </div>
                
                <div className="neu-pressed rounded-2xl overflow-visible transition-all focus-within:ring-2 focus-within:ring-indigo-500/30">
                  <textarea 
                    value={newLog.note}
                    onChange={e => setNewLog({...newLog, note: e.target.value})}
                    placeholder="Write a note about your latest outreach..."
                    className="w-full bg-transparent px-5 py-4 text-sm text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none min-h-[100px] resize-none"
                  />
                  <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200/10 bg-transparent">
                    <div className="relative w-40">
                      <CustomSelect 
                        value={newLog.type}
                        onChange={(val: string) => setNewLog({...newLog, type: val})}
                        options={['Note', 'Email', 'WhatsApp', 'Facebook', 'Phone', 'LinkedIn']}
                        className="text-sm text-slate-400 font-bold hover:text-indigo-400"
                        dropdownUp={true}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddLog}
                      disabled={isSubmitting || !newLog.note.trim()}
                      className="px-6 py-2 neu-button text-indigo-500 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      Add Log
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Area for Draft & Timeline */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative z-10">
                {/* Automated Outreach Draft Card */}
                <div className="neu-flat rounded-2xl p-6 mb-10 relative z-20 border border-white/5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-indigo-500" /> Automated Outreach Draft
                  </h4>
                  <div className="space-y-4">
                    <InputField 
                      label="Email Subject" 
                      icon={Mail} 
                      value={formData.email_subject_draft} 
                      onChange={(e:any) => setFormData({...formData, email_subject_draft: e.target.value})} 
                      placeholder="Custom Subject..." 
                    />
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 ml-1">
                        <FileText size={12} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        Email Body
                      </label>
                      <textarea
                        value={formData.email_draft}
                        onChange={(e:any) => setFormData({...formData, email_draft: e.target.value})}
                        placeholder="Custom email body..."
                        className="w-full neu-pressed rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder-slate-500 min-h-[180px] resize-y"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Interaction Timeline
                  </h3>
                </div>
                
                <div className="relative border-l-2 border-slate-700/50 ml-4 space-y-8 pb-8">
                  {(!formData.outreach_logs || formData.outreach_logs.length === 0) ? (
                    <div className="ml-8 text-sm text-slate-500 italic neu-pressed p-4 rounded-xl">No activity logged yet. Add a note above to get started.</div>
                  ) : (
                    formData.outreach_logs.map((log: any, idx: number) => (
                      <div key={idx} className="relative ml-8 group">
                        {/* Neumorphic node */}
                        <div className="absolute -left-[41px] top-1 w-8 h-8 rounded-full neu-flat flex items-center justify-center transition-all z-10 group-hover:text-indigo-500">
                          {getLogIcon(log.method)}
                        </div>
                        {/* Connecting line glow effect on hover */}
                        <div className="absolute -left-[41px] top-4 bottom-[-32px] w-0.5 bg-indigo-500/0 group-hover:bg-indigo-500/50 transition-colors" />
                        
                        <div className="neu-flat rounded-2xl p-5 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold px-2.5 py-1 neu-pressed rounded-md text-indigo-500">{log.method}</span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {new Date(log.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
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
          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-200/10 bg-transparent flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all neu-button"
            >
              Cancel
            </button>
            <button 
              form="lead-details-form"
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2.5 neu-button text-indigo-500 font-black rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Lead Details'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
