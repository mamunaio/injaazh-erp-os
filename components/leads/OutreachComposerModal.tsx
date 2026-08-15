'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Send, Loader2, Sparkles, Code, Search, AlertCircle, CheckCircle, Info, FileText, ChevronDown, Calendar, Plus, Trash2, Edit2, Save, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fromZonedTime } from 'date-fns-tz';
import { sendOutreachEmail, scheduleOutreachEmail, cancelOutreachSchedule, getLastSenderForLead } from '@/app/actions/leadActions';
import { getEmailAccounts } from '@/app/actions/emailAccountActions';
import { generateAIEmailDraft, generateAITemplateVariables } from '@/app/actions/aiActions';
import { getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/app/actions/emailTemplateActions';

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  subject: string;
  body: string;
  isDb?: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: 'hardwood',
    name: 'Hardwood Floor (Local SEO)',
    icon: <Search size={16} className="text-emerald-400" />,
    subject: 'hardwood floor search in {city} — who\'s showing up instead of you',
    body: `Hi {contactName},\n\nI just searched "{niche} {city}" on Google — and {competitor} is showing up on page 1.\n\n{companyName} wasn't there.\n\nThat's a real problem, because homeowners searching right now are calling whoever shows up first — not necessarily the best company.\n\nI work with flooring businesses to fix exactly this. Usually it comes down to a few specific things on the website and Google Business Profile that Google needs to see before it ranks a local business.\n\nWould a quick 10-minute call this week make sense? I can show you exactly where the gap is — no pitch, just the data.\n\n— Mamun\nInjaazh Global`
  },
  {
    id: 'epoxy',
    name: 'Epoxy Floor (Competitor)',
    icon: <Search size={16} className="text-emerald-400" />,
    subject: 'epoxy floor search in {city} — your competitors are getting your leads',
    body: `Hi {contactName},\n\nI searched "epoxy floor coating {city}" today — {competitor} came up first. {companyName} didn't appear until page 2 or later.\n\nBusiness owners searching for epoxy contractors rarely scroll past page 1. So right now, those leads are going to your competitors.\n\nThe fix is usually straightforward — the right content on your site, a few technical SEO adjustments, and your Google Business Profile optimized for your service area.\n\nI've helped flooring and coating contractors in similar markets rank on page 1 within 60–90 days.\n\nWorth a quick chat to see if it makes sense for you?\n\n— Mamun\nInjaazh Global`
  },
  {
    id: 'luxury-flooring',
    name: 'Luxury Flooring (High-End)',
    icon: <Sparkles size={16} className="text-yellow-400" />,
    subject: 'luxury flooring search in {city} — are you easy to find online?',
    body: `Hi {contactName},\n\nHomeowners looking for luxury vinyl plank or custom flooring in {city} are searching Google before they call anyone.\n\nI looked up "{niche} {city}" — and {competitor} is the first name they're seeing. Not {companyName}.\n\nHigh-end flooring buyers do their research online first. If your website isn't showing up when they search, you're losing the consultation before it ever happens.\n\nI help premium flooring companies show up where their buyers are looking — with SEO and a website that builds trust before the first call.\n\nOpen to a quick conversation this week?\n\n— Mamun\nInjaazh Global`
  },
  {
    id: 'commercial-flooring',
    name: 'Commercial Flooring Leads',
    icon: <Search size={16} className="text-blue-500" />,
    subject: 'commercial flooring leads in {city} — are they finding you?',
    body: `Hi {contactName},\n\nProperty managers and business owners in {city} searching for commercial flooring contractors go straight to Google.\n\nI searched "{niche} {city}" — and right now, {competitor} is the first result. {companyName} isn't on page 1.\n\nCommercial flooring projects are high-value. One missed lead from a restaurant chain or property management company is a significant loss.\n\nI help commercial flooring contractors rank on page 1 for the searches their buyers are already doing — through targeted SEO and a website built to convert.\n\nWould it make sense to talk for 10 minutes this week?\n\n— Mamun\nInjaazh Global`
  },
  {
    id: 'local-flooring',
    name: 'General Flooring (Local)',
    icon: <Search size={16} className="text-orange-400" />,
    subject: 'flooring search near {city} — a quick observation',
    body: `Hi {contactName},\n\nMost people searching for a flooring company in {city} type "flooring company near me" or "best flooring store in {city}" — and they call whoever shows up first.\n\nRight now, {competitor} is that first result. {companyName} isn't showing up at the top.\n\nThis is almost always fixable — and the businesses that fix it first tend to pull significantly more local calls.\n\nI specialize in local SEO for flooring companies. Happy to take a look at your current online presence and tell you exactly what's holding the ranking back — no cost for the initial look.\n\nWould that be useful?\n\n— Mamun\nInjaazh Global`
  }
];

