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
      accentColor: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      id: 'direct',
      title: 'Direct Clients',
      href: '/marketplace/direct',
      icon: <Users size={48} className="text-indigo-500" />,
      stats: platformStats.direct,
      accentColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      id: 'upwork',
      title: 'Upwork',
      href: '/marketplace/upwork',
      icon: <Briefcase size={48} className="text-emerald-500" />,
      stats: platformStats.upwork,
      accentColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'fiverr',
      title: 'Fiverr',
      href: '/marketplace/fiverr',
      icon: <ShoppingCart size={48} className="text-fuchsia-500" />,
      stats: platformStats.fiverr,
      accentColor: 'text-fuchsia-600 dark:text-fuchsia-400'
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 neu-base-bg text-slate-800 dark:text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 max-w-7xl mx-auto">
        <div>
          <h1 className="mb-3">
            Marketplace Hub
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-500 dark:text-gray-400 flex items-center gap-2">
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
              className={`group flex flex-col min-h-[380px] md:min-h-[480px] neu-flat rounded-3xl p-6 md:p-10 transition-all duration-300 hover:-translate-y-2 cursor-pointer relative overflow-hidden`}
            >
              
              {/* Folder Icon container */}
              <div className="mb-8 md:mb-12 flex justify-between items-start">
                <div className={`p-4 md:p-5 rounded-2xl neu-pressed transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  {folder.icon}
                </div>
                
                <div className="w-12 h-12 rounded-full neu-button flex items-center justify-center text-slate-500 dark:text-slate-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors">
                  <ArrowRight size={22} className="group-hover:-rotate-45 transition-transform duration-300" />
                </div>
              </div>

              {/* Title & Stats */}
              <div className="mt-auto">
                <h2 className="mb-6 md:mb-8">
                  {folder.title}
                </h2>
                
                {/* Project Status Counts */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 neu-pressed rounded-xl">
                    <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {folder.stats.inProgress}
                    </div>
                    <div className="text-[9px] font-jakarta font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide leading-tight">
                      In<br/>Progress
                    </div>
                  </div>
                  
                  <div className="text-center p-3 neu-pressed rounded-xl">
                    <div className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 mb-1">
                      {folder.stats.completed}
                    </div>
                    <div className="text-[9px] font-jakarta font-bold text-green-600/70 dark:text-green-400/70 uppercase tracking-wide leading-tight">
                      Completed
                    </div>
                  </div>
                  
                  <div className="text-center p-3 neu-pressed rounded-xl">
                    <div className="text-2xl font-mono font-bold text-red-600 dark:text-red-400 mb-1">
                      {folder.stats.cancelled}
                    </div>
                    <div className="text-[9px] font-jakarta font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-wide leading-tight">
                      Cancelled
                    </div>
                  </div>
                </div>
                
                {/* Financial Stats */}
                <div className="space-y-4 neu-pressed rounded-2xl p-5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-slate-600 dark:text-gray-400 font-jakarta font-bold uppercase tracking-wide">Total Earned</span>
                    <span className={`text-xl font-mono font-extrabold ${folder.accentColor} whitespace-nowrap`}>
                      ${folder.stats.totalEarned.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="h-px w-full bg-slate-300 dark:bg-slate-700/50" />
                  
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-slate-600 dark:text-gray-400 font-jakarta font-bold uppercase tracking-wide">Pipeline</span>
                    <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
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
