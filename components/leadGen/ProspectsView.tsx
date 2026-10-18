'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Upload,
  ExternalLink,
  Edit2,
  Trash2,
  Kanban,
  Table as TableIcon,
  Copy,
  Check,
  Building,
  MapPin,
  Star,
  Calendar,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  FileText,
  Mail,
  CheckCircle2,
  Clock,
  ChevronDown,
  Globe,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { Prospect, ProspectStatus, ReplyTag } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface ProspectsViewProps {
  prospects: Prospect[];
  onOpenNewModal: () => void;
  onEditProspect: (prospect: Prospect) => void;
  onDeleteProspect: (id: string) => void;
  onUpdateStatus: (id: string, status: ProspectStatus) => void;
  onUpdateReplyTag: (id: string, tag: ReplyTag) => void;
  onOpenImportModal: () => void;
}

type SortField = 'company' | 'rating' | 'status' | 'nextFollowUp' | null;
type SortOrder = 'asc' | 'desc';

export default function ProspectsView({
  prospects,
  onOpenNewModal,
  onEditProspect,
  onDeleteProspect,
  onUpdateStatus,
  onUpdateReplyTag,
  onOpenImportModal,
}: ProspectsViewProps) {
  const { confirm } = useConfirm();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('ALL');
  const [replyTagFilter, setReplyTagFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDeleteWithConfirm = async (p: Prospect) => {
    const confirmed = await confirm({
      title: 'Delete Prospect',
      message: `Are you sure you want to permanently delete "${p.company}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      onDeleteProspect(p.id);
    }
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const hasActiveFilters = Boolean(
    searchTerm || statusFilter !== 'ALL' || verifiedFilter !== 'ALL' || replyTagFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setVerifiedFilter('ALL');
    setReplyTagFilter('ALL');
  };

  // Filter & Sort prospects
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = prospects.filter((p) => {
      const matchesSearch =
        !term ||
        p.company.toLowerCase().includes(term) ||
        p.businessEmail.toLowerCase().includes(term) ||
        p.city.toLowerCase().includes(term) ||
        p.state.toLowerCase().includes(term) ||
        (p.gap && p.gap.toLowerCase().includes(term));

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesVerified = verifiedFilter === 'ALL' || p.emailVerified === verifiedFilter;
      const matchesReplyTag = replyTagFilter === 'ALL' || p.replyTag === replyTagFilter;

      return matchesSearch && matchesStatus && matchesVerified && matchesReplyTag;
    });

    if (sortField) {
      return [...result].sort((a, b) => {
        if (sortField === 'company') {
          return sortOrder === 'asc'
            ? a.company.localeCompare(b.company)
            : b.company.localeCompare(a.company);
        }
        if (sortField === 'rating') {
          const rA = a.rating || 0;
          const rB = b.rating || 0;
          return sortOrder === 'asc' ? rA - rB : rB - rA;
        }
        if (sortField === 'status') {
          return sortOrder === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        if (sortField === 'nextFollowUp') {
          const dA = a.nextFollowUp || '9999-99-99';
          const dB = b.nextFollowUp || '9999-99-99';
          return sortOrder === 'asc' ? dA.localeCompare(dB) : dB.localeCompare(dA);
        }
        return 0;
      });
    }

    return result;
  }, [prospects, searchTerm, statusFilter, verifiedFilter, replyTagFilter, sortField, sortOrder]);

  // Summary counts
  const total = prospects.length;
  const verifiedCount = prospects.filter((p) => p.emailVerified === 'Yes').length;
  const positiveCount = prospects.filter((p) => p.replyTag === 'Positive').length;
  const callsCount = prospects.filter((p) => p.status === 'Call booked').length;
  const wonCount = prospects.filter((p) => p.status === 'Won').length;
  const suppressedCount = prospects.filter((p) => p.status === 'Suppressed').length;

  // Visual helper: company avatar gradient
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-indigo-600 to-violet-600',
      'from-cyan-600 to-blue-600',
      'from-violet-600 to-fuchsia-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
      'from-rose-600 to-pink-600',
      'from-[#6324FC] to-[#4F46E5]',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  // Visual helper: pipeline status badge style
  const getStatusBadgeStyle = (status: ProspectStatus) => {
    switch (status) {
      case 'Won':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'Call booked':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'Reply received':
        return 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400';
      case 'Follow-up 1':
      case 'Follow-up 2':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'Email 1 sent':
        return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
      case 'Verified':
        return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400';
      case 'Audit sent':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'Lost':
      case 'Suppressed':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400';
      default:
        return 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300';
    }
  };

  const getStatusDotColor = (status: ProspectStatus) => {
    switch (status) {
      case 'Won': return 'bg-emerald-500';
      case 'Call booked': return 'bg-purple-500';
      case 'Reply received': return 'bg-teal-500';
      case 'Follow-up 1':
      case 'Follow-up 2': return 'bg-amber-500';
      case 'Email 1 sent': return 'bg-indigo-500';
      case 'Verified': return 'bg-cyan-500';
      case 'Audit sent': return 'bg-blue-500';
      case 'Lost':
      case 'Suppressed': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const kanbanColumns: { status: ProspectStatus; title: string; color: string }[] = [
    { status: 'New', title: 'New Leads', color: 'border-slate-200 dark:border-slate-800' },
    { status: 'Verified', title: 'Verified Contacts', color: 'border-cyan-500/30 dark:border-cyan-500/20' },
    { status: 'Email 1 sent', title: 'Email 1 Sent', color: 'border-indigo-500/30 dark:border-indigo-500/20' },
    { status: 'Follow-up 1', title: 'Follow-ups Active', color: 'border-amber-500/30 dark:border-amber-500/20' },
    { status: 'Call booked', title: 'Calls Booked', color: 'border-purple-500/30 dark:border-purple-500/20' },
    { status: 'Won', title: 'Won Retainers', color: 'border-emerald-500/30 dark:border-emerald-500/20' },
    { status: 'Suppressed', title: 'Suppressed / Stop', color: 'border-rose-500/30 dark:border-rose-500/20' },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Prospects</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">{total}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Verified Emails</span>
          <p className="text-xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-0.5 font-mono">{verifiedCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Positive Replies</span>
          <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 font-mono">{positiveCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Calls Booked</span>
          <p className="text-xl font-black text-amber-500 dark:text-amber-300 mt-0.5 font-mono">{callsCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Closed Won</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{wonCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Suppressed</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono">{suppressedCount}</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Toggle, Actions */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-3 lg:p-4 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search company, city, state, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 py-2.5 pl-10 pr-9 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              title="Clear Search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Verified">Verified</option>
            <option value="Email 1 sent">Email 1 sent</option>
            <option value="Follow-up 1">Follow-up 1</option>
            <option value="Follow-up 2">Follow-up 2</option>
            <option value="Reply received">Reply received</option>
            <option value="Audit sent">Audit sent</option>
            <option value="Call booked">Call booked</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
            <option value="Suppressed">Suppressed</option>
          </select>

          {/* Email Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all cursor-pointer"
          >
            <option value="ALL">All Verification</option>
            <option value="Yes">Verified (Yes)</option>
            <option value="No">Unverified (No)</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Reply Tag Filter */}
          <select
            value={replyTagFilter}
            onChange={(e) => setReplyTagFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all cursor-pointer"
          >
            <option value="ALL">All Reply Tags</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
            <option value="Unsubscribe">Unsubscribe</option>
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* View Toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-white/10 text-[#6324FC] dark:text-[#00E5FF] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-white/10 text-[#6324FC] dark:text-[#00E5FF] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Kanban Pipeline"
            >
              <Kanban className="h-4 w-4" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Import Button */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 transition"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Add New Lead */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Table View or Kanban View */}
      {viewMode === 'table' ? (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0d14]/90 shadow-sm backdrop-blur-xl">
          {/* Table Header Mini-Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'Prospect' : 'Prospects'}
              </span>
              {hasActiveFilters && (
                <span className="rounded-full bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] px-2 py-0.5 text-[11px] font-bold">
                  Filtered
                </span>
              )}
              {sortField && (
                <span className="rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2 py-0.5 text-[11px] font-mono font-medium">
                  Sorted: {sortField} ({sortOrder})
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400 hidden sm:block">
              Tip: Click on column headers to sort &bull; Click company name to edit
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <tr>
                  {/* Company Column Header */}
                  <th
                    onClick={() => toggleSort('company')}
                    className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[190px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Company</span>
                      {sortField === 'company' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                      )}
                    </div>
                  </th>

                  {/* Business Email */}
                  <th className="px-3 py-2.5 min-w-[170px]">
                    <span>Business Email</span>
                  </th>

                  {/* Maps Rank & Reviews */}
                  <th
                    onClick={() => toggleSort('rating')}
                    className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[120px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Rank &amp; Rating</span>
                      {sortField === 'rating' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                      )}
                    </div>
                  </th>

                  {/* Audit Gap */}
                  <th className="px-3 py-2.5 min-w-[160px]">
                    <span>Observation / Gap</span>
                  </th>

                  {/* Status */}
                  <th
                    onClick={() => toggleSort('status')}
                    className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Pipeline Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                      )}
                    </div>
                  </th>

                  {/* Reply Tag */}
                  <th className="px-3 py-2.5 min-w-[105px]">
                    <span>Reply Tag</span>
                  </th>

                  {/* Next Follow-Up */}
                  <th
                    onClick={() => toggleSort('nextFollowUp')}
                    className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[120px]"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Next Follow-Up</span>
                      {sortField === 'nextFollowUp' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                      )}
                    </div>
                  </th>

                  {/* Actions Header (Sticky Right) */}
                  <th className="sticky right-0 z-20 bg-slate-50/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right font-bold shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)] min-w-[115px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                        <div className="h-12 w-12 rounded-2xl bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] mb-3">
                          <Search className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">No matching prospects found</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                          Try adjusting your search terms or filters to find what you are looking for.
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6324FC] to-[#4F46E5] shadow-md hover:opacity-95 transition"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Reset All Filters</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((p) => {
                    const isOverdue =
                      p.nextFollowUp &&
                      p.nextFollowUp < todayStr &&
                      p.status !== 'Won' &&
                      p.status !== 'Suppressed';
                    const isDueToday =
                      p.nextFollowUp &&
                      p.nextFollowUp === todayStr &&
                      p.status !== 'Won' &&
                      p.status !== 'Suppressed';

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors ${
                          isOverdue ? 'bg-rose-500/[0.04] dark:bg-rose-950/20' : isDueToday ? 'bg-amber-500/[0.04] dark:bg-amber-950/20' : ''
                        }`}
                      >
                        {/* 1. Company & Location */}
                        <td className="py-2.5 pl-4 pr-3">
                          <div className="flex items-center space-x-2.5">
                            {/* Stylized Gradient Avatar */}
                            <div
                              className={`h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                                p.company
                              )} flex items-center justify-center text-white font-extrabold text-xs shadow-sm ring-1 ring-black/10 dark:ring-white/10`}
                            >
                              {p.company.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditProspect(p)}
                                  className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors text-left truncate flex items-center group/lead"
                                  title="Click to edit prospect"
                                >
                                  <span className="truncate">{p.company}</span>
                                  <Edit2 className="h-3 w-3 ml-1 opacity-0 group-hover/lead:opacity-100 text-[#6324FC] dark:text-[#00E5FF] transition-opacity shrink-0" />
                                </button>

                                {p.website && (
                                  <a
                                    href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
                                    title={`Visit ${p.website}`}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span>{p.city || 'N/A'}{p.state ? `, ${p.state}` : ''}</span>
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                                <span className="font-mono text-slate-400 text-[10px] uppercase">{p.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Business Email & Verification */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-slate-800 dark:text-slate-200 text-xs font-semibold truncate max-w-[150px]">
                              {p.businessEmail}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(p.businessEmail, p.id)}
                              className="text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition"
                              title="Copy Email"
                            >
                              {copiedId === p.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {copiedId === p.id && (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">Copied!</span>
                            )}
                          </div>

                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                p.emailVerified === 'Yes'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : p.emailVerified === 'No'
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  p.emailVerified === 'Yes'
                                    ? 'bg-emerald-500'
                                    : p.emailVerified === 'No'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-400'
                                }`}
                              />
                              <span>Verified: {p.emailVerified}</span>
                            </span>
                          </div>
                        </td>

                        {/* 3. Maps Rank & Reviews */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/5 dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-black/5 dark:border-white/10">
                              {p.mapsRank ? `#${p.mapsRank} Rank` : 'Unranked'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="inline-flex items-center text-amber-500 dark:text-amber-400 font-bold">
                              <Star className="h-3.5 w-3.5 mr-0.5 fill-current" />
                              <span>{Number(p.rating || 0).toFixed(1)}</span>
                            </span>
                            <span className="text-[11px]">({p.reviewCount || 0})</span>
                          </div>
                        </td>

                        {/* 4. Audit Gap Observation */}
                        <td className="px-3 py-2.5 max-w-xs">
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-normal leading-relaxed" title={p.gap || ''}>
                            {p.gap || <span className="text-slate-400 italic">No observation</span>}
                          </p>
                          {p.screenshotLink && (
                            <a
                              href={p.screenshotLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[#6324FC] dark:text-[#00E5FF] hover:underline inline-flex items-center gap-1 mt-0.5 font-semibold"
                            >
                              <span>View Proof</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </td>

                        {/* 5. Pipeline Status (Styled Pill Selector) */}
                        <td className="px-3 py-2.5">
                          <div className="relative inline-block w-full">
                            <select
                              value={p.status}
                              onChange={(e) => onUpdateStatus(p.id, e.target.value as ProspectStatus)}
                              className={`w-full appearance-none rounded-xl border px-2.5 py-1.5 pr-6 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6324FC]/20 transition cursor-pointer ${getStatusBadgeStyle(
                                p.status
                              )}`}
                            >
                              <option value="New">New</option>
                              <option value="Verified">Verified</option>
                              <option value="Email 1 sent">Email 1 sent</option>
                              <option value="Follow-up 1">Follow-up 1</option>
                              <option value="Follow-up 2">Follow-up 2</option>
                              <option value="Reply received">Reply received</option>
                              <option value="Audit sent">Audit sent</option>
                              <option value="Call booked">Call booked</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                              <option value="Suppressed">Suppressed</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                          </div>
                        </td>

                        {/* 6. Reply Tag */}
                        <td className="px-3 py-2.5">
                          <div className="relative inline-block w-full">
                            <select
                              value={p.replyTag}
                              onChange={(e) => onUpdateReplyTag(p.id, e.target.value as ReplyTag)}
                              className={`w-full appearance-none rounded-xl border px-2 py-1.5 pr-5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6324FC]/20 transition cursor-pointer ${
                                p.replyTag === 'Positive'
                                  ? 'border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300'
                                  : p.replyTag === 'Unsubscribe'
                                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                  : p.replyTag === 'Negative'
                                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/50 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <option value="None">None</option>
                              <option value="Positive">Positive</option>
                              <option value="Neutral">Neutral</option>
                              <option value="Negative">Negative</option>
                              <option value="Unsubscribe">Unsubscribe</option>
                            </select>
                            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
                          </div>
                        </td>

                        {/* 7. Next Follow-up */}
                        <td className="px-3 py-2.5">
                          {p.nextFollowUp ? (
                            <div className="flex flex-col space-y-0.5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold border w-max ${
                                  isOverdue
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    : isDueToday
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                }`}
                              >
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span className="font-mono text-[11px]">{p.nextFollowUp}</span>
                              </span>
                              {isOverdue && (
                                <span className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wide">
                                  Overdue
                                </span>
                              )}
                              {isDueToday && (
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wide">
                                  Today
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* 8. Actions (Sticky Right Column) */}
                        <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => onEditProspect(p)}
                              className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                              title="Edit Prospect"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWithConfirm(p)}
                              className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
                              title="Delete Prospect"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Footer Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div>
              Showing <span className="font-bold text-slate-900 dark:text-white font-mono">{filteredAndSorted.length}</span> of <span className="font-bold text-slate-900 dark:text-white font-mono">{total}</span> total pipeline records
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{verifiedCount} Verified</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>{callsCount} Calls</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span>{positiveCount} Positive</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{wonCount} Won</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban Pipeline View */
        <div className="flex space-x-5 overflow-x-auto pb-4 no-scrollbar">
          {kanbanColumns.map((col) => {
            const colProspects = filteredAndSorted.filter((p) => {
              if (col.status === 'Follow-up 1') {
                return (
                  p.status === 'Follow-up 1' ||
                  p.status === 'Follow-up 2' ||
                  p.status === 'Reply received'
                );
              }
              return p.status === col.status;
            });

            return (
              <div
                key={col.status}
                className={`w-80 shrink-0 rounded-3xl border p-4 backdrop-blur-xl flex flex-col shadow-sm bg-slate-50/80 dark:bg-[#0c0d14]/80 ${col.color}`}
              >
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3 mb-3.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{col.title}</h4>
                  <span className="rounded-full bg-slate-200 dark:bg-white/10 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {colProspects.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colProspects.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                      No prospects in this stage
                    </div>
                  ) : (
                    colProspects.map((p) => {
                      const isOverdue =
                        p.nextFollowUp &&
                        p.nextFollowUp < todayStr &&
                        p.status !== 'Won' &&
                        p.status !== 'Suppressed';
                      return (
                        <div
                          key={p.id}
                          className={`rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/50 p-4 shadow-sm hover:shadow-md hover:border-[#6324FC]/40 transition-all ${
                            isOverdue ? 'border-l-4 border-l-rose-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 mr-2">
                              <button
                                type="button"
                                onClick={() => onEditProspect(p)}
                                className="font-bold text-sm text-slate-900 dark:text-white leading-snug hover:text-[#6324FC] dark:hover:text-[#00E5FF] text-left transition"
                                title="Click to edit prospect"
                              >
                                {p.company}
                              </button>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {p.city}, {p.state}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onEditProspect(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-slate-100 dark:hover:bg-white/10 transition"
                                title="Edit Prospect"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithConfirm(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                title="Delete Prospect"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {p.gap && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-100 dark:border-white/5 line-clamp-2">
                              {p.gap}
                            </p>
                          )}

                          <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-mono truncate max-w-[150px]">
                              {p.businessEmail}
                            </span>
                            {p.nextFollowUp && (
                              <span
                                className={`rounded-full px-2 py-0.5 font-bold text-[11px] font-mono ${
                                  isOverdue ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {p.nextFollowUp}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
