'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  ShoppingCart, 
  Globe, 
  Users, 
  ArrowRight, 
  Sparkles, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Search, 
  Layers, 
  Flame, 
  ExternalLink,
  ChevronRight,
  Filter,
  Activity,
  AlertCircle
} from 'lucide-react';
import { IMarketplaceProject } from '@/models/MarketplaceProject';
import CreateMarketplaceProjectModal from '@/components/CreateMarketplaceProjectModal';
import { createMarketplaceProject } from '@/app/actions/marketplaceActions';
import toast, { Toaster } from 'react-hot-toast';

interface MarketplaceClientProps {
  allProjects?: IMarketplaceProject[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
};

export default function MarketplaceClient({ allProjects = [] }: MarketplaceClientProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPlatformForNew, setSelectedPlatformForNew] = useState('Freelancer');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'All' | 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr'>('All');

  // Calculate detailed financial and operational stats per platform
  const platformStats = useMemo(() => {
    const stats = {
      freelancer: { inProgress: 0, completed: 0, inReview: 0, cancelled: 0, totalEarned: 0, pipeline: 0, totalProjects: 0 },
      direct: { inProgress: 0, completed: 0, inReview: 0, cancelled: 0, totalEarned: 0, pipeline: 0, totalProjects: 0 },
      upwork: { inProgress: 0, completed: 0, inReview: 0, cancelled: 0, totalEarned: 0, pipeline: 0, totalProjects: 0 },
      fiverr: { inProgress: 0, completed: 0, inReview: 0, cancelled: 0, totalEarned: 0, pipeline: 0, totalProjects: 0 }
    };

    let totalEarnedAll = 0;
    let totalPipelineAll = 0;
    let totalActiveAll = 0;
    let totalCompletedAll = 0;

    allProjects.forEach((project: any) => {
      const platform = (project.platform || '').toLowerCase();
      if (stats[platform as keyof typeof stats]) {
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
        
        stats[platform as keyof typeof stats].totalEarned += earned;
        stats[platform as keyof typeof stats].totalProjects++;
        totalEarnedAll += earned;

        if (project.status === 'In Progress') {
          stats[platform as keyof typeof stats].inProgress++;
          stats[platform as keyof typeof stats].pipeline += pipelineAmount;
          totalActiveAll++;
          totalPipelineAll += pipelineAmount;
        } else if (project.status === 'In Review') {
          stats[platform as keyof typeof stats].inReview++;
          stats[platform as keyof typeof stats].pipeline += pipelineAmount;
          totalActiveAll++;
          totalPipelineAll += pipelineAmount;
        } else if (project.status === 'Completed') {
          stats[platform as keyof typeof stats].completed++;
          totalCompletedAll++;
        } else if (project.status === 'Cancelled') {
          stats[platform as keyof typeof stats].cancelled++;
        } else {
          // Planning or others
          stats[platform as keyof typeof stats].pipeline += pipelineAmount;
          totalPipelineAll += pipelineAmount;
        }
      }
    });

    return {
      platforms: stats,
      overall: {
        totalEarned: totalEarnedAll,
        totalPipeline: totalPipelineAll,
        totalActive: totalActiveAll,
        totalCompleted: totalCompletedAll,
        totalProjects: allProjects.length,
      }
    };
  }, [allProjects]);

  // Handle Save New Project
  const handleSaveProject = async (data: any) => {
    try {
      const result = await createMarketplaceProject(data);
      if (result.success) {
        toast.success('Marketplace project created successfully!');
        setIsCreateModalOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create project');
      }
    } catch {
      toast.error('Network error while creating project');
    }
  };

