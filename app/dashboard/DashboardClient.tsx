'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  Briefcase, 
  Globe, 
  TrendingUp, 
  Clock, 
  CheckSquare, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight, 
  Search, 
  Bot, 
  RefreshCw, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen, 
  X, 
  Flame, 
  Target, 
  Activity,
  CreditCard,
  CornerDownRight,
  Plus,
  Trash2,
  Check,
  History
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/components/layout/UserContext';
import WorkspaceLoader from '@/components/ui/WorkspaceLoader';
import { getRealtimeAiExecutiveBriefing } from '@/app/actions/aiActions';
import { createDailyTask, toggleTaskComplete, deleteDailyTask } from '@/app/actions/taskActions';

interface DashboardClientProps {
  dashboardData: any;
  islamicQuote: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value || 0;
    return (
      <div className="bg-white/95 dark:bg-[#0a0a0d]/95 border border-black/10 dark:border-[#6324FC]/40 p-3.5 rounded-2xl shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(99,36,252,0.25)] backdrop-blur-2xl min-w-[170px]">
        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1.5 border-b border-black/5 dark:border-white/10">
          <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">{label || payload[0].name}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse shadow-[0_0_6px_#00E5FF]" />
        </div>
        <p className="text-lg font-heading font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val)}
        </p>
        <p className="text-[10px] font-sans text-emerald-500 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-semibold">
          <span>● Verified Inflow</span>
        </p>
      </div>
    );
  }
  return null;
};

