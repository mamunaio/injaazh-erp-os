'use client';

import React from 'react';
import { 
  Users, 
  Briefcase, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Calendar,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import AIAssistantWidget from '@/components/AIAssistantWidget';

interface DashboardClientProps {
  dashboardData: any;
}

const STATUS_COLORS: Record<string, string> = {
  'Planning': '#2dd4bf', // Teal
  'In Progress': '#fbbf24', // Amber
  'In Review': '#a78bfa', // Violet
  'Completed': '#f472b6', // Pink
};

const PLATFORM_COLORS: Record<string, string> = {
  'Freelancer': '#2dd4bf',
  'Direct': '#a78bfa',
  'Upwork': '#fbbf24',
  'Fiverr': '#f472b6',
};

// Custom Glassmorphic Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-purple-500/20 p-3 rounded-2xl shadow-xl">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-black text-slate-800 dark:text-slate-200">
          {payload[0].name === 'income' || payload[0].dataKey === 'value' && !['Planning', 'In Progress', 'In Review', 'Completed'].includes(payload[0].name)
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(payload[0].value) 
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/40 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(167,139,250,0.05)] hover:shadow-lg transition-all rounded-3xl p-6 ${className}`}>
    {children}
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export default function DashboardClient({ dashboardData }: DashboardClientProps) {
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center">
        <GlassCard className="text-center p-12">
          <AlertCircle size={48} className="text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Failed to load dashboard data</h2>
        </GlassCard>
      </div>
    );
  }

  const { stats, upcomingDeadlines, recentTransactions, recentLeads, projectStatusDistribution, platformIncome, incomeTrend } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Prepare chart data
  const projectStatusData = Object.entries(projectStatusDistribution).map(([status, count]) => ({
    name: status,
    value: count as number,
  }));

  const platformIncomeData = Object.entries(platformIncome).map(([platform, amount]) => ({
    name: platform,
    value: amount as number,
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-200 overflow-hidden font-sans tracking-tight">
      <motion.div 
        className="max-w-[1400px] mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 mb-2 drop-shadow-sm">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/leads">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-purple-500/20 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all text-sm shadow-sm hover:shadow-md">
                <Plus size={16} /> Add Lead
              </button>
            </Link>
            <Link href="/proposals">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-purple-500/20 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all text-sm shadow-sm hover:shadow-md">
                <FileText size={16} /> Create Proposal
              </button>
            </Link>
            <Link href="/money">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(167,139,250,0.4)] transition-all text-sm">
                <Plus size={16} /> Add Transaction
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Bento Grid Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Immersive Stat Cards (Top Row) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-400/20 rounded-full blur-3xl group-hover:bg-teal-400/30 transition-all"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                  <Users size={22} className="text-teal-600 dark:text-teal-400 drop-shadow-md" />
                </div>
                <Link href="/leads" className="text-xs font-bold text-slate-400 hover:text-teal-500 transition-colors flex items-center gap-1 bg-white/30 dark:bg-slate-800/50 px-2 py-1 rounded-lg backdrop-blur-md">
                  View <ArrowRight size={12} />
                </Link>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Leads</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">{stats.totalLeads}</h3>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span> {stats.activeLeads} active
                </span>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl group-hover:bg-amber-400/30 transition-all"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <Briefcase size={22} className="text-amber-600 dark:text-amber-400 drop-shadow-md" />
                </div>
                <Link href="/projects" className="text-xs font-bold text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-1 bg-white/30 dark:bg-slate-800/50 px-2 py-1 rounded-lg backdrop-blur-md">
                  View <ArrowRight size={12} />
                </Link>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Projects</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">{stats.totalProjects}</h3>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {stats.activeProjects} active
                </span>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-400/20 rounded-full blur-3xl group-hover:bg-violet-400/30 transition-all"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-[0_0_15px_rgba(167,139,250,0.2)]">
                  <FileText size={22} className="text-violet-600 dark:text-violet-400 drop-shadow-md" />
                </div>
                <Link href="/proposals" className="text-xs font-bold text-slate-400 hover:text-violet-500 transition-colors flex items-center gap-1 bg-white/30 dark:bg-slate-800/50 px-2 py-1 rounded-lg backdrop-blur-md">
                  View <ArrowRight size={12} />
                </Link>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Proposals</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">{stats.totalProposals}</h3>
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span> {stats.pendingProposals} pending
                </span>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-400/20 rounded-full blur-3xl group-hover:bg-pink-400/30 transition-all"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-[0_0_15px_rgba(244,114,182,0.2)]">
                  <DollarSign size={22} className="text-pink-600 dark:text-pink-400 drop-shadow-md" />
                </div>
                <Link href="/money" className="text-xs font-bold text-slate-400 hover:text-pink-500 transition-colors flex items-center gap-1 bg-white/30 dark:bg-slate-800/50 px-2 py-1 rounded-lg backdrop-blur-md">
                  View <ArrowRight size={12} />
                </Link>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">{formatCurrency(stats.totalIncome)}</h3>
                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20 flex items-center gap-1">
                  <TrendingUp size={10} /> {formatCurrency(stats.thisMonthIncome)} this month
                </span>
              </div>
            </GlassCard>
          </motion.div>

          {/* Income Trend (Area Chart) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-8">
            <GlassCard className="h-full min-h-[360px] flex flex-col">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-violet-500" />
                Income Trend
              </h3>
              <div className="flex-1 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.3} vertical={false} />
                    <XAxis dataKey="month" stroke="currentColor" className="text-slate-400" style={{ fontSize: '10px', fontWeight: 700 }} axisLine={false} tickLine={false} tickMargin={12} />
                    <YAxis stroke="currentColor" className="text-slate-400" style={{ fontSize: '10px', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }} />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#8b5cf6" 
                      strokeWidth={4} 
                      fill="url(#colorIncome)"
                      filter="url(#glow)"
                      activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Project Status (Pie Chart) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[360px] flex flex-col">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-teal-500" />
                Project Status
              </h3>
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-teal-400/5 dark:bg-teal-400/10 rounded-full blur-3xl"></div>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Platform Income Comparison */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-5">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart size={16} className="text-amber-500" />
                Platform Income
              </h3>
              {platformIncomeData.length > 0 ? (
                <div className="flex-1 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformIncomeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.3} vertical={false} />
                      <XAxis dataKey="name" stroke="currentColor" className="text-slate-400" style={{ fontSize: '10px', fontWeight: 700 }} axisLine={false} tickLine={false} tickMargin={12} />
                      <YAxis stroke="currentColor" className="text-slate-400" style={{ fontSize: '10px', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip cursor={{ fill: 'rgba(203,213,225,0.1)' }} content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
                        {platformIncomeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name] || '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                  <BarChart size={32} className="mb-2" />
                  <p className="text-xs font-bold">No data available</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Recent Activity List */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={16} className="text-pink-500" />
                  Recent Activity
                </h3>
                <Link href="/money" className="text-xs font-bold text-pink-500 hover:text-pink-400">View all</Link>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {recentTransactions.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 text-center py-8">No recent activity.</p>
                ) : (
                  recentTransactions.slice(0, 4).map((transaction: any) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 rounded-2xl bg-white/20 dark:bg-slate-800/30 hover:bg-white/40 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-white/20 dark:hover:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.type === 'Income' ? 'bg-teal-500/20 text-teal-500' : 'bg-rose-500/20 text-rose-500'}`}>
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{transaction.category}</p>
                          <p className="text-[10px] font-bold text-slate-500">{transaction.platform} • {getRelativeTime(transaction.date)}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${transaction.type === 'Income' ? 'text-teal-500' : 'text-rose-500'}`}>
                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-3">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Calendar size={16} className="text-violet-500" />
                Deadlines
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {upcomingDeadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                    <Clock size={24} className="mb-2" />
                    <p className="text-xs font-bold">All caught up!</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((project: any) => (
                    <div key={project._id} className="p-3 rounded-2xl bg-white/20 dark:bg-slate-800/30 hover:bg-white/40 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-white/20 dark:hover:border-slate-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{project.title}</h4>
                        <span className="text-[9px] font-black uppercase text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">{formatDate(project.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{project.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>

        </div>
      </motion.div>
      
      {/* AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}
