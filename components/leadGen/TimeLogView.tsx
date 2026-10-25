'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Search,
  RotateCcw,
  Table as TableIcon,
  LayoutGrid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Building,
  User,
  Sparkles,
  Layers,
  Send,
  Wrench,
  Flame,
  ShieldCheck,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeLog, Client } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';

interface TimeLogViewProps {
  timeLogs: TimeLog[];
  clients: Client[];
  onAddTimeLog: (log: Omit<TimeLog, 'id'>) => Promise<void>;
  onUpdateTimeLog: (id: string, log: Partial<TimeLog>) => Promise<void>;
  onDeleteTimeLog: (id: string) => Promise<void>;
}

type SortField = 'date' | 'person' | 'client' | 'lane' | 'hours' | 'task' | null;
type SortOrder = 'asc' | 'desc';
type LaneType = 'Outreach' | 'Fulfillment' | 'Tech' | 'Strategy' | 'Admin';

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

  if (diffDays === 0) return { label: 'Today', type: 'today' };
  if (diffDays === 1) return { label: 'Yesterday', type: 'recent' };
  if (diffDays < 30) return { label: `${diffDays}d ago`, type: 'recent' };
  const months = Math.floor(diffDays / 30);
  return { label: `${months}mo ago`, type: 'older' };
};

// ==========================================
// Operational Lane Configuration
// ==========================================
const LANE_CONFIG: Record<
  LaneType,
  { label: string; color: string; bgLight: string; bgDark: string; border: string; icon: React.ElementType }
> = {
  Outreach: {
    label: 'Outreach & Prospecting',
    color: '#6324FC',
    bgLight: 'rgba(99, 36, 252, 0.08)',
    bgDark: 'rgba(0, 229, 255, 0.1)',
    border: 'rgba(99, 36, 252, 0.25)',
    icon: Send,
  },
  Fulfillment: {
    label: 'Client Fulfillment / SEO',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.08)',
    bgDark: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    icon: Layers,
  },
  Tech: {
    label: 'Tech / Automations',
    color: '#00E5FF',
    bgLight: 'rgba(0, 229, 255, 0.08)',
    bgDark: 'rgba(0, 229, 255, 0.12)',
    border: 'rgba(0, 229, 255, 0.25)',
    icon: Wrench,
  },
  Strategy: {
    label: 'Audits & Strategy Calls',
    color: '#F59E0B',
    bgLight: 'rgba(245, 158, 11, 0.08)',
    bgDark: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: Flame,
  },
  Admin: {
    label: 'Operations & Finance',
    color: '#64748B',
    bgLight: 'rgba(100, 116, 139, 0.08)',
    bgDark: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.25)',
    icon: ShieldCheck,
  },
};

// Preset Quick Task Chips for Rapid Entry in Modal
const QUICK_TASK_PRESETS = [
  'MillionVerifier Email Cleaning & Verify',
  'Google Maps Local Audit & Scraping',
  'Instantly Warmup & Deliverability Audit',
  'Local City Page SEO Draft & Schema',
  'Loom Video Audit & Cold Outreach Batch',
  'Client Bi-weekly Performance Review',
  'DNS & Secondary Domain Setup',
];

// Quick Team Members
const QUICK_PERSON_PRESETS = [
  'Lead Gen Specialist',
  'Agency Founder',
  'SEO & GBP Specialist',
  'Tech & Automation Lead',
];

