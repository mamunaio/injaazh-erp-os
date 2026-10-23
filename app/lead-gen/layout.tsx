'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flame,
  LayoutDashboard,
  Users2,
  Mail,
  Briefcase,
  Clock,
  CheckSquare,
  CalendarDays,
  DollarSign,
  Settings as SettingsIcon,
  PlusCircle,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LeadGenProvider, useLeadGen } from './LeadGenContext';
import LeadModal from '@/components/leadGen/LeadModal';
import ImportModal from '@/components/leadGen/ImportModal';

const tabRoutes = [
  { id: 'dashboard', label: 'Dashboard', href: '/lead-gen/dashboard', icon: LayoutDashboard },
  { id: 'prospects', label: 'Prospects', href: '/lead-gen/prospects', icon: Users2 },
  { id: 'daily-outreach', label: 'Daily Outreach', href: '/lead-gen/daily-outreach', icon: Mail },
  { id: 'clients', label: 'Clients & MRR', href: '/lead-gen/clients', icon: Briefcase },
  { id: 'time-tracking', label: 'Time Tracking', href: '/lead-gen/time-tracking', icon: Clock },
  { id: 'team-tasks', label: 'Team Tasks', href: '/lead-gen/team-tasks', icon: CheckSquare },
  { id: 'delivery-sops', label: 'Delivery SOPs', href: '/lead-gen/delivery-sops', icon: CalendarDays },
  { id: 'financials', label: 'Financials & PnL', href: '/lead-gen/financials', icon: DollarSign },
  { id: 'settings', label: 'Settings & Guide', href: '/lead-gen/settings', icon: SettingsIcon },
];

function LeadGenShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    data,
    loading,
    refreshing,
    fetchState,
    openNewLead,
    isLeadModalOpen,
    editingProspect,
    closeLeadModal,
    handleSaveLead,
    handleDeleteProspect,
    isImportModalOpen,
    openImportModal,
    closeImportModal,
    handleExportExcel,
  } = useLeadGen();

  // Calculate live Mini KPIs
  const totalLeads = data?.prospects.length || 0;
  const verifiedLeads = data?.prospects.filter((p) => p.emailVerified === 'Yes').length || 0;
  const activeClients = data?.clients.filter((c) => c.status === 'Active') || [];
  const currentMrr = activeClients.reduce((acc, c) => acc + (c.monthlyRetainer || 0), 0);

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-[1600px] mx-auto w-full space-y-5">
      {/* 1. Dynamic Channel Header Banner (Matching Freelancer.com Style) */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden shadow-lg dark:shadow-2xl">
        {/* Top Neon Glow line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#FF6A00] to-transparent shadow-[0_0_15px_#FF6A00]"
        />
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-[#FF6A00]/15 via-[#6324FC]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: 'rgba(255, 106, 0, 0.12)',
              border: '1px solid rgba(255, 106, 0, 0.35)',
              color: '#FF6A00',
              boxShadow: '0 0 25px rgba(255, 106, 0, 0.25)'
            }}
          >
            <Flame size={32} className="text-[#FF6A00] animate-pulse" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 text-[#FF6A00] flex items-center gap-1.5">
                <Sparkles size={10} className="inline mr-0.5" />
                INDEPENDENT GROWTH ENGINE • HVAC SPECIALIZED
              </span>
              <span className="text-xs text-secondary">•</span>
              <span className="text-xs font-mono text-secondary">
                {totalLeads} Total Prospects Logged
              </span>
              <span className="text-xs text-secondary">•</span>
              <span className="text-xs font-mono text-emerald-500 font-bold">
                ${currentMrr.toLocaleString()} MRR Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
              Lead Gen Engine &amp; US HVAC Pipeline
            </h1>
            <p className="text-xs md:text-sm font-sans text-secondary mt-0.5 max-w-2xl">
              High-velocity B2B cold outreach, Google Maps local audits, and recurring agency fulfillment operations for Injaazh Global.
            </p>
          </div>
        </div>

        {/* Quick Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto relative z-10">
          {/* + New Prospect Laser Beam CTA */}
          <button 
            onClick={openNewLead}
            className="h-10 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
          >
            <span 
              className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none" 
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
              }}
            />
            <span 
              className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none" 
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
              }}
            />
            <div className="relative z-10 w-full h-full px-4 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
              <PlusCircle size={14} className="text-[#00E5FF] group-hover:rotate-90 transition-transform duration-300" />
              <span className="tracking-wide">
                + New Prospect
              </span>
            </div>
          </button>

          <button
            onClick={openImportModal}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2.5 text-xs font-heading font-bold text-emerald-600 dark:text-emerald-400 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Upload className="h-4 w-4" />
            <span>Import XLSX</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 px-3.5 py-2.5 text-xs font-heading font-bold text-slate-700 dark:text-slate-300 transition-all shadow-sm"
          >
            <Download className="h-4 w-4 text-[#00E5FF]" />
            <span>Export</span>
          </button>

          <button
            onClick={() => fetchState(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            title="Refresh Pipeline"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#6324FC]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs Bar (Smooth ERP Sub-Routes) */}
      <div className="p-1.5 rounded-2xl bg-white/70 dark:bg-[#0a0a0d]/80 backdrop-blur-xl border border-black/10 dark:border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-sm">
        {tabRoutes.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.id === 'dashboard'
              ? pathname === '/lead-gen' || pathname === '/lead-gen/dashboard'
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={true}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#6324FC] to-[#4F46E5] text-white shadow-md shadow-[#6324FC]/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 3. Sub-Page View Render with Smooth Native Transition */}
      <div className="min-w-0">
        {loading && !data ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
          </div>
        ) : (
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* 4. Global Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={closeLeadModal}
        onSave={handleSaveLead}
        onDelete={handleDeleteProspect}
        initialData={editingProspect}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onSuccess={() => fetchState(true)}
      />
    </div>
  );
}

export default function LeadGenLayout({ children }: { children: React.ReactNode }) {
  return (
    <LeadGenProvider>
      <LeadGenShell>{children}</LeadGenShell>
    </LeadGenProvider>
  );
}
