'use client';

import React, { useState, useEffect } from 'react';
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
import { getLeads } from '@/app/actions/leadActions';
import { getMarketplaceProjects } from '@/app/actions/marketplaceActions';

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
    transition: { duration: 0.6, ease: "easeOut" as const } 
  }
};

export default function Dashboard() {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [stats, setStats] = useState([
    { label: 'Total Active Leads', value: '0', trend: 'Loading...', icon: Users, color: 'from-purple-500 to-fuchsia-400' },
    { label: 'Follow-ups Today', value: '0', trend: 'Loading...', icon: CalendarClock, color: 'from-purple-500 to-fuchsia-400', glow: true },
    { label: 'Pipeline Value', value: '$0', trend: 'Loading...', icon: DollarSign, color: 'from-purple-500 to-fuchsia-400' },
    { label: 'Active Gigs', value: '0', trend: 'Loading...', icon: Briefcase, color: 'from-purple-500 to-fuchsia-400' },
  ]);
  const [priorityFollowUps, setPriorityFollowUps] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch leads
        const leadsResponse = await getLeads();
        const leads = leadsResponse.success ? leadsResponse.data : [];
        
        // Fetch marketplace projects
        const projects = await getMarketplaceProjects();
        
        // Calculate total active leads
        const totalLeads = leads.length;
        
        // Calculate follow-ups today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followUpsToday = leads.filter((lead: any) => {
          if (!lead.nextFollowUpDate) return false;
          const followUpDate = new Date(lead.nextFollowUpDate);
          followUpDate.setHours(0, 0, 0, 0);
          return followUpDate.getTime() === today.getTime();
        }).length;
        
        // Calculate pipeline value from marketplace projects
        const pipelineValue = projects.reduce((sum: number, project: any) => {
          const budgetValue = project.budget 
            ? parseFloat(project.budget.replace(/[^0-9.-]+/g, '')) 
            : 0;
          return sum + budgetValue;
        }, 0);
        
        // Count active projects
        const activeProjects = projects.filter((p: any) => 
          p.status === 'In Progress' || p.status === 'Planning'
        ).length;
        
        // Update stats
        setStats([
          { 
            label: 'Total Active Leads', 
            value: totalLeads.toString(), 
            trend: `${leads.filter((l: any) => l.outreach_status === 'New').length} new this week`, 
            icon: Users, 
            color: 'from-purple-500 to-fuchsia-400' 
          },
          { 
            label: 'Follow-ups Today', 
            value: followUpsToday.toString(), 
            trend: followUpsToday > 0 ? `${followUpsToday} urgent` : 'All clear', 
            icon: CalendarClock, 
            color: 'from-purple-500 to-fuchsia-400', 
            glow: followUpsToday > 0 
          },
          { 
            label: 'Pipeline Value', 
            value: `$${pipelineValue.toLocaleString()}`, 
            trend: `${projects.length} total projects`, 
            icon: DollarSign, 
            color: 'from-purple-500 to-fuchsia-400' 
          },
          { 
            label: 'Active Gigs', 
            value: activeProjects.toString(), 
            trend: `${projects.filter((p: any) => p.status === 'Completed').length} completed`, 
            icon: Briefcase, 
            color: 'from-purple-500 to-fuchsia-400' 
          },
        ]);
        
        // Get priority follow-ups (leads with follow-up date today or overdue)
        const priorityLeads = leads
          .filter((lead: any) => {
            if (!lead.nextFollowUpDate) return false;
            const followUpDate = new Date(lead.nextFollowUpDate);
            return followUpDate <= new Date();
          })
          .slice(0, 4)
          .map((lead: any) => ({
            id: lead._id,
            name: lead.company_name,
            service: lead.targetService || 'General Inquiry',
            status: lead.outreach_status,
            time: new Date(lead.nextFollowUpDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            statusColor: getStatusColor(lead.outreach_status)
          }));
        
        setPriorityFollowUps(priorityLeads);
        
        // Get recent activity from leads
        const activities: any[] = [];
        leads.slice(0, 4).forEach((lead: any) => {
          if (lead.outreach_logs && lead.outreach_logs.length > 0) {
            const latestLog = lead.outreach_logs[0];
            activities.push({
              id: lead._id,
              action: `${latestLog.method} outreach`,
              target: lead.company_name,
              type: latestLog.method,
              time: getRelativeTime(new Date(latestLog.date))
            });
          }
        });
        
        setRecentActivity(activities.slice(0, 4));
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    }
    
    loadDashboardData();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'New': return 'text-blue-600 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-900/40';
      case 'Contacted': return 'text-yellow-600 dark:text-yellow-300 bg-yellow-500/10 dark:bg-yellow-900/40';
      case 'Meeting Booked': return 'text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-900/40';
      case 'Replied': return 'text-violet-600 dark:text-violet-300 bg-violet-500/10 dark:bg-violet-900/40';
      default: return 'text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-900/40';
    }
  };
  
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

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
                {priorityFollowUps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                    <CalendarClock size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No Follow-ups Today</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500">All caught up! No urgent follow-ups scheduled.</p>
                  </div>
                ) : (
                  priorityFollowUps.map((lead) => (
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
                ))
                )}
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
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center ml-8">
                    <Clock size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-base font-semibold text-slate-600 dark:text-slate-400 mb-2">No Recent Activity</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500">Start adding leads to see activity here.</p>
                  </div>
                ) : (
                  recentActivity.map((activity, idx) => (
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
                ))
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
