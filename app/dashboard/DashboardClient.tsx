'use client';

import React, { useState } from 'react';
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
  Sparkles,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Globe,
  ArrowUpRight,
  TrendingDown,
  Percent,
  Layers,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  Zap
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
import { useUser } from '@/components/layout/UserContext';
import IslamicSplashModal from './IslamicSplashModal';
import WorkspaceLoader from '@/components/ui/WorkspaceLoader';
import AnimatedStatCard from '@/components/ui/AnimatedStatCard';
import SparklineChart from '@/components/ui/SparklineChart';

interface DashboardClientProps {
  dashboardData: any;
  islamicQuote: any;
}

const STATUS_COLORS: Record<string, string> = {
  'Planning': '#2dd4bf',
  'In Progress': '#fbbf24',
  'In Review': '#a78bfa',
  'Completed': '#f472b6',
};

// Custom Glassmorphic Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
        <p className="text-sm font-bold text-slate-400 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-black text-white">
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
  <div className={`relative rounded-[28px] overflow-hidden border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl p-6 ${className}`}>

    <div className="relative z-10 h-full flex flex-col">{children}</div>
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
};

export default function DashboardClient({ dashboardData, islamicQuote }: DashboardClientProps) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen neu-base-bg p-8 flex items-center justify-center">
        <WorkspaceLoader />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen neu-base-bg p-8 flex items-center justify-center text-white">
        <GlassCard className="text-center p-12 max-w-md w-full">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to load dashboard data</h2>
        </GlassCard>
      </div>
    );
  }

  const { stats, upcomingDeadlines, recentTransactions, recentLeads, projectStatusDistribution, incomeTrend } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Prepare chart data
  const projectStatusData = Object.entries(projectStatusDistribution).map(([status, count]) => ({
    name: status, value: count as number,
  }));

  // Render minimal dashboard for non-admins
  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return (
      <div className="min-h-screen neu-base-bg p-4 md:p-8 text-white overflow-hidden relative selection:bg-indigo-500/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div className="max-w-[1400px] mx-auto space-y-6 relative z-10" variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h1 className="text-4xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {getGreeting()}, {user?.name || 'Team Member'}
              </h1>
              <p className="text-slate-400 font-medium tracking-wide">
                Here's what's happening today • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {user?.permissions?.includes('leads') && (
                <Link href="/leads">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-2xl border border-white/10 transition-all backdrop-blur-md hover:shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                    <Plus size={18} className="text-teal-400" /> Add Lead
                  </button>
                </Link>
              )}
            </div>
          </motion.div>

          <IslamicSplashModal islamicQuote={islamicQuote} />

          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Zap size={20} className="text-amber-500" /> Today's Work Updates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatedStatCard
                title="New Leads Today"
                value={stats.newLeadsToday || 0}
                icon={Users}
                iconColorClass="bg-gradient-to-br from-indigo-500 to-purple-600"
                glowColorClass="bg-indigo-500"
              >
                <div className="flex justify-between text-sm text-slate-400 font-medium">
                  <span>Last 24 hours</span>
                </div>
              </AnimatedStatCard>
              <AnimatedStatCard
                title="Leads Updated Today"
                value={stats.leadsUpdatedToday || 0}
                icon={TrendingUp}
                iconColorClass="bg-gradient-to-br from-teal-500 to-emerald-600"
                glowColorClass="bg-teal-500"
              >
                <div className="flex justify-between text-sm text-slate-400 font-medium">
                  <span>Followed up today</span>
                </div>
              </AnimatedStatCard>
              <AnimatedStatCard
                title="Outreach Conducted"
                value={stats.outreachAddedToday || 0}
                icon={CheckCircle2}
                iconColorClass="bg-gradient-to-br from-pink-500 to-rose-600"
                glowColorClass="bg-pink-500"
              >
                <div className="flex justify-between text-sm text-slate-400 font-medium">
                  <span>Log entries recorded</span>
                </div>
              </AnimatedStatCard>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Full Admin Dashboard
  return (
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-white overflow-hidden relative selection:bg-pink-500/30">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[500px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        className="max-w-[1400px] mx-auto space-y-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* HERO SECTION */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              {getGreeting()}, {user?.name || 'Admin'}
            </h1>
            <p className="text-slate-400 font-medium tracking-wide flex items-center gap-2">
              <Calendar size={16} className="text-pink-500" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex bg-slate-900/50 backdrop-blur-xl p-2 rounded-3xl border border-white/5 shadow-2xl gap-2">
            <Link href="/leads" className="flex items-center gap-2 px-5 py-3 hover:bg-white/10 text-white font-bold text-sm rounded-2xl transition-all group">
              <Plus size={18} className="text-teal-400 group-hover:scale-110 transition-transform" /> Add Lead
            </Link>
            <Link href="/money" className="flex items-center gap-2 px-5 py-3 hover:bg-white/10 text-white font-bold text-sm rounded-2xl transition-all group">
              <DollarSign size={18} className="text-pink-400 group-hover:scale-110 transition-transform" /> Transaction
            </Link>
          </div>
        </motion.div>

        <IslamicSplashModal islamicQuote={islamicQuote} />

        {/* BENTO GRID LEVEL 1: Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <AnimatedStatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalIncome)}
            icon={DollarSign}
            iconColorClass="bg-gradient-to-br from-pink-500 to-rose-600"
            glowColorClass="bg-pink-500"
            href="/money"
          >
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">This Month</span>
              <span className="text-pink-400 flex items-center gap-1 font-mono">
                <ArrowUpRight size={14} /> {formatCurrency(stats.thisMonthIncome)}
              </span>
            </div>
            {/* Sparkline */}
            <div className="mt-4 -mx-2 opacity-80">
              <SparklineChart data={incomeTrend} dataKey="income" color="#f472b6" height={40} />
            </div>
          </AnimatedStatCard>

          <AnimatedStatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={Briefcase}
            iconColorClass="bg-gradient-to-br from-amber-500 to-orange-600"
            glowColorClass="bg-amber-500"
            href="/projects"
          >
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">Total Pipeline</span>
              <span className="text-amber-400 font-mono">{stats.totalProjects}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold mt-2">
              <span className="text-slate-400">Completed</span>
              <span className="text-white font-mono">{projectStatusDistribution['Completed'] || 0}</span>
            </div>
          </AnimatedStatCard>

          <AnimatedStatCard
            title="Proposal Pipeline"
            value={formatCurrency(stats.outstandingPipelineValue)}
            icon={FileText}
            iconColorClass="bg-gradient-to-br from-violet-500 to-purple-600"
            glowColorClass="bg-violet-500"
            href="/proposals"
          >
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">Pending</span>
              <span className="text-violet-400 font-mono">{stats.pendingProposals}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold mt-2">
              <span className="text-slate-400">Closed Won</span>
              <span className="text-teal-400 font-mono">{formatCurrency(stats.acceptedProposalsValue)}</span>
            </div>
          </AnimatedStatCard>

          <AnimatedStatCard
            title="Sales Leads"
            value={stats.totalLeads}
            icon={Users}
            iconColorClass="bg-gradient-to-br from-teal-500 to-emerald-600"
            glowColorClass="bg-teal-500"
            href="/leads"
          >
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">Conversion</span>
              <span className="text-teal-400 font-mono flex items-center gap-1"><Percent size={12} />{stats.leadConversionRate}%</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold mt-2">
              <span className="text-slate-400">Active Outreach</span>
              <span className="text-white font-mono">{stats.activeLeads}</span>
            </div>
          </AnimatedStatCard>
        </div>

        {/* BENTO GRID LEVEL 2: Charts and Lists */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Income Trend Chart (Spans 8 cols) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-8">
            <GlassCard className="min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp size={18} className="text-violet-500" /> Income Overview
                </h3>
              </div>
              <div className="flex-1 -ml-4 w-full h-[300px] min-h-[300px]">
                {(!incomeTrend || incomeTrend.length === 0) ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-medium">No income data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={incomeTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-white/5" opacity={0.3} vertical={false} />
                      <XAxis dataKey="month" stroke="currentColor" className="text-slate-400" style={{ fontSize: '11px', fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={15} />
                      <YAxis stroke="currentColor" className="text-slate-400" style={{ fontSize: '11px', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.1 }} />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#a78bfa" 
                        strokeWidth={3} 
                        fill="url(#colorIncome)"
                        activeDot={{ r: 6, fill: '#a78bfa', stroke: '#050505', strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Project Status Pie (Spans 4 cols) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="min-h-[400px]">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieChartIcon size={18} className="text-teal-400" /> Project Status
              </h3>
              <div className="flex-1 flex items-center justify-center relative w-full h-[300px] min-h-[300px]">
                <div className="absolute inset-0 bg-teal-500/10 rounded-full blur-[80px]"></div>
                {(!projectStatusData || projectStatusData.length === 0) ? (
                  <div className="z-10 w-full h-full flex items-center justify-center text-slate-500 font-medium">No projects available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={40} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Upcoming Deadlines (Spans 6 cols) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-6">
            <GlassCard className="min-h-[380px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-400" /> Upcoming Deadlines
                </h3>
                <Link href="/projects" className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1 transition-colors">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2">
                {upcomingDeadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                    <Calendar size={28} className="mb-3 text-indigo-500/50" />
                    <p className="text-sm font-bold">No upcoming deadlines</p>
                  </div>
                ) : (
                  upcomingDeadlines.slice(0, 4).map((item: any) => {
                    const statusColor = 
                      item.status === 'Completed' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                      item.status === 'In Review' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      item.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20';
                      
                    return (
                      <div key={item._id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-3">
                            <h4 className="truncate font-bold text-white text-base">{item.title}</h4>
                            <p className="text-xs font-bold text-rose-400 mt-1 flex items-center gap-1.5">
                              <Clock size={12} /> {formatDate(item.deadline)}
                            </p>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border whitespace-nowrap ${statusColor}`}>
                            {item.status || 'Active'}
                          </span>
                        </div>
                        {item.progress > 0 && (
                          <div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${item.progress}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Recent Activity (Spans 6 cols) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-6">
            <GlassCard className="min-h-[380px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-400" /> Recent Activity
                </h3>
                <Link href="/money" className="text-xs font-bold text-pink-400 hover:text-white flex items-center gap-1 transition-colors">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500 text-center py-10">No recent activity.</p>
                ) : (
                  recentTransactions.slice(0, 4).map((transaction: any) => (
                    <div key={transaction._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${transaction.type === 'Income' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-white">{transaction.category}</p>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">{transaction.platform} • {getRelativeTime(transaction.date)}</p>
                        </div>
                      </div>
                      <span className={`text-base font-black ${transaction.type === 'Income' ? 'text-teal-400' : 'text-rose-400'}`}>
                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
