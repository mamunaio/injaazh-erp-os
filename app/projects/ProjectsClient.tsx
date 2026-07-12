'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LayoutGrid, List, Clock, Calendar, Search, Filter, Briefcase, 
  UserPlus, DownloadCloud, MoreHorizontal, X, Edit2, Trash2, 
  LayoutList, Activity, StickyNote, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, Loader2, PlayCircle, Columns, GitMerge, FileText, CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent, DragOverEvent, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { createProject, updateProject, deleteProject } from '@/app/actions/projectActions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  _id: string;
  title: string;
  clientName?: string;
  status: string; // Planning, In Progress, In Review, Completed, On Hold
  priority?: string; // Low, Medium, High, Urgent
  progress?: number;
  deadline?: string;
  startDate?: string;
  assignees?: string[];
  techStack?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsClientProps {
  initialProjects: any[];
  initialClients?: any[];
}

type ViewMode = 'grid' | 'list' | 'kanban' | 'timeline';
type PanelTab = 'overview' | 'notes' | 'timeline';

// ─── Configs ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  'Planning':    { color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20', dot: 'bg-[#0EA5E9]', icon: FileText },
  'In Progress': { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', dot: 'bg-[#F59E0B]', icon: PlayCircle },
  'In Review':   { color: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10', border: 'border-[#7C3AED]/20', dot: 'bg-[#7C3AED]', icon: Activity },
  'Completed':   { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20', dot: 'bg-[#10B981]', icon: CheckCircle },
  'On Hold':     { color: 'text-[#94A3B8]', bg: 'bg-[#94A3B8]/10', border: 'border-[#94A3B8]/20', dot: 'bg-[#94A3B8]', icon: Clock },
};
function getStatusConfig(s: string) { return STATUS_CONFIG[s] ?? STATUS_CONFIG['Planning']; }

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Low':    { color: 'text-[#94A3B8]', bg: 'bg-[#94A3B8]/10', border: 'border-[#94A3B8]/20' },
  'Medium': { color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]/20' },
  'High':   { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  'Urgent': { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20' },
};
function getPriorityConfig(p?: string) { return PRIORITY_CONFIG[p || 'Medium'] ?? PRIORITY_CONFIG['Medium']; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}
function fmtShortDate(d?: string) {
  if (!d) return 'No Date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d));
}
function getInitials(name: string) { return name ? name.substring(0, 2).toUpperCase() : '??'; }

const checkOverdue = (deadline?: string) => {
  if (!deadline) return false;
  return new Date(deadline).getTime() < new Date().setHours(0,0,0,0);
};

const getProjectHealth = (p: Project) => {
  if (p.status === 'Completed' || (p.progress || 0) === 100) return { label: 'Completed', bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20' };
  if (checkOverdue(p.deadline)) return { label: 'Overdue', bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/20' };
  if (p.deadline) {
    const daysLeft = (new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 3 && (p.progress || 0) < 80) return { label: 'At Risk', bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' };
  }
  return { label: 'On Track', bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20' };
};

// ─── Kanban Components ────────────────────────────────────────────────────────
function DroppableColumn({ id, title, items }: { id: string, title: string, items: Project[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const conf = getStatusConfig(title);
  const Icon = conf.icon;
  
  return (
    <div className="flex flex-col w-[320px] flex-shrink-0 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-[#232734] rounded-[24px] overflow-hidden shadow-sm dark:shadow-none">
      {/* Header */}
      <div className={`p-4 border-b border-slate-200 dark:border-[#232734] flex items-center justify-between bg-white dark:bg-[#11131A] ${isOver ? 'bg-[#232734]/30' : ''} transition-colors`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${conf.bg} ${conf.border} border flex items-center justify-center ${conf.color}`}>
            <Icon size={14} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        </div>
        <span className="px-2.5 py-1 bg-slate-200 dark:bg-[#232734] rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono">{items.length}</span>
      </div>
      
      {/* Body */}
      <div ref={setNodeRef} className={`p-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[150px] transition-colors ${isOver ? 'bg-[#2563EB]/5' : ''}`}>
        <SortableContext id={id} items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(p => <SortableProjectCard key={p._id} project={p} />)}
        </SortableContext>
        {items.length === 0 && (
          <div className={`h-[120px] rounded-[16px] border-2 border-dashed flex items-center justify-center text-xs font-bold transition-all ${isOver ? 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB]' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500'}`}>
            {isOver ? 'Drop project here' : 'Empty Stage'}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableProjectCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project._id, data: project });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  
  const health = getProjectHealth(project);
  const cleanTitle = project.title.replace(/\s*-\s*Project\s*$/i, '');
  const isComplete = project.progress === 100 || project.status === 'Completed';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] p-4 rounded-[20px] cursor-grab active:cursor-grabbing hover:border-[#2563EB]/40 transition-colors shadow-sm dark:shadow-none group relative overflow-hidden flex flex-col gap-3`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusConfig(project.status).bg}`} />
      
      <div className="flex justify-between items-start pl-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 pr-2">{cleanTitle}</h4>
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap flex-shrink-0 ${health.bg} ${health.text} ${health.border}`}>{health.label}</span>
      </div>
      
      <div className="flex items-center justify-between pl-2">
        {project.clientName ? (
           <div className="flex items-center gap-1.5">
             <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-[#232734] border border-[#334155] flex items-center justify-center text-[8px] font-bold text-slate-900 dark:text-white">{getInitials(project.clientName)}</div>
             <p className="text-[10px] font-bold text-[#94A3B8] truncate max-w-[100px]">{project.clientName}</p>
           </div>
        ) : (
           <p className="text-[10px] font-bold text-[#475569] italic">Internal</p>
        )}
        
        {project.deadline && (
          <span className={`flex items-center gap-1 text-[10px] font-bold ${health.label === 'Overdue' ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
            <Calendar size={10} /> {project.status === 'Completed' ? 'Completed ' : ''}{fmtShortDate(project.deadline)}
          </span>
        )}
      </div>

      <div className="pl-2 mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#94A3B8]">Progress</span>
          <span className="text-[10px] font-bold text-slate-900 dark:text-white font-mono">{project.progress || 0}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734]">
          <div className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-[#10B981]' : 'bg-[#2563EB]'}`} style={{ width: `${project.progress || 0}%` }} />
        </div>
      </div>
      
      <div className="flex justify-end pl-2 mt-1">
        {(project.assignees || []).length > 0 ? (
          <div className="flex -space-x-1.5">
            {(project.assignees || []).slice(0, 3).map((a, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#232734] border-2 border-[#11131A] flex items-center justify-center text-[8px] font-bold text-slate-900 dark:text-white shadow-sm" title={a}>{getInitials(a)}</div>
            ))}
          </div>
        ) : <span className="text-[9px] text-[#475569]">No assignees</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectsClient({ initialProjects, initialClients = [] }: ProjectsClientProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Completed' | 'Cancelled' | 'Overdue' | 'All'>('Active');
  
  // Modals & Panels
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('overview');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setProjects(initialProjects); }, [initialProjects]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.techStack || []).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = 
        statusFilter === 'All' ? true :
        statusFilter === 'Active' ? p.status !== 'Completed' && p.status !== 'Cancelled' :
        statusFilter === 'Completed' ? p.status === 'Completed' :
        statusFilter === 'Cancelled' ? p.status === 'Cancelled' :
        statusFilter === 'Overdue' ? checkOverdue(p.deadline) && p.status !== 'Completed' && p.status !== 'Cancelled' :
        p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const STATUSES = ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'];
  const columns = STATUSES.map(s => ({
    id: s,
    title: s,
    items: filteredProjects.filter(p => p.status === s)
  }));

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    let autoStatus = formData.status || 'Planning';
    if (Number(formData.progress) === 100 && autoStatus !== 'Completed') {
      autoStatus = 'Completed';
    }
    const payload = {
      ...formData,
      status: autoStatus,
      assignees: Array.isArray(formData.assignees) ? formData.assignees : (formData.assignees || '').split(',').map((s:string) => s.trim()).filter(Boolean)
    };
    
    // Scrub empty strings that would fail Mongoose validation
    if (payload.platform === '') {
      delete payload.platform;
    }
    if (payload.deadline === '') {
      payload.deadline = null;
    }
    if (payload.startDate === '') {
      payload.startDate = null;
    }

    if (selectedProject && !isAddOpen) {
      const res = await updateProject(selectedProject._id, payload);
      if (res.success) {
        setProjects(projects.map(p => p._id === selectedProject._id ? res.data : p));
        setSelectedProject(res.data);
        toast.success('Project updated');
      } else toast.error('Error updating project');
    } else {
      const res = await createProject(payload);
      if (res.success) {
        setProjects([res.data, ...projects]);
        setIsAddOpen(false);
        toast.success('Project created');
      } else toast.error('Error creating project');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (await confirm({ message: 'Are you sure you want to delete this project?', danger: true })) {
      const res = await deleteProject(id);
      if (res.success) {
        setProjects(projects.filter(p => p._id !== id));
        if (selectedProject?._id === id) setSelectedProject(null);
        toast.success('Project deleted');
      } else toast.error('Error deleting project');
    }
  };

  const openAdd = () => {
    setFormData({ title: '', status: 'Planning', priority: 'Medium', progress: 0, assignees: '' });
    setIsAddOpen(true);
  };

  const openPanel = (p: Project) => {
    setSelectedProject(p);
    setFormData({ ...p, assignees: (p.assignees || []).join(', ') });
    setPanelTab('overview');
    setOpenMenuId(null);
  };

  // ── Dnd-Kit Kanban Logic ────────────────────────────────────────────────────
  const [activeDragProject, setActiveDragProject] = useState<Project | null>(null);
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

    setProjects(projects.map(p => p._id === activeId ? { ...p, status: overCol } : p));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveDragProject(null);
    const { active, over } = e;
    if (!over) return;

    const activeProj = projects.find(p => p._id === active.id);
    if (activeProj) {
      await updateProject(activeProj._id, { status: activeProj.status });
    }
  };

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const activeCount = projects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled').length;
  const compCount = projects.filter(p => p.status === 'Completed').length;
  const cancCount = projects.filter(p => p.status === 'Cancelled').length;
  const overdueCount = projects.filter(p => checkOverdue(p.deadline) && p.status !== 'Completed' && p.status !== 'Cancelled').length;
  const totalCount = projects.length;

  const kpis = [
    { id: 'Active',    label: 'Active Projects', value: activeCount, color: '#2563EB' },
    { id: 'Completed', label: 'Completed',       value: compCount,   color: '#10B981' },
    { id: 'Cancelled', label: 'Cancelled',       value: cancCount,   color: '#64748B' },
    { id: 'Overdue',   label: 'Overdue',         value: overdueCount,color: '#EF4444' },
    { id: 'All',       label: 'All Projects',    value: totalCount,  color: '#8B5CF6' },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] p-4 md:p-8 selection:bg-[#2563EB]/30">
      <div className="max-w-[1800px] mx-auto">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Briefcase size={17} />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Project Management Overview</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Projects</h1>
              <p className="text-sm font-medium text-[#94A3B8]">Manage execution, timelines, and deliverables across your team.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-[#11131A] text-[#94A3B8] border border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white transition-all">
                <UserPlus size={15} /> <span className="hidden sm:inline">Invite Member</span>
              </button>
              <button onClick={openAdd}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">
                <Plus size={16} strokeWidth={2.5} /> New Project
              </button>
            </div>
          </motion.div>

          {/* ── KPI Cards (Filters) ───────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {kpis.map((k) => {
              const isSelected = statusFilter === k.id;
              return (
                <button key={k.id} onClick={() => setStatusFilter(k.id as any)}
                  className={`relative text-left bg-white dark:bg-[#11131A] border rounded-[18px] p-4 flex flex-col justify-center overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none
                    ${isSelected 
                      ? 'border-[#2563EB] shadow-md dark:shadow-none' 
                      : 'border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/40'}`}>
                  {isSelected && <div className="absolute inset-0 bg-[#2563EB]/5 pointer-events-none" />}
                  <p className="text-[11px] font-bold text-[#94A3B8] leading-tight mb-2 relative z-10">{k.label}</p>
                  <p className="text-xl font-bold font-mono tracking-tight relative z-10" style={{ color: k.color }}>{k.value}</p>
                </button>
              );
            })}
          </motion.div>

          {/* ── Filter Bar & View Switcher ────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl p-1 w-full md:w-auto overflow-x-auto hide-scrollbar">
              {[{ id: 'grid', icon: LayoutGrid, label: 'Grid' }, { id: 'list', icon: List, label: 'List' }, { id: 'kanban', icon: Columns, label: 'Kanban' }, { id: 'timeline', icon: GitMerge, label: 'Timeline' }].map(v => (
                <button key={v.id} onClick={() => setViewMode(v.id as ViewMode)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${viewMode === v.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#94A3B8]/80'}`}>
                  {viewMode === v.id && <motion.div layoutId="projectViews" className="absolute inset-0 bg-white dark:bg-[#232734] rounded-lg shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5" />}
                  <v.icon size={14} className="relative z-10" /> <span className="relative z-10">{v.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 w-full flex items-center gap-3">
              <div className="relative flex-1 group">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
                <input type="text" placeholder="Search projects…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white placeholder-[#94A3B8]/60 text-sm font-medium rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
              </div>
              <div className="relative w-32 shrink-0">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white text-sm font-medium rounded-xl pl-4 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#2563EB]/60 cursor-pointer">
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
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
            <div className="w-16 h-16 rounded-[20px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center mb-4"><Briefcase size={24} className="text-[#232734]" /></div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No projects found</p>
            <p className="text-xs text-[#94A3B8] mb-6">Adjust your filters or create a new project.</p>
            <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all">
              <Plus size={14} /> Create Project
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* ── Grid View ── */}
            {viewMode === 'grid' && (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
                {filteredProjects.map((p, i) => {
                  const ss = getStatusConfig(p.status);
                  const health = getProjectHealth(p);
                  const cleanTitle = p.title.replace(/\s*-\s*Project\s*$/i, '');
                  const isComplete = p.progress === 100 || p.status === 'Completed';
                  return (
                    <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => openPanel(p)}
                      className="group relative bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] hover:border-[#2563EB]/40 p-5 rounded-[24px] transition-all cursor-pointer shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-none flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-[12px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center ${ss.color}`}>
                            <ss.icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border mb-1 inline-block ${health.bg} ${health.text} ${health.border}`}>{health.label}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.clientName ? (
                                <>
                                  <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-[#232734] flex items-center justify-center text-[7px] font-bold text-slate-900 dark:text-white">{getInitials(p.clientName)}</div>
                                  <p className="text-[10px] text-[#94A3B8] font-bold truncate max-w-[120px]">{p.clientName}</p>
                                </>
                              ) : (
                                <p className="text-[10px] text-[#475569] font-bold italic truncate max-w-[120px]">Internal</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-5 leading-snug group-hover:text-[#2563EB] transition-colors">{cleanTitle}</h2>
                      
                      <div className="mt-auto space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Progress</span>
                            <span className="text-[10px] font-bold text-slate-900 dark:text-white font-mono">{p.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734]">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress || 0}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full transition-colors ${isComplete ? 'bg-[#10B981]' : 'bg-[#2563EB]'}`} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[#232734]">
                          {p.deadline ? (
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${health.label === 'Overdue' ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                              <Calendar size={10} /> {p.status === 'Completed' ? 'Completed ' : 'Due '}{fmtShortDate(p.deadline)}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold border ${ss.bg} ${ss.border} ${ss.color}`}>
                              {p.status}
                            </span>
                          )}
                          <div className="flex -space-x-1.5">
                            {(p.assignees || []).slice(0,3).map((a, j) => (
                              <div key={j} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#232734] border-2 border-[#11131A] flex items-center justify-center text-[8px] font-bold text-slate-900 dark:text-white">{getInitials(a)}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {/* ── List View ── */}
            {viewMode === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="overflow-hidden rounded-[20px] border border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] shadow-sm dark:shadow-none">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/50">
                      <tr className="border-b border-slate-200 dark:border-[#232734]">
                        <th className="pl-5 pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[260px]">Project</th>
                        <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[120px]">Status</th>
                        <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[160px]">Progress</th>
                        <th className="pr-4 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest min-w-[140px]">Deadline</th>
                        <th className="pr-5 py-3 w-32 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((p, i) => {
                        const ss = getStatusConfig(p.status);
                        return (
                          <motion.tr key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            onClick={() => openPanel(p)}
                            className="border-b border-slate-200 dark:border-[#232734]/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#09090B]/80 transition-colors group">
                            <td className="pl-5 pr-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-[10px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center flex-shrink-0 ${ss.color}`}><ss.icon size={13} /></div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] group-hover:text-[#2563EB] transition-colors">{p.title}</p>
                                  <p className="text-xs text-[#94A3B8] truncate mt-0.5">{p.clientName || 'Internal'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="pr-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${ss.bg} ${ss.border} ${ss.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`} /> {p.status}
                              </span>
                            </td>
                            <td className="pr-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-50 dark:bg-[#09090B] rounded-full overflow-hidden border border-slate-200 dark:border-[#232734] max-w-[100px]">
                                  <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${p.progress || 0}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white w-8 font-mono">{p.progress || 0}%</span>
                              </div>
                            </td>
                            <td className="pr-4 py-4">
                              <div className="flex items-center gap-1.5">
                                {checkOverdue(p.deadline) ? <AlertTriangle size={13} className="text-[#EF4444]" /> : <Calendar size={13} className="text-[#94A3B8]" />}
                                <span className={`text-xs font-bold ${checkOverdue(p.deadline) ? 'text-[#EF4444]' : 'text-slate-900 dark:text-white'}`}>{fmtShortDate(p.deadline)}</span>
                              </div>
                            </td>
                            <td className="pr-5 py-4 flex justify-end">
                              <div className="flex -space-x-1.5">
                                {(p.assignees || []).slice(0,3).map((a, j) => (
                                  <div key={j} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-[#232734] border-2 border-[#11131A] flex items-center justify-center text-[9px] font-bold text-slate-900 dark:text-white">{getInitials(a)}</div>
                                ))}
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
                    {columns.map(col => <DroppableColumn key={col.id} id={col.id} title={col.title} items={col.items} />)}
                  </div>
                  <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeDragProject ? (
                      <div className="opacity-90 scale-105 rotate-2 shadow-2xl">
                        <SortableProjectCard project={activeDragProject} />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </motion.div>
            )}

            {/* ── Timeline View ── */}
            {viewMode === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[20px] p-6">
                <div className="space-y-6">
                  {filteredProjects.sort((a,b) => new Date(a.deadline || '2099').getTime() - new Date(b.deadline || '2099').getTime()).map((p, i) => {
                    const overdue = checkOverdue(p.deadline);
                    const ss = getStatusConfig(p.status);
                    return (
                      <div key={p._id} onClick={() => openPanel(p)} className="flex items-start gap-4 group cursor-pointer">
                        <div className="flex flex-col items-center pt-1.5">
                          <div className={`w-3 h-3 rounded-full border-2 ${overdue ? 'bg-[#EF4444] border-[#EF4444]/30' : 'bg-[#2563EB] border-[#2563EB]/30'}`} />
                          {i !== filteredProjects.length - 1 && <div className="w-px h-16 bg-slate-200 dark:bg-[#232734] mt-2 group-hover:bg-[#2563EB]/40 transition-colors" />}
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl p-4 hover:border-[#2563EB]/40 transition-colors flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors">{p.title}</h4>
                            <p className="text-xs text-[#94A3B8] mt-1 flex items-center gap-2">
                              <span>{p.status === 'Completed' ? 'Completed ' : 'Due '}{fmtDate(p.deadline)}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-[#232734]" />
                              <span className={ss.color}>{p.status}</span>
                            </p>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{p.progress || 0}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

        {/* ── Add / Edit Modal ────────────────────────────────────────── */}
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
                  className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden pointer-events-auto"
                >
                  {/* Header */}
                  <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{isAddOpen ? 'New Project' : 'Project Details'}</span>
                      <div className="flex items-center gap-2">
                        {selectedProject && !isAddOpen && (
                          <button onClick={(e) => handleDelete(selectedProject._id, e)} className="p-2 rounded-[10px] text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent transition-all">
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button onClick={() => { setIsAddOpen(false); setSelectedProject(null); }} className="p-2 rounded-[10px] text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734] border border-slate-200 dark:border-[#232734] transition-all">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-[14px] bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight line-clamp-2">{formData.title || 'Untitled Project'}</h2>
                        <p className="text-sm text-[#94A3B8] truncate">{formData.clientName || 'No Client Assigned'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content / Form */}
                  <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Project Title</label>
                        <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none placeholder-[#94A3B8]/60" placeholder="Enter title..." />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Client Name</label>
                        <select value={formData.clientName || ''} onChange={e => setFormData({...formData, clientName: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none cursor-pointer">
                          <option value="">No Client Assigned</option>
                          {initialClients?.map(client => (
                            <option key={client._id} value={client.name}>{client.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Status</label>
                          <select value={formData.status || 'Planning'} onChange={e => setFormData({...formData, status: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Priority</label>
                          <select value={formData.priority || 'Medium'} onChange={e => setFormData({...formData, priority: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none">
                            {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Description</label>
                        <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none focus:border-[#2563EB]/60 focus:outline-none placeholder-[#94A3B8]/60" placeholder="Project goals..." />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Progress (%)</label>
                          <input type="number" min="0" max="100" value={formData.progress || 0} onChange={e => setFormData({...formData, progress: Number(e.target.value)})}
                            className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Deadline</label>
                          <DatePicker 
                            selected={formData.deadline && !isNaN(new Date(formData.deadline).getTime()) ? new Date(formData.deadline) : null} 
                            onChange={(date: Date | null) => setFormData({...formData, deadline: date ? format(date, 'yyyy-MM-dd') : ''})}
                            className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" 
                            dateFormat="MMMM d, yyyy"
                            placeholderText="Select deadline..."
                            popperPlacement="bottom-start"
                            popperClassName="z-[60]"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Budget ($)</label>
                          <input type="number" step="0.01" min="0" value={formData.budget || ''} onChange={e => setFormData({...formData, budget: e.target.value ? Number(e.target.value) : undefined})}
                            className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Platform</label>
                          <select value={formData.platform || ''} onChange={e => setFormData({...formData, platform: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none appearance-none cursor-pointer">
                            <option value="">No Platform</option>
                            <option value="Upwork">Upwork</option>
                            <option value="Freelancer">Freelancer.com</option>
                            <option value="Fiverr">Fiverr</option>
                            <option value="Direct">Direct</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2 ml-1">Assignees</label>
                        <input type="text" value={formData.assignees || ''} onChange={e => setFormData({...formData, assignees: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-[#2563EB]/60 focus:outline-none placeholder-[#94A3B8]/60" placeholder="Comma separated names..." />
                      </div>
                    </div>
                    
                    {/* Save Button is sticky at bottom */}
                    <div className="pt-6 mt-6 border-t border-slate-200 dark:border-[#232734]">
                      <button type="submit" disabled={isSubmitting || !formData.title}
                        className="w-full py-3.5 bg-[#2563EB] hover:bg-[#2563EB]/90 text-slate-900 dark:text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.25)]">
                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <>{isAddOpen ? 'Create Project' : 'Save Changes'}</>}
                      </button>
                    </div>
                  </form>

                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
