'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor,
  useSensor, useSensors, useDroppable
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, LayoutGrid, List, Clock, CheckCircle, XCircle,
  MoreHorizontal, DollarSign, Calendar, Download, ArrowUpRight,
  ArrowDownRight, Briefcase, TrendingUp, X, LayoutList, StickyNote,
  Activity, ChevronDown, User, ChevronRight, Tag, Target, Loader2
} from 'lucide-react';
import { updateDeal, deleteDeal } from '@/app/actions/dealActions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Deal {
  _id: string;
  title: string;
  clientName: string;
  value: number;
  stage: 'Qualified' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  owner?: any;
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
}

type PanelTab = 'overview' | 'notes' | 'timeline';

// ─── Stage Config ─────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'Qualified',   label: 'Qualified',    color: '#2563EB', dot: 'bg-[#2563EB]',  bg: 'bg-[#2563EB]/10',  border: 'border-[#2563EB]/20',  text: 'text-[#2563EB]' },
  { id: 'Discovery',   label: 'Discovery',    color: '#7C3AED', dot: 'bg-[#7C3AED]',  bg: 'bg-[#7C3AED]/10',  border: 'border-[#7C3AED]/20',  text: 'text-[#7C3AED]' },
  { id: 'Proposal',    label: 'Proposal Sent', color: '#F59E0B', dot: 'bg-[#F59E0B]',  bg: 'bg-[#F59E0B]/10',  border: 'border-[#F59E0B]/20',  text: 'text-[#F59E0B]' },
  { id: 'Negotiation', label: 'Negotiation',  color: '#EC4899', dot: 'bg-[#EC4899]',  bg: 'bg-[#EC4899]/10',  border: 'border-[#EC4899]/20',  text: 'text-[#EC4899]' },
  { id: 'Won',         label: 'Closed Won',   color: '#10B981', dot: 'bg-[#10B981]',  bg: 'bg-[#10B981]/10',  border: 'border-[#10B981]/20',  text: 'text-[#10B981]' },
  { id: 'Lost',        label: 'Closed Lost',  color: '#EF4444', dot: 'bg-[#EF4444]',  bg: 'bg-[#EF4444]/10',  border: 'border-[#EF4444]/20',  text: 'text-[#EF4444]' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v); }
function fmtFull(v: number) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v); }
function fmtDate(d?: string) {
  if (!d) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}
function closeDateStatus(d?: string): 'overdue' | 'soon' | 'ok' | null {
  if (!d) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  const diff = (target.getTime() - now.getTime()) / 86400000;
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'soon';
  return 'ok';
}
function getInitials(name: string) { return name ? name.substring(0, 2).toUpperCase() : '??'; }

