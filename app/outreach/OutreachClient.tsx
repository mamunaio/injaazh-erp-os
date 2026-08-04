'use client';

import React, { useState, useMemo } from 'react';
import {
  Mail, Send, Activity, MessageSquare, CheckCircle, Clock, AlertCircle,
  Sparkles, User, Building2, Globe, Phone, ExternalLink, Plus, RefreshCw,
  Search, Filter, X, ChevronRight, ChevronDown, Save, Calendar, ArrowUpRight,
  ArrowDownRight, Inbox, LayoutList, StickyNote, Zap, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createProposal } from '@/app/actions/proposalActions';
import { updateLead, sendOutreachEmail } from '@/app/actions/leadActions';
import { syncInboxesAction } from '@/app/actions/outreachAutomationActions';
import { getEmailAccounts } from '@/app/actions/emailAccountActions';
import { notify } from '@/lib/notify';

interface OutreachClientProps {
  initialLeads: any[];
  initialAnalytics: any;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { text: string; dot: string; bg: string; border: string }> = {
  'New':            { text: 'text-[#2563EB]', dot: 'bg-[#2563EB]', bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]/20' },
  'Email Sent':      { text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  'Replied':        { text: 'text-[#10B981]', dot: 'bg-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20' },
  'Meeting Booked': { text: 'text-[#0EA5E9]', dot: 'bg-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20' },
  'Closed':         { text: 'text-[#10B981]', dot: 'bg-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20' },
  'Not Interested': { text: 'text-[#EF4444]', dot: 'bg-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20' },
};
function getStatus(s: string) { return STATUS_STYLE[s] ?? STATUS_STYLE['New']; }

// ─── Log method config ────────────────────────────────────────────────────────
const LOG_STYLE: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Email':    { color: '#2563EB', bg: 'rgba(37,99,235,0.12)',   icon: Mail },
  'WhatsApp': { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  icon: MessageSquare },
  'Phone':    { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: Phone },
  'Note':     { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: StickyNote },
  'Facebook': { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)',  icon: Globe },
};
function getLogStyle(method: string) { return LOG_STYLE[method] ?? LOG_STYLE['Note']; }

// ─── Avatar initials helper ────────────────────────────────────────────────────
function getInitials(name: string) {
  if (!name) return '??';
  return name.substring(0, 2).toUpperCase();
}

// ─── Deterministic avatar color (same logic as original getAvatarGradient) ────
function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 55%) 0%, hsl(${h2}, 80%, 45%) 100%)`;
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}
function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(d));
}

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } }
};

export default function OutreachClient({ initialLeads, initialAnalytics }: OutreachClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);

  React.useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // ── Preserved business logic state ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'inbox' | 'pipeline'>('inbox');
  const [visibleCount, setVisibleCount] = useState(20);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [readLeads, setReadLeads] = useState<string[]>([]);
  const [isCreatingProposalFor, setIsCreatingProposalFor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'timeline' | 'email' | 'whatsapp' | 'call'>('timeline');
  const [logNote, setLogNote] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappBody, setWhatsappBody] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [senderAccountId, setSenderAccountId] = useState<string>('auto');
  const [isSenderDropdownOpen, setIsSenderDropdownOpen] = useState(false);

  React.useEffect(() => {
    getEmailAccounts().then(res => {
      if (res.success && res.accounts) {
        setEmailAccounts(res.accounts.filter((a: any) => a.isActive));
      }
    });
  }, []);

  React.useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, searchQuery, statusFilter]);

  // ── Preserved handlers (100% unchanged logic) ────────────────────────────────
  const handleSyncInboxes = async () => {
    setIsSyncing(true);
    try {
      const result = await syncInboxesAction();
      if (result.success) {
        notify.success('Inboxes synced successfully!');
        router.refresh();
      } else {
        notify.error(result.error || 'Failed to sync inboxes');
      }
    } catch (e) {
      notify.error('An error occurred while syncing inboxes');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateProposal = async (lead: any) => {
    setIsCreatingProposalFor(lead._id);
    try {
      const result = await createProposal({
        clientName: lead.company_name,
        title: `Proposal for ${lead.targetService || 'Custom Service'}`,
      });
      if (result.success && result.data) { router.push(`/proposals/${result.data._id}`); }
      else { notify.error('Failed to create proposal.'); }
    } catch (error) {
      console.error(error);
      notify.error('Error creating proposal.');
    } finally { setIsCreatingProposalFor(null); }
  };

  const analytics = initialAnalytics || {
    totalSent: 0, totalReplies: 0, totalDailyQuota: 0, totalSentToday: 0, queuedCount: 0,
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (activeTab === 'inbox') {
        if (!lead.is_replied) return false;
      } else {
        if (lead.is_replied) return false;
        if (lead.outreach_status === 'Closed' || lead.outreach_status === 'Not Interested') return false;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isScheduledForFuture = lead.outreach_scheduled_for && new Date(lead.outreach_scheduled_for) >= today;
        const isFollowUpDue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) >= today;
        if (!isScheduledForFuture && !isFollowUpDue && lead.outreach_status !== 'Email Sent') return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const company = (lead.company_name || '').toLowerCase();
        const person = (lead.contact_person || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        if (!company.includes(q) && !person.includes(q) && !email.includes(q)) return false;
      }
      if (statusFilter !== 'All' && lead.outreach_status !== statusFilter) return false;
      return true;
    }).sort((a, b) => {
      if (activeTab === 'inbox') {
        const dateA = a.last_contacted_date ? new Date(a.last_contacted_date).getTime() : 0;
        const dateB = b.last_contacted_date ? new Date(b.last_contacted_date).getTime() : 0;
        return dateB - dateA;
      } else {
        const dateA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : Infinity;
        const dateB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : Infinity;
        return dateA - dateB;
      }
    });
  }, [leads, activeTab, searchQuery, statusFilter]);

  const selectedLead = useMemo(() => leads.find(l => l._id === selectedLeadId) || null, [leads, selectedLeadId]);

  React.useEffect(() => {
    if (selectedLead) {
      setEmailSubject(selectedLead.email_subject_draft || '');
      setEmailBody(selectedLead.email_draft || '');
      setWhatsappBody(selectedLead.facebook_draft || '');
      // Fetch the last sender from backend
      if (emailAccounts.length > 0) {
        import('@/app/actions/leadActions').then(({ getLastSenderForLead }) => {
          getLastSenderForLead(selectedLead._id).then((res) => {
            if (res.success && res.accountId) {
              setSenderAccountId(res.accountId);
            } else {
              setSenderAccountId('auto');
            }
          });
        });
      }      
      // Mark as read locally so the blue dot disappears
      if (!readLeads.includes(selectedLead._id)) {
        setReadLeads(prev => [...prev, selectedLead._id]);
      }
    }
  }, [selectedLead, emailAccounts]);

  const handleSaveDrafts = async () => {
    if (!selectedLead) return;
    setIsSavingDraft(true);
    try {
      const res = await updateLead(selectedLead._id, {
        email_subject_draft: emailSubject, email_draft: emailBody, facebook_draft: whatsappBody
      });
      if (res.success) {
        setLeads(leads.map(l => l._id === selectedLead._id ? { ...l, email_subject_draft: emailSubject, email_draft: emailBody, facebook_draft: whatsappBody } : l));
        notify.success('Drafts saved');
      } else { notify.error('Failed to save drafts'); }
    } catch (e) { notify.error('Error saving drafts'); }
    finally { setIsSavingDraft(false); }
  };

  const handleSendEmail = async () => {
    if (!selectedLead || !emailBody.trim()) return;
    setIsSending(true);
    try {
      // First save the draft
      await updateLead(selectedLead._id, { email_subject_draft: emailSubject, email_draft: emailBody });
      
      const res = await sendOutreachEmail(selectedLead._id, emailSubject, emailBody, senderAccountId);
      if (res.success) {
        notify.mailSend('Reply Sent! Your email was successfully delivered.');
        
        setLeads(leads.map(l => {
          if (l._id === selectedLead._id) {
            const newStatus = (l.outreach_status === 'New' || l.outreach_status === 'Queued') ? 'Email Sent' : l.outreach_status;
            return { ...l, outreach_status: newStatus, is_replied: false };
          }
          return l;
        }));
      } else {
        notify.error(res.error || 'Failed to send email');
      }
    } catch (e: any) {
      notify.error('Error sending email');
    } finally {
      setIsSending(false);
    }
  };

  const handleAddLog = async (method: 'Phone' | 'Note') => {
    if (!selectedLead || !logNote.trim()) return;
    setIsLogging(true);
    try {
      const newLog = { date: new Date(), method, notes: logNote };
      const res = await updateLead(selectedLead._id, { outreach_logs: [newLog, ...(selectedLead.outreach_logs || [])] });
      if (res.success && res.data) {
        setLeads(leads.map(l => l._id === selectedLead._id ? res.data : l));
        setLogNote('');
        notify.success('Log added');
      } else { notify.error('Failed to add log'); }
    } catch (e) { notify.error('Error adding log'); }
    finally { setIsLogging(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedLead) return;
    try {
      const res = await updateLead(selectedLead._id, { outreach_status: newStatus });
      if (res.success && res.data) {
        setLeads(leads.map(l => l._id === selectedLead._id ? res.data : l));
        notify.success(`Status updated to ${newStatus}`);
      }
    } catch (e) { notify.error('Error updating status'); }
  };

  // ── Derived KPI data ──────────────────────────────────────────────────────
  const followUpsDue = leads.filter(l => {
    if (!l.nextFollowUpDate) return false;
    const today = new Date(); today.setHours(23, 59, 59, 999);
    return new Date(l.nextFollowUpDate) <= today;
  }).length;

  const replyRate = analytics.totalSent > 0
    ? Math.round((analytics.totalReplies / analytics.totalSent) * 100)
    : 0;

  const quotaPct = analytics.totalDailyQuota > 0
    ? Math.min(100, Math.round((analytics.totalSentToday / analytics.totalDailyQuota) * 100))
    : 0;

  const STATUS_OPTIONS = ['All', 'New', 'Email Sent', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'];

  const detailTabs = [
    { id: 'timeline' as const, label: 'Timeline', icon: Activity },
    { id: 'email'    as const, label: 'Email',    icon: Mail },
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
    { id: 'call'     as const, label: 'Log',      icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Send size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Sales</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Outreach</h1>
              <p className="text-sm font-medium text-[#94A3B8]">
                Monitor campaigns, track quotas and respond to hot leads.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleSyncInboxes}
                disabled={isSyncing}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-[#11131A] text-[#94A3B8] border border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white hover:border-slate-200 dark:border-[#232734] transition-all disabled:opacity-50"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing…' : 'Sync Inboxes'}
              </button>
              <button onClick={() => router.push('/prospects')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> New Outreach
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
            {[
              { label: 'Emails Sent',    value: analytics.totalSent,       color: '#2563EB', trend: '+12%', up: true },
              { label: 'Hot Replies',    value: analytics.totalReplies,     color: '#10B981', trend: '+5%',  up: true },
              { label: 'Queued',         value: analytics.queuedCount,      color: '#F59E0B', trend: '0',    up: true },
              { label: 'Follow-ups Due', value: followUpsDue,               color: '#EF4444', trend: String(followUpsDue), up: false },
              { label: 'Reply Rate',     value: `${replyRate}%`,            color: '#7C3AED', trend: '+2%',  up: true },
              { label: 'Quota Remaining',value: <>{Math.max(0, analytics.totalDailyQuota - analytics.totalSentToday)}<span className="text-[20px] opacity-40 font-medium tracking-normal ml-1">/ {analytics.totalDailyQuota}</span></>, color: '#0EA5E9', trend: `${quotaPct}%`, up: true },
            ].map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="relative neu-flat rounded-[24px] p-5 cursor-pointer group transition-all overflow-hidden shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none"
              >
                {/* Top Edge Glow */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-300 rounded-b-full pointer-events-none"
                  style={{ backgroundColor: k.color, boxShadow: `0 4px 15px ${k.color}` }}
                />
                {/* Background Icon */}
                <div className="absolute -right-2 -bottom-4 opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                  {k.label === 'Hot Replies' && <Sparkles size={90} style={{ color: k.color }} />}
                  {k.label === 'Emails Sent' && <Send size={90} style={{ color: k.color }} />}
                  {k.label === 'Quota Remaining' && <Target size={90} style={{ color: k.color }} />}
                  {k.label === 'Follow-ups Due' && <AlertCircle size={90} style={{ color: k.color }} />}
                  {k.label === 'Queued' && <Clock size={90} style={{ color: k.color }} />}
                  {k.label === 'Reply Rate' && <Activity size={90} style={{ color: k.color }} />}
                </div>

                <div className="relative z-10 flex items-start justify-between mb-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${k.up ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                    {k.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {k.trend}
                  </span>
                </div>
                <p className="relative z-10 text-3xl font-bold font-mono tracking-tight" style={{ color: k.color }}>{k.value}</p>
                {k.label === 'Quota Remaining' && (
                  <div className="relative z-10 mt-3 h-1.5 bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, 100 - quotaPct)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB]" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Master-Detail Split ───────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-280px)] min-h-[500px]">

          {/* ── LEFT PANE: Contact List ──────────────────────────────────────── */}
          <div className={`flex flex-col neu-flat rounded-[24px] overflow-hidden shadow-sm dark:shadow-none ${selectedLeadId ? 'hidden lg:flex lg:w-[320px] xl:w-[360px] flex-shrink-0' : 'w-full lg:w-[360px] flex-shrink-0'}`}>

            {/* Tabs */}
            <div className="flex bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md">
              <button
                onClick={() => { setActiveTab('inbox'); setSelectedLeadId(null); }}
                className={`relative flex-1 py-4 flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest transition-all ${activeTab === 'inbox' ? 'bg-white dark:bg-[#2563EB]/5 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#232734]/30'}`}
              >
                <Inbox size={15} />
                Hot Inbox
                <span className="px-2 py-0.5 rounded-[8px] bg-[#10B981]/10 text-[#10B981] text-[11px] font-bold border border-[#10B981]/20">
                  {leads.filter(l => l.is_replied).length}
                </span>
                {activeTab === 'inbox' && (
                  <motion.div layoutId="outreachTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.5)]" />
                )}
              </button>
              <button
                onClick={() => { setActiveTab('pipeline'); setSelectedLeadId(null); }}
                className={`relative flex-1 py-4 flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'bg-white dark:bg-[#2563EB]/5 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#232734]/30'}`}
              >
                <Target size={15} />
                Pipeline
                {activeTab === 'pipeline' && (
                  <motion.div layoutId="outreachTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.5)]" />
                )}
              </button>
            </div>

            {/* Search */}
            <div className="p-3 bg-white dark:bg-[#0a0a0b]">
              <div className="relative group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search contacts…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111111] border-none text-slate-900 dark:text-white placeholder-[#94A3B8]/60 text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 transition-all shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Status filter pills */}
            <div className="px-4 py-3 bg-white dark:bg-[#0a0a0b] flex gap-2 overflow-x-auto scrollbar-none">
              {['All', 'New', 'Email Sent', 'Replied', 'Meeting Booked'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-slate-50 dark:bg-[#111111] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1a1a1a]'}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredLeads.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-[#94A3B8] text-center px-4">
                  <div className="w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-3">
                    <Inbox size={20} className="text-slate-400 dark:text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No results</p>
                  <p className="text-xs">Adjust your filters or search term.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredLeads.slice(0, visibleCount).map((lead, i) => {
                    const isSelected = selectedLeadId === lead._id;
                    const ss = getStatus(lead.outreach_status);
                    return (
                      <motion.button
                        key={lead._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.025, type: 'spring', stiffness: 320, damping: 28 }}
                        onClick={() => setSelectedLeadId(lead._id)}
                        className={`w-full text-left p-3 rounded-[14px] flex items-start gap-3 transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-transparent dark:bg-transparent hover:bg-slate-50 dark:hover:bg-[#111111]'}`}
                        style={isSelected ? { borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: '#3b82f6' } : { borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: 'transparent' }}
                      >
                        <div
                          style={{ background: getAvatarGradient(lead.company_name || '?') }}
                          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-slate-900 dark:text-white text-xs font-bold flex-shrink-0 shadow-md"
                        >
                          {getInitials(lead.company_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-2 truncate">
                              <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 truncate">{lead.company_name}</p>
                              {activeTab === 'inbox' && lead.is_replied && !readLeads.includes(lead._id) && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] flex-shrink-0" />}
                            </div>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${ss.bg} ${ss.border} ${ss.text}`}>
                              <span className={`w-1 h-1 rounded-full ${ss.dot}`} />
                              {lead.outreach_status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 font-medium truncate">{lead.contact_person || lead.email}</p>
                          {activeTab === 'pipeline' && lead.nextFollowUpDate && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-500/80">
                              <Calendar size={11} /> Due: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                            </div>
                          )}
                          {activeTab === 'inbox' && lead.last_contacted_date && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                              <Clock size={11} /> {formatDateTime(lead.last_contacted_date)}
                            </div>
                          )}
                        </div>
                        <ChevronRight size={16} className={`flex-shrink-0 mt-1 transition-colors ${isSelected ? 'text-[#2563EB]' : 'text-slate-300 dark:text-[#232734] group-hover:text-slate-400'}`} />
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
              {filteredLeads.length > visibleCount && (
                <div className="pt-2 pb-4 px-2">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="w-full py-2.5 rounded-[10px] bg-slate-100 dark:bg-[#232734] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
                  >
                    Load More ({filteredLeads.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANE: Detail View ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {selectedLeadId && selectedLead ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  className="flex flex-col neu-flat rounded-[24px] overflow-hidden h-full"
                >
                  {/* Detail Header */}
                  <div className="flex-shrink-0 p-5 bg-white dark:bg-[#0a0a0b]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {/* Mobile back button */}
                        <button onClick={() => setSelectedLeadId(null)}
                          className="lg:hidden p-2 rounded-[10px] bg-slate-200 dark:bg-[#232734] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Back">
                          <X size={15} />
                        </button>
                        <div
                          style={{ background: getAvatarGradient(selectedLead.company_name || '?') }}
                          className="w-12 h-12 rounded-[14px] flex items-center justify-center text-slate-900 dark:text-white text-lg font-bold shadow-md flex-shrink-0"
                        >
                          {getInitials(selectedLead.company_name)}
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{selectedLead.company_name}</h2>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                            {selectedLead.contact_person && (
                              <span className="flex items-center gap-1"><User size={11} /> {selectedLead.contact_person}</span>
                            )}
                            {selectedLead.email && (
                              <a href={`mailto:${selectedLead.email}`} onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 hover:text-[#2563EB] transition-colors">
                                <Mail size={11} /> {selectedLead.email}
                              </a>
                            )}
                            {selectedLead.phone && (
                              <a href={`tel:${selectedLead.phone}`} onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <Phone size={11} /> {selectedLead.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Status selector */}
                        <div className="relative">
                          <select
                            value={selectedLead.outreach_status}
                            onChange={e => handleStatusChange(e.target.value)}
                            className="bg-slate-50 dark:bg-[#111111] border-none rounded-[10px] py-2 pl-3 pr-8 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 appearance-none cursor-pointer transition-all shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]"
                            aria-label="Change status"
                          >
                            <option value="New">New</option>
                            <option value="Email Sent">Email Sent</option>
                            <option value="Replied">Replied</option>
                            <option value="Meeting Booked">Meeting Booked</option>
                            <option value="Closed">Closed</option>
                            <option value="Not Interested">Not Interested</option>
                          </select>
                          <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] rotate-90 pointer-events-none" />
                        </div>

                        {/* Create Proposal */}
                        <button
                          onClick={() => handleCreateProposal(selectedLead)}
                          disabled={isCreatingProposalFor === selectedLead._id}
                          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold rounded-[10px] text-xs transition-all shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
                        >
                          {isCreatingProposalFor === selectedLead._id
                            ? 'Creating…'
                            : <><Sparkles size={13} /> Proposal</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detail Tabs */}
                  <div className="flex-shrink-0 flex items-center px-5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md">
                    {detailTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setDetailTab(tab.id)}
                        className={`relative flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold transition-all ${detailTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        <tab.icon size={13} />
                        {tab.label}
                        {detailTab === tab.id && (
                          <motion.div layoutId="detailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Detail Content */}
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">

                      {/* Timeline Tab */}
                      {detailTab === 'timeline' && (
                        <motion.div key="timeline"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }} className="p-6">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Outreach History</h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-full text-[10px] font-bold text-[#94A3B8]">
                              <Clock size={10} /> {selectedLead.follow_up_count || 0} follow-ups
                            </div>
                          </div>

                          {(!selectedLead.outreach_logs || selectedLead.outreach_logs.length === 0) ? (
                            <div className="py-16 border border-dashed border-slate-200 dark:border-[#232734] rounded-[16px] flex flex-col items-center justify-center text-[#94A3B8] text-center">
                              <Activity size={28} className="opacity-20 mb-3" />
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No history yet</p>
                              <p className="text-xs">Send an email or log a call to start the timeline.</p>
                            </div>
                          ) : (
                            <div className="space-y-0">
                              {selectedLead.outreach_logs.map((log: any, idx: number) => {
                                const ls = getLogStyle(log.method);
                                const LogIcon = ls.icon;
                                const isLast = idx === selectedLead.outreach_logs.length - 1;
                                return (
                                  <motion.div key={idx}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
                                    className="flex gap-4 items-start"
                                  >
                                    <div className="flex flex-col items-center flex-shrink-0">
                                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: ls.bg, border: `1px solid ${ls.color}30` }}>
                                        <LogIcon size={13} style={{ color: ls.color }} />
                                      </div>
                                      {!isLast && <div className="w-px flex-1 bg-slate-200 dark:bg-[#232734] mt-1" style={{ minHeight: 20 }} />}
                                    </div>
                                    <div className={`flex-1 min-w-0 ${!isLast ? 'pb-5' : ''}`}>
                                      <div className="bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[14px] p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <span className="text-xs font-bold" style={{ color: ls.color }}>{log.method} Log</span>
                                          <span className="text-[10px] text-[#94A3B8] font-medium flex-shrink-0">{formatDateTime(log.date)}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-[#94A3B8] whitespace-pre-wrap leading-relaxed">{log.notes}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Email Tab */}
                      {detailTab === 'email' && (
                        <motion.div key="email"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }} className="p-6 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Email Sequence Draft</h3>
                            
                            {/* Sender Account Selection */}
                            <div className="flex items-center gap-2 relative">
                              <label className="text-[10px] font-bold text-[#94A3B8] uppercase">From:</label>
                              <div className="relative">
                                <button
                                  onClick={() => setIsSenderDropdownOpen(!isSenderDropdownOpen)}
                                  className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-[#2563EB]/50 transition-colors"
                                >
                                  <span>
                                    {senderAccountId === 'auto' 
                                      ? 'Auto-select (Previous/Rotate)' 
                                      : emailAccounts.find(a => a._id === senderAccountId)?.email || 'Unknown'}
                                  </span>
                                  <ChevronDown size={14} className="text-[#94A3B8]" />
                                </button>
                                
                                <AnimatePresence>
                                  {isSenderDropdownOpen && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setIsSenderDropdownOpen(false)} />
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl shadow-xl z-50 overflow-hidden"
                                      >
                                        <div className="max-h-60 overflow-y-auto py-1 scrollbar-none">
                                          <button
                                            onClick={() => { setSenderAccountId('auto'); setIsSenderDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${senderAccountId === 'auto' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#232734]/50'}`}
                                          >
                                            Auto-select (Previous/Rotate)
                                          </button>
                                          {emailAccounts.map(acc => (
                                            <button
                                              key={acc._id}
                                              onClick={() => { setSenderAccountId(acc._id); setIsSenderDropdownOpen(false); }}
                                              className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${senderAccountId === acc._id ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#232734]/50'}`}
                                            >
                                              {acc.email}
                                            </button>
                                          ))}
                                        </div>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Subject Line</label>
                            <input
                              type="text"
                              value={emailSubject}
                              onChange={e => setEmailSubject(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[12px] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
                              placeholder="e.g. Question about your website…"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Email Body</label>
                            <textarea
                              value={emailBody}
                              onChange={e => setEmailBody(e.target.value)}
                              rows={12}
                              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[12px] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all resize-none leading-relaxed"
                              placeholder={'Hi {{first_name}},\n\nI noticed…'}
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button onClick={handleSaveDrafts} disabled={isSavingDraft || isSending}
                              className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-[#1E2235] dark:hover:bg-[#2A2F45] text-slate-700 dark:text-slate-300 font-bold rounded-[10px] text-xs transition-all disabled:opacity-50">
                              <Save size={13} /> {isSavingDraft ? 'Saving…' : 'Save Draft'}
                            </button>
                            <button onClick={handleSendEmail} disabled={isSending || isSavingDraft}
                              className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold rounded-[10px] text-xs transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                              <Send size={13} /> {isSending ? 'Sending…' : 'Send Reply'}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* WhatsApp Tab */}
                      {detailTab === 'whatsapp' && (
                        <motion.div key="whatsapp"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }} className="p-6 space-y-4">
                          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">WhatsApp / Social Draft</h3>
                          <div>
                            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Message Body</label>
                            <textarea
                              value={whatsappBody}
                              onChange={e => setWhatsappBody(e.target.value)}
                              rows={10}
                              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[12px] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all resize-none leading-relaxed"
                              placeholder={'Hey {{first_name}}! Quick question…'}
                            />
                          </div>
                          <div className="flex justify-end">
                            <button onClick={handleSaveDrafts} disabled={isSavingDraft}
                              className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-slate-900 dark:text-white font-bold rounded-[10px] text-xs transition-all disabled:opacity-50">
                              <Save size={13} /> {isSavingDraft ? 'Saving…' : 'Save Draft'}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Log Activity Tab */}
                      {detailTab === 'call' && (
                        <motion.div key="call"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }} className="p-6 space-y-4">
                          <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Log Activity</h3>
                          <div>
                            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Activity Notes</label>
                            <textarea
                              value={logNote}
                              onChange={e => setLogNote(e.target.value)}
                              rows={7}
                              className="w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[12px] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all resize-none leading-relaxed"
                              placeholder="Details of the call or manual outreach note…"
                            />
                          </div>
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => handleAddLog('Note')} disabled={isLogging || !logNote.trim()}
                              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white font-bold rounded-[10px] text-xs transition-all disabled:opacity-50">
                              <Activity size={13} /> Log as Note
                            </button>
                            <button onClick={() => handleAddLog('Phone')} disabled={isLogging || !logNote.trim()}
                              className="flex items-center gap-2 px-4 py-2.5 bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/20 font-bold rounded-[10px] text-xs transition-all disabled:opacity-50">
                              <Phone size={13} /> Log as Call
                            </button>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hidden lg:flex flex-1 h-full flex-col items-center justify-center neu-flat rounded-[24px] text-center p-8 relative overflow-hidden shadow-sm dark:shadow-none"
                >
                  {/* Subtle Grid Background */}
                  <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                  
                  <div className="relative z-10 w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-5 shadow-lg">
                    <Activity size={24} className="text-[#94A3B8]" />
                  </div>
                  <p className="relative z-10 text-lg font-bold text-slate-900 dark:text-white mb-2">No contact selected</p>
                  <p className="relative z-10 text-sm text-[#94A3B8] max-w-[240px] leading-relaxed mb-8">
                    Select a lead from the list to view their timeline and outreach tools.
                  </p>
                  <div className="relative z-10 flex items-center gap-4 text-xs font-bold text-[#475569]">
                    <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 rounded-md bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-slate-300">⌘K</kbd> search</span>
                    <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 rounded-md bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] text-slate-700 dark:text-slate-300">C</kbd> compose</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
