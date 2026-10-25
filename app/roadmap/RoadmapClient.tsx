'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Plus, Search, Filter, Loader2, PlayCircle, Clock, FileText, CheckCircle,
  Columns, AlignLeft, X, Trash2, Calendar, Target, LayoutList,
  ChevronDown, ChevronRight, Layers, Check, Sparkles, Flame, Zap, TrendingUp,
  Activity, RotateCcw, AlertCircle, ArrowUpRight, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import { useScrollLock } from '@/lib/useScrollLock';

import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent, DragOverEvent, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { 
  createRoadmapProject, updateProjectStatus, updateRoadmapProject, deleteRoadmapProject,
  addProjectLog, toggleLogCompletion, deleteProjectLog, resetRoadmapToCurated
} from '@/app/actions/roadmapActions';
import { roadmapData } from './data';

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface RoadmapLog {
  _id?: string;
  text: string;
  date?: string | Date;
  completed: boolean;
}

export interface RoadmapProject {
  _id: string;
  title: string;
  category: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  logs: RoadmapLog[];
  orderIndex?: number;
  quarter?: string;
  tag?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RoadmapClientProps {
  initialProjects: RoadmapProject[];
}

type ViewMode = 'timeline' | 'kanban' | 'gantt';

// ─── Status Colors & Config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string; icon: React.ElementType }> = {
  'Planning':    { color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/25', glow: '#00E5FF', icon: Compass },
  'In Progress': { color: 'text-[#6324FC] dark:text-[#a78bfa]', bg: 'bg-[#6324FC]/10', border: 'border-[#6324FC]/25', glow: '#6324FC', icon: PlayCircle },
  'Completed':   { color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', glow: '#10B981', icon: CheckCircle2 },
  'On Hold':     { color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', glow: '#F59E0B', icon: Clock },
};

function getStatusConfig(s: string) { 
  return STATUS_CONFIG[s] ?? STATUS_CONFIG['Planning']; 
}

const STATUSES: Array<'Planning' | 'In Progress' | 'Completed' | 'On Hold'> = [
  'Planning', 'In Progress', 'Completed', 'On Hold'
];

const CURATED_CATEGORIES = [
  'Core ERP & Operating System',
  'AI Copilots & Automation Engines',
  'Healthcare & Clinic SaaS Ecosystem',
  'Education & Digital Ecosystems',
  'Mobile & Cross-Platform Suite'
];

const getProgress = (logs?: RoadmapLog[]) => {
  if (!logs || logs.length === 0) return 0;
  return Math.round((logs.filter(l => l.completed).length / logs.length) * 100);
};

// ─── DropdownPortal Component (Zero Clipping) ─────────────────────────────────
interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
}

function DropdownPortal({
  isOpen,
  onClose,
  triggerRef,
  children,
  minWidth = 180,
  className = '',
}: DropdownPortalProps) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    placement: 'top' | 'bottom';
  }>({
    left: 0,
    width: minWidth,
    placement: 'bottom',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 260;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'top' | 'bottom' = 'bottom';
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      placement = 'top';
    }

    const targetWidth = Math.max(minWidth, rect.width);
    let left = rect.left;
    if (left + targetWidth > viewportWidth - 12) {
      left = rect.right - targetWidth;
    }
    left = Math.max(12, Math.min(left, viewportWidth - targetWidth - 12));

    if (placement === 'top') {
      setCoords({
        bottom: viewportHeight - rect.top + 6,
        left,
        width: targetWidth,
        placement: 'top',
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        width: targetWidth,
        placement: 'bottom',
      });
    }
  }, [minWidth, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, updatePosition, triggerRef]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: coords.top !== undefined ? `${coords.top}px` : 'auto',
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 999999,
      }}
      className={`animate-in fade-in-0 zoom-in-95 duration-150 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}

// ─── PortalSelect Component ───────────────────────────────────────────────────
interface PortalSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface PortalSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: PortalSelectOption[];
  labelPrefix?: string;
  minWidth?: number;
  className?: string;
  size?: 'sm' | 'md';
}

function PortalSelect({
  value,
  onChange,
  options,
  labelPrefix,
  minWidth = 160,
  className = '',
  size = 'md',
}: PortalSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOpt = options.find((o) => o.value === value) || options[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#060608] hover:border-[#6324FC]/60 dark:hover:border-white/25 transition-all outline-none select-none ${
          size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-xs'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOpt?.color && (
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{
                backgroundColor: selectedOpt.color,
                boxShadow: `0 0 8px ${selectedOpt.color}`,
              }}
            />
          )}
          {labelPrefix && <span className="text-secondary font-normal shrink-0">{labelPrefix}:</span>}
          <span className="font-heading font-semibold text-slate-900 dark:text-white truncate">
            {selectedOpt?.label || value}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={`text-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#6324FC] dark:text-[#00E5FF]' : ''}`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={minWidth}
        className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0c0d14] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        {labelPrefix && (
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-secondary border-b border-black/5 dark:border-white/5 mb-1">
            Select {labelPrefix}
          </div>
        )}
        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.color ? (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: opt.color,
                        boxShadow: isSelected ? `0 0 8px ${opt.color}` : undefined,
                      }}
                    />
                  ) : null}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check size={13} className="shrink-0 text-[#6324FC] dark:text-[#00E5FF]" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </>
  );
}

