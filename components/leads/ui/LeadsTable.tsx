'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Mail, Phone, Clock, CheckCircle, Globe, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

interface LeadsTableProps {
  paginatedLeads: any[];
  selectedLeads: string[];
  setSelectedLeads: (leads: string[]) => void;
  handleCardClick: (lead: any) => void;
  toggleMenu: (id: string, e: React.MouseEvent) => void;
  getStatusConfig: (status: string) => any;
  formatDate: (date?: string) => string;
  openMenuId?: string | null;
}

type SortKey = 'company_name' | 'status' | 'leadScore' | 'createdAt' | null;
type SortDir = 'asc' | 'desc';

// Semantic status badge mapping
const STATUS_STYLES: Record<string, { text: string; dot: string }> = {
  'New':             { text: 'text-slate-500 dark:text-slate-400',  dot: 'bg-slate-400' },
  'Contacted':       { text: 'text-amber-500',  dot: 'bg-amber-500' },
  'Replied':         { text: 'text-emerald-500',  dot: 'bg-emerald-500' },
  'Meeting Booked':  { text: 'text-cyan-500',  dot: 'bg-cyan-500' },
  'Closed':          { text: 'text-[#10B981]',  dot: 'bg-[#10B981]' },
  'Not Interested':  { text: 'text-[#EF4444]',  dot: 'bg-[#EF4444]' },
};

const STATUS_BG: Record<string, string> = {
  'New':             'bg-slate-400/10 border-slate-400/20',
  'Contacted':       'bg-amber-500/10 border-amber-500/20',
  'Replied':         'bg-emerald-500/10 border-emerald-500/20',
  'Meeting Booked':  'bg-cyan-500/10 border-cyan-500/20',
  'Closed':          'bg-[#10B981]/10 border-[#10B981]/20',
  'Not Interested':  'bg-[#EF4444]/10 border-[#EF4444]/20',
};

function getInitials(name: string) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={12} className="text-[#232734] group-hover:text-slate-400 transition-colors" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-[#2563EB]" />
    : <ChevronDown size={12} className="text-[#2563EB]" />;
}

