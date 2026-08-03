'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, MessageSquare, CheckCircle2, Trophy, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface LeadsKPIsProps {
  leads: any[];
}

export default function LeadsKPIs({ leads }: LeadsKPIsProps) {
  const newLeads    = leads.filter(l => l.outreach_status === 'New').length;
  const contacted   = leads.filter(l => l.outreach_status === 'Email Sent').length;
  const qualified   = leads.filter(l => l.outreach_status === 'Meeting Booked').length;
  const converted   = leads.filter(l => l.outreach_status === 'Closed').length;
  const lost        = leads.filter(l => l.outreach_status === 'Not Interested').length;

  const stats = [
    {
      title: 'Total Prospects',
      value: leads.length,
      icon: Users,
      trend: '+12%',
      trendUp: true,
      accent: '#2563EB',
      bg: 'rgba(37,99,235,0.1)',
      border: 'rgba(37,99,235,0.25)',
      glow: 'rgba(37,99,235,0.15)',
    },
    {
      title: 'New',
      value: newLeads,
      icon: Mail,
      trend: '+8%',
      trendUp: true,
      accent: '#94A3B8', // Soft Gray
      bg: 'rgba(148,163,184,0.1)',
      border: 'rgba(148,163,184,0.25)',
      glow: 'rgba(148,163,184,0.15)',
    },
    {
      title: 'Email Sent',
      value: contacted,
      icon: MessageSquare,
      trend: '+5%',
      trendUp: true,
      accent: '#F59E0B', // Warm Yellow
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.25)',
      glow: 'rgba(245,158,11,0.15)',
    },
    {
      title: 'Qualified',
      value: qualified,
      icon: CheckCircle2,
      trend: '+18%',
      trendUp: true,
      accent: '#10B981', // Emerald Green
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.25)',
      glow: 'rgba(16,185,129,0.15)',
    },
    {
      title: 'Converted',
      value: converted,
      icon: Trophy,
      trend: '+4%',
      trendUp: true,
      accent: '#10B981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.25)',
      glow: 'rgba(16,185,129,0.15)',
    },
    {
      title: 'Lost',
      value: lost,
      icon: XCircle,
      trend: '-2%',
      trendUp: false,
      accent: '#EF4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.25)',
      glow: 'rgba(239,68,68,0.15)',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat, idx) => {
        // Vary the wave path slightly per card
        const hOffset1 = 60 + (idx * 15) % 40;
        const hOffset2 = 130 - (idx * 20) % 50;
        const pathData = `M0,${hOffset1} C150,${hOffset2} 250,${hOffset1 - 40} 400,${hOffset1 + 20} L400,150 L0,150 Z`;

        return (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
          className="group bg-white dark:bg-[#11131A] border border-slate-100 dark:border-[#232734] rounded-[24px] p-6 flex flex-col gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer relative overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
        >
           {/* Top colored line */}
           <div className="absolute top-0 left-[15%] right-[15%] h-[3px] rounded-b-md opacity-80 transition-all group-hover:left-[10%] group-hover:right-[10%]" style={{ backgroundColor: stat.accent }}></div>
           
           {/* Bottom abstract wave */}
           <div className="absolute bottom-0 left-0 w-full h-[60%] pointer-events-none opacity-[0.08] dark:opacity-[0.15]">
             <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="w-full h-full" style={{ color: stat.accent }}>
               <path fill="currentColor" d={pathData}></path>
             </svg>
           </div>

           <div className="flex justify-between items-start relative z-10">
             <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}`, color: stat.accent }}>
               <stat.icon size={18} />
             </div>
             <span className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md" style={{
                color: stat.trendUp ? '#10B981' : '#EF4444',
                backgroundColor: stat.trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
             }}>
                {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {stat.trend}
             </span>
           </div>
           
           <div className="relative z-10 mt-2">
             <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-widest">{stat.title}</p>
             <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{stat.value}</p>
           </div>
        </motion.div>
      )})}
    </div>
  );
}
