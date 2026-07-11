'use client';

import React, { useState, useEffect } from 'react';
import { getTeamWorkLogs, updateWorkLog } from '@/app/actions/workSessionActions';
import { Calendar, Clock, Edit2, Check, X, Award, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from '@/components/ui/DatePicker';

type WorkSession = {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  date: string;
  startTime: string;
  lastActiveTime: string;
  totalSeconds: number;
};

export default function TeamLogsClient({ currentUser }: { currentUser: any }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<WorkSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [editHours, setEditHours] = useState('0');
  const [editMinutes, setEditMinutes] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = currentUser?.role === 'owner';

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await getTeamWorkLogs(date);
    if (res.success && res.data) {
      setLogs(res.data);
    } else {
      toast.error('Failed to load team logs');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [date]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatTimeFull = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const openEditModal = (session: WorkSession) => {
    setEditingSession(session);
    setEditHours(Math.floor(session.totalSeconds / 3600).toString());
    setEditMinutes(Math.floor((session.totalSeconds % 3600) / 60).toString());
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;
    setIsSaving(true);
    
    const newSeconds = (parseInt(editHours) || 0) * 3600 + (parseInt(editMinutes) || 0) * 60;
    
    const res = await updateWorkLog(editingSession._id, newSeconds);
    if (res.success) {
      toast.success('Time log updated successfully');
      setIsEditModalOpen(false);
      fetchLogs();
    } else {
      toast.error(res.error || 'Failed to update time');
    }
    setIsSaving(false);
  };

  const topPerformer = logs.length > 0 ? logs[0] : null;

  return (
    <div className="space-y-6">
      {/* Date Picker & Top Performer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 neu-flat rounded-3xl p-6 bg-white/40 dark:bg-slate-900/40">
          <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Select Date</label>
          <DatePicker 
            value={date} 
            onChange={(val) => { if(val) setDate(val); }} 
          />
        </div>

        {topPerformer && topPerformer.totalSeconds > 0 && (
          <div className="md:col-span-2 neu-flat rounded-3xl p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-indigo-500/10 rotate-12">
              <Award size={150} />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-slate-900 dark:text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Award size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-1">Top Performer ({new Date(date).toLocaleDateString()})</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{topPerformer.userId.name}</h3>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                <Clock size={16} /> Tracked {formatTime(topPerformer.totalSeconds)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="neu-flat rounded-3xl p-6 bg-white/40 dark:bg-slate-900/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Activity size={32} className="animate-spin mb-4 text-indigo-500" />
            <p>Loading team logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">No work logs found for this date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/5">
                  <th className="pb-4 px-4">Team Member</th>
                  <th className="pb-4 px-4">Start Time</th>
                  <th className="pb-4 px-4">Last Active</th>
                  <th className="pb-4 px-4">Total Worked</th>
                  {isOwner && <th className="pb-4 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                          {log.userId.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{log.userId.name}</p>
                          <p className="text-xs text-slate-500">{log.userId.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatTimeFull(log.startTime)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatTimeFull(log.lastActiveTime)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-mono font-bold text-sm">
                        <Clock size={14} />
                        {formatTime(log.totalSeconds)}
                      </div>
                    </td>
                    {isOwner && (
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => openEditModal(log)}
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                          title="Edit Time"
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal (Owner Only) */}
      {isEditModalOpen && editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Edit Work Log</h3>
            <p className="text-sm text-slate-500 mb-6">Update the active hours for {editingSession.userId.name}.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hours</label>
                <input 
                  type="number" 
                  min="0"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full px-4 py-3 neu-pressed rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Minutes</label>
                <input 
                  type="number" 
                  min="0"
                  max="59"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-4 py-3 neu-pressed rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-indigo-500 text-slate-900 dark:text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-70"
              >
                {isSaving ? <Activity size={16} className="animate-spin" /> : <Check size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
