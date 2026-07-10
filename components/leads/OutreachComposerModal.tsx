'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Send, Loader2, Sparkles, Code, Search, AlertCircle, CheckCircle, Info, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOutreachEmail } from '@/app/actions/leadActions';
import { getEmailAccounts } from '@/app/actions/emailAccountActions';
import { generateAIEmailDraft } from '@/app/actions/aiActions';

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

// Custom Select Component for Neumorphic Dropdowns
const CustomSelect = ({ value, onChange, options, className = "", dropdownUp = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative flex-1 min-w-0" ref={selectRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between cursor-pointer select-none ${className}`}
      >
        <span className="flex-1 min-w-0 truncate pr-2" title={selectedOption ? selectedOption.label : 'Select...'}>
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownUp ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownUp ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[100] w-full min-w-[280px] right-0 neu-flat rounded-2xl py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden ${dropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          >
            {options.map((opt: any) => (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 text-[11px] font-semibold cursor-pointer transition-all border-l-2 truncate ${
                  value === opt.value 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 font-bold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper to play sounds without external files
const playStatusSound = (type: 'success' | 'error' | 'loading') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    if (type === 'success') {
      // Happy chime (upward arpeggio)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'error') {
      // Error buzz (low tone descending)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'loading') {
      // Brief click for action initiation
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

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
  const dynamicTemplates = React.useMemo(() => {
    if (!lead || !lead.email_draft) return TEMPLATES;
    return [
      {
        id: 'custom-draft',
        name: 'Custom Saved Draft',
        icon: <FileText size={16} className="text-orange-400" />,
        subject: lead.email_subject_draft || 'Custom Subject',
        body: lead.email_draft
      },
      ...TEMPLATES
    ];
  }, [lead]);

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Editable fields for dynamic replacement
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // Composer state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Status states
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ isSimulated: boolean, sentVia?: string } | null>(null);
  
  // Sender Account Selection
  const [activeAccounts, setActiveAccounts] = useState<any[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('auto');
  
  // Anti-Spam Cooldown State
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Initialize and update fields when lead changes
  useEffect(() => {
    if (lead && isOpen) {
      setContactName(lead.contact_person || 'there');
      setCompanyName(lead.company_name || 'your company');
      setWebsiteUrl(lead.website_url || 'your website');
      setSuccessInfo(null);
      setErrorMessage(null);
      if (lead.email_draft) {
        setSelectedTemplateId('custom-draft');
      } else {
        setSelectedTemplateId(TEMPLATES[0].id);
      }
      
      // Fetch active accounts for sender selection
      const fetchAccounts = async () => {
        const res = await getEmailAccounts();
        if (res.success && res.accounts) {
          setActiveAccounts(res.accounts.filter((a: any) => a.isActive));
        }
      };
      fetchAccounts();
    }
  }, [lead, isOpen]);

  // Anti-Spam Cooldown Timer
  useEffect(() => {
    if (!isOpen) return;
    
    const checkCooldown = () => {
      const lastSent = localStorage.getItem('lastEmailSentTime');
      if (lastSent) {
        const elapsed = Date.now() - parseInt(lastSent, 10);
        if (elapsed < 30000) {
          setCooldownRemaining(Math.ceil((30000 - elapsed) / 1000));
        } else {
          setCooldownRemaining(0);
        }
      }
    };
    
    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSending]); // Re-run when modal opens or after sending finishes

  // Compile template whenever variables or template selection changes
  useEffect(() => {
    if (!lead || !selectedTemplateId || selectedTemplateId === 'ai-draft') return;
    
    // For custom-draft, we don't compile placeholders if it's already compiled manually by user
    if (selectedTemplateId === 'custom-draft') {
      const activeTemplate = dynamicTemplates.find(t => t.id === 'custom-draft');
      if (activeTemplate) {
        setSubject(activeTemplate.subject);
        setBody(activeTemplate.body);
      }
      return;
    }

    const activeTemplate = dynamicTemplates.find(t => t.id === selectedTemplateId) || dynamicTemplates[0];
    
    const compile = (text: string) => {
      return text
        .replace(/{companyName}/g, companyName || lead.company_name || 'your company')
        .replace(/{contactName}/g, contactName || lead.contact_person || 'there')
        .replace(/{websiteUrl}/g, websiteUrl || lead.website_url || 'your website');
    };

    setSubject(compile(activeTemplate.subject));
    setBody(compile(activeTemplate.body));
  }, [selectedTemplateId, contactName, companyName, websiteUrl, lead, isOpen, dynamicTemplates]);

  if (!isOpen || !lead) return null;

  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    setErrorMessage(null);
    try {
      const result = await generateAIEmailDraft({
        company_name: lead.company_name,
        contact_person: lead.contact_person,
        targetService: lead.targetService,
        website_url: lead.website_url,
      });
      if (result.success && result.data) {
        setBody(result.data.body || '');
        setSubject(result.data.subject || `Quick question about ${companyName || lead.company_name}`);
        // Optionally reset template selection so it doesn't overwrite our AI text if fields change
        setSelectedTemplateId('ai-draft'); 
      } else {
        setErrorMessage(result.error || 'Failed to generate AI email');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error running AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSend = async () => {
    if (cooldownRemaining > 0) {
      playStatusSound('error');
      setErrorMessage(`Please wait ${cooldownRemaining} seconds to prevent spam.`);
      return;
    }
    if (!subject.trim()) {
      playStatusSound('error');
      setErrorMessage('Subject cannot be empty');
      return;
    }
    if (!body.trim()) {
      playStatusSound('error');
      setErrorMessage('Email body cannot be empty');
      return;
    }

    playStatusSound('loading');
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await sendOutreachEmail(lead._id, subject, body, selectedSenderId);
      if (response.success && response.data) {
        playStatusSound('success');
        setSuccessInfo({ isSimulated: !!response.isSimulated, sentVia: response.sentVia });
        
        // Record the time to enforce a 30s cooldown for the next email
        localStorage.setItem('lastEmailSentTime', Date.now().toString());
        setCooldownRemaining(30);

        // Let the state settle, then invoke callback and close
        setTimeout(() => {
          onEmailSent(response.data);
          onClose();
        }, 2000);
      } else {
        playStatusSound('error');
        setErrorMessage(response.error || 'Outreach email failed to dispatch.');
      }
    } catch (err: any) {
      console.error('Outreach modal dispatch error:', err);
      playStatusSound('error');
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
          className="relative w-full max-w-5xl h-[85vh] neu-flat rounded-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/5">
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
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white neu-pressed rounded-xl transition-all disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            
            {/* Left side: Configuration Panel */}
            <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 p-6 flex flex-col gap-8 overflow-y-auto">
              
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">
                  Select High-Converting Template
                </label>
                <div className="space-y-2">
                  {dynamicTemplates.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                          isSelected 
                            ? 'bg-slate-800 border-indigo-500/30 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.2)]' 
                            : 'neu-pressed border-transparent hover:border-indigo-500/20'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/20' : 'bg-slate-800/50'}`}>
                          {tmpl.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {tmpl.name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {tmpl.id === 'custom-draft' ? tmpl.subject : tmpl.subject.replace('{companyName}', companyName || lead.company_name)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">
                  Personalize Placeholders
                </label>
                
                <div className="neu-flat rounded-2xl p-4 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Contact Person ({'{contactName}'})
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full neu-pressed rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
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
                        className="w-full neu-pressed rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
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
                        className="w-full neu-pressed rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status information disclaimer */}
              <div className="mt-auto pt-4">
                <div className="flex gap-2.5 p-3.5 neu-pressed rounded-xl text-[11px] text-slate-400 leading-relaxed border border-indigo-500/10">
                  <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-purple-300">Outreach CRM Automation:</span> sending this email progresses lead status to <span className="font-semibold px-1 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400">Contacted</span> and archives this draft directly inside the activity timeline logs!
                  </div>
                </div>
              </div>

            </div>

            {/* Right side: Email Editor Panel */}
            <div className="w-full md:w-2/3 p-8 flex flex-col relative h-full overflow-y-auto">
              
              <div className="flex flex-col gap-5 mb-5 flex-shrink-0 relative z-20">
                <div className="flex items-center gap-4 text-sm neu-flat p-3 rounded-xl">
                  <div className="flex items-center gap-3 w-1/2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Recipient:</span>
                    <span className="font-semibold text-slate-800 dark:text-white truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-3 w-1/2 border-l border-slate-200 dark:border-white/5 pl-4">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap flex-shrink-0">Send From:</span>
                    <CustomSelect
                      value={selectedSenderId}
                      onChange={(val: string) => setSelectedSenderId(val)}
                      options={[
                        { value: 'auto', label: 'Auto-Rotate Pool (Recommended)' },
                        ...activeAccounts.map(acc => ({
                          value: acc._id,
                          label: `${acc.email} (${acc.accountType === 'smtp' ? 'Webmail' : 'Gmail'})`
                        }))
                      ]}
                      className="text-indigo-600 dark:text-indigo-400 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full neu-pressed rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-500"
                    placeholder="Enter an attention-grabbing subject..."
                  />
                </div>
              </div>

              {/* Email Body & Footer */}
              <div className="flex-1 flex flex-col neu-pressed rounded-2xl overflow-hidden relative z-10 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200/10 bg-transparent">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Message Draft</span>
                  <button 
                    onClick={handleAIGenerate}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Magic Draft
                  </button>
                </div>
                
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="flex-1 w-full bg-transparent p-5 text-sm text-slate-800 dark:text-slate-300 focus:outline-none resize-none placeholder-slate-500 leading-relaxed font-mono"
                  placeholder="Type your email message here..."
                />

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3.5 bg-rose-500/10 border-t border-rose-500/20 text-rose-400 text-xs"
                  >
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </motion.div>
                )}

                {/* Success Banner */}
                {successInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl mx-4 mb-4 mt-2"
                  >
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-green-500" />
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-300">Outreach Email Dispatched Successfully!</div>
                      <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                        {successInfo.isSimulated 
                          ? 'Simulated sandbox fallback: database timeline successfully updated. Lead status set to Contacted!'
                          : `Email successfully delivered via ${successInfo.sentVia || 'Email Account'}. CRM status progressed.`}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Control Action Buttons */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-slate-200/10 bg-transparent mt-auto">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Ready for delivery &bull; Rich logs auto-archived
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={onClose}
                      disabled={isSending}
                      className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors rounded-xl disabled:opacity-50 neu-button flex items-center justify-center min-w-[100px]"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleSend}
                      disabled={isSending || !!successInfo || cooldownRemaining > 0}
                      className="relative overflow-hidden group px-6 py-2.5 neu-button text-purple-400 font-black rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none min-w-[150px]"
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
                      ) : cooldownRemaining > 0 ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-orange-400" />
                          <span className="text-orange-400">Wait {cooldownRemaining}s</span>
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
