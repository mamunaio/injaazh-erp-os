'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Download, Calendar, 
  BarChart3, Activity, Briefcase, Share2, Sparkles, AlertTriangle, 
  Lightbulb, Crosshair, ArrowUpRight, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// ─── Dummy Data for AI & Charts ─────────────────────────────────────────────
const revenueData = [
  { month: 'Jan', revenue: 45000, target: 40000 },
  { month: 'Feb', revenue: 52000, target: 45000 },
  { month: 'Mar', revenue: 48000, target: 50000 },
  { month: 'Apr', revenue: 61000, target: 55000 },
  { month: 'May', revenue: 59000, target: 60000 },
  { month: 'Jun', revenue: 75000, target: 65000 },
];

const conversionData = [
  { name: 'Website', value: 65 },
  { name: 'Referral', value: 25 },
  { name: 'Social', value: 10 },
];

const healthData = [
  { metric: 'Q1', score: 85 },
  { metric: 'Q2', score: 92 },
  { metric: 'Q3', score: 88 },
  { metric: 'Q4', score: 95 },
];

const aiInsights = {
  recommendations: [
    "Increase ad spend on 'Website' channel by 15% to capitalize on recent 65% conversion surge.",
    "Follow up with 12 stagnant enterprise leads identified in the Q3 pipeline."
  ],
  risks: [
    "Customer retention dropped by 2% in the last 30 days.",
    "Server costs for active projects are trending 8% above baseline."
  ],
  opportunities: [
    "Upsell 'Premium Support' to existing 45 active clients based on usage patterns."
  ]
};

// ─── Formatters ──────────────────────────────────────────────────────────────
const formatCurrency = (val: number) => `$${(val / 1000).toFixed(1)}k`;

