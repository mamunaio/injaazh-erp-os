'use client';

import React, { useState } from 'react';
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
  Building,
  MapPin,
  Star,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered prospects
  const filtered = prospects.filter((p) => {
    const matchesSearch =
      p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.businessEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.gap && p.gap.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesVerified = verifiedFilter === 'ALL' || p.emailVerified === verifiedFilter;
    const matchesReplyTag = replyTagFilter === 'ALL' || p.replyTag === replyTagFilter;

    return matchesSearch && matchesStatus && matchesVerified && matchesReplyTag;
  });

  // Summary counts
  const total = prospects.length;
  const verifiedCount = prospects.filter((p) => p.emailVerified === 'Yes').length;
  const positiveCount = prospects.filter((p) => p.replyTag === 'Positive').length;
  const callsCount = prospects.filter((p) => p.status === 'Call booked').length;
  const wonCount = prospects.filter((p) => p.status === 'Won').length;
  const suppressedCount = prospects.filter((p) => p.status === 'Suppressed').length;

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
    <div className="space-y-6 pb-12">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Prospects</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{total}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Verified Emails</span>
          <p className="text-2xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-1">{verifiedCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Positive Replies</span>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{positiveCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Calls Booked</span>
          <p className="text-2xl font-black text-amber-500 dark:text-amber-300 mt-1">{callsCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Closed Won</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{wonCount}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Suppressed</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{suppressedCount}</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Toggle, Actions */}
      <div className="flex flex-col gap-3.5 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 lg:p-5 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company, city, state, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
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
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
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
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
          >
            <option value="ALL">All Reply Tags</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
            <option value="Unsubscribe">Unsubscribe</option>
          </select>

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
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Table View or Kanban View */}
      {viewMode === 'table' ? (
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-4 pl-5 pr-3">Company &amp; Location</th>
                  <th className="px-3 py-4">Business Email</th>
                  <th className="px-3 py-4">Maps Rank &amp; Reviews</th>
                  <th className="px-3 py-4">Audit Gap Observation</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Reply Tag</th>
                  <th className="px-3 py-4">Next Follow-Up</th>
                  <th className="sticky right-0 z-20 bg-slate-50/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-4 pl-3 pr-5 text-right font-bold shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.4)] min-w-[170px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">
                      No prospects found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
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
                        className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors ${
                          isOverdue ? 'bg-rose-500/[0.04] dark:bg-rose-950/20' : isDueToday ? 'bg-amber-500/[0.04] dark:bg-amber-950/20' : ''
                        }`}
                      >
                        {/* Company & Location */}
                        <td className="py-3.5 pl-5 pr-3">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => onEditProspect(p)}
                              className="font-bold text-slate-900 dark:text-white text-sm hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors text-left flex items-center group/lead"
                              title="Click to edit prospect"
                            >
                              <span>{p.company}</span>
                              <Edit2 className="h-3 w-3 ml-1.5 opacity-0 group-hover/lead:opacity-100 text-[#6324FC] dark:text-[#00E5FF] transition-opacity" />
                            </button>
                            {p.website && (
                              <a
                                href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF]"
                                title="Visit Website"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {p.city || 'N/A'}, {p.state || ''}
                            </span>
                            <span className="text-slate-400">&bull;</span>
                            <span className="font-mono text-slate-400 text-[11px]">{p.id}</span>
                          </div>
                        </td>

                        {/* Email & Verified */}
                        <td className="px-3 py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium">{p.businessEmail}</span>
                            <button
                              onClick={() => handleCopyEmail(p.businessEmail, p.id)}
                              className="text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF]"
                              title="Copy Email"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            {copiedId === p.id && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                            )}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                p.emailVerified === 'Yes'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : p.emailVerified === 'No'
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Verified: {p.emailVerified}
                            </span>
                          </div>
                        </td>

                        {/* Maps Rank & Reviews */}
                        <td className="px-3 py-3.5">
                          <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 font-semibold">
                            {p.mapsRank || 'Not Audited'}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="flex items-center text-amber-500 dark:text-amber-400 font-bold">
                              <Star className="h-3.5 w-3.5 mr-0.5 fill-current" />
                              {p.rating || '0.0'}
                            </span>
                            <span>({p.reviewCount || 0} reviews)</span>
                          </div>
                        </td>

                        {/* Gap Observation */}
                        <td className="px-3 py-3.5 max-w-xs">
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate font-normal" title={p.gap}>
                            {p.gap || 'No observation recorded'}
                          </p>
                          {p.screenshotLink && (
                            <a
                              href={p.screenshotLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center mt-1 font-semibold"
                            >
                              View Audit Proof <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </td>

                        {/* Status (inline selector) */}
                        <td className="px-3 py-3.5">
                          <select
                            value={p.status}
                            onChange={(e) => onUpdateStatus(p.id, e.target.value as ProspectStatus)}
                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/50 px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#6324FC]"
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
                        </td>

                        {/* Reply Tag */}
                        <td className="px-3 py-3.5">
                          <select
                            value={p.replyTag}
                            onChange={(e) => onUpdateReplyTag(p.id, e.target.value as ReplyTag)}
                            className={`rounded-xl border px-2.5 py-1.5 text-xs sm:text-sm font-bold focus:outline-none ${
                              p.replyTag === 'Positive'
                                ? 'border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300'
                                : p.replyTag === 'Unsubscribe'
                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/50 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <option value="None">None</option>
                            <option value="Positive">Positive</option>
                            <option value="Neutral">Neutral</option>
                            <option value="Negative">Negative</option>
                            <option value="Unsubscribe">Unsubscribe</option>
                          </select>
                        </td>

                        {/* Next Follow-up */}
                        <td className="px-3 py-3.5">
                          {p.nextFollowUp ? (
                            <div className="flex items-center space-x-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  isOverdue
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                                    : isDueToday
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {p.nextFollowUp}
                              </span>
                              {isOverdue && <span className="text-xs text-rose-600 dark:text-rose-400 font-extrabold">Overdue</span>}
                              {isDueToday && <span className="text-xs text-amber-600 dark:text-amber-400 font-extrabold">Today</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions (Sticky Right Column) */}
                        <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-3.5 pl-3 pr-5 text-right shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.4)]">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => onEditProspect(p)}
                              className="inline-flex items-center space-x-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                              title="Edit Prospect"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWithConfirm(p)}
                              className="inline-flex items-center space-x-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
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
        </div>
      ) : (
        /* Kanban Pipeline View */
        <div className="flex space-x-5 overflow-x-auto pb-4 no-scrollbar">
          {kanbanColumns.map((col) => {
            const colProspects = filtered.filter((p) => {
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
                  <span className="rounded-full bg-slate-200 dark:bg-white/10 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {colProspects.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[640px] pr-1">
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
                                className={`rounded-full px-2 py-0.5 font-bold text-[11px] ${
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
