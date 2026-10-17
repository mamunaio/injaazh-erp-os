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
        <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-5 relative overflow-hidden group shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Total Lent (Owed to you)</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ArrowUpRight size={16} /></div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalLent)}</p>
          <p className="text-[10px] text-secondary mt-1 font-bold">Unsettled receivable amount</p>
        </div>
        <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-5 relative overflow-hidden group shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Total Borrowed (You owe)</p>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"><ArrowDownRight size={16} /></div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalBorrowed)}</p>
          <p className="text-[10px] text-secondary mt-1 font-bold">Outstanding debt to pay</p>
        </div>
        <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-5 relative overflow-hidden group shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Net Debt Balance</p>
            <div className="w-8 h-8 rounded-lg bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC]"><DollarSign size={16} /></div>
          </div>
          <p className={`text-2xl font-bold font-mono tracking-tight ${netBalance > 0 ? 'text-emerald-500' : netBalance < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
            {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance)}
          </p>
          <p className="text-[10px] text-secondary mt-1 font-bold">{netBalance >= 0 ? 'Positive net receivables' : 'Net payable liability'}</p>
        </div>
      </div>

      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
          <input 
            type="text" 
            placeholder="Search person or note..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary"
          />
        </div>
        <button onClick={openAddPanel} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)]">
          <Plus size={15} strokeWidth={2.5} /> Add Debt / Loan Record
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#060608]">
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Date</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Person / Name</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Type</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right">Amount</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Expected Return</th>
                <th className="px-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Status</th>
                <th className="px-5 py-3.5 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-secondary">No debt or loan records found.</td>
                </tr>
              ) : (
                filteredLoans.map((l) => (
                  <tr key={l._id} className={`hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group ${l.status === 'Settled' ? 'opacity-60 bg-slate-50/50 dark:bg-white/[0.01]' : ''}`}>
                    <td className="px-5 py-3.5 text-xs font-medium text-secondary whitespace-nowrap">{format(new Date(l.date), 'MMM dd, yyyy')}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{l.personName}</span>
                        {l.status === 'Settled' && (
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Paid</span>
                        )}
                      </div>
                      {l.description && <p className="text-[10px] font-normal text-secondary mt-0.5">{l.description}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider ${l.type === 'Lent' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                        {l.type === 'Lent' ? 'Lent (পাওনা)' : 'Borrowed (দেনা)'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      <span className={l.status === 'Settled' ? 'line-through text-secondary' : ''}>
                        {formatCurrency(l.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-secondary whitespace-nowrap">
                      {l.expectedReturnDate ? format(new Date(l.expectedReturnDate), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button 
                        onClick={() => handleToggleStatus(l._id, l.status)}
                        title={l.status === 'Pending' ? "Click to mark as Paid / Settled" : "Click to mark as Pending (Unsettled)"}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-heading font-bold transition-all border shadow-xs cursor-pointer ${
                          l.status === 'Settled' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/30 hover:bg-amber-500/20 hover:scale-105'
                        }`}
                      >
                        {l.status === 'Settled' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} className="text-amber-500" />}
                        <span>{l.status === 'Settled' ? 'Paid / Settled' : 'Pending'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditPanel(l)} className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Edit"><Edit3 size={13} /></button>
                        <button onClick={() => handleDelete(l._id)} className="p-1.5 text-secondary hover:text-rose-500 bg-slate-50 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg transition-colors" title="Delete"><Trash2 size={13} /></button>
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
                        <ArrowUpRight size={14} /> I Lent (ধার দিয়েছি)
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'Borrowed'})} className={`px-3 py-2.5 rounded-xl border text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all ${formData.type === 'Borrowed' ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-xs' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary'}`}>
                        <ArrowDownRight size={14} /> I Borrowed (দেনা)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Person Name</label>
                    <input type="text" value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="e.g. Imtiaz Bhai" required />
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Amount (BDT ৳)</label>
                    <input type="number" step="0.01" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="0.00" required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Date</label>
                      <input 
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Expected Return</label>
                      <input 
                        type="date"
                        value={formData.expectedReturnDate}
                        onChange={e => setFormData({...formData, expectedReturnDate: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Payment Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setFormData({...formData, status: 'Pending'})} className={`py-2 px-3 rounded-xl border text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all ${formData.status === 'Pending' ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary'}`}>
                        <Clock size={13} /> Pending (Unpaid)
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, status: 'Settled'})} className={`py-2 px-3 rounded-xl border text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all ${formData.status === 'Settled' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary'}`}>
                        <CheckCircle2 size={13} /> Settled (পরিশোধিত)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Description / Note</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors resize-none placeholder:text-secondary" placeholder="Reason or payment note..."></textarea>
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
