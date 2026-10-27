'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LayoutGrid, List, Clock, Calendar, Search, Filter, Briefcase,
  UserPlus, DownloadCloud, MoreHorizontal, X, Edit2, Trash2,
  Activity, StickyNote, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Loader2, PlayCircle, Columns, GitMerge, FileText, CheckCircle,
  Timer, Sparkles, CheckSquare, Zap, Copy, Shield, Users, Layers,
  Globe, ShoppingCart, Flame, ChevronRight, Check, User, ChevronDown, DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import toast from 'react-hot-toast';
import { notify } from '@/lib/notify';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent, DragOverEvent, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { createProject, updateProject, deleteProject } from '@/app/actions/projectActions';
import { createMarketplaceClient } from '@/actions/marketplaceClientActions';
import { generateProjectTaskChecklist } from '@/app/actions/aiActions';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import DatePicker from '@/components/ui/DatePicker';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  _id: string;
  title: string;
  clientName?: string;
  status: string; // Planning, In Progress, In Review, Completed, On Hold, Cancelled
  priority?: string; // Low, Medium, High, Urgent
  progress?: number;
  deadline?: string;
  startDate?: string;
  budget?: number;
  platform?: string;
  assignees?: string[];
  techStack?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsClientProps {
  initialProjects: any[];
  initialClients?: any[];
  userRole?: string;
}

type ViewMode = 'grid' | 'list' | 'kanban' | 'timeline';
type PanelTab = 'overview' | 'notes' | 'timeline';

// ─── Configs & Themes ─────────────────────────────────────────────────────────
const PLATFORM_CHANNELS = [
  { id: 'Freelancer', name: 'Freelancer', icon: Globe, color: '#00E5FF' },
  { id: 'Direct', name: 'Direct Client', icon: Users, color: '#6324FC' },
  { id: 'Upwork', name: 'Upwork', icon: Briefcase, color: '#10B981' },
  { id: 'Fiverr', name: 'Fiverr', icon: ShoppingCart, color: '#EC4899' },
  { id: 'Internal', name: 'Internal Project', icon: Shield, color: '#F59E0B' },
];

