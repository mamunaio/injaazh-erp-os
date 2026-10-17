'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Calendar, 
  Flame, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  Download, 
  Filter, 
  CheckCircle2, 
  History, 
  X, 
  AlertCircle,
  Tag,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  createDailyTask, 
  toggleTaskComplete, 
  deleteDailyTask, 
  getAllTaskHistory 
} from '@/app/actions/taskActions';

interface TaskItem {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: 'High' | 'Medium' | 'Low';
  completed: boolean;
  completedAt?: string | Date;
  dueDate?: string | Date;
  createdAt?: string | Date;
  type?: string;
}

interface TasksClientProps {
  initialTodayTasks: TaskItem[];
  initialHistory: TaskItem[];
  initialStats: {
    totalAll: number;
    totalCompleted: number;
    totalPending: number;
    completedToday: number;
    completionRate: number;
  };
}

const CATEGORIES = [
  'All',
  'Development',
  'Design',
  'Marketplace',
  'Client Work',
  'Finance',
  'Admin',
  'General',
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } },
};

export default function TasksClient({
  initialTodayTasks,
  initialHistory,
  initialStats,
}: TasksClientProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [todayTasks, setTodayTasks] = useState<TaskItem[]>(initialTodayTasks || []);
  const [historyTasks, setHistoryTasks] = useState<TaskItem[]>(initialHistory || []);
  const [stats, setStats] = useState(initialStats);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Quick inline add
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('General');
  const [quickPriority, setQuickPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Modal full task creator
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    dueDate: new Date().toISOString().split('T')[0],
  });
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Quick Inline Add Task
  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim() || isSubmittingQuick) return;

    const titleToAdd = quickTitle.trim();
    setQuickTitle('');
    setIsSubmittingQuick(true);

    const tempId = `temp_${Date.now()}`;
    const optimisticTask: TaskItem = {
      id: tempId,
      _id: tempId,
      title: titleToAdd,
      category: quickCategory,
      priority: quickPriority,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      type: 'Todo',
    };

    setTodayTasks((prev) => [optimisticTask, ...prev]);
    setHistoryTasks((prev) => [optimisticTask, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalAll: prev.totalAll + 1,
      totalPending: prev.totalPending + 1,
      completionRate: Math.round((prev.totalCompleted / (prev.totalAll + 1)) * 100),
    }));

    try {
      const res = await createDailyTask({
        title: titleToAdd,
        category: quickCategory,
        priority: quickPriority,
      });

      if (res.success && res.data) {
        const serverTask = res.data;
        const replaceId = (list: TaskItem[]) =>
          list.map((t) => (t.id === tempId || t._id === tempId ? { ...serverTask, id: serverTask._id } : t));

        setTodayTasks(replaceId);
        setHistoryTasks(replaceId);
        toast.success('Task added to Today\'s Focus!');
      } else {
        toast.error(res.error || 'Failed to create task');
        // Rollback
        setTodayTasks((prev) => prev.filter((t) => t.id !== tempId && t._id !== tempId));
        setHistoryTasks((prev) => prev.filter((t) => t.id !== tempId && t._id !== tempId));
      }
    } catch {
      toast.error('Network error creating task');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Full Modal Add Task
  const handleModalAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.title.trim() || isSubmittingModal) return;

    setIsSubmittingModal(true);
    try {
      const res = await createDailyTask({
        title: modalForm.title.trim(),
        description: modalForm.description.trim(),
        category: modalForm.category,
        priority: modalForm.priority,
        dueDate: modalForm.dueDate,
      });

      if (res.success && res.data) {
        const newTask = { ...res.data, id: res.data._id };
        setTodayTasks((prev) => [newTask, ...prev]);
        setHistoryTasks((prev) => [newTask, ...prev]);
        setStats((prev) => ({
          ...prev,
          totalAll: prev.totalAll + 1,
          totalPending: prev.totalPending + 1,
          completionRate: Math.round((prev.totalCompleted / (prev.totalAll + 1)) * 100),
        }));

        toast.success('Task created successfully!');
        setIsModalOpen(false);
        setModalForm({
          title: '',
          description: '',
          category: 'General',
          priority: 'Medium',
          dueDate: new Date().toISOString().split('T')[0],
        });
      } else {
        toast.error(res.error || 'Failed to create task');
      }
    } catch {
      toast.error('Network error creating task');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Toggle Completion
  const handleToggle = async (task: TaskItem) => {
    const taskId = (task.id || task._id)?.toString() || '';
    const nextCompleted = !task.completed;
    const nowIso = new Date().toISOString();

    const updateItem = (item: TaskItem): TaskItem => {
      const id = (item.id || item._id)?.toString();
      if (id === taskId) {
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? nowIso : undefined,
        };
      }
      return item;
    };

    setTodayTasks((prev) => prev.map(updateItem));
    setHistoryTasks((prev) => prev.map(updateItem));

    // Update stats
    setStats((prev) => {
      const completedDiff = nextCompleted ? 1 : -1;
      const newCompleted = Math.max(0, prev.totalCompleted + completedDiff);
      const newPending = Math.max(0, prev.totalPending - completedDiff);
      const newCompletedToday = Math.max(0, prev.completedToday + completedDiff);
      return {
        ...prev,
        totalCompleted: newCompleted,
        totalPending: newPending,
        completedToday: newCompletedToday,
        completionRate: prev.totalAll > 0 ? Math.round((newCompleted / prev.totalAll) * 100) : 0,
      };
    });

    if (nextCompleted) {
      toast.success('Task completed! Logged in work history.', { icon: '✨' });
    } else {
      toast('Task re-opened and moved to active queue', { icon: '↩️' });
    }

    try {
      if (!taskId.startsWith('temp_') && !taskId.startsWith('proj_') && !taskId.startsWith('mptask_')) {
        await toggleTaskComplete(taskId, nextCompleted);
      }
    } catch {
      toast.error('Failed to sync completion status');
    }
  };

  // Delete Task
  const handleDelete = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setTodayTasks((prev) => prev.filter((t) => (t.id || t._id)?.toString() !== taskId));
    setHistoryTasks((prev) => prev.filter((t) => (t.id || t._id)?.toString() !== taskId));
    toast.success('Task removed');

    try {
      if (!taskId.startsWith('temp_') && !taskId.startsWith('proj_') && !taskId.startsWith('mptask_')) {
        await deleteDailyTask(taskId);
      }
    } catch {
      toast.error('Failed to delete task from server');
    }
  };

  // Export Work Log to CSV
  const handleExportCSV = () => {
    if (historyTasks.length === 0) {
      toast.error('No tasks to export');
      return;
    }

    const headers = ['Title', 'Description', 'Category', 'Priority', 'Status', 'Completed Date', 'Created Date'];
    const rows = historyTasks.map((t) => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.category || 'General'}"`,
      `"${t.priority || 'Medium'}"`,
      t.completed ? 'Completed' : 'In-Flight',
      t.completedAt ? `"${new Date(t.completedAt).toLocaleString()}"` : '""',
      t.createdAt ? `"${new Date(t.createdAt).toLocaleString()}"` : '""',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `injaazh-work-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Work log CSV exported successfully!');
  };

  // Filtered History for Lifetime Log
  const filteredHistory = useMemo(() => {
    return historyTasks.filter((task) => {
      // Category filter
      if (selectedCategory !== 'All' && task.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'pending' && task.completed) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (task.title || '').toLowerCase().includes(q);
        const descMatch = (task.description || '').toLowerCase().includes(q);
        const catMatch = (task.category || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }

      return true;
    });
  }, [historyTasks, selectedCategory, statusFilter, searchQuery]);

  // Group History by Date
  const groupedHistory = useMemo(() => {
    const groups: { [dateLabel: string]: TaskItem[] } = {};

    filteredHistory.forEach((task) => {
      const dateToUse = task.completedAt || task.createdAt || new Date();
      const d = new Date(dateToUse);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (d.toDateString() === today.toDateString()) {
        label = `Today (${label})`;
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = `Yesterday (${label})`;
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(task);
    });

    return groups;
  }, [filteredHistory]);

  // Today's Focus active vs completed
  const activeTodayTasks = todayTasks.filter((t) => !t.completed);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const todayProgress = todayTasks.length > 0 
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 pt-6 pb-24 font-sans selection:bg-[#6324FC] selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6324FC]/10 dark:bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00E5FF]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* ========================================================================= */}
        {/* HEADER SECTION */}
        {/* ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-black/10 dark:border-white/10"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6324FC] dark:text-[#00E5FF] px-2 py-0.5 rounded-full bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 border border-[#6324FC]/20 dark:border-[#00E5FF]/20 flex items-center gap-1 font-bold">
                <Sparkles size={10} /> Daily Sprint & Work Audit
              </span>
              <span className="text-xs text-secondary">•</span>
              <span className="text-xs font-mono text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Work Log & Execution History
            </h1>
            <p className="text-xs md:text-sm text-secondary font-sans mt-0.5">
              Track daily sprint focus, manage to-dos, and inspect lifetime work history with exact timestamps.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-heading font-bold text-slate-800 dark:text-white transition-all flex items-center gap-2"
              title="Download lifetime work history in CSV format"
            >
              <Download size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="relative px-4 py-2 rounded-xl text-xs font-heading font-bold text-white transition-all overflow-hidden group shadow-[0_0_20px_rgba(99,36,252,0.3)] bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Log New Work</span>
            </button>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* EXECUTIVE TELEMETRY KPI CARDS */}
        {/* ========================================================================= */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
        >
          {/* Card 1: Completed Today */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#10B981]/60 hover:shadow-[0_12px_30px_rgba(16,185,129,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            {/* Radial Hover Spotlight */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#10B981]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            {/* Top Accent Neon Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
            {/* Subtle Card Glass Sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] group-hover:border-[#10B981] transition-all duration-300">
                <Flame size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                <Sparkles size={11} /> Today's Velocity
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Completed Today</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#10B981] transition-all">
                {stats.completedToday}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Daily sprint deliverables finished</p>
            </div>
          </motion.div>

          {/* Card 2: In-Flight Pending */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00E5FF]/60 hover:shadow-[0_12px_30px_rgba(0,229,255,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            {/* Radial Hover Spotlight */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            {/* Top Accent Neon Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300">
                <Clock size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-cyan-600 dark:text-[#00E5FF] bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                In Flight
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">In-Flight Today</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-cyan-600 dark:group-hover:text-[#00E5FF] transition-all">
                {activeTodayTasks.length}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Active sprint queue awaiting delivery</p>
            </div>
          </motion.div>

          {/* Card 3: Total Lifetime Completed */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#6324FC]/60 hover:shadow-[0_12px_30px_rgba(99,36,252,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            {/* Radial Hover Spotlight */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            {/* Top Accent Neon Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300">
                <CheckCircle2 size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-purple-600 dark:text-purple-300 bg-[#6324FC]/15 px-2 py-0.5 rounded-md border border-[#6324FC]/30 group-hover:border-[#6324FC]/50 transition-colors">
                Verified Log
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Lifetime Completed</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] transition-all">
                {stats.totalCompleted}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Verified historical work records</p>
            </div>
          </motion.div>

          {/* Card 4: Lifetime Efficiency */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F59E0B]/60 hover:shadow-[0_12px_30px_rgba(245,158,11,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            {/* Radial Hover Spotlight */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F59E0B]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            {/* Top Accent Neon Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover:border-[#F59E0B] transition-all duration-300">
                <TrendingUp size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                Efficiency
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Completion Rate</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#F59E0B] transition-all">
                {stats.completionRate}%
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Out of {stats.totalAll} total logged tasks</p>
            </div>
          </motion.div>
        </motion.div>

        {/* ========================================================================= */}
        {/* VIEW SELECTOR & MAIN CONTROLS */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-200/50 dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#060608] rounded-xl border border-black/5 dark:border-white/5">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-2 ${
                activeTab === 'today'
                  ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.4)]'
                  : 'text-secondary hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare size={14} />
              <span>Today's Sprint Focus ({todayTasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.4)]'
                  : 'text-secondary hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History size={14} />
              <span>Lifetime Work Log ({historyTasks.length})</span>
            </button>
          </div>

          <Link
            href="/dashboard"
            className="text-xs font-heading font-semibold text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors flex items-center gap-1 px-3 py-1.5"
          >
            <span>Back to Dashboard</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TODAY'S SPRINT FOCUS (REALTIME TO-DO LIST) */}
        {/* ========================================================================= */}
        {activeTab === 'today' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Quick Add Form Banner */}
            <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-md dark:shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse" />
                  <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Quick Sprint Input
                  </h3>
                </div>
                {todayTasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-secondary">
                      {completedTodayTasks.length}/{todayTasks.length} Done ({todayProgress}%)
                    </span>
                    <div className="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] transition-all duration-500"
                        style={{ width: `${todayProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="What is your immediate priority or deliverable for today? Press Enter..."
                  className="flex-1 w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-xs text-slate-900 dark:text-white rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as any)}
                    className="bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-xs text-slate-900 dark:text-white rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                  >
                    <option value="High">High 🔴</option>
                    <option value="Medium">Medium 🟡</option>
                    <option value="Low">Low 🟢</option>
                  </select>

                  <button
                    type="submit"
                    disabled={!quickTitle.trim() || isSubmittingQuick}
                    className="px-4 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] disabled:opacity-40 text-white text-xs font-heading font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,36,252,0.4)]"
                  >
                    <Plus size={14} />
                    <span>Add Task</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Today's Two-Column Layout: Active vs Completed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Active Tasks Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6324FC] dark:bg-[#00E5FF]" />
                    In-Flight Queue ({activeTodayTasks.length})
                  </h3>
                  <span className="text-[11px] font-mono text-secondary">Awaiting completion</span>
                </div>

                <div className="space-y-2.5">
                  {activeTodayTasks.length > 0 ? (
                    activeTodayTasks.map((task) => {
                      const taskId = (task.id || task._id)?.toString() || '';
                      return (
                        <motion.div
                          key={taskId}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 transition-all flex items-start gap-3 group shadow-sm"
                        >
                          {/* Complete Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(task)}
                            className="w-5 h-5 mt-0.5 rounded-md border border-black/20 dark:border-white/20 hover:border-[#6324FC] dark:hover:border-[#00E5FF] hover:bg-[#6324FC]/10 dark:hover:bg-[#00E5FF]/10 flex items-center justify-center shrink-0 transition-all text-transparent hover:text-slate-800 dark:hover:text-white/60"
                            title="Mark as Completed"
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs md:text-sm font-heading font-semibold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors leading-snug">
                                {task.title}
                              </p>
                              {task.priority && (
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                                    task.priority === 'High'
                                      ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20'
                                      : task.priority === 'Medium'
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-xs text-secondary font-sans mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-secondary">
                              <span className="flex items-center gap-1 text-secondary">
                                <Tag size={10} /> {task.category || 'General'}
                              </span>
                              {task.createdAt && (
                                <span className="flex items-center gap-1 text-secondary">
                                  <Clock size={10} /> {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(taskId, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-all shrink-0"
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center p-6 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-2">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-sm font-heading font-bold text-slate-900 dark:text-white mb-1">Queue is Clear!</p>
                      <p className="text-xs font-sans text-secondary max-w-[240px] leading-relaxed">
                        All planned focus tasks for today are completed. Add a new task above to keep building momentum.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Today Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-heading font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Done Today ({completedTodayTasks.length})
                  </h3>
                  <span className="text-[11px] font-mono text-secondary">Logged in work log</span>
                </div>

                <div className="space-y-2.5">
                  {completedTodayTasks.length > 0 ? (
                    completedTodayTasks.map((task) => {
                      const taskId = (task.id || task._id)?.toString() || '';
                      return (
                        <motion.div
                          key={taskId}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-[#0a0a0d]/60 border border-black/5 dark:border-white/5 opacity-90 hover:opacity-100 transition-all flex items-start gap-3 group"
                        >
                          {/* Completed Green Badge Button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(task)}
                            className="w-5 h-5 mt-0.5 rounded-md bg-emerald-500 text-white dark:text-black shadow-[0_0_10px_#10B981] flex items-center justify-center shrink-0 transition-all"
                            title="Click to re-open task"
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs md:text-sm font-heading font-semibold text-secondary line-through">
                              {task.title}
                            </p>

                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400/80">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 size={10} /> Finished at{' '}
                                {task.completedAt
                                  ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Today'}
                              </span>
                              <span className="text-secondary">• {task.category || 'General'}</span>
                            </div>
                          </div>

                          {/* Re-open / Delete */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              type="button"
                              onClick={() => handleToggle(task)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="Re-open task"
                            >
                              <RotateCcw size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(taskId, e)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 bg-slate-100/50 dark:bg-[#0a0a0d]/40 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center p-6">
                      <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary mb-2">
                        <Clock size={20} />
                      </div>
                      <p className="text-sm font-heading font-bold text-slate-900 dark:text-white mb-1">No Completed Tasks Yet</p>
                      <p className="text-xs font-sans text-secondary max-w-[240px] leading-relaxed">
                        Check off tasks from your In-Flight queue to record completed deliverables today.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIFETIME WORK HISTORY & LOG (আজ পর্যন্ত করা সব কাজের হিস্ট্রি) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search & Filter Controls */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search work history by title, description or tag..."
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-slate-900 dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                    statusFilter === 'all' ? 'bg-[#6324FC] text-white shadow-sm' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({historyTasks.length})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                    statusFilter === 'completed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Completed ({stats.totalCompleted})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                    statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  In-Flight ({stats.totalPending})
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#6324FC] text-white shadow-md'
                      : 'bg-white dark:bg-[#0a0a0d] text-secondary hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grouped Chronological Work Log Timeline */}
            <div className="space-y-6">
              {Object.keys(groupedHistory).length > 0 ? (
                Object.entries(groupedHistory).map(([dateLabel, items]) => (
                  <div key={dateLabel} className="space-y-3">
                    {/* Date Header Stamp */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 text-[#6324FC] dark:text-[#00E5FF] text-xs font-mono font-bold">
                        <Calendar size={12} />
                        <span>{dateLabel}</span>
                      </div>
                      <div className="flex-1 h-[1px] bg-black/10 dark:bg-white/10" />
                      <span className="text-[11px] font-mono text-secondary">
                        {items.length} task{items.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Tasks in Date Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((task) => {
                        const taskId = (task.id || task._id)?.toString() || '';
                        const isDone = !!task.completed;

                        return (
                          <div
                            key={taskId}
                            className={`p-4 rounded-2xl border transition-all relative overflow-hidden group shadow-sm ${
                              isDone
                                ? 'bg-white dark:bg-[#0a0a0d] border-black/10 dark:border-white/10 hover:border-emerald-500/40'
                                : 'bg-white dark:bg-[#0a0a0d] border-black/10 dark:border-[#00E5FF]/20 hover:border-[#6324FC] dark:hover:border-[#00E5FF]/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggle(task)}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                                    isDone
                                      ? 'bg-emerald-500 text-white dark:text-black shadow-[0_0_8px_#10B981]'
                                      : 'border border-black/20 dark:border-white/20 hover:border-[#6324FC] dark:hover:border-[#00E5FF] text-transparent hover:text-slate-800 dark:hover:text-white/60'
                                  }`}
                                >
                                  <Check size={12} strokeWidth={3} />
                                </button>
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                  task.category === 'Development'
                                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                    : task.category === 'Marketplace'
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                    : task.category === 'Client Work'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    : task.category === 'Finance'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-black/5 dark:bg-white/5 text-secondary border border-black/10 dark:border-white/10'
                                }`}>
                                  {task.category || 'General'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {task.priority && (
                                  <span
                                    className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                                      task.priority === 'High'
                                        ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20'
                                        : task.priority === 'Medium'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(taskId, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                                  title="Delete Record"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <p className={`text-xs md:text-sm font-heading font-semibold leading-snug ${
                              isDone ? 'text-secondary line-through' : 'text-slate-900 dark:text-white'
                            }`}>
                              {task.title}
                            </p>

                            {task.description && (
                              <p className="text-xs text-secondary font-sans mt-1.5 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Timestamp Footer */}
                            <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-secondary">
                              <span className="flex items-center gap-1 text-secondary">
                                <Clock size={10} /> Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}
                              </span>

                              {task.completed && task.completedAt && (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                                  <CheckCircle2 size={10} /> Completed: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/10 dark:border-white/10 flex flex-col items-center justify-center p-6 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary mb-3">
                    <Search size={22} />
                  </div>
                  <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-1">No Matching Work Records</h3>
                  <p className="text-xs font-sans text-secondary max-w-sm leading-relaxed">
                    No task records match your current search query or filter criteria. Try resetting filters or log a new work item.
                  </p>
                  {(searchQuery || selectedCategory !== 'All' || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                        setStatusFilter('all');
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-heading font-bold text-slate-900 dark:text-white transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* LOG NEW WORK MODAL */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div>
                    <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      Log Task or Work Deliverable
                    </h2>
                    <p className="text-xs font-sans text-secondary mt-0.5">
                      Add to today's focus and permanent audit history.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleModalAdd} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Task Title / Focus Item *
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.title}
                      onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      placeholder="e.g. Deliver Upwork Milestone 2 API backend or UI audit..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Category
                      </label>
                      <select
                        value={modalForm.category}
                        onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                      >
                        {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={modalForm.priority}
                        onChange={(e) => setModalForm({ ...modalForm, priority: e.target.value as any })}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                      >
                        <option value="High">High 🔴</option>
                        <option value="Medium">Medium 🟡</option>
                        <option value="Low">Low 🟢</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Detailed Notes / Checklist Context
                    </label>
                    <textarea
                      rows={3}
                      value={modalForm.description}
                      onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                      placeholder="Optional notes, requirements or references..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none resize-none"
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/10 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!modalForm.title.trim() || isSubmittingModal}
                      className="px-5 py-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] disabled:opacity-50 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>{isSubmittingModal ? 'Saving...' : 'Create Task'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
