'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileCode2, Plus, Search, Trash2, Edit, ExternalLink, 
  Send, Copy, Check, Clock, CheckCircle2, MessageSquare, 
  Eye, Activity, Sparkles, Loader2, Layers, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { deleteRequirement, sendRequirementEmailAction } from '@/app/actions/requirementActions';
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
  { id: 'In Review', label: 'In Review' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Changes Requested', label: 'Revisions' },
];

export default function RequirementsManagerClient({ 
  initialRequirements, 
  userRole 
}: { 
  initialRequirements: any[]; 
  userRole?: string; 
}) {
  const { confirm } = useConfirm();
  const [requirements, setRequirements] = useState<any[]>(initialRequirements || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Filtered List
  const filteredRequirements = useMemo(() => {
    return requirements.filter((doc) => {
      const matchSearch =
        (doc.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.clientCompany?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.docNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || doc.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requirements, searchQuery, statusFilter]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalCount = requirements.length;
    const approvedCount = requirements.filter((d) => d.status === 'Approved').length;
    const inReviewCount = requirements.filter((d) => ['Sent', 'In Review'].includes(d.status)).length;
    const revisionsCount = requirements.filter((d) => d.status === 'Changes Requested').length;

    return { totalCount, approvedCount, inReviewCount, revisionsCount };
  }, [requirements]);

  // Copy Link Handler (Canonical Title Slug Link)
  const handleCopyClientLink = (doc: any) => {
    if (typeof window !== 'undefined') {
      const identifier = doc.slug || doc.docNumber || doc._id;
      const url = `${window.location.origin}/requirements/${identifier}`;
      navigator.clipboard.writeText(url);
      setCopiedId(doc._id);
      toast.success('Client scope specification link copied!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Send Email Action
  const handleSendEmail = async (doc: any) => {
    if (!doc.clientEmail) {
      toast.error('Client email is required. Please edit and add an email address.');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Send Requirements Email',
      message: `Send Project Scope "${doc.title}" (${doc.docNumber}) to ${doc.clientEmail}?`,
      variant: 'primary',
      confirmText: 'Send Email',
    });
    if (!isConfirmed) return;

    setSendingEmailId(doc._id);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await sendRequirementEmailAction(doc._id, origin);
      if (res.success) {
        toast.success(res.message || 'Requirements emailed successfully');
        setRequirements(
          requirements.map((d) =>
            d._id === doc._id && d.status === 'Draft' ? { ...d, status: 'Sent' } : d
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
      title: 'Delete Requirements Document',
      message: 'Are you sure you want to delete this project specification? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete Permanently',
    });
    if (!isConfirmed) return;

    const res = await deleteRequirement(id);
    if (res.success) {
      toast.success('Requirement document deleted');
      setRequirements(requirements.filter((d) => d._id !== id));
    } else {
      toast.error(res.error || 'Failed to delete requirement document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <MessageSquare size={12} /> Revisions
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/25 shadow-[0_0_10px_rgba(99,36,252,0.15)]">
            <Eye size={12} /> In Review
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Clock size={12} /> Draft
          </span>
        );
    }
  };

  // Dashboard-matching 4 KPI metric cards
  const kpis = [
    {
      id: 'All',
      label: 'TOTAL REQUIREMENTS',
      value: metrics.totalCount,
      color: '#6324FC',
      icon: FileCode2,
      badge: 'All Scopes',
      subtitle: `${metrics.approvedCount} locked for engineering`,
    },
    {
      id: 'Approved',
      label: 'APPROVED SCOPES',
      value: metrics.approvedCount,
      color: '#10B981',
      icon: CheckCircle2,
      badge: 'Scope Locked',
      subtitle: 'Authorized by clients',
    },
    {
      id: 'In Review',
      label: 'ACTIVE REVIEWS',
      value: metrics.inReviewCount,
      color: '#00E5FF',
      icon: Clock,
      badge: 'Pending Review',
      subtitle: 'Awaiting client sign-off',
    },
    {
      id: 'Changes Requested',
      label: 'REVISIONS REQUESTED',
      value: metrics.revisionsCount,
      color: '#F59E0B',
      icon: MessageSquare,
      badge: 'Needs Attention',
      subtitle: 'Client feedback submitted',
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
                INJAAZH GLOBAL OS // REQUIREMENTS &amp; SCOPE SUITE
              </div>
              <span className="text-xs font-sans text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Project Requirements &amp; Scope Specifications
            </h1>
            <p className="text-xs sm:text-sm font-sans text-secondary mt-1 max-w-2xl">
              Draft, deliver, and track client PRDs, functional modules, prerequisite asset checklists, and scope sign-offs.
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
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 text-mono text-secondary">⌘K</kbd>
            </button>

            {/* AI Copilot Dispatch */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { initialPrompt: 'Review my active project requirement documents, open scope revisions, and prerequisite checklists' } }))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-sm"
            >
              <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* + Create Requirement Signature Laser Beam CTA */}
            <Link
              href="/requirements/create"
              className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
            >
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />
              <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                <Plus size={14} className="text-[#00E5FF] group-hover:rotate-90 transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + New Requirement Doc
                </span>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* HIGH-LEVEL REQUIREMENTS TELEMETRY SECTION (DASHBOARD 1:1 KPI CARDS) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2.5">
              <Activity size={16} className="text-[#6324FC]" /> High-Level Requirements Telemetry
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
                (k.id === 'Approved' && statusFilter === 'Approved') ||
                (k.id === 'In Review' && statusFilter === 'In Review') ||
                (k.id === 'Changes Requested' && statusFilter === 'Changes Requested');
              const KIcon = k.icon;
              return (
                <div
                  key={k.label}
                  onClick={() => {
                    if (k.id === 'All') setStatusFilter('All');
                    else setStatusFilter(statusFilter === k.id ? 'All' : k.id);
                  }}
                  className={`group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-[#0a0a0d] border ${
                    isSelected
                      ? 'ring-2 ring-purple-500/50 shadow-[0_16px_36px_rgba(99,36,252,0.22)]'
                      : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'
                  }`}
                  style={{
                    borderColor: isSelected ? k.color : undefined,
                    boxShadow: isSelected ? `0 0 25px ${k.color}35` : undefined,
                  }}
                >
                  {/* Radial Hover Spotlight */}
                  <div
                    className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-30 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                    style={{ backgroundColor: `${k.color}40` }}
                  />

                  {/* Top Accent Neon Line */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${k.color}, transparent)`,
                      boxShadow: `0 0 10px ${k.color}`,
                    }}
                  />

                  {/* Glass Sheen */}
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
              placeholder="Search specifications by title, client, or doc number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-[#6324FC] transition-all placeholder:text-secondary font-medium"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              const count = tab.id === 'All' 
                ? requirements.length 
                : requirements.filter((d) => d.status === tab.id).length;
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
        {/* REQUIREMENTS LIST TABLE CONTAINER */}
        {/* ========================================================================= */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden"
        >
          {filteredRequirements.length === 0 ? (
            <div className="py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#6324FC]/10 text-[#6324FC] flex items-center justify-center mx-auto mb-4 border border-[#6324FC]/20">
                <FileCode2 size={26} />
              </div>
              <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-1">
                No Requirements Documents Found
              </h3>
              <p className="text-xs text-secondary max-w-sm mx-auto mb-6">
                {searchQuery || statusFilter !== 'All'
                  ? 'Try adjusting your search query or status filter.'
                  : 'Create your first project scope specification to share with prospective or active clients.'}
              </p>
              <Link
                href="/requirements/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-heading font-bold shadow-[0_0_15px_rgba(99,36,252,0.3)] transition-all"
              >
                <Plus size={14} /> Create Requirement Doc
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 text-[11px] font-heading font-bold uppercase tracking-wider text-secondary bg-slate-50/50 dark:bg-white/[0.02]">
                    <th className="py-3.5 px-5">Document &amp; Scope Title</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Modules &amp; Specs</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Activity</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  {filteredRequirements.map((doc) => {
                    const totalFeatures = Array.isArray(doc.modules)
                      ? doc.modules.reduce((acc: number, m: any) => acc + (m.features?.length || 0), 0)
                      : 0;
                    const prerequisitesCount = Array.isArray(doc.clientPrerequisites) ? doc.clientPrerequisites.length : 0;

                    return (
                      <tr
                        key={doc._id}
                        className="hover:bg-[#6324FC]/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Title & Doc Number */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <FileCode2 size={18} />
                            </div>
                            <div>
                              <Link
                                href={`/requirements/${doc._id}/edit`}
                                className="font-heading font-bold text-sm text-slate-900 dark:text-white hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors"
                              >
                                {doc.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-secondary">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">{doc.docNumber}</span>
                                <span>•</span>
                                <span>{doc.version || 'v1.0'}</span>
                                <span>•</span>
                                <span>{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client Info */}
                        <td className="py-4 px-4">
                          <div className="font-heading font-semibold text-slate-800 dark:text-slate-200">
                            {doc.clientName}
                          </div>
                          {doc.clientCompany && (
                            <div className="text-[11px] text-secondary">{doc.clientCompany}</div>
                          )}
                          {doc.clientEmail && (
                            <div className="text-[11px] text-secondary font-mono truncate max-w-[160px]">
                              {doc.clientEmail}
                            </div>
                          )}
                        </td>

                        {/* Modules & Specs */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <Layers size={13} className="text-[#6324FC] dark:text-[#00E5FF]" />
                            <span>{doc.modules?.length || 0} Modules</span>
                            <span className="text-secondary">•</span>
                            <span className="text-secondary font-mono text-[11px]">{totalFeatures} Specs</span>
                          </div>
                          {prerequisitesCount > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {prerequisitesCount} Client Prerequisites
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(doc.status)}
                        </td>

                        {/* Activity */}
                        <td className="py-4 px-4 text-secondary text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Eye size={12} className="text-secondary" />
                            <span className="font-mono">{doc.viewCount || 0} views</span>
                          </div>
                          {doc.status === 'Approved' && doc.clientSignoff?.approvedAt && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                              Approved {format(new Date(doc.clientSignoff.approvedAt), 'MMM dd')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* Client Public Link */}
                            <Link
                              href={`/requirements/${doc.slug || doc.docNumber || doc._id}`}
                              target="_blank"
                              className="p-2 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                              title="Open Client Public Scope View"
                            >
                              <ExternalLink size={15} />
                            </Link>

                            {/* Copy Link */}
                            <button
                              type="button"
                              onClick={() => handleCopyClientLink(doc)}
                              className="p-2 rounded-xl text-secondary hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors"
                              title="Copy Shareable Public Link"
                            >
                              {copiedId === doc._id ? (
                                <Check size={15} className="text-emerald-500" />
                              ) : (
                                <Copy size={15} />
                              )}
                            </button>

                            {/* Email Requirements */}
                            <button
                              type="button"
                              onClick={() => handleSendEmail(doc)}
                              disabled={sendingEmailId === doc._id}
                              className="p-2 rounded-xl text-secondary hover:text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                              title="Send Specification Email to Client"
                            >
                              {sendingEmailId === doc._id ? (
                                <Loader2 size={15} className="animate-spin text-blue-500" />
                              ) : (
                                <Send size={15} />
                              )}
                            </button>

                            {/* Edit */}
                            <Link
                              href={`/requirements/${doc._id}/edit`}
                              className="p-2 rounded-xl text-secondary hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                              title="Edit Requirement Document"
                            >
                              <Edit size={15} />
                            </Link>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(doc._id)}
                              className="p-2 rounded-xl text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete Requirement Document"
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

