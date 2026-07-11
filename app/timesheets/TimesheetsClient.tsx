'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Calendar, DollarSign, Activity, Play, Edit3, Trash2, Search, X, Loader2 } from 'lucide-react';
import { createTimeLog, deleteTimeLog, updateTimeLog, getTimesheetKPIs } from '@/app/actions/timesheetActions';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function TimesheetsClient({ user, initialLogs, initialKpis }: { user: any, initialLogs: any[], initialKpis: any }) {
  const [logs, setLogs] = useState<any[]>(initialLogs || []);
  const [kpis, setKpis] = useState<any>(initialKpis || { today: 0, week: 0, month: 0, billableValue: 0, chartData: [] });
  
  const refreshKpis = async () => {
    const res = await getTimesheetKPIs();
    if (res.success) setKpis(res.data);
  };
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ project: '', task: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const calculateDurationSeconds = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let s = (startH * 3600) + (startM * 60);
    let e = (endH * 3600) + (endM * 60);
    if (e < s) e += 24 * 3600; // handle overnight
    return e - s;
  };

  const openModalForNew = () => {
    setEditingLogId(null);
    setFormData({ project: '', task: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (log: any) => {
    setEditingLogId(log._id);
    setFormData({
      project: log.project,
      task: log.task,
      date: format(new Date(log.date), 'yyyy-MM-dd'),
      startTime: log.startTime,
      endTime: log.endTime
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project || !formData.task || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill all fields');
      return;
    }
    
    setIsSubmitting(true);
    const durationSeconds = calculateDurationSeconds(formData.startTime, formData.endTime);
    
    const payload = {
      project: formData.project,
      task: formData.task,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      durationSeconds
    };

    if (editingLogId) {
      const res = await updateTimeLog(editingLogId, payload);
      if (res.success) {
        toast.success('Log updated!');
        setLogs(logs.map(l => l._id === editingLogId ? res.data : l));
        refreshKpis();
        setIsModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to update log');
      }
    } else {
      const res = await createTimeLog(payload);
      if (res.success) {
        toast.success('Time logged successfully!');
        setLogs([res.data, ...logs]);
        refreshKpis();
        setIsModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to log time');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    const res = await deleteTimeLog(id);
    if (res.success) {
      toast.success('Log deleted');
      setLogs(logs.filter(l => l._id !== id));
      refreshKpis();
    } else {
      toast.error('Failed to delete log');
    }
  };

  const kpiCards = [
    { label: 'Hours Today', value: formatTimeSeconds(kpis.today), color: '#2563EB', icon: Clock },
    { label: 'Weekly Total', value: formatTimeSeconds(kpis.week), color: '#7C3AED', icon: Calendar },
    { label: 'Monthly Total', value: formatTimeSeconds(kpis.month), color: '#10B981', icon: Activity },
    { label: 'Billable Value', value: `$${kpis.billableValue.toFixed(2)}`, color: '#F59E0B', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                <Clock size={17} />
              </div>
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Time Tracking</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-jakarta mb-1.5">Timesheets</h1>
            <p className="text-sm font-medium text-[#94A3B8]">Track, review, and manage your logged hours.</p>
          </div>
          <button onClick={openModalForNew} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
            <Plus size={16} strokeWidth={2.5} /> Log Time Manually
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
              key={i} 
              className="bg-[#11131A] border border-[#232734] rounded-[20px] p-5 group hover:border-[#2563EB]/40 transition-all relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <kpi.icon size={100} style={{ color: kpi.color }} />
              </div>
              <div className="flex items-start justify-between mb-4 relative z-10">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">{kpi.label}</p>
                <div className="w-8 h-8 rounded-lg bg-[#09090B] border border-[#232734] flex items-center justify-center" style={{ color: kpi.color }}>
                  <kpi.icon size={14} />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-white relative z-10">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Chart & Table Split */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="xl:col-span-1 bg-[#11131A] border border-[#232734] rounded-[20px] p-6 flex flex-col"
          >
            <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Activity (Last 7 Days)</h2>
            <div className="flex-1 flex items-end justify-between gap-2 h-[200px] mt-auto">
              {(kpis.chartData || []).map((d: any, i: number) => {
                const heightPercent = d.hours > 0 ? Math.max((d.hours / d.max) * 100, 10) : 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-3 flex-1 group cursor-default">
                    <div className="w-full bg-[#09090B] rounded-t-lg relative h-full flex items-end border border-[#232734] border-b-0 overflow-hidden">
                      {d.hours > 0 && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 1, delay: i * 0.1 + 0.3, ease: "easeOut" }}
                          className="w-full bg-gradient-to-t from-[#2563EB] to-[#7C3AED] rounded-t-sm relative group-hover:brightness-110 transition-all"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#232734] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap">
                            {d.hours} hrs
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#94A3B8]">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Table Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="xl:col-span-2 bg-[#11131A] border border-[#232734] rounded-[20px] overflow-hidden flex flex-col"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-[#232734] gap-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Detailed Log</h2>
              <div className="relative w-full sm:w-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  className="w-full sm:w-64 bg-[#09090B] border border-[#232734] text-white text-xs font-medium rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                />
              </div>
            </div>

            {logs.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#0D0F16]">
                    <tr className="border-b border-[#232734]">
                      <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Project/Client</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Task Description</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Time</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-right">Duration</th>
                      <th className="px-6 py-4 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232734]/60">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-[#09090B]/80 transition-colors group">
                        <td className="px-6 py-4 text-xs font-medium text-[#94A3B8] whitespace-nowrap">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold border border-[#2563EB]/20 whitespace-nowrap">
                            {log.project}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-white max-w-[200px] truncate">{log.task}</td>
                        <td className="px-6 py-4 text-[11px] font-medium text-[#94A3B8] whitespace-nowrap">
                          {log.startTime} - {log.endTime}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold font-mono text-white">{formatTimeSeconds(log.durationSeconds)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModalForEdit(log)} className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#232734] rounded-md transition-colors"><Edit3 size={14} /></button>
                            <button onClick={() => handleDelete(log._id)} className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-[20px] bg-[#09090B] border border-[#232734] flex items-center justify-center mb-4 relative">
                  <div className="absolute inset-0 bg-[#2563EB]/10 blur-xl rounded-[20px]"></div>
                  <Clock size={24} className="text-[#2563EB] relative z-10" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No time logged yet</h3>
                <p className="text-sm text-[#94A3B8] max-w-sm mb-6">Start tracking your work using the global timer, or manually log your past hours to see them here.</p>
                <button onClick={openModalForNew} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all">
                  <Plus size={14} /> Log Time Manually
                </button>
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#11131A] border border-[#232734] rounded-[24px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#232734] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{editingLogId ? 'Edit Time Log' : 'Log Time Manually'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-white bg-[#09090B] rounded-xl border border-[#232734] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Project/Client</label>
                  <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="w-full bg-[#09090B] border border-[#232734] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" placeholder="e.g. Acme Corp Redesign" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Task Description</label>
                  <input type="text" value={formData.task} onChange={e => setFormData({...formData, task: e.target.value})} className="w-full bg-[#09090B] border border-[#232734] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" placeholder="e.g. API Integration" required />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#09090B] border border-[#232734] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors [color-scheme:dark]" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Start Time</label>
                    <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full bg-[#09090B] border border-[#232734] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors [color-scheme:dark]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">End Time</label>
                    <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full bg-[#09090B] border border-[#232734] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors [color-scheme:dark]" required />
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[#232734] flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#09090B] text-white border border-[#232734] hover:bg-[#232734] transition-all">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white border border-[#2563EB]/80 shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50 transition-all">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {editingLogId ? 'Save Changes' : 'Save Log'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
