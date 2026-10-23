'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Accurate local date string (YYYY-MM-DD) avoiding UTC day-shift
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formatted display date: "Oct 26, 2026"
const formatDisplayDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length !== 3) return clean;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return clean;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Relative date indicator (overdue, today, tomorrow, upcoming)
const getDateStatus = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const today = getTodayStr();

  const [tY, tM, tD] = today.split('-').map(Number);
  const [dY, dM, dD] = clean.split('-').map(Number);

  const tTime = new Date(tY, tM - 1, tD).getTime();
  const dTime = new Date(dY, dM - 1, dD).getTime();
  const diffDays = Math.round((dTime - tTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      type: 'overdue' as const,
      label: abs === 1 ? '1 day overdue' : `${abs}d overdue`,
      days: diffDays,
    };
  }
  if (diffDays === 0) {
    return {
      type: 'today' as const,
      label: 'Due today',
      days: 0,
    };
  }
  if (diffDays === 1) {
    return {
      type: 'tomorrow' as const,
      label: 'Tomorrow',
      days: 1,
    };
  }
  if (diffDays <= 7) {
    return {
      type: 'upcoming' as const,
      label: `In ${diffDays}d`,
      days: diffDays,
    };
  }
  return {
    type: 'future' as const,
    label: null,
    days: diffDays,
  };
};

const STATUS_OPTIONS: { value: string; label: string; color: string; badge: string }[] = [
  { value: 'ALL', label: 'All Statuses', color: '#94A3B8', badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  { value: 'New', label: 'New', color: '#64748B', badge: 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300' },
  { value: 'Verified', label: 'Verified', color: '#00E5FF', badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  { value: 'Email 1 sent', label: 'Email 1 sent', color: '#6324FC', badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  { value: 'Follow-up 1', label: 'Follow-up 1', color: '#8B5CF6', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { value: 'Follow-up 2', label: 'Follow-up 2', color: '#EC4899', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { value: 'Reply received', label: 'Reply received', color: '#14B8A6', badge: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  { value: 'Audit sent', label: 'Audit sent', color: '#F59E0B', badge: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { value: 'Call booked', label: 'Call booked', color: '#FF6A00', badge: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  { value: 'Won', label: 'Won', color: '#10B981', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { value: 'Lost', label: 'Lost', color: '#64748B', badge: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  { value: 'Suppressed', label: 'Suppressed', color: '#EF4444', badge: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
];

const VERIFIED_OPTIONS = [
  { value: 'ALL', label: 'All Verification', color: '#94A3B8' },
  { value: 'Yes', label: 'Verified (Yes)', color: '#10B981' },
  { value: 'No', label: 'Unverified (No)', color: '#EF4444' },
  { value: 'Pending', label: 'Pending', color: '#F59E0B' },
];

const REPLY_OPTIONS = [
  { value: 'ALL', label: 'All Reply Tags', color: '#94A3B8' },
  { value: 'Positive', label: 'Positive', color: '#10B981' },
  { value: 'Neutral', label: 'Neutral', color: '#F59E0B' },
  { value: 'Negative', label: 'Negative', color: '#EF4444' },
  { value: 'Unsubscribe', label: 'Unsubscribe', color: '#DC2626' },
];

const ROW_REPLY_OPTIONS: { value: ReplyTag; label: string; color: string }[] = [
  { value: 'None', label: 'None', color: '#94A3B8' },
  { value: 'Positive', label: 'Positive', color: '#10B981' },
  { value: 'Neutral', label: 'Neutral', color: '#F59E0B' },
  { value: 'Negative', label: 'Negative', color: '#EF4444' },
  { value: 'Unsubscribe', label: 'Unsubscribe', color: '#DC2626' },
];

// Universal Dropdown Portal to escape table clipping, overflow-hidden and row boundaries
interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
}

function DropdownPortal({
  isOpen,
  onClose,
  triggerRef,
  children,
  minWidth = 190,
  className = '',
}: DropdownPortalProps) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    placement: 'top' | 'bottom';
  }>({
    left: 0,
    width: minWidth,
    placement: 'bottom',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 240;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Smart placement: if not enough space below, flip to top
    let placement: 'top' | 'bottom' = 'bottom';
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      placement = 'top';
    }

    const targetWidth = Math.max(minWidth, rect.width);
    let left = rect.left;
    if (left + targetWidth > viewportWidth - 12) {
      left = rect.right - targetWidth;
    }
    left = Math.max(12, Math.min(left, viewportWidth - targetWidth - 12));

    if (placement === 'top') {
      setCoords({
        bottom: viewportHeight - rect.top + 6,
        left,
        width: targetWidth,
        placement: 'top',
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        width: targetWidth,
        placement: 'bottom',
      });
    }
  }, [minWidth, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, updatePosition, triggerRef]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{
            opacity: 0,
            y: coords.placement === 'top' ? 6 : -6,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: coords.placement === 'top' ? 6 : -6,
            scale: 0.96,
          }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : 'auto',
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999,
          }}
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Reusable Custom Filter Dropdown (Portal Powered)
interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string; color?: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentOption = options.find((o) => o.value === value) || options[0];
  const isFiltered = value !== 'ALL';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-heading font-bold transition-all shadow-sm ${
          isFiltered
            ? 'border-[#6324FC] dark:border-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 text-[#6324FC] dark:text-[#00E5FF] shadow-[0_0_12px_rgba(99,36,252,0.2)]'
            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c0d14]/90 text-slate-700 dark:text-slate-300 hover:border-black/20 dark:hover:border-white/20'
        } ${isOpen ? 'ring-2 ring-[#6324FC]/25' : ''}`}
      >
        {currentOption.color && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: currentOption.color,
              boxShadow: isFiltered ? `0 0 6px ${currentOption.color}` : undefined,
            }}
          />
        )}
        <span className="truncate max-w-[130px]">{currentOption.label}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180 opacity-100' : ''}`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={190}
        className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0d0e15] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-h-72 overflow-y-auto no-scrollbar"
      >
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-black/5 dark:border-white/5 mb-1">
          Filter by {label}
        </div>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
                isSelected
                  ? 'bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {opt.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: opt.color,
                      boxShadow: isSelected ? `0 0 8px ${opt.color}` : undefined,
                    }}
                  />
                )}
                <span className="truncate">{opt.label}</span>
              </div>
              {isSelected && <Check size={13} className="shrink-0 text-[#6324FC] dark:text-[#00E5FF]" />}
            </button>
          );
        })}
      </DropdownPortal>
    </>
  );
}

