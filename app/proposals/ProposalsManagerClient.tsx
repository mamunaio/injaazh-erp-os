'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Search, Trash2, Edit, ExternalLink, 
  Send, Copy, Check, Clock, CheckCircle2, XCircle, 
  Eye, TrendingUp, Sparkles, Activity, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { deleteProposal, sendProposalEmailAction } from '@/app/actions/proposalActions';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
};

const TABS = [
  { id: 'All', label: 'All' },
  { id: 'Draft', label: 'Draft' },
  { id: 'Sent', label: 'Sent' },
  { id: 'Viewed', label: 'Viewed' },
  { id: 'Accepted', label: 'Accepted' },
  { id: 'Declined', label: 'Declined' },
];

export default function ProposalsManagerClient({ 
  initialProposals, 
  userRole 
}: { 
  initialProposals: any[]; 
  userRole?: string; 
}) {
  const { confirm } = useConfirm();
  const [proposals, setProposals] = useState<any[]>(initialProposals || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Filtered List
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch =
        (p.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.clientCompany?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.proposalNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalCount = proposals.length;
    const totalValue = proposals.reduce((acc, p) => acc + (p.total || 0), 0);
    const acceptedList = proposals.filter((p) => p.status === 'Accepted');
    const acceptedCount = acceptedList.length;
    const acceptedValue = acceptedList.reduce((acc, p) => acc + (p.total || 0), 0);
    const pendingCount = proposals.filter((p) => ['Draft', 'Sent', 'Viewed'].includes(p.status)).length;
    const winRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

    return { totalCount, totalValue, acceptedCount, acceptedValue, pendingCount, winRate };
  }, [proposals]);

  // Copy Link Handler (Canonical Title Slug Link)
  const handleCopyClientLink = (proposal: any) => {
    if (typeof window !== 'undefined') {
      const identifier = proposal.slug || proposal.proposalNumber || proposal._id;
      const url = `${window.location.origin}/proposal/${identifier}`;
      navigator.clipboard.writeText(url);
      setCopiedId(proposal._id);
      toast.success('Client proposal link copied!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Send Email Action
  const handleSendEmail = async (proposal: any) => {
    if (!proposal.clientEmail) {
      toast.error('Client email is required. Please edit and add an email address.');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Send Proposal Email',
      message: `Send proposal "${proposal.title}" directly to ${proposal.clientEmail}?`,
      variant: 'primary',
      confirmText: 'Send Email',
    });
    if (!isConfirmed) return;

    setSendingEmailId(proposal._id);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await sendProposalEmailAction(proposal._id, origin);
      if (res.success) {
        toast.success(res.message || 'Proposal emailed successfully');
        setProposals(
          proposals.map((p) =>
            p._id === proposal._id && p.status === 'Draft' ? { ...p, status: 'Sent' } : p
          )
        );
      } else {
        toast.error(res.error || 'Failed to send email');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending email');
    } finally {
      setSendingEmailId(null);
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Proposal',
      message: 'Are you sure you want to delete this proposal? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete Permanently',
    });
    if (!isConfirmed) return;

    const res = await deleteProposal(id);
    if (res.success) {
      toast.success('Proposal deleted');
      setProposals(proposals.filter((p) => p._id !== id));
    } else {
      toast.error(res.error || 'Failed to delete proposal');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <CheckCircle2 size={12} /> Accepted
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
            <XCircle size={12} /> Declined
          </span>
        );
      case 'Viewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/25 shadow-[0_0_10px_rgba(99,36,252,0.15)]">
            <Eye size={12} /> Viewed
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Send size={12} /> Sent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Draft
          </span>
        );
    }
  };

  // Dashboard-matching 4 KPI metric cards configuration
  const kpis = [
    {
      id: 'All',
      label: 'TOTAL PROPOSALS',
      value: metrics.totalCount,
      color: '#6324FC',
      icon: FileText,
      badge: 'All Pipeline',
      subtitle: `Total pipeline: $${metrics.totalValue.toLocaleString()}`,
    },
    {
      id: 'Accepted',
      label: 'WON & ACCEPTED',
      value: metrics.acceptedCount,
      color: '#10B981',
      icon: CheckCircle2,
      badge: 'Closed Won',
      subtitle: `Earned: $${metrics.acceptedValue.toLocaleString()}`,
    },
    {
      id: 'win-rate',
      label: 'WIN RATE',
      value: `${metrics.winRate}%`,
      color: '#00E5FF',
      icon: TrendingUp,
      badge: metrics.winRate > 0 ? `+${metrics.winRate}% Ratio` : 'Baseline',
      subtitle: `${metrics.acceptedCount} of ${metrics.totalCount} deals closed`,
    },
    {
      id: 'Pending',
      label: 'PENDING REVIEW',
      value: metrics.pendingCount,
      color: '#F59E0B',
      icon: Clock,
      badge: 'In Flight',
      subtitle: 'Awaiting client decision',
    },
  ];

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-white font-sans selection:bg-[#6324FC] selection:text-white">

      {/* Ambient background glows matching Dashboard */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/5 rounded-full blur-[130px]" />
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="max-w-[1750px] mx-auto relative z-10 space-y-6"
      >
        
        {/* ========================================================================= */}
        {/* EXECUTIVE HEADER & LIVE TELEMETRY BAR (Standardized to Match Dashboard) */}
        {/* ========================================================================= */}
        <motion.div 
          variants={itemVariants} 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10 pb-2 border-b border-black/5 dark:border-white/5"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-heading font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#6324FC] dark:shadow-[0_0_8px_#00E5FF]" />
                INJAAZH GLOBAL OS // COMMERCIAL SUITE
              </div>
              <span className="text-xs font-sans text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Client Proposals &amp; Deal Flow
            </h1>
            <p className="text-xs sm:text-sm font-sans text-secondary mt-1 max-w-2xl">
              Draft, deliver, and track business pitches, milestones, quote estimations, and digital client agreements.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Command shortcut button */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all group"
            >
              <Search size={14} className="group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors" />
              <span>Command</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[10px] font-mono text-secondary">⌘K</kbd>
            </button>

            {/* AI Copilot Dispatch */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { initialPrompt: 'Review my client proposals pipeline, win rate, and pending client agreements' } }))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-sm"
            >
              <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* + Create Proposal Signature Laser Beam CTA */}
            <Link
              href="/proposals/create"
              className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
            >
              {/* Perfectly Centered Square Conic Glow Aura */}
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />

              {/* Crisp Symmetrical Single Laser Beam Stream */}
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />

              {/* Inner High-Contrast Surface */}
              <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                <Plus size={14} className="text-[#00E5FF] group-hover:rotate-90 transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + Create Proposal
                </span>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* HIGH-LEVEL PROPOSALS TELEMETRY SECTION (DASHBOARD 1:1 KPI CARDS) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2.5">
              <Activity size={16} className="text-[#6324FC]" /> High-Level Proposals Telemetry
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span>Live Engine Connected</span>
            </div>
          </div>

          {/* 4 Metric Cards Matching Dashboard 1:1 Architecture */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {kpis.map((k) => {
              const isSelected = 
                (k.id === 'All' && statusFilter === 'All') ||
                (k.id === 'Accepted' && statusFilter === 'Accepted') ||
                (k.id === 'Pending' && ['Draft', 'Sent', 'Viewed'].includes(statusFilter));
              const KIcon = k.icon;
              return (
                <div
                  key={k.label}
                  onClick={() => {
                    if (k.id === 'All') setStatusFilter('All');
                    else if (k.id === 'Accepted') setStatusFilter(statusFilter === 'Accepted' ? 'All' : 'Accepted');
                    else if (k.id === 'Pending') setStatusFilter(statusFilter === 'Viewed' ? 'All' : 'Viewed');
                  }}
                  className={`group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-[#0a0a0d] border ${
                    isSelected
                      ? 'ring-2 ring-purple-500/50 shadow-[0_16px_36px_rgba(99,36,252,0.22)]'
                      : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'
                  }`}
                  style={{
                    borderColor: isSelected ? k.color : undefined,
                    boxShadow: isSelected
                      ? `0 0 25px ${k.color}35`
                      : undefined,
                  }}
                >
                  {/* Radial Hover Spotlight */}
                  <div
                    className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-30 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                    style={{ backgroundColor: `${k.color}40` }}
                  />

                  {/* Top Accent Neon Line - Expands on hover */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${k.color}, transparent)`,
                      boxShadow: `0 0 10px ${k.color}`,
                    }}
                  />

                  {/* Subtle Card Glass Sheen Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top Row: Icon Container & Pill Badge */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm border"
                      style={{
                        backgroundColor: `${k.color}15`,
                        borderColor: `${k.color}30`,
                        color: k.color,
                      }}
                    >
                      <KIcon size={21} />
                    </div>

                    <span
                      className="text-xs font-heading font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: `${k.color}15`,
                        borderColor: `${k.color}30`,
                        color: k.color,
                      }}
                    >
                      {k.badge}
                    </span>
                  </div>

                  {/* Bottom: Label, Value, Subtitle */}
                  <div className="relative z-10">
                    <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">
                      {k.label}
                    </p>
                    <p
                      className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all"
                    >
                      {k.value}
                    </p>
                    <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                      {k.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* FILTER & SEARCH CONTROL BAR */}
        {/* ========================================================================= */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-3.5 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center"
        >
          {/* Search Box */}
          <div className="relative flex-1 w-full md:w-auto group">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" />
            <input
              type="text"
              placeholder="Search proposals by title, client, or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary font-medium"
            />
          </div>

          {/* Status Tabs with Count Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              const count = tab.id === 'All' 
                ? proposals.length 
                : proposals.filter((p) => p.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#6324FC] text-white shadow-[0_2px_12px_rgba(99,36,252,0.35)]'
                      : 'text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-secondary'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* PROPOSALS LIST TABLE CONTAINER */}
        {/* ========================================================================= */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden"
        >
          {filteredProposals.length === 0 ? (
            <div className="py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#6324FC]/10 text-[#6324FC] flex items-center justify-center mx-auto mb-4 border border-[#6324FC]/20">
                <FileText size={26} />
              </div>
              <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-1">
                No Proposals Found
              </h3>
              <p className="text-xs text-secondary max-w-sm mx-auto mb-6">
                {searchQuery || statusFilter !== 'All'
                  ? 'Try adjusting your search criteria or filter to see more proposals.'
                  : 'Create your first project proposal and share it seamlessly with clients.'}
              </p>
              <Link
                href="/proposals/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-heading font-bold shadow-[0_0_15px_rgba(99,36,252,0.3)] transition-all"
              >
                <Plus size={14} /> Create Proposal
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 text-[11px] font-heading font-bold uppercase tracking-wider text-secondary bg-slate-50/50 dark:bg-white/[0.02]">
                    <th className="py-3.5 px-5">Proposal</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Activity</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {filteredProposals.map((proposal) => {
                    const currency = proposal.currency || '$';
                    return (
                      <tr
                        key={proposal._id}
                        className="hover:bg-[#6324FC]/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Proposal Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <FileText size={18} />
                            </div>
                            <div>
                              <Link
                                href={`/proposals/${proposal._id}/edit`}
                                className="font-heading font-bold text-sm text-slate-900 dark:text-white hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors"
                              >
                                {proposal.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-secondary">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">{proposal.proposalNumber}</span>
                                <span>•</span>
                                <span>Issued {format(new Date(proposal.issueDate), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client Info */}
                        <td className="py-4 px-4">
                          <div className="font-heading font-semibold text-slate-800 dark:text-slate-200">
                            {proposal.clientName}
                          </div>
                          {proposal.clientCompany && (
                            <div className="text-[11px] text-secondary">{proposal.clientCompany}</div>
                          )}
                          {proposal.clientEmail && (
                            <div className="text-[11px] text-secondary font-mono truncate max-w-[160px]">
                              {proposal.clientEmail}
                            </div>
                          )}
                        </td>

                        {/* Financial Value */}
                        <td className="py-4 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                          {currency}{Number(proposal.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(proposal.status)}
                        </td>

                        {/* Activity */}
                        <td className="py-4 px-4 text-secondary text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Eye size={12} className="text-secondary" />
                            <span className="font-mono">{proposal.viewCount || 0} views</span>
                          </div>
                          {proposal.status === 'Accepted' && proposal.clientSignature?.signedAt && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                              Signed {format(new Date(proposal.clientSignature.signedAt), 'MMM dd')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* Client Public Link */}
                            <Link
                              href={`/proposal/${proposal.slug || proposal.proposalNumber || proposal._id}`}
                              target="_blank"
                              className="p-2 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                              title="Open Client View"
                            >
                              <ExternalLink size={15} />
                            </Link>

                            {/* Copy Link */}
                            <button
                              type="button"
                              onClick={() => handleCopyClientLink(proposal)}
                              className="p-2 rounded-xl text-secondary hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors"
                              title="Copy Client Proposal Link"
                            >
                              {copiedId === proposal._id ? (
                                <Check size={15} className="text-emerald-500" />
                              ) : (
                                <Copy size={15} />
                              )}
                            </button>

                            {/* Email Proposal */}
                            <button
                              type="button"
                              onClick={() => handleSendEmail(proposal)}
                              disabled={sendingEmailId === proposal._id}
                              className="p-2 rounded-xl text-secondary hover:text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                              title="Send Proposal Email to Client"
                            >
                              {sendingEmailId === proposal._id ? (
                                <Loader2 size={15} className="animate-spin text-blue-500" />
                              ) : (
                                <Send size={15} />
                              )}
                            </button>

                            {/* Edit */}
                            <Link
                              href={`/proposals/${proposal._id}/edit`}
                              className="p-2 rounded-xl text-secondary hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                              title="Edit Proposal"
                            >
                              <Edit size={15} />
                            </Link>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(proposal._id)}
                              className="p-2 rounded-xl text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete Proposal"
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