// Helper to play sounds
const playStatusSound = (type: 'success' | 'error' | 'loading') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gainNode); gainNode.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gainNode); gainNode.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'loading') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gainNode); gainNode.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

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
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) setIsOpen(false);
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
            className={`absolute z-[100] w-full min-w-[280px] right-0 neu-flat rounded-2xl py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/5 overflow-hidden ${dropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          >
            {options.map((opt: any) => (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 text-[11px] font-semibold cursor-pointer transition-all border-l-2 truncate ${
                  value === opt.value 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 font-bold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
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
  const [dbTemplates, setDbTemplates] = useState<Template[]>([]);
  const [isFetchingTemplates, setIsFetchingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'composer' | 'templates'>('composer');

  const dynamicTemplates = React.useMemo(() => {
    let result = [...dbTemplates, ...TEMPLATES];
    if (lead && lead.email_draft) {
      result = [
        {
          id: 'custom-draft',
          name: 'Draft (Queued)',
          icon: <FileText size={16} className="text-orange-400" />,
          subject: lead.email_subject_draft || 'Custom Subject',
          body: lead.email_draft
        },
        ...result
      ];
    }
    return result;
  }, [lead, dbTemplates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
    // Editable fields for dynamic replacement
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // Custom dynamic template variables
    const [customVars, setCustomVars] = useState<Record<string, string>>({});
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);
  const [aiReviewNeeded, setAiReviewNeeded] = useState<string[]>([]);
  
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
  const [lastUsedAccountId, setLastUsedAccountId] = useState<string | null>(null);
  
  // Anti-Spam Cooldown & Scheduling State
  const [scheduleTime, setScheduleTime] = useState<Date | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

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

  const fetchTemplates = async () => {
    setIsFetchingTemplates(true);
    const res = await getEmailTemplates();
    if (res.success && res.templates) {
      const mapped = res.templates.map((t: any) => ({
        id: t._id.toString(),
        name: t.name,
        subject: t.subject,
        body: t.body,
        icon: <FileText size={16} className="text-indigo-400" />,
        isDb: true
      }));
      setDbTemplates(mapped);
    }
    setIsFetchingTemplates(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  // Initialize and update fields when lead changes or modal opens
  useEffect(() => {
    if (lead && isOpen) {
      setContactName(lead.contact_person || 'there');
      setCompanyName(lead.company_name || 'your company');
      setWebsiteUrl(lead.website_url || 'your website');
      setSuccessInfo(null);
      setErrorMessage(null);
      
      const draftTemplateId = lead.email_draft ? 'custom-draft' : TEMPLATES[0].id;
      setSelectedTemplateId(draftTemplateId); setHasManuallyEdited(false);
      
      if (lead.outreach_scheduled_for && new Date(lead.outreach_scheduled_for) > new Date()) {
        setScheduleTime(new Date(lead.outreach_scheduled_for));
      } else {
        setScheduleTime(null);
      }
      
      if (lead.email_draft) {
        setSubject(lead.email_subject_draft || 'Custom Subject');
        setBody(lead.email_draft);
      } else {
        const activeTemplate = TEMPLATES[0];
        const compile = (text: string) => {
          return text
            .replace(/{companyName}/g, lead.company_name || 'your company')
            .replace(/{contactName}/g, lead.contact_person || 'there')
            .replace(/{websiteUrl}/g, lead.website_url || 'your website');
        };
        setSubject(compile(activeTemplate.subject));
        setBody(compile(activeTemplate.body));
      }
      
      const fetchAccounts = async () => {
        const res = await getEmailAccounts();
        if (res.success && res.accounts) {
          const active = res.accounts.filter((a: any) => a.isActive);
          setActiveAccounts(active);

          // Pre-select the account used for the last email to this lead
          let assignedAccountId = null;
          if (lead._id) {
            const lastSender = await getLastSenderForLead(lead._id.toString());
            if (lastSender.success && lastSender.accountId) {
              // Only pre-select if that account is still active
              const stillActive = active.find((a: any) => a._id.toString() === lastSender.accountId);
              if (stillActive) {
                assignedAccountId = lastSender.accountId;
                setLastUsedAccountId(lastSender.accountId);
              }
            }
          }
          
          if (!assignedAccountId) {
            setLastUsedAccountId(null);
          }
          
          if (!assignedAccountId && active.length > 0) {
            // Replicate backend rotation: pick active account with lowest usage
            const lowestUsage = active.reduce((prev: any, curr: any) => (prev.sentToday < curr.sentToday ? prev : curr));
            assignedAccountId = lowestUsage._id.toString();
          }

          setSelectedSenderId(assignedAccountId || 'auto');
        }
      };
      fetchAccounts();
    }
  }, [lead, isOpen]);


    const detectedVariables = React.useMemo(() => {
    if (!selectedTemplateId || selectedTemplateId === 'ai-draft' || selectedTemplateId === 'custom-draft') return [];
    const activeTemplate = dynamicTemplates.find(t => t.id === selectedTemplateId);
    if (!activeTemplate) return [];
    const fullText = activeTemplate.subject + ' ' + activeTemplate.body;
    const matches = fullText.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    
    // Remove brackets, filter out defaults, and deduplicate
    const vars = matches.map(m => m.slice(1, -1));
    const defaults = ['contactName', 'companyName', 'websiteUrl'];
    return Array.from(new Set(vars.filter(v => !defaults.includes(v))));
  }, [selectedTemplateId, dynamicTemplates]);

  // Compile template whenever template selection changes
  useEffect(() => {
    if (!lead || !selectedTemplateId || selectedTemplateId === 'ai-draft' || !isOpen) return;
    
    if (selectedTemplateId === 'custom-draft') {
      const activeTemplate = dynamicTemplates.find(t => t.id === 'custom-draft');
      if (activeTemplate && !hasManuallyEdited) {
        setSubject(activeTemplate.subject);
        setBody(activeTemplate.body);
      }
      return;
    }

    const activeTemplate = dynamicTemplates.find(t => t.id === selectedTemplateId) || dynamicTemplates[0];
    
    const compile = (text: string) => {
      let compiled = text
        .replace(/\{companyName\}/g, companyName || lead.company_name || 'your company')
        .replace(/\{contactName\}/g, contactName || lead.contact_person || 'there')
        .replace(/\{websiteUrl\}/g, websiteUrl || lead.website_url || 'your website');
        
      detectedVariables.forEach(v => {
        const regex = new RegExp(`\\{${v}\\}`, 'g');
        compiled = compiled.replace(regex, customVars[v] || `[${v}]`);
      });
      
      return compiled;
    };

    if (!hasManuallyEdited) {
      setSubject(compile(activeTemplate.subject));
      setBody(compile(activeTemplate.body));
    }
  }, [selectedTemplateId, dynamicTemplates, companyName, contactName, websiteUrl, customVars, hasManuallyEdited, detectedVariables]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !subject.trim() || !body.trim()) {
      setErrorMessage('Template name, subject, and body are required.');
      return;
    }
    setIsSavingTemplate(true);
    setErrorMessage(null);
    try {
      if (editingTemplateId) {
        await updateEmailTemplate(editingTemplateId, { name: templateName, subject, body });
      } else {
        await createEmailTemplate({ name: templateName, subject, body });
      }
      await fetchTemplates();
      setIsTemplateModalOpen(false);
      setTemplateName('');
      setEditingTemplateId(null);
      playStatusSound('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteEmailTemplate(id);
      await fetchTemplates();
      if (selectedTemplateId === id) {
        setSelectedTemplateId(TEMPLATES[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete template');
    }
  };



    const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    setErrorMessage(null);
    setAiReviewNeeded([]);
    try {
      if (detectedVariables.length > 0) {
        // AI Dynamic Variables Mode
        const activeTemplate = dynamicTemplates.find(t => t.id === selectedTemplateId) || dynamicTemplates[0];
        const templateContext = activeTemplate.subject + "\n\n" + activeTemplate.body;
        
        const result = await generateAITemplateVariables(lead, detectedVariables, templateContext);
        if (result.success && result.data) {
          const generatedVars = result.data;
          const newVars = { ...customVars };
          const needsReview: string[] = [];
          
          Object.keys(generatedVars).forEach(key => {
            if (generatedVars[key] === '[NEEDS REVIEW]' || generatedVars[key].includes('REVIEW')) {
              newVars[key] = ''; // Leave it blank or generic so user sees it
              needsReview.push(key);
            } else {
              newVars[key] = generatedVars[key];
              needsReview.push(key); // Mark everything generated by AI as needs review for safety
            }
          });
          
          setCustomVars(newVars);
          setAiReviewNeeded(needsReview);
          playStatusSound('success');
        } else {
          setErrorMessage(result.error || 'Failed to generate AI variables');
        }
      } else {
        // Legacy Generic Email Mode
        const result = await generateAIEmailDraft({
          company_name: lead.company_name,
          contact_person: lead.contact_person,
          targetService: lead.targetService,
          website_url: lead.website_url,
        });
        if (result.success && result.data) {
          setBody(result.data.body || '');
          setSubject(result.data.subject || `Quick question about ${companyName || lead.company_name}`);
          setSelectedTemplateId('ai-draft'); 
        } else {
          setErrorMessage(result.error || 'Failed to generate AI email');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error running AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      playStatusSound('error');
      setErrorMessage('Subject and body cannot be empty');
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
        setTimeout(() => {
          onEmailSent(response.data);
          onClose();
        }, 2000);
      } else {
        playStatusSound('error');
        setErrorMessage(response.error || 'Outreach email failed to dispatch.');
      }
    } catch (err: any) {
      playStatusSound('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!subject || !body || !scheduleTime) {
      setErrorMessage('Subject, Body and Schedule Time are required.');
      return;
    }
    playStatusSound('loading');
    setIsScheduling(true);
    setErrorMessage(null);
    try {
      const y = scheduleTime.getFullYear();
      const m = String(scheduleTime.getMonth() + 1).padStart(2, '0');
      const d = String(scheduleTime.getDate()).padStart(2, '0');
      const h = String(scheduleTime.getHours()).padStart(2, '0');
      const min = String(scheduleTime.getMinutes()).padStart(2, '0');
      const sec = String(scheduleTime.getSeconds()).padStart(2, '0');
      
      const timeString = `${y}-${m}-${d} ${h}:${min}:${sec}`;
      const utcDate = fromZonedTime(timeString, 'Asia/Dhaka');

      const response = await scheduleOutreachEmail(lead._id, subject, body, utcDate.toISOString());
      if (response.success && response.data) {
        playStatusSound('success');
        setSuccessInfo({ isSimulated: false, sentVia: 'Queued for later' });
        setTimeout(() => {
          onEmailSent(response.data);
          onClose();
        }, 2000);
      } else {
        playStatusSound('error');
        setErrorMessage(response.error || 'Outreach email failed to schedule.');
      }
    } catch (err: any) {
      playStatusSound('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    playStatusSound('loading');
    setIsScheduling(true);
    try {
      const response = await cancelOutreachSchedule(lead._id);
      if (response.success && response.data) {
        playStatusSound('success');
        setScheduleTime(null);
        setSuccessInfo({ isSimulated: false, sentVia: 'Schedule Removed' });
        setTimeout(() => {
          onEmailSent(response.data);
          onClose();
        }, 1500);
      } else {
        playStatusSound('error');
        setErrorMessage(response.error || 'Failed to remove schedule.');
      }
    } catch (err: any) {
      playStatusSound('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && lead && (
          <div key="main-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Glass backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md"
          onClick={(e) => { e.stopPropagation(); if (!isSending) onClose(); }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white dark:bg-[#11131A] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#232734] overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[800px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* SIDEBAR: Templates List (Hidden on mobile by default) */}
          <div className={`w-full md:w-72 flex flex-col bg-slate-50 dark:bg-[#09090B] border-r border-slate-200 dark:border-[#232734] ${activeTab === 'templates' ? 'block' : 'hidden md:flex'}`}>
            <div className="p-4 border-b border-slate-200 dark:border-[#232734] flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" />
                Templates
              </h3>
              <button 
                onClick={() => {
                  setTemplateName('');
                  setEditingTemplateId(null);
                  setIsTemplateModalOpen(true);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors"
                title="Create Template"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {isFetchingTemplates ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1 uppercase tracking-wider">Your Templates</div>
                  {dbTemplates.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-slate-500 dark:text-slate-500 italic">No custom templates yet.</div>
                  ) : (
                    dbTemplates.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => { setSelectedTemplateId(t.id); setActiveTab('composer'); }}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                          selectedTemplateId === t.id 
                            ? 'bg-indigo-500/10 border-indigo-500/30' 
                            : 'bg-white dark:bg-[#11131A] border-slate-200 dark:border-[#232734] hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            selectedTemplateId === t.id ? 'bg-indigo-500/20 text-indigo-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                          }`}>
                            {t.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-[13px] font-bold truncate ${
                              selectedTemplateId === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                            }`}>{t.name}</h4>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{t.subject}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateName(t.name);
                              setSubject(t.subject);
                              setBody(t.body);
                              setEditingTemplateId(t.id);
                              setIsTemplateModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteTemplate(t.id, e)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 py-1 mt-6 uppercase tracking-wider">Default Templates</div>
                  {dynamicTemplates.filter(t => !t.isDb).map(t => (
                    <div 
                      key={t.id}
                      onClick={() => { setSelectedTemplateId(t.id); setActiveTab('composer'); }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        selectedTemplateId === t.id 
                          ? 'bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20' 
                          : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-[#11131A] hover:border-slate-200 dark:hover:border-[#232734]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-white/5 text-slate-500">
                        {t.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-[13px] font-bold truncate ${
                          selectedTemplateId === t.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}>{t.name}</h4>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {/* Mobile Tab Switcher */}
            <div className="md:hidden p-4 border-t border-slate-200 dark:border-[#232734]">
              <button 
                onClick={() => setActiveTab('composer')}
                className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl"
              >
                Back to Composer
              </button>
            </div>
          </div>

          {/* MAIN COMPOSER */}
          <div className={`flex-1 flex flex-col ${activeTab === 'composer' ? 'block' : 'hidden md:flex'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Mail size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Compose Outreach</h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>To: <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.email}</span></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>From: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeAccounts.find(a => a._id.toString() === selectedSenderId)?.email || 'Auto Select'}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile tab toggle */}
                <button 
                  onClick={() => setActiveTab('templates')}
                  className="md:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <FileText size={18} />
                </button>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50 dark:bg-[#09090B]/50">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Variables & Sender Section */}
                <div className="neu-flat p-4 rounded-2xl border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Contact Name <span className="text-indigo-400 font-normal">{"{contactName}"}</span></label>
                      <input 
                        type="text" 
                        value={contactName} 
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Company Name <span className="text-indigo-400 font-normal">{"{companyName}"}</span></label>
                      <input 
                        type="text" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Website URL <span className="text-indigo-400 font-normal">{"{websiteUrl}"}</span></label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={websiteUrl} 
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        />
                        {websiteUrl && (
                          <a 
                            href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Visit Website"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Send From Account</label>
                      <CustomSelect 
                        value={selectedSenderId} 
                        onChange={setSelectedSenderId} 
                        options={activeAccounts.map(a => {
                          const isLastUsed = a._id.toString() === lastUsedAccountId;
                          return { 
                            value: a._id.toString(), 
                            label: `${a.email} (${a.sentToday}/${a.dailyLimit} sent)${isLastUsed ? ' - Last Used (Follow-up)' : ''}` 
                          };
                        })}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                  </div>
                </div>



                {/* Composer Form */}
                <div className="space-y-4 pb-4">
                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
                      <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">{errorMessage}</p>
                    </motion.div>
                  )}

                  {successInfo && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-green-50 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/20 flex items-start gap-3">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-700 dark:text-emerald-400">Successfully sent!</p>
                        <p className="text-[11px] text-green-600/80 dark:text-emerald-400/80 font-medium">Via: {successInfo.sentVia}{successInfo.isSimulated && ' (Simulated Sandbox Mode)'}</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Subject Line</label>
                    <input 
                      type="text" 
                      value={subject} 
                      onChange={(e) => { setSubject(e.target.value); setHasManuallyEdited(true); }}
                      placeholder="e.g. Quick question about..."
                      className="w-full neu-flat bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Body</label>
                      <button
                        onClick={() => {
                          setTemplateName('');
                          setEditingTemplateId(null);
                          setIsTemplateModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                      >
                        <Save size={12} /> Save as template
                      </button>
                    </div>
                    <textarea 
                      value={body} 
                      onChange={(e) => { setBody(e.target.value); setHasManuallyEdited(true); }}
                      placeholder="Write your email here..."
                      className="w-full flex-1 min-h-[250px] neu-flat bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-4 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y leading-relaxed font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <DatePicker
                    selected={scheduleTime}
                    onChange={(date: Date | null) => setScheduleTime(date)}
                    showTimeInput
                    dateFormat="MMM d, yyyy h:mm aa"
                    placeholderText="Select date & time"
                    minDate={new Date()}
                    className="w-[180px] text-xs font-bold bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 focus:border-indigo-500/50 outline-none"
                    wrapperClassName="date-picker-wrapper"
                  />
                  <button
                    onClick={handleSchedule}
                    disabled={isScheduling || isSending || !scheduleTime}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-[#232734] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isScheduling ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                    {lead?.outreach_status === 'Queued' ? 'Update Schedule' : 'Schedule'}
                  </button>
                  {lead?.outreach_status === 'Queued' && (
                    <button
                      onClick={handleCancelSchedule}
                      disabled={isScheduling || isSending}
                      className="px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold rounded-xl text-xs flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Remove Schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={isSending || isScheduling}
                  className="hidden sm:flex px-6 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-200 dark:bg-[#232734] border border-slate-200 dark:border-[#232734] transition-colors rounded-xl disabled:opacity-50 items-center justify-center"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSend}
                  disabled={isSending || isScheduling || !!successInfo}
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.25)] min-w-[130px]"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : successInfo ? (
                    <>
                      <CheckCircle size={14} className="animate-bounce" />
                      <span>Sent!</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
        )}
      </AnimatePresence>
      {/* Mini Modal for Saving Template */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div key="mini-modal" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSavingTemplate && setIsTemplateModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#11131A] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#232734] p-5"
            >
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <Save size={18} className="text-indigo-500" />
                {editingTemplateId ? 'Update Template' : 'Save as Template'}
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Template Name</label>
                  <input 
                    type="text" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., SEO Follow Up"
                    autoFocus
                    className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  disabled={isSavingTemplate}
                  className="flex-1 py-2.5 font-bold text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate || !templateName.trim()}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSavingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingTemplateId ? 'Update' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
