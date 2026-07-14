'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Building2, User, Mail, Phone, Globe, Briefcase, Activity, Tag, Loader2, Check, Sparkles
} from 'lucide-react';

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onUpdateLead: (id: string, updateData: any) => Promise<void>;
}

export default function LeadDetailsModal({ 
  isOpen, 
  onClose, 
  lead, 
  onUpdateLead 
}: LeadDetailsModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
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
        source: lead.source || 'Manual'
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name) return;
    
    setIsSubmitting(true);
    // Keep status in sync with outreach_status if needed
    const payload = {
        ...formData,
        status: formData.outreach_status
    };

    await onUpdateLead(lead._id, payload);
    setIsSubmitting(false);
    onClose();
  };

  const inputClasses = "w-full px-4 py-3 bg-white/5 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all font-medium text-sm";
  const labelClasses = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/60 dark:bg-[#040509]/80 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0F1117] border border-slate-200 dark:border-[#232734] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-[24px] flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-slate-200 dark:border-[#232734] bg-slate-50/50 dark:bg-[#151821]/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Edit Lead Details
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Update information for {lead.company_name || 'this lead'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="relative z-10 p-2.5 rounded-xl bg-white dark:bg-[#232734] border border-slate-200 dark:border-[#2e3342] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2e3342] transition-all shadow-sm"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Form Content */}
          <form id="edit-lead-form" onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="space-y-8">
              
              {/* Basic Information */}
              <div>
                <h3 className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-200 dark:border-[#232734] text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Building2 size={16} className="text-indigo-500" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelClasses}>Company Name <span className="text-rose-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      className={inputClasses}
                      placeholder="e.g. Acme Corp"
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Contact Person</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.contact_person}
                        onChange={e => setFormData({...formData, contact_person: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Lead Source</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.source}
                        onChange={e => setFormData({...formData, source: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="e.g. LinkedIn"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pipeline Details */}
              <div>
                <h3 className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-200 dark:border-[#232734] text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Activity size={16} className="text-indigo-500" />
                  Pipeline Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>Outreach Status</label>
                    <select
                      value={formData.outreach_status}
                      onChange={e => setFormData({...formData, outreach_status: e.target.value})}
                      className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_1rem_center] pr-10`}
                    >
                      <option value="New">New</option>
                      <option value="Queued">Queued</option>
                      <option value="Email Sent">Email Sent</option>
                      <option value="Replied">Replied</option>
                      <option value="Meeting Booked">Meeting Booked</option>
                      <option value="Closed">Closed</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Target Service</label>
                    <select
                      value={formData.targetService}
                      onChange={e => setFormData({...formData, targetService: e.target.value})}
                      className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_1rem_center] pr-10`}
                    >
                      <option value="High-end Web Development">High-end Web Development</option>
                      <option value="Next.js / Laravel App">Next.js / Laravel App</option>
                      <option value="WordPress Development">WordPress Development</option>
                      <option value="Custom ERP / SaaS">Custom ERP / SaaS</option>
                      <option value="Technical SEO">Technical SEO</option>
                      <option value="Answer Engine Optimization (AEO)">Answer Engine Optimization (AEO)</option>
                      <option value="Generative Engine Optimization (GEO)">Generative Engine Optimization (GEO)</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Web & Links */}
              <div>
                <h3 className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-200 dark:border-[#232734] text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Tag size={16} className="text-indigo-500" />
                  Web & Links
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelClasses}>Website URL</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="url" 
                        value={formData.website_url}
                        onChange={e => setFormData({...formData, website_url: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>LinkedIn Profile</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="url" 
                        value={formData.linkedin_url}
                        onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Facebook Page</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="url" 
                        value={formData.facebook_url}
                        onChange={e => setFormData({...formData, facebook_url: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-slate-200 dark:border-[#232734] bg-slate-50/50 dark:bg-[#151821]/50 flex items-center justify-end gap-4 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#232734] hover:bg-slate-100 dark:hover:bg-[#2e3342] border border-slate-200 dark:border-[#2e3342] transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              form="edit-lead-form"
              type="submit" 
              disabled={isSubmitting || !formData.company_name}
              className="px-8 py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:shadow-none flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
