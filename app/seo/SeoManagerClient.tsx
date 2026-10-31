'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Plus, Search, Trash2, Edit2, ExternalLink, 
  Send, Copy, Check, Clock, CheckCircle2, AlertCircle,
  Globe, ShieldCheck, Gauge, CheckSquare, RefreshCw,
  MoreVertical, Eye, Sparkles, Loader2, ArrowUpRight,
  Activity, Calendar, MapPin, Building2, User, Mail,
  Link as LinkIcon, Filter, X, ChevronRight, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  createSeoProject, 
  updateSeoProject, 
  deleteSeoProject, 
  auditSeoProject, 
  seedHectorRiveraProject 
} from '@/app/actions/seoActions';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

const PROJECT_STATUS_OPTIONS: CustomSelectOption[] = [
  { value: 'Active', label: 'Active Retainer', color: '#10B981' },
  { value: 'Paused', label: 'Paused', color: '#F59E0B' },
  { value: 'Completed', label: 'Completed', color: '#6324FC' },
];

const PROJECT_CADENCE_OPTIONS: CustomSelectOption[] = [
  { value: 'Weekly', label: 'Weekly Sprint' },
  { value: 'Bi-weekly', label: 'Bi-weekly Sprint' },
  { value: 'Monthly', label: 'Monthly Retainer' },
];

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
  { id: 'All', label: 'All Projects' },
  { id: 'Active', label: 'Active Retainers' },
  { id: 'Paused', label: 'Paused' },
  { id: 'Completed', label: 'Completed' },
];

