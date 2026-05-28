'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Link as LinkIcon, CheckCircle, FileSignature, Edit3, DollarSign, Calendar, LayoutGrid } from 'lucide-react';

export default function ProposalEditorClient({ proposalId }: { proposalId: string }) {
  const [title, setTitle] = useState('Next.js & Laravel Architecture for E-commerce');
  
  return (
    <div className="min-h-screen p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Header & Breadcrumb */}
      <div className="max-w-5xl mx-auto mb-8">
        <Link 
          href="/proposals"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-6 group font-medium"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Proposals
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-purple-950/20 backdrop-blur-xl border border-slate-200 dark:border-purple-500/10 p-4 rounded-2xl shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 hidden sm:block">
              <LayoutGrid size={24} />
            </div>
            <div className="flex-1 w-full">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl md:text-2xl font-bold bg-transparent border-none outline-none w-full text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:ring-0"
                placeholder="Proposal Title..."
              />
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">
                  <Edit3 size={10} /> Draft
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-400">ID: {proposalId}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold transition-all">
              <Save size={16} /> Save Draft
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
              <LinkIcon size={16} /> Generate Link
            </button>
          </div>
        </div>
      </div>

      {/* Notion-Style Document Canvas */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden min-h-[800px] flex flex-col"
      >
        {/* Document Header Gradient Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-fuchsia-900/40 relative">
          <div className="absolute -bottom-10 left-10 w-20 h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md">
            <span className="text-3xl">📄</span>
          </div>
        </div>
        
        {/* Document Content */}
        <div className="px-10 pt-16 pb-20 flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-800 dark:from-white dark:to-gray-400 leading-tight">
            {title}
          </h1>

          {/* Intro Section */}
          <section className="mb-12">
            <p className="text-slate-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
              Thank you for considering <span className="font-semibold text-indigo-600 dark:text-indigo-400">Injaazh Global</span>. Based on our recent discovery call, we've crafted a comprehensive architecture plan to elevate your e-commerce platform using cutting-edge Next.js and Laravel technologies.
            </p>
          </section>

          {/* Scope of Work */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
                <CheckCircle size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Scope of Work</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-purple-500/30 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">Phase 1: Discovery & UX Architecture</h3>
                <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">Comprehensive user research, wireframing, and the creation of a high-fidelity cinematic glassmorphism design system in Figma.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-purple-500/30 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">Phase 2: Next.js Frontend Development</h3>
                <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">Building lightning-fast, SSR-optimized interfaces using App Router, Tailwind CSS v4, and Framer Motion for micro-interactions.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-purple-500/30 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">Phase 3: Laravel Backend Integration</h3>
                <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">Constructing robust RESTful/GraphQL APIs, setting up secure authentication, and managing scalable database clusters.</p>
              </div>
            </div>
          </section>

          {/* Pricing Table */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400">
                <DollarSign size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Investment</h2>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400">
                  <tr>
                    <th className="p-4 font-semibold">Deliverable</th>
                    <th className="p-4 font-semibold w-32">Timeline</th>
                    <th className="p-4 font-semibold text-right w-32">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">UI/UX Design System</td>
                    <td className="p-4 text-slate-500 dark:text-gray-400">2 Weeks</td>
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium text-right">$1,500</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">Next.js Frontend Build</td>
                    <td className="p-4 text-slate-500 dark:text-gray-400">4 Weeks</td>
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium text-right">$3,800</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">Laravel API & Admin Panel</td>
                    <td className="p-4 text-slate-500 dark:text-gray-400">3 Weeks</td>
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium text-right">$2,700</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-indigo-950/20 border-t border-slate-200 dark:border-indigo-500/20">
                  <tr>
                    <td colSpan={2} className="p-4 text-right font-bold text-slate-600 dark:text-indigo-200">Total Investment</td>
                    <td className="p-4 text-right font-bold text-xl text-indigo-600 dark:text-indigo-400">$8,000</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Accept & Sign CTA */}
          <section className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/80 dark:to-black border border-slate-200 dark:border-purple-500/20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center mb-4 shadow-lg border border-slate-100 dark:border-white/5">
                <FileSignature size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Ready to move forward?</h3>
              <p className="text-slate-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Review the terms above. Once you're ready, securely sign this digital proposal to kick off the project immediately.
              </p>
              
              <button className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-white/20 transition-all text-lg flex items-center gap-3">
                <FileSignature size={20} /> Sign & Accept Proposal
              </button>
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
