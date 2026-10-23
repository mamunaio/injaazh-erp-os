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
  ChevronLeft,
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
  FileText,
  Activity,
  ArrowUpRight
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
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
    return projects
      .filter((p) => {
        if (statusFilter !== 'All' && p.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = (p.title || '').toLowerCase().includes(q);
          const clientMatch = (p.clientDetails?.clientName || p.clientName || '').toLowerCase().includes(q);
          if (!titleMatch && !clientMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.deadline || 0).getTime();
        const dateB = new Date(b.createdAt || b.deadline || 0).getTime();
        return dateB - dateA;
      });
  }, [projects, statusFilter, searchQuery]);

  // Reset pagination to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProjects = useMemo(() => {
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProjects, validPage]);

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
        
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link 
            href="/marketplace"
            className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#00E5FF]/60 dark:hover:border-[#00E5FF]/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-heading font-bold shadow-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:-translate-x-1"
          >
            <div className="w-5 h-5 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-[#00E5FF]/15 flex items-center justify-center text-secondary group-hover:text-[#00E5FF] transition-all duration-300">
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>Back to Marketplace Directory</span>
            <span className="text-secondary/40 font-mono text-[11px]">•</span>
            <span className="text-secondary font-mono text-[11px]">Portal Hub</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-[#0a0a0d]/60 backdrop-blur-md border border-black/5 dark:border-white/5 text-xs font-mono text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span>Marketplace</span>
            <span className="opacity-40">/</span>
            <span className="text-slate-900 dark:text-white font-bold">{pConf.name}</span>
          </div>
        </div>

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
            
            {/* + New Project Laser Beam CTA (Symmetrically Calibrated Clockwise Single Stream) */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="h-10 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
            >
              {/* Perfectly Centered Square Conic Glow Aura (Uniform Distance on All 4 Sides) */}
              <span 
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none" 
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />
              
              {/* Crisp Symmetrical Single Laser Beam Stream (Clockwise: Left to Right Loop) */}
              <span 
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none" 
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />
              
              {/* Inner High-Contrast Surface: Concentric 10px radius matching outer 12px minus 2px */}
              <div className="relative z-10 w-full h-full px-4 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                <Briefcase size={14} className="text-[#00E5FF] group-hover:rotate-6 group-hover:scale-110 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + New {pConf.name} Project
                </span>
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5"
        >
          {/* Card 1: Realized Channel Revenue */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#10B981]/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#10B981]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-[#10B981] transition-all duration-300 shadow-sm">
                <Flame size={20} />
              </div>
              <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                <DollarSign size={13} /> Realized Inflow
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">{pConf.name} Revenue</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#10B981] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#10B981] transition-all">
                ${telemetry.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Released milestones & completed contracts</p>
            </div>
          </motion.div>

          {/* Card 2: Active Contracts in Flight */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
                <Clock size={20} />
              </div>
              <span className="text-xs font-heading font-bold text-cyan-600 dark:text-[#00E5FF] bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                In Production
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Active Operations</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-cyan-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                {telemetry.activeCount}
              </p>
              <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">In-Progress & In-Review deliverables</p>
            </div>
          </motion.div>

          {/* Card 3: Escrow Pipeline Buffer */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300 shadow-sm">
                <Briefcase size={20} />
              </div>
              <span className="text-xs font-heading font-bold text-purple-600 dark:text-purple-300 bg-[#6324FC]/15 px-2.5 py-1 rounded-lg border border-[#6324FC]/30 group-hover:border-[#6324FC]/50 transition-colors">
                Escrow Pipeline
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Unreleased Pipeline</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#6324FC] transition-all">
                ${telemetry.totalPipeline.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Unreleased milestone escrow balances</p>
            </div>
          </motion.div>

          {/* Card 4: Fulfillments & Delivery Rate */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#F59E0B]/60 hover:shadow-[0_16px_36px_rgba(245,158,11,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#F59E0B]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] group-hover:border-[#F59E0B] transition-all duration-300 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-xs font-heading font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                {telemetry.completionRate}% Rate
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Completed Deliverables</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#F59E0B] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#F59E0B] transition-all">
                {telemetry.completedCount}
              </p>
              <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">Out of {telemetry.totalProjects} total engagements</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Status Filters Navigation Bar with Modern Icons & Interactive Hover */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            {[
              { id: 'All', label: 'All Projects', icon: Layers, count: telemetry.totalProjects, color: '#6324FC' },
              { id: 'In Progress', label: 'In Progress', icon: Flame, count: telemetry.inProgressCount, color: '#00E5FF' },
              { id: 'In Review', label: 'In Review', icon: Search, count: telemetry.inReviewCount, color: '#A855F7' },
              { id: 'Planning', label: 'Planning', icon: Calendar, count: telemetry.planningCount, color: '#F59E0B' },
              { id: 'Completed', label: 'Completed', icon: CheckCircle2, count: telemetry.completedCount, color: '#10B981' },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`group relative px-4 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-[#0a0a0d] text-secondary hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 hover:-translate-y-0.5 hover:shadow-sm'
                  }`}
                  style={isActive ? {
                    boxShadow: `0 0 20px ${tab.color}35`,
                  } : {}}
                >
                  <TabIcon 
                    size={14} 
                    className={`transition-all duration-300 ${
                      isActive 
                        ? (tab.id === 'Completed' ? 'text-emerald-400 dark:text-emerald-600' : (tab.id === 'In Progress' ? 'text-cyan-400 dark:text-cyan-600' : 'text-[#6324FC] dark:text-[#6324FC]'))
                        : 'text-secondary group-hover:scale-110 group-hover:rotate-6'
                    }`}
                    style={!isActive ? { color: tab.color } : {}}
                  />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-white/20 dark:bg-black/10 font-extrabold' 
                      : 'bg-black/5 dark:bg-white/5 text-secondary group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-6"
          >
            {paginatedProjects.map((project) => {
              const clientName = project.clientDetails?.clientName || project.clientName || 'Direct Client';
              const tasksCount = project.tasks && Array.isArray(project.tasks) ? project.tasks.length : 0;
              const completedTasksCount = project.tasks && Array.isArray(project.tasks) 
                ? project.tasks.filter((t: any) => t.completed).length 
                : 0;

              const milestonesCount = project.milestones && Array.isArray(project.milestones) ? project.milestones.length : 0;
              const paidMilestones = project.milestones && Array.isArray(project.milestones)
                ? project.milestones.filter((m: any) => m.status === 'Paid')
                : [];

              const isCompleted = project.status === 'Completed' || (project.progress || 0) >= 100;
              const accentColor = isCompleted ? '#10B981' : pConf.color;

              return (
                <motion.div
                  key={project._id}
                  variants={itemVariants}
                >
                  <Link
                    href={`/marketplace/${platform.toLowerCase()}/${project._id}`}
                    className="block group h-full outline-none focus:outline-none"
                  >
                    <div className={`group glass-card rounded-2xl p-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between h-full shadow-sm dark:shadow-lg relative overflow-hidden ${
                      isCompleted 
                        ? 'hover:border-emerald-500/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)]' 
                        : 'hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)]'
                    }`}>
                      
                      {/* Radial Hover Spotlight (Dashboard Signature) */}
                      <div 
                        className={`absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-30 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none ${
                          isCompleted ? 'bg-[#10B981]/25' : 'bg-[#00E5FF]/20'
                        }`} 
                      />

                      {/* Top Accent Neon Line (Dashboard Signature) */}
                      <div 
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90"
                        style={{ 
                          backgroundImage: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
                          boxShadow: `0 0 10px ${accentColor}`
                        }}
                      />

                      {/* Subtle Card Glass Sheen Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      {/* Left Accent Bar */}
                      <div 
                        className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full transition-all duration-300 opacity-80 group-hover:opacity-100"
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 0 8px ${accentColor}`
                        }}
                      />

                      {/* Header: Client & Status */}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-heading font-bold shrink-0 transition-transform duration-300 group-hover:scale-105"
                              style={{
                                backgroundColor: `${accentColor}15`,
                                border: `1px solid ${accentColor}30`,
                                color: accentColor
                              }}
                            >
                              {clientName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider block truncate">
                                {clientName}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-mono font-bold rounded-lg border shrink-0 ${
                            isCompleted 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                              : getStatusBadge(project.status)
                          }`}>
                            {isCompleted ? 'Completed' : project.status}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all line-clamp-2 mb-2 leading-snug">
                          {project.title}
                        </h3>

                        {/* Scope preview if available */}
                        {project.scope && (
                          <p className="text-xs text-secondary font-sans line-clamp-2 mb-4 leading-relaxed">
                            {project.scope}
                          </p>
                        )}
                      </div>

                      {/* Middle: Progress Rate (Green Bar for Completed!) */}
                      <div className="space-y-3 my-3 pt-3 border-t border-black/5 dark:border-white/5 relative z-10">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-secondary">Fulfillment Progress</span>
                            {isCompleted ? (
                              <span className="font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={11} className="text-emerald-500" />
                                100% Completed
                              </span>
                            ) : (
                              <span className="font-bold text-slate-900 dark:text-white">{project.progress || 0}%</span>
                            )}
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${isCompleted ? 100 : (project.progress || 0)}%`,
                                backgroundColor: isCompleted ? '#10B981' : pConf.color,
                                boxShadow: isCompleted ? '0 0 10px rgba(16,185,129,0.6)' : `0 0 10px ${pConf.glowColor}`
                              }}
                            />
                          </div>
                        </div>

                        {/* Task & Milestone Mini Pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-secondary">
                          {tasksCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-1 text-slate-700 dark:text-secondary group-hover:border-black/10 dark:group-hover:border-white/10 transition-colors">
                              <CheckSquare size={10} className={isCompleted ? "text-emerald-500" : "text-[#00E5FF]"} />
                              {completedTasksCount}/{tasksCount} Tasks
                            </span>
                          )}
                          {milestonesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-1 text-slate-700 dark:text-secondary group-hover:border-black/10 dark:group-hover:border-white/10 transition-colors">
                              <DollarSign size={10} className="text-emerald-600 dark:text-emerald-400" />
                              {paidMilestones.length}/{milestonesCount} Milestones
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer: Budget & Deadline */}
                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between mt-auto relative z-10">
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
                          
                          <div 
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                              isCompleted
                                ? 'bg-slate-100 dark:bg-white/5 group-hover:bg-[#10B981] text-secondary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                : 'bg-slate-100 dark:bg-white/5 group-hover:bg-[#00E5FF] text-secondary group-hover:text-black group-hover:shadow-[0_0_15px_rgba(0,229,255,0.5)]'
                            }`}
                          >
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
          <div className="space-y-3 pb-6">
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
              {paginatedProjects.map((project) => {
                const isCompleted = project.status === 'Completed' || (project.progress || 0) >= 100;
                const accentColor = isCompleted ? '#10B981' : pConf.color;

                return (
                  <motion.div
                    key={project._id}
                    variants={itemVariants}
                    className="group block relative"
                  >
                    <Link 
                      href={`/marketplace/${platform.toLowerCase()}/${project._id}`} 
                      className={`block rounded-2xl p-5 md:p-6 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 transition-all duration-300 shadow-sm group hover:-translate-y-1 ${
                        isCompleted
                          ? 'hover:border-emerald-500/60 hover:shadow-[0_12px_28px_rgba(16,185,129,0.2)]'
                          : 'hover:border-[#00E5FF]/60 hover:shadow-[0_12px_28px_rgba(0,229,255,0.2)]'
                      }`}
                    >
                      <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center relative z-10">
                        
                        {/* Project Title & Client */}
                        <div className="col-span-4 min-w-0">
                          <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all truncate">
                            {project.title}
                          </h3>
                          <p className="text-xs font-sans text-secondary mt-0.5 flex items-center gap-1.5 truncate">
                            <Users size={12} className="opacity-70" /> 
                            <span>{project.clientDetails?.clientName || project.clientName || 'Direct Client'}</span>
                          </p>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 flex items-center">
                          <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-mono font-bold rounded-lg border ${
                            isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : getStatusBadge(project.status)
                          }`}>
                            {isCompleted ? 'Completed' : project.status}
                          </span>
                        </div>

                        {/* Progress (Green Bar for Completed) */}
                        <div className="col-span-3 flex items-center">
                          <div className="flex flex-col w-full max-w-[200px] gap-1.5">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-secondary">Completion</span>
                              {isCompleted ? (
                                <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={11} /> 100%
                                </span>
                              ) : (
                                <span className="text-slate-900 dark:text-white font-bold">{project.progress || 0}%</span>
                              )}
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-700"
                                style={{ 
                                  width: `${isCompleted ? 100 : (project.progress || 0)}%`,
                                  backgroundColor: isCompleted ? '#10B981' : pConf.color,
                                  boxShadow: isCompleted ? '0 0 10px rgba(16,185,129,0.5)' : `0 0 10px ${pConf.glowColor}`
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
                            <Clock size={13} className={isCompleted ? "text-emerald-400" : "text-[#00E5FF]"} />
                            <span>
                              {project.deadline 
                                ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Flexible'}
                            </span>
                          </div>

                          <div 
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isCompleted 
                                ? 'bg-black/5 dark:bg-white/5 group-hover:bg-[#10B981] text-secondary group-hover:text-white' 
                                : 'bg-black/5 dark:bg-white/5 group-hover:bg-[#00E5FF] text-secondary group-hover:text-black'
                            }`}
                          >
                            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGINATION CONTROLS (MAX 9 PROJECTS PER PAGE) */}
        {/* ========================================================================= */}
        {filteredProjects.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 pb-12 border-t border-black/10 dark:border-white/10">
            {/* Range counter */}
            <div className="text-xs font-mono text-secondary">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(validPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-900 dark:text-white">{Math.min(validPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> projects
            </div>

            {/* Page navigation buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {/* Prev Button */}
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  disabled={validPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] text-xs font-heading font-bold text-slate-800 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1 shadow-sm"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === validPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center ${
                          isActive
                            ? 'scale-105 font-extrabold'
                            : 'bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-secondary hover:text-slate-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20'
                        }`}
                        style={isActive ? {
                          backgroundColor: pConf.color,
                          color: pConf.color === '#00E5FF' || pConf.color === '#10B981' ? '#000' : '#fff',
                          boxShadow: `0 0 15px ${pConf.glowColor}`
                        } : {}}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  disabled={validPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] text-xs font-heading font-bold text-slate-800 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
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
