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
} from 'lucide-react';
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
    <div className="p-3 sm:p-5 lg:p-6 max-w-[1600px] mx-auto w-full space-y-4">
      {/* 1. Top Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 backdrop-blur-xl p-5 lg:p-6 shadow-sm transition-all duration-300">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-[#6324FC]/15 via-[#00E5FF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#6324FC]/20 bg-[#6324FC]/10 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF]">
              <Flame className="h-3.5 w-3.5 fill-current animate-pulse" />
              <span>Independent Growth Engine • HVAC Specialized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Lead Gen Engine &amp; US HVAC Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
              High-velocity B2B cold outreach, Google Maps local audits, and recurring agency fulfillment operations for Injaazh Global.
            </p>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={openNewLead}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6324FC]/25 transition-all transform active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ New Prospect</span>
            </button>

            <button
              onClick={openImportModal}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition-all"
            >
              <Upload className="h-4 w-4" />
              <span>Import XLSX</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all"
            >
              <Download className="h-4 w-4 text-[#00E5FF]" />
              <span>Export</span>
            </button>

            <button
              onClick={() => fetchState(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-all"
              title="Refresh Pipeline"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#6324FC]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Mini KPIs Bar */}
        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:gap-3">
          <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2.5 sm:p-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Retainer MRR</span>
            <p className="mt-0.5 text-lg lg:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ${currentMrr.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2.5 sm:p-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Retainers</span>
            <p className="mt-0.5 text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white">
              {activeClients.length} <span className="text-xs font-medium text-slate-400">Clients</span>
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2.5 sm:p-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pipeline Prospects</span>
            <p className="mt-0.5 text-lg lg:text-xl font-extrabold text-[#6324FC] dark:text-[#00E5FF]">
              {totalLeads}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2.5 sm:p-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Verified Contacts</span>
            <p className="mt-0.5 text-lg lg:text-xl font-extrabold text-indigo-500 dark:text-indigo-400">
              {verifiedLeads} <span className="text-xs font-medium text-slate-400">({totalLeads > 0 ? Math.round((verifiedLeads / totalLeads) * 100) : 0}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs Bar (Real Next.js Sub-Routes) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-black/5 dark:border-white/10">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#6324FC] to-[#4F46E5] text-white shadow-md shadow-[#6324FC]/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 3. Sub-Page View Render */}
      <div className="min-w-0 transition-opacity duration-300">
        {loading && !data ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
          </div>
        ) : (
          children
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
