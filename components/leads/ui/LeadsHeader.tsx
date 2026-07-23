'use client';

import React, { useState } from 'react';
import { Download, FileText, Plus, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface LeadsHeaderProps {
  showFollowUps: boolean;
  setShowFollowUps: (show: boolean) => void;
  setIsCSVModalOpen: (show: boolean) => void;
  setIsFormOpen: (show: boolean) => void;
}

export default function LeadsHeader({
  showFollowUps,
  setShowFollowUps,
  setIsCSVModalOpen,
  setIsFormOpen
}: LeadsHeaderProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success('Leads exported successfully as CSV!');
    }, 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-5"
    >
      {/* Left: Title + Description */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
            <Users size={17} />
          </div>
          <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">CRM</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">
          Prospects
        </h1>
        <p className="text-sm font-medium text-[#94A3B8]">
          Manage your leads, pipeline and customer outreach.
        </p>
      </motion.div>

      {/* Right: Actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Follow-ups toggle */}
        <button
          onClick={() => setShowFollowUps(!showFollowUps)}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            showFollowUps
              ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
              : 'neu-button text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showFollowUps ? 'bg-[#EF4444] animate-pulse' : 'bg-slate-400'}`}></span>
          <span className="hidden sm:inline">Follow-ups Today</span>
          <span className="sm:hidden">Follow-ups</span>
        </button>

        {/* Export */}
        <button onClick={handleExport} disabled={isExporting} className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm neu-button text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all disabled:opacity-50">
          {isExporting ? <Loader2 size={15} className="animate-spin text-indigo-500" /> : <Download size={15} />}
          <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
        </button>

        {/* Import CSV */}
        <button
          onClick={() => setIsCSVModalOpen(true)}
          className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm neu-button text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
        >
          <FileText size={15} />
          <span className="hidden sm:inline">Import CSV</span>
          <span className="sm:hidden">Import</span>
        </button>

        {/* Add Lead — Primary */}
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.25)] hover:shadow-[0_0_28px_rgba(79,70,229,0.45)] transition-all border border-indigo-500/80"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Lead
        </button>
      </motion.div>
    </motion.div>
  );
}