// ─── Deal Card (Sortable) ────────────────────────────────────────────────────
function SortableDealCard({ deal, isOverlay, onSelect }: { deal: Deal; isOverlay?: boolean; onSelect?: (d: Deal) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal._id,
    data: { type: 'Deal', deal }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const stage = STAGES.find(s => s.id === deal.stage);
  const dateStatus = closeDateStatus(deal.expectedCloseDate);

  const dateChipClass = {
    overdue: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20',
    soon:    'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    ok:      'text-[#94A3B8] bg-transparent border-slate-200 dark:border-[#232734]',
  }[dateStatus ?? 'ok'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onSelect?.(deal)}
      className={`group relative bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] p-4 rounded-[16px] cursor-grab active:cursor-grabbing transition-all select-none
        hover:border-[#2563EB]/40 hover:shadow-[0_0_20px_rgba(37,99,235,0.06)]
        ${isOverlay ? 'shadow-[0_20px_60px_rgba(0,0,0,0.6)] scale-[1.04] rotate-1 border-[#2563EB]/40' : ''}
      `}
    >
      {/* Stage color stripe */}
      {stage && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full" style={{ backgroundColor: stage.color }} />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2 pl-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{deal.title}</h4>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onSelect?.(deal); }}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-all flex-shrink-0"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Client */}
      <p className="text-xs text-[#94A3B8] mb-3 pl-2 truncate">{deal.clientName}</p>

      {/* Value + Close Date */}
      <div className="flex items-center justify-between gap-2 pl-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold">
          <DollarSign size={11} />
          {fmtFull(deal.value)}
        </div>
        {deal.expectedCloseDate && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold ${dateChipClass}`}>
            <Calendar size={10} />
            {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

      {/* Owner */}
      {deal.owner && (
        <div className="flex items-center gap-2 mt-3 pl-2 pt-3 border-t border-slate-200 dark:border-[#232734]">
          {deal.owner.image ? (
            <img src={deal.owner.image} alt={deal.owner.name} className="w-5 h-5 rounded-full border border-slate-200 dark:border-[#232734] flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#232734] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[8px] font-bold text-[#94A3B8] flex-shrink-0">
              {getInitials(deal.owner.name || '')}
            </div>
          )}
          <span className="text-[10px] font-semibold text-[#94A3B8] truncate">{deal.owner.name || 'Unassigned'}</span>
        </div>
      )}
    </div>
  );
}

// ─── Droppable Column ─────────────────────────────────────────────────────────
function DroppableColumn({ stage, deals, onSelectDeal }: { stage: typeof STAGES[0]; deals: Deal[]; onSelectDeal: (d: Deal) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'Column', stageId: stage.id }
  });

  const columnValue = deals.reduce((acc, d) => acc + d.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[320px] max-w-[320px] flex-shrink-0 rounded-[20px] bg-slate-50/50 dark:bg-slate-900/50 border transition-all overflow-hidden ${
        isOver ? 'border-[#2563EB]/50 shadow-[0_0_0_1px_rgba(37,99,235,0.3),0_0_30px_rgba(37,99,235,0.08)]' : 'border-slate-200 dark:border-[#232734]'
      }`}
      style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}
    >
      {/* Column Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200 dark:border-[#232734]" style={{ backgroundColor: `${stage.color}08` }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_${stage.color}80] ${stage.dot}`} />
            <span className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{stage.label}</span>
          </div>
          <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${stage.bg} ${stage.border} ${stage.text}`}>
            {deals.length}
          </div>
        </div>
        <p className="text-xs font-bold text-[#94A3B8] ml-4 opacity-80">{fmt(columnValue)}</p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <SortableContext items={deals.map(d => d._id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <SortableDealCard key={deal._id} deal={deal} onSelect={onSelectDeal} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div className={`h-24 rounded-[14px] flex flex-col items-center justify-center text-[13px] font-bold transition-all duration-300 ${
            isOver ? 'border-2 border-dashed border-[#2563EB]/60 text-[#2563EB] bg-[#2563EB]/10 shadow-[inset_0_0_20px_rgba(37,99,235,0.15)]' : 'border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500'
          }`}>
            <Plus size={16} className={`mb-1.5 ${isOver ? 'text-[#2563EB]' : 'text-[#475569]'}`} />
            {isOver ? 'Drop deal here' : 'Empty Stage'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Deal Slide Panel ─────────────────────────────────────────────────────────
function DealSlidePanel({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [tab, setTab] = useState<PanelTab>('overview');
  const stage = STAGES.find(s => s.id === deal.stage);
  const dateStatus = closeDateStatus(deal.expectedCloseDate);

  const tabs: { key: PanelTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',  label: 'Overview',  icon: LayoutList },
    { key: 'notes',     label: 'Notes',     icon: StickyNote },
    { key: 'timeline',  label: 'Timeline',  icon: Activity },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#09090B]/70 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg bg-slate-50 dark:bg-[#09090B] border-l border-slate-200 dark:border-[#232734] z-50 flex flex-col"
        role="dialog" aria-label={`Deal: ${deal.title}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Deal Details</span>
            <button onClick={onClose} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] border border-slate-200 dark:border-[#232734] transition-all" aria-label="Close">
              <X size={15} />
            </button>
          </div>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center flex-shrink-0" style={{ borderLeftColor: stage?.color, borderLeftWidth: 3 }}>
              <Briefcase size={18} className="text-[#94A3B8]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate mb-1">{deal.title}</h2>
              <p className="text-sm text-[#94A3B8] truncate">{deal.clientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {stage && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${stage.bg} ${stage.border} ${stage.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} /> {stage.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold">
              <DollarSign size={11} /> {fmtFull(deal.value)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex items-center border-b border-slate-200 dark:border-[#232734] px-6 bg-[#0D0F16]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all ${tab === t.key ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'}`}>
              <t.icon size={13} />
              {t.label}
              {tab === t.key && <motion.div layoutId="dealPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6 space-y-5">
                <div>
                  <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Deal Properties</h3>
                  <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] px-5 py-1 divide-y divide-[#232734]/60">
                    {[
                      { icon: Target,    label: 'Client',    value: deal.clientName },
                      { icon: DollarSign, label: 'Value',    value: `$${fmtFull(deal.value)}` },
                      { icon: Tag,       label: 'Stage',     value: stage?.label ?? deal.stage },
                      { icon: Calendar,  label: 'Close Date', value: fmtDate(deal.expectedCloseDate) ?? '—' },
                      { icon: User,      label: 'Owner',     value: deal.owner?.name ?? 'Unassigned' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-4 py-3">
                        <div className="flex items-center gap-2 w-24 flex-shrink-0">
                          <Icon size={13} className="text-[#94A3B8] flex-shrink-0" />
                          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">{label}</span>
                        </div>
                        <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-[#232734]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Notes</span>
                    <button className="text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 transition-colors">+ Add Note</button>
                  </div>
                  <textarea
                    className="w-full bg-transparent px-4 py-4 text-sm text-[#94A3B8] placeholder-[#94A3B8]/40 resize-none focus:outline-none leading-relaxed min-h-[180px]"
                    placeholder="Add deal notes, strategy or next steps…"
                    defaultValue={deal.notes || ''}
                  />
                </div>
              </motion.div>
            )}

            {tab === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-6">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-5">Activity Timeline</h3>
                <div className="space-y-0">
                  {[
                    { icon: CheckCircle, color: '#2563EB', title: 'Deal Created', sub: `Stage: ${stage?.label}`, time: fmtDate(deal.createdAt) },
                    ...(deal.stage !== 'Qualified' ? [{ icon: TrendingUp, color: '#7C3AED', title: 'Stage Advanced', sub: `Moved to ${stage?.label}`, time: 'Recently' }] : []),
                    ...(deal.stage === 'Won' ? [{ icon: CheckCircle, color: '#10B981', title: 'Deal Won 🎉', sub: `Value: $${fmtFull(deal.value)}`, time: fmtDate(deal.expectedCloseDate) ?? 'Recently' }] : []),
                    ...(deal.stage === 'Lost' ? [{ icon: XCircle, color: '#EF4444', title: 'Deal Lost', sub: 'Marked as lost', time: 'Recently' }] : []),
                  ].map(({ icon: Icon, color, title, sub, time }, i, arr) => (
                    <div key={title} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-[#232734] mt-1" style={{ minHeight: 20 }} />}
                      </div>
                      <div className="pb-5 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{title}</p>
                        <p className="text-xs text-[#94A3B8]">{sub}</p>
                        <p className="text-[10px] text-[#232734] font-bold mt-1">{time}</p>
                      </div>
                    </div>
                  ))}
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
export default function DealsClient({ initialDeals }: { initialDeals: Deal[] }) {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragDeal, setActiveDragDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [stageFilter, setStageFilter] = useState('All');
  const [stageDropOpen, setStageDropOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const headers = ['Deal Name', 'Client Name', 'Value', 'Stage', 'Owner', 'Expected Close Date', 'Created At'];
        const rows = deals.map(d => {
          return [
            `"${d.title.replace(/"/g, '""')}"`,
            `"${d.clientName.replace(/"/g, '""')}"`,
            d.value,
            `"${d.stage}"`,
            `"${d.owner?.name ? d.owner.name.replace(/"/g, '""') : 'Unassigned'}"`,
            `"${d.expectedCloseDate || ''}"`,
            `"${d.createdAt || ''}"`
          ].join(',');
        });
        const csvString = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'deals-export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Deals exported successfully as CSV!');
      } catch (error) {
        toast.error('Failed to export deals');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  // ── Preserved dnd-kit sensors (unchanged) ───────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Preserved filter logic (unchanged) ──────────────────────────────────────
  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (stageFilter !== 'All' && d.stage !== stageFilter) return false;
      if (!searchQuery) return true;
      const lq = searchQuery.toLowerCase();
      return d.title.toLowerCase().includes(lq) || d.clientName.toLowerCase().includes(lq);
    });
  }, [deals, searchQuery, stageFilter]);

  // ── Preserved drag handlers (unchanged logic) ────────────────────────────────
  const handleDragStart = (event: any) => {
    const { active } = event;
    const deal = deals.find(d => d._id === active.id);
    if (deal) setActiveDragDeal(deal);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragDeal(null);
    if (!over) return;

    const dealId = active.id;
    const overData = over.data.current;
    let newStage = '';

    if (overData?.type === 'Column') { newStage = overData.stageId; }
    else if (overData?.type === 'Deal') { newStage = overData.deal.stage; }

    if (newStage) {
      const activeDeal = deals.find(d => d._id === dealId);
      if (activeDeal && activeDeal.stage !== newStage) {
        setDeals(prev => prev.map(d => d._id === dealId ? { ...d, stage: newStage as any } : d));
        try {
          const res = await updateDeal(dealId, { stage: newStage });
          if (!res.success) throw new Error('Failed to update deal');
          toast.success(`Moved to ${newStage}`);
        } catch (error) {
          setDeals(deals);
          toast.error('Failed to move deal');
        }
      }
    }
  };

  // ── KPI Derivations ──────────────────────────────────────────────────────────
  const totalValue     = filteredDeals.reduce((a, d) => a + d.value, 0);
  const wonDeals       = filteredDeals.filter(d => d.stage === 'Won');
  const lostDeals      = filteredDeals.filter(d => d.stage === 'Lost');
  const winRate        = (wonDeals.length + lostDeals.length) > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
    : 0;
  const thisMonth      = new Date();
  const closingThisMonth = filteredDeals.filter(d => {
    if (!d.expectedCloseDate) return false;
    const cd = new Date(d.expectedCloseDate);
    return cd.getMonth() === thisMonth.getMonth() && cd.getFullYear() === thisMonth.getFullYear();
  }).length;

  const kpis = [
    { label: 'Total Deals',       value: filteredDeals.length, color: '#2563EB', trend: '+3',  up: true },
    { label: 'Pipeline Value',    value: fmt(totalValue),      color: '#10B981', trend: '+8%', up: true },
    { label: 'Won',               value: wonDeals.length,      color: '#10B981', trend: '+1',  up: true },
    { label: 'Lost',              value: lostDeals.length,     color: '#EF4444', trend: '-1',  up: false },
    { label: 'Closing This Month',value: closingThisMonth,     color: '#F59E0B', trend: String(closingThisMonth), up: true },
    { label: 'Win Rate',          value: `${winRate}%`,        color: '#7C3AED', trend: '+2%', up: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1800px] mx-auto">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-6">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Briefcase size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Sales Pipeline</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Deals</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Track opportunities from first contact to closed revenue.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={handleExport} disabled={isExporting} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-[#11131A] text-[#94A3B8] border border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50">
                {isExporting ? <Loader2 size={15} className="animate-spin text-[#2563EB]" /> : <Download size={15} />}
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
              <button onClick={() => router.push('/prospects')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> New Deal
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            {kpis.map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="relative bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-5 group transition-all overflow-hidden cursor-default"
              >
                {/* Background Icon */}
                <div className="absolute -right-2 -bottom-4 opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                  {k.label === 'Total Deals' && <Briefcase size={90} style={{ color: k.color }} />}
                  {k.label === 'Pipeline Value' && <DollarSign size={90} style={{ color: k.color }} />}
                  {k.label === 'Won' && <Target size={90} style={{ color: k.color }} />}
                  {k.label === 'Lost' && <XCircle size={90} style={{ color: k.color }} />}
                  {k.label === 'Closing This Month' && <Calendar size={90} style={{ color: k.color }} />}
                  {k.label === 'Win Rate' && <TrendingUp size={90} style={{ color: k.color }} />}
                </div>

                <div className="relative z-10 flex items-start justify-between mb-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-tight">{k.label}</p>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${k.up ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                    {k.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {k.trend}
                  </span>
                </div>
                <p className="relative z-10 text-3xl font-bold font-mono tracking-tight" style={{ color: k.color }}>{k.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Filter + View Bar ─────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm group">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search deals, clients…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white placeholder-[#94A3B8]/60 text-sm font-medium rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-200 dark:bg-[#232734] flex items-center justify-center text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Stage Filter Dropdown */}
            <div className="relative">
              <button onClick={() => setStageDropOpen(p => !p)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${stageFilter !== 'All' ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30' : 'bg-white dark:bg-[#11131A] text-[#94A3B8] border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white'}`}>
                {stageFilter === 'All' ? 'All Stages' : stageFilter}
                <ChevronDown size={11} className={`transition-transform ${stageDropOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {stageDropOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setStageDropOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute top-full left-0 mt-2 z-40 min-w-[160px] bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[14px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                      {['All', ...STAGES.map(s => s.id)].map(opt => (
                        <button key={opt} onClick={() => { setStageFilter(opt); setStageDropOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${stageFilter === opt ? 'text-[#2563EB] bg-[#2563EB]/10' : 'text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734]'}`}>
                          {opt !== 'All' && <span className={`w-1.5 h-1.5 rounded-full ${STAGES.find(s => s.id === opt)?.dot}`} />}
                          {opt === 'All' ? 'All Stages' : STAGES.find(s => s.id === opt)?.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 hidden md:block" />

            {/* Deal count */}
            <div className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl">
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{filteredDeals.length}</span>
              <span className="text-xs font-semibold text-[#94A3B8]">deals</span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl p-1">
              <button onClick={() => setViewMode('kanban')}
                className={`relative p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8] hover:text-[#94A3B8]/80'}`}
                aria-label="Kanban view">
                {viewMode === 'kanban' && <motion.div layoutId="dealViewMode" className="absolute inset-0 bg-slate-200 dark:bg-[#232734] rounded-lg -z-10 border border-slate-200 dark:border-white/5" />}
                <LayoutGrid size={15} />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`relative p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8] hover:text-[#94A3B8]/80'}`}
                aria-label="List view">
                {viewMode === 'list' && <motion.div layoutId="dealViewMode" className="absolute inset-0 bg-slate-200 dark:bg-[#232734] rounded-lg -z-10 border border-slate-200 dark:border-white/5" />}
                <List size={15} />
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        {viewMode === 'kanban' ? (

          /* ─ Kanban Board ─────────────────────────────────────────────────── */
          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <div className="flex gap-4 w-max min-w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {STAGES.map(stage => (
                  <DroppableColumn
                    key={stage.id}
                    stage={stage}
                    deals={filteredDeals.filter(d => d.stage === stage.id)}
                    onSelectDeal={setSelectedDeal}
                  />
                ))}
                <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
                  {activeDragDeal ? <SortableDealCard deal={activeDragDeal} isOverlay /> : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>

        ) : (

          /* ─ Table View ───────────────────────────────────────────────────── */
          <div className="overflow-hidden rounded-[20px] border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/50">
                  <tr className="border-b border-slate-200 dark:border-[#232734]">
                    <th className="pl-5 pr-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest min-w-[220px]">Deal</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest min-w-[160px]">Client</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest min-w-[100px]">Value</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest min-w-[130px]">Stage</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest min-w-[140px]">Owner</th>
                    <th className="pr-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest min-w-[120px]">Close Date</th>
                    <th className="pr-5 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-[#94A3B8]">
                          <div className="w-14 h-14 rounded-[16px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center">
                            <Briefcase size={22} className="text-[#232734]" />
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">No deals found</p>
                          <p className="text-xs">Try adjusting your search or stage filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filteredDeals.map((deal, i) => {
                        const stage = STAGES.find(s => s.id === deal.stage);
                        const dateStatus = closeDateStatus(deal.expectedCloseDate);
                        const dateClass = { overdue: 'text-[#EF4444]', soon: 'text-[#F59E0B]', ok: 'text-[#94A3B8]' }[dateStatus ?? 'ok'];
                        return (
                          <motion.tr key={deal._id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.03, type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={() => setSelectedDeal(deal)}
                            className="border-b border-[#232734]/60 cursor-pointer group hover:bg-white/80 dark:bg-[#09090B]/80 transition-colors"
                          >
                            <td className="pl-5 pr-4 py-4">
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{deal.title}</p>
                            </td>
                            <td className="pr-4 py-4">
                              <p className="text-sm text-[#94A3B8] truncate max-w-[150px]">{deal.clientName}</p>
                            </td>
                            <td className="pr-4 py-4">
                              <span className="text-sm font-bold text-[#10B981] font-mono">${fmtFull(deal.value)}</span>
                            </td>
                            <td className="pr-4 py-4">
                              {stage && (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${stage.bg} ${stage.border} ${stage.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                                  {stage.label}
                                </span>
                              )}
                            </td>
                            <td className="pr-4 py-4">
                              {deal.owner ? (
                                <div className="flex items-center gap-2">
                                  {deal.owner.image
                                    ? <img src={deal.owner.image} alt="" className="w-6 h-6 rounded-full border border-slate-200 dark:border-[#232734]" />
                                    : <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#232734] flex items-center justify-center text-[9px] font-bold text-[#94A3B8]">{getInitials(deal.owner.name || '')}</div>
                                  }
                                  <span className="text-xs text-[#94A3B8]">{deal.owner.name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-[#232734] italic">Unassigned</span>
                              )}
                            </td>
                            <td className="pr-4 py-4">
                              <div className={`flex items-center gap-1.5 text-xs font-medium ${dateClass}`}>
                                <Calendar size={12} />
                                {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </div>
                            </td>
                            <td className="pr-5 py-4">
                              <button
                                onClick={e => { e.stopPropagation(); setSelectedDeal(deal); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] transition-all"
                                aria-label="View deal"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Deal Slide Panel ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedDeal && (
            <DealSlidePanel deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
