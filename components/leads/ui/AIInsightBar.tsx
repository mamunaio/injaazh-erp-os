'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function AIInsightBar({ 
  leadsToFollowUpCount, 
  repliesWaitingCount, 
  inactiveLeadsCount, 
  onViewInsights 
}: { 
  leadsToFollowUpCount: number, 
  repliesWaitingCount: number, 
  inactiveLeadsCount: number, 
  onViewInsights: () => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden text-slate-800 dark:text-slate-200"
    >
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-blue-500/10 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Sparkles size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            Morning Insight <span className="text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold">Beta</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-900 dark:text-white">{leadsToFollowUpCount} leads</span> need follow-up today
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span className="text-slate-900 dark:text-white">{repliesWaitingCount} replies</span> waiting
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span className="text-slate-900 dark:text-white">{inactiveLeadsCount} inactive leads</span> detected
          </div>
        </div>
      </div>

      <button 
        onClick={onViewInsights}
        className="relative z-10 flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-semibold rounded-lg transition-colors border border-blue-200 dark:border-white/5 whitespace-nowrap"
      >
        View All Insights <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}