export default function LeadsTable({
  paginatedLeads,
  selectedLeads,
  setSelectedLeads,
  handleCardClick,
  toggleMenu,
  getStatusConfig,
  formatDate,
  openMenuId,
}: LeadsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...paginatedLeads].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allSelected = sorted.length > 0 && selectedLeads.length === sorted.length;
  const someSelected = selectedLeads.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelectedLeads([]);
    else setSelectedLeads(sorted.map(l => l._id));
  };

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(x => x !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({
      opacity: 1, y: 0,
      transition: { type: 'spring' as const, stiffness: 320, damping: 28, delay: i * 0.03 }
    }),
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } }
  };

  // ─── Header Cell ───────────────────────────────────────────────────────────
  const Th = ({
    children,
    col,
    className = ''
  }: {
    children: React.ReactNode;
    col?: SortKey;
    className?: string;
  }) => (
    <th
      className={`px-5 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest whitespace-nowrap select-none border-b border-slate-200 dark:border-[#232734] ${col ? 'cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors' : ''} ${className}`}
      onClick={col ? () => handleSort(col) : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {col && <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />}
      </div>
    </th>
  );

  // ─── Empty State ────────────────────────────────────────────────────────────
  if (sorted.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-32 flex flex-col items-center justify-center text-[#94A3B8] bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px]"
      >
        <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#232734]"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No prospects found</p>
        <p className="text-xs text-[#94A3B8]">Try adjusting your filters or search term.</p>
      </motion.div>
    );
  }

  return (
    <div className="w-full rounded-[24px] border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] relative shadow-sm overflow-hidden">

      {/* ─── Desktop Table ──────────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20 bg-slate-100/90 dark:bg-[#09090B]/90 backdrop-blur-md shadow-sm">
            <tr>
              {/* Checkbox */}
              <th className="pl-6 pr-3 py-4 w-12 border-b border-slate-200 dark:border-[#232734]">
                <button
                  onClick={toggleAll}
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                    allSelected
                      ? 'bg-[#2563EB] border-[#2563EB] text-slate-900 dark:text-white'
                      : someSelected
                        ? 'bg-[#2563EB]/30 border-[#2563EB]/50 text-[#2563EB]'
                        : 'border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] hover:border-slate-400'
                  }`}
                  aria-label="Select all"
                >
                  {(allSelected || someSelected) && <CheckCircle size={10} strokeWidth={3} />}
                </button>
              </th>
              <Th col="company_name" className="pl-2 min-w-[220px]">Company</Th>
              <Th className="min-w-[160px]">Contact</Th>
              <Th className="min-w-[200px]">Email</Th>
              <Th className="min-w-[140px]">Phone</Th>
              <Th col="leadScore" className="min-w-[120px]">Score</Th>
              <Th col="status" className="min-w-[140px]">Status</Th>
              <Th col="createdAt" className="min-w-[130px]">Added</Th>
              <Th className="min-w-[140px]">Next Follow-up</Th>
              <th className="pr-6 py-4 w-12 border-b border-slate-200 dark:border-[#232734]" />
            </tr>
          </thead>

          <tbody className="divide-y divide-[#232734]/50">
            <AnimatePresence>
              {sorted.map((lead, i) => {
                const isSelected = selectedLeads.includes(lead._id);
                const status     = lead.status || 'New';
                const statusStyle = STATUS_STYLES[status] ?? { text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' };
                const statusBg    = STATUS_BG[status] ?? 'bg-slate-400/10 border-slate-400/20';
                const initials    = getInitials(lead.company_name || lead.contact_person);
                const score       = lead.leadScore ?? 50;

                return (
                  <motion.tr
                    key={lead._id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    onClick={() => handleCardClick(lead)}
                    className={`cursor-pointer transition-all duration-200 group ${
                      isSelected
                        ? 'bg-[#2563EB]/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="pl-6 pr-3 py-4" onClick={e => toggleOne(lead._id, e)}>
                      <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#2563EB] border-[#2563EB] text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B] group-hover:border-slate-400'
                      }`}>
                        {isSelected && <CheckCircle size={10} strokeWidth={3} />}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="pl-2 pr-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold flex-shrink-0 group-hover:border-slate-600 transition-colors">
                          {initials}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-[13px] truncate max-w-[160px]">
                          {lead.company_name || 'Unknown'}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="pr-4 py-4">
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium truncate block max-w-[140px]">
                        {lead.contact_person || <span className="text-slate-600">—</span>}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="pr-4 py-4">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors truncate max-w-[180px]"
                        >
                          <Mail size={14} className="text-slate-500 flex-shrink-0" />
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="pr-4 py-4">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Phone size={14} className="text-slate-500 flex-shrink-0" />
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Lead Score */}
                    <td className="pr-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score}%`,
                              backgroundColor: score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">{score}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="pr-4 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${statusBg} ${statusStyle.text} backdrop-blur-sm`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusStyle.dot}`} style={{ boxShadow: `0 0 8px currentColor` }} />
                        {status}
                      </span>
                    </td>

                    {/* Added */}
                    <td className="pr-4 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatDate(lead.createdAt)}</span>
                    </td>

                    {/* Next Follow-up */}
                    <td className="pr-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-500 flex-shrink-0" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatDate(lead.nextFollowUpDate)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="pr-6 py-4 text-right">
                      <button
                        onClick={e => toggleMenu(lead._id, e)}
                        className={`w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          openMenuId === lead._id ? 'opacity-100 bg-slate-100 dark:bg-slate-700' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        aria-label="More actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ─── Mobile Card List ───────────────────────────────────────────────── */}
      <div className="md:hidden divide-y divide-[#232734]">
        <AnimatePresence>
          {sorted.map((lead, i) => {
            const isSelected  = selectedLeads.includes(lead._id);
            const status      = lead.status || 'New';
            const statusStyle = STATUS_STYLES[status] ?? { text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' };
            const statusBg    = STATUS_BG[status] ?? 'bg-slate-400/10 border-slate-400/20';
            const initials    = getInitials(lead.company_name || lead.contact_person);
            const score       = lead.leadScore ?? 50;

            return (
              <motion.div
                key={lead._id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={() => handleCardClick(lead)}
                className={`p-5 cursor-pointer transition-colors ${isSelected ? 'bg-[#2563EB]/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div onClick={e => toggleOne(lead._id, e)} className="mt-1 flex-shrink-0">
                    <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center ${
                      isSelected ? 'bg-[#2563EB] border-[#2563EB] text-slate-900 dark:text-white' : 'border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-[#09090B]'
                    }`}>
                      {isSelected && <CheckCircle size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-[12px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{lead.company_name || 'Unknown'}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusBg} ${statusStyle.text} flex-shrink-0 ml-2`}>
                        <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} style={{ boxShadow: `0 0 6px currentColor` }} />
                        {status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-3">{lead.contact_person || lead.email || '—'}</p>
                    <div className="flex items-center gap-4">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Mail size={12} /> <span className="truncate max-w-[120px]">{lead.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score}%`,
                              backgroundColor: score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">{score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={e => toggleMenu(lead._id, e)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-all flex-shrink-0"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
