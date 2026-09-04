'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Trash2, X, Search, Clock, ArrowUpRight, ArrowDownRight, Loader2, DollarSign, Edit3 } from 'lucide-react';
import { createPersonalLoan, updatePersonalLoan, deletePersonalLoan, toggleLoanStatus } from '@/app/actions/loanActions';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function BorrowLendTab({ initialLoans }: { initialLoans: any[] }) {
  const { confirm } = useConfirm();
  const [loans, setLoans] = useState<any[]>(initialLoans || []);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Lent' as 'Lent' | 'Borrowed',
    personName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    description: '',
    status: 'Pending' as 'Pending' | 'Settled',
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);

  const filteredLoans = useMemo(() => {
    let result = [...loans];
    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.personName.toLowerCase().includes(lower) || 
        l.description?.toLowerCase().includes(lower)
      );
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [loans, searchQuery]);

  const totalBorrowed = useMemo(() => loans.filter(l => l.type === 'Borrowed' && l.status === 'Pending').reduce((acc, l) => acc + l.amount, 0), [loans]);
  const totalLent = useMemo(() => loans.filter(l => l.type === 'Lent' && l.status === 'Pending').reduce((acc, l) => acc + l.amount, 0), [loans]);
  const netBalance = totalLent - totalBorrowed;

  const openAddPanel = () => {
    setFormData({
      type: 'Lent',
      personName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      description: '',
      status: 'Pending',
    });
    setEditingLoan(null);
    setIsSlidePanelOpen(true);
  };

  const openEditPanel = (l: any) => {
    setFormData({
      type: l.type,
      personName: l.personName,
      amount: l.amount.toString(),
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
    const data = {
      type: formData.type,
      personName: formData.personName,
      amount: parseFloat(formData.amount) || 0,
      date: formData.date,
      expectedReturnDate: formData.expectedReturnDate || undefined,
      description: formData.description,
      status: formData.status,
    };

    if (editingLoan) {
      const res = await updatePersonalLoan(editingLoan._id, data);
      if (res.success) {
        toast.success('Record updated successfully');
        setLoans(loans.map(l => l._id === editingLoan._id ? res.data : l));
        setIsSlidePanelOpen(false);
      } else toast.error('Failed to update');
    } else {
      const res = await createPersonalLoan(data);
      if (res.success) {
        toast.success('Record created successfully');
        setLoans([res.data, ...loans]);
        setIsSlidePanelOpen(false);
      } else toast.error('Failed to create');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: 'Delete this debt/loan record permanently?', danger: true });
    if (!isConfirmed) return;
    const res = await deletePersonalLoan(id);
    if (res.success) {
      toast.success('Deleted');
      setLoans(loans.filter(l => l._id !== id));
    } else toast.error('Failed to delete');
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const res = await toggleLoanStatus(id, currentStatus);
    if (res.success) {
      const newStatus = res.data.status;
      toast.success(newStatus === 'Settled' ? '🎉 Marked as Paid / Settled!' : 'Marked as Pending');
      setLoans(loans.map(l => l._id === id ? res.data : l));
    } else toast.error('Failed to update status');
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] p-6 relative overflow-hidden group shadow-sm dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Total Lent (Owed to you)</p>
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]"><ArrowUpRight size={16} /></div>
          </div>
          <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalLent)}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1 font-bold">Unsettled receivable amount</p>
        </div>
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] p-6 relative overflow-hidden group shadow-sm dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Total Borrowed (You owe)</p>
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]"><ArrowDownRight size={16} /></div>
          </div>
          <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalBorrowed)}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1 font-bold">Outstanding debt to pay</p>
        </div>
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] p-6 relative overflow-hidden group shadow-sm dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Net Debt Balance</p>
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]"><DollarSign size={16} /></div>
          </div>
          <p className={`text-3xl font-bold font-mono tracking-tight ${netBalance > 0 ? 'text-[#10B981]' : netBalance < 0 ? 'text-[#EF4444]' : 'text-slate-900 dark:text-white'}`}>
            {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance)}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-1 font-bold">{netBalance >= 0 ? 'Positive net receivables' : 'Net payable liability'}</p>
        </div>
      </div>

      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[20px] p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search person or note..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-900 dark:text-white text-xs font-medium rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
          />
        </div>
        <button onClick={openAddPanel} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] border border-[#2563EB]/80">
          <Plus size={16} strokeWidth={2.5} /> Add Debt / Loan Record
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[20px] overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#09090B]">
              <tr className="border-b border-[#E2E8F0] dark:border-[#1a1a1a]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Person / Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Expected Return</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Status (Click to toggle)</th>
                <th className="px-6 py-4 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a1a1a]">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#94A3B8]">No debt or loan records found.</td>
                </tr>
              ) : (
                filteredLoans.map((l) => (
                  <tr key={l._id} className={`hover:bg-slate-50 dark:hover:bg-[#141414] transition-colors group ${l.status === 'Settled' ? 'opacity-60 bg-slate-50/50 dark:bg-white/[0.02]' : ''}`}>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">{format(new Date(l.date), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{l.personName}</span>
                        {l.status === 'Settled' && (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Paid</span>
                        )}
                      </div>
                      {l.description && <p className="text-[10px] font-normal text-[#94A3B8] mt-0.5">{l.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${l.type === 'Lent' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
                        {l.type === 'Lent' ? 'Lent (পাওনা)' : 'Borrowed (দেনা)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      <span className={l.status === 'Settled' ? 'line-through text-slate-400' : ''}>
                        {formatCurrency(l.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
                      {l.expectedReturnDate ? format(new Date(l.expectedReturnDate), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(l._id, l.status)}
                        title={l.status === 'Pending' ? "Click to mark as Paid / Settled" : "Click to mark as Pending (Unsettled)"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                          l.status === 'Settled' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/30 hover:bg-amber-500/20 hover:scale-105'
                        }`}
                      >
                        {l.status === 'Settled' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-amber-500" />}
                        <span>{l.status === 'Settled' ? 'Paid / Settled' : 'Pending'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditPanel(l)} className="p-1.5 text-[#94A3B8] hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] rounded-md transition-colors" title="Edit"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(l._id)} className="p-1.5 text-[#94A3B8] hover:text-red-500 bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] hover:bg-red-50 dark:hover:bg-[#1a1a1a] rounded-md transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Centered Modal Form */}
      <AnimatePresence>
        {isSlidePanelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSlidePanelOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-[500px] bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-[#1a1a1a] flex items-center justify-between bg-white dark:bg-[#111111]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-jakarta">{editingLoan ? 'Edit Debt / Loan Record' : 'Add Debt / Loan Record'}</h3>
                <button onClick={() => setIsSlidePanelOpen(false)} className="p-2 text-[#94A3B8] hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#111111] rounded-[10px] border border-[#E2E8F0] dark:border-[#1a1a1a] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors"><X size={16} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-widest">Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setFormData({...formData, type: 'Lent'})} className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.type === 'Lent' ? 'bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]' : 'bg-slate-50 dark:bg-[#09090B] border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-500 dark:text-[#94A3B8]'}`}>
                        <ArrowUpRight size={16} /> I Lent (ধার দিয়েছি)
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'Borrowed'})} className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.type === 'Borrowed' ? 'bg-[#EF4444]/10 border-[#EF4444]/50 text-[#EF4444]' : 'bg-slate-50 dark:bg-[#09090B] border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-500 dark:text-[#94A3B8]'}`}>
                        <ArrowDownRight size={16} /> I Borrowed (দেনা)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Person Name</label>
                    <input type="text" value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" placeholder="e.g. Imtiaz Bhai" required />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Amount (BDT ৳)</label>
                    <input type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" placeholder="0.00" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Date</label>
                      <DatePicker 
                        selected={formData.date && !isNaN(new Date(formData.date).getTime()) ? new Date(formData.date) : null} 
                        onChange={(date: Date | null) => setFormData({...formData, date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')})}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" 
                        dateFormat="MMMM d, yyyy"
                        required
                        popperPlacement="bottom-start"
                        popperClassName="z-[60]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Expected Return</label>
                      <DatePicker 
                        selected={formData.expectedReturnDate && !isNaN(new Date(formData.expectedReturnDate).getTime()) ? new Date(formData.expectedReturnDate) : null} 
                        onChange={(date: Date | null) => setFormData({...formData, expectedReturnDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" 
                        dateFormat="MMMM d, yyyy"
                        placeholderText="mm/dd/yyyy"
                        popperPlacement="bottom-end"
                        popperClassName="z-[60]"
                        isClearable
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Payment Status</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setFormData({...formData, status: 'Pending'})} className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${formData.status === 'Pending' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-slate-50 dark:bg-[#09090B] border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-500'}`}>
                        <Clock size={14} /> ⏱️ Pending (Unpaid)
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, status: 'Settled'})} className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${formData.status === 'Settled' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-slate-50 dark:bg-[#09090B] border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-500'}`}>
                        <CheckCircle2 size={14} /> ✅ Settled (পরিশোধিত)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Description / Note</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors resize-none" placeholder="Reason or payment note..."></textarea>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-[#E2E8F0] dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#09090B]">
                <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
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

