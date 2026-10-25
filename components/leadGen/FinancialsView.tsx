'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  DollarSign,
  PlusCircle,
  Receipt,
  CreditCard,
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
  Building,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart,
  Repeat,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Invoice, Expense, Client } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';

interface FinancialsViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  onAddInvoice: (inv: Omit<Invoice, 'id'>) => Promise<void>;
  onUpdateInvoice: (id: string, inv: Partial<Invoice>) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onAddExpense: (exp: Omit<Expense, 'id'>) => Promise<void>;
  onUpdateExpense: (id: string, exp: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

type SubTab = 'pnl' | 'invoices' | 'expenses';
type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

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

// Preset Retainer Amounts
const PRESET_AMOUNTS = [1000, 1500, 2000, 2500, 3000];

// Quick Expense Vendor Presets
const EXPENSE_PRESETS = [
  { vendor: 'Namecheap', category: 'Domains & Inboxes', amount: 48, isRecurring: true },
  { vendor: 'Instantly.ai', category: 'Email Warmup & Sending', amount: 97, isRecurring: true },
  { vendor: 'MillionVerifier', category: 'Lead Verification & Scraping', amount: 39, isRecurring: false },
  { vendor: 'Google Workspace', category: 'Domains & Inboxes', amount: 36, isRecurring: true },
  { vendor: 'Clay.com', category: 'Lead Verification & Scraping', amount: 149, isRecurring: true },
  { vendor: 'OpenAI API', category: 'Software & Subscriptions', amount: 25, isRecurring: false },
];

// Expense Categories
const EXPENSE_CATEGORIES = [
  'Domains & Inboxes',
  'Email Warmup & Sending',
  'Lead Verification & Scraping',
  'Software & Subscriptions',
  'Team & Freelancers',
  'Other',
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

export default function FinancialsView({
  invoices,
  expenses,
  clients,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: FinancialsViewProps) {
  const { confirm } = useConfirm();

  // Active Sub-Tab
  const [subTab, setSubTab] = useState<SubTab>('pnl');

  // Search, Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');
  const [invoiceClientFilter, setInvoiceClientFilter] = useState<string>('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseRecurringFilter, setExpenseRecurringFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting
  const [invSortField, setInvSortField] = useState<'invoiceNumber' | 'client' | 'issueDate' | 'amount' | 'dueDate' | 'status'>('issueDate');
  const [invSortOrder, setInvSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expSortField, setExpSortField] = useState<'date' | 'category' | 'vendor' | 'amount' | 'isRecurring'>('date');
  const [expSortOrder, setExpSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Invoice Form State
  const [invClient, setInvClient] = useState(clients[0]?.name || 'Apex Comfort HVAC');
  const [invAmount, setInvAmount] = useState<number>(1000);
  const [invIssueDate, setInvIssueDate] = useState(getTodayStr());
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [invStatus, setInvStatus] = useState<InvoiceStatus>('Sent');
  const [invNote, setInvNote] = useState('');

  // Expense Form State
  const [expDate, setExpDate] = useState(getTodayStr());
  const [expCategory, setExpCategory] = useState('Domains & Inboxes');
  const [expVendor, setExpVendor] = useState('Namecheap');
  const [expAmount, setExpAmount] = useState<number>(48);
  const [expRecurring, setExpRecurring] = useState(true);
  const [expNote, setExpNote] = useState('');

  // Universal scroll lock when any modal is open
  const isAnyModalOpen = showAddInvoiceModal || showAddExpenseModal || !!editingInvoice || !!editingExpense;
  useScrollLock(isAnyModalOpen);

  // Financial Totals
  const totalInvoiced = useMemo(
    () => invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
    [invoices]
  );

  const totalCollected = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'Paid')
        .reduce((acc, i) => acc + (Number(i.amount) || 0), 0),
    [invoices]
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
    [expenses]
  );

  const netProfit = totalCollected - totalExpenses;
  const profitMarginPct = totalCollected > 0 ? Math.round((netProfit / totalCollected) * 100) : 0;
  const pendingReceivables = Math.max(0, totalInvoiced - totalCollected);

  // Monthly PnL aggregation
  const pnlRows = useMemo(() => {
    const pnlMap: Record<string, { invoiced: number; collected: number; expenses: number }> = {};

    invoices.forEach((inv) => {
      const m = (inv.issueDate || '').slice(0, 7) || '2026-10';
      if (!pnlMap[m]) pnlMap[m] = { invoiced: 0, collected: 0, expenses: 0 };
      pnlMap[m].invoiced += Number(inv.amount) || 0;
      if (inv.status === 'Paid') {
        const paidM = (inv.paidDate || inv.issueDate || '').slice(0, 7) || m;
        if (!pnlMap[paidM]) pnlMap[paidM] = { invoiced: 0, collected: 0, expenses: 0 };
        pnlMap[paidM].collected += Number(inv.amount) || 0;
      }
    });

    expenses.forEach((exp) => {
      const m = (exp.date || '').slice(0, 7) || '2026-10';
      if (!pnlMap[m]) pnlMap[m] = { invoiced: 0, collected: 0, expenses: 0 };
      pnlMap[m].expenses += Number(exp.amount) || 0;
    });

    const pnlMonths = Object.keys(pnlMap).sort().reverse();
    let runningCumulative = 0;
    return pnlMonths.map((m) => {
      const item = pnlMap[m];
      const net = item.collected - item.expenses;
      runningCumulative += net;
      return {
        month: m,
        invoiced: item.invoiced,
        collected: item.collected,
        expenses: item.expenses,
        net,
        cumulative: runningCumulative,
      };
    });
  }, [invoices, expenses]);

  // Filtered & Sorted Invoices
  const filteredAndSortedInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = invoices.filter((inv) => {
      const formattedIssue = formatDisplayDate(inv.issueDate)?.toLowerCase() || '';
      const formattedDue = formatDisplayDate(inv.dueDate)?.toLowerCase() || '';
      const matchesSearch =
        !term ||
        inv.client.toLowerCase().includes(term) ||
        inv.invoiceNumber.toLowerCase().includes(term) ||
        (inv.note && inv.note.toLowerCase().includes(term)) ||
        formattedIssue.includes(term) ||
        formattedDue.includes(term);

      let matchesStatus = true;
      if (invoiceStatusFilter !== 'ALL') {
        matchesStatus = inv.status === invoiceStatusFilter;
      }

      let matchesClient = true;
      if (invoiceClientFilter !== 'ALL') {
        matchesClient = inv.client.toLowerCase() === invoiceClientFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesClient;
    });

    return result.sort((a, b) => {
      if (invSortField === 'issueDate') {
        return invSortOrder === 'asc' ? a.issueDate.localeCompare(b.issueDate) : b.issueDate.localeCompare(a.issueDate);
      }
      if (invSortField === 'dueDate') {
        return invSortOrder === 'asc' ? a.dueDate.localeCompare(b.dueDate) : b.dueDate.localeCompare(a.dueDate);
      }
      if (invSortField === 'amount') {
        return invSortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (invSortField === 'client') {
        return invSortOrder === 'asc' ? a.client.localeCompare(b.client) : b.client.localeCompare(a.client);
      }
      if (invSortField === 'invoiceNumber') {
        return invSortOrder === 'asc' ? a.invoiceNumber.localeCompare(b.invoiceNumber) : b.invoiceNumber.localeCompare(a.invoiceNumber);
      }
      if (invSortField === 'status') {
        return invSortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      }
      return 0;
    });
  }, [invoices, searchTerm, invoiceStatusFilter, invoiceClientFilter, invSortField, invSortOrder]);

  // Filtered & Sorted Expenses
  const filteredAndSortedExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = expenses.filter((exp) => {
      const formattedDate = formatDisplayDate(exp.date)?.toLowerCase() || '';
      const matchesSearch =
        !term ||
        exp.vendor.toLowerCase().includes(term) ||
        exp.category.toLowerCase().includes(term) ||
        (exp.note && exp.note.toLowerCase().includes(term)) ||
        formattedDate.includes(term);

      let matchesCategory = true;
      if (expenseCategoryFilter !== 'ALL') {
        matchesCategory = exp.category === expenseCategoryFilter;
      }

      let matchesRecurring = true;
      if (expenseRecurringFilter === 'RECURRING') {
        matchesRecurring = exp.isRecurring;
      } else if (expenseRecurringFilter === 'ONE_TIME') {
        matchesRecurring = !exp.isRecurring;
      }

      return matchesSearch && matchesCategory && matchesRecurring;
    });

    return result.sort((a, b) => {
      if (expSortField === 'date') {
        return expSortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      }
      if (expSortField === 'amount') {
        return expSortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (expSortField === 'vendor') {
        return expSortOrder === 'asc' ? a.vendor.localeCompare(b.vendor) : b.vendor.localeCompare(a.vendor);
      }
      if (expSortField === 'category') {
        return expSortOrder === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
      }
      if (expSortField === 'isRecurring') {
        return expSortOrder === 'asc' ? Number(a.isRecurring) - Number(b.isRecurring) : Number(b.isRecurring) - Number(a.isRecurring);
      }
      return 0;
    });
  }, [expenses, searchTerm, expenseCategoryFilter, expenseRecurringFilter, expSortField, expSortOrder]);

  // Active items for pagination based on subTab
  const currentListLength = subTab === 'invoices' ? filteredAndSortedInvoices.length : filteredAndSortedExpenses.length;
  const totalPages = Math.max(1, Math.ceil(currentListLength / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = currentListLength === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, currentListLength);
  const startDisplay = currentListLength === 0 ? 0 : startIndex + 1;

  const paginatedInvoices = useMemo(
    () => filteredAndSortedInvoices.slice(startIndex, endIndex),
    [filteredAndSortedInvoices, startIndex, endIndex]
  );

  const paginatedExpenses = useMemo(
    () => filteredAndSortedExpenses.slice(startIndex, endIndex),
    [filteredAndSortedExpenses, startIndex, endIndex]
  );

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

  const hasActiveFilters =
    searchTerm !== '' ||
    (subTab === 'invoices' && (invoiceStatusFilter !== 'ALL' || invoiceClientFilter !== 'ALL')) ||
    (subTab === 'expenses' && (expenseCategoryFilter !== 'ALL' || expenseRecurringFilter !== 'ALL'));

  const handleResetFilters = () => {
    setSearchTerm('');
    setInvoiceStatusFilter('ALL');
    setInvoiceClientFilter('ALL');
    setExpenseCategoryFilter('ALL');
    setExpenseRecurringFilter('ALL');
    setCurrentPage(1);
  };

  // 1-Click Fast Mark Invoice Paid
  const handleMarkPaid = async (inv: Invoice) => {
    await onUpdateInvoice(inv.id, {
      status: 'Paid',
      paidDate: getTodayStr(),
    });
  };

  // Open Invoice Modal
  const handleOpenAddInvoice = () => {
    setEditingInvoice(null);
    setInvClient(clients[0]?.name || 'Apex Comfort HVAC');
    setInvAmount(1000);
    setInvIssueDate(getTodayStr());
    const d = new Date();
    d.setDate(d.getDate() + 10);
    setInvDueDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    setInvStatus('Sent');
    setInvNote('');
    setShowAddInvoiceModal(true);
  };

  const handleStartEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvClient(inv.client);
    setInvAmount(inv.amount);
    setInvIssueDate(inv.issueDate || getTodayStr());
    setInvDueDate(inv.dueDate || getTodayStr());
    setInvStatus(inv.status);
    setInvNote(inv.note || '');
    setShowAddInvoiceModal(true);
  };

  const handleCloseInvoiceModal = () => {
    setShowAddInvoiceModal(false);
    setEditingInvoice(null);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClient.trim() || invAmount <= 0) return;

    setSubmitting(true);
    try {
      if (editingInvoice) {
        await onUpdateInvoice(editingInvoice.id, {
          client: invClient.trim(),
          amount: Number(invAmount),
          issueDate: invIssueDate,
          dueDate: invDueDate,
          status: invStatus,
          note: invNote.trim(),
          ...(invStatus === 'Paid' && !editingInvoice.paidDate ? { paidDate: getTodayStr() } : {}),
        });
      } else {
        const invNum = `INV-26-${String(invoices.length + 1).padStart(3, '0')}`;
        await onAddInvoice({
          invoiceNumber: invNum,
          client: invClient.trim(),
          amount: Number(invAmount),
          issueDate: invIssueDate,
          dueDate: invDueDate,
          status: invStatus,
          paidDate: invStatus === 'Paid' ? invIssueDate : undefined,
          note: invNote.trim(),
        });
      }
      handleCloseInvoiceModal();
    } catch (err) {
      console.error('Failed to save invoice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoiceWithConfirm = async (inv: Invoice) => {
    const confirmed = await confirm({
      title: 'Delete Client Invoice',
      message: `Are you sure you want to permanently delete invoice #${inv.invoiceNumber} ($${inv.amount.toLocaleString()}) for "${inv.client}"?`,
      confirmText: 'Delete Invoice',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteInvoice(inv.id);
      if (editingInvoice?.id === inv.id) {
        handleCloseInvoiceModal();
      }
    }
  };

  // Open Expense Modal
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpDate(getTodayStr());
    setExpCategory('Domains & Inboxes');
    setExpVendor('Namecheap');
    setExpAmount(48);
    setExpRecurring(true);
    setExpNote('');
    setShowAddExpenseModal(true);
  };

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpDate(exp.date || getTodayStr());
    setExpCategory(exp.category);
    setExpVendor(exp.vendor);
    setExpAmount(exp.amount);
    setExpRecurring(exp.isRecurring);
    setExpNote(exp.note || '');
    setShowAddExpenseModal(true);
  };

  const handleCloseExpenseModal = () => {
    setShowAddExpenseModal(false);
    setEditingExpense(null);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVendor.trim() || expAmount <= 0) return;

    setSubmitting(true);
    try {
      if (editingExpense) {
        await onUpdateExpense(editingExpense.id, {
          date: expDate,
          category: expCategory,
          vendor: expVendor.trim(),
          amount: Number(expAmount),
          isRecurring: expRecurring,
          note: expNote.trim(),
        });
      } else {
        await onAddExpense({
          date: expDate,
          category: expCategory,
          vendor: expVendor.trim(),
          amount: Number(expAmount),
          isRecurring: expRecurring,
          note: expNote.trim(),
        });
      }
      handleCloseExpenseModal();
    } catch (err) {
      console.error('Failed to save expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpenseWithConfirm = async (exp: Expense) => {
    const confirmed = await confirm({
      title: 'Delete Operating Expense',
      message: `Are you sure you want to delete this $${exp.amount.toLocaleString()} expense for "${exp.vendor}"?`,
      confirmText: 'Delete Expense',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteExpense(exp.id);
      if (editingExpense?.id === exp.id) {
        handleCloseExpenseModal();
      }
    }
  };

  // Filter options
  const INVOICE_STATUS_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Statuses', color: '#94A3B8' },
    { value: 'Paid', label: 'Cash Paid', color: '#10B981' },
    { value: 'Sent', label: 'Awaiting Payment (Sent)', color: '#F59E0B' },
    { value: 'Draft', label: 'Draft Invoices', color: '#64748B' },
    { value: 'Overdue', label: 'Overdue Invoices', color: '#EF4444' },
  ];

  const CLIENT_OPTIONS: FilterOption[] = useMemo(() => {
    const opts: FilterOption[] = [{ value: 'ALL', label: 'All Clients', color: '#94A3B8' }];
    clients.forEach((c) => {
      opts.push({
        value: c.name,
        label: c.name,
        color: c.status === 'Active' ? '#10B981' : '#F59E0B',
      });
    });
    return opts;
  }, [clients]);

  const EXPENSE_CATEGORY_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Categories', color: '#94A3B8' },
    { value: 'Domains & Inboxes', label: 'Domains & Inboxes', color: '#6324FC' },
    { value: 'Email Warmup & Sending', label: 'Email Warmup & Sending', color: '#00E5FF' },
    { value: 'Lead Verification & Scraping', label: 'Lead Verification & Scraping', color: '#10B981' },
    { value: 'Software & Subscriptions', label: 'Software & Subscriptions', color: '#EC4899' },
    { value: 'Team & Freelancers', label: 'Team & Freelancers', color: '#F59E0B' },
    { value: 'Other', label: 'Other', color: '#64748B' },
  ];

  const EXPENSE_RECURRING_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'All Types', color: '#94A3B8' },
    { value: 'RECURRING', label: 'Monthly Subscriptions', color: '#6324FC' },
    { value: 'ONE_TIME', label: 'One-time Payments', color: '#94A3B8' },
  ];

  return (
    <div className="space-y-4 pb-6 font-sans">
      {/* 1. Top KPI Summary Cards (Matching Standard Lead Gen Pattern) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Cash Collected */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Cash Collected</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            ${totalCollected.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Realized Revenue</span>
        </div>

        {/* Total Invoiced */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Invoiced</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            ${totalInvoiced.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">{invoices.length} Invoices Generated</span>
        </div>

        {/* Operating Expenses */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Tool &amp; Infra OPEX</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
            ${totalExpenses.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">{expenses.length} Expense Logs</span>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Bottom-Line Net Profit</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              netProfit >= 0 ? 'text-[#6324FC] dark:text-[#00E5FF]' : 'text-rose-600 dark:text-rose-400 animate-pulse'
            }`}
          >
            ${netProfit.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Collected - OPEX</span>
        </div>

        {/* Net Margin % */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Net Profit Margin</span>
          <p
            className={`text-xl font-black mt-0.5 font-mono ${
              profitMarginPct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : profitMarginPct > 0 ? 'text-[#6324FC] dark:text-[#00E5FF]' : 'text-rose-500'
            }`}
          >
            {profitMarginPct}%
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Profitability Rate</span>
        </div>

        {/* Pending Receivables */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Outstanding Balance</span>
          <p className="text-xl font-black text-amber-500 dark:text-amber-400 mt-0.5 font-mono">
            ${pendingReceivables.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Pending Collection</span>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar with Framer Motion Animated Layout Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 lg:p-3 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-black/40 relative">
          <button
            type="button"
            onClick={() => {
              setSubTab('pnl');
              setCurrentPage(1);
            }}
            className={`relative flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
              subTab === 'pnl'
                ? 'text-[#6324FC] dark:text-[#00E5FF]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {subTab === 'pnl' && (
              <motion.div
                layoutId="financialsSubTabPill"
                className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <PieChart className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Monthly PnL Summary</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('invoices');
              setCurrentPage(1);
            }}
            className={`relative flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
              subTab === 'invoices'
                ? 'text-[#6324FC] dark:text-[#00E5FF]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {subTab === 'invoices' && (
              <motion.div
                layoutId="financialsSubTabPill"
                className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <Receipt className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Invoices ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('expenses');
              setCurrentPage(1);
            }}
            className={`relative flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors ${
              subTab === 'expenses'
                ? 'text-[#6324FC] dark:text-[#00E5FF]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {subTab === 'expenses' && (
              <motion.div
                layoutId="financialsSubTabPill"
                className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            )}
            <CreditCard className="h-4 w-4 relative z-10" />
            <span className="relative z-10">OPEX Expenses ({expenses.length})</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddInvoice}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Invoice</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddExpense}
            className="flex items-center space-x-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-500/20 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* 3. Control Bar for Invoices & Expenses */}
      {subTab !== 'pnl' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-3 lg:p-4 backdrop-blur-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={
                subTab === 'invoices'
                  ? 'Search invoices by client, invoice number, notes, dates...'
                  : 'Search expenses by vendor, category, notes, date...'
              }
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

          {/* Filters & View Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {subTab === 'invoices' && (
              <>
                <FilterSelect
                  label="Status"
                  value={invoiceStatusFilter}
                  onChange={(val) => {
                    setInvoiceStatusFilter(val);
                    setCurrentPage(1);
                  }}
                  options={INVOICE_STATUS_OPTIONS}
                  minWidth={180}
                />
                <FilterSelect
                  label="Client"
                  value={invoiceClientFilter}
                  onChange={(val) => {
                    setInvoiceClientFilter(val);
                    setCurrentPage(1);
                  }}
                  options={CLIENT_OPTIONS}
                  minWidth={190}
                />
              </>
            )}

            {subTab === 'expenses' && (
              <>
                <FilterSelect
                  label="Category"
                  value={expenseCategoryFilter}
                  onChange={(val) => {
                    setExpenseCategoryFilter(val);
                    setCurrentPage(1);
                  }}
                  options={EXPENSE_CATEGORY_OPTIONS}
                  minWidth={200}
                />
                <FilterSelect
                  label="Recurrence"
                  value={expenseRecurringFilter}
                  onChange={(val) => {
                    setExpenseRecurringFilter(val);
                    setCurrentPage(1);
                  }}
                  options={EXPENSE_RECURRING_OPTIONS}
                  minWidth={180}
                />
              </>
            )}

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
                    layoutId="financialsViewModePill"
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
                title="Cards View"
              >
                {viewMode === 'cards' && (
                  <motion.div
                    layoutId="financialsViewModePill"
                    className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <LayoutGrid className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Cards</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab 1: Monthly PnL Summary */}
      {subTab === 'pnl' && (
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0d14]/90 shadow-sm backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Monthly Agency Profit &amp; Loss Breakdown
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Cumulative: <strong className="text-[#6324FC] dark:text-[#00E5FF]">${netProfit.toLocaleString()}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <tr>
                  <th className="py-3.5 pl-5 pr-3">Month</th>
                  <th className="px-3 py-3.5">Invoiced ($)</th>
                  <th className="px-3 py-3.5">Collected ($)</th>
                  <th className="px-3 py-3.5">Expenses ($)</th>
                  <th className="px-3 py-3.5">Net Profit ($)</th>
                  <th className="py-3.5 pl-3 pr-5 font-bold">Cumulative Net ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {pnlRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                        <PieChart className="h-10 w-10 text-slate-400 mb-2" />
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">No financial records found</h4>
                        <p className="text-xs text-slate-400 mt-1">Create invoices or record expenses to populate your agency PnL.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pnlRows.map((r) => (
                    <tr key={r.month} className="hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors">
                      <td className="py-3.5 pl-5 pr-3 font-bold text-slate-900 dark:text-white font-mono">{r.month}</td>
                      <td className="px-3 py-3.5 font-mono">${r.invoiced.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">${r.collected.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-mono text-rose-600 dark:text-rose-400">${r.expenses.toLocaleString()}</td>
                      <td className="px-3 py-3.5 font-bold font-mono">
                        <span className={r.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          ${r.net.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5 font-bold font-mono text-[#6324FC] dark:text-[#00E5FF]">
                        ${r.cumulative.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Invoices List (Table or Cards View) */}
      {subTab === 'invoices' && (
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div
              key="invoices-table-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0d14]/90 shadow-sm backdrop-blur-xl overflow-hidden"
            >
              {/* Table Mini Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {filteredAndSortedInvoices.length} Invoices Found
                  </span>
                  {hasActiveFilters && (
                    <span className="rounded-full bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] px-2 py-0.5 text-[11px] font-bold">
                      Filtered
                    </span>
                  )}
                  {filteredAndSortedInvoices.length > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Page <strong className="text-slate-900 dark:text-white font-mono">{safePage}</strong> of{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">{totalPages}</strong>
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  Total Value: ${filteredAndSortedInvoices.reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    <tr>
                      <th
                        onClick={() => {
                          if (invSortField === 'invoiceNumber') setInvSortOrder(invSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setInvSortField('invoiceNumber'); setInvSortOrder('asc'); }
                        }}
                        className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Invoice #</span>
                          {invSortField === 'invoiceNumber' ? (
                            invSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (invSortField === 'client') setInvSortOrder(invSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setInvSortField('client'); setInvSortOrder('asc'); }
                        }}
                        className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[170px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Client</span>
                          {invSortField === 'client' ? (
                            invSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (invSortField === 'issueDate') setInvSortOrder(invSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setInvSortField('issueDate'); setInvSortOrder('desc'); }
                        }}
                        className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Issue Date</span>
                          {invSortField === 'issueDate' ? (
                            invSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (invSortField === 'amount') setInvSortOrder(invSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setInvSortField('amount'); setInvSortOrder('desc'); }
                        }}
                        className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Amount ($)</span>
                          {invSortField === 'amount' ? (
                            invSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (invSortField === 'dueDate') setInvSortOrder(invSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setInvSortField('dueDate'); setInvSortOrder('asc'); }
                        }}
                        className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Due Date</span>
                          {invSortField === 'dueDate' ? (
                            invSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2.5 min-w-[110px]">Status</th>
                      <th className="sticky right-0 z-10 bg-slate-50/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right font-bold shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)] min-w-[140px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredAndSortedInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                            <Receipt className="h-10 w-10 text-slate-400 mb-2" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">No invoices found</h4>
                            <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search terms or filters.</p>
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
                      paginatedInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors">
                          <td className="py-2.5 pl-4 pr-3 font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            <div className="flex items-center space-x-2">
                              <Building className="h-3.5 w-3.5 text-[#6324FC] dark:text-[#00E5FF] shrink-0" />
                              <span className="truncate max-w-[160px]">{inv.client}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {formatDisplayDate(inv.issueDate)}
                          </td>
                          <td className="px-3 py-2.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                            ${inv.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {formatDisplayDate(inv.dueDate)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                inv.status === 'Paid'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : inv.status === 'Sent'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                                  : inv.status === 'Overdue'
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-500'
                                    : inv.status === 'Sent'
                                    ? 'bg-amber-500'
                                    : inv.status === 'Overdue'
                                    ? 'bg-rose-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span>{inv.status}</span>
                            </span>
                          </td>
                          <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end space-x-1.5">
                              {inv.status !== 'Paid' && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaid(inv)}
                                  className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 shadow-sm transition active:scale-95"
                                  title="Mark Paid"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Paid</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartEditInvoice(inv)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                                title="Edit Invoice"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoiceWithConfirm(inv)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Invoice"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredAndSortedInvoices.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Showing <span className="font-bold font-mono text-slate-900 dark:text-white">{startDisplay}</span>-
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{endIndex}</span> of{' '}
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{currentListLength}</span> invoices
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
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-1 px-1">
                      {pageNumbers.map((p, idx) =>
                        p === '...' ? (
                          <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-400">...</span>
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
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Invoices Cards View */
            <motion.div
              key="invoices-cards-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {paginatedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/90 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/10">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-400 block">{inv.invoiceNumber}</span>
                        <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                          {inv.client}
                        </h4>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          inv.status === 'Paid'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : inv.status === 'Sent'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                            : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="my-3.5 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400 font-medium">Invoice Total:</span>
                        <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                          ${inv.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/30 p-2.5 rounded-xl">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block">Issued</span>
                          <span>{formatDisplayDate(inv.issueDate)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block">Due Date</span>
                          <span>{formatDisplayDate(inv.dueDate)}</span>
                        </div>
                      </div>

                      {inv.note && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                          "{inv.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                    <div>
                      {inv.status !== 'Paid' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(inv)}
                          className="inline-flex items-center space-x-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 shadow-sm transition active:scale-95"
                        >
                          <Check size={12} />
                          <span>Mark Paid</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditInvoice(inv)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 hover:bg-[#6324FC]/20 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInvoiceWithConfirm(inv)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* 6. Tab 3: Expenses List (Table or Cards View) */}
      {subTab === 'expenses' && (
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div
              key="expenses-table-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0d14]/90 shadow-sm backdrop-blur-xl overflow-hidden"
            >
              {/* Table Mini Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {filteredAndSortedExpenses.length} OPEX Logs Found
                  </span>
                  {hasActiveFilters && (
                    <span className="rounded-full bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] px-2 py-0.5 text-[11px] font-bold">
                      Filtered
                    </span>
                  )}
                  {filteredAndSortedExpenses.length > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Page <strong className="text-slate-900 dark:text-white font-mono">{safePage}</strong> of{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">{totalPages}</strong>
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
                  Total Expenses: ${filteredAndSortedExpenses.reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    <tr>
                      <th
                        onClick={() => {
                          if (expSortField === 'date') setExpSortOrder(expSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setExpSortField('date'); setExpSortOrder('desc'); }
                        }}
                        className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[130px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Date</span>
                          {expSortField === 'date' ? (
                            expSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (expSortField === 'category') setExpSortOrder(expSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setExpSortField('category'); setExpSortOrder('asc'); }
                        }}
                        className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[180px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Category</span>
                          {expSortField === 'category' ? (
                            expSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (expSortField === 'vendor') setExpSortOrder(expSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setExpSortField('vendor'); setExpSortOrder('asc'); }
                        }}
                        className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[150px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Vendor</span>
                          {expSortField === 'vendor' ? (
                            expSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          if (expSortField === 'amount') setExpSortOrder(expSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setExpSortField('amount'); setExpSortOrder('desc'); }
                        }}
                        className="px-3 py-2.5 cursor-pointer hover:text-slate-900 dark:hover:text-white transition group min-w-[120px]"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>Amount ($)</span>
                          {expSortField === 'amount' ? (
                            expSortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#6324FC]" /> : <ArrowDown className="h-3.5 w-3.5 text-[#6324FC]" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition" />
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2.5 min-w-[140px]">Type</th>
                      <th className="px-3 py-2.5 min-w-[180px]">Note</th>
                      <th className="sticky right-0 z-10 bg-slate-50/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right font-bold shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)] min-w-[115px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredAndSortedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                            <CreditCard className="h-10 w-10 text-slate-400 mb-2" />
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">No expenses found</h4>
                            <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search terms or filters.</p>
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
                      paginatedExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/90 dark:hover:bg-white/[0.025] transition-colors">
                          <td className="py-2.5 pl-4 pr-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {formatDisplayDate(exp.date)}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {exp.category}
                          </td>
                          <td className="px-3 py-2.5 text-[#6324FC] dark:text-[#00E5FF] font-bold text-xs sm:text-sm">
                            {exp.vendor}
                          </td>
                          <td className="px-3 py-2.5 font-bold font-mono text-rose-600 dark:text-rose-400 text-sm sm:text-base">
                            ${exp.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                exp.isRecurring
                                  ? 'border-[#6324FC]/30 bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]'
                                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {exp.isRecurring && <Repeat size={10} />}
                              <span>{exp.isRecurring ? 'Recurring / Mo' : 'One-time'}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-400 truncate max-w-xs" title={exp.note}>
                            {exp.note || '—'}
                          </td>
                          <td className="sticky right-0 z-10 bg-white/95 dark:bg-[#0c0d14]/95 backdrop-blur-md py-2.5 pl-2.5 pr-4 text-right shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditExpense(exp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-[#6324FC]/10 transition"
                                title="Edit Expense"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpenseWithConfirm(exp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Expense"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredAndSortedExpenses.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Showing <span className="font-bold font-mono text-slate-900 dark:text-white">{startDisplay}</span>-
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{endIndex}</span> of{' '}
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{currentListLength}</span> expenses
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
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-1 px-1">
                      {pageNumbers.map((p, idx) =>
                        p === '...' ? (
                          <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-400">...</span>
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
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Expenses Cards View */
            <motion.div
              key="expenses-cards-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {paginatedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/90 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-black/5 dark:border-white/10">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">{exp.category}</span>
                        <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                          {exp.vendor}
                        </h4>
                      </div>
                      <span
                        className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          exp.isRecurring
                            ? 'border-[#6324FC]/30 bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]'
                            : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-400'
                        }`}
                      >
                        {exp.isRecurring && <Repeat size={10} />}
                        <span>{exp.isRecurring ? 'Monthly' : 'One-time'}</span>
                      </span>
                    </div>

                    <div className="my-3.5 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400 font-medium">Expense Amount:</span>
                        <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                          ${exp.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/30 p-2.5 rounded-xl">
                        <span className="text-[10px] uppercase text-slate-400 block">Logged Date</span>
                        <span>{formatDisplayDate(exp.date)}</span>
                      </div>

                      {exp.note && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                          "{exp.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEditExpense(exp)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 hover:bg-[#6324FC]/20 transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpenseWithConfirm(exp)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* 7. Luxury Add / Edit Invoice Modal */}
      <AnimatePresence>
        {showAddInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseInvoiceModal}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-5 sm:p-7 shadow-2xl backdrop-blur-2xl z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      {editingInvoice ? `Edit Invoice #${editingInvoice.invoiceNumber}` : 'Create Client Retainer Invoice'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Issue client monthly retainers and track collections.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseInvoiceModal}
                  className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleInvoiceSubmit} className="mt-5 space-y-4">
                {/* Client & Amount */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Client Company *
                      </label>
                      {clients.length > 0 ? (
                        <select
                          value={invClient}
                          onChange={(e) => setInvClient(e.target.value)}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                        >
                          {clients.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Comfort HVAC"
                          value={invClient}
                          onChange={(e) => setInvClient(e.target.value)}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Invoice Amount ($) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          min="1"
                          step="50"
                          required
                          value={invAmount}
                          onChange={(e) => setInvAmount(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-8 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono font-bold outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Amount Chips */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">
                      Quick Amount Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setInvAmount(amt)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold transition-all ${
                            invAmount === amt
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                              : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                          }`}
                        >
                          ${amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Issue Date *
                      </label>
                      <DatePicker
                        value={invIssueDate}
                        onChange={setInvIssueDate}
                        color="#10B981"
                        placeholder="Select Date"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Due Date *
                      </label>
                      <DatePicker
                        value={invDueDate}
                        onChange={setInvDueDate}
                        color="#10B981"
                        placeholder="Select Date"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Status *
                      </label>
                      <select
                        value={invStatus}
                        onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        <option value="Sent">Sent (Awaiting Payment)</option>
                        <option value="Paid">Paid (Cash Collected)</option>
                        <option value="Draft">Draft</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-2">
                  <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">
                    Invoice Notes / Transaction Ref (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe invoice #ch_3Mx..., Wire transfer ref"
                    value={invNote}
                    onChange={(e) => setInvNote(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {editingInvoice && (
                      <button
                        type="button"
                        onClick={() => handleDeleteInvoiceWithConfirm(editingInvoice)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={handleCloseInvoiceModal}
                      className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl text-xs font-heading font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 shadow-md shadow-emerald-500/20 transition disabled:opacity-50 active:scale-95"
                    >
                      {submitting ? 'Saving...' : editingInvoice ? 'Update Invoice' : 'Generate Invoice'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Luxury Add / Edit Expense Modal */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseExpenseModal}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-5 sm:p-7 shadow-2xl backdrop-blur-2xl z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white">
                      {editingExpense ? 'Edit Operating Expense' : 'Log Operating Expense'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Track cold email infrastructure, tools, and subscription costs.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseExpenseModal}
                  className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="mt-5 space-y-4">
                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
                    Quick Vendor Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {EXPENSE_PRESETS.map((pst) => (
                      <button
                        key={pst.vendor}
                        type="button"
                        onClick={() => {
                          setExpVendor(pst.vendor);
                          setExpCategory(pst.category);
                          setExpAmount(pst.amount);
                          setExpRecurring(pst.isRecurring);
                        }}
                        className="rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 transition"
                      >
                        + {pst.vendor} (${pst.amount})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category & Vendor */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Category *
                      </label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors font-medium"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Vendor Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Namecheap, Instantly, Clay"
                        value={expVendor}
                        onChange={(e) => setExpVendor(e.target.value)}
                        className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount, Date & Recurrence */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Amount ($) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={expAmount}
                          onChange={(e) => setExpAmount(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-8 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white font-mono font-bold outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        Date *
                      </label>
                      <DatePicker
                        value={expDate}
                        onChange={setExpDate}
                        color="#E11D48"
                        placeholder="Select Date"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="recurringCheck"
                      checked={expRecurring}
                      onChange={(e) => setExpRecurring(e.target.checked)}
                      className="rounded border-slate-300 text-[#6324FC] h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="recurringCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Monthly recurring subscription expense
                    </label>
                  </div>
                </div>

                {/* Note */}
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#11131a]/60 p-4 space-y-2">
                  <label className="block text-[11px] font-heading font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">
                    Note / Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 .com domains + Google Workspace mailboxes"
                    value={expNote}
                    onChange={(e) => setExpNote(e.target.value)}
                    className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                  />
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    {editingExpense && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExpenseWithConfirm(editingExpense)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={handleCloseExpenseModal}
                      className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl text-xs font-heading font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
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
