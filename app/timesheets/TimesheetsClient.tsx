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
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ project: '', task: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isModalOpen]);

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
    { label: 'Hours Today', value: formatTimeSeconds(kpis.today), color: '#2563EB', icon: Clock },
    { label: 'This Week', value: formatTimeSeconds(kpis.week), color: '#7C3AED', icon: Calendar },
    { label: 'This Month', value: formatTimeSeconds(kpis.month), color: '#10B981', icon: Activity },
    { label: 'Billable Value', value: `$${kpis.billableValue.toFixed(2)}`, color: '#F59E0B', icon: DollarSign },
  ];

  const chartData: any[] = kpis.chartData || [];
  const globalMax = Math.max(0.1, ...chartData.map((d: any) => d.hours));
  const totalSevenDaySeconds = chartData.reduce((s: number, d: any) => s + (d.hours * 3600), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
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
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Timesheets</h1>
            <p className="text-sm font-medium text-[#94A3B8]">Track, review, and manage your logged hours.</p>
          </div>
          <button onClick={openModalForNew} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
            <Plus size={16} strokeWidth={2.5} /> Log Time Manually
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
                  className="relative bg-white dark:bg-[#11131A] border border-slate-100 dark:border-[#232734] rounded-[24px] p-6 lg:p-8 flex flex-col justify-center overflow-hidden transition-all duration-300 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] group"
              >
                {/* Subtle Radial Gradient */}
                <div className="absolute inset-0 opacity-0 dark:opacity-20 transition-opacity duration-300 pointer-events-none"
                     style={{ background: `radial-gradient(circle at top right, ${kpi.color}33 0%, transparent 60%)` }} />
                
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

                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <kpi.icon size={100} style={{ color: kpi.color }} />
                </div>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">{kpi.label}</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] flex items-center justify-center" style={{ color: kpi.color }}>
                    <kpi.icon size={14} />
                  </div>
                </div>
                <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white relative z-10">{kpi.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Last 7 Days Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] p-6 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] dark:shadow-none"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#94A3B8]" />
              <h2 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Last 7 Days Activity</h2>
            </div>
            <span className="text-xs text-[#94A3B8]">
              7-day total: <span className="text-slate-900 dark:text-white font-bold font-mono">{formatTimeSeconds(totalSevenDaySeconds)}</span>
            </span>
          </div>
          <div className="flex items-end gap-3" style={{ height: 140 }}>
            {chartData.map((d: any, i: number) => {
              const heightPercent = d.hours > 0 ? Math.max((d.hours / globalMax) * 100, 6) : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group cursor-default h-full">
                  <div className="h-5 flex items-end justify-center shrink-0">
                    {d.hours > 0 && (
                      <span className="text-[10px] font-bold text-[#94A3B8] group-hover:text-[#7C3AED] transition-colors leading-none">
                        {d.hours}h
                      </span>
                    )}
                  </div>
                  <div className="w-full flex-1 relative flex items-end bg-slate-50 dark:bg-[#09090B] rounded-lg border border-[#E2E8F0] dark:border-[#1a1a1a] overflow-hidden">
                    {d.hours > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.07 + 0.2, ease: 'easeOut' }}
                        className="w-full bg-gradient-to-t from-[#2563EB] to-[#7C3AED] group-hover:brightness-110 transition-all"
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#94A3B8] group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0">{d.day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Detailed Log Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] overflow-hidden shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] dark:shadow-none"
        >
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#1a1a1a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Detailed Log</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Month Filter */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-lg px-3 py-2 hover:border-[#2563EB]/40 transition-colors">
                  <Filter size={11} className="text-[#94A3B8] shrink-0" />
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m} className="bg-slate-50 dark:bg-[#111111] text-slate-900 dark:text-white">{formatMonthLabel(m)}</option>
                    ))}
                  </select>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text" placeholder="Search..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-44 bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] text-slate-900 dark:text-white text-xs font-medium rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white">
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
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#09090B] border-b border-[#E2E8F0] dark:border-[#1a1a1a]">
                      <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Date</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Project/Client</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Task Description</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Time</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-right">Duration</th>
                      <th className="px-6 py-3.5 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, idx) => (
                      <tr
                        key={log._id}
                        className={`border-b border-[#E2E8F0]/50 dark:border-[#1a1a1a]/40 transition-colors group hover:bg-slate-50 dark:hover:bg-[#141414] ${idx % 2 !== 0 ? 'bg-slate-50/30 dark:bg-[#09090B]/20' : ''}`}
                      >
                        <td className="px-6 py-4 text-xs font-medium text-[#94A3B8] whitespace-nowrap">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold border border-[#2563EB]/20 whitespace-nowrap">
                            {log.project}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-900 dark:text-white max-w-[220px] truncate">{log.task}</td>
                        <td className="px-6 py-4 text-[11px] font-mono text-[#94A3B8] whitespace-nowrap">{log.startTime} – {log.endTime}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{formatTimeSeconds(log.durationSeconds)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModalForEdit(log)} className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1a1a1a] rounded-md transition-colors"><Edit3 size={13} /></button>
                            <button onClick={() => handleDelete(log._id)} className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Monthly Summary Footer */}
              <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#1a1a1a] bg-slate-50 dark:bg-[#09090B]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-[#94A3B8]" />
                    <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
                      {formatMonthLabel(selectedMonth)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-[#94A3B8]/60">— {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-[#7C3AED]" />
                      <span className="text-[11px] text-[#94A3B8]">Total Time</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{formatTimeSeconds(monthlyTotalSeconds)}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-[#232734]" />
                    <div className="flex items-center gap-2">
                      <DollarSign size={12} className="text-[#F59E0B]" />
                      <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">Billable</span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-[#F59E0B]">${monthlyBillable.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-[#232734]" />
                    <span className="text-[10px] text-slate-400 dark:text-[#94A3B8]/70">@ ${BILLABLE_RATE}/hr</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-[#2563EB]/10 blur-xl rounded-[20px]"></div>
                <Clock size={24} className="text-[#2563EB] relative z-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {searchQuery ? 'No matching logs' : `No logs for ${formatMonthLabel(selectedMonth)}`}
              </h3>
              <p className="text-sm text-[#94A3B8] max-w-sm mb-6">
                {searchQuery ? 'Try a different search term or clear the filter.' : 'Log time manually or use the global timer to track hours.'}
              </p>
              {!searchQuery && (
                <button onClick={openModalForNew} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-[#E2E8F0] dark:border-white/10 transition-all">
                  <Plus size={14} /> Log Time Manually
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[#E2E8F0] dark:border-[#1a1a1a] flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingLogId ? 'Edit Time Log' : 'Log Time Manually'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-[#94A3B8] hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#09090B] rounded-xl border border-[#E2E8F0] dark:border-[#1a1a1a] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Project/Client</label>
                  <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" placeholder="e.g. Acme Corp Redesign" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Task Description</label>
                  <input type="text" value={formData.task} onChange={e => setFormData({...formData, task: e.target.value})} className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors" placeholder="e.g. API Integration" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Date</label>
                  <DatePicker
                    selected={new Date(formData.date + 'T00:00:00')}
                    onChange={(date: Date | null) => setFormData({...formData, date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')})}
                    className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                    dateFormat="MMMM d, yyyy" required popperPlacement="bottom-start" popperClassName="z-[60]"
                    renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                      <div className="flex justify-between items-center mb-4 px-2">
                        <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-800"><ChevronLeft size={16} /></button>
                        <div className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{format(date, 'MMMM yyyy')}</div>
                        <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-800"><ChevronRight size={16} /></button>
                      </div>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">Start Time</label>
                    <DatePicker
                      selected={new Date(`${formData.date}T${formData.startTime}:00`)}
                      onChange={(date: Date | null) => setFormData({...formData, startTime: date ? format(date, 'HH:mm') : formData.startTime})}
                      showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                      required popperPlacement="bottom-start" popperClassName="z-[60]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1.5 uppercase tracking-widest">End Time</label>
                    <DatePicker
                      selected={new Date(`${formData.date}T${formData.endTime}:00`)}
                      onChange={(date: Date | null) => setFormData({...formData, endTime: date ? format(date, 'HH:mm') : formData.endTime})}
                      showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                      className="w-full bg-slate-50 dark:bg-[#09090B] border border-[#E2E8F0] dark:border-[#1a1a1a] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                      required popperPlacement="bottom-start" popperClassName="z-[60]"
                    />
                  </div>
                </div>
                <div className="pt-4 mt-6 border-t border-[#E2E8F0] dark:border-[#1a1a1a] flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-white border border-[#E2E8F0] dark:border-[#1a1a1a] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-all">Cancel</button>
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