const STATUS_OPTIONS = [
  { id: 'Planning', label: 'Planning', icon: FileText, color: '#00E5FF', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/30' },
  { id: 'In Progress', label: 'In Progress', icon: PlayCircle, color: '#6324FC', bg: 'bg-[#6324FC]/10', border: 'border-[#6324FC]/30' },
  { id: 'In Review', label: 'In Review', icon: Activity, color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/30' },
  { id: 'Completed', label: 'Completed', icon: CheckCircle, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'On Hold', label: 'On Hold', icon: Clock, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'Cancelled', label: 'Cancelled', icon: X, color: '#EF4444', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
];

const PRIORITY_OPTIONS = [
  { id: 'Low', label: 'Low', color: '#94A3B8', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 'Medium', label: 'Medium', color: '#00E5FF', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/30' },
  { id: 'High', label: 'High', color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'Urgent', label: 'Urgent', color: '#EF4444', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
];

const POPULAR_TECH_STACK = [
  'Next.js', 'React', 'TypeScript', 'TailwindCSS', 'Node.js',
  'MongoDB', 'PostgreSQL', 'Laravel', 'Python', 'AWS',
  'Docker', 'Figma', 'SEO'
];

const TEAM_SUGGESTIONS = [
  'Mamun H.', 'Lead Architect', 'Frontend Lead', 'Backend Dev', 'UI Designer', 'QA Lead'
];

const STATUS_CONFIG: Record<string, {
  name: string;
  color: string;
  hexColor: string;
  glowColor: string;
  bg: string;
  border: string;
  dot: string;
  icon: React.ElementType
}> = {
  'Planning': {
    name: 'Planning',
    color: 'text-[#00E5FF]',
    hexColor: '#00E5FF',
    glowColor: 'rgba(0,229,255,0.25)',
    bg: 'bg-[#00E5FF]/10',
    border: 'border-[#00E5FF]/30',
    dot: 'bg-[#00E5FF]',
    icon: FileText
  },
  'In Progress': {
    name: 'In Progress',
    color: 'text-[#6324FC]',
    hexColor: '#6324FC',
    glowColor: 'rgba(99,36,252,0.25)',
    bg: 'bg-[#6324FC]/10',
    border: 'border-[#6324FC]/30',
    dot: 'bg-[#6324FC]',
    icon: PlayCircle
  },
  'In Review': {
    name: 'In Review',
    color: 'text-[#A78BFA]',
    hexColor: '#A78BFA',
    glowColor: 'rgba(167,139,250,0.25)',
    bg: 'bg-[#8B5CF6]/10',
    border: 'border-[#8B5CF6]/30',
    dot: 'bg-[#8B5CF6]',
    icon: Activity
  },
  'Completed': {
    name: 'Completed',
    color: 'text-emerald-400',
    hexColor: '#10B981',
    glowColor: 'rgba(16,185,129,0.25)',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    icon: CheckCircle
  },
  'On Hold': {
    name: 'On Hold',
    color: 'text-amber-400',
    hexColor: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.25)',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    icon: Clock
  },
  'Cancelled': {
    name: 'Cancelled',
    color: 'text-rose-400',
    hexColor: '#EF4444',
    glowColor: 'rgba(239,68,68,0.25)',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    icon: X
  },
};

function getStatusConfig(s: string) {
  return STATUS_CONFIG[s] ?? STATUS_CONFIG['Planning'];
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Low':    { color: 'text-secondary', bg: 'bg-white/5', border: 'border-white/10' },
  'Medium': { color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/30' },
  'High':   { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  'Urgent': { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

function getPriorityConfig(p?: string) {
  return PRIORITY_CONFIG[p || 'Medium'] ?? PRIORITY_CONFIG['Medium'];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d?: string) {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
  } catch {
    return '—';
  }
}

function fmtShortDate(d?: string) {
  if (!d) return 'No Date';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
  } catch {
    return 'No Date';
  }
}

function fmtCurrency(v?: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
}

function getInitials(name: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const checkOverdue = (deadline?: string, status?: string) => {
  if (!deadline) return false;
  if (status === 'Completed' || status === 'Cancelled') return false;
  return new Date(deadline).getTime() < new Date().setHours(0,0,0,0);
};

const getProjectHealth = (p: Project) => {
  if (p.status === 'Completed' || (p.progress || 0) === 100) {
    return { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  }
  if (checkOverdue(p.deadline, p.status)) {
    return { label: 'Overdue', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
  }
  if (p.deadline) {
    const daysLeft = (new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysLeft < 3 && (p.progress || 0) < 80) {
      return { label: 'At Risk', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    }
  }
  return { label: 'On Track', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } }
};

// ─── Kanban Components ────────────────────────────────────────────────────────
function DroppableColumn({ id, title, items }: { id: string, title: string, items: Project[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const conf = getStatusConfig(title);
  const Icon = conf.icon;

  return (
    <div className="flex flex-col w-[320px] shrink-0 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-md dark:shadow-lg">
      {/* Header */}
      <div className={`p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02] ${isOver ? 'bg-[#6324FC]/10' : ''} transition-colors relative`}>
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, ${conf.hexColor}, transparent)`,
            boxShadow: `0 0 10px ${conf.hexColor}`
          }}
        />
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${conf.hexColor}15`,
              borderColor: `${conf.hexColor}35`,
              color: conf.hexColor
            }}
          >
            <Icon size={14} />
          </div>
          <h3 className="font-heading font-extrabold text-slate-900 dark:text-white text-xs tracking-wide">{title}</h3>
        </div>
        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white">
          {items.length}
        </span>
      </div>

      {/* Body */}
      <div
        ref={setNodeRef}
        className={`p-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[200px] max-h-[calc(100vh-320px)] transition-colors ${
          isOver ? 'bg-[#6324FC]/5 ring-1 ring-[#6324FC]/30' : ''
        }`}
      >
        <SortableContext id={id} items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          {items.map(p => <SortableProjectCard key={p._id} project={p} />)}
        </SortableContext>
        {items.length === 0 && (
          <div className="h-[120px] rounded-xl border border-dashed border-black/10 dark:border-white/10 flex items-center justify-center text-xs font-heading font-bold text-secondary">
            {isOver ? 'Drop project here' : 'Empty Stage'}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableProjectCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project._id, data: project });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };

  const conf = getStatusConfig(project.status);
  const health = getProjectHealth(project);
  const cleanTitle = project.title.replace(/\s*-\s*Project\s*$/i, '');
  const isComplete = project.progress === 100 || project.status === 'Completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group glass-card rounded-2xl p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing relative overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 shadow-sm dark:shadow-md select-none"
    >
      {/* Radial Hover Spotlight */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 blur-[30px] rounded-full opacity-20 dark:opacity-30 group-hover:opacity-90 group-hover:scale-150 transition-all duration-500 pointer-events-none"
        style={{ backgroundColor: conf.hexColor }}
      />

      {/* Top Accent Neon Line - Expands on hover */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 group-hover:w-full h-[2px] transition-all duration-500 opacity-80 group-hover:opacity-100"
        style={{
          backgroundImage: `linear-gradient(to right, transparent, ${conf.hexColor}, transparent)`,
          boxShadow: `0 0 10px ${conf.hexColor}`
        }}
      />

      {/* Subtle Card Glass Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Card Header: Title & Health Badge */}
      <div className="relative z-10 flex justify-between items-start gap-2">
        <h4 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
          {cleanTitle}
        </h4>
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${health.bg} ${health.text} ${health.border}`}>
          {health.label}
        </span>
      </div>

      {/* Client & Deadline */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-secondary">
        {project.clientName ? (
          <div className="flex items-center gap-1.5 truncate">
            <div className="w-4 h-4 rounded bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center text-[7px] font-bold shrink-0">
              {getInitials(project.clientName)}
            </div>
            <span className="truncate max-w-[110px] text-slate-900 dark:text-white font-medium">{project.clientName}</span>
          </div>
        ) : (
          <span className="text-secondary/60 italic">Internal</span>
        )}

        {project.deadline && (
          <span className={`flex items-center gap-1 ${health.label === 'Overdue' ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-secondary'}`}>
            <Calendar size={10} /> {fmtShortDate(project.deadline)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-secondary">Progress</span>
          <span className="text-slate-900 dark:text-white font-bold">{project.progress || 0}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${project.progress || 0}%`,
              backgroundColor: isComplete ? '#10B981' : conf.hexColor
            }}
          />
        </div>
      </div>

      {/* Footer: Timer & Assignees */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('start-project-timer', { detail: { projectName: project.title } }));
            toast.success(`Timer started for "${cleanTitle}"`);
          }}
          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-heading font-bold flex items-center gap-1 transition-colors border border-emerald-500/20"
        >
          <Timer size={10} /> Timer
        </button>

        {(project.assignees || []).length > 0 ? (
          <div className="flex -space-x-1.5">
            {(project.assignees || []).slice(0, 3).map((a, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-purple-500/15 dark:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-black/10 dark:border-white/10 flex items-center justify-center text-[7px] font-bold shadow-sm"
                title={a}
              >
                {getInitials(a)}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[9px] text-secondary font-mono">No team</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectsClient({ initialProjects = [], initialClients = [], userRole }: ProjectsClientProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const canDelete = userRole === 'admin' || userRole === 'owner';

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [clients, setClients] = useState<any[]>(initialClients);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [aiTasks, setAiTasks] = useState<any[]>([]);
  const [isGeneratingAiTasks, setIsGeneratingAiTasks] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Modals & Panels
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('overview');
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client Search in Modal
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  // Custom Tech Input
  const [customTechInput, setCustomTechInput] = useState('');

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  // Click outside client dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClientsList = clients.filter(c =>
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const handleCreateClientOnTheFly = async () => {
    if (!clientSearch.trim() || isCreatingClient) return;
    setIsCreatingClient(true);
    try {
      const res = await createMarketplaceClient({
        name: clientSearch.trim(),
        platform: formData.platform === 'Internal' ? 'Direct' : (formData.platform || 'Freelancer')
      });
      if (res.success && res.data) {
        setClients([res.data, ...clients]);
        setFormData((prev: any) => ({ ...prev, clientName: res.data.name }));
        setShowClientDropdown(false);
        toast.success(`Client "${res.data.name}" created!`);
      } else {
        toast.error('Failed to create client');
      }
    } catch {
      toast.error('Error creating client');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const toggleTechStackTag = (tech: string) => {
    const currentStack: string[] = Array.isArray(formData.techStack)
      ? formData.techStack
      : (formData.techStack || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    let nextStack: string[];
    if (currentStack.includes(tech)) {
      nextStack = currentStack.filter((t: string) => t !== tech);
    } else {
      nextStack = [...currentStack, tech];
    }
    setFormData({ ...formData, techStack: nextStack });
  };

  const handleCustomTechAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = customTechInput.trim().replace(/^,|,$/g, '');
      if (!val) return;
      const currentStack: string[] = Array.isArray(formData.techStack)
        ? formData.techStack
        : (formData.techStack || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      if (!currentStack.includes(val)) {
        setFormData({ ...formData, techStack: [...currentStack, val] });
      }
      setCustomTechInput('');
    }
  };

  const toggleAssignee = (name: string) => {
    const currentAssignees: string[] = Array.isArray(formData.assignees)
      ? formData.assignees
      : (formData.assignees || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    let nextAssignees: string[];
    if (currentAssignees.includes(name)) {
      nextAssignees = currentAssignees.filter((a: string) => a !== name);
    } else {
      nextAssignees = [...currentAssignees, name];
    }
    setFormData({ ...formData, assignees: nextAssignees });
  };

  // ── AI Tasks Generator ──────────────────────────────────────────────────────
  const handleGenerateAiTasks = async () => {
    if (!formData.title || isGeneratingAiTasks) return;
    setIsGeneratingAiTasks(true);
    toast.loading('Generating sprint deliverables with Gemini AI...', { id: 'ai-tasks' });
    try {
      const res = await generateProjectTaskChecklist({
        projectTitle: formData.title,
        description: formData.description,
        techStack: formData.techStack,
      });
      if (res.success && res.tasks) {
        setAiTasks(res.tasks);
        toast.success(`Generated ${res.tasks.length} actionable sprint tasks!`, { id: 'ai-tasks' });
      } else {
        toast.error(res.error || 'Failed to generate sprint tasks', { id: 'ai-tasks' });
      }
    } catch {
      toast.error('Error generating sprint tasks', { id: 'ai-tasks' });
    } finally {
      setIsGeneratingAiTasks(false);
    }
  };

  // ── Filtered Projects ───────────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchClient = (p.clientName || '').toLowerCase().includes(q);
        const matchTech = (p.techStack || []).join(' ').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchTech && !matchDesc) return false;
      }

      // Priority Filter
      if (priorityFilter !== 'All' && p.priority !== priorityFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'All') return true;
      if (statusFilter === 'Active') return p.status !== 'Completed' && p.status !== 'Cancelled';
      if (statusFilter === 'Completed') return p.status === 'Completed';
      if (statusFilter === 'Cancelled') return p.status === 'Cancelled';
      if (statusFilter === 'Overdue') return checkOverdue(p.deadline, p.status);
      if (statusFilter === 'Monetized') return (p.budget || 0) > 0;
      return p.status === statusFilter;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  const STATUSES = ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'];
  const columns = STATUSES.map(s => ({
    id: s,
    title: s,
    items: filteredProjects.filter(p => p.status === s)
  }));

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Project title is required');
      return;
    }

    setIsSubmitting(true);
    let autoStatus = formData.status || 'Planning';
    if (Number(formData.progress) === 100 && autoStatus !== 'Completed') {
      autoStatus = 'Completed';
    }

    const payload = {
      ...formData,
      status: autoStatus,
      clientName: formData.clientName || clientSearch || undefined,
      assignees: Array.isArray(formData.assignees)
        ? formData.assignees
        : (formData.assignees || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      techStack: Array.isArray(formData.techStack)
        ? formData.techStack
        : (formData.techStack || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      budget: formData.budget ? Number(formData.budget) : undefined
    };

    if (payload.platform === '') delete payload.platform;
    if (payload.deadline === '') payload.deadline = null;
    if (payload.startDate === '') payload.startDate = null;

    try {
      if (selectedProject && !isAddOpen) {
        notify.edit('Project updated successfully');
        const res = await updateProject(selectedProject._id, payload);
        if (res.success && res.data) {
          setProjects(prev => prev.map(p => p._id === selectedProject._id ? res.data : p));
          setSelectedProject(res.data);
        } else {
          notify.error('Error updating project');
        }
      } else {
        // 🚀 0ms Instant Feedback
        notify.instant({
          type: 'system',
          sound: 'success',
          message: `Project "${payload.title || 'New Project'}" was created.`,
          link: '/projects'
        });
        setIsAddOpen(false);

        const res = await createProject(payload);
        if (res.success && res.data) {
          setProjects(prev => [res.data, ...prev]);
        } else {
          notify.error('Error creating project');
        }
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canDelete) {
      toast.error('Unauthorized: Deleting projects requires admin or owner role');
      return;
    }
    const isConfirmed = await confirm({
      title: 'Delete Project?',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      danger: true,
      confirmText: 'Delete Project'
    });
    if (!isConfirmed) return;

    try {
      const res = await deleteProject(id);
      if (res.success) {
        setProjects(prev => prev.filter(p => p._id !== id));
        if (selectedProject?._id === id) setSelectedProject(null);
        if (res.warning) {
          toast(res.warning, { icon: '⚠️' });
        } else {
          toast.success('Project deleted');
        }
      } else {
        toast.error(res.error || 'Error deleting project');
      }
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const openAdd = () => {
    setFormData({
      title: '',
      status: 'Planning',
      priority: 'Medium',
      progress: 0,
      assignees: ['Mamun H.'],
      techStack: ['Next.js', 'React', 'MongoDB'],
      clientName: '',
      platform: 'Freelancer',
      budget: '',
      deadline: '',
      startDate: new Date().toISOString().split('T')[0],
      description: ''
    });
    setClientSearch('');
    setCustomTechInput('');
    setAiTasks([]);
    setIsAddOpen(true);
  };

  const openPanel = (p: Project) => {
    setSelectedProject(p);
    setFormData({
      ...p,
      assignees: Array.isArray(p.assignees) ? p.assignees : (p.assignees || []).join(', ').split(', ').filter(Boolean),
      techStack: Array.isArray(p.techStack) ? p.techStack : (p.techStack || []).join(', ').split(', ').filter(Boolean)
    });
    setClientSearch(p.clientName || '');
    setPanelTab('overview');
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

    setProjects(prev => prev.map(p => p._id === activeId ? { ...p, status: overCol } : p));
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

  // ── KPIs Calculations ───────────────────────────────────────────────────────
  const activeCount = projects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled').length;
  const compCount = projects.filter(p => p.status === 'Completed').length;
  const overdueCount = projects.filter(p => checkOverdue(p.deadline, p.status)).length;
  const onHoldCount = projects.filter(p => p.status === 'On Hold').length;
  const totalCount = projects.length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const completionRate = totalCount > 0 ? Math.round((compCount / totalCount) * 100) : 0;

  const kpis = [
    {
      id: 'Active',
      label: 'Active Operations',
      value: activeCount,
      color: '#00E5FF',
      icon: PlayCircle,
      badge: 'In Flight',
      subtitle: 'In-flight sprints & reviews'
    },
    {
      id: 'Monetized',
      label: 'Pipeline Contract Value',
      value: fmtCurrency(totalBudget),
      color: '#10B981',
      icon: DollarSign,
      badge: `${projects.filter(p => (p.budget || 0) > 0).length} Contracts`,
      subtitle: 'Total portfolio volume'
    },
    {
      id: 'Completed',
      label: 'Delivered Projects',
      value: compCount,
      color: '#6324FC',
      icon: CheckCircle,
      badge: `${completionRate}% Done`,
      subtitle: 'Completed deliverables'
    },
    {
      id: 'Overdue',
      label: 'Overdue / At-Risk',
      value: overdueCount,
      color: '#EF4444',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? `${overdueCount} Alerts` : 'All On Track',
      subtitle: overdueCount > 0 ? 'Urgent intervention needed' : 'Zero overdue milestones'
    },
    {
      id: 'On Hold',
      label: 'On Hold / Paused',
      value: onHoldCount,
      color: '#F59E0B',
      icon: Clock,
      badge: 'Paused',
      subtitle: 'Awaiting client or assets'
    },
    {
      id: 'All',
      label: 'Total Pipeline',
      value: totalCount,
      color: '#8B5CF6',
      icon: Layers,
      badge: 'All Stages',
      subtitle: 'Enterprise operations roster'
    },
  ];

  const currentPlatformObj = PLATFORM_CHANNELS.find(p => p.id.toLowerCase() === (formData.platform || 'Freelancer').toLowerCase()) || PLATFORM_CHANNELS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 pt-6 pb-24 font-sans selection:bg-[#6324FC] selection:text-white">

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#00E5FF]/5 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-[1750px] mx-auto relative z-10 space-y-6">

        {/* ── Executive Header & Live Telemetry Bar (Standardized to Match Dashboard) ── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10 pb-2 border-b border-black/5 dark:border-white/5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-heading font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#6324FC] dark:shadow-[0_0_8px_#00E5FF]" />
                INJAAZH GLOBAL OS // OPERATIONS SUITE
              </div>
              <span className="text-xs font-sans text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Projects &amp; Operations Engine
            </h1>
            <p className="text-xs sm:text-sm font-sans text-secondary mt-1 max-w-2xl">
              Enterprise sprint execution, Kanban pipelines, client deliverables, milestones &amp; team performance.
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
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { initialPrompt: 'Review my active projects and highlight urgent deadlines or bottlenecks' } }))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-sm"
            >
              <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* + New Project Laser Beam CTA (Symmetrically Calibrated Clockwise Single Stream) */}
            <button
              type="button"
              onClick={openAdd}
              className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
            >
              {/* Perfectly Centered Square Conic Glow Aura (Uniform Distance on All 4 Sides) */}
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />

              {/* Crisp Symmetrical Single Laser Beam Stream (Clockwise: Left to Right Loop) */}
              <span
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />

              {/* Inner High-Contrast Surface: Concentric 10px radius matching outer 12px minus 2px */}
              <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                <Briefcase size={14} className="text-[#00E5FF] group-hover:rotate-6 group-hover:scale-110 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + New Project
                </span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* ── High-Level Operations Telemetry Section (Dashboard Matching) ── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2.5">
              <Activity size={16} className="text-[#6324FC]" /> High-Level Operations Telemetry
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span>Live Engine Connected</span>
            </div>
          </div>

          {/* 6 Metric Cards Matching Dashboard 1:1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            {kpis.map((k) => {
              const isSelected = statusFilter === k.id;
              const KIcon = k.icon;
              return (
                <div
                  key={k.id}
                  onClick={() => setStatusFilter(statusFilter === k.id ? 'All' : k.id)}
                  className={`group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-[#0a0a0d] border ${
                    isSelected
                      ? 'ring-2 ring-purple-500/50'
                      : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'
                  }`}
                  style={{
                    borderColor: isSelected ? k.color : undefined,
                    boxShadow: isSelected
                      ? `0 0 25px ${k.color}35`
                      : undefined,
                  }}
                >
                  {/* Radial Hover Spotlight */}
                  <div
                    className="absolute -top-10 -right-10 w-36 h-36 blur-[35px] rounded-full opacity-30 dark:opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                    style={{ backgroundColor: `${k.color}40` }}
                  />

                  {/* Top Accent Neon Line - Expands on hover */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] transition-all duration-500 opacity-90"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${k.color}, transparent)`,
                      boxShadow: `0 0 10px ${k.color}`,
                    }}
                  />

                  {/* Subtle Card Glass Sheen Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top Row: Icon Container & Pill Badge */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm border"
                      style={{
                        backgroundColor: `${k.color}15`,
                        borderColor: `${k.color}30`,
                        color: k.color,
                      }}
                    >
                      <KIcon size={21} />
                    </div>

                    <span
                      className="text-xs font-heading font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: `${k.color}15`,
                        borderColor: `${k.color}30`,
                        color: k.color,
                      }}
                    >
                      {isSelected ? '● Selected' : k.badge}
                    </span>
                  </div>

                  {/* Bottom Content */}
                  <div className="relative z-10">
                    <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">
                      {k.label}
                    </p>
                    <p
                      className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white transition-all"
                      style={{
                        color: k.color,
                      }}
                    >
                      {k.value}
                    </p>
                    <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                      {k.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

          {/* ── Filter Bar & View Switcher ──────────────────────────────────── */}
          <div className="p-4 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl space-y-3.5 shadow-sm dark:shadow-lg">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

              {/* View Switcher Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl p-1 overflow-x-auto scrollbar-none">
                {[
                  { id: 'grid', icon: LayoutGrid, label: 'Grid View' },
                  { id: 'list', icon: List, label: 'List Table' },
                  { id: 'kanban', icon: Columns, label: 'Kanban Sprints' },
                  { id: 'timeline', icon: GitMerge, label: 'Milestone Timeline' }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setViewMode(v.id as ViewMode)}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-all whitespace-nowrap ${
                      viewMode === v.id
                        ? 'text-white bg-[#6324FC] shadow-[0_0_12px_rgba(99,36,252,0.5)]'
                        : 'text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <v.icon size={14} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-end">

                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px] group">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-[#6324FC] dark:group-focus-within:text-[#00E5FF] transition-colors pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search projects, clients, tech stack..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-heading font-bold text-slate-800 dark:text-secondary focus:text-slate-900 dark:focus:text-white outline-none cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-heading font-bold text-slate-800 dark:text-secondary focus:text-slate-900 dark:focus:text-white outline-none cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all"
                >
                  <option value="Active">Active Projects</option>
                  <option value="All">All Projects</option>
                  <option value="Monetized">Monetized Contracts</option>
                  <option value="Overdue">Overdue / At-Risk</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center justify-between text-[11px] font-mono text-secondary pt-1 border-t border-black/5 dark:border-white/5">
              <div>
                Showing <span className="text-slate-900 dark:text-white font-bold">{filteredProjects.length}</span> of <span className="text-slate-900 dark:text-white font-bold">{projects.length}</span> total projects
              </div>
              {(searchQuery || statusFilter !== 'Active' || priorityFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('Active');
                    setPriorityFilter('All');
                  }}
                  className="text-[#6324FC] dark:text-[#00E5FF] hover:underline font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

        </motion.div>

        {/* ── Main Content Area ────────────────────────────────────────────── */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 md:p-16 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 text-center flex flex-col items-center justify-center shadow-md dark:shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary mb-4">
              <Briefcase size={28} />
            </div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 dark:text-white mb-1">
              No projects matched your criteria
            </h3>
            <p className="text-xs text-secondary max-w-sm mb-6">
              Adjust your status filter, search query, or initialize a new project sprint.
            </p>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6324FC] hover:bg-[#521bd6] text-white text-xs font-heading font-bold transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)]"
            >
              <Plus size={14} /> Create Project
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── 1. GRID VIEW (STANDARDIZED LUXURY PROJECT CARDS) ── */}
            {viewMode === 'grid' && (
              <motion.div
                key="grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredProjects.map((p) => {
                  const conf = getStatusConfig(p.status);
                  const prioConf = getPriorityConfig(p.priority);
                  const health = getProjectHealth(p);
                  const cleanTitle = p.title.replace(/\s*-\s*Project\s*$/i, '');
                  const isComplete = p.progress === 100 || p.status === 'Completed';

                  return (
                    <motion.div
                      key={p._id}
                      variants={itemVariants}
                      onClick={() => openPanel(p)}
                      className="group glass-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 shadow-sm dark:shadow-lg"
                    >
                      {/* Radial Hover Spotlight */}
                      <div
                        className="absolute -top-10 -right-10 w-32 h-32 blur-[35px] rounded-full opacity-20 dark:opacity-35 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none"
                        style={{ backgroundColor: conf.hexColor }}
                      />

                      {/* Top Accent Neon Line - Expands on hover */}
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 group-hover:w-full h-[2px] transition-all duration-500 opacity-90"
                        style={{
                          backgroundImage: `linear-gradient(to right, transparent, ${conf.hexColor}, transparent)`,
                          boxShadow: `0 0 10px ${conf.hexColor}`
                        }}
                      />

                      {/* Subtle Card Glass Sheen Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] dark:from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      {/* Card Header: Icon & Health Badge */}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-extrabold text-xs shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110 border"
                              style={{
                                backgroundColor: `${conf.hexColor}15`,
                                borderColor: `${conf.hexColor}35`,
                                color: conf.hexColor,
                                boxShadow: `0 0 10px ${conf.hexColor}20`
                              }}
                            >
                              <conf.icon size={17} />
                            </div>
                            <div className="min-w-0">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border mb-1 ${health.bg} ${health.text} ${health.border}`}>
                                {health.label}
                              </span>
                              <p className="text-[10px] text-secondary truncate flex items-center gap-1 font-mono">
                                {p.clientName ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF]" />
                                    <span className="text-slate-900 dark:text-white font-medium truncate">{p.clientName}</span>
                                  </>
                                ) : (
                                  <span className="text-secondary/60 uppercase">Internal Operation</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border shrink-0 ${prioConf.bg} ${prioConf.color} ${prioConf.border}`}>
                            {p.priority || 'Medium'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-heading font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-3">
                          <span className="group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-all">
                            {cleanTitle}
                          </span>
                        </h3>

                        {/* Tech Stack Tags */}
                        {p.techStack && p.techStack.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mb-4">
                            {p.techStack.slice(0, 3).map((tech, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[9px] font-mono text-slate-700 dark:text-secondary">
                                {tech}
                              </span>
                            ))}
                            {p.techStack.length > 3 && (
                              <span className="text-[9px] font-mono text-secondary">+{p.techStack.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Progress, Deadline & Timer */}
                      <div className="relative z-10 space-y-3 pt-3 border-t border-black/5 dark:border-white/5">
                        <div>
                          <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                            <span className="text-secondary uppercase">Progress</span>
                            <span className="text-slate-900 dark:text-white font-bold">{p.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${p.progress || 0}%`,
                                backgroundColor: isComplete ? '#10B981' : conf.hexColor
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                          {p.deadline ? (
                            <span className={`flex items-center gap-1 font-bold ${health.label === 'Overdue' ? 'text-rose-500 dark:text-rose-400' : 'text-secondary'}`}>
                              <Calendar size={11} /> {fmtShortDate(p.deadline)}
                            </span>
                          ) : (
                            <span className="text-secondary/50">No Deadline</span>
                          )}

                          {p.budget ? (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {fmtCurrency(p.budget)}
                            </span>
                          ) : null}
                        </div>

                        {/* Button Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('start-project-timer', { detail: { projectName: p.title } }));
                              toast.success(`Timer started for "${cleanTitle}"`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/20 text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] font-heading font-bold flex items-center gap-1 transition-all border border-black/5 dark:border-white/5 hover:border-emerald-500/30"
                          >
                            <Timer size={11} /> Start Timer
                          </button>

                          {(p.assignees || []).length > 0 ? (
                            <div className="flex -space-x-1.5">
                              {(p.assignees || []).slice(0, 3).map((a, j) => (
                                <div
                                  key={j}
                                  className="w-6 h-6 rounded-full bg-purple-500/15 dark:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-black/10 dark:border-white/10 flex items-center justify-center text-[8px] font-bold shadow-sm"
                                  title={a}
                                >
                                  {getInitials(a)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9px] text-secondary font-mono">No team</span>
                          )}
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── 2. LIST VIEW (TELEMETRY DATA TABLE) ── */}
            {viewMode === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-xl"
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#060608] border-b border-black/10 dark:border-white/10">
                      <tr>
                        <th className="pl-5 pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[240px]">
                          Project & Client
                        </th>
                        <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[120px]">
                          Status
                        </th>
                        <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[140px]">
                          Progress
                        </th>
                        <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[120px]">
                          Deadline
                        </th>
                        <th className="pr-4 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest min-w-[100px] text-right">
                          Budget
                        </th>
                        <th className="pr-5 py-3.5 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right w-32">
                          Team & Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredProjects.map((p) => {
                        const conf = getStatusConfig(p.status);
                        return (
                          <motion.tr
                            key={p._id}
                            onClick={() => openPanel(p)}
                            className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                          >
                            <td className="pl-5 pr-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                                  style={{
                                    backgroundColor: `${conf.hexColor}15`,
                                    borderColor: `${conf.hexColor}35`,
                                    color: conf.hexColor
                                  }}
                                >
                                  <conf.icon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-heading font-bold text-slate-900 dark:text-white truncate group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
                                    {p.title}
                                  </p>
                                  <p className="text-[10px] text-secondary font-mono truncate mt-0.5">
                                    {p.clientName || 'Internal Operation'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="pr-4 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${conf.bg} ${conf.border} ${conf.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} /> {p.status}
                              </span>
                            </td>

                            <td className="pr-4 py-3.5">
                              <div className="flex items-center gap-2.5 max-w-[120px]">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#060608] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${p.progress || 0}%`,
                                      backgroundColor: conf.hexColor
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">{p.progress || 0}%</span>
                              </div>
                            </td>

                            <td className="pr-4 py-3.5">
                              <div className="flex items-center gap-1.5 text-xs">
                                {checkOverdue(p.deadline, p.status) ? (
                                  <AlertTriangle size={12} className="text-rose-500 dark:text-rose-400 shrink-0" />
                                ) : (
                                  <Calendar size={12} className="text-secondary shrink-0" />
                                )}
                                <span className={`font-mono text-xs font-medium ${checkOverdue(p.deadline, p.status) ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                                  {fmtShortDate(p.deadline)}
                                </span>
                              </div>
                            </td>

                            <td className="pr-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {p.budget ? fmtCurrency(p.budget) : '—'}
                            </td>

                            <td className="pr-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                {(p.assignees || []).length > 0 && (
                                  <div className="flex -space-x-1.5">
                                    {(p.assignees || []).slice(0, 2).map((a, j) => (
                                      <div key={j} className="w-6 h-6 rounded-full bg-purple-500/15 dark:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] border border-black/10 dark:border-white/10 flex items-center justify-center text-[7px] font-bold">
                                        {getInitials(a)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openPanel(p)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                                  title="Edit Project"
                                >
                                  <Edit2 size={12} />
                                </button>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDelete(p._id, e)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                                    title="Delete Project"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
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

            {/* ── 3. KANBAN VIEW (DND KIT SPRINT COLUMNS) ── */}
            {viewMode === 'kanban' && (
              <motion.div
                key="kanban"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pb-4"
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragEnd={onDragEnd}
                >
                  <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 pb-4">
                    {columns.map(col => <DroppableColumn key={col.id} id={col.id} title={col.title} items={col.items} />)}
                  </div>
                  <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeDragProject ? (
                      <div className="opacity-95 scale-105 rotate-1 shadow-2xl">
                        <SortableProjectCard project={activeDragProject} />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </motion.div>
            )}

            {/* ── 4. TIMELINE VIEW ── */}
            {viewMode === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                  <h3 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <GitMerge size={14} className="text-[#6324FC] dark:text-[#00E5FF]" /> Project Schedule & Milestone Nodes
                  </h3>
                  <span className="text-[10px] font-mono text-secondary">Ordered by target deadline</span>
                </div>

                <div className="space-y-4">
                  {filteredProjects
                    .sort((a, b) => new Date(a.deadline || '2099').getTime() - new Date(b.deadline || '2099').getTime())
                    .map((p, i, arr) => {
                      const overdue = checkOverdue(p.deadline, p.status);
                      const conf = getStatusConfig(p.status);
                      return (
                        <div key={p._id} onClick={() => openPanel(p)} className="flex items-start gap-4 group cursor-pointer">
                          <div className="flex flex-col items-center pt-2">
                            <div
                              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                overdue
                                  ? 'bg-rose-500 border-rose-500/40 shadow-[0_0_8px_#EF4444]'
                                  : 'bg-[#6324FC] border-[#6324FC]/40 shadow-[0_0_8px_#6324FC]'
                              }`}
                            />
                            {i !== arr.length - 1 && (
                              <div className="w-px h-16 bg-black/10 dark:bg-white/10 mt-2 group-hover:bg-[#6324FC] transition-colors" />
                            )}
                          </div>

                          <div className="flex-1 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 group-hover:border-black/20 dark:group-hover:border-white/20 rounded-xl p-4 transition-all flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
                                {p.title}
                              </h4>
                              <p className="text-[10px] font-mono text-secondary mt-1 flex items-center gap-2">
                                <span className={overdue ? 'text-rose-500 dark:text-rose-400 font-bold' : ''}>
                                  {p.status === 'Completed' ? 'Completed ' : 'Target: '}{fmtDate(p.deadline)}
                                </span>
                                <span>·</span>
                                <span className={conf.color}>{p.status}</span>
                                {p.clientName && (
                                  <>
                                    <span>·</span>
                                    <span className="text-slate-900 dark:text-white">{p.clientName}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10">
                              {p.progress || 0}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

        {/* ── Add / Edit Project Modal (BRUTALIST LUXURY MASTER MODAL) ──────── */}
        <AnimatePresence>
          {(isAddOpen || selectedProject) && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-xl"
                onClick={() => { setIsAddOpen(false); setSelectedProject(null); }}
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="relative w-full max-w-2xl my-auto bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.3),0_0_35px_rgba(99,36,252,0.15)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(99,36,252,0.3)] flex flex-col overflow-hidden z-10 max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Dynamic Top Glow Line matching chosen Platform */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2.5px] z-20 transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent, ${currentPlatformObj.color}, transparent)`,
                    boxShadow: `0 0 15px ${currentPlatformObj.color}`
                  }}
                />

                {/* Modal Header */}
                <div className="p-5 md:p-6 border-b border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0 transition-all duration-300 border"
                      style={{
                        backgroundColor: `${currentPlatformObj.color}15`,
                        borderColor: `${currentPlatformObj.color}35`,
                        color: currentPlatformObj.color,
                        boxShadow: `0 0 15px ${currentPlatformObj.color}25`
                      }}
                    >
                      {isAddOpen ? <Plus size={20} /> : <Briefcase size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg md:text-xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
                          {isAddOpen ? `New ${currentPlatformObj.name} Project` : 'Edit Project Pipeline'}
                        </h2>
                        <span
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase"
                          style={{
                            backgroundColor: `${currentPlatformObj.color}15`,
                            color: currentPlatformObj.color,
                            border: `1px solid ${currentPlatformObj.color}30`
                          }}
                        >
                          {formData.platform || 'Freelancer'}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-0.5">
                        Configure project deliverables, client details, tech stack & AI sprint breakdown.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canDelete && selectedProject && !isAddOpen && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(selectedProject._id, e)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => { setIsAddOpen(false); setSelectedProject(null); }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 dark:hover:text-rose-400 border border-black/5 dark:border-white/5 hover:border-rose-500/30 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Modal Body Form */}
                <form id="project-edit-form" onSubmit={handleSaveProject} className="p-5 md:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">

                  {/* Channel / Platform Selector Buttons */}
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Platform Channel / Ecosystem
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PLATFORM_CHANNELS.map((plat) => {
                        const PIcon = plat.icon;
                        const isSelected = (formData.platform || 'Freelancer').toLowerCase() === plat.id.toLowerCase();
                        return (
                          <button
                            key={plat.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, platform: plat.id })}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-white dark:bg-white/10 border-purple-500/40 shadow-sm'
                                : 'bg-slate-50 dark:bg-[#060608] text-secondary hover:text-slate-900 dark:hover:text-white border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/15'
                            }`}
                            style={{
                              borderColor: isSelected ? plat.color : undefined,
                              boxShadow: isSelected ? `0 0 12px ${plat.color}30` : undefined,
                              color: isSelected ? (plat.color) : undefined
                            }}
                          >
                            <PIcon size={13} style={{ color: plat.color }} />
                            <span className="truncate">{plat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project Title */}
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Project Title <span className="text-rose-500 dark:text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Next.js ERP Platform & Payment Gateway Integration..."
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Client / Company Searchable Selection */}
                  <div className="relative" ref={clientSearchRef}>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Client / Company
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                      <input
                        type="text"
                        value={showClientDropdown ? clientSearch : (formData.clientName || clientSearch)}
                        onChange={e => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                          setFormData({ ...formData, clientName: e.target.value });
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Search existing client or type new client name..."
                        className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                      />
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none opacity-60" />

                      {/* Dropdown Menu */}
                      {showClientDropdown && (
                        <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-[#0e0e13] border border-black/10 dark:border-white/15 rounded-xl shadow-2xl overflow-hidden z-30 max-h-52 overflow-y-auto custom-scrollbar">
                          {filteredClientsList.length > 0 ? (
                            filteredClientsList.map(c => (
                              <button
                                key={c._id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, clientName: c.name });
                                  setClientSearch(c.name);
                                  setShowClientDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between border-b border-black/5 dark:border-white/5 last:border-0 transition-colors group"
                              >
                                <div>
                                  <div className="font-heading font-bold text-slate-900 dark:text-white text-xs group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">{c.name}</div>
                                  {c.company && <div className="text-[10px] text-secondary">{c.company}</div>}
                                </div>
                                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-secondary">{c.platform || 'Direct'}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center">
                              <p className="text-xs text-secondary mb-2">No client found matching "{clientSearch}"</p>
                              {clientSearch.trim() && (
                                <button
                                  type="button"
                                  onClick={handleCreateClientOnTheFly}
                                  disabled={isCreatingClient}
                                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#6324FC] hover:bg-[#521bd6] text-white font-heading font-bold rounded-lg text-xs transition-all shadow-md"
                                >
                                  <Plus size={13} /> {isCreatingClient ? 'Creating...' : `Create "${clientSearch}"`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Priority Interactive Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">

                    {/* Status Pills */}
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Operational Status
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {STATUS_OPTIONS.map((st) => {
                          const SIcon = st.icon;
                          const isSelected = (formData.status || 'Planning') === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, status: st.id })}
                              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-heading font-bold transition-all border ${
                                isSelected
                                  ? `${st.bg} ${st.border} text-slate-900 dark:text-white shadow-sm`
                                  : 'bg-slate-50 dark:bg-[#060608] text-secondary hover:text-slate-900 dark:hover:text-white border-black/10 dark:border-white/5'
                              }`}
                              style={{
                                color: isSelected ? st.color : undefined,
                                borderColor: isSelected ? st.color : undefined
                              }}
                            >
                              <SIcon size={12} />
                              <span className="truncate">{st.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority Pills */}
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Execution Priority
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PRIORITY_OPTIONS.map((pr) => {
                          const isSelected = (formData.priority || 'Medium') === pr.id;
                          return (
                            <button
                              key={pr.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, priority: pr.id })}
                              className={`flex items-center justify-center py-2 rounded-xl text-[11px] font-heading font-bold transition-all border ${
                                isSelected
                                  ? `${pr.bg} ${pr.border} text-slate-900 dark:text-white shadow-sm`
                                  : 'bg-slate-50 dark:bg-[#060608] text-secondary hover:text-slate-900 dark:hover:text-white border-black/10 dark:border-white/5'
                              }`}
                              style={{
                                color: isSelected ? pr.color : undefined,
                                borderColor: isSelected ? pr.color : undefined
                              }}
                            >
                              <span>{pr.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Financial & Dates Grid (Budget, Start Date, Deadline) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Budget (USD)
                      </label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.budget || ''}
                          onChange={e => setFormData({ ...formData, budget: e.target.value })}
                          placeholder="2500"
                          className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-secondary outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Start Date
                      </label>
                      <DatePicker
                        value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                        onChange={val => setFormData({ ...formData, startDate: val })}
                        placeholder="Select start date"
                        icon="calendar"
                        color={currentPlatformObj.color}
                        align="left"
                        direction="auto"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                        Target Deadline
                      </label>
                      <DatePicker
                        value={formData.deadline ? formData.deadline.split('T')[0] : ''}
                        onChange={val => setFormData({ ...formData, deadline: val })}
                        placeholder="Select deadline"
                        icon="clock"
                        color={currentPlatformObj.color}
                        align="right"
                        direction="auto"
                      />
                    </div>
                  </div>

                  {/* Progress Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                        Project Progress Completion
                      </label>
                      <span className="text-xs font-mono font-bold text-[#6324FC] dark:text-[#00E5FF]">{formData.progress || 0}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress || 0}
                        onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                        className="w-full h-2 bg-slate-200 dark:bg-[#060608] rounded-lg appearance-none cursor-pointer accent-[#6324FC]"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress || 0}
                        onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                        className="w-16 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-center text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Interactive Tech Stack Tag Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={13} className="text-[#6324FC] dark:text-[#00E5FF]" /> Tech Stack & Deliverable Tags
                      </label>
                      <span className="text-[9px] font-mono text-secondary">Click tags or type custom</span>
                    </div>

                    {/* Quick Suggestions Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {POPULAR_TECH_STACK.map(tech => {
                        const currentStack: string[] = Array.isArray(formData.techStack)
                          ? formData.techStack
                          : (formData.techStack || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                        const isSelected = currentStack.includes(tech);
                        return (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => toggleTechStackTag(tech)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#6324FC]/10 text-[#6324FC] dark:bg-[#6324FC]/20 dark:text-[#00E5FF] border-[#6324FC]/40 dark:border-[#6324FC]/50 shadow-sm'
                                : 'bg-slate-50 dark:bg-[#060608] text-secondary hover:text-slate-900 dark:hover:text-white border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/15'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{tech}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Tech Stack Input */}
                    <input
                      type="text"
                      value={customTechInput}
                      onChange={e => setCustomTechInput(e.target.value)}
                      onKeyDown={handleCustomTechAdd}
                      placeholder="Type custom tech and press Enter (e.g. TailwindCSS, GraphQL, Redis)..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                    />

                    {/* Selected Tech Stack Badges */}
                    {Array.isArray(formData.techStack) && formData.techStack.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {formData.techStack.map((t: string) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 border border-black/10 dark:border-white/15 text-[10px] font-mono text-slate-900 dark:text-white"
                          >
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() => toggleTechStackTag(t)}
                              className="text-secondary hover:text-rose-500 dark:hover:text-rose-400 ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team Assignees Quick Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={13} className="text-purple-600 dark:text-[#A78BFA]" /> Team Assignees & Roles
                      </label>
                      <span className="text-[9px] font-mono text-secondary">Assign team members</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {TEAM_SUGGESTIONS.map(name => {
                        const currentAssignees: string[] = Array.isArray(formData.assignees)
                          ? formData.assignees
                          : (formData.assignees || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                        const isSelected = currentAssignees.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleAssignee(name)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold transition-all border flex items-center gap-1 ${
                              isSelected
                                ? 'bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/40 dark:border-purple-500/50 shadow-sm'
                                : 'bg-slate-50 dark:bg-[#060608] text-secondary hover:text-slate-900 dark:hover:text-white border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/15'
                            }`}
                          >
                            <span className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 flex items-center justify-center text-[8px]">{getInitials(name)}</span>
                            <span>{name}</span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={Array.isArray(formData.assignees) ? formData.assignees.join(', ') : (formData.assignees || '')}
                      onChange={e => setFormData({ ...formData, assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Comma separated names or roles..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors"
                    />
                  </div>

                  {/* Scope & Deliverable Notes */}
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1.5">
                      Scope & Deliverable Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Overview of requirements, milestones, client specifications or contract terms..."
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-secondary outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* AI Sprint Task Breakdown Generator Engine */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#6324FC]/10 via-purple-500/5 to-transparent dark:from-[#6324FC]/15 dark:via-purple-900/10 dark:to-transparent border border-purple-500/20 dark:border-[#6324FC]/30 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 dark:bg-[#6324FC]/25 border border-purple-500/30 dark:border-[#6324FC]/40 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center shadow-sm">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white">Gemini AI Sprint Breakdown</h4>
                          <p className="text-[10px] text-secondary">Auto-generate actionable sprint tasks, hour estimates & priorities</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateAiTasks}
                        disabled={isGeneratingAiTasks || !formData.title?.trim()}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 text-white font-heading font-bold text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,36,252,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isGeneratingAiTasks ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                        <span>{aiTasks.length > 0 ? 'Regenerate Tasks' : 'Generate Sprint Tasks'}</span>
                      </button>
                    </div>

                    {aiTasks.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-secondary uppercase tracking-wider font-bold">
                            {aiTasks.length} Actionable Subtasks
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const taskText = aiTasks.map((t, idx) => `${idx + 1}. [${t.priority || 'Medium'}] ${t.title} (${t.estimatedHours || 2}h)`).join('\n');
                                const prevDesc = formData.description ? `${formData.description}\n\n` : '';
                                setFormData({ ...formData, description: `${prevDesc}Sprint Tasks:\n${taskText}` });
                                toast.success('Tasks added to project notes!');
                              }}
                              className="text-[10px] font-heading font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              + Apply to Notes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const taskText = aiTasks.map((t, idx) => `${idx + 1}. [${t.priority || 'Medium'}] ${t.title} (${t.estimatedHours || 2}h)`).join('\n');
                                navigator.clipboard.writeText(taskText);
                                toast.success('Sprint tasks copied to clipboard!');
                              }}
                              className="text-[10px] font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline flex items-center gap-1"
                            >
                              <Copy size={11} /> Copy All
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                          {aiTasks.map((task, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 flex items-center justify-between text-xs transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <CheckSquare size={13} className="text-[#6324FC] dark:text-[#00E5FF] shrink-0" />
                                <span className="text-slate-900 dark:text-white font-medium truncate text-xs">{task.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  task.priority === 'High' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                                  task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                                  'bg-slate-100 dark:bg-white/5 text-secondary border-black/10 dark:border-white/10'
                                }`}>
                                  {task.priority || 'Medium'}
                                </span>
                                {task.estimatedHours && (
                                  <span className="text-[10px] font-mono text-secondary bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{task.estimatedHours}h</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </form>

                {/* Modal Footer */}
                <div className="p-4 md:px-6 md:py-4 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsAddOpen(false); setSelectedProject(null); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="project-edit-form"
                    disabled={isSubmitting || !formData.title?.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6324FC] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-xs font-heading font-bold text-white transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving Project...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>{isAddOpen ? 'Create Project' : 'Save Changes'}</span>
                      </>
                    )}
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
