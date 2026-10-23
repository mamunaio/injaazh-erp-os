'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail,
  Send,
  PlusCircle,
  Calendar,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
  Search,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  Flame,
  TrendingUp,
  Video,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyLog, SystemSettings } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';

interface DailyLogViewProps {
  dailyLogs: DailyLog[];
  settings: SystemSettings;
  onAddDailyLog: (log: Omit<DailyLog, 'id'>) => Promise<void>;
  onUpdateDailyLog: (id: string, log: Partial<DailyLog>) => Promise<void>;
  onDeleteDailyLog: (id: string) => Promise<void>;
}

type SortField = 'date' | 'emailsSent' | 'bounced' | 'replies' | 'positiveReplies' | 'auditsSent' | 'callsBooked' | 'bounceRate' | null;
type SortOrder = 'asc' | 'desc';

// Accurate local date string (YYYY-MM-DD) avoiding UTC day-shift
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formatted display date: "Oct 24, 2026"
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

// Weekday helper: "Fri", "Mon"
const getWeekday = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = clean.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
};

// Relative date label: "Today", "Yesterday", "3d ago"
const getRelativeDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const today = getTodayStr();

  const [tY, tM, tD] = today.split('-').map(Number);
  const [dY, dM, dD] = clean.split('-').map(Number);

  const tTime = new Date(tY, tM - 1, tD).getTime();
  const dTime = new Date(dY, dM - 1, dD).getTime();
  const diffDays = Math.round((tTime - dTime) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: 'Today', isRecent: true };
  if (diffDays === 1) return { label: 'Yesterday', isRecent: true };
  if (diffDays > 1 && diffDays <= 7) return { label: `${diffDays}d ago`, isRecent: false };
  return null;
};

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

// Reusable Filter Dropdown Component
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
        <span className="truncate max-w-[140px]">{currentOption.label}</span>
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

// Custom Page Size Dropdown
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

