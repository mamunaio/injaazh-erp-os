'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Briefcase,
  PlusCircle,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Edit2,
  Trash2,
  Check,
  Building,
  Search,
  X,
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
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client, SystemSettings, TimeLog } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';

interface ClientsViewProps {
  clients: Client[];
  timeLogs: TimeLog[];
  settings: SystemSettings;
  onAddClient: (client: Omit<Client, 'id'>) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

type SortField = 'name' | 'startDate' | 'monthlyRetainer' | 'hours' | 'effectiveRate' | 'status' | null;
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

// Relative date label: "Active 3 mos" or "Started today"
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

// Preset Quick Service Chips for Modal
const PRESET_SERVICES = [
  'GBP Optimization',
  'Local City Pages',
  'Monthly AI Visibility Report',
  'Review Velocity Funnel',
  'HVAC Schema Markup',
  'High-Velocity Outreach',
];

export default function ClientsView({
  clients,
  timeLogs,
  settings,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}: ClientsViewProps) {
  const { confirm } = useConfirm();

  // View & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [yieldFilter, setYieldFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('monthlyRetainer');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Form State
  const [formName, setFormName] = useState('');
  const [formRetainer, setFormRetainer] = useState(1000);
  const [formStartDate, setFormStartDate] = useState(getTodayStr());
  const [formServices, setFormServices] = useState('GBP Optimization, Local City Pages, Monthly AI Visibility Report');
  const [formStatus, setFormStatus] = useState<'Active' | 'Paused' | 'Churned'>('Active');
  const [formEstimatedHours, setFormEstimatedHours] = useState<number>(20);
  const [formNotes, setFormNotes] = useState('');

  // Lock scroll when modal is active
  useScrollLock(isModalOpen);

  const hourlyFloor = typeof settings.hourlyFloorRate === 'number' ? settings.hourlyFloorRate : 25;

  // Calculate actual hours logged for each client
  const getClientHours = useCallback(
    (clientName: string, fallbackHours?: number) => {
      const logged = timeLogs
        .filter((t) => t.client && t.client.toLowerCase() === clientName.toLowerCase())
        .reduce((acc, t) => acc + (Number(t.hours) || 0), 0);
      return logged > 0 ? logged : fallbackHours || 0;
    },
    [timeLogs]
  );

  // High-level KPI Computations
  const activeClients = useMemo(() => clients.filter((c) => c.status === 'Active'), [clients]);
  const currentMrr = useMemo(
    () => activeClients.reduce((acc, c) => acc + (Number(c.monthlyRetainer) || 0), 0),
    [activeClients]
  );
  const avgRetainer = activeClients.length > 0 ? currentMrr / activeClients.length : 0;

  const totalActiveHours = useMemo(
    () =>
      activeClients.reduce(
        (acc, c) => acc + getClientHours(c.name, c.hoursReportMonth),
        0
      ),
    [activeClients, getClientHours]
  );
  const blendedHourly = totalActiveHours > 0 ? currentMrr / totalActiveHours : 0;

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = clients.filter((client) => {
      const formattedDate = formatDisplayDate(client.startDate)?.toLowerCase() || '';
      const matchesSearch =
        !term ||
        client.name.toLowerCase().includes(term) ||
        (client.services && client.services.toLowerCase().includes(term)) ||
        (client.notes && client.notes.toLowerCase().includes(term)) ||
        formattedDate.includes(term);

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = client.status === statusFilter;
      }

      let matchesYield = true;
      const hours = getClientHours(client.name, client.hoursReportMonth);
      const effectiveRate = hours > 0 ? client.monthlyRetainer / hours : client.monthlyRetainer;
      if (yieldFilter === 'SAFE') {
        matchesYield = effectiveRate >= hourlyFloor;
      } else if (yieldFilter === 'LOW') {
        matchesYield = hours > 0 && effectiveRate < hourlyFloor;
      }

      return matchesSearch && matchesStatus && matchesYield;
    });

