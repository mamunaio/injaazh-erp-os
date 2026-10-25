'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckSquare,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
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
  AlertTriangle,
  Clock,
  User,
  Sparkles,
  Layers,
  Send,
  Wrench,
  FileText,
  ShieldCheck,
  Check,
  Flame,
  AlertCircle,
  Kanban,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeamTask } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';

interface TeamTasksViewProps {
  tasks: TeamTask[];
  onAddTask: (task: Omit<TeamTask, 'id'>) => Promise<void>;
  onUpdateTask: (id: string, task: Partial<TeamTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

type SortField = 'task' | 'owner' | 'lane' | 'deadline' | 'status' | 'flag' | null;
type SortOrder = 'asc' | 'desc';
type TaskLane = 'Outreach' | 'Fulfillment' | 'Tech' | 'Content' | 'Admin';
type TaskStatus = 'Todo' | 'In Progress' | 'Done' | 'Blocked';
type TaskFlag = 'Normal' | 'Urgent' | 'Blocked';

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

// Deadline status indicator
const getDeadlineStatus = (deadlineStr?: string | null) => {
  if (!deadlineStr) return null;
  const clean = deadlineStr.includes('T') ? deadlineStr.split('T')[0] : deadlineStr;
  const today = getTodayStr();

  const [tY, tM, tD] = today.split('-').map(Number);
  const [dY, dM, dD] = clean.split('-').map(Number);

  const tTime = new Date(tY, tM - 1, tD).getTime();
  const dTime = new Date(dY, dM - 1, dD).getTime();
  const diffDays = Math.round((dTime - tTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, type: 'overdue' };
  if (diffDays === 0) return { label: 'Due today', type: 'today' };
  if (diffDays === 1) return { label: 'Due tomorrow', type: 'tomorrow' };
  if (diffDays <= 7) return { label: `In ${diffDays}d`, type: 'soon' };
  return { label: formatDisplayDate(clean), type: 'future' };
};

// Lane configuration
const LANE_CONFIG: Record<
  TaskLane,
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
    label: 'Client Deliverables / SEO',
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
  Content: {
    label: 'Content & Copywriting',
    color: '#EC4899',
    bgLight: 'rgba(236, 72, 153, 0.08)',
    bgDark: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.25)',
    icon: FileText,
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
  'Google Maps Local Audit & Scraping',
  'MillionVerifier Email Cleaning Batch (500 leads)',
  'Instantly Warmup Health & DNS Audit',
  'Local City Page SEO Draft & Schema',
  'Review Velocity SOP & Funnel Setup',
  'Loom Video Audit Batch (5 prospects)',
  'Weekly Deliverables Check & Retainer Review',
];

// Quick Assignee Presets
const QUICK_ASSIGNEE_PRESETS = [
  'Lead Gen Specialist',
  'Agency Founder',
  'SEO & GBP Specialist',
  'Tech & Automation Lead',
  'Content Writer',
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

export default function TeamTasksView({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TeamTasksViewProps) {
  const { confirm } = useConfirm();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [laneFilter, setLaneFilter] = useState<string>('ALL');
  const [flagFilter, setFlagFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TeamTask | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [lane, setLane] = useState<TaskLane>('Outreach');
  const [owner, setOwner] = useState('Lead Gen Specialist');
  const [deadline, setDeadline] = useState(getTodayStr());
  const [briefLink, setBriefLink] = useState('');
  const [flag, setFlag] = useState<TaskFlag>('Normal');
  const [notes, setNotes] = useState('');

  // Lock scroll when modal is active
  useScrollLock(isModalOpen);

  const todayStr = getTodayStr();

  // KPI Computations
  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'Done'), [tasks]);
  const todoTasks = useMemo(() => tasks.filter((t) => t.status === 'Todo'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'In Progress'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === 'Done'), [tasks]);
  const urgentOrBlocked = useMemo(
    () => tasks.filter((t) => (t.flag === 'Urgent' || t.flag === 'Blocked' || t.status === 'Blocked') && t.status !== 'Done'),
    [tasks]
  );
  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.deadline && t.deadline < todayStr && t.status !== 'Done'),
    [tasks, todayStr]
  );

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = tasks.filter((t) => {
      const formattedDate = formatDisplayDate(t.deadline)?.toLowerCase() || '';
      const matchesSearch =
        !term ||
        t.task.toLowerCase().includes(term) ||
        t.owner.toLowerCase().includes(term) ||
        (t.notes && t.notes.toLowerCase().includes(term)) ||
        (t.briefLink && t.briefLink.toLowerCase().includes(term)) ||
        (t.id && t.id.toLowerCase().includes(term)) ||
        t.deadline.toLowerCase().includes(term) ||
        formattedDate.includes(term);

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = t.status === statusFilter;
      }

      let matchesLane = true;
      if (laneFilter !== 'ALL') {
        matchesLane = t.lane === laneFilter;
      }

      let matchesFlag = true;
      if (flagFilter !== 'ALL') {
        matchesFlag = t.flag === flagFilter;
      }

      return matchesSearch && matchesStatus && matchesLane && matchesFlag;
    });

