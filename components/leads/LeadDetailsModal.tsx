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
  const [formData, setFormData] = useState<any>({
    company_name: '',
    full_name: '',
    title: '',
    contact_person: '',
    email: '',
    phone: '',
    outreach_status: 'New',
    targetService: 'High-end Web Development',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    person_linkedin_url: '',
    twitter_url: '',
    city: '',
    state: '',
    country: '',
    company_address: '',
    source: 'Manual'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

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
        full_name: lead.full_name || '',
        title: lead.title || '',
        contact_person: lead.contact_person || '',
        email: lead.email || '',
        phone: lead.phone || '',
        outreach_status: lead.outreach_status || lead.status || 'New',
        targetService: lead.targetService || 'High-end Web Development',
        website_url: lead.website_url || '',
        facebook_url: lead.facebook_url || '',
        instagram_url: lead.instagram_url || '',
        linkedin_url: lead.linkedin_url || '',
        person_linkedin_url: lead.person_linkedin_url || '',
        twitter_url: lead.twitter_url || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        company_address: lead.company_address || '',
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
  const optionClass = "bg-white dark:bg-[#0F1117] text-slate-900 dark:text-white";

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

          {/* Tabs */}
          <div className="px-8 pt-4 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#0F1117]">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`pb-4 text-sm font-bold transition-all relative ${
                  activeTab === 'basic' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Basic Information
                {activeTab === 'basic' && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`pb-4 text-sm font-bold transition-all relative ${
                  activeTab === 'advanced' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Advance Details
                {activeTab === 'advanced' && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form id="edit-lead-form" onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="space-y-8">
              
              {/* Basic Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    <label className={labelClasses}>Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.full_name}
                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Title</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="CEO"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Contact Person (Legacy)</label>
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
                    <label className={labelClasses}>Corporate Phone</label>
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
                      <option className={optionClass} value="New">New</option>
                      <option className={optionClass} value="Queued">Queued</option>
                      <option className={optionClass} value="Email Sent">Email Sent</option>
                      <option className={optionClass} value="Replied">Replied</option>
                      <option className={optionClass} value="Meeting Booked">Meeting Booked</option>
                      <option className={optionClass} value="Closed">Closed</option>
                      <option className={optionClass} value="Not Interested">Not Interested</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClasses}>Target Service</label>
                    <select
                      value={formData.targetService}
                      onChange={e => setFormData({...formData, targetService: e.target.value})}
                      className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_1rem_center] pr-10`}
                    >
                      <option className={optionClass} value="High-end Web Development">High-end Web Development</option>
                      <option className={optionClass} value="Next.js / Laravel App">Next.js / Laravel App</option>
                      <option className={optionClass} value="WordPress Development">WordPress Development</option>
                      <option className={optionClass} value="Custom ERP / SaaS">Custom ERP / SaaS</option>
                      <option className={optionClass} value="Technical SEO">Technical SEO</option>
                      <option className={optionClass} value="Answer Engine Optimization (AEO)">Answer Engine Optimization (AEO)</option>
                      <option className={optionClass} value="Generative Engine Optimization (GEO)">Generative Engine Optimization (GEO)</option>
                      <option className={optionClass} value="UI/UX Design">UI/UX Design</option>
                    </select>
                  </div>
                </div>
              </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Location Details */}
                  <div>
                    <h3 className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-200 dark:border-[#232734] text-sm font-bold text-slate-800 dark:text-slate-200">
                      <Globe size={16} className="text-indigo-500" />
                      Location Details
                    </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelClasses}>Company Address</label>
                    <input 
                      type="text" 
                      value={formData.company_address}
                      onChange={e => setFormData({...formData, company_address: e.target.value})}
                      className={inputClasses}
                      placeholder="123 Main St, Suite 100"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>City</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className={inputClasses}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>State</label>
                    <input 
                      type="text" 
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                      className={inputClasses}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Country</label>
                    <input 
                      type="text" 
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                      className={inputClasses}
                      placeholder="United States"
                    />
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
                    <label className={labelClasses}>Company LinkedIn URL</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="url" 
                        value={formData.linkedin_url}
                        onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Person LinkedIn URL</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="url" 
                        value={formData.person_linkedin_url}
                        onChange={e => setFormData({...formData, person_linkedin_url: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Facebook URL</label>
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

                  <div>
                    <label className={labelClasses}>Twitter URL</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="url" 
                        value={formData.twitter_url}
                        onChange={e => setFormData({...formData, twitter_url: e.target.value})}
                        className={`${inputClasses} pl-10`}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>
                </div>
              )}

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