// ─── Kanban Components ────────────────────────────────────────────────────────
function DroppableColumn({ 
  id, 
  title, 
  items, 
  onCardClick 
}: { 
  id: string; 
  title: string; 
  items: RoadmapProject[]; 
  onCardClick: (p: RoadmapProject) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const conf = getStatusConfig(title);
  const Icon = conf.icon;
  
  return (
    <div className="flex flex-col w-[310px] flex-shrink-0 bg-slate-100/60 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
      <div className={`p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0a0a0d] ${isOver ? 'bg-[#6324FC]/10' : ''} transition-colors`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${conf.bg} ${conf.border} border flex items-center justify-center ${conf.color}`}>
            <Icon size={15} />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">{title}</h3>
            <span className="text-[10px] font-mono text-secondary">{items.length} milestone{items.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <span 
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: conf.glow, boxShadow: `0 0 8px ${conf.glow}` }}
        />
      </div>
      
      <div ref={setNodeRef} className={`p-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[350px] transition-colors ${isOver ? 'bg-[#6324FC]/5' : ''}`}>
        <SortableContext id={id} items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(p => <SortableRoadmapCard key={p._id} project={p} onClick={() => onCardClick(p)} />)}
        </SortableContext>
        {items.length === 0 && (
          <div className={`h-[120px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-xs font-heading font-bold transition-all ${isOver ? 'border-[#6324FC]/40 bg-[#6324FC]/10 text-[#6324FC]' : 'border-black/10 dark:border-white/10 text-secondary'}`}>
            <span>{isOver ? 'Release to Move Here' : 'No Milestones in this Phase'}</span>
            <span className="text-[10px] font-normal opacity-70 mt-0.5">Drag a project card here</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableRoadmapCard({ project, onClick }: { project: RoadmapProject; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project._id, data: project });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  
  const prog = getProgress(project.logs);
  const conf = getStatusConfig(project.status);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      onClick={() => {
        if (!isDragging && onClick) onClick();
      }}
      className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all shadow-sm relative overflow-hidden group hover:shadow-md"
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1" 
        style={{ backgroundColor: conf.glow }}
      />
      
      <div className="flex justify-between items-start mb-2 pl-2">
        <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
          {project.title}
        </h4>
      </div>

      <div className="flex items-center gap-1.5 pl-2 mb-3 flex-wrap">
        <span className="text-[9px] font-heading font-bold text-secondary uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5">
          {project.category}
        </span>
        {project.quarter && (
          <span className="text-[9px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 px-2 py-0.5 rounded-md border border-[#6324FC]/20">
            {project.quarter}
          </span>
        )}
      </div>

      <div className="pl-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-heading font-bold text-secondary uppercase flex items-center gap-1">
            <LayoutList size={10} /> Checklist ({project.logs?.filter(l => l.completed).length || 0}/{project.logs?.length || 0})
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">{prog}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${prog === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#6324FC] to-[#00E5FF]'}`} 
            style={{ width: `${prog}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main RoadmapClient ───────────────────────────────────────────────────────
export default function RoadmapClient({ initialProjects }: RoadmapClientProps) {
  const router = useRouter();
  const { confirm } = useConfirm();

  const [projects, setProjects] = useState<RoadmapProject[]>(initialProjects || []);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Expanded Epics state for timeline accordion
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    CURATED_CATEGORIES.forEach(c => { init[c] = true; });
    return init;
  });

  // Modal / Drawer state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RoadmapProject | null>(null);
  useScrollLock(isAddOpen || !!selectedProject);

  const [formData, setFormData] = useState({
    title: '',
    category: CURATED_CATEGORIES[0],
    status: 'Planning' as 'Planning' | 'In Progress' | 'On Hold' | 'Completed',
    quarter: 'Q2 2026',
    tag: 'Core Architecture',
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [newLogText, setNewLogText] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // DnD state
  const [activeDragProject, setActiveDragProject] = useState<RoadmapProject | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // ─── Derived Statistics ─────────────────────────────────────────────────────
  const activeCount = useMemo(() => projects.filter(p => p.status === 'In Progress').length, [projects]);
  const compCount = useMemo(() => projects.filter(p => p.status === 'Completed').length, [projects]);
  const planningCount = useMemo(() => projects.filter(p => p.status === 'Planning').length, [projects]);
  const holdCount = useMemo(() => projects.filter(p => p.status === 'On Hold').length, [projects]);

  const totalTasks = useMemo(() => projects.reduce((acc, p) => acc + (p.logs?.length || 0), 0), [projects]);
  const completedTasks = useMemo(() => projects.reduce((acc, p) => acc + (p.logs?.filter(l => l.completed).length || 0), 0), [projects]);
  const overallProg = totalTasks === 0 
    ? (projects.length > 0 ? Math.round((compCount / projects.length) * 100) : 0) 
    : Math.round((completedTasks / totalTasks) * 100);

  // Categories list
  const allCategories = useMemo(() => {
    const set = new Set<string>(CURATED_CATEGORIES);
    projects.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [projects]);

  const categoryFilterOptions: PortalSelectOption[] = useMemo(() => [
    { value: 'All', label: 'All Ecosystems' },
    ...allCategories.map(c => ({ value: c, label: c }))
  ], [allCategories]);

  const statusFilterOptions: PortalSelectOption[] = [
    { value: 'All', label: 'All Phases' },
    { value: 'In Progress', label: 'In Progress Active', color: '#6324FC' },
    { value: 'Planning', label: 'In Planning Phase', color: '#00E5FF' },
    { value: 'Completed', label: 'Completed Deployed', color: '#10B981' },
    { value: 'On Hold', label: 'On Hold Backlog', color: '#F59E0B' },
  ];

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const tagMatch = (p.tag || '').toLowerCase().includes(q);
        if (!titleMatch && !catMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [projects, statusFilter, categoryFilter, searchQuery]);

  // Grouped by Category for Timeline
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, RoadmapProject[]> = {};
    filteredProjects.forEach(p => {
      const cat = p.category || 'Other Systems';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return Object.entries(groups);
  }, [filteredProjects]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || isSubmittingAdd) return;

    setIsSubmittingAdd(true);
    try {
      const res = await createRoadmapProject({
        title: formData.title.trim(),
        category: formData.category,
        status: formData.status,
      });

      if (res.success && res.data) {
        const newProj: RoadmapProject = {
          ...res.data,
          quarter: formData.quarter,
          tag: formData.tag,
        };
        setProjects(prev => [newProj, ...prev]);
        toast.success('Product milestone logged to roadmap!');
        setIsAddOpen(false);
        setFormData({
          title: '',
          category: CURATED_CATEGORIES[0],
          status: 'Planning',
          quarter: 'Q2 2026',
          tag: 'Core Architecture',
        });
      } else {
        toast.error(res.error || 'Failed to create milestone');
      }
    } catch {
      toast.error('Network error creating milestone');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const ok = await confirm({
      title: 'Delete Milestone?',
      message: 'Are you sure you want to remove this milestone and its checklist tasks from the roadmap?',
      confirmText: 'Delete Milestone',
      variant: 'danger',
    });

    if (!ok) return;

    setProjects(prev => prev.filter(p => p._id !== projectId));
    if (selectedProject?._id === projectId) setSelectedProject(null);
    toast.success('Milestone removed');

    try {
      await deleteRoadmapProject(projectId);
    } catch {
      toast.error('Failed to sync deletion with database');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim() || !selectedProject || isAddingLog) return;

    const textToAdd = newLogText.trim();
    setNewLogText('');
    setIsAddingLog(true);

    const tempLogId = `templog_${Date.now()}`;
    const optimisticLog: RoadmapLog = {
      _id: tempLogId,
      text: textToAdd,
      completed: false,
      date: new Date().toISOString(),
    };

    const updateProjectLogs = (proj: RoadmapProject): RoadmapProject => ({
      ...proj,
      logs: [...(proj.logs || []), optimisticLog],
    });

    setSelectedProject(prev => prev ? updateProjectLogs(prev) : null);
    setProjects(prev => prev.map(p => p._id === selectedProject._id ? updateProjectLogs(p) : p));

    try {
      const res = await addProjectLog(selectedProject._id, textToAdd);
      if (res.success && res.data) {
        setSelectedProject(res.data);
        setProjects(prev => prev.map(p => p._id === res.data._id ? res.data : p));
        toast.success('Checklist task added!');
      } else {
        toast.error(res.error || 'Failed to add task');
      }
    } catch {
      toast.error('Network error adding task');
    } finally {
      setIsAddingLog(false);
    }
  };

  const handleToggleLog = async (logId?: string, currentCompleted?: boolean) => {
    if (!selectedProject || !logId) return;

    const nextCompleted = !currentCompleted;

    const updateProjectLogs = (proj: RoadmapProject): RoadmapProject => ({
      ...proj,
      logs: proj.logs.map(l => l._id === logId ? { ...l, completed: nextCompleted } : l),
    });

    setSelectedProject(prev => prev ? updateProjectLogs(prev) : null);
    setProjects(prev => prev.map(p => p._id === selectedProject._id ? updateProjectLogs(p) : p));

    try {
      await toggleLogCompletion(selectedProject._id, logId, nextCompleted);
    } catch {
      toast.error('Failed to sync checklist task status');
    }
  };

  const handleDeleteLog = async (logId?: string) => {
    if (!selectedProject || !logId) return;

    const updateProjectLogs = (proj: RoadmapProject): RoadmapProject => ({
      ...proj,
      logs: proj.logs.filter(l => l._id !== logId),
    });

    setSelectedProject(prev => prev ? updateProjectLogs(prev) : null);
    setProjects(prev => prev.map(p => p._id === selectedProject._id ? updateProjectLogs(p) : p));

    try {
      await deleteProjectLog(selectedProject._id, logId);
      toast.success('Checklist task removed');
    } catch {
      toast.error('Failed to delete task from server');
    }
  };

  const handleResetCurated = async () => {
    const ok = await confirm({
      title: 'Reset to Official Injaazh Product Roadmap?',
      message: 'This will reset the database to the curated master SaaS & Product Ecosystem (17 core deliverables with full checklist logs). Any custom milestones will be replaced.',
      confirmText: 'Restore Curated Roadmap',
      variant: 'danger',
    });

    if (!ok) return;

    setIsResetting(true);
    toast.loading('Seeding official Injaazh Product Roadmap...', { id: 'reset-roadmap' });

    try {
      const res = await resetRoadmapToCurated();
      if (res.success) {
        toast.success('Roadmap successfully restored to Official Curated Master Plan!', { id: 'reset-roadmap' });
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to restore roadmap', { id: 'reset-roadmap' });
      }
    } catch {
      toast.error('Network error restoring roadmap', { id: 'reset-roadmap' });
    } finally {
      setIsResetting(false);
    }
  };

  // ─── DnD Handlers ───────────────────────────────────────────────────────────
  const onDragStart = (e: DragStartEvent) => {
    const proj = projects.find(p => p._id === e.active.id);
    if (proj) setActiveDragProject(proj);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeProj = projects.find(p => p._id === activeId);
    if (!activeProj) return;

    let targetStatus: 'Planning' | 'In Progress' | 'Completed' | 'On Hold' | null = null;
    if (STATUSES.includes(overId as any)) {
      targetStatus = overId as any;
    } else {
      const overProj = projects.find(p => p._id === overId);
      if (overProj) targetStatus = overProj.status;
    }

    if (targetStatus && activeProj.status !== targetStatus) {
      setProjects(prev => prev.map(p => p._id === activeId ? { ...p, status: targetStatus! } : p));
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveDragProject(null);
    const { active, over } = e;
    if (!over) return;
    const activeProj = projects.find(p => p._id === active.id);
    if (activeProj) {
      await updateProjectStatus(activeProj._id, activeProj.status);
      toast.success(`Milestone moved to ${activeProj.status}`);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 pt-6 pb-24 font-sans selection:bg-[#6324FC] selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00E5FF]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 relative z-10">

        {/* ========================================================================= */}
        {/* EXECUTIVE SUITE HEADER (STANDARDIZED WITH DASHBOARD, /PROJECTS, /TASKS) */}
        {/* ========================================================================= */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 md:p-6 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm relative overflow-hidden"
        >
          {/* Header Left: Glowing Badge & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-heading font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#6324FC] dark:shadow-[0_0_8px_#00E5FF]" />
                INJAAZH GLOBAL OS // PRODUCT & ARCHITECTURE ROADMAP SUITE
              </div>
              <span className="text-xs font-sans text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Roadmap &amp; Release Engine
            </h1>
            <p className="text-xs sm:text-sm font-sans text-secondary mt-1 max-w-2xl">
              Plan milestones, quarterly sprints, SaaS architecture, and software deployments across the Injaazh ecosystem.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Command shortcut button */}
            <button 
              type="button"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all group"
            >
              <Search size={14} className="group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors" />
              <span>Command</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[10px] font-mono text-secondary">⌘K</kbd>
            </button>

            {/* AI Copilot Dispatch */}
            <button 
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { initialPrompt: 'Review our Injaazh product roadmap, quarterly milestones, and current in-progress releases' } }))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-sm"
            >
              <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* Restore / Seed Curated Roadmap */}
            <button
              type="button"
              onClick={handleResetCurated}
              disabled={isResetting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all shadow-sm"
              title="Restore official curated Injaazh Product Roadmap master plan"
            >
              <RotateCcw size={13} className={isResetting ? 'animate-spin' : ''} />
              <span>Master Plan</span>
            </button>

            {/* + New Milestone Laser Beam CTA */}
            <button 
              type="button"
              onClick={() => {
                setFormData({
                  title: '',
                  category: CURATED_CATEGORIES[0],
                  status: 'Planning',
                  quarter: 'Q2 2026',
                  tag: 'Core Architecture',
                });
                setIsAddOpen(true);
              }}
              className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
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
              <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                <Target size={14} className="text-[#00E5FF] group-hover:rotate-6 group-hover:scale-110 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + New Milestone
                </span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* EXECUTIVE WORK TELEMETRY KPI CARDS (DASHBOARD MATCHING 6-GRID) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2.5">
              <Activity size={16} className="text-[#6324FC]" /> Product Architecture Telemetry
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span>Live Roadmap Connected</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            {/* Card 1: Total Milestones */}
            <div 
              onClick={() => { setStatusFilter('All'); setCategoryFilter('All'); }}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#F59E0B]/60 hover:shadow-[0_16px_36px_rgba(245,158,11,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#F59E0B]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] group-hover:border-[#F59E0B] transition-all duration-300 shadow-sm">
                  <Flame size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                  Ecosystem
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Total Milestones</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#F59E0B] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#F59E0B] transition-all">
                  {projects.length}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Across {allCategories.length} product suites
                </p>
              </div>
            </div>

            {/* Card 2: Active Sprints */}
            <div 
              onClick={() => setStatusFilter('In Progress')}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#a78bfa] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300 shadow-sm">
                  <Zap size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#a78bfa] bg-[#6324FC]/10 px-2.5 py-1 rounded-lg border border-[#6324FC]/20 group-hover:border-[#6324FC]/40 transition-colors">
                  In Flight
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Active Sprints</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#6324FC] transition-all">
                  {activeCount}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Actively under development
                </p>
              </div>
            </div>

            {/* Card 3: Completed Releases */}
            <div 
              onClick={() => setStatusFilter('Completed')}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#10B981]/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#10B981]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-[#10B981] transition-all duration-300 shadow-sm">
                  <CheckCircle2 size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  Shipped
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Completed Releases</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#10B981] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#10B981] transition-all">
                  {compCount}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Production ready &amp; live
                </p>
              </div>
            </div>

            {/* Card 4: Planning Queue */}
            <div 
              onClick={() => setStatusFilter('Planning')}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
                  <Compass size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-cyan-600 dark:text-[#00E5FF] bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                  Blueprint
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Planning Queue</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-cyan-600 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {planningCount}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Architecture &amp; specs stage
                </p>
              </div>
            </div>

            {/* Card 5: On Hold / Backlog */}
            <div 
              onClick={() => setStatusFilter('On Hold')}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-violet-500/60 hover:shadow-[0_16px_36px_rgba(139,92,246,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-violet-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-violet-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#8B5CF6]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] group-hover:border-violet-400 transition-all duration-300 shadow-sm">
                  <Clock size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
                  Future
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">On Hold / Future</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-violet-600 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-violet-400 transition-all">
                  {holdCount}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Scheduled for future quarters
                </p>
              </div>
            </div>

            {/* Card 6: Overall Execution Rate */}
            <div 
              onClick={() => { setStatusFilter('All'); setCategoryFilter('All'); }}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#EC4899]/60 hover:shadow-[0_16px_36px_rgba(236,72,153,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#EC4899]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#EC4899] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#EC4899]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-500 dark:text-[#EC4899] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] group-hover:border-[#EC4899] transition-all duration-300 shadow-sm">
                  <TrendingUp size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-pink-500 dark:text-[#EC4899] bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20 group-hover:border-pink-500/40 transition-colors">
                  Delivery
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Execution Velocity</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#EC4899] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#EC4899] transition-all">
                  {overallProg}%
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  {completedTasks}/{totalTasks} checklist items delivered
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* VIEW SELECTOR & MAIN CONTROLS TOOLBAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-2 bg-slate-200/50 dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl shadow-sm">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#060608] rounded-xl border border-black/5 dark:border-white/5 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                viewMode === 'timeline'
                  ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.4)]'
                  : 'text-secondary hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target size={14} />
              <span>Timeline Roadmap</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                viewMode === 'kanban'
                  ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.4)]'
                  : 'text-secondary hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns size={14} />
              <span>Kanban Sprint Board</span>
            </button>

            <button
              onClick={() => setViewMode('gantt')}
              className={`px-4 py-2 rounded-lg text-xs font-heading font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                viewMode === 'gantt'
                  ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.4)]'
                  : 'text-secondary hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlignLeft size={14} />
              <span>List &amp; Execution Audit</span>
            </button>
          </div>

          {/* Search & Portal Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 xl:justify-end">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search milestones, tags, systems..."
                className="w-full bg-white dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Portal Filter */}
            <PortalSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={categoryFilterOptions}
              labelPrefix="Ecosystem"
              minWidth={220}
              size="sm"
            />

            {/* Status Portal Filter */}
            <PortalSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusFilterOptions}
              labelPrefix="Phase"
              minWidth={170}
              size="sm"
            />

            {/* Reset Filters */}
            {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-heading font-semibold transition-colors flex items-center gap-1.5"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN VIEW CONTENT */}
        {/* ========================================================================= */}
        {filteredProjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="py-20 flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0d] border border-dashed border-black/10 dark:border-white/10 rounded-3xl p-6 text-center shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] mb-3">
              <Compass size={22} />
            </div>
            <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white mb-1">No Matching Milestones</h3>
            <p className="text-xs text-secondary max-w-sm mb-5 leading-relaxed">
              No product milestones match your search query or filter. Try clearing filters or create a new milestone.
            </p>
            <div className="flex items-center gap-3">
              {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setCategoryFilter('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-heading font-bold transition-all"
                >
                  Clear Filters
                </button>
              )}
              <button 
                onClick={() => setIsAddOpen(true)} 
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] text-white text-xs font-heading font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)]"
              >
                <Plus size={14} /> New Milestone
              </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* ── View 1: Timeline (Roadmap) View ── */}
            {viewMode === 'timeline' && (
              <motion.div 
                key="timeline" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="space-y-6 pb-8"
              >
                {groupedByCategory.map(([category, items]) => {
                  const isExpanded = !!expandedEpics[category];
                  
                  const totalLogs = items.reduce((acc, p) => acc + (p.logs?.length || 0), 0);
                  const compLogs = items.reduce((acc, p) => acc + (p.logs?.filter(l => l.completed).length || 0), 0);
                  const epicProg = totalLogs === 0 ? 0 : Math.round((compLogs / totalLogs) * 100);

                  return (
                    <div 
                      key={category} 
                      className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm transition-all"
                    >
                      {/* Epic Header Accordion Bar */}
                      <div 
                        className={`relative px-5 py-4 flex items-center justify-between cursor-pointer transition-colors group overflow-hidden ${
                          isExpanded ? 'bg-slate-50 dark:bg-[#060608] border-b border-black/5 dark:border-white/5' : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
                        }`}
                        onClick={() => setExpandedEpics(prev => ({ ...prev, [category]: !prev[category] }))}
                      >
                        <div className="relative flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
                            isExpanded 
                              ? 'bg-[#6324FC] text-white shadow-[0_0_15px_rgba(99,36,252,0.5)]' 
                              : 'bg-slate-100 dark:bg-white/5 text-secondary group-hover:text-[#6324FC]'
                          }`}>
                            <Layers size={16} />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                              <span>{category}</span>
                              <span className="text-secondary normal-case font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5">
                                {items.length} milestone{items.length === 1 ? '' : 's'}
                              </span>
                            </h3>
                          </div>
                        </div>

                        <div className="relative flex items-center gap-4">
                          {/* Epic Progress Bar */}
                          <div className="hidden sm:flex items-center gap-2.5 w-36">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                              <div 
                                className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full transition-all duration-500" 
                                style={{ width: `${epicProg}%` }} 
                              />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-secondary">{epicProg}%</span>
                          </div>

                          <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-secondary group-hover:bg-slate-100 dark:group-hover:bg-white/5'}`}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </div>
                      </div>
                      
                      {/* Accordion Body with Timeline Node Spine */}
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="p-5 sm:p-6"
                        >
                          <div className="relative border-l-2 border-black/10 dark:border-white/10 ml-3 space-y-4">
                            {items.map(p => {
                              const ss = getStatusConfig(p.status);
                              const prog = getProgress(p.logs);
                              
                              const isPulse = p.status === 'In Progress';
                              const isCompleted = p.status === 'Completed';
                              const nodeColor = isCompleted 
                                ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]' 
                                : isPulse 
                                ? 'bg-[#6324FC] border-[#6324FC] shadow-[0_0_15px_rgba(99,36,252,0.9)]' 
                                : 'bg-slate-50 dark:bg-[#060608] border-secondary';

                              return (
                                <div 
                                  key={p._id} 
                                  className="relative pl-6 group cursor-pointer" 
                                  onClick={() => setSelectedProject(p)}
                                >
                                  {/* Glowing Timeline Spine Node */}
                                  <div className="absolute -left-[7px] top-3.5 flex items-center justify-center">
                                    {isPulse && <div className="absolute w-4 h-4 rounded-full bg-[#6324FC]/40 animate-ping" />}
                                    <div className={`relative w-3 h-3 rounded-full border-2 transition-colors ${nodeColor}`} />
                                  </div>
                                  
                                  {/* Milestone Card */}
                                  <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-5 hover:border-[#6324FC]/50 hover:shadow-md transition-all relative overflow-hidden group">
                                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[9px] font-heading font-bold uppercase tracking-wider ${ss.bg} ${ss.border} ${ss.color}`}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.glow }} />
                                            {p.status}
                                          </span>
                                          {p.quarter && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[9px] font-mono font-bold">
                                              <Calendar size={10} /> {p.quarter}
                                            </span>
                                          )}
                                          {p.tag && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-secondary border border-black/5 dark:border-white/5 text-[9px] font-bold">
                                              <Target size={10} /> {p.tag}
                                            </span>
                                          )}
                                        </div>

                                        <h4 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors leading-snug">
                                          {p.title}
                                        </h4>
                                        
                                        <p className="text-[11px] text-secondary mt-1.5 flex items-center gap-3 font-mono">
                                          <span className="flex items-center gap-1">
                                            <LayoutList size={12} className="text-[#6324FC] dark:text-[#00E5FF]" /> 
                                            {p.logs?.length || 0} checklist deliverables
                                          </span>
                                          {p.logs && p.logs.length > 0 && (
                                            <span className="text-emerald-500 font-semibold">
                                              • {p.logs.filter(l => l.completed).length} delivered
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      
                                      {/* Right Progress & Quick Actions */}
                                      <div className="w-full lg:w-48 shrink-0 flex flex-col lg:items-end gap-2">
                                        <div className="flex items-center justify-between w-full mb-0.5">
                                          <span className="text-[10px] font-heading font-bold text-secondary uppercase">Progress</span>
                                          <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{prog}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-gradient-to-r from-[#6324FC] to-[#00E5FF]'}`} 
                                            style={{ width: `${prog}%` }} 
                                          />
                                        </div>
                                        <span className="text-[10px] text-secondary font-sans group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center gap-1">
                                          <span>Click to manage tasks</span>
                                          <ArrowUpRight size={11} />
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── View 2: Kanban Sprint Board View ── */}
            {viewMode === 'kanban' && (
              <motion.div 
                key="kanban" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="h-full pb-8"
              >
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCorners} 
                  onDragStart={onDragStart} 
                  onDragOver={onDragOver} 
                  onDragEnd={onDragEnd}
                >
                  <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
                    {STATUSES.map(status => (
                      <DroppableColumn 
                        key={status} 
                        id={status} 
                        title={status} 
                        items={filteredProjects.filter(p => p.status === status)} 
                        onCardClick={setSelectedProject} 
                      />
                    ))}
                  </div>
                  <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeDragProject && (
                      <div className="opacity-90 scale-105 rotate-2 shadow-2xl">
                        <SortableRoadmapCard project={activeDragProject} />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </motion.div>
            )}

            {/* ── View 3: List & Execution Audit View ── */}
            {viewMode === 'gantt' && (
              <motion.div 
                key="gantt" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-slate-50/70 dark:bg-[#060608]/70 border-b border-black/5 dark:border-white/5">
                      <tr>
                        <th className="pl-6 pr-4 py-3.5 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest w-[38%]">Milestone &amp; Ecosystem</th>
                        <th className="pr-4 py-3.5 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Phase</th>
                        <th className="pr-4 py-3.5 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Target Quarter</th>
                        <th className="pr-4 py-3.5 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Checklist</th>
                        <th className="pr-6 py-3.5 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest w-[25%]">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredProjects.map((p, i) => {
                        const ss = getStatusConfig(p.status);
                        const prog = getProgress(p.logs);
                        return (
                          <motion.tr 
                            key={p._id} 
                            initial={{ opacity: 0, y: 8 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.02 }}
                            onClick={() => setSelectedProject(p)}
                            className="cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                          >
                            <td className="pl-6 pr-4 py-4">
                              <p className="font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors text-xs sm:text-sm">
                                {p.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-heading font-bold text-secondary uppercase tracking-widest">
                                  {p.category}
                                </span>
                                {p.tag && (
                                  <span className="text-[9px] font-mono text-secondary bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                    {p.tag}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="pr-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-heading font-bold uppercase tracking-wider border ${ss.bg} ${ss.border} ${ss.color}`}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.glow }} />
                                {p.status}
                              </span>
                            </td>
                            <td className="pr-4 py-4 font-mono text-xs text-secondary font-semibold">
                              {p.quarter || 'Q2 2026'}
                            </td>
                            <td className="pr-4 py-4 font-mono text-xs text-secondary">
                              <span className="text-slate-900 dark:text-white font-bold">{p.logs?.filter(l => l.completed).length || 0}</span> / {p.logs?.length || 0}
                            </td>
                            <td className="pr-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${prog === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#6324FC] to-[#00E5FF]'}`} 
                                    style={{ width: `${prog}%` }} 
                                  />
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white w-9">{prog}%</span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: ADD NEW MILESTONE MODAL */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isAddOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsAddOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/25 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                      <Target size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white">
                        Create New Roadmap Milestone
                      </h2>
                      <p className="text-xs font-sans text-secondary mt-0.5">
                        Log a SaaS module, architecture epic, or feature release.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Milestone / System Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Injaazh Client Self-Service Billing SaaS Portal..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Product Ecosystem (Category)
                      </label>
                      <PortalSelect
                        value={formData.category}
                        onChange={(val) => setFormData({ ...formData, category: val })}
                        options={allCategories.map(c => ({ value: c, label: c }))}
                        minWidth={220}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Initial Phase / Status
                      </label>
                      <PortalSelect
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val as any })}
                        options={statusFilterOptions.filter(o => o.value !== 'All')}
                        minWidth={180}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Target Quarter
                      </label>
                      <input
                        type="text"
                        value={formData.quarter}
                        onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                        placeholder="e.g. Q2 2026"
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Architecture Tag
                      </label>
                      <input
                        type="text"
                        value={formData.tag}
                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                        placeholder="e.g. Cloud SaaS / AI"
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-black/5 dark:border-white/10 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.title.trim() || isSubmittingAdd}
                      className="px-5 py-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] disabled:opacity-50 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>{isSubmittingAdd ? 'Saving...' : 'Create Milestone'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 2: MILESTONE DETAILS & TASK CHECKLIST DRAWER */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setSelectedProject(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
              >
                {/* Header */}
                <div className="p-5 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02] flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/25 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] shrink-0 mt-0.5">
                      <Target size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                          {selectedProject.category}
                        </span>
                        {selectedProject.quarter && (
                          <span className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] bg-[#6324FC]/10 px-2 py-0.5 rounded border border-[#6324FC]/20">
                            {selectedProject.quarter}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white leading-snug">
                        {selectedProject.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(selectedProject._id)}
                      className="p-1.5 rounded-lg text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete Milestone"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar banner */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-[#060608] border-b border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-bold text-secondary uppercase tracking-wider">
                      Execution Progress:
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {getProgress(selectedProject.logs)}%
                    </span>
                  </div>
                  <div className="w-36 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        getProgress(selectedProject.logs) === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#6324FC] to-[#00E5FF]'
                      }`}
                      style={{ width: `${getProgress(selectedProject.logs)}%` }}
                    />
                  </div>
                </div>

                {/* Body: Checklist Tasks */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <LayoutList size={14} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <span>Deliverables &amp; Feature Checklist</span>
                    </h3>
                    <span className="text-[11px] font-mono text-secondary">
                      {selectedProject.logs?.filter(l => l.completed).length || 0}/{selectedProject.logs?.length || 0} Finished
                    </span>
                  </div>

                  {/* Add New Checklist Task Form */}
                  <form onSubmit={handleAddLog} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newLogText}
                      onChange={(e) => setNewLogText(e.target.value)}
                      placeholder="Add milestone feature or deliverable task... (Press Enter)"
                      className="flex-1 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newLogText.trim() || isAddingLog}
                      className="px-3.5 py-2 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] disabled:opacity-40 text-white text-xs font-heading font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </form>

                  {/* Tasks List */}
                  <div className="space-y-2 pt-1">
                    {selectedProject.logs && selectedProject.logs.length > 0 ? (
                      selectedProject.logs.map((log, idx) => (
                        <div
                          key={log._id || idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 hover:border-[#6324FC]/30 transition-all group"
                        >
                          <div 
                            onClick={() => handleToggleLog(log._id, log.completed)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                              log.completed
                                ? 'bg-emerald-500 text-white dark:text-black shadow-[0_0_8px_#10B981]'
                                : 'border border-black/20 dark:border-white/20 text-transparent hover:border-[#6324FC]'
                            }`}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                            <span className={`text-xs font-sans transition-colors ${
                              log.completed ? 'text-secondary line-through' : 'text-slate-900 dark:text-white font-medium'
                            }`}>
                              {log.text}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log._id)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-secondary hover:text-rose-500 transition-all shrink-0"
                            title="Remove task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-4">
                        <p className="text-xs text-secondary font-medium">No checklist tasks logged yet.</p>
                        <p className="text-[10px] text-secondary/70 mt-0.5">Use the input above to break this milestone into executable deliverables.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase">Status:</span>
                    <span className={`text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded border ${getStatusConfig(selectedProject.status).bg} ${getStatusConfig(selectedProject.status).border} ${getStatusConfig(selectedProject.status).color}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-1.5 rounded-xl text-xs font-heading font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 text-slate-900 dark:text-white transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
