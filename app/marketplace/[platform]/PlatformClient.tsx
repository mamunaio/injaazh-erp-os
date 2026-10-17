'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Clock, 
  Briefcase, 
  ShoppingCart, 
  Globe, 
  Users, 
  ChevronRight,
  DollarSign,
  Layers,
  Sparkles,
  Calendar,
  AlertCircle,
  Flame,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  List,
  ExternalLink,
  CheckSquare,
  FileText
} from 'lucide-react';
import CreateMarketplaceProjectModal from '@/components/CreateMarketplaceProjectModal';
import { getMarketplaceProjects, createMarketplaceProject } from '@/app/actions/marketplaceActions';
import toast, { Toaster } from 'react-hot-toast';

export default function PlatformClient({ platform }: { platform: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const router = useRouter();

  useEffect(() => {
    async function loadProjects() {
      try {
        const fetchedProjects = await getMarketplaceProjects(platform);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Failed to load projects', error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [platform]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
  };

  const getPlatformConfig = () => {
    const p = platform.toLowerCase();
    switch(p) {
      case 'upwork': return { 
        name: 'Upwork', 
        tagline: 'Global Freelance & Agency Network',
        icon: Briefcase,
        color: '#10B981',
        glowColor: 'rgba(16,185,129,0.25)',
        accent: 'text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        bgAccent: 'bg-emerald-500',
      };
      case 'fiverr': return { 
        name: 'Fiverr', 
        tagline: 'Gig Deliverables & Studio Studio',
        icon: ShoppingCart,
        color: '#EC4899',
        glowColor: 'rgba(236,72,153,0.25)',
        accent: 'text-pink-400',
        badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        bgAccent: 'bg-pink-500',
      };
      case 'freelancer': return { 
        name: 'Freelancer.com', 
        tagline: 'Contests, Milestone Escrow & Bids',
        icon: Globe,
        color: '#00E5FF',
        glowColor: 'rgba(0,229,255,0.25)',
        accent: 'text-[#00E5FF]',
        badge: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30',
        bgAccent: 'bg-[#00E5FF]',
      };
      case 'direct': default: return { 
        name: 'Direct Clients', 
        tagline: 'Enterprise Retainers & Custom Invoices',
        icon: Users,
        color: '#6324FC',
        glowColor: 'rgba(99,36,252,0.25)',
        accent: 'text-purple-400',
        badge: 'bg-[#6324FC]/10 text-purple-300 border-[#6324FC]/30',
        bgAccent: 'bg-[#6324FC]',
      };
    }
  };

  const pConf = getPlatformConfig();
  const Icon = pConf.icon;

  // Calculate platform financial telemetry
  const telemetry = useMemo(() => {
    let totalEarned = 0;
    let totalPipeline = 0;
    let inProgressCount = 0;
    let inReviewCount = 0;
    let planningCount = 0;
    let completedCount = 0;

    projects.forEach((project) => {
      const budgetValue = project.budget 
        ? parseFloat(project.budget.replace(/[^0-9.-]+/g, '')) 
        : 0;
        
      let paidMilestonesSum = 0;
      if (project.milestones && Array.isArray(project.milestones)) {
        project.milestones.forEach((m: any) => {
          if (m.status === 'Paid') {
            paidMilestonesSum += parseFloat(m.amount) || 0;
          }
        });
      }
      
      const earned = paidMilestonesSum > 0 
        ? paidMilestonesSum 
        : (project.status === 'Completed' ? budgetValue : 0);
        
      const pipelineAmount = project.status === 'Cancelled' ? 0 : Math.max(0, budgetValue - earned);

      totalEarned += earned;
      if (project.status !== 'Completed' && project.status !== 'Cancelled') {
        totalPipeline += pipelineAmount;
      }

      if (project.status === 'In Progress') inProgressCount++;
      else if (project.status === 'In Review') inReviewCount++;
      else if (project.status === 'Planning') planningCount++;
      else if (project.status === 'Completed') completedCount++;
    });

    const totalProjects = projects.length;
    const completionRate = totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

    return {
      totalEarned,
      totalPipeline,
      inProgressCount,
      inReviewCount,
      planningCount,
      completedCount,
      activeCount: inProgressCount + inReviewCount,
      totalProjects,
      completionRate,
    };
  }, [projects]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'In Progress': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Planning': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'In Review': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-white/5 text-secondary border-white/10';
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const clientMatch = (p.clientDetails?.clientName || p.clientName || '').toLowerCase().includes(q);
        if (!titleMatch && !clientMatch) return false;
      }
      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 pt-6 pb-24 font-sans selection:bg-[#6324FC] selection:text-white relative overflow-hidden">
      <Toaster position="top-right" />

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] blur-[140px] rounded-full opacity-15 dark:opacity-20"
          style={{ backgroundColor: pConf.color }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#6324FC]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1680px] mx-auto relative z-10 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <Link 
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-heading font-semibold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors group px-1"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Marketplace Directory</span>
        </Link>

        {/* Dynamic Channel Header Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden shadow-lg dark:shadow-2xl">
          {/* Top Neon Glow line */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2.5px]"
            style={{ 
              backgroundImage: `linear-gradient(to right, transparent, ${pConf.color}, transparent)`,
              boxShadow: `0 0 14px ${pConf.color}`
            }}
          />

          <div className="flex items-center gap-5">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{
                backgroundColor: `${pConf.color}15`,
                border: `1px solid ${pConf.color}35`,
                color: pConf.color,
                boxShadow: `0 0 25px ${pConf.color}25`
              }}
            >
              <Icon size={32} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${pConf.badge}`}>
                  <Sparkles size={10} className="inline mr-1" />
                  {pConf.name.toUpperCase()} CHANNEL
                </span>
                <span className="text-xs text-secondary">•</span>
                <span className="text-xs font-mono text-secondary">
                  {telemetry.totalProjects} Total Deliverables Logged
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
                {pConf.name} Deliverables
              </h1>
              <p className="text-xs md:text-sm font-sans text-secondary mt-0.5">
                {pConf.tagline}. Manage contracts, milestone releases, and client scopes.
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects or clients..." 
                className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-[#6324FC] text-white' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-[#6324FC] text-white' : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Data Table View"
              >
                <List size={15} />
              </button>
            </div>
            
            {/* + New Project Laser Conic CTA */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative p-[1.5px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(99,36,252,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]"
            >
              <span className="absolute -inset-[180%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_60deg,#6324FC_130deg,#00E5FF_180deg,#6324FC_230deg,transparent_300deg)] blur-[4px] opacity-75" />
              <span className="absolute -inset-[180%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_60deg,#6324FC_130deg,#00E5FF_180deg,#6324FC_230deg,transparent_300deg)] opacity-100" />
              
              <div className="relative z-10 px-4 py-2.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-100 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-colors">
                <Plus size={15} className="text-[#6324FC] dark:text-[#00E5FF] group-hover:rotate-90 transition-transform duration-300" />
                <span className="tracking-wide">+ New {pConf.name} Project</span>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXECUTIVE TELEMETRY 4 KPI CARDS */}
        {/* ========================================================================= */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: Realized Channel Revenue */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#10B981]/60 hover:shadow-[0_12px_30px_rgba(16,185,129,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#10B981]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] group-hover:border-[#10B981] transition-all duration-300">
                <Flame size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                <DollarSign size={11} /> Realized Inflow
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">{pConf.name} Revenue</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#10B981] transition-all">
                ${telemetry.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Released milestones & completed contracts</p>
            </div>
          </motion.div>

          {/* Card 2: Active Contracts in Flight */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00E5FF]/60 hover:shadow-[0_12px_30px_rgba(0,229,255,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300">
                <Clock size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-cyan-600 dark:text-[#00E5FF] bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                In Production
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Active Operations</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-cyan-600 dark:group-hover:text-[#00E5FF] transition-all">
                {telemetry.activeCount}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">In-Progress & In-Review deliverables</p>
            </div>
          </motion.div>

          {/* Card 3: Escrow Pipeline Buffer */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#6324FC]/60 hover:shadow-[0_12px_30px_rgba(99,36,252,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300">
                <Briefcase size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-purple-600 dark:text-purple-300 bg-[#6324FC]/15 px-2 py-0.5 rounded-md border border-[#6324FC]/30 group-hover:border-[#6324FC]/50 transition-colors">
                Escrow Pipeline
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Unreleased Pipeline</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] transition-all">
                ${telemetry.totalPipeline.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Unreleased milestone escrow balances</p>
            </div>
          </motion.div>

          {/* Card 4: Fulfillments & Delivery Rate */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F59E0B]/60 hover:shadow-[0_12px_30px_rgba(245,158,11,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F59E0B]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover:border-[#F59E0B] transition-all duration-300">
                <CheckCircle2 size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                {telemetry.completionRate}% Rate
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Completed Projects</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#F59E0B] transition-all">
                {telemetry.completedCount}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Out of {telemetry.totalProjects} total engagements</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Status Filters Navigation Bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: 'All', label: 'All Projects', count: telemetry.totalProjects },
              { id: 'In Progress', label: 'In Progress ⚡', count: telemetry.inProgressCount },
              { id: 'In Review', label: 'In Review 🔍', count: telemetry.inReviewCount },
              { id: 'Planning', label: 'Planning 📋', count: telemetry.planningCount },
              { id: 'Completed', label: 'Completed ✅', count: telemetry.completedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  statusFilter === tab.id
                    ? 'bg-[#6324FC] text-white shadow-md'
                    : 'bg-white dark:bg-[#0a0a0d] text-secondary hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-secondary'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN DELIVERABLES SECTION (GRID OR TABLE) */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#6324FC] animate-spin" />
            <p className="text-xs font-mono text-secondary">Loading {pConf.name} deliverables...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#0a0a0d] rounded-3xl border border-black/10 dark:border-white/10 p-6 shadow-md dark:shadow-xl">
            <AlertCircle size={32} className="text-secondary mx-auto mb-2" />
            <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-1">No {pConf.name} Projects Found</h3>
            <p className="text-xs font-sans text-secondary max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== 'All' 
                ? 'No projects match your active search query or status filter.' 
                : `No active contracts found for ${pConf.name}. Create your first project to start tracking milestones!`}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-heading font-bold shadow-[0_0_15px_rgba(99,36,252,0.4)] transition-all"
            >
              + Create New Project
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* GRID VIEW (KANBAN CARDS) */
          /* ========================================================================= */
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-16"
          >
            {filteredProjects.map((project) => {
              const clientName = project.clientDetails?.clientName || project.clientName || 'Direct Client';
              const tasksCount = project.tasks && Array.isArray(project.tasks) ? project.tasks.length : 0;
              const completedTasksCount = project.tasks && Array.isArray(project.tasks) 
                ? project.tasks.filter((t: any) => t.completed).length 
                : 0;

              const milestonesCount = project.milestones && Array.isArray(project.milestones) ? project.milestones.length : 0;
              const paidMilestones = project.milestones && Array.isArray(project.milestones)
                ? project.milestones.filter((m: any) => m.status === 'Paid')
                : [];

              return (
                <motion.div
                  key={project._id}
                  variants={itemVariants}
                >
                  <Link
                    href={`/marketplace/${platform.toLowerCase()}/${project._id}`}
                    className="block group h-full outline-none focus:outline-none"
                  >
                    <div className="glass-card rounded-3xl p-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 dark:hover:border-white/25 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full shadow-sm dark:shadow-lg relative overflow-hidden group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
                      
                      {/* Top Accent Neon Line on Hover */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ 
                          backgroundImage: `linear-gradient(to right, transparent, ${pConf.color}, transparent)`,
                          boxShadow: `0 0 10px ${pConf.color}`
                        }}
                      />

                      {/* Header: Client & Status */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-xs font-heading font-bold text-slate-900 dark:text-white shrink-0">
                              {clientName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider block truncate">
                                {clientName}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg border shrink-0 ${getStatusBadge(project.status)}`}>
                            {project.status}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors line-clamp-2 mb-2 leading-snug">
                          {project.title}
                        </h3>

                        {/* Scope preview if available */}
                        {project.scope && (
                          <p className="text-xs text-secondary font-sans line-clamp-2 mb-4 leading-relaxed">
                            {project.scope}
                          </p>
                        )}
                      </div>

                      {/* Middle: Progress Rate */}
                      <div className="space-y-3 my-3 pt-3 border-t border-black/5 dark:border-white/5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono text-secondary">
                            <span>Fulfillment Progress</span>
                            <span className="font-bold text-slate-900 dark:text-white">{project.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${project.progress || 0}%`,
                                backgroundColor: pConf.color 
                              }}
                            />
                          </div>
                        </div>

                        {/* Task & Milestone Mini Pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-secondary">
                          {tasksCount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-1 text-slate-700 dark:text-secondary">
                              <CheckSquare size={10} className="text-[#6324FC] dark:text-[#00E5FF]" />
                              {completedTasksCount}/{tasksCount} Tasks
                            </span>
                          )}
                          {milestonesCount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-1 text-slate-700 dark:text-secondary">
                              <DollarSign size={10} className="text-emerald-600 dark:text-emerald-400" />
                              {paidMilestones.length}/{milestonesCount} Milestones
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer: Budget & Deadline */}
                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between mt-auto">
                        <div>
                          <span className="text-[9px] font-heading font-bold text-secondary uppercase block">Contract Budget</span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{project.budget || '$0'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[9px] font-heading font-bold text-secondary uppercase block">Target Date</span>
                            <span className="text-xs font-mono text-secondary">
                              {project.deadline 
                                ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Flexible'}
                            </span>
                          </div>
                          
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 group-hover:bg-[#6324FC] text-secondary group-hover:text-white flex items-center justify-center transition-all">
                            <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>

                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* TABLE VIEW (HIGH DENSITY ROWS) */
          /* ========================================================================= */
          <div className="space-y-3 pb-16">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-heading font-bold uppercase tracking-widest text-secondary">
              <div className="col-span-4">Project & Client Details</div>
              <div className="col-span-2">Execution Status</div>
              <div className="col-span-3">Progress Rate</div>
              <div className="col-span-1">Budget</div>
              <div className="col-span-2 text-right">Target Deadline</div>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filteredProjects.map((project) => (
                <motion.div
                  key={project._id}
                  variants={itemVariants}
                  className="group block relative"
                >
                  <Link 
                    href={`/marketplace/${platform.toLowerCase()}/${project._id}`} 
                    className="block rounded-2xl p-5 md:p-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 dark:hover:border-white/25 hover:-translate-y-1 transition-all duration-300 shadow-sm group"
                  >
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center relative z-10">
                      
                      {/* Project Title & Client */}
                      <div className="col-span-4 min-w-0">
                        <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors truncate">
                          {project.title}
                        </h3>
                        <p className="text-xs font-sans text-secondary mt-0.5 flex items-center gap-1.5 truncate">
                          <Users size={12} className="opacity-70" /> 
                          <span>{project.clientDetails?.clientName || project.clientName || 'Direct Client'}</span>
                        </p>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center">
                        <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-mono font-bold rounded-lg border ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="col-span-3 flex items-center">
                        <div className="flex flex-col w-full max-w-[200px] gap-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono text-secondary">
                            <span>Completion</span>
                            <span className="text-slate-900 dark:text-white font-bold">{project.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${project.progress || 0}%`,
                                backgroundColor: pConf.color 
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="col-span-1 flex items-center">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-[#060608] border border-black/5 dark:border-white/5 px-2.5 py-1 rounded-lg">
                          {project.budget || '$0'}
                        </span>
                      </div>

                      {/* Deadline */}
                      <div className="col-span-2 flex items-center justify-between md:justify-end gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-secondary">
                          <Clock size={13} className="text-[#6324FC] dark:text-[#00E5FF]" />
                          <span>
                            {project.deadline 
                              ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Flexible'}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-secondary group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                      
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CREATE MARKETPLACE PROJECT MODAL */}
      {/* ========================================================================= */}
      <CreateMarketplaceProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultPlatform={platform.charAt(0).toUpperCase() + platform.slice(1)}
        onSave={async (data) => {
          const loadingToast = toast.loading('Creating project...');
          
          const initialTasks = data.tasks && data.tasks.length > 0
            ? data.tasks.map((t: string, idx: number) => ({ id: Date.now() + idx, title: t, completed: false }))
            : [];
            
          const newProject = {
            title: data.title,
            clientId: data.clientId,
            clientDetails: data.clientDetails || { clientName: data.clientName || 'Unknown Client' },
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            status: 'Planning',
            progress: 0,
            budget: data.budget ? `$${data.budget}` : '$0',
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            deadline: data.deadline ? new Date(data.deadline) : undefined,
            scope: data.scope,
            tasks: initialTasks,
            milestones: [],
            files: []
          };
          
          const res = await createMarketplaceProject(newProject);
          if (res.success) {
            toast.success('Project created!', { id: loadingToast });
            setIsModalOpen(false);
            router.push(`/marketplace/${platform.toLowerCase()}/${res.data._id}`);
          } else {
            toast.error(res.error || 'Failed to create project', { id: loadingToast });
          }
        }}
      />
    </div>
  );
}
