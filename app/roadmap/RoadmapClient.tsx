'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Plus, Search, Filter, Loader2, PlayCircle, Clock, FileText, CheckCircle,
  Columns, AlignLeft, X, Trash2, Calendar, Target, PlusCircle, LayoutList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';

import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent, DragOverEvent, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { 
  createRoadmapProject, updateProjectStatus, 
  addProjectLog, toggleLogCompletion, deleteProjectLog 
} from '@/app/actions/roadmapActions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RoadmapLog {
  _id: string;
  text: string;
  date: string;
  completed: boolean;
}

interface RoadmapProject {
  _id: string;
  title: string;
  category: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  logs: RoadmapLog[];
  orderIndex: number;
  createdAt: string;
}

interface RoadmapClientProps {
  initialProjects: RoadmapProject[];
}

type ViewMode = 'timeline' | 'gantt' | 'kanban';
type PanelTab = 'overview' | 'tasks';

// ─── Configs ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Planning':    { color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20', icon: FileText },
  'In Progress': { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', icon: PlayCircle },
  'Completed':   { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20', icon: CheckCircle },
  'On Hold':     { color: 'text-[#94A3B8]', bg: 'bg-[#94A3B8]/10', border: 'border-[#94A3B8]/20', icon: Clock },
};
function getStatusConfig(s: string) { return STATUS_CONFIG[s] ?? STATUS_CONFIG['Planning']; }

const getProgress = (logs: RoadmapLog[]) => {
  if (!logs || logs.length === 0) return 0;
  return Math.round((logs.filter(l => l.completed).length / logs.length) * 100);
};

// ─── Kanban Components ────────────────────────────────────────────────────────
function DroppableColumn({ id, title, items, onCardClick }: { id: string, title: string, items: RoadmapProject[], onCardClick: (p: RoadmapProject) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const conf = getStatusConfig(title);
  const Icon = conf.icon;
  
  return (
    <div className="flex flex-col w-[320px] flex-shrink-0 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[24px] overflow-hidden shadow-lg">
      <div className={`p-4 border-b border-slate-200 dark:border-[#232734] flex items-center justify-between bg-white dark:bg-[#11131A] ${isOver ? 'bg-[#232734]/30' : ''} transition-colors`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${conf.bg} ${conf.border} border flex items-center justify-center ${conf.color}`}>
            <Icon size={14} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        </div>
        <span className="px-2.5 py-1 bg-slate-200 dark:bg-[#232734] rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono">{items.length}</span>
      </div>
      
      <div ref={setNodeRef} className={`p-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[150px] transition-colors ${isOver ? 'bg-[#2563EB]/5' : ''}`}>
        <SortableContext id={id} items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(p => <SortableRoadmapCard key={p._id} project={p} onClick={() => onCardClick(p)} />)}
        </SortableContext>
        {items.length === 0 && (
          <div className={`h-[120px] rounded-[16px] border-2 border-dashed flex items-center justify-center text-xs font-bold transition-all ${isOver ? 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB]' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500'}`}>
            {isOver ? 'Drop here' : 'Empty Stage'}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableRoadmapCard({ project, onClick }: { project: RoadmapProject, onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project._id, data: project });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  
  const prog = getProgress(project.logs);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={(e) => {
        // Prevent sorting from hijacking click if we just tapped
        if (!isDragging && onClick) onClick();
      }}
      className={`bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] p-4 rounded-[20px] cursor-grab active:cursor-grabbing hover:border-[#2563EB]/40 transition-colors shadow-sm relative overflow-hidden group`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusConfig(project.status).bg}`} />
      
      <div className="flex justify-between items-start mb-2 pl-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{project.title}</h4>
      </div>
      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest pl-2 mb-4">{project.category}</p>

      <div className="pl-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#94A3B8]">Progress</span>
          <span className="text-[10px] font-bold text-slate-900 dark:text-white font-mono">{prog}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734]">
          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${prog}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RoadmapClient({ initialProjects }: RoadmapClientProps) {
  const { confirm } = useConfirm();
  const [projects, setProjects] = useState<RoadmapProject[]>(initialProjects);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // UI State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RoadmapProject | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('tasks');
  const [newTaskText, setNewTaskText] = useState('');
  
  const [formData, setFormData] = useState({ title: '', category: 'Product', status: 'Planning' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setProjects(initialProjects); }, [initialProjects]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed'];
  
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, RoadmapProject[]>();
    filteredProjects.forEach(p => {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    });
    return Array.from(map.entries());
  }, [filteredProjects]);

  // KPIs
  const activeCount = projects.filter(p => p.status === 'In Progress').length;
  const compCount = projects.filter(p => p.status === 'Completed').length;
  const delayedCount = projects.filter(p => p.status === 'On Hold').length;
  
  let totalProgress = 0;
  projects.forEach(p => {
    totalProgress += getProgress(p.logs);
  });
  const overallProg = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createRoadmapProject(formData as any);
    if (res.success) {
      toast.success('Project added to roadmap');
      setIsAddOpen(false);
      // We mutate optimistically or trigger a re-fetch. Since we don't have direct refetch, 
      // we can simulate it by reloading or since server action calls revalidatePath, 
      // we can just wait for RSC to refresh initialProjects or we can reload window for simplicity,
      // but let's assume we want to keep it client-side without full reload.
      window.location.reload(); 
    } else {
      toast.error(res.error || 'Failed to create');
    }
    setIsSubmitting(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskText.trim()) return;
    setIsSubmitting(true);
    const res = await addProjectLog(selectedProject._id, newTaskText);
    if (res.success) {
      setNewTaskText('');
      window.location.reload(); // Quick sync for roadmap changes since they are simple
    } else {
      toast.error('Failed to add task');
    }
    setIsSubmitting(false);
  };

  const toggleTask = async (logId: string, completed: boolean) => {
    if (!selectedProject) return;
    // Optimistic
    const updated = { ...selectedProject, logs: selectedProject.logs.map(l => l._id === logId ? { ...l, completed } : l) };
    setSelectedProject(updated);
    setProjects(projects.map(p => p._id === updated._id ? updated : p));
    
    await toggleLogCompletion(selectedProject._id, logId, completed);
  };

  const removeTask = async (logId: string) => {
    if (!selectedProject) return;
    // Optimistic
    const updated = { ...selectedProject, logs: selectedProject.logs.filter(l => l._id !== logId) };
    setSelectedProject(updated);
    setProjects(projects.map(p => p._id === updated._id ? updated : p));
    
    await deleteProjectLog(selectedProject._id, logId);
  };

  // ── Dnd-Kit Kanban ──────────────────────────────────────────────────────────
  const [activeDragProject, setActiveDragProject] = useState<RoadmapProject | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragStart = (e: DragStartEvent) => {
    const proj = projects.find(p => p._id === e.active.id);
    if (proj) setActiveDragProject(proj);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeProject = projects.find(p => p._id === activeId);
    if (!activeProject) return;

    const overCol = STATUSES.includes(overId) ? overId : projects.find(p => p._id === overId)?.status;
    if (!overCol || activeProject.status === overCol) return;

    setProjects(projects.map(p => p._id === activeId ? { ...p, status: overCol as any } : p));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveDragProject(null);
    const { active, over } = e;
    if (!over) return;
    const activeProj = projects.find(p => p._id === active.id);
    if (activeProj) {
      await updateProjectStatus(activeProj._id, activeProj.status);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1600px] mx-auto">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Compass size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Product & Project Planning</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Roadmap</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Plan milestones, releases, and software systems.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={() => { setFormData({ title: '', category: 'Product', status: 'Planning' }); setIsAddOpen(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> New Milestone
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[18px] p-4 flex flex-col justify-center">
              <p className="text-[11px] font-bold text-[#94A3B8] leading-tight mb-2">Total Milestones</p>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">{projects.length}</p>
            </div>
            {[
              { label: 'Active Sprints', value: activeCount, color: '#2563EB' },
              { label: 'Completed',      value: compCount,   color: '#10B981' },
              { label: 'Delayed Items',  value: delayedCount,color: '#EF4444' },
              { label: 'Overall Progress',value: `${overallProg}%`, color: '#7C3AED' },
            ].map(k => (
              <div key={k.label} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[18px] p-4 flex flex-col justify-center shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none transition-all">
                <p className="text-[11px] font-bold text-[#94A3B8] leading-tight mb-2">{k.label}</p>
                <p className="text-xl font-bold font-mono tracking-tight" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Filter Bar & View Switcher ────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl p-1 w-full md:w-auto overflow-x-auto hide-scrollbar">
              {[{ id: 'timeline', icon: Target, label: 'Roadmap' }, { id: 'kanban', icon: Columns, label: 'Kanban' }, { id: 'gantt', icon: AlignLeft, label: 'List' }].map(v => (
                <button key={v.id} onClick={() => setViewMode(v.id as ViewMode)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${viewMode === v.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#94A3B8]/80'}`}>
                  {viewMode === v.id && <motion.div layoutId="roadmapViews" className="absolute inset-0 bg-white dark:bg-[#232734] rounded-lg shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5" />}
                  <v.icon size={14} className="relative z-10" /> <span className="relative z-10">{v.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 w-full flex items-center gap-3">
              <div className="relative flex-1 group">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
                <input type="text" placeholder="Search roadmap..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white placeholder-[#94A3B8]/60 text-sm font-medium rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
              </div>
              <div className="relative w-32 shrink-0">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white text-sm font-medium rounded-xl pl-4 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#2563EB]/60 cursor-pointer">
                  <option value="All">All Status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main Content Area ────────────────────────────────────────────── */}
        {filteredProjects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 flex flex-col items-center justify-center bg-white dark:bg-[#11131A] border border-dashed border-slate-200 dark:border-[#232734] rounded-[20px]">
            <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-4"><Compass size={24} className="text-[#232734]" /></div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No items found</p>
            <p className="text-xs text-[#94A3B8] mb-6">Create a new milestone to start planning.</p>
            <button onClick={() => { setFormData({ title: '', category: 'Product', status: 'Planning' }); setIsAddOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-xs font-bold rounded-xl transition-all">
              <Plus size={14} /> New Milestone
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* ── Timeline (Roadmap) View ── */}
            {viewMode === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 pb-8">
                {groupedByCategory.map(([category, items], idx) => (
                  <div key={category} className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[24px] overflow-hidden shadow-sm dark:shadow-none">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80">
                      <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{category} Epic</h3>
                    </div>
                    <div className="p-6">
                      <div className="relative border-l-2 border-[#334155]/60 ml-3 space-y-6">
                        {items.map(p => {
                          const ss = getStatusConfig(p.status);
                          const prog = getProgress(p.logs);
                          
                          const isPulse = p.status === 'In Progress';
                          const isCompleted = p.status === 'Completed';
                          const nodeColor = isCompleted ? 'bg-[#10B981] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.5)]' : isPulse ? 'bg-[#2563EB] border-[#2563EB] shadow-[0_0_12px_rgba(37,99,235,0.8)]' : 'bg-slate-50 dark:bg-[#09090B] border-[#475569] group-hover:border-[#2563EB]';
                          
                          // Mock metadata for Rich Card
                          const quarterMap = [1,1,1,2,2,2,3,3,3,4,4,4];
                          const d = p.createdAt ? new Date(p.createdAt) : new Date();
                          const estimatedQ = `Q${quarterMap[d.getMonth()]} ${d.getFullYear()}`;
                          const tags = ['Product', 'Engineering', 'Design', 'Marketing'];
                          const tag = tags[p.title.length % tags.length];

                          return (
                            <div key={p._id} className="relative pl-8 group cursor-pointer" onClick={() => setSelectedProject(p)}>
                              {/* Glowing Node */}
                              <div className="absolute -left-[7px] top-1.5 flex items-center justify-center">
                                {isPulse && <div className="absolute w-5 h-5 rounded-full bg-[#2563EB]/40 animate-ping" />}
                                <div className={`relative w-3 h-3 rounded-full border-2 transition-colors ${nodeColor}`} />
                              </div>
                              
                              <div className="bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[20px] p-5 hover:border-[#2563EB]/60 hover:shadow-md shadow-sm dark:shadow-none transition-all relative overflow-hidden">
                                {/* Glassmorphic gradient on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/0 to-[#2563EB]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors">{p.title}</h4>
                                    
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${ss.bg} ${ss.border} ${ss.color}`}>
                                        {p.status}
                                      </span>
                                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-[#334155]" />
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[9px] font-bold">
                                        <Calendar size={10} className="text-[#94A3B8]" /> Release {estimatedQ}
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[9px] font-bold">
                                        <Target size={10} className="text-[#94A3B8]" /> {tag}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#94A3B8] mt-2 flex items-center gap-2">
                                      <span><LayoutList size={13} className="inline mr-1" /> {p.logs?.length || 0} tasks</span>
                                      {p.logs?.length > 0 && <span className="text-[#10B981]">• {p.logs.filter(l => l.completed).length} completed</span>}
                                    </p>
                                  </div>
                                  
                                  <div className="w-full md:w-48 shrink-0 flex flex-col md:items-end">
                                    <div className="flex items-center justify-between w-full mb-1.5">
                                      <span className="text-[10px] font-bold text-[#94A3B8]">Progress</span>
                                      <span className="text-[10px] font-bold text-slate-900 dark:text-white font-mono">{prog}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white dark:bg-[#11131A] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734] group-hover:border-[#2563EB]/40 transition-colors">
                                      <div className={`h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_16px_rgba(37,99,235,0.8)] ${isCompleted ? 'bg-[#10B981]' : 'bg-[#2563EB]'}`} style={{ width: `${prog}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Gantt (List) View ── */}
            {viewMode === 'gantt' && (
              <motion.div key="gantt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="overflow-hidden rounded-[20px] border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] shadow-sm dark:shadow-none">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/50">
                      <tr className="border-b border-slate-200 dark:border-[#232734]">
                        <th className="pl-6 pr-4 py-4 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest w-[40%]">Milestone / Epic</th>
                        <th className="pr-4 py-4 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Status</th>
                        <th className="pr-6 py-4 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest w-[40%]">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((p, i) => {
                        const ss = getStatusConfig(p.status);
                        const prog = getProgress(p.logs);
                        return (
                          <motion.tr key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            onClick={() => setSelectedProject(p)}
                            className="border-b border-slate-200 dark:border-[#232734]/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#09090B]/80 transition-colors group">
                            <td className="pl-6 pr-4 py-4">
                              <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors">{p.title}</p>
                              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">{p.category}</p>
                            </td>
                            <td className="pr-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${ss.bg} ${ss.border} ${ss.color}`}>
                                <ss.icon size={11} /> {p.status}
                              </span>
                            </td>
                            <td className="pr-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734]">
                                  <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${prog}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-900 dark:text-white w-8 font-mono">{prog}%</span>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── Kanban View ── */}
            {viewMode === 'kanban' && (
              <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full pb-8">
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
                  <div className="flex gap-5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pb-4">
                    {STATUSES.map(status => (
                      <DroppableColumn key={status} id={status} title={status} items={filteredProjects.filter(p => p.status === status)} onCardClick={setSelectedProject} />
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

          </AnimatePresence>
        )}

        {/* ── Slide Panels ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {(isAddOpen || selectedProject) && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={() => { setIsAddOpen(false); setSelectedProject(null); }} className="fixed inset-0 bg-black/30 dark:bg-[#09090B]/70 backdrop-blur-sm z-50" />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-10 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 24 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative w-full max-w-lg max-h-[90vh] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden pointer-events-auto"
                >
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{isAddOpen ? 'New Milestone' : 'Project Details'}</span>
                    <button onClick={() => { setIsAddOpen(false); setSelectedProject(null); }} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] border border-slate-200 dark:border-[#232734] transition-all">
                      <X size={14} />
                    </button>
                  </div>
                  
                  {isAddOpen ? (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0"><Target size={20} /></div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-1">Create a new milestone on the roadmap.</h2>
                    </div>
                  ) : selectedProject && (
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0"><Target size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight line-clamp-2">{selectedProject.title}</h2>
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">{selectedProject.category}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Body for Add */}
                {isAddOpen && (
                  <form onSubmit={handleCreate} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Title</label>
                      <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" placeholder="Milestone name..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Category (Epic)</label>
                      <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" placeholder="e.g. Q3 Launch" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#232734]">
                      <button type="submit" disabled={isSubmitting || !formData.title || !formData.category}
                        className="w-full py-3.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.25)]">
                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Create Milestone'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Body for View/Edit Tasks */}
                {selectedProject && !isAddOpen && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex-shrink-0 flex items-center border-b border-slate-200 dark:border-[#232734] px-6 bg-slate-100 dark:bg-[#0D0F16]">
                      {[{ key: 'tasks' as const, label: 'Tasks', icon: LayoutList }].map(t => (
                        <button key={t.key} onClick={() => setPanelTab(t.key)}
                          className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all ${panelTab === t.key ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                          <t.icon size={13} /> {t.label}
                          {panelTab === t.key && <motion.div layoutId="roadmapPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-t-full" />}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-[#09090B]">
                      {panelTab === 'tasks' && (
                        <div className="space-y-6">
                          {/* Add Task Input */}
                          <form onSubmit={handleAddTask} className="flex gap-2">
                            <input type="text" placeholder="Add a new task..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                              className="flex-1 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:border-[#2563EB]/60 focus:outline-none" />
                            <button type="submit" disabled={!newTaskText.trim() || isSubmitting}
                              className="px-4 bg-slate-200 dark:bg-[#232734] hover:bg-[#2563EB] text-white rounded-xl transition-all disabled:opacity-50">
                              <Plus size={16} />
                            </button>
                          </form>

                          {/* Task List */}
                          <div className="space-y-2">
                            {selectedProject.logs?.map(log => (
                              <div key={log._id} className="group flex items-center justify-between p-3 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl hover:border-[#2563EB]/30 transition-colors">
                                <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                  <input type="checkbox" checked={log.completed} onChange={(e) => toggleTask(log._id, e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-200 dark:border-[#232734] text-[#2563EB] bg-slate-50 dark:bg-[#09090B] focus:ring-[#2563EB] cursor-pointer" />
                                  <span className={`text-sm flex-1 truncate transition-all ${log.completed ? 'text-[#94A3B8] line-through' : 'text-slate-900 dark:text-white'}`}>{log.text}</span>
                                </label>
                                <button onClick={() => removeTask(log._id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[#94A3B8] hover:text-[#EF4444] transition-all ml-2">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            {(!selectedProject.logs || selectedProject.logs.length === 0) && (
                              <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-[#232734] rounded-xl">
                                <p className="text-xs font-bold text-[#94A3B8]">No tasks added yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
