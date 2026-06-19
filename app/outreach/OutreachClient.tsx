'use client';

import React, { useState, useMemo } from 'react';
import { Mail, Send, Activity, MessageSquare, CheckCircle, Clock, AlertCircle, Sparkles, User, Building2, Globe, Phone, ExternalLink, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createProposal } from '@/app/actions/proposalActions';

interface OutreachClientProps {
  initialLeads: any[];
  initialAnalytics: any;
}

export default function OutreachClient({ initialLeads, initialAnalytics }: OutreachClientProps) {
  const router = useRouter();
  const [leads] = useState(initialLeads);
  const [activeTab, setActiveTab] = useState<'inbox' | 'pipeline'>('inbox');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreatingProposalFor, setIsCreatingProposalFor] = useState<string | null>(null);

  const handleCreateProposal = async (lead: any) => {
    setIsCreatingProposalFor(lead._id);
    try {
      const result = await createProposal({
        clientName: lead.company_name,
        title: `Proposal for ${lead.targetService || 'Custom Service'}`,
      });
      if (result.success && result.data) {
        router.push(`/proposals/${result.data._id}`);
      } else {
        alert('Failed to create proposal.');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating proposal.');
    } finally {
      setIsCreatingProposalFor(null);
    }
  };

  const analytics = initialAnalytics || {
    totalSent: 0,
    totalReplies: 0,
    totalDailyQuota: 0,
    totalSentToday: 0,
    queuedCount: 0,
  };

  // Hot Inbox: Leads that have replied
  const hotInboxLeads = useMemo(() => {
    return leads.filter(lead => lead.is_replied === true).sort((a, b) => {
      // Sort by last_contacted_date descending
      const dateA = a.last_contacted_date ? new Date(a.last_contacted_date).getTime() : 0;
      const dateB = b.last_contacted_date ? new Date(b.last_contacted_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [leads]);

  // Active Pipeline: Leads currently being processed or scheduled
  const activePipelineLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return leads.filter(lead => {
      if (lead.is_replied) return false;
      if (lead.outreach_status === 'Closed' || lead.outreach_status === 'Not Interested') return false;
      
      const isScheduledForFuture = lead.outreach_scheduled_for && new Date(lead.outreach_scheduled_for) >= today;
      const isFollowUpDue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) >= today;
      
      return isScheduledForFuture || isFollowUpDue || lead.outreach_status === 'Contacted';
    }).sort((a, b) => {
      // Sort by follow-up date ascending
      const dateA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : Infinity;
      const dateB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [leads]);

  const getAvatarGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 70%, 55%) 0%, hsl(${h2}, 80%, 45%) 100%)`;
  };

  return (
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="mb-3">
          Outreach Analytics
        </h1>
        <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-600 dark:text-gray-400">
          Monitor your automated campaigns, track quotas, and respond to hot leads.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total Sent */}
        <div className="neu-flat p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-500">
            <Send size={80} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Send size={14} />
            </div>
            <h3 className="">Total Sent</h3>
          </div>
          <p className="text-4xl font-black text-slate-800 dark:text-white mt-4">{analytics.totalSent}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">All time automated emails</p>
        </div>

        {/* Card 2: Total Replies */}
        <div className="neu-flat p-6 transition-all duration-300">
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 rounded-r-2xl" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare size={14} />
            </div>
            <h3 className="">Hot Replies</h3>
          </div>
          <p className="text-4xl font-black text-slate-800 dark:text-white mt-4 text-emerald-600 dark:text-emerald-400">{analytics.totalReplies}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Leads waiting for manual action</p>
        </div>

        {/* Card 3: Queued For Today */}
        <div className="neu-flat p-6 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={14} />
            </div>
            <h3 className="">Queued / Active</h3>
          </div>
          <p className="text-4xl font-black text-slate-800 dark:text-white mt-4">{analytics.queuedCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Scheduled & Pending Follow-ups</p>
        </div>

        {/* Card 4: Quota Usage Today */}
        <div className="neu-flat p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Activity size={14} />
              </div>
              <h3 className="">Quota Today</h3>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-end mb-1">
              <p className="text-3xl font-black text-slate-800 dark:text-white">
                {analytics.totalSentToday} <span className="text-sm text-slate-400 font-bold">/ {analytics.totalDailyQuota}</span>
              </p>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${analytics.totalDailyQuota > 0 ? Math.min(100, (analytics.totalSentToday / analytics.totalDailyQuota) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="neu-flat overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-5 flex items-center justify-center gap-3 font-black tracking-widest uppercase text-sm transition-all ${activeTab === 'inbox' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <MessageSquare size={18} />
            Hot Inbox <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{hotInboxLeads.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex-1 py-5 flex items-center justify-center gap-3 font-black tracking-widest uppercase text-sm transition-all ${activeTab === 'pipeline' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Clock size={18} />
            Active Pipeline
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          
          {/* INBOX TAB */}
          {activeTab === 'inbox' && (
            <div>
              {hotInboxLeads.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="mb-2">Inbox Zero</h3>
                  <p className="text-sm text-center max-w-sm">No new replies to action right now. When clients reply to your automated emails, they will appear here so you can manually close the deal.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {hotInboxLeads.map(lead => (
                    <div key={lead._id} className="p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div 
                          style={{ background: getAvatarGradient(lead.company_name) }}
                          className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0"
                        >
                          {lead.company_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h4 className="">{lead.company_name}</h4>
                            {lead.targetService && (
                              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                                {lead.targetService}
                              </span>
                            )}
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">Automations Paused</span>
                          </div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-1">
                            <User size={14} /> {lead.contact_person || 'No Contact Person'} • {lead.email}
                          </p>
                          {lead.last_reply_subject && (
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-1">
                              <MessageSquare size={12} className="text-emerald-500" />
                              <span className="opacity-70">Subject:</span> {lead.last_reply_subject}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => handleCreateProposal(lead)}
                          disabled={isCreatingProposalFor === lead._id}
                          className="flex items-center gap-2.5 px-6 py-3 neu-button text-slate-800 dark:text-slate-200 font-jakarta font-bold rounded-xl text-sm disabled:opacity-50"
                        >
                          {isCreatingProposalFor === lead._id ? (
                            <span className="animate-pulse">Creating...</span>
                          ) : (
                            <>
                              <Plus size={20} strokeWidth={2.5} className="text-indigo-500" /> Create Proposal
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <div>
              {activePipelineLeads.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Clock size={48} className="opacity-20 mb-4" />
                  <h3 className="mb-2">Pipeline Empty</h3>
                  <p className="text-sm">Go to Leads to schedule new automated outreach.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activePipelineLeads.map(lead => (
                    <div key={lead._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 flex items-start gap-4">
                      <div 
                        style={{ background: getAvatarGradient(lead.company_name) }}
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0"
                      >
                        {lead.company_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="truncate">{lead.company_name}</h4>
                          <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                            {lead.outreach_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Follow-ups Sent</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{lead.follow_up_count} / 3</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Next Action Due</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : (lead.outreach_scheduled_for ? new Date(lead.outreach_scheduled_for).toLocaleDateString() : 'Not Scheduled')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
