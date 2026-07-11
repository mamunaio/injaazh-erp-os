'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, MessageSquare, CheckCircle2, Trophy, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface LeadsKPIsProps {
  leads: any[];
}

export default function LeadsKPIs({ leads }: LeadsKPIsProps) {
  const newLeads    = leads.filter(l => l.status === 'New').length;
  const contacted   = leads.filter(l => l.status === 'Contacted').length;
  const qualified   = leads.filter(l => l.status === 'Meeting Booked').length;
  const converted   = leads.filter(l => l.status === 'Closed').length;
  const lost        = leads.filter(l => l.status === 'Not Interested').length;

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
      title: 'Contacted',
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
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="relative overflow-hidden bg-[#11131A] border border-[#232734] rounded-[24px] p-5 lg:p-6 cursor-pointer group transition-all"
          style={{
            '--accent': stat.accent,
          } as React.CSSProperties}
        >
          {/* Ambient Background Glow */}
          <div 
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-40 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
            style={{ backgroundColor: stat.accent }}
          />

          {/* Hover Border Glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px] pointer-events-none"
            style={{ boxShadow: `0 0 0 1px ${stat.border}, 0 0 24px ${stat.glow}` }}
          />

          {/* Top row */}
          <div className="flex items-start justify-between mb-5 relative z-10">
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}`, color: stat.accent, boxShadow: `0 0 20px ${stat.glow}` }}
            >
              <stat.icon size={20} strokeWidth={2.5} />
            </div>
            <div
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md`}
              style={{
                color: stat.trendUp ? '#10B981' : '#EF4444',
                backgroundColor: stat.trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${stat.trendUp ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
              }}
            >
              {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {stat.trend}
            </div>
          </div>

          {/* Value */}
          <div className="relative z-10">
            <p className="text-3xl font-bold text-white font-mono tracking-tight mb-1">{stat.value}</p>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{stat.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
