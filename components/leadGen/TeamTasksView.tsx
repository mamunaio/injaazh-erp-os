'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { TeamTask } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface TeamTasksViewProps {
  tasks: TeamTask[];
  onAddTask: (task: Omit<TeamTask, 'id'>) => Promise<void>;
  onUpdateTask: (id: string, task: Partial<TeamTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export default function TeamTasksView({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TeamTasksViewProps) {
  const { confirm } = useConfirm();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TeamTask | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [lane, setLane] = useState<'Outreach' | 'Fulfillment' | 'Tech' | 'Content' | 'Admin'>('Outreach');
  const [owner, setOwner] = useState('Teammate');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [briefLink, setBriefLink] = useState('');
  const [flag, setFlag] = useState<'Normal' | 'Urgent' | 'Blocked'>('Normal');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleStartEdit = (t: TeamTask) => {
    setEditingTask(t);
    setTaskTitle(t.task);
    setLane(t.lane);
    setOwner(t.owner);
    setDeadline(t.deadline);
    setBriefLink(t.briefLink || '');
    setFlag(t.flag);
    setNotes(t.notes || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingTask(null);
    setTaskTitle('');
    setNotes('');
    setBriefLink('');
    setFlag('Normal');
    setOwner('Teammate');
    setLane('Outreach');
    setDeadline(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteWithConfirm = async (t: TeamTask) => {
    const confirmed = await confirm({
      title: 'Delete Team Task',
      message: `Are you sure you want to permanently delete task "${t.task}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      await onDeleteTask(t.id);
      if (editingTask?.id === t.id) {
        handleCancelForm();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      await onUpdateTask(editingTask.id, {
        task: taskTitle,
        lane,
        owner,
        deadline,
        briefLink,
        flag,
        notes,
      });
    } else {
      await onAddTask({
        task: taskTitle,
        lane,
        owner,
        created: todayStr,
        deadline,
        status: 'Todo',
        reviewedByMe: false,
        briefLink,
        flag,
        notes,
      });
    }
    handleCancelForm();
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Team Tasks &amp; Task Brief Tracker</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Delegate operational deliverables, track deadlines, priorities, and review status.
          </p>
        </div>

        <button
          onClick={() => {
            if (showAddForm) handleCancelForm();
            else setShowAddForm(true);
          }}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-purple-600 to-[#6324FC] hover:opacity-95 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-500/20 transition self-start sm:self-auto active:scale-95"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
          <span>{showAddForm ? (editingTask ? 'Cancel Edit' : 'Close Form') : 'Assign New Task'}</span>
        </button>
      </div>

      {/* Add / Edit Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 lg:p-7 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              {editingTask ? (
                <>
                  <Edit2 className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  <span>Edit Task Brief ({editingTask.id})</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  <span>Assign New Team Task Brief</span>
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
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Task Title / Brief *</label>
              <input
                type="text"
                required
                placeholder="e.g., Audit 20 HVAC prospect Google Maps snapshots in Dallas"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Owner / Assignee *</label>
              <input
                type="text"
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Operational Lane</label>
              <select
                value={lane}
                onChange={(e) => setLane(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              >
                <option value="Outreach">Outreach (Cold Email / Research)</option>
                <option value="Fulfillment">Fulfillment (Deliverables / Local SEO)</option>
                <option value="Tech">Tech (Automation / Email Infrastructure)</option>
                <option value="Content">Content (City Pages / Reviews)</option>
                <option value="Admin">Admin (Operations / Finance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Deadline *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Priority Flag</label>
              <select
                value={flag}
                onChange={(e) => setFlag(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent 🔥</option>
                <option value="Blocked">Blocked ⚠️</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Brief Document Link (Loom / Notion / Google Doc)</label>
              <input
                type="url"
                placeholder="https://..."
                value={briefLink}
                onChange={(e) => setBriefLink(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Notes</label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              className="rounded-xl bg-gradient-to-r from-purple-600 to-[#6324FC] hover:opacity-95 px-6 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition active:scale-95"
            >
              {editingTask ? 'Update Task Brief' : 'Assign Task Brief'}
            </button>
          </div>
        </form>
      )}

      {/* Tasks Table */}
      <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c0d14]/80 shadow-sm backdrop-blur-xl">
        <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Operational Task Briefs &amp; Queue
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tasks.length} Active Tasks</span>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <tr>
                <th className="py-4 pl-5 pr-3">Task Brief</th>
                <th className="px-3 py-4">Assignee</th>
                <th className="px-3 py-4">Lane</th>
                <th className="px-3 py-4">Deadline</th>
                <th className="px-3 py-4">Status</th>
                <th className="px-3 py-4">Review State</th>
                <th className="px-3 py-4">Brief Link</th>
                <th className="py-4 pl-3 pr-5 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No team tasks logged. Click &apos;Assign New Task&apos; above to delegate operational briefs.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const isOverdue = t.deadline && t.deadline < todayStr && t.status !== 'Done';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pl-5 pr-3 font-semibold text-slate-900 dark:text-white max-w-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{t.task}</span>
                          {t.flag === 'Urgent' && (
                            <span className="rounded bg-rose-500/15 px-2 py-0.5 text-xs text-rose-600 dark:text-rose-300 border border-rose-500/30 font-bold">
                              Urgent
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono mt-0.5 block">{t.id}</span>
                      </td>
                      <td className="px-3 py-3.5 text-[#6324FC] dark:text-[#00E5FF] font-bold">{t.owner}</td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t.lane}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            isOverdue ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {t.deadline}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <select
                          value={t.status}
                          onChange={(e) => onUpdateTask(t.id, { status: e.target.value as any })}
                          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/50 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </td>
                      <td className="px-3 py-3.5">
                        <button
                          type="button"
                          onClick={() => onUpdateTask(t.id, { reviewedByMe: !t.reviewedByMe })}
                          className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition ${
                            t.reviewedByMe
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <CheckCircle2 className={`h-3.5 w-3.5 ${t.reviewedByMe ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span>{t.reviewedByMe ? 'Reviewed' : 'Pending Review'}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3.5">
                        {t.briefLink ? (
                          <a
                            href={t.briefLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs sm:text-sm text-[#6324FC] dark:text-[#00E5FF] hover:underline font-semibold"
                          >
                            View Brief <ExternalLink className="h-3.5 w-3.5 ml-1" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(t)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 hover:bg-[#6324FC]/20 dark:hover:bg-[#00E5FF]/20 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 transition active:scale-95"
                            title="Edit Task Brief"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWithConfirm(t)}
                            className="inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95"
                            title="Delete Task"
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
