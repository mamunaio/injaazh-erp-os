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
  LineChart,
  Line,
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
import AIAssistantWidget from '@/components/AIAssistantWidget';

interface DashboardClientProps {
  dashboardData: any;
}

const STATUS_COLORS: Record<string, string> = {
  'Planning': '#3b82f6',
  'In Progress': '#f59e0b',
  'In Review': '#a855f7',
  'Completed': '#10b981',
};

const PLATFORM_COLORS: Record<string, string> = {
  'Freelancer': '#3b82f6',
  'Direct': '#a855f7',
  'Upwork': '#10b981',
  'Fiverr': '#14b8a6',
};

export default function DashboardClient({ dashboardData }: DashboardClientProps) {
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Failed to load dashboard data</h2>
        </div>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600 dark:text-gray-400 text-base">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/leads">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-500/20 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:shadow-lg transition-all text-sm">
                <Plus size={18} /> Add Lead
              </button>
            </Link>
            <Link href="/proposals">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-500/20 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:shadow-lg transition-all text-sm">
                <FileText size={18} /> Create Proposal
              </button>
            </Link>
            <Link href="/money">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/40 transition-all text-sm">
                <Plus size={18} /> Add Transaction
              </button>
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <Users size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <Link href="/leads" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                View <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Leads</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.totalLeads}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {stats.activeLeads} active
                </span>
              </div>
            </div>
          </div>

          {/* Total Projects */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center border border-orange-100 dark:border-orange-500/20">
                <Briefcase size={24} className="text-orange-600 dark:text-orange-400" />
              </div>
              <Link href="/projects" className="text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors flex items-center gap-1">
                View <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Projects</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.totalProjects}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  {stats.activeProjects} active
                </span>
              </div>
            </div>
          </div>

          {/* Total Proposals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                <FileText size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <Link href="/proposals" className="text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors flex items-center gap-1">
                View <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Proposals</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.totalProposals}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  {stats.pendingProposals} pending
                </span>
              </div>
            </div>
          </div>

          {/* Total Income */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center border border-green-100 dark:border-green-500/20">
                <DollarSign size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <Link href="/money" className="text-xs font-semibold text-slate-500 hover:text-green-600 transition-colors flex items-center gap-1">
                View <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Income</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(stats.totalIncome)}</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <TrendingUp size={12} />
                  {formatCurrency(stats.thisMonthIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Row 2: Trend + Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income Trend */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-400" />
              Income Trend (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={incomeTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), 'Income']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ fill: '#ffffff', stroke: '#10b981', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Project Status Distribution */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <PieChart size={18} className="text-slate-400" />
              Project Status
            </h3>
            <div className="flex-1 min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} className="stroke-white dark:stroke-slate-900 stroke-[3px]" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Grid Row 3: Platform + Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Platform Income Comparison */}
        <div className="lg:col-span-2">
          {platformIncomeData.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-full">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <BarChart size={18} className="text-slate-400" />
                Platform Income
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={platformIncomeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), 'Income']}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {platformIncomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-full flex flex-col items-center justify-center min-h-[300px]">
              <BarChart size={32} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">No platform income data</p>
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-[356px] flex flex-col">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                Deadlines
              </div>
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Clock size={24} className="text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-500">All caught up!</p>
                </div>
              ) : (
                upcomingDeadlines.map((project: any) => (
                  <div key={project._id} className="group p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 hover:bg-blue-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{project.title}</h4>
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full">{formatDate(project.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 w-6">{project.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Activity */}
      <div className="mt-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-slate-400" />
              Recent Activity
            </h3>
            <Link href="/money" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            {/* Recent Transactions */}
            <div className="p-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Transactions</h4>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent transactions.</p>
                ) : (
                  recentTransactions.slice(0, 4).map((transaction: any) => (
                    <div key={transaction._id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          transaction.type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'
                        }`}>
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{transaction.category}</p>
                          <p className="text-[11px] font-medium text-slate-500">{transaction.platform} • {getRelativeTime(transaction.date)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${
                        transaction.type === 'Income' ? 'text-green-600' : 'text-slate-600'
                      }`}>
                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="p-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">New Leads</h4>
              <div className="space-y-4">
                {recentLeads.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent leads.</p>
                ) : (
                  recentLeads.slice(0, 4).map((lead: any) => (
                    <div key={lead._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lead.company_name}</p>
                          <p className="text-[11px] font-medium text-slate-500">{lead.targetService} • {getRelativeTime(lead.createdAt)}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {lead.outreach_status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      </div>
      
      {/* AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}
