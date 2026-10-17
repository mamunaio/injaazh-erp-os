'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Award, Activity, Edit2, Check, X } from 'lucide-react';
import { getWorkLogsByDate, updateWorkLog } from '@/app/actions/timeActions';
import { useUser } from '@/components/layout/UserContext';
import toast from 'react-hot-toast';
import DatePicker from '@/components/ui/DatePicker';

export default function TeamLogsClient({ currentUser }: { currentUser?: any }) {
  const { user: contextUser } = useUser();
  const user = currentUser || contextUser;
  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editMinutes, setEditMinutes] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await getWorkLogsByDate(date);
    if (res.success && res.data) {
      setLogs(res.data);
    } else {
      setLogs([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [date]);

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const formatTimeFull = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const openEditModal = (log: any) => {
    setEditingSession(log);
    const hrs = Math.floor(log.totalSeconds / 3600);
    const mins = Math.floor((log.totalSeconds % 3600) / 60);
    setEditHours(hrs.toString());
    setEditMinutes(mins.toString());
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-sm">
          <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-2.5">Select Date</label>
          <DatePicker 
            value={date} 
            onChange={(val) => { if(val) setDate(val); }} 
          />
        </div>

        {topPerformer && topPerformer.totalSeconds > 0 && (
          <div className="md:col-span-2 bg-gradient-to-br from-[#6324FC]/10 via-[#8B5CF6]/5 to-[#00E5FF]/10 border border-[#6324FC]/25 rounded-3xl p-5 flex items-center gap-5 relative overflow-hidden shadow-sm">
            <div className="absolute -right-8 -top-8 text-[#6324FC]/10 rotate-12 pointer-events-none">
              <Award size={130} />
            </div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-[#6324FC]/30 shrink-0">
              <Award size={26} />
            </div>
            <div>
              <p className="text-[10px] font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider mb-0.5">Top Performer ({new Date(date).toLocaleDateString()})</p>
              <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">{topPerformer.userId.name}</h3>
              <p className="text-secondary text-xs flex items-center gap-1.5 mt-0.5 font-medium">
                <Clock size={13} className="text-[#6324FC] dark:text-[#00E5FF]" /> Tracked {formatTime(topPerformer.totalSeconds)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-secondary">
            <Activity size={24} className="animate-spin mb-3 text-[#6324FC]" />
            <p className="text-xs">Loading team logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-secondary">
            <Clock size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-heading font-bold text-sm text-slate-900 dark:text-white">No work logs found for this date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-heading font-extrabold text-secondary uppercase tracking-widest border-b border-black/5 dark:border-white/5">
                  <th className="pb-3 px-3">Team Member</th>
                  <th className="pb-3 px-3">Start Time</th>
                  <th className="pb-3 px-3">Last Active</th>
                  <th className="pb-3 px-3">Total Worked</th>
                  {isOwner && <th className="pb-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center font-heading font-bold text-slate-700 dark:text-slate-300 text-xs">
                          {log.userId.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-heading font-bold text-slate-900 dark:text-white text-xs">{log.userId.name}</p>
                          <p className="text-[10px] text-secondary">{log.userId.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-secondary">
                      {formatTimeFull(log.startTime)}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-secondary">
                      {formatTimeFull(log.lastActiveTime)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-mono font-bold text-xs border border-[#6324FC]/20">
                        <Clock size={12} />
                        {formatTime(log.totalSeconds)}
                      </div>
                    </td>
                    {isOwner && (
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => openEditModal(log)}
                          className="p-1.5 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                          title="Edit Time"
                        >
                          <Edit2 size={15} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0a0a0d] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/10 dark:border-white/15">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">Edit Work Log</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-secondary hover:text-rose-500">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-secondary mb-5">Update the active hours for {editingSession.userId.name}.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">Hours</label>
                <input 
                  type="number" 
                  min="0"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">Minutes</label>
                <input 
                  type="number" 
                  min="0"
                  max="59"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-heading font-bold bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] text-white hover:brightness-110 transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] disabled:opacity-50"
              >
                {isSaving ? <Activity size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
