'use client';

import React, { useState } from 'react';
import {
  Mail,
  Send,
  PlusCircle,
  Calendar,
} from 'lucide-react';
import { DailyLog, SystemSettings } from '@/types/leadGen';

interface DailyLogViewProps {
  dailyLogs: DailyLog[];
  settings: SystemSettings;
  onAddDailyLog: (log: Omit<DailyLog, 'id'>) => Promise<void>;
}

export default function DailyLogView({
  dailyLogs,
  settings,
  onAddDailyLog,
}: DailyLogViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
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
      setShowAddForm(false);
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
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalSent = dailyLogs.reduce((acc, d) => acc + (Number(d.emailsSent) || 0), 0);
  const totalBounced = dailyLogs.reduce((acc, d) => acc + (Number(d.bounced) || 0), 0);
  const totalReplies = dailyLogs.reduce((acc, d) => acc + (Number(d.replies) || 0), 0);
  const totalPositive = dailyLogs.reduce((acc, d) => acc + (Number(d.positiveReplies) || 0), 0);
  const totalAudits = dailyLogs.reduce((acc, d) => acc + (Number(d.auditsSent) || 0), 0);
  const totalCalls = dailyLogs.reduce((acc, d) => acc + (Number(d.callsBooked) || 0), 0);

  const avgBounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
  const avgReplyRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0;
  const avgPositiveRate = totalSent > 0 ? (totalPositive / totalSent) * 100 : 0;

  const maxBounce = (settings.maxBounceRate || 0.02) * 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner and Quick Add Toggle */}
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
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 transition self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showAddForm ? 'Close Form' : 'Log Today’s Outreach'}</span>
        </button>
      </div>

      {/* Add Log Modal/Collapsible Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-7 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center">
            <Send className="h-5 w-5 mr-2 text-[#6324FC] dark:text-[#00E5FF]" />
            New Daily Outreach Record
          </h3>

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
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Daily Notes / Context</label>
              <input
                type="text"
                placeholder="e.g., Domain warmup batch 1 sent to Austin/Dallas"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3.5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#6324FC]/25 hover:opacity-95 transition"
            >
              {submitting ? 'Saving...' : 'Save Daily Log'}
            </button>
          </div>
        </form>
      )}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Emails Sent</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalSent}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average Bounce Rate</span>
          <p
            className={`text-2xl font-black mt-1 ${
              avgBounceRate <= maxBounce ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {avgBounceRate.toFixed(1)}%
          </p>
          <span className="text-[11px] text-slate-400">&le; {maxBounce}% ceiling</span>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Replies</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalReplies}</p>
          <span className="text-[11px] text-slate-400">{avgReplyRate.toFixed(1)}% rate</span>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Positive Replies</span>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{totalPositive}</p>
          <span className="text-[11px] text-slate-400">{avgPositiveRate.toFixed(1)}% rate</span>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Audits Dispatched</span>
          <p className="text-2xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-1">{totalAudits}</p>
        </div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-4 text-center shadow-sm backdrop-blur-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Calls Booked</span>
          <p className="text-2xl font-black text-amber-500 dark:text-amber-300 mt-1">{totalCalls}</p>
        </div>
      </div>

      {/* Daily Logs Table */}
      <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Daily Outreach Records History
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{dailyLogs.length} Days Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                <th className="py-4 pl-3 pr-5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {dailyLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
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
                      <td className="py-3.5 pl-3 pr-5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate max-w-xs">
                        {log.note || '—'}
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
