'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Target, Play, Pause, CheckCircle, Mail, Settings, Users, Activity,
  Trash2, AlertTriangle, X, Zap, Search, ChevronDown, ChevronUp, ArrowUpDown,
  Megaphone, Download, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  LayoutList, StickyNote, Clock, Globe, Calendar, Tag, CheckCircle2,
  TrendingUp, BarChart2, MousePointerClick, Send
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import CampaignBuilderModal from './CampaignBuilderModal';
import CampaignLogsModal from './CampaignLogsModal';
import { updateCampaignStatus, deleteCampaign } from '@/app/actions/campaignActions';
import { forceRunCampaign } from '@/app/actions/outreachAutomationActions';
import toast from 'react-hot-toast';

// ─── Types ──────────────────────────────────────────────────────────────────
type SortKey = 'name' | 'status' | 'leadCount' | 'createdAt' | null;
type SortDir = 'asc' | 'desc';
type PanelTab = 'overview' | 'audience' | 'timeline' | 'notes';

// ─── Animation Variants ─────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } }
};

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { text: string; dot: string; bg: string; border: string }> = {
  'Active':    { text: 'text-[#10B981]', dot: 'bg-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20' },
  'Paused':    { text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  'Completed': { text: 'text-[#2563EB]', dot: 'bg-[#2563EB]', bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]/20' },
  'Draft':     { text: 'text-[#94A3B8]', dot: 'bg-[#94A3B8]', bg: 'bg-[#94A3B8]/10', border: 'border-[#94A3B8]/20' },
};
function getStatus(s: string) { return STATUS_STYLE[s] ?? STATUS_STYLE['Draft']; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d?: string) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}
function pct(n: number) { return `${n}%`; }

