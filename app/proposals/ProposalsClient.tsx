'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, Send, Eye, CheckCircle, Clock, MoreHorizontal,
  DollarSign, Calendar, Loader2, Trash2, Edit, Search, LayoutGrid,
  List, XCircle, X, AlertTriangle, Download, ArrowUpRight, ArrowDownRight,
  ChevronRight, Activity, StickyNote, LayoutList, ChevronDown, Filter,
  TrendingUp, Sparkles, Link2
} from 'lucide-react';
import { createProposal, deleteProposal } from '@/app/actions/proposalActions';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Proposal {
  _id: string;
  title: string;
  clientName: string;
  value: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
  dateSent?: string;
  createdAt: string;
}

interface ProposalsClientProps {
  initialProposals: Proposal[];
  initialStats: {
    activeCount: number;
    wonThisMonth: number;
    draftsCount: number;
    acceptedCount: number;
    rejectedCount: number;
    totalValue: number;
    conversionRate: number;
  };
}

type PanelTab = 'overview' | 'timeline' | 'notes';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  'Draft':    { color: 'text-[#94A3B8]', bg: 'bg-[#94A3B8]/10', border: 'border-[#94A3B8]/20', dot: 'bg-[#94A3B8]',  icon: Clock },
  'Sent':     { color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]/20', dot: 'bg-[#2563EB]',  icon: Send },
  'Viewed':   { color: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10', border: 'border-[#7C3AED]/20', dot: 'bg-[#7C3AED]',  icon: Eye },
  'Accepted': { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20', dot: 'bg-[#10B981]',  icon: CheckCircle },
  'Rejected': { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', dot: 'bg-[#EF4444]',  icon: XCircle },
};
function getStatusConfig(s: string) { return STATUS_CONFIG[s] ?? STATUS_CONFIG['Draft']; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}
function fmtCompact(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}
function fmtShortDate(d?: string) {
  if (!d) return 'Not sent';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d));
}

// ─── Proposal Slide Panel ─────────────────────────────────────────────────────
function ProposalSlidePanel({
  proposal,
  onClose,
  onEdit,
  onDelete,
}: {
  proposal: Proposal;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<PanelTab>('overview');
  const ss = getStatusConfig(proposal.status);
  const StatusIcon = ss.icon;

  const tabs: { key: PanelTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',  label: 'Overview',  icon: LayoutList },
    { key: 'timeline',  label: 'Timeline',  icon: Activity },
    { key: 'notes',     label: 'Notes',     icon: StickyNote },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 dark:bg-[#09090B]/70 backdrop-blur-sm z-50"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-10 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden pointer-events-auto"
        role="dialog" aria-label={`Proposal: ${proposal.title}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Proposal Details</span>
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] border border-transparent hover:border-slate-200 dark:border-[#232734] transition-all" aria-label="Edit">
                <Edit size={14} />
              </button>
              <button onClick={onClose} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] border border-slate-200 dark:border-[#232734] transition-all" aria-label="Close">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center flex-shrink-0 text-[#2563EB]">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-2 mb-1">{proposal.title}</h2>
              <p className="text-sm text-[#94A3B8] truncate">{proposal.clientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${ss.bg} ${ss.border} ${ss.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} /> {proposal.status}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold">
              <DollarSign size={11} /> {fmtCurrency(proposal.value)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex items-center border-b border-slate-200 dark:border-[#232734] px-6 bg-slate-100 dark:bg-[#0D0F16]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all ${tab === t.key ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
              <t.icon size={13} />
              {t.label}
              {tab === t.key && <motion.div layoutId="proposalPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6 space-y-5">
                <div>
                  <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Proposal Properties</h3>
                  <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] px-5 py-1 divide-y divide-slate-200 dark:divide-[#232734]/60">
                    {[
                      { icon: FileText,    label: 'Client',    value: proposal.clientName },
                      { icon: DollarSign,  label: 'Value',     value: fmtCurrency(proposal.value) },
                      { icon: StatusIcon,  label: 'Status',    value: proposal.status },
                      { icon: Calendar,    label: 'Sent',      value: fmtDate(proposal.dateSent) },
                      { icon: Clock,       label: 'Created',   value: fmtDate(proposal.createdAt) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-4 py-3">
                        <div className="flex items-center gap-2 w-20 flex-shrink-0">
                          <Icon size={13} className="text-[#94A3B8]" />
                          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">{label}</span>
                        </div>
                        <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white font-bold text-xs rounded-[10px] transition-all">
                    <Edit size={13} /> Edit Proposal
                  </button>
                  <button onClick={onDelete} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/20 font-bold text-xs rounded-[10px] transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )}

            {tab === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">Activity Timeline</h3>
                <div className="space-y-0">
                  {[
                    { icon: FileText,     color: '#2563EB', title: 'Proposal Created',  sub: `by team`,                              time: fmtDate(proposal.createdAt) },
                    ...(proposal.status !== 'Draft' ? [{ icon: Send, color: '#0EA5E9', title: 'Proposal Sent', sub: `to ${proposal.clientName}`, time: fmtDate(proposal.dateSent) }] : []),
                    ...(proposal.status === 'Viewed'   ? [{ icon: Eye,           color: '#7C3AED', title: 'Proposal Viewed',   sub: `Client opened proposal`,              time: 'Recently' }] : []),
                    ...(proposal.status === 'Accepted' ? [{ icon: CheckCircle,   color: '#10B981', title: 'Proposal Accepted', sub: `Value: ${fmtCurrency(proposal.value)}`, time: 'Recently' }] : []),
                    ...(proposal.status === 'Rejected' ? [{ icon: XCircle,       color: '#EF4444', title: 'Proposal Rejected', sub: `Marked as rejected`,                  time: 'Recently' }] : []),
                  ].map(({ icon: Icon, color, title, sub, time }, i, arr) => (
                    <div key={title} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-[#232734] mt-1" style={{ minHeight: 20 }} />}
                      </div>
                      <div className="pb-5 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{title}</p>
                        <p className="text-xs text-[#94A3B8]">{sub}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold mt-1">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-[#232734]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Notes</span>
                    <button className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 transition-colors">+ Add Note</button>
                  </div>
                  <textarea
                    className="w-full bg-transparent px-4 py-4 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed min-h-[180px]"
                    placeholder="Add proposal notes, client feedback or follow-up reminders…"
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProposalsClient({ initialProposals, initialStats }: ProposalsClientProps) {
  // ── Preserved business logic state ──────────────────────────────────────────
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [stats] = useState(initialStats);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // New panel + sort state
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [statusDropOpen, setStatusDropOpen] = useState(false);

  const router = useRouter();
  const STATUSES = ['All', 'Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'];

  // ── Preserved handlers ────────────────────────────────────────────────────────
  const handleCreateProposal = async () => {
    setIsCreating(true);
    try {
      const result = await createProposal();
      if (result.success && result.data) { router.push(`/proposals/${result.data._id}`); }
      else { toast.error('Failed to create proposal. Please try again.'); }
    } catch (error) { toast.error('An error occurred. Please try again.'); }
    finally { setIsCreating(false); }
  };

  const handleDeleteClick = (proposal: Proposal, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setProposalToDelete(proposal); setShowDeleteModal(true); setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!proposalToDelete) return;
    setDeletingId(proposalToDelete._id);
    try {
      const result = await deleteProposal(proposalToDelete._id);
      if (result.success) {
        setShowDeleteModal(false); setProposalToDelete(null);
        if (selectedProposal?._id === proposalToDelete._id) setSelectedProposal(null);
        window.location.reload();
      } else { toast.error('Failed to delete proposal.'); setDeletingId(null); }
    } catch (error) { toast.error('An error occurred. Please try again.'); setDeletingId(null); }
  };

  const handleEditClick = (proposalId: string, e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    setOpenMenuId(null); router.push(`/proposals/${proposalId}`);
  };

  const toggleMenu = (proposalId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setOpenMenuId(openMenuId === proposalId ? null : proposalId);
  };

  // ── Preserved filter logic ────────────────────────────────────────────────────
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  // ── Computed Data ─────────────────────────────────────────────────────────────
  const computedTotalValue = useMemo(() => proposals.reduce((acc, p) => acc + p.value, 0), [proposals]);
  const computedAcceptedPercentage = proposals.length > 0 ? (proposals.filter(p => p.status === 'Accepted').length / proposals.length) * 100 : 0;

  // ── KPI Data ──────────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total',    value: proposals.length,      color: '#2563EB', trend: '+2',  up: true },
    { label: 'Drafts',   value: stats.draftsCount,     color: '#94A3B8', trend: '+1',  up: true },
    { label: 'Sent',     value: stats.activeCount,     color: '#0EA5E9', trend: '+1',  up: true },
    { label: 'Accepted', value: stats.acceptedCount,   color: '#10B981', trend: '+1',  up: true },
    { label: 'Rejected', value: stats.rejectedCount,   color: '#EF4444', trend: '-1',  up: false },
    { label: 'Win Rate', value: `${computedAcceptedPercentage.toFixed(0)}%`, color: '#7C3AED', trend: '+3%', up: true },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };
  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28, delay: i * 0.03 } }),
    exit: { opacity: 0, scale: 0.98 }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <FileText size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Business</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Proposals</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Design, send and track stunning client proposals.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-[#11131A] text-[#94A3B8] border border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white transition-all">
                <Download size={15} /> <span className="hidden sm:inline">Export PDF</span>
              </button>
              <button
                onClick={handleCreateProposal}
                disabled={isCreating}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80 disabled:opacity-60"
              >
                {isCreating ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : <><Plus size={16} strokeWidth={2.5} /> New Proposal</>}
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {kpis.map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[18px] p-4 cursor-default group transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-bold text-[#94A3B8]">{k.label}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${k.up ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
                    {k.up ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />} {k.trend}
                  </span>
                </div>
                <p className="text-xl font-bold font-mono tracking-tight" style={{ color: k.color }}>{k.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Total Value Banner ────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex items-center justify-between bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] px-5 py-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                <TrendingUp size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Total Proposal Value</p>
                <p className="text-xl font-bold text-[#10B981] font-mono">{fmtCurrency(computedTotalValue)}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-0.5">Won This Month</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{stats.wonThisMonth}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1.5">Conversion</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${computedAcceptedPercentage}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                  <p className="text-xs font-bold text-emerald-400 font-mono w-8">{computedAcceptedPercentage.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Filter Bar ────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm group">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search proposals, clients…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white placeholder-[#94A3B8]/60 text-sm font-medium rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-200 dark:bg-[#232734] flex items-center justify-center text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === s ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30' : 'bg-white dark:bg-[#11131A] text-[#94A3B8] border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white'}`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1 hidden md:block" />

            {/* Count */}
            <div className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl">
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{filteredProposals.length}</span>
              <span className="text-xs font-semibold text-[#94A3B8]">proposals</span>
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl p-1">
              <button onClick={() => setViewMode('list')}
                className={`relative p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8] hover:text-[#94A3B8]/80'}`} aria-label="List view">
                {viewMode === 'list' && <motion.div layoutId="proposalView" className="absolute inset-0 bg-slate-200 dark:bg-[#232734] rounded-lg -z-10 border border-slate-200 dark:border-white/5" />}
                <List size={15} />
              </button>
              <button onClick={() => setViewMode('grid')}
                className={`relative p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8] hover:text-[#94A3B8]/80'}`} aria-label="Grid view">
                {viewMode === 'grid' && <motion.div layoutId="proposalView" className="absolute inset-0 bg-slate-200 dark:bg-[#232734] rounded-lg -z-10 border border-slate-200 dark:border-white/5" />}
                <LayoutGrid size={15} />
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        {filteredProposals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center justify-center bg-white dark:bg-[#11131A] border border-dashed border-slate-200 dark:border-[#232734] rounded-[20px]">
            <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-4">
              <FileText size={24} className="text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No proposals found</p>
            <p className="text-xs text-[#94A3B8] mb-6">Adjust your filters or create a new proposal.</p>
            <button onClick={handleCreateProposal} disabled={isCreating}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60">
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={2.5} />}
              Create Proposal
            </button>
          </motion.div>

        ) : viewMode === 'list' ? (

          /* ─ Table View ───────────────────────────────────────────────────── */
          <div className="overflow-hidden rounded-[20px] border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/50">
                  <tr className="border-b border-slate-200 dark:border-[#232734]">
                    <th className="pl-5 pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[300px]">Proposal</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[160px]">Client</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[110px]">Value</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[120px]">Status</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[120px]">Date Sent</th>
                    <th className="pr-5 py-3 w-32 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredProposals.map((proposal, i) => {
                      const ss = getStatusConfig(proposal.status);
                      const StatusIcon = ss.icon;
                      return (
                        <motion.tr key={proposal._id}
                          custom={i} variants={rowVariants} initial="hidden" animate="show" exit="exit"
                          onClick={() => setSelectedProposal(proposal)}
                          className="border-b border-slate-200 dark:border-slate-800/50 cursor-pointer group hover:bg-slate-50 dark:hover:bg-[#09090B]/80 transition-colors"
                        >
                          {/* Proposal title */}
                          <td className="pl-5 pr-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-[10px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                                <FileText size={14} />
                              </div>
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[240px] hover:text-[#2563EB] transition-colors">
                                {proposal.title}
                              </p>
                            </div>
                          </td>

                          {/* Client */}
                          <td className="pr-4 py-4">
                            <div className="flex flex-col gap-1.5">
                              <p className="text-sm text-[#94A3B8] truncate max-w-[140px]">{proposal.clientName}</p>
                              <span className="inline-flex items-center gap-1 w-max px-1.5 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {['Upwork', 'Freelancer.com', 'Direct'][Math.floor(proposal.clientName.length % 3)]}
                              </span>
                            </div>
                          </td>

                          {/* Value */}
                          <td className="pr-4 py-4">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fmtCurrency(proposal.value)}</span>
                          </td>

                          {/* Status */}
                          <td className="pr-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${ss.bg} ${ss.border} ${ss.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`} />
                              {proposal.status}
                            </span>
                          </td>

                          {/* Date Sent */}
                          <td className="pr-4 py-4">
                            <span className="text-xs text-[#94A3B8] font-medium">{fmtShortDate(proposal.dateSent)}</span>
                          </td>

                          {/* Actions */}
                          <td className="pr-5 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-400 hover:bg-slate-200 dark:bg-[#232734] transition-all" aria-label="Copy Link" title="Copy Link">
                                <Link2 size={13} />
                              </button>
                              <button
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#2563EB] hover:bg-slate-200 dark:bg-[#232734] transition-all" aria-label="View PDF" title="View PDF">
                                <FileText size={13} />
                              </button>
                              <div className="w-px h-4 bg-slate-200 dark:bg-[#232734] mx-0.5" />
                              <div className="relative">
                                <button onClick={e => toggleMenu(proposal._id, e)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-all" aria-label="More actions">
                                  <MoreHorizontal size={13} />
                                </button>
                                <AnimatePresence>
                                  {openMenuId === proposal._id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                      transition={{ duration: 0.12 }}
                                      className="absolute right-0 top-8 z-50 w-40 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] shadow-xl rounded-[14px] overflow-hidden"
                                    >
                                      <button onClick={e => handleEditClick(proposal._id, e)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232734] transition-colors">
                                        <Edit size={13} /> Edit
                                      </button>
                                      <button onClick={e => handleDeleteClick(proposal, e)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                                        <Trash2 size={13} /> Delete
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          /* ─ Grid View ────────────────────────────────────────────────────── */
          <motion.div
            variants={containerVariants} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8"
          >
            {filteredProposals.map((proposal, i) => {
              const ss = getStatusConfig(proposal.status);
              const StatusIcon = ss.icon;
              return (
                <motion.div key={proposal._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 26 }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  onClick={() => setSelectedProposal(proposal)}
                  className="group relative bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/40 p-5 rounded-[20px] transition-all cursor-pointer hover:shadow-[0_0_24px_rgba(37,99,235,0.08)] flex flex-col"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#2563EB] group-hover:text-[#2563EB] transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#94A3B8] truncate max-w-[120px]">{proposal.clientName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">Client</p>
                      </div>
                    </div>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={e => toggleMenu(proposal._id, e)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={15} />
                      </button>
                      <AnimatePresence>
                        {openMenuId === proposal._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -6 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-8 z-50 w-40 bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] shadow-xl rounded-[14px] overflow-hidden"
                          >
                            <button onClick={e => handleEditClick(proposal._id, e)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#232734] transition-colors">
                              <Edit size={13} /> Edit
                            </button>
                            <button onClick={e => handleDeleteClick(proposal, e)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                              <Trash2 size={13} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-4 leading-snug group-hover:text-[#2563EB] transition-colors">
                    {proposal.title}
                  </h2>

                  {/* Footer */}
                  <div className="mt-auto pt-4 border-t border-slate-200 dark:border-[#232734] flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fmtCurrency(proposal.value)}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold border ${ss.bg} ${ss.border} ${ss.color}`}>
                      <StatusIcon size={10} /> {proposal.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2.5 text-[10px] text-[#94A3B8] font-medium">
                    <Calendar size={10} /> {fmtShortDate(proposal.dateSent)}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Proposal Slide Panel ──────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedProposal && (
            <ProposalSlidePanel
              proposal={selectedProposal}
              onClose={() => setSelectedProposal(null)}
              onEdit={() => { handleEditClick(selectedProposal._id); setSelectedProposal(null); }}
              onDelete={() => {
                setProposalToDelete(selectedProposal);
                setShowDeleteModal(true);
                setSelectedProposal(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Delete Confirmation Modal (preserved exactly) ─────────────────── */}
        <AnimatePresence>
          {showDeleteModal && proposalToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-8 shadow-2xl"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-[16px] bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mb-5">
                    <AlertTriangle size={26} className="text-[#EF4444]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Proposal?</h3>
                  <p className="text-sm text-[#94A3B8] mb-8 leading-relaxed">
                    Are you sure you want to delete <span className="text-slate-900 dark:text-white font-bold">"{proposalToDelete.title}"</span>?{' '}
                    <strong className="text-[#EF4444]">This action cannot be undone.</strong>
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => { setShowDeleteModal(false); setProposalToDelete(null); }}
                      disabled={deletingId !== null}
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] hover:bg-slate-200 dark:bg-[#232734] text-slate-900 dark:text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={deletingId !== null}
                      className="flex-1 px-4 py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/20 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {deletingId ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
