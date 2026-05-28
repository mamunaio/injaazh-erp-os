'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, ShoppingCart, Globe, Users, ArrowRight, FolderOpen } from 'lucide-react';
import { IMarketplaceProject } from '@/models/MarketplaceProject';

export default function MarketplaceClient({ initialProjects = [] }: { initialProjects?: IMarketplaceProject[] }) {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const platformFolders = [
    {
      id: 'upwork',
      title: 'Upwork',
      href: '/marketplace/upwork',
      icon: <Briefcase size={48} className="text-emerald-500" />,
      stats: '12 Active Projects',
      pipeline: '$24,500',
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]',
      borderGlow: 'hover:border-emerald-500/50',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
    },
    {
      id: 'fiverr',
      title: 'Fiverr',
      href: '/marketplace/fiverr',
      icon: <ShoppingCart size={48} className="text-fuchsia-500" />,
      stats: '8 Active Gigs',
      pipeline: '$6,200',
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(217,70,239,0.3)]',
      borderGlow: 'hover:border-fuchsia-500/50',
      iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20'
    },
    {
      id: 'freelancer',
      title: 'Freelancer',
      href: '/marketplace/freelancer',
      icon: <Globe size={48} className="text-cyan-500" />,
      stats: '3 Active Projects',
      pipeline: '$8,000',
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)]',
      borderGlow: 'hover:border-cyan-500/50',
      iconBg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20'
    },
    {
      id: 'direct',
      title: 'Direct Clients',
      href: '/marketplace/direct',
      icon: <Users size={48} className="text-indigo-500" />,
      stats: '5 Active Projects',
      pipeline: '$32,000',
      glow: 'hover:shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)]',
      borderGlow: 'hover:border-indigo-500/50',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
    }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-600 dark:from-white dark:to-gray-400">
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
      >
        {platformFolders.map((folder) => (
          <Link key={folder.id} href={folder.href} className="block outline-none outline-0 focus:ring-0">
            <motion.div
              variants={itemVariants}
              className={`group flex flex-col h-full bg-white/70 dark:bg-purple-950/10 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer relative overflow-hidden ${folder.glow} ${folder.borderGlow}`}
            >
              
              {/* Folder Icon container */}
              <div className="mb-10 flex justify-between items-start">
                <div className={`p-4 rounded-2xl border ${folder.iconBg} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  {folder.icon}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-gray-500 group-hover:bg-slate-800 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                  <ArrowRight size={20} className="group-hover:-rotate-45 transition-transform duration-300" />
                </div>
              </div>

              {/* Title & Stats */}
              <div className="mt-auto">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                  {folder.title}
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-gray-400 font-medium">Status</span>
                    <span className="text-slate-700 dark:text-gray-300 font-semibold">{folder.stats}</span>
                  </div>
                  
                  <div className="h-px w-full bg-slate-100 dark:bg-white/5" />
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-gray-400 font-medium">Pipeline</span>
                    <span className="text-slate-800 dark:text-white font-bold">{folder.pipeline}</span>
                  </div>
                </div>
              </div>

              {/* Ambient reflection */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 dark:bg-white/5 blur-3xl rounded-full pointer-events-none" />
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
