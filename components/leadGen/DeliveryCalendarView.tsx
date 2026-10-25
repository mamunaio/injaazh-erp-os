'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  PlusCircle,
  Building,
  Sparkles,
  Check,
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
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  ShieldCheck,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeliveryItem, Client } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';

interface DeliveryCalendarViewProps {
  items: DeliveryItem[];
  clients: Client[];
  onAddItem: (item: Omit<DeliveryItem, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<DeliveryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

type SortField = 'client' | 'task' | 'frequency' | 'lastDone' | 'nextDue' | 'countdown' | 'status' | null;
type SortOrder = 'asc' | 'desc';
type CadenceFrequency = 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly' | 'Bi-annual';

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

// Calculate exact days left until due date
const calculateDaysLeft = (dueDateStr?: string | null) => {
  if (!dueDateStr) return 999;
  const clean = dueDateStr.includes('T') ? dueDateStr.split('T')[0] : dueDateStr;
  const today = getTodayStr();
  const [tY, tM, tD] = today.split('-').map(Number);
  const [dY, dM, dD] = clean.split('-').map(Number);
  const tTime = new Date(tY, tM - 1, tD).getTime();
  const dTime = new Date(dY, dM - 1, dD).getTime();
  return Math.round((dTime - tTime) / (1000 * 60 * 60 * 24));
};

// Calculate next due date string based on cadence
const advanceCadenceDate = (freq: CadenceFrequency): string => {
  const d = new Date();
  if (freq === 'Weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'Bi-weekly') d.setDate(d.getDate() + 14);
  else if (freq === 'Monthly') d.setMonth(d.getMonth() + 1);
  else if (freq === 'Quarterly') d.setMonth(d.getMonth() + 3);
  else if (freq === 'Bi-annual') d.setMonth(d.getMonth() + 6);
  else d.setDate(d.getDate() + 30);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Frequency styling config
const FREQUENCY_CONFIG: Record<
  CadenceFrequency,
  { label: string; color: string; bgLight: string; border: string }
> = {
  Weekly: {
    label: 'Weekly',
    color: '#6324FC',
    bgLight: 'rgba(99, 36, 252, 0.08)',
    border: 'rgba(99, 36, 252, 0.25)',
  },
  'Bi-weekly': {
    label: 'Bi-weekly',
    color: '#00E5FF',
    bgLight: 'rgba(0, 229, 255, 0.08)',
    border: 'rgba(0, 229, 255, 0.25)',
  },
  Monthly: {
    label: 'Monthly',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  Quarterly: {
    label: 'Quarterly',
    color: '#F59E0B',
    bgLight: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  'Bi-annual': {
    label: 'Bi-annual (6 Mo)',
    color: '#EC4899',
    bgLight: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.25)',
  },
};

// Quick SOP deliverable presets for modal
const QUICK_SOP_PRESETS = [
  'Weekly GBP Offer Post & Geo-tagged Photo',
  'Bi-Weekly Sub-Suburb Local City Page',
  'Monthly Call Tracking & AI Visibility Report',
  'Quarterly Review Velocity Funnel Refresh',
  'Bi-Annual Neighboring Zip-Codes Area Audit',
  'Monthly HVAC Schema & Local FAQ Markup',
  'Bi-Weekly Google Review Response & Monitoring',
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

export default function DeliveryCalendarView({
  items,
  clients,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: DeliveryCalendarViewProps) {
  const { confirm } = useConfirm();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [cadenceFilter, setCadenceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('nextDue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Form State
  const [formClient, setFormClient] = useState(clients[0]?.name || 'Apex Comfort HVAC');
  const [formTask, setFormTask] = useState('Weekly GBP offer post & geo-tagged photo');
  const [formFrequency, setFormFrequency] = useState<CadenceFrequency>('Weekly');
  const [formNextDue, setFormNextDue] = useState(getTodayStr());
  const [formNotes, setFormNotes] = useState('');

  // Lock scroll when modal is active
  useScrollLock(isModalOpen);

  const todayStr = getTodayStr();

  // High-level KPI Computations
  const totalDeliverables = items.length;

  const overdueDeliverables = useMemo(
    () => items.filter((item) => calculateDaysLeft(item.nextDue) < 0),
    [items]
  );

  const dueSoonDeliverables = useMemo(
    () => items.filter((item) => {
      const days = calculateDaysLeft(item.nextDue);
      return days >= 0 && days <= 3;
    }),
    [items]
  );

  const weeklyDeliverables = useMemo(
    () => items.filter((item) => item.frequency === 'Weekly'),
    [items]
  );

  const biweeklyOrMonthly = useMemo(
    () => items.filter((item) => item.frequency === 'Bi-weekly' || item.frequency === 'Monthly'),
    [items]
  );

  const onTrackDeliverables = useMemo(
    () => items.filter((item) => calculateDaysLeft(item.nextDue) >= 0),
    [items]
  );

  const fulfillmentHealthPct = totalDeliverables > 0
    ? Math.round((onTrackDeliverables.length / totalDeliverables) * 100)
    : 100;

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = items.filter((item) => {
      const formattedDue = formatDisplayDate(item.nextDue)?.toLowerCase() || '';
      const formattedDone = formatDisplayDate(item.lastDone)?.toLowerCase() || '';
      const matchesSearch =
        !term ||
        item.client.toLowerCase().includes(term) ||
        item.task.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term)) ||
        item.frequency.toLowerCase().includes(term) ||
        item.nextDue.toLowerCase().includes(term) ||
        formattedDue.includes(term) ||
        formattedDone.includes(term);

      let matchesClient = true;
      if (clientFilter !== 'ALL') {
        matchesClient = item.client.toLowerCase() === clientFilter.toLowerCase();
      }

      let matchesCadence = true;
      if (cadenceFilter !== 'ALL') {
        matchesCadence = item.frequency === cadenceFilter;
      }

      let matchesStatus = true;
      const days = calculateDaysLeft(item.nextDue);
      if (statusFilter === 'OVERDUE') {
        matchesStatus = days < 0;
      } else if (statusFilter === 'DUE_SOON') {
        matchesStatus = days >= 0 && days <= 3;
      } else if (statusFilter === 'ON_TRACK') {
        matchesStatus = days >= 0;
      }

      return matchesSearch && matchesClient && matchesCadence && matchesStatus;
    });

    if (sortField) {
      return [...result].sort((a, b) => {
        if (sortField === 'nextDue') {
          return sortOrder === 'asc' ? a.nextDue.localeCompare(b.nextDue) : b.nextDue.localeCompare(a.nextDue);
        }
        if (sortField === 'client') {
          return sortOrder === 'asc' ? a.client.localeCompare(b.client) : b.client.localeCompare(a.client);
        }
        if (sortField === 'task') {
          return sortOrder === 'asc' ? a.task.localeCompare(b.task) : b.task.localeCompare(a.task);
        }
        if (sortField === 'frequency') {
          return sortOrder === 'asc' ? a.frequency.localeCompare(b.frequency) : b.frequency.localeCompare(a.frequency);
        }
        if (sortField === 'lastDone') {
          const lA = a.lastDone || '';
          const lB = b.lastDone || '';
          return sortOrder === 'asc' ? lA.localeCompare(lB) : lB.localeCompare(lA);
        }
        if (sortField === 'countdown') {
          const cA = calculateDaysLeft(a.nextDue);
          const cB = calculateDaysLeft(b.nextDue);
          return sortOrder === 'asc' ? cA - cB : cB - cA;
        }
        if (sortField === 'status') {
          const sA = calculateDaysLeft(a.nextDue) < 0 ? 'Overdue' : 'Good';
          const sB = calculateDaysLeft(b.nextDue) < 0 ? 'Overdue' : 'Good';
          return sortOrder === 'asc' ? sA.localeCompare(sB) : sB.localeCompare(sA);
        }
        return 0;
      });
    }

    return result;
  }, [items, searchTerm, clientFilter, cadenceFilter, statusFilter, sortField, sortOrder]);

  // Pagination Calculations
  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const startDisplay = totalFiltered === 0 ? 0 : startIndex + 1;

  const paginatedItems = useMemo(() => {
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

  const hasActiveFilters = searchTerm !== '' || clientFilter !== 'ALL' || cadenceFilter !== 'ALL' || statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setClientFilter('ALL');
    setCadenceFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // 1-Click Fast Mark Done Today & Advance Cadence
  const handleMarkDoneToday = async (item: DeliveryItem) => {
    const nextDateStr = advanceCadenceDate(item.frequency);

    await onUpdateItem(item.id, {
      lastDone: todayStr,
      nextDue: nextDateStr,
      status: 'Good',
    });
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormClient(clients[0]?.name || 'Apex Comfort HVAC');
    setFormTask('Weekly GBP offer post & geo-tagged photo');
    setFormFrequency('Weekly');
    setFormNextDue(getTodayStr());
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleStartEdit = (item: DeliveryItem) => {
    setEditingItem(item);
    setFormClient(item.client);
    setFormTask(item.task);
    setFormFrequency(item.frequency);
    setFormNextDue(item.nextDue || getTodayStr());
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTask.trim() || !formClient.trim()) return;

    setSubmitting(true);
    try {
      if (editingItem) {
        await onUpdateItem(editingItem.id, {
          client: formClient.trim(),
          task: formTask.trim(),
          frequency: formFrequency,
          nextDue: formNextDue,
          notes: formNotes.trim(),
        });
      } else {
        await onAddItem({
          client: formClient.trim(),
          task: formTask.trim(),
          frequency: formFrequency,
          nextDue: formNextDue,
          lastDone: '',
          status: 'Good',
          notes: formNotes.trim(),
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save deliverable SOP:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWithConfirm = async (item: DeliveryItem) => {
    const confirmed = await confirm({
      title: 'Delete Deliverable SOP',
      message: `Are you sure you want to permanently delete "${item.task}" for "${item.client}"? Next due alerts will be removed.`,
      confirmText: 'Delete SOP',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteItem(item.id);
      if (editingItem?.id === item.id) {
        handleCloseModal();
      }
    }
  };

  // Dropdown filter options
  const CLIENT_OPTIONS: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = [
      { value: 'ALL', label: 'All Retainer Clients', color: '#94A3B8' },
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

  const CADENCE_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Cadences', color: '#94A3B8' },
    { value: 'Weekly', label: 'Weekly Cadence', color: FREQUENCY_CONFIG.Weekly.color },
    { value: 'Bi-weekly', label: 'Bi-weekly Cadence', color: FREQUENCY_CONFIG['Bi-weekly'].color },
    { value: 'Monthly', label: 'Monthly Cadence', color: FREQUENCY_CONFIG.Monthly.color },
    { value: 'Quarterly', label: 'Quarterly Cadence', color: FREQUENCY_CONFIG.Quarterly.color },
    { value: 'Bi-annual', label: 'Bi-annual (6 Mo)', color: FREQUENCY_CONFIG['Bi-annual'].color },
  ];

  const STATUS_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Schedules', color: '#94A3B8' },
    { value: 'OVERDUE', label: 'Overdue Alert ⚠️', color: '#EF4444' },
    { value: 'DUE_SOON', label: 'Due Soon (≤ 3d) ⏳', color: '#F59E0B' },
    { value: 'ON_TRACK', label: 'On Track & Ahead ✅', color: '#10B981' },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* 1. Top KPI Summary Cards (Matching Standard Lead Gen Pattern) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Deliverables */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Scheduled SOPs</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {totalDeliverables}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Active Recurring Deliverables</span>
        </div>

        {/* Overdue Deliverables Alert */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Overdue Deliverables</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              overdueDeliverables.length > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {overdueDeliverables.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {overdueDeliverables.length === 0 ? 'Zero Overdue' : 'Needs Immediate Action'}
          </span>
        </div>

        {/* Due Soon (≤ 3d) */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Due Soon (≤ 3d)</span>
          <p className="text-xl font-black text-amber-500 dark:text-amber-400 mt-0.5 font-mono">
            {dueSoonDeliverables.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Coming Up This Week</span>
        </div>

        {/* Weekly Deliverables */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Weekly Cadence</span>
          <p className="text-xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-0.5 font-mono">
            {weeklyDeliverables.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">GBP Posts &amp; Offers</span>
        </div>

        {/* Bi-Weekly / Monthly */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Bi-Weekly / Mo</span>
          <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 font-mono">
            {biweeklyOrMonthly.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">City Pages &amp; Reports</span>
        </div>

        {/* Fulfillment Health Rate */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Schedule Health</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              fulfillmentHealthPct >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
            }`}
          >
            {fulfillmentHealthPct}%
          </p>
          <span className="text-[10px] text-slate-400 font-mono">On-Time SLA Rating</span>
        </div>
      </div>

      {/* 2. Control Bar: Search, Filters, View Mode, Single CTA Button */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-3 lg:p-4 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search deliverables by client, task title, notes, or date..."
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
          {/* Client Filter */}
          <FilterSelect
            label="Client"
            value={clientFilter}
            onChange={(val) => {
              setClientFilter(val);
              setCurrentPage(1);
            }}
            options={CLIENT_OPTIONS}
            minWidth={200}
          />

          {/* Cadence Filter */}
          <FilterSelect
            label="Cadence"
            value={cadenceFilter}
            onChange={(val) => {
              setCadenceFilter(val);
              setCurrentPage(1);
            }}
            options={CADENCE_OPTIONS}
            minWidth={170}
          />

          {/* Schedule Health Filter */}
          <FilterSelect
            label="Schedule"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
            minWidth={180}
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
                  layoutId="deliverySopsViewModePill"
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
              title="SOP Cadence Cards View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="deliverySopsViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <LayoutGrid className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Cards</span>
            </button>
          </div>

          {/* Single Primary CTA Button: + Add Deliverable SOP */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Deliverable SOP</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content: Table or Cards View with AnimatePresence */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="delivery-sops-table-view"
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
                  {totalFiltered} {totalFiltered === 1 ? 'Deliverable SOP Active' : 'Deliverable SOPs Active'}
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
                  <span className="text-slate-600 dark:text-slate-400">{onTrackDeliverables.length} On Track</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-slate-600 dark:text-slate-400">{dueSoonDeliverables.length} Due Soon</span>
                </span>
                {overdueDeliverables.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{overdueDeliverables.length} Overdue</span>
                  </span>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  <tr>
                    {/* Client Company */}
                    <th
                      onClick={() => toggleSort('client')}
                      className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[180px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Client Account</span>
                        {sortField === 'client' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Recurring Task */}
                    <th
                      onClick={() => toggleSort('task')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[240px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Deliverable Task SOP</span>
                        {sortField === 'task' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Cadence */}
                    <th
                      onClick={() => toggleSort('frequency')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[120px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Cadence</span>
                        {sortField === 'frequency' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Last Done */}
                    <th
                      onClick={() => toggleSort('lastDone')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[120px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Last Done</span>
                        {sortField === 'lastDone' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Next Due */}
                    <th
                      onClick={() => toggleSort('nextDue')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Next Due Date</span>
                        {sortField === 'nextDue' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Countdown / Health */}
                    <th
                      onClick={() => toggleSort('countdown')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[140px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Countdown</span>
                        {sortField === 'countdown' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Status */}
                    <th
                      onClick={() => toggleSort('status')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[110px]"
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

                    {/* Actions Header (Sticky Right) */}
                    <th className="sticky right-0 z-20 bg-slate-50/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right font-bold shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)] min-w-[140px]">
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
                            <CalendarDays className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">No deliverable SOPs found</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                            {hasActiveFilters
                              ? 'Try adjusting your search terms or filters.'
                              : 'No deliverable SOPs scheduled yet. Click "+ Add Deliverable SOP" above to configure your first client cadence.'}
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
                    paginatedItems.map((item) => {
                      const daysLeft = calculateDaysLeft(item.nextDue);
                      const isOverdue = daysLeft < 0;
                      const isDueSoon = daysLeft >= 0 && daysLeft <= 3;
                      const cadenceCfg = FREQUENCY_CONFIG[item.frequency] || FREQUENCY_CONFIG.Weekly;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors ${
                            isOverdue ? 'bg-rose-500/[0.03] dark:bg-rose-950/20' : ''
                          }`}
                        >
                          {/* 1. Client Company */}
                          <td className="py-2.5 pl-4 pr-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="h-7 w-7 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] font-bold font-mono text-[11px] border border-slate-200 dark:border-white/10 shrink-0">
                                {item.client.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[160px]">
                                {item.client}
                              </span>
                            </div>
                          </td>

                          {/* 2. Deliverable Task SOP */}
                          <td className="px-3 py-2.5 max-w-[280px]">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate" title={item.task}>
                                {item.task}
                              </span>
                              {item.notes && (
                                <span className="text-[11px] text-slate-400 block truncate mt-0.5 italic" title={item.notes}>
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Cadence */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border"
                              style={{
                                color: cadenceCfg.color,
                                backgroundColor: cadenceCfg.bgLight,
                                borderColor: cadenceCfg.border,
                              }}
                            >
                              <span>{item.frequency}</span>
                            </span>
                          </td>

                          {/* 4. Last Done */}
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {item.lastDone ? formatDisplayDate(item.lastDone) : '—'}
                          </td>

                          {/* 5. Next Due Date */}
                          <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                            <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-slate-200 font-semibold'}>
                              {formatDisplayDate(item.nextDue)}
                            </span>
                          </td>

                          {/* 6. Countdown */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-xs ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isDueSoon
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {isOverdue && <AlertTriangle size={12} className="animate-pulse shrink-0" />}
                              {isDueSoon && !isOverdue && <Clock size={12} className="shrink-0" />}
                              <span>
                                {isOverdue
                                  ? `${Math.abs(daysLeft)}d Overdue!`
                                  : daysLeft === 0
                                  ? 'Due Today!'
                                  : daysLeft === 1
                                  ? 'Due Tomorrow'
                                  : `${daysLeft} Days Left`}
                              </span>
                            </span>
                          </td>

                          {/* 7. Status */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                isOverdue
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : isDueSoon
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isOverdue
                                    ? 'bg-rose-500 animate-pulse'
                                    : isDueSoon
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span>{isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'On Track'}</span>
                            </span>
                          </td>

                          {/* 8. Actions (Sticky Right) */}
                          <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* 1-Click Fast Done Button */}
                              <button
                                type="button"
                                onClick={() => handleMarkDoneToday(item)}
                                className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 shadow-sm transition active:scale-95"
                                title="Mark Completed Today & Advance Cadence"
                              >
                                <Check className="h-3 w-3" />
                                <span>Done</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                                title="Edit SOP Deliverable"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithConfirm(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete SOP Deliverable"
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
          /* Cadence Cards / Queue View */
          <motion.div
            key="delivery-sops-cards-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredAndSorted.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-8 shadow-sm backdrop-blur-xl">
                <CalendarDays className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No deliverable SOPs found</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Try resetting filters or adding a recurring deliverable.</p>
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
              paginatedItems.map((item) => {
                const daysLeft = calculateDaysLeft(item.nextDue);
                const isOverdue = daysLeft < 0;
                const isDueSoon = daysLeft >= 0 && daysLeft <= 3;
                const cadenceCfg = FREQUENCY_CONFIG[item.frequency] || FREQUENCY_CONFIG.Weekly;

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/90 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-xl flex flex-col justify-between ${
                      isOverdue ? 'border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    <div>
                      {/* Card Header: Client & Cadence */}
                      <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/10 gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#6324FC]/15 to-[#4F46E5]/10 dark:from-[#00E5FF]/15 dark:to-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] font-bold font-mono text-xs border border-[#6324FC]/20">
                            {item.client.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[150px]">
                              {item.client}
                            </h4>
                            <span
                              className="inline-block text-[10px] font-bold mt-0.5"
                              style={{ color: cadenceCfg.color }}
                            >
                              {item.frequency} Cadence
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            isOverdue
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : isDueSoon
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          <span>{isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'On Track'}</span>
                        </span>
                      </div>

                      {/* Task SOP Title */}
                      <div className="my-3 space-y-1">
                        <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {item.task}
                        </h4>
                        {item.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-black/5 dark:bg-white/5 p-2 rounded-xl mt-2">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      {/* Schedule Countdown Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                        <div className="rounded-xl bg-slate-50 dark:bg-black/30 p-2">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">Next Due</span>
                          <span className={`font-bold font-mono text-xs sm:text-sm block ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {formatDisplayDate(item.nextDue)}
                          </span>
                        </div>

                        <div className="rounded-xl bg-slate-50 dark:bg-black/30 p-2">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">Countdown</span>
                          <span className={`font-bold text-xs sm:text-sm block ${isOverdue ? 'text-rose-600 dark:text-rose-400' : isDueSoon ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {isOverdue
                              ? `${Math.abs(daysLeft)}d Overdue!`
                              : daysLeft === 0
                              ? 'Due Today!'
                              : `${daysLeft} Days Left`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Fast Done & Actions */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkDoneToday(item)}
                        className="flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 shadow-sm transition active:scale-95"
                      >
                        <Check size={13} />
                        <span>Done Today</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 hover:bg-[#6324FC]/20 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithConfirm(item)}
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

      {/* 4. Luxury Add / Edit Deliverable SOP Modal */}
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
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      {editingItem ? 'Edit Deliverable SOP' : 'Add Recurring Deliverable SOP'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure client retainer deliverables, cadence schedules, and countdown alerts.
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
                {/* SECTION 1: Client & Cadence */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <Building size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Client Retainer &amp; Cadence
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Client Company *
                      </label>
                      {clients.length > 0 ? (
                        <select
                          value={formClient}
                          onChange={(e) => setFormClient(e.target.value)}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                        >
                          {clients.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name} {c.status !== 'Active' ? `(${c.status})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Comfort HVAC"
                          value={formClient}
                          onChange={(e) => setFormClient(e.target.value)}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Fulfillment Cadence *
                      </label>
                      <select
                        value={formFrequency}
                        onChange={(e) => setFormFrequency(e.target.value as CadenceFrequency)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        <option value="Weekly">Weekly (Every 7 Days)</option>
                        <option value="Bi-weekly">Bi-weekly (Every 14 Days)</option>
                        <option value="Monthly">Monthly (Every 30 Days)</option>
                        <option value="Quarterly">Quarterly (Every 3 Months)</option>
                        <option value="Bi-annual">Bi-annual (Every 6 Months)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Task Description & Quick Presets */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Deliverable Task SOP &amp; Deliverable Title
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Standard Operating Procedure</span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly GBP offer post & geo-tagged photo..."
                    value={formTask}
                    onChange={(e) => setFormTask(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                  />

                  {/* Preset Quick Chips */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                      Quick SOP Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SOP_PRESETS.map((pst) => (
                        <button
                          key={pst}
                          type="button"
                          onClick={() => setFormTask(pst)}
                          className="rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        >
                          + {pst}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Next Due Date & Schedule */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <Clock size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Schedule &amp; Next Due Target
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Next Due Date *
                      </label>
                      <DatePicker
                        value={formNextDue}
                        onChange={setFormNextDue}
                        color="#6324FC"
                        placeholder="Select Next Due Date"
                      />
                    </div>

                    <div className="flex flex-col justify-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        When marked <strong className="text-emerald-600 dark:text-emerald-400">"Done"</strong> in the dashboard, the next due date will automatically advance forward by your selected cadence (<strong className="text-slate-900 dark:text-white">{formFrequency}</strong>).
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: SOP Documentation & Asset Links */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-2">
                  <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">
                    SOP Notes, Asset Links &amp; Standard Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Canva design template: https://canva.com/..., Geo-imgr upload folder attached in client hub..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {editingItem && (
                      <button
                        type="button"
                        onClick={() => handleDeleteWithConfirm(editingItem)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>Delete SOP</span>
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
                      {submitting ? 'Saving...' : editingItem ? 'Update SOP Deliverable' : 'Save SOP Deliverable'}
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
