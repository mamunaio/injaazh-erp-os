'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Mail,
  Users,
  CheckCircle2,
  PhoneCall,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  DollarSign,
  ChevronRight,
  Send,
  Calendar,
} from 'lucide-react';
import { DatabaseState, Prospect } from '@/types/leadGen';

interface DashboardViewProps {
  data: DatabaseState;
  onNavigateTab: (tab: string) => void;
  onSelectProspect: (prospect: Prospect) => void;
}

export default function DashboardView({
  data,
  onNavigateTab,
  onSelectProspect,
}: DashboardViewProps) {
  const { settings, prospects, dailyLogs, clients, invoices, expenses, deliveryCalendar } = data;

  // 10-Minute routine checklist state
  const [checkedRoutine, setCheckedRoutine] = useState<Record<number, boolean>>({});

  const toggleRoutine = (step: number) => {
    setCheckedRoutine((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  // KPIs
  const totalProspects = prospects.length;
  const verifiedEmails = prospects.filter((p) => p.emailVerified === 'Yes').length;
  const verifiedCount = verifiedEmails;
  const callsBooked = prospects.filter((p) => p.status === 'Call booked').length;
  const wonDeals = prospects.filter((p) => p.status === 'Won').length;
  const activeClients = clients.filter((c) => c.status === 'Active');

  const currentMrr = activeClients.reduce(
    (acc, c) => acc + (Number(c.monthlyRetainer) || 0),
    0
  );

  // Daily log aggregates
  const totalEmailsSent = dailyLogs.reduce((acc, d) => acc + (Number(d.emailsSent) || 0), 0);
  const totalBounces = dailyLogs.reduce((acc, d) => acc + (Number(d.bounced) || 0), 0);
  const totalReplies = dailyLogs.reduce((acc, d) => acc + (Number(d.replies) || 0), 0);
  const totalPositiveReplies = dailyLogs.reduce(
    (acc, d) => acc + (Number(d.positiveReplies) || 0),
    0
  );

  const bounceRate = totalEmailsSent > 0 ? (totalBounces / totalEmailsSent) * 100 : 0;
  const replyRate = totalEmailsSent > 0 ? (totalReplies / totalEmailsSent) * 100 : 0;
  const positiveRate = totalEmailsSent > 0 ? (totalPositiveReplies / totalEmailsSent) * 100 : 0;

  const maxBounce = (settings.maxBounceRate || 0.02) * 100;
  const minPositive = (settings.minPositiveReplyRate || 0.01) * 100;
  const isBounceUnsafe = bounceRate > maxBounce && totalEmailsSent >= 50;

  // 30-Day Email Pace
  const sendTargetLow = settings.targetColdEmails30DaysLow || 300;
  const sendTargetHigh = settings.targetColdEmails30DaysHigh || 500;
  const sendPacePercent = Math.min(100, Math.round((totalEmailsSent / sendTargetLow) * 100));

  // MRR Targets
  const targetM6 = settings.targetMrrMonth6 || 3000;
  const targetM12 = settings.targetMrrMonth12 || 6000;
  const mrrProgressM6 = Math.min(100, Math.round((currentMrr / targetM6) * 100));

  // Overdue and upcoming follow-ups
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentFollowUps = prospects
    .filter(
      (p) =>
        p.nextFollowUp &&
        p.nextFollowUp <= todayStr &&
        p.status !== 'Won' &&
        p.status !== 'Suppressed' &&
        p.status !== 'Lost'
    )
    .slice(0, 5);

  // Urgent Delivery calendar items
  const urgentDeliverables = deliveryCalendar
    .filter((d) => d.status === 'Overdue' || d.status === 'Due soon')
    .slice(0, 4);

  // Financial totals
  const totalInvoiced = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalCollected = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netProfit = totalCollected - totalExpenses;

  return (
    <div className="space-y-7 pb-12">
      {/* Top Welcome & Safety Warning */}
      {isBounceUnsafe && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-rose-600 dark:text-rose-300 shadow-xl shadow-rose-950/20 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#F43F5E]" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6 text-rose-500 dark:text-rose-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-rose-700 dark:text-rose-200">
                  Outreach Alert: Bounce Rate Exceeds Safety Ceiling ({bounceRate.toFixed(1)}% &gt; {maxBounce}%)
                </h4>
                <p className="text-xs sm:text-sm text-rose-600/90 dark:text-rose-300/90 mt-0.5">
                  Pause sending immediately as per SOP guide rules and re-verify your contact list using BounceZero or NeverBounce.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('daily-log')}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-heading font-bold text-white transition shadow-lg shrink-0"
            >
              Review Daily Log
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Cards Grid (Matching Dashboard Style) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: MRR Card */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[185px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
        >
          {/* Radial Hover Spotlight */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          {/* Top Accent Neon Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
          {/* Subtle Card Glass Sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-emerald-500 transition-all duration-300 shadow-sm">
              <DollarSign size={21} />
            </div>
            <span className="text-xs font-heading font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> {activeClients.length} Active
            </span>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Monthly Retainer MRR</p>
            <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-emerald-500 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-emerald-400 transition-all">
              ${currentMrr.toLocaleString()}
            </p>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-secondary">
                <span>Month 6 Goal (${targetM6.toLocaleString()})</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{mrrProgressM6}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-[0_0_8px_#10B981]"
                  style={{ width: `${mrrProgressM6}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Prospects Card */}
        <div
          onClick={() => onNavigateTab('prospects')}
          className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[185px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
        >
          {/* Radial Hover Spotlight */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          {/* Top Accent Neon Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
          {/* Subtle Card Glass Sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300 shadow-sm">
              <Users size={21} />
            </div>
            <span className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] flex items-center gap-1 bg-[#6324FC]/10 px-2.5 py-1 rounded-lg border border-[#6324FC]/20 group-hover:border-[#6324FC]/40 transition-colors">
              {totalProspects > 0 ? Math.round((verifiedCount / totalProspects) * 100) : 0}% Verified
            </span>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Total Pipeline Prospects</p>
            <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
              {totalProspects}
            </p>

            <div className="mt-4 flex items-center justify-between text-xs font-sans text-secondary pt-2 border-t border-black/5 dark:border-white/5">
              <span>{verifiedCount} Verified Contacts</span>
              <span className="text-[#6324FC] dark:text-[#00E5FF] font-bold flex items-center group-hover:underline">
                View Pipeline <ArrowUpRight size={13} className="ml-1" />
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Cold Emails Sent Card */}
        <div
          onClick={() => onNavigateTab('daily-log')}
          className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[185px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
        >
          {/* Radial Hover Spotlight */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          {/* Top Accent Neon Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
          {/* Subtle Card Glass Sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
              <Send size={20} />
            </div>
            <span className="text-xs font-heading font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
              Pace: {sendPacePercent}%
            </span>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">30-Day Cold Emails Sent</p>
            <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#00E5FF] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
              {totalEmailsSent}
            </p>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-secondary">
                <span>Target: {sendTargetLow} - {sendTargetHigh}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{sendPacePercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500 shadow-[0_0_8px_#00E5FF]"
                  style={{ width: `${sendPacePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Won & Calls Booked Card */}
        <div
          onClick={() => onNavigateTab('prospects')}
          className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[185px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/60 hover:shadow-[0_16px_36px_rgba(245,158,11,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
        >
          {/* Radial Hover Spotlight */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          {/* Top Accent Neon Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
          {/* Subtle Card Glass Sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] group-hover:border-amber-500 transition-all duration-300 shadow-sm">
              <Award size={21} />
            </div>
            <span className="text-xs font-heading font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
              {positiveRate.toFixed(1)}% Positive
            </span>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Deals Won &amp; Strategy Calls</p>
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="text-2xl lg:text-3xl font-heading font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                {wonDeals} <span className="text-xs font-heading font-bold text-secondary uppercase">Won</span>
              </span>
              <span className="text-secondary/40 font-mono text-xl">/</span>
              <span className="text-2xl lg:text-3xl font-heading font-extrabold text-amber-500 dark:text-amber-300 font-mono tracking-tight">
                {callsBooked} <span className="text-xs font-heading font-bold text-secondary uppercase">Calls</span>
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-sans text-secondary pt-2 border-t border-black/5 dark:border-white/5">
              <span>Target &ge; {minPositive}%</span>
              <span className="text-amber-500 font-bold flex items-center group-hover:underline">
                Outreach Log <ChevronRight size={13} className="ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel & Daily SOP Checklist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cold Outreach Funnel */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] p-6 lg:p-8 lg:col-span-2 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent shadow-[0_0_12px_#6324FC]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#6324FC]/10 blur-[45px] rounded-full pointer-events-none" />

          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4 relative z-10">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">Outreach Conversion Funnel</h3>
              <p className="text-xs text-secondary mt-0.5 font-sans">
                Cold Emails Sent &rarr; Replies &rarr; Positive Replies &rarr; Calls Booked &rarr; Won Retainers
              </p>
            </div>
            <span className="rounded-full bg-[#6324FC]/10 px-3 py-1 text-xs font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/25">
              Live Funnel
            </span>
          </div>

          <div className="mt-6 space-y-5 relative z-10">
            {/* Step 1: Emails Sent */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-heading font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-cyan-500" />
                  1. Cold Emails Sent
                </span>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white">{totalEmailsSent}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] w-full shadow-[0_0_8px_#00E5FF]" />
              </div>
            </div>

            {/* Step 2: Total Replies */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-heading font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-indigo-500" />
                  2. Total Replies Received
                </span>
                <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-300">
                  {totalReplies} ({replyRate.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500 shadow-[0_0_8px_#6366F1]"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(6, (totalReplies / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 3: Positive Replies */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-heading font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-teal-500" />
                  3. Positive Interested Replies
                </span>
                <span className="font-extrabold font-mono text-teal-600 dark:text-teal-300">
                  {totalPositiveReplies} ({positiveRate.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-500 shadow-[0_0_8px_#14B8A6]"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(5, (totalPositiveReplies / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 4: Calls Booked */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-heading font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <PhoneCall className="h-4 w-4 mr-2 text-amber-500" />
                  4. Strategy Calls Booked
                </span>
                <span className="font-extrabold font-mono text-amber-600 dark:text-amber-300">{callsBooked}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500 shadow-[0_0_8px_#F59E0B]"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(4, (callsBooked / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 5: Deals Won */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-heading font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-emerald-500" />
                  5. Retainers Closed (Won Deals)
                </span>
                <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-300">
                  {wonDeals} Clients (${currentMrr.toLocaleString()} MRR)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500 shadow-[0_0_8px_#10B981]"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(3, (wonDeals / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Rates Indicator Footer */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-black/5 dark:border-white/10 pt-5 text-center relative z-10">
            <div className="rounded-2xl bg-slate-50 dark:bg-[#11131a] p-3.5 border border-black/5 dark:border-white/5 shadow-sm">
              <span className="text-xs text-secondary font-medium font-sans">Bounce Rate</span>
              <p
                className={`text-xl font-mono font-extrabold mt-1 ${
                  bounceRate <= maxBounce ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {bounceRate.toFixed(1)}%
              </p>
              <span className="text-[11px] font-mono text-secondary">Ceiling: &le; {maxBounce}%</span>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-[#11131a] p-3.5 border border-black/5 dark:border-white/5 shadow-sm">
              <span className="text-xs text-secondary font-medium font-sans">Total Reply Rate</span>
              <p className="text-xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {replyRate.toFixed(1)}%
              </p>
              <span className="text-[11px] font-mono text-secondary">{totalReplies} total replies</span>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-[#11131a] p-3.5 border border-black/5 dark:border-white/5 shadow-sm">
              <span className="text-xs text-secondary font-medium font-sans">Positive Reply Rate</span>
              <p className="text-xl font-mono font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                {positiveRate.toFixed(1)}%
              </p>
              <span className="text-[11px] font-mono text-secondary">Target: &ge; {minPositive}%</span>
            </div>
          </div>
        </div>

        {/* 10-Minute Daily Routine Checklist */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] p-6 lg:p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_12px_#00E5FF]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#00E5FF]/10 blur-[45px] rounded-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4 relative z-10">
              <div className="flex items-center space-x-2.5">
                <Clock className="h-5 w-5 text-[#00E5FF]" />
                <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">Daily 10-Min SOP</h3>
              </div>
              <span className="rounded-full bg-[#00E5FF]/10 px-2.5 py-0.5 text-xs font-mono font-bold text-[#00E5FF] border border-[#00E5FF]/25">
                Routine
              </span>
            </div>

            <p className="text-xs text-secondary mt-2.5 font-sans relative z-10">
              Execute this checklist every morning to keep your HVAC pipeline clean:
            </p>

            <div className="mt-4 space-y-2.5 relative z-10">
              {[
                {
                  id: 1,
                  title: 'Log Today’s Outreach Stats',
                  desc: 'Record sent volume, bounces, replies, and strategy calls in Daily Log.',
                  tab: 'daily-log',
                },
                {
                  id: 2,
                  title: 'Tag New Prospect Replies',
                  desc: 'Update reply status. If lead asked to unsubscribe, mark Suppressed immediately.',
                  tab: 'prospects',
                },
                {
                  id: 3,
                  title: 'Log Team Hours',
                  desc: 'Track fulfilling team member hours to protect client hourly yields.',
                  tab: 'time-log',
                },
                {
                  id: 4,
                  title: 'Check Red/Yellow Alert Rows',
                  desc: 'Review overdue tasks in Team Tasks and Delivery Calendar.',
                  tab: 'calendar',
                },
                {
                  id: 5,
                  title: 'Friday Executive Review',
                  desc: 'Review weekly progress towards month 6 ($3k) & month 12 ($6k) targets.',
                  tab: 'dashboard',
                },
              ].map((step) => {
                const isChecked = Boolean(checkedRoutine[step.id]);
                return (
                  <div
                    key={step.id}
                    onClick={() => toggleRoutine(step.id)}
                    className={`flex items-start space-x-3 rounded-2xl p-3 cursor-pointer border transition-all ${
                      isChecked
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-secondary line-through'
                        : 'border-black/5 dark:border-white/5 bg-slate-50/80 dark:bg-[#11131a] hover:bg-[#6324FC]/5 hover:border-[#6324FC]/25 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <CheckCircle2
                        className={`h-4 w-4 ${isChecked ? 'text-emerald-500' : 'text-secondary/60'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-heading font-bold ${isChecked ? 'text-secondary' : 'text-slate-900 dark:text-white'}`}>
                        {step.id}. {step.title}
                      </p>
                      <p className="text-[11px] text-secondary mt-0.5 line-clamp-1">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 text-[11px] font-sans text-secondary text-center relative z-10">
            Click any routine item to record completed status.
          </div>
        </div>
      </div>

      {/* Urgent Attention Center (Follow-ups & Deliverables) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Urgent Follow-ups */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] p-6 lg:p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_12px_#F59E0B]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 blur-[45px] rounded-full pointer-events-none" />

          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4 relative z-10">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">Follow-ups Due &amp; Overdue</h3>
            </div>
            <button
              onClick={() => onNavigateTab('prospects')}
              className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center"
            >
              All Prospects <ChevronRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          {urgentFollowUps.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary relative z-10">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500/80 mb-2.5" />
              No overdue follow-ups! Everything is on schedule.
            </div>
          ) : (
            <div className="mt-4 space-y-2.5 relative z-10">
              {urgentFollowUps.map((p) => {
                const isOverdue = p.nextFollowUp && p.nextFollowUp < todayStr;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProspect(p);
                      onNavigateTab('prospects');
                    }}
                    className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/80 dark:bg-[#11131a] p-3.5 hover:border-[#6324FC]/30 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">{p.company}</span>
                        <span className="rounded-lg bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[11px] text-secondary font-mono">
                          {p.city}, {p.state}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-1 truncate max-w-sm">
                        {p.gap || p.businessEmail}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-heading font-bold ${
                          isOverdue
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : 'Due Today'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-secondary" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deliverables Calendar Snapshot */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] p-6 lg:p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent shadow-[0_0_12px_#6324FC]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#6324FC]/10 blur-[45px] rounded-full pointer-events-none" />

          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4 relative z-10">
            <div className="flex items-center space-x-2.5">
              <Calendar className="h-5 w-5 text-[#6324FC] dark:text-[#00E5FF]" />
              <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">Upcoming Client Deliverables</h3>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center"
            >
              Full Calendar <ChevronRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          {urgentDeliverables.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary relative z-10">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500/80 mb-2.5" />
              All client recurring deliverables are up to date!
            </div>
          ) : (
            <div className="mt-4 space-y-2.5 relative z-10">
              {urgentDeliverables.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/80 dark:bg-[#11131a] p-3.5 hover:border-[#6324FC]/30 transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">{item.client}</span>
                      <span className="text-xs text-[#6324FC] dark:text-[#00E5FF] font-mono">({item.frequency})</span>
                    </div>
                    <p className="text-xs text-secondary mt-1">{item.task}</p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-heading font-bold ${
                      item.status === 'Overdue'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.status} ({item.nextDue})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financial Health Snapshot Banner */}
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-slate-950 via-[#0b0e17] to-slate-950 p-6 lg:p-8 shadow-xl text-white relative overflow-hidden">
        {/* Top Neon Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10B981]" />
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 blur-[45px] rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-xs font-heading font-extrabold text-[#00E5FF] uppercase tracking-wider">
              Financial Overview &bull; Monthly PnL
            </span>
            <h4 className="text-xl sm:text-2xl font-heading font-extrabold text-white mt-1">
              Collected Revenue: ${totalCollected.toLocaleString()} &bull; Net Profit:{' '}
              <span className={netProfit >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                ${netProfit.toLocaleString()}
              </span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
              Total Invoiced: ${totalInvoiced.toLocaleString()} | Total Operating Expenses: ${totalExpenses.toLocaleString()}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('financials')}
            className="flex items-center space-x-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3 text-xs font-heading font-bold text-white transition self-start sm:self-auto shadow-lg"
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Manage Invoices &amp; PnL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
