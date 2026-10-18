'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { DailyLog, SystemSettings } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface DailyLogViewProps {
  dailyLogs: DailyLog[];
  settings: SystemSettings;
  onAddDailyLog: (log: Omit<DailyLog, 'id'>) => Promise<void>;
  onUpdateDailyLog: (id: string, log: Partial<DailyLog>) => Promise<void>;
  onDeleteDailyLog: (id: string) => Promise<void>;
}

export default function DailyLogView({
  dailyLogs,
  settings,
  onAddDailyLog,
  onUpdateDailyLog,
  onDeleteDailyLog,
}: DailyLogViewProps) {
  const { confirm } = useConfirm();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    emailsSent: 40,
    bounced: 0,
    replies: 2,
    positiveReplies: 1,
    auditsSent: 1,
    callsBooked: 0,
    note: '',
  });

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
    setShowAddForm(true);
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingLog(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      emailsSent: 40,
      bounced: 0,
      replies: 2,
      positiveReplies: 1,
      auditsSent: 1,
      callsBooked: 0,
      note: '',
    });
  };

  const handleDeleteWithConfirm = async (log: DailyLog) => {
    const confirmed = await confirm({
      title: 'Delete Outreach Log',
      message: `Are you sure you want to permanently delete the outreach record for ${log.date}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteDailyLog(log.id);
      if (editingLog?.id === log.id) {
        handleCancelForm();
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
      handleCancelForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalEmails = dailyLogs.reduce((acc, d) => acc + (Number(d.emailsSent) || 0), 0);
  const totalBounced = dailyLogs.reduce((acc, d) => acc + (Number(d.bounced) || 0), 0);
  const totalReplies = dailyLogs.reduce((acc, d) => acc + (Number(d.replies) || 0), 0);
  const totalPositive = dailyLogs.reduce((acc, d) => acc + (Number(d.positiveReplies) || 0), 0);
  const totalAudits = dailyLogs.reduce((acc, d) => acc + (Number(d.auditsSent) || 0), 0);
  const totalCalls = dailyLogs.reduce((acc, d) => acc + (Number(d.callsBooked) || 0), 0);

  const avgBounceRate = totalEmails > 0 ? ((totalBounced / totalEmails) * 100).toFixed(1) : '0.0';
  const replyRate = totalEmails > 0 ? ((totalReplies / totalEmails) * 100).toFixed(1) : '0.0';
  const positiveRate = totalEmails > 0 ? ((totalPositive / totalEmails) * 100).toFixed(1) : '0.0';

  const maxBounce = (settings.maxBounceRate || 0.02) * 100;
  const isHighBounce = Number(avgBounceRate) > maxBounce && totalEmails >= 50;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <Mail className="h-6 w-6 text-[#6324FC] dark:text-[#00E5FF]" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Daily Cold Outreach Activity Log</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log daily emails dispatched, bounces, replies, Loom video audits, and discovery calls booked.
          </p>
        </div>

        <button
          onClick={() => {
            if (showAddForm) handleCancelForm();
            else setShowAddForm(true);
          }}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition self-start sm:self-auto active:scale-95"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
          <span>{showAddForm ? (editingLog ? 'Cancel Edit' : 'Close Form') : 'Log Today’s Outreach'}</span>
        </button>
      </div>

      {/* Add / Edit Log Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-7 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              {editingLog ? (
                <>
                  <Edit2 className="h-5 w-5 mr-2 text-[#6324FC] dark:text-[#00E5FF]" />
                  <span>Edit Outreach Record ({editingLog.date})</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2 text-[#6324FC] dark:text-[#00E5FF]" />
                  <span>New Daily Outreach Record</span>
                </>
              )}
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Emails Sent *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.emailsSent}
                onChange={(e) => setFormData({ ...formData, emailsSent: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Bounced *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.bounced}
                onChange={(e) => setFormData({ ...formData, bounced: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Total Replies *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.replies}
                onChange={(e) => setFormData({ ...formData, replies: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Positive Replies *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.positiveReplies}
                onChange={(e) => setFormData({ ...formData, positiveReplies: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Audits Dispatched</label>
              <input
                type="number"
                min="0"
                value={formData.auditsSent}
                onChange={(e) => setFormData({ ...formData, auditsSent: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Calls Booked</label>
              <input
                type="number"
                min="0"
                value={formData.callsBooked}
                onChange={(e) => setFormData({ ...formData, callsBooked: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Notes &amp; Observations</label>
              <input
                type="text"
                placeholder="Subject lines, warmups, deliverability notes..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelForm}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-6 py-2 text-xs font-bold text-white shadow-md shadow-[#6324FC]/25 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingLog ? 'Update Outreach Record' : 'Save Outreach Record'}
            </button>
          </div>
        </form>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Emails Sent</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalEmails}</p>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average Bounce Rate</span>
          <p
            className={`text-2xl font-black mt-1 font-mono ${
              isHighBounce ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {avgBounceRate}%
          </p>
          <span className="text-[10px] text-slate-400">&le; {maxBounce}% ceiling</span>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Replies</span>
          <p className="text-2xl font-black text-indigo-500 dark:text-indigo-400 mt-1 font-mono">{totalReplies}</p>
          <span className="text-[10px] text-slate-400">{replyRate}% rate</span>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Positive Replies</span>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 font-mono">{totalPositive}</p>
          <span className="text-[10px] text-slate-400">{positiveRate}% rate</span>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Audits Dispatched</span>
          <p className="text-2xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-1 font-mono">{totalAudits}</p>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Calls Booked</span>
          <p className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1 font-mono">{totalCalls}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Daily Outreach Records History
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{dailyLogs.length} Days Logged</span>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <tr>
                <th className="py-4 pl-5 pr-3">Date</th>
                <th className="px-3 py-4">Emails Sent</th>
                <th className="px-3 py-4">Bounced</th>
                <th className="px-3 py-4">Replies</th>
                <th className="px-3 py-4">Positive</th>
                <th className="px-3 py-4">Audits</th>
                <th className="px-3 py-4">Calls</th>
                <th className="px-3 py-4">Bounce Rate</th>
                <th className="px-3 py-4">Positive Rate</th>
                <th className="px-3 py-4">Notes</th>
                <th className="py-4 pl-3 pr-5 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {dailyLogs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No daily outreach logs recorded yet. Click &apos;Log Today’s Outreach&apos; above to add your first day.
                  </td>
                </tr>
              ) : (
                dailyLogs.map((log) => {
                  const dayBounceRate =
                    log.emailsSent > 0 ? ((log.bounced / log.emailsSent) * 100).toFixed(1) : '0.0';
                  const dayPositiveRate =
                    log.emailsSent > 0
                      ? ((log.positiveReplies / log.emailsSent) * 100).toFixed(1)
                      : '0.0';
                  const isDayBounceUnsafe = Number(dayBounceRate) > maxBounce && log.emailsSent >= 20;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors ${
                        isDayBounceUnsafe ? 'bg-rose-500/[0.04] dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 pl-5 pr-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{log.date}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-slate-200">{log.emailsSent}</td>
                      <td className="px-3 py-3.5 text-rose-600 dark:text-rose-400 font-semibold">{log.bounced}</td>
                      <td className="px-3 py-3.5 text-indigo-600 dark:text-indigo-300 font-semibold">{log.replies}</td>
                      <td className="px-3 py-3.5 text-teal-600 dark:text-teal-300 font-semibold">{log.positiveReplies}</td>
                      <td className="px-3 py-3.5 text-[#6324FC] dark:text-[#00E5FF] font-medium">{log.auditsSent}</td>
                      <td className="px-3 py-3.5 text-amber-500 dark:text-amber-300 font-bold">{log.callsBooked}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            Number(dayBounceRate) <= maxBounce
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {dayBounceRate}%
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm">{dayPositiveRate}%</span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate max-w-xs">
                        {log.note || '—'}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right">
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
      </div>
    </div>
  );
}