export default function InsightsClient() {
  const [dateFilter, setDateFilter] = useState('YTD');
  const [deptFilter, setDeptFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success('Dashboard data exported successfully!');
    }, 1500);
  };

  const handleGenerateSummary = () => {
    setIsGeneratingSummary(true);
    setTimeout(() => {
      setIsGeneratingSummary(false);
      toast.success('AI Summary updated with latest data!');
    }, 2000);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#7C3AED]/30 pb-24">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                  <BarChart3 size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Executive Analytics Dashboard</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Business Insights</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Monitor KPIs, AI recommendations, and company growth.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#11131A] hover:bg-slate-200 dark:hover:bg-[#232734] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white transition-all">
                <Calendar size={16} /> Schedule Report
              </button>
              <button onClick={handleExport} disabled={isExporting} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#11131A] hover:bg-slate-200 dark:hover:bg-[#232734] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white transition-all disabled:opacity-50 min-w-[110px]">
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              <button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_28px_rgba(124,58,237,0.45)] transition-all border border-[#7C3AED]/80 disabled:opacity-50 min-w-[140px]">
                {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} strokeWidth={2.5} />}
                {isGeneratingSummary ? 'Analyzing...' : 'AI Summary'}
              </button>
            </div>
          </motion.div>

          {/* ── Filters ────────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 mb-6">
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white text-sm font-medium rounded-xl pl-4 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#7C3AED]/60 cursor-pointer">
              <option value="YTD">Year to Date (YTD)</option>
              <option value="Q3">Q3 2026</option>
              <option value="Q2">Q2 2026</option>
              <option value="LastYear">Last Year</option>
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white text-sm font-medium rounded-xl pl-4 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#7C3AED]/60 cursor-pointer">
              <option value="All">All Departments</option>
              <option value="Sales">Sales & Marketing</option>
              <option value="Engineering">Engineering</option>
              <option value="Finance">Finance</option>
            </select>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 relative overflow-hidden group shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10B981]/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Revenue Growth</p>
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]"><TrendingUp size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight relative z-10">+24.5%</p>
              <div className="absolute bottom-0 left-0 w-full h-14 opacity-50 pointer-events-none">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L0,20 Q10,15 20,25 T40,10 T60,20 T80,5 T100,15 L100,30 Z" fill="url(#sg1)" />
                  <path d="M0,20 Q10,15 20,25 T40,10 T60,20 T80,5 T100,15" fill="none" stroke="#10B981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>

            <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 relative overflow-hidden group shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#2563EB]/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">New Clients</p>
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]"><Users size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight relative z-10">142</p>
              <div className="absolute bottom-0 left-0 w-full h-14 opacity-50 pointer-events-none">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L0,25 Q15,25 25,15 T50,20 T75,10 T100,5 L100,30 Z" fill="url(#sg2)" />
                  <path d="M0,25 Q15,25 25,15 T50,20 T75,10 T100,5" fill="none" stroke="#2563EB" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>

            <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 relative overflow-hidden group shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#F59E0B]/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Conversion Rate</p>
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]"><Activity size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight relative z-10">4.2%</p>
              <div className="absolute bottom-0 left-0 w-full h-14 opacity-50 pointer-events-none">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="sg3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L0,15 Q20,25 40,15 T60,10 T80,20 T100,10 L100,30 Z" fill="url(#sg3)" />
                  <path d="M0,15 Q20,25 40,15 T60,10 T80,20 T100,10" fill="none" stroke="#F59E0B" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>

            <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 relative overflow-hidden group shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#7C3AED]/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Health Score</p>
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]"><Briefcase size={16} /></div>
              </div>
              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight relative z-10">95/100</p>
              <div className="absolute bottom-0 left-0 w-full h-14 opacity-50 pointer-events-none">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="sg4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L0,10 Q25,10 50,20 T75,15 T100,5 L100,30 Z" fill="url(#sg4)" />
                  <path d="M0,10 Q25,10 50,20 T75,15 T100,5" fill="none" stroke="#7C3AED" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main Content Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Charts Column */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-2 space-y-6">
            
            {/* Revenue Analytics */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <ArrowUpRight size={16} className="text-[#10B981]" /> Revenue vs Target
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232734" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl p-3 shadow-lg">
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
                              {payload.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                                  <span className="text-xs font-semibold capitalize" style={{ color: entry.color }}>{entry.name}:</span>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(entry.value as number)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="target" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorTar)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Conversion Pie */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Lead Sources</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={conversionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        <Cell fill="#7C3AED" />
                        <Cell fill="#2563EB" />
                        <Cell fill="#F59E0B" />
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#09090B', border: '1px solid #232734', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#7C3AED] shadow-[0_0_10px_rgba(124,58,237,0.5)]"></div><span className="text-xs font-bold text-[#E2E8F0] tracking-wide">Website (65%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div><span className="text-xs font-bold text-[#E2E8F0] tracking-wide">Referral (25%)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div><span className="text-xs font-bold text-[#E2E8F0] tracking-wide">Social (10%)</span></div>
                </div>
              </motion.div>

              {/* Health Bar */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] p-6 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Health Score Trend</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232734" vertical={false} />
                      <XAxis dataKey="metric" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#09090B', border: '1px solid #232734', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                        cursor={{ fill: '#232734', opacity: 0.4 }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="url(#colorHealth)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

          </motion.div>

          {/* AI Insights Column */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#11131A] border border-[#7C3AED]/30 rounded-[24px] p-6 relative overflow-hidden shadow-md dark:shadow-[0_0_40px_rgba(124,58,237,0.1)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">AI Insights Panel</h3>
                  <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest">Real-time Intelligence</p>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                {/* Recommendations */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-[#10B981]" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Recommendations</h4>
                  </div>
                  <ul className="space-y-3">
                    {aiInsights.recommendations.map((rec, i) => (
                      <li key={i} className="bg-emerald-50/50 dark:bg-[#0F172A] border-y border-r border-emerald-100 dark:border-[#1E293B] border-l-4 border-l-[#10B981] rounded-r-xl rounded-l-sm p-4 text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed shadow-sm">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-[#EF4444]" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Risks Detected</h4>
                  </div>
                  <ul className="space-y-3">
                    {aiInsights.risks.map((risk, i) => (
                      <li key={i} className="bg-rose-50/50 dark:bg-[#0F172A] border-y border-r border-rose-100 dark:border-[#1E293B] border-l-4 border-l-[#EF4444] rounded-r-xl rounded-l-sm p-4 text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed shadow-sm">
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opportunities */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Crosshair size={14} className="text-[#2563EB]" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Opportunities</h4>
                  </div>
                  <ul className="space-y-3">
                    {aiInsights.opportunities.map((opp, i) => (
                      <li key={i} className="bg-blue-50/50 dark:bg-[#0F172A] border-y border-r border-blue-100 dark:border-[#1E293B] border-l-4 border-l-[#2563EB] rounded-r-xl rounded-l-sm p-4 text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed shadow-sm">
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
            </motion.div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
