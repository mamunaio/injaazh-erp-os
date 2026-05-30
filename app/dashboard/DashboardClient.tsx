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
import AIAssistantWidget from '@/components/AIAssistantWidget';
import { useUser } from '@/components/layout/UserContext';

interface DashboardClientProps {
  dashboardData: any;
  dailyInsights: any;
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
  <div className={`bg-white/80 dark:bg-[#151B2E]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-xl dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all rounded-2xl p-6 ${className}`}>
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

export default function DashboardClient({ dashboardData, dailyInsights, islamicQuote }: DashboardClientProps) {
  const { user } = useUser();
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

  if (user?.role === 'team_member') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0B0E1A] dark:via-[#0F1220] dark:to-[#0B0E1A] p-4 md:p-8 text-slate-800 dark:text-slate-200 overflow-hidden">
        <motion.div 
          className="max-w-[1400px] mx-auto space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-jakarta font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-3 drop-shadow-sm tracking-tight leading-none">
                Hello, {user.name}!
              </h1>
              <p className="text-slate-500 dark:text-slate-500 text-sm font-inter font-medium tracking-wide">
                Welcome back to your workspace dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              {user.permissions?.includes('leads') && (
                <Link href="/leads">
                  <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-jakarta font-bold text-sm rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                    <Plus size={18} /> Add Lead
                  </button>
                </Link>
              )}
              {user.permissions?.includes('outreach') && (
                <Link href="/outreach">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white/85 dark:bg-[#1A2235]/85 border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl hover:bg-white dark:hover:bg-[#1A2235] hover:shadow-lg transition-all">
                    <Plus size={18} /> Create Outreach
                  </button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Daily Quote / Greeting Card (spans full width) */}
          {islamicQuote && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 mb-6">
              <GlassCard className="relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <BookOpen size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-jakarta font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                        Daily Quote
                      </h3>
                      <p className="text-[11px] font-inter text-slate-500 dark:text-slate-500 tracking-wide">আজকের বাণী</p>
                    </div>
                  </div>
                  <div className="flex-1 max-w-2xl text-center md:text-right">
                    <p className="text-xl font-arabic text-emerald-600 dark:text-emerald-400 mb-1 leading-relaxed" dir="rtl">{islamicQuote.text}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-350">{islamicQuote.translation} — <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{islamicQuote.reference}</span></p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

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
                  <p className="text-xs font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total Leads Tracked</p>
                  <h3 className="text-4xl font-jakarta font-black text-slate-800 dark:text-white mb-2">{stats.totalLeads}</h3>
                </div>
                <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 text-xs text-slate-400 dark:text-slate-500">
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
                  <p className="text-xs font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Active Outreach Leads</p>
                  <h3 className="text-4xl font-jakarta font-black text-slate-800 dark:text-white mb-2">{stats.activeLeads}</h3>
                </div>
                <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 text-xs text-slate-400 dark:text-slate-500">
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
                  <p className="text-xs font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Lead Conversion Rate</p>
                  <h3 className="text-4xl font-jakarta font-black text-slate-800 dark:text-white mb-2">{stats.leadConversionRate}%</h3>
                </div>
                <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 text-xs text-slate-400 dark:text-slate-500">
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
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} className="text-teal-500" />
                    Recent Leads & Prospects
                  </h3>
                  <Link href="/leads" className="text-xs font-bold text-teal-500 hover:text-teal-400">View all</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-white/5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Company Name</th>
                        <th className="py-3 px-4">Target Service</th>
                        <th className="py-3 px-4">Outreach Status</th>
                        <th className="py-3 px-4">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLeads.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs font-bold text-slate-400">No leads available.</td>
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
                            <tr key={lead._id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-500/5 transition-colors text-sm font-medium">
                              <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-250">{lead.company_name}</td>
                              <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{lead.targetService}</td>
                              <td className="py-4 px-4">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusColor}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
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
        
        {/* Custom AI Widget only if they have outreach/leads permissions */}
        {(user.permissions?.includes('leads') || user.permissions?.includes('outreach')) && (
          <AIAssistantWidget />
        )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0B0E1A] dark:via-[#0F1220] dark:to-[#0B0E1A] p-4 md:p-8 text-slate-800 dark:text-slate-200 overflow-hidden">
      <motion.div 
        className="max-w-[1400px] mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-6xl md:text-7xl font-jakarta font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-3 drop-shadow-sm tracking-tight leading-none">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-500 text-base font-inter font-medium tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/leads">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/80 dark:bg-[#1A2235]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl hover:bg-white dark:hover:bg-[#1A2235] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                <Plus size={18} /> Add Lead
              </button>
            </Link>
            <Link href="/proposals">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/80 dark:bg-[#1A2235]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 font-jakarta font-bold text-sm rounded-xl hover:bg-white dark:hover:bg-[#1A2235] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                <FileText size={18} /> Create Proposal
              </button>
            </Link>
            <Link href="/money">
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-jakarta font-bold text-sm rounded-xl hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all">
                <Plus size={18} /> Add Transaction
              </button>
            </Link>
          </div>
        </motion.div>

        {/* AI Daily Insights & Islamic Quote Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* AI Daily Insights (2 columns) */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-jakarta font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    AI Daily Insights
                  </h3>
                  <p className="text-[11px] font-inter text-slate-500 dark:text-slate-500 tracking-wide">Today's Business Analysis</p>
                </div>
              </div>

              {dailyInsights ? (
                <div className="space-y-4 relative z-10">
                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-500/20">
                    <p className="text-[15px] font-inter text-slate-700 dark:text-slate-300 leading-relaxed tracking-wide">
                      {dailyInsights.summary}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h4 className="text-xs font-jakarta font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" />
                      Highlights
                    </h4>
                    <div className="space-y-2.5">
                      {dailyInsights.highlights.map((highlight: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-[13px] font-inter text-slate-600 dark:text-slate-400 leading-relaxed">
                          <CheckCircle2 size={16} className="text-teal-500 mt-0.5 flex-shrink-0" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-xs font-jakarta font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <Lightbulb size={12} className="text-yellow-500" />
                      Today's Recommendations
                    </h4>
                    <div className="space-y-2.5">
                      {dailyInsights.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-[13px] font-inter text-slate-600 dark:text-slate-400 leading-relaxed">
                          <ArrowRight size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mood Indicator */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500">Business Mood:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      dailyInsights.mood === 'positive' 
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' 
                        : dailyInsights.mood === 'attention'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                    }`}>
                      {dailyInsights.mood === 'positive' ? '✨ Positive' : dailyInsights.mood === 'attention' ? '⚠️ Needs Attention' : '📊 Neutral'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles size={32} className="mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="text-xs font-bold">Loading insights...</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Islamic Quote (1 column) */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <GlassCard className="relative overflow-hidden group h-full flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-jakarta font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    Daily Quote
                  </h3>
                  <p className="text-[11px] font-inter text-slate-500 dark:text-slate-500 tracking-wide">আজকের বাণী</p>
                </div>
              </div>

              {islamicQuote ? (
                <div className="space-y-4 relative z-10 flex-1 flex flex-col">
                  {/* Arabic Text */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-500/20 text-center">
                    <p className="text-xl font-arabic text-slate-800 dark:text-slate-200 leading-loose tracking-wide" dir="rtl">
                      {islamicQuote.text}
                    </p>
                  </div>

                  {/* Bengali Translation */}
                  <div className="flex-1">
                    <p className="text-[15px] font-inter text-slate-700 dark:text-slate-300 leading-relaxed text-center tracking-wide">
                      {islamicQuote.translation}
                    </p>
                  </div>

                  {/* Reference */}
                  <div className="pt-3 border-t border-slate-200/50 dark:border-white/5 text-center">
                    <p className="text-[11px] font-jakarta font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                      {islamicQuote.reference}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 flex-1 flex flex-col items-center justify-center">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-30 animate-pulse" />
                  <p className="text-xs font-bold">Loading quote...</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

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
                  <Link href="/money" className="text-xs font-jakarta font-bold text-slate-400 dark:text-slate-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors flex items-center gap-1 bg-white/50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-[10px] font-jakarta font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Total Income (Revenue)</p>
                <h3 className="text-5xl font-jakarta font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 mb-4 tracking-tight">
                  {formatCurrency(stats.totalIncome)}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                <div className="flex justify-between items-center text-xs font-inter font-semibold">
                  <span className="text-slate-500 dark:text-slate-500">Net Profit</span>
                  <span className="text-teal-600 dark:text-teal-400 flex items-center gap-0.5 font-mono"><ArrowUpRight size={14} /> {formatCurrency(stats.netProfit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-inter font-semibold">
                  <span className="text-slate-500 dark:text-slate-500">Expenses</span>
                  <span className="text-rose-500 flex items-center gap-0.5 font-mono"><TrendingDown size={14} /> {formatCurrency(stats.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-inter text-slate-400 dark:text-slate-600">
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
                  <Link href="/projects" className="text-xs font-bold text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-1 bg-white/30 dark:bg-slate-800/50 px-2 py-1 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Projects Pipeline</p>
                <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 mb-4">
                  {stats.totalProjects}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/20 dark:border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Active Projects</span>
                  <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {stats.activeProjects}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Pending Milestones</span>
                  <span className="text-amber-500">{formatCurrency(stats.pendingMilestoneValue)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
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
                  <Link href="/proposals" className="text-xs font-bold text-slate-400 hover:text-violet-500 transition-colors flex items-center gap-1 bg-white/30 dark:bg-slate-800/50 px-2 py-1 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Proposal Pipeline</p>
                <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 mb-4 truncate" title={formatCurrency(stats.outstandingPipelineValue)}>
                  {formatCurrency(stats.outstandingPipelineValue)}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/20 dark:border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Pending Decisions</span>
                  <span className="text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span> {stats.pendingProposals}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Closed Won Value</span>
                  <span className="text-teal-500">{formatCurrency(stats.acceptedProposalsValue)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
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
                  <Link href="/leads" className="text-xs font-bold text-slate-400 hover:text-teal-500 transition-colors flex items-center gap-1 bg-white/30 dark:bg-slate-800/50 px-2 py-1 rounded-lg backdrop-blur-md">
                    View <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Sales Leads</p>
                <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400 mb-4">
                  {stats.totalLeads}
                </h3>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/20 dark:border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Active Outreach</span>
                  <span className="text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span> {stats.activeLeads}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Conversion Rate</span>
                  <span className="text-teal-500 flex items-center gap-0.5"><Percent size={10} /> {stats.leadConversionRate}%</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Target Outreach</span>
                  <span className="font-extrabold text-slate-600 dark:text-slate-300">Win + Nurture</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Income Trend Area Chart (spans 8) */}
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

          {/* Project Status (Pie Chart - spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[360px] flex flex-col">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={16} className="text-indigo-500" />
                  SEO & AEO Visibility
                </h3>
                <Link href="/seo" className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                  Tracker <ChevronRight size={14} />
                </Link>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {seoProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                    <Globe size={24} className="mb-2 text-indigo-500 animate-pulse" />
                    <p className="text-xs font-bold">No websites tracked yet</p>
                    <Link href="/seo" className="text-[10px] text-indigo-400 underline mt-1">Configure in SEO Hub</Link>
                  </div>
                ) : (
                  seoProjects.map((p: any) => {
                    const perf = p.lighthouse.performance;
                    const perfColor = perf >= 90 ? 'text-emerald-500' : perf >= 50 ? 'text-amber-500' : 'text-rose-500';
                    return (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-white/20 dark:bg-slate-800/30 hover:bg-white/40 dark:hover:bg-slate-800/60 transition-all border border-transparent hover:border-white/20 dark:hover:border-slate-700/50 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{p.clientName}</h4>
                            <p className="text-[9px] text-slate-400 truncate max-w-[170px]">{p.url.replace(/https?:\/\/(www\.)?/, '')}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400">Lighthouse:</span>
                            <span className={`text-xs font-black ${perfColor}`}>{perf}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 dark:border-white/5 text-[10px] font-bold text-slate-500">
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

          {/* NEW BENTO CARD: Recent Leads & Prospects Pipeline (spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
            <GlassCard className="h-full min-h-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-teal-500" />
                  Prospects & Leads
                </h3>
                <Link href="/leads" className="text-xs font-bold text-teal-500 hover:text-teal-400">View all</Link>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {recentLeads.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 text-center py-8">No leads logged.</p>
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
                      <div key={lead._id} className="flex items-center justify-between p-3 rounded-2xl bg-white/20 dark:bg-slate-800/30 hover:bg-white/40 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-white/20 dark:hover:border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/10">
                            <Users size={16} className="text-teal-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{lead.company_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 truncate max-w-[140px]">{lead.targetService}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${statusColor}`}>
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
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2">
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
                  <p className="text-xs font-bold">No data available</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Upcoming Deadlines (spans 4) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 xl:col-span-4">
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
