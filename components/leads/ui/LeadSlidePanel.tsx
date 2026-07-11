'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Building2, User, Mail, Phone, Globe, Calendar, Tag,
  Activity, FileText, CheckCircle2, MessageSquare, Edit,
  Clock, LinkIcon, Sparkles, StickyNote, LayoutList
} from 'lucide-react';

interface LeadSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  getStatusConfig: (status: string) => any;
  formatDate: (date?: string) => string;
  onOpenEmailComposer?: (lead: any) => void;
}

type TabKey = 'overview' | 'notes' | 'activity';

const STATUS_STYLES: Record<string, { text: string; dot: string; bg: string; border: string }> = {
  'New':            { text: 'text-[#2563EB]', dot: 'bg-[#2563EB]', bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]/20' },
  'Contacted':      { text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  'Replied':        { text: 'text-[#7C3AED]', dot: 'bg-[#7C3AED]', bg: 'bg-[#7C3AED]/10', border: 'border-[#7C3AED]/20' },
  'Meeting Booked': { text: 'text-[#0EA5E9]', dot: 'bg-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20' },
  'Closed':         { text: 'text-[#10B981]', dot: 'bg-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20' },
  'Not Interested': { text: 'text-[#EF4444]', dot: 'bg-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20' },
};

function getInitials(name: string) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Score color helper
function scoreColor(score: number) {
  if (score >= 70) return '#10B981';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

// ─── Property Row ───────────────────────────────────────────────────────────
function PropRow({ icon: Icon, label, value, link }: { icon: React.ElementType; label: string; value: string; link?: string }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-[#232734]/60 last:border-none">
      <div className="flex items-center gap-2 w-28 flex-shrink-0 pt-0.5">
        <Icon size={13} className="text-[#94A3B8] flex-shrink-0" />
        <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">{label}</span>
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-sm font-semibold text-[#2563EB] hover:text-[#2563EB]/80 truncate transition-colors"
        >
          {value || '—'}
        </a>
      ) : (
        <span className="flex-1 text-sm font-semibold text-white break-words min-w-0">{value || '—'}</span>
      )}
    </div>
  );
}

// ─── Activity Item ───────────────────────────────────────────────────────────
function ActivityItem({ icon: Icon, color, title, subtitle, time }: {
  icon: React.ElementType; color: string; title: string; subtitle?: string; time?: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <div className="w-px flex-1 bg-[#232734] mt-1" style={{ minHeight: '16px' }} />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <p className="text-sm font-bold text-white leading-tight mb-0.5">{title}</p>
        {subtitle && <p className="text-xs text-[#94A3B8] truncate">{subtitle}</p>}
        {time && <p className="text-[10px] text-[#232734] font-bold mt-1">{time}</p>}
      </div>
    </div>
  );
}

export default function LeadSlidePanel({
  isOpen,
  onClose,
  lead,
  getStatusConfig,
  formatDate,
  onOpenEmailComposer,
}: LeadSlidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  if (!lead) return null;

  const status       = lead.status || 'New';
  const statusStyle  = STATUS_STYLES[status] ?? STATUS_STYLES['New'];
  const initials     = getInitials(lead.company_name || lead.contact_person);
  const score        = lead.leadScore ?? 50;
  const color        = scoreColor(score);

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutList },
    { key: 'notes',    label: 'Notes',    icon: StickyNote },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#09090B]/70 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="relative w-full max-w-2xl lg:max-w-3xl max-h-[90vh] bg-[#09090B] border border-[#232734] rounded-2xl z-50 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
              role="dialog"
              aria-label={`Lead details for ${lead.company_name}`}
            >

            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 p-6 border-b border-[#232734] bg-[#11131A]">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Lead Details</span>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-[10px] text-[#94A3B8] hover:text-white hover:bg-[#232734] border border-transparent hover:border-[#232734] transition-all" aria-label="Edit">
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-[10px] text-[#94A3B8] hover:text-white hover:bg-[#232734] border border-[#232734] transition-all"
                    aria-label="Close panel"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Company identity */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-[16px] bg-[#09090B] border border-[#232734] flex items-center justify-center text-white text-lg font-bold shadow-inner overflow-hidden">
                    <div className="absolute inset-0 bg-[#2563EB]/5 blur-xl rounded-full" />
                    <span className="relative z-10">{initials}</span>
                  </div>
                  {/* Status dot */}
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#11131A]"
                    style={{ backgroundColor: statusStyle.dot.replace('bg-', '') }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white tracking-tight truncate">{lead.company_name || 'Unknown Company'}</h2>
                  <p className="text-sm text-[#94A3B8] font-medium truncate">{lead.contact_person || 'No contact'}</p>
                </div>

                {/* Status badge */}
                <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {status}
                </span>
              </div>

              {/* Lead Score */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-[#09090B] rounded-full overflow-hidden border border-[#232734]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-bold font-mono" style={{ color }}>Score: {score}</span>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2 mt-5">
                {[
                  { icon: Mail, label: 'Email', action: () => {
                      if (onOpenEmailComposer) onOpenEmailComposer(lead);
                      else if (lead.email) window.open(`mailto:${lead.email}`);
                  }, accent: '#2563EB' },
                  { icon: Phone, label: 'Call', action: () => lead.phone && window.open(`tel:${lead.phone}`), accent: '#10B981' },
                  { icon: MessageSquare, label: 'Message', action: () => {}, accent: '#7C3AED' },
                  { icon: Globe, label: 'Website', action: () => lead.website_url && window.open(lead.website_url, '_blank'), accent: '#0EA5E9' },
                ].map(({ icon: Icon, label, action, accent }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-[14px] bg-[#09090B] border border-[#232734] text-[#94A3B8] hover:text-white hover:border-[#232734] transition-all group"
                  >
                    <Icon size={17} className="group-hover:scale-110 transition-transform" style={{ color: 'inherit' }} />
                    <span className="text-[10px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Tabs ────────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center border-b border-[#232734] px-6 bg-[#0D0F16]">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all ${
                    activeTab === tab.key ? 'text-white' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="slidePanelTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ─── Scrollable Content ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 space-y-6"
                  >
                    {/* Contact Info */}
                    <div>
                      <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Contact Information</h3>
                      <div className="bg-[#11131A] border border-[#232734] rounded-[16px] px-5 py-1 divide-y divide-[#232734]/60">
                        <PropRow icon={User}     label="Contact" value={lead.contact_person} />
                        <PropRow icon={Mail}     label="Email"   value={lead.email}    link={lead.email ? `mailto:${lead.email}` : undefined} />
                        <PropRow icon={Phone}    label="Phone"   value={lead.phone} />
                        <PropRow icon={Globe}    label="Website" value={lead.website_url} link={lead.website_url} />
                      </div>
                    </div>

                    {/* Lead Details */}
                    <div>
                      <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Lead Details</h3>
                      <div className="bg-[#11131A] border border-[#232734] rounded-[16px] px-5 py-1 divide-y divide-[#232734]/60">
                        <PropRow icon={Tag}      label="Service"  value={lead.targetService || 'General'} />
                        <PropRow icon={Activity} label="Source"   value={lead.source || 'Manual'} />
                        <PropRow icon={Calendar} label="Added"    value={formatDate(lead.createdAt)} />
                        <PropRow icon={Clock}    label="Follow-up" value={formatDate(lead.nextFollowUpDate)} />
                      </div>
                    </div>

                    {/* Context & Notes */}
                    {lead.lead_context && (
                      <div>
                        <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Context</h3>
                        <div className="bg-[#11131A] border border-[#232734] rounded-[16px] p-5">
                          <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap font-medium">{lead.lead_context}</p>
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {(lead.linkedin_url || lead.facebook_url || lead.instagram_url) && (
                      <div>
                        <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Social Profiles</h3>
                        <div className="flex flex-wrap gap-2">
                          {lead.linkedin_url && (
                            <a
                              href={lead.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#11131A] border border-[#232734] text-xs font-bold text-[#94A3B8] hover:text-white hover:border-[#232734] transition-all"
                            >
                              <LinkIcon size={12} /> LinkedIn
                            </a>
                          )}
                          {lead.facebook_url && (
                            <a
                              href={lead.facebook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#11131A] border border-[#232734] text-xs font-bold text-[#94A3B8] hover:text-white hover:border-[#232734] transition-all"
                            >
                              <LinkIcon size={12} /> Facebook
                            </a>
                          )}
                          {lead.instagram_url && (
                            <a
                              href={lead.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#11131A] border border-[#232734] text-xs font-bold text-[#94A3B8] hover:text-white hover:border-[#232734] transition-all"
                            >
                              <LinkIcon size={12} /> Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="bg-[#11131A] border border-[#232734] rounded-[16px] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#232734]">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Notes</span>
                        <button className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 transition-colors">+ Add Note</button>
                      </div>
                      <textarea
                        className="w-full bg-transparent px-4 py-4 text-sm text-[#94A3B8] placeholder-[#94A3B8]/40 resize-none focus:outline-none leading-relaxed min-h-[160px]"
                        placeholder="Add a note about this prospect…"
                        defaultValue={lead.lead_context || ''}
                      />
                    </div>

                    {/* AI Suggestion */}
                    <div className="mt-4 p-4 rounded-[16px] border border-[#7C3AED]/20 bg-[#7C3AED]/5 flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center flex-shrink-0 text-[#7C3AED] mt-0.5">
                        <Sparkles size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white mb-1">AI Suggestion</p>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">
                          Consider personalizing your next outreach with a reference to their product line. Their website shows they recently launched a new collection.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">Timeline</h3>
                    <div className="space-y-0">
                      <ActivityItem icon={CheckCircle2} color="#2563EB"  title="Lead Created"              subtitle={`via ${lead.source || 'Manual'}`}     time={formatDate(lead.createdAt)} />
                      {lead.status !== 'New' && (
                        <ActivityItem icon={Mail}        color="#F59E0B"  title="First Email Sent"           subtitle="Outreach email delivered"              time="Just now" />
                      )}
                      {(lead.status === 'Replied' || lead.status === 'Meeting Booked' || lead.status === 'Closed') && (
                        <ActivityItem icon={MessageSquare} color="#7C3AED" title="Reply Received"            subtitle={`\"${lead.lead_context?.substring(0, 40) || 'Looking forward to connecting'}...\"`} time="Recently" />
                      )}
                      {lead.status === 'Meeting Booked' && (
                        <ActivityItem icon={Calendar}    color="#0EA5E9"  title="Meeting Booked"             subtitle="Call scheduled via Google Calendar"     time={formatDate(lead.nextFollowUpDate)} />
                      )}
                      {lead.status === 'Closed' && (
                        <ActivityItem icon={CheckCircle2} color="#10B981" title="Deal Closed"               subtitle="Prospect converted to client 🎉"         time={formatDate(lead.nextFollowUpDate)} />
                      )}
                    </div>

                    {/* Add activity */}
                    <div className="mt-6 pt-5 border-t border-[#232734]">
                      <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] bg-[#11131A] border border-[#232734] text-xs font-bold text-[#94A3B8] hover:text-white hover:border-[#232734] transition-all">
                        <FileText size={13} /> Log Activity
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
