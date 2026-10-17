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
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-rose-600 dark:text-rose-300 shadow-xl shadow-rose-950/20 backdrop-blur-md">
          <div className="flex items-center space-x-3.5">
            <ShieldAlert className="h-7 w-7 text-rose-500 dark:text-rose-400 shrink-0 animate-pulse" />
            <div>
              <h4 className="font-bold text-base text-rose-700 dark:text-rose-200">
                Outreach Alert: Bounce Rate Exceeds Safety Ceiling ({bounceRate.toFixed(1)}% &gt; {maxBounce}%)
              </h4>
              <p className="text-sm text-rose-600/90 dark:text-rose-300/90 mt-0.5">
                Pause sending immediately as per SOP guide rules and re-verify your contact list using BounceZero or NeverBounce.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('daily-log')}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition shadow"
          >
            Review Daily Log
          </button>
        </div>
      )}

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* MRR Card */}
        <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 shadow-sm hover:shadow-md transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Monthly Retainer MRR</span>
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2.5">
            <span className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              ${currentMrr.toLocaleString()}
            </span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
              {activeClients.length} Active
            </span>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Month 6 Goal (${targetM6.toLocaleString()})</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{mrrProgressM6}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${mrrProgressM6}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Prospects Card */}
        <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 shadow-sm hover:shadow-md transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Prospects in Pipeline</span>
            <span className="rounded-xl bg-[#6324FC]/10 p-2.5 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2.5">
            <span className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {totalProspects}
            </span>
            <span className="text-sm text-[#6324FC] dark:text-[#00E5FF] font-bold">
              {verifiedCount} Verified ({totalProspects > 0 ? Math.round((verifiedCount / totalProspects) * 100) : 0}%)
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            <span>HVAC B2B List</span>
            <button
              onClick={() => onNavigateTab('prospects')}
              className="text-[#6324FC] dark:text-[#00E5FF] font-bold hover:underline flex items-center text-xs"
            >
              View Pipeline <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>
        </div>

        {/* Cold Emails Sent Card */}
        <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 shadow-sm hover:shadow-md transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">30-Day Cold Emails Sent</span>
            <span className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              <Send className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2.5">
            <span className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {totalEmailsSent}
            </span>
            <span className="text-sm text-indigo-500 dark:text-indigo-400 font-bold">
              Target: {sendTargetLow} - {sendTargetHigh}
            </span>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Send Pace Progress</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{sendPacePercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${sendPacePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Won & Calls Booked Card */}
        <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 shadow-sm hover:shadow-md transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Calls Booked &amp; Deals Won</span>
            <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-4">
            <div>
              <span className="text-3xl lg:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {wonDeals}
              </span>
              <span className="ml-1.5 text-sm text-slate-500 dark:text-slate-400 font-bold">Won</span>
            </div>
            <span className="text-slate-400 dark:text-slate-600 text-2xl font-light">/</span>
            <div>
              <span className="text-3xl font-black text-amber-500 dark:text-amber-300">{callsBooked}</span>
              <span className="ml-1.5 text-sm text-slate-500 dark:text-slate-400 font-bold">Calls</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Positive: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{positiveRate.toFixed(1)}%</strong>
            </span>
            <span>Target &ge; {minPositive}%</span>
          </div>
        </div>
      </div>

      {/* Funnel & Daily SOP Checklist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cold Outreach Funnel */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 lg:col-span-2 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Outreach Conversion Funnel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cold Emails Sent &rarr; Replies &rarr; Positive Replies &rarr; Calls Booked &rarr; Won Retainers
              </p>
            </div>
            <span className="rounded-full bg-[#6324FC]/10 dark:bg-[#6324FC]/20 px-3 py-1 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20">
              Live Funnel
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {/* Step 1: Emails Sent */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-cyan-500" />
                  1. Cold Emails Sent
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">{totalEmailsSent}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] w-full" />
              </div>
            </div>

            {/* Step 2: Total Replies */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-indigo-500" />
                  2. Total Replies Received
                </span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-300">
                  {totalReplies} ({replyRate.toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(6, (totalReplies / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 3: Positive Replies */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-teal-500" />
                  3. Positive Interested Replies
                </span>
                <span className="font-extrabold text-teal-600 dark:text-teal-300">
                  {totalPositiveReplies} ({positiveRate.toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-500"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(5, (totalPositiveReplies / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 4: Calls Booked */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <PhoneCall className="h-4 w-4 mr-2 text-amber-500" />
                  4. Strategy Calls Booked
                </span>
                <span className="font-extrabold text-amber-600 dark:text-amber-300">{callsBooked}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(4, (callsBooked / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 5: Deals Won */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-emerald-500" />
                  5. Retainers Closed (Won Deals)
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-300">
                  {wonDeals} Clients (${currentMrr.toLocaleString()} MRR)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${totalEmailsSent > 0 ? Math.max(3, (wonDeals / totalEmailsSent) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Rates Indicator Footer */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-black/5 dark:border-white/10 pt-5 text-center">
            <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] p-3.5 border border-black/5 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bounce Rate</span>
              <p
                className={`text-xl font-black mt-1 ${
                  bounceRate <= maxBounce ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {bounceRate.toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-400">Ceiling: &le; {maxBounce}%</span>
            </div>
            <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] p-3.5 border border-black/5 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Reply Rate</span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {replyRate.toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-400">{totalReplies} total replies</span>
            </div>
            <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] p-3.5 border border-black/5 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Positive Reply Rate</span>
              <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">
                {positiveRate.toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-400">Benchmark: &ge; {minPositive}%</span>
            </div>
          </div>
        </div>

        {/* 10-Minute Daily Routine Checklist */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 backdrop-blur-xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-[#6324FC] dark:text-[#00E5FF]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily 10-Minute SOP</h3>
              </div>
              <span className="rounded-full bg-[#6324FC]/10 dark:bg-[#6324FC]/20 px-2.5 py-0.5 text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20">
                Operating Routine
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
              Execute this 10-minute checklist every morning to keep your HVAC pipeline clean:
            </p>

            <div className="mt-4 space-y-3">
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
                    className={`flex items-start space-x-3 rounded-2xl p-3.5 cursor-pointer border transition-all ${
                      isChecked
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-slate-400 line-through'
                        : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#6324FC]/5 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5">
                      <CheckCircle2
                        className={`h-5 w-5 ${isChecked ? 'text-emerald-500' : 'text-slate-400'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isChecked ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {step.id}. {step.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 text-xs text-slate-400 text-center">
            Click any routine item to record completed action.
          </div>
        </div>
      </div>

      {/* Urgent Attention Center (Follow-ups & Deliverables) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Urgent Follow-ups */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Follow-ups Due &amp; Overdue</h3>
            </div>
            <button
              onClick={() => onNavigateTab('prospects')}
              className="text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center"
            >
              All Prospects <ChevronRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          {urgentFollowUps.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500/80 mb-2.5" />
              No overdue follow-ups! Everything is on schedule.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {urgentFollowUps.map((p) => {
                const isOverdue = p.nextFollowUp && p.nextFollowUp < todayStr;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProspect(p);
                      onNavigateTab('prospects');
                    }}
                    className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-4 hover:border-[#6324FC]/30 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{p.company}</span>
                        <span className="rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {p.city}, {p.state}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-sm">
                        {p.gap || p.businessEmail}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          isOverdue
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : 'Due Today'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deliverables Calendar Snapshot */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0c0d14]/80 p-6 lg:p-8 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <Calendar className="h-5 w-5 text-[#6324FC] dark:text-[#00E5FF]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Client Deliverables</h3>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center"
            >
              Full Calendar <ChevronRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          {urgentDeliverables.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500/80 mb-2.5" />
              All client recurring deliverables are up to date!
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {urgentDeliverables.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-4 hover:border-[#6324FC]/30 transition-all"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{item.client}</span>
                      <span className="text-xs text-[#6324FC] dark:text-[#00E5FF] font-semibold">({item.frequency})</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.task}</p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
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
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-slate-900 via-[#0e111a] to-slate-950 p-6 lg:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#00E5FF] uppercase tracking-wider">
              Financial Overview &bull; Monthly PnL
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
              Collected Revenue: ${totalCollected.toLocaleString()} &bull; Net Profit:{' '}
              <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                ${netProfit.toLocaleString()}
              </span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Total Invoiced: ${totalInvoiced.toLocaleString()} | Total Operating Expenses: ${totalExpenses.toLocaleString()}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('financials')}
            className="flex items-center space-x-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3 text-sm font-bold text-white transition self-start sm:self-auto shadow-lg"
          >
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Manage Invoices &amp; PnL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