// Custom Inline Table Status Dropdown (Portal Powered - Never Clipped)
interface StatusCellDropdownProps {
  status: ProspectStatus;
  onSelect: (newStatus: ProspectStatus) => void;
}

function StatusCellDropdown({ status, onSelect }: StatusCellDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === status) || {
    value: status,
    label: status,
    color: '#94A3B8',
    badge: 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${currentOption.badge} hover:opacity-90 active:scale-95 ${
          isOpen ? 'ring-2 ring-[#6324FC]/30 shadow-md' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: currentOption.color,
              boxShadow: `0 0 6px ${currentOption.color}80`,
            }}
          />
          <span className="truncate">{currentOption.label}</span>
        </div>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180 opacity-100' : ''}`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={195}
        className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0c0d14] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-h-64 overflow-y-auto no-scrollbar"
      >
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-black/5 dark:border-white/5 mb-1">
          Select Status
        </div>
        {STATUS_OPTIONS.filter((s) => s.value !== 'ALL').map((opt) => {
          const isSelected = opt.value === status;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value as ProspectStatus);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
                isSelected
                  ? 'bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: opt.color,
                    boxShadow: isSelected ? `0 0 8px ${opt.color}` : undefined,
                  }}
                />
                <span className="truncate">{opt.label}</span>
              </div>
              {isSelected && <Check size={13} className="shrink-0 text-[#6324FC] dark:text-[#00E5FF]" />}
            </button>
          );
        })}
      </DropdownPortal>
    </>
  );
}

