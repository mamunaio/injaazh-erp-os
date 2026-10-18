'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  PlusCircle,
  Building,
  Sparkles,
  Check,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { DeliveryItem, Client } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface DeliveryCalendarViewProps {
  items: DeliveryItem[];
  clients: Client[];
  onAddItem: (item: Omit<DeliveryItem, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<DeliveryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export default function DeliveryCalendarView({
  items,
  clients,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: DeliveryCalendarViewProps) {
  const { confirm } = useConfirm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null);

  const [client, setClient] = useState(clients[0]?.name || 'Acme Heating & Air');
  const [task, setTask] = useState('Weekly GBP update post & local offer highlight');
  const [frequency, setFrequency] = useState<'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly' | 'Bi-annual'>('Weekly');
  const [nextDue, setNextDue] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const calculateDaysLeft = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleMarkDoneToday = async (item: DeliveryItem) => {
    const nextDate = new Date();
    if (item.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (item.frequency === 'Bi-weekly') nextDate.setDate(nextDate.getDate() + 14);
    else if (item.frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (item.frequency === 'Bi-annual') nextDate.setMonth(nextDate.getMonth() + 6);
    else nextDate.setDate(nextDate.getDate() + 30);

    await onUpdateItem(item.id, {
      lastDone: todayStr,
      nextDue: nextDate.toISOString().split('T')[0],
      status: 'Good',
    });
  };

  const handleStartEdit = (item: DeliveryItem) => {
    setEditingItem(item);
    setClient(item.client);
    setTask(item.task);
    setFrequency(item.frequency);
    setNextDue(item.nextDue);
    setNotes(item.notes || '');
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setTask('Weekly GBP update post & local offer highlight');
    setFrequency('Weekly');
    setNextDue(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleDeleteWithConfirm = async (item: DeliveryItem) => {
    const confirmed = await confirm({
      title: 'Delete Deliverable SOP',
      message: `Are you sure you want to permanently delete "${item.task}" for "${item.client}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteItem(item.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await onUpdateItem(editingItem.id, {
        client,
        task,
        frequency,
        nextDue,
        notes,
      });
    } else {
      await onAddItem({
        client,
        task,
        frequency,
        nextDue,
        lastDone: '',
        status: 'Good',
        notes,
      });
    }
    handleCloseModal();
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <CalendarDays className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Delivery SOPs &amp; Fulfillment Schedule</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enforce client retainer contract deliverables: Weekly Google Business profile posts, local city pages, and monthly AI visibility audits.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-500/20 transition self-start sm:self-auto active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Recurring Deliverable</span>
        </button>
      </div>

      {/* Standard SOP Cadence Overview Card */}
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 backdrop-blur-xl shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-teal-500" />
          Our HVAC Agency Retainer Fulfillment Blueprint
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl bg-slate-50 dark:bg-black/40 p-4 border border-slate-100 dark:border-white/5">
            <strong className="text-slate-900 dark:text-white block mb-0.5">1. Weekly GBP Posts:</strong> High-ticket seasonal AC/Furnace offers + geo-tagged photos.
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-black/40 p-4 border border-slate-100 dark:border-white/5">
            <strong className="text-slate-900 dark:text-white block mb-0.5">2. Bi-Weekly City Pages:</strong> Targeted sub-suburb landing pages (e.g. &apos;Frisco Emergency AC Repair&apos;).
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-black/40 p-4 border border-slate-100 dark:border-white/5">
            <strong className="text-slate-900 dark:text-white block mb-0.5">3. Monthly Reports:</strong> Maps views, call tracking, and AI prompt citations.
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-black/40 p-4 border border-slate-100 dark:border-white/5">
            <strong className="text-slate-900 dark:text-white block mb-0.5">4. Service Area Audit:</strong> Review neighboring zip-codes every 6 months.
          </div>
        </div>
      </div>

      {/* Deliverables List */}
      <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Active Retainer Fulfillment Queue
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{items.length} SOP Deliverables</span>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <tr>
                <th className="py-4 pl-5 pr-3">Client</th>
                <th className="px-3 py-4">Recurring Deliverable Task</th>
                <th className="px-3 py-4">Cadence</th>
                <th className="px-3 py-4">Last Done</th>
                <th className="px-3 py-4">Next Due Date</th>
                <th className="px-3 py-4">Countdown</th>
                <th className="px-3 py-4">Status</th>
                <th className="py-4 pl-3 pr-5 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No deliverables scheduled. Click &apos;Add Recurring Deliverable&apos; above to set up client SOPs.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const daysLeft = calculateDaysLeft(item.nextDue);
                  const isOverdue = daysLeft < 0;
                  const isDueSoon = daysLeft >= 0 && daysLeft <= 3;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-5 pr-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-[#6324FC] dark:text-[#00E5FF]" />
                          <span className="font-bold">{item.client}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 font-medium text-slate-800 dark:text-slate-200">{item.task}</td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-full bg-slate-100 dark:bg-white/10 px-3 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {item.frequency}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">{item.lastDone || '—'}</td>
                      <td className="px-3 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{item.nextDue}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`font-bold text-xs sm:text-sm ${
                            isOverdue ? 'text-rose-600 dark:text-rose-400' : isDueSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isOverdue ? `${Math.abs(daysLeft)} Days Overdue!` : `${daysLeft} Days Left`}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            isOverdue
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : isDueSoon
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'On Track'}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleMarkDoneToday(item)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm active:scale-95"
                            title="Mark Completed Today & Advance Cadence"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Done</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                            title="Edit Deliverable"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWithConfirm(item)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
                            title="Delete Deliverable"
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
      </div>

      {/* Add / Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-8 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-5">
              {editingItem ? 'Edit Recurring Deliverable SOP' : 'Add New Recurring Deliverable SOP'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Client *</label>
                <select
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Deliverable Task Name *</label>
                <input
                  type="text"
                  required
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Fulfillment Cadence</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-annual">Bi-annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Next Due Date *</label>
                  <input
                    type="date"
                    required
                    value={nextDue}
                    onChange={(e) => setNextDue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">SOP Notes / Links</label>
                <input
                  type="text"
                  placeholder="Canva template link, GDrive folder, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end space-x-3.5 pt-5 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-500/20 hover:opacity-95 transition active:scale-95"
                >
                  {editingItem ? 'Update SOP Deliverable' : 'Save SOP Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
