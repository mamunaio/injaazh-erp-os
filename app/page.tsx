'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CalendarClock, 
  DollarSign, 
  Briefcase, 
  Plus, 
  FileText, 
  ChevronDown,
  ArrowRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';

// --- MOCK DATA ---
const stats = [
  { label: 'Total Active Leads', value: '1,248', trend: '+12% this month', icon: Users, color: 'from-purple-500 to-fuchsia-400' },
  { label: 'Follow-ups Today', value: '14', trend: '5 urgent', icon: CalendarClock, color: 'from-purple-500 to-fuchsia-400', glow: true },
  { label: 'Pipeline Value', value: '$84,500', trend: '+5% this week', icon: DollarSign, color: 'from-purple-500 to-fuchsia-400' },
  { label: 'Active Gigs', value: '7', trend: '3 near delivery', icon: Briefcase, color: 'from-purple-500 to-fuchsia-400' },
];

const priorityFollowUps = [
  { id: 1, name: 'Acme Corp', service: 'High-end Web Development', status: 'Meeting Booked', time: '10:00 AM', statusColor: 'text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-900/40' },
  { id: 2, name: 'Global Tech', service: 'Technical SEO', status: 'Contacted', time: '1:30 PM', statusColor: 'text-fuchsia-600 dark:text-fuchsia-300 bg-fuchsia-500/10 dark:bg-fuchsia-900/40' },
  { id: 3, name: 'Stark Industries', service: 'Custom ERP / SaaS', status: 'Replied', time: '3:15 PM', statusColor: 'text-violet-600 dark:text-violet-300 bg-violet-500/10 dark:bg-violet-900/40' },
  { id: 4, name: 'Wayne Enterprises', service: 'UI/UX Design', status: 'New', time: 'Overdue', statusColor: 'text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-900/40' },
];

const recentActivity = [
  { id: 1, action: 'Sent Pitch Deck', target: 'Acme Corp', type: 'Email', time: '2 hrs ago' },
  { id: 2, action: 'Follow-up message', target: 'Global Tech', type: 'WhatsApp', time: '4 hrs ago' },
  { id: 3, action: 'Moved to Meeting Booked', target: 'Oscorp', type: 'System', time: '5 hrs ago' },
  { id: 4, action: 'Added new lead', target: 'Wayne Enterprises', type: 'System', time: 'Yesterday' },
];

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