const Card = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`glass-card rounded-2xl p-6 lg:p-7 transition-all duration-300 hover:border-white/20 relative overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
};

export default function DashboardClient({ dashboardData, islamicQuote }: DashboardClientProps) {
  const { user, loading } = useUser();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [revenueFilter, setRevenueFilter] = useState<'30days' | '6months' | 'year'>('30days');
  const [currentAiInsights, setCurrentAiInsights] = useState<string>(dashboardData?.aiInsights || '');
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'activity'>('transactions');
  const [todayTodoList, setTodayTodoList] = useState<any[]>(dashboardData?.todayTasks || []);
  const [newTodoInput, setNewTodoInput] = useState('');
  const [isSubmittingTodo, setIsSubmittingTodo] = useState(false);
  const router = useRouter();

  const handleAddQuickTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTodoInput.trim() || isSubmittingTodo) return;

    const tempTitle = newTodoInput.trim();
    setNewTodoInput('');
    setIsSubmittingTodo(true);

    const optimisticId = `temp_${Date.now()}`;
    const optimisticItem = {
      id: optimisticId,
      title: tempTitle,
      category: 'General',
      priority: 'Medium',
      completed: false,
      type: 'Todo',
    };
    setTodayTodoList(prev => [optimisticItem, ...prev]);

    try {
      const res = await createDailyTask({ title: tempTitle });
      if (res.success && res.data) {
        setTodayTodoList(prev => prev.map(item => item.id === optimisticId ? {
          id: res.data._id,
          title: res.data.title,
          category: res.data.category,
          priority: res.data.priority,
          completed: res.data.completed,
          type: 'Todo'
        } : item));
        toast.success('Task added to Today\'s Focus!');
      } else {
        toast.error(res.error || 'Failed to add task');
        setTodayTodoList(prev => prev.filter(item => item.id !== optimisticId));
      }
    } catch {
      toast.error('Network error while adding task');
      setTodayTodoList(prev => prev.filter(item => item.id !== optimisticId));
    } finally {
      setIsSubmittingTodo(false);
    }
  };

  const handleToggleTodo = async (task: any) => {
    const nextCompleted = !task.completed;
    setTodayTodoList(prev => prev.map(t => t.id === task.id ? { ...t, completed: nextCompleted } : t));
    
    if (nextCompleted) {
      toast.success('Task marked completed! Logged in work history.', { icon: '✨' });
    }

    try {
      if (task.type === 'Todo' && !task.id.startsWith('proj_') && !task.id.startsWith('mptask_') && !task.id.startsWith('temp_')) {
        await toggleTaskComplete(task.id, nextCompleted);
      }
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTodo = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodayTodoList(prev => prev.filter(t => t.id !== taskId));
    toast.success('Task removed');
    try {
      if (!taskId.startsWith('proj_') && !taskId.startsWith('mptask_') && !taskId.startsWith('temp_')) {
        await deleteDailyTask(taskId);
      }
    } catch {
      // ignore
    }
  };

  // Quick Action Modal form state
  const [quickForm, setQuickForm] = useState({
    title: '',
    category: 'Project',
    amount: '',
    type: 'Income',
    priority: 'High',
    assignee: 'Mamun H.',
    description: '',
  });

  const handleRefreshAiBriefing = async () => {
    if (isRefreshingAi) return;
    setIsRefreshingAi(true);
    toast.loading('Synthesizing executive intelligence with Gemini AI...', { id: 'ai-refresh' });
    try {
      const res = await getRealtimeAiExecutiveBriefing();
      if (res.success && res.text) {
        setCurrentAiInsights(res.text);
        toast.success('Executive briefing updated!', { id: 'ai-refresh' });
      } else {
        toast.error('Failed to generate fresh AI briefing', { id: 'ai-refresh' });
      }
    } catch {
      toast.error('Failed to refresh AI briefing', { id: 'ai-refresh' });
    } finally {
      setIsRefreshingAi(false);
    }
  };

  const handleLaunchCopilotWithPrompt = (promptText: string) => {
    window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { initialPrompt: promptText } }));
  };

  const closeModal = () => {
    setActiveModal(null);
    setQuickForm({
      title: '',
      category: 'Project',
      amount: '',
      type: 'Income',
      priority: 'High',
      assignee: 'Mamun H.',
      description: '',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#060608] flex items-center justify-center">
        <WorkspaceLoader />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060608] p-8 flex items-center justify-center text-slate-900 dark:text-white">
        <Card className="text-center p-12 max-w-md w-full border-rose-500/30 bg-white dark:bg-[#0a0a0d]">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">Connection Interrupted</h2>
          <p className="text-xs font-sans text-secondary mb-6">Failed to load real-time telemetry from enterprise database.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-5 py-2.5 rounded-lg bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-heading font-bold transition-all shadow-[0_0_20px_rgba(99,36,252,0.4)]"
          >
            Retry Connection
          </button>
        </Card>
      </div>
    );
  }

  const { 
    stats, 
    revenueTrend30Days, 
    revenueTrend6Months, 
    revenueTrendYear, 
    projectStatusDistribution, 
    platformIncome,
    upcomingDeadlines,
    recentMarketplaceProjects,
    recentTransactions,
    todayTasks,
    recentActivity
  } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Timeframe chart dataset selector
  const chartData = revenueFilter === '30days' 
    ? revenueTrend30Days 
    : revenueFilter === '6months' 
    ? revenueTrend6Months 
    : revenueTrendYear;

  const chartTotal = chartData?.reduce((acc: number, item: any) => acc + (item.Income || 0), 0) || 0;
  const chartAvg = chartData?.length ? Math.round(chartTotal / chartData.length) : 0;
  const chartPeak = Math.max(...(chartData?.map((item: any) => item.Income || 0) || [0]));

  // Platform breakdown calculation
  const totalPlatformVolume = Object.values(platformIncome || {}).reduce((acc: number, val: any) => acc + (val || 0), 0) as number;
  const platformEntries = [
    { name: 'Upwork', amount: platformIncome?.Upwork || 0, color: '#00E5FF' },
    { name: 'Fiverr', amount: platformIncome?.Fiverr || 0, color: '#10B981' },
    { name: 'Direct Clients', amount: platformIncome?.Direct || 0, color: '#6324FC' },
    { name: 'Freelancer', amount: platformIncome?.Freelancer || 0, color: '#F59E0B' },
  ].sort((a, b) => b.amount - a.amount);

  return (
    <div className="min-h-screen text-primary font-sans selection:bg-[#6324FC]/30 overflow-x-hidden pb-16">
      
      <motion.div 
        className="max-w-[1680px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* ========================================================================= */}
        {/* EXECUTIVE HEADER & LIVE TELEMETRY BAR */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10 pb-2 border-b border-black/5 dark:border-white/5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-heading font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#6324FC] dark:shadow-[0_0_8px_#00E5FF]" />
                INJAAZH GLOBAL OS // EXECUTIVE SUITE
              </div>
              <span className="text-xs font-sans text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-[#edeae2] dark:to-[#888888]">{user?.name?.split(' ')[0] || 'Mamun'}</span>
            </h1>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Command shortcut button */}
            <button 
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all group"
            >
              <Search size={14} className="group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors" />
              <span>Command</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[10px] font-mono text-secondary">⌘K</kbd>
            </button>

            {/* Quick Record Modal */}
            <button 
              onClick={() => setActiveModal('Record Transaction')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 text-slate-900 dark:text-white text-xs font-heading font-semibold transition-all group shadow-sm"
            >
              <CreditCard size={14} className="text-[#6324FC] group-hover:scale-110 transition-transform" />
              <span>Record Entry</span>
            </button>

            {/* AI Copilot Dispatch */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-sm"
            >
              <Bot size={14} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* New Project (Ultra-Smooth 360-Degree Laser Border Beam CTA) */}
            <button 
              onClick={() => router.push('/projects')}
              className="group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)]"
            >
              {/* Ambient Glow Beam Layer */}
              <span 
                className="absolute top-1/2 left-1/2 w-[350%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-neon-border blur-[8px] opacity-80 pointer-events-none" 
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #6324FC 120deg, #00E5FF 180deg, #EC4899 240deg, transparent 300deg)'
                }}
              />
              
              {/* Sharp Crisp Laser Beam Layer */}
              <span 
                className="absolute top-1/2 left-1/2 w-[350%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-neon-border opacity-100 pointer-events-none" 
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #6324FC 120deg, #00E5FF 180deg, #EC4899 240deg, transparent 300deg)'
                }}
              />
              
              {/* Inner Luxury Surface */}
              <div className="relative z-10 px-4 py-2 rounded-[9px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-colors">
                <Briefcase size={14} className="text-[#6324FC] dark:text-[#00E5FF] group-hover:rotate-6 transition-transform" />
                <span className="tracking-wide">+ New Project</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* EXECUTIVE KPI METRIC CARDS (COMMAND CENTER) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2.5">
              <Activity size={16} className="text-[#6324FC]" /> High-Level Executive Telemetry
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span>Live Engine Connected</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            
            {/* Metric 1: Monthly Revenue */}
            <div 
              onClick={() => router.push('/finance')} 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
              {/* Subtle Card Glass Sheen */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300 shadow-sm">
                  <DollarSign size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> +{stats?.monthlyGrowth || 0}%
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Revenue This Month</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {formatCurrency(stats?.thisMonthIncome || 0)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Total Inflow: {formatCurrency(stats?.totalIncome || 0)}</p>
              </div>
            </div>

            {/* Metric 2: Active In-Flight Projects */}
            <div 
              onClick={() => router.push('/projects')} 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
                  <Briefcase size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-1 rounded-lg border border-[#00E5FF]/20 group-hover:border-[#00E5FF]/40 transition-colors">
                  In Flight
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Active Operations</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#00E5FF] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {stats?.activeProjects || 0}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Total Pipelines: {stats?.totalProjects || 0}</p>
              </div>
            </div>

            {/* Metric 3: Marketplace Client Portfolio */}
            <div 
              onClick={() => router.push('/marketplace/clients')} 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-emerald-400 transition-all duration-300 shadow-sm">
                  <Globe size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  Marketplace
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Active Client Base</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-emerald-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-emerald-400 transition-all">
                  {stats?.activeClients || 0}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Global Accounts Roster</p>
              </div>
            </div>

            {/* Metric 4: Milestone Escrow Vault */}
            <div 
              onClick={() => router.push('/marketplace')} 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/60 hover:shadow-[0_16px_36px_rgba(245,158,11,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] group-hover:border-amber-400 transition-all duration-300 shadow-sm">
                  <Layers size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                  Escrow Vault
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Milestones Locked</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-amber-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-amber-400 transition-all">
                  {formatCurrency(stats?.pendingMilestoneValue || 0)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Awaiting Delivery Approval</p>
              </div>
            </div>

            {/* Metric 5: Sprint Deadlines Due */}
            <div 
              onClick={() => router.push('/roadmap')} 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-rose-500/60 hover:shadow-[0_16px_36px_rgba(244,63,94,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-rose-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F43F5E]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] group-hover:border-rose-400 transition-all duration-300 shadow-sm">
                  <Flame size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                  7-Day Sprint
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Pending Deliverables</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-rose-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-rose-400 transition-all">
                  {stats?.pendingTasks || upcomingDeadlines?.length || 0}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Critical Milestones Due</p>
              </div>
            </div>

            {/* Metric 6: Net Realized Profit */}
            <div 
              onClick={() => router.push('/finance')} 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              {/* Radial Hover Spotlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              {/* Top Accent Neon Line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
                  <TrendingUp size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  Net Solid
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Net Realized Profit</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#00E5FF] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {formatCurrency(stats?.netProfit || 0)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Gross - Total Expenses</p>
              </div>
            </div>

          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* MAIN COCKPIT: 2-COLUMN LUXURY GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
          
          {/* LEFT 8 COLUMNS: REVENUE TRAJECTORY & OPERATIONAL WORKFLOW */}
          <div className="xl:col-span-8 space-y-6 min-w-0">
            
            {/* CASH FLOW TRAJECTORY CHART */}
            <motion.div variants={itemVariants}>
              <Card className="p-6 relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 hover:border-[#6324FC]/40 transition-all shadow-xl dark:shadow-2xl">
                {/* Ambient Radial Backlights */}
                <div className="absolute -top-20 right-1/4 w-80 h-80 bg-[#6324FC]/15 blur-[65px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-20 left-10 w-80 h-80 bg-[#00E5FF]/10 blur-[65px] rounded-full pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent opacity-80" />

                {/* Card Header & Controls */}
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 relative z-10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] shadow-[0_0_8px_#6324FC] dark:shadow-[0_0_8px_#00E5FF] animate-pulse" />
                        <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Financial Velocity & Cash Flow Trajectory
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#6324FC]/15 border border-[#6324FC]/30 text-[#6324FC] dark:text-[#00E5FF] text-[9px] font-mono font-bold tracking-widest uppercase">
                        Real-time Inflow Stream
                      </span>
                    </div>
                    <p className="text-xs font-sans text-secondary">
                      Comprehensive telemetry of gross receipts, client retainers, and milestone payouts across selected timeline.
                    </p>
                  </div>
                  
                  {/* Timeframe Switcher Controls */}
                  <div className="flex items-center gap-2 self-start lg:self-auto">
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-[#060608] border border-black/5 dark:border-white/10 rounded-xl shadow-inner">
                      {(['30days', '6months', 'year'] as const).map((filterKey) => (
                        <button
                          key={filterKey}
                          onClick={() => setRevenueFilter(filterKey)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                            revenueFilter === filterKey 
                              ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.6)]' 
                              : 'text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {filterKey === '30days' ? '30 Days' : filterKey === '6months' ? '6 Months' : '1 Year'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Area Chart Canvas */}
                <div className="h-[310px] w-full -ml-3 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevBrutalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.45}/>
                          <stop offset="35%" stopColor="#6324FC" stopOpacity={0.25}/>
                          <stop offset="100%" stopColor="#6324FC" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-black/5 dark:text-white/5" vertical={false} />
                      <XAxis 
                        dataKey="dateStr" 
                        stroke="#777777" 
                        fontSize={11} 
                        fontWeight={500} 
                        axisLine={false} 
                        tickLine={false} 
                        tickMargin={12} 
                      />
                      <YAxis 
                        stroke="#777777" 
                        fontSize={11} 
                        fontWeight={500} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(val) => `$${val}`} 
                        tickMargin={12} 
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#00E5FF', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                      <Area 
                        type="monotone" 
                        dataKey="Income" 
                        stroke="#00E5FF" 
                        strokeWidth={3} 
                        fill="url(#colorRevBrutalGrad)" 
                        activeDot={{ r: 7, fill: '#00E5FF', stroke: '#060608', strokeWidth: 3 }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Bottom Runway & Run-Rate Analytics Bar (3 Elevated Glass Tiles) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5 mt-3 border-t border-black/5 dark:border-white/5 relative z-10">
                  
                  {/* Tile 1: Timeframe Total */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface/70 border border-black/5 dark:border-white/5 hover:border-[#6324FC]/30 transition-all flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Timeframe Volume</p>
                      <p className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
                        {formatCurrency(chartTotal)}
                      </p>
                      <p className="text-[10px] font-sans text-secondary/60 mt-0.5">Total verified cash inflow</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#6324FC]/15 border border-[#6324FC]/25 flex items-center justify-center text-[#6324FC] group-hover:scale-110 transition-transform">
                      <DollarSign size={16} />
                    </div>
                  </div>

                  {/* Tile 2: Average Inflow Velocity */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface/70 border border-black/5 dark:border-white/5 hover:border-[#00E5FF]/30 transition-all flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Average Pacing</p>
                      <p className="text-base sm:text-lg font-heading font-extrabold text-slate-900 dark:text-[#00E5FF] font-mono mt-0.5">
                        {formatCurrency(chartAvg)}
                      </p>
                      <p className="text-[10px] font-sans text-secondary/60 mt-0.5">Mean inflow per interval</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/25 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform">
                      <TrendingUp size={16} />
                    </div>
                  </div>

                  {/* Tile 3: Peak Surge Velocity */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface/70 border border-black/5 dark:border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group">
                    <div>
                      <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Peak Velocity Surge</p>
                      <p className="text-base sm:text-lg font-heading font-extrabold text-amber-500 dark:text-amber-400 font-mono mt-0.5">
                        {formatCurrency(chartPeak)}
                      </p>
                      <p className="text-[10px] font-sans text-secondary/60 mt-0.5">Highest single interval</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <Flame size={16} />
                    </div>
                  </div>

                </div>
              </Card>
            </motion.div>

            {/* PLATFORM DISTRIBUTION & PIPELINE BREAKDOWN (2 CARDS) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Platform Inflow Distribution */}
              <div className="p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 hover:border-[#00E5FF]/40 transition-colors shadow-md dark:shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF]/70 to-transparent" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                          <Globe size={15} />
                        </div>
                        <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Platform Revenue Share
                        </h3>
                      </div>
                      <p className="text-xs font-sans text-secondary mt-1">
                        Channel volume across marketplace ecosystems.
                      </p>
                    </div>

                    <Link 
                      href="/marketplace" 
                      className="text-xs font-heading font-bold text-[#00E5FF] hover:underline flex items-center gap-1 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 px-2.5 py-1 rounded-lg border border-[#00E5FF]/25 transition-colors"
                    >
                      Hub <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* Multi-Segment Consolidated Track Bar */}
                  <div className="my-4">
                    <div className="flex justify-between text-[10px] font-heading font-bold text-secondary uppercase tracking-wider mb-1.5">
                      <span>Consolidated Volume</span>
                      <span className="text-slate-900 dark:text-white font-mono">{formatCurrency(totalPlatformVolume)}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/5 p-0.5 overflow-hidden flex gap-0.5">
                      {platformEntries.map((platform) => {
                        const percentage = totalPlatformVolume > 0 ? (platform.amount / totalPlatformVolume) * 100 : 25;
                        if (percentage <= 0) return null;
                        return (
                          <div 
                            key={platform.name}
                            className="h-full rounded-full"
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: platform.color,
                            }}
                            title={`${platform.name}: ${formatCurrency(platform.amount)} (${Math.round(percentage)}%)`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Channel Tiles */}
                  <div className="space-y-2.5 mt-4">
                    {platformEntries.map((platform) => {
                      const percentage = totalPlatformVolume > 0 ? Math.round((platform.amount / totalPlatformVolume) * 100) : 0;
                      return (
                        <div 
                          key={platform.name} 
                          onClick={() => router.push('/marketplace')}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/20 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: platform.color }} 
                              />
                              <span className="text-slate-900 dark:text-white font-heading font-bold group-hover:text-[#00E5FF] transition-colors">{platform.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{formatCurrency(platform.amount)}</span>
                              <span 
                                className="text-[10px] font-heading font-bold px-1.5 py-0.5 rounded border"
                                style={{ 
                                  color: platform.color, 
                                  backgroundColor: `${platform.color}15`,
                                  borderColor: `${platform.color}30`
                                }}
                              >
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Channel Micro Progress Meter */}
                          <div className="w-full h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ width: `${percentage}%`, backgroundColor: platform.color }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 2: Production Pipeline Phase Distribution */}
              <div className="p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 hover:border-[#6324FC]/40 transition-colors shadow-md dark:shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6324FC]/70 to-transparent" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC]">
                          <Target size={15} />
                        </div>
                        <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Production Pipeline Status
                        </h3>
                      </div>
                      <p className="text-xs font-sans text-secondary mt-1">
                        Current stage distribution of live initiatives.
                      </p>
                    </div>

                    <Link 
                      href="/projects" 
                      className="text-xs font-heading font-bold text-[#6324FC] hover:underline flex items-center gap-1 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 px-2.5 py-1 rounded-lg border border-[#6324FC]/25 transition-colors"
                    >
                      Projects <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* Summary Metric */}
                  <div className="my-4">
                    <div className="flex justify-between text-[10px] font-heading font-bold text-secondary uppercase tracking-wider mb-1.5">
                      <span>Total Active Initiatives</span>
                      <span className="text-slate-900 dark:text-white font-mono">{stats?.totalProjects || 0} Projects</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/5 p-0.5 overflow-hidden flex gap-0.5">
                      {[
                        { count: projectStatusDistribution?.Planning || 0, color: '#3B82F6' },
                        { count: projectStatusDistribution?.['In Progress'] || 0, color: '#6324FC' },
                        { count: projectStatusDistribution?.['In Review'] || 0, color: '#00E5FF' },
                        { count: projectStatusDistribution?.Completed || 0, color: '#10B981' },
                      ].map((item, idx) => {
                        const total = (projectStatusDistribution?.Planning || 0) + 
                                      (projectStatusDistribution?.['In Progress'] || 0) + 
                                      (projectStatusDistribution?.['In Review'] || 0) + 
                                      (projectStatusDistribution?.Completed || 0);
                        const pct = total > 0 ? (item.count / total) * 100 : 25;
                        if (pct <= 0) return null;
                        return (
                          <div 
                            key={idx}
                            className="h-full rounded-full"
                            style={{ 
                              width: `${pct}%`, 
                              backgroundColor: item.color,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Phase List Tiles */}
                  <div className="space-y-2.5 mt-4">
                    {[
                      { label: 'Planning & Discovery', count: projectStatusDistribution?.Planning || 0, color: '#3B82F6' },
                      { label: 'Active Development', count: projectStatusDistribution?.['In Progress'] || 0, color: '#6324FC' },
                      { label: 'Quality & In Review', count: projectStatusDistribution?.['In Review'] || 0, color: '#00E5FF' },
                      { label: 'Completed & Delivered', count: projectStatusDistribution?.Completed || 0, color: '#10B981' },
                    ].map((phase) => (
                      <div 
                        key={phase.label} 
                        onClick={() => router.push('/projects')}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/20 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: phase.color }} 
                          />
                          <span className="text-xs font-heading font-semibold text-slate-800 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{phase.label}</span>
                        </div>
                        <span 
                          className="text-xs font-heading font-bold font-mono px-2 py-0.5 rounded-md border"
                          style={{ 
                            color: phase.color, 
                            backgroundColor: `${phase.color}15`,
                            borderColor: `${phase.color}30`
                          }}
                        >
                          {phase.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>

            {/* OPERATIONAL SPRINT: ACTIVE DELIVERABLES & DEADLINES (2 TABLES) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Active Marketplace Deliverables */}
              <div className="rounded-2xl overflow-hidden flex flex-col justify-between bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 hover:border-[#00E5FF]/30 transition-all shadow-md dark:shadow-lg relative">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF]/70 to-transparent" />

                <div>
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                          Active Deliverables
                        </h3>
                        <p className="text-[10px] font-sans text-secondary">
                          Client engagements & milestone progress
                        </p>
                      </div>
                    </div>
                    <Link 
                      href="/marketplace" 
                      className="text-[11px] font-heading font-bold text-[#00E5FF] hover:underline flex items-center gap-1 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 px-2.5 py-1 rounded-md border border-[#00E5FF]/25 transition-colors"
                    >
                      Hub <ChevronRight size={12} />
                    </Link>
                  </div>

                  {/* Card Body */}
                  <div className="p-2 divide-y divide-black/5 dark:divide-white/5">
                    {(recentMarketplaceProjects || []).length > 0 ? (
                      recentMarketplaceProjects.slice(0, 4).map((mp: any) => (
                        <div 
                          key={mp._id} 
                          onClick={() => router.push('/marketplace')} 
                          className="p-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#00E5FF] transition-colors truncate">{mp.title}</p>
                            <p className="text-[11px] text-secondary truncate mt-0.5">{mp.clientName || 'Direct Client'} • <span className="text-[#6324FC] font-semibold">{mp.platform}</span></p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-heading font-bold text-slate-900 dark:text-white font-mono">{mp.budget || '$0'}</p>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-heading font-bold uppercase tracking-wider border mt-1 ${
                              mp.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-[#6324FC]/10 text-[#6324FC] border-[#6324FC]/20'
                            }`}>
                              {mp.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] mb-3">
                          <Briefcase size={22} />
                        </div>
                        <p className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-1">Pipeline Roster Clear</p>
                        <p className="text-[11px] font-sans text-secondary max-w-xs leading-relaxed mb-4">
                          No pending deliverables currently in review. You can create a new client project anytime.
                        </p>
                        <button 
                          onClick={() => router.push('/marketplace')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-heading font-bold transition-all flex items-center gap-1.5"
                        >
                          <span>+ New Marketplace Project</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] text-center">
                  <Link href="/marketplace" className="text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1 group">
                    <span>Manage Marketplace Workspace</span>
                    <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Upcoming 7-Day Sprint Deadlines */}
              <div className="rounded-2xl overflow-hidden flex flex-col justify-between bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 hover:border-rose-500/30 transition-all shadow-md dark:shadow-lg relative">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/70 to-transparent" />

                <div>
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Clock size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                          Sprint Deadlines (7 Days)
                        </h3>
                        <p className="text-[10px] font-sans text-secondary">
                          Milestone delivery & sprint timeline
                        </p>
                      </div>
                    </div>
                    <Link 
                      href="/roadmap" 
                      className="text-[11px] font-heading font-bold text-rose-500 dark:text-rose-400 hover:underline flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-md border border-rose-500/25 transition-colors"
                    >
                      Roadmap <ChevronRight size={12} />
                    </Link>
                  </div>

                  {/* Card Body */}
                  <div className="p-2 divide-y divide-black/5 dark:divide-white/5">
                    {(upcomingDeadlines || []).length > 0 ? (
                      upcomingDeadlines.slice(0, 4).map((d: any) => {
                        const dueDate = new Date(d.deadline);
                        const daysLeft = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isUrgent = daysLeft <= 2;

                        return (
                          <div 
                            key={d._id} 
                            onClick={() => router.push('/projects')} 
                            className="p-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-heading font-bold text-slate-900 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors truncate">{d.title}</p>
                              <p className="text-[11px] text-secondary truncate mt-0.5">Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-heading font-bold uppercase tracking-wider border flex-shrink-0 ${
                              isUrgent 
                                ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30 animate-pulse' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}>
                              {daysLeft <= 0 ? 'Today' : `${daysLeft}d remaining`}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-3">
                          <CheckCircle2 size={22} />
                        </div>
                        <p className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-1">Sprint Milestones On Track</p>
                        <p className="text-[11px] font-sans text-secondary max-w-xs leading-relaxed mb-4">
                          No overdue deliverables due in the next 7 days. All sprints are proceeding smoothly.
                        </p>
                        <button 
                          onClick={() => router.push('/roadmap')}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-[11px] font-heading font-bold transition-all flex items-center gap-1.5"
                        >
                          <span>+ View Sprint Roadmap</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] text-center">
                  <Link href="/roadmap" className="text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1 group">
                    <span>Open Sprint Task Board</span>
                    <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

            </motion.div>
          </div>

          {/* RIGHT 4 COLUMNS: AI BRIEFING HUB & EXECUTIVE INTELLIGENCE */}
          <div className="xl:col-span-4 space-y-5">
            
            {/* GEMINI AI EXECUTIVE BRIEFING CARD */}
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl p-5 relative overflow-hidden bg-white dark:bg-[#0a0a0d] border border-[#6324FC]/20 dark:border-[#6324FC]/30 hover:border-[#6324FC]/60 transition-all shadow-lg dark:shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent opacity-90 shadow-[0_0_10px_#6324FC]" />
                
                {/* Header */}
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6324FC]/30 to-[#00E5FF]/20 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center border border-[#6324FC]/40 shadow-[0_0_12px_rgba(99,36,252,0.4)]">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        Executive AI Briefing
                      </h3>
                      <p className="text-[10px] font-sans text-[#6324FC] dark:text-[#00E5FF] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]" />
                        Gemini 2.5 Intelligence Core
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRefreshAiBriefing}
                    disabled={isRefreshingAi}
                    title="Re-analyze business metrics with Gemini"
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 hover:border-[#6324FC] text-[#6324FC] dark:text-[#00E5FF] transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isRefreshingAi ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Briefing Text */}
                <div className="relative z-10 mt-3">
                  <div className="bg-slate-50 dark:bg-[#060608] border-l-2 border-[#6324FC] border-y border-r border-black/5 dark:border-white/5 p-3.5 rounded-r-xl mb-3.5">
                    <p className="text-xs font-sans text-slate-800 dark:text-[#edeae2] leading-relaxed">
                      {currentAiInsights || "Enterprise telemetry indicates steady milestone progress. Maintain cadence on upcoming project deliverables and verify escrow releases."}
                    </p>
                  </div>

                  {/* Quick AI Prompt Pills */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Executive Prompts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Analyze monthly cash runway',
                        'Audit upcoming sprint risks',
                        'Draft marketplace client follow-up',
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          onClick={() => handleLaunchCopilotWithPrompt(promptText)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 hover:border-[#00E5FF]/50 text-[11px] font-sans text-slate-700 dark:text-secondary hover:text-black dark:hover:text-white transition-all text-left flex items-center gap-1.5 group"
                        >
                          <CornerDownRight size={11} className="text-[#6324FC] dark:text-[#00E5FF] group-hover:translate-x-0.5 transition-transform" />
                          <span>{promptText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Full Copilot Launch Button (Continuous 360° Circular Neon Laser Border Beam) */}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                    className="w-full neon-border-wrapper cursor-pointer active:scale-[0.98]"
                  >
                    {/* Ambient Outer Rotating Glow Aura */}
                    <div className="neon-laser-glow" />
                    
                    {/* Ultra-Crisp High-Intensity Rotating Laser Beam */}
                    <div className="neon-laser-beam" />
                    
                    {/* Inner Surface with Glassmorphic Sheen & High-Contrast Accents */}
                    <div className="relative z-10 w-full py-3.5 px-4.5 rounded-[13.5px] bg-white dark:bg-[#07080b] group-hover:bg-slate-50 dark:group-hover:bg-[#0d0f17] flex items-center justify-between transition-all duration-300 shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5FF]/20 via-[#6324FC]/15 to-[#EC4899]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.4)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                          <Bot size={16} className="drop-shadow-[0_0_6px_#00E5FF]" />
                        </div>
                        <span className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                          Launch Full Business Copilot
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#6324FC]/20 via-[#A855F7]/20 to-[#00E5FF]/20 border border-[#6324FC]/40 dark:border-[#00E5FF]/50 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,36,252,0.3)] group-hover:border-[#00E5FF] transition-all">
                        <Sparkles size={11} className="text-[#00E5FF] animate-pulse" />
                        <span>AI PRO</span>
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* DAILY ISLAMIC INSPIRATION / FOUNDER MINDSET */}
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl p-4.5 border border-emerald-500/25 bg-white dark:bg-[#0a0a0d] relative overflow-hidden shadow-md dark:shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent" />
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-emerald-500 dark:text-emerald-400" />
                  <span className="text-[10px] font-heading font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                    Daily Wisdom & Mindset
                  </span>
                </div>
                <p className="text-xs italic text-slate-800 dark:text-[#edeae2] leading-relaxed font-serif">
                  "{islamicQuote?.quote || islamicQuote?.text || 'Indeed, with hardship comes ease. Work with excellence (Ihsan) and trust the journey.'}"
                </p>
                <p className="text-[10px] font-heading text-secondary mt-2 font-semibold text-right">
                  — {islamicQuote?.source || 'Surah Ash-Sharh (94:6)'}
                </p>
              </div>
            </motion.div>

            {/* TODAY'S FOCUS INTERACTIVE TO-DO & WORK LOG WIDGET */}
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl p-5 bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 transition-all shadow-md dark:shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#6324FC]/15 flex items-center justify-center text-[#6324FC]">
                      <CheckSquare size={13} />
                    </div>
                    <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Today's Focus ({todayTodoList.filter(t => !t.completed).length})
                    </h3>
                  </div>
                  <Link 
                    href="/tasks" 
                    className="text-[11px] font-heading font-bold text-[#6324FC] hover:underline flex items-center gap-1 bg-[#6324FC]/10 hover:bg-[#6324FC]/20 px-2 py-0.5 rounded-md border border-[#6324FC]/25 transition-colors"
                  >
                    <History size={11} />
                    <span>Work Log & History</span>
                  </Link>
                </div>

                {/* Inline Quick Add Input */}
                <form onSubmit={handleAddQuickTodo} className="flex items-center gap-1.5 mb-3">
                  <input 
                    type="text"
                    value={newTodoInput}
                    onChange={(e) => setNewTodoInput(e.target.value)}
                    placeholder="Add task & hit Enter..."
                    className="flex-1 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-secondary/60 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newTodoInput.trim() || isSubmittingTodo}
                    className="p-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] disabled:opacity-40 text-white transition-all shrink-0 shadow-[0_0_10px_rgba(99,36,252,0.4)]"
                    title="Add Task"
                  >
                    <Plus size={14} />
                  </button>
                </form>

                {/* Task List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {todayTodoList.length > 0 ? (
                    todayTodoList.map((task: any) => {
                      const isCompleted = !!task.completed;
                      return (
                        <div 
                          key={task.id} 
                          className={`flex gap-2.5 items-center p-2.5 rounded-xl border transition-all group ${
                            isCompleted 
                              ? 'bg-slate-100/50 dark:bg-[#060608]/40 border-black/5 dark:border-white/5 opacity-60' 
                              : 'bg-slate-50 dark:bg-[#060608] border-black/5 dark:border-white/5 hover:border-[#6324FC]/40'
                          }`}
                        >
                          {/* Toggle Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleTodo(task)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white shadow-[0_0_8px_#10B981]'
                                : 'border border-black/20 dark:border-white/20 hover:border-[#00E5FF] bg-transparent text-transparent hover:text-black/40 dark:hover:text-white/40'
                            }`}
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>

                          {/* Title & Meta */}
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleToggleTodo(task)}>
                            <p className={`text-xs font-heading font-semibold truncate transition-colors ${
                              isCompleted 
                                ? 'line-through text-secondary' 
                                : 'text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF]'
                            }`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-mono text-secondary uppercase">
                                {task.category || 'General'}
                              </span>
                              {task.priority && (
                                <span className={`text-[8px] font-heading font-bold px-1 rounded ${
                                  task.priority === 'High' 
                                    ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/20' 
                                    : 'bg-black/5 dark:bg-white/5 text-secondary'
                                }`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTodo(task.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-all shrink-0"
                            title="Delete Task"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-5 bg-slate-50 dark:bg-[#060608] rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-1.5">
                        <CheckCircle2 size={16} />
                      </div>
                      <p className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-0.5">Focus List Ready</p>
                      <p className="text-[10px] font-sans text-secondary max-w-[200px] leading-relaxed">
                        Add a task above to plan your day's work.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* DUAL STREAM: RECENT TRANSACTIONS / AUDIT ACTIVITY */}
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 transition-all shadow-md dark:shadow-lg">
                {/* Tabs Header */}
                <div className="p-3 border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-[#060608] flex items-center justify-between">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-lg">
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className={`px-3 py-1 rounded-md text-xs font-heading font-bold transition-all ${
                        activeTab === 'transactions' 
                          ? 'bg-[#6324FC] text-white shadow-[0_0_10px_rgba(99,36,252,0.4)]' 
                          : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Transactions
                    </button>
                    <button
                      onClick={() => setActiveTab('activity')}
                      className={`px-3 py-1 rounded-md text-xs font-heading font-bold transition-all ${
                        activeTab === 'activity' 
                          ? 'bg-[#6324FC] text-white shadow-[0_0_10px_rgba(99,36,252,0.4)]' 
                          : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Audit Log
                    </button>
                  </div>
                  <Link 
                    href={activeTab === 'transactions' ? '/finance' : '/projects'} 
                    className="text-[11px] font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-0.5"
                  >
                    View All <ChevronRight size={12} />
                  </Link>
                </div>

                {/* Tab Content */}
                <div className="p-3 max-h-[260px] overflow-y-auto custom-scrollbar">
                  {activeTab === 'transactions' ? (
                    <div className="space-y-2">
                      {(recentTransactions || []).length > 0 ? (
                        recentTransactions.slice(0, 5).map((t: any) => {
                          const isIncome = t.type === 'Income' || t.type === 'income';
                          return (
                            <div 
                              key={t._id} 
                              onClick={() => router.push('/finance')}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer border border-black/5 dark:border-white/5 group"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="text-xs font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors truncate">{t.platform || t.category || 'Transaction'}</p>
                                <p className="text-[10px] font-sans text-secondary truncate">{new Date(t.date).toLocaleDateString()}</p>
                              </div>
                              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${
                                isIncome 
                                  ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                  : 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                              }`}>
                                {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-xs text-secondary">No recorded transactions.</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(recentActivity || []).length > 0 ? (
                        recentActivity.slice(0, 5).map((act: any, idx: number) => (
                          <div key={`${act.id}-${idx}`} className="flex gap-2.5 items-start p-1.5 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] mt-1.5 flex-shrink-0 shadow-[0_0_6px_#00E5FF]" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-heading font-bold text-slate-900 dark:text-white truncate">{act.title}</p>
                              <p className="text-[10px] font-sans text-secondary truncate">{act.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-secondary">No recorded activity.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE MODALS */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={closeModal} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div>
                    <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white">
                      {activeModal}
                    </h2>
                    <p className="text-xs font-sans text-secondary">Fill in details for instant record creation.</p>
                  </div>
                  <button 
                    onClick={closeModal} 
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-surface hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">Title / Description</label>
                    <input 
                      type="text" 
                      value={quickForm.title}
                      onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                      placeholder="e.g. Upwork Milestone Payment or Client Deliverable..." 
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors" 
                    />
                  </div>

                  {activeModal === 'Record Transaction' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">Amount (USD)</label>
                        <input 
                          type="number" 
                          value={quickForm.amount}
                          onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
                          placeholder="e.g. 1500" 
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-mono transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">Type</label>
                        <select 
                          value={quickForm.type}
                          onChange={(e) => setQuickForm({ ...quickForm, type: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none appearance-none"
                        >
                          <option value="Income">Income (+)</option>
                          <option value="Expense">Expense (-)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">Additional Context</label>
                    <textarea 
                      rows={3} 
                      value={quickForm.description}
                      onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                      placeholder="Optional notes or references..." 
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors resize-none" 
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02] flex justify-end gap-2.5">
                  <button 
                    onClick={closeModal} 
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-surface hover:bg-slate-200 dark:hover:bg-white/10 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      toast.success(`${activeModal} logged successfully!`);
                      closeModal();
                      router.push(activeModal === 'Record Transaction' ? '/finance' : '/projects');
                    }} 
                    className="px-4 py-2 rounded-lg bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-heading font-bold transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)]"
                  >
                    Save & Submit
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
