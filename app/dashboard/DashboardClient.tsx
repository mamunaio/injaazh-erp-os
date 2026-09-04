'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, FileText, DollarSign, TrendingUp, Clock, Plus, ArrowRight, Calendar, AlertCircle, Sparkles, PieChart as PieChartIcon, BarChart as BarChartIcon, Globe, ArrowUpRight, TrendingDown, Percent, Layers, ChevronRight, Lightbulb, CheckCircle2, BookOpen, Zap, Mail, MessageSquare, Video, Rocket, LayoutGrid, CheckSquare, Search, Bell, Monitor, Settings, Search as SearchIcon, Activity, X, Bot, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { notify } from '@/lib/notify';
import { useUser } from '@/components/layout/UserContext';
import WorkspaceLoader from '@/components/ui/WorkspaceLoader';
import { getRealtimeAiExecutiveBriefing } from '@/app/actions/aiActions';

interface DashboardClientProps {
  dashboardData: any;
  islamicQuote: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] p-3 rounded-xl shadow-2xl">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {payload[0].name?.toLowerCase() === 'income' || payload[0].dataKey === 'value' || payload[0].dataKey === 'Income'
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(payload[0].value) 
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`glass-card rounded-[22px] p-5 lg:p-6 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-white/15 ${className}`}>
    {children}
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function DashboardClient({ dashboardData, islamicQuote }: DashboardClientProps) {
  const { user, loading } = useUser();
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [revenueFilter, setRevenueFilter] = useState<'30days' | '6months' | 'year'>('30days');
  const [currentAiInsights, setCurrentAiInsights] = useState<string>(dashboardData?.aiInsights || '');
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);
  const router = useRouter();

  const handleRefreshAiBriefing = async () => {
    if (isRefreshingAi) return;
    setIsRefreshingAi(true);
    toast.loading('Consulting Gemini AI...', { id: 'ai-refresh' });
    try {
      const res = await getRealtimeAiExecutiveBriefing();
      if (res.success && res.text) {
        setCurrentAiInsights(res.text);
        toast.success('AI Executive Briefing updated!', { id: 'ai-refresh' });
      } else {
        toast.error('Failed to generate fresh AI briefing', { id: 'ai-refresh' });
      }
    } catch {
      toast.error('Failed to refresh AI briefing', { id: 'ai-refresh' });
    } finally {
      setIsRefreshingAi(false);
    }
  };

  const handleAction = (actionName: string, routeTo?: string) => {
    setIsActionLoading(actionName);
    setTimeout(() => {
      setIsActionLoading(null);
      if (routeTo) {
        router.push(routeTo);
      } else {
        setActiveModal(actionName);
      }
    }, 400);
  };

  const closeModal = () => setActiveModal(null);

  if (loading) {
    return <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center"><WorkspaceLoader /></div>;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#08090C] p-8 flex items-center justify-center text-slate-900 dark:text-white">
        <Card className="text-center p-12 max-w-md w-full">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Failed to load dashboard data</h2>
        </Card>
      </div>
    );
  }

  const { stats, revenueTrend30Days, revenueTrend6Months, revenueTrendYear, leadFunnel, salesPipeline, aiInsights } = dashboardData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const maxLeads = Math.max(leadFunnel?.New || 0, leadFunnel?.Active || 0, leadFunnel?.Closed || 0) || 1;
  const pipelineData = [
    { name: 'New Leads', value: leadFunnel?.New || 0, color: '#3B82F6', gradient: 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 100%)', width: `${((leadFunnel?.New || 0) / maxLeads) * 100}%` },
    { name: 'Active', value: leadFunnel?.Active || 0, color: '#8B5CF6', gradient: 'linear-gradient(90deg, #6D28D9 0%, #8B5CF6 100%)', width: `${((leadFunnel?.Active || 0) / maxLeads) * 100}%` },
    { name: 'Closed', value: leadFunnel?.Closed || 0, color: '#10B981', gradient: 'linear-gradient(90deg, #047857 0%, #10B981 100%)', width: `${((leadFunnel?.Closed || 0) / maxLeads) * 100}%` },
  ];

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-primary-500/30 overflow-x-hidden">
      
      <motion.div 
        className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Page Header & Quick Actions */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-[11px] font-bold tracking-wide uppercase">
                {(user as any)?.workspace?.name || 'Primary Workspace'}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            <button onClick={() => handleAction('Proposal Draft', '/proposals')} disabled={!!isActionLoading} className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 neu-button font-semibold text-xs flex disabled:opacity-50">
              <FileText size={15} className="text-slate-400" /> New Proposal
            </button>
            <button onClick={() => handleAction('Project Setup', '/projects')} disabled={!!isActionLoading} className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 neu-button font-semibold text-xs flex disabled:opacity-50">
              <Briefcase size={15} className="text-slate-400" /> New Project
            </button>
            <button onClick={() => handleAction('Lead Form', '/prospects')} disabled={!!isActionLoading} className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary-500/20 flex disabled:opacity-50">
              <Plus size={15} /> Add Prospect
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-6 w-full">
          
          {/* LEFT COLUMN (MAIN CONTENT) */}
          <div className="flex-1 space-y-6 min-w-0">
            
            {/* Command Center (KPI Cards) */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid size={15} className="text-primary-500" /> Key Performance Indicators
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                {/* Metric 1: Revenue */}
                <div onClick={() => router.push('/finance')} className="group glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-cyan-500/40 transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" />
                   <div className="flex justify-between items-start">
                     <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                       <DollarSign size={17} />
                     </div>
                     <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ArrowUpRight size={11} /> Active
                     </span>
                   </div>
                   <div className="mt-1">
                     <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue This Month</p>
                     <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{formatCurrency(stats?.thisMonthIncome || 0)}</p>
                   </div>
                </div>

                {/* Metric 2: Active Projects */}
                <div onClick={() => router.push('/projects')} className="group glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-primary-500/40 transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-80" />
                   <div className="flex justify-between items-start">
                     <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500">
                       <Briefcase size={17} />
                     </div>
                     <span className="text-[10px] font-bold text-primary-500 flex items-center gap-0.5 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                        In Flight
                     </span>
                   </div>
                   <div className="mt-1">
                     <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Projects</p>
                     <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.activeProjects || 0}</p>
                   </div>
                </div>

                {/* Metric 3: Leads */}
                <div onClick={() => router.push('/prospects')} className="group glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80" />
                   <div className="flex justify-between items-start">
                     <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                       <Users size={17} />
                     </div>
                     <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Pipeline
                     </span>
                   </div>
                   <div className="mt-1">
                     <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prospects & Leads</p>
                     <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.newLeadsToday || 0}</p>
                   </div>
                </div>

                {/* Metric 4: Clients */}
                <div onClick={() => router.push('/marketplace/clients')} className="group glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />
                   <div className="flex justify-between items-start">
                     <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                       <Globe size={17} />
                     </div>
                     <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Marketplace
                     </span>
                   </div>
                   <div className="mt-1">
                     <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Clients</p>
                     <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.activeClients || 0}</p>
                   </div>
                </div>

                {/* Metric 5: Pending Tasks */}
                <div onClick={() => router.push('/roadmap')} className="group glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-rose-500/40 transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80" />
                   <div className="flex justify-between items-start">
                     <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                       <Clock size={17} />
                     </div>
                     <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        Due
                     </span>
                   </div>
                   <div className="mt-1">
                     <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Deliverables</p>
                     <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.pendingTasks || 0}</p>
                   </div>
                </div>

                {/* Metric 6: Monthly Growth */}
                <div onClick={() => router.push('/finance')} className="group glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/40 transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />
                   <div className="flex justify-between items-start">
                     <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                       <TrendingUp size={17} />
                     </div>
                     <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ArrowUpRight size={11} /> Positive
                     </span>
                   </div>
                   <div className="mt-1">
                     <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monthly Growth</p>
                     <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.monthlyGrowth || 0}%</p>
                   </div>
                </div>

              </div>
            </motion.div>
            {/* Analytics Section */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChartIcon size={15} className="text-primary-500" /> Financial & Pipeline Analytics
                </h2>
                <Link href="/finance" className="text-xs font-bold text-primary-500 hover:underline transition-colors flex items-center gap-1">
                  Full Ledger <ChevronRight size={14} />
                </Link>
              </div>
              
              <Card className="h-[380px] flex flex-col p-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Revenue Trajectory</h3>
                    <p className="text-xs text-slate-400 font-medium">Visual cash flow breakdown over selected timeline.</p>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 rounded-xl">
                    {(['30days', '6months', 'year'] as const).map((filterKey) => (
                      <button
                        key={filterKey}
                        onClick={() => setRevenueFilter(filterKey)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          revenueFilter === filterKey 
                            ? 'bg-white dark:bg-primary-600 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {filterKey === '30days' ? '30 Days' : filterKey === '6months' ? '6 Months' : '1 Year'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full -ml-3 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={revenueFilter === '30days' ? revenueTrend30Days : revenueFilter === '6months' ? revenueTrend6Months : revenueTrendYear} 
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevPremium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="dateStr" stroke="#64748B" fontSize={11} fontWeight={500} axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis stroke="#64748B" fontSize={11} fontWeight={500} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tickMargin={10} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8B5CF6', strokeWidth: 1.5, strokeDasharray: '4 4', opacity: 0.5 }} />
                      <Area type="monotone" dataKey="Income" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#colorRevPremium)" activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lead Funnel */}
                <Card className="flex flex-col p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Conversion Funnel</h3>
                    <PieChartIcon size={16} className="text-slate-400" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    {pipelineData.slice(0, 3).map((stage, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-right shrink-0">
                          <p className="text-xs font-semibold text-slate-400">{stage.name}</p>
                        </div>
                        <div className="flex-1 h-4 bg-slate-100 dark:bg-black/40 rounded-full border border-slate-200/80 dark:border-white/10 overflow-hidden relative">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: stage.width }}
                             transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                             className="h-full absolute left-0 top-0 bottom-0 rounded-full"
                             style={{ background: stage.gradient }}
                           />
                        </div>
                        <div className="w-8 shrink-0 text-right">
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{stage.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Sales Pipeline */}
                <Card className="flex flex-col p-5">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Proposal Value Status</h3>
                     <Layers size={16} className="text-slate-400" />
                   </div>
                   <div className="flex flex-col gap-3">
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06]">
                       <div className="flex items-center gap-2.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                         <div>
                           <p className="text-xs font-bold text-slate-900 dark:text-white">Pending Proposals</p>
                           <p className="text-[11px] text-slate-400">{stats?.pendingProposals || 0} proposals sent</p>
                         </div>
                       </div>
                       <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(salesPipeline?.Pending || 0)}</p>
                     </div>
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06]">
                       <div className="flex items-center gap-2.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                         <div>
                           <p className="text-xs font-bold text-slate-900 dark:text-white">Won & Accepted</p>
                           <p className="text-[11px] text-emerald-500 font-semibold">Closed successfully</p>
                         </div>
                       </div>
                       <p className="text-xs font-bold font-mono text-emerald-500">{formatCurrency(salesPipeline?.Accepted || 0)}</p>
                     </div>
                   </div>
                </Card>
              </div>
            </motion.div>

            {/* BOTTOM SECTION (TABLES) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 w-full min-w-0">
               {/* Recent Leads Table */}
               <Card className="p-0 overflow-hidden h-full">
                 <div className="p-4.5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Prospects</h3>
                   <Link href="/prospects" className="text-xs font-bold text-primary-500 hover:underline transition-colors">View All</Link>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse text-xs">
                     <thead>
                       <tr className="bg-slate-50/80 dark:bg-black/30 text-slate-400">
                         <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Company</th>
                         <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Target Service</th>
                         <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                       {dashboardData.recentLeads?.length > 0 ? dashboardData.recentLeads.map((lead: any) => (
                         <tr key={lead._id} onClick={() => router.push('/prospects')} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer">
                           <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{lead.company_name}</td>
                           <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{lead.targetService || 'Custom Solution'}</td>
                           <td className="px-4 py-3">
                             <span className="inline-block px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold border border-primary-500/20">
                               {lead.outreach_status || 'New'}
                             </span>
                           </td>
                         </tr>
                       )) : (
                         <tr>
                           <td colSpan={3} className="px-4 py-6 text-center text-slate-400">No recent leads found.</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </Card>

               {/* Recent Transactions Table */}
               <Card className="p-0 overflow-hidden h-full">
                 <div className="p-4.5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Transactions</h3>
                   <Link href="/finance" className="text-xs font-bold text-primary-500 hover:underline transition-colors">View All</Link>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse text-xs">
                     <thead>
                       <tr className="bg-slate-50/80 dark:bg-black/30 text-slate-400">
                         <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Source</th>
                         <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                         <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Date</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                       {dashboardData.recentTransactions?.length > 0 ? dashboardData.recentTransactions.slice(0, 5).map((t: any) => (
                         <tr key={t._id} onClick={() => router.push('/finance')} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer">
                           <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{t.title || t.platform || 'Direct Payment'}</td>
                           <td className={`px-4 py-3 font-mono font-bold ${t.type === 'Income' || t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {t.type === 'Income' || t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                           </td>
                           <td className="px-4 py-3 text-slate-400">
                             {new Date(t.date).toLocaleDateString()}
                           </td>
                         </tr>
                       )) : (
                         <tr>
                           <td colSpan={3} className="px-4 py-6 text-center text-slate-400">No recent transactions.</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </Card>
            </motion.div>
          </div>

          {/* RIGHT COLUMN (SIDEBAR) */}
          <div className="w-full xl:w-[380px] flex-shrink-0 space-y-6 xl:pt-[44px]">
            
            {/* AI Insights & Copilot Card */}
            <motion.div variants={itemVariants}>
              <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-primary-500/20 shadow-lg shadow-primary-500/5">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/15 blur-[40px] rounded-full pointer-events-none" />
                 <div className="flex justify-between items-center mb-3 relative z-10">
                   <div className="flex items-center gap-2">
                     <div className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-500 flex items-center justify-center">
                       <Sparkles size={14} />
                     </div>
                     <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                       AI Executive Summary
                     </h3>
                   </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleRefreshAiBriefing}
                        disabled={isRefreshingAi}
                        title="Re-analyze business metrics with Gemini"
                        className="p-1 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isRefreshingAi ? 'animate-spin' : ''} />
                      </button>
                      <span className="text-[10px] uppercase tracking-wider bg-primary-500/10 text-primary-500 border border-primary-500/20 px-2 py-0.5 rounded-full font-bold">
                        Gemini 2.5
                      </span>
                    </div>
                 </div>
                 <div className="relative z-10">
                   <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 font-normal">
                     {currentAiInsights || "Based on your activity, maintain focus on upcoming project milestones and pending client proposals."}
                   </p>
                   
                   <button
                     onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                     className="w-full py-2 px-3 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-primary-600 dark:text-primary-400 font-semibold text-xs transition-colors flex items-center justify-center gap-2 group"
                   >
                     <Bot size={14} className="group-hover:rotate-12 transition-transform" />
                     Chat with AI Business Copilot
                   </button>
                 </div>
              </div>
            </motion.div>

            {/* Daily Islamic Quote / Motivation if available */}
            {islamicQuote && (
              <motion.div variants={itemVariants}>
                <div className="glass-card rounded-2xl p-4.5 border-emerald-500/20 bg-emerald-500/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Daily Inspiration</span>
                  </div>
                  <p className="text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed font-serif">
                    "{islamicQuote.quote || islamicQuote.text}"
                  </p>
                  {islamicQuote.source && (
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium text-right">
                      — {islamicQuote.source}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Today's Tasks */}
            <motion.div variants={itemVariants}>
              <Card className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <CheckSquare size={14} className="text-primary-500" /> Today's Tasks
                  </h3>
                  <Link href="/roadmap" className="text-xs font-bold text-primary-500 hover:underline transition-colors">Roadmap</Link>
                </div>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {dashboardData.todayTasks?.length > 0 ? (
                    dashboardData.todayTasks.slice(0, 5).map((task: any) => (
                      <div key={task.id} className="flex gap-2.5 items-center p-2.5 rounded-xl bg-slate-50/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] hover:border-primary-500/30 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0 text-primary-500">
                          <CheckSquare size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                          <p className="text-[10px] text-slate-400">{task.status || 'In Progress'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-xs text-slate-400">All caught up! No tasks due today.</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Upcoming Meetings */}
            <motion.div variants={itemVariants}>
              <Card className="p-6 lg:p-8">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500 dark:text-slate-400" /> Upcoming Meetings
                  </h3>
                  <button onClick={() => handleAction('Meeting Modal')} className="w-6 h-6 rounded-md bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center hover:text-slate-900 dark:hover:text-white hover:border-[#2563EB]/50 text-slate-500 dark:text-slate-400 transition-colors"><Plus size={14} /></button>
                </div>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {dashboardData.upcomingMeetings?.length > 0 ? (
                    dashboardData.upcomingMeetings.map((meeting: any) => (
                      <div key={meeting.id} className="flex gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] hover:border-[#10B981]/50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center flex-shrink-0 text-[#10B981]">
                          <Calendar size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{meeting.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {new Date(meeting.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming meetings.</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Notifications / Activity */}
            <motion.div variants={itemVariants}>
              <Card className="p-6 lg:p-8">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Bell size={16} className="text-slate-500 dark:text-slate-400" /> Recent Activity
                  </h3>
                </div>
                <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {dashboardData.recentActivity?.length > 0 ? (
                    dashboardData.recentActivity.map((activity: any, idx: number) => (
                      <div key={`${activity.id}-${idx}`} className="flex gap-4 relative">
                        <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-2 relative z-10 flex-shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                        {idx !== dashboardData.recentActivity.length - 1 && (
                          <div className="absolute top-4 left-1 w-px h-full bg-slate-200 dark:bg-[#232734] -ml-px"></div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                            {activity.description}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-widest">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

          </div>
        </div>

        
        {/* Modals */}
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {activeModal === 'Task Modal' && 'Create New Task'}
                    {activeModal === 'Proposal Draft' && 'Draft New Proposal'}
                    {activeModal === 'Project Setup' && 'Setup New Project'}
                    {activeModal === 'Lead Form' && 'Add New Lead'}
                    {activeModal === 'Meeting Modal' && 'Schedule New Meeting'}
                  </h2>
                  <p className="text-xs text-[#94A3B8]">Fill in the details below to proceed.</p>
                </div>
                <button onClick={closeModal} className="p-2 bg-slate-200 dark:bg-[#232734] hover:bg-rose-500/20 text-[#94A3B8] hover:text-rose-500 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-widest">Title / Name</label>
                  <input type="text" placeholder={`Enter ${activeModal.split(' ')[0]} name...`} className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-widest">Description</label>
                  <textarea rows={3} placeholder="Add some details here..." className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition-colors resize-none"></textarea>
                </div>
                {activeModal === 'Task Modal' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-widest">Assignee</label>
                      <select className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none appearance-none">
                        <option>Mamun H.</option>
                        <option>Alex L.</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-widest">Priority</label>
                      <select className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none appearance-none">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] flex justify-end gap-3">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-[#232734] hover:bg-slate-300 dark:hover:bg-[#323746] text-slate-900 dark:text-white text-sm font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={() => { toast.success(`${activeModal.split(' ')[0]} created successfully!`); closeModal(); }} className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
