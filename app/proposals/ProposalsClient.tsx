'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Send, Eye, CheckCircle, Clock, MoreHorizontal, DollarSign, Calendar } from 'lucide-react';

const MOCK_PROPOSALS = [
  {
    id: 'prop-1',
    title: 'Next.js & Laravel Architecture for E-commerce',
    client: 'Acme Corp',
    status: 'Sent',
    value: 4500,
    dateSent: '2026-05-25',
  },
  {
    id: 'prop-2',
    title: 'Technical SEO & GEO Strategy Audit',
    client: 'Globex Inc',
    status: 'Viewed',
    value: 1200,
    dateSent: '2026-05-26',
  },
  {
    id: 'prop-3',
    title: 'AEO Optimization & Brand Authority',
    client: 'Initech',
    status: 'Accepted',
    value: 2800,
    dateSent: '2026-05-20',
  },
  {
    id: 'prop-4',
    title: 'Immersive UI/UX Redesign',
    client: 'Soylent Corp',
    status: 'Draft',
    value: 3000,
    dateSent: null,
  }
];

export default function ProposalsClient() {
  const [proposals, setProposals] = useState(MOCK_PROPOSALS);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Accepted':
        return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/20', border: 'border-green-200 dark:border-green-500/30', icon: CheckCircle };
      case 'Sent':
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/30', icon: Send };
      case 'Viewed':
        return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/30', icon: Eye };
      case 'Draft':
      default:
        return { color: 'text-slate-600 dark:text-gray-400', bg: 'bg-slate-100 dark:bg-white/5', border: 'border-slate-200 dark:border-white/10', icon: Clock };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen p-8 text-slate-800 dark:text-slate-200">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-600 dark:from-white dark:to-gray-400">
            Smart Proposals
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Design, send, and track stunning client proposals</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Stat Badges */}
          <div className="flex bg-white/70 dark:bg-purple-950/10 backdrop-blur-md border border-slate-200 dark:border-purple-500/10 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <div className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10">
              <span className="text-xs text-slate-500 dark:text-gray-400 block mb-0.5">Active</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">5</span>
            </div>
            <div className="px-4 py-2 border-r border-slate-200 dark:border-purple-500/10">
              <span className="text-xs text-slate-500 dark:text-gray-400 block mb-0.5">Won This Month</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">$12k</span>
            </div>
            <div className="px-4 py-2">
              <span className="text-xs text-slate-500 dark:text-gray-400 block mb-0.5">Drafts</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">2</span>
            </div>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all text-sm">
            <Plus size={18} /> Create Proposal
          </button>
        </div>
      </div>

      {/* Pipeline Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {proposals.map((proposal) => {
          const StatusIcon = getStatusConfig(proposal.status).icon;
          const statusStyle = getStatusConfig(proposal.status);

          return (
            <motion.div
              key={proposal.id}
              variants={itemVariants}
              className="group bg-white/80 dark:bg-purple-950/20 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 shadow-sm dark:shadow-none hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] hover:border-indigo-200 dark:hover:border-purple-500/30 transition-all duration-300 flex flex-col cursor-pointer relative overflow-hidden"
            >
              {/* Top Row: Client & Options */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-all duration-300">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1">{proposal.client}</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Client</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white transition-colors p-1">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Title */}
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 line-clamp-2 leading-tight">
                {proposal.title}
              </h2>

              <div className="mt-auto space-y-4">
                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300 font-medium">
                    <DollarSign size={16} className="text-slate-400" />
                    {proposal.value.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 text-xs">
                    <Calendar size={14} />
                    {proposal.dateSent ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(proposal.dateSent)) : 'Not sent'}
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-2 w-max px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                  <StatusIcon size={14} />
                  {proposal.status}
                </div>
              </div>

              {/* Subtle accent line on hover */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
