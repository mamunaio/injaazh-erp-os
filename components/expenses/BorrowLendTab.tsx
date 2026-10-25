'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, CheckCircle2, Trash2, X, Search, Clock, 
  ArrowUpRight, ArrowDownRight, Loader2, DollarSign, 
  Edit3, History, Phone, CreditCard, ChevronRight, 
  AlertTriangle, Check, Sparkles, Filter, Calendar
} from 'lucide-react';
import { 
  createPersonalLoan, 
  updatePersonalLoan, 
  deletePersonalLoan, 
  toggleLoanStatus,
  recordLoanRepayment,
  deleteLoanRepayment
} from '@/app/actions/loanActions';
import toast from 'react-hot-toast';
import { format, isPast, isToday } from 'date-fns';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from '@/components/ui/DatePicker';
import { useScrollLock } from '@/lib/useScrollLock';

export interface ILoanPaymentItem {
  _id?: string;
  amount: number;
  date: string | Date;
  paymentMethod?: string;
  note?: string;
  createdAt?: string | Date;
}

export interface ILoanItem {
  _id: string;
  type: 'Lent' | 'Borrowed';
  personName: string;
  phone?: string;
  amount: number;
  paidAmount: number;
  remainingAmount?: number;
  date: string | Date;
  expectedReturnDate?: string | Date;
  status: 'Pending' | 'Partial' | 'Settled';
  description?: string;
  payments?: ILoanPaymentItem[];
}