// Custom Inline Table Reply Tag Dropdown (Portal Powered - Never Clipped)
interface ReplyTagCellDropdownProps {
  replyTag: ReplyTag;
  onSelect: (newTag: ReplyTag) => void;
}

function ReplyTagCellDropdown({ replyTag, onSelect }: ReplyTagCellDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const getReplyTagBadge = (tag: ReplyTag) => {
    switch (tag) {
      case 'Positive':
        return 'border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300';
      case 'Unsubscribe':
        return 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300';
      case 'Negative':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
      case 'Neutral':
        return 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300';
      default:
        return 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/50 text-slate-600 dark:text-slate-400';
    }
  };

  const currentOption = ROW_REPLY_OPTIONS.find((o) => o.value === replyTag) || ROW_REPLY_OPTIONS[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${getReplyTagBadge(
          replyTag
        )} hover:opacity-90 active:scale-95 ${isOpen ? 'ring-2 ring-[#6324FC]/30 shadow-md' : ''}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: currentOption.color,
              boxShadow: `0 0 5px ${currentOption.color}80`,
            }}
          />
          <span className="truncate">{currentOption.label}</span>
        </div>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180 opacity-100' : ''}`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={180}
        className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0c0d14] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-black/5 dark:border-white/5 mb-1">
          Select Reply Tag
        </div>
        {ROW_REPLY_OPTIONS.map((opt) => {
          const isSelected = opt.value === replyTag;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-heading font-medium transition-colors ${
                isSelected
                  ? 'bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: opt.color,
                    boxShadow: isSelected ? `0 0 8px ${opt.color}` : undefined,
                  }}
                />
                <span className="truncate">{opt.label}</span>
              </div>
              {isSelected && <Check size={13} className="shrink-0 text-[#6324FC] dark:text-[#00E5FF]" />}
            </button>
          );
        })}
      </DropdownPortal>
    </>
  );
}

// Custom Page Size Dropdown (Portal Powered - Never Clipped)
interface PageSizeDropdownProps {
  pageSize: number;
  onSelect: (size: number) => void;
}

