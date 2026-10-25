'use client';

import React, { useState, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Server,
  ShieldCheck,
  Flame,
  TrendingUp,
  Mail,
  DollarSign,
  Clock,
  Building2,
  AlertTriangle,
  Sparkles,
  Layers,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
  HardDrive,
  Target,
  FileText,
  Search,
  Users,
  CheckSquare,
  Square,
  Calendar,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemSettings, DatabaseState } from '@/types/leadGen';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

interface SettingsViewProps {
  settings: SystemSettings;
  data?: DatabaseState;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  onExportExcel: () => void;
  onResetDatabase: () => Promise<void>;
}

type SubTab = 'assumptions' | 'database' | 'guide';

export default function SettingsView({
  settings,
  data,
  onUpdateSettings,
  onExportExcel,
  onResetDatabase,
}: SettingsViewProps) {
  const { confirm } = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('assumptions');

  // Form states
  const [agencyName, setAgencyName] = useState(settings.agencyName || 'Injaazh US HVAC Growth');
  const [niche, setNiche] = useState(settings.niche || 'US HVAC Contractors & Services');
  const [maxBounceRate, setMaxBounceRate] = useState((settings.maxBounceRate || 0.02) * 100);
  const [minPositiveReplyRate, setMinPositiveReplyRate] = useState(
    (settings.minPositiveReplyRate || 0.01) * 100
  );
  const [target30DaysLow, setTarget30DaysLow] = useState(settings.targetColdEmails30DaysLow || 300);
  const [target30DaysHigh, setTarget30DaysHigh] = useState(settings.targetColdEmails30DaysHigh || 500);
  const [targetMrrMonth6, setTargetMrrMonth6] = useState(settings.targetMrrMonth6 || 3000);
  const [targetMrrMonth12, setTargetMrrMonth12] = useState(settings.targetMrrMonth12 || 6000);
  const [hourlyFloorRate, setHourlyFloorRate] = useState(settings.hourlyFloorRate || 25);
  const [reportMonth, setReportMonth] = useState(settings.reportMonth || '2026-10');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // SOP Guide Interactive Checklist State
  const [completedDailyTasks, setCompletedDailyTasks] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });
  const [sopFilter, setSopFilter] = useState<'ALL' | 'ROUTINE' | 'COMPLIANCE' | 'DELIVERABILITY'>('ALL');
  const [sopSearch, setSopSearch] = useState('');

  const isMongoConnected = Boolean(settings.mongoConnected);

  // Real-time Database Telemetry Stats
  const prospectsCount = data?.prospects.length ?? 0;
  const dailyLogsCount = data?.dailyLogs.length ?? 0;
  const clientsCount = data?.clients.length ?? 0;
  const timeLogsCount = data?.timeLogs.length ?? 0;
  const teamTasksCount = data?.teamTasks.length ?? 0;
  const deliveryCalendarCount = data?.deliveryCalendar.length ?? 0;
  const invoicesCount = data?.invoices.length ?? 0;
  const expensesCount = data?.expenses.length ?? 0;

  const totalRecords =
    prospectsCount +
    dailyLogsCount +
    clientsCount +
    timeLogsCount +
    teamTasksCount +
    deliveryCalendarCount +
    invoicesCount +
    expensesCount;

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSettings({
        agencyName,
        niche,
        maxBounceRate: maxBounceRate / 100,
        minPositiveReplyRate: minPositiveReplyRate / 100,
        targetColdEmails30DaysLow: Number(target30DaysLow),
        targetColdEmails30DaysHigh: Number(target30DaysHigh),
        targetMrrMonth6: Number(targetMrrMonth6),
        targetMrrMonth12: Number(targetMrrMonth12),
        hourlyFloorRate: Number(hourlyFloorRate),
        reportMonth,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Reset Database to Seed Template
  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset Database to Seed Template',
      message:
        'Are you sure you want to restore the initial seed dataset? All current custom prospects, logs, invoices, and task entries will be replaced with clean demo records.',
      confirmText: 'Yes, Reset Database',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      setResetting(true);
      try {
        await onResetDatabase();
      } finally {
        setResetting(false);
      }
    }
  };

  const copyMongoSnippet = () => {
    const snippet = `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/hvac_leadgen?retryWrites=true&w=majority`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const toggleDailyTask = (index: number) => {
    setCompletedDailyTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const dailyRoutineSteps = [
    {
      title: '1. Log Daily Outreach Volume',
      desc: 'Record emails sent, bounce count, and total replies in Daily Outreach.',
      tag: 'Morning Ritual',
    },
    {
      title: '2. Tag & Qualify Prospect Replies',
      desc: 'Review inbox responses. If an unsubscribe request is received, immediately flag as Suppressed.',
      tag: 'Prospects',
    },
    {
      title: '3. Record Team Fulfillment Time Log',
      desc: 'Log hours worked per client/account to calculate accurate real-time hourly yields.',
      tag: 'Time Tracking',
    },
    {
      title: '4. Check Overdue Tasks & Deliverables',
      desc: 'Address any yellow or red alert deadlines on Team Tasks & Delivery Calendar.',
      tag: 'Milestones',
    },
    {
      title: '5. Weekly MRR & Profit Review',
      desc: 'Every Friday, cross-check Financials (Invoices vs Tool OPEX) against monthly revenue targets.',
      tag: 'Financials',
    },
  ];

  const dailyProgressCount = Object.values(completedDailyTasks).filter(Boolean).length;

  return (
    <div className="space-y-4 pb-8 font-sans">
      {/* 1. Top 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Storage Engine Status */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Storage Engine</span>
          <div className="flex items-center justify-center space-x-1.5 mt-0.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isMongoConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono truncate">
              {isMongoConnected ? 'MongoDB' : 'Local JSON'}
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono truncate block">
            {isMongoConnected ? 'Atlas Cluster Live' : 'src/data/db.json'}
          </span>
        </div>

        {/* Total Records in Database */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Database Records</span>
          <p className="text-xl font-black text-[#6324FC] dark:text-[#00E5FF] mt-0.5 font-mono">
            {totalRecords}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {prospectsCount} Leads, {clientsCount} Clients
          </span>
        </div>

        {/* Target MRR Month 6 */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Month 6 Target</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            ${targetMrrMonth6.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            Mo 12: ${targetMrrMonth12.toLocaleString()}
          </span>
        </div>

        {/* Bounce Ceiling */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Bounce Ceiling</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
            {maxBounceRate.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Max Safe Threshold</span>
        </div>

        {/* Min Positive Reply Rate */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Min Reply Benchmark</span>
          <p className="text-xl font-black text-amber-500 dark:text-amber-400 mt-0.5 font-mono">
            {minPositiveReplyRate.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Positive Interest Floor</span>
        </div>

        {/* Hourly Yield Floor */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-2.5 sm:p-3 text-center shadow-sm backdrop-blur-xl">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Hourly Yield Floor</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            ${hourlyFloorRate}/hr
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Min Client Efficiency</span>
        </div>
      </div>

      {/* 2. Sub-Tab Controller & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-2">
        {/* Animated Sub Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab('assumptions')}
            className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'assumptions'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {activeSubTab === 'assumptions' && (
              <motion.span
                layoutId="settingsSubTabPill"
                className="absolute inset-0 bg-gradient-to-r from-[#6324FC] to-[#4F46E5] rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-2">
              <Target size={15} />
              <span>Agency Benchmarks &amp; Targets</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('database')}
            className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'database'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {activeSubTab === 'database' && (
              <motion.span
                layoutId="settingsSubTabPill"
                className="absolute inset-0 bg-gradient-to-r from-[#6324FC] to-[#4F46E5] rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-2">
              <Database size={15} />
              <span>MongoDB Atlas &amp; Storage Hub</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('guide')}
            className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'guide'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {activeSubTab === 'guide' && (
              <motion.span
                layoutId="settingsSubTabPill"
                className="absolute inset-0 bg-gradient-to-r from-[#6324FC] to-[#4F46E5] rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-2">
              <BookOpen size={15} />
              <span>SOP Operating Guide &amp; Compliance</span>
            </span>
          </button>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition shadow-sm active:scale-95"
            title="Download full workbook backup with all sheets"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel Backup</span>
            <span className="sm:hidden">Backup</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition shadow-sm active:scale-95 disabled:opacity-50"
            title="Restore seed data template"
          >
            <RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{resetting ? 'Resetting...' : 'Reset to Template'}</span>
            <span className="sm:hidden">{resetting ? '...' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* 3. SUBTAB CONTENT */}

      {/* SUBTAB 1: Agency Benchmarks & Targets (Assumptions) */}
      {activeSubTab === 'assumptions' && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm space-y-6">
            {/* Section A: Brand & Niche */}
            <div>
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                <Building2 className="h-5 w-5 text-[#6324FC] dark:text-[#00E5FF]" />
                <h3>Agency Brand Identity &amp; Niche Positioning</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                These core settings define the agency brand header, report title, and target market categorization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Agency Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition shadow-inner font-medium"
                    placeholder="e.g. Injaazh US HVAC Growth"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Business Niche
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition shadow-inner font-medium"
                    placeholder="e.g. US HVAC Contractors & Services"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Active Financial Reporting Month
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/60 focus:border-[#6324FC] focus:outline-none transition shadow-inner font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Deliverability & Conversion Benchmarks */}
            <div className="pt-5 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base mb-1">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3>Deliverability Safeguards &amp; Conversion Benchmarks</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These thresholds directly govern alert banners in Daily Outreach and warning badges in Clients table.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Max Bounce Ceiling */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Max Bounce Ceiling (%)
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                    Safe: &le; 2.0%
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={maxBounceRate}
                  onChange={(e) => setMaxBounceRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono font-bold focus:border-[#6324FC] focus:outline-none transition"
                />
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  {[1.0, 1.5, 2.0, 2.5].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMaxBounceRate(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition ${
                        maxBounceRate === preset
                          ? 'border-[#6324FC] bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Positive Reply Rate */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Min Reply Benchmark (%)
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                    Standard: &ge; 1.0%
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="15"
                  value={minPositiveReplyRate}
                  onChange={(e) => setMinPositiveReplyRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono font-bold focus:border-[#6324FC] focus:outline-none transition"
                />
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  {[0.5, 1.0, 1.5, 2.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMinPositiveReplyRate(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition ${
                        minPositiveReplyRate === preset
                          ? 'border-[#6324FC] bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Hourly Yield Floor Rate */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Hourly Yield Floor ($/hr)
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    Threshold Alert
                  </span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={hourlyFloorRate}
                    onChange={(e) => setHourlyFloorRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono font-bold focus:border-[#6324FC] focus:outline-none transition"
                  />
                </div>
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  {[20, 25, 35, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHourlyFloorRate(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition ${
                        hourlyFloorRate === preset
                          ? 'border-[#6324FC] bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C: Growth Targets */}
            <div className="pt-5 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base mb-1">
                <TrendingUp className="h-5 w-5 text-[#6324FC] dark:text-[#00E5FF]" />
                <h3>Agency Growth Milestones &amp; Revenue Targets</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track progress against your 30-day initial ramp target and 6/12-month MRR horizons on the Executive Dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Cold Email 30 Days Target */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 p-4 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Initial 30-Day Email Target
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Min Target (Low)</span>
                    <input
                      type="number"
                      value={target30DaysLow}
                      onChange={(e) => setTarget30DaysLow(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-[#6324FC] focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Optimistic (High)</span>
                    <input
                      type="number"
                      value={target30DaysHigh}
                      onChange={(e) => setTarget30DaysHigh(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-[#6324FC] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Month 6 MRR */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 p-4 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Month 6 Target MRR ($/mo)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    step="250"
                    value={targetMrrMonth6}
                    onChange={(e) => setTargetMrrMonth6(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono font-bold focus:border-[#6324FC] focus:outline-none transition"
                  />
                </div>
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  {[2000, 3000, 4000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetMrrMonth6(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition ${
                        targetMrrMonth6 === preset
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      ${preset / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Month 12 MRR */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-black/20 p-4 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Month 12 Target MRR ($/mo)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    step="500"
                    value={targetMrrMonth12}
                    onChange={(e) => setTargetMrrMonth12(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono font-bold focus:border-[#6324FC] focus:outline-none transition"
                  />
                </div>
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  {[5000, 6000, 8000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetMrrMonth12(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition ${
                        targetMrrMonth12 === preset
                          ? 'border-[#6324FC] bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      ${preset / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions & Success Notification */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-black/5 dark:border-white/10">
              <div>
                <AnimatePresence>
                  {savedSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Settings &amp; benchmarks saved successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#6324FC]/25 transition active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span>{saving ? 'Saving Changes...' : 'Save Settings & Benchmarks'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 2: MongoDB Atlas & Storage Hub */}
      {activeSubTab === 'database' && (
        <div className="space-y-4">
          {/* Main Status & Architecture Card */}
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`rounded-2xl p-3 border ${
                    isMongoConnected
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Storage Engine:
                    </h3>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        isMongoConnected
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isMongoConnected ? '● MongoDB Atlas Connected' : '● Local JSON Storage Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isMongoConnected
                      ? 'All changes synchronize live to your MongoDB Atlas cloud database cluster.'
                      : 'Currently persisting changes locally to src/data/db.json. Connect MongoDB anytime for cloud sync.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onExportExcel}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <Download size={15} />
                <span>Export Complete Excel Backup</span>
              </button>
            </div>

            {/* Collection Records Breakdown Grid */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <Layers className="h-4 w-4 text-[#6324FC] dark:text-[#00E5FF]" />
                <span>Collections Telemetry &amp; Document Count</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Prospects</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{prospectsCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">B2B Leads</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Daily Logs</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{dailyLogsCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Outreach Days</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Client Retainers</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{clientsCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Accounts</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Time Logs</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{timeLogsCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Work Sessions</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Team Tasks</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{teamTasksCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Action Items</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Delivery SOPs</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{deliveryCalendarCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Milestones</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Invoices</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{invoicesCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Billings</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">OPEX Expenses</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{expensesCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Cost Logs</span>
                </div>
              </div>
            </div>

            {/* MongoDB Atlas Configuration Helper */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  <span>How to Connect MongoDB Atlas (Zero Downtime)</span>
                </h4>

                <button
                  type="button"
                  onClick={copyMongoSnippet}
                  className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  {copiedSnippet ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-slate-400" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
                <li>
                  Open your <code className="text-[#6324FC] dark:text-cyan-300 bg-slate-200/80 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> file in the project root directory.
                </li>
                <li>
                  Add your connection string:
                  <pre className="mt-2 p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                    MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/hvac_leadgen?retryWrites=true&amp;w=majority
                  </pre>
                </li>
                <li>
                  Restart the Next.js dev server or refresh the browser. The system will detect MongoDB Atlas and automatically activate cloud persistence.
                </li>
              </ol>
            </div>

            {/* Danger Zone: Reset Database */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="h-5 w-5" />
                <h4>Danger Zone: Reset Database to Template</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Resetting will replace all modified records in MongoDB / local JSON with the pristine Excel template seed data (default demo HVAC leads, sample daily logs, clients, and retainers). Use this when testing demo workflows or restoring initial benchmarks.
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex items-center space-x-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
                  <span>{resetting ? 'Resetting Database...' : 'Confirm Reset to Template Seed'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Operating SOP Guide & Compliance Hub */}
      {activeSubTab === 'guide' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-7 backdrop-blur-xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-[#6324FC] dark:text-[#00E5FF]" />
                  <span>Injaazh US HVAC Business Tracker: Standard Operating Procedures</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Routine operating protocol, deliverability rules, and CAN-SPAM legal compliance safeguards.
                </p>
              </div>

              {/* Progress counter for daily ritual */}
              <div className="flex items-center space-x-2 bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 border border-[#6324FC]/20 px-3.5 py-1.5 rounded-xl">
                <span className="text-xs text-[#6324FC] dark:text-[#00E5FF] font-bold">
                  Daily Routine Progress:
                </span>
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                  {dailyProgressCount} of {dailyRoutineSteps.length} Completed
                </span>
              </div>
            </div>

            {/* Daily 10-Minute Outreach Routine (Interactive Checklist) */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#6324FC] dark:text-[#00E5FF] text-sm flex items-center space-x-2">
                    <Clock size={16} />
                    <span>Daily 10-Minute Agency Execution Checklist</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click steps below as you complete them during your daily morning pipeline review.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-slate-500">
                  {Math.round((dailyProgressCount / dailyRoutineSteps.length) * 100)}% Done
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] transition-all duration-300"
                  style={{ width: `${(dailyProgressCount / dailyRoutineSteps.length) * 100}%` }}
                />
              </div>

              <div className="space-y-2.5 pt-1">
                {dailyRoutineSteps.map((step, idx) => {
                  const isChecked = Boolean(completedDailyTasks[idx]);
                  return (
                    <div
                      key={step.title}
                      onClick={() => toggleDailyTask(idx)}
                      className={`flex items-start space-x-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isChecked
                          ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
                          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 hover:border-[#6324FC]/40'
                      }`}
                    >
                      <button type="button" className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                        {isChecked ? (
                          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square size={18} className="text-slate-400 hover:text-slate-600" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isChecked
                                ? 'text-slate-900 dark:text-white line-through opacity-70'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {step.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-500 font-semibold">
                            {step.tag}
                          </span>
                        </div>
                        <p
                          className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${
                            isChecked ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compliance, Deliverability & Operational Standards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Deliverability & CAN-SPAM Compliance */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-5 space-y-3.5">
                <h4 className="font-bold text-amber-600 dark:text-amber-400 text-sm flex items-center space-x-2">
                  <ShieldCheck size={16} />
                  <span>Deliverability &amp; CAN-SPAM Compliance Rules</span>
                </h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">B2B Corporate Domains Only:</strong> Always verify recipient emails via MillionVerifier or NeverBounce before launching campaigns. Never send cold outreach to consumer (@gmail.com, @yahoo.com) accounts.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Strict 2.0% Bounce Ceiling:</strong> If your bounce rate exceeds 2.0% in any 24-hour window, instantly pause sequences and clean data batches to protect sender domain reputation.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Instant Unsubscribe Suppression:</strong> Any lead requesting removal (&quot;unsubscribe&quot;, &quot;not interested&quot;, &quot;remove me&quot;) must be assigned the <strong>Suppressed</strong> stage within 24 hours.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">DNS Authentication:</strong> Ensure all sending domains have fully aligned SPF, DKIM, and DMARC (p=none or p=quarantine) records configured prior to warmup.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Client Operations & Retainer Governance */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-5 space-y-3.5">
                <h4 className="font-bold text-[#6324FC] dark:text-[#00E5FF] text-sm flex items-center space-x-2">
                  <Building2 size={16} />
                  <span>Client Account Management &amp; Retainer SOP</span>
                </h4>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="text-[#6324FC] dark:text-[#00E5FF] font-bold">★</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Net-15 Invoicing Terms:</strong> Generate invoices on the 1st of each month with standard Net-15 due dates. Mark Paid as soon as wire or Stripe payout settles.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#6324FC] dark:text-[#00E5FF] font-bold">★</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Hourly Yield Vigilance:</strong> If a client account&apos;s realized hourly yield drops below ${hourlyFloorRate}/hr, review scope creep or automate lead scraping fulfillment.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#6324FC] dark:text-[#00E5FF] font-bold">★</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Consistent Account Naming:</strong> Maintain identical spelling for client company names across Clients, Time Log, and Financial Invoices to ensure automated calculation integrity.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#6324FC] dark:text-[#00E5FF] font-bold">★</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Monthly Delivery Milestones:</strong> Track client SOP deliverables in the Delivery Calendar to ensure 100% on-time handover before invoice renewals.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