  // Filtered project list for recent stream
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p: any) => {
      if (channelFilter !== 'All' && p.platform?.toLowerCase() !== channelFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const clientMatch = (p.clientName || '').toLowerCase().includes(q);
        const platMatch = (p.platform || '').toLowerCase().includes(q);
        if (!titleMatch && !clientMatch && !platMatch) return false;
      }
      return true;
    }).slice(0, 8);
  }, [allProjects, channelFilter, searchQuery]);

  const platformChannels = [
    {
      id: 'freelancer',
      name: 'Freelancer',
      subtitle: 'Global Bidding & Milestones',
      href: '/marketplace/freelancer',
      icon: Globe,
      color: '#00E5FF',
      glowColor: 'rgba(0,229,255,0.25)',
      borderColor: 'hover:border-[#00E5FF]/60',
      badgeClass: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30',
      stats: platformStats.platforms.freelancer,
    },
    {
      id: 'direct',
      name: 'Direct Clients',
      subtitle: 'Enterprise Retainers & Contracts',
      href: '/marketplace/direct',
      icon: Users,
      color: '#6324FC',
      glowColor: 'rgba(99,36,252,0.25)',
      borderColor: 'hover:border-[#6324FC]/60',
      badgeClass: 'bg-[#6324FC]/10 text-purple-300 border-[#6324FC]/30',
      stats: platformStats.platforms.direct,
    },
    {
      id: 'upwork',
      name: 'Upwork',
      subtitle: 'Fixed-Price & Hourly Agency',
      href: '/marketplace/upwork',
      icon: Briefcase,
      color: '#10B981',
      glowColor: 'rgba(16,185,129,0.25)',
      borderColor: 'hover:border-[#10B981]/60',
      badgeClass: 'bg-[#10B981]/10 text-emerald-400 border-[#10B981]/30',
      stats: platformStats.platforms.upwork,
    },
    {
      id: 'fiverr',
      name: 'Fiverr',
      subtitle: 'Gig Orders & Custom Offers',
      href: '/marketplace/fiverr',
      icon: ShoppingCart,
      color: '#EC4899',
      glowColor: 'rgba(236,72,153,0.25)',
      borderColor: 'hover:border-[#EC4899]/60',
      badgeClass: 'bg-[#EC4899]/10 text-pink-400 border-[#EC4899]/30',
      stats: platformStats.platforms.fiverr,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 pt-6 pb-24 font-sans selection:bg-[#6324FC] selection:text-white">
      <Toaster position="top-right" />

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/5 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-[1680px] mx-auto relative z-10 space-y-8">
        
        {/* ========================================================================= */}
        {/* EXECUTIVE HEADER & LIVE DIRECTORY BAR */}
        {/* ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 pb-4 border-b border-black/10 dark:border-white/10"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-heading font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#6324FC]" />
                GLOBAL MARKETPLACE DIRECTORY // CLIENT CHANNELS
              </div>
              <span className="text-xs text-secondary font-sans">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Marketplace Ecosystem
            </h1>
            <p className="text-xs md:text-sm text-secondary font-sans mt-0.5">
              Unified command center across Freelancer, Direct Clients, Upwork, and Fiverr channels.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Manage Clients Link */}
            <Link
              href="/marketplace/clients"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 text-slate-900 dark:text-white text-xs font-heading font-bold transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(99,36,252,0.25)]"
            >
              <Users size={15} className="text-[#6324FC] dark:text-[#00E5FF] group-hover:scale-110 transition-transform" />
              <span>Manage Clients</span>
            </Link>

            {/* + Create Project Laser Beam CTA */}
            <button
              onClick={() => {
                setSelectedPlatformForNew('Freelancer');
                setIsCreateModalOpen(true);
              }}
              className="group relative p-[1.5px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(99,36,252,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]"
            >
              {/* Conic Laser Beam Layers */}
              <span className="absolute -inset-[180%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_60deg,#6324FC_130deg,#00E5FF_180deg,#6324FC_230deg,transparent_300deg)] blur-[4px] opacity-75" />
              <span className="absolute -inset-[180%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_60deg,#6324FC_130deg,#00E5FF_180deg,#6324FC_230deg,transparent_300deg)] opacity-100" />
              
              <div className="relative z-10 px-4 py-2.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-colors">
                <Plus size={15} className="text-[#6324FC] dark:text-[#00E5FF] group-hover:rotate-90 transition-transform duration-300" />
                <span className="tracking-wide">+ Log Deliverable</span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* EXECUTIVE TELEMETRY KPI CARDS */}
        {/* ========================================================================= */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: Total Realized Revenue */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#10B981]/60 hover:shadow-[0_12px_30px_rgba(16,185,129,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#10B981]/25 blur-[35px] rounded-full opacity-20 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] group-hover:border-[#10B981] transition-all duration-300">
                <DollarSign size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                <Flame size={11} /> Realized Inflow
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Total Marketplace Revenue</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 transition-all">
                ${platformStats.overall.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Paid milestones & completed project inflows</p>
            </div>
          </motion.div>

          {/* Card 2: Active In-Flight Deliverables */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00E5FF]/60 hover:shadow-[0_12px_30px_rgba(0,229,255,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-20 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 dark:bg-[#00E5FF]/15 border border-cyan-500/30 dark:border-[#00E5FF]/30 flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300">
                <Clock size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-cyan-700 dark:text-[#00E5FF] bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                In Production
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Active Operations</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 transition-all">
                {platformStats.overall.totalActive}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">In-Progress & In-Review deliverables</p>
            </div>
          </motion.div>

          {/* Card 3: Pipeline Value in Delivery */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#6324FC]/60 hover:shadow-[0_12px_30px_rgba(99,36,252,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-20 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 dark:bg-[#6324FC]/15 border border-purple-500/30 dark:border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300">
                <Briefcase size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-purple-700 dark:text-purple-300 bg-[#6324FC]/10 dark:bg-[#6324FC]/15 px-2 py-0.5 rounded-md border border-purple-500/30 dark:border-[#6324FC]/30 group-hover:border-[#6324FC]/50 transition-colors">
                Pending Release
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Outstanding Pipeline</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 transition-all">
                ${platformStats.overall.totalPipeline.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Unreleased milestone and project budget value</p>
            </div>
          </motion.div>

          {/* Card 4: Delivered Lifetime Projects */}
          <motion.div 
            variants={itemVariants} 
            className="group glass-card rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F59E0B]/60 hover:shadow-[0_12px_30px_rgba(245,158,11,0.25)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F59E0B]/25 blur-[35px] rounded-full opacity-20 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-[#F59E0B]/30 flex items-center justify-center text-amber-600 dark:text-[#F59E0B] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover:border-[#F59E0B] transition-all duration-300">
                <CheckCircle2 size={17} />
              </div>
              <span className="text-[10px] font-heading font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                100% Fulfilled
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">Completed Deliverables</p>
              <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 transition-all">
                {platformStats.overall.totalCompleted}
              </p>
              <p className="text-[10px] font-sans text-secondary mt-1 truncate">Total projects delivered across channels</p>
            </div>
          </motion.div>
        </motion.div>

        {/* ========================================================================= */}
        {/* MULTI-CHANNEL PLATFORM HUBS (THE 4 PILLARS) */}
        {/* ========================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} className="text-[#6324FC]" /> Primary Channels & Ecosystem Portals
            </h2>
            <span className="text-[11px] font-mono text-secondary">
              Select channel to view projects, milestones & deliverables
            </span>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
          >
            {platformChannels.map((channel) => {
              const Icon = channel.icon;
              const totalChannelProjects = channel.stats.inProgress + channel.stats.completed + channel.stats.cancelled + (channel.stats.inReview || 0);
              const completionRatio = totalChannelProjects > 0 
                ? Math.round((channel.stats.completed / totalChannelProjects) * 100) 
                : 0;

              return (
                <Link 
                  key={channel.id} 
                  href={channel.href} 
                  className="block group outline-none focus:outline-none"
                >
                  <motion.div
                    variants={itemVariants}
                    className={`glass-card rounded-3xl p-6 md:p-7 flex flex-col justify-between min-h-[420px] relative overflow-hidden transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 ${channel.borderColor} hover:shadow-[0_16px_40px_${channel.glowColor}] shadow-sm`}
                  >
                    {/* Channel Ambient Flare */}
                    <div 
                      className="absolute -top-16 -right-16 w-44 h-44 blur-[50px] rounded-full opacity-15 dark:opacity-30 group-hover:opacity-90 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                      style={{ backgroundColor: channel.color }}
                    />
                    {/* Top Accent Neon Line */}
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-16 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent to-transparent transition-all duration-500 opacity-90"
                      style={{ 
                        backgroundImage: `linear-gradient(to right, transparent, ${channel.color}, transparent)`,
                        boxShadow: `0 0 12px ${channel.color}`
                      }}
                    />

                    {/* Top Header & Icon Box */}
                    <div className="relative z-10 flex items-start justify-between mb-6">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border"
                        style={{
                          backgroundColor: `${channel.color}15`,
                          borderColor: `${channel.color}35`,
                          color: channel.color,
                          boxShadow: `0 0 20px ${channel.color}20`
                        }}
                      >
                        <Icon size={28} />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${channel.badgeClass}`}>
                          {channel.stats.inProgress} Active
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-secondary group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-200/50 dark:group-hover:bg-white/10 transition-colors">
                          <ArrowRight size={14} className="group-hover:-rotate-45 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="relative z-10 mb-6">
                      <h3 className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-all">
                        {channel.name}
                      </h3>
                      <p className="text-xs font-sans text-secondary mt-0.5">
                        {channel.subtitle}
                      </p>
                    </div>

                    {/* Project Status Counter Grid */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 mb-6">
                      {/* In Progress */}
                      <div className="text-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
                        <div className="text-lg font-mono font-bold text-[#6324FC] dark:text-[#00E5FF]">
                          {channel.stats.inProgress}
                        </div>
                        <div className="text-[9px] font-heading font-bold text-secondary uppercase tracking-wider mt-0.5">
                          In Flight
                        </div>
                      </div>

                      {/* Completed */}
                      <div className="text-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
                        <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {channel.stats.completed}
                        </div>
                        <div className="text-[9px] font-heading font-bold text-secondary uppercase tracking-wider mt-0.5">
                          Done
                        </div>
                      </div>

                      {/* Pipeline Count */}
                      <div className="text-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
                        <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                          {channel.stats.inReview || channel.stats.cancelled}
                        </div>
                        <div className="text-[9px] font-heading font-bold text-secondary uppercase tracking-wider mt-0.5">
                          Review
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="relative z-10 p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 space-y-2.5 mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">
                          Realized Inflow
                        </span>
                        <span 
                          className="text-base font-mono font-extrabold whitespace-nowrap"
                          style={{ color: channel.color }}
                        >
                          ${channel.stats.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </span>
                      </div>

                      <div className="h-[1px] bg-black/5 dark:bg-white/5" />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider">
                          Pipeline Buffer
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          ${channel.stats.pipeline.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* Completion Velocity Mini-Meter */}
                      <div className="pt-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-secondary mb-1">
                          <span>Delivery Ratio</span>
                          <span>{completionRatio}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${completionRatio}%`,
                              backgroundColor: channel.color 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* RECENT MARKETPLACE DELIVERABLES STREAM & PERFORMANCE SHARE */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Left 2 Cols: Live Deliverables Stream */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xs font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-[#6324FC] dark:text-[#00E5FF]" /> Live Channel Deliverables
              </h2>

              {/* Platform Filter Pills */}
              <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl overflow-x-auto custom-scrollbar">
                {(['All', 'Freelancer', 'Direct', 'Upwork', 'Fiverr'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`px-3 py-1 rounded-lg text-xs font-heading font-bold transition-all whitespace-nowrap ${
                      channelFilter === ch 
                        ? 'bg-[#6324FC] text-white shadow-[0_0_10px_rgba(99,36,252,0.4)]' 
                        : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverables by project title, client name or platform..."
                className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
              />
            </div>

            {/* Deliverables Cards Grid */}
            <div className="space-y-2.5">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((p: any) => {
                  const plat = (p.platform || 'Freelancer').toLowerCase();
                  const platColor = plat === 'freelancer' ? '#00E5FF' : plat === 'direct' ? '#6324FC' : plat === 'upwork' ? '#10B981' : '#EC4899';

                  return (
                    <div
                      key={p._id || p.id}
                      onClick={() => router.push(`/marketplace/${plat}/${p._id || p.id}`)}
                      className="p-4 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm dark:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase"
                            style={{ 
                              backgroundColor: `${platColor}15`,
                              borderColor: `${platColor}35`,
                              color: platColor 
                            }}
                          >
                            {p.platform || 'Platform'}
                          </span>

                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            p.status === 'Completed' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : p.status === 'In Progress'
                              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <h4 className="text-xs md:text-sm font-heading font-semibold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors truncate">
                          {p.title}
                        </h4>

                        <p className="text-[11px] font-sans text-secondary mt-0.5 flex items-center gap-2">
                          <span>Client: <strong className="text-slate-800 dark:text-white/80">{p.clientName || 'Direct Client'}</strong></span>
                          {p.deadline && <span>• Due: {new Date(p.deadline).toLocaleDateString()}</span>}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                        <div className="text-right">
                          <span className="text-[10px] font-heading font-bold text-secondary uppercase block">Budget</span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{p.budget || '$0'}</span>
                        </div>

                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 group-hover:bg-[#6324FC] text-secondary group-hover:text-white flex items-center justify-center transition-all">
                          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white dark:bg-[#0a0a0d] rounded-2xl border border-black/5 dark:border-white/5 p-6 shadow-sm">
                  <AlertCircle size={22} className="text-secondary mx-auto mb-2" />
                  <p className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-0.5">No Projects Found</p>
                  <p className="text-[11px] font-sans text-secondary">
                    {searchQuery ? 'No deliverables match your search criteria.' : 'Create a new marketplace deliverable above to populate this stream.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Platform Workload & Performance Distribution */}
          <div className="space-y-4">
            <h2 className="text-xs font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-[#6324FC]" /> Channel Workload Share
            </h2>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 space-y-4 shadow-sm dark:shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">Active Pipeline Matrix</span>
                <span className="text-[10px] font-mono text-[#6324FC] dark:text-[#00E5FF]">Live Synced</span>
              </div>

              <div className="space-y-3.5">
                {platformChannels.map((channel) => {
                  const totalEarned = channel.stats.totalEarned;
                  const sharePct = platformStats.overall.totalEarned > 0 
                    ? Math.round((totalEarned / platformStats.overall.totalEarned) * 100) 
                    : 0;

                  return (
                    <div key={channel.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-heading font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color }} />
                          {channel.name}
                        </span>
                        <span className="font-mono text-secondary">
                          ${totalEarned.toLocaleString()} ({sharePct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${sharePct}%`,
                            backgroundColor: channel.color 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Navigation Card Banner */}
              <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#6324FC]/10 to-cyan-500/10 dark:from-[#6324FC]/15 dark:to-[#00E5FF]/10 border border-purple-500/20 dark:border-[#6324FC]/30 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-heading font-bold text-slate-900 dark:text-white">Client Directory</h5>
                    <p className="text-[10px] font-sans text-secondary mt-0.5">Manage contacts & contracts</p>
                  </div>
                  <Link
                    href="/marketplace/clients"
                    className="px-3 py-1.5 rounded-lg bg-[#6324FC] hover:bg-[#521bd6] text-white text-[11px] font-heading font-bold transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(99,36,252,0.4)]"
                  >
                    <span>View Clients</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* CREATE MARKETPLACE PROJECT MODAL */}
      {/* ========================================================================= */}
      <CreateMarketplaceProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveProject}
        defaultPlatform={selectedPlatformForNew}
      />
    </div>
  );
}
