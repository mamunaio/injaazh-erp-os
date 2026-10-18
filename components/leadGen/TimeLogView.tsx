'use client';

import React, { useState } from 'react';
import {
  Clock,
  PlusCircle,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { TimeLog, Client } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface TimeLogViewProps {
  timeLogs: TimeLog[];
  clients: Client[];
  onAddTimeLog: (log: Omit<TimeLog, 'id'>) => Promise<void>;
  onUpdateTimeLog: (id: string, log: Partial<TimeLog>) => Promise<void>;
  onDeleteTimeLog: (id: string) => Promise<void>;
}

export default function TimeLogView({
  timeLogs,
  clients,
  onAddTimeLog,
  onUpdateTimeLog,
  onDeleteTimeLog,
}: TimeLogViewProps) {
  const { confirm } = useConfirm();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [person, setPerson] = useState('Lead Gen Specialist');
  const [client, setClient] = useState('Internal');
  const [lane, setLane] = useState<'Outreach' | 'Fulfillment' | 'Tech' | 'Strategy' | 'Admin'>('Outreach');
  const [hours, setHours] = useState(3.0);
  const [task, setTask] = useState('');
  const [note, setNote] = useState('');

  const totalHours = timeLogs.reduce((acc, t) => acc + (Number(t.hours) || 0), 0);

  const handleStartEdit = (t: TimeLog) => {
    setEditingLog(t);
    setDate(t.date);
    setPerson(t.person);
    setClient(t.client);
    setLane(t.lane);
    setHours(t.hours);
    setTask(t.task);
    setNote(t.note || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingLog(null);
    setDate(new Date().toISOString().split('T')[0]);
    setPerson('Lead Gen Specialist');
    setClient('Internal');
    setLane('Outreach');
    setHours(3.0);
    setTask('');
    setNote('');
  };

  const handleDeleteWithConfirm = async (t: TimeLog) => {
    const confirmed = await confirm({
      title: 'Delete Time Entry',
      message: `Are you sure you want to permanently delete this ${t.hours} hr entry for "${t.task}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteTimeLog(t.id);
      if (editingLog?.id === t.id) {
        handleCancelForm();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLog) {
        await onUpdateTimeLog(editingLog.id, {
          date,
          person,
          client,
          lane,
          hours: Number(hours),
          task,
          note,
        });
      } else {
        await onAddTimeLog({
          date,
          person,
          client,
          lane,
          hours: Number(hours),
          task,
          note,
        });
      }
      handleCancelForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <Clock className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Time &amp; Activity Tracking (Time Log)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log fulfilled hours by team member, client, and operational lane to establish client hourly yield foundations.
          </p>
        </div>

        <button
          onClick={() => {
            if (showAddForm) handleCancelForm();
            else setShowAddForm(true);
          }}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-[#6324FC] hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition self-start sm:self-auto active:scale-95"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
          <span>{showAddForm ? (editingLog ? 'Cancel Edit' : 'Close Form') : 'Log New Time Entry'}</span>
        </button>
      </div>

      {/* Add / Edit Time Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-7 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              {editingLog ? (
                <>
                  <Edit2 className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  <span>Edit Time Entry ({editingLog.person} - {editingLog.date})</span>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                  <span>Record Fulfilled Hours</span>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Team Member *</label>
              <input
                type="text"
                required
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Client / Account *</label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              >
                <option value="Internal">Internal (Agency Internal Operations)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Operational Lane</label>
              <select
                value={lane}
                onChange={(e) => setLane(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              >
                <option value="Outreach">Outreach (Cold Email / Lead Research)</option>
                <option value="Fulfillment">Fulfillment (Client Deliverables / SEO)</option>
                <option value="Tech">Tech (Domains / Inboxes / Automation)</option>
                <option value="Strategy">Strategy (Audits / Calls)</option>
                <option value="Admin">Admin (Operations / Finance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Hours Spent *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Task Description *</label>
              <input
                type="text"
                required
                placeholder="e.g., Cleaned up 80 Dallas HVAC emails in MillionVerifier and created local page draft"
                value={task}
                onChange={(e) => setTask(e.target.value)}
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
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-[#6324FC] hover:opacity-95 px-6 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingLog ? 'Update Time Entry' : 'Save Time Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Time Log Entries (Total: {totalHours.toFixed(1)} hrs)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{timeLogs.length} Records</span>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <tr>
                <th className="py-4 pl-5 pr-3">Date</th>
                <th className="px-3 py-4">Team Member</th>
                <th className="px-3 py-4">Client / Project</th>
                <th className="px-3 py-4">Lane</th>
                <th className="px-3 py-4">Hours</th>
                <th className="px-3 py-4">Task Description</th>
                <th className="py-4 pl-3 pr-5 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {timeLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No time entries recorded yet. Click &apos;Log New Time Entry&apos; to begin tracking hours.
                  </td>
                </tr>
              ) : (
                timeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pl-5 pr-3 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">{log.date}</td>
                    <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">{log.person}</td>
                    <td className="px-3 py-3.5 text-[#6324FC] dark:text-[#00E5FF] font-semibold">{log.client}</td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {log.lane}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">{log.hours} hrs</td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300 max-w-sm truncate">{log.task}</td>
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(log)}
                          className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                          title="Edit Time Entry"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithConfirm(log)}
                          className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
                          title="Delete Time Entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
