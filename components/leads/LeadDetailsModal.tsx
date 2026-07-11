'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MessageCircle, Mail, Globe, Phone, FileText, Sparkles, Loader2, Zap, Building, User, Target, Link as LinkIcon, Activity, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Select Component for Enterprise Dropdowns
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
    <div className="relative w-full" ref={selectRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between cursor-pointer select-none bg-[#09090B] border border-[#232734] rounded-xl px-4 py-3 text-sm text-white focus-within:border-indigo-500/50 transition-all ${className}`}
      >
        <span className="font-semibold">{value}</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownUp ? 5 : -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownUp ? 5 : -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[100] w-full bg-[#11131A] rounded-xl py-2 shadow-2xl border border-[#232734] overflow-hidden ${dropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          >
            {options.map((opt: string) => (
              <div 
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-all flex items-center gap-2 ${
                  value === opt 
                    ? 'text-indigo-400 bg-indigo-500/10 font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-[#232734]/50'
                }`}
              >
                {value === opt ? <CheckCircle size={14} className="text-indigo-500" /> : <div className="w-3.5" />}
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder = "", disabled = false }: any) => (
  <div className="relative group w-full">
    <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2 ml-1">
      {Icon && <Icon size={12} className="text-slate-600 group-focus-within:text-indigo-400 transition-colors" />}
      {label}
    </label>
    <input 
      type={type} 
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-[#09090B] border border-[#232734] rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-600 disabled:opacity-50"
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      setFormData({
        company_name: lead.company_name || '',
        contact_person: lead.contact_person || '',
        email: lead.email || '',
        phone: lead.phone || '',
        outreach_status: lead.outreach_status || lead.status || 'New',
        targetService: lead.targetService || 'High-end Web Development',
        website_url: lead.website_url || '',
        facebook_url: lead.facebook_url || '',
        instagram_url: lead.instagram_url || '',
        linkedin_url: lead.linkedin_url || '',
        reportFileUrl: lead.reportFileUrl || '',
        email_draft: lead.email_draft || '',
        email_subject_draft: lead.email_subject_draft || '',
        facebook_draft: lead.facebook_draft || '',
        nextFollowUpDate: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] : '',
        outreach_logs: lead.outreach_logs || []
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Convert modal's "outreach_status" back to main "status" field for saving if needed, 
    // but preserving outreach_status logic from before.
    const payload = {
        ...formData,
        status: formData.outreach_status
    };

    await onUpdateLead(lead._id, payload);
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
    const updatePayload = { ...formData, outreach_logs: updatedLogs, status: formData.outreach_status };
    await onUpdateLead(lead._id, updatePayload);
    setFormData(updatePayload);
    setNewLog({ type: 'Note', note: '' });
    setIsSubmitting(false);
  };

  const getLogIcon = (method: string) => {
    switch (method) {
      case 'Email': return <Mail size={14} className="text-blue-400" />;
      case 'WhatsApp': return <MessageCircle size={14} className="text-emerald-400" />;
      case 'Phone': return <Phone size={14} className="text-purple-400" />;
      case 'Facebook': return <Globe size={14} className="text-indigo-400" />;
      case 'Meeting': return <Calendar size={14} className="text-amber-400" />;
      default: return <FileText size={14} className="text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 lg:p-10">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 350 }}
          className="relative w-full max-w-7xl h-full md:h-[90vh] bg-[#11131A] border border-[#232734] md:rounded-[32px] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-start p-6 md:p-8 border-b border-[#232734] bg-[#09090B]">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[20px] bg-[#11131A] border border-[#232734] flex items-center justify-center text-slate-300 font-bold text-xl shadow-inner shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/20 blur-xl rounded-full"></div>
                  <span className="relative z-10">{lead.company_name?.substring(0,2).toUpperCase() || '??'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  {formData.company_name || 'Unknown Company'}
                  <div className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1.5 shadow-sm ${
                    leadScore >= 80 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 
                    leadScore >= 50 ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 
                    'text-slate-400 border-[#232734] bg-[#11131A]'
                  }`}>
                    {leadScore >= 80 ? <Sparkles size={12} /> : <Zap size={12} />} 
                    SCORE: {leadScore}
                  </div>
                </h2>
                <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoEnrich}
                      disabled={isEnriching}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                    >
                      {isEnriching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {isEnriching ? 'Enriching...' : 'Auto-Enrich Profile'}
                    </button>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 bg-[#11131A] border border-[#232734] rounded-xl text-slate-400 hover:text-white transition-all shadow-sm">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Left Column: Contact & Pipeline */}
            <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar border-r border-[#232734] bg-[#09090B]">
              <form id="lead-details-form" onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
                
                <section>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={14} /> Profile & Contact
                    </h3>
                    <div className="bg-[#11131A] border border-[#232734] p-5 rounded-[24px] space-y-5">
                        <InputField label="Company Name" icon={Building} value={formData.company_name} onChange={(e:any) => setFormData({...formData, company_name: e.target.value})} />
                        <InputField label="Contact Person" icon={User} value={formData.contact_person} onChange={(e:any) => setFormData({...formData, contact_person: e.target.value})} />
                        <div className="w-full h-px bg-[#232734]"></div>
                        <InputField type="email" label="Email Address" icon={Mail} value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} />
                        <InputField type="tel" label="Phone Number" icon={Phone} value={formData.phone} onChange={(e:any) => setFormData({...formData, phone: e.target.value})} />
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity size={14} /> Pipeline Details
                    </h3>
                    <div className="bg-[#11131A] border border-[#232734] p-5 rounded-[24px] space-y-5">
                        <div className="relative group">
                            <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2 ml-1">
                                <Activity size={12} className="text-slate-600" /> Status
                            </label>
                            <CustomSelect 
                                value={formData.outreach_status || 'New'}
                                onChange={(val: string) => setFormData({...formData, outreach_status: val})}
                                options={['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested']}
                            />
                        </div>
                        <div className="relative group">
                            <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2 ml-1">
                                <Target size={12} className="text-slate-600" /> Target Service
                            </label>
                            <CustomSelect 
                                value={formData.targetService || 'High-end Web Development'}
                                onChange={(val: string) => setFormData({...formData, targetService: val})}
                                options={['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design']}
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <LinkIcon size={14} /> Web & Links
                    </h3>
                    <div className="bg-[#11131A] border border-[#232734] p-5 rounded-[24px] space-y-5">
                        <InputField type="url" label="Website URL" icon={Globe} placeholder="https://..." value={formData.website_url} onChange={(e:any) => setFormData({...formData, website_url: e.target.value})} />
                        <div className="w-full h-px bg-[#232734]"></div>
                        <InputField type="url" label="LinkedIn Profile" value={formData.linkedin_url} placeholder="https://linkedin.com/in/..." onChange={(e:any) => setFormData({...formData, linkedin_url: e.target.value})} />
                        <InputField type="url" label="Facebook Page" value={formData.facebook_url} placeholder="https://facebook.com/..." onChange={(e:any) => setFormData({...formData, facebook_url: e.target.value})} />
                        <InputField type="url" label="Instagram" value={formData.instagram_url} placeholder="https://instagram.com/..." onChange={(e:any) => setFormData({...formData, instagram_url: e.target.value})} />
                        <div className="w-full h-px bg-[#232734]"></div>
                        <InputField type="url" label="Report / Drive URL" value={formData.reportFileUrl} placeholder="https://drive.google.com/..." onChange={(e:any) => setFormData({...formData, reportFileUrl: e.target.value})} />
                    </div>
                </section>
                
              </form>
            </div>

            {/* Right Column: Timeline & Notes */}
            <div className="w-full lg:w-1/2 flex flex-col bg-[#11131A]">
                
                {/* Notes Input Area */}
                <div className="p-6 md:p-8 border-b border-[#232734] bg-[#11131A] shrink-0">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={14} /> Add Note or Activity
                    </h3>
                    <div className="bg-[#09090B] border border-[#232734] rounded-2xl p-4 focus-within:border-indigo-500/50 transition-all shadow-sm">
                        <textarea
                            value={newLog.note}
                            onChange={(e) => setNewLog({ ...newLog, note: e.target.value })}
                            placeholder="Log a call, meeting, or note..."
                            className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-600 focus:outline-none resize-none min-h-[80px]"
                        />
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#232734]">
                            <div className="flex items-center gap-2">
                                {['Note', 'Email', 'Call', 'Meeting'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewLog({ ...newLog, type })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                            newLog.type === type 
                                            ? 'bg-[#232734] border-slate-500 text-white' 
                                            : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#232734]/50'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={handleAddLog}
                                disabled={isSubmitting || !newLog.note.trim()}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                            >
                                Post Note
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-[#09090B] shadow-inner">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Clock size={14} /> Activity Timeline
                    </h3>
                    
                    <div className="space-y-6">
                        {formData.outreach_logs && formData.outreach_logs.length > 0 ? (
                            formData.outreach_logs.map((log: any, idx: number) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={idx} 
                                    className="relative pl-6"
                                >
                                    {/* Timeline line connecting items */}
                                    {idx !== formData.outreach_logs.length - 1 && (
                                        <div className="absolute left-2 top-8 bottom-[-24px] w-px bg-[#232734]"></div>
                                    )}
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-[#11131A] border border-[#232734] flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                    </div>
                                    
                                    <div className="bg-[#11131A] border border-[#232734] rounded-[20px] p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getLogIcon(log.method || 'Note')}
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{log.method || 'Note'}</span>
                                            </div>
                                            <span className="text-[10px] font-semibold text-slate-500">
                                                {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {log.notes}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-[#11131A] border border-[#232734] border-dashed rounded-3xl">
                                <FileText size={24} className="text-slate-600 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400">No activity logged yet.</p>
                                <p className="text-xs text-slate-600 mt-1">Notes, emails, and calls will appear here.</p>
                            </div>
                        )}

                        {/* Collapsible Drafts (Optional display if data exists) */}
                        {(formData.email_draft || formData.facebook_draft) && (
                            <div className="pt-8 mt-8 border-t border-[#232734]">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Sparkles size={14} /> Saved Drafts
                                </h3>
                                
                                {formData.email_draft && (
                                    <div className="bg-[#11131A] border border-[#232734] rounded-[20px] p-5 mb-4 shadow-sm">
                                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Mail size={12} className="text-indigo-400"/> Email Draft</h4>
                                        <div className="text-xs text-slate-400 mb-2 font-semibold">Subject: {formData.email_subject_draft || 'No subject'}</div>
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap font-medium">{formData.email_draft}</p>
                                    </div>
                                )}

                                {formData.facebook_draft && (
                                    <div className="bg-[#11131A] border border-[#232734] rounded-[20px] p-5 shadow-sm">
                                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Globe size={12} className="text-blue-400"/> Facebook Draft</h4>
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap font-medium">{formData.facebook_draft}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-[#232734] bg-[#09090B] flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[#11131A] hover:bg-[#232734] border border-[#232734] transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                form="lead-details-form"
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-2.5 text-xs font-bold rounded-xl bg-white text-black hover:bg-slate-200 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin text-black" />}
                {isSubmitting ? 'Saving...' : 'Save Lead Details'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