    if (sortField) {
      return [...result].sort((a, b) => {
        if (sortField === 'deadline') {
          return sortOrder === 'asc' ? a.deadline.localeCompare(b.deadline) : b.deadline.localeCompare(a.deadline);
        }
        if (sortField === 'task') {
          return sortOrder === 'asc' ? a.task.localeCompare(b.task) : b.task.localeCompare(a.task);
        }
        if (sortField === 'owner') {
          return sortOrder === 'asc' ? a.owner.localeCompare(b.owner) : b.owner.localeCompare(a.owner);
        }
        if (sortField === 'lane') {
          return sortOrder === 'asc' ? a.lane.localeCompare(b.lane) : b.lane.localeCompare(a.lane);
        }
        if (sortField === 'status') {
          return sortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
        }
        if (sortField === 'flag') {
          return sortOrder === 'asc' ? a.flag.localeCompare(b.flag) : b.flag.localeCompare(a.flag);
        }
        return 0;
      });
    }

    return result;
  }, [tasks, searchTerm, statusFilter, laneFilter, flagFilter, sortField, sortOrder]);

  // Pagination Calculations
  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const startDisplay = totalFiltered === 0 ? 0 : startIndex + 1;

  const paginatedTasks = useMemo(() => {
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
      setSortOrder('asc');
    }
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'ALL' || laneFilter !== 'ALL' || flagFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setLaneFilter('ALL');
    setFlagFilter('ALL');
    setCurrentPage(1);
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setLane('Outreach');
    setOwner('Lead Gen Specialist');
    setDeadline(getTodayStr());
    setBriefLink('');
    setFlag('Normal');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleStartEdit = (t: TeamTask) => {
    setEditingTask(t);
    setTaskTitle(t.task);
    setLane(t.lane);
    setOwner(t.owner);
    setDeadline(t.deadline || getTodayStr());
    setBriefLink(t.briefLink || '');
    setFlag(t.flag);
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !owner.trim()) return;

    setSubmitting(true);
    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, {
          task: taskTitle.trim(),
          lane,
          owner: owner.trim(),
          deadline,
          briefLink: briefLink.trim(),
          flag,
          notes: notes.trim(),
        });
      } else {
        await onAddTask({
          task: taskTitle.trim(),
          lane,
          owner: owner.trim(),
          created: todayStr,
          deadline,
          status: 'Todo',
          reviewedByMe: false,
          briefLink: briefLink.trim(),
          flag,
          notes: notes.trim(),
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save team task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWithConfirm = async (t: TeamTask) => {
    const confirmed = await confirm({
      title: 'Delete Team Task Brief',
      message: `Are you sure you want to permanently delete task "${t.task}"? This action cannot be undone.`,
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteTask(t.id);
      if (editingTask?.id === t.id) {
        handleCloseModal();
      }
    }
  };

  // Options for filter selects
  const STATUS_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Statuses', color: '#94A3B8' },
    { value: 'Todo', label: 'Todo Queue', color: '#6324FC' },
    { value: 'In Progress', label: 'In Progress', color: '#00E5FF' },
    { value: 'Done', label: 'Completed (Done)', color: '#10B981' },
    { value: 'Blocked', label: 'Blocked State', color: '#EF4444' },
  ];

  const LANE_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Operational Lanes', color: '#94A3B8' },
    { value: 'Outreach', label: 'Outreach & Prospecting', color: LANE_CONFIG.Outreach.color },
    { value: 'Fulfillment', label: 'Client Deliverables / SEO', color: LANE_CONFIG.Fulfillment.color },
    { value: 'Tech', label: 'Tech & Infrastructure', color: LANE_CONFIG.Tech.color },
    { value: 'Content', label: 'Content & Copywriting', color: LANE_CONFIG.Content.color },
    { value: 'Admin', label: 'Operations & Finance', color: LANE_CONFIG.Admin.color },
  ];

  const FLAG_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Priorities', color: '#94A3B8' },
    { value: 'Normal', label: 'Normal Priority', color: '#94A3B8' },
    { value: 'Urgent', label: 'Urgent Flag 🔥', color: '#EF4444' },
    { value: 'Blocked', label: 'Blocked Flag ⚠️', color: '#F59E0B' },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* 1. Top KPI Summary Cards (Matching Standard Lead Gen Pattern) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Active Tasks Queue */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Active Pipeline</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {activeTasks.length} <span className="text-xs font-normal text-slate-400">/ {tasks.length}</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Uncompleted Tasks</span>
        </div>

        {/* Todo Queue */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Todo Queue</span>
          <p className="text-xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-0.5 font-mono">
            {todoTasks.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Ready to Begin</span>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">In Progress</span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
            {inProgressTasks.length}
          </p>
          <span className="text-[10px] text-indigo-500/80 font-mono">Active Execution</span>
        </div>

        {/* Completed Tasks */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Completed</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            {doneTasks.length}
          </p>
          <span className="text-[10px] text-emerald-500/80 font-mono">Delivered &amp; Done</span>
        </div>

        {/* Urgent / Blocked Alerts */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Urgent / Blocked</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              urgentOrBlocked.length > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {urgentOrBlocked.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">High Priority Flags</span>
        </div>

        {/* Overdue Deadlines */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Overdue Deadlines</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              overdueTasks.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {overdueTasks.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {overdueTasks.length === 0 ? 'On Schedule' : 'Action Required'}
          </span>
        </div>
      </div>

      {/* 2. Control Bar: Search, Filters, View Mode, Single CTA Button */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-3 lg:p-4 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks by title, assignee, notes, or brief link..."
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
          {/* Status Filter */}
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
            minWidth={180}
          />

          {/* Lane Filter */}
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

          {/* Flag / Priority Filter */}
          <FilterSelect
            label="Priority"
            value={flagFilter}
            onChange={(val) => {
              setFlagFilter(val);
              setCurrentPage(1);
            }}
            options={FLAG_OPTIONS}
            minWidth={170}
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
                  layoutId="teamTasksViewModePill"
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
              title="Cards / Kanban Queue View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="teamTasksViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <LayoutGrid className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Cards</span>
            </button>
          </div>

          {/* Single Primary CTA Button: + Assign Task Brief */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Assign Task Brief</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content: Table or Cards View with AnimatePresence */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="team-tasks-table-view"
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
                  {totalFiltered} {totalFiltered === 1 ? 'Task Logged' : 'Tasks Logged'}
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
                  <span className="h-2 w-2 rounded-full bg-[#6324FC]" />
                  <span className="text-slate-600 dark:text-slate-400">{todoTasks.length} Todo</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-slate-600 dark:text-slate-400">{inProgressTasks.length} In Progress</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">{doneTasks.length} Completed</span>
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  <tr>
                    {/* Task Title */}
                    <th
                      onClick={() => toggleSort('task')}
                      className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[240px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Task Brief</span>
                        {sortField === 'task' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Assignee */}
                    <th
                      onClick={() => toggleSort('owner')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[150px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Assignee</span>
                        {sortField === 'owner' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Lane */}
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

                    {/* Deadline */}
                    <th
                      onClick={() => toggleSort('deadline')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[140px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Deadline</span>
                        {sortField === 'deadline' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Priority Flag */}
                    <th
                      onClick={() => toggleSort('flag')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[110px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Priority</span>
                        {sortField === 'flag' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Status */}
                    <th
                      onClick={() => toggleSort('status')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Status</span>
                        {sortField === 'status' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Review State */}
                    <th className="px-3 py-2.5 min-w-[130px]">
                      <span>Review State</span>
                    </th>

                    {/* Brief Asset Link */}
                    <th className="px-3 py-2.5 min-w-[120px]">
                      <span>Brief Link</span>
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
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                          <div className="h-12 w-12 rounded-2xl bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] mb-3">
                            <CheckSquare className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">No team tasks found</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                            {hasActiveFilters
                              ? 'Try adjusting your search terms or filters.'
                              : 'No team tasks logged yet. Click "+ Assign Task Brief" above to delegate your first operational brief.'}
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
                    paginatedTasks.map((t) => {
                      const laneCfg = LANE_CONFIG[t.lane] || LANE_CONFIG.Outreach;
                      const deadlineStatus = getDeadlineStatus(t.deadline);
                      const isOverdue = deadlineStatus?.type === 'overdue' && t.status !== 'Done';

                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors ${
                            isOverdue ? 'bg-rose-500/[0.03] dark:bg-rose-950/20' : ''
                          }`}
                        >
                          {/* 1. Task Brief & Title */}
                          <td className="py-2.5 pl-4 pr-3 max-w-[260px]">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate" title={t.task}>
                                {t.task}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {t.id}
                                </span>
                                {t.notes && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                                    <span className="text-[11px] text-slate-400 truncate max-w-[160px]" title={t.notes}>
                                      {t.notes}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Assignee */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="h-7 w-7 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold font-mono text-[11px] border border-slate-200 dark:border-white/10 shrink-0">
                                {t.owner.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[130px]">
                                {t.owner}
                              </span>
                            </div>
                          </td>

                          {/* 3. Operational Lane */}
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
                              <span>{t.lane}</span>
                            </span>
                          </td>

                          {/* 4. Deadline */}
                          <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                                {formatDisplayDate(t.deadline)}
                              </span>
                              {deadlineStatus && (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    isOverdue
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : deadlineStatus.type === 'today'
                                      ? 'text-amber-500 font-bold'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {deadlineStatus.label}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Priority Flag */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {t.flag === 'Urgent' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                <Flame size={11} />
                                <span>Urgent</span>
                              </span>
                            ) : t.flag === 'Blocked' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={11} />
                                <span>Blocked</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                Normal
                              </span>
                            )}
                          </td>

                          {/* 6. Status Selector */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <select
                              value={t.status}
                              onChange={(e) => onUpdateTask(t.id, { status: e.target.value as TaskStatus })}
                              className={`rounded-xl border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer transition-all ${
                                t.status === 'Done'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : t.status === 'In Progress'
                                  ? 'border-[#6324FC]/30 bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]'
                                  : t.status === 'Blocked'
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <option value="Todo">Todo</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                          </td>

                          {/* 7. Review State Toggle */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onUpdateTask(t.id, { reviewedByMe: !t.reviewedByMe })}
                              className={`flex items-center space-x-1.5 rounded-xl px-2.5 py-1 text-xs font-bold border transition ${
                                t.reviewedByMe
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                            >
                              <CheckCircle2 className={`h-3.5 w-3.5 ${t.reviewedByMe ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <span>{t.reviewedByMe ? 'Reviewed' : 'Review'}</span>
                            </button>
                          </td>

                          {/* 8. Brief Link */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {t.briefLink ? (
                              <a
                                href={t.briefLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                              >
                                <span>Brief</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* 9. Actions Column (Sticky Right) */}
                          <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(t)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                                title="Edit Task Brief"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithConfirm(t)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Task"
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
          /* Cards / Kanban Queue View */
          <motion.div
            key="team-tasks-cards-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredAndSorted.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-8 shadow-sm backdrop-blur-xl">
                <CheckSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No team tasks found</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Try resetting filters or assigning a new task brief.</p>
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
              paginatedTasks.map((t) => {
                const laneCfg = LANE_CONFIG[t.lane] || LANE_CONFIG.Outreach;
                const deadlineStatus = getDeadlineStatus(t.deadline);
                const isOverdue = deadlineStatus?.type === 'overdue' && t.status !== 'Done';

                return (
                  <div
                    key={t.id}
                    className={`rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/90 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-xl flex flex-col justify-between ${
                      isOverdue ? 'border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    <div>
                      {/* Card Header: Lane, Priority Flag, Review */}
                      <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/10 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                            style={{
                              color: laneCfg.color,
                              backgroundColor: laneCfg.bgLight,
                              borderColor: laneCfg.border,
                            }}
                          >
                            <span>{t.lane}</span>
                          </span>

                          {t.flag === 'Urgent' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              <Flame size={10} />
                              <span>Urgent</span>
                            </span>
                          )}

                          {t.flag === 'Blocked' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <AlertTriangle size={10} />
                              <span>Blocked</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onUpdateTask(t.id, { reviewedByMe: !t.reviewedByMe })}
                          className={`flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition shrink-0 ${
                            t.reviewedByMe
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-white/10 text-slate-400'
                          }`}
                        >
                          <CheckCircle2 size={11} className={t.reviewedByMe ? 'text-emerald-500' : 'text-slate-400'} />
                          <span>{t.reviewedByMe ? 'Reviewed' : 'Review'}</span>
                        </button>
                      </div>

                      {/* Task Brief Title */}
                      <div className="my-3 space-y-1">
                        <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {t.task}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 block">ID: {t.id}</span>
                      </div>

                      {/* Notes / Brief Link */}
                      {t.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-black/5 dark:bg-white/5 p-2 rounded-xl mb-3">
                          "{t.notes}"
                        </p>
                      )}

                      {/* Assignee & Deadline Row */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                        <div className="flex items-center space-x-2 rounded-xl bg-slate-50 dark:bg-black/30 p-2">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {t.owner}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 rounded-xl bg-slate-50 dark:bg-black/30 p-2">
                          <Clock size={13} className="text-slate-400 shrink-0" />
                          <span
                            className={`font-semibold truncate ${
                              isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {deadlineStatus ? deadlineStatus.label : formatDisplayDate(t.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Status Selector & Actions */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                      <select
                        value={t.status}
                        onChange={(e) => onUpdateTask(t.id, { status: e.target.value as TaskStatus })}
                        className={`rounded-xl border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${
                          t.status === 'Done'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : t.status === 'In Progress'
                            ? 'border-[#6324FC]/30 bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]'
                            : t.status === 'Blocked'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                        <option value="Blocked">Blocked</option>
                      </select>

                      <div className="flex items-center space-x-1.5">
                        {t.briefLink && (
                          <a
                            href={t.briefLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                            title="Open Brief Document"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(t)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 hover:bg-[#6324FC]/20 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithConfirm(t)}
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

      {/* 4. Luxury Add / Edit Team Task Brief Modal */}
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
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      {editingTask ? 'Edit Task Brief' : 'Assign New Task Brief'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Delegate operational deliverables, deadlines, priorities, and review status.
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
                {/* SECTION 1: Task Title & Brief */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Task Brief &amp; Scope
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Actionable deliverable</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Task Title / Deliverable *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Audit 20 HVAC prospect Google Maps snapshots in Dallas..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                    />
                  </div>

                  {/* Quick Task Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                      Quick Scope Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TASK_PRESETS.map((tsk) => (
                        <button
                          key={tsk}
                          type="button"
                          onClick={() => setTaskTitle(tsk)}
                          className="rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        >
                          + {tsk}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Assignee, Lane & Priority */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <User size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Ownership, Lane &amp; Priority
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Assignee / Owner *
                      </label>
                      <input
                        type="text"
                        required
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        placeholder="e.g. Lead Gen Specialist"
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Operational Lane *
                      </label>
                      <select
                        value={lane}
                        onChange={(e) => setLane(e.target.value as TaskLane)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        <option value="Outreach">Outreach (Cold Email / Research)</option>
                        <option value="Fulfillment">Fulfillment (Deliverables / Local SEO)</option>
                        <option value="Tech">Tech (Automation / Email Infrastructure)</option>
                        <option value="Content">Content (City Pages / Reviews)</option>
                        <option value="Admin">Admin (Operations / Finance)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Priority Flag *
                      </label>
                      <select
                        value={flag}
                        onChange={(e) => setFlag(e.target.value as TaskFlag)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent 🔥</option>
                        <option value="Blocked">Blocked ⚠️</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Assignee Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">
                      Quick Assignee Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ASSIGNEE_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setOwner(p)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-all ${
                            owner === p
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

                {/* SECTION 3: Deadline & Brief Link */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <Clock size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Deadline &amp; External Assets
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Target Deadline *
                      </label>
                      <DatePicker
                        value={deadline}
                        onChange={setDeadline}
                        color="#6324FC"
                        placeholder="Select Deadline"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Brief Link (Loom / Notion / Google Doc)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={briefLink}
                        onChange={(e) => setBriefLink(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Strategic Notes */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-2">
                  <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">
                    Acceptance Criteria &amp; Strategy Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Ensure verified rate is above 95% before uploading to Instantly campaign pool..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {editingTask && (
                      <button
                        type="button"
                        onClick={() => handleDeleteWithConfirm(editingTask)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>Delete Task</span>
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
                      {submitting ? 'Saving...' : editingTask ? 'Update Task Brief' : 'Assign Task Brief'}
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
