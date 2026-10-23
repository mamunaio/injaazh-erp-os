'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Calendar, DollarSign, Activity, Edit3, Trash2, Search, X, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { createTimeLog, deleteTimeLog, updateTimeLog, getTimesheetKPIs } from '@/app/actions/timesheetActions';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import { useScrollLock } from '@/lib/useScrollLock';

const BILLABLE_RATE = 25;

export default function TimesheetsClient({ user, initialLogs, initialKpis }: { user: any, initialLogs: any[], initialKpis: any }) {
  const [logs, setLogs] = useState<any[]>(initialLogs || []);
  const [kpis, setKpis] = useState<any>(initialKpis || { today: 0, week: 0, month: 0, billableValue: 0, chartData: [] });
  const { confirm } = useConfirm();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const refreshKpis = async () => {
    const res = await getTimesheetKPIs();
    if (res.success) setKpis(res.data);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  useScrollLock(isModalOpen);
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
    if (e < s) e += 24 * 3600;
    return e - s;
  };

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    logs.forEach(log => {
      const d = new Date(log.date);
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const now = new Date();
    monthSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.date);
      const logMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const matchesMonth = logMonth === selectedMonth;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || log.project?.toLowerCase().includes(q) || log.task?.toLowerCase().includes(q);
      return matchesMonth && matchesSearch;
    });
  }, [logs, selectedMonth, searchQuery]);

  const monthlyTotalSeconds = useMemo(() => filteredLogs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0), [filteredLogs]);
  const monthlyBillable = (monthlyTotalSeconds / 3600) * BILLABLE_RATE;

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return format(d, 'MMMM yyyy');
  };

  const openModalForNew = () => {
    setEditingLogId(null);
    setFormData({ project: '', task: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (log: any) => {
    setEditingLogId(log._id);
    setFormData({ project: log.project, task: log.task, date: format(new Date(log.date), 'yyyy-MM-dd'), startTime: log.startTime, endTime: log.endTime });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project || !formData.task || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill all fields'); return;
    }
    setIsSubmitting(true);
    const durationSeconds = calculateDurationSeconds(formData.startTime, formData.endTime);
    const payload = { project: formData.project, task: formData.task, date: formData.date, startTime: formData.startTime, endTime: formData.endTime, durationSeconds };
    if (editingLogId) {
      const res = await updateTimeLog(editingLogId, payload);
      if (res.success) { toast.success('Log updated!'); setLogs(logs.map(l => l._id === editingLogId ? res.data : l)); refreshKpis(); setIsModalOpen(false); }
      else toast.error(res.error || 'Failed to update log');
    } else {
      const res = await createTimeLog(payload);
      if (res.success) { toast.success('Time logged successfully!'); setLogs([res.data, ...logs]); refreshKpis(); setIsModalOpen(false); }
      else toast.error(res.error || 'Failed to log time');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this log?', danger: true });
    if (!isConfirmed) return;
    const res = await deleteTimeLog(id);
    if (res.success) { toast.success('Log deleted'); setLogs(logs.filter(l => l._id !== id)); refreshKpis(); }
    else toast.error('Failed to delete log');
  };

  const kpiCards = [
    { label: 'Hours Today', value: formatTimeSeconds(kpis.today), color: '#6324FC', icon: Clock },
    { label: 'This Week', value: formatTimeSeconds(kpis.week), color: '#00E5FF', icon: Calendar },
    { label: 'This Month', value: formatTimeSeconds(kpis.month), color: '#10B981', icon: Activity },
    { label: 'Billable Value', value: `$${kpis.billableValue.toFixed(2)}`, color: '#F59E0B', icon: DollarSign },
  ];

  const chartData: any[] = kpis.chartData || [];
  const globalMax = Math.max(0.1, ...chartData.map((d: any) => d.hours));
  const totalSevenDaySeconds = chartData.reduce((s: number, d: any) => s + (d.hours * 3600), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] p-4 md:p-8 selection:bg-[#6324FC]/30">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                <Clock size={16} />
              </div>
              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Time Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Timesheets</h1>
            <p className="text-xs text-secondary font-medium">Track, review, and manage your logged work hours.</p>
          </div>
          <button onClick={openModalForNew} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white shadow-[0_0_20px_rgba(99,36,252,0.4)] transition-all">
            <Plus size={15} strokeWidth={2.5} /> Log Time Manually
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => {
            const dummyData = [10, 20, 15, 25, 20, 30, 40].map((v) => ({ val: v + (Math.random() * 10 - 5) }));
            return (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                key={i}
                className="relative bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 lg:p-6 flex flex-col justify-center overflow-hidden transition-all duration-200 shadow-sm group hover:border-[#6324FC]/40"
              >
                {/* Recharts Area Wave */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dummyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Area type="monotone" dataKey="val" stroke={kpi.color} strokeWidth={2} fill={kpi.color} fillOpacity={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Edge Glow */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-300 rounded-b-full pointer-events-none"
                  style={{ backgroundColor: kpi.color, boxShadow: `0 4px 15px ${kpi.color}` }}
                />

                <div className="flex items-start justify-between mb-3 relative z-10">
                  <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">{kpi.label}</p>
                  <div className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 flex items-center justify-center" style={{ color: kpi.color }}>
                    <kpi.icon size={13} />
                  </div>
                </div>
                <p className="text-2xl font-heading font-extrabold font-mono text-slate-900 dark:text-white relative z-10">{kpi.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Last 7 Days Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
              <h2 className="text-xs font-heading font-extrabold text-secondary uppercase tracking-widest">Last 7 Days Activity</h2>
            </div>
            <span className="text-xs text-secondary">
              7-day total: <span className="text-slate-900 dark:text-white font-bold font-mono">{formatTimeSeconds(totalSevenDaySeconds)}</span>
            </span>
          </div>
          <div className="flex items-end gap-3" style={{ height: 130 }}>
            {chartData.map((d: any, i: number) => {
              const heightPercent = d.hours > 0 ? Math.max((d.hours / globalMax) * 100, 6) : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group cursor-default h-full">
                  <div className="h-4 flex items-end justify-center shrink-0">
                    {d.hours > 0 && (
                      <span className="text-[10px] font-mono font-bold text-secondary group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors leading-none">
                        {d.hours}h
                      </span>
                    )}
                  </div>
                  <div className="w-full flex-1 relative flex items-end bg-slate-50 dark:bg-[#060608] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                    {d.hours > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.07 + 0.2, ease: 'easeOut' }}
                        className="w-full bg-gradient-to-t from-[#6324FC] to-[#00E5FF] group-hover:brightness-110 transition-all rounded-t-lg"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-heading font-bold text-secondary group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0">{d.day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Detailed Log Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-black/5 dark:border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Detailed Log</h2>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Month Filter */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 hover:border-[#6324FC]/40 transition-colors">
                  <Filter size={12} className="text-secondary shrink-0" />
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-heading font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m} className="bg-white dark:bg-[#0a0a0d] text-slate-900 dark:text-white">{formatMonthLabel(m)}</option>
                    ))}
                  </select>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text" placeholder="Search logs..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-44 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-slate-900 dark:hover:text-white">
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {filteredLogs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-[#060608]/50 border-b border-black/5 dark:border-white/5">
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Date</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Project/Client</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Task Description</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Time</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right">Duration</th>
                      <th className="px-5 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log._id}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-5 py-3.5 text-xs font-mono text-secondary whitespace-nowrap">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] text-[11px] font-heading font-bold border border-[#6324FC]/20 whitespace-nowrap">
                            {log.project}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-800 dark:text-slate-200 max-w-[220px] truncate">{log.task}</td>
                        <td className="px-5 py-3.5 text-xs font-mono text-secondary whitespace-nowrap">{log.startTime} – {log.endTime}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-xs font-heading font-bold font-mono text-slate-900 dark:text-white">{formatTimeSeconds(log.durationSeconds)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModalForEdit(log)} className="p-1.5 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] rounded-lg transition-colors"><Edit3 size={13} /></button>
                            <button onClick={() => handleDelete(log._id)} className="p-1.5 text-secondary hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Monthly Summary Footer */}
              <div className="px-5 py-3.5 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-[#060608]/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-secondary" />
                    <span className="text-xs font-heading font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {formatMonthLabel(selectedMonth)}
                    </span>
                    <span className="text-xs text-secondary">— {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <span className="text-[11px] text-secondary">Total Time:</span>
                      <span className="text-xs font-heading font-bold font-mono text-slate-900 dark:text-white">{formatTimeSeconds(monthlyTotalSeconds)}</span>
                    </div>
                    <div className="w-px h-3.5 bg-black/10 dark:bg-white/10" />
                    <div className="flex items-center gap-2">
                      <DollarSign size={12} className="text-amber-500" />
                      <span className="text-[11px] text-secondary">Billable:</span>
                      <span className="text-xs font-heading font-bold font-mono text-amber-600 dark:text-amber-400">${monthlyBillable.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-3.5 bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] text-secondary">@ ${BILLABLE_RATE}/hr</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center mb-3">
                <Clock size={20} className="text-[#6324FC] dark:text-[#00E5FF]" />
              </div>
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white mb-1">
                {searchQuery ? 'No matching logs' : `No logs for ${formatMonthLabel(selectedMonth)}`}
              </h3>
              <p className="text-xs text-secondary max-w-sm mb-4">
                {searchQuery ? 'Try a different search term or clear the filter.' : 'Log time manually or use the tracker to record hours.'}
              </p>
              {!searchQuery && (
                <button onClick={openModalForNew} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-heading font-bold text-xs bg-slate-100 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-black/10 dark:border-white/10 transition-all">
                  <Plus size={13} /> Log Time Manually
                </button>
              )}
            </div>
          )}
        </motion.div>

      </div>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white">{editingLogId ? 'Edit Time Log' : 'Log Time Manually'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-3.5">
                <div>
                  <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Project/Client</label>
                  <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="e.g. Acme Corp Redesign" required />
                </div>
                <div>
                  <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Task Description</label>
                  <input type="text" value={formData.task} onChange={e => setFormData({...formData, task: e.target.value})} className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" placeholder="e.g. API Integration" required />
                </div>
                <div>
                  <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Date</label>
                  <DatePicker
                    selected={new Date(formData.date + 'T00:00:00')}
                    onChange={(date: Date | null) => setFormData({...formData, date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')})}
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                    dateFormat="MMMM d, yyyy" required popperPlacement="bottom-start" popperClassName="z-[60]"
                    renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                      <div className="flex justify-between items-center mb-3 px-2">
                        <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="text-secondary hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-md transition-colors"><ChevronLeft size={14} /></button>
                        <div className="text-slate-900 dark:text-white font-heading font-bold text-xs">{format(date, 'MMMM yyyy')}</div>
                        <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="text-secondary hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-md transition-colors"><ChevronRight size={14} /></button>
                      </div>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">Start Time</label>
                    <DatePicker
                      selected={new Date(`${formData.date}T${formData.startTime}:00`)}
                      onChange={(date: Date | null) => setFormData({...formData, startTime: date ? format(date, 'HH:mm') : formData.startTime})}
                      showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                      required popperPlacement="bottom-start" popperClassName="z-[60]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">End Time</label>
                    <DatePicker
                      selected={new Date(`${formData.date}T${formData.endTime}:00`)}
                      onChange={(date: Date | null) => setFormData({...formData, endTime: date ? format(date, 'HH:mm') : formData.endTime})}
                      showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                      required popperPlacement="bottom-start" popperClassName="z-[60]"
                    />
                  </div>
                </div>
                <div className="pt-3 mt-4 border-t border-black/5 dark:border-white/5 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl font-heading font-bold text-xs bg-slate-100 dark:bg-white/5 text-secondary hover:text-slate-900 dark:hover:text-white transition-all">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] text-white hover:brightness-110 shadow-[0_0_15px_rgba(99,36,252,0.4)] disabled:opacity-50 transition-all">
                    {isSubmitting && <Loader2 size={13} className="animate-spin" />}
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
