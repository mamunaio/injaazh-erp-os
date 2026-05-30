'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Loader2, Sparkles, Code, Search, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOutreachEmail } from '@/app/actions/leadActions';

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  subject: string;
  body: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'webdev',
    name: 'High-End Web Dev',
    icon: <Code size={16} className="text-indigo-400" />,
    subject: 'Proposal for {companyName}: Modern Web Experience',
    body: `Hi {contactName},

I hope this email finds you well.

I was recently reviewing {companyName} and was highly impressed by your business footprint. However, I noticed that your online experience could be significantly modernized to convert more visitors into high-paying customers.

We specialize in building ultra-fast, high-end Next.js and React web applications that load in under 1 second and feel as fluid as a native mobile app. 

Would you be open to a brief 10-minute call next week to see how a modern digital storefront can boost {companyName}'s conversion rates?

Best regards,
[Your Name]
Injaazh Digital`
  },
  {
    id: 'seo',
    name: 'Technical SEO Audit',
    icon: <Search size={16} className="text-blue-400" />,
    subject: 'Technical SEO Audit for {companyName}',
    body: `Hi {contactName},

I was looking at {companyName}'s visibility on Google and noticed a few technical bottlenecks that are currently holding you back from ranking on the first page for key search terms.

Specifically, your site has a few performance and crawlability issues that, when fixed, can dramatically increase your organic leads.

I’ve prepared a quick, custom video walkthrough pointing out these exact issues. Would you like me to send it over? No strings attached.

Best regards,
[Your Name]
Injaazh Digital`
  },
  {
    id: 'aeo',
    name: 'Answer Engine/AEO',
    icon: <Sparkles size={16} className="text-purple-400" />,
    subject: 'Is {companyName} visible in ChatGPT & Perplexity?',
    body: `Hi {contactName},

Over 60% of modern tech-savvy clients are now using AI engines like ChatGPT, Perplexity, and Claude to find service providers, instead of traditional Google search.

I did a quick check on whether AI search engines recommend {companyName} when users ask for top providers in your area, and the results were interesting.

We specialize in Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) to ensure your brand is cited and recommended as the prime choice by LLMs.

Would you be open to seeing a quick report on how {companyName} currently ranks in AI search results?

Best regards,
[Your Name]
Injaazh Digital`
  }
];

