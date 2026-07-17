'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, FileText, DollarSign, TrendingUp, Clock, Plus, ArrowRight, Calendar, AlertCircle, Sparkles, PieChart as PieChartIcon, BarChart as BarChartIcon, Globe, ArrowUpRight, TrendingDown, Percent, Layers, ChevronRight, Lightbulb, CheckCircle2, BookOpen, Zap, Mail, MessageSquare, Video, Rocket, LayoutGrid, CheckSquare, Search, Bell, Monitor, Settings, Search as SearchIcon, Activity, X
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
  <div className={`bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none transition-shadow duration-300 ${className}`}>
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
  const router = useRouter();

  useEffect(() => {
    // Play login sound only once per session when dashboard is first loaded
    if (!sessionStorage.getItem('hasPlayedLoginSound')) {
      notify.login('Welcome back!');
      sessionStorage.setItem('hasPlayedLoginSound', 'true');
    }
  }, []);

  const handleAction = (actionName: string, routeTo?: string) => {
    setIsActionLoading(actionName);
    setTimeout(() => {
      setIsActionLoading(null);
      if (routeTo) {
        router.push(routeTo);
      } else {
        setActiveModal(actionName);
      }
    }, 800);
  };

  const closeModal = () => setActiveModal(null);

  if (loading) {
    return <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center"><WorkspaceLoader /></div>;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-8 flex items-center justify-center text-slate-900 dark:text-white">
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
    { name: 'New Leads', value: leadFunnel?.New || 0, color: '#2563EB', gradient: 'linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%)', width: `${((leadFunnel?.New || 0) / maxLeads) * 100}%` },
    { name: 'Active', value: leadFunnel?.Active || 0, color: '#3B82F6', gradient: 'linear-gradient(90deg, #1E40AF 0%, #3B82F6 100%)', width: `${((leadFunnel?.Active || 0) / maxLeads) * 100}%` },
    { name: 'Closed', value: leadFunnel?.Closed || 0, color: '#10B981', gradient: 'linear-gradient(90deg, #047857 0%, #10B981 100%)', width: `${((leadFunnel?.Closed || 0) / maxLeads) * 100}%` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#2563EB]/30 overflow-x-hidden">
      
      <motion.div 
        className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Page Header & Quick Actions */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-bold tracking-wide uppercase">
                {(user as any)?.workspace?.name || 'Primary Workspace'}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-jakarta tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <button onClick={() => handleAction('Task Modal')} disabled={!!isActionLoading} className="flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-[#09090B] hover:bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/50 text-slate-900 dark:text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex disabled:opacity-50">
              {isActionLoading === 'Task Modal' ? <Activity size={16} className="text-slate-500 dark:text-slate-400 animate-spin" /> : <CheckSquare size={16} className="text-slate-500 dark:text-slate-400" />} Create Task
            </button>
            <button onClick={() => handleAction('Proposal Draft', '/proposals')} disabled={!!isActionLoading} className="flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-[#09090B] hover:bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/50 text-slate-900 dark:text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex disabled:opacity-50">
              {isActionLoading === 'Proposal Draft' ? <Activity size={16} className="text-slate-500 dark:text-slate-400 animate-spin" /> : <FileText size={16} className="text-slate-500 dark:text-slate-400" />} New Proposal
            </button>
            <button onClick={() => handleAction('Project Setup', '/projects')} disabled={!!isActionLoading} className="flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-[#09090B] hover:bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/50 text-slate-900 dark:text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex disabled:opacity-50">
              {isActionLoading === 'Project Setup' ? <Activity size={16} className="text-slate-500 dark:text-slate-400 animate-spin" /> : <Briefcase size={16} className="text-slate-500 dark:text-slate-400" />} New Project
            </button>
            <button onClick={() => handleAction('Lead Form', '/prospects')} disabled={!!isActionLoading} className="flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex disabled:opacity-50">
              {isActionLoading === 'Lead Form' ? <Activity size={16} className="animate-spin" /> : <Plus size={16} />} Add Lead
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN (MAIN CONTENT) */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Command Center (KPI Cards) */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-bold font-jakarta text-slate-900 dark:text-white mb-4 tracking-tight flex items-center gap-2">
                <LayoutGrid size={18} className="text-[#2563EB]" /> Command Center
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Metric 1: Revenue */}
                <div className="group bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 lg:p-8 flex flex-col gap-4 hover:border-[#2563EB]/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/5 blur-[40px] rounded-full group-hover:bg-[#2563EB]/10 transition-colors"></div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="w-10 h-10 rounded-[12px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                       <DollarSign size={18} />
                     </div>
                     <span className="text-[11px] font-bold text-[#10B981] flex items-center gap-1 bg-[#10B981]/10 px-2 py-1 rounded-md">
                        <ArrowUpRight size={12} /> 12.5%
                     </span>
                   </div>
                   <div className="relative z-10 mt-2">
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-widest">Revenue</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{formatCurrency(stats?.thisMonthIncome || 0)}</p>
                   </div>
                </div>

                {/* Metric 2: Active Projects */}
                <div className="group bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 lg:p-8 flex flex-col gap-4 hover:border-[#7C3AED]/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)] transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 blur-[40px] rounded-full group-hover:bg-[#7C3AED]/10 transition-colors"></div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="w-10 h-10 rounded-[12px] bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                       <Briefcase size={18} />
                     </div>
                     <span className="text-[11px] font-bold text-[#10B981] flex items-center gap-1 bg-[#10B981]/10 px-2 py-1 rounded-md">
                        <ArrowUpRight size={12} /> 4 New
                     </span>
                   </div>
                   <div className="relative z-10 mt-2">
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-widest">Active Projects</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.activeProjects || 0}</p>
                   </div>
                </div>

                {/* Metric 3: Leads */}
                <div className="group bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 lg:p-8 flex flex-col gap-4 hover:border-[#F59E0B]/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/5 blur-[40px] rounded-full group-hover:bg-[#F59E0B]/10 transition-colors"></div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="w-10 h-10 rounded-[12px] bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
                       <Users size={18} />
                     </div>
                     <span className="text-[11px] font-bold text-[#F59E0B] flex items-center gap-1 bg-[#F59E0B]/10 px-2 py-1 rounded-md">
                        <ArrowRight size={12} /> Steady
                     </span>
                   </div>
                   <div className="relative z-10 mt-2">
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-widest">New Leads</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.newLeadsToday || 0}</p>
                   </div>
                </div>

                {/* Metric 4: Clients */}
                <div className="group bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 lg:p-8 flex flex-col gap-4 hover:border-[#10B981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 blur-[40px] rounded-full group-hover:bg-[#10B981]/10 transition-colors"></div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="w-10 h-10 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                       <Globe size={18} />
                     </div>
                     <span className="text-[11px] font-bold text-[#10B981] flex items-center gap-1 bg-[#10B981]/10 px-2 py-1 rounded-md">
                        <ArrowUpRight size={12} /> 2 New
                     </span>
                   </div>
                   <div className="relative z-10 mt-2">
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-widest">Active Clients</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.activeClients || 0}</p>
                   </div>
                </div>

                {/* Metric 5: Pending Tasks */}
                <div className="group bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 lg:p-8 flex flex-col gap-4 hover:border-[#EF4444]/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444]/5 blur-[40px] rounded-full group-hover:bg-[#EF4444]/10 transition-colors"></div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="w-10 h-10 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444]">
                       <Clock size={18} />
                     </div>
                     <span className="text-[11px] font-bold text-[#EF4444] flex items-center gap-1 bg-[#EF4444]/10 px-2 py-1 rounded-md">
                        <AlertCircle size={12} /> 8 Overdue
                     </span>
                   </div>
                   <div className="relative z-10 mt-2">
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-widest">Pending Tasks</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.pendingTasks || 0}</p>
                   </div>
                </div>

                {/* Metric 6: Monthly Growth */}
                <div className="group bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6 lg:p-8 flex flex-col gap-4 hover:border-[#0EA5E9]/50 hover:shadow-[0_0_30px_rgba(14,165,233,0.1)] transition-all cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#0EA5E9]/5 blur-[40px] rounded-full group-hover:bg-[#0EA5E9]/10 transition-colors"></div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="w-10 h-10 rounded-[12px] bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9]">
                       <TrendingUp size={18} />
                     </div>
                     <span className="text-[11px] font-bold text-[#10B981] flex items-center gap-1 bg-[#10B981]/10 px-2 py-1 rounded-md">
                        <ArrowUpRight size={12} /> Target Met
                     </span>
                   </div>
                   <div className="relative z-10 mt-2">
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-widest">Monthly Growth</p>
                     <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stats?.monthlyGrowth || 0}%</p>
                   </div>
                </div>

              </div>
            </motion.div>

            {/* Analytics Section */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold font-jakarta text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <BarChartIcon size={18} className="text-[#2563EB]" /> Analytics Overview
                </h2>
                <Link href="/finance" className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 hover:underline transition-colors flex items-center gap-1">View Full Report <ChevronRight size={14} /></Link>
              </div>
              
              <Card className="h-[400px] flex flex-col p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Revenue Trend</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Income generated over the selected period.</p>
                  </div>
                  <select 
                    value={revenueFilter}
                    onChange={(e) => setRevenueFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer outline-none focus:border-[#2563EB]"
                  >
                    <option value="30days">Last 30 Days</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                <div className="flex-1 w-full -ml-4 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={revenueFilter === '30days' ? revenueTrend30Days : revenueFilter === '6months' ? revenueTrend6Months : revenueTrendYear} 
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevPremium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232734" vertical={false} />
                      <XAxis dataKey="dateStr" stroke="#CBD5E1" fontSize={12} fontWeight={600} axisLine={false} tickLine={false} tickMargin={12} />
                      <YAxis stroke="#CBD5E1" fontSize={12} fontWeight={600} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tickMargin={12} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }} />
                      <Area type="monotone" dataKey="Income" stroke="#2563EB" strokeWidth={3} fill="url(#colorRevPremium)" activeDot={{ r: 6, fill: '#2563EB', stroke: '#11131A', strokeWidth: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lead Funnel */}
                <Card className="flex flex-col p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Lead Funnel</h3>
                    <PieChartIcon size={16} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-5 mt-2">
                    {pipelineData.slice(0, 4).map((stage, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-24 text-right flex-shrink-0">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{stage.name}</p>
                        </div>
                        <div className="flex-1 h-6 bg-slate-100 dark:bg-[#09090B] rounded-full border border-slate-200 dark:border-[#232734] overflow-hidden relative">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: stage.width }}
                             transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                             className="h-full absolute left-0 top-0 bottom-0 rounded-full"
                             style={{ background: stage.gradient }}
                           />
                        </div>
                        <div className="w-10 flex-shrink-0 text-right">
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{stage.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Sales Pipeline */}
                <Card className="flex flex-col p-6">
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Sales Pipeline</h3>
                     <Layers size={16} className="text-slate-500 dark:text-slate-400" />
                   </div>
                     <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734]">
                       <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] ml-1"></div>
                         <div>
                           <p className="text-sm font-bold text-slate-900 dark:text-white">Pending Proposals</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{stats?.pendingProposals || 0} deals</p>
                         </div>
                       </div>
                       <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(salesPipeline?.Pending || 0)}</p>
                     </div>
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734]">
                       <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] ml-1"></div>
                         <div>
                           <p className="text-sm font-bold text-slate-900 dark:text-white">Accepted Proposals</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Won</p>
                         </div>
                       </div>
                       <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{formatCurrency(salesPipeline?.Accepted || 0)}</p>
                     </div>
                   </div>
                </Card>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN (SIDEBAR) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* AI Insights Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-[#11131A] dark:to-[#09090B] relative overflow-hidden border-slate-200 dark:border-[#232734] p-6 lg:p-8">
                 <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#7C3AED]/20 blur-[50px] rounded-full pointer-events-none"></div>
                 <div className="flex justify-between items-center mb-5 relative z-10">
                   <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                      <Sparkles size={16} className="text-[#7C3AED]" /> AI Insights 
                   </h3>
                   <span className="text-[10px] uppercase tracking-wider bg-[#7C3AED]/20 text-[#7C3AED] px-2 py-0.5 rounded-md font-bold">Beta</span>
                 </div>
                 <div className="relative z-10">
                   <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 font-medium italic">"{aiInsights || "Based on your activity, here is what you should focus on today."}"</p>
                   
                   <div className="space-y-4">
                     {dashboardData.upcomingDeadlines?.length > 0 ? (
                       <div className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734]">
                         <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0 border border-[#F59E0B]/20 text-[#F59E0B]">
                           <AlertCircle size={14} />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Upcoming Deadlines</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">You have {dashboardData.upcomingDeadlines.length} project deadline(s) approaching.</p>
                         </div>
                       </div>
                     ) : (
                       <div className="text-center py-4">
                         <p className="text-sm text-slate-500 dark:text-slate-400">No urgent deadlines right now.</p>
                       </div>
                     )}

                   </div>
                 </div>
              </Card>
            </motion.div>

            {/* Today's Tasks */}
            <motion.div variants={itemVariants}>
              <Card className="p-6 lg:p-8">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <CheckSquare size={16} className="text-slate-500 dark:text-slate-400" /> Today's Tasks
                  </h3>
                  <Link href="/roadmap" className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 hover:underline transition-colors">View All</Link>
                </div>
                <div className="space-y-3">
                  {dashboardData.todayTasks?.length > 0 ? (
                    dashboardData.todayTasks.map((task: any) => (
                      <div key={task.id} className="flex gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0 text-[#2563EB]">
                          <CheckSquare size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{task.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status: {task.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-slate-500 dark:text-slate-400">No tasks due today.</p>
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
                <div className="space-y-4">
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
                <div className="space-y-5">
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

        {/* BOTTOM SECTION (TABLES) */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
           {/* Recent Leads Table */}
           <Card className="p-0 overflow-hidden h-full">
             <div className="p-6 border-b border-slate-200 dark:border-[#232734] flex justify-between items-center bg-white dark:bg-[#11131A]">
               <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Recent Leads</h3>
               <Link href="/prospects" className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 hover:underline transition-colors">View All</Link>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-[#09090B]">
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#232734]">Name</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#232734]">Company</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#232734]">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#232734]">
                   {dashboardData.recentLeads?.length > 0 ? dashboardData.recentLeads.map((lead: any) => (
                     <tr key={lead._id} onClick={() => router.push('/prospects')} className="hover:bg-slate-100 dark:hover:bg-[#09090B] even:bg-slate-50/50 dark:even:bg-[#09090B]/50 transition-colors group cursor-pointer">
                       <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">{lead.company_name}</td>
                       <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{lead.targetService || 'N/A'}</td>
                       <td className="px-6 py-5"><span className="inline-block whitespace-nowrap px-2 py-1 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold border border-[#2563EB]/20">{lead.outreach_status}</span></td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No recent leads found.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </Card>

           {/* Recent Transactions Table */}
           <Card className="p-0 overflow-hidden h-full">
             <div className="p-6 border-b border-slate-200 dark:border-[#232734] flex justify-between items-center bg-white dark:bg-[#11131A]">
               <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Recent Transactions</h3>
               <Link href="/finance" className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 hover:underline transition-colors">View All</Link>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-[#09090B]">
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#232734]">Client</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#232734]">Amount</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#232734]">Date</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#232734]">
                   {dashboardData.recentTransactions?.length > 0 ? dashboardData.recentTransactions.slice(0, 5).map((t: any) => (
                     <tr key={t._id} onClick={() => router.push('/finance')} className="hover:bg-slate-100 dark:hover:bg-[#09090B] even:bg-slate-50/50 dark:even:bg-[#09090B]/50 transition-colors group cursor-pointer">
                       <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">{t.platform || 'Direct'}</td>
                       <td className={`px-6 py-5 text-sm font-mono font-bold ${t.type === 'Income' ? 'text-[#10B981]' : 'text-rose-500'}`}>
                         {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
                       </td>
                       <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                         {new Date(t.date).toLocaleDateString()}
                       </td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No recent transactions found.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </Card>
        </motion.div>
        
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
                <button onClick={() => { toast.success(`${activeModal.split(' ')[0]} created successfully!`); closeModal(); }} className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]">
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
