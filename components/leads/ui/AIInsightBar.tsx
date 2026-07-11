'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function AIInsightBar() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-900/20 via-[#11131A] to-[#11131A] border border-[#232734] rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-blue-500/10 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Sparkles size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            Morning Insight <span className="text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold">Beta</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-white">5 leads</span> need follow-up today
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span className="text-white">3 replies</span> waiting
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span className="text-white">2 inactive leads</span> detected
          </div>
        </div>
      </div>

      <button className="relative z-10 flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-colors border border-white/5 whitespace-nowrap">
        View All Insights <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}