// ─── Filter Dropdown ─────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const active = value !== options[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${active ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30' : 'bg-[#11131A] text-[#94A3B8] border-[#232734] hover:text-white'}`}
      >
        {active ? value : label}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="absolute top-full left-0 mt-2 z-40 min-w-[148px] bg-[#11131A] border border-[#232734] rounded-[14px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {options.map(opt => (
                <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${value === opt ? 'text-[#2563EB] bg-[#2563EB]/10' : 'text-[#94A3B8] hover:text-white hover:bg-[#232734]'}`}>
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown size={11} className="text-[#232734] group-hover:text-[#94A3B8] transition-colors" />;
  return sortDir === 'asc' ? <ChevronUp size={11} className="text-[#2563EB]" /> : <ChevronDown size={11} className="text-[#2563EB]" />;
}

// ─── Slide Panel ─────────────────────────────────────────────────────────────
function CampaignSlidePanel({
  campaign,
  onClose,
  onEdit,
  onLogs,
  onStatusChange,
  onForceRun,
  isForceRunning,
}: {
  campaign: any; onClose: () => void; onEdit: () => void; onLogs: () => void;
  onStatusChange: (id: string, s: string) => void; onForceRun: (id: string) => void; isForceRunning: string | null;
}) {
  const [tab, setTab] = useState<PanelTab>('overview');
  const statusStyle = getStatus(campaign.status);
  const tabs: { key: PanelTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',  label: 'Overview',  icon: LayoutList },
    { key: 'audience',  label: 'Audience',  icon: Users },
    { key: 'timeline',  label: 'Timeline',  icon: Clock },
    { key: 'notes',     label: 'Notes',     icon: StickyNote },
  ];

  // Mock performance data
  const deliveryRate = campaign.deliveryRate ?? 94;
  const openRate     = campaign.openRate     ?? 38;
  const clickRate    = campaign.clickRate    ?? 12;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#09090B]/70 backdrop-blur-sm z-50"
      />
      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg lg:max-w-xl bg-[#09090B] border-l border-[#232734] z-50 flex flex-col"
        role="dialog" aria-label={`Campaign: ${campaign.name}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-[#232734] bg-[#11131A]">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Campaign Details</span>
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-white hover:bg-[#232734] border border-transparent hover:border-[#232734] transition-all" aria-label="Edit campaign">
                <Settings size={15} />
              </button>
              <button onClick={onClose} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-white hover:bg-[#232734] border border-[#232734] transition-all" aria-label="Close">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Campaign identity */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#09090B] border border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Megaphone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white tracking-tight truncate mb-1">{campaign.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/10 border border-[#2563EB]/20 text-[10px] font-bold text-[#2563EB] uppercase tracking-widest">Email</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  {campaign.status}
                </span>
              </div>
            </div>
          </div>

          {/* Perf mini-cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Delivery', value: pct(deliveryRate), color: '#10B981', icon: Send },
              { label: 'Open Rate', value: pct(openRate),    color: '#2563EB', icon: BarChart2 },
              { label: 'Click Rate', value: pct(clickRate),  color: '#7C3AED', icon: MousePointerClick },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-[#09090B] border border-[#232734] rounded-[12px] p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={11} style={{ color }} />
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-base font-bold font-mono" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button onClick={onLogs} className="p-2.5 bg-[#09090B] border border-[#232734] text-[#94A3B8] hover:text-white rounded-[10px] transition-all" aria-label="View logs">
              <Activity size={15} />
            </button>
            {campaign.status === 'Active' ? (
              <>
                <button onClick={() => onForceRun(campaign._id)} disabled={isForceRunning === campaign._id}
                  className="p-2.5 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 rounded-[10px] hover:bg-[#2563EB]/20 transition-all disabled:opacity-50" aria-label="Force run">
                  <Zap size={15} className={isForceRunning === campaign._id ? 'animate-pulse' : ''} />
                </button>
                <button onClick={() => onStatusChange(campaign._id, 'Paused')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 rounded-[10px] text-xs font-bold hover:bg-[#F59E0B]/20 transition-all">
                  <Pause size={14} /> Pause
                </button>
              </>
            ) : campaign.status === 'Completed' ? (
              <button disabled className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#09090B] border border-[#232734] text-[#94A3B8] rounded-[10px] text-xs font-bold cursor-not-allowed">
                <CheckCircle size={14} /> Completed
              </button>
            ) : (
              <button onClick={() => onStatusChange(campaign._id, 'Active')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-[10px] text-xs font-bold hover:bg-[#10B981]/20 transition-all">
                <Play size={14} strokeWidth={3} /> Start Campaign
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex items-center border-b border-[#232734] px-6 bg-[#0D0F16]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all ${tab === t.key ? 'text-white' : 'text-[#94A3B8] hover:text-white'}`}>
              <t.icon size={13} />
              {t.label}
              {tab === t.key && (
                <motion.div layoutId="campPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6 space-y-5">
                <div>
                  <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Campaign Properties</h3>
                  <div className="bg-[#11131A] border border-[#232734] rounded-[16px] px-5 py-1 divide-y divide-[#232734]/60">
                    {[
                      { icon: Target,    label: 'Niche',     value: campaign.niche     || 'General' },
                      { icon: Mail,      label: 'Sequences', value: `${campaign.sequences?.length || 0} emails` },
                      { icon: Users,     label: 'Leads',     value: `${campaign.leadCount || 0} leads` },
                      { icon: Calendar,  label: 'Created',   value: formatDate(campaign.createdAt) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-4 py-3">
                        <div className="flex items-center gap-2 w-28 flex-shrink-0">
                          <Icon size={13} className="text-[#94A3B8] flex-shrink-0" />
                          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">{label}</span>
                        </div>
                        <span className="flex-1 text-sm font-semibold text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description if available */}
                {campaign.description && (
                  <div>
                    <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Description</h3>
                    <div className="bg-[#11131A] border border-[#232734] rounded-[16px] p-5">
                      <p className="text-sm text-[#94A3B8] leading-relaxed">{campaign.description}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'audience' && (
              <motion.div key="audience" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Audience', value: campaign.leadCount || 0, color: '#2563EB' },
                    { label: 'Contacted',       value: Math.floor((campaign.leadCount || 0) * 0.7), color: '#F59E0B' },
                    { label: 'Replied',         value: Math.floor((campaign.leadCount || 0) * 0.3), color: '#7C3AED' },
                    { label: 'Converted',       value: Math.floor((campaign.leadCount || 0) * 0.05), color: '#10B981' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#11131A] border border-[#232734] rounded-[14px] p-4">
                      <p className="text-xs font-bold text-[#94A3B8] mb-1">{label}</p>
                      <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Delivery Funnel</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Delivered', pctVal: deliveryRate, color: '#10B981' },
                      { label: 'Opened',    pctVal: openRate,     color: '#2563EB' },
                      { label: 'Clicked',   pctVal: clickRate,    color: '#7C3AED' },
                    ].map(({ label, pctVal, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#94A3B8] w-20 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-2 bg-[#09090B] rounded-full overflow-hidden border border-[#232734]">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pctVal}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full" style={{ backgroundColor: color }} />
                        </div>
                        <span className="text-xs font-bold font-mono w-8 text-right" style={{ color }}>{pctVal}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">Timeline</h3>
                <div className="space-y-0">
                  {[
                    { icon: CheckCircle2, color: '#2563EB',  title: 'Campaign Created',     sub: `via Campaign Builder`,          time: formatDate(campaign.createdAt) },
                    ...(campaign.status !== 'Draft' ? [{ icon: Play, color: '#10B981', title: 'Campaign Activated', sub: 'Outreach sequence started', time: 'Recently' }] : []),
                    ...(campaign.status === 'Paused'    ? [{ icon: Pause,        color: '#F59E0B', title: 'Campaign Paused',    sub: 'Outreach paused by user', time: 'Recently' }] : []),
                    ...(campaign.status === 'Completed' ? [{ icon: CheckCircle,  color: '#10B981', title: 'Campaign Completed', sub: `All ${campaign.leadCount || 0} leads processed`, time: 'Recently' }] : []),
                  ].map(({ icon: Icon, color, title, sub, time }, i, arr) => (
                    <div key={title} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-[#232734] mt-1" style={{ minHeight: 20 }} />}
                      </div>
                      <div className="pb-5 min-w-0">
                        <p className="text-sm font-bold text-white leading-tight mb-0.5">{title}</p>
                        <p className="text-xs text-[#94A3B8]">{sub}</p>
                        <p className="text-[10px] text-[#232734] font-bold mt-1">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                <div className="bg-[#11131A] border border-[#232734] rounded-[16px] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#232734]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Notes</span>
                    <button className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 transition-colors">+ Add Note</button>
                  </div>
                  <textarea
                    className="w-full bg-transparent px-4 py-4 text-sm text-[#94A3B8] placeholder-[#94A3B8]/40 resize-none focus:outline-none leading-relaxed min-h-[160px]"
                    placeholder="Add campaign notes, strategy or reminders…"
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampaignsClient({ initialCampaigns }: { initialCampaigns: any[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsCampaign, setLogsCampaign] = useState<any>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isForceRunning, setIsForceRunning] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('Any Time');

  // Selected & sort
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Slide panel
  const [panelCampaign, setPanelCampaign] = useState<any>(null);

  // ─── Business Logic (unchanged) ────────────────────────────────────────────
  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    setCampaigns(campaigns.map(c => c._id === campaignId ? { ...c, status: newStatus } : c));
    if (panelCampaign?._id === campaignId) setPanelCampaign((p: any) => ({ ...p, status: newStatus }));
    const res = await updateCampaignStatus(campaignId, newStatus);
    if (!res.success) { toast.error('Failed to update status'); setCampaigns(campaigns); }
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    const prev = [...campaigns];
    setCampaigns(campaigns.filter(c => c._id !== campaignToDelete));
    const res = await deleteCampaign(campaignToDelete);
    if (!res.success) { toast.error('Failed to delete campaign'); setCampaigns(prev); }
    else { toast.success('Campaign deleted successfully'); if (panelCampaign?._id === campaignToDelete) setPanelCampaign(null); }
    setIsDeleting(false);
    setCampaignToDelete(null);
  };

  const handleForceRun = async (campaignId: string) => {
    setIsForceRunning(campaignId);
    toast.loading('Processing leads...', { id: 'forceRun' });
    const res = await forceRunCampaign(campaignId);
    if (res.success) { toast.success(res.message || 'Processed successfully', { id: 'forceRun' }); window.location.reload(); }
    else { toast.error('Error: ' + res.error, { id: 'forceRun' }); }
    setIsForceRunning(null);
  };

  // ─── Filtering ──────────────────────────────────────────────────────────────
  const filtered = campaigns.filter(c => {
    if (activeFilter !== 'All' && c.status !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.name?.toLowerCase().includes(q) && !c.niche?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ─── KPI Stats ──────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total',      value: campaigns.length,                                      color: '#2563EB', trend: '+2', up: true },
    { label: 'Active',     value: campaigns.filter(c => c.status === 'Active').length,    color: '#10B981', trend: '+1', up: true },
    { label: 'Paused',     value: campaigns.filter(c => c.status === 'Paused').length,    color: '#F59E0B', trend: '0',  up: true },
    { label: 'Draft',      value: campaigns.filter(c => c.status === 'Draft').length,     color: '#94A3B8', trend: '+3', up: true },
    { label: 'Completed',  value: campaigns.filter(c => c.status === 'Completed').length, color: '#7C3AED', trend: '+1', up: true },
    { label: 'Avg Open',   value: '38%',                                                  color: '#0EA5E9', trend: '+4%', up: true },
  ];

  const allSel = sorted.length > 0 && selectedIds.length === sorted.length;
  const toggleAll = () => allSel ? setSelectedIds([]) : setSelectedIds(sorted.map(c => c._id));
  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28, delay: i * 0.03 } }),
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } }
  };

  const Th = ({ children, col, className = '' }: { children: React.ReactNode; col?: SortKey; className?: string }) => (
    <th
      className={`px-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap select-none ${col ? 'cursor-pointer group hover:text-white transition-colors' : ''} ${className}`}
      onClick={col ? () => handleSort(col) : undefined}
    >
      <div className="flex items-center gap-1.5">{children}{col && <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />}</div>
    </th>
  );

  return (
    <div className="min-h-screen bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Megaphone size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Marketing</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-jakarta mb-1.5">Campaigns</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Create and manage automated email outreach sequences.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#11131A] text-[#94A3B8] border border-[#232734] hover:text-white hover:border-[#232734] transition-all">
                <Download size={15} /> <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={() => { setEditingCampaign(null); setIsBuilderOpen(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> New Campaign
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
            {kpis.map((k, i) => {
              const dummyData = [10, 20, 15, 25, 20, 30, 40].map((v, idx) => ({ val: v + (Math.random() * 10 - 5) }));
              return (
                <motion.div key={k.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="relative overflow-hidden bg-[#11131A] border border-[#232734] rounded-[24px] p-5 cursor-pointer group hover:border-[#232734]/80 transition-all"
                >
                  <div className="absolute inset-0 opacity-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dummyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Area type="monotone" dataKey="val" stroke={k.color} strokeWidth={2} fill={k.color} fillOpacity={1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="relative z-10 flex items-start justify-between mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${k.up ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                      {k.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {k.trend}
                    </span>
                  </div>
                  <p className="relative z-10 text-3xl font-bold font-mono tracking-tight text-white">{k.value}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="space-y-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md group">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search campaigns, niches…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#11131A] border border-[#232734] text-white placeholder-[#94A3B8]/60 text-sm font-medium rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-[#232734] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Filter Chips & Dropdowns Grouped Separately */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1 bg-[#11131A] border border-[#232734] p-1 rounded-[14px]">
                {['All', 'Active', 'Paused', 'Completed'].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFilter === f ? 'bg-[#232734] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-[#232734] hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <FilterDropdown label="Type" options={['All Types', 'Email', 'WhatsApp', 'Multi-channel']} value={typeFilter} onChange={setTypeFilter} />
                <FilterDropdown label="Date" options={['Any Time', 'Today', 'Last 7 Days', 'Last 30 Days']} value={dateFilter} onChange={setDateFilter} />
              </div>
            </div>

            <div className="flex-1 hidden md:block" />
            <div className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-[#11131A] border border-[#232734] rounded-xl">
              <span className="text-sm font-bold text-white font-mono">{sorted.length}</span>
              <span className="text-xs font-semibold text-[#94A3B8]">campaigns</span>
            </div>
          </div>
        </motion.div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        {sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center justify-center bg-[#11131A] border border-[#232734] rounded-[20px]">
            <div className="w-16 h-16 rounded-[20px] bg-[#09090B] border border-[#232734] flex items-center justify-center mb-4">
              <Target size={24} className="text-[#232734]" />
            </div>
            <p className="text-sm font-bold text-white mb-1">No campaigns found</p>
            <p className="text-xs text-[#94A3B8] mb-6">Create your first campaign or adjust your filters.</p>
            {!searchQuery && activeFilter === 'All' && (
              <button onClick={() => setIsBuilderOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-xs font-bold rounded-xl transition-all">
                <Plus size={14} strokeWidth={2.5} /> Get Started
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-[20px] border border-[#232734] bg-[#11131A]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#0D0F16]">
                    <tr className="border-b border-[#232734]">
                      <th className="pl-5 pr-3 py-3 w-10">
                        <button onClick={toggleAll}
                          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${allSel ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-[#232734] bg-[#09090B] hover:border-[#94A3B8]'}`}
                          aria-label="Select all">
                          {allSel && <CheckCircle2 size={10} strokeWidth={3} />}
                        </button>
                      </th>
                      <Th col="name" className="pl-2 min-w-[200px]">Campaign Name</Th>
                      <Th className="min-w-[80px]">Type</Th>
                      <Th col="leadCount" className="min-w-[80px]">Audience</Th>
                      <Th col="status" className="min-w-[100px]">Status</Th>
                      <Th className="min-w-[80px]">Delivery</Th>
                      <Th className="min-w-[80px]">Open Rate</Th>
                      <Th className="min-w-[80px]">Click Rate</Th>
                      <Th col="createdAt" className="min-w-[110px]">Created</Th>
                      <th className="pr-5 py-3 w-28 text-right">
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {sorted.map((campaign, i) => {
                        const isSel = selectedIds.includes(campaign._id);
                        const ss = getStatus(campaign.status);
                        const delivery  = campaign.deliveryRate ?? 94;
                        const openR     = campaign.openRate     ?? 38;
                        const clickR    = campaign.clickRate    ?? 12;

                        const getMetricColor = (val: number) => { if (val >= 50) return 'text-emerald-500'; if (val >= 20) return 'text-amber-500'; return 'text-red-500'; };
                        return (
                          <motion.tr key={campaign._id}
                            custom={i} variants={rowVariants} initial="hidden" animate="show" exit="exit"
                            onClick={() => setPanelCampaign(campaign)}
                            className={`border-b border-[#232734]/60 cursor-pointer transition-all group ${isSel ? 'bg-[#2563EB]/5' : 'hover:bg-[#1E293B]/40'}`}
                          >
                            {/* Checkbox */}
                            <td className="pl-5 pr-3 py-4" onClick={e => toggleOne(campaign._id, e)}>
                              <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${isSel ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'border-[#232734] bg-[#09090B] group-hover:border-[#94A3B8]'}`}>
                                {isSel && <CheckCircle2 size={10} strokeWidth={3} />}
                              </div>
                            </td>

                            {/* Name + Niche */}
                            <td className="pl-2 pr-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-[10px] bg-[#09090B] border border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                                  <Megaphone size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate max-w-[160px]">{campaign.name}</p>
                                  <p className="text-xs text-[#94A3B8] truncate max-w-[160px]">{campaign.niche || 'General'}</p>
                                </div>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="pr-4 py-4">
                              <span className="px-2 py-1 rounded-md bg-[#2563EB]/10 border border-[#2563EB]/20 text-[10px] font-bold text-[#2563EB]">Email</span>
                            </td>

                            {/* Audience */}
                            <td className="pr-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-[#94A3B8]" />
                                <span className="text-sm font-bold text-white font-mono">{campaign.leadCount || 0}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="pr-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${ss.bg} ${ss.border} ${ss.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`} />
                                {campaign.status}
                              </span>
                            </td>

                            {/* Delivery */}
                            <td className="pr-4 py-4">
                              <span className={`text-sm font-bold font-mono ${getMetricColor(delivery)}`}>{delivery}%</span>
                            </td>

                            {/* Open Rate */}
                            <td className="pr-4 py-4">
                              <span className={`text-sm font-bold font-mono ${getMetricColor(openR)}`}>{openR}%</span>
                            </td>

                            {/* Click Rate */}
                            <td className="pr-4 py-4">
                              <span className={`text-sm font-bold font-mono ${getMetricColor(clickR)}`}>{clickR}%</span>
                            </td>

                            {/* Created */}
                            <td className="pr-4 py-4">
                              <span className="text-xs text-[#94A3B8] font-medium">{formatDate(campaign.createdAt)}</span>
                            </td>

                            {/* Actions */}
                            <td className="pr-5 py-4" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => { setLogsCampaign(campaign); setIsLogsOpen(true); }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#232734] transition-all" aria-label="View logs">
                                  <Activity size={16} />
                                </button>
                                <button onClick={() => { setEditingCampaign(campaign); setIsBuilderOpen(true); }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#232734] transition-all" aria-label="Manage">
                                  <Settings size={16} />
                                </button>
                                {campaign.status === 'Active' && (
                                  <button onClick={() => handleForceRun(campaign._id)} disabled={isForceRunning === campaign._id}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#2563EB] hover:bg-[#2563EB]/10 transition-all disabled:opacity-50" aria-label="Force run">
                                    <Zap size={16} className={isForceRunning === campaign._id ? 'animate-pulse' : ''} />
                                  </button>
                                )}
                                <button onClick={() => setCampaignToDelete(campaign._id)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all" aria-label="Delete">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-2">
              <AnimatePresence>
                {sorted.map((campaign, i) => {
                  const ss = getStatus(campaign.status);
                  return (
                    <motion.div key={campaign._id}
                      custom={i} variants={rowVariants} initial="hidden" animate="show" exit="exit"
                      onClick={() => setPanelCampaign(campaign)}
                      className="bg-[#11131A] border border-[#232734] rounded-[16px] p-4 cursor-pointer hover:border-[#232734]/80 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-[#09090B] border border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                          <Megaphone size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-sm text-white truncate">{campaign.name}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${ss.bg} ${ss.border} ${ss.text} flex-shrink-0 ml-2`}>
                              <span className={`w-1 h-1 rounded-full ${ss.dot}`} />{campaign.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mb-2">{campaign.niche || 'General'} · {campaign.leadCount || 0} leads</p>
                          <div className="flex items-center gap-3 text-[10px] font-bold">
                            <span className="text-[#10B981]">↑ {campaign.deliveryRate ?? 94}% del</span>
                            <span className="text-[#2563EB]">{campaign.openRate ?? 38}% open</span>
                            <span className="text-[#7C3AED]">{campaign.clickRate ?? 12}% click</span>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setCampaignToDelete(campaign._id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ── Bulk Actions Pill ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
              className="fixed bottom-8 left-1/2 z-40 flex items-center gap-4 bg-[#09090B]/90 backdrop-blur-xl border border-[#232734] rounded-full px-5 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-2 border-r border-[#232734] pr-4">
                <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center">{selectedIds.length}</span>
                <span className="text-sm font-bold text-[#94A3B8]">Selected</span>
              </div>
              <button className="px-4 py-1.5 text-xs font-bold bg-white text-black rounded-full hover:bg-slate-200 transition-colors">Bulk Action</button>
              <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-[#94A3B8] hover:text-white transition-colors">Clear</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Campaign Builder Modal (preserved) ───────────────────────────── */}
        <CampaignBuilderModal
          isOpen={isBuilderOpen}
          initialData={editingCampaign}
          onClose={() => { setIsBuilderOpen(false); setEditingCampaign(null); }}
          onSave={(saved: any) => {
            if (editingCampaign) setCampaigns(campaigns.map(c => c._id === saved._id ? saved : c));
            else setCampaigns([saved, ...campaigns]);
            setIsBuilderOpen(false);
            setEditingCampaign(null);
          }}
        />

        {/* ── Logs Modal (preserved) ────────────────────────────────────────── */}
        <CampaignLogsModal
          isOpen={isLogsOpen}
          campaign={logsCampaign}
          onClose={() => { setIsLogsOpen(false); setLogsCampaign(null); }}
        />

        {/* ── Campaign Slide Panel ──────────────────────────────────────────── */}
        <AnimatePresence>
          {panelCampaign && (
            <CampaignSlidePanel
              campaign={panelCampaign}
              onClose={() => setPanelCampaign(null)}
              onEdit={() => { setEditingCampaign(panelCampaign); setIsBuilderOpen(true); setPanelCampaign(null); }}
              onLogs={() => { setLogsCampaign(panelCampaign); setIsLogsOpen(true); setPanelCampaign(null); }}
              onStatusChange={handleStatusChange}
              onForceRun={handleForceRun}
              isForceRunning={isForceRunning}
            />
          )}
        </AnimatePresence>

        {/* ── Delete Confirmation Modal (preserved) ─────────────────────────── */}
        <AnimatePresence>
          {campaignToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#09090B]/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-[#11131A] border border-[#232734] rounded-[24px] shadow-2xl overflow-hidden"
              >
                <div className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] flex items-center justify-center mb-5">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">Delete Campaign?</h3>
                  <p className="text-sm font-medium text-[#94A3B8] mb-8 leading-relaxed">
                    Are you sure you want to delete this campaign? All its leads, sequence settings, and outreach logs will be permanently removed.{' '}
                    <strong className="text-[#EF4444]">This action cannot be undone.</strong>
                  </p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setCampaignToDelete(null)} disabled={isDeleting}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#94A3B8] bg-[#09090B] border border-[#232734] hover:text-white hover:bg-[#232734] transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                    <button onClick={confirmDelete} disabled={isDeleting}
                      className="px-5 py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/20 font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                      {isDeleting ? 'Deleting…' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
