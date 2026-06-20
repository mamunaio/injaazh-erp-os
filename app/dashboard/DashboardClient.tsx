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

interface DashboardClientProps {
  dashboardData: any;
  islamicQuote: any;
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
      <div className="neu-pressed p-3 rounded-2xl shadow-xl">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{label || payload[0].name}</p>
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
  <div className={`neu-flat transition-all p-6 ${className}`}>
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
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
};

export default function DashboardClient({ dashboardData, islamicQuote }: DashboardClientProps) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen neu-base-bg p-8 flex items-center justify-center">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] w-full">
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full neu-flat animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-4 rounded-full neu-pressed"></div>
            <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-indigo-500 border-r-purple-500 animate-[spin_1.5s_cubic-bezier(0.68,-0.55,0.265,1.55)_infinite]"></div>
            <div className="w-12 h-12 rounded-full neu-button flex items-center justify-center z-10 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 animate-pulse tracking-wide">
              Injaazh Global
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase mt-2">
              Preparing Workspace
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen neu-base-bg p-8 flex items-center justify-center">
        <GlassCard className="text-center p-12">
          <AlertCircle size={48} className="text-rose-400 mx-auto mb-4" />
          <h2 className="">Failed to load dashboard data</h2>
        </GlassCard>
      </div>
    );
  }

  const { stats, upcomingDeadlines, recentTransactions, recentLeads, projectStatusDistribution, platformIncome, incomeTrend, seoProjects } = dashboardData;

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

  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return (
      <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-800 dark:text-slate-200 overflow-hidden">
        <motion.div 
          className="max-w-[1400px] mx-auto space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h1 className="mb-3">
                Hello, {user?.name || 'Team Member'}!
              </h1>
              <p className="text-slate-500 dark:text-slate-500 text-sm font-inter font-medium tracking-wide">
                Welcome back to your workspace dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              {user?.permissions?.includes('leads') && (
                <Link href="/leads">
                  <button className="flex items-center gap-2 px-6 py-3 neu-button text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl">
                    <Plus size={18} className="text-indigo-400" /> Add Lead
                  </button>
                </Link>
              )}
              {user?.permissions?.includes('outreach') && (
                <Link href="/outreach">
                  <button className="flex items-center gap-2 px-6 py-3 neu-button text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl">
                    <Plus size={18} className="text-teal-400" /> Create Outreach
                  </button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Daily Islamic Insight */}
          {islamicQuote && (
            <motion.div variants={itemVariants} className="mb-6">
              <GlassCard className="relative overflow-hidden group p-0 flex flex-col">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <BookOpen size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2">
                        আজকের ইসলামিক বার্তা
                      </h3>
                      <p className="text-sm font-inter text-slate-500 dark:text-slate-500 tracking-wide">
                        {new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content - Two Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/50 relative z-10">
                  
                  {/* Ayah Column */}
                  {islamicQuote.ayah && (
                    <div className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">কোরআনের আয়াত</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-arabic text-emerald-600 dark:text-emerald-400 mb-2 leading-relaxed" dir="rtl">
                          {islamicQuote.ayah.arabic}
                        </p>
                        <p className="text-sm font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest">{islamicQuote.ayah.reference}</p>
                      </div>
                      <div className="p-4 neu-pressed flex-1">
                        <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {islamicQuote.ayah.translation}
                        </p>
                      </div>
                      {islamicQuote.ayah.asbabAlNuzul && (
                        <div className="mt-2 pl-4 border-l-2 border-emerald-500/30">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">শানে নুযুল (প্রেক্ষাপট)</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {islamicQuote.ayah.asbabAlNuzul}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hadith Column */}
                  {islamicQuote.hadith && (
                    <div className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">ডেইলি হাদিস</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-arabic text-teal-600 dark:text-teal-400 mb-2 leading-relaxed" dir="rtl">
                          {islamicQuote.hadith.arabic}
                        </p>
                        <p className="text-sm font-bold text-teal-600/80 dark:text-teal-400/80 uppercase tracking-widest">{islamicQuote.hadith.reference}</p>
                      </div>
                      <div className="p-4 neu-pressed flex-1">
                        <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {islamicQuote.hadith.translation}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Today's Work Updates Section */}
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-555 text-amber-500 animate-pulse" />
              Today's Work Updates (আজকের কাজের আপডেট)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants}>
                <GlassCard className="relative overflow-hidden group flex flex-col justify-between h-full border-l-4 border-l-indigo-500 dark:border-l-indigo-400">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                  <div>
                    <p className="text-sm font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">New Leads Today</p>
                    <h3 className="mb-2 text-2xl font-bold">{stats.newLeadsToday || 0}</h3>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50 text-sm text-slate-405 dark:text-slate-500 font-medium">
                    Leads created in the last 24 hours
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={itemVariants}>
                <GlassCard className="relative overflow-hidden group flex flex-col justify-between h-full border-l-4 border-l-teal-500 dark:border-l-teal-400">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all"></div>
                  <div>
                    <p className="text-sm font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Leads Updated Today</p>
                    <h3 className="mb-2 text-2xl font-bold">{stats.leadsUpdatedToday || 0}</h3>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50 text-sm text-slate-405 dark:text-slate-500 font-medium">
                    Leads modified or followed up today
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={itemVariants}>
                <GlassCard className="relative overflow-hidden group flex flex-col justify-between h-full border-l-4 border-l-pink-500 dark:border-l-pink-400">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all"></div>
                  <div>
                    <p className="text-sm font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Outreach Conducted Today</p>
                    <h3 className="mb-2 text-2xl font-bold">{stats.outreachAddedToday || 0}</h3>
                  </div>
                  <div className="pt-2 border-t border-slate-800/50 text-sm text-slate-405 dark:text-slate-500 font-medium">
                    Log entries recorded today
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </motion.div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants}>
              <GlassCard className="relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Users size={22} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                  <p className="text-sm font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total Leads Tracked</p>
                  <h3 className="mb-2 text-2xl font-bold">{stats.totalLeads}</h3>
                </div>
                <div className="pt-2 border-t border-slate-800/50 text-sm text-slate-400 dark:text-slate-500">
                  Total logged prospects in database
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard className="relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                      <Users size={22} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                  <p className="text-sm font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Active Outreach Leads</p>
                  <h3 className="mb-2 text-2xl font-bold">{stats.activeLeads}</h3>
                </div>
                <div className="pt-2 border-t border-slate-800/50 text-sm text-slate-400 dark:text-slate-500">
                  Leads currently being actively nurtured
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard className="relative overflow-hidden group flex flex-col justify-between h-full">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all"></div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                      <Percent size={20} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                  <p className="text-sm font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Lead Conversion Rate</p>
                  <h3 className="mb-2 text-2xl font-bold">{stats.leadConversionRate}%</h3>
                </div>
                <div className="pt-2 border-t border-slate-800/50 text-sm text-slate-400 dark:text-slate-500">
                  Percentage of won/closed deals
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Leads Details (spans full width/12) */}
          <div className="grid grid-cols-1 gap-6">
            <motion.div variants={itemVariants}>
              <GlassCard className="flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="flex items-center gap-2">
                    <Users size={16} className="text-teal-500" />
                    Recent Leads & Prospects
                  </h3>
                  <Link href="/leads" className="text-sm font-bold text-teal-500 hover:text-teal-400">View all</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/50 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Company Name</th>
                        <th className="py-3 px-4">Target Service</th>
                        <th className="py-3 px-4">Outreach Status</th>
                        <th className="py-3 px-4">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLeads.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm font-bold text-slate-400">No leads available.</td>
                        </tr>
                      ) : (
                        recentLeads.map((lead: any) => {
                          const status = lead.outreach_status;
                          const statusColor = 
                            status === 'Meeting Booked' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                            status === 'Replied' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                            status === 'Contacted' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                            status === 'Closed' ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20' :
                            'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
                          return (
                            <tr key={lead._id} className="border-b border-slate-800/50 hover:neu-pressed transition-colors text-base font-medium">
                              <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-250">{lead.company_name}</td>
                              <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{lead.targetService}</td>
                              <td className="py-4 px-4">
                                <span className={`text-sm font-black uppercase px-2.5 py-1 rounded-full border ${statusColor}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
        
      </div>
    );
  }

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
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-800 dark:text-slate-200 overflow-hidden">
      <motion.div 
        className="max-w-[1400px] mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="mb-3">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-500 text-base font-inter font-medium tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/leads">
              <button className="flex items-center gap-2 px-6 py-3 neu-button text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl">
                <Plus size={18} className="text-teal-400" /> Add Lead
              </button>
            </Link>
            <Link href="/proposals">
              <button className="flex items-center gap-2 px-6 py-3 neu-button text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl">
                <FileText size={18} className="text-amber-400" /> Create Proposal
              </button>
            </Link>
            <Link href="/money">
              <button className="flex items-center gap-2 px-6 py-3 neu-button text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl">
                <Plus size={18} className="text-pink-400" /> Add Transaction
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Daily Islamic Insight */}
        {islamicQuote && (
          <motion.div variants={itemVariants} className="mb-6">
            <GlassCard className="relative overflow-hidden group p-0 flex flex-col">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              
              {/* Header */}
              <div className="p-6 border-b border-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2">
                      আজকের ইসলামিক বার্তা
                    </h3>
                    <p className="text-sm font-inter text-slate-500 dark:text-slate-500 tracking-wide">
                      {new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content - Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/50 relative z-10">
                
                {/* Ayah Column */}
                {islamicQuote.ayah && (
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">কোরআনের আয়াত</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-arabic text-emerald-600 dark:text-emerald-400 mb-2 leading-relaxed" dir="rtl">
                        {islamicQuote.ayah.arabic}
                      </p>
                      <p className="text-sm font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest">{islamicQuote.ayah.reference}</p>
                    </div>
                    <div className="p-4 neu-pressed flex-1">
                      <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {islamicQuote.ayah.translation}
                      </p>
                    </div>
                    {islamicQuote.ayah.asbabAlNuzul && (
                      <div className="mt-2 pl-4 border-l-2 border-emerald-500/30">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">শানে নুযুল (প্রেক্ষাপট)</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {islamicQuote.ayah.asbabAlNuzul}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Hadith Column */}
                {islamicQuote.hadith && (
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">ডেইলি হাদিস</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-arabic text-teal-600 dark:text-teal-400 mb-2 leading-relaxed" dir="rtl">
                        {islamicQuote.hadith.arabic}
                      </p>
                      <p className="text-sm font-bold text-teal-600/80 dark:text-teal-400/80 uppercase tracking-widest">{islamicQuote.hadith.reference}</p>
                    </div>
                    <div className="p-4 neu-pressed flex-1">
                      <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {islamicQuote.hadith.translation}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Bento Grid Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Stat Card 1: Revenue & Cash Flow (spans 3) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group h-full flex flex-col justify-between hover:border-pink-500/30 dark:hover:border-pink-500/30 transition-all">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-3xl group-hover:bg-pink-500/20 dark:group-hover:bg-pink-500/30 transition-all"></div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 dark:shadow-pink-500/50">
                    <DollarSign size={22} className="text-white drop-shadow-md" />
                  </div>
                  <Link href="/money" className="text-sm font-jakarta font-bold text-slate-400 dark:text-slate-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors flex items-center gap-1 neu-pressed px-2.5 py-1.5 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-sm font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Total Income (Revenue)</p>
                <h3 className="mb-4 text-3xl font-bold">
                  {formatCurrency(stats.totalIncome)}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800/50">
                <div className="flex justify-between items-center text-sm font-inter font-semibold">
                  <span className="text-slate-500 dark:text-slate-500">Net Profit</span>
                  <span className="text-teal-600 dark:text-teal-400 flex items-center gap-0.5 font-mono"><ArrowUpRight size={14} /> {formatCurrency(stats.netProfit)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-inter font-semibold">
                  <span className="text-slate-500 dark:text-slate-500">Expenses</span>
                  <span className="text-rose-500 flex items-center gap-0.5 font-mono"><TrendingDown size={14} /> {formatCurrency(stats.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-inter text-slate-400 dark:text-slate-600">
                  <span>This month</span>
                  <span className="font-mono font-extrabold text-pink-500">+{formatCurrency(stats.thisMonthIncome)}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Bento Stat Card 2: Active Projects & Pending Milestones (spans 3) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group h-full flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl group-hover:bg-amber-400/20 transition-all"></div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                    <Briefcase size={22} className="text-amber-600 dark:text-amber-400 drop-shadow-md" />
                  </div>
                  <Link href="/projects" className="text-sm font-bold text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-1 neu-pressed px-2 py-1 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Projects Pipeline</p>
                <h3 className="mb-4 text-3xl font-bold">
                  {stats.totalProjects}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800/50">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Active Projects</span>
                  <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {stats.activeProjects}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Pending Milestones</span>
                  <span className="text-amber-500">{formatCurrency(stats.pendingMilestoneValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span>Completed</span>
                  <span className="font-extrabold text-slate-600 dark:text-slate-300">{projectStatusDistribution['Completed'] || 0} projects</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Bento Stat Card 3: Proposal Pipeline (spans 3) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group h-full flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-400/10 rounded-full blur-3xl group-hover:bg-violet-400/20 transition-all"></div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-[0_0_15px_rgba(167,139,250,0.2)]">
                    <FileText size={22} className="text-violet-600 dark:text-violet-400 drop-shadow-md" />
                  </div>
                  <Link href="/proposals" className="text-sm font-bold text-slate-400 hover:text-violet-500 transition-colors flex items-center gap-1 neu-pressed px-2 py-1 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Proposal Pipeline</p>
                <h3 className="mb-4 text-3xl font-bold truncate" title={formatCurrency(stats.outstandingPipelineValue)}>
                  {formatCurrency(stats.outstandingPipelineValue)}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800/50">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Pending Decisions</span>
                  <span className="text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span> {stats.pendingProposals}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Closed Won Value</span>
                  <span className="text-teal-500">{formatCurrency(stats.acceptedProposalsValue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span>Total Proposals</span>
                  <span className="font-extrabold text-slate-600 dark:text-slate-300">{stats.totalProposals} items</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Bento Stat Card 4: Sales Pipeline & Win Rates (spans 3) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 xl:col-span-3">
            <GlassCard className="relative overflow-hidden group h-full flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl group-hover:bg-teal-400/20 transition-all"></div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                    <Users size={22} className="text-teal-600 dark:text-teal-400 drop-shadow-md" />
                  </div>
                  <Link href="/leads" className="text-sm font-bold text-slate-400 hover:text-teal-500 transition-colors flex items-center gap-1 neu-pressed px-2 py-1 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Sales Leads</p>
                <h3 className="mb-4 text-3xl font-bold">
                  {stats.totalLeads}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800/50">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Active Outreach</span>
                  <span className="text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span> {stats.activeLeads}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-500">Conversion Rate</span>
                  <span className="text-teal-500 flex items-center gap-0.5"><Percent size={10} /> {stats.leadConversionRate}%</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span>Target Outreach</span>
                  <span className="font-extrabold text-slate-600 dark:text-slate-300">Win + Nurture</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Income Trend Area Chart (spans 8) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-8">
            <GlassCard className="h-full min-h-[360px] flex flex-col">
              <h3 className="mb-6 flex items-center gap-2">
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

          {/* Project Status (Pie Chart - spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[360px] flex flex-col">
              <h3 className="mb-4 flex items-center gap-2">
                <PieChartIcon size={16} className="text-teal-500" />
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

          {/* NEW PREMIUM BENTO CARD: SEO & AEO Visibility Tracker Summary (spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2">
                  <Globe size={16} className="text-indigo-500" />
                  SEO & AEO Visibility
                </h3>
                <Link href="/seo" className="text-sm font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                  Tracker <ChevronRight size={14} />
                </Link>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {seoProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                    <Globe size={24} className="mb-2 text-indigo-500 animate-pulse" />
                    <p className="text-sm font-bold">No websites tracked yet</p>
                    <Link href="/seo" className="text-xs text-indigo-400 underline mt-1">Configure in SEO Hub</Link>
                  </div>
                ) : (
                  seoProjects.map((p: any) => {
                    const perf = p.lighthouse.performance;
                    const perfColor = perf >= 90 ? 'text-emerald-500' : perf >= 50 ? 'text-amber-500' : 'text-rose-500';
                    return (
                      <div key={p.id} className="p-3.5 rounded-2xl neu-pressed  transition-all border border-transparent hover:border-slate-800/50 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="truncate max-w-[150px]">{p.clientName}</h4>
                            <p className="text-sm text-slate-400 truncate max-w-[170px]">{p.url.replace(/https?:\/\/(www\.)?/, '')}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-400">Lighthouse:</span>
                            <span className={`text-sm font-black ${perfColor}`}>{perf}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 dark:border-white/5 text-sm font-bold text-slate-500">
                          <div className="flex justify-between">
                            <span>ChatGPT Mentions:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-extrabold">{p.aeo.chatgptMentions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Perplexity Visibility:</span>
                            <span className="text-indigo-500 font-extrabold">{p.aeo.perplexityScore}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Recent Activity List (spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2">
                  <Sparkles size={16} className="text-pink-500" />
                  Recent Activity
                </h3>
                <Link href="/money" className="text-sm font-bold text-pink-500 hover:text-pink-400">View all</Link>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm font-bold text-slate-400 text-center py-8">No recent activity.</p>
                ) : (
                  recentTransactions.slice(0, 4).map((transaction: any) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 rounded-2xl neu-pressed  transition-colors border border-transparent hover:border-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.type === 'Income' ? 'bg-teal-500/20 text-teal-500' : 'bg-rose-500/20 text-rose-500'}`}>
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{transaction.category}</p>
                          <p className="text-sm font-bold text-slate-500">{transaction.platform} • {getRelativeTime(transaction.date)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-black ${transaction.type === 'Income' ? 'text-teal-500' : 'text-rose-500'}`}>
                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* NEW BENTO CARD: Recent Leads & Prospects Pipeline (spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2">
                  <Users size={16} className="text-teal-500" />
                  Prospects & Leads
                </h3>
                <Link href="/leads" className="text-sm font-bold text-teal-500 hover:text-teal-400">View all</Link>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {recentLeads.length === 0 ? (
                  <p className="text-sm font-bold text-slate-400 text-center py-8">No leads logged.</p>
                ) : (
                  recentLeads.slice(0, 4).map((lead: any) => {
                    const status = lead.outreach_status;
                    const statusColor = 
                      status === 'Meeting Booked' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                      status === 'Replied' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                      status === 'Contacted' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      status === 'Closed' ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20' :
                      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

                    return (
                      <div key={lead._id} className="flex items-center justify-between p-3 rounded-2xl neu-pressed  transition-colors border border-transparent hover:border-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/10">
                            <Users size={16} className="text-teal-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{lead.company_name}</p>
                            <p className="text-sm font-bold text-slate-400 truncate max-w-[140px]">{lead.targetService}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-black uppercase px-2 py-1 rounded-full border ${statusColor}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Platform Income Comparison (spans 8) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-8">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <h3 className="mb-6 flex items-center gap-2">
                <BarChartIcon size={16} className="text-amber-500" />
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
                  <BarChartIcon size={32} className="mb-2" />
                  <p className="text-sm font-bold">No data available</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Upcoming Deadlines (spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <h3 className="mb-6 flex items-center gap-2">
                <Calendar size={16} className="text-violet-500" />
                Deadlines
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {upcomingDeadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                    <Clock size={24} className="mb-2" />
                    <p className="text-sm font-bold">All caught up!</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((project: any) => (
                    <div key={project._id} className="p-3 rounded-2xl neu-pressed  transition-colors border border-transparent hover:border-slate-800/50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="truncate pr-2">{project.title}</h4>
                        <span className="text-sm font-black uppercase text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">{formatDate(project.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-black text-slate-500">{project.progress}%</span>
                      </div>
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