export default function SeoManagerClient({ 
  initialProjects, 
  userRole 
}: { 
  initialProjects: any[]; 
  userRole?: string; 
}) {
  const { confirm } = useConfirm();
  const [projects, setProjects] = useState<any[]>(initialProjects || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Active Dropdown Menu
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    url: '',
    status: 'Active',
    cadence: 'Weekly',
    targetLocation: 'New Jersey, US',
    weeklyNotes: '',
    docNumber: '',
  });

  // Close open dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered List
  const filteredProjects = useMemo(() => {
    return projects.filter((doc) => {
      const matchSearch =
        (doc.clientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.clientCompany?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.url?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.docNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || doc.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Overall Analytics Across All SEO Trackers
  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    let totalTasks = 0;
    let verifiedTasks = 0;
    let pendingApprovalTasks = 0;
    let totalReports = 0;

    projects.forEach((p) => {
      if (Array.isArray(p.tasks)) {
        totalTasks += p.tasks.length;
        verifiedTasks += p.tasks.filter((t: any) => t.status === 'Verified').length;
        pendingApprovalTasks += p.tasks.filter((t: any) => t.status === 'Needs Approval').length;
      }
      if (Array.isArray(p.reports)) {
        totalReports += p.reports.length;
      }
    });

    const activeCount = projects.filter((p) => p.status === 'Active').length;

    return { totalProjects, activeCount, totalTasks, verifiedTasks, pendingApprovalTasks, totalReports };
  }, [projects]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const year = new Date().getFullYear();
    const count = projects.length + 1;
    setFormData({
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      url: '',
      status: 'Active',
      cadence: 'Weekly',
      targetLocation: 'New Jersey, US',
      weeklyNotes: '',
      docNumber: `SEO-${year}-${String(count).padStart(3, '0')}`,
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create Project
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (!formData.url.trim()) {
      toast.error('Website URL is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSeoProject(formData);
      if (res.success && res.data) {
        toast.success(res.message || 'SEO Project created successfully!');
        setProjects((prev) => [res.data, ...prev]);
        setIsCreateModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to create project');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (project: any) => {
    setEditingProject(project);
    setFormData({
      clientName: project.clientName || '',
      clientCompany: project.clientCompany || '',
      clientEmail: project.clientEmail || '',
      url: project.url || '',
      status: project.status || 'Active',
      cadence: project.cadence || 'Weekly',
      targetLocation: project.targetLocation || 'New Jersey, US',
      weeklyNotes: project.weeklyNotes || '',
      docNumber: project.docNumber || '',
    });
    setOpenActionMenuId(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Project
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!formData.clientName.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (!formData.url.trim()) {
      toast.error('Website URL is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateSeoProject(editingProject._id, formData);
      if (res.success && res.data) {
        toast.success(res.message || 'Project updated successfully!');
        setProjects((prev) =>
          prev.map((p) => (p._id === editingProject._id ? res.data : p))
        );
        setIsEditModalOpen(false);
        setEditingProject(null);
      } else {
        toast.error(res.error || 'Failed to update project');
      }
    } catch {
      toast.error('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Project with Confirmation
  const handleDeleteProject = async (project: any) => {
    setOpenActionMenuId(null);

    const isConfirmed = await confirm({
      title: 'Delete SEO Project?',
      message: `Are you sure you want to delete "${project.clientName}" (${project.docNumber || 'SEO Project'})? All associated task matrices and reports will be archived safely.`,
      danger: true,
      confirmText: 'Delete Project',
    });

    if (!isConfirmed) return;

    try {
      const res = await deleteSeoProject(project._id);
      if (res.success) {
        toast.success(res.message || 'SEO Project deleted');
        setProjects((prev) => prev.filter((p) => p._id !== project._id));
      } else {
        toast.error(res.error || 'Failed to delete project');
      }
    } catch {
      toast.error('Failed to delete project');
    }
  };

  // Copy Client Report Link
  const handleCopyClientLink = (doc: any) => {
    if (typeof window !== 'undefined') {
      const identifier = doc.slug || doc.docNumber || doc._id;
      const url = `${window.location.origin}/seo/${identifier}`;
      navigator.clipboard.writeText(url);
      setCopiedId(doc._id);
      toast.success('Client weekly SEO report link copied!');
      setTimeout(() => setCopiedId(null), 2000);
      setOpenActionMenuId(null);
    }
  };

  // Run Google PageSpeed API Audit Live
  const handleRunAudit = async (projectId: string) => {
    setAuditingId(projectId);
    setOpenActionMenuId(null);
    try {
      const res = await auditSeoProject(projectId);
      if (res.success && res.data) {
        toast.success(res.message || 'Live Google PageSpeed audit completed!');
        setProjects((prev) =>
          prev.map((p) => (p._id === projectId ? { ...p, ...res.data } : p))
        );
      } else {
        toast.error(res.error || 'Failed to complete audit');
      }
    } catch {
      toast.error('Audit failed. Please try again.');
    } finally {
      setAuditingId(null);
    }
  };

  // Seed / Reset Hector Rivera Excel Data
  const handleSeedHectorData = async () => {
    const isConfirmed = await confirm({
      title: 'Reset Hector Rivera Photography Tracker',
      message: 'This will seed or reset the complete 24-task matrix, GSC, GBP, and Lighthouse benchmarks from your Excel sheet.',
      variant: 'primary',
      confirmText: 'Seed Excel Data',
    });

    if (!isConfirmed) return;

    setIsSeeding(true);
    try {
      const res = await seedHectorRiveraProject();
      if (res.success && res.data) {
        toast.success('Hector Rivera Photography SEO Tracker seeded successfully!');
        setProjects((prev) => {
          const index = prev.findIndex((p) => p.slug === 'hector-rivera-photography');
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = res.data;
            return updated;
          }
          return [res.data, ...prev];
        });
      } else {
        toast.error(res.error || 'Failed to seed project');
      }
    } catch {
      toast.error('Network error. Failed to seed.');
    } finally {
      setIsSeeding(false);
    }
  };

  // 4 Dashboard-matching KPI Metric Cards
  const telemetryStats = [
    {
      id: 'active',
      label: 'ACTIVE SEO RETAINERS',
      value: metrics.activeCount,
      color: '#6324FC',
      icon: TrendingUp,
      badge: 'Live Projects',
      subtitle: `${metrics.totalProjects} total client properties`,
    },
    {
      id: 'verified',
      label: 'VERIFIED IMPLEMENTATIONS',
      value: metrics.verifiedTasks,
      color: '#10B981',
      icon: CheckCircle2,
      badge: 'Live on Site',
      subtitle: `${metrics.totalTasks} total logged actions`,
    },
    {
      id: 'approvals',
      label: 'CLIENT APPROVALS NEEDED',
      value: metrics.pendingApprovalTasks,
      color: '#F59E0B',
      icon: AlertCircle,
      badge: metrics.pendingApprovalTasks > 0 ? 'Action Required' : 'All Approved',
      subtitle: 'Awaiting client confirmation',
    },
    {
      id: 'reports',
      label: 'DELIVERED SPRINT REPORTS',
      value: metrics.totalReports || metrics.totalProjects,
      color: '#00E5FF',
      icon: FileText,
      badge: '2-Page A4',
      subtitle: 'Weekly client deliverables',
    },
  ];

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-white font-sans selection:bg-[#6324FC] selection:text-white">

      {/* Ambient background glows matching Injaazh OS Dashboard */}
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
        {/* EXECUTIVE HEADER & LIVE TELEMETRY BAR (Matching Main Dashboard) */}
        {/* ========================================================================= */}
        <motion.div 
          variants={itemVariants} 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10 pb-2 border-b border-black/5 dark:border-white/5"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-heading font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#6324FC] dark:shadow-[0_0_8px_#00E5FF]" />
                INJAAZH GLOBAL OS // SEO &amp; AEO WORK TRACKERS
              </div>
              <span className="text-xs font-sans text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              SEO Trackers &amp; Weekly Client Reporting
            </h1>
            <p className="text-xs sm:text-sm font-sans text-secondary mt-1 max-w-2xl">
              Execute client SEO workstreams, log before/after findings, track Google Core Web Vitals, and deliver weekly 2-Page A4 reports.
            </p>
          </div>

          {/* Quick Action Controls (Dashboard Standardized) */}
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

            {/* Seed / Re-sync Hector Rivera Excel Tracker */}
            <button
              type="button"
              onClick={handleSeedHectorData}
              disabled={isSeeding}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all group shadow-xs"
              title="Sync or reset Hector Rivera Photography tracker from Excel"
            >
              <RefreshCw size={14} className={`${isSeeding ? 'animate-spin text-[#6324FC]' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{isSeeding ? 'Syncing...' : 'Sync Excel'}</span>
            </button>

            {/* AI Copilot Dispatch */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { initialPrompt: 'Analyze our active SEO project trackers, pending client approvals, and mobile LCP issues' } }))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-sm"
            >
              <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
              <span>SEO Copilot</span>
            </button>

            {/* + New Project Laser Beam CTA (Dashboard Matching Pattern) */}
            <button 
              type="button"
              onClick={handleOpenCreateModal}
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
                <Plus size={15} className="text-[#00E5FF] group-hover:rotate-90 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + Create Project
                </span>
              </div>
            </button>

          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 4 TELEMETRY KPI METRICS CARDS (Dashboard-Matching Glass & Spotlight) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2.5">
              <Activity size={16} className="text-[#6324FC]" /> Executive SEO Telemetry
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span>Telemetry Connected</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {telemetryStats.map((k) => {
              const KIcon = k.icon;
              return (
                <div
                  key={k.id}
                  className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
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
              placeholder="Search projects by client, website URL, or doc number..."
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
                ? projects.length 
                : projects.filter((p) => p.status === tab.id).length;
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
        {/* SEO PROJECTS LIST & CARDS (Redesigned to Match Dashboard Cards) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="py-20 px-6 text-center bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/10 dark:border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-[#6324FC]/10 text-[#6324FC] flex items-center justify-center mx-auto mb-4 border border-[#6324FC]/20">
                <TrendingUp size={26} />
              </div>
              <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white">
                No SEO Projects Found
              </h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                No active SEO retainers match your current filter. Create a new project or sync the Excel tracker to populate tasks.
              </p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 rounded-xl bg-[#6324FC] text-white text-xs font-bold shadow-md shadow-[#6324FC]/25 hover:bg-[#521bd6] transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> Create First Project
                </button>
                <button
                  onClick={handleSeedHectorData}
                  disabled={isSeeding}
                  className="px-4 py-2 rounded-xl bg-surface border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={14} className={isSeeding ? 'animate-spin' : ''} /> Sync Excel Tracker
                </button>
              </div>
            </div>
          ) : (
            filteredProjects.map((project: any) => {
              const tasks = Array.isArray(project.tasks) ? project.tasks : [];
              const reports = Array.isArray(project.reports) ? project.reports : [];
              const totalTasks = tasks.length;
              const verifiedCount = tasks.filter((t: any) => t.status === 'Verified').length;
              const pendingApprovalCount = tasks.filter((t: any) => t.status === 'Needs Approval').length;
              const inProgressCount = tasks.filter((t: any) => t.status === 'In Progress').length;
              const isAuditingThis = auditingId === project._id;
              const isMenuOpen = openActionMenuId === project._id;

              return (
                <div
                  key={project._id}
                  className="p-5 sm:p-6 bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/10 dark:border-white/10 hover:border-[#6324FC]/40 transition-all shadow-xs relative overflow-visible group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left Column: Client & Project Info */}
                    <div className="space-y-2.5 flex-1 min-w-0">
                      
                      {/* Top Meta Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#6324FC] dark:text-[#00E5FF]">
                          {project.docNumber || 'SEO-2026-001'}
                        </span>
                        <span className="text-secondary">•</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          project.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : project.status === 'Paused'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {project.status || 'Active'} Retainer
                        </span>

                        {project.cadence && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-secondary bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                            {project.cadence} Sprint
                          </span>
                        )}

                        {pendingApprovalCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 animate-pulse">
                            <AlertCircle size={11} /> {pendingApprovalCount} Needs Approval
                          </span>
                        )}
                      </div>

                      {/* Client Title and URL */}
                      <div>
                        <Link
                          href={`/seo/${project.slug || project._id}/manage`}
                          className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors flex items-center gap-2"
                        >
                          <span>{project.clientName}</span>
                          {project.clientCompany && (
                            <span className="font-normal text-secondary text-sm">
                              ({project.clientCompany})
                            </span>
                          )}
                        </Link>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] flex items-center gap-1 transition-colors"
                          >
                            <Globe size={13} />
                            <span>{project.url}</span>
                            <ExternalLink size={11} />
                          </a>

                          {project.targetLocation && (
                            <span className="text-secondary flex items-center gap-1 font-medium">
                              <MapPin size={12} className="text-[#6324FC]" />
                              <span>{project.targetLocation}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verified Deliverables Progress Bar */}
                      <div className="pt-1 max-w-lg">
                        <div className="flex items-center justify-between text-xs font-semibold text-secondary mb-1">
                          <span>Verified Implementation: {verifiedCount} of {totalTasks}</span>
                          <span className="font-mono font-bold text-[#6324FC] dark:text-[#00E5FF]">
                            {totalTasks > 0 ? Math.round((verifiedCount / totalTasks) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex">
                          <div
                            className="bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full transition-all duration-500"
                            style={{ width: `${totalTasks > 0 ? (verifiedCount / totalTasks) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Middle Column: Google Lighthouse & Core Web Vitals */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 self-stretch lg:self-center">
                      
                      <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-[#07080B] border border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider block">Performance</span>
                        <span className={`text-lg font-mono font-black ${
                          project.lighthouse?.performance >= 90 
                            ? 'text-emerald-500' 
                            : project.lighthouse?.performance >= 50 
                            ? 'text-amber-500' 
                            : 'text-rose-500'
                        }`}>
                          {project.lighthouse?.performance || 0}
                        </span>
                      </div>

                      <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-[#07080B] border border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider block">SEO Audit</span>
                        <span className="text-lg font-mono font-black text-emerald-500">
                          {project.lighthouse?.seo || 0}
                        </span>
                      </div>

                      <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-[#07080B] border border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider block">Mobile LCP</span>
                        <span className={`text-lg font-mono font-black ${
                          (project.vitals?.lcp?.value || 0) > 4 
                            ? 'text-rose-500' 
                            : (project.vitals?.lcp?.value || 0) > 2.5 
                            ? 'text-amber-500' 
                            : 'text-emerald-500'
                        }`}>
                          {project.vitals?.lcp?.value || 0}s
                        </span>
                      </div>

                      <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-[#07080B] border border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider block">AEO Score</span>
                        <span className="text-lg font-mono font-black text-[#6324FC] dark:text-[#00E5FF]">
                          {project.aeo?.perplexityScore || 82}
                        </span>
                      </div>

                    </div>

                    {/* Right Column: Actions (Workspace, Client Report, Edit, Delete, Menu) */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-black/5 dark:border-white/5 shrink-0">
                      
                      {/* Primary Workspace CTA */}
                      <Link
                        href={`/seo/${project.slug || project._id}/manage`}
                        className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-heading font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
                      >
                        <CheckSquare size={14} />
                        <span>Workspace ({totalTasks})</span>
                      </Link>

                      {/* Secondary Client Report CTA */}
                      <Link
                        href={`/seo/${project.slug || project._id}`}
                        target="_blank"
                        className="px-4 py-2 rounded-xl bg-surface border border-black/10 dark:border-white/10 text-slate-800 dark:text-white hover:border-[#6324FC]/50 text-xs font-heading font-semibold transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-xs"
                      >
                        <Eye size={14} className="text-[#6324FC]" />
                        <span>Client Report</span>
                      </Link>

                      {/* Icon Buttons Row: Live Audit, Edit, Delete, Dropdown */}
                      <div className="flex items-center gap-1.5 self-center lg:self-end">
                        
                        {/* Live Audit Button */}
                        <button
                          type="button"
                          onClick={() => handleRunAudit(project._id)}
                          disabled={isAuditingThis}
                          className="p-2 rounded-xl text-secondary hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors disabled:opacity-50"
                          title="Run Live Google PageSpeed Audit"
                        >
                          <Gauge size={15} className={isAuditingThis ? 'animate-spin text-[#6324FC]' : ''} />
                        </button>

                        {/* Copy Client Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyClientLink(project)}
                          className="p-2 rounded-xl text-secondary hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                          title="Copy Client Weekly Report Link"
                        >
                          {copiedId === project._id ? (
                            <Check size={15} className="text-emerald-500" />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>

                        {/* Edit Project Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(project)}
                          className="p-2 rounded-xl text-secondary hover:text-[#6324FC] hover:bg-[#6324FC]/10 transition-colors"
                          title="Edit Project Details"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete Project Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                          className="p-2 rounded-xl text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </motion.div>

      </motion.div>

      {/* ========================================================================= */}
      {/* CREATE PROJECT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0E0F17] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 dark:text-white"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#6324FC]" />
                    <span className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider">
                      NEW SEO RETAINER
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                    Create SEO Project &amp; Audit Tracker
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hector Rivera"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Brand Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hector Rivera Photography"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Website URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://example.com"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-mono focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client Notification Email
                    </label>
                    <input
                      type="email"
                      placeholder="client@company.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Doc Number
                    </label>
                    <input
                      type="text"
                      value={formData.docNumber}
                      onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-mono focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Retainer Status
                    </label>
                    <CustomSelect
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      options={PROJECT_STATUS_OPTIONS}
                      className="w-full"
                      triggerClassName="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reporting Cadence
                    </label>
                    <CustomSelect
                      value={formData.cadence}
                      onChange={(val) => setFormData({ ...formData, cadence: val })}
                      options={PROJECT_CADENCE_OPTIONS}
                      className="w-full"
                      triggerClassName="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Geographic Focus
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Jersey, United States"
                    value={formData.targetLocation}
                    onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Project &amp; Strategy Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Document baseline observations, technical platform (Squarespace/WordPress/Custom), and commercial SEO goals..."
                    value={formData.weeklyNotes}
                    onChange={(e) => setFormData({ ...formData, weeklyNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-bold shadow-md shadow-[#6324FC]/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Create SEO Project</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* EDIT PROJECT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditModalOpen && editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0E0F17] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 dark:text-white"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                    <span className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider">
                      EDIT PROJECT METADATA
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                    Edit SEO Project Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company / Brand Name
                    </label>
                    <input
                      type="text"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Website URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-mono focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Client Notification Email
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Doc Number
                    </label>
                    <input
                      type="text"
                      value={formData.docNumber}
                      onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-mono focus:outline-none focus:border-[#6324FC] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Retainer Status
                    </label>
                    <CustomSelect
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      options={PROJECT_STATUS_OPTIONS}
                      className="w-full"
                      triggerClassName="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reporting Cadence
                    </label>
                    <CustomSelect
                      value={formData.cadence}
                      onChange={(val) => setFormData({ ...formData, cadence: val })}
                      options={PROJECT_CADENCE_OPTIONS}
                      className="w-full"
                      triggerClassName="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Geographic Focus
                  </label>
                  <input
                    type="text"
                    value={formData.targetLocation}
                    onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Internal Strategy Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.weeklyNotes}
                    onChange={(e) => setFormData({ ...formData, weeklyNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#6324FC] transition-colors"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-bold shadow-md shadow-[#6324FC]/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