// ==========================================
// React Portal Dropdown (Never Clipped)
// ==========================================
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
    const dropdownHeight = 260;
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
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: coords.placement === 'bottom' ? `${coords.top}px` : undefined,
        bottom: coords.placement === 'top' ? `${coords.bottom}px` : undefined,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 999999,
      }}
      className={`animate-in fade-in-0 zoom-in-95 duration-150 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}

// Custom Filter Select Component (Portal Powered)
interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  minWidth?: number;
}

function FilterSelect({ label, value, onChange, options, minWidth = 190 }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOpt = options.find((o) => o.value === value) || options[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 transition-all select-none"
      >
        <div className="flex items-center space-x-1.5">
          {selectedOpt?.color && (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{
                backgroundColor: selectedOpt.color,
                boxShadow: `0 0 6px ${selectedOpt.color}`,
              }}
            />
          )}
          <span className="text-slate-400 font-normal">{label}:</span>
          <span className="font-bold text-slate-900 dark:text-white max-w-[130px] truncate">
            {selectedOpt?.label || value}
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={minWidth}
        className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0c0d14] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-black/5 dark:border-white/5 mb-1">
          {label}
        </div>
        <div className="max-h-60 overflow-y-auto custom-scrollbar">
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
        </div>
      </DropdownPortal>
    </>
  );
}

// Page Size Dropdown
interface PageSizeDropdownProps {
  pageSize: number;
  onSelect: (size: number) => void;
}

function PageSizeDropdown({ pageSize, onSelect }: PageSizeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = [10, 25, 50];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
      >
        <span>{pageSize}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={90}
        className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0c0d14] p-1 shadow-2xl backdrop-blur-2xl"
      >
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              onSelect(opt);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
              opt === pageSize
                ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span>{opt}</span>
            {opt === pageSize && <Check size={12} className="text-[#6324FC] dark:text-[#00E5FF]" />}
          </button>
        ))}
      </DropdownPortal>
    </>
  );
}

export default function TimeLogView({
  timeLogs,
  clients,
  onAddTimeLog,
  onUpdateTimeLog,
  onDeleteTimeLog,
}: TimeLogViewProps) {
  const { confirm } = useConfirm();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [laneFilter, setLaneFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Form State
  const [formDate, setFormDate] = useState(getTodayStr());
  const [formPerson, setFormPerson] = useState('Lead Gen Specialist');
  const [formClient, setFormClient] = useState('Internal');
  const [formLane, setFormLane] = useState<LaneType>('Outreach');
  const [formHours, setFormHours] = useState<number>(3.0);
  const [formTask, setFormTask] = useState('');
  const [formNote, setFormNote] = useState('');

  // Lock scroll when modal is active
  useScrollLock(isModalOpen);

  // KPI Computations
  const totalHours = useMemo(
    () => timeLogs.reduce((acc, t) => acc + (Number(t.hours) || 0), 0),
    [timeLogs]
  );

  const fulfillmentHours = useMemo(
    () =>
      timeLogs
        .filter((t) => t.lane === 'Fulfillment')
        .reduce((acc, t) => acc + (Number(t.hours) || 0), 0),
    [timeLogs]
  );

  const outreachHours = useMemo(
    () =>
      timeLogs
        .filter((t) => t.lane === 'Outreach')
        .reduce((acc, t) => acc + (Number(t.hours) || 0), 0),
    [timeLogs]
  );

  const techHours = useMemo(
    () =>
      timeLogs
        .filter((t) => t.lane === 'Tech')
        .reduce((acc, t) => acc + (Number(t.hours) || 0), 0),
    [timeLogs]
  );

  const strategyHours = useMemo(
    () =>
      timeLogs
        .filter((t) => t.lane === 'Strategy')
        .reduce((acc, t) => acc + (Number(t.hours) || 0), 0),
    [timeLogs]
  );

  const uniqueContributors = useMemo(
    () => new Set(timeLogs.map((t) => t.person.trim().toLowerCase())).size,
    [timeLogs]
  );

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = timeLogs.filter((log) => {
      const formattedDate = formatDisplayDate(log.date)?.toLowerCase() || '';
      const matchesSearch =
        !term ||
        log.task.toLowerCase().includes(term) ||
        log.person.toLowerCase().includes(term) ||
        log.client.toLowerCase().includes(term) ||
        (log.note && log.note.toLowerCase().includes(term)) ||
        log.date.toLowerCase().includes(term) ||
        formattedDate.includes(term);

      let matchesClient = true;
      if (clientFilter !== 'ALL') {
        matchesClient = log.client.toLowerCase() === clientFilter.toLowerCase();
      }

      let matchesLane = true;
      if (laneFilter !== 'ALL') {
        matchesLane = log.lane === laneFilter;
      }

      return matchesSearch && matchesClient && matchesLane;
    });

    if (sortField) {
      return [...result].sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
        }
        if (sortField === 'person') {
          return sortOrder === 'asc' ? a.person.localeCompare(b.person) : b.person.localeCompare(a.person);
        }
        if (sortField === 'client') {
          return sortOrder === 'asc' ? a.client.localeCompare(b.client) : b.client.localeCompare(a.client);
        }
        if (sortField === 'lane') {
          return sortOrder === 'asc' ? a.lane.localeCompare(b.lane) : b.lane.localeCompare(a.lane);
        }
        if (sortField === 'hours') {
          return sortOrder === 'asc' ? a.hours - b.hours : b.hours - a.hours;
        }
        if (sortField === 'task') {
          return sortOrder === 'asc' ? a.task.localeCompare(b.task) : b.task.localeCompare(a.task);
        }
        return 0;
      });
    }

    return result;
  }, [timeLogs, searchTerm, clientFilter, laneFilter, sortField, sortOrder]);

  // Pagination Calculations
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

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const hasActiveFilters = searchTerm !== '' || clientFilter !== 'ALL' || laneFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setClientFilter('ALL');
    setLaneFilter('ALL');
    setCurrentPage(1);
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingLog(null);
    setFormDate(getTodayStr());
    setFormPerson('Lead Gen Specialist');
    setFormClient('Internal');
    setFormLane('Outreach');
    setFormHours(3.0);
    setFormTask('');
    setFormNote('');
    setIsModalOpen(true);
  };

  const handleStartEdit = (t: TimeLog) => {
    setEditingLog(t);
    setFormDate(t.date || getTodayStr());
    setFormPerson(t.person);
    setFormClient(t.client);
    setFormLane(t.lane);
    setFormHours(t.hours);
    setFormTask(t.task);
    setFormNote(t.note || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTask.trim() || !formPerson.trim()) return;

    setSubmitting(true);
    try {
      if (editingLog) {
        await onUpdateTimeLog(editingLog.id, {
          date: formDate,
          person: formPerson.trim(),
          client: formClient,
          lane: formLane,
          hours: Number(formHours),
          task: formTask.trim(),
          note: formNote.trim(),
        });
      } else {
        await onAddTimeLog({
          date: formDate,
          person: formPerson.trim(),
          client: formClient,
          lane: formLane,
          hours: Number(formHours),
          task: formTask.trim(),
          note: formNote.trim(),
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save time entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWithConfirm = async (t: TimeLog) => {
    const confirmed = await confirm({
      title: 'Delete Time Entry',
      message: `Are you sure you want to permanently delete this ${t.hours} hr entry for "${t.task}"? This will update client fulfillment hours.`,
      confirmText: 'Delete Entry',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteTimeLog(t.id);
      if (editingLog?.id === t.id) {
        handleCloseModal();
      }
    }
  };

  // Build filter options
  const CLIENT_OPTIONS: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = [
      { value: 'ALL', label: 'All Accounts & Clients', color: '#94A3B8' },
      { value: 'Internal', label: 'Internal (Agency Operations)', color: '#6324FC' },
    ];
    clients.forEach((c) => {
      opts.push({
        value: c.name,
        label: c.name,
        color: c.status === 'Active' ? '#10B981' : '#F59E0B',
      });
    });
    return opts;
  }, [clients]);

  const LANE_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Operational Lanes', color: '#94A3B8' },
    { value: 'Outreach', label: 'Outreach & Prospecting', color: LANE_CONFIG.Outreach.color },
    { value: 'Fulfillment', label: 'Client Fulfillment / SEO', color: LANE_CONFIG.Fulfillment.color },
    { value: 'Tech', label: 'Tech & Infrastructure', color: LANE_CONFIG.Tech.color },
    { value: 'Strategy', label: 'Audits & Strategy Calls', color: LANE_CONFIG.Strategy.color },
    { value: 'Admin', label: 'Operations & Finance', color: LANE_CONFIG.Admin.color },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* 1. Top KPI Summary Cards (Matching Standard Lead Gen Pattern) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Hours */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Logged Hours</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">{timeLogs.length} Entries Recorded</span>
        </div>

        {/* Fulfillment Hours */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Client Fulfillment</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            {fulfillmentHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[10px] text-emerald-500/80 font-mono">
            {totalHours > 0 ? ((fulfillmentHours / totalHours) * 100).toFixed(0) : 0}% of all hours
          </span>
        </div>

        {/* Outreach Hours */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Cold Outreach</span>
          <p className="text-xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-0.5 font-mono">
            {outreachHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Lead Research &amp; Sending</span>
        </div>

        {/* Tech Hours */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Tech &amp; Inboxes</span>
          <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 font-mono">
            {techHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Domains, DNS &amp; Warmup</span>
        </div>

        {/* Strategy Hours */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Strategy &amp; Audits</span>
          <p className="text-xl font-black text-amber-500 dark:text-amber-400 mt-0.5 font-mono">
            {strategyHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Loom Audits &amp; Calls</span>
        </div>

        {/* Unique Contributors */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Active Team</span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
            {uniqueContributors} <span className="text-xs font-normal text-slate-400">members</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Logging Activity</span>
        </div>
      </div>

      {/* 2. Control Bar: Search, Filters, View Mode, Single CTA Button */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-3 lg:p-4 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search time entries by task, member, client, or notes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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

        {/* Filters & View Mode & CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Client / Account Filter */}
          <FilterSelect
            label="Client"
            value={clientFilter}
            onChange={(val) => {
              setClientFilter(val);
              setCurrentPage(1);
            }}
            options={CLIENT_OPTIONS}
            minWidth={210}
          />

          {/* Operational Lane Filter */}
          <FilterSelect
            label="Lane"
            value={laneFilter}
            onChange={(val) => {
              setLaneFilter(val);
              setCurrentPage(1);
            }}
            options={LANE_OPTIONS}
            minWidth={200}
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
                  layoutId="timeLogViewModePill"
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
              title="Activity Cards View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="timeLogViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <LayoutGrid className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Cards</span>
            </button>
          </div>

          {/* Single Primary CTA Button: + Record Hours */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Record Hours</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content: Table or Cards View with AnimatePresence */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="time-log-table-view"
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
                  {totalFiltered} {totalFiltered === 1 ? 'Entry Logged' : 'Entries Logged'}
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
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400">{timeLogs.length} Total Records</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">{totalHours.toFixed(1)} Total Hours</span>
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
                      className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[140px]"
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

                    {/* Team Member Column */}
                    <th
                      onClick={() => toggleSort('person')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[160px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Team Member</span>
                        {sortField === 'person' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Client / Project Column */}
                    <th
                      onClick={() => toggleSort('client')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[160px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Client / Project</span>
                        {sortField === 'client' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Operational Lane Column */}
                    <th
                      onClick={() => toggleSort('lane')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Lane</span>
                        {sortField === 'lane' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Hours Spent Column */}
                    <th
                      onClick={() => toggleSort('hours')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[110px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Hours</span>
                        {sortField === 'hours' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Task Description & Notes */}
                    <th
                      onClick={() => toggleSort('task')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[260px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Task &amp; Operational Notes</span>
                        {sortField === 'task' ? (
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
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                          <div className="h-12 w-12 rounded-2xl bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] mb-3">
                            <Clock className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">No time entries found</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                            {hasActiveFilters
                              ? 'Try adjusting your search terms or filters.'
                              : 'No time entries recorded yet. Click "+ Record Hours" above to log your first work session.'}
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
                      const laneCfg = LANE_CONFIG[log.lane] || LANE_CONFIG.Outreach;
                      const relative = getRelativeDate(log.date);

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors"
                        >
                          {/* 1. Date */}
                          <td className="py-2.5 pl-4 pr-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{formatDisplayDate(log.date)}</span>
                              {relative && (
                                <span className="text-[10px] text-slate-400">{relative.label}</span>
                              )}
                            </div>
                          </td>

                          {/* 2. Team Member */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center space-x-2">
                              <div className="h-7 w-7 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold font-mono text-[11px] border border-slate-200 dark:border-white/10 shrink-0">
                                {log.person.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[140px]">
                                {log.person}
                              </span>
                            </div>
                          </td>

                          {/* 3. Client / Project */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              {log.client === 'Internal' ? (
                                <span className="rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-xs font-semibold">
                                  Internal (Agency)
                                </span>
                              ) : (
                                <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm">
                                  <Building className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF] shrink-0" />
                                  <span className="truncate max-w-[160px]">{log.client}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 4. Operational Lane */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className="inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border"
                              style={{
                                color: laneCfg.color,
                                backgroundColor: laneCfg.bgLight,
                                borderColor: laneCfg.border,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: laneCfg.color }}
                              />
                              <span>{log.lane}</span>
                            </span>
                          </td>

                          {/* 5. Hours Spent */}
                          <td className="px-3 py-2.5 font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{Number(log.hours).toFixed(1)} hrs</span>
                            </div>
                          </td>

                          {/* 6. Task Description & Notes */}
                          <td className="px-3 py-2.5 max-w-[320px]">
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={log.task}>
                                {log.task}
                              </p>
                              {log.note && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5 italic" title={log.note}>
                                  Note: {log.note}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 7. Actions (Sticky Right) */}
                          <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(log)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                                title="Edit Time Entry"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithConfirm(log)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Time Entry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

            {/* Table Footer: Pagination */}
            {totalFiltered > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Showing <span className="font-bold font-mono text-slate-900 dark:text-white">{startDisplay}</span>-
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{endIndex}</span> of{' '}
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{totalFiltered}</span> records
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                  <div className="flex items-center space-x-1">
                    <span>Rows:</span>
                    <PageSizeDropdown
                      pageSize={pageSize}
                      onSelect={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="First Page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center space-x-1 px-1">
                    {pageNumbers.map((p, idx) =>
                      p === '...' ? (
                        <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${p}`}
                          type="button"
                          onClick={() => setCurrentPage(Number(p))}
                          className={`min-w-[28px] h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                            p === safePage
                              ? 'bg-[#6324FC] text-white shadow-sm shadow-[#6324FC]/30'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Last Page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Cards / Activity Timeline View */
          <motion.div
            key="time-log-cards-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredAndSorted.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-8 shadow-sm backdrop-blur-xl">
                <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No time entries found</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Try resetting filters or recording a new work session.</p>
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
            ) : (
              paginatedLogs.map((log) => {
                const laneCfg = LANE_CONFIG[log.lane] || LANE_CONFIG.Outreach;
                const LaneIcon = laneCfg.icon;

                return (
                  <div
                    key={log.id}
                    className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/90 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-xl flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Lane & Hours */}
                      <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center space-x-2">
                          <span
                            className="inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border"
                            style={{
                              color: laneCfg.color,
                              backgroundColor: laneCfg.bgLight,
                              borderColor: laneCfg.border,
                            }}
                          >
                            <LaneIcon size={12} />
                            <span>{log.lane}</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                          <Clock size={13} />
                          <span>{Number(log.hours).toFixed(1)} hrs</span>
                        </div>
                      </div>

                      {/* Task Description */}
                      <div className="my-3.5 space-y-1.5">
                        <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {log.task}
                        </h4>
                        {log.note && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                            "{log.note}"
                          </p>
                        )}
                      </div>

                      {/* Contributor & Client Strip */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                        <div className="flex items-center space-x-2 rounded-xl bg-slate-50 dark:bg-black/30 p-2">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {log.person}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 rounded-xl bg-slate-50 dark:bg-black/30 p-2">
                          <Building size={13} className="text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {log.client}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Date & Actions */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>{formatDisplayDate(log.date)}</span>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(log)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 hover:bg-[#6324FC]/20 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithConfirm(log)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Luxury Add / Edit Time Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-5 sm:p-7 shadow-2xl backdrop-blur-2xl z-10 custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#6324FC] to-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-[#6324FC]/30">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      {editingLog ? 'Edit Time Log Entry' : 'Record Fulfilled Hours'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Track operational hours across team members, clients, and agency service lanes.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* SECTION 1: Date, Contributor & Hours */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <User size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Work Session &amp; Contributor
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Log Date *
                      </label>
                      <DatePicker
                        value={formDate}
                        onChange={setFormDate}
                        color="#6324FC"
                        placeholder="Select Date"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Team Member *
                      </label>
                      <input
                        type="text"
                        required
                        value={formPerson}
                        onChange={(e) => setFormPerson(e.target.value)}
                        placeholder="e.g. Lead Gen Specialist"
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Hours Spent *
                      </label>
                      <div className="relative">
                        <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          step="0.5"
                          min="0.25"
                          max="24"
                          required
                          value={formHours}
                          onChange={(e) => setFormHours(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono font-bold outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Person Selector Pills */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">
                      Quick Member Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PERSON_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormPerson(p)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-all ${
                            formPerson === p
                              ? 'bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/40 font-bold'
                              : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Account & Operational Lane */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <Building size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Client Account &amp; Operational Lane
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Client / Project *
                      </label>
                      <select
                        value={formClient}
                        onChange={(e) => setFormClient(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        <option value="Internal">Internal (Agency Operations)</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} {c.status !== 'Active' ? `(${c.status})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Operational Lane *
                      </label>
                      <select
                        value={formLane}
                        onChange={(e) => setFormLane(e.target.value as LaneType)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        <option value="Outreach">Outreach (Cold Email / Lead Research)</option>
                        <option value="Fulfillment">Fulfillment (Client Deliverables / SEO)</option>
                        <option value="Tech">Tech (Domains / Inboxes / Automations)</option>
                        <option value="Strategy">Strategy (Audits / Strategy Calls)</option>
                        <option value="Admin">Admin (Operations / Finance)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Task Description & Quick Presets */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Task Description &amp; Deliverable
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Detailed record</span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Cleaned 120 Dallas HVAC leads in MillionVerifier & launched campaign..."
                    value={formTask}
                    onChange={(e) => setFormTask(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                  />

                  {/* Quick Task Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                      Quick Activity Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TASK_PRESETS.map((tsk) => (
                        <button
                          key={tsk}
                          type="button"
                          onClick={() => setFormTask(tsk)}
                          className="rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        >
                          + {tsk}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Internal Strategy Notes & Links */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-2">
                  <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">
                    Internal Deliverable Notes &amp; Links (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Instantly warmup score 98%; Google Sheet link attached in delivery dashboard..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
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
                        <span>Delete Entry</span>
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
                      {submitting ? 'Saving...' : editingLog ? 'Update Time Entry' : 'Save Time Entry'}
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
