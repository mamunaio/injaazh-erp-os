'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, ShoppingCart, Globe, Users, ArrowRight, FolderOpen } from 'lucide-react';
import { IMarketplaceProject } from '@/models/MarketplaceProject';

export default function MarketplaceClient({ allProjects = [] }: { allProjects?: IMarketplaceProject[] }) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  // Calculate real stats from database
  const platformStats = useMemo(() => {
    const stats = {
      upwork: { inProgress: 0, completed: 0, cancelled: 0, totalEarned: 0, pipeline: 0 },
      fiverr: { inProgress: 0, completed: 0, cancelled: 0, totalEarned: 0, pipeline: 0 },
      freelancer: { inProgress: 0, completed: 0, cancelled: 0, totalEarned: 0, pipeline: 0 },
      direct: { inProgress: 0, completed: 0, cancelled: 0, totalEarned: 0, pipeline: 0 }
    };

    allProjects.forEach((project: any) => {
      const platform = project.platform.toLowerCase();
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
        
        // Count by status
        if (project.status === 'In Progress') {
          stats[platform as keyof typeof stats].inProgress++;
          stats[platform as keyof typeof stats].pipeline += pipelineAmount;
        } else if (project.status === 'Completed') {
          stats[platform as keyof typeof stats].completed++;
          stats[platform as keyof typeof stats].pipeline += pipelineAmount;
        } else if (project.status === 'Cancelled') {
          stats[platform as keyof typeof stats].cancelled++;
        } else {
          // Planning, In Review, etc.
          stats[platform as keyof typeof stats].pipeline += pipelineAmount;
        }
      }
    });

    return stats;
  }, [allProjects]);

  const platformFolders = [
    {
      id: 'freelancer',
      title: 'Freelancer',
      href: '/marketplace/freelancer',
      icon: <Globe size={48} className="text-cyan-500" />,
      stats: platformStats.freelancer,
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)]',
      borderGlow: 'hover:border-cyan-500/50',
      iconBg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
      accentColor: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      id: 'direct',
      title: 'Direct Clients',
      href: '/marketplace/direct',
      icon: <Users size={48} className="text-indigo-500" />,
      stats: platformStats.direct,
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)]',
      borderGlow: 'hover:border-indigo-500/50',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
      accentColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      id: 'upwork',
      title: 'Upwork',
      href: '/marketplace/upwork',
      icon: <Briefcase size={48} className="text-emerald-500" />,
      stats: platformStats.upwork,
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]',
      borderGlow: 'hover:border-emerald-500/50',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      accentColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'fiverr',
      title: 'Fiverr',
      href: '/marketplace/fiverr',
      icon: <ShoppingCart size={48} className="text-fuchsia-500" />,
      stats: platformStats.fiverr,
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(217,70,239,0.3)]',
      borderGlow: 'hover:border-fuchsia-500/50',
      iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20',
      accentColor: 'text-fuchsia-600 dark:text-fuchsia-400'
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            Marketplace Hub
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-base mt-2 flex items-center gap-2">
            <FolderOpen size={16} /> Directory Hierarchy
          </p>
        </div>
      </div>

      {/* Folders Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-[1600px] mx-auto"
      >
        {platformFolders.map((folder) => (
          <Link key={folder.id} href={folder.href} className="block outline-none outline-0 focus:ring-0">
            <motion.div
              variants={itemVariants}
              className={`group flex flex-col min-h-[380px] md:min-h-[480px] bg-white/80 dark:bg-purple-950/20 backdrop-blur-3xl border-2 border-slate-200 dark:border-purple-500/20 rounded-3xl p-6 md:p-10 shadow-xl transition-all duration-300 hover:-translate-y-3 hover:scale-[1.03] cursor-pointer relative overflow-hidden ${folder.glow} ${folder.borderGlow}`}
            >
              
              {/* Folder Icon container */}
              <div className="mb-8 md:mb-12 flex justify-between items-start">
                <div className={`p-4 md:p-5 rounded-2xl border-2 ${folder.iconBg} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                  {folder.icon}
                </div>
                
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-gray-500 group-hover:bg-slate-800 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors shadow-md">
                  <ArrowRight size={22} className="group-hover:-rotate-45 transition-transform duration-300" />
                </div>
              </div>

              {/* Title & Stats */}
              <div className="mt-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6 md:mb-8">
                  {folder.title}
                </h2>
                
                {/* Project Status Counts */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border-2 border-blue-200 dark:border-blue-500/20 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {folder.stats.inProgress}
                    </div>
                    <div className="text-[9px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide leading-tight">
                      In<br/>Progress
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border-2 border-green-200 dark:border-green-500/20 shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {folder.stats.completed}
                    </div>
                    <div className="text-[9px] font-bold text-green-600/70 dark:text-green-400/70 uppercase tracking-wide leading-tight">
                      Completed
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border-2 border-red-200 dark:border-red-500/20 shadow-sm">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                      {folder.stats.cancelled}
                    </div>
                    <div className="text-[9px] font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-wide leading-tight">
                      Cancelled
                    </div>
                  </div>
                </div>
                
                {/* Financial Stats */}
                <div className="space-y-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-slate-600 dark:text-gray-400 font-bold uppercase tracking-wide">Total Earned</span>
                    <span className={`text-xl font-extrabold ${folder.accentColor} whitespace-nowrap`}>
                      ${folder.stats.totalEarned.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
                  
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-slate-600 dark:text-gray-400 font-bold uppercase tracking-wide">Pipeline</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      ${folder.stats.pipeline.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ambient reflection */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/30 dark:bg-white/10 blur-3xl rounded-full pointer-events-none" />
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