export default function OutreachComposerModal({
  isOpen,
  onClose,
  lead,
  onEmailSent
}: {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onEmailSent: (updatedLead: any) => void;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  
  // Editable fields for dynamic replacement
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // Composer state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Status states
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ isSimulated: boolean } | null>(null);

  // Initialize and update fields when lead changes
  useEffect(() => {
    if (lead) {
      setContactName(lead.contact_person || 'there');
      setCompanyName(lead.company_name || 'your company');
      setWebsiteUrl(lead.website_url || 'your website');
      setSuccessInfo(null);
      setErrorMessage(null);
    }
  }, [lead, isOpen]);

  // Compile template whenever variables or template selection changes
  useEffect(() => {
    if (!lead) return;
    
    const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
    
    const compile = (text: string) => {
      return text
        .replace(/{companyName}/g, companyName || lead.company_name || 'your company')
        .replace(/{contactName}/g, contactName || lead.contact_person || 'there')
        .replace(/{websiteUrl}/g, websiteUrl || lead.website_url || 'your website');
    };

    setSubject(compile(activeTemplate.subject));
    setBody(compile(activeTemplate.body));
  }, [selectedTemplateId, contactName, companyName, websiteUrl, lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSend = async () => {
    if (!subject.trim()) {
      setErrorMessage('Subject cannot be empty');
      return;
    }
    if (!body.trim()) {
      setErrorMessage('Email body cannot be empty');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await sendOutreachEmail(lead._id, subject, body);
      if (response.success && response.data) {
        setSuccessInfo({ isSimulated: !!response.isSimulated });
        // Let the state settle, then invoke callback and close
        setTimeout(() => {
          onEmailSent(response.data);
          onClose();
        }, 2000);
      } else {
        setErrorMessage(response.error || 'Outreach email failed to dispatch.');
      }
    } catch (err: any) {
      console.error('Outreach modal dispatch error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Glass backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md"
          onClick={isSending ? undefined : onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl h-[85vh] bg-white/95 dark:bg-slate-900/90 dark:bg-gradient-to-br dark:from-purple-950/20 dark:to-slate-950/80 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/10 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-purple-500/10 bg-slate-50/50 dark:bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
                <Mail size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">CRM Cold Email Outreach</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  Send outreach to <span className="font-semibold text-slate-700 dark:text-purple-300">{lead.company_name}</span> &bull; {lead.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSending}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Workspace */}
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* Left side: Templates and Custom variables */}
            <div className="w-full md:w-5/12 p-6 overflow-y-auto border-r border-slate-200 dark:border-purple-500/10 bg-slate-50/30 dark:bg-transparent flex flex-col space-y-6">
              
              {/* Template selection cards */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2.5 uppercase">
                  Select High-Converting Template
                </label>
                <div className="space-y-2">
                  {TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-200 dark:bg-purple-950/40 dark:border-purple-500/30 shadow-md shadow-indigo-500/5'
                            : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900/40 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-indigo-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          {tmpl.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${isSelected ? 'text-indigo-600 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {tmpl.name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {tmpl.subject.replace('{companyName}', companyName || lead.company_name)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Variables editor */}
              <div className="space-y-4">
                <div>
                  <h3 className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-3">
                    Personalize Placeholders
                  </h3>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-purple-500/10 bg-white/50 dark:bg-slate-950/40 space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Contact Person ({'{contactName}'})
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. John Doe or Team"
                        className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-lg px-3 py-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Company Name ({'{companyName}'})
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Southpaw Flooring"
                        className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-lg px-3 py-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Website Url ({'{websiteUrl}'})
                      </label>
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="e.g. southpawflooring.com"
                        className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-lg px-3 py-2 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status information disclaimer */}
              <div className="mt-auto pt-4">
                <div className="flex gap-2.5 p-3.5 bg-slate-100/50 dark:bg-purple-950/20 border border-slate-200 dark:border-purple-500/10 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-purple-300">Outreach CRM Automation:</span> sending this email progresses lead status to <span className="font-semibold px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400">Contacted</span> and archives this draft directly inside the activity timeline logs!
                  </div>
                </div>
              </div>

            </div>

            {/* Right side: Email Editor Panel */}
            <div className="flex-1 p-6 flex flex-col space-y-4 overflow-y-auto">
              
              {/* Recipient summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-black/10 border border-slate-200/50 dark:border-purple-500/5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px] w-12 flex-shrink-0">Recipient:</span>
                  <span className="truncate">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px] w-12 flex-shrink-0">Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-medium border border-orange-500/20">
                    {lead.outreach_status}
                  </span>
                </div>
              </div>

              {/* Subject Input */}
              <div className="flex flex-col">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5 uppercase">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-xl px-4 py-3 text-sm dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                />
              </div>

              {/* Body Text Area */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5 uppercase">
                  Email Message Draft
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full flex-1 bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 text-slate-800 focus:bg-white dark:focus:bg-slate-800 border rounded-xl p-4 text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono leading-relaxed resize-none shadow-inner"
                  placeholder="Compose your cold email message here..."
                />
              </div>

              {/* Action Banner / Errors / Successes */}
              <div className="pt-2 flex flex-col gap-2">
                
                {/* Error Banner */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl"
                  >
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Success Banner */}
                {successInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl"
                  >
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-green-500" />
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-300">Outreach Email Dispatched Successfully!</div>
                      <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                        {successInfo.isSimulated 
                          ? 'Simulated sandbox fallback: database timeline successfully updated. Lead status set to Contacted!'
                          : 'SMTP email successfully delivered. CRM status progressed.'}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Control Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Ready for delivery &bull; Rich logs auto-archived
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      disabled={isSending}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleSend}
                      disabled={isSending || !!successInfo}
                      className="relative overflow-hidden group px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : successInfo ? (
                        <>
                          <CheckCircle size={14} className="animate-bounce" />
                          <span>Sent!</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          <span>Send Outreach</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
