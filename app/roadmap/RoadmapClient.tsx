'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Plus, Search, Filter, Loader2, PlayCircle, Clock, FileText, CheckCircle,
  Columns, AlignLeft, X, Trash2, Calendar, Target, LayoutList,
  ChevronDown, ChevronRight, Layers
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
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
  'Planning':    { color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/20', icon: FileText },
  'In Progress': { color: 'text-[#6324FC]', bg: 'bg-[#6324FC]/10', border: 'border-[#6324FC]/20', icon: PlayCircle },
  'Completed':   { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
  'On Hold':     { color: 'text-secondary', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Clock },
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
    <div className="flex flex-col w-[300px] flex-shrink-0 bg-slate-50/70 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
      <div className={`p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0a0a0d] ${isOver ? 'bg-[#6324FC]/10' : ''} transition-colors`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-xl ${conf.bg} ${conf.border} border flex items-center justify-center ${conf.color}`}>
            <Icon size={13} />
          </div>
          <h3 className="font-heading font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">{title}</h3>
        </div>
        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-heading font-bold text-secondary border border-black/5 dark:border-white/5 font-mono">{items.length}</span>
      </div>
      
      <div ref={setNodeRef} className={`p-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 min-h-[150px] transition-colors ${isOver ? 'bg-[#6324FC]/5' : ''}`}>
        <SortableContext id={id} items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(p => <SortableRoadmapCard key={p._id} project={p} onClick={() => onCardClick(p)} />)}
        </SortableContext>
        {items.length === 0 && (
          <div className={`h-[100px] rounded-2xl border-2 border-dashed flex items-center justify-center text-xs font-heading font-bold transition-all ${isOver ? 'border-[#6324FC]/40 bg-[#6324FC]/10 text-[#6324FC]' : 'border-black/10 dark:border-white/10 text-secondary'}`}>
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => {
        if (!isDragging && onClick) onClick();
      }}
      className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 p-3.5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-[#6324FC]/50 transition-all shadow-sm relative overflow-hidden group">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusConfig(project.status).bg}`} />
      
      <div className="flex justify-between items-start mb-1.5 pl-1.5">
        <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{project.title}</h4>
      </div>
      <p className="text-[9px] font-heading font-bold text-secondary uppercase tracking-widest pl-1.5 mb-3">{project.category}</p>

      <div className="pl-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-heading font-bold text-secondary uppercase">Progress</span>
          <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">{prog}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
          <div className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full" style={{ width: `${prog}%` }} />
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
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>({});
  
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
      window.location.reload();
    } else {
      toast.error('Failed to add task');
    }
    setIsSubmitting(false);
  };

  const toggleTask = async (logId: string, completed: boolean) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, logs: selectedProject.logs.map(l => l._id === logId ? { ...l, completed } : l) };
    setSelectedProject(updated);
    setProjects(projects.map(p => p._id === updated._id ? updated : p));
    
    await toggleLogCompletion(selectedProject._id, logId, completed);
  };

  const removeTask = async (logId: string) => {
    if (!selectedProject) return;
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] p-4 md:p-8 selection:bg-[#6324FC]/30">
      <div className="max-w-[1600px] mx-auto">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-6">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                  <Compass size={16} />
                </div>
                <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Product & Project Planning</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Roadmap</h1>
              <p className="text-xs text-secondary font-medium">Plan milestones, releases, and software systems.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button onClick={() => { setFormData({ title: '', category: 'Product', status: 'Planning' }); setIsAddOpen(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-heading font-bold text-xs bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white shadow-[0_0_20px_rgba(99,36,252,0.4)] transition-all">
                <Plus size={15} strokeWidth={2.5} /> New Milestone
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total Milestones', value: projects.length, color: '#F59E0B' },
              { label: 'Active Sprints', value: activeCount, color: '#6324FC' },
              { label: 'Completed',      value: compCount,   color: '#10B981' },
              { label: 'Delayed Items',  value: delayedCount,color: '#EF4444' },
              { label: 'Overall Progress',value: `${overallProg}%`, color: '#00E5FF' },
            ].map((k) => {
              const dummyData = [10, 20, 15, 25, 20, 30, 40].map((v) => ({ val: v + (Math.random() * 10 - 5) }));
              return (
                <div key={k.label} className="relative bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-4 lg:p-5 flex flex-col justify-center overflow-hidden transition-all duration-200 shadow-sm group hover:border-[#6324FC]/40">
                  {/* Recharts Area Wave */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dummyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Area type="monotone" dataKey="val" stroke={k.color} strokeWidth={2} fill={k.color} fillOpacity={1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
  
                  {/* Top Edge Glow */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-300 rounded-b-full pointer-events-none"
                    style={{ backgroundColor: k.color, boxShadow: `0 4px 15px ${k.color}` }}
                  />

                  <p className="text-[10px] font-heading font-bold text-secondary leading-tight mb-1.5 relative z-10 uppercase tracking-wider">{k.label}</p>
                  <p className="text-xl font-heading font-extrabold font-mono tracking-tight relative z-10" style={{ color: k.color }}>{k.value}</p>
                </div>
              );
            })}
          </motion.div>

          {/* ── Filter Bar & View Switcher ────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-1 w-full md:w-auto overflow-x-auto hide-scrollbar shadow-xs">
              {[{ id: 'timeline', icon: Target, label: 'Roadmap' }, { id: 'kanban', icon: Columns, label: 'Kanban' }, { id: 'gantt', icon: AlignLeft, label: 'List' }].map(v => (
                <button key={v.id} onClick={() => setViewMode(v.id as ViewMode)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all ${viewMode === v.id ? 'text-slate-900 dark:text-white' : 'text-secondary hover:text-slate-900 dark:hover:text-white'}`}>
                  {viewMode === v.id && <motion.div layoutId="roadmapViews" className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-xs border border-black/5 dark:border-white/5" />}
                  <v.icon size={13} className="relative z-10 text-[#6324FC] dark:text-[#00E5FF]" /> <span className="relative z-10">{v.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 w-full flex items-center gap-2.5">
              <div className="relative flex-1 group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] transition-colors" />
                <input type="text" placeholder="Search roadmap..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-secondary text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-[#6324FC] transition-all shadow-xs" />
              </div>
              <div className="relative w-36 shrink-0">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs font-heading font-bold rounded-xl pl-3.5 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#6324FC] cursor-pointer shadow-xs">
                  <option value="All">All Status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Filter size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main Content Area ────────────────────────────────────────────── */}
        {filteredProjects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0d] border border-dashed border-black/10 dark:border-white/10 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center mb-3"><Compass size={20} className="text-secondary" /></div>
            <p className="text-sm font-heading font-bold text-slate-900 dark:text-white mb-1">No items found</p>
            <p className="text-xs text-secondary mb-5">Create a new milestone to start planning.</p>
            <button onClick={() => { setFormData({ title: '', category: 'Product', status: 'Planning' }); setIsAddOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] text-white text-xs font-heading font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)]">
              <Plus size={14} /> New Milestone
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* ── Timeline (Roadmap) View ── */}
            {viewMode === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 pb-8">
                {groupedByCategory.map(([category, items]) => {
                  const isExpanded = !!expandedEpics[category];
                  
                  const totalLogs = items.reduce((acc, p) => acc + (p.logs?.length || 0), 0);
                  const compLogs = items.reduce((acc, p) => acc + (p.logs?.filter(l => l.completed).length || 0), 0);
                  const epicProg = totalLogs === 0 ? 0 : Math.round((compLogs / totalLogs) * 100);

                  return (
                    <div key={category} className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm transition-all">
                      <div 
                        className={`relative px-5 py-3.5 flex items-center justify-between cursor-pointer transition-colors group overflow-hidden ${isExpanded ? 'bg-slate-50 dark:bg-[#060608] border-b border-black/5 dark:border-white/5' : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'}`}
                        onClick={() => setExpandedEpics(prev => ({ ...prev, [category]: !prev[category] }))}
                      >
                        <div className="relative flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#6324FC] text-white shadow-[0_0_12px_rgba(99,36,252,0.5)]' : 'bg-slate-100 dark:bg-white/5 text-secondary group-hover:text-[#6324FC]'}`}>
                            <Layers size={14} />
                          </div>
                          <div>
                            <h3 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{category} Epic <span className="text-secondary ml-2 normal-case font-medium tracking-normal text-[11px] font-mono">({items.length} projects)</span></h3>
                          </div>
                        </div>

                        <div className="relative flex items-center gap-5">
                          {/* Epic Progress Bar */}
                          <div className="hidden sm:flex items-center gap-2.5 w-32">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                              <div className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full transition-all duration-500" style={{ width: `${epicProg}%` }} />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-secondary">{epicProg}%</span>
                          </div>

                          <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-secondary group-hover:bg-slate-100 dark:group-hover:bg-white/5'}`}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5">
                          <div className="relative border-l-2 border-black/5 dark:border-white/5 ml-3 space-y-4">
                            {items.map(p => {
                              const ss = getStatusConfig(p.status);
                              const prog = getProgress(p.logs);
                              
                              const isPulse = p.status === 'In Progress';
                              const isCompleted = p.status === 'Completed';
                              const nodeColor = isCompleted ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : isPulse ? 'bg-[#6324FC] border-[#6324FC] shadow-[0_0_12px_rgba(99,36,252,0.8)]' : 'bg-slate-50 dark:bg-[#060608] border-secondary';
                              
                              const quarterMap = [1,1,1,2,2,2,3,3,3,4,4,4];
                              const d = p.createdAt ? new Date(p.createdAt) : new Date();
                              const estimatedQ = `Q${quarterMap[d.getMonth()]} ${d.getFullYear()}`;
                              const tags = ['Product', 'Engineering', 'Design', 'Marketing'];
                              const tag = tags[p.title.length % tags.length];

                              return (
                                <div key={p._id} className="relative pl-6 group cursor-pointer" onClick={() => setSelectedProject(p)}>
                                  {/* Glowing Node */}
                                  <div className="absolute -left-[7px] top-2 flex items-center justify-center">
                                    {isPulse && <div className="absolute w-4 h-4 rounded-full bg-[#6324FC]/40 animate-ping" />}
                                    <div className={`relative w-3 h-3 rounded-full border-2 transition-colors ${nodeColor}`} />
                                  </div>
                                  
                                  <div className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-4 hover:border-[#6324FC]/50 hover:shadow-md shadow-xs transition-all relative overflow-hidden">
                                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <div>
                                        <h4 className="text-sm font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{p.title}</h4>
                                        
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-heading font-bold uppercase tracking-wider ${ss.bg} ${ss.border} ${ss.color}`}>
                                            {p.status}
                                          </span>
                                          <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-white/5 text-secondary border border-black/5 dark:border-white/5 text-[9px] font-bold">
                                            <Calendar size={10} /> Release {estimatedQ}
                                          </span>
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-white/5 text-secondary border border-black/5 dark:border-white/5 text-[9px] font-bold">
                                            <Target size={10} /> {tag}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-secondary mt-1.5 flex items-center gap-2">
                                          <span><LayoutList size={12} className="inline mr-1" /> {p.logs?.length || 0} tasks</span>
                                          {p.logs?.length > 0 && <span className="text-emerald-500 font-medium">• {p.logs.filter(l => l.completed).length} completed</span>}
                                        </p>
                                      </div>
                                      
                                      <div className="w-full md:w-44 shrink-0 flex flex-col md:items-end">
                                        <div className="flex items-center justify-between w-full mb-1">
                                          <span className="text-[9px] font-heading font-bold text-secondary uppercase">Progress</span>
                                          <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">{prog}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                          <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#6324FC] to-[#00E5FF]'}`} style={{ width: `${prog}%` }} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Gantt (List) View ── */}
            {viewMode === 'gantt' && (
              <motion.div key="gantt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0d] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-slate-50/50 dark:bg-[#060608]/50 border-b border-black/5 dark:border-white/5">
                      <tr>
                        <th className="pl-5 pr-4 py-3 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest w-[40%]">Milestone / Epic</th>
                        <th className="pr-4 py-3 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Status</th>
                        <th className="pr-5 py-3 text-left text-[10px] font-heading font-bold text-secondary uppercase tracking-widest w-[40%]">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredProjects.map((p, i) => {
                        const ss = getStatusConfig(p.status);
                        const prog = getProgress(p.logs);
                        return (
                          <motion.tr key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            onClick={() => setSelectedProject(p)}
                            className="cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                            <td className="pl-5 pr-4 py-3.5">
                              <p className="font-heading font-bold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{p.title}</p>
                              <p className="text-[9px] font-heading font-bold text-secondary uppercase tracking-widest mt-0.5">{p.category}</p>
                            </td>
                            <td className="pr-4 py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-heading font-bold uppercase tracking-wider border ${ss.bg} ${ss.border} ${ss.color}`}>
                                <ss.icon size={11} /> {p.status}
                              </span>
                            </td>
                            <td className="pr-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                  <div className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full" style={{ width: `${prog}%` }} />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white w-8">{prog}%</span>
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
                  <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
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
                onClick={() => { setIsAddOpen(false); setSelectedProject(null); }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50" />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-10 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden pointer-events-auto"
                >
                {/* Header */}
                <div className="flex-shrink-0 p-5 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0d]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">{isAddOpen ? 'New Milestone' : 'Project Details'}</span>
                    <button onClick={() => { setIsAddOpen(false); setSelectedProject(null); }} className="p-1.5 rounded-xl text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                  
                  {isAddOpen ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] flex-shrink-0"><Target size={18} /></div>
                      <h2 className="text-base font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">Create a new milestone on the roadmap.</h2>
                    </div>
                  ) : selectedProject && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/20 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF] flex-shrink-0"><Target size={18} /></div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-heading font-extrabold text-slate-900 dark:text-white tracking-tight line-clamp-2">{selectedProject.title}</h2>
                        <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mt-0.5">{selectedProject.category}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Body for Add */}
                {isAddOpen && (
                  <form onSubmit={handleCreate} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Title</label>
                      <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-[#6324FC] focus:outline-none placeholder:text-secondary" placeholder="Milestone name..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Category (Epic)</label>
                      <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-[#6324FC] focus:outline-none placeholder:text-secondary" placeholder="e.g. Q3 Launch" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold tracking-widest text-secondary uppercase mb-1.5">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold focus:border-[#6324FC] focus:outline-none appearance-none cursor-pointer">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="pt-4 border-t border-black/5 dark:border-white/5">
                      <button type="submit" disabled={isSubmitting || !formData.title || !formData.category}
                        className="w-full py-2.5 bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,36,252,0.4)]">
                        {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Create Milestone'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Body for View/Edit Tasks */}
                {selectedProject && !isAddOpen && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex-shrink-0 flex items-center border-b border-black/5 dark:border-white/5 px-5 bg-slate-50/50 dark:bg-[#060608]/50">
                      {[{ key: 'tasks' as const, label: 'Tasks', icon: LayoutList }].map(t => (
                        <button key={t.key} onClick={() => setPanelTab(t.key)}
                          className={`relative flex items-center gap-1.5 px-3 py-3 text-xs font-heading font-bold transition-all ${panelTab === t.key ? 'text-[#6324FC] dark:text-[#00E5FF]' : 'text-secondary hover:text-slate-900 dark:hover:text-white'}`}>
                          <t.icon size={13} /> {t.label}
                          {panelTab === t.key && <motion.div layoutId="roadmapPanelTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6324FC] dark:bg-[#00E5FF] rounded-t-full" />}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 bg-white dark:bg-[#0a0a0d]">
                      {panelTab === 'tasks' && (
                        <div className="space-y-4">
                          {/* Add Task Input */}
                          <form onSubmit={handleAddTask} className="flex gap-2">
                            <input type="text" placeholder="Add a new task..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                              className="flex-1 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3.5 py-2 text-xs focus:border-[#6324FC] focus:outline-none placeholder:text-secondary" />
                            <button type="submit" disabled={!newTaskText.trim() || isSubmitting}
                              className="px-3 bg-slate-100 dark:bg-white/5 hover:bg-[#6324FC] text-secondary hover:text-white rounded-xl transition-all disabled:opacity-50">
                              <Plus size={15} />
                            </button>
                          </form>

                          {/* Task List */}
                          <div className="space-y-2">
                            {selectedProject.logs?.map(log => (
                              <div key={log._id} className="group flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 rounded-xl hover:border-[#6324FC]/30 transition-colors">
                                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                  <input type="checkbox" checked={log.completed} onChange={(e) => toggleTask(log._id, e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-black/20 dark:border-white/20 text-[#6324FC] focus:ring-[#6324FC] cursor-pointer" />
                                  <span className={`text-xs flex-1 truncate transition-all ${log.completed ? 'text-secondary line-through' : 'text-slate-900 dark:text-white'}`}>{log.text}</span>
                                </label>
                                <button onClick={() => removeTask(log._id)} className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-rose-500 transition-all ml-1.5">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            {(!selectedProject.logs || selectedProject.logs.length === 0) && (
                              <div className="py-8 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl">
                                <p className="text-xs font-heading font-bold text-secondary">No tasks added yet.</p>
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