    if (sortField) {
      return [...result].sort((a, b) => {
        if (sortField === 'name') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortField === 'startDate') {
          return sortOrder === 'asc' ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate);
        }
        if (sortField === 'monthlyRetainer') {
          return sortOrder === 'asc' ? a.monthlyRetainer - b.monthlyRetainer : b.monthlyRetainer - a.monthlyRetainer;
        }
        if (sortField === 'hours') {
          const hA = getClientHours(a.name, a.hoursReportMonth);
          const hB = getClientHours(b.name, b.hoursReportMonth);
          return sortOrder === 'asc' ? hA - hB : hB - hA;
        }
        if (sortField === 'effectiveRate') {
          const hA = getClientHours(a.name, a.hoursReportMonth);
          const hB = getClientHours(b.name, b.hoursReportMonth);
          const rateA = hA > 0 ? a.monthlyRetainer / hA : a.monthlyRetainer;
          const rateB = hB > 0 ? b.monthlyRetainer / hB : b.monthlyRetainer;
          return sortOrder === 'asc' ? rateA - rateB : rateB - rateA;
        }
        if (sortField === 'status') {
          return sortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
        }
        return 0;
      });
    }

    return result;
  }, [clients, searchTerm, statusFilter, yieldFilter, sortField, sortOrder, hourlyFloor, getClientHours]);

  // Pagination Calculations
  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const startDisplay = totalFiltered === 0 ? 0 : startIndex + 1;

  const paginatedClients = useMemo(() => {
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

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'ALL' || yieldFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setYieldFilter('ALL');
    setCurrentPage(1);
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormRetainer(1000);
    setFormStartDate(getTodayStr());
    setFormServices('GBP Optimization, Local City Pages, Monthly AI Visibility Report');
    setFormStatus('Active');
    setFormEstimatedHours(20);
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleStartEdit = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormRetainer(client.monthlyRetainer);
    setFormStartDate(client.startDate || getTodayStr());
    setFormServices(client.services || '');
    setFormStatus(client.status === 'Example' ? 'Active' : (client.status as 'Active' | 'Paused' | 'Churned'));
    const hours = getClientHours(client.name, client.hoursReportMonth);
    setFormEstimatedHours(hours > 0 ? hours : 20);
    setFormNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSubmitting(true);
    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, {
          name: formName.trim(),
          monthlyRetainer: Number(formRetainer),
          services: formServices.trim(),
          startDate: formStartDate,
          status: formStatus,
          notes: formNotes.trim(),
        });
      } else {
        await onAddClient({
          name: formName.trim(),
          monthlyRetainer: Number(formRetainer),
          services: formServices.trim(),
          startDate: formStartDate,
          status: formStatus,
          notes: formNotes.trim(),
          hoursReportMonth: 0,
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save client:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler with confirm dialog
  const handleDeleteWithConfirm = async (client: Client) => {
    const confirmed = await confirm({
      title: 'Delete Client Retainer',
      message: `Are you sure you want to permanently delete "${client.name}" ($${client.monthlyRetainer.toLocaleString()}/mo)? Associated tracking history will be detached.`,
      confirmText: 'Delete Client',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteClient(client.id);
      if (editingClient?.id === client.id) {
        handleCloseModal();
      }
    }
  };

  // Toggle quick service preset in modal
  const handleToggleService = (service: string) => {
    const currentList = formServices
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (currentList.includes(service)) {
      setFormServices(currentList.filter((s) => s !== service).join(', '));
    } else {
      setFormServices([...currentList, service].join(', '));
    }
  };

  // Live yield simulator in modal
  const simRetainer = Number(formRetainer) || 0;
  const simHours = Number(formEstimatedHours) || 0;
  const simYield = simHours > 0 ? simRetainer / simHours : simRetainer;
  const isSimSafe = simYield >= hourlyFloor;

  // Filter dropdown options
  const STATUS_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Statuses', color: '#94A3B8' },
    { value: 'Active', label: 'Active Retainers', color: '#10B981' },
    { value: 'Paused', label: 'Paused Agreements', color: '#F59E0B' },
    { value: 'Churned', label: 'Churned Accounts', color: '#EF4444' },
  ];

  const YIELD_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Yields', color: '#94A3B8' },
    { value: 'SAFE', label: `Safe Yield (≥$${hourlyFloor}/hr)`, color: '#10B981' },
    { value: 'LOW', label: `Low Yield Alert (<$${hourlyFloor}/hr)`, color: '#EF4444' },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* 1. Top KPI Summary Cards (Matching Prospects & Daily Outreach Pattern) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {/* Active Paying Clients */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Active Retainers</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {activeClients.length} <span className="text-xs font-normal text-slate-400">/ {clients.length}</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Fulfillment Active</span>
        </div>

        {/* Live Monthly Recurring Revenue */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Live Monthly MRR</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            ${currentMrr.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-500/80 font-mono">Contracted Recurring</span>
        </div>

        {/* Average Retainer Yield */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Avg Retainer</span>
          <p className="text-xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-0.5 font-mono">
            ${Math.round(avgRetainer).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Per active account</span>
        </div>

        {/* Active Fulfillment Hours */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Fulfilled Hours</span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
            {totalActiveHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono">From Time Tracking</span>
        </div>

        {/* Blended Yield $/hr with Safety Floor Check */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Blended Hourly Yield</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              blendedHourly >= hourlyFloor
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400 animate-pulse'
            }`}
          >
            ${blendedHourly.toFixed(1)}/hr
          </p>
          <span className="text-[10px] text-slate-400 font-mono">≥ ${hourlyFloor}/hr floor limit</span>
        </div>
      </div>

      {/* 2. Control Bar: Search, Filters, View Mode, Single CTA Button */}
      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-3 lg:p-4 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients by company name, services, notes..."
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
          />

          {/* Hourly Yield Safety Filter */}
          <FilterSelect
            label="Yield Rate"
            value={yieldFilter}
            onChange={(val) => {
              setYieldFilter(val);
              setCurrentPage(1);
            }}
            options={YIELD_OPTIONS}
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
                  layoutId="clientsViewModePill"
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
              title="Directory Cards View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="clientsViewModePill"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <LayoutGrid className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Cards</span>
            </button>
          </div>

          {/* Single CTA Button: + Add New Client */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content: Table or Cards View with AnimatePresence */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="clients-table-view"
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
                  {totalFiltered} {totalFiltered === 1 ? 'Client Logged' : 'Clients Logged'}
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
                  <span className="text-slate-600 dark:text-slate-400">{activeClients.length} Active</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#6324FC] dark:bg-[#00E5FF]" />
                  <span className="text-slate-600 dark:text-slate-400">${currentMrr.toLocaleString()} MRR</span>
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  <tr>
                    {/* Client Name */}
                    <th
                      onClick={() => toggleSort('name')}
                      className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[200px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Client Company</span>
                        {sortField === 'name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Start Date */}
                    <th
                      onClick={() => toggleSort('startDate')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Start Date</span>
                        {sortField === 'startDate' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Monthly Retainer */}
                    <th
                      onClick={() => toggleSort('monthlyRetainer')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[140px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Monthly Retainer</span>
                        {sortField === 'monthlyRetainer' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Contracted Services */}
                    <th className="px-3 py-2.5 min-w-[200px]">
                      <span>Contracted Services</span>
                    </th>

                    {/* Hours Fulfilled */}
                    <th
                      onClick={() => toggleSort('hours')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[120px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Hours Fulfilled</span>
                        {sortField === 'hours' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Effective Yield */}
                    <th
                      onClick={() => toggleSort('effectiveRate')}
                      className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Effective Yield</span>
                        {sortField === 'effectiveRate' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </th>

                    {/* Floor Check Status */}
                    <th className="px-3 py-2.5 min-w-[120px]">
                      <span>Floor Check</span>
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
                            <Briefcase className="h-6 w-6" />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">No matching clients found</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                            {hasActiveFilters
                              ? 'Try adjusting your search terms or filters.'
                              : 'No clients added yet. Click "+ Add New Client" above to create your first client retainer.'}
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
                    paginatedClients.map((client) => {
                      const hours = getClientHours(client.name, client.hoursReportMonth);
                      const effectiveRate = hours > 0 ? client.monthlyRetainer / hours : client.monthlyRetainer;
                      const isUnderFloor = hours > 0 && effectiveRate < hourlyFloor;
                      const relative = getRelativeDate(client.startDate);

                      return (
                        <tr
                          key={client.id}
                          className={`hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors ${
                            isUnderFloor ? 'bg-rose-500/[0.03] dark:bg-rose-950/20' : ''
                          }`}
                        >
                          {/* 1. Company Name */}
                          <td className="py-2.5 pl-4 pr-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="h-8 w-8 rounded-xl bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] shrink-0 font-bold font-mono text-xs border border-[#6324FC]/20 dark:border-[#00E5FF]/20">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate max-w-[200px]">
                                  {client.name}
                                </span>
                                {client.notes && (
                                  <span className="text-[11px] text-slate-400 block truncate max-w-[190px]">
                                    {client.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Start Date */}
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{formatDisplayDate(client.startDate)}</span>
                              {relative && (
                                <span className="text-[10px] text-slate-400">{relative.label}</span>
                              )}
                            </div>
                          </td>

                          {/* 3. Monthly Retainer */}
                          <td className="px-3 py-2.5 font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            ${client.monthlyRetainer.toLocaleString()}
                            <span className="text-[10px] font-normal text-slate-400 block font-sans">/ month</span>
                          </td>

                          {/* 4. Contracted Services */}
                          <td className="px-3 py-2.5 max-w-[220px]">
                            <div className="flex flex-wrap gap-1">
                              {client.services
                                ? client.services.split(',').slice(0, 2).map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]"
                                      title={s.trim()}
                                    >
                                      {s.trim()}
                                    </span>
                                  ))
                                : <span className="text-slate-400 text-xs">Standard Scope</span>}
                              {client.services && client.services.split(',').length > 2 && (
                                <span
                                  className="rounded-lg bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] px-1.5 py-0.5 text-[10px] font-bold"
                                  title={client.services}
                                >
                                  +{client.services.split(',').length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Hours Fulfilled */}
                          <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{hours.toFixed(1)} hrs</span>
                            </div>
                          </td>

                          {/* 6. Effective Yield */}
                          <td className="px-3 py-2.5 font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                            <span className={isUnderFloor ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              ${effectiveRate.toFixed(1)}/hr
                            </span>
                          </td>

                          {/* 7. Floor Check Status */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {isUnderFloor ? (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                <ShieldAlert className="h-3 w-3" />
                                <span>Low Yield</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Safe Yield</span>
                              </span>
                            )}
                          </td>

                          {/* 8. Status */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                client.status === 'Active'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : client.status === 'Paused'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  client.status === 'Active'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : client.status === 'Paused'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span>{client.status}</span>
                            </span>
                          </td>

                          {/* 9. Actions Column (Sticky Right) */}
                          <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(client)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                                title="Edit Client Details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithConfirm(client)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Client"
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
          /* Cards / Grid Directory View */
          <motion.div
            key="clients-cards-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredAndSorted.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-8 shadow-sm backdrop-blur-xl">
                <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">No matching clients found</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Try resetting filters or adding a new client retainer.</p>
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
              paginatedClients.map((client) => {
                const hours = getClientHours(client.name, client.hoursReportMonth);
                const effectiveRate = hours > 0 ? client.monthlyRetainer / hours : client.monthlyRetainer;
                const isUnderFloor = hours > 0 && effectiveRate < hourlyFloor;
                const relative = getRelativeDate(client.startDate);

                return (
                  <div
                    key={client.id}
                    className={`rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/90 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-xl flex flex-col justify-between ${
                      isUnderFloor ? 'border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#6324FC]/15 to-[#4F46E5]/10 dark:from-[#00E5FF]/15 dark:to-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] font-bold font-mono text-sm border border-[#6324FC]/20">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[170px]">
                              {client.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Started {formatDisplayDate(client.startDate)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            client.status === 'Active'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : client.status === 'Paused'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              client.status === 'Active'
                                ? 'bg-emerald-500'
                                : client.status === 'Paused'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{client.status}</span>
                        </span>
                      </div>

                      {/* Financials & Yield Strip */}
                      <div className="grid grid-cols-2 gap-2 my-3.5">
                        <div className="rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/30 p-2.5">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Retainer</span>
                          <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                            ${client.monthlyRetainer.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ month recurring</span>
                        </div>

                        <div className="rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-black/30 p-2.5">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Hourly Yield</span>
                          <span
                            className={`text-base font-black font-mono ${
                              isUnderFloor ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            ${effectiveRate.toFixed(1)}/hr
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {hours.toFixed(1)} hrs fulfilled
                          </span>
                        </div>
                      </div>

                      {/* Contracted Services Chips */}
                      <div className="space-y-1.5 my-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                          Contracted Scope
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {client.services
                            ? client.services.split(',').map((s, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                                >
                                  {s.trim()}
                                </span>
                              ))
                            : <span className="text-slate-400 text-xs">Standard Operations</span>}
                        </div>
                      </div>

                      {/* Strategy Notes Snippet */}
                      {client.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-black/5 dark:bg-white/5 p-2 rounded-xl mb-3">
                          "{client.notes}"
                        </p>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        {isUnderFloor ? (
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <ShieldAlert size={12} />
                            <span>Rate Warning</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck size={12} />
                            <span>Yield Safe</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(client)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 hover:bg-[#6324FC]/20 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithConfirm(client)}
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

      {/* 4. Luxury Add / Edit Client Modal */}
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
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      {editingClient ? 'Edit Client Retainer' : 'Add New Client Retainer'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure monthly retainer agreement, scope, and enforce hourly floor yields.
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
                {/* SECTION 1: Client Identity & Timeline */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                    <Building size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Client Profile &amp; Agreement Status
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Client Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Comfort HVAC & Refrigeration"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Agreement Start Date *
                      </label>
                      <DatePicker
                        value={formStartDate}
                        onChange={setFormStartDate}
                        color="#6324FC"
                        placeholder="Select start date"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Retainer Status *
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Paused' | 'Churned')}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        <option value="Active">Active (Paying &amp; Fulfilled)</option>
                        <option value="Paused">Paused (Billing Suspended)</option>
                        <option value="Churned">Churned (Archived)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Retainer & Live Hourly Yield Simulator */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-500" />
                      <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Monthly Retainer &amp; Yield Simulation
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Floor Safety: ≥${hourlyFloor}/hr
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Monthly Retainer Fee ($) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          required
                          value={formRetainer}
                          onChange={(e) => setFormRetainer(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Estimated Monthly Hours *
                      </label>
                      <div className="relative">
                        <Clock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={formEstimatedHours}
                          onChange={(e) => setFormEstimatedHours(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Simulation Card */}
                  <div
                    className={`rounded-xl p-3 border flex items-center justify-between transition-colors ${
                      isSimSafe
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {isSimSafe ? (
                        <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 animate-pulse" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Simulated Effective Yield:{' '}
                          <span className={isSimSafe ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-rose-600 dark:text-rose-400 font-mono'}>
                            ${simYield.toFixed(1)}/hr
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isSimSafe
                            ? `Exceeds minimum safety floor ($${hourlyFloor}/hr) by +$${(simYield - hourlyFloor).toFixed(1)}/hr`
                            : `Under required safety floor limit ($${hourlyFloor}/hr) by -$${(hourlyFloor - simYield).toFixed(1)}/hr`}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg uppercase ${
                        isSimSafe
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {isSimSafe ? 'Profitable' : 'Low Yield'}
                    </span>
                  </div>
                </div>

                {/* SECTION 3: Contracted Services & Scope */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Contracted Fulfillment Services
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Comma separated</span>
                  </div>

                  <input
                    type="text"
                    placeholder="GBP Optimization, Local City Pages, Monthly AI Visibility Report..."
                    value={formServices}
                    onChange={(e) => setFormServices(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                  />

                  {/* Preset Quick Chips */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                      Quick Scope Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_SERVICES.map((srv) => {
                        const isIncluded = formServices.toLowerCase().includes(srv.toLowerCase());
                        return (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => handleToggleService(srv)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                              isIncluded
                                ? 'bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/40 font-bold'
                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-slate-300'
                            }`}
                          >
                            {isIncluded ? `✓ ${srv}` : `+ ${srv}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Internal Strategy Notes & Churn Risk */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-2">
                  <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">
                    Internal Strategy Notes &amp; Churn Risk
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Owner requested monthly Zoom check-in on the 1st; renewal scheduled for next quarter..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {editingClient && (
                      <button
                        type="button"
                        onClick={() => handleDeleteWithConfirm(editingClient)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>Delete Client</span>
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
                      {submitting ? 'Saving...' : editingClient ? 'Update Client Retainer' : 'Save Client Retainer'}
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