export default function Dashboard() {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/5 via-slate-50 to-slate-50 dark:from-purple-900/20 dark:via-slate-950 dark:to-slate-950 text-slate-800 dark:text-slate-200 p-8 overflow-x-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 relative z-40"
        >
          <div>
            <p className="text-purple-600 dark:text-purple-400 font-medium text-sm mb-1 uppercase tracking-wider">{currentDate}</p>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Welcome back,{' '}
              <motion.span 
                className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 dark:from-purple-400 dark:via-fuchsia-400 dark:to-purple-400 inline-block"
                style={{ backgroundSize: '200% auto' }}
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                Mamun
              </motion.span>
            </h1>
          </div>

          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/60 dark:bg-purple-950/30 backdrop-blur-3xl border border-purple-500/10 dark:border-purple-500/30 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.05)] dark:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:bg-white/90 dark:hover:bg-purple-900/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:border-purple-500/20 dark:hover:border-purple-400/50 transition-colors duration-300 font-medium text-purple-700 dark:text-purple-100"
            >
              Quick Actions 
              <motion.div
                animate={{ rotate: isActionsOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={16} />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {isActionsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute right-0 mt-4 w-64 bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl border border-purple-500/10 dark:border-purple-500/30 rounded-2xl shadow-[0_20px_60px_-15px_rgba(139,92,246,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.5)] overflow-hidden origin-top-right"
                >
                  <div className="p-3">
                    <Link href="/leads">
                      <motion.div 
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(139, 92, 246, 0.08)' }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group cursor-pointer"
                      >
                        <div className="bg-purple-500/10 dark:bg-purple-500/20 backdrop-blur-md border border-purple-500/20 dark:border-purple-500/40 p-2 rounded-lg text-purple-600 dark:text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-[0_0_10px_rgba(139,92,246,0.05)] dark:shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                          <Plus size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-white transition-colors">Add New Lead</span>
                      </motion.div>
                    </Link>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(217, 70, 239, 0.08)' }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group cursor-pointer mt-1"
                    >
                      <div className="bg-fuchsia-500/10 dark:bg-fuchsia-500/20 backdrop-blur-md border border-fuchsia-500/20 dark:border-fuchsia-500/40 p-2 rounded-lg text-fuchsia-600 dark:text-fuchsia-300 group-hover:bg-fuchsia-500 group-hover:text-white transition-all shadow-[0_0_10px_rgba(217,70,239,0.05)] dark:shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                        <FileText size={16} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-fuchsia-700 dark:group-hover:text-white transition-colors">Create Proposal</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* STATS GRID */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-30"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`relative group bg-white/70 dark:bg-purple-950/10 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 shadow-sm rounded-2xl p-6 transition-all duration-300 hover:bg-white/90 dark:hover:bg-purple-900/20 hover:border-slate-300 dark:hover:border-purple-400/40 hover:shadow-md dark:hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)] ${stat.glow ? 'shadow-[0_0_20px_-5px_rgba(139,92,246,0.1)] dark:shadow-[0_0_20px_-5px_rgba(139,92,246,0.2)] border-purple-200 dark:border-purple-500/30' : ''}`}
              >
                {/* Animated shimmer border effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/0 via-fuchsia-400/0 to-purple-400/0 group-hover:from-purple-400/5 group-hover:via-fuchsia-400/5 group-hover:to-purple-400/5 dark:group-hover:from-purple-400/10 dark:group-hover:via-fuchsia-400/10 dark:group-hover:to-purple-400/10 transition-all duration-500 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <motion.div 
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className={`p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 backdrop-blur-xl border border-purple-500/20 dark:border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] dark:shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] dark:group-hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] group-hover:border-purple-400 transition-all duration-300`}
                  >
                    <Icon size={24} className="text-purple-600 dark:text-purple-200" />
                  </motion.div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">{stat.value}</h3>
                  <p className="text-sm text-slate-500 dark:text-purple-200/70 font-medium">{stat.label}</p>
                  <p className={`text-xs mt-3 font-semibold tracking-wide ${stat.glow ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-purple-600 dark:text-purple-400'}`}>
                    {stat.trend}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* MAIN CONTENT SPLIT */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-20"
        >
          {/* Left Panel: Priority Follow-ups */}
          <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col h-full">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Priority Follow-ups</h2>
              <Link href="/leads" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 flex items-center gap-1 transition-colors group">
                View all <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white/70 dark:bg-purple-950/10 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 shadow-sm rounded-3xl overflow-hidden flex-1 hover:border-slate-300 dark:hover:border-purple-400/30 hover:shadow-md dark:hover:shadow-[0_0_50px_-15px_rgba(139,92,246,0.25)] transition-all duration-500 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="divide-y divide-slate-100 dark:divide-purple-500/10 relative z-10 h-full flex flex-col">
                {priorityFollowUps.map((lead) => (
                  <motion.div 
                    key={lead.id} 
                    whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                    className="p-6 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/80 backdrop-blur-md border-2 border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.1)] dark:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all"
                      >
                        <span className="font-bold text-base text-purple-600 dark:text-purple-300">{lead.name.charAt(0)}</span>
                      </motion.div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{lead.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-purple-200/60 font-medium tracking-wide">{lead.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className={`px-4 py-1.5 rounded-full backdrop-blur-md border border-purple-500/10 dark:border-purple-500/30 text-xs font-bold tracking-wider ${lead.statusColor} shadow-[0_0_10px_rgba(139,92,246,0.05)] dark:shadow-[0_0_10px_rgba(139,92,246,0.1)]`}>
                        {lead.status}
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold min-w-[80px] justify-end">
                        <Clock size={14} className={lead.time === 'Overdue' ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-400 dark:text-purple-400/60'} />
                        <span className={lead.time === 'Overdue' ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-600 dark:text-slate-300'}>{lead.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Panel: Recent Activity */}
          <motion.div variants={itemVariants} className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 tracking-tight">Recent Activity</h2>
            
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white/70 dark:bg-purple-950/10 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 shadow-sm rounded-3xl p-8 flex-1 hover:border-slate-300 dark:hover:border-purple-400/30 hover:shadow-md dark:hover:shadow-[0_0_50px_-15px_rgba(139,92,246,0.25)] transition-all duration-500 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />
              <div className="relative border-l-2 border-purple-500/20 ml-4 space-y-10 z-10 pt-2 pb-4">
                {recentActivity.map((activity, idx) => (
                  <motion.div 
                    key={activity.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (idx * 0.1) }}
                    className="relative ml-8 group/item"
                  >
                    <motion.span 
                      whileHover={{ scale: 1.5 }}
                      className="absolute -left-[41px] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-purple-500 border-4 border-white dark:border-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.4)] dark:shadow-[0_0_15px_rgba(168,85,247,0.8)] z-20 cursor-pointer" 
                    />
                    <div className="bg-transparent group-hover/item:bg-purple-500/5 p-3 -mt-3 -ml-3 rounded-xl transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{activity.action}</h4>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-purple-300/50 whitespace-nowrap ml-4 uppercase tracking-wider">{activity.time}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {activity.type} • <span className="text-purple-600 dark:text-purple-400">{activity.target}</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
