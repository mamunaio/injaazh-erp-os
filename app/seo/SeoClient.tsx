'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Activity, 
  Globe, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SeoProject } from '@/types/seo';
import { auditSeoProject, createSeoProject } from '@/app/actions/seoActions';

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-purple-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(167,139,250,0.05)] hover:shadow-lg transition-all rounded-3xl p-6 ${className}`}>
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

const ProgressRing = ({ score, label }: { score: number, label: string }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 90) return '#10b981'; // Green
    if (s >= 50) return '#fbbf24'; // Amber
    return '#ef4444'; // Red
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white dark:text-slate-800"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            cx="56"
            cy="56"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <span className="absolute text-2xl font-black text-slate-800 dark:text-white">{score}</span>
      </div>
      <span className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-purple-500/20 p-3 rounded-2xl shadow-xl">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-black flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SeoClient({ initialProjects }: { initialProjects: SeoProject[] }) {
  const [projectsList, setProjectsList] = useState<SeoProject[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjects[0]?.id || '');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const currentProject = projectsList.find(p => p.id === selectedProjectId) || projectsList[0];

  const handleAudit = async (projId?: string) => {
    const idToAudit = projId || currentProject?.id;
    if (!idToAudit) return;
    
    setIsAuditing(true);
    const auditToast = toast.loading('Running Live Audit (PageSpeed & AEO)...');
    
    try {
      const res = await auditSeoProject(idToAudit);
      if (res.success && res.data) {
        toast.success('Live Audit Completed Successfully!', { id: auditToast });
        // Update projectsList state in place
        setProjectsList(prev => prev.map(p => p.id === res.data.id ? res.data : p));
      } else {
        toast.error(res.error || 'Live Audit failed to complete', { id: auditToast });
      }
    } catch (error) {
      toast.error('Unexpected error occurred during audit', { id: auditToast });
      console.error(error);
    } finally {
      setIsAuditing(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-slate-500 italic">No SEO projects configured in the system.</p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="max-w-[1400px] mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
      {/* Header & URL Selector */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-6xl md:text-7xl font-jakarta font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 dark:from-teal-400 dark:via-indigo-400 dark:to-purple-500 mb-3 drop-shadow-sm">
            SEO & AEO Tracker
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-500 dark:text-slate-400">
            Next-Gen Answer Engine Optimization Dashboard
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="pl-12 pr-10 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-indigo-500/20 text-slate-800 dark:text-slate-200 font-jakarta font-bold rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer min-w-[250px]"
              >
                {projectsList.map(proj => (
                  <option key={proj.id} value={proj.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {proj.clientName} - {proj.url}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-indigo-500/20 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
              title="Add Website to Track"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => handleAudit()}
            disabled={isAuditing}
            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-jakarta font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all text-sm group ${isAuditing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Search size={18} className={isAuditing ? 'animate-spin' : 'group-hover:animate-pulse'} />
            {isAuditing ? 'Auditing...' : 'Run Live Audit'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lighthouse Bento Box */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-12">
          <GlassCard>
            <h3 className="text-sm font-jakarta font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Lighthouse Core Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <ProgressRing score={currentProject.lighthouse.performance} label="Performance" />
              <ProgressRing score={currentProject.lighthouse.accessibility} label="Accessibility" />
              <ProgressRing score={currentProject.lighthouse.bestPractices} label="Best Practices" />
              <ProgressRing score={currentProject.lighthouse.seo} label="SEO" />
            </div>
          </GlassCard>
        </motion.div>

        {/* AEO / GEO Radar */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-8">
          <GlassCard className="h-full min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-jakarta font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" />
                AEO / GEO Visibility Radar
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/40 border border-white/40 dark:border-slate-700/50">
                <p className="text-xs font-jakarta font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ChatGPT Mentions</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-mono font-black text-slate-800 dark:text-slate-100">{currentProject.aeo.chatgptMentions}</span>
                  <div className={`flex items-center text-xs font-jakarta font-bold px-2 py-1 rounded-full ${
                    currentProject.aeo.chatgptTrend === 'up' ? 'text-teal-600 bg-teal-500/10' :
                    currentProject.aeo.chatgptTrend === 'down' ? 'text-rose-600 bg-rose-500/10' : 'text-slate-600 bg-slate-500/10'
                  }`}>
                    {currentProject.aeo.chatgptTrend === 'up' ? <TrendingUp size={12} className="mr-1"/> : 
                     currentProject.aeo.chatgptTrend === 'down' ? <TrendingDown size={12} className="mr-1"/> : <Minus size={12} className="mr-1"/>}
                    {currentProject.aeo.chatgptTrendValue}
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/40 border border-white/40 dark:border-slate-700/50">
                <p className="text-xs font-jakarta font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Perplexity Score</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-mono font-black text-slate-800 dark:text-slate-100">{currentProject.aeo.perplexityScore}%</span>
                  <div className={`flex items-center text-xs font-jakarta font-bold px-2 py-1 rounded-full ${
                    currentProject.aeo.perplexityTrend === 'up' ? 'text-teal-600 bg-teal-500/10' :
                    currentProject.aeo.perplexityTrend === 'down' ? 'text-rose-600 bg-rose-500/10' : 'text-slate-600 bg-slate-500/10'
                  }`}>
                    {currentProject.aeo.perplexityTrend === 'up' ? <TrendingUp size={12} className="mr-1"/> : 
                     currentProject.aeo.perplexityTrend === 'down' ? <TrendingDown size={12} className="mr-1"/> : <Minus size={12} className="mr-1"/>}
                    {currentProject.aeo.perplexityTrendValue}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentProject.aeo.historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGpt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPerplexity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glowChart">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" stroke="currentColor" className="text-slate-400" style={{ fontSize: '10px', fontWeight: 700 }} axisLine={false} tickLine={false} tickMargin={12} />
                  <YAxis stroke="currentColor" className="text-slate-400" style={{ fontSize: '10px', fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }} />
                  <Area 
                    type="monotone" 
                    dataKey="chatgpt" 
                    name="ChatGPT Mentions"
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fill="url(#colorGpt)"
                    filter="url(#glowChart)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="perplexity" 
                    name="Perplexity Visibility"
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fill="url(#colorPerplexity)"
                    filter="url(#glowChart)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Technical Vitals List */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4">
          <GlassCard className="h-full min-h-[400px]">
            <h3 className="text-sm font-jakarta font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={18} className="text-rose-500" />
              Core Web Vitals
            </h3>
            
            <div className="space-y-4">
              {/* LCP */}
              <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/40 hover:bg-white/50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-white/40 dark:hover:border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-jakarta font-bold text-slate-500 uppercase tracking-wider">Largest Contentful Paint</span>
                  {currentProject.vitals.lcp.status === 'Passed' ? <CheckCircle2 size={16} className="text-teal-500" /> :
                   currentProject.vitals.lcp.status === 'Failed' ? <XCircle size={16} className="text-rose-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-mono font-black text-slate-800 dark:text-slate-100">{currentProject.vitals.lcp.value}<span className="text-lg text-slate-500 ml-1">{currentProject.vitals.lcp.unit}</span></span>
                  <span className={`text-[10px] font-jakarta font-black uppercase px-2 py-1 rounded-full ${
                    currentProject.vitals.lcp.status === 'Passed' ? 'bg-teal-500/10 text-teal-600' :
                    currentProject.vitals.lcp.status === 'Failed' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {currentProject.vitals.lcp.status}
                  </span>
                </div>
              </div>

              {/* CLS */}
              <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/40 hover:bg-white/50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-white/40 dark:hover:border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cumulative Layout Shift</span>
                  {currentProject.vitals.cls.status === 'Passed' ? <CheckCircle2 size={16} className="text-teal-500" /> :
                   currentProject.vitals.cls.status === 'Failed' ? <XCircle size={16} className="text-rose-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{currentProject.vitals.cls.value}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                    currentProject.vitals.cls.status === 'Passed' ? 'bg-teal-500/10 text-teal-600' :
                    currentProject.vitals.cls.status === 'Failed' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {currentProject.vitals.cls.status}
                  </span>
                </div>
              </div>

              {/* INP */}
              <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/40 hover:bg-white/50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-white/40 dark:hover:border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interaction to Next Paint</span>
                  {currentProject.vitals.inp.status === 'Passed' ? <CheckCircle2 size={16} className="text-teal-500" /> :
                   currentProject.vitals.inp.status === 'Failed' ? <XCircle size={16} className="text-rose-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{currentProject.vitals.inp.value}<span className="text-lg text-slate-500 ml-1">{currentProject.vitals.inp.unit}</span></span>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                    currentProject.vitals.inp.status === 'Passed' ? 'bg-teal-500/10 text-teal-600' :
                    currentProject.vitals.inp.status === 'Failed' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {currentProject.vitals.inp.status}
                  </span>
                </div>
              </div>

            </div>
          </GlassCard>
        </motion.div>

      </div>
    </motion.div>

    {/* Add SEO Project Modal */}
    <AnimatePresence>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
          />
          {/* Modal Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/20 rounded-3xl p-8 shadow-2xl flex flex-col z-10 animate-fade-in"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            <h3 className="text-3xl font-jakarta font-black text-slate-800 dark:text-white mb-6">
              Add Website to Track
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const clientName = formData.get('clientName') as string;
              const url = formData.get('url') as string;

              if (!clientName || !url) {
                toast.error('All fields are required');
                return;
              }

              setIsAddModalOpen(false);
              const addToast = toast.loading('Saving website...');

              try {
                const res = await createSeoProject(clientName, url);
                if (res.success && res.data) {
                  toast.success('Website added successfully!', { id: addToast });
                  
                  // Update client state
                  setProjectsList(prev => [...prev, res.data]);
                  setSelectedProjectId(res.data.id);
                  
                  // Immediately trigger live audit on the new URL!
                  setTimeout(() => {
                    handleAudit(res.data.id);
                  }, 500);
                } else {
                  toast.error(res.error || 'Failed to add website', { id: addToast });
                }
              } catch (err) {
                toast.error('Unexpected error occurred', { id: addToast });
                console.error(err);
              }
            }} className="flex flex-col gap-5">
              
              <div>
                <label className="block text-sm font-jakarta font-black uppercase tracking-widest text-slate-600 dark:text-gray-300 mb-2">Client Name</label>
                <input name="clientName" required type="text" placeholder="e.g. Acme Corp" className="w-full px-4 py-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all shadow-sm font-inter text-[15px]" />
              </div>
              
              <div>
                <label className="block text-sm font-jakarta font-black uppercase tracking-widest text-slate-600 dark:text-gray-300 mb-2">Website URL</label>
                <input name="url" required type="text" placeholder="e.g. acme.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white transition-all shadow-sm font-inter text-[15px]" />
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 text-sm font-jakarta font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-jakarta font-bold rounded-xl hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                >
                  Save & Audit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
