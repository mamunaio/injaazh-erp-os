'use client';

import React, { useState } from 'react';
import { Clock, PlusCircle } from 'lucide-react';
import { TimeLog, Client } from '@/types/leadGen';

interface TimeLogViewProps {
  timeLogs: TimeLog[];
  clients: Client[];
  onAddTimeLog: (log: Omit<TimeLog, 'id'>) => Promise<void>;
}

export default function TimeLogView({
  timeLogs,
  clients,
  onAddTimeLog,
}: TimeLogViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [person, setPerson] = useState('Lead Gen Specialist');
  const [client, setClient] = useState('Internal');
  const [lane, setLane] = useState<'Outreach' | 'Fulfillment' | 'Tech' | 'Strategy' | 'Admin'>('Outreach');
  const [hours, setHours] = useState(3.0);
  const [task, setTask] = useState('');
  const [note, setNote] = useState('');

  const totalHours = timeLogs.reduce((acc, t) => acc + (Number(t.hours) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAddTimeLog({
        date,
        person,
        client,
        lane,
        hours: Number(hours),
        task,
        note,
      });
      setShowAddForm(false);
      setTask('');
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
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
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-[#6324FC] hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Log New Time Entry</span>
        </button>
      </div>

      {/* Add Time Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-7 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
            Record Fulfilled Hours
          </h3>

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
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Task Description *</label>
              <input
                type="text"
                required
                placeholder="e.g., Audit and verify 150 HVAC prospects"
                value={task}
                onChange={(e) => setTask(e.target.value)}
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
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-[#6324FC] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition"
            >
              {submitting ? 'Saving...' : 'Save Time Entry'}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-4 pl-5 pr-3">Date</th>
                <th className="px-3 py-4">Team Member</th>
                <th className="px-3 py-4">Client / Project</th>
                <th className="px-3 py-4">Lane</th>
                <th className="px-3 py-4">Hours</th>
                <th className="py-4 pl-3 pr-5">Task Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {timeLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pl-5 pr-3 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">{log.date}</td>
                  <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">{log.person}</td>
                  <td className="px-3 py-3.5 text-[#6324FC] dark:text-[#00E5FF] font-semibold">{log.client}</td>
                  <td className="px-3 py-3.5">
                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {log.lane}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{log.hours} hrs</td>
                  <td className="py-3.5 pl-3 pr-5 text-slate-600 dark:text-slate-300">{log.task}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
