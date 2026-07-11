'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface QuickFilterChipsProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  leads: any[];
}

export default function QuickFilterChips({ activeFilter, setActiveFilter, leads }: QuickFilterChipsProps) {
  const chips = [
    { label: 'All Leads', value: 'All', count: leads.length, color: 'bg-slate-500' },
    { label: 'New', value: 'New', count: leads.filter(l => l.outreach_status === 'New').length, color: 'bg-blue-500' },
    { label: 'Email Sent', value: 'Email Sent', count: leads.filter(l => l.outreach_status === 'Email Sent').length, color: 'bg-yellow-500' },
    { label: 'Replied', value: 'Replied', count: leads.filter(l => l.outreach_status === 'Replied').length, color: 'bg-purple-500' },
    { label: 'Meeting', value: 'Meeting Booked', count: leads.filter(l => l.outreach_status === 'Meeting Booked').length, color: 'bg-emerald-500' },
    { label: 'Won', value: 'Closed', count: leads.filter(l => l.outreach_status === 'Closed').length, color: 'bg-indigo-500' },
    { label: 'Lost', value: 'Not Interested', count: leads.filter(l => l.outreach_status === 'Not Interested').length, color: 'bg-rose-500' }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar">
      <div className="flex items-center p-1 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl shadow-sm w-max">
        {chips.map(chip => {
          const isActive = activeFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors z-10 ${
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D27]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-white dark:bg-[#232734] rounded-xl -z-10 border border-slate-200 dark:border-white/10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${chip.color} ${isActive ? 'shadow-[0_0_8px_currentColor]' : 'opacity-50'}`}></div>
              {chip.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                isActive
                  ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white'
                  : 'bg-slate-100 dark:bg-[#09090B] text-slate-500'
              }`}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