function PageSizeDropdown({ pageSize, onSelect }: PageSizeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const sizes = [10, 25, 50, 100];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-[#6324FC]/40 transition shadow-sm"
      >
        <span>{pageSize}</span>
        <ChevronDown size={11} className={`opacity-60 transition-transform ${isOpen ? 'rotate-180 opacity-100' : ''}`} />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={85}
        className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#12131c] p-1 shadow-2xl"
      >
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              onSelect(s);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
              pageSize === s
                ? 'bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 text-[#6324FC] dark:text-[#00E5FF]'
                : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span>{s}</span>
            {pageSize === s && <Check size={11} />}
          </button>
        ))}
      </DropdownPortal>
    </>
  );
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
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const todayStr = getTodayStr();

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
    setCurrentPage(1);
  };

  // Reset pagination to page 1 whenever filters or search or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, verifiedFilter, replyTagFilter, pageSize]);

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
          const hasA = Boolean(a.nextFollowUp);
          const hasB = Boolean(b.nextFollowUp);
          if (!hasA && !hasB) return 0;
          if (!hasA) return 1;
          if (!hasB) return -1;
          return sortOrder === 'asc'
            ? a.nextFollowUp!.localeCompare(b.nextFollowUp!)
            : b.nextFollowUp!.localeCompare(a.nextFollowUp!);
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

  // Pagination calculations
  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const startDisplay = totalFiltered === 0 ? 0 : startIndex + 1;

  const paginatedProspects = useMemo(() => {
    return filteredAndSorted.slice(startIndex, endIndex);
  }, [filteredAndSorted, startIndex, endIndex]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safePage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages];
  }, [totalPages, safePage]);

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
        {/* Search Input */}
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
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              title="Clear Search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Custom Executive Filter Dropdowns & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Custom Status Filter */}
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />

          {/* 2. Custom Email Verified Filter */}
          <FilterSelect
            label="Verification"
            value={verifiedFilter}
            onChange={setVerifiedFilter}
            options={VERIFIED_OPTIONS}
          />

          {/* 3. Custom Reply Tag Filter */}
          <FilterSelect
            label="Reply Tag"
            value={replyTagFilter}
            onChange={setReplyTagFilter}
            options={REPLY_OPTIONS}
          />

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* View Toggle with Animated Pill Transition */}
          <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 p-1 relative">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`relative flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
                viewMode === 'table'
                  ? 'text-[#6324FC] dark:text-[#00E5FF]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              {viewMode === 'table' && (
                <motion.div
                  layoutId="prospectsViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <TableIcon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`relative flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
                viewMode === 'kanban'
                  ? 'text-[#6324FC] dark:text-[#00E5FF]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Kanban Pipeline"
            >
              {viewMode === 'kanban' && (
                <motion.div
                  layoutId="prospectsViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <Kanban className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Kanban</span>
            </button>
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={onOpenImportModal}
            className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 transition"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Add New Lead */}
          <button
            type="button"
            onClick={onOpenNewModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Smooth AnimatePresence Switch between Table & Kanban */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="prospects-table-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0d14]/90 shadow-sm backdrop-blur-xl"
          >
            {/* Table Header Mini-Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {totalFiltered} {totalFiltered === 1 ? 'Prospect' : 'Prospects'}
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
                {totalFiltered > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">&bull;</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                      Page <span className="font-bold text-slate-900 dark:text-white font-mono">{safePage}</span> of{' '}
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{totalPages}</span>
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold hidden md:flex">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">{verifiedCount} Verified</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-slate-600 dark:text-slate-400">{callsCount} Calls</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  <span className="text-slate-600 dark:text-slate-400">{positiveCount} Positive</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-400">{wonCount} Won</span>
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
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
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[150px]"
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
                    <th className="px-3 py-2.5 min-w-[130px]">
                      <span>Reply Tag</span>
                    </th>

                    {/* Next Follow-Up */}
                    <th
                      onClick={() => toggleSort('nextFollowUp')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[150px]"
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
                    paginatedProspects.map((p) => {
                      const dateStatus = getDateStatus(p.nextFollowUp);
                      const isOverdue =
                        dateStatus?.type === 'overdue' &&
                        p.status !== 'Won' &&
                        p.status !== 'Suppressed';
                      const isDueToday =
                        dateStatus?.type === 'today' &&
                        p.status !== 'Won' &&
                        p.status !== 'Suppressed';
                      const isTomorrow = dateStatus?.type === 'tomorrow';

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

                          {/* 5. Custom Inline Pipeline Status Dropdown (Portal Powered) */}
                          <td className="px-3 py-2.5">
                            <StatusCellDropdown
                              status={p.status}
                              onSelect={(newStatus) => onUpdateStatus(p.id, newStatus)}
                            />
                          </td>

                          {/* 6. Custom Inline Reply Tag Dropdown (Portal Powered) */}
                          <td className="px-3 py-2.5">
                            <ReplyTagCellDropdown
                              replyTag={p.replyTag}
                              onSelect={(newTag) => onUpdateReplyTag(p.id, newTag)}
                            />
                          </td>

                          {/* 7. Next Follow-Up with Beautiful Date & Cadence Indicators */}
                          <td className="px-3 py-2.5 min-w-[140px]">
                            {p.nextFollowUp ? (
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                      isOverdue
                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                        : isDueToday
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                        : isTomorrow
                                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                                        : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                    }`}
                                  >
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span className="font-mono text-[11px] font-semibold">{formatDisplayDate(p.nextFollowUp)}</span>
                                  </span>
                                </div>

                                {dateStatus?.label && (
                                  <div className="flex items-center gap-1 pl-1">
                                    <span
                                      className={`text-[10px] font-mono font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                                        isOverdue
                                          ? 'text-rose-600 dark:text-rose-400'
                                          : isDueToday
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : isTomorrow
                                          ? 'text-sky-600 dark:text-sky-400'
                                          : 'text-indigo-600 dark:text-indigo-400'
                                      }`}
                                    >
                                      {(isDueToday || isOverdue) && (
                                        <span
                                          className={`h-1.5 w-1.5 rounded-full shrink-0 animate-pulse ${
                                            isOverdue ? 'bg-rose-500' : 'bg-amber-500'
                                          }`}
                                        />
                                      )}
                                      {dateStatus.label}
                                    </span>
                                  </div>
                                )}

                                {p.lastContact && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 pl-1" title={`Last contact date: ${p.lastContact}`}>
                                    <Clock className="h-2.5 w-2.5 shrink-0" />
                                    <span>Last: {formatDisplayDate(p.lastContact)}</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-slate-400 dark:text-slate-500 text-xs italic font-sans">
                                  No follow-up
                                </span>
                                {p.lastContact && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5" title={`Last contact date: ${p.lastContact}`}>
                                    <Clock className="h-2.5 w-2.5 shrink-0" />
                                    <span>Last: {formatDisplayDate(p.lastContact)}</span>
                                  </span>
                                )}
                              </div>
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

            {/* Table Bottom Footer: Pagination & Custom Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 border-t border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-xs text-slate-500 dark:text-slate-400">
              {/* Left: Range and Per-page select */}
              <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center space-x-1.5">
                  <span>Showing</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {startDisplay}–{endIndex}
                  </span>
                  <span>of</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {totalFiltered}
                  </span>
                  <span>records</span>
                  {totalFiltered < total && (
                    <span className="text-[11px] text-slate-400 hidden lg:inline">
                      (from {total} total)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 pl-3 border-l border-slate-200 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Rows:</span>
                  <PageSizeDropdown
                    pageSize={pageSize}
                    onSelect={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Right: Pagination Navigation */}
              <div className="flex items-center space-x-1 sm:space-x-1.5 w-full sm:w-auto justify-center sm:justify-end">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 dark:text-slate-300"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 dark:text-slate-300"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="hidden sm:flex items-center space-x-1">
                  {pageNumbers.map((num, idx) => {
                    if (typeof num === 'string') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-slate-400 font-mono select-none">
                          ...
                        </span>
                      );
                    }
                    const isActive = num === safePage;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCurrentPage(num)}
                        className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-mono font-bold transition ${
                          isActive
                            ? 'bg-gradient-to-r from-[#6324FC] to-[#4F46E5] text-white shadow-sm'
                            : 'border border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile View Page Indicator */}
                <span className="sm:hidden text-xs font-mono font-bold px-2 text-slate-700 dark:text-slate-300">
                  {safePage} / {totalPages}
                </span>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 dark:text-slate-300"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 dark:text-slate-300"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Kanban Pipeline View with Smooth Transition */
          <motion.div
            key="prospects-kanban-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex space-x-5 overflow-x-auto pb-4 no-scrollbar"
          >
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
                        const dateStatus = getDateStatus(p.nextFollowUp);
                        const isOverdue =
                          dateStatus?.type === 'overdue' &&
                          p.status !== 'Won' &&
                          p.status !== 'Suppressed';
                        const isDueToday =
                          dateStatus?.type === 'today' &&
                          p.status !== 'Won' &&
                          p.status !== 'Suppressed';
                        const isTomorrow = dateStatus?.type === 'tomorrow';

                        return (
                          <div
                            key={p.id}
                            className={`rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/50 p-4 shadow-sm hover:shadow-md hover:border-[#6324FC]/40 transition-all ${
                              isOverdue ? 'border-l-4 border-l-rose-500' : isDueToday ? 'border-l-4 border-l-amber-500' : ''
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
                              <span className="text-slate-500 dark:text-slate-400 font-mono truncate max-w-[140px]">
                                {p.businessEmail}
                              </span>
                              {p.nextFollowUp && (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-[11px] font-mono border ${
                                    isOverdue
                                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                                      : isDueToday
                                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                      : isTomorrow
                                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
                                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                  }`}
                                >
                                  <Calendar className="h-2.5 w-2.5 shrink-0" />
                                  <span>{formatDisplayDate(p.nextFollowUp)}</span>
                                  {dateStatus?.label && (
                                    <span className="text-[9px] uppercase font-bold ml-0.5">({dateStatus.label})</span>
                                  )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