export default function DailyLogView({
  dailyLogs,
  settings,
  onAddDailyLog,
  onUpdateDailyLog,
  onDeleteDailyLog,
}: DailyLogViewProps) {
  const { confirm } = useConfirm();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Sorting & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form State
  const [formData, setFormData] = useState({
    date: getTodayStr(),
    emailsSent: 40,
    bounced: 0,
    replies: 2,
    positiveReplies: 1,
    auditsSent: 1,
    callsBooked: 0,
    note: '',
  });

  useScrollLock(isModalOpen);

  const maxBounce = (settings.maxBounceRate || 0.02) * 100;

  const handleOpenAddModal = () => {
    setEditingLog(null);
    setFormData({
      date: getTodayStr(),
      emailsSent: 40,
      bounced: 0,
      replies: 2,
      positiveReplies: 1,
      auditsSent: 1,
      callsBooked: 0,
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleStartEdit = (log: DailyLog) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      emailsSent: log.emailsSent,
      bounced: log.bounced,
      replies: log.replies,
      positiveReplies: log.positiveReplies,
      auditsSent: log.auditsSent,
      callsBooked: log.callsBooked,
      note: log.note || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleDeleteWithConfirm = async (log: DailyLog) => {
    const formatted = formatDisplayDate(log.date);
    const confirmed = await confirm({
      title: 'Delete Outreach Record',
      message: `Are you sure you want to permanently delete the cold outreach record for ${formatted || log.date}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteDailyLog(log.id);
      if (editingLog?.id === log.id) {
        handleCloseModal();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLog) {
        await onUpdateDailyLog(editingLog.id, {
          date: formData.date,
          emailsSent: Number(formData.emailsSent) || 0,
          bounced: Number(formData.bounced) || 0,
          replies: Number(formData.replies) || 0,
          positiveReplies: Number(formData.positiveReplies) || 0,
          auditsSent: Number(formData.auditsSent) || 0,
          callsBooked: Number(formData.callsBooked) || 0,
          note: formData.note,
        });
      } else {
        await onAddDailyLog({
          date: formData.date,
          emailsSent: Number(formData.emailsSent) || 0,
          bounced: Number(formData.bounced) || 0,
          replies: Number(formData.replies) || 0,
          positiveReplies: Number(formData.positiveReplies) || 0,
          auditsSent: Number(formData.auditsSent) || 0,
          callsBooked: Number(formData.callsBooked) || 0,
          note: formData.note,
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortField(null);
        setSortOrder('desc');
      }
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const hasActiveFilters = Boolean(searchTerm || healthFilter !== 'ALL');

  const handleResetFilters = () => {
    setSearchTerm('');
    setHealthFilter('ALL');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, healthFilter, pageSize]);

  // Overall Global Calculations
  const totalEmails = dailyLogs.reduce((acc, d) => acc + (Number(d.emailsSent) || 0), 0);
  const totalBounced = dailyLogs.reduce((acc, d) => acc + (Number(d.bounced) || 0), 0);
  const totalReplies = dailyLogs.reduce((acc, d) => acc + (Number(d.replies) || 0), 0);
  const totalPositive = dailyLogs.reduce((acc, d) => acc + (Number(d.positiveReplies) || 0), 0);
  const totalAudits = dailyLogs.reduce((acc, d) => acc + (Number(d.auditsSent) || 0), 0);
  const totalCalls = dailyLogs.reduce((acc, d) => acc + (Number(d.callsBooked) || 0), 0);

  const avgBounceRate = totalEmails > 0 ? ((totalBounced / totalEmails) * 100).toFixed(1) : '0.0';
  const replyRate = totalEmails > 0 ? ((totalReplies / totalEmails) * 100).toFixed(1) : '0.0';
  const positiveRate = totalEmails > 0 ? ((totalPositive / totalEmails) * 100).toFixed(1) : '0.0';

  const isGlobalBounceHigh = Number(avgBounceRate) > maxBounce && totalEmails >= 50;

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = dailyLogs.filter((log) => {
      const formattedDate = formatDisplayDate(log.date)?.toLowerCase() || '';
      const matchesSearch =
        !term ||
        log.date.toLowerCase().includes(term) ||
        formattedDate.includes(term) ||
        (log.note && log.note.toLowerCase().includes(term));

      const logBounceRate = log.emailsSent > 0 ? (log.bounced / log.emailsSent) * 100 : 0;
      let matchesHealth = true;
      if (healthFilter === 'HEALTHY') matchesHealth = logBounceRate <= maxBounce;
      if (healthFilter === 'HIGH_BOUNCE') matchesHealth = logBounceRate > maxBounce;
      if (healthFilter === 'HAS_REPLIES') matchesHealth = log.positiveReplies > 0;
      if (healthFilter === 'HAS_CALLS') matchesHealth = log.callsBooked > 0;

      return matchesSearch && matchesHealth;
    });

    if (sortField) {
      return [...result].sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
        }
        if (sortField === 'bounceRate') {
          const rA = a.emailsSent > 0 ? a.bounced / a.emailsSent : 0;
          const rB = b.emailsSent > 0 ? b.bounced / b.emailsSent : 0;
          return sortOrder === 'asc' ? rA - rB : rB - rA;
        }
        const valA = Number(a[sortField]) || 0;
        const valB = Number(b[sortField]) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [dailyLogs, searchTerm, healthFilter, sortField, sortOrder, maxBounce]);

  // Pagination
  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const startDisplay = totalFiltered === 0 ? 0 : startIndex + 1;

  const paginatedLogs = useMemo(() => {
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

  // Live Form Bounce Calculation
  const formSent = Number(formData.emailsSent) || 0;
  const formBounced = Number(formData.bounced) || 0;
  const formReplies = Number(formData.replies) || 0;
  const formPositive = Number(formData.positiveReplies) || 0;
  const formBounceRate = formSent > 0 ? ((formBounced / formSent) * 100).toFixed(1) : '0.0';
  const formPositiveRate = formSent > 0 ? ((formPositive / formSent) * 100).toFixed(1) : '0.0';
  const isFormBounceUnsafe = Number(formBounceRate) > maxBounce && formSent >= 20;

  const HEALTH_OPTIONS = [
    { value: 'ALL', label: 'All Records', color: '#94A3B8' },
    { value: 'HEALTHY', label: 'Deliverability Safe (≤2%)', color: '#10B981' },
    { value: 'HIGH_BOUNCE', label: 'High Bounce Alert (>2%)', color: '#EF4444' },
    { value: 'HAS_REPLIES', label: 'Positive Replies', color: '#14B8A6' },
    { value: 'HAS_CALLS', label: 'Strategy Calls Booked', color: '#FF6A00' },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* 1. Top KPI Summary Cards (Matching Prospects Page) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Emails Dispatched</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">{totalEmails}</p>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Avg Bounce Rate</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              isGlobalBounceHigh ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {avgBounceRate}%
          </p>
          <span className="text-[10px] text-slate-400 font-mono">≤ {maxBounce}% ceiling</span>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Replies</span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">{totalReplies}</p>
          <span className="text-[10px] text-slate-400 font-mono">{replyRate}% response</span>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Positive Replies</span>
          <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 font-mono">{totalPositive}</p>
          <span className="text-[10px] text-slate-400 font-mono">{positiveRate}% interest</span>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Audits Sent</span>
          <p className="text-xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-0.5 font-mono">{totalAudits}</p>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Calls Booked</span>
          <p className="text-xl font-black text-amber-500 dark:text-amber-400 mt-0.5 font-mono">{totalCalls}</p>
        </div>
      </div>

      {/* 2. Control Bar: Search, Filters, View Toggle, Actions */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-3 lg:p-4 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search outreach records by date, notes, campaigns..."
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

        {/* Filter Dropdown & View Mode & CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Deliverability Health Filter Dropdown */}
          <FilterSelect
            label="Health & Replies"
            value={healthFilter}
            onChange={setHealthFilter}
            options={HEALTH_OPTIONS}
          />

          {/* Reset Filters */}
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

          {/* View Toggle with Animated Pill */}
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
                  layoutId="dailyLogViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <TableIcon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`relative flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
                viewMode === 'cards'
                  ? 'text-[#6324FC] dark:text-[#00E5FF]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Timeline Cards View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="dailyLogViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <LayoutGrid className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Cards</span>
            </button>
          </div>

          {/* Log Today's Outreach CTA Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Log Today’s Outreach</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content: Table or Cards View with AnimatePresence */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="daily-log-table-view"
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
                  {totalFiltered} {totalFiltered === 1 ? 'Day Logged' : 'Days Logged'}
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
                  <span className="text-slate-600 dark:text-slate-400">{dailyLogs.length} Total Logs</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  <span className="text-slate-600 dark:text-slate-400">{totalPositive} Positive Replies</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-slate-600 dark:text-slate-400">{totalCalls} Calls</span>
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  <tr>
                    {/* Date Column */}
                    <th
                      onClick={() => toggleSort('date')}
                      className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[150px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Date</span>
                        {sortField === 'date' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Emails Sent */}
                    <th
                      onClick={() => toggleSort('emailsSent')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[110px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Dispatched</span>
                        {sortField === 'emailsSent' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Bounced */}
                    <th
                      onClick={() => toggleSort('bounced')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[95px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Bounced</span>
                        {sortField === 'bounced' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Bounce Rate */}
                    <th
                      onClick={() => toggleSort('bounceRate')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[115px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Bounce Rate</span>
                        {sortField === 'bounceRate' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Total Replies */}
                    <th
                      onClick={() => toggleSort('replies')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[90px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Replies</span>
                        {sortField === 'replies' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Positive Replies */}
                    <th
                      onClick={() => toggleSort('positiveReplies')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[100px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Positive</span>
                        {sortField === 'positiveReplies' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Audits Sent */}
                    <th
                      onClick={() => toggleSort('auditsSent')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[95px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Audits</span>
                        {sortField === 'auditsSent' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Calls Booked */}
                    <th
                      onClick={() => toggleSort('callsBooked')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[90px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Calls</span>
                        {sortField === 'callsBooked' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Notes */}
                    <th className="px-3 py-2.5 min-w-[160px]">
                      <span>Strategy Notes</span>
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
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                          <div className="h-12 w-12 rounded-2xl bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] mb-3">
                            <Mail className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">No outreach logs found</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                            {hasActiveFilters
                              ? 'Try adjusting your search terms or filters.'
                              : 'No daily outreach activity has been logged yet. Click "+ Log Today’s Outreach" above to add your first record.'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              onClick={handleResetFilters}
                              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6324FC] to-[#4F46E5] shadow-md hover:opacity-95 transition"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Reset Filters</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => {
                      const dayBounce = log.emailsSent > 0 ? (log.bounced / log.emailsSent) * 100 : 0;
                      const dayBounceRateStr = dayBounce.toFixed(1);
                      const isUnsafe = dayBounce > maxBounce && log.emailsSent >= 20;
                      const relative = getRelativeDate(log.date);
                      const weekday = getWeekday(log.date);

                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors ${
                            isUnsafe ? 'bg-rose-500/[0.04] dark:bg-rose-950/20' : ''
                          }`}
                        >
                          {/* 1. Date & Weekday */}
                          <td className="py-2.5 pl-4 pr-3">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col items-center justify-center text-slate-800 dark:text-slate-200">
                                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold leading-none">{weekday}</span>
                                <span className="text-xs font-mono font-black leading-none mt-0.5">{log.date.split('-')[2] || '•'}</span>
                              </div>

                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-mono">
                                    {formatDisplayDate(log.date)}
                                  </span>
                                  {relative && (
                                    <span
                                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase font-mono ${
                                        relative.isRecent
                                          ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]'
                                          : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {relative.label}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {log.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Emails Sent */}
                          <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm">
                            <span className="inline-flex items-center gap-1.5">
                              <Send size={12} className="text-slate-400" />
                              <span>{log.emailsSent}</span>
                            </span>
                          </td>

                          {/* 3. Bounced */}
                          <td className="px-3 py-2.5 font-mono text-xs sm:text-sm">
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${
                                log.bounced > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                              }`}
                            >
                              {log.bounced > 0 && <AlertTriangle size={11} />}
                              <span>{log.bounced}</span>
                            </span>
                          </td>

                          {/* 4. Bounce Rate */}
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold border font-mono ${
                                isUnsafe
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isUnsafe ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span>{dayBounceRateStr}%</span>
                            </span>
                          </td>

                          {/* 5. Total Replies */}
                          <td className="px-3 py-2.5 font-mono text-xs sm:text-sm">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {log.replies}
                            </span>
                          </td>

                          {/* 6. Positive Replies */}
                          <td className="px-3 py-2.5 font-mono text-xs sm:text-sm">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                                log.positiveReplies > 0
                                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                                  : 'text-slate-400'
                              }`}
                            >
                              {log.positiveReplies > 0 && <Sparkles size={11} />}
                              <span>{log.positiveReplies}</span>
                            </span>
                          </td>

                          {/* 7. Audits Sent */}
                          <td className="px-3 py-2.5 font-mono text-xs sm:text-sm">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                                log.auditsSent > 0
                                  ? 'bg-purple-500/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20'
                                  : 'text-slate-400'
                              }`}
                            >
                              {log.auditsSent > 0 && <Video size={11} />}
                              <span>{log.auditsSent}</span>
                            </span>
                          </td>

                          {/* 8. Calls Booked */}
                          <td className="px-3 py-2.5 font-mono text-xs sm:text-sm">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-extrabold ${
                                log.callsBooked > 0
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : 'text-slate-400'
                              }`}
                            >
                              {log.callsBooked > 0 && <Flame size={12} className="text-amber-500 animate-pulse" />}
                              <span>{log.callsBooked}</span>
                            </span>
                          </td>

                          {/* 9. Strategy Notes */}
                          <td className="px-3 py-2.5 max-w-xs">
                            <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-normal leading-relaxed" title={log.note || ''}>
                              {log.note || <span className="text-slate-400 italic">No notes</span>}
                            </p>
                          </td>

                          {/* 10. Actions (Sticky Right Column) */}
                          <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(log)}
                                className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                                title="Edit Record"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithConfirm(log)}
                                className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
                                title="Delete Record"
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

            {/* Table Footer: Pagination & Custom Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 border-t border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-xs text-slate-500 dark:text-slate-400">
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
                  {totalFiltered < dailyLogs.length && (
                    <span className="text-[11px] text-slate-400 hidden lg:inline">
                      (from {dailyLogs.length} total)
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
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 dark:text-slate-300"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 dark:text-slate-300"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

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

                <span className="sm:hidden text-xs font-mono font-bold px-2 text-slate-700 dark:text-slate-300">
                  {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12131c] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition text-slate-700 dark:text-slate-300"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

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
          /* Cards Timeline Grid View */
          <motion.div
            key="daily-log-cards-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredAndSorted.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-8 shadow-sm backdrop-blur-xl">
                <Mail className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No outreach logs found</h4>
                <p className="text-xs text-slate-400 mt-1">Try resetting filters or log a new day.</p>
              </div>
            ) : (
              paginatedLogs.map((log) => {
                const dayBounce = log.emailsSent > 0 ? (log.bounced / log.emailsSent) * 100 : 0;
                const isUnsafe = dayBounce > maxBounce && log.emailsSent >= 20;
                const relative = getRelativeDate(log.date);

                return (
                  <div
                    key={log.id}
                    className={`rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/90 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-xl ${
                      isUnsafe ? 'border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                            {formatDisplayDate(log.date)}
                          </span>
                          {relative && (
                            <span className="rounded-full bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] px-2 py-0.5 text-[10px] font-bold font-mono">
                              {relative.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{getWeekday(log.date)} &bull; {log.id}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(log)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-black/5 dark:hover:bg-white/5 transition"
                          title="Edit Log"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithConfirm(log)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                          title="Delete Log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2.5 my-3.5">
                      <div className="rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/30 p-2.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Dispatched</span>
                        <p className="text-base font-bold text-slate-900 dark:text-white font-mono">{log.emailsSent}</p>
                      </div>

                      <div className="rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/30 p-2.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Bounce Rate</span>
                        <p className={`text-base font-bold font-mono ${isUnsafe ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {dayBounce.toFixed(1)}%
                        </p>
                      </div>

                      <div className="rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/30 p-2.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Positive Replies</span>
                        <p className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">{log.positiveReplies}</p>
                      </div>

                      <div className="rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/30 p-2.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Calls Booked</span>
                        <p className="text-base font-bold text-amber-500 dark:text-amber-400 font-mono">{log.callsBooked}</p>
                      </div>
                    </div>

                    {log.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-black/5 dark:border-white/5 line-clamp-2">
                        {log.note}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Luxury Add / Edit Modal (Matching LeadModal UX) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#0c0d14] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col my-auto"
            >
              {/* Neon Top Line */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent shadow-[0_0_15px_#6324FC]" />

              {/* Modal Header */}
              <div className="p-5 sm:px-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 dark:bg-[#6324FC]/20 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] shadow-sm">
                    {editingLog ? <Edit2 size={18} /> : <Mail size={18} />}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      {editingLog ? 'Edit Outreach Log' : 'Log Cold Outreach Activity'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Record daily dispatches, bounce rates, Loom audits, and client calls.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
                  title="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
                {/* SECTION 1: Date & Volume */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <Calendar size={14} className="text-[#6324FC]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Schedule &amp; Volume Dispatched
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Log Date *
                      </label>
                      <DatePicker
                        value={formData.date}
                        onChange={(val) => setFormData({ ...formData, date: val })}
                        placeholder="Select Log Date"
                        color="#6324FC"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Cold Emails Sent *
                      </label>
                      <div className="relative">
                        <Send size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.emailsSent}
                          onChange={(e) => setFormData({ ...formData, emailsSent: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Deliverability & Live Health Gauge */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Deliverability &amp; Inbound Replies
                      </h3>
                    </div>

                    {/* Live Health Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono border ${
                        isFormBounceUnsafe
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isFormBounceUnsafe ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <span>{formBounceRate}% Bounce</span>
                      <span className="text-[9px] opacity-70">({isFormBounceUnsafe ? 'Unsafe' : 'Healthy'})</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Bounced Emails
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.bounced}
                        onChange={(e) => setFormData({ ...formData, bounced: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Total Replies
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.replies}
                        onChange={(e) => setFormData({ ...formData, replies: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1.5">
                        Positive Replies
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.positiveReplies}
                        onChange={(e) => setFormData({ ...formData, positiveReplies: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-[#060608] border border-teal-500/30 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-teal-700 dark:text-teal-300 font-mono font-bold outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Conversion Assets */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <Flame size={14} className="text-amber-500" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Loom Audits &amp; Strategy Calls
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Loom Video Audits Sent
                      </label>
                      <div className="relative">
                        <Video size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          value={formData.auditsSent}
                          onChange={(e) => setFormData({ ...formData, auditsSent: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
                        Strategy Calls Booked
                      </label>
                      <div className="relative">
                        <Flame size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
                        <input
                          type="number"
                          min="0"
                          value={formData.callsBooked}
                          onChange={(e) => setFormData({ ...formData, callsBooked: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-[#060608] border border-amber-500/30 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 font-mono font-bold outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Strategic Campaign Notes */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-2">
                  <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">
                    Subject Lines Tested &amp; Observations
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Subject 'Quick question for [Company]' got 3 positive replies; deliverability healthy on Instantly pool..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {editingLog && (
                      <button
                        type="button"
                        onClick={() => handleDeleteWithConfirm(editingLog)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>Delete Record</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl text-xs font-heading font-bold text-white bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 shadow-md shadow-[#6324FC]/25 transition disabled:opacity-50 active:scale-95"
                    >
                      {submitting ? 'Saving...' : editingLog ? 'Update Record' : 'Save Record'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
