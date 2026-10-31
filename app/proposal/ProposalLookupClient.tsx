'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProposalLookupClient() {
  const [proposalCode, setProposalCode] = useState('');
  const router = useRouter();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalCode.trim()) return;
    router.push(`/proposal/${encodeURIComponent(proposalCode.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07080B] flex flex-col justify-between p-6">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6324FC] to-[#00E5FF] p-[1px]">
            <div className="w-full h-full bg-white dark:bg-[#0A0B10] rounded-[11px] flex items-center justify-center">
              <span className="font-heading font-black text-lg bg-gradient-to-br from-[#6324FC] to-[#00E5FF] bg-clip-text text-transparent">I</span>
            </div>
          </div>
          <span className="font-heading font-black text-slate-900 dark:text-white tracking-tight">
            Injaazh Global
          </span>
        </div>
        <Link 
          href="/login" 
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Staff Sign In →
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto my-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6324FC]/10 to-[#00E5FF]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] mx-auto mb-6 shadow-lg shadow-[#6324FC]/5">
          <FileText size={32} />
        </div>

        <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Client Proposal Portal
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Enter the Proposal Number or Link provided by Injaazh to review and digitally accept your project proposal.
        </p>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. PROP-2026-001 or Proposal ID"
              value={proposalCode}
              onChange={(e) => setProposalCode(e.target.value)}
              className="w-full bg-white dark:bg-[#0E0F17] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#6324FC] shadow-sm transition-all text-center"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6324FC] to-[#8042FF] text-white text-sm font-bold shadow-lg shadow-[#6324FC]/25 hover:shadow-[#6324FC]/40 transition-all flex items-center justify-center gap-2"
          >
            <span>Access Proposal</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-8 text-[11px] font-medium text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Encrypted Client Communication Portal</span>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center py-6 text-xs text-slate-400">
        © {new Date().getFullYear()} Injaazh Global. All rights reserved.
      </footer>
    </div>
  );
}