export default function BorrowLendTab({ initialLoans }: { initialLoans: any[] }) {
  const { confirm } = useConfirm();
  const [loans, setLoans] = useState<ILoanItem[]>(initialLoans || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Lent' | 'Borrowed' | 'Unsettled' | 'Settled'>('All');
  
  // Modals state
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<ILoanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Partial Payment Modal state
  const [paymentModalLoan, setPaymentModalLoan] = useState<ILoanItem | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    note: ''
  });
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // History Drawer state
  const [historyDrawerLoan, setHistoryDrawerLoan] = useState<ILoanItem | null>(null);
  const [isDeletingPaymentId, setIsDeletingPaymentId] = useState<string | null>(null);

  useScrollLock(isSlidePanelOpen || !!paymentModalLoan || !!historyDrawerLoan);

  // Main Form State
  const [formData, setFormData] = useState({
    type: 'Lent' as 'Lent' | 'Borrowed',
    personName: '',
    phone: '',
    amount: '',
    paidAmount: '',
    date: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    description: '',
    status: 'Pending' as 'Pending' | 'Partial' | 'Settled',
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount || 0);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    let result = [...loans];

    // Status / Type filter
    if (statusFilter === 'Lent') {
      result = result.filter(l => l.type === 'Lent');
    } else if (statusFilter === 'Borrowed') {
      result = result.filter(l => l.type === 'Borrowed');
    } else if (statusFilter === 'Unsettled') {
      result = result.filter(l => l.status !== 'Settled');
    } else if (statusFilter === 'Settled') {
      result = result.filter(l => l.status === 'Settled');
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.personName.toLowerCase().includes(lower) || 
        l.phone?.toLowerCase().includes(lower) ||
        l.description?.toLowerCase().includes(lower)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [loans, searchQuery, statusFilter]);

  // Executive Telemetry Computations
  const telemetry = useMemo(() => {
    let totalLentOriginal = 0;
    let totalLentPaid = 0;
    let totalBorrowedOriginal = 0;
    let totalBorrowedPaid = 0;

    loans.forEach(l => {
      const paid = typeof l.paidAmount === 'number' ? l.paidAmount : (l.status === 'Settled' ? l.amount : 0);
      if (l.type === 'Lent') {
        totalLentOriginal += l.amount;
        totalLentPaid += Math.min(paid, l.amount);
      } else {
        totalBorrowedOriginal += l.amount;
        totalBorrowedPaid += Math.min(paid, l.amount);
      }
    });

    const remainingReceivable = Math.max(0, totalLentOriginal - totalLentPaid);
    const remainingPayable = Math.max(0, totalBorrowedOriginal - totalBorrowedPaid);
    const netPosition = remainingReceivable - remainingPayable;

    return {
      totalLentOriginal,
      totalLentPaid,
      remainingReceivable,
      totalBorrowedOriginal,
      totalBorrowedPaid,
      remainingPayable,
      netPosition
    };
  }, [loans]);

  // Handlers for Add / Edit Loan
  const openAddPanel = () => {
    setFormData({
      type: 'Lent',
      personName: '',
      phone: '',
      amount: '',
      paidAmount: '',
      date: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      description: '',
      status: 'Pending',
    });
    setEditingLoan(null);
    setIsSlidePanelOpen(true);
  };

  const openEditPanel = (l: ILoanItem) => {
    setFormData({
      type: l.type,
      personName: l.personName,
      phone: l.phone || '',
      amount: l.amount.toString(),
      paidAmount: (l.paidAmount || 0).toString(),
      date: new Date(l.date).toISOString().split('T')[0],
      expectedReturnDate: l.expectedReturnDate ? new Date(l.expectedReturnDate).toISOString().split('T')[0] : '',
      description: l.description || '',
      status: l.status || 'Pending',
    });
    setEditingLoan(l);
    setIsSlidePanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName || !formData.amount || !formData.date) {
      toast.error('Please fill required fields'); return;
    }
    setIsSubmitting(true);
    const amountVal = parseFloat(formData.amount) || 0;
    const paidVal = parseFloat(formData.paidAmount) || 0;

    const data = {
      type: formData.type,
      personName: formData.personName,
      phone: formData.phone.trim() || undefined,
      amount: amountVal,
      paidAmount: paidVal,
      date: formData.date,
      expectedReturnDate: formData.expectedReturnDate || undefined,
      description: formData.description,
      status: formData.status,
    };

    if (editingLoan) {
      const res = await updatePersonalLoan(editingLoan._id, data);
      if (res.success) {
        toast.success('Record updated successfully');
        setLoans(loans.map(l => l._id === editingLoan._id ? { ...l, ...res.data } : l));
        setIsSlidePanelOpen(false);
      } else {
        toast.error(res.error || 'Failed to update');
      }
    } else {
      const res = await createPersonalLoan(data);
      if (res.success) {
        toast.success('Debt/Loan record created successfully');
        setLoans([res.data, ...loans]);
        setIsSlidePanelOpen(false);
      } else {
        toast.error(res.error || 'Failed to create');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ 
      title: 'Delete Debt/Loan Record',
      message: 'Are you sure you want to permanently delete this loan record and all associated payment logs? This cannot be undone.', 
      variant: 'danger',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;

    const res = await deletePersonalLoan(id);
    if (res.success) {
      toast.success('Record removed');
      setLoans(loans.filter(l => l._id !== id));
      if (historyDrawerLoan?._id === id) setHistoryDrawerLoan(null);
    } else {
      toast.error('Failed to delete');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const res = await toggleLoanStatus(id, currentStatus);
    if (res.success) {
      const newStatus = res.data.status;
      toast.success(newStatus === 'Settled' ? '🎉 Marked as 100% Paid / Settled!' : 'Marked as Pending');
      setLoans(loans.map(l => l._id === id ? { ...l, ...res.data } : l));
    } else {
      toast.error('Failed to update status');
    }
  };

  // Handlers for Partial Payments
  const openPaymentModal = (loan: ILoanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const remaining = Math.max(0, loan.amount - (loan.paidAmount || 0));
    setPaymentModalLoan(loan);
    setPaymentForm({
      amount: remaining > 0 ? remaining.toString() : '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      note: ''
    });
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalLoan) return;

    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setIsRecordingPayment(true);
    const res = await recordLoanRepayment(paymentModalLoan._id, {
      amount: amt,
      date: paymentForm.date,
      paymentMethod: paymentForm.paymentMethod,
      note: paymentForm.note
    });

    if (res.success && res.data) {
      toast.success(`৳${amt.toLocaleString()} payment recorded!`);
      setLoans(loans.map(l => l._id === paymentModalLoan._id ? { ...l, ...res.data } : l));
      if (historyDrawerLoan?._id === paymentModalLoan._id) {
        setHistoryDrawerLoan(res.data);
      }
      setPaymentModalLoan(null);
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
    setIsRecordingPayment(false);
  };

  const handleDeletePaymentEntry = async (paymentId: string) => {
    if (!historyDrawerLoan) return;
    setIsDeletingPaymentId(paymentId);
    const res = await deleteLoanRepayment(historyDrawerLoan._id, paymentId);
    if (res.success && res.data) {
      toast.success('Installment payment removed');
      setHistoryDrawerLoan(res.data);
      setLoans(loans.map(l => l._id === historyDrawerLoan._id ? { ...l, ...res.data } : l));
    } else {
      toast.error('Failed to remove installment');
    }
    setIsDeletingPaymentId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* ⚡ EXECUTIVE TELEMETRY CARDS (DASHBOARD GLASS-CARD SYSTEM) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Receivable (পাওনা) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Lent' ? 'All' : 'Lent')}
          className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
        >
          {/* Radial Hover Spotlight */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          {/* Top Accent Neon Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-emerald-400 transition-all duration-300 shadow-sm">
              <ArrowUpRight size={21} />
            </div>
            <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
              Receivable (পাওনা)
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Remaining Receivable</p>
            <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-emerald-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-emerald-400 transition-all">
              {formatCurrency(telemetry.remainingReceivable)}
            </p>
            <div className="flex items-center gap-2 text-xs font-sans text-secondary/80 mt-1.5 truncate">
              <span>Lent: {formatCurrency(telemetry.totalLentOriginal)}</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">Collected: {formatCurrency(telemetry.totalLentPaid)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Payable (দেনা) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Borrowed' ? 'All' : 'Borrowed')}
          className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-rose-500/60 hover:shadow-[0_16px_36px_rgba(244,63,94,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
        >
          {/* Radial Hover Spotlight */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-rose-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          {/* Top Accent Neon Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F43F5E]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] group-hover:border-rose-400 transition-all duration-300 shadow-sm">
              <ArrowDownRight size={21} />
            </div>
            <span className="text-xs font-heading font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 group-hover:border-rose-500/40 transition-colors">
              Payable Debt (দেনা)
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Remaining Debt to Pay</p>
            <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-rose-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-rose-400 transition-all">
              {formatCurrency(telemetry.remainingPayable)}
            </p>
            <div className="flex items-center gap-2 text-xs font-sans text-secondary/80 mt-1.5 truncate">
              <span>Borrowed: {formatCurrency(telemetry.totalBorrowedOriginal)}</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">Repaid: {formatCurrency(telemetry.totalBorrowedPaid)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Net Position */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Unsettled' ? 'All' : 'Unsettled')}
          className={`group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 ${
            telemetry.netPosition >= 0 
              ? 'hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)]' 
              : 'hover:border-rose-500/60 hover:shadow-[0_16px_36px_rgba(244,63,94,0.22)]'
          } dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)]`}
        >
          {/* Radial Hover Spotlight */}
          <div className={`absolute -top-10 -right-10 w-36 h-36 ${telemetry.netPosition >= 0 ? 'bg-[#00E5FF]/20' : 'bg-rose-500/20'} blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
          {/* Top Accent Neon Line */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent ${telemetry.netPosition >= 0 ? 'via-[#00E5FF] shadow-[0_0_10px_#00E5FF]' : 'via-rose-500 shadow-[0_0_10px_#F43F5E]'} to-transparent transition-all duration-500 opacity-90`} />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`w-11 h-11 rounded-2xl ${telemetry.netPosition >= 0 ? 'bg-[#00E5FF]/15 border-[#00E5FF]/30 text-[#00E5FF] group-hover:border-[#00E5FF] group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)]' : 'bg-rose-500/15 border-rose-500/30 text-rose-500 group-hover:border-rose-400 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.6)]'} border flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm`}>
              <DollarSign size={21} />
            </div>
            <span className={`text-xs font-heading font-bold ${telemetry.netPosition >= 0 ? 'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/20 group-hover:border-[#00E5FF]/40' : 'text-rose-500 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40'} px-2.5 py-1 rounded-lg border transition-colors`}>
              {telemetry.netPosition >= 0 ? 'Net Surplus (উদ্বৃত্ত)' : 'Net Deficit (ঘাটতি)'}
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Net Balance</p>
            <p className={`text-2xl lg:text-3xl font-heading font-extrabold font-mono tracking-tight mt-0.5 transition-all ${telemetry.netPosition > 0 ? 'text-emerald-500 group-hover:text-emerald-400' : telemetry.netPosition < 0 ? 'text-rose-500 group-hover:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {telemetry.netPosition > 0 ? '+' : ''}{formatCurrency(telemetry.netPosition)}
            </p>
            <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
              {telemetry.netPosition >= 0 ? 'পাওনার পরিমাণ দেনার চেয়ে বেশি' : 'দেনার পরিমাণ পাওনার চেয়ে বেশি'}
            </p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ⚡ CONTROLS & FILTER BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-3 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 md:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
          <input 
            type="text" 
            placeholder="Search person, phone, note..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'All', label: 'All Records' },
            { id: 'Lent', label: 'Lent (পাওনা)' },
            { id: 'Borrowed', label: 'Borrowed (দেনা)' },
            { id: 'Unsettled', label: 'Due / Unpaid' },
            { id: 'Settled', label: 'Settled (পরিশোধিত)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#6324FC] text-white shadow-xs'
                  : 'text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add Record Button */}
        <button 
          onClick={openAddPanel} 
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] shrink-0 whitespace-nowrap"
        >
          <Plus size={15} strokeWidth={2.5} /> Add Debt / Loan
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ REAL-WORLD DEBT & REPAYMENT TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#060608]">
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Date</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Person & Details</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Type</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right">Original Amount</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Paid / Repaid</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right">Remaining Due</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Status</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto mb-3 text-secondary">
                      <CreditCard size={20} />
                    </div>
                    <p className="text-xs font-heading font-bold text-slate-900 dark:text-white">No debt or loan records found</p>
                    <p className="text-[11px] text-secondary mt-0.5">Try adjusting your search or add a new record.</p>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((l) => {
                  const paid = l.paidAmount || 0;
                  const remaining = Math.max(0, l.amount - paid);
                  const progressPct = l.amount > 0 ? Math.min(100, Math.round((paid / l.amount) * 100)) : 0;
                  const isSettled = l.status === 'Settled' || remaining === 0;
                  const isPartial = l.status === 'Partial' || (paid > 0 && remaining > 0);
                  
                  // Overdue check
                  const returnDate = l.expectedReturnDate ? new Date(l.expectedReturnDate) : null;
                  const isOverdue = returnDate && !isSettled && isPast(returnDate) && !isToday(returnDate);

                  return (
                    <tr 
                      key={l._id} 
                      className={`hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group ${isSettled ? 'opacity-70 bg-slate-50/40 dark:bg-white/[0.01]' : ''}`}
                    >
                      {/* Date */}
                      <td className="px-5 py-3.5 text-xs font-medium text-secondary whitespace-nowrap">
                        {format(new Date(l.date), 'MMM dd, yyyy')}
                      </td>

                      {/* Person & Details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-slate-900 dark:text-white text-xs">{l.personName}</span>
                          {l.phone && (
                            <a 
                              href={`tel:${l.phone}`} 
                              title={`Call ${l.phone}`}
                              className="text-[10px] font-mono text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center gap-0.5"
                            >
                              <Phone size={10} /> {l.phone}
                            </a>
                          )}
                        </div>
                        {l.description && (
                          <p className="text-[10px] text-secondary mt-0.5 line-clamp-1">{l.description}</p>
                        )}
                        {/* Expected Return Date Tag */}
                        {returnDate && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center gap-1 ${
                              isOverdue 
                                ? 'bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20' 
                                : isSettled 
                                ? 'text-secondary opacity-60' 
                                : 'bg-slate-100 dark:bg-white/5 text-secondary'
                            }`}>
                              <Calendar size={10} />
                              <span>Due: {format(returnDate, 'MMM dd, yyyy')}</span>
                              {isOverdue && <span className="font-bold underline ml-0.5">Overdue!</span>}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider ${
                          l.type === 'Lent' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {l.type === 'Lent' ? (
                            <><ArrowUpRight size={12} /> Lent (পাওনা)</>
                          ) : (
                            <><ArrowDownRight size={12} /> Borrowed (দেনা)</>
                          )}
                        </span>
                      </td>

                      {/* Original Amount */}
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(l.amount)}
                      </td>

                      {/* Paid / Progress */}
                      <td className="px-5 py-3.5 min-w-[150px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paid)}</span>
                          <span className="text-[10px] text-secondary font-bold">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSettled ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/20'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {l.payments && l.payments.length > 0 && (
                          <button
                            onClick={() => setHistoryDrawerLoan(l)}
                            className="text-[10px] text-[#6324FC] dark:text-[#00E5FF] hover:underline mt-1 flex items-center gap-1 font-medium"
                          >
                            <History size={10} />
                            <span>{l.payments.length} installment{l.payments.length > 1 ? 's' : ''} logged</span>
                          </button>
                        )}
                      </td>

                      {/* Remaining Due */}
                      <td className="px-5 py-3.5 text-right font-mono font-bold whitespace-nowrap">
                        <span className={remaining > 0 ? (l.type === 'Lent' ? 'text-emerald-500 font-extrabold' : 'text-rose-500 font-extrabold') : 'text-secondary line-through'}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>

                      {/* Status Button */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(l._id, l.status)}
                          title="Click to toggle Full Settlement status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-heading font-bold transition-all border shadow-xs cursor-pointer ${
                            isSettled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : isPartial
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {isSettled ? (
                            <><CheckCircle2 size={12} className="text-emerald-500" /> <span>Settled (পরিশোধিত)</span></>
                          ) : isPartial ? (
                            <><Clock size={12} className="text-amber-500" /> <span>Partial ({progressPct}%)</span></>
                          ) : (
                            <><Clock size={12} className="text-rose-500" /> <span>Unpaid (বকেয়া)</span></>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Repayment Button */}
                          {!isSettled && (
                            <button
                              onClick={(e) => openPaymentModal(l, e)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-heading font-bold bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] hover:bg-[#6324FC]/20 transition-all flex items-center gap-1 shadow-xs"
                              title={l.type === 'Lent' ? 'Record received installment' : 'Record repayment payment'}
                            >
                              <Plus size={11} strokeWidth={3} />
                              <span>{l.type === 'Lent' ? 'Collect' : 'Repay'}</span>
                            </button>
                          )}

                          {/* History Icon */}
                          <button
                            onClick={() => setHistoryDrawerLoan(l)}
                            className="p-1.5 rounded-lg text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-colors"
                            title="View Installment History"
                          >
                            <History size={13} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditPanel(l)}
                            className="p-1.5 rounded-lg text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-colors"
                            title="Edit Record"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(l._id)}
                            className="p-1.5 rounded-lg text-secondary hover:text-rose-500 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-rose-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
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

      {/* ========================================================================= */}
      {/* ⚡ PARTIAL PAYMENT / INSTALLMENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {paymentModalLoan && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl" 
              onClick={() => setPaymentModalLoan(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              transition={{ type: 'spring', damping: 28, stiffness: 320 }} 
              className="relative w-full max-w-md my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 shadow-2xl rounded-3xl overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${paymentModalLoan.type === 'Lent' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {paymentModalLoan.type === 'Lent' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white">
                      {paymentModalLoan.type === 'Lent' ? 'Record Collected Amount' : 'Record Repayment'}
                    </h3>
                    <p className="text-[10px] text-secondary font-mono">Person: {paymentModalLoan.personName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPaymentModalLoan(null)} 
                  className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Balance Summary Box */}
              <div className="p-5 pb-0">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-secondary font-medium">Original Amount:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(paymentModalLoan.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-secondary font-medium">Already Paid:</span>
                    <span className="font-mono font-bold text-emerald-500">{formatCurrency(paymentModalLoan.paidAmount || 0)}</span>
                  </div>
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-xs">
                    <span className="font-heading font-bold text-secondary uppercase tracking-wider text-[10px]">Remaining Due:</span>
                    <span className="font-mono font-extrabold text-rose-500 text-sm">
                      {formatCurrency(Math.max(0, paymentModalLoan.amount - (paymentModalLoan.paidAmount || 0)))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                      Installment Amount (৳)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rem = Math.max(0, paymentModalLoan.amount - (paymentModalLoan.paidAmount || 0));
                        setPaymentForm({ ...paymentForm, amount: rem.toString() });
                      }}
                      className="text-[10px] font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline"
                    >
                      Fill Full Remaining
                    </button>
                  </div>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1"
                    max={Math.max(0, paymentModalLoan.amount - (paymentModalLoan.paidAmount || 0))}
                    value={paymentForm.amount} 
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors" 
                    placeholder="0.00" 
                    required 
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Payment Date</label>
                    <DatePicker 
                      value={typeof paymentForm.date === 'string' ? paymentForm.date : format(new Date(paymentForm.date), 'yyyy-MM-dd')}
                      onChange={(val) => setPaymentForm({ ...paymentForm, date: val || format(new Date(), 'yyyy-MM-dd') })}
                      color="#10B981"
                      placeholder="Select Date"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Payment Method</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-heading font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] cursor-pointer"
                    >
                      {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Credit Card', 'Other'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Note / TrxID (Optional)</label>
                  <input 
                    type="text" 
                    value={paymentForm.note} 
                    onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" 
                    placeholder="e.g. Received via bKash or 1st installment" 
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPaymentModalLoan(null)} 
                    className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isRecordingPayment || !paymentForm.amount} 
                    className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50"
                  >
                    {isRecordingPayment ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Confirm Repayment</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ⚡ INSTALLMENT HISTORY DRAWER / MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {historyDrawerLoan && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl" 
              onClick={() => setHistoryDrawerLoan(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              transition={{ type: 'spring', damping: 28, stiffness: 320 }} 
              className="relative w-full max-w-lg my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 shadow-2xl rounded-3xl overflow-hidden flex flex-col z-10 max-h-[85vh]"
            >
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white">
                      Installment Payment Logs
                    </h3>
                    <p className="text-[10px] text-secondary font-mono">
                      {historyDrawerLoan.personName} ({historyDrawerLoan.type === 'Lent' ? 'পাওনা' : 'দেনা'})
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setHistoryDrawerLoan(null)} 
                  className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Progress Summary */}
              <div className="p-5 pb-3 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-[#060608]/50">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs text-secondary font-medium">Repayment Progress:</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(historyDrawerLoan.paidAmount || 0)} / {formatCurrency(historyDrawerLoan.amount)}
                  </span>
                </div>
                <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${historyDrawerLoan.amount > 0 ? Math.min(100, Math.round(((historyDrawerLoan.paidAmount || 0) / historyDrawerLoan.amount) * 100)) : 0}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-secondary mt-1.5">
                  <span>Remaining: <strong className="text-rose-500">{formatCurrency(Math.max(0, historyDrawerLoan.amount - (historyDrawerLoan.paidAmount || 0)))}</strong></span>
                  <span>{historyDrawerLoan.payments?.length || 0} installments</span>
                </div>
              </div>

              {/* Installments List */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-2.5">
                {!historyDrawerLoan.payments || historyDrawerLoan.payments.length === 0 ? (
                  <div className="py-8 text-center text-secondary text-xs">
                    No installments recorded yet. Click &quot;Record Payment&quot; to log a payment.
                  </div>
                ) : (
                  historyDrawerLoan.payments.map((p, idx) => (
                    <div 
                      key={p._id || idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 group hover:border-[#6324FC]/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(p.amount)}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold">
                            {p.paymentMethod || 'Cash'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-secondary mt-0.5 font-mono">
                          <span>{format(new Date(p.date), 'MMM dd, yyyy')}</span>
                          {p.note && <span>• &quot;{p.note}&quot;</span>}
                        </div>
                      </div>

                      {p._id && (
                        <button
                          onClick={() => handleDeletePaymentEntry(p._id!)}
                          disabled={isDeletingPaymentId === p._id}
                          className="p-1.5 text-secondary hover:text-rose-500 opacity-60 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-500/10"
                          title="Delete this installment"
                        >
                          {isDeletingPaymentId === p._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-[#060608]/50 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setHistoryDrawerLoan(null)}
                  className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white"
                >
                  Close
                </button>
                {Math.max(0, historyDrawerLoan.amount - (historyDrawerLoan.paidAmount || 0)) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const l = historyDrawerLoan;
                      setHistoryDrawerLoan(null);
                      openPaymentModal(l);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Record New Payment</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ⚡ ADD / EDIT DEBT OR LOAN MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSlidePanelOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl" onClick={() => setIsSlidePanelOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }} className="relative w-full max-w-lg my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col z-10">
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
                <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">{editingLoan ? 'Edit Debt / Loan Record' : 'Add Debt / Loan Record'}</h3>
                <button onClick={() => setIsSlidePanelOpen(false)} className="p-2 text-secondary hover:text-rose-500 dark:hover:text-rose-400 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors"><X size={15} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <form id="loan-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setFormData({...formData, type: 'Lent'})} className={`px-3 py-2.5 rounded-xl border text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all ${formData.type === 'Lent' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary'}`}>
                        <ArrowUpRight size={14} /> I Lent (ধার দিয়েছি / পাওনা)
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'Borrowed'})} className={`px-3 py-2.5 rounded-xl border text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all ${formData.type === 'Borrowed' ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-xs' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary'}`}>
                        <ArrowDownRight size={14} /> I Borrowed (ধার নিয়েছি / দেনা)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Person Name *</label>
                      <input type="text" value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="e.g. Imtiaz Bhai" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Phone Number (Optional)</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="e.g. 017xxxxxxxx" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Total Amount (৳) *</label>
                      <input type="number" step="0.01" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="50000" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Already Paid / Repaid (৳)</label>
                      <input type="number" step="0.01" min="0" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Date *</label>
                      <DatePicker 
                        value={typeof formData.date === 'string' ? formData.date : (formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : '')}
                        onChange={(val) => setFormData({ ...formData, date: val || format(new Date(), 'yyyy-MM-dd') })}
                        color="#6324FC"
                        placeholder="Select Date"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Expected Return Date</label>
                      <DatePicker 
                        value={typeof formData.expectedReturnDate === 'string' ? formData.expectedReturnDate : (formData.expectedReturnDate ? format(new Date(formData.expectedReturnDate), 'yyyy-MM-dd') : '')}
                        onChange={(val) => setFormData({ ...formData, expectedReturnDate: val })}
                        color="#F59E0B"
                        placeholder="Expected Return Date"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Description / Note</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors resize-none placeholder:text-secondary" placeholder="Reason, terms or repayment note..."></textarea>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsSlidePanelOpen(false)} className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" form="loan-form" disabled={isSubmitting} className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white shadow-[0_0_15px_rgba(99,36,252,0.4)] transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {editingLoan ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
